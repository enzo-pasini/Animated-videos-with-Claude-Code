"""New set from the template (scenes plan session 2; BUILDING.md step 4).

Why: the bridge's worst bugs (flicker = two faces on one plane, the world ending at the horizon, missing
shadows) were fixed in code. The two bases in src/world/sets/base/ carry those fixes; this tool starts every
new set from one of them, so a new scene can't repeat them. The base is only the invisible part (ground,
sky, light, shadow box, haze, layer slots); the place, props, colours, layout and cameras stay free.

Usage (from the project root):
  python -I tools/new_set.py <id> --light day|night|interior [--about "a snowy camp"]
         [--size 20] [--sun left|right]                 (outdoor: half-size of the action area, sun side)
         [--room 8.4,10.2,3.3] [--view night|day]       (interior: width, depth, height; what the window shows)
  python -I tools/new_set.py <id> --remove              (undo: only a set made by this tool)

Writes:
  src/world/sets/<Name>.tsx   the set file, from base/outdoor.tsx.tpl or base/indoor.tsx.tpl
  src/world/sets/<id>.json    marks, front, camera_bounds, light kind, review block (sun, shadow box, sweep),
                              "base" block (how it was made); interior: "room"
  src/episode/sets.tsx        import + registry entry (at the new_set.py marker lines)
Then: set_review.py <id> must PASS on the empty set (it does: the base passes), and the set is built with
BUILDING.md steps 5–10.
"""
import argparse
import datetime
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SETS = ROOT / "src" / "world" / "sets"
BASE = SETS / "base"
REGISTRY = ROOT / "src" / "episode" / "sets.tsx"
IMPORT_MARK = "// new_set.py: set imports above this line"
ENTRY_MARK = "  // new_set.py: new sets above this line"

PRESET = {"day": "dayExterior", "night": "nightExterior", "interior": "warmInterior"}
KIND = {"day": "day", "night": "night", "interior": "warm"}
SUN_ELEV = 45.0  # degrees (bridge 44, night street moon 42)
SUN_TURN = 60.0  # degrees off the camera axis, to one side (bridge 60): side walls in shade, shadows run out sideways
SUN_DIST = 70.0  # m from the origin: inside the sky dome; the light sits at 0.6 × this (DayExteriorLights)
WARM_KEY = [-3, 6, 5]  # warmInterior keyFrom (locked)
WARM_SHADOW = 12  # warmInterior shadow box half-size (locked)
SKY_MAX = 150


def camel(set_id):
    parts = set_id.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def pascal(set_id):
    return "".join(p.title() for p in set_id.split("_"))


def r(v, n=2):
    return [round(x, n) for x in v]


def side_sun(front, side):
    """Sun (or moon) direction from one side of the main camera (cameras stand on the `front` side)."""
    f = [front[0], 0.0, front[2]]
    n = math.hypot(f[0], f[2]) or 1.0
    f = [f[0] / n, 0.0, f[2] / n]
    right = [f[2], 0.0, -f[0]]  # same as build_props.py
    s = 1 if side == "right" else -1
    t = math.radians(SUN_TURN)
    h = [math.cos(t) * f[i] + s * math.sin(t) * right[i] for i in range(3)]
    e = math.radians(SUN_ELEV)
    return r([SUN_DIST * (math.cos(e) * h[0]), SUN_DIST * math.sin(e), SUN_DIST * (math.cos(e) * h[2])], 1)


def axis_dist(p, sun):
    """Distance of point p from the light axis through the origin (the shadow box is centred on it)."""
    n = math.sqrt(sum(c * c for c in sun))
    d = [c / n for c in sun]
    along = sum(p[i] * d[i] for i in range(3))
    return math.sqrt(max(0.0, sum((p[i] - along * d[i]) ** 2 for i in range(3))))


