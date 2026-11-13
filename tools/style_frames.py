"""Measure characters, outlines and blur on hand-annotated frames, and save example crops.

Usage: python -I tools/style_frames.py <references_dir>

Reads  <references>/analysis/style_frames.json (annotations, fractions of the frame)
Writes <references>/analysis/style_frames/<name>.jpg            clean example crops
       <references>/analysis/style_frames/annotated/<name>.jpg  measurement overlay (for checking)
       <references>/analysis/style_frames_measured.json

- head: flood fill from head_seed (neighbour tolerance FILL_TOL) -> skin region; head
  width = fill width + both outlines (the width is used as the head unit because hats and
  hair hide the top of the head). Outline = dark run (luma < OUTLINE_DARK) leaving the fill
  to the left, right and down; the thinnest of the three medians is kept, because hair
  (sides) or dark clothes (below) can only make a run longer.
- height in head widths = (feet_y - chin_y + head_unit) / head_unit, standing characters only.
- limbs: per row, the thinnest dark run in the leg box (two touching legs read as one wide
  run); median over rows.
- blur: edge acutance p99(Sobel) / (p95 - p5) -> sigma_px ~ 3.19 / acutance
  (head box = sharp reference, bg boxes = background).
- world lines: black-hat (15 px) > 40 & luma < 80 -> density and median stroke width.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

FILL_TOL = 7
DARK = 80
OUTLINE_DARK = 60
MAX_HEAD_W = 0.6     # a fill wider than this share of the frame leaked out of the head
SIGMA_K = 3.19


def grab(video, t):
    cap = cv2.VideoCapture(str(video))
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise RuntimeError(f"cannot read {video} @ {t}")
    return frame


def box_px(b, w, h):
    return int(b[0] * w), int(b[1] * h), int(b[2] * w), int(b[3] * h)


def acutance(gray, b):
    x0, y0, x1, y1 = b
    g = gray[y0:y1, x0:x1].astype(np.float32)
    mag = cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3))
    lo, hi = np.percentile(g, [5, 95])
    a = float(np.percentile(mag, 99) / max(hi - lo, 1))
    return {"acutance": round(a, 3), "sigma_px": round(SIGMA_K / a, 2), "contrast": round(float(hi - lo), 1)}


def valley_width(profile, ref):
    """Width of the dark valley that starts the profile, at half depth between ref and its minimum."""
    p = np.asarray(profile, float)
    if len(p) < 8:
        return 0
    m = p[:25].min()
    if ref - m < 40:                      # no clear dark line next to the fill
        return 0
    thr = m + 0.5 * (ref - m)
    k0 = next((k for k in range(min(5, len(p))) if p[k] < thr), None)
    if k0 is None:
        return 0
    k1 = k0
    while k1 < len(p) and p[k1] < thr:
        k1 += 1
    return k1 - k0


def dark_run(luma_line, dark=OUTLINE_DARK):
    """Length of the dark run at the start of a 1-D luma profile (skip up to 2 anti-aliased px)."""
    start = next((k for k in range(min(3, len(luma_line))) if luma_line[k] < dark), None)
    if start is None:
        return 0
    k = start
    while k < len(luma_line) and luma_line[k] < dark:
        k += 1
    return k


def measure_head(frame, gray, seed):
    h, w = gray.shape
    sx, sy = int(seed[0] * w), int(seed[1] * h)
    img = cv2.GaussianBlur(frame, (3, 3), 0)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(img.copy(), mask, (sx, sy), (0, 0, 0), (FILL_TOL,) * 3, (FILL_TOL,) * 3,
                  4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    fill = mask[1:-1, 1:-1] > 0
    ys, xs = np.nonzero(fill)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    if (x1 - x0) > MAX_HEAD_W * w:
        return None
    # outline thickness: march left / right (middle rows) and down (middle columns) from the fill edge
    runs = {"left": [], "right": [], "down": []}
    g = gray.astype(float)
    for y in range(y0 + (y1 - y0) // 3, y0 + 2 * (y1 - y0) // 3, 3):
        row = np.nonzero(fill[y])[0]
        if len(row) >= 5:
            ref = float(np.median(g[y, row]))
            runs["left"].append(valley_width(g[y, max(0, row[0] - 60):row[0]][::-1], ref))
            runs["right"].append(valley_width(g[y, row[-1] + 1:row[-1] + 61], ref))
    for x in range(x0 + (x1 - x0) // 3, x0 + 2 * (x1 - x0) // 3, 3):
        col = np.nonzero(fill[:, x])[0]
        if len(col) >= 5:
            ref = float(np.median(g[col, x]))
            runs["down"].append(valley_width(g[col[-1] + 1:col[-1] + 61, x], ref))
    per_side = {k: float(np.median([r for r in v if r > 0])) for k, v in runs.items() if any(v)}
    outline = min(per_side.values()) if per_side else 0.0
    fill_w, fill_h = int(x1 - x0 + 1), int(y1 - y0 + 1)
    return {"fill_box": [int(x0), int(y0), int(x1), int(y1)], "fill_w_px": fill_w, "fill_h_px": fill_h,
            "outline_px": round(outline, 1), "outline_by_side_px": {k: round(v, 1) for k, v in per_side.items()},
            "head_unit_px": round(fill_w + 2 * outline, 1),
            "outline_pct_head": round(100 * outline / (fill_w + 2 * outline), 1),
            "chin_y_px": int(y1 + outline), "fill_share_of_box": round(float(fill.sum() / (fill_w * fill_h)), 3)}


def limb_width(gray, b):
    x0, y0, x1, y1 = b
    per_row = []
    for line in gray[y0:y1:2, x0:x1].astype(float):
        lo, ref = line.min(), np.median(line)
        if ref - lo < 40:
            continue
        row = line < lo + 0.5 * (ref - lo)           # half depth between the stroke and its surroundings
        runs, k = [], 0
        for v in list(row) + [False]:
            if v:
                k += 1
            elif k:
                if 3 <= k <= 60:
                    runs.append(k)
                k = 0
        if runs:
            per_row.append(min(runs))
    return round(float(np.median(per_row)), 1) if per_row else None


def world_lines(gray, b):
    x0, y0, x1, y1 = b
    g = gray[y0:y1, x0:x1]
    bh = cv2.morphologyEx(g, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    m = ((bh > 40) & (g < 80)).astype(np.uint8)
    dist = cv2.distanceTransform(m, cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
    peaks = (dist > 0) & (dist >= cv2.dilate(dist, np.ones((3, 3), np.uint8)))
    return {"line_density": round(float(m.mean()), 4),
            "stroke_px": round(float(np.median(2 * dist[peaks])), 2) if peaks.any() else 0.0}


def main(ref):
    ref = Path(ref)
    spec = json.loads((ref / "analysis" / "style_frames.json").read_text(encoding="utf-8"))
    out = ref / "analysis" / "style_frames"
    (out / "annotated").mkdir(parents=True, exist_ok=True)
    results = []
    for f in spec["frames"]:
        frame = grab(ref / "videos" / f"{f['video']}.mp4", f["t"])
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        ann = frame.copy()
        chars = []
        for c in f["characters"]:
            head = measure_head(frame, gray, c["head_seed"])
            if head is None:
                print(f"  {f['name']} / {c['label']}: head fill leaked, skipped")
                continue
            x0, y0, x1, y1 = head["fill_box"]
            pad = int(0.15 * (x1 - x0))
            hb = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
            row = {"label": c["label"], **head, "head_unit_pct_w": round(100 * head["head_unit_px"] / w, 1),
                   "head_sharpness": acutance(gray, hb)}
            if c.get("feet_y"):
                height = c["feet_y"] * h - head["chin_y_px"] + head["head_unit_px"]
                row["height_px"] = round(height)
                row["height_pct_frame"] = round(100 * height / h, 1)
                row["height_in_head_widths"] = round(height / head["head_unit_px"], 2)
            if c.get("leg"):
                lb = box_px(c["leg"], w, h)
                row["leg_px"] = limb_width(gray, lb)
                if row["leg_px"]:
                    row["leg_pct_head"] = round(100 * row["leg_px"] / head["head_unit_px"], 1)
                cv2.rectangle(ann, lb[:2], lb[2:], (255, 0, 255), 3)
            chars.append(row)
            cv2.rectangle(ann, (x0, y0), (x1, y1), (0, 255, 0), 3)
            cv2.circle(ann, (int(c["head_seed"][0] * w), int(c["head_seed"][1] * h)), 8, (0, 0, 255), -1)
            if c.get("feet_y"):
                cv2.line(ann, (x0 - 40, int(c["feet_y"] * h)), (x1 + 40, int(c["feet_y"] * h)), (0, 255, 255), 3)
        bgs = []
        for b in f["bg"]:
            bb = box_px(b, w, h)
            bgs.append(acutance(gray, bb))
            cv2.rectangle(ann, bb[:2], bb[2:], (255, 128, 0), 3)
        worlds = []
        for b in f["world"]:
            wb = box_px(b, w, h)
            worlds.append(world_lines(gray, wb))
            cv2.rectangle(ann, wb[:2], wb[2:], (0, 128, 255), 3)
        cx0, cy0, cx1, cy1 = box_px(f["crop"], w, h)
        cv2.imwrite(str(out / f"{f['name']}.jpg"), frame[cy0:cy1, cx0:cx1], [cv2.IMWRITE_JPEG_QUALITY, 90])
        cv2.imwrite(str(out / "annotated" / f"{f['name']}.jpg"),
                    cv2.resize(ann, (w // 2, h // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 80])
        head_sig = np.median([c["head_sharpness"]["sigma_px"] for c in chars])
        results.append({"name": f["name"], "video": f["video"], "t": f["t"], "world_look": f["world_look"],
                        "characters": chars, "background": bgs, "world": worlds,
                        "bg_vs_head_sigma_ratio": round(float(max(b["sigma_px"] for b in bgs) / head_sig), 2)})
        print(f"{f['name']}: heads {[c.get('height_in_head_widths') for c in chars]} "
              f"outline {[c['outline_px'] for c in chars]} {[c['outline_pct_head'] for c in chars]}% "
              f"leg {[c.get('leg_px') for c in chars]} head_sigma {head_sig} bg_sigma {[b['sigma_px'] for b in bgs]} "
              f"world {worlds}")
    (ref / "analysis" / "style_frames_measured.json").write_text(json.dumps(results, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1])
