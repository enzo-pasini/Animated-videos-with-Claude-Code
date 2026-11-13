"""Measure the drawing style of every reference video (captions, blur, line art, warm/cool light).

Usage: python -I tools/style_probe.py <references_dir> [--workers 4] [--only ID ...]

Needs  <references>/analysis/visual/<id>.json (shots, from visual_analysis.py)
Writes <references>/analysis/style/<id>.json and prints one line per video.

Frames used: the middle frame of every shot (light, blur, line art) and one frame
every CAPTION_STEP_S seconds (captions). All pixel values refer to 1080x1920.

- captions: white glyphs (all channels > WHITE) with a dark ring around them, in the
  lower-middle band. Outline thickness is measured per side: march outward from the
  glyph edge until fewer than half of the samples are dark. Longer below/right than
  above/left = a drop shadow.
- blur: per 120 px tile, edge acutance = p99(Sobel magnitude) / (p95 - p5 luma).
  A Gaussian-blurred step of width sigma gives acutance ~ 3.19 / sigma, so
  sigma_px ~ 3.19 / acutance (only meaningful above ~0.8 px).
  sharp tiles = p90 of the frame, soft tiles = p25.
- line art: black-hat (15 px) > 40 and luma < 80 -> thin dark strokes; long straight
  dark segments (HoughP, >= 120 px) mostly come from outlined architecture/props.
- light: share of saturated (S > 0.25) pixels with warm hues (red-orange-yellow)
  versus cool hues (cyan-blue-violet). warm if warm >= 1.5 x cool, cool if the reverse.
"""
import argparse
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import cv2
import numpy as np

CAPTION_STEP_S = 0.5
BAND = (0.50, 0.90)          # caption search band, fraction of height
WHITE, DARK = 215, 70
TILE = 120
EXCLUDE = (0.60, 0.80)       # caption rows excluded from blur / line / light stats
SIGMA_K = 3.19


def find_caption(frame):
    h, w = frame.shape[:2]
    y0, y1 = int(BAND[0] * h), int(BAND[1] * h)
    band = frame[y0:y1]
    white = (band.min(axis=2) > WHITE).astype(np.uint8)
    dark = band.max(axis=2) < DARK
    n, lab, stats, _ = cv2.connectedComponentsWithStats(white, connectivity=8)
    glyphs = []
    for i in range(1, n):
        x, y, gw, gh, area = stats[i]
        if area < 40 or not (12 <= gh <= 170) or gw > 420:
            continue
        pad = 4
        xa, ya = max(0, x - pad), max(0, y - pad)
        xb, yb = min(band.shape[1], x + gw + pad), min(band.shape[0], y + gh + pad)
        m = (lab[ya:yb, xa:xb] == i).astype(np.uint8)
        ring = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=3).astype(bool) & ~m.astype(bool)
        if ring.sum() and dark[ya:yb, xa:xb][ring].mean() >= 0.55:
            glyphs.append((x, y, gw, gh, i))
    if len(glyphs) < 2:
        return None
    # keep the glyphs that sit on the most common text line
    cy = np.array([g[1] + g[3] / 2 for g in glyphs])
    med_h = np.median([g[3] for g in glyphs])
    best = max(range(len(glyphs)), key=lambda k: np.sum(np.abs(cy - cy[k]) < 0.6 * med_h))
    line = [g for g, c in zip(glyphs, cy) if abs(c - cy[best]) < 0.6 * med_h]
    if len(line) < 2:
        return None
    line.sort()
    hs = np.array([g[3] for g in line])
    x_h = float(np.percentile(hs, 30))
    gaps = [b[0] - (a[0] + a[2]) for a, b in zip(line, line[1:])]
    words = 1 + sum(g > 0.45 * x_h for g in gaps)
    bx0, by0 = min(g[0] for g in line), min(g[1] for g in line)
    bx1, by1 = max(g[0] + g[2] for g in line), max(g[1] + g[3] for g in line)

    # outline / shadow thickness per side, on the union mask of the line's glyphs
    ids = [g[4] for g in line]
    m = np.isin(lab, ids)
    luma = cv2.cvtColor(band, cv2.COLOR_BGR2GRAY).astype(np.float32)
    sides = {}
    for name, (dy, dx) in {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}.items():
        shifted = np.roll(m, (-dy, -dx), axis=(0, 1))
        edge = m & ~shifted                       # glyph pixels whose neighbour on this side is outside
        ys, xs = np.nonzero(edge)
        fracs, profile = [], []
        for k in range(1, 31):
            yy, xx = ys + dy * k, xs + dx * k
            ok = (yy >= 0) & (yy < band.shape[0]) & (xx >= 0) & (xx < band.shape[1])
            yy, xx = yy[ok], xx[ok]
            outside = ~m[yy, xx]
            if not outside.any():
                break
            fracs.append(float(dark[yy, xx][outside].mean()))
            profile.append(float(luma[yy, xx][outside].mean()))
        # solid dark part: may start after 1-2 anti-aliased pixels, ends at the first non-dark step
        start = next((k for k in range(min(3, len(fracs))) if fracs[k] >= 0.5), None)
        thick = 0
        if start is not None:
            thick = start
            while thick < len(fracs) and fracs[thick] >= 0.5:
                thick += 1
        # soft shadow: distance until luma is back to 90 % of the far plateau
        soft = None
        if len(profile) >= 25:
            plateau = float(np.median(profile[20:25]))
            soft = next((k + 1 for k in range(thick, len(profile)) if profile[k] >= 0.9 * plateau), None)
        sides[name] = {"px": thick, "soft_px": soft, "luma_profile": [round(v, 1) for v in profile[:30]]}
    return {"x_height_px": round(x_h, 1), "ascender_px": round(float(np.percentile(hs, 90)), 1),
            "box_h_px": int(by1 - by0), "box_w_px": int(bx1 - bx0),
            "cx": round((bx0 + bx1) / 2 / w, 4), "cy": round((y0 + (by0 + by1) / 2) / h, 4),
            "top": round((y0 + by0) / h, 4), "words": int(words), "glyphs": len(line),
            "outline": {k: v["px"] for k, v in sides.items()},
            "soft": {k: v["soft_px"] for k, v in sides.items()},
            "profile_up": sides["up"]["luma_profile"], "profile_down": sides["down"]["luma_profile"]}


