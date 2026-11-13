# Effect recipe: anger — head fills purple + smoke from the temples

**Reference:** 7xS87iActkU 0:16–0:19, clip `frames/01-anger-smoke/` (f0 = 16.00 s, 30 fps). The narration says "his face goes purple".
**Status:** **LOCKED in v4** (approved by the user on 2026-11-09, test 3). Listed in `style_lock/locks_v4.md`. Not part of v4 until then.

## 1. What happens, frame by frame (reference)

| Clip frames | Time | What we see |
|---|---|---|
| f0–25 | 0.87 s | Already angry: brows down in a V, small frown. The camera slowly pushes in |
| f26 | — | The mouth snaps to **clenched teeth** (a white rectangle with a grid), on the word "face" |
| f34 → f41 | **7 frames, 0.23 s** | **Purple fills the head from the chin up**, like liquid filling a glass. Fast at the start, slower near the top (ease-out). Synced with "goes purple" |
| f41 → end | holds | The head stays fully purple (still purple after 3 s) |
| f43 | +2 frames after full | The first smoke puffs appear at both temples |
| f43 → end | loops | Smoke keeps puffing out of both sides, without a pause |

## 2. The purple fill

- **Color:** measured median **`#9A41C5`** (RGB 154, 65, 197), with a slightly darker purple near the outline (shading) and a thin **lighter band on the liquid surface** while it rises.
- **Shape:** the fill is clipped to the head shape. Its top edge is a **gently wavy line** (2 small waves across the head) that stays almost level while it rises.
- **Bubbles:** 2–3 tiny light circles inside the purple near the surface (f36–f44). They disappear when the fill is full.
- **Motion:** fill level 0 → 1 over 7 frames with ease-out. Measured fill area per frame: 5 %, 13 %, 26 %, 41 %, 62 %, 78 %, 93 %, 99 %.
- **The face stays on top:** eyes, brows and mouth are drawn over the purple (dark ink, white teeth). The outline is unchanged.

## 3. The smoke

- **Where:** both sides of the head at the temples, about **70–80 % up the head** (just under the hat brim in the reference). The puffs come out sideways and then rise **diagonally up and out (~45°)**.
- **One puff:** a white cartoon cloud of 3–4 round lobes with soft light-gray shading underneath and no dark outline.
  - Grows from 0 to about **0.35 head widths** in 3 frames (it "pops").
  - Moves about **0.5 head widths** up and out during its life.
  - Lives about **8–10 frames**. In the last 3–4 frames it turns **pink and see-through** and fades away.
- **Rhythm:** a new puff about every **4 frames per side**, so 2–3 puffs are visible on each side at once. The two sides are not in sync.
- **Small white dashes** (2–3 short strokes) flash at the exit point when a puff is born.

## 4. How we'll build it in our project (plan for the test)

| Part | Where | How |
|---|---|---|
| Purple fill | `src/character/draw.ts`, right after the head `strokeFill` and before `drawFace` | New pose field `anger: 0..1` (fill level). Clip to the head ellipse, fill from the bottom up to the level with a wavy top edge, darker rim, a light surface band and bubbles. Redraw the outline on top |
| Clenched teeth | `Mouth` type in `draw.ts` | New mouth `"grit"` (white rectangle with a grid). The existing `angry` expression keeps its frown, and the test will try both |
| Smoke | Drawn per frame from a seeded puff list (no randomness between renders) | Puffs are positioned in head-local units, so they follow head tilt and the card. They must fit inside the character card's canvas, so check its margins (`src/three/CharacterCard.tsx`) |
| Timing in a plan | `scene_plan.json` steps, like `expr` | e.g. `"fx": [["w:12","anger"]]` starts the fill on a word; the smoke starts 2 frames after it's full |

**Our lighting:** characters are cards that take scene light (`locks.md` §4.4). So the purple will look different at night (cool ambient) and inside (warm). The test will show the effect in **day, warm interior and night**, and we'll tune the purple so it still reads as purple, not blue or brown.

## 5. Test to show the user

A short test composition: one character, medium shot, slow push-in. It holds angry for ~1 s, then grit, then the fill (7 frames), then smoke for ~2 s.
Output: `out/vfx/anger-smoke/test.mp4` + a **side-by-side** video (reference clip on the left, our test on the right, same timing) + a still sheet of the key frames.

