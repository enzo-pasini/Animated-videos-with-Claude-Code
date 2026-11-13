# Edge lines test (references/effects/edge-lines.md, VFX item 5). One actor per shot, waist-up like the reference.
# Each shot: neutral → face fx "shock" at frame 18 (its pop is at 23) → edge lines + camera punch-in at frame 22
# (the same clip frames as the reference VS1Z_Q-Klt8 4.00 s + f22), so the side by side lines up with ref_start 4.0.
#   s1 day street   : Mira, lines + punch
#   s2 bridge       : rifleman, lines + punch
#   s3 workshop     : Juno, lines + punch
#   s4 night street : Bram, lines + punch
#   s5 night street : Bram, lines WITHOUT the punch (A/B: does the push-in help?)
# Usage: .venv/Scripts/python -I tools/vfx_tests/edge_lines_props.py <out.json>
import json, sys
L = 60
FX_AT, LINES_AT = 18, 22
PUNCH = {"dur": 0.27, "factor": 1.15}  # = build_props PUNCH
SHOTS = [
    ("day_street", [0.2, 0, 3.4], (0.4466, -0.8931), "mira", True, "day: lines + push"),
    ("bridge", [-10.0, 3.2, 2.5], (0.4466, 0.8931), "rifleman", True, "bridge: lines + push"),
    ("workshop", [0.2, 0, 1.0], (-0.4466, 0.8931), "juno", True, "workshop: lines + push"),
    ("night_street", [0.2, 0, 3.4], (-0.4466, -0.8931), "bram", True, "night: lines + push"),
    ("night_street", [0.2, 0, 3.4], (-0.4466, -0.8931), "bram", False, "night: lines, NO push"),
]
def cam(target, dx, dz, punch, f0):
    m = {"target": target, "dir": [dx, 0.0536, dz], "d0": 4.2, "fov": 40, "rate": 0.05,
         "drift": [0, 0, 0], "roll": [-0.6, -1.0], "lenS": L / 30}
    if punch:
        m["fast"] = dict(PUNCH, at=LINES_AT / 30)
    return m
shots, caps = [], []
for i, (set_, pos, (dx, dz), who, punch, label) in enumerate(SHOTS):
    f0 = i * L
    actors = [{"who": who, "pos": pos, "base": {"expr": "neutral"}, "tracks": {},
               "steps": {"fx": [[f0 + FX_AT, "shock"]]}, "blink": [f0 + 8]}]
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": cam([pos[0], pos[1] + 1.3, pos[2]], dx, dz, punch, f0), "grade": None,
                  "blur_bg": 0, "extra_warm": [], "actors": actors, "lines": {"at": f0 + LINES_AT, "len": 15, "center": [0.5, 0.45]}})
    caps.append({"text": label, "start": f0})
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{len(shots)} shots, {L * len(shots)} frames")
