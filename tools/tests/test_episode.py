"""Tests for the scene plan -> Episode pipeline. Run from the project root (~1 min, renders 12 s):
  .venv/Scripts/python -I tools/tests/test_episode.py

1. Camera presets reproduce the v3 hand-set distances from the head-size formula.
2. The v3 style test written as a plan (tools/tests/bram_plan) builds, passes the plan check,
   resolves its anchors to the v3 frames, and renders with the Episode composition to the same
   frames as style_lock/frames (tools/regress_frames.py).
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from build_props import dist_for_head  # noqa: E402

PLAN = ROOT / "tools" / "tests" / "bram_plan"
PY = [sys.executable, "-I"]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    checks = [
        ("preset distance = v3 shot 1 (21.8 % at fov 44 → 5.56 m)", abs(dist_for_head(21.8, 44) - 5.56) < 0.02),
        ("preset distance = v3 shot 3 (40.5 % at fov 30 → 4.5 m)", abs(dist_for_head(40.5, 30) - 4.5) < 0.02),
        ("preset distance = v3 shot 5 (24 % at fov 32 → 7.1 m)", abs(dist_for_head(24, 32) - 7.1) < 0.02),
    ]
    r = subprocess.run(PY + [str(ROOT / "tools/build_props.py"), str(PLAN)], capture_output=True, text=True,
                       encoding="utf-8", cwd=ROOT)
    checks.append(("Bram plan builds and passes the plan check", r.returncode == 0 and "Plan check: PASS" in r.stdout))
    p = json.loads((PLAN / "render_props.json").read_text(encoding="utf-8"))
    checks += [
        ("lantern lights at the v3 frames 46/50/52/56", p["lights"]["lantern"]["frames"] == [46, 50, 52, 56]),
        ("window lights at the v3 frames 251/257/261/273", p["lights"]["window_across"]["frames"] == [251, 257, 261, 273]),
        ("shot lengths = v3 SHOT_LEN 68/76/80/84/84", [s["len"] for s in p["shots"]] == [68, 76, 80, 84, 84]),
    ]
    r2 = subprocess.run(PY + [str(ROOT / "tools/build_props.py"), str(ROOT / "tools/tests/insert_plan")], capture_output=True,
                        text=True, encoding="utf-8", cwd=ROOT)
    ins = json.loads((ROOT / "tools/tests/insert_plan/render_props.json").read_text(encoding="utf-8"))
    checks += [
        ("insert plan builds without plan-check fails", r2.returncode == 0),
        ("insert shapes get global frames from 'start+k'", ins["shots"][1]["insert"]["shapes"][1]["at"] == ins["shots"][1]["from"] + 12),
        ("insert camera is 2D with a ~10 %/s push-in", ins["shots"][1]["camera"].get("kind") == "2d" and ins["shots"][1]["camera"]["rate"] == 0.10),
    ]
    r = subprocess.run(PY + [str(ROOT / "tools/regress_frames.py"), "--composition", "Episode", "--props",
                             str(PLAN / "render_props.json"), "--out", "out/regress_episode"],
                       capture_output=True, text=True, encoding="utf-8", cwd=ROOT, stdin=subprocess.DEVNULL)
    checks.append(("Episode render = locked v3 frames", r.returncode == 0))
    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    if failed:
        print(r.stdout[-2000:], r.stderr[-2000:])
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
