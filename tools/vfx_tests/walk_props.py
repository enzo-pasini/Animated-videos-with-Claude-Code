# Walk test (references/effects/walk.md, VFX item 12). A/B: two copies of the same character side by side walk
# toward the camera, which travels with them (like reference 12a). LEFT = A subtle (0.04 head widths),
# RIGHT = B bouncy (0.15). Same step timing on both, so only the size differs.
#   s1 day street   : Bram, sway off  | s2 day street   : Bram, sway on
#   s3 night street : Mira, sway off  | s4 night street : Mira, sway on
#   s5 day street   : rifleman (boots) subtle_sway | rifleman B bouncy_sway, starting + stopping (stands 15 frames
#                     at both ends), camera still: they walk up to the center mark and end with the "stop" step
# Test 2 (2026-11-11): the legs scissor (front/back feet, knee forward), soft side movement; stop step.
# Usage: .venv/Scripts/python -I tools/vfx_tests/walk_props.py <out.json>
import json, math, sys
L = 120
STEP = 10        # = WALK.step in src/cast/fx.ts
SPEED = 1.0      # m/s → 0.33 m per step
BLINK = [20, 85]
SHOTS = [  # set, center at the shot middle, camera dir (x, z) = along the street (camera box z -1.35..6.3), who, sway, label
    ("day_street", [0.2, 0, 3.4], (0.97, -0.243), "bram", False, "sway OFF"),
    ("day_street", [0.2, 0, 3.4], (0.97, -0.243), "bram", True, "sway ON"),
    ("night_street", [0.2, 0, 3.4], (-0.97, -0.243), "mira", False, "sway OFF"),
    ("night_street", [0.2, 0, 3.4], (-0.97, -0.243), "mira", True, "sway ON"),
]
def cam(target, dx, dz, drift):
    return {"target": target, "dir": [dx, 0.0536, dz], "d0": 6.5, "fov": 40, "rate": 0.0,
            "drift": drift, "roll": [-0.6, -1.0], "lenS": L / 30}
shots, caps = [], []
def add(set_, center, dx, dz, pair, label, walk_from, walk_to, move_cam):
    i = len(shots)
    f0 = i * L
    side = (-dz, dx)  # + = screen left
    n = math.hypot(dx, dz)
    w = (dx / n, dz / n)  # walking direction = toward the camera
    dist = SPEED * (walk_to - walk_from) / 30
    actors = []
    for k, (who, walk) in zip([1, -1], pair):
        c = [center[0] + k * 0.65 * side[0], center[1], center[2] + k * 0.65 * side[1]]
        back = dist / 2 if move_cam else dist  # still camera: walk up to the center mark
        a = [c[0] - w[0] * back, c[1], c[2] - w[1] * back]
        b = [a[0] + w[0] * dist, c[1], a[2] + w[1] * dist]
        path = {"frames": [f0 + walk_from, f0 + walk_to], "points": [a, b]}
        walk_steps = [[f0 + walk_from, walk], [f0 + walk_to, "none"]]
        if walk_to < L:  # the stop step: half a stride more, then stand
            half = SPEED * STEP / 30 / 2
            path["frames"].append(f0 + walk_to + STEP)
            path["points"].append([b[0] + w[0] * half, c[1], b[2] + w[1] * half])
            walk_steps = [[f0 + walk_from, walk], [f0 + walk_to, "stop"]]
        actors.append({"who": who, "pos": a, "path": path,
                       "base": {"expr": "neutral"}, "tracks": {},
                       "steps": {"walk": walk_steps},
                       "blink": [f0 + x for x in BLINK]})
    if move_cam:  # the camera travels with the walkers for the whole shot
        start = [center[0] - w[0] * dist / 2, center[1] + 0.3, center[2] - w[1] * dist / 2]
        drift = [w[0] * SPEED, 0, w[1] * SPEED]
    else:
        start, drift = [center[0], center[1] + 0.3, center[2]], [0, 0, 0]
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": cam(start, dx, dz, drift), "grade": None, "blur_bg": 0,
                  "extra_warm": [], "actors": actors})
    caps.append({"text": label, "start": f0})
for set_, center, (dx, dz), who, sway, label in SHOTS:
    s = "_sway" if sway else ""
    add(set_, center, dx, dz, [(who, "subtle" + s), (who, "bouncy" + s)], label, 0, L, True)
add("day_street", [0.2, 0, 3.4], 0.97, -0.243, [("rifleman", "subtle_sway"), ("rifleman_b", "bouncy_sway")],
    "start + stop", 10, 10 + 9 * STEP, False)
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{len(shots)} shots, {L * len(shots)} frames")
