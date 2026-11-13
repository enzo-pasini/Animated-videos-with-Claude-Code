# Test props for the 3D face effect (references/effects/face-stretch.md): 4 shots, day / bridge / warm interior / night.
# Test 3 (round 2): real-video timing, like the reference (each expression held 12–28 frames, one after another):
# neutral → shock 24 → laugh 28 → think 22 → shy 20 → happy 22 → shock 16 → laugh 12 (5 s per shot).
# Characters: Mira (glasses → dot eyes in shock), the rifleman (shako, freckles), Juno and Pell (locked v3 specs:
# ring eyes; Pell's loupe is a face hook that doesn't know the turn, so it is turned as one piece).
# Usage: .venv/Scripts/python -I tools/vfx_tests/face_stretch_props.py out/vfx/face-stretch/props.json
import json, sys
L = 150
SEQ = [(6, "shock"), (30, "laugh"), (58, "think"), (80, "shy"), (100, "happy"), (122, "shock"), (138, "laugh")]
def cam(target, dx, dz, d0=2.3, fov=40, drift=-0.01):
    return {"target": target, "dir": [dx, 0.0536, dz], "d0": d0, "fov": fov, "rate": 0.015,
            "drift": [drift, 0, 0], "roll": [-0.6, -1.4], "lenS": L / 30}
shots_in = [
    ("day_street", "mira", [0.2, 0, 3.4], cam([0.2, 1.22, 3.4], 0.4466, -0.8931), "day street", [1, 1, 1, -1, 1, -1, -1]),
    ("bridge", "rifleman", [-10.0, 3.2, 2.5], cam([-10.0, 4.42, 2.5], 0.4466, 0.8931), "day bridge (shako)", [-1, -1, -1, 1, -1, 1, 1]),
    ("workshop", "juno", [0.2, 0, 1.0], cam([0.2, 1.22, 1.0], -0.4466, 0.8931, drift=0.01), "warm interior (Juno, v3)", [1, -1, 1, 1, -1, 1, -1]),
    ("night_street", "pell", [0.2, 0, 3.4], cam([0.2, 1.22, 3.4], -0.4466, -0.8931, drift=0.01), "night (Pell, loupe)", [-1, 1, -1, -1, 1, -1, 1]),
]
shots, caps = [], []
for i, (set_, who, pos, camera, label, sides) in enumerate(shots_in):
    f0 = i * L
    fx = [[f0 + at, name + ("_l" if s < 0 else "")] for (at, name), s in zip(SEQ, sides)]
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": camera, "grade": None, "blur_bg": 0, "extra_warm": [],
                  "actors": [{"who": who, "pos": pos, "base": {"expr": "neutral"}, "tracks": {},
                              "steps": {"fx": fx}, "blink": []}]})
    caps += [{"text": label, "start": f0}] + [{"text": name, "start": f0 + at} for at, name in SEQ]
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
