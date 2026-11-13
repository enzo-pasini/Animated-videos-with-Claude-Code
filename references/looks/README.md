# Character looks (v4 look track)

A second track next to the VFX effects (`references/effects/`). **Effects** are off by default and switched on per shot.
**Looks** change how every character **always** looks, so they change the locked v3 character look:
`tools/regress_frames.py` will fail **on purpose**, and after the user's approval we make a new baseline ("v4 look").
Same method as the effects: reference → analysis → the user's decisions → recipe → test → side-by-side → approval → lock.

Started 2026-11-10. The user's notes: `references/effects/Outros-efeitos-importantes-com-base-na referência.txt`.

## Files

| Path | What it is |
|---|---|
| `README.md` | This file: the look list, status, analysis notes |
| `head-shading.md` | Recipe of L1 (measured numbers, our version, code, test) |
| `cloth-3d.md` | Recipe of L2 (measured numbers, our version, code, test, lock) |
| `references/effects/videos/eSRnuL-fVSE.mp4`, `uRkLhDrKQeU.mp4` | Reference Shorts (git-ignored, downloaded 2026-11-10) |
| `references/effects/frames/L1-head-shading/` | eSRnuL-fVSE, the **whole** Short (0–56.9 s), every frame; `sheet.jpg` = one tile every 15 frames |
| `references/effects/frames/L2a-cloth-3d/` | uRkLhDrKQeU 0:13–0:21 (medium shot, then a night storm); sheet every 6 frames |
| `references/effects/frames/L2b-cloth-3d/` | uRkLhDrKQeU 0:43–0:47 (the clearest shirt, close-up); sheet every 4 frames |

| `references/effects/frames/L2c-main-vs-background/ref.webp` | The user's image (train station): how much less detail background characters get (2026-11-10) |
| `references/effects/references-for-cloathing.txt` | **The user's L2 link list** (2026-11-10, same format as `references-vfx.txt`) → clips L2d–L2i below |
| `references/effects/videos/HxqtHI62otM.mp4`, `Mz72MuPgnGY.mp4` (+ `7xS87iActkU.mp4`) | L2 reference Shorts (git-ignored, downloaded 2026-11-10) |
| `references/effects/frames/L2d-cloth-reflex/` | HxqtHI62otM 0:00–0:02, policeman: the light streak on the left side of the body; sheet every 4 frames |
| `references/effects/frames/L2e-side-turn-a/`, `L2f-side-turn-b/`, `L2g-side-turn-c/` | 7xS87iActkU 0:00–0:04, 0:12–0:21, 0:44–0:47: clothes turned with the body (worker in the teal vest, the boss in the gold vest) |
| `references/effects/frames/L2h-captain-turn/` | Mz72MuPgnGY 0:06–0:18: the captain (blue hat) turns 3/4 and back; his coat follows; sheet every 12 frames |
| `references/effects/frames/L2i-main-vs-secondary/` | Mz72MuPgnGY 0:22–0:26: main (red thief) vs secondary (black, orange, brown) clothing detail |

Frame numbers below are clip frames (30 fps). In `L1-head-shading`, frame = seconds × 30.

## The user's decisions (2026-11-10)

| Question | Decision |
|---|---|
| Light direction for the shading | **Fixed side** (option A), like the reference: light from the top-left, shadow at the bottom-right, in every scene. Later, maybe a per-shot switch to flip it if a scene really needs it |
| Rim + head shading on which characters | **Everyone**, main and background (in the reference the crowd has them too: L1 f1415) |
| How much less clothing detail on background characters | From `L2c-main-vs-background/ref.webp` (see L2 below): main = full detail; background = base colors + the same shading + **at most 2 big shapes** (collar, coat opening, a skirt in another color), **nothing smaller than a collar** (no buttons, chains or printed patterns). Hats and simple props stay |

Still to check in the test: at night (dark night street) the light rim may shine too much; make it softer in dark scenes if needed.

## The list

