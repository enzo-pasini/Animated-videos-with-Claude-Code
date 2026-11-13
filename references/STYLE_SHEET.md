# STYLE SHEET — characters, world, light, captions

Companion to [RULEBOOK.md](RULEBOOK.md) (section 7). Source: the same 20 Shorts from @RicksClips3000.
All pixel values refer to the native **1080 × 1920** frame.

**How each number was obtained**
- **[M]** measured by a script on all 20 videos (380 shot-middle frames, 2 300+ caption samples).
- **[M-10]** measured by a script on the 10 hand-picked frames below (17 characters, 9 videos).
- **[EYE]** counted by eye on a 3–4× zoom with a pixel ruler (used where the script was unreliable).
- **[O]** looked at, not measured: contact sheets of 10 videos + 3-frame montages of the other 10.

---

## 0. Build spec (the numbers to copy)

| Element | Value |
|---|---|
| Character height | **≈ 3.1 head widths** (2.65–3.19) [M-10] |
| Head width on screen | medium shot **~27 % of frame width** (≈ 290 px); close-up 45–51 %; wide 11–18 % [M-10] |
| Standing character height | median **47 % of frame height** in medium-wide shots (25–59 %) [M-10] |
| Head outline | **≈ 3.4 % of head width** (2.5–5.1 %) → ~9 px on a 270 px head [EYE] |
| Legs / arms | single strokes **≈ 5 % of head width** (13–17 px), about 1.5× the head outline [EYE] |
| World outlines | 50 % none · 30 % thin line art (~2 px) · 20 % thick cel outlines (~4 px) [O + M-10] |
| Background blur | used in **22 %** of shots (σ > 2 px), strong in 8 % (σ > 4 px); characters stay sharp (σ ≈ 0.6–1.3 px) [M] |
| Light | **18/20** videos mix warm and cool shots; median **4** warm↔cool switches per video [M] |
| Captions | white, ~6 px black outline + down-right drop shadow; x-height **40 px (2.1 % H)**; centered at **70.3 % H** [M] |
| Caption font | closest installed match: **Segoe UI Black, −0.04 em tracking** (not confirmed) [M + EYE] |

---

## 1. Characters

![Saloon, three standing characters](analysis/style_frames/01_saloon_three_characters.jpg)
*01 — three standing characters, rendered world with no outlines (5WMQhPObNqQ @ 6.0 s).*

### 1.1 Proportions [M-10]

| Character (frame) | Head width | % of frame width | Height in head widths | Height % of frame |
|---|---|---|---|---|
| left, glasses (01) | 312 px | 28.9 % | 2.87 | 46.6 % |
| right, cap (01) | 301 px | 27.9 % | 3.06 | 48.0 % |
| mother (03) | 264 px | 24.4 % | 3.01 | 41.4 % |
| son (03) | 270 px | 25.0 % | 3.17 | 44.6 % |
| office worker (04) | 182 px | 16.9 % | 2.65 | 25.1 % |
| orange shirt (05) | 370 px | 34.3 % | 3.08 | 59.3 % |
| bandana pirate (07) | 299 px | 27.7 % | 3.13 | 48.7 % |
| captain (07) | 280 px | 25.9 % | 3.19 | 46.5 % |
| **median (8 standing)** | **290 px** | **26.8 %** | **3.07** | **46.6 %** |

- **Head unit = width**, because hats and hair hide the top of the head. One bald head (01, left) is almost round (height/width **0.93**). The office worker (2.65) has a head wider than it is tall.
- About **1/3 of the height is head**. The rest is a small, rounded, bean-shaped torso (about 1 head) plus stick legs (about 1 head) [O].
- Close-ups go up to **47–51 %** of frame width for one head (frames 02, 10).

![Town, mother and son](analysis/style_frames/03_town_mother_and_son.jpg)
*03 — 3.0–3.2 head widths tall; background blurred (σ 3.5 px) while the characters are sharp (ZDy3xXA2iHk @ 30.7 s).*

### 1.2 Lines [EYE]

| Measure | Value | How |
|---|---|---|
| Head outline | office 4.5 px (2.5 %) · son 8 px (3.0 %) · mother 10 px (3.8 %) · casino close-up 28 px (5.1 %) → **median ≈ 3.4 % of head width** | right edge of 4 heads, 4× zoom (`annotated/head_outline_zoom.jpg`) |
| Head–body seam | 10–20 px dark band where the head outline touches the collar/body outline | chin zooms |
| Legs | 13–17 px (≈ 5.2 % of head width; 3.8–7.1 %) | 5 legs, 3× zoom |
| Outline color | near-black in neutral/cool light; **dark brown** in warm-lit scenes (casino, prize counter, pirates) | zooms [O] |

