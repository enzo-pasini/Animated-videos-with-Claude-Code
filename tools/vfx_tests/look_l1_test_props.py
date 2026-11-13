# TEST props for the v4 look L1 (head shading + outline, references/looks/head-shading.md): 4 moving shots like a
# real video (day street with 2 background characters, day bridge with the shako, warm interior, night street),
# 150 frames each, a slow push-in from medium (head ≈ 31 %) to medium-close (≈ 40 %), blinks and expression changes,
# so the look is seen while the character moves.
# Usage: .venv/Scripts/python -I tools/vfx_tests/look_l1_test_props.py <out.json> [l1|v3]
import json, sys
L = 150
EXPR = [(30, "happy"), (70, "surprised"), (100, "thinking"), (128, "happy")]
BLINK = [18, 58, 92, 140]
def cam(pos, dx, dz, drift):
    return {"target": [pos[0], pos[1] + 1.25, pos[2]], "dir": [dx, 0.0536, dz], "d0": 4.4, "fov": 40, "rate": 0.05,
            "drift": [drift, 0, 0], "roll": [-0.6, -1.4], "lenS": L / 30}
SETS = [
    ("day_street", "mira", [0.2, 0, 3.4], (0.4466, -0.8931), -0.01, [("bram", [-1.4, 0, 4.5]), ("rifleman_b", [-0.1, 0, 5.9])], "day street + background"),
    ("bridge", "rifleman", [-10.0, 3.2, 2.5], (0.4466, 0.8931), -0.01, [], "day bridge (shako)"),
    ("workshop", "juno", [0.2, 0, 1.0], (-0.4466, 0.8931), 0.01, [], "warm interior"),
    ("night_street", "pell", [0.2, 0, 3.4], (-0.4466, -0.8931), 0.01, [], "night street"),
]
shots, caps = [], []
for i, (set_, who, pos, (dx, dz), drift, bg, label) in enumerate(SETS):
    f0 = i * L
    main = {"who": who, "pos": pos, "base": {"expr": "neutral"}, "tracks": {},
            "steps": {"expr": [[f0 + at, e] for at, e in EXPR]}, "blink": [f0 + b for b in BLINK]}
    extras = [{"who": w, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": {},
               "blink": [f0 + b + 7 * (k + 1) for b in BLINK]} for k, (w, p) in enumerate(bg)]
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": cam(pos, dx, dz, drift), "grade": None, "blur_bg": 0, "extra_warm": [],
                  "actors": extras + [main]})
    caps.append({"text": label, "start": f0})
one = lambda v: {"frames": [0], "values": [v]}
mode = sys.argv[2] if len(sys.argv) > 2 else "l1"
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)},
         "shots": shots, "look": {"on": True} if mode == "l1" else None}
json.dump(props, open(sys.argv[1], "w"), indent=1)