| # | Look | Reference | Status |
|---|---|---|---|
| L1 | **Head shading + outline** ("contorno em volta da cabeça": the head looks 3D and less flat) | eSRnuL-fVSE, most of the Short | mockup **approved** (2026-11-10), **half rim on every scene**; recipe `head-shading.md`; **LOCKED** (2026-11-10, always on, `style_lock/locks_v4.md`). Test: `out/looks/L1-test/` |
| L2 | **3D clothing / cloth details** (2D character, 3D-looking clothes). Full on main characters, **less on background characters** (user) | uRkLhDrKQeU 0:13–0:21, 0:43–0:47; the user's list L2d–L2i | **LOCKED** (2026-11-10, always on): torso shading + white streak, details turn with the 3D face, `"bg": true` = big shapes only; recipe `cloth-3d.md`. Test: `out/looks/L2-test/` |
| L3 | **Character identity, head shapes**: men Gumdrop, women Chibi (PLAN D19) | the user's rule + chibi reference (`character-identity.md`) | **LOCKED** (2026-11-10, always on, from `gender` in the cast; `style_lock/locks_v4.md`). Test: `out/identity/cast_test_v4.mp4` |
| — | Contact shadow (a soft dark spot under the feet) | the user's note (the text is cut off after "Soft dark spot under feet, and…") | later; ask the user for the rest. Our characters cast no ground shadow today |

## Analysis notes

### L1. Head shading + outline (`L1-head-shading`)
Best close frames: f135 and f165 (bald man, big head), f420 (woman with a bun), f1110 (red shirt + green coat), f1170.
Four things make the head look round:

1. **Outline with a varying width.** Thin on the lit side (top-left, ≈1 % of the head width, sometimes almost gone), thick on the shadow side (bottom-right, ≈3 %). Ours is the same everywhere (3.4 %, `LW.outline`). Clearest: f135, f165.
2. **A light "sticker" rim outside the outline.** A thin off-white/cream edge (≈1 % of the head width) all around the character's outline, between the ink and the background. It cuts the character out from the background. Clearest: f1110 (around the red guy's head and hat), f420 (around the bun).
3. **Soft shading inside the head.** The face is lightest in the middle/upper-left and gets ~6–9 % darker toward the shadow-side edge (measured luminance ≈236 in the middle → 214–220 near the right edge in f135 and f165). A soft core shadow along the outline on the shadow side, no hard shadow shape.
4. **A gloss streak on hair and hats.** One soft light stroke along the top of the hair or hat (f420 bun, f1110 hat and hair). Our hair/hats are flat.

The face features (eyes, mouth) stay flat ink, with no shading.
Open questions for the user (next session): light from a fixed upper-left (like the reference) or from the scene's key light? The rim on every character? Which of the 4 parts matter most?

### L2. 3D clothing (`L2a/L2b-cloth-3d`)
Best frames: L2b f88–f104 (close-up: arm up holding leaves), L2a f0–f54 (medium shot by the tree).

1. **The torso is shaded like a cylinder.** Lighter on the lit side and center, darker toward the far edge, plus a soft highlight band. Ours: one flat shirt color (the card takes scene light, but evenly).
2. **A printed fabric pattern** (hibiscus flowers + leaves on an orange shirt) instead of a flat color.
3. **The pattern wraps around the body.** Flowers near the edges are cut off and squeezed, as on a cylinder.
4. **Garment details:** collar/V-neck, the front opening line of a button shirt, a few darker crease lines.
5. **The head gets the same soft shading as L1** (light upper-left, darker lavender-gray toward the bottom-right), so L1 and L2 share one light direction.

Our parts already draw some details (Mira's cardigan with pockets and buttons, the rifleman's jacket with buttons and belt), but all flat. Rule from the user: **full detail on main characters, less on background characters** (too much detail on screen otherwise).

