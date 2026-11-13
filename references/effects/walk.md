# Walk: head + body bob, legs scissor (VFX item 12) — LOCKED v4 (2026-11-11): normal, fast, rush

A front-view walk for our camera-facing characters: each step the body dips and pushes up again, the legs scissor
(a back foot swings forward with the knee forward, the standing foot slides back under the body), and (option) the
body sways over the standing leg. The head rides on the body (no
separate nod). The face stays free (any expression or face fx while walking).

References (analysis: `README.md` § 12): `12b` the mom (subtle), `12c` from behind (sway), `12e` the cops +
the lantern walk in `13-mountains` (bouncy, the user's "pulinhos"), `12a` camera moving with the walkers.

**Bob size, the user's choice (2026-11-11):** A/B test **A subtle = 0.04** head widths vs **B bouncy = 0.15**,
each with side sway on and off.

**Decided on test 2 (user, 2026-11-11): the normal walk = `subtle_sway`** (A subtle + sway ON). B bouncy is kept
for a test at the **fast** pace: fast walks bring variety and show urgency, hurry or anguish, from the scene and script.
Full lock (plan fields in `build_props.py`, `locks_v4.md`) after the fast walk test, so both are locked together.

**Fast test 1 (user, 2026-11-11): the fast walk = B bouncy** (`bouncy_sway_fast`). He also wants a **really fast**
walk: bouncy, with **more bounces per second** to stress the speed → `_rush` = 6-frame steps (5 steps/s), test below.

## 1. Use in a plan

```json
{"who": "bram", "walk": {"from": "mark:door", "to": "mark:street_center", "at": "w:6", "pace": "fast"}}
```

| Pace | Walk name | Step | Speed | Use |
|---|---|---|---|---|
| `normal` | `subtle_sway` | 10 frames | 1.0 m/s | calm walking |
| `fast` | `bouncy_sway_fast` | 8 frames | 1.6 m/s | hurry |
| `rush` | `bouncy_sway_rush` | 6 frames (5 bounces/s) | 2.2 m/s | urgency, panic, anguish |

`tools/build_props.py` turns it into the props below: whole steps from `from`, the stop step on `to` (`WALK_PACES`;
the step frames must match `WALK` in `src/cast/fx.ts`, checked by `tools/tests/test_walk.py`). `"stop": false` =
keeps walking the same way at the pace speed to the end of the shot. A warning when the walk does not fit in the shot.

**Rush test 1 (user, 2026-11-11): "Rush is good, keep all three paces and lock it."**

## 1b. Props (what build_props writes)

| Field | Where | What |
|---|---|---|
| `"path": {"frames": [f0, f1], "points": [[x,y,z], [x,y,z]]}` | actor | the feet move along the points (straight lines, constant speed per part); replaces `pos` |
| step `"walk"` | actor steps | `subtle`, `bouncy`, `subtle_sway`, `bouncy_sway` (+ `_fast` or `_rush` for each, e.g. `bouncy_sway_fast`), `stop`, `none`. Start it on the frame the path starts (the first step starts from feet together); end it with `stop` on a **step boundary** (start + n × 10 frames): one last smaller step (dip and lift × 0.5) that brings the feet together, then the actor stands. The path should go on half a stride (10 frames) for the stop step |
| camera `drift` | shot | m/s; = the walking speed to travel with the walkers (like 12a) |

Speed in the test: 1 m/s = 0.33 m per step (3 steps/s), so the feet don't slide.

## 2. Reference vs ours

| | Reference | Ours (`WALK` in `src/cast/fx.ts`) |
|---|---|---|
| Step length | a dip every 9–10 frames (12b, 12e), 6–7 (12c) | 10 frames |
| Rush walk | (the user's idea: faster than the cop) | `_rush` names: `WALK.rush` = 6-frame steps (5 bounces/s), same shape as fast; test speed 2.2 m/s = 0.44 m per step |
| Fast walk | 12e, the front cop hurrying out (f10–f26, cap tracked): a step every **~8 frames** (tops f15, f23), the dip **snaps** down 30 px in 2 frames (f23→f25) and rises over ~5; ≈0.15–0.2 head widths; the 2nd cop (through the door) sways ±0.06 | `_fast` names: `WALK.fast` = 8-frame steps, down 2 frames, up 5, the foot leaves the ground earlier (0.15); test speed 1.6 m/s = 0.43 m per step. Same sizes A / B |
| Dip shape | down fast (2–3 frames), up slower (5–7) | down 3 frames, up 6, 1 at the top |
| Size | subtle ≈0.03 (12b), middle ≈0.1 (12c), bouncy ≈0.2 (12e, 13) | A subtle 0.04 (all dip); B bouncy 0.15 = dip 0.10 + a 0.05 hop at the top (both feet off the ground) |
| Legs | 12b: the legs **scissor** — the front leg reaches forward with a bent knee, the back leg trails; the side movement is **soft** | each foot has a place front ↔ back (`strideL/R`, −1..1): the standing foot slides front → back during the step, the back foot swings to the front (lift 0.16, toes down toward the camera); a foot behind is drawn up to 0.13 higher (further away; the front foot stays on the ground line). The swinging knee comes **forward**: up 0.1 + 0.07 to screen left (the jump's `KNEE.dir`) + 0.02 to its own side. Standing leg = the v3 S curve (`WALK_LEG`, `drawWalkLegs` in `draw.ts`) |
| Sway | 12c: head ±0.04 head widths left/right each step, body leans | `_sway`: body above the hips shifts ±0.04 and leans ±0.035 rad over the standing leg |
| Arms | still in 12b (she holds things) | still (not changed by the walk) |

## 3. Code

- `src/character/draw.ts`: pose fields `walkDrop`, `footL`, `footR`, `strideL`, `strideR`, `sway`, `lean`; `drawWalkLegs`; the upper body
  (torso, arms, head) moves with `upperBody()` (the jump's `drop` path, + sideways shift and lean around the hips).
  Without these fields the drawing is unchanged.
- `src/cast/fx.ts`: `WALK` numbers + `WALKS` (step channel `walk`), `walkStep` (one step), `walkStop` (the `stop` step); the bouncy hop uses the jump's `lift` (the card
  moves up, the shadow stays on the ground).
- `src/episode/Episode.tsx`: `walkAt` (step channel `walk`), `pathAt` (actor `path`); type in `types.ts`.

## 4. Tests

**Test 1 feedback (user, 2026-11-11):** the up/down bob is good. The legs bent far too much **to the sides** (knee
out 0.3 × √lift); the reference has some side movement but soft. And there was **no forward leg movement**: the
walkers seemed to slide. Look at 12b: the forward step. Sway: decide again on test 2 (the leg problems got in the way).
→ Test 2: scissor legs (front/back feet), knee forward, soft side movement; `stop` step.

Test 1 (2026-11-11): `.venv/Scripts/python -I tools/vfx_tests/walk_props.py out/vfx/walk/props1.json` →
`npx remotion render Episode out/vfx/walk/test1.mp4 --props=out/vfx/walk/props1.json --crf=16` → side by side
with 12b and 12e (`out/vfx/walk/side_by_side1_*.mp4`). Shots: day street Bram sway off / on, night street Mira
sway off / on (camera travels with them), day street riflemen start + stop (camera still). LEFT = A subtle,
RIGHT = B bouncy in every shot.

Test 2 (2026-11-11): same shots, `props2.json` → `test2.mp4` → `side_by_side2_12b.mp4`, `side_by_side2_12e.mp4`;
shot 5 ends with the `stop` step.

Fast test 1 (2026-11-11): `.venv/Scripts/python -I tools/vfx_tests/walk_fast_props.py out/vfx/walk/props_fast1.json`
→ `out/vfx/walk/fast1.mp4` → side by side with 12e (the front cop, from 41.33 s). Shots: day street Bram, night
street Mira (camera travels with them), riflemen start + stop (camera still): LEFT `subtle_sway_fast`, RIGHT
`bouncy_sway_fast`; shot 4 = pace A/B: LEFT normal `subtle_sway`, RIGHT `subtle_sway_fast`, both walk 3 m and stop.

Rush test 1 (2026-11-11): `walk_fast_props.py out/vfx/walk/props_rush1.json rush` → `out/vfx/walk/rush1.mp4`. Shots:
day street Bram, night street Mira: LEFT `bouncy_sway_fast` (8) | RIGHT `bouncy_sway_rush` (6), both at 2 m/s, camera
travels with them (only the bounces per second differ); shot 3: normal | fast | rush, each walks 3 m and stops.
