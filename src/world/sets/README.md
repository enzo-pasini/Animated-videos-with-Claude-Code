# Sets

One set = a `<Name>.tsx` (geometry, built from `src/world/kit/`) + `<id>.json` (marks, camera bounds, light kind,
animated "lights" and the `review` data) + an entry in `src/episode/sets.tsx`.

| Set | Files | Light |
|---|---|---|
| `night_street` | `NightStreet.tsx` + `night_street.json` | nightExterior (locked v3) |
| `day_street` | `NightStreet.tsx` (`day`) + `day_street.json` | dayExterior (locked v3.1) |
| `workshop` | `Workshop.tsx` + `workshop.json` | warmInterior (locked v3.1) |
| `bridge` | `Bridge.tsx` + `bridge_land.tsx` (far land) + `bridge.json` | dayExterior, own sun direction + 76 m shadow box, sky radius 150 |
| `lena_bedroom` | `LenaBedroom.tsx` + `lena_bedroom.json` + `lena_bedroom_cams.json` | warmInterior, night window; levels `lamp`, `plant` (dying), `sitter` (someone sits up in bed at mark `bed`) |
| `old_basement` | `OldBasement.tsx` + `old_basement.json` + `old_basement_cams.json` | warmInterior, night window; the creepy-basement recipe (BUILDING.md); levels `furnace`, `bulb`, `cracked`, `door` |

## Start every new set from the template

```bash
.venv/Scripts/python -I tools/new_set.py <id> --light day --about "a snowy camp"
```

`--light day|night|interior` picks the base in `base/`: **`OutdoorBase.tsx`** (dayExterior / nightExterior: ground disc
that reaches the sky dome, sky radius ≤ 150, sun/moon from one side of the main camera, shadow box sized to the set,
capped haze `fogMax` on the `far` slot, `top(n)` heights for flat things) or **`IndoorBase.tsx`** (warmInterior: a closed room — 4 walls,
floor, ceiling from `<id>.json` "room", windows with a view slot `night` / `day` / a texture, `ON_WALL` = 3 cm). Both
have 4 layer slots: `front`, `middle`, `back`, `far`. The base is the invisible part only; the place, ground/wall look,
props, colours, layout and cameras are the set's. The set file starts from `base/outdoor.tsx.tpl` / `base/indoor.tsx.tpl`;
settings (sun, shadow box, sky radius, room) live in `<id>.json`, read by the set file and the tools. `--remove` undoes
a set made by the tool. Room to grow: more bases (street canyon, big landscape, small room) = another `base/*.tsx` +
`.tpl` + a `--light`/`--base` choice in `new_set.py`.

**To build a new set, follow `BUILDING.md`** (step by step, with the user's stops; kit catalog `references/sets/KIT.md`).
Planned cameras of a set: `<id>_cams.json` (e.g. `bridge_cams.json`), read by `tools/camera_view.py` and `tools/before_after.py`.

**Before a plan uses a new or changed set**, follow "Building a set" in
`.claude/skills/generate-animated-shorts/SKILL.md` and run:

```bash
.venv/Scripts/python -I tools/set_review.py <set_id>
```

Checklist (short): no edge of the world in any direction · hills, houses and trees on land · every shape low-poly,
2+ tones, outlined, casting and receiving shadows · every visible object inside the sun's shadow box (`review.points`)
· sun from one side of the main camera direction · no two faces on one plane (≥ 2 cm) · locked light values untouched
· **every layer filled** (item 8, `references/effects/depth-filling.md`): tall props in the cameras' view cones,
foreground props, a far land with fields, trees, a town and uneven ridges in the capped haze (`fogMax`).

`review` block in `<id>.json` (read by `set_review.py`; template sets also read `sun`, `shadow_size`, `sky_radius`
from it, so they can't disagree): `sun` (same as the set's sun), `shadow_size` (same as the
`DayExteriorLights shadowSize` the set passes), `center` + `radius` of the 8-view sweep, `lights` (levels for the
sweep) and `points` (key objects that must cast shadows).
