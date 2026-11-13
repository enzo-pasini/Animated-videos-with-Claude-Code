"""Measure the visual style of each reference video.

Usage: python -I tools/visual_analysis.py <references_dir> [--workers 4]

For every <references>/videos/<id>.mp4 writes
    <references>/analysis/visual/<id>.json   per-frame summary, shots, palettes
    <references>/analysis/contact_sheets/<id>.jpg

Metrics (all measured, never guessed):
- scene changes: Bhattacharyya distance between HSV histograms. A change is a
  peak of the distance between frame j and frame j-LAG (robust to camera motion,
  catches dissolves). Its length = consecutive frames where the frame-to-frame
  distance stays high: <= HARD_MAX_FRAMES frames -> "hard cut", longer -> "dissolve".
- camera motion: Lucas-Kanade feature tracking + RANSAC similarity transform
  per frame -> pan (x/y), zoom (scale), roll, plus jitter (shake).
  "subject motion" = residual motion of tracked points not explained by the camera.
- tone: luma mean / std / p5 / p95 (BT.709, 0-255), HSV saturation (0-1),
  Hasler-Susstrunk colorfulness.
- palette: k-means in Lab on 3 frames per shot (k=5) and per video (k=8).
"""
import argparse
import json
import math
import re
import subprocess
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import cv2
import numpy as np

SMALL_W, SMALL_H = 180, 320          # analysis resolution (9:16)
LAG = 8                              # frames compared across a transition
CHANGE_MIN = 0.30                    # Bhattacharyya distance (frame j vs j-LAG) for a scene change
CHANGE_RATIO = 2.0                   # ...and at least this x the local median
HARD_MAX_FRAMES = 2                  # transitions this short count as hard cuts
MIN_SHOT_S = 0.4
THUMB_W, THUMB_H = 225, 400
SHEET_COLS, SHEET_ROWS = 4, 4


def hexcolor(bgr):
    b, g, r = (int(round(c)) for c in bgr)
    return f"#{r:02x}{g:02x}{b:02x}"


def tone(frame):
    f = frame.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    rg, yb = r - g, 0.5 * (r + g) - b
    colorful = math.hypot(rg.std(), yb.std()) + 0.3 * math.hypot(rg.mean(), yb.mean())
    p5, p95 = np.percentile(y, [5, 95])
    return {"luma": float(y.mean()), "contrast": float(y.std()), "p5": float(p5), "p95": float(p95),
            "sat": float(hsv[..., 1].mean() / 255), "colorful": float(colorful)}


def camera_motion(prev_gray, gray):
    """Return (dx, dy, log_scale, roll, subject) in fractions of frame width, or None."""
    pts = cv2.goodFeaturesToTrack(prev_gray, maxCorners=250, qualityLevel=0.01, minDistance=5)
    if pts is None or len(pts) < 12:
        return None
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev_gray, gray, pts, None, winSize=(15, 15), maxLevel=3)
    ok = st.ravel() == 1
    p0, p1 = pts[ok].reshape(-1, 2), nxt[ok].reshape(-1, 2)
    if len(p0) < 12:
        return None
    m, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=1.0)
    if m is None:
        return None
    cx, cy = SMALL_W / 2, SMALL_H / 2
    c = m @ np.array([cx, cy, 1.0])
    scale = math.hypot(m[0, 0], m[1, 0])
    pred = p0 @ m[:, :2].T + m[:, 2]
    subject = float(np.median(np.linalg.norm(p1 - pred, axis=1)))
    return ((c[0] - cx) / SMALL_W, (c[1] - cy) / SMALL_W, math.log(scale),
            math.atan2(m[1, 0], m[0, 0]), subject / SMALL_W)


