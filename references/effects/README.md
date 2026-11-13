# VFX references (style v4)

New effects for the videos, learned from reference Shorts. We copy the **idea and the motion**, never the other channel's art.
Branch `style-v4`. Each effect is **locked into v4 only after the user approves** its test (reference and test side by side).

## Files

| Path | What it is |
|---|---|
| `references-vfx.txt` | The user's list: `link | description | time` (descriptions may be in Portuguese) |
| `README.md` | This file: the list as a table, status, analysis notes for effects not built yet |
| `<effect>.md` | The recipe of one effect (written when we start building it) |
| `videos/` | Downloaded reference Shorts (git-ignored) |
| `frames/<NN-name>/` | Every frame of the clip `fNNN.png` + `sheet.jpg` (git-ignored) |

Make the frames again: `.venv/Scripts/python -I tools/vfx_clip.py references/effects/videos/<id>.mp4 <NN-name> <start> <end> [--every N]`

## Work order and status

Clip frames are numbered from the clip start (30 fps).

| # | Effect | Video, time | Clip folder | Status |
|---|---|---|---|---|
| 1 | Anger: head fills purple + smoke from the temples | 7xS87iActkU 0:16–0:19 | `01-anger-smoke` | **LOCKED v4** (2026-11-09) → `anger-smoke.md` |
| 2 | Heat sweat (desert, hard sun) | 7xS87iActkU 0:36–0:37.5 | `02-heat-sweat` | **LOCKED v4** (2026-11-09) → `heat-sweat.md`; shared drop = fx `sweat` |
| 3 | Face stretches and moves with strong expressions | VKsamN3Fk4U 0:01–0:04, 0:27–0:32, 0:40–0:43 | `03a/b/c-face-stretch` | **LOCKED v4** (2026-11-10, test 3) → `face-stretch.md`: the **"3D face"** (the face turns on the round head), fx `shock`, `laugh`, `shy`, `think`, `happy`. Later: lip sync |
| 4 | Same as 3 | eQR3pgMiUF0 0:20–0:22 | `04-face-stretch` | **LOCKED v4** together with 3 → `face-stretch.md` |
| 5 | Lines on the edges (camera feeling) | VS1Z_Q-Klt8 0:04–0:06 | `05-speed-lines` | **LOCKED v4** (2026-11-11, test 1) → `edge-lines.md`: shot field `lines` + camera `punch`; for anger / shouting / shock |
| 6 | Tears from laughing | VS1Z_Q-Klt8 0:06–0:08 | `06-laugh-tears` | analysed |
| 7 | Depth: city view | VS1Z_Q-Klt8 0:10–0:17 | `07-depth-city` | analysed; layers + haze + parallax partly built with 8 (bridge) |
| 8 | Depth: background filling | VS1Z_Q-Klt8 0:32–0:34 | `08-depth-filling` | **LOCKED v4** (2026-11-11, bridge) → `depth-filling.md`: B (most props) + far land (fields, town, ~200 trees, uneven ridges); corner branch for close shots only |
| 9 | "Zzz" while sleeping + body stretch when waking with a start | VS1Z_Q-Klt8 0:33–0:37 | `09-zzz-wake` | jump part **LOCKED v4** with 11 (2026-11-10) → `jump.md`; Zzz + hair spikes = later |
| 10 | Camera shake on impact (hits the jail door) | VS1Z_Q-Klt8 0:38–0:40 | `10-camera-shake` | analysed; tested on jump landings and **dropped** (2026-11-10); maybe later for real hits only |
| 11 | Jump + impact: a natural jump style (added 2026-11-10) | uRkLhDrKQeU 0:10–0:13 | `11-jump-impact` | **jump combo** with 9: analysed 2026-11-10 (below), key sheet **LOCKED v4** (2026-11-10, test 3) → `jump.md`: step channel `jump` (`hop`, `big`, landing dust), face free (+ face fx `scared`) |
| 12 | Walk: small body twitches while walking feel real (added 2026-11-10; more refs 2026-11-11) | a 0m6G8pDtzNs 0:04–0:07 · b ZDy3xXA2iHk 0:59–1:03 · c VKsamN3Fk4U 0:08–0:10 (from behind) · d VKsamN3Fk4U 0:37–0:42 (+ e 0:41–0:46, the cops) · bonus: VS1Z_Q-Klt8 0:44–0:46 (lantern walk, in `13-mountains`) | `12a-walk-side`, `12b-walk`, `12c-walk-back`, `12d-walk-cops`, `12e-walk-cops-more` | ⭐ **LOCKED v4** (2026-11-11) → `walk.md`: actor field `walk` with 3 paces, `normal` (`subtle_sway`), `fast` (`bouncy_sway_fast`), `rush` (`bouncy_sway_rush`); legs scissor, body sways; stop step |
| 13 | Mountains: uneven shapes bring realism (added 2026-11-11) | VS1Z_Q-Klt8 0:44–0:47 (landscape from ~0:46.2) | `13-mountains` (every 3rd frame) | first uneven ridges built and locked with 8 (`MountainRange`, bridge); the rest **parked** (2026-11-11, user: only if backgrounds need to get better) → `PLAN.md` "Later" |