Rules:
1. The outline **scales with the character** (thicker in close-ups), so it behaves like part of the drawing, not a fixed screen-space stroke.
2. **Limbs are thicker than the head outline** (about 1.5×) and take the pants color (black, navy, gray).
3. Characters are **lit by the scene**: heads get warm gradients near lamps (frame 10) and blue tints at night (frame 06). They're flat 2D shapes, but not unlit stickers [O].

### 1.3 Faces and costume [O]
- Eyes are dots or rings, eyebrows are single strokes, mouths are a line or a toothy grin. Blush appears on a few characters.
- Identity comes from **one strong silhouette item**: hair shape, hat (cap, bandana, chef hat, helmet) or glasses. Clothes are flat color blocks with 1–2 details (tie, suspenders, stripes).
- Emotion can recolor the whole face (an angry purple face in 7xS87iActkU).

![Pirates on deck](analysis/style_frames/07_pirates_deck.jpg)
*07 — round heads, bean torsos, stick legs; identity through bandana and hat (lnYLIWP2l-I @ 41.6 s).*

---

## 2. World (environment) and its outlines

Three looks, labeled per video [O]:

| Look | Videos | Count |
|---|---|---|
| **Rendered, no outlines** (soft 3D lighting, stylized textures) | 5WMQ, 7xS8, CJwg, lnYL, ZDy3, _sUA, LC8h, PLe2, DEe0, t3OX | **10** |
| **Thin line art** (illustrated, dark ink lines on edges) | eQR3, VS1Z (night scenes), GM9U, hdhg, jpFJ, TgyH | **6** |
| **Thick cel outlines** (flat colors, black edges like the characters) | 0m6G, Mz72, nzbk, VKsa | **4** |

Stroke width measured in world boxes [M-10]:

| Look | Stroke width | Frame |
|---|---|---|
| Thick cel outlines | **≈ 4 px** (door edge by eye: 4–6 px) | 04 office |
| Thin line art | **≈ 2 px** | 08 castle |
| Character head outline (for comparison) | ~9 px on a 270 px head | — |

Rules:
1. **World lines are always thinner than character outlines** (2–4 px vs. ~9 px), so the characters read on top of the world.
2. The look is chosen **per video** (or per location inside a video), not mixed randomly from shot to shot.

![Office with cel-outlined world](analysis/style_frames/04_office_cel_outlined_world.jpg)
*04 — thick cel outlines on desk, door and walls (0m6G8pDtzNs @ 43.4 s).*

![Castle at night with thin line art](analysis/style_frames/08_castle_night_lineart.jpg)
*08 — thin ~2 px ink lines on stones and hills (VS1Z_Q-Klt8 @ 42.5 s).*

> The automatic line-art detector **failed** to separate these looks: dark textures, slot-machine bars and character outlines score as high as real world outlines. That's why this section uses my visual labels plus measurements inside boxes.

---

## 3. Depth of field (background blur)

Method: edge sharpness converted to an equivalent Gaussian blur σ in pixels. **Calibrated**: known blurs of 2 / 4 / 8 / 12 px came back as 2.5 / 4.5 / 8.6 / 12.4 px (within about 10 %).

| Measure [M], 380 shots | Value |
|---|---|
| Sharpest parts of the frame (characters, captions excluded) | σ median **0.62 px**: crisp |
| Softest quarter of the frame | σ median **1.14 px**; p90 **3.6 px** |
| Shots with background blur σ > 2 px | **22 %** (82/380) |
| Shots with strong blur σ > 4 px | **8 %**; σ > 6 px: 4 % |
| Videos that use it at all | 19/20 (top: LC8h 65 % of shots, partly motion blur; lowest: nzbk 0 %) |

On the 10 frames [M-10]: head σ 0.7–1.4 px. Background σ is 0.7–1.0 px in 6 frames (as sharp as the character), 1.6–3.5 px in 3 frames, and **14.4 px** for the foreground slot machines in frame 10.

Rules:
1. Default: **everything sharp**.
2. In about 1 shot out of 5, blur the background to **σ 2–4 px** to isolate a character (dialogue, reaction).
3. Rare strong blur (σ 6–15 px) on **foreground objects** close to the camera, which gives depth to close-ups.

