"""Test for tools/flicker.py (the z-fighting check in check_render.py). Run from the project root:
  .venv/Scripts/python -I tools/tests/test_flicker.py
Builds small synthetic videos in out/tests/flicker/:
1. a sliding striped texture (camera moving) + a patch that flips A->B->A every frame (z-fighting) -> FAIL,
   and the region box is on the patch;
2. the same sliding texture alone -> PASS (motion is not flicker);
3. the texture + a block that bobs down one frame every 15 frames (a marching step / bounce cusp) -> PASS;
4. the texture + a block that switches once and stays (a cut, a light turning on, a caption pop) -> PASS.
Then the real cases (if the files exist): the locked v3 style test and the foggy-glasses preview must PASS.
"""
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from flicker import find_flicker  # noqa: E402

T = ROOT / "out" / "tests" / "flicker"
W, H, N = 540, 960, 75  # find_flicker halves the size: cells stay 8 px of the half-size frame


def background(t):
    """A diagonal striped texture sliding 3 px per frame (smooth motion)."""
    y, x = np.mgrid[0:H, 0:W]
    v = 110 + 60 * np.sin((x + y + 3 * t) / 9.0)
    img = np.stack([v, v * 0.9, v * 0.8], -1)
    return img.astype(np.uint8)


def write(name, extra):
    path = T / f"{name}.mp4"
    vw = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 30, (W, H))
    for t in range(N):
        img = background(t)
        extra(img, t)
        vw.write(img)
    vw.release()
    return path


def zfight(img, t):  # 64x48 patch alternating dark/light every frame, like a door vs a stone base
    img[300:348, 200:264] = (60, 50, 70) if t % 2 else (70, 120, 170)


def bob(img, t):  # a block that dips 6 px for one frame every 15 frames
    dy = 6 if t % 15 == 7 else 0
    img[300 + dy:348 + dy, 200:264] = (60, 50, 70)


def switch(img, t):  # a block that changes once (a cut / a light switching on)
    img[300:348, 200:264] = (60, 50, 70) if t < 40 else (200, 200, 200)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    shutil.rmtree(T, ignore_errors=True)
    T.mkdir(parents=True)
    r_fight, _ = find_flicker(write("zfight", zfight))
    r_plain, _ = find_flicker(write("plain", lambda img, t: None))
    r_bob, _ = find_flicker(write("bob", bob))
    r_switch, _ = find_flicker(write("switch", switch))
    # full-size px: the half-size patch 200-264 x 300-348 is x 200-264 y 300-348 in this 540x960 video (half = 270x480)
    box = r_fight[0]["box"] if r_fight else None
    on_patch = bool(box) and box[0] <= 264 and box[2] >= 200 and box[1] <= 348 and box[3] >= 300
    checks = [
        ("z-fighting patch (A->B->A every frame) -> FAIL", len(r_fight) >= 1),
        ("the flagged region is on the patch", on_patch),
        ("sliding texture alone -> PASS", r_plain == []),
        ("bob / bounce cusp every 15 frames -> PASS", r_bob == []),
        ("one switch (cut, light on) -> PASS", r_switch == []),
    ]
    for name, path in [("locked v3 style test", ROOT / "style_lock/style_test_v3.mp4"),
                       ("foggy-glasses preview", ROOT / "videos/2026-11-04-foggy-glasses/preview.mp4")]:
        if path.exists():
            regions, _ = find_flicker(path)
            checks.append((f"{name} -> PASS", regions == []))
        else:
            print(f"SKIP  {name}: {path} not found")
    failed = 0
    for name, ok in checks:
        print(("PASS  " if ok else "FAIL  ") + name)
        failed += not ok
    print(f"\n{len(checks) - failed}/{len(checks)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