## Things found across the whole list

- **The sweat drop is everywhere:** in items 2, 3, 5, 9 and 10. It's the cheapest effect with the biggest reuse, so build it once as a shared "badge". Built with item 2: fx `sweat` (drop only) and the pose field `sweat`, which later effects can set too.
- **Items 3 and 4 touch the locked character design** (`src/character/draw.ts`). Decided 2026-11-09: the face may **turn on the round head** (3D) with new eye/mouth shapes; no huge ring eyes + dark toothy grin (too scary); characters with glasses use dot eyes in shock. Details: `face-stretch.md` §0.
- **Item 10 changes a v3 rule.** `locks.md` §2 says "No shake". Tested on jump landings (2026-11-10): the user kept "No shake".
- **Items 7 and 8 are set-building, not effects.** They belong in the set-building checklist (`src/world/sets/README.md`), not in a per-shot effect.

## Analysis notes (effects not built yet)

### 2. Heat sweat (`02-heat-sweat`, f28–45)
- A single **light-blue drop** at the temple, high on the side of the head, under the cap. It has a white highlight and a dark outline, about 0.12 head widths tall.
- It is already there when the shot starts and stays still. The "heat" comes from the scene: an orange desert, the character wiping his forehead with a cloth (arm up), and a tired half-closed look.
- In item 3 (f52–78) the same drop sits on the forehead during a shock and slides down a little.

### 3 + 4. Face stretch (`03a/b/c`, `04`)
What really happens is **expression changes with in-betweens and exaggerated shapes**, not a rubber head:
- **Snap with anticipation** (04 f42→46): squint for 2–3 frames (eyes become lines, the smile starts), then **pop** to huge round eyes and a big toothy grin. The features move up the face. Then 1–2 frames of overshoot and it settles.
- **Features slide across the round head** to show a head turn (03b f33→48). Eyes, glasses and mouth slide from the side of the face to the center as she turns to the camera. The head outline stays the same.
- **Big mouth shapes:** a clenched teeth grid (forced smile), a wide open laugh with tongue, a small "o" (shock).
- **Big eye shapes:** empty circles (shock, 03a), "@" shocked eyes (03c f78–84), winks, closed lines for blinks.
- Changes happen in **1–2 frames**. The face holds still between changes.

### 5. Edge lines (`05-speed-lines`, f22–36, 0.5 s)
- **Thin white tapered lines** come in from the frame edges (top and sides) and point toward the character's head. They are anime "focus lines".
- About 8–12 lines at once, slightly see-through. **New random lines every 1–2 frames**, so they flicker.
- They come with a **fast push-in** and a shocked face (empty round eyes and a sweat drop). They stop when the camera move ends.

### 6. Laugh tears (`06-laugh-tears`, f14–31)
- The eyes are **closed upside-down arcs** (^ ^) and the mouth is wide open with teeth.
- **Small light-blue drops spray out** from the outer eye corners in a short arc to both sides. There are 2–3 drops per side, new ones every few frames.
- The whole body **rocks and bends forward** with the laugh. Several characters do it at once.

### 7. Depth: city (`07-depth-city`)
- Clear **layers**: foreground (balcony railing, banner, character), middle (red carpet, rows of soldiers that get smaller with distance), back (castle walls, towers), far (mountains in light blue haze).
- Far things are **lighter and bluer** (atmospheric haze). Repeated rows of the same object show scale.
- A slow camera move makes the layers slide at different speeds (parallax).

### 8. Depth: filling (`08-depth-filling`)
- Every layer is **full of props**: vegetable beds, a campfire, a clothesline, pots and a watering can in front; the character and a big jar in the middle; fields, houses and a castle behind; mountains and the sun at the back.
- Props shrink correctly with distance. Warm haze ties the layers together. A tree branch frames the top corner.
- **Caution (user, 2026-11-11):** this farm shot is the only scene of the channel with such a massive depth of view: a different style of scene, the target for a full background, not the norm for every shot.
- Built and locked on the bridge (2026-11-11): `depth-filling.md` (user chose B = the most props; eye-level cameras need tall props in their view cones).

### 9. Zzz + wake with a start (`09-zzz-wake`)
- **Zzz:** 3–4 dark "Z" letters above the head in a slanted line going up. They get **bigger as they rise**, tilt a little and fade at the top. A new Z appears every ~8 frames (f4–36).
- **Wake** (f90–100, 10 frames): 2 frames of anticipation (eyes close, small squash). Then a **jump with a big vertical stretch**: the body gets tall and thin, the feet leave the ground, the hair stands up in spikes around the head, and the eyes go wide round (f92–96). Then the character falls back with arms spread out (f97–99), lands, and the hair spikes stay.