def outdoor_json(a, today):
    S = a.size
    front = [0, 0, 1]
    sun = side_sun(front, a.sun)
    corners = {f"corner {x:+.0f} {z:+.0f}": [x, 0.5, z] for x in (-S, S) for z in (-S, S)}
    # shadow box: the whole action area (its corners) + 4 m of margin (FB7: set_review warns at size - 2)
    shadow = math.ceil(max(axis_dist(p, sun) for p in corners.values()) + 4)
    return {
        "_about": f"Data of the {a.id} set ({a.about}), light preset {PRESET[a.light]}. Made by tools/new_set.py from the "
                  "outdoor base. Read by tools/build_props.py (marks, front), src/world/sets/" + pascal(a.id) + ".tsx (review), "
                  "tools/check_render.py (light_kind), tools/set_review.py (review). Marks = feet positions (m). Rename/add marks freely.",
        "id": a.id,
        "light_preset": PRESET[a.light],
        "light_kind": KIND[a.light],
        "front": front,
        "marks": {"center": [0.0, 0.0, 0.0], "left": [-3.0, 0.0, 0.0], "right": [3.0, 0.0, 0.0], "back": [0.0, 0.0, -4.0]},
        "lights": {},
        "camera_bounds": {"x": [-S, S], "y": [0.3, 20.0], "z": [-S, S]},
        "_camera_bounds": "box the camera must stay inside; presets shorten their distance to fit",
        "review": {
            "_about": "tools/set_review.py + the set file: sun (= moon by night, from one side of the main camera), shadow_size "
                      "(half-size of the shadow box; > 40 = 8192 map), sky_radius (≤ 150), the sweep's center/radius, light "
                      "levels, points that must cast shadows. Add every big object to points; grow shadow_size if one warns.",
            "sun": sun,
            "shadow_size": shadow,
            "sky_radius": SKY_MAX,
            "center": [0.0, 1.5, -2.0],
            "radius": round(min(S * 0.9, 30), 1),
            "lights": {},
            "points": corners,
        },
        "base": {"template": "outdoor", "light": a.light, "size": S, "sun_side": a.sun, "made": today},
    }


def indoor_json(a, today):
    W, D, H = a.room
    room = {"x0": -W / 2, "x1": W / 2, "zBack": -2.2, "zFront": round(-2.2 + D, 2), "height": H}
    cx, cz = 0.0, (room["zBack"] + room["zFront"]) / 2
    corners = {f"corner {x:+.1f} {z:+.1f}": [x, H, z] for x in (room["x0"], room["x1"]) for z in (room["zBack"], room["zFront"])}
    worst = max(axis_dist(p, WARM_KEY) for p in corners.values())
    if worst > WARM_SHADOW - 2:
        raise SystemExit(f"room too big for the locked warmInterior shadow box (corner {worst:.1f} m from the key-light axis, "
                         f"max {WARM_SHADOW - 2}); make it smaller (--room)")
    m = 0.2
    return {
        "_about": f"Data of the {a.id} set ({a.about}), light preset warmInterior. Made by tools/new_set.py from the indoor base. "
                  "Read by tools/build_props.py (marks, front), src/world/sets/" + pascal(a.id) + ".tsx (room), tools/set_review.py "
                  "(review). Marks = feet positions (m). The room is closed (4 walls); the cameras sit inside it, usually on the +z side looking to -z.",
        "id": a.id,
        "light_preset": "warmInterior",
        "light_kind": "warm",
        "front": [0, 0, 1],
        "room": room,
        "marks": {"center": [0.0, 0.0, round(cz - 1, 2)], "left": [round(-W / 4, 2), 0.0, round(cz - 1, 2)],
                  "right": [round(W / 4, 2), 0.0, round(cz - 1, 2)], "back": [0.0, 0.0, round(room["zBack"] + 1.2, 2)]},
        "lights": {},
        "camera_bounds": {"x": r([room["x0"] + m, room["x1"] - m]), "y": r([0.3, H - m]), "z": r([room["zBack"] + m, room["zFront"] - m])},
        "_camera_bounds": "box the camera must stay inside (walls, ceiling); presets shorten their distance to fit",
        "review": {
            "_about": "tools/set_review.py: sun = the locked warmInterior key light, shadow_size = its locked box; the sweep's "
                      "center/radius; points = the room's top corners (add big furniture)",
            "sun": WARM_KEY,
            "shadow_size": WARM_SHADOW,
            "center": [cx, 1.3, round(cz - 1, 2)],
            "radius": round(min(W, D) * 0.45, 1),
            "lights": {},
            "points": corners,
        },
        "base": {"template": "indoor", "light": "interior", "room": [W, D, H], "view": a.view, "made": today},
    }


