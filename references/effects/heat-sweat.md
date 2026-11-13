# Effect recipe: heat sweat — a sweat drop + a tired, hot body

**Reference:** 7xS87iActkU 0:36–0:37.5, clip `frames/02-heat-sweat/` (f0 = 36.00 s, 30 fps). The narration says "Then summer comes…" over an orange desert.
**Status:** **LOCKED in v4** (approved by the user on 2026-11-09, test 2). Listed in `style_lock/locks_v4.md`.

Two effects come out of this item:

| fx name | What it is | Reused by |
|---|---|---|
| `sweat` | **Only the sweat drop**, a badge on top of whatever expression the actor has | items 3, 5, 9, 10 (shock, focus lines, waking up, impact) |
| `heat` | The drop **+ tired, hot acting**: heavy half-closed eyes, wavy mouth, panting, a cloth to fan and wipe the temple | heat, exhaustion, hard work |

## 1. What happens, frame by frame (reference)

| Clip frames | What we see |
|---|---|
| f0–26 | Dissolve from a station to a desert (calendar "MAY", thermometer). No character |
| f27–33 | The camera pans right; the character slides into the frame. The drop is **already there** |
| f34–45 | Held pose. The camera slowly pulls back. The character barely moves: a small head bob, the fist with the cloth shakes a little |

The heat comes from **the scene** (orange desert, hard light) **and the character**: tired face + drop + a cloth held up.

## 2. The drop (measured on f31, head width 375 px)

- **Where:** at the temple, beside the outer end of the brow, just under the cap brim. Head-local ≈ **x 0.31–0.34, y −0.05…−0.1** (on the side of the head away from the raised arm).
- **Size:** blue inside ≈ **0.075 head widths**; with the outline ≈ **0.10** wide, a bit taller with its tip.
- **Shape:** a teardrop, round bottom, tip up and tucked toward the head edge.
- **Color:** light sky blue, measured median **`#AADFE7`** (170, 223, 231), white highlight on the upper inner side.
- **Outline:** thick dark ink, as thick as the face lines (our style already wants it).
- **Motion:** none in this clip (it stays still). In item 3 (f52–78) the drop sits higher, on the forehead, and **slides down a little**.

## 3. The tired, hot face and body

- **Eyes:** half closed. A flat upper lid line cuts the top half of each pupil ("heavy lids").
- **Brows:** relaxed, a little raised. **Mouth:** a wobbly wavy line (discomfort). (The reference has a curly mustache; our characters get a wavy mouth.)
- **Arm:** one arm up beside the head, the fist holding a red cloth (the bandana). It shakes a little.
- **Head:** small bobs, the body slumps (legs bent).

## 4. How we build it (test 1)

Our acting must never be a static pose (feedback from anger), so `heat` plays a **loop of three phases** instead of the held pose:

| Phase | Frames | Body | Face | Drop |
|---|---|---|---|---|
| start | 8 | arms drop limp, head droops | lids close to half, wavy mouth | pops in (frame 3) |
| **fan** | 36 | test 1: the cloth hand up beside the head (like the reference), swinging. **Changed in test 2** (see §7): hand in front of the chin, fast flicks toward the face | test 2: eyes close, face up, "aah" | slides down slowly |
| **wipe** | 20 | the head leans into the hand; the cloth dabs the temple in 2 strokes (arm drawn **over** the head) | eyes nearly closed (relief) | **wiped off** when the cloth touches it |
| **slump** | 34 | arm drops with the cloth hanging; a big tired exhale (shoulders/breath), head droops | a slow long blink, then **panting** (mouth open/wavy every 5 frames) | **a new drop** pops in (frame 14) |

Then fan → wipe → slump again (90-frame loop).