![Casino depth of field](analysis/style_frames/10_casino_depth_of_field.jpg)
*10 — characters sharp (σ ≈ 1.3 px), ceiling σ 2.4 px, foreground machines σ 14 px (CJwgTrfrHL0 @ 10.6 s).*

---

## 4. Light: warm vs. cool inside each video [M]

Each shot is classified by the share of saturated pixels with warm hues (red, orange, yellow) vs. cool hues (cyan, blue, violet). A shot is warm (W) if warm ≥ 1.5× cool, cool (C) for the reverse, otherwise mixed (–).

| Measure | Value |
|---|---|
| Videos with both warm and cool shots | **18/20** (only CJwg and TgyH stay warm) |
| Warm↔cool switches per video | median **4** (p10 1.8, p90 6) |
| Screen time | warm **48 %** · cool **36 %** · mixed **17 %** |
| Range of Lab b* (yellow↔blue) inside a video | median **60** (p10 39, p90 88) |
| Is the switch tied to the story turn? | **No**: 9 videos flip within ±4 s of the turn, 8.2 expected by chance; cool share 45 % before vs. 44 % after the turn |

| Video | W / C / mixed (% time) | Switches | Shot sequence |
|---|---|---|---|
| 0m6G8pDtzNs | 10 / 71 / 18 | 4 | `CWCCCCCCCCCCW-WC-CCCC-CC` |
| 5WMQhPObNqQ | 31 / 27 / 42 | 2 | `CC-C--C-C-W--WWWW--WW-WCCC` |
| 7xS87iActkU | 74 / 7 / 19 | 4 | `WC--W--WCWWWWWWWW-WWW` |
| _sUAXTvJquk | 87 / 13 / 0 | 3 | `CWWWWWWWCW` |
| CJwgTrfrHL0 | 88 / 0 / 12 | 0 | `WWWWWWWW-W` |
| DEe0iKH4KIw | 49 / 40 / 10 | 4 | `WWWWWWWWW-CCCCC-CWWCCCW` |
| eQR3pgMiUF0 | 42 / 57 / 0 | 4 | `CCWWCWWWWWCCCC` |
| GM9UKnZ6JFw | 19 / 60 / 22 | 6 | `WCC--CWCWCCCC-CCCCW-W-` |
| hdhggSABEws | 57 / 33 / 10 | 4 | `W-WWWWWCCWCCWWWWW` |
| jpFJ8Z_F-qU | 89 / 6 / 5 | 2 | `W-CCWWWWWWWWWW-WWWW` |
| LC8hYwUZ-kU | 27 / 10 / 63 | 2 | `C---WW-W--W-W-WWWCCC` |
| lnYLIWP2l-I | 36 / 19 / 45 | 4 | `-CWC--WWW---WWWWCC-C` |
| Mz72MuPgnGY | 29 / 53 / 18 | 4 | `CW-W---CCCCCWWCC` |
| nzbkkEZFM8g | 40 / 42 / 18 | 6 | `CCC-WCWWC----CCWWWW-CC` |
| PLe2Gu3FDuA | 24 / 55 / 20 | 5 | `CCW-CWWCCCW-W` |
| t3OXkhlI6NQ | 10 / 85 / 5 | 6 | `CWCCCCC-CC-CCWCCCCCCWC` |
| TgyHSIttwdM | 94 / 0 / 6 | 0 | `WWWWW-WWWWWWWWW` |
| VKsamN3Fk4U | 49 / 51 / 0 | 6 | `WWWWCWWCCCCCWCCCWW` |
| VS1Z_Q-Klt8 | 69 / 20 / 11 | 2 | `W-WWW-WWWWWWCCCCCCCWWWWWWW` |
| ZDy3xXA2iHk | 30 / 59 / 12 | 5 | `CCCCCCCWWCCCCWCWWW--WW` |

Rules:
1. Light follows **place and time of day**: warm for interiors, lamps, day and sunsets; cool for night, outdoors at night and moonlight [O]. It does **not** follow the story beat.
2. Switch in **blocks** (several shots in a row), about 4 times per video.
3. At night, keep **one warm practical light** (window, lamp, counter) inside the cool scene (frames 06, 08) [O].

![Prize counter, warm](analysis/style_frames/05_prize_counter_warm.jpg)
*05 — warm interior; outlines turn dark brown (eQR3pgMiUF0 @ 21.1 s).*

