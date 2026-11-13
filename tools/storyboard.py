"""Storyboard: one still per shot (its middle frame) + a labelled contact sheet, for approval A3.

Usage (from the project root, after build_props.py):
  python -I tools/storyboard.py videos/<slug> [--cols 5]

Reads render_props.json and captions.json; renders the stills with tools/render_stills.mjs (one
bundle, one browser) into storyboard/; writes storyboard/sheet.jpg. Each tile shows the shot id,
beat, time, set and camera, and the words spoken while the shot is on screen. Look at every tile
before showing it: the v1/v2 lessons were a camera inside a house, a card cutting through a window
frame, and a prop in front of legs.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TILE_W, TILE_H = 360, 640


def put(img, text, y, scale=0.5, color=(255, 255, 255), bold=1):
    cv2.putText(img, text, (8, y), cv2.FONT_HERSHEY_SIMPLEX, scale, color, bold, cv2.LINE_AA)


def bar(img, y0, y1):
    """Dark translucent band behind a block of labels."""
    img[y0:y1] = (img[y0:y1] * 0.35).astype(img.dtype)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--cols", type=int, default=5)
    a = ap.parse_args()
    vdir = Path(a.video_dir).resolve()
    props = json.loads((vdir / "render_props.json").read_text(encoding="utf-8"))
    fps, total, shots = props["fps"], props["frames"], props["shots"]
    caps = props["captions"]
    out = vdir / "storyboard"
    mids = []
    for i, s in enumerate(shots):
        end = shots[i + 1]["from"] if i + 1 < len(shots) else total
        mids.append((s["from"] + end) // 2)
    node = "node"
    subprocess.run([node, str(ROOT / "tools/render_stills.mjs"), "--props", str(vdir / "render_props.json"),
                    "--frames", ",".join(map(str, mids)), "--out", str(out), "--prefix", "f"], cwd=ROOT, check=True,
                   stdin=subprocess.DEVNULL)
    tiles = []
    for i, (s, mid) in enumerate(zip(shots, mids)):
        img = cv2.imread(str(out / f"f{mid:05d}.png"))
        img = cv2.resize(img, (TILE_W, TILE_H), interpolation=cv2.INTER_AREA)
        end = shots[i + 1]["from"] if i + 1 < len(shots) else total
        words = " ".join(c["text"] for c in caps if s["from"] <= c["start"] < end)
        cam = s["camera"]
        cam_txt = "2d insert" if cam.get("kind") == "2d" else f"d0 {cam['d0']} fov {cam['fov']} r {cam.get('rate')}"
        bar(img, 0, 74)
        bar(img, TILE_H - 68, TILE_H)
        put(img, f"{s['id']}  {s.get('beat') or ''}", 22, 0.6, bold=2)
        put(img, f"{s['from'] / fps:.1f}-{end / fps:.1f}s  {s['set']}", 44)
        put(img, cam_txt + ("  blur" if s.get("blur_bg") else "") + ("  CUT" if s["transition_in"] == "cut" else ""), 64)
        line, y = "", TILE_H - 50
        for w in words.split():
            if len(line) + len(w) > 34:
                put(img, line, y, 0.45)
                line, y = "", y + 18
            line += w + " "
        if line and y < TILE_H:
            put(img, line, y, 0.45)
        tiles.append(img)
    cols = min(a.cols, len(tiles))
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    sheet = np.vstack([np.hstack(tiles[r:r + cols]) for r in range(0, len(tiles), cols)])
    cv2.imwrite(str(out / "sheet.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"storyboard: {len(shots)} shots → {out / 'sheet.jpg'}")


if __name__ == "__main__":
    main()