def keep_rows(h):
    rows = np.ones(h, bool)
    rows[int(EXCLUDE[0] * h):int(EXCLUDE[1] * h)] = False
    return rows


def blur_stats(gray):
    g = gray.astype(np.float32)
    mag = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))
    h, w = g.shape
    rows = keep_rows(h)
    acut = []
    for y in range(0, h - TILE + 1, TILE):
        if not rows[y:y + TILE].all():
            continue
        for x in range(0, w - TILE + 1, TILE):
            t = g[y:y + TILE, x:x + TILE]
            lo, hi = np.percentile(t, [5, 95])
            if hi - lo < 30:
                continue
            acut.append(float(np.percentile(mag[y:y + TILE, x:x + TILE], 99) / (hi - lo)))
    if len(acut) < 6:
        return None
    sharp, soft = np.percentile(acut, 90), np.percentile(acut, 25)
    return {"acut_sharp": round(float(sharp), 3), "acut_soft": round(float(soft), 3),
            "ratio": round(float(sharp / soft), 2),
            "sigma_sharp_px": round(SIGMA_K / sharp, 2), "sigma_soft_px": round(SIGMA_K / soft, 2),
            "tiles": len(acut)}


def line_stats(gray):
    h, w = gray.shape
    rows = keep_rows(h)
    bh = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    mask = ((bh > 40) & (gray < 80)).astype(np.uint8)
    mask[~rows] = 0
    dens = float(mask[rows].mean())
    dist = cv2.distanceTransform(mask, cv2.DIST_L2, 3)
    peaks = (dist > 0) & (dist >= cv2.dilate(dist, np.ones((3, 3), np.uint8)))
    width = float(np.median(2 * dist[peaks])) if peaks.any() else 0.0
    segs = cv2.HoughLinesP(mask * 255, 1, np.pi / 180, threshold=80, minLineLength=120, maxLineGap=4)
    # outlined architecture: thick (>= 3 px) straight strokes that are not near-vertical
    # (character legs are thick, straight and mostly vertical, so they are left out)
    thick = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    tsegs = cv2.HoughLinesP(thick * 255, 1, np.pi / 180, threshold=60, minLineLength=100, maxLineGap=3)
    world = 0
    if tsegs is not None:
        for x1, y1, x2, y2 in tsegs.reshape(-1, 4):
            if abs(np.degrees(np.arctan2(abs(x2 - x1), abs(y2 - y1)))) > 20:
                world += 1
    return {"line_density": round(dens, 4), "stroke_px": round(width, 2),
            "long_straight": 0 if segs is None else int(len(segs)), "thick_straight_nonvertical": world}


def light_stats(frame):
    h = frame.shape[0]
    f = frame[keep_rows(h)]
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    hue, sat = hsv[..., 0], hsv[..., 1] / 255.0
    colored = sat > 0.25
    warm = colored & ((hue <= 25) | (hue >= 165))        # red, orange, yellow (OpenCV hue 0-180)
    cool = colored & (hue >= 85) & (hue <= 150)           # cyan, blue, violet
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    ws, cs = float(warm.mean()), float(cool.mean())
    kind = "warm" if ws >= 1.5 * cs and ws > 0.10 else "cool" if cs >= 1.5 * ws and cs > 0.10 else "mixed"
    return {"warm_share": round(ws, 3), "cool_share": round(cs, 3), "kind": kind,
            "lab_L": round(float(lab[:, 0].mean() * 100 / 255), 1),
            "lab_a": round(float(lab[:, 1].mean() - 128), 1), "lab_b": round(float(lab[:, 2].mean() - 128), 1)}


