"""Tests for the v4 walk plan field (VFX item 12, references/effects/walk.md). Fast, no render:
  .venv/Scripts/python -I tools/tests/test_walk.py

1. build_props WALK_PACES matches the step frames of WALK in src/cast/fx.ts (normal 10, fast 8, rush 6).
2. walk_props: whole steps, the stop step on a step boundary, the path ends on "to", a warning when the walk
   does not fit in the shot, "stop": false keeps walking at the pace speed.
"""
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from build_props import WALK_PACES, Resolver, walk_props  # noqa: E402

SET = {"id": "test", "marks": {"a": [0.0, 0.0, 0.0], "b": [3.0, 0.0, 0.0]}}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    fx = (ROOT / "src/cast/fx.ts").read_text(encoding="utf-8")
    normal = int(re.search(r"export const WALK = \{\s*step: (\d+)", fx).group(1))
    fast = int(re.search(r"\bfast: \{ step: (\d+)", fx).group(1))
    rush = int(re.search(r"\brush: \{ step: (\d+)", fx).group(1))
    R = Resolver([{"start": 1.0}], 30)  # word 0 at frame 30
    checks = [("pace step frames = fx.ts WALK (10 / 8 / 6)",
               (WALK_PACES["normal"][1], WALK_PACES["fast"][1], WALK_PACES["rush"][1]) == (normal, fast, rush) == (10, 8, 6))]
    for pace, (name, step, speed) in WALK_PACES.items():
        pos, path, steps, warn = walk_props({"from": "mark:a", "to": "mark:b", "at": "w:0", "pace": pace},
                                            R, 0, 300, SET, 30, pace)
        (s0, w0), (s1, w1) = steps
        checks += [
            (f"{pace}: starts at the word, from 'from'", s0 == 30 and pos == [0.0, 0.0, 0.0] and w0 == name),
            (f"{pace}: stop step on a step boundary", w1 == "stop" and (s1 - s0) % step == 0),
            (f"{pace}: path ends on 'to' one step after the stop", path["frames"][-1] == s1 + step and path["points"][-1] == [3.0, 0.0, 0.0]),
            (f"{pace}: stride close to the pace ({speed} m/s)",
             abs(path["points"][1][0] / ((s1 - s0) / 30) - speed) < 0.25 * speed),
            (f"{pace}: no warning when it fits", warn is None),
        ]
    _, _, _, warn = walk_props({"from": "mark:a", "to": "mark:b", "pace": "normal"}, R, 0, 40, SET, 30, "short")
    checks.append(("warning when the walk ends after the shot", warn is not None and "after the shot" in warn))
    _, path, steps, _ = walk_props({"from": "mark:a", "to": "mark:b", "pace": "fast", "stop": False}, R, 0, 60, SET, 30, "on")
    checks.append(("stop: false keeps walking to the shot end at the pace speed",
                   len(steps) == 1 and path["frames"] == [0, 60] and math.isclose(path["points"][1][0], 1.6 * 2, abs_tol=1e-3)))
    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