### 9 + 11. Jump combo: jump + stretch + landing (one effect, analysed 2026-11-10)
Measured frame by frame (head and shorts/robe found by colour, feet = lowest ink pixel; 30 fps, clip frame numbers).
Key frames of both: `frames/11-jump-impact/jump_keys_11_vs_09.jpg`. In both clips the camera keeps its own slow move
(11: slow tilt + push-in; 9: slow pull-out). It is not tied to the jump, so it is not part of the effect.

**Item 11, the small hop** (`11-jump-impact`; he hops to bump a fruit with his head):

| Phase | Frames | Count | What happens |
|---|---|---|---|
| Anticipation | f53–56 | 4 | knees bend forward, body leans a little, head drops 0.12 head heights, legs 9 % shorter, eyes close |
| Take-off | f57 | 1 | legs snap straight, feet hang with the toes down, one hand up; the head travels **46 % of the whole rise in this one frame** |
| Rise | f57–60 | 4 | slowing down: 56 → 29 → 22 → 12 px per frame |
| Apex | f60–61 | 2 | almost still; body long and straight, feet 0.43 head heights (≈ 0.12 body) above the ground |
| Fall | f62–65 | 4 | speeding up: 6 → 14 → 18 → 42 px; the knees start to bend on the last frame |
| Landing | f66–68 | 3 | stops in **1 frame**, knees bent (legs −6 %), **no bounce**, held |
| Settle | f69–75 | 7 | legs straighten slowly (ease out), blink f74–75 |

Ring eyes + wavy mouth from take-off on (surprise). He drifts 0.55 head widths sideways toward the fruit while in the air. Total ≈ 23 frames (0.75 s).

**Item 9, the big wake-up jump** (`09-zzz-wake`, f88–109; he sits asleep, then jumps up and lands standing):

| Phase | Frames | Count | What happens |
|---|---|---|---|
| Anticipation | f90–91 | 2 | eyes squeeze shut to lines (sweat drop is already on from f87) |
| Take-off + stretch | f92 | 1 | body gets long and thin (the head keeps its shape), eyes shut, gritted-teeth mouth, arms straight down along the body, hair spikes start; **49 % of the rise in this frame** |
| Rise | f92–94 | 3 | 105 → 71 → 36 px (slowing) |
| Apex | f94–95 | 2 | ring eyes + teeth, feet hanging under the robe, hair spikes full; 1.4 head heights above his standing height. Body **≈ 1.15× taller, 0.88× narrower** at f94–96 (robe width / head width, camera zoom removed) |
| Fall | f96–98 | 3 | 36 → 64 → 72 px (speeding up); the body gets its normal length back, the arms swing out |
| Landing | f98–99 | 2 | stops in 1 frame, no visible squash, no bounce |
| Hold | f100–109+ | 10+ | arms spread wide, hair spikes stay, blink f106–107 |

Straight up (no sideways drift).

**What both share = the style:**
- **Short anticipation** (2–4 frames), then the take-off **snaps**: about half the height in the first frame.
- **Air time 8–9 frames:** rise 3–4 (slowing), apex 2, fall 3–4 (speeding up). Like gravity, but snappier going up.
- **In the air the body is long:** legs straight with the feet hanging toes-down (11), or the whole body stretched (9). **The head never squashes or stretches**, only the body.
- **Surprised face in the air:** ring eyes in both (+ sweat drop and gritted teeth in 9).
- **Landing:** stops in 1 frame, **no bounce**, then a held pose (bent knees that straighten over ~7 frames in 11; arms spread wide in 9).
- **No impact effects on landing:** neither clip has dust, impact lines or a camera shake. Item 10's shake comes from a hit (slamming into the bars), not from a landing.

**What differs = the options:** height (hop 0.43 vs big 1.4 head heights), stretch (small vs ≈ 1.15×), sideways drift (11 only), landing pose (bent knees vs arms out), hair spikes (9 only; they depend on each hair/hat part).

### 10. Camera shake (`10-camera-shake`, f30–54, 0.8 s)
- Measured with phase correlation on the top of the frame: the frame-to-frame jump is **2–7 px at 1080 px width**, in a **random direction every frame**. The offset from rest is about ±3–4 px (≈0.3–0.4 % of the frame width): small, but easy to feel.
- Amplitude stays about the same for 24 frames, then stops within 2–3 frames. The slow camera drift keeps going under the shake.
- It starts on the hit (the character slams into the bars) and the character's face is in shock (round eyes and a sweat drop).

