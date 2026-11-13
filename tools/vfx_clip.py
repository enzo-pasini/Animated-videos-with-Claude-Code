"""Cut a time range from a VFX reference video: save every frame and a labelled contact sheet.

Usage (from the project root):
  .venv/Scripts/python -I tools/vfx_clip.py <video.mp4> <name> <start> <end> [--cols 8] [--every 1] [--crop x0,y0,x1,y1]

Times are seconds or m:ss. Crop box is in fractions of the frame (0-1).
Writes references/effects/frames/<name>/f<NNN>.png (every frame, NNN = frame index in the clip)
and references/effects/frames/<name>/sheet.jpg (tiles labelled with clip frame + video time).
Prints fps, size and frame count. Frames are git-ignored (another channel's art).
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def secs(s):
    if ":" in s:
        m, x = s.split(":")
        return int(m) * 60 + float(x)
    return float(s)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("name")
    ap.add_argument("start")
    ap.add_argument("end")
    ap.add_argument("--cols", type=int, default=8)
    ap.add_argument("--every", type=int, default=1, help="sheet shows every Nth frame (all frames are still saved)")
    ap.add_argument("--crop", default="")
    ap.add_argument("--tile", type=int, default=270, help="tile width in px")
    a = ap.parse_args()

    out = ROOT / "references/effects/frames" / a.name
    out.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(a.video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    f0, f1 = round(secs(a.start) * fps), round(secs(a.end) * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f0)
    tiles = []
    for i in range(f1 - f0 + 1):
        ok, img = cap.read()
        if not ok:
            break
        if a.crop:
            h, w = img.shape[:2]
            x0, y0, x1, y1 = (float(v) for v in a.crop.split(","))
            img = img[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]
        cv2.imwrite(str(out / f"f{i:03d}.png"), img)
        if i % a.every == 0:
            h, w = img.shape[:2]
            t = cv2.resize(img, (a.tile, round(h * a.tile / w)), interpolation=cv2.INTER_AREA)
            lab = f"{i}  {(f0 + i) / fps:.2f}s"
            cv2.rectangle(t, (0, 0), (a.tile, 22), (0, 0, 0), -1)
            cv2.putText(t, lab, (4, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            tiles.append(t)
    cap.release()
    th, tw = tiles[0].shape[:2]
    rows = [tiles[r:r + a.cols] for r in range(0, len(tiles), a.cols)]
    blank = np.zeros_like(tiles[0])
    sheet = np.vstack([np.hstack(r + [blank] * (a.cols - len(r))) for r in rows])
    cv2.imwrite(str(out / "sheet.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"{a.name}: fps {fps:.2f}, size {w}x{h}, frames {len(tiles) * a.every} (sheet {len(tiles)} tiles) -> {out}")


if __name__ == "__main__":
    main()
