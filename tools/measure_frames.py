"""Measure look numbers of rendered frames with the SAME formulas as the reference analysis.

Usage: python -I tools/measure_frames.py img1.png [img2.png ...] [--json out.json]
Uses tone() from visual_analysis.py and light_stats() from style_probe.py.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import cv2  # noqa: E402
from style_probe import light_stats  # noqa: E402
from visual_analysis import tone  # noqa: E402


def measure(path):
    img = cv2.imread(str(path))
    t = tone(img)
    l = light_stats(img)
    return {"file": Path(path).name, **{k: round(v, 2) for k, v in t.items()}, **l}


def main():
    args = sys.argv[1:]
    out = None
    if "--json" in args:
        i = args.index("--json")
        out = args[i + 1]
        args = args[:i] + args[i + 2:]
    rows = [measure(p) for p in args]
    for r in rows:
        print(f"{r['file'][:34]:34s} luma {r['luma']:6.1f}  std {r['contrast']:5.1f}  p5 {r['p5']:5.1f}  "
              f"p95 {r['p95']:5.1f}  sat {r['sat']:.2f}  colorful {r['colorful']:5.1f}  "
              f"{r['kind']:5s} (w {r['warm_share']:.2f} / c {r['cool_share']:.2f})")
    if out:
        Path(out).write_text(json.dumps(rows, indent=1))


if __name__ == "__main__":
    main()