![Alley at night, cool](analysis/style_frames/06_alley_night_cool.jpg)
*06 — same character 8 s later: cool night with one warm window (eQR3pgMiUF0 @ 29.5 s).*

![Lake at sunset](analysis/style_frames/09_lake_sunset_memory.jpg)
*09 — warm sunset for a happy memory inside a mostly cool video (t3OXkhlI6NQ @ 41.3 s).*

![Canyon close-up](analysis/style_frames/02_canyon_walking_closeup.jpg)
*02 — close-up, head 47 % of frame width; warm canyon (7xS87iActkU @ 54.9 s).*

---

## 5. Captions [M]

![Caption close-up](analysis/style_frames/12_caption_closeup.png)
*12 — full-resolution caption crop (lnYLIWP2l-I @ 37.7 s).*

| Measure (2 300+ samples, 20 videos) | Value |
|---|---|
| On screen | **99.5 %** of sampled frames (always on) |
| x-height (height of "x") | median **40.6 px = 2.1 % H** (p10 39, p90 42.6) |
| Ascender height (b, d, h, l) | **53 px = 2.8 % H** |
| Text box height / width | 55 px / median 242 px (**22 % W**; p90 397 px = 37 % W) |
| Vertical center | **70.3 % of frame height** (p10–p90: 70.3–70.7 %): fixed |
| Horizontal center | **49.9 %**: centered |
| Words on screen | 1 word **67 %** · 2 words **28 %** · 3 words 4 % · 4 words 0.2 % |
| Fill | pure white (all channels > 215) |
| Black outline | **≈ 6 px** (top side) |
| Shadow | dark area reaches **10 px below** and **13 px right** (vs. 6 above): a **drop shadow offset down-right**, fading out at ~13–15 px |
| Case and punctuation | as spoken: sentence case, commas and periods kept ("Japan,", "rail.") [O] |

### Font [M + EYE]

![Font comparison](analysis/style_frames/11_caption_font_compare.jpg)
*11 — real caption (top) vs. installed fonts at the same x-height; w = width ratio vs. real (1.00 = same).*

| Font (at the real x-height) | Width vs. real | Verdict |
|---|---|---|
| Arial Black | 1.16 | same shapes and weight, but too wide |
| Arial Black −0.07 em | 1.03 | letters look squeezed |
| **Segoe UI Black −0.04 em** | **1.00–1.03** | **closest**: weight, double-story a, single-story g, straight-tail y, slanted t |
| Franklin Gothic Heavy −0.02 em | 1.01 | close second (slightly narrower letters) |
| Arial Bold / Tahoma Bold / Trebuchet Bold | 0.98–1.04 | right width, **too thin** |

The real font is **not confirmed**. It may be a font that isn't installed here (for example Montserrat Black). For production: **Segoe UI Black, −0.04 em**, or test Montserrat/Inter Black against `11_caption_font_compare.jpg`.

---

## 6. Limits

- Proportions and line widths come from **17 characters in 10 frames**; these are good estimates, not a census.
- Head outlines measured by script were contaminated by hair (sides) and the body outline (chin), so the outline values are **by eye on 4 heads**.
- World looks are **my visual labels**. Stroke widths in world boxes are measured, but only in 2 frames.
- The blur σ includes **motion blur** (fast camera moves), not only depth of field.
- Warm/cool uses hue shares of saturated pixels. Gray, desaturated shots count as "mixed".

## 7. Files and re-run

| Path | Content |
|---|---|
| `analysis/style_frames/01…10_*.jpg` | example crops (clean) |
| `analysis/style_frames/11_caption_font_compare.jpg`, `12_caption_closeup.png` | caption references |
| `analysis/style_frames/annotated/` | measurement overlays + outline zoom (for checking) |
| `analysis/style_frames.json` | hand annotations (head seeds, feet, leg/background/world boxes) |
| `analysis/style_frames_measured.json` | per-character measurements |
| `analysis/style/<id>.json`, `analysis/style_summary.json` | captions, blur, lines, light per video / channel |

```bash
.venv/Scripts/python -I tools/style_probe.py references --workers 4
.venv/Scripts/python -I tools/summarize_style.py references
.venv/Scripts/python -I tools/style_frames.py references
.venv/Scripts/python -I tools/font_match.py references out.jpg "lnYLIWP2l-I@37.7=to be outdone," --fonts C:/Windows/Fonts/seguibl.ttf@-0.04
```
