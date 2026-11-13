"""Set review: look at a whole set before a plan uses it (generate-animated-shorts step 7, before A2).

Why: a new set used to be seen only through the planned shots' stills (mostly close). Its edges (where a
river, the ground or the town ends), its background shapes and its shadows went unchecked, and the user
found them by eye in the bridge video (FB3, FB6, FB7). This tool looks at the set from every side.

Usage (from the project root):
  python -I tools/set_review.py <set_id> [--no-flicker]

1. Shadow box (WARN): if the set JSON has "review": {"sun": [x, y, z], "shadow_size": S, "points": {...}},
   every review point must sit inside the sun's orthographic shadow box (distance from the light axis
   through the origin < S - 2 m). A visible object outside it casts no shadow.
2. Sweep: 8 wide stills around the set (every 45°, high and low views alternating, aimed at the review
   center, kept inside "camera_bounds") rendered with tools/storyboard.py → out/set_review/<set>/sheet.jpg.
   Look at every tile for the set checklist in SKILL.md ("Building a set"): world edges, flat or
   unshaded shapes, missing shadows, things in the wrong place (a hill in the river), faces on one plane.
3. Flicker (FAIL): the sweep is also rendered as a moving video and checked with tools/flicker.py.
"""
import argparse
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SETS = ROOT / "src" / "world" / "sets"
PY = sys.executable
SHOT = 30  # frames per review shot (1 s)
SUN_DIST = 0.6  # DayExteriorLights puts the light at sun * 0.6, aimed at the origin


def norm(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def max_inside(origin, direction, bounds):
    t = float("inf")
    for i, axis in enumerate("xyz"):
        lo, hi = bounds[axis]
        if direction[i] > 1e-9:
            t = min(t, (hi - origin[i]) / direction[i])
        elif direction[i] < -1e-9:
            t = min(t, (lo - origin[i]) / direction[i])
    return max(0.3, t)


def shadow_check(review):
    """[(name, distance, ok)] for each review point vs the sun's shadow box."""
    sun, size = review.get("sun"), review.get("shadow_size")
    if not sun or not size:
        return None
    L = [c * SUN_DIST for c in sun]
    d = norm([-c for c in L])
    out = []
    for name, p in review.get("points", {}).items():
        v = [p[i] - L[i] for i in range(3)]
        along = sum(v[i] * d[i] for i in range(3))
        perp = math.sqrt(max(0.0, sum((v[i] - along * d[i]) ** 2 for i in range(3))))
        out.append((name, perp, perp < size - 2.0))
    return out, size


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("set_id")
    ap.add_argument("--no-flicker", action="store_true")
    a = ap.parse_args()
    data = json.loads((SETS / f"{a.set_id}.json").read_text(encoding="utf-8"))
    review = data.get("review", {})
    marks = list(data["marks"].values())
    center = review.get("center") or [sum(m[i] for m in marks) / len(marks) for i in range(3)]
    radius = review.get("radius", 18.0)
    bounds = data.get("camera_bounds", {"x": [-60, 60], "y": [0.3, 40], "z": [-60, 60]})

    warns = 0
    print(f"# Set review — {a.set_id}\n")
    sc = shadow_check(review)
    if sc is None:
        print("shadow box: not checked (add \"review\": {\"sun\", \"shadow_size\", \"points\"} to the set JSON)")
    else:
        rows, size = sc
        print(f"shadow box: half-size {size} m around the sun's axis")
        for name, dist, ok in rows:
            print(f"  {'✅' if ok else '⚠️ WARN'} {name}: {dist:.1f} m from the axis" + ("" if ok else " → outside the shadow box: no shadow"))
            warns += not ok

    # temporary "video" folder with one placeholder word, no captions
    out = ROOT / "out" / "set_review" / a.set_id
    shutil.rmtree(out, ignore_errors=True)
    (out / "audio").mkdir(parents=True)
    (out / "audio" / "words.json").write_text(json.dumps({"words": [{"w": "review", "start": 0.0, "end": 0.5}]}), encoding="utf-8")
    (out / "captions.json").write_text("[]", encoding="utf-8")
    shots = []
    for k in range(8):
        az = math.radians(45 * k)
        high = k % 2 == 0
        elev = 0.55 if high else 0.22
        direction = norm([math.sin(az), elev, math.cos(az)])
        # low views come closer (0.55 × radius) so they don't end up inside a building at the set's edge
        d0 = min(radius * (1.0 if high else 0.55), max_inside(center, direction, bounds) * 0.95)
        side = [math.cos(az), 0, -math.sin(az)]
        shots.append({
            "id": f"r{k + 1}", "beat": None, "from": f"f:{k * SHOT}", "set": a.set_id,
            "camera": {"move": {"target": center, "dir": direction, "d0": round(d0, 3), "fov": 50, "rate": 0.03,
                                "drift": [round(0.4 * s, 3) for s in side], "roll": [0, 0]}},
        })
    plan = {"_about": f"set review of {a.set_id} (tools/set_review.py)", "id": f"review_{a.set_id}", "format": "review",
            "fps": 30, "dissolve_frames": 8, "frames": 8 * SHOT, "audio": {"words": "audio/words.json", "public_path": None},
            "captions": "captions.json", "lights": review.get("lights", {}), "shots": shots}
    (out / "scene_plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    subprocess.run([PY, "-I", str(ROOT / "tools/build_props.py"), str(out)], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if not (out / "render_props.json").exists():
        raise SystemExit("build_props.py did not write render_props.json")
    r = subprocess.run([PY, "-I", str(ROOT / "tools/storyboard.py"), str(out), "--cols", "4"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    print(f"\nsweep: 8 wide views → {out / 'storyboard' / 'sheet.jpg'}" if r.returncode == 0 else f"\nsweep FAILED:\n{r.stdout[-800:]}{r.stderr[-800:]}")

    fails = 0
    if not a.no_flicker:
        video = out / "sweep.mp4"
        npx = "npx.cmd" if sys.platform == "win32" else "npx"
        subprocess.run([npx, "remotion", "render", "Episode", str(video), f"--props={out / 'render_props.json'}", "--crf=20"],
                       cwd=ROOT, capture_output=True)
        f = subprocess.run([PY, "-I", str(ROOT / "tools/flicker.py"), str(video), "--out", str(out / "flicker")],
                           cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
        print("\nflicker on the moving sweep:\n" + "\n".join("  " + l for l in f.stdout.strip().splitlines()))
        fails += f.returncode != 0

    print("\nLook at every tile (SKILL.md \"Building a set\"): no world edges · shaded, outlined shapes · shadows · "
          "things where they belong · no faces on one plane.")
    print(f"RESULT: {'FAIL' if fails else ('WARN' if warns else 'PASS')} — {fails} fail · {warns} warn")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