def kmeans_palette(pixels_bgr, k):
    lab = cv2.cvtColor(pixels_bgr.reshape(-1, 1, 3), cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    k = min(k, len(lab))
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, centers = cv2.kmeans(lab, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.ravel(), minlength=k)
    bgr = cv2.cvtColor(centers.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_LAB2BGR).reshape(-1, 3)
    order = np.argsort(-counts)
    return [{"hex": hexcolor(bgr[i]), "share": round(float(counts[i] / counts.sum()), 3),
             "lab": [round(float(v), 1) for v in centers[i]]} for i in order]


def loudness(path):
    try:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn",
                            "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True, errors="replace", timeout=300)
        tail = r.stderr[r.stderr.rfind("Summary:"):]
        i = re.search(r"I:\s+(-?[\d.]+) LUFS", tail)
        lra = re.search(r"LRA:\s+([\d.]+) LU", tail)
        peak = re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail)
        return {"integrated_lufs": float(i.group(1)) if i else None,
                "lra_lu": float(lra.group(1)) if lra else None,
                "true_peak_dbfs": float(peak.group(1)) if peak else None}
    except Exception as e:  # noqa: BLE001 - loudness is optional
        return {"error": str(e)}


def classify_shot(cam, dur):
    """Label a shot's camera move from the per-frame transforms inside it."""
    if len(cam) < 3:
        return {"move": "too-short"}
    a = np.array(cam)
    dx, dy, ls = a[:, 0].sum(), a[:, 1].sum(), a[:, 2].sum()
    # jitter = frame-to-frame translation that a 5-frame moving average does not explain
    k = np.ones(5) / 5
    jit = 0.0
    if len(a) >= 7:
        for col in (0, 1):
            sm = np.convolve(a[:, col], k, mode="same")
            jit += float(np.std((a[:, col] - sm)[2:-2]))
    pan_rate = math.hypot(dx, dy) / dur            # frame widths per second
    zoom_rate = ls / dur                           # log-scale per second
    labels = []
    if abs(zoom_rate) > 0.03:
        labels.append("push-in" if zoom_rate > 0 else "pull-out")
    if pan_rate > 0.05:
        labels.append("pan-" + ("horizontal" if abs(dx) >= abs(dy) else "vertical"))
    if jit > 0.004:
        labels.append("shake")
    return {"move": "+".join(labels) or "static", "pan_rate_w_per_s": round(pan_rate, 4),
            "pan_dx_w": round(float(dx), 4), "pan_dy_w": round(float(dy), 4),
            "zoom_pct_per_s": round((math.exp(zoom_rate) - 1) * 100, 2),
            "zoom_total_pct": round((math.exp(ls) - 1) * 100, 2),
            "roll_deg": round(math.degrees(float(a[:, 3].sum())), 2),
            "jitter_w": round(jit, 5),
            "subject_motion_w_per_s": round(float(np.nanmean(a[:, 4])) * len(a) / dur, 4)}


