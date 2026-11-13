# Building a new set, step by step

How to build a new scene (operating room, kitchen, snowy camp, castle…) so it is full and bug-free the first time.
**What** a good set looks like = the 7 rules in `.claude/skills/generate-animated-shorts/SKILL.md` "Building a set"
and the item 8 recipe `references/effects/depth-filling.md`. **This file = how**, in order.
Worked example: the bridge (`Bridge.tsx`, `bridge_land.tsx`, `bridge.json`, `bridge_cams.json`).

Run tools from the project root: `.venv/Scripts/python -I tools/<tool>.py …`.

## The user's three stops

| Stop | After step | Show | The user approves |
|---|---|---|---|
| ⏸ **S1 — plan** | 2 | place, theme, layout sketch (marks), the planned cameras + `camera_view.py` map, kit check (have / missing) | "I approve the set plan" |
| ⏸ **S2 — still** | 8 | before/after sheet of the planned cameras + `set_review.py` sheet + catalog tiles of any new kit piece | "I approve the set stills" |
| ⏸ **S3 — video** | 9 | a few seconds per camera, moving | "I approve the set video" |

Each stop = its own message that ends the turn. Fix what the user says, show again, never skip ahead.

## Steps

| # | Do | File / tool | Check |
|---|---|---|---|
| 1 | **Place + theme** from the scene plan: what the place is, day/night/interior (= the locked light preset), the marks the shots need, and the cameras the plan will use (close, medium, wide, reverse). Write the cameras as `src/world/sets/<id>_cams.json` | `scene_plan.json` shots, `bridge_cams.json` (format: `tools/set_cams.py`) | every planned shot has a camera in the file; light = `nightExterior` / `dayExterior` / `warmInterior` only |
| 2 | **Kit check**: list what the scene needs per layer (foreground, around the marks, back, far) and tick what the kit already has | `references/sets/KIT.md`, `references/sets/kit_catalog.jpg`; `camera_view.py <id>_cams.json` (where the cameras look) | each need = a kit piece, a new piece (step 3) or a set-only piece to move to the kit; ⏸ **S1** |
| 3 | **Missing pieces → the kit**, never inside the set file: a theme file `src/world/kit/<theme>.tsx` (like `country.tsx`), with settings that make variations (size, color, `rotY`, seed). A free 3D pack piece is also fine (CC0 / CC-BY, license checked first): `PackPiece` / a theme file like `home.tsx`, see KIT.md "Theme kits"; CC-BY → `references/sets/CREDITS.md`. Add a line to `KIT` in `src/compositions/KitSheet.tsx` + a row in `KIT.md` | `tools/kit_catalog.py` (sheet), `--check` (coverage) | low-poly, 2+ tones, `OMesh` ink lines, shadows, sunk 2 cm, no two faces on one plane (≥ 2 cm); many copies merged per color (`mergeAt`), array props as module constants |
| 4 | **Start from the template**: `new_set.py <id> --light day\|night\|interior --about "…"` (outdoor: `--size` half-size of the action area, `--sun left\|right`; interior: `--room W,D,H`, `--view night\|day`). It writes `<Name>.tsx` (from `base/outdoor.tsx.tpl` / `base/indoor.tsx.tpl`), `<id>.json` (marks, `camera_bounds`, `light_kind`, `review` block: sun from one side of the main camera, shadow box sized to the action area; interior: `room`) and registers the set in `src/episode/sets.tsx`. The base (`base/OutdoorBase.tsx`, `base/IndoorBase.tsx`) already has the ground that reaches the sky (sky ≤ 150 m), the locked light, the shadow box, the capped haze in the `far` slot and the 4 layer slots `front` / `middle` / `back` / `far`; the set file only fills the slots and picks the ground / wall look. Undo: `--remove` | `tools/new_set.py`, `src/world/sets/base/` | `set_review.py <id>` PASS on the empty set; edit marks, `camera_bounds` in `<id>.json` to the place; add each big object to `review.points` as you build (a WARN → raise `shadow_size`); flat things at `top(1)`, `top(2)`… (≥ 2 cm). Then shoot the **before** stills: `before_after.py <id>_cams.json --tag before` |
| 5 | **Props per layer, where the cameras look**: tall props (stalls, stacks, lamps, laundry, trees) inside the green part of each cone; flat props only near the frame bottom; move big things that block a cone | `camera_view.py <id>_cams.json` (map + thin-band table) | every camera: something tall in its green zone, life around the marks, foreground props close to the camera |
| 6 | **Far view** (outdoor sets that see far): far land with fields, trees in clusters and rows, a town, uneven ridges; capped haze `fogMax` on far meshes only; `DaySky radius` ≥ the far land (max 150) | `kit/land.tsx`, a `<id>_land.tsx` layout like `bridge_land.tsx` | wide shots: far land fits the top ~25 % of the frame; nothing floats in the haze; no world edge |
| 7 | **Camera check**: the whole set from 8 sides + the shadow box | `set_review.py <id>` (8 views, shadow box, flicker on a sweep) | 0 FAIL, every WARN fixed or explained; look at all 8 tiles: no edge of the world, things on land, shadows everywhere |
| 8 | **Before/after stills** of the planned cameras | `before_after.py <id>_cams.json --tag after`, then `--sheet` | every camera fuller than before, nothing blocks the marks; ⏸ **S2** |
| 9 | **Short video**: 2–3 s per planned camera, moving, then the flicker check | `npx remotion render Episode out/<id>_test.mp4 --props=out/before_after/<id>_cams/stills_props.json` (1 s per camera; raise `STILL_LEN` in `set_cams.py` for longer), `tools/flicker.py out/<id>_test.mp4` | flicker PASS (0 regions); render time per 2 s noted; ⏸ **S3** |
| 10 | **Save**: re-run the kit catalog; add the set to `README.md` (table) and `docs/PROJECT_MAP.md`; write what was new or hard in the set's notes (like `depth-filling.md` §3); `regress_frames.py` if shared code changed (kit, `Outlined.tsx`, lights); commit | `kit_catalog.py`, `README.md`, `PROJECT_MAP.md`, `regress_frames.py` | catalog `--check` PASS; regress PASS; never push without asking |

