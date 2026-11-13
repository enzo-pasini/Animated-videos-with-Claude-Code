# Test props for the heat-sweat effect (references/effects/heat-sweat.md): 4 shots, day / bridge / warm interior / night.
# Each shot: neutral for FX_AT frames, then "heat" (start + one fan → wipe → slump loop + the next fan).
# Usage: .venv/Scripts/python -I tools/vfx_tests/heat_sweat_props.py out/vfx/heat-sweat/props.json [--fx sweat]
import json, sys
L = 120; FX_AT = 10
fx = sys.argv[sys.argv.index("--fx") + 1] if "--fx" in sys.argv else "heat"
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
                  "actors": [{"who": who, "pos": pos, "base": {"expr": "neutral"}, "tracks": {},
                              "steps": {"fx": [[f0 + FX_AT, fx]]}, "blink": [f0 + 4]}]})
    caps += [{"text": label, "start": f0}, {"text": "summer", "start": f0 + FX_AT}, {"text": "comes.", "start": f0 + FX_AT + 10}]
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