def analyze(path, out_dir):
    path = Path(path)
    vid = path.stem
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n_total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width, height = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    step = 2 if fps > 40 else 1
    eff_fps = fps / step

    idx_list, hists, pix, tones, cams = [], [], [], [], []
    prev_gray = None
    i = 0
    while True:
        if not cap.grab():
            break
        if i % step == 0:
            _, frame = cap.retrieve()
            small = cv2.resize(frame, (SMALL_W, SMALL_H), interpolation=cv2.INTER_AREA)
            hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
            h = cv2.calcHist([hsv], [0, 1, 2], None, [16, 8, 8], [0, 180, 0, 256, 0, 256])
            cv2.normalize(h, h)
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            pix.append(float(np.abs(gray.astype(np.int16) - prev_gray).mean()) if prev_gray is not None else 0.0)
            cams.append(camera_motion(prev_gray, gray) if prev_gray is not None else None)
            idx_list.append(i)
            hists.append(h)
            tones.append(tone(small))
            prev_gray = gray
        i += 1
    cap.release()
    n = len(idx_list)
    duration = (idx_list[-1] + step) / fps if n else 0

    # --- scene changes (hard cuts and dissolves)
    lag = max(2, LAG // step)
    bh = lambda a, b: cv2.compareHist(hists[a], hists[b], cv2.HISTCMP_BHATTACHARYYA)
    d1 = np.array([0.0] + [bh(j - 1, j) for j in range(1, n)])
    dk = np.array([bh(max(0, j - lag), j) for j in range(n)])
    win = max(lag, int(eff_fps * 1.5))
    base1 = np.median(d1[1:]) if n > 1 else 0
    transitions = []
    for j in range(lag, n):
        lo, hi = max(0, j - lag), min(n, j + lag + 1)
        if dk[j] < CHANGE_MIN or dk[j] < dk[lo:hi].max():
            continue
        if dk[j] < CHANGE_RATIO * max(np.median(dk[max(0, j - win): j + win + 1]), 0.02):
            continue
        c = j - lag + 1 + int(np.argmax(d1[j - lag + 1: j + 1]))    # sharpest frame inside the window
        thr = max(0.5 * d1[c], 1.5 * base1)
        a = c
        while a - 1 > 0 and d1[a - 1] >= thr:
            a -= 1
        b = c
        while b + 1 < n and d1[b + 1] >= thr:
            b += 1
        frames = (b - a + 1) * step
        if transitions and (c - transitions[-1]["j"]) / eff_fps < MIN_SHOT_S:
            continue
        transitions.append({"j": c, "t": round(idx_list[c] / fps, 3), "frames": frames,
                            "dur_s": round(frames / fps, 3), "strength": round(float(dk[j]), 3),
                            "kind": "hard-cut" if frames <= HARD_MAX_FRAMES else "dissolve"})
    cuts = [tr["j"] for tr in transitions]
    s = dk

    bounds = [0] + cuts + [n]
    in_transition = np.zeros(n, bool)
    for tr in transitions:
        half_len = tr["frames"] // step // 2 + 1
        in_transition[max(0, tr["j"] - half_len): tr["j"] + half_len + 1] = True
    shots = []
    for si, (a, b) in enumerate(zip(bounds[:-1], bounds[1:])):
        t0, t1 = idx_list[a] / fps, (idx_list[b - 1] + step) / fps
        dur = t1 - t0
        cam = [cams[j] for j in range(a + 1, b) if cams[j] is not None and not in_transition[j]]
        tn = tones[a:b]
        shot = {"start": round(t0, 3), "end": round(t1, 3), "dur": round(dur, 3),
                "enter": transitions[si - 1]["kind"] if si else None,
                "pixel_change": round(float(np.mean(pix[a + 1:b])) if b > a + 1 else 0.0, 2),
                **{k: round(float(np.mean([t[k] for t in tn])), 3) for k in tn[0]},
                **classify_shot(cam, dur)}
        shots.append(shot)

    # --- second pass: palette frames (25/50/75% of each shot) + contact-sheet frames
    want = {}
    for si, (a, b) in enumerate(zip(bounds[:-1], bounds[1:])):
        for q in (0.25, 0.5, 0.75):
            want.setdefault(idx_list[min(b - 1, a + int((b - a) * q))], []).append(("pal", si))
    sheet_n = SHEET_COLS * SHEET_ROWS
    for k in range(sheet_n):
        fi = min(n_total - 1, int((k + 0.5) / sheet_n * idx_list[-1]))
        want.setdefault(fi, []).append(("sheet", k))
    pal_px = {si: [] for si in range(len(shots))}
    thumbs = {}
    cap = cv2.VideoCapture(str(path))
    i, last = 0, max(want)
    while i <= last and cap.grab():
        if i in want:
            _, frame = cap.retrieve()
            for kind, key in want[i]:
                if kind == "pal":
                    pal_px[key].append(cv2.resize(frame, (90, 160), interpolation=cv2.INTER_AREA).reshape(-1, 3))
                else:
                    thumbs[key] = (i / fps, cv2.resize(frame, (THUMB_W, THUMB_H), interpolation=cv2.INTER_AREA))
        i += 1
    cap.release()

    rng = np.random.default_rng(0)
    pooled = []
    for si, shot in enumerate(shots):
        px = np.concatenate(pal_px[si]) if pal_px[si] else np.zeros((1, 3), np.uint8)
        shot["palette"] = kmeans_palette(px, 5)
        pooled.append(px[rng.choice(len(px), min(len(px), 3000), replace=False)])
    video_palette = kmeans_palette(np.concatenate(pooled), 8)

    # --- contact sheet: 4x4 thumbnails + one palette column per shot (width ~ duration)
    sheet = np.full((SHEET_ROWS * THUMB_H + 140, SHEET_COLS * THUMB_W, 3), 20, np.uint8)
    for k, (t, th) in thumbs.items():
        r, c = divmod(k, SHEET_COLS)
        y0, x0 = r * THUMB_H, c * THUMB_W
        sheet[y0:y0 + THUMB_H, x0:x0 + THUMB_W] = th
        shot_no = next(si for si, sh in enumerate(shots) if sh["start"] <= t < sh["end"] + 1e-6) if shots else 0
        label = f"{t:5.1f}s  shot {shot_no + 1}"
        cv2.rectangle(sheet, (x0, y0), (x0 + 150, y0 + 22), (0, 0, 0), -1)
        cv2.putText(sheet, label, (x0 + 4, y0 + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    y0, total_w = SHEET_ROWS * THUMB_H + 10, sheet.shape[1]
    x = 0.0
    for shot in shots:
        w = shot["dur"] / duration * total_w
        yy = y0
        for col in shot["palette"]:
            h = col["share"] * 100
            rgb = tuple(int(col["hex"][j:j + 2], 16) for j in (1, 3, 5))
            cv2.rectangle(sheet, (int(x), int(yy)), (int(x + w) - 1, int(yy + h)), rgb[::-1], -1)
            yy += h
        x += w
    cv2.putText(sheet, f"{vid}  {len(shots)} shots / {duration:.1f}s  (palette strip: 1 column per shot)",
                (6, sheet.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (230, 230, 230), 1, cv2.LINE_AA)
    sheets = out_dir / "contact_sheets"
    sheets.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(sheets / f"{vid}.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 82])

    durs = np.array([sh["dur"] for sh in shots])
    tv = {k: [t[k] for t in tones] for k in tones[0]}
    moves = [sh["move"] for sh in shots]
    result = {
        "id": vid, "width": width, "height": height, "fps": round(fps, 3), "duration": round(duration, 3),
        "n_shots": len(shots), "cuts_per_min": round(len(cuts) / duration * 60, 1),
        "transitions": {"hard_cut": sum(t["kind"] == "hard-cut" for t in transitions),
                        "dissolve": sum(t["kind"] == "dissolve" for t in transitions),
                        "dissolve_frames_median": float(np.median([t["frames"] for t in transitions
                                                                    if t["kind"] == "dissolve"] or [0])),
                        "list": [{k: v for k, v in t.items() if k != "j"} for t in transitions]},
        "shot_len": {"mean": round(float(durs.mean()), 3), "median": round(float(np.median(durs)), 3),
                     "min": round(float(durs.min()), 3), "max": round(float(durs.max()), 3)},
        "first_cut_s": shots[1]["start"] if len(shots) > 1 else None,
        "cuts_first_3s": sum(1 for sh in shots[1:] if sh["start"] < 3),
        "tone": {k: {"mean": round(float(np.mean(v)), 3), "std": round(float(np.std(v)), 3)} for k, v in tv.items()},
        "camera_moves": {m: moves.count(m) for m in sorted(set(moves))},
        "video_palette": video_palette,
        "audio": loudness(path),
        "shots": shots,
    }
    vis = out_dir / "visual"
    vis.mkdir(parents=True, exist_ok=True)
    (vis / f"{vid}.json").write_text(json.dumps(result, indent=1), encoding="utf-8")
    return f"{vid}: {len(shots)} shots, {duration:.1f}s"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("references")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    ref = Path(args.references)
    videos = sorted((ref / "videos").glob("*.mp4"))
    if args.only:
        videos = [v for v in videos if v.stem in args.only]
    out_dir = ref / "analysis"
    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        for msg in ex.map(analyze, videos, [out_dir] * len(videos)):
            print(msg, flush=True)


if __name__ == "__main__":
    main()
