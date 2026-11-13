"""Shared by tools/camera_view.py and tools/before_after.py: load a set's planned cameras, compute where a camera is
(the same math as src/film/camera.ts camAt), and write a stills-only render props file.

A camera source is one of:
  - a cams file `src/world/sets/<set>_cams.json`: the cameras a new scene's plan will use (written at BUILDING.md
    step 1, before any video exists):
      {"set": "bridge", "lights": {"sign": 1},
       "cameras": [{"id": "C1", "label": "close", "target": [x, y, z], "dir": [x, y, z], "d0": 4.7, "fov": 44,
                    "rate": 0.13, "drift": [x, y, z], "actors": [["rifleman", [x, y, z]], ...]}, ...]}
    (target / dir / d0 / fov / rate / drift = the camera "move" of scene_plan.md; actors optional)
  - a video folder or its render_props.json: every shot's camera at the shot's middle frame (--shots to pick some).
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SETS = ROOT / "src" / "world" / "sets"
FPS = 30
STILL_LEN = 30  # frames per camera in a stills props file (the still is its middle frame)


def norm(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def sub(a, b):
    return [a[i] - b[i] for i in range(3)]


def dot(a, b):
    return sum(a[i] * b[i] for i in range(3))


def cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def cam_at(m, t):
    """camera.ts camAt: position, target, fov after t seconds of the move m."""
    base = (1 + m.get("rate", 0.1)) ** t
    s = base
    fast = m.get("fast")
    if fast and not m.get("fovStart"):
        k = min(1.0, max(0.0, (t - fast.get("at", 0)) / fast["dur"]))
        s = base * (1 + (fast["factor"] - 1) * (1 - (1 - k) ** 3))
    d = m["d0"] / s
    drift = [c * t for c in m.get("drift", [0, 0, 0])]
    target = [m["target"][i] + drift[i] for i in range(3)]
    dr = norm(m["dir"])
    pos = [target[i] + dr[i] * d for i in range(3)]
    fov = m["fov"]
    if fast and m.get("fovStart"):
        k = min(1.0, t / fast["dur"])
        fov = m["fov"] + (m["fovStart"] - m["fov"]) * (1 - (1 - (1 - k) ** 3))
    return pos, target, fov


def set_data(set_id):
    return json.loads((SETS / f"{set_id}.json").read_text(encoding="utf-8"))


def load(source, shots=None):
    """→ (set_id, cams, props_or_None). cams = [{id, label, set, move, t (s into the shot), frame (global), actors}]"""
    p = Path(source)
    if p.is_dir():
        p = p / "render_props.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    if "cameras" in data:  # cams file
        cams = [{"id": c["id"], "label": c.get("label", ""), "set": data["set"], "actors": c.get("actors", []),
                 "move": {k: c[k] for k in ("target", "dir", "d0", "fov", "rate", "drift", "fast", "fovStart") if k in c},
                 "t": STILL_LEN / 2 / FPS, "frame": i * STILL_LEN + STILL_LEN // 2}
                for i, c in enumerate(data["cameras"])]
        return data["set"], cams, None
    props = data
    total = props["frames"]
    cams = []
    for i, s in enumerate(props["shots"]):
        if shots and s["id"] not in shots:
            continue
        if s["camera"].get("kind") == "2d":
            continue
        end = props["shots"][i + 1]["from"] if i + 1 < len(props["shots"]) else total
        mid = (s["from"] + end) // 2
        cams.append({"id": s["id"], "label": s.get("beat") or "", "set": s["set"], "actors": None,
                     "move": s["camera"], "t": (mid - s["from"]) / FPS, "frame": mid})
    sets = {c["set"] for c in cams}
    return (sets.pop() if len(sets) == 1 else None), cams, props


def stills_props(source, cams_file):
    """A render props file with one 30-frame shot per camera of a cams file (for before_after.py)."""
    data = json.loads(Path(cams_file).read_text(encoding="utf-8"))
    one = lambda v: {"frames": [0], "values": [v]}
    lights = {k: one(v) for k, v in data.get("lights", {}).items()}
    shots = []
    for i, c in enumerate(data["cameras"]):
        f0 = i * STILL_LEN
        move = {k: c[k] for k in ("target", "dir", "d0", "fov", "rate", "drift") if k in c}
        actors = [{"who": w, "pos": pos, "base": {"expr": "neutral"}, "tracks": {}, "steps": {}, "blink": [f0 + 25], "bg": k > 0}
                  for k, (w, pos) in enumerate(c.get("actors", []))]
        shots.append({"id": c["id"], "beat": None, "from": f0, "len": STILL_LEN, "transition_in": "cut" if i else None,
                      "set": data["set"], "camera": dict(move, roll=[0, 0], lenS=STILL_LEN / FPS), "grade": None,
                      "blur_bg": 0, "extra_warm": [], "actors": actors})
    return {"fps": FPS, "frames": len(shots) * STILL_LEN, "dissolve": 8, "audio": None, "captions": [],
            "lights": lights, "shots": shots}