### 12. Walk (`12a`–`12e` + the lantern walk in `13-mountains`, analysed 2026-11-11)
Measured by tracking a head (template match or the cap/hat color) against a still point in the set; numbers are rough (±3 px).
Head width is the ruler (our heads: 0.55 m).

| Clip | Who / view | What the body does | Rhythm | Head bob (top to bottom) |
|---|---|---|---|---|
| 12a f24–f90 | boss + employee arm in arm, toward a camera that moves with them | legs scissor (cross in front), the two heads bob a little **out of step** | ~2 steps/s | too noisy to measure (moving camera); use it for the look, not numbers |
| 12b f76–f104 | the mom (teal, glasses) walks out of the crowd toward the camera, camera pans with her | soft: one knee bends and lifts at a time, the body tilts a little side to side | a head dip every **9–10 frames** (f86, f95) = ~3 steps/s | ~6–11 px on a ~330 px head = **≈0.02–0.03 head widths**: subtle |
| 12c f24–f58 | the man in the yellow suit seen **from behind**, walking away | **side sway**: head center right (f29, f40, f53) / left (f35, f46, f58), ±12 px on ~300 px; the body **leans** to one side every 2nd step (its side stripe shows, f37–38, f51) | a dip every **6–7 frames** (f38, f45–46, f51–52) | ≈**0.1 head widths** |
| 12d f40–f76 | the man in the suit walks from the door toward the camera (head ~110 px) | — | — | no visible bob at this size (smooth rise as he comes closer) |
| 12e f23–f42 | **the cops** (the user's "pulinhos"): the front cop comes through the door and stops | a clear **hop-like dip**: down 30 px in 3 frames (f23→f26), up 38 px over 6 (f26→f32), one small 6 px dip (f33), settles as he stops | down fast (3) / up slow (6) | 30 px on a ~130 px cap ≈ **0.2 head widths**: big, bouncy |
| 13 f0–f28 | lantern walk toward the camera (castle behind) | bouncy: up 26 px (f0→f10), down 49 px (f10→f17), up again (f17→f27); lantern in the hand. The 2nd half (f40–f58) swings more but the camera also tilts there: not trusted | ~7 frames down, ~10 up | ≈**0.2 head widths** |

**What is common:**
- The head and body move **together** (the head rides on the body; no separate head nod).
- Each step = one **dip**. The dip is **fast** (2–3 frames, the foot lands) and the rise is **slower** (5–7 frames). Not a smooth sine: a small "drop and push up".
- Front/back views add a **side sway** (left/right with each step) and a small body **lean** every second step.
- Two **sizes** in the references: **subtle** (12b, ~0.03 head widths: calm walking) and **bouncy** (12e cops, 13 lantern, ~0.2: the "pulinhos", lively or important walking). 12c is in between (~0.1).
- Legs: one knee bends and lifts at a time; arm-in-arm walkers scissor their legs.

**Built and LOCKED 2026-11-11** (`walk.md`): the user chose the bob sizes A 0.04 / B 0.15; normal = A + sway,
fast and rush = B. The text below is the analysis before building.

**Open for the user (before building):** the user's first idea (2026-11-11, said while tired) was "head + body bob, subtle, not too much" = 12b size. The cops he pointed at are the **bouncy** size. Offer an **A/B test**: subtle (≈0.03) vs bouncy (≈0.15–0.2), maybe a middle (≈0.1, 12c), plus the side sway on/off. **Today (checked 2026-11-11): there is no character walk.** Actors stand on marks (`pos`); the only motion like it is the bridge set's `march` level, which bobs the soldiers in step through `actorOffset` (`src/world/sets/Bridge.tsx`, `src/episode/sets.tsx`). A walk needs: moving `pos` over frames (a track), legs stepping (like `drawJumpLegs` in `draw.ts`), and the bob/sway on top.

### 13. Mountains (`13-mountains`, the landscape from ~f75 = 0:46.5)
- Far mountains are **very faint**: almost the sky color, lost in the warm haze (strong atmospheric perspective).
- Their ridges are **uneven**: the two slopes of one mountain differ in steepness, with small shoulders and bumps; no clean cones. One big mountain on the left, smaller peaks on the right.
- In front: layered rolling hills with field strips and hedgerows, then the town, then trees and the characters. Each layer is lighter and less contrasted with distance.
- Set-building item (like 7 and 8): goes into the set-building checklist (`src/world/sets/README.md`) when we build a set with mountains.
- **Snowy mountains built (2026-11-12, scenes plan 4):** `SnowPeak` (near: uneven ridges, shoulder, snow cap with teeth) + `SnowRange` (far, capped haze) in `src/world/kit/snow.tsx` (`references/sets/KIT.md` § Snow). The green `MountainRange` (bridge) is unchanged; its A/B polish stays parked (PLAN.md "Later").
