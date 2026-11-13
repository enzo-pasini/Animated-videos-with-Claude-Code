# Effect recipe: face stretch → "3D face" (the face turns on the round head)

**References:**
- Item 3: VKsamN3Fk4U 0:01–0:04, 0:27–0:32, 0:40–0:43 → clips `frames/03a-face-stretch/` (f0 = 1.00 s), `03b-face-stretch/` (f0 = 27.00 s), `03c-face-stretch/` (f0 = 40.00 s)
- Item 4: eQR3pgMiUF0 0:20–0:22 → clip `frames/04-face-stretch/` (f0 = 20.00 s). All clips are 30 fps.

**Status:** **LOCKED in v4** (approved by the user on 2026-11-10, test 3). Listed in `style_lock/locks_v4.md`.

## 0. The user's decision (2026-11-09)

The effect touches the **locked face** (`src/character/draw.ts`), so the user decided first, from three still mockups and one animated mockup (`out/vfx/face-stretch/`):

| Shown | User's answer |
|---|---|
| Level 1: new eye/mouth shapes only | not enough on its own |
| Level 2: + snap timing (squint → pop with big ring eyes, a dark toothy grin and an overshoot) | **No**: the pop faces looked **scary** (staring white eyes with a tiny pupil + a dark mouth full of teeth + heavy black rings inside the glasses). The **squint** (anticipation) was liked |
| Softer happy faces, front view only (^ ^ eyes, shiny dot eyes, open pink smile) | **No**: "too natural", flat |
| Level 3: the face slides across the head ("glance + shock") | **Liked** |
| Animated "3D face" test (`face_turn_test.mp4`): the face drawn on a sphere, turning left/right/up/down | **"Really good"**: this is the effect |
| Shock eyes for characters with glasses | **Dot eyes** (bigger shiny dot), not rings |

So the effect is: **the whole face turns on the round head like on a ball** (3D feeling), plus new eye and mouth shapes and a quick snap. We do **not** copy the reference's huge ring eyes + dark grin.

## 1. What happens in the reference, frame by frame

| Clip, frames | What we see |
|---|---|
| 04 f36–41 | Calm face, one brow up, small smirk |
| **04 f42–44** | **Anticipation:** the eyes become flat lines, a lopsided smile with a few teeth starts (2–3 frames) |
| **04 f45–47** | **Pop:** big round eyes and a wide toothy grin; all features move **up** the face. f46–47 = overshoot (the biggest), then it settles by f49 |
| 04 f49–55 | Holds; the pupils keep moving inside the eyes (the face never fully freezes) |
| 03a f49–52 | Close push-in: the mouth opens to a small "o" before the eyes change; eyes close to lines for 2 frames |
| 03a f54–63 | **Shock:** empty ring eyes with a tiny pupil, small "o" mouth, a sweat drop on the forehead that slides down a little |
| 03a f64–70 | Blink (lines) → ring eyes again → the mouth goes small; the shock fades into a flat face (f78–90) |
| **03b f33–47** | **Head turn:** eyes, glasses and mouth **slide from the side of the head to the center** as she turns to the camera (~15 frames). The head outline and the hair don't move |
| 03b f47–75 | Forced smile: clenched-teeth grid mouth, held; then open laughing mouths that change every few frames (f84–117) |
| 03c f0–60 | Big forced grin (^ ^ eyes + teeth grid), held with both arms up |
| 03c f62–76 | Wink: one eye ^, the other a dot under a flat heavy lid |
| **03c f78–90** | **Shock:** ring eyes snap on (1 frame), then lines (blink), then wide dots, then a sweat drop and a wobbly mouth |

**Rules taken from it:**
- A change of shape happens in **1–2 frames**. A move (pop, turn) takes **3–5 frames** and can overshoot.
- Between changes the face **holds**, but something small keeps moving (pupils, blinks).
- The **head outline never changes**: only the features move and change.

## 2. Our version: the 3D face

### 2.1 The turn (the core of the effect)

The face features are placed on a **sphere** (the round head, radius 0.5 head widths) and turned:

- `faceYaw` = turn left/right (radians, + = the face turns to screen right).
- `facePitch` = turn up/down (radians, + = the face looks down).

For each feature at a front-view point (x, y): angle across `θ = asin(x/0.5)`, angle down `φ = asin(y/0.5)`. After the turn:

