# Edge lines: the camera feeling (VFX item 5) — LOCKED v4 (2026-11-11, test 1)

Anime "focus lines": thin tapered lines come in from the frame edges and point at the character, with a short
fast push-in. They say "this moment hits".

**When (the user's rule, 2026-11-11):** to **intensify** a strong expression — **anger** and a character **shouting / getting worked up**; also a shock. On the word of the outburst, with the face fx. A short beat, a few per video at most.

Reference: `VS1Z_Q-Klt8` 0:04–0:06 (`frames/05-speed-lines`, clip frames f22–f36 = 0.5 s).

## 1. Use in a plan

```json
{"set": "night_street", "camera": {"preset": "push_in", "aim": "mark:door", "punch": "w:6"},
 "lines": "w:6",
 "actors": [{"who": "bram", "at": "mark:door", "steps": {"fx": [["w:6-4", "shock"]]}}]}
```

| Field | Where | What |
|---|---|---|
| `"lines": "w:6"` | shot | edge lines from word 6, 15 frames. Long form: `{"at": "w:6", "len": 15, "center": [0.5, 0.45], "n": 22}` (`center` = the screen point they aim at, fractions; default the camera aim = screen center) |
| `"punch": "w:6"` | shot camera | fast push-in 1.15× in 0.27 s on that word (long form `{"at", "factor", "dur"}`). Not with the `fast_entry` preset |
| `fx` `shock` | actor | starts 4 frames **before** the lines, so the face pops 1 frame after they start (like the reference) |

The effect parts are separate: lines without the punch, or the punch without lines, both work.

## 2. What the reference does (measured)

| | Reference | Ours (`src/film/EdgeLines.tsx`) |
|---|---|---|
| Timing | f22 2–3 lines → full at f24; peak f24–f31; fewer and fainter f32–36; gone f37 | `RAMP` 20 %, 55 %, then all; last 5 frames fewer + fainter; `len` 15 |
| Count | ~15–25 at the peak | 22 slots around the circle |
| Flicker | new random lines every 1–2 frames | each line lives 2 frames, half change on odd frames, half on even |
| Shape | tapered triangles, 6–14 px wide at the edge, pointed toward the head | 5–14 px at the border → point |
| Length | top lines long (almost to the head), side lines shorter | 40–82 % of the way to the center, never inside the clear oval (0.24 W × 0.13 H) |
| Color | mostly white (opaque), ~40 % see-through dark grey | white 0.82–1, `#3a3442` 0.5–0.7 |
| Camera | push-in ≈1.15× in 8 frames (hairpin 190 → 218 px, f22–f30, ease-out) + a quick sideways swing | `fast.at` push-in 1.15× in 0.27 s; **no swing** (our moves have a fixed direction) |
| Face | squeezed eyes → ring eyes + sweat drop | the locked fx `shock` |

## 3. Code

| File | What |
|---|---|
| `src/film/EdgeLines.tsx` | the lines (SVG over the 3D shot, under the grade and captions) |
| `src/episode/types.ts`, `Episode.tsx` | shot field `lines` |
| `src/film/camera.ts` | `fast.at`: the fast push-in can start mid-shot (default 0 = as before) |
| `tools/build_props.py` | `lines` and camera `punch` with word anchors; `PUNCH` numbers; head-size check includes the punch |

## 4. Test

`.venv/Scripts/python -I tools/vfx_tests/edge_lines_props.py out/vfx/edge-lines/props1.json` →
`npx remotion render Episode out/vfx/edge-lines/test1.mp4 --props=out/vfx/edge-lines/props1.json --crf=16` →
`tools/vfx_side_by_side.py references/effects/videos/VS1Z_Q-Klt8.mp4 4.0 out/vfx/edge-lines/test1.mp4 out/vfx/edge-lines/side_by_side1.mp4 --shot 60 --seg 40 --labels "day,bridge,workshop,night,night NO push" --keys "0,18,22,24,27,31,35,39"`

Shots: day (Mira), bridge (rifleman), workshop (Juno), night (Bram), and night again **without** the punch (A/B).

## 5. Decisions (user)

| Test | Feedback | Change |
|---|---|---|
| 1 | Approved as it is. Keep the push-in (A/B: lines + punch beat lines only). Note: use it to intensify anger / shouting | Locked |
