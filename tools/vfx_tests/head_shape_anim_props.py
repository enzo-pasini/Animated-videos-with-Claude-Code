# Character identity (PLAN D19), cast test: the whole cast in the 4 test sets, two actors side by side doing the
# same reactions at the same time. The head shapes come from the cast (src/cast/cast_meta.json: male = gumdrop,
# female = chibi, Juno = chibi override); no "head" override here. The first actor of a shot is on the LEFT.
#   s1 day street   : Mira | rifleman        (+ Bram, rifleman B in the background)
#   s2 day bridge   : rifleman | rifleman B  (shakos)
#   s3 workshop     : Juno | Pell            (warm interior; Juno = man with the chibi head)
#   s4 night street : Mira | Bram
# Usage: .venv/Scripts/python -I tools/vfx_tests/head_shape_anim_props.py <out.json> [v4|v3|l2]
#   v3 = "look": null (round heads, the v3 path) for a quick check
#   l2 = look L2 3D clothing test (locked 2026-11-10, now the default look; here: background actors "bg": true)
import json, sys
L = 180
SEQ = [(8, "shock"), (36, "laugh"), (66, "shy"), (92, "happy"), (116, "anger")]
BLINK = [24, 60, 88, 150]
# (set, feet position, camera dir (x, z), label, [left, right], background [(who, pos)])
SHOTS = [
    ("day_street", [0.2, 0, 3.4], (0.4466, -0.8931), "Mira | rifleman", ["mira", "rifleman"],
     [("bram", [-1.4, 0, 4.5]), ("rifleman_b", [-0.1, 0, 5.9])]),
    ("bridge", [-10.0, 3.2, 2.5], (0.4466, 0.8931), "rifleman | rifleman B", ["rifleman", "rifleman_b"], []),
    ("workshop", [0.2, 0, 1.0], (-0.4466, 0.8931), "Juno | Pell", ["juno", "pell"], []),
    ("night_street", [0.2, 0, 3.4], (-0.4466, -0.8931), "Mira | Bram", ["mira", "bram"], []),
]
def cam(target, dx, dz):
    return {"target": target, "dir": [dx, 0.0536, dz], "d0": 4.3, "fov": 40, "rate": 0.01,
            "drift": [0, 0, 0], "roll": [-0.6, -1.0], "lenS": L / 30}
MODE = sys.argv[2] if len(sys.argv) > 2 else "v4"
shots, caps = [], []
for i, (set_, pos, (dx, dz), label, pair, bg) in enumerate(SHOTS):
    f0 = i * L
    side = (-dz, dx)  # perpendicular to the camera direction, on the ground; + = screen left
    actors = [{"who": w, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": {},
               "blink": [f0 + b + 7 * (k + 1) for b in BLINK], **({"bg": True} if MODE == "l2" else {})}
              for k, (w, p) in enumerate(bg)]
    for k, who in zip([1, -1], pair):
        p = [pos[0] + k * 0.36 * side[0], pos[1], pos[2] + k * 0.36 * side[1]]
        actors.append({"who": who, "pos": p, "base": {"expr": "neutral"}, "tracks": {},
                       "steps": {"fx": [[f0 + at, name] for at, name in SEQ]},
                       "blink": [f0 + b + (0 if k > 0 else 3) for b in BLINK]})
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": cam([pos[0], pos[1] + 1.05, pos[2]], dx, dz), "grade": None, "blur_bg": 0,
                  "extra_warm": [], "actors": actors})
    caps.append({"text": label, "start": f0})  # the label stays for the whole shot
one = lambda v: {"frames": [0], "values": [v]}
mode = MODE
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
if mode == "v3":
    props["look"] = None
if mode == "l2":
    props["look"] = {"body": 1, "turn": 1}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{mode}: {len(shots)} shots, {L * len(shots)} frames")
