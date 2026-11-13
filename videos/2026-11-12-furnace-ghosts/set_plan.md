approved: 2026-11-12 (user) — S1 set plan
approved: 2026-11-13 (user) — S2 set stills
approved: 2026-11-13 (user) — S3 set video
approved: 2026-11-13 (user) — cast (lena, lena_mom, lena_dad, priest, repairman, coat_man; out/cast/furnace_lineup.png)
# Set plan — The Ghosts From the Furnace (BUILDING.md steps 1–2, stop S1)

Not approved yet. Draft shot list first (word times from `audio/words.json`, tempo 1.11, 53.3 s); the real
`scene_plan.json` is written at step 7 after the sets exist.

## Draft shot list (23 shots, ~2.3 s each)

| # | from (s) | words | set | who | camera |
|---|---|---|---|---|---|
| s01 | 0.0 | Lena's ghosts were stopped by a furnace repairman | **old_basement** | repairman at the glowing furnace, Lena on the stairs | fast_entry |
| s02 | 2.3 | It started the week her family moved into the old house | night_street | Lena, mom, dad with boxes at a dark old house | pull_out |
| s03 | 5.3 | At night, Lena heard slow footsteps upstairs, where nobody was | **lena_bedroom** | Lena in bed, looking up, worried | close_up + blur |
| s04 | 8.5 | Then her mother woke to a man | lena_bedroom (door side) | mom, scared jump | push_in |
| s05 | 9.6 | in a dark coat standing at the foot of her bed | lena_bedroom | the man in the dark coat (ghost) | push_in |
| s06 | 11.9 | Every morning, the whole family woke up tired, | lena_bedroom (warm lamp) | Lena, mom, dad, tired | pull_out |
| s07 | 14.1 | with the same dull headache | lena_bedroom | dad, close, hand on head | close_up |
| s08 | 15.4 | Even the houseplants started dying | lena_bedroom (window sill) | — (plant + Lena behind) | push_in |
| s09 | 17.4 | So her dad brought in a priest, who blessed every room | lena_bedroom (door) | dad + priest | push_in |
| s10 | 20.4 | That night, the footsteps came right back, louder than before | lena_bedroom | Lena, `scared` + big jump on "louder" (+ `alert`) | close_up |
| s11 | 23.9 | Lena started sleeping with the lights on | lena_bedroom | Lena in bed, lamp turns on (light key) | pull_out |
| s12 | 25.9 | But Lena noticed something odd: | lena_bedroom | Lena `think` (clicks) | close_up + blur |
| s13 | 27.6 | the ghosts only came on cold nights, when the furnace was burning | old_basement | the furnace glowing, no one | push_in |
| s14 | 30.0 | On warm nights, the house was quiet, and nobody had a headache | lena_bedroom | Lena asleep, calm | pull_out |
| s15 | 33.4 | You see, the old furnace was broken, | old_basement | furnace close (crack, smoke wisps) | close_up |
| s16 | 35.0 | leaking its fumes into the rooms | insert (night) | house outline + grey dots drifting up | push_in |
| s17 | 36.6 | Carbon monoxide: no color, no smell | lena_bedroom | Lena sniffs the air, shrug | push_in |
| s18 | 39.1 | It grabs the blood's oxygen carriers | insert (paper) | red cell blobs + blue oxygen dots | push_in |
| s19 | 40.8 | about two hundred times harder than oxygen does | insert (paper) | grey CO dots stick, oxygen dots pushed off | pull_out |
| s20 | 43.2 | So the brain starves, | insert (night) | a brain blob going pale | push_in |
| s21 | 44.7 | and a starving brain can see ghosts | lena_bedroom | the dark-coat man at the bed, then gone | push_in |
| s22 | 46.5 | One repair later, the ghosts were gone | old_basement | repairman + Lena, happy, furnace fixed | push_in |
| s23 | 48.9 | In 1921, a doctor reported a real family just like Lena's | night_street | the old house with warm windows, family in front | pull_out |

Sets: 2 **new** (lena_bedroom, old_basement) + 2 existing (night_street, insert). Light: warmInterior (both new rooms,
night windows) and nightExterior (night_street) — all locked presets, no new light.

## New set 1 — `lena_bedroom` (warmInterior, windows show night)

- Room: 5.0 m wide × 4.5 m deep × 2.7 m high (`--room 5.0,4.5,2.7 --view night`). Fits the ±12 m shadow box.
- Layout (top view, back wall at the top, cameras come from the front):

