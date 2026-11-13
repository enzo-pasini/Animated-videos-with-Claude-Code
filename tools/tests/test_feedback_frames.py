"""Test for tools/feedback_frames.py on the pipeline test video. Run from the project root:
  .venv/Scripts/python -I tools/tests/test_feedback_frames.py
Needs videos/2026-11-04-foggy-glasses/preview.mp4 (media, not in git): skipped if it is missing.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[2]
VID = ROOT / "videos/2026-11-04-foggy-glasses"
PY = [sys.executable, "-I", str(ROOT / "tools/feedback_frames.py"), str(VID)]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if not (VID / "preview.mp4").exists():
        print("SKIP: no preview.mp4 in the pipeline test video")
        return
    run = lambda *a: subprocess.run(PY + list(a), capture_output=True, text=True, encoding="utf-8", cwd=ROOT)
    r4, r2, r99 = run("4.0"), run("2.0"), run("99")
    fb = VID / "feedback"
    shutil.copy(fb / "t4.00s_sheet.jpg", fb / "TEST_sheet.jpg")
    rc = run("4.0", "--item", "TEST", "--before", "feedback/TEST_sheet.jpg")
    compare = cv2.imread(str(fb / "TEST_compare.jpg"))
    sheet = cv2.imread(str(fb / "TEST_sheet.jpg"))
    compare_ok = (rc.returncode == 0 and (fb / "TEST_after.jpg").exists() and compare is not None
                  and compare.shape[1] == sheet.shape[1] and compare.shape[0] > 2 * sheet.shape[0])
    for f in fb.glob("TEST_*"):
        f.unlink()
    checks = [
        ("--item/--before writes TEST_after.jpg and TEST_compare.jpg (before above after)", compare_ok),
        ("same video before and after -> WARNING (fix not in the render)", "WARNING: AFTER is the same image" in rc.stdout),
        ("4.0 s is frame 120 in shot s03 (workshop, close_up)",
         r4.returncode == 0 and "frame 120" in r4.stdout and "shot: s03 (escalation)" in r4.stdout
         and "camera close_up" in r4.stdout),
        ("3 frames + sheet written", all((VID / "feedback" / f).exists() for f in
                                         ("t4.00s_f00110.png", "t4.00s_f00120.png", "t4.00s_f00130.png", "t4.00s_sheet.jpg"))),
        ("responsible files listed (set, cast, light)",
         "src/world/sets/Workshop.tsx" in r4.stdout and "src/cast/registry.ts" in r4.stdout
         and "warmInterior.tsx" in r4.stdout),
        ("words around the time", '"Her glasses turn white in a single"' in r4.stdout),
        ("2.0 s is inside the s01/s02 dissolve, both sets listed",
         "dissolve between s01 and s02" in r2.stdout and "NightStreet.tsx" in r2.stdout and "Workshop.tsx" in r2.stdout),
        ("time outside the video fails", r99.returncode != 0 and "outside the video" in r99.stderr),
    ]
    failed = 0
    for name, ok in checks:
        print(("PASS " if ok else "FAIL ") + name)
        failed += not ok
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