## 6. Built (test 1, 2026-11-09)

| Part | File |
|---|---|
| Fill, smoke, grit mouth (drawing) | `src/character/fx.ts` (all numbers in `ANGER`) |
| Hooks in the character drawing | `src/character/draw.ts`: fill after the head, smoke after `overHead`, mouth `"grit"`, blush/freckles fade out under the fill |
| Timing (`fx` step → pose fields) | `src/cast/fx.ts` (`FX.anger`), read by `src/episode/Episode.tsx` (`fxAt`) |
| Test props | `tools/vfx_tests/anger_smoke_props.py` (4 shots: day street, day bridge with shako, warm interior, night street) |
| Side-by-side | `tools/vfx_side_by_side.py` |

Use in a plan: `"steps": {"fx": [["w:12", "anger"]]}` on an actor (grit right away, fill 8 frames later, smoke 9 frames after that).
`["w:30", "none"]` switches it off.

Checks: v3 regression `tools/regress_frames.py` **PASS** (the effect is off by default). Reference and test fill start and end on the same frames (f28 → f35).

Known differences from the reference (input for the review):
- Reference puffs stay in a tighter cluster close to the head (3 per side stacked). Ours spread a bit wider and turn pink sooner.
- Mira's angry brows are weak behind her glasses. The reference's V brows read stronger.
- At night the smoke takes the cool light and looks blue-gray (the purple still reads as purple).

Remake: `tools/vfx_tests/anger_smoke_props.py out/vfx/anger-smoke/props.json` → `npx remotion render Episode out/vfx/anger-smoke/test.mp4 --props=out/vfx/anger-smoke/props.json --crf=16` → `tools/vfx_side_by_side.py references/effects/videos/7xS87iActkU.mp4 16.2 out/vfx/anger-smoke/test.mp4 out/vfx/anger-smoke/side_by_side.mp4 --labels "day street,day bridge (shako),warm interior,night street"`

## 7. Feedback on test 1 → test 2 (2026-11-09)

| User feedback | What changed |
|---|---|
| Add an outline to the smoke | Ink outline around each puff (`ANGER.smokeOutline` 0.02 head widths). Each puff is drawn on its own layer, so the outline fades together with the puff. Puffs now have a bumpy cloud edge (big center lobe + ring of 7 small lobes). The birth dashes were removed (with an outline they looked like a glove) |
| The face was static: the reference keeps changing expression while angry | Angry face loop after the head is full (`FX.anger` in `src/cast/fx.ts`): gritted teeth with a small head tremble (new position every 2 frames) → **shouting bursts** with a new mouth every 2 frames (new mouths `yell` = wide, arched top, corners down; `yell_o` = tall oval) and a head bob → grit again. Pattern of 80 frames: grit 22, shout 16, grit 14, shout 10, grit 18. Glances to the side (look −0.55 / +0.45) on a 104-frame loop |
| Stronger brows (Mira's were hidden by her glasses) | `browAnger`: thick, short V brows (inner end thick and low, outer end high), drawn **over** the glasses. `eyeSquint`: an angry lid line cuts the top of each eye |

v3 regression: **PASS** again. Side-by-side: `out/vfx/anger-smoke/side_by_side_v2.mp4`.

## 8. Feedback on test 2 → test 3 (2026-11-09)

The user liked test 2 and asked for two more things in one last round.

| User feedback | What changed (`src/cast/fx.ts`) |
|---|---|
| Give the brows a little movement | Brows press down and get steeper on every shout (`browDY` +0.022, `browAnger` 1.18). During the grit they twitch every 14 frames. Start: from relaxed to angry over 6 frames |
| Body and hand movements that follow the anger | Grit: arms tense out from the body (0.42 rad, elbows 0.3) with fists trembling every 2 frames, plus fast heavy breathing (`breathe`). Shout: one fist raised and shaking (2.35 ± 0.2 rad), alternating right/left per burst, with the other arm tense. Every change blends over 4 frames (`BLEND`) |

Notes: a hand that holds a prop raises the prop too (Mira shakes her clipboard). The rifleman's rifle stays at his side.
v3 regression: **PASS**. Side-by-side: `out/vfx/anger-smoke/side_by_side_v3.mp4`.
