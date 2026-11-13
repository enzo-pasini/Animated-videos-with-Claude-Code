# Look recipe: L1 head shading + outline (the head looks round, not flat)

**Reference:** eSRnuL-fVSE, the whole Short → `references/effects/frames/L1-head-shading/` (frame = seconds × 30).
Best frames: f135, f165 (bald man, big head), f1110 (red shirt + the nurse with a bun), f1415 (dark scene, crowd).

**Status:** **LOCKED in v4** (2026-11-10, approved after the 4-shot test), with the **half rim on every scene**. Always on. Listed in `style_lock/locks_v4.md`.
Branch `look-v4`. This is a **look**, not an effect: it is always on, so it changes the locked v3 character look on
purpose (`tools/regress_frames.py` will fail after the switch; a new "v4 look" baseline comes after the approval).

## 0. The user's decisions

| Question | Decision (2026-11-10) |
|---|---|
| Light direction | **Fixed**, like the reference: light from the top-left, shadow at the bottom-right, in every scene (later maybe a per-shot flip if a scene really needs it) |
| Who gets it | **Everyone**, main and background characters (the reference crowd has it: f1415) |
| The mockup (`out/looks/L1-mockup/`) | "L1 is ok" |
| Rim strength | **Half rim on everything** (the full rim was the measured reference; the user prefers it quieter) |

## 1. What the reference does (measured)

Pixel rows across the head edges (light top-left, so "lit side" = top/left):

| | f135 (head ≈700 px) | f1110 (head ≈340 px) | f1415 (dark scene, small heads) |
|---|---|---|---|
| Ink, lit side | 10 px = 1.4 % of the head width | 7 px = 2.1 % | 3–5 px |
| Ink, shadow side | 23 px = 3.3 % | 17 px = 5 % | 8–13 px |
| Rim (outside the ink) | ~4 px, light | 1–2 px, near-white | lit side 5 px, shadow side ~2 px; bright on a dark background (luma ~210 vs 46), tinted by the scene (mint/blue). Thin legs: **one** light line on the lit side only |
| Inside the face | centre 235 → top-left edge 226, bottom-right edge 222 (≈ −6 %) | same pattern | — |

Also seen: a short soft light stroke inside the top edge of the hair and hats (f1110 hair, the nurse's bun), and the
eyes, brows and mouth stay flat ink (no shading). Limbs keep one even width.

## 2. Our version

Everything is drawn in the character texture (`src/character/look.ts`), in screen directions: the card always faces
the camera, so "top-left" is always top-left on screen. The scene light then tints it like the rest of the card.

| Part | How | Numbers (`LOOK_L1`) |
|---|---|---|
| 1. Outline width | Every **outline-weight shape** (head, torso, hair, hats, scarf, satchel: `strokeFill` with width ≥ 0.028) gets an **ink copy behind it, moved toward the shadow side**, then a thin stroke. Details (collars, buttons, pockets) and the limbs keep the v3 width | thin stroke `thin` 1.6 %; ink copy moved `inkD` 4 % toward `inkAng` 50° (below the right) → bottom-right ≈ 4.8 %, pure right 3.4 % (= v3), top-left 1.6 % |
| 2. Light rim | The finished character is **slid toward the light** step by step (1 px → `rimW`); the part that sticks out is filled cream and put behind. So the rim is only on edges that face the light: widest at the top-left, 0 at the bottom-right. It starts at 1 px, so no cream shows through the soft edge pixels on the shadow side | `rimW` 1.4 %, `rimColor` `#f7f2e8`, `rim` **0.5** (user) |
| 3. Head shading | After the skin fill, a radial gradient clipped to the head, multiplied: lightest a bit up-left of the centre (−0.07, −0.09), darker toward the edges. Drawn before the face, so the features stay flat | −1 % at 40 % of the radius, −3.8 % at 60 %, −6.5 % at the edge (radius 0.64); a touch lavender |
| 4. Gloss | The `overHead` hook (hair, hats) is drawn in its own layer; a band 4.5–7.5 % inside its edge that faces the light (mostly the top) is kept, faded at the sides (head-local x −0.46 → 0.3), blurred 0.6 %, white | `gloss` 0.4 |

**Why the rim follows the light:** the first mockup grew the silhouette evenly. At night that turned the thin dark
legs into **white double lines**. The reference has the rim only on the lit side of the legs (f1415), so ours does too.

**v3 safety:** `look.ts` is off unless the render props carry `"look"` (`src/episode/Episode.tsx` → `setLook`).
With it off, every drawing call is the v3 one (`tools/regress_frames.py` **PASS**, 2026-11-10).

## 3. Code

| Part | Where |
|---|---|
| Numbers + switch (`LOOK_L1`, `setLook`, `look()`) | `src/character/look.ts` |
| Ink copy + thin stroke (`inkFill`) | `look.ts`; called from `strokeFill` and the torso in `src/character/draw.ts` |
| Head shading (`shadeHead`) | `look.ts`; called after the head fill in `draw.ts` |
| Gloss layer (`drawWithGloss`) | `look.ts`; wraps `spec.overHead` in `draw.ts` |
| Rim (`rimPass`) | `look.ts`; last step of `drawCharacter` |
| Switch from the plan | `EpisodeProps.look` (`src/episode/types.ts`), `setLook(props.look)` in `Episode` |

## 4. Mockup (2026-11-10)

`out/looks/L1-mockup/L1_mockup_sheet.jpg` (4 scenes, v3 vs L1, medium + close) and `L1_night_and_reference.jpg`
(reference crops + the night with the full and the half rim). Props: `tools/vfx_tests/look_l1_props.py <out.json> v3|l1|l1full`
→ `node tools/render_stills.mjs --props <out.json> --frames 15,45,75,105,135,165,195,225 --out <dir>`.

## 5. Test

`tools/vfx_tests/look_l1_test_props.py out/looks/L1-test/props.json [l1|v3]` → 4 shots × 150 frames like a real video:
day street (Mira + Bram and rifleman B behind), day bridge (rifleman, shako), warm interior (Juno), night street (Pell).
Slow push-in from head ≈ 31 % to ≈ 40 %, blinks, expressions happy → surprised → thinking → happy.
Render: `npx remotion render Episode out/looks/L1-test/test.mp4 --props=out/looks/L1-test/props.json --crf=16`
(and `test_v3.mp4` from `props_v3.json`, for before/after). Side-by-side with the reference: `tools/vfx_side_by_side.py`.

## 6. Lock (2026-11-10)

1. **Always on:** `look.ts` starts with L1 on; props `"look": null` switch it off (tests only), an object changes single values.
2. **Locked effects re-checked** with L1: `out/looks/L1-effects/` (anger, heat sweat, 3D face). Fix found: the anger fill
   redrew the head outline at the even v3 width (it covers the inner half of the line) → it now redraws the thin line;
   the thick shadow-side ink sits outside the head and stays.
3. **Baselines:** `tools/regress_frames.py` compares with `v4look` (StyleTest with L1; `--make-baseline` made it). The v3
   check stays: `--baseline v3 --props tools/tests/look_off.json` → PASS.