**New references (the user's list `references-for-cloathing.txt`, analysed 2026-11-10):**

| # | What the user saw | What it really is (frames) | Our version, simply |
|---|---|---|---|
| a | "O reflexo no lado esquerdo do corpo" (L2d f000–f056) | A **thin bright streak just inside the left (lit) edge of the torso**, following its curve from the shoulder to the belt (~1–1.5 % of the body width, near-white, ~70 % opacity), plus the torso a little darker toward the right. Same streak on the captain's coat (L2h f144) and on hats. It is the L1 rim/gloss idea, **on the clothes** | a gloss stroke along the lit side of the torso (reuse L1 `drawWithGloss` / the head shading, but for the body) |
| b | Clothes "follow" the body when it turns sideways (L2e f18–f54, L2g f16–f60, L2h f120–f170 and back at f324) | The **body outline stays the same bean**; only the **details slide** toward the side the character faces: the front opening line, button rows and pockets move off-centre, the far ones get narrower, the near edge shows a little side. When he turns back, they slide back to the centre. Like our **3D face turn, but on the torso** | one `bodyYaw` (−1…1) that moves the clothing details with the same sphere maths as the face (`atFace` in `fx.ts`), clipped to the torso; linked to the face turn so the whole body turns together |
| c | "Not too much, not too low" detail on main characters (L2h, L2e) | Main characters: **4–6 details, all big enough to read**: captain = 2 rows of gold buttons, gold fringe epaulettes, a red waist stripe, cuff stripes; worker = vest opening + buttons + pockets + red neck scarf; boss = gold vest + buttons + watch chain; thief = vertical gold stripes + fringe epaulettes + white collar | our parts already have most of these (Mira's cardigan, the rifleman's jacket); they need the shading + gloss + turn more than new details |
| d | Secondary characters less detailed (L2i f60–f120) | Black: plain + white V collar. Orange: plain shirt + belt. Brown: vest opening + belt with buckle + a tie tip. → **base colour + 1–2 big shapes**, same shading and outline as the main; the belt buckle is the only small item | confirms the L2c rule (at most 2 big shapes, nothing smaller than a collar; a belt buckle is OK) |

**Main vs background** (`L2c-main-vs-background/ref.webp`):
- Main character (front, yellow vest): two rows of gold buttons, a pocket-watch chain, a white shirt collar and a black bow tie, a bowler hat with a band and a shine; the vest is shaded like a cylinder (darker on the right).
- Background characters (brown coat, purple dress, green dress, blue coat): base color + the same soft shading, 1–2 big shapes only (a white collar, the coat opening line, a skirt in another color), hats and simple props (a small bag, a paper). No buttons, chains or patterns. The rim and the head shading are still there on their small faces.

### L1 mockup (2026-11-10, branch `look-v4`)

Measured on the reference by hand, pixel rows across the edges (scratch scripts, numbers here):

| | f135 (head ≈700 px) | f1110 (head ≈340 px) | f1415 (dark scene, small heads) |
|---|---|---|---|
| Ink, lit side (top/left) | 10 px = 1.4 % | 7 px = 2.1 % | 3–5 px |
| Ink, shadow side (right/bottom) | 23 px = 3.3 % | 17 px = 5 % | 8–13 px |
| Rim | ~4 px, light | 1–2 px, near-white | lit side 5 px, other side 2 px, **bright on a dark background** (luma ~210 vs 46), tinted by the scene (mint/blue). Thin legs: **one** light line on the lit side only |
| Face | centre 235 → top-left edge 226, bottom-right 222 (≈ −6 %) | | |

Mockup values (`src/character/look.ts`, `LOOK_L1`): ink lit side 1.6 %, shadow side ≈ 4.8 % at the bottom-right (an ink copy of each outline shape, moved 4 % toward 50° below the right; 3.4 % at the pure right side); rim = the silhouette slid toward the light by up to 1.4 %, so only edges that face the light get it (0 at the bottom-right), cream `#f7f2e8`; head shading by multiply, −1 % → −3.8 % → −6.5 % from the centre (a bit up-left) to the bottom-right edge; gloss = a band 4.5–7.5 % inside the top edge of the hair/hat layer, white at 40 %, faded at the sides.

Found while making it: an even rim (same width all around) turned thin dark legs into **white double lines** at night. The reference has the rim only on the lit side of the legs, so the rim follows the light (fix above).

Files: `out/looks/L1-mockup/L1_mockup_sheet.jpg` (4 scenes, v3 vs L1, medium + close), `L1_night_and_reference.jpg` (reference crops + the night with a full and a half rim). Remake: `tools/vfx_tests/look_l1_props.py <out.json> v3|l1|l1soft` → `node tools/render_stills.mjs --props <out.json> --frames 15,45,75,105,135,165,195,225 --out <dir>`.
The switch: render props `"look": {"on": true}` (missing = v3). v3 regression with the look off: **PASS**.

## Effects added to the VFX list (track 1, later)
Walk with small body twitches (0m6G8pDtzNs 0:04–0:07, not downloaded) and jump + impact (uRkLhDrKQeU 0:10–0:13, frames in `references/effects/frames/11-jump-impact/`): items 11 and 12 in `references/effects/README.md`.
