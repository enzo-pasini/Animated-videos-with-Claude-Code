# Fast walk test (references/effects/walk.md, VFX item 12; 2026-11-11). The normal walk is decided (A subtle + sway);
# this compares A subtle vs B bouncy at the FAST pace (12e, the front cop hurrying out: a step every ~8 frames, a
# snappy 2-frame dip). Sway ON everywhere (the user's choice). Walking toward the camera, along the street.
#   s1 day street   : Bram  subtle_sway_fast | bouncy_sway_fast, camera travels with them
#   s2 night street : Mira  subtle_sway_fast | bouncy_sway_fast, camera travels with them
#   s3 day street   : riflemen subtle_sway_fast | bouncy_sway_fast, start + stop, camera still
#   s4 day street   : Bram  NORMAL subtle_sway | FAST subtle_sway_fast, both walk 3 m up to the mark and stop (pace A/B)
# Mode "rush" (test 2, 2026-11-11): the user chose B bouncy for the fast walk and wants a really fast one with more
# bounces per second → _rush = 6-frame steps (5 steps/s):
#   s1 day street   : Bram  bouncy_sway_fast (8) | bouncy_sway_rush (6), same speed 2 m/s, camera travels with them
#   s2 night street : Mira  the same
#   s3 day street   : Bram  normal subtle_sway | bouncy_sway_fast | bouncy_sway_rush, each walks 3 m and stops
# Usage: .venv/Scripts/python -I tools/vfx_tests/walk_fast_props.py <out.json> [rush]
import json, math, sys
L = 120
NORMAL = (10, 1.0)  # frames per step (WALK.step), m/s
FAST = (8, 1.6)     # WALK.fast.step; 0.43 m per step
RUSH = (6, 2.2)     # WALK.rush.step; 0.44 m per step
MODE = sys.argv[2] if len(sys.argv) > 2 else "fast"
BLINK = [20, 85]
DAY = ("day_street", [0.2, 0, 3.4], (0.97, -0.243))  # along the street (camera box z -1.35..6.3)
NIGHT = ("night_street", [0.2, 0, 3.4], (-0.97, -0.243))
shots, caps = [], []

def walker(who, walk, c, w, f0, start, steps, pace, stop, move_back):
    """Feet path + walk steps. move_back = how far behind c the walk starts (m)."""
    step, speed = pace
    dist = speed * steps * step / 30
    a = [c[0] - w[0] * move_back, c[1], c[2] - w[1] * move_back]
    b = [a[0] + w[0] * dist, c[1], a[2] + w[1] * dist]
    end = f0 + start + steps * step
    path = {"frames": [f0 + start, end], "points": [a, b]}
    walk_steps = [[f0 + start, walk]]
    if stop:  # the stop step: half a stride more, then stand
        half = speed * step / 30 / 2
        path["frames"].append(end + step)
        path["points"].append([b[0] + w[0] * half, c[1], b[2] + w[1] * half])
        walk_steps.append([end, "stop"])
    return {"who": who, "pos": a, "path": path, "base": {"expr": "neutral"}, "tracks": {},
            "steps": {"walk": walk_steps}, "blink": [f0 + x for x in BLINK]}

def shot(place, pair, label, moving):
    set_, center, (dx, dz) = place
    i = len(shots)
    f0 = i * L
    side = (-dz, dx)  # + = screen left
    n = math.hypot(dx, dz)
    w = (dx / n, dz / n)  # walking direction = toward the camera
    actors = []
    spots = [0.65, -0.65] if len(pair) == 2 else [0.95, 0, -0.95]
    for k, (who, walk, pace, start, steps, stop) in zip(spots, pair):
        c = [center[0] + k * side[0], center[1], center[2] + k * side[1]]
        dist = pace[1] * steps * pace[0] / 30
        back = dist / 2 if moving else dist + (pace[1] * pace[0] / 30 / 2 if stop else 0)  # still camera: end on the mark
        actors.append(walker(who, walk, c, w, f0, start, steps, pace, stop, back))
    if moving:  # the camera travels with the walkers for the whole shot
        speed = pair[0][2][1]
        dist = speed * L / 30
        start = [center[0] - w[0] * dist / 2, center[1] + 0.3, center[2] - w[1] * dist / 2]
        drift = [w[0] * speed, 0, w[1] * speed]
    else:
        start, drift = [center[0], center[1] + 0.3, center[2]], [0, 0, 0]
    cam = {"target": start, "dir": [dx, 0.0536, dz], "d0": 6.5, "fov": 40, "rate": 0.0,
           "drift": drift, "roll": [-0.6, -1.0], "lenS": L / 30}
    shots.append({"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                  "set": set_, "camera": cam, "grade": None, "blur_bg": 0, "extra_warm": [], "actors": actors})
    caps.append({"text": label, "start": f0})

if MODE == "rush":
    F2, R2 = (FAST[0], 2.0), (RUSH[0], 2.0)  # same world speed: only the bounces per second differ
    for place, who in ((DAY, "bram"), (NIGHT, "mira")):
        shot(place, [(who, "bouncy_sway_fast", F2, 0, L // F2[0], False), (who, "bouncy_sway_rush", R2, 0, L // R2[0], False)],
             "fast | RUSH", True)
    shot(DAY, [("bram", "subtle_sway", NORMAL, 10, 9, True), ("bram", "bouncy_sway_fast", FAST, 10, 7, True),
               ("bram", "bouncy_sway_rush", RUSH, 10, 7, True)], "normal | fast | RUSH", False)
whole = L // FAST[0]  # 15 steps = the whole shot
if MODE == "fast": shot(DAY, [("bram", "subtle_sway_fast", FAST, 0, whole, False), ("bram", "bouncy_sway_fast", FAST, 0, whole, False)],
     "FAST", True)
if MODE == "fast": shot(NIGHT, [("mira", "subtle_sway_fast", FAST, 0, whole, False), ("mira", "bouncy_sway_fast", FAST, 0, whole, False)],
     "FAST", True)
if MODE == "fast": shot(DAY, [("rifleman", "subtle_sway_fast", FAST, 10, 7, True), ("rifleman_b", "bouncy_sway_fast", FAST, 10, 7, True)],
     "FAST start + stop", False)
if MODE == "fast": shot(DAY, [("bram", "subtle_sway", NORMAL, 10, 9, True), ("bram", "subtle_sway_fast", FAST, 10, 7, True)],
     "normal | FAST", False)
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": L * len(shots), "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"lantern": one(1), "window_across": one(0), "lamp": one(1),
                    "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{len(shots)} shots, {L * len(shots)} frames")