def analyze(args):
    video, vis_path, out_path = args
    vis = json.loads(Path(vis_path).read_text())
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    mids = {min(n - 1, int((s["start"] + s["end"]) / 2 * fps)): si for si, s in enumerate(vis["shots"])}
    caps = set(range(0, n, max(1, int(round(CAPTION_STEP_S * fps)))))
    shots, captions = {}, []
    i, last = 0, max(max(mids), max(caps))
    while i <= last and cap.grab():
        if i in mids or i in caps:
            _, frame = cap.retrieve()
            if i in caps:
                c = find_caption(frame)
                captions.append({"t": round(i / fps, 2), **(c or {"none": True})})
            if i in mids:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                shots[mids[i]] = {"t": round(i / fps, 2), "dur": vis["shots"][mids[i]]["dur"],
                                  "blur": blur_stats(gray), "lines": line_stats(gray), "light": light_stats(frame)}
        i += 1
    cap.release()
    shot_list = [shots[k] for k in sorted(shots)]

    found = [c for c in captions if "none" not in c]
    kinds = [s["light"]["kind"] for s in shot_list]
    seq = [k for k in kinds if k != "mixed"]
    switches = sum(a != b for a, b in zip(seq, seq[1:]))
    dur = sum(s["dur"] for s in shot_list)
    med = lambda vals: round(float(np.median(vals)), 3) if len(vals) else None
    blur = [s["blur"] for s in shot_list if s["blur"]]
    result = {
        "id": video.stem,
        "captions": {
            "coverage": round(len(found) / max(1, len(captions)), 3),
            "x_height_px": med([c["x_height_px"] for c in found]),
            "ascender_px": med([c["ascender_px"] for c in found]),
            "box_h_px": med([c["box_h_px"] for c in found]),
            "box_w_px": med([c["box_w_px"] for c in found]),
            "cy": med([c["cy"] for c in found]), "cx": med([c["cx"] for c in found]),
            "words_hist": {str(k): sum(c["words"] == k for c in found) for k in range(1, 6)},
            "outline_px": {s: med([c["outline"][s] for c in found]) for s in ("up", "down", "left", "right")},
            "soft_shadow_px": {s: med([c["soft"][s] for c in found if c["soft"][s]]) for s in ("up", "down", "left", "right")},
            "profile_up": np.median([c["profile_up"][:20] for c in found if len(c["profile_up"]) >= 20], axis=0).round(1).tolist() if found else [],
            "profile_down": np.median([c["profile_down"][:20] for c in found if len(c["profile_down"]) >= 20], axis=0).round(1).tolist() if found else [],
        },
        "blur": {k: med([b[k] for b in blur]) for k in ("ratio", "sigma_sharp_px", "sigma_soft_px")},
        "lines": {k: med([s["lines"][k] for s in shot_list])
                  for k in ("line_density", "stroke_px", "long_straight", "thick_straight_nonvertical")},
        "light": {
            "time_share": {k: round(sum(s["dur"] for s in shot_list if s["light"]["kind"] == k) / dur, 3)
                           for k in ("warm", "cool", "mixed")},
            "warm_cool_switches": switches,
            "has_both": "warm" in kinds and "cool" in kinds,
            "lab_b_range": round(max(s["light"]["lab_b"] for s in shot_list) - min(s["light"]["lab_b"] for s in shot_list), 1),
            "sequence": "".join({"warm": "W", "cool": "C", "mixed": "-"}[k] for k in kinds),
        },
        "shots": shot_list,
        "caption_samples": captions,
    }
    Path(out_path).write_text(json.dumps(result, indent=1), encoding="utf-8")
    c, l, b = result["captions"], result["light"], result["blur"]
    return (f"{video.stem}: cap x-h {c['x_height_px']}px y {c['cy']} outline {c['outline_px']} | "
            f"blur sharp/soft sigma {b['sigma_sharp_px']}/{b['sigma_soft_px']} | lines {result['lines']} | "
            f"light {l['sequence']} switches {l['warm_cool_switches']}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("references")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    ref = Path(args.references)
    out = ref / "analysis" / "style"
    out.mkdir(parents=True, exist_ok=True)
    videos = sorted((ref / "videos").glob("*.mp4"))
    if args.only:
        videos = [v for v in videos if v.stem in args.only]
    jobs = [(v, ref / "analysis" / "visual" / f"{v.stem}.json", out / f"{v.stem}.json") for v in videos]
    with ProcessPoolExecutor(max_workers=args.workers) as ex:
        for msg in ex.map(analyze, jobs):
            print(msg, flush=True)


if __name__ == "__main__":
    main()
