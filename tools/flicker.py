"""Find frame-to-frame flicker (z-fighting) in a render.

Z-fighting = two surfaces on the same plane: the GPU draws one, then the other, then the first again,
so a patch flips A -> B -> A over 3 consecutive frames. Smooth camera motion, blinks, caption pops and
cuts don't do that (they go A -> B -> B or change gradually). Seen in the bridge video twice (FB2 pier
and grass, FB4 doors and house base) and only caught by the user's eye; this check catches it first.

How it works (on a half-size gray copy):
1. A pixel "flips" at frame t when |t - (t-1)| > DIFF, |t - (t+1)| > DIFF and |(t-1) - (t+1)| < SAME.
2. The frame is cut into CELL x CELL cells (half-size px); a cell flips at t when >= DENSITY of its
   pixels flip. Scattered flips (texture shimmer on cobbles, water, small text) stay under the density.
3. A cell that flips on >= MIN_FLIPS of WINDOW consecutive frames is a hit (z-fighting flips almost
   every frame; a bouncing deck or marching bob flips at most once per step, about every 15 frames).
   Touching hit cells form one region. Any region = FAIL, with its box (full-size px) and time range.
Calibrated on the bridge preview with the FB4 door bug (2026-11-07): the doors reach 6-8 flips in 15
frames, the deck bounce, marching bob and rail aliasing at most 5.

Usage (from the project root):
  python -I tools/flicker.py <video.mp4> [--out DIR] [--start F] [--end F]
writes <out>/flicker.json and, per region, <out>/flicker_<n>.png (the frame, regions in red).
check_render.py calls find_flicker() and reports the regions in its "flicker" section.
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np

DIFF = 20  # luma step that counts as a change (0-255)
SAME = 8  # the two neighbours must match within this
CELL = 8  # cell size in half-size px (= 16 full-size px)
DENSITY = 0.3  # share of flipping pixels for a cell to flip on a frame
WINDOW = 15  # frames (0.5 s at 30 fps)
MIN_FLIPS = 6  # flips inside one window for a cell to be a hit
CAPTION_BAND = (0.66, 0.75)  # share of the height: captions pop here, ignore it


def find_flicker(video, start=0, end=None):
    """Return (regions, info). regions = [{"box": [x0, y0, x1, y1] full px, "frames": [first, last] (frames
    where the cell was a hit), "max_flips": n (most flips in one WINDOW), "cells": k, "peak_frame": f}],
    info = {"frames": n, "size": [w, h]}."""
    cap = cv2.VideoCapture(str(video))
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    w, h = W // 2, H // 2
    gh, gw = h // CELL, w // CELL
    cap.set(cv2.CAP_PROP_POS_FRAMES, start)
    band = (int(CAPTION_BAND[0] * h), int(CAPTION_BAND[1] * h))
    recent = []  # flip masks of the last WINDOW frames
    running = np.zeros((gh, gw), np.int32)
    best = np.zeros((gh, gw), np.int32)  # most flips in one window, and when
    best_f = np.zeros((gh, gw), np.int32)
    first = np.full((gh, gw), -1, np.int32)
    last = np.full((gh, gw), -1, np.int32)
    win = []
    f = start
    while end is None or f <= end:
        ok, frame = cap.read()
        if not ok:
            break
        g = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (w, h), interpolation=cv2.INTER_AREA).astype(np.int16)
        win.append(g)
        if len(win) == 3:
            a, b, c = win
            flip = (np.abs(b - a) > DIFF) & (np.abs(b - c) > DIFF) & (np.abs(a - c) < SAME)
            flip[band[0]:band[1]] = False
            cell = (flip[: gh * CELL, : gw * CELL].reshape(gh, CELL, gw, CELL).mean(axis=(1, 3)) >= DENSITY).astype(np.int32)
            recent.append(cell)
            running += cell
            if len(recent) > WINDOW:
                running -= recent.pop(0)
            t = f - 1  # the middle frame
            better = running > best
            best[better] = running[better]
            best_f[better] = t
            hit = running >= MIN_FLIPS
            first[hit & (first < 0)] = t
            last[hit] = t
            win.pop(0)
        f += 1
    cap.release()
    mask = (best >= MIN_FLIPS).astype(np.uint8)
    n, lab = cv2.connectedComponents(mask, connectivity=8)
    regions = []
    for k in range(1, n):
        sel = lab == k
        ys, xs = np.nonzero(sel)
        peak = np.unravel_index(np.argmax(np.where(sel, best, -1)), best.shape)
        regions.append({
            "box": [int(xs.min() * CELL * 2), int(ys.min() * CELL * 2), int((xs.max() + 1) * CELL * 2), int((ys.max() + 1) * CELL * 2)],
            "frames": [int(first[sel][first[sel] >= 0].min()), int(last[sel].max())],
            "max_flips": int(best[sel].max()),
            "cells": int(sel.sum()),
            "peak_frame": int(best_f[peak]),
        })
    regions.sort(key=lambda r: r["frames"][0])
    return regions, {"frames": f - start, "size": [W, H]}


def draw_region(video, region, path):
    """Save the region's peak frame with the region box and its flipping pixels in red."""
    cap = cv2.VideoCapture(str(video))
    pf = region["peak_frame"]
    cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, pf - 1))
    frames = [cap.read()[1] for _ in range(3)]
    cap.release()
    if any(fr is None for fr in frames):
        return
    a, b, c = (cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY).astype(np.int16) for fr in frames)
    flip = (np.abs(b - a) > DIFF) & (np.abs(b - c) > DIFF) & (np.abs(a - c) < SAME)
    img = frames[1].copy()
    img[flip] = (40, 40, 255)
    x0, y0, x1, y1 = region["box"]
    cv2.rectangle(img, (x0, y0), (x1, y1), (40, 40, 255), 6)
    cv2.imwrite(str(path), img)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out")
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int)
    ap.add_argument("--fps", type=float, default=30.0)
    a = ap.parse_args()
    video = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else video.parent / f"flicker_{video.stem}"
    out.mkdir(parents=True, exist_ok=True)
    regions, info = find_flicker(video, a.start, a.end)
    for i, r in enumerate(regions, 1):
        r["image"] = f"flicker_{i}.png"
        draw_region(video, r, out / r["image"])
    (out / "flicker.json").write_text(json.dumps({"video": video.name, **info, "regions": regions}, indent=1), encoding="utf-8")
    print(f"{video.name}: {info['frames']} frames checked, {len(regions)} flicker region(s)")
    for i, r in enumerate(regions, 1):
        print(f"  {i}: box x {r['box'][0]}-{r['box'][2]} y {r['box'][1]}-{r['box'][3]} · "
              f"{r['frames'][0] / a.fps:.2f}-{r['frames'][1] / a.fps:.2f} s · {r['max_flips']} flips in {WINDOW} frames · {r['cells']} cells · {out / r['image']}")
    print("RESULT:", "FAIL" if regions else "PASS")
    sys.exit(1 if regions else 0)


if __name__ == "__main__":
    main()