| Part | Where | How |
|---|---|---|
| Drop | `src/character/fx.ts` `drawSweatDrop` + `SWEAT` numbers | Pose field `sweat` = frames since the drop appeared (< 0 = none). Pops in over 4 frames (small overshoot), then slides down 0.05 head widths over 60 frames. Ink outline, white highlight, darker blue at the bottom. Drawn after the hat (`overHead`), on the side `sweatSide` |
| Heavy lids | `fx.ts` `tiredClip` / `drawTiredLid`, hook in `drawFace` | Pose field `eyeTired` 0..1 (0.5 = half closed, 1 = closed line). Like the angry lid, but flat |
| Mouths | `fx.ts`, `Mouth` type in `draw.ts` | New `"wavy"` (wobbly line) and `"pant"` (small open mouth, tongue) |
| Cloth | `fx.ts` `drawCloth`, hook in `drawCharacter` | Pose fields `cloth`, `clothArm`, `clothElbow`, `clothFront`, `clothTilt`. The cloth goes in the **free hand**: new spec field `busyHand` (set by the parts that hold something: Mira's clipboard → screen-right, the rifle → screen-left), so Mira wipes with her left hand and the rifleman with his right. During the wipe that arm is drawn after the head (in front of the face) and the head tilts toward the hand, so the short arm can reach the temple. The drop sits on the same side, so the cloth wipes it |
| Timing | `src/cast/fx.ts` `FX.sweat`, `FX.heat` | `"steps": {"fx": [["w:5", "heat"]]}` or `["w:5", "sweat"]` |

**Cloth look:** a red bandana with light dots (like the reference idea), ink outline, a knot above the fist and two tails that swing with the arm. Red reads on skin, on Mira's green and on the rifleman's green.

## 5. Test to show the user

Same 4 shots as anger (day street, day bridge with shako, warm interior, night street), 100 frames each, `heat` from frame 20.
Output: `out/vfx/heat-sweat/test.mp4` + `side_by_side.mp4` (reference left, aligned so the character appears on the same frame) + key frames.

## 6. Built (test 1, 2026-11-09)

| Part | File |
|---|---|
| Drop, heavy lids, `wavy` / `pant` mouths, cloth (drawing) | `src/character/fx.ts` (numbers in `SWEAT`, `CLOTH`) |
| Hooks in the character drawing | `src/character/draw.ts`: lids in `drawFace`, the 2 mouths, the drop after the hat, the cloth arm (free hand; in front of the head while wiping; head tilt toward it) |
| Free hand | `busyHand` on the spec, from `Part.holds` (`src/cast/parts.ts`: clipboard → 1, rifle → −1; `makeCharacter.ts`) |
| Timing (`fx` step → pose fields) | `src/cast/fx.ts` (`FX.sweat`, `FX.heat`) |
| Test props | `tools/vfx_tests/heat_sweat_props.py` (4 shots of 120 frames, `heat` from frame 10; `--fx sweat` for the drop only) |
| Side-by-side | `tools/vfx_side_by_side.py` with the new `--ref-loop` (the reference shot cuts away after ~38 frames, so its first 27 frames repeat; after that the character makes the next beat's surprised face) |

Use in a plan: `"steps": {"fx": [["w:5", "heat"]]}` (or `"sweat"` for the drop only, on top of the expression). `["w:20", "none"]` switches it off.

Fixed during the build (before the user saw it): the first cloth (round knot with dots) looked like a strawberry → a handkerchief with a small pinched knot and two wide tails. The cloth only reached the edge of the head when wiping → the head leans 0.22 rad into the hand.

Known differences from the reference (input for the review):
- The reference **holds one pose** (arm up, cloth still); ours plays a fan → wipe → slump loop (our "never static" rule).
- The reference drop is a bit smaller (0.10 head widths with its outline); ours is ≈0.12 so it reads in a medium shot.
- During the wipe the arm crosses in front of the cheek (our arms are short, so the head leans into the hand).
- The heat itself (orange desert, hard light) is the set's job, not the effect's. We have no desert set yet.

Remake: `tools/vfx_tests/heat_sweat_props.py out/vfx/heat-sweat/props.json` → `npx remotion render Episode out/vfx/heat-sweat/test.mp4 --props=out/vfx/heat-sweat/props.json --crf=16` → `tools/vfx_side_by_side.py references/effects/videos/7xS87iActkU.mp4 36.9 out/vfx/heat-sweat/test.mp4 out/vfx/heat-sweat/side_by_side.mp4 --shot 120 --seg 120 --ref-loop 27 --labels "day street,day bridge (shako),warm interior,night street" --keys 5,25,45,62,66,86,100,112`

## 7. Feedback on test 1 → test 2 (2026-11-09)

| User feedback | What changed |
|---|---|
| The fan looks like **waving hello**, not fanning the own face (the fan pose was almost our `wave` pose: hand up beside the head, swinging away from it) | **Hand in front of the chin:** new pose field `clothReach` 0.47 (`armPoints` takes a `reach`; the hand comes closer to the shoulder and the elbow bends out to keep the arm length; default 1 = v3). **Fast flicks toward the face:** the cloth turns around the hand (`clothRot` 2.27 ± 0.38 rad, the tails point at the face), a back-and-forth every ~4 frames (`FLICK` 1.6), the arm only moves a little. **The face enjoys the air:** eyes almost closed (`eyeTired` 0.86), face up (`lookY` −0.35), small open mouth "aah". **Air lines:** 2 short outlined white strokes beside the cloth on the fast part of each stroke (`drawFanAir`, `clothAir`); strokes past the cloth tip landed on the face and looked like scribbles, so they sit beside the cloth |

The fan arm is drawn in front of the head (like the wipe). Wipe and slump are unchanged.
Side-by-side: `out/vfx/heat-sweat/side_by_side_v2.mp4` (`--keys 5,22,31,45,66,86,100,112`).
