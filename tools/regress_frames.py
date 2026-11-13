""""Same look" regression test: render StyleTest stills and compare them with the locked frames.

Usage (from the project root):
  python -I tools/regress_frames.py [--out out/regress] [--frames 0,50,100,170,262,290,330]
                                    [--composition StyleTest] [--props props.json] [--no-render]
                                    [--baseline v4cloth|v3] [--make-baseline]
Baselines (2026-11-10): `v4cloth` (default, from locks.json "regress_baseline") = v3 + the locked character looks L1
+ L3 identity head shapes (D19) + L2 3D clothing (`v4id` = L1 + L3, `v4look` = L1 only: history);
`v3` = the v3 characters: `--baseline v3 --props tools/tests/look_off.json` (look off) must still PASS.

It renders the composition to <out>/render.mp4 with the locked settings (`npx remotion render
… --crf=16`), decodes frame N and compares it with style_lock/frames/<version>_fNNN.png (the version
comes from style_lock/locks.json). The locked frames were decoded from the locked mp4, so we compare
mp4 with mp4: a PNG still skips the H.264 step and differs by ~2 levels even with identical code.
Thresholds (measured 2026-11-04): two fresh renders of the SAME code differ by up to 1.41 mean
abs (WebGL soft shadows are not bit-exact), signed mean ~0.00, and <= 0.005 % of pixels off by
more than 24. A +3 % brightness change gives signed mean >= 2.5; a 3 px camera shift gives abs
mean >= 3.9 and >= 3 % big pixels; a changed caption is ~0.6 % big pixels.
Pass if, for every frame: |signed mean| <= 0.5, abs mean <= 2.5, big pixels < 0.1 %.
Writes <out>/diff_fNNN.png (differences x8) and prints a table. Exit code 1 if any frame fails.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SIGNED_MAX = 0.5
MEAN_MAX = 2.5
BIG_DIFF = 24
BIG_SHARE_MAX = 0.001


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="out/regress")
    ap.add_argument("--frames", default="0,50,100,170,262,290,330")
    ap.add_argument("--composition", default="StyleTest")
    ap.add_argument("--props")
    ap.add_argument("--no-render", action="store_true", help="only compare, reuse <out>/render.mp4")
    ap.add_argument("--baseline", help="frames to compare with: style_lock/frames/<baseline>_fNNN.png (default: "
                    "'regress_baseline' in locks.json). 'v3' = the v3 look: also pass --props with {\"look\": null}")
    ap.add_argument("--make-baseline", action="store_true",
                    help="save this render as the new baseline frames + style_lock/style_test_<baseline>.mp4 (after approval)")
    ap.add_argument("--all", action="store_true",
                    help="also compare EVERY frame with style_lock/style_test_<version>.mp4 (same thresholds)")
    a = ap.parse_args()

    locks = json.loads((ROOT / "style_lock" / "locks.json").read_text(encoding="utf-8"))
    version = a.baseline or locks.get("regress_baseline", locks["version"])
    out = (ROOT / a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    frames = [int(f) for f in a.frames.split(",")]
    npx = "npx.cmd" if sys.platform == "win32" else "npx"

    video = out / "render.mp4"
    if not a.no_render:
        cmd = [npx, "remotion", "render", a.composition, str(video), "--crf=16", "--log=error"]
        if a.props:
            cmd.append(f"--props={a.props}")
        subprocess.run(cmd, cwd=ROOT, check=True)
    cap = cv2.VideoCapture(str(video))
    if a.make_baseline:
        import shutil
        shutil.copyfile(video, ROOT / "style_lock" / f"style_test_{version}.mp4")
        for f in frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, f)
            ok, img = cap.read()
            cv2.imwrite(str(ROOT / "style_lock" / "frames" / f"{version}_f{f:03d}.png"), img)
        print(f"baseline {version}: wrote style_lock/style_test_{version}.mp4 and {len(frames)} frames")

    rows, failed = [], 0
    for f in frames:
        ref_path = ROOT / "style_lock" / "frames" / f"{version}_f{f:03d}.png"
        cap.set(cv2.CAP_PROP_POS_FRAMES, f)
        ok, new = cap.read()
        new = new if ok else None
        if new is not None:
            cv2.imwrite(str(out / f"f{f:03d}.png"), new)
        ref = cv2.imread(str(ref_path))
        if ref is None or new is None or ref.shape != new.shape:
            rows.append((f, "—", "—", "—", "FAIL (missing file or size differs)"))
            failed += 1
            continue
        signed = float((new.astype(np.float32) - ref.astype(np.float32)).mean())
        d = cv2.absdiff(ref, new).max(axis=2)
        mean = float(d.mean())
        big = float((d > BIG_DIFF).mean())
        ok = abs(signed) <= SIGNED_MAX and mean <= MEAN_MAX and big < BIG_SHARE_MAX
        failed += not ok
        cv2.imwrite(str(out / f"diff_f{f:03d}.png"), np.clip(d.astype(np.int32) * 8, 0, 255).astype(np.uint8))
        rows.append((f, f"{signed:+.3f}", f"{mean:.3f}", f"{big:.3%}", "PASS" if ok else "FAIL"))

    print(f"Regression vs style_lock/frames ({version}) — pass if |signed| ≤ {SIGNED_MAX}, abs ≤ {MEAN_MAX}, "
          f"pixels off by > {BIG_DIFF} < {BIG_SHARE_MAX:.1%}")
    print("| frame | signed mean | abs mean | pixels off > 24 | result |")
    print("|---|---|---|---|---|")
    for r in rows:
        print("| " + " | ".join(str(x) for x in r) + " |")

    if a.all:
        locked = cv2.VideoCapture(str(ROOT / "style_lock" / f"style_test_{version}.mp4"))
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        n, bad, worst = 0, [], (0.0, -1)
        while True:
            ok1, fa = cap.read()
            ok2, fb = locked.read()
            if not (ok1 and ok2):
                break
            d = cv2.absdiff(fa, fb).max(axis=2)
            signed = float((fa.astype(np.float32) - fb.astype(np.float32)).mean())
            mean, big = float(d.mean()), float((d > BIG_DIFF).mean())
            worst = max(worst, (mean, n))
            if not (abs(signed) <= SIGNED_MAX and mean <= MEAN_MAX and big < BIG_SHARE_MAX):
                bad.append(n)
            n += 1
        failed += len(bad)
        print(f"All frames: {n} compared, worst abs mean {worst[0]:.3f} at frame {worst[1]}, "
              f"failing: {bad[:20] if bad else 'none'}")
    print("RESULT:", "FAIL" if failed else "PASS")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
