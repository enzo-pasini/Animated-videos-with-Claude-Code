# L2 — 3D clothing (recipe)

**LOCKED 2026-11-10**, always on, every character (the user approved the test in round 0).
2D characters with clothes that look round: a lit edge with a white streak, a dark far side, and details that turn with the face.

## 1. Reference (the user's list `references/effects/references-for-cloathing.txt`)

| Clip | What it shows |
|---|---|
| `L2d-cloth-reflex` (HxqtHI62otM 0:00–0:02) | policeman in a dark jail: the white streak on the left edge of the torso |
| `L2h-captain-turn` (Mz72MuPgnGY 0:06–0:18) | the captain turns 3/4 and back: button rows, red stripe and fringe slide; the outline stays |
| `L2e/f/g-side-turn` (7xS87iActkU) | the same slide on the worker's and the boss's vests |
| `L2i-main-vs-secondary`, `L2c-main-vs-background/ref.webp` | background characters: base colour + 1–2 big shapes |

## 2. Measured (pixel rows across the torso, left → right)

| Zone | Policeman f020 (night) | Captain f144 (day) | Ours (rifleman, day street) |
|---|---|---|---|
| ink, lit side | ~3 % of the width | ~3 % | thin L1 line |
| light edge band | 73 → 130 | 64 → 120 (+88 %) | 85 → 141–144 (+68 %), in the shirt's own colour |
| white streak | 230–245, ~3 % wide | 240–246, ~3 % | 231–233, ~3 % |
| fade to the base | ~10 % | ~9 % | ~10 % |
| core shadow | 73 → 44 from 55 % to 80 % | 64 → 39 (−39 %) | 85 → 55 (−35 %) |

The streak runs from the shoulder to ~75–80 % of the torso height. The turn: the body turns **more** than the face
(f120–f144: the button rows reach half-way to the edge while the face moves a little).

## 3. Our version (`src/character/look.ts`, numbers in `L2`)

1. **Core shadow** (`shadeTorso`, multiply): flat to 55 % of the width, then down to −43 % in the texture at 80 % (≈ −38 % on
   screen after the scene light), slightly cool. Drawn **over** the shirt details, so buttons on the far side get darker too.
2. **Light edge band**: a stroke along the torso outline (0.07 head widths deep), blurred, masked to the lit side
   (left edge + left of the shoulders, fades toward the bottom), then the torso is **screened with itself** inside it.
   Found in the test: a white screen turned the dark green into a grey haze; the self-screen keeps navy navy and dark straps dark.
3. **White streak**: the torso path inset by 0.035, stroked 0.017 wide, white at 95 %, shoulder → ~85 % height, blur 1.4 px.
4. **Turn** (`turnTorso`): the `torso` hook (outfit details) is drawn in a layer and put back one pixel column at a time as if
   printed on a cylinder of radius 0.365 (the bean's half width). Body yaw = 1.4 × face yaw, at most 0.85 rad (`TURN_K`,
   `TURN_MAX`). The far details get narrower and slide off; the near edge shows plain shirt. The outline, shading and streak
   stay (fixed light, like L1). Works for every outfit with no per-part code.
5. **Background actors**: actor `"bg": true` in the props/plan → `detailBg()` is true while that actor is drawn, and outfits
   skip their small details. Cardigan = collar + opening line; rifleman jacket = collar + cross belt; apron = apron + pocket;
   Juno = opening line + strap; Bram = opening line (+ the scarf). The shading, streak, rim and head shading stay.

Hooks: `draw.ts` torso section (`turnTorso`, `shadeTorso`, `detailBg`), `parts.ts` / `specs.ts` (`if (detailBg()) return`),
`Episode.tsx` (`actorSpec(who, head, bg)`), `types.ts` (`Actor.bg`).

## 4. Test

`tools/vfx_tests/head_shape_anim_props.py out/looks/L2-test/props_l2.json l2` (the identity cast test: 4 sets, pairs doing
shock → laugh → shy → happy → anger; background actors `"bg": true`) →
`npx remotion render Episode out/looks/L2-test/test.mp4 --props=out/looks/L2-test/props_l2.json --crf=16`.
Side-by-sides (reference left): `side_by_side_streak.mp4` (`vfx_side_by_side.py references/effects/videos/HxqtHI62otM.mp4 0.0 … --shot 180 --seg 60`),
`side_by_side_turn.mp4` (`… Mz72MuPgnGY.mp4 10.0 … --shot 180 --seg 60 --test-from 36`). Close-up sheet `compare_closeup.jpg`,
safety sheet `check_sets.jpg` (4 sets × shock / laugh / shy / happy / anger: anger, sweat, 3D face, head shapes unchanged).

## 5. Lock

`LOOK_L1.body = 1`, `turn = 1` (the name `LOOK_L1` stays: it is the whole always-on look). New regression baseline **`v4cloth`**
(L1 + L3 + L2); `v4id` = history. `"look": {"body": 0, "turn": 0}` = the look without L2 (tests only); `"look": null` = v3.

## 6. Later

- Bram's scarf is an `overArms` piece, so its hanging end does not slide with the turn (barely visible).
- Printed fabric patterns (L2a/L2b hibiscus shirt) and crease lines: not done.