## The set bugs we already had (and the step that stops them)

| Bug (bridge video) | Step |
|---|---|
| FB2, FB4 flicker: two faces on one plane (pier/grass, door/base) | 3 (≥ 2 cm rule), 4 (base `top(n)`, `ON_WALL`), 7 + 9 (flicker) |
| FB3 pale, empty background: colorless boxes, flat ground | 2 + 5 (kit pieces per layer), 6 |
| FB6 river ends in nothing, smooth blob hill | 4 (the base ground reaches the sky dome), 6, 7 (8 views) |
| FB7 houses without shadows: outside the shadow box | 4 (`new_set.py` sizes the box; `review.points`), 7 (shadow box check) |
| FB8 the set seen only through close stills | 1 (planned cameras), 7 (8 views), 8 |
| item 8: flat props invisible at eye level (the thin band) | 5 (`camera_view.py`) |
| S2 furnace-ghosts (2026-11-13): a character "in bed" passed through the bed — the flat blanket cut the card with a straight line | 5 (rule below: no card cut by a flat surface), 8 (look at every still with an actor touching a prop) |
| S2 furnace-ghosts (2026-11-13): the basement was "an old room", not creepy | 2 + 5 (mood checklist below) |
| S3 furnace-ghosts (2026-11-13): a pull-out camera (rate < 0) ended inside the front wall of a small room | 1 (pull-out `d0` × 1.25 must stay inside `camera_bounds`), 9 (look at the LAST frame of every shot) |

## A character touching a prop (bed, table, counter, water, snow)

A character is a flat card that turns to the camera. Where it goes INTO a prop, the prop's flat top cuts it with a
straight line and the character looks like it passes through (the user at S2: "Mira está atravessada na cama").
- **Never let a flat surface cut a card.** Either keep the card fully clear of the prop, or cover the cut with a
  **soft shape that wraps the card from every side** (it turns with the camera): a blanket mound, a heap of laundry,
  a counter's front, foam on water, a snow drift.
- Put the card's joint on the surface: hips (1.3 head widths = 0.715 m above the feet) on a seat or a mattress, so the
  body starts where the prop is, not inside it.
- Example (house.tsx): `<Bed sitter />` + the actor at `bedSitAt(bed)` = hips on the mattress, a faceted lap mound
  over the cut, the legs' ridge and the feet bump under the blanket toward the foot of the bed.
- Check: a still from the planned camera AND one from the side (the card turns; the cover must still hide the cut).
- **Marks stay clear of every solid and moving part** (a door leaf swung open, a chair, a stair rail): ≥ 0.3 m
  between the mark and the part. Second case at S2 (2026-11-13): Lena's `landing` mark stood inside the ajar door's
  leaf; moved 0.4 m in front of it. Nothing in the render pushes a card out of a prop: a mark inside a prop shows
  in every shot that uses it, so fix the MARK in `<set>.json` (and say why in a `_marks_note`).

## Mood: a creepy basement (the user's preferred look, S2 2026-11-13)

What made `old_basement` creepy (v2), with the pieces in `src/world/kit/house.tsx`:
1. **Pitch-black spots** where the light never reaches: `Darkness` in corners, under the stairs, behind props; a
   `DarkOpening` (a black passage) so the cellar seems to go deeper than we see.
2. **Back light at the top of the stairs:** an `AjarDoor` (a crack of warm light from the "normal" house) above a
   `Stairs` `landing` — warm safety up there, cold and hostile down here.
3. **Cobwebs in the classic style of the user's reference** (dense white rings bowing in, hanging strands): big
   `CornerWeb`s (1–1.3 m) in the top corners, a `WebSheet` from the furnace top to the wall behind it, a
   `HangingSpider` on its thread. Small faint webs did not read ("Quando eu digo spider webs…").
4. **A bit darker than a normal room**, WITHOUT touching the locked light preset: darker, cooler wall paint and floor,
   a dim bare bulb (practical light), the fire as the main warm light.
Use the same recipe for any scary place (attic, cellar, abandoned house); keep each piece where the planned cameras look.

