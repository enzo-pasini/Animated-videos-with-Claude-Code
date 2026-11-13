# Test props for the anger-smoke effect (references/effects/anger-smoke.md): 4 shots, day / bridge / warm interior / night.
# Usage: .venv/Scripts/python -I tools/vfx_tests/anger_smoke_props.py out/vfx/anger-smoke/props.json
import json, sys
L = 100; FX_AT = 20
def cam(target, dx, dz, d0=4.6, fov=40, drift=-0.06):
    return {"target": target, "dir": [dx, 0.0536, dz], "d0": d0, "fov": fov, "rate": 0.11,
            "drift": [drift, 0, 0], "roll": [-0.8, -2.0], "lenS": L / 30}
shots_in = [
    ("day_street", "mira", [0.2, 0, 3.4], cam([0.2, 1.25, 3.4], 0.4466, -0.8931), "day"),
    ("bridge", "rifleman", [-10.0, 3.2, 2.5], cam([-10.0, 4.45, 2.5], 0.4466, 0.8931), "bridge"),
    ("workshop", "mira", [0.2, 0, 1.0], cam([0.2, 1.25, 1.0], -0.4466, 0.8931, drift=0.06), "warm interior"),
    ("night_street", "mira", [0.2, 0, 3.4], cam([0.2, 1.25, 3.4], -0.4466, -0.8931, drift=0.06), "night"),
]
shots, caps = [], []
for i, (set_, who, pos, camera, label) in enumerate(shots_in):
    f0 = i * L
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": camera, "grade": None, "blur_bg": 0, "extra_warm": [],
                  "actors": [{"who": who, "pos": pos, "base": {"expr": "angry"}, "tracks": {},
                              "steps": {"fx": [[f0 + FX_AT, "anger"]]}, "blink": [f0 + 8]}]})
    caps += [{"text": label, "start": f0}, {"text": "goes", "start": f0 + FX_AT + 6}, {"text": "purple.", "start": f0 + FX_AT + 12}]
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