| | Formula |
|---|---|
| new x | `0.5 · sin(θ + yaw) · cos(φ + pitch) / cos(φ)` |
| new y | `0.5 · sin(φ + pitch)` |
| squeeze across | `cos(θ + yaw) / cos(θ)` |
| squeeze down | `cos(φ + pitch) / cos(φ)` |
| hidden when | `cos(θ + yaw) · cos(φ + pitch) < 0.12` (it went around the back) |

With yaw = pitch = 0 every formula gives back the v3 position and size exactly. The far eye gets thinner and closer to the edge, the near eye stays big, and that gives the 3D feeling.

**What turns:** eyes, brows, mouth, blush, freckles, and the face parts (glasses, mustache, Pell's loupe).
**What does not turn:** the head outline, the hair, the hats (they are drawn after the face and cover it). That matches the reference (03b).

**Limits** (found in the mockup):

| Limit | Why |
|---|---|
| `facePitch` up **≥ −0.2** | further up, the eyes slide under the hair and the shako (the rifleman's laugh lost its eyes at −0.4) |
| `facePitch` down **≤ 0.35** | further down, the mouth reaches the chin outline |
| `faceYaw` **within ±0.6** | further, the far eye disappears and the face reads as a back view |

### 2.2 Glasses and other face parts

- `roundGlasses` (Mira): each lens is drawn at its turned eye position with the local squeeze. The bridge goes between the turned inner lens edges. Each **temple arm follows the sphere** from the lens to x = 0.40 (not 0.48, so it doesn't cross the whole cheek). An arm that goes around the back stops at the edge.
- `mustache`: drawn at the turned point (0, 0.15) with the local squeeze.
- **Hooks that don't know the turn** (Pell's loupe in the locked `specs.ts`, any future part): the drawing code turns the whole hook as one piece (moved to the turned face center and squeezed). This is good enough for a small part, and the locked spec file doesn't change.

### 2.3 New eye shapes (pose field `eyeShape`; missing = v3 eyes)

| Shape | Look | Used in |
|---|---|---|
| `ring` | white circle, ink outline, **tiny** pupil | shock (characters **without** glasses) |
| `bigDot` | the v3 dot, 25 % bigger, with a small white highlight | shock and happy for characters **with glasses** (user's choice), happy for all |
| `line` | flat line | squint (anticipation), blink |
| `happy` | ^ arc | laugh |
| `down` | a flatter dot, low in the eye | shy (looking down) |

The heavy lids (`eyeTired`), angry lids (`eyeSquint`) and anger brows keep working on top.

### 2.4 New mouths (`Mouth` type)

| Mouth | Look | Used in |
|---|---|---|
| `smirk` | small lopsided smile, one corner up | squint (anticipation) |
| `laugh` | wide open, dark red inside, pink tongue, thin ink line | laugh |
| `openSmile` | smaller open smile, same colors | happy |
| `open` (v3) | small dark "o" | shock (reused, no new code) |
| `wavy` (v4 heat) | wobbly line | thinking (reused) |

**Not used** (the user found them scary): a dark mouth full of teeth, huge ring eyes on a happy face.

### 2.5 The expressions (one `fx` each)

Every expression = **a quick turn** (4 frames, ease with a small overshoot, like the mockup's `backOut`) **+ new shapes on the same frame + an acting loop** (face AND body, never a static pose).
Each name has a mirrored version with `_l`: `shock` turns to screen right, `shock_l` to screen left.

| fx | Start (frames) | Face | Body | Loop (keeps acting) |
|---|---|---|---|---|
| `shock` (test 2, §7) | **no side turn.** f0 mouth `open` (eyes still normal) → f3 eyes squeeze to lines → **f5 pop + head twitch** (pitch −0.13, tilt ∓0.07 in 2 frames, back with an overshoot in 5) | `ring` (glasses: `bigDot`), brows up 1, mouth `open`; sweat drop pops at f5 (shared `sweat`) | breath in (shoulders up) before the pop, arms snap out on the pop (0.5 rad, elbows −0.2), then tremble | blink f22–24, the eyes pop open again at f25 with a half twitch; fast breathing; the drop slides; pupils shift every 16 frames; blink every 50 frames |
| `laugh` | **f0–7 anticipation**: pitch +0.16, eyes `line`, mouth `smirk`, brows −0.3, shoulders up. **f8 pop**: pitch −0.2, yaw ±0.3, tilt 0.1 | `happy` eyes, mouth `laugh`, brows 0.8 | the body bounces with the laugh, arms loose and bouncing | laugh bounce every 6 frames (pitch −0.2 ↔ −0.12, yaw 0.3 ↔ 0.24); every ~45 frames a short breath (mouth `openSmile`, 8 frames), then laugh again |
| `shy` | f0–6 turn: pitch +0.35, yaw ∓0.3, tilt −0.08 | eyes `down`, mouth `smile`, brows 0.4 | both hands come together in front of the belly, shoulders up | small sway (tilt ±0.03); every ~40 frames the eyes peek up at the camera for 8 frames, then down again |
| `think` | f0–6 turn: pitch −0.12, yaw ±0.45, tilt 0.06 | v3 dots looking up (lookY −0.8), mouth `wavy`, brows −0.2 | the free hand goes to the chin (`busyHand` rule, like the heat cloth) | eyes drift up-left ↔ up-right slowly; mouth `wavy` ↔ `flat` every ~30 frames; small head sway |
| `happy` | f0–4 small pop: pitch +0.05 → 0 with overshoot, face to the camera | `bigDot`, mouth `openSmile`, brows 0.5 | arms open a little (0.35 rad) | small bounce on the breath, blink every ~45 frames, small sway |

**Reads to check before showing** (heat lesson): the hand at the chin must read as "thinking", not as "eating" or "waving". Hands together in front must read as "shy", not as "cold". The laugh must read as joy, not as screaming.

`"none"` switches the effect off at once (the face snaps back to v3), like the other effects. A plan that needs a slow turn back uses `happy` (it turns to the camera) before `none`.

## 3. How we build it in our project

| Part | Where | How |
|---|---|---|
| Sphere turn helper | `src/character/fx.ts`: `faceProj(x, y, yaw, pitch)` + `atFace(ctx, pose, x, y, draw)` + numbers in `FACE` (limits, arm length 0.40) | the math in §2.1, taken from the mockup `src/compositions/FaceTurn.tsx` |
| Face drawing | `src/character/draw.ts` `drawFace` | **only when** `faceYaw`, `facePitch` or `eyeShape` is set: each feature is drawn through `atFace`. Otherwise the **v3 code runs unchanged** |
| New eyes / mouths | `fx.ts` (`drawEyeShape`, `drawSmirkMouth`, `drawLaughMouth`), `Mouth` type in `draw.ts` | shapes from the mockup |
| Face parts | `src/cast/parts.ts` `roundGlasses`, `mustache` | use `atFace` when the face is turned. No turn = v3 drawing |
| Other face hooks | `draw.ts`, around `spec.overFace` | turned as one piece (the turned face center + squeeze) |
| Shared drop | `fx.ts` `drawSweatDrop` (exists) | `shock` sets the pose field `sweat` |
| Timing | `src/cast/fx.ts`: `FX.shock`, `FX.laugh`, `FX.shy`, `FX.think`, `FX.happy` (+ `_l` mirrors) | the turn ease, shape switches and loops from §2.5 |
| Glasses rule | `src/cast/makeCharacter.ts` | new spec flag `glasses` (set by `roundGlasses`, like `busyHand` from `holds`) → `shock` uses `bigDot` instead of `ring` |
| Mockups | `src/compositions/FaceLevels.tsx`, `FaceTurn.tsx` (+ 2 lines in `src/Root.tsx`) | **temporary**: delete when the real effect is built |

**v3 safety:** every new pose field is optional. When they are missing, the drawing takes the old path. `tools/regress_frames.py` must **PASS** after the build.

Use in a plan: `"steps": {"fx": [["w:7", "laugh"]]}`. Off: `["w:15", "none"]`. These are face effects, so they need a **medium or close shot** (in a wide shot the turn is too small to read).

## 4. Test to show the user

`tools/vfx_tests/face_stretch_props.py` → 4 shots like the other effects (day street, day bridge with the shako, warm interior, night street), ~210 frames each, a medium-close camera on the actor. Each shot plays all five: `shock` → `laugh` → `shy` → `think` → `happy`, with sides mixed (`_l`) between shots.
Characters: Mira (glasses → `bigDot` shock), the rifleman (shako, freckles → `ring` shock), and one locked v3 character with ring eyes (Juno) to check that the hook rule works on the locked specs.

Output: `out/vfx/face-stretch/test.mp4` + two side-by-sides (reference left, ours right):
- **laugh vs 04**: aligned on the anticipation (ours f0 = 04 f42 = 21.40 s).
- **shock vs 03c**: aligned on the snap (ours f0 = 03c f78 = 42.60 s); `--ref-loop` for the short reference.

## 5. Known differences from the reference (on purpose)

- The reference's pop makes the eyes huge rings and the mouth a dark grin. **We don't**: the user found it scary. Our "pop" is the **turn** with soft shapes.
- The reference turns the face only in 03b. **We turn it in every expression**: the user's choice ("3D").
- The reference's features move up the face in the pop. Ours do it through `facePitch`, limited to −0.2 by our hair and hats.

## 6. Built (test 1, 2026-11-09)

| Part | File |
|---|---|
| Sphere turn (`FACE`, `faceProj`, `atFace`, `turnWhole`, `faceClip`), eye shapes (`drawEyeShape`), mouths (`drawSmirkMouth`, `drawLaughMouth`) | `src/character/fx.ts` |
| Hooks | `src/character/draw.ts`: `drawFace` takes the new path `drawFaceTurned` only when `faceYaw`/`facePitch`/`eyeShape` is set (the v3 eye, brow and mouth code moved into `v3Eye`, `v3Brow`, `drawMouth`, `drawBlush` with the same drawing calls); `overFace` hooks are clipped to the head and turned; a ring-eye shock becomes dot eyes when `spec.glasses`; free-hand pose (`hand`, `handFold`, `handTap`, `handFront`) with a **folded arm** for "think" (`drawFoldedArm`) |
| Glasses that turn | `src/cast/parts.ts` `roundGlasses` (`glasses: true`, `turns: true`); `src/cast/makeCharacter.ts` sets `spec.glasses`, and turns face parts without `turns` as one piece |
| Timing | `src/cast/fx.ts`: `FX.shock`, `laugh`, `shy`, `think`, `happy` (+ `_l`), numbers in `FACE_FX`. FX functions get `prev` (the pose of the effect before, at the switch: `src/episode/Episode.tsx` `fxAt`), so a chain of expressions turns on from where it was |
| Test props | `tools/vfx_tests/face_stretch_props.py` (4 shots × 240 frames: Mira / rifleman / Juno / Pell; shock f10 → laugh f60 → shy f130 → think f175 → happy f215) |
| Side-by-side | `tools/vfx_side_by_side.py` with the new `--test-from N` (our expression starts N frames into the shot) |

Fixed during the build (before the user saw it):
- The test camera pushed in too fast (the head was cut off by frame 200) → push-in 1.5 %/s, almost no drift.
- "Think" with the normal arm made a big outward hook, with the hand at the side of the neck (it read as a "chicken wing") → a **folded arm**: upper arm down to the chest, forearm up, fist under the chin, tapping now and then.
- In Mira's shock the far lens slid under the sweat drop (the drop sat on her glasses) → the drop goes on the temple the face turns **away** from.

Checks: v3 regression `tools/regress_frames.py` **PASS**. The locked anger and heat tests render the same as before (the only differences are video-compression edges over the whole frame).

Side-by-sides (§4): the shock is compared with **03a** (f48 = 2.60 s: "o" mouth, ring eyes, sweat drop in a close-up), not 03c, because 03a shows the same beat as our shock.
`side_by_side_laugh.mp4`: `vfx_side_by_side.py references/effects/videos/eQR3pgMiUF0.mp4 21.4 out/vfx/face-stretch/test.mp4 out/vfx/face-stretch/side_by_side_laugh.mp4 --shot 240 --seg 70 --test-from 60 --labels "..." --keys 0,4,8,10,12,16,30,60`
`side_by_side_shock.mp4`: `vfx_side_by_side.py references/effects/videos/VKsamN3Fk4U.mp4 2.6 out/vfx/face-stretch/test.mp4 out/vfx/face-stretch/side_by_side_shock.mp4 --shot 240 --seg 50 --test-from 10 --labels "..." --keys 0,2,4,8,14,20,30,45`

Known differences from the reference (input for the review):
- The reference shock comes with a fast camera push-in to a big close-up. Ours keeps a steady medium-close camera, because a push-in is the camera's job in the plan, not the effect's.
- The reference pop changes the size of the eyes. Ours changes the direction of the face (3D) and keeps the eyes soft (§0).
- Pell's loupe and other face hooks that don't know the turn are turned as one piece, so they squeeze a little less exactly than the glasses.

Remake: `tools/vfx_tests/face_stretch_props.py out/vfx/face-stretch/props.json` → `npx remotion render Episode out/vfx/face-stretch/test.mp4 --props=out/vfx/face-stretch/props.json --crf=16` → side-by-sides (§4).

## 7. Feedback on test 1 → test 2 (2026-11-10)

| User feedback | What changed (`src/cast/fx.ts` `shock`, numbers in `FACE_FX.shock`) |
|---|---|
| Shock: did not like the head turning to the side. It should be like the reference: a little **head twitch** (a startle) | The face stays to the camera. Reference order: the mouth opens to an "o" first (eyes still normal) → the eyes squeeze to lines (f3–4) → **pop** at f5: ring eyes (glasses: dot eyes) + sweat drop + **the head jerks back and tilts** for 2 frames (`twitch` 0.13, `twitchTilt` 0.07) and settles with an overshoot. Hold: blink, then the eyes pop open again at f25 with a half twitch; pupils shift every 16 frames. The side drop rule from test 1 is gone (no turn, the drop goes back to its default temple) |

The other four expressions (laugh, shy, think, happy) are unchanged. v3 regression: run again after the change.
Side-by-side: `out/vfx/face-stretch/side_by_side_shock_v2.mp4` (`--keys 0,2,4,5,6,8,14,30`).

## 8. Timing measured in the reference → test 3 (round 2, 2026-11-10)

The user noticed that our expressions were too long and too slow inside. In the reference the faces last only a few frames, and many come one after another. Measured on every frame of the 4 clips:

| Part of a reaction | Frames | Where |
|---|---|---|
| The change itself (pop, snap) | 1–2 | 04 f45 (one half-open frame between the squint and the big eyes) |
| Anticipation (squint before the pop) | 2–3 | 04 f42–44, 03a f52–53 |
| Blink | 1–2 | 03a f64–65, 03c f82, f88–89 |
| Main expression (held) | 10–30 | 03a ring eyes f54–63 (10), 03c wink f62–77 (16), 04 big eyes f46–60 (15+), 03b forced grin f48–78 (31) |
| Long hold (rare) | ~60 | 03c grin f0–61 |
| Small moves inside a hold | every 3–4 | 04 f46–60: the pupils look around |
| Talking mouth (lip sync) | every 1–3 | 03b f79–150 ("Wow, congratulations…") |
| A whole reaction | ~24 frames, 8 faces | 03a shock f49–72 |

So the reference feels fast because of **short transitions + short holds + frequent blinks and eye moves**, not because the main face changes all the time. Lip sync is a separate topic (our characters don't speak; the narrator does): noted as **later**.

What changed in test 3 (`src/cast/fx.ts`, all numbers in `FACE_FX`):

| Expression | Before (test 2) | Now (test 3) |
|---|---|---|
| shock | blink + reopen at f22–25; blinks every 50; pupils every 16 | ring eyes held **10 frames** after the pop (like 03a), blink f15–16 (2 frames), reopen f17; blinks every 20; pupils every 6 |
| laugh | anticipation 8 frames | **like 04**: the smile starts with normal eyes (f0) → lines (f1–2) → **pop on f3**; then "ha-ha": the mouth opens and closes and the face bounces every 3 frames |
| think | fist at the chin after 10 frames; eyes drift slowly | fist under the chin on **f5**, taps every ~10 frames; eyes dart up-left/up-right every 5 frames; "hmm" mouth every 8 |
| shy | turn 6 frames; peek every 40 | turn **3** frames; eyes shift left/right every 5; peek at the camera for 5 frames every 20 |
| happy | blink every 45 (3 frames); eyes still | pop 1 + 3 frames; **pupils look around every 4 frames** (like 04); 2-frame blink every 24 |

All blinks are now 2 frames (they were 3).
Test 3 has real-video timing: each shot (5 s) plays shock 24 → laugh 28 → think 22 → shy 20 → happy 22 → shock 16 → laugh 12 frames (`tools/vfx_tests/face_stretch_props.py`, `L = 150`).
Output: `out/vfx/face-stretch/test_v3.mp4`, `side_by_side_shock_v3.mp4` (`--shot 150 --seg 30 --test-from 6`), `side_by_side_laugh_v3.mp4` (`--shot 150 --seg 28 --test-from 30`).