```
  back wall:  [picture]   [ WINDOW + plant on the sill ]   [picture]
              ┌──────────┐
              │   BED    │  [nightstand + bedside lamp]
              │ (Lena)   │
              └──────────┘
   [dresser]        mark: bed_foot (the dark-coat man)        [DOOR] mark: door (mom, dad, priest)
              [rug]          mark: center
  front wall (closed, behind the cameras)
```
- Marks: `bed` (Lena in bed), `bed_foot`, `door`, `window` (plant), `center`.
- Lights (plan keys): `lamp` = the bedside lamp (0 off → 1 on, s11).

## New set 2 — `old_basement` (warmInterior, small high window shows night)

- Room: 5.5 m × 4.5 m × 2.4 m (low ceiling) (`--room 5.5,4.5,2.4 --view night`).
- Layout:

```
  back wall:  [small high window]     [ FURNACE  + flue pipe up to the ceiling ]   [shelf with jars]
              [crates, barrel]            mark: furnace (repairman)
   [wooden STAIRS going up, left wall]   mark: stairs (Lena)          [pipes along the ceiling]
                                  mark: center
  front wall (closed)
```
- Marks: `furnace`, `stairs`, `center`.
- Lights: `furnace` = the fire glow behind the furnace door (warm, flickers on "burning"; 0 = fixed/calm), `bulb` = a bare hanging bulb.

## Kit check (step 2)

| Need | Layer | Have? |
|---|---|---|
| bed (low-poly, blanket + pillow) | middle | ❌ **new** — `src/world/kit/home.tsx` (CC0 pack piece if one fits, else our own) |
| bedside lamp (a real warm light) | middle | ❌ **new** (small; like `PendantLamp` but on a nightstand) |
| nightstand / dresser | back | ✅ `HomePiece dresser` |
| window with night view, plant on the sill | far | ✅ base window + `HomePiece houseplant` / `PottedPlant` |
| door | far | ✅ `HomePiece door` |
| rug, pictures | front / far | ✅ `Rug`, `Picture` |
| ceiling light | — | ✅ `HomePiece ceilingLight` |
| **furnace** (old iron box, glowing door, flue pipe) | middle | ❌ **new** — our own piece in `src/world/kit/basement.tsx` (with a `glow` setting) |
| wooden stairs (up the left wall) | back | ❌ **new** — our own piece (`basement.tsx`) |
| pipes along the ceiling | far | ⚠️ `Pipe` exists (vertical, outdoor); a horizontal version → `basement.tsx` |
| crates, barrel, shelf with jars | front / back | ✅ `Crate`, `Barrel`, `Shelf` |
| bare hanging bulb | — | ✅ `PendantLamp` (small) |
| stone/brick wall paint | walls | ✅ `plasterTex` colours (grey-brown) |

**Not sets but also needed before A2:** 6 new characters (`lena` main, `lena_mom`, `lena_dad`, `priest`, `repairman`,
`coat_man` the ghost) — each shown to you in a lineup + expression sheet for approval.

## Choices made (say if you want another)
1. One bedroom for every night scene (also the mother's scare and the priest): two bedrooms would mean a third set for 2 s of video.
2. The ending ("In 1921, a doctor reported…") shows the old house from outside, not the doctor: no extra character or set.
3. The camera-view map (`camera_view.py`) needs the room files that step 4 makes; it comes with the S2 stills. Inside a 5 m room the "thin band" problem is small.

## Changes after S2 (user's notes, 2026-11-13)
- old_basement v2: ceiling 2.4 → 2.9 m; stairs 11 → 5 steps + a landing against the back wall with a door left ajar
  (warm light from the house, level `door`); pitch-black corners (`Darkness`) + a black passage in the right wall
  (`DarkOpening`); cobwebs on the 4 top corners, under both pipes, on the furnace; darker cool paint; dim bulb.
- Round 2 (2026-11-13): webs redrawn in the style of the user's reference image (big, dense, white, hanging strands) in the 4 top corners + one from the furnace top to the back wall + a hanging spider; pipe/furnace drapes removed. `landing` mark moved 0.4 m in front of the door leaf (Lena was inside the door). New camera C7 (furnace top).
  New marks: `landing` (Lena backlit at the door), `stairs` moved to step 3. New cameras C5 (the door) and C6 (the passage).
- lena_bedroom: `<Bed sitter />` + mark `bed` at y −0.215 (hips on the mattress, blanket mound over the lap, legs
  under the blanket) — the card no longer looks cut by the bed. Level `sitter` (0 = empty bed).
- Recipe + rule written in `src/world/sets/BUILDING.md`.
