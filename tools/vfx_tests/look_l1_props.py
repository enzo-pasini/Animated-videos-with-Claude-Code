# MOCKUP props for the v4 look L1 (head shading + outline, references/looks/README.md): still shots of our real
# characters in the 4 test sets (day street, day bridge with the shako, warm interior, night street).
# Each set: a medium shot (whole body, head ≈ 30 % of the width) and a close-up (head ≈ 50 %), 30 frames each;
# take the stills at frame 15 of each shot. The day street also has two background characters (L1 is for everyone).
# Usage: .venv/Scripts/python -I tools/vfx_tests/look_l1_props.py <out.json> [v3|l1|l1full]
#   v3 = no look (the locked look), l1 = L1 with the approved half rim, l1full = the full rim (first mockup)
import json, sys
L = 30
def cam(pos, dx, dz, d0, ty):
    return {"target": [pos[0], pos[1] + ty, pos[2]], "dir": [dx, 0.0536, dz], "d0": d0, "fov": 40, "rate": 0.0,
            "drift": [0, 0, 0], "roll": [-0.6, -0.6], "lenS": L / 30}
# (set, main actor, pos, camera dir x/z, background actors)
SETS = [
    ("day_street", "mira", [0.2, 0, 3.4], (0.4466, -0.8931), [("bram", [-1.4, 0, 4.5]), ("rifleman_b", [-0.1, 0, 5.9])]),
    ("bridge", "rifleman", [-10.0, 3.2, 2.5], (0.4466, 0.8931), []),
    ("workshop", "juno", [0.2, 0, 1.0], (-0.4466, 0.8931), []),
    ("night_street", "pell", [0.2, 0, 3.4], (-0.4466, -0.8931), []),
]
shots = []
for set_, who, pos, (dx, dz), bg in SETS:
    for kind, d0, ty in [("medium", 4.6, 0.95), ("close", 2.2, 1.45)]:
        actors = [{"who": who, "pos": pos, "base": {"expr": "neutral"}, "tracks": {}, "steps": {}, "blink": []}]
        if kind == "medium":
            actors = [{"who": w, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": {}, "blink": []} for w, p in bg] + actors
        shots.append({"id": f"{set_}_{kind}", "beat": None, "from": len(shots) * L, "len": L,
                      "transition_in": "cut" if shots else None, "set": set_, "camera": cam(pos, dx, dz, d0, ty),
                      "grade": None, "blur_bg": 0, "extra_warm": [], "actors": actors})
one = lambda v: {"frames": [0], "values": [v]}
mode = sys.argv[2] if len(sys.argv) > 2 else "l1"
look = {"v3": None, "l1": {"on": True}, "l1full": {"on": True, "rim": 1}}[mode]
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": [],
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)},
         "shots": shots, "look": look}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{len(shots)} shots; stills at frames {[s['from'] + 15 for s in shots]}")
