# Background filling test (v4 VFX item 8, references/effects/README.md §8) on the bridge set.
# HISTORY: item 8 was LOCKED 2026-11-11 (B + far land are now the bridge's fixed default); the "fill" levels this
# script writes are ignored, so every shot now renders the locked look. Kept as the record of the A/B test.
# Four cameras taken from the real bridge video (videos/2026-11-07-bridge-break-step), each shown three ways:
#   before (fill 0 = as in the video) | A few props (fill 1) | B many props (fill 2)
# plus B + the corner branch (shot field "branch") on the close and the wide camera.
#   C1 close    : s01, a rifleman at the sign, looking upstream at the left bank
#   C2 medium   : s06, the column on the deck, the left bank behind
#   C3 wide     : s05, the whole bridge + the right bank (slow side drift = parallax)
#   C4 reverse  : the column on the right half of the deck, the right bank behind
#   C5 high     : NOT a camera of the video: a rifleman on the left road seen from a little higher (looking down
#                 ~20°, like the reference), to show how much a higher camera lets the layers show
# Usage: .venv/Scripts/python -I tools/vfx_tests/depth_fill_props.py <out.json> [--stills]
#   --c3     = only C3: before vs B + far land (test 2)
#   --stills = one frame per shot is enough: every shot 30 frames (for the still sheet)
import json, sys

STILLS = "--stills" in sys.argv
COLUMN = lambda x0, x1: [("rifleman", [x0, 3.2, 0.9]), ("rifleman_b", [x0, 3.2, 0.3]), ("rifleman_c", [x0, 3.2, -0.3]),
                         ("rifleman_b", [x0, 3.2, -0.9]), ("rifleman_c", [x1, 3.2, 0.9]), ("rifleman", [x1, 3.2, 0.3]),
                         ("rifleman_b", [x1, 3.2, -0.3]), ("rifleman_c", [x1, 3.2, -0.9])]
CAMS = {
    "C1": dict(cam={"target": [-10.75, 4.6, 2.2], "dir": [0.45, 0.05, 0.89], "d0": 4.7, "fov": 44, "rate": 0.13,
                    "drift": [-0.106, 0, 0]}, actors=[("rifleman", [-10.0, 3.2, 2.5])], len=60, label="close"),
    "C2": dict(cam={"target": [-7.8, 4.3, 0.3], "dir": [0.45, 0.05, 0.89], "d0": 7.5, "fov": 40, "rate": 0.13,
                    "drift": [-0.153, 0, 0]}, actors=COLUMN(-7.5, -8.8), len=60, label="medium"),
    "C3": dict(cam={"target": [0.0, 4.1, 0.0], "dir": [-0.44, 0.18, 0.88], "d0": 19.2, "fov": 40, "rate": 0.06,
                    "drift": [0.45, 0, 0]}, actors=[], len=60, label="wide drift"),
    "C4": dict(cam={"target": [5.2, 4.3, 0.3], "dir": [-0.45, 0.05, 0.89], "d0": 7.5, "fov": 40, "rate": 0.13,
                    "drift": [0.153, 0, 0]}, actors=COLUMN(5.5, 6.8), len=60, label="reverse"),
    "C5": dict(cam={"target": [-12.6, 4.4, 0.0], "dir": [0.45, 0.36, 0.82], "d0": 9.0, "fov": 40, "rate": 0.08,
                    "drift": [-0.15, 0, 0]}, actors=[("rifleman", [-12.6, 3.2, 0.2])], len=60, label="high"),
}
FILLS = [(0, "before"), (1, "A few"), (2, "B many")]
ORDER = []
for c in ["C1", "C2", "C3", "C4", "C5"]:
    for f, name in FILLS:
        ORDER.append((c, f, name, None))
    if c in ("C1", "C3"):
        ORDER.append((c, 2, "B + branch", "tr" if c == "C1" else "tl"))

# --c3: only the wide view, before vs B + the far land (fields, trees, farm, town, hills, ridges; item 8 test 2)
if "--c3" in sys.argv:
    ORDER = [("C3", 0, "before", None), ("C3", 2, "B + far land", None)]

shots, caps, fk, fv = [], [], [], []
f0 = 0
for i, (c, fill, name, branch) in enumerate(ORDER):
    spec = CAMS[c]
    L = 30 if STILLS else spec["len"]
    cam = dict(spec["cam"], roll=[-0.6, -1.0], lenS=L / 30)
    actors = [{"who": w, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": {}, "blink": [f0 + 20], "bg": k > 0}
              for k, (w, p) in enumerate(spec["actors"])]
    shot = {"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None, "set": "bridge",
            "camera": cam, "grade": None, "blur_bg": 0, "extra_warm": [], "actors": actors}
    if branch:
        shot["branch"] = {"corner": branch}
    shots.append(shot)
    caps.append({"text": f"{c} {spec['label']}: {name}", "start": f0})
    if i:
        fk.append(f0 - 1); fv.append(fv[-1])
    fk.append(f0); fv.append(fill)
    f0 += L
one = lambda v: {"frames": [0], "values": [v]}
props = {"fps": 30, "frames": f0, "dissolve": 8, "audio": None, "captions": caps,
         "lights": {"march": one(0), "bounce": one(0), "drop": one(0), "sign": one(1), "fill": {"frames": fk, "values": fv}},
         "shots": shots}
json.dump(props, open(sys.argv[1], "w"), indent=1)
print(f"{len(shots)} shots, {f0} frames")
