# Jump combo: jump + stretch + landing (VFX items 9 + 11) — LOCKED v4 (2026-11-10, test 3)

One reusable effect for the body: a **small hop** (item 11) and a **big jump with a stretch** (item 9, waking up with a start).
The **face is free**: the jump is only the body, on its own step channel; any expression or face effect goes on top
(the user's rule, test 2: "the big jump is not tied to one face").

References: item 11 `uRkLhDrKQeU` 0:10–0:13 (`frames/11-jump-impact`), item 9 `VS1Z_Q-Klt8` 0:33–0:37 (`frames/09-zzz-wake`).
Analysis + timing tables: `README.md` § "9 + 11. Jump combo". Key sheet: `frames/11-jump-impact/jump_keys_11_vs_09.jpg`.

## 1. Use in a plan

```json
"steps": {"jump": [["w:5", "big"]], "fx": [["w:5", "scared"]]}
```

| Channel | Values | What |
|---|---|---|
| `jump` | `hop`, `big` | the body, **with the landing dust** (default) |
| | `hop_nodust`, `big_nodust` | the same, quiet landing |
| | `none` | standing (back to normal) |
| `fx` | `scared` (new) or any face effect (`shock`, `happy`, `laugh`…) | the face. `big` + `scared` on the same word = the terrified jump of item 9 |

- Start the jump **on the word**; the take-off comes 4 frames (hop) or 2 frames (big) later.
- The whole body must be in the shot (feet and ground visible) and there must be headroom: the big jump goes up 1.35 head widths and stretches 1.15×.
- The jump sets the arms (and overrides the arms of a face effect while it runs). A hand that holds a prop moves it with the arm.
- After the landing the pose holds until the next `jump` step (`hop`: back to rest after ~10 frames; `big`: arms a little out).

## 2. Shared style (what both references do)

- Short anticipation (2–4 frames), then the take-off **snaps**: about half the height in the first frame.
- Air 8–9 frames: rise 3–4 (slowing), apex 2, fall 3–4 (speeding up).
- In the air the body is long: legs straight, feet hanging toes-down; in the big jump the whole body stretches.
  **The head never squashes or stretches.**
- The landing stops in 1 frame, no bounce, then a held pose.

## 3. Numbers (`JUMP` in `src/cast/fx.ts`)

| | `hop` (item 11) | `big` (item 9) |
|---|---|---|
| Anticipation | 4 frames crouch: knee 0.25, 0.6, 1, 1 (both knees go to screen left = knees forward in 3/4; the body drops 0.16 head widths) | 2 frames, knee 0.3, 0.35 (he sits in the reference; standing = a small crouch) |
| Air (height per frame, × height) | 0.29, 0.61, 0.84, 0.91, 1, 0.9, 0.67, 0.36 | 0.4, 0.8, 1, 0.99, 0.79, 0.42 |
| Height | 0.42 head widths (feet) | 1.35 head widths |
| Stretch | — (legs straight, toes down) | 1.08, 1.12, 1.15, 1.15, 1.15, 1.05 (width × 1/s^0.9) |
| Landing | knee 0.5, then 0.75 held 3 frames, straightens over 7 (ease out) | stops; arms pop out (0.75 rad) and settle to 0.5 in 4 frames, then hold still |
| Arms | a little back on the crouch → one hand up beside the head in the air → out for balance on the landing → rest | down along the body → a little out at the apex → swing out on the last air frame |

Face `scared` (`JUMP.scared`): eyes squeezed to lines for 3 frames (wavy mouth, brows down the first 2), then ring eyes + gritted teeth + brows up, sweat drop from frame 0, a blink at frame 16.

Landing dust (`DUST` in `src/character/fx.ts`): 2 cartoon puffs per foot (same lobes + ink outline as the anger smoke, dusty cream `#f1e9dc` / shade `#cdbfa9`), slide out low along the ground, grow, fade; life 10 frames. **Not in the references**: tested as an option and chosen by the user.

## 4. Decisions (user, 2026-11-10)

| Test | Feedback | Change |
|---|---|---|
| 1 | Likes **dust only**; no camera shake. The big jump's landing arms (wide open, hands hanging, small tremble) moved strangely from side to side | Dust on by default; shake code removed (the v3 "No shake" rule stays; item 10 shake = later, for hits only). Landing arms only a little out, held still |
| 2 | The big jump is a terrified jump (fine), but the face must be free | Jump = body only on the `jump` channel; the item 9 face became the face fx `scared` |
| 3 | Approved | Locked |

Differences from the references on purpose: big-jump landing arms (item 9 opens them wide), landing dust (not in either clip).
Later: hair spikes on the big jump (each hair/hat part is different); item 11's sideways drift toward a target.

## 5. Code

| File | What |
|---|---|
| `src/cast/fx.ts` | `JUMP` numbers, `JUMPS` (channel `jump`: `hop`, `big`, `_nodust`, `none`), face fx `scared` |
| `src/episode/Episode.tsx` | `jumpAt`: the `jump` step channel, applied after `fx` (body only) |
| `src/character/draw.ts` | pose fields `knee`, `toes`, `stretch`, `lift`, `dust`; `drawJumpLegs` (knees, pointed feet, boots follow the shin); the body stretch/drop transform, the head only rides on the neck |
| `src/character/fx.ts` | `drawLandingDust` |
| `src/three/CharacterCard.tsx` | `lift` moves the card up; the blob shadow stays on the ground, smaller and lighter (always passed: R3F keeps a removed prop's last value) |

Without the new fields everything draws as before: regression `v4cloth` and the v3 path PASS; the locked cast test (anger, sweat, 3D face, looks, 4 sets) matches pixel for pixel.

## 6. Remake the test

`.venv/Scripts/python -I tools/vfx_tests/jump_props.py out/vfx/jump/props3.json` →
`npx remotion render Episode out/vfx/jump/test3.mp4 --props=out/vfx/jump/props3.json --crf=16` →
side by side: `tools/vfx_side_by_side.py references/effects/videos/uRkLhDrKQeU.mp4 11.4333 <test> <out> --shot 100 --seg 50 --test-from 5` (hop, left actor)
and `… VS1Z_Q-Klt8.mp4 35.6667 <test> <out> --shot 100 --seg 45 --test-from 40` (big, right actor).