def remove(set_id):
    js = SETS / f"{set_id}.json"
    if not js.exists():
        raise SystemExit(f"no set {set_id}")
    data = json.loads(js.read_text(encoding="utf-8"))
    if "base" not in data:
        raise SystemExit(f"{set_id} was not made by new_set.py (no \"base\" block) — not removing it")
    reg = REGISTRY.read_text(encoding="utf-8")
    name = pascal(set_id)
    reg = reg.replace(f'import {{ {camel(set_id)}Set }} from "../world/sets/{name}";\n', "")
    reg = re.sub(rf"\n  {set_id}: {camel(set_id)}Set,[^\n]*", "", reg)
    REGISTRY.write_text(reg, encoding="utf-8")
    for p in (js, SETS / f"{name}.tsx"):
        if p.exists():
            p.unlink()
            print(f"removed {p.relative_to(ROOT)}")
    print(f"removed {set_id} from src/episode/sets.tsx")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="New set from the outdoor/indoor base")
    ap.add_argument("id", help="snake_case set id, e.g. snowy_camp")
    ap.add_argument("--light", choices=["day", "night", "interior"])
    ap.add_argument("--about", default="describe the place in one line")
    ap.add_argument("--size", type=float, default=20.0, help="outdoor: half-size of the action area (m)")
    ap.add_argument("--sun", choices=["left", "right"], default="right", help="outdoor: sun side seen from the main camera")
    ap.add_argument("--room", default="8.4,10.2,3.3", help="interior: width,depth,height (m)")
    ap.add_argument("--view", choices=["night", "day"], default="night", help="interior: what the windows show")
    ap.add_argument("--remove", action="store_true", help="delete a set made by this tool")
    a = ap.parse_args()

    if not re.fullmatch(r"[a-z][a-z0-9]*(_[a-z0-9]+)*", a.id):
        raise SystemExit("id must be snake_case: lowercase letters, digits, single underscores (e.g. snowy_camp)")
    if a.remove:
        return remove(a.id)
    if not a.light:
        raise SystemExit("--light day|night|interior is required")

    name, cam = pascal(a.id), camel(a.id)
    tsx, js = SETS / f"{name}.tsx", SETS / f"{a.id}.json"
    reg = REGISTRY.read_text(encoding="utf-8")
    if tsx.exists() or js.exists() or re.search(rf"^\s+{a.id}:", reg, re.M):
        raise SystemExit(f"set {a.id} already exists ({tsx.name} / {js.name} / sets.tsx)")
    if IMPORT_MARK not in reg or ENTRY_MARK not in reg:
        raise SystemExit("marker lines missing in src/episode/sets.tsx (new_set.py: …)")

    today = datetime.date.today().isoformat()
    a.room = [float(x) for x in a.room.split(",")]
    data = indoor_json(a, today) if a.light == "interior" else outdoor_json(a, today)
    tpl = (BASE / ("indoor.tsx.tpl" if a.light == "interior" else "outdoor.tsx.tpl")).read_text(encoding="utf-8")
    code = (tpl.replace("__ABOUT__", a.about).replace("__DATE__", today).replace("__PRESET__", PRESET[a.light])
            .replace("__NAME__", name).replace("__CAMEL__", cam).replace("__LIGHT__", a.light)
            .replace("__VIEW__", a.view).replace("__WIN_X__", str(round(a.room[0] / 4, 2)))
            .replace("__ID__", a.id))

    js.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    tsx.write_text(code, encoding="utf-8")
    reg = reg.replace(IMPORT_MARK, f'import {{ {cam}Set }} from "../world/sets/{name}";\n{IMPORT_MARK}', 1)
    reg = reg.replace(ENTRY_MARK, f"  {a.id}: {cam}Set, // new_set.py {today}\n{ENTRY_MARK}", 1)
    REGISTRY.write_text(reg, encoding="utf-8")

    print(f"new set {a.id} ({PRESET[a.light]})")
    print(f"  {tsx.relative_to(ROOT)}\n  {js.relative_to(ROOT)}\n  src/episode/sets.tsx (registered)")
    rv = data["review"]
    print(f"  sun {rv['sun']} · shadow box ±{rv['shadow_size']} m · camera bounds {data['camera_bounds']}")
    print(f"next: .venv/Scripts/python -I tools/set_review.py {a.id}   then BUILDING.md steps 5–10")


if __name__ == "__main__":
    main()
