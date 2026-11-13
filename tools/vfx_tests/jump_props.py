# Jump combo test (references/effects/jump.md, VFX items 9 + 11). Two actors side by side: the LEFT one jumps at
# frame A, the RIGHT one at frame B. The jump is the body only (step channel "jump"); the face is free (step "fx"),
# started on the same frame as the jump. Test 3 mixes faces to show they are independent of the jump:
#   s1 day street   : Mira hop + happy        | rifleman big + scared (= the terrified jump of reference 9)
#   s2 bridge       : rifleman hop, no face fx | rifleman B big + laugh (a jump for joy)
#   s3 workshop     : Juno hop + shock         | Pell big + happy
#   s4 night street : Mira big + scared        | Bram hop + laugh
# (Test 1 also had shake / dust A/B shots: the user kept the dust (on by default), dropped the shake.)
# Usage: .venv/Scripts/python -I tools/vfx_tests/jump_props.py <out.json>
import json, sys
L = 100
A, B = 15, 50
BLINK = [8, 95]
SHOTS = [
    ("day_street", [0.2, 0, 3.4], (0.4466, -0.8931), "hop+happy | big+scared",
     [("mira", "hop", "happy"), ("rifleman", "big", "scared")], [("bram", [-1.4, 0, 4.5])]),
    ("bridge", [-10.0, 3.2, 2.5], (0.4466, 0.8931), "hop | big+laugh",
     [("rifleman", "hop", None), ("rifleman_b", "big", "laugh")], []),
    ("workshop", [0.2, 0, 1.0], (-0.4466, 0.8931), "hop+shock | big+happy",
     [("juno", "hop", "shock"), ("pell", "big", "happy")], []),
    ("night_street", [0.2, 0, 3.4], (-0.4466, -0.8931), "big+scared | hop+laugh",
     [("mira", "big", "scared"), ("bram", "hop", "laugh")], []),
]
def cam(target, dx, dz):
    return {"target": target, "dir": [dx, 0.0536, dz], "d0": 5.6, "fov": 40, "rate": 0.01,
            "drift": [0, 0, 0], "roll": [-0.6, -1.0], "lenS": L / 30}
shots, caps = [], []
for i, (set_, pos, (dx, dz), label, pair, bg) in enumerate(SHOTS):
    f0 = i * L
    side = (-dz, dx)  # + = screen left
    actors = [{"who": w, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": {}, "bg": True,
               "blink": [f0 + 40, f0 + 80]} for w, p in bg]
    for k, at, (who, jump, face) in zip([1, -1], [A, B], pair):
        p = [pos[0] + k * 0.4 * side[0], pos[1], pos[2] + k * 0.4 * side[1]]
        steps = {"jump": [[f0 + at, jump]]}
        if face:
            steps["fx"] = [[f0 + at, face]]
        actors.append({"who": who, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": steps,
                       "blink": [f0 + b for b in BLINK]})
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": cam([pos[0], pos[1] + 1.55, pos[2]], dx, dz), "grade": None, "blur_bg": 0,
                  "extra_warm": [], "actors": actors})
    caps.append({"text": label, "start": f0})
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{len(shots)} shots, {L * len(shots)} frames")
