# STYLE LOCK — v3

**Locked:** 2026-11-04, after 3 versions (v1 → v2 → v3).
**Status:** locked and **final**. The iteration reserved for brightness was not needed: the daylight phone review (2026-11-07, PLAN D3) said brightness is right. Nothing else changes.
**Reference:** [RULEBOOK.md](../references/RULEBOOK.md) and [STYLE_SHEET.md](../references/STYLE_SHEET.md) (20 Shorts from the reference channel). We copy the **style**, never the characters, places or lines.

Targets = the reference **p25–p75 range** (the normal middle half), not the exact median.

---

## 0. Files in this folder

| Path | What it is |
|---|---|
| `style_test_v3.mp4` | the locked 12 s test: 1080×1920, 30 fps, H.264, 360 frames |
| `comparison_sheet_v3.jpg` | rows v1 / v2 / v3 / reference frames, with numbers under each tile + captions at 1:1 |
| `frames_sheet/f50…f330.png` | the 5 v3 frames used by `compare_sheet.py` (row "v3") |
| `frames/v3_f000…f330.png` | full-size reference stills of v3: f000 wide opening, f050 medium + lantern, f100 moon night exterior, f170 close-up with blur, f262 window lighting up, f290 window lit, f330 warm ending |
| `numbers_v1_v2_v3.md` | per-shot measurement tables of all three versions vs the reference range |
| `history/` | v1 and v2 videos and sheets (for "what went wrong") |
| `source_v3/` | plain copy of the code that made v3 (`src/`, configs, measuring tools); kept as a backup |

**Git:** the project is a git repo (branch `main`). The locked state is the tag **`style-v3`**.
- See exactly what changed since the lock: `git diff style-v3`
- Get the locked files back: `git checkout style-v3 -- src/`

Not in git (`.gitignore`): `node_modules/`, `.venv/`, `out/` (renders), `references/videos/` and `references/meta/info/` (the reference channel's downloads). If this repo is ever pushed to GitHub, keep it **private**: `references/` still contains frames and transcripts from the reference channel.

---

## 1. Format and editing

| Item | Locked value | Reference |
|---|---|---|
| Resolution / fps / codec | 1080×1920, 30 fps, H.264 (CRF 16 for previews) | 20/20 videos |
| Transition | **cross-dissolve, 8 frames**, camera keeps moving through it (`@remotion/transitions` `fade()` + `linearTiming`) | 88 % dissolves, median 8 frames |
| Hard cuts | none in the test (reserved for punches, ~2 per 60 s video) | 12 % |
| Shot length | 2.0 / 2.27 / 2.4 / 2.53 / 2.8 s (hook shot shortest) | median 2.4 s, hook 2.0 s |
| Shot list (frames) | `SHOT_LEN = [68, 76, 80, 84, 84]` → sum 392 − 4 × 8 = 360 | — |
| First scene change | 2.13 s | median 1.9 s |

---

## 2. Camera

**Rule:** every shot moves. Default = slow push-in + slow drift + small roll. The first shot opens with a fast push-in. No shake.

### 2.1 How a move is defined (`src/film/camera.ts`)
- `target` = the subject point. `dir` = direction from target to camera. `d0` = start distance in meters.
- Subject scale grows `(1 + rate)^t`, so distance = `d0 / scale`.
- Fast entry push = **lens zoom** `fovStart → fov` over `fast.dur` seconds (ease-out). The camera stays in the street.
- `drift` = m/s added to both camera and target. `roll` = degrees, start → end of the shot.

**Two formulas to reuse:**
- head % of frame width = `0.55 / (2 · d · tan(fov/2) · 0.5625)`, where 0.55 m is the head width.
- Measured zoom ≈ **0.78 × set rate**, because the background has parallax. To *measure* ~10 %/s, set `rate` ≈ 0.13.

### 2.2 Per-shot values (locked)

| Shot | Content | target | dir | d0 | fov | rate | fast | drift m/s | roll ° | grade |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 hook | wide → Bram lights the lantern | 0.1, 1.45, −1.4 | 0.5, 0.06, 1 | 5.56 | 44 (from **70**) | 0.13 | 0.8 s lens zoom | −0.12, 0, 0 | −1.2 → 0.4 | `brightness(1.18) contrast(0.88)` |
| 2 | moon + empty houses (reverse) | 3.0, 6.0, 6.4 | −0.56, −0.5, −0.66 | 8.5 | 50 | 0.15 | — | 0.22, 0.02, 0 | 0.8 → 2.0 | night-ext grade |
| 3 | close-up, background blur 3 px | 0.0, 1.42, −1.42 | −0.12, 0.03, 1 | 4.5 | 30 | 0.09 | — | 0.06, 0, 0 | 1.5 → 0.5 | — |
| 4 | window across lights up | 0.9, 4.25, 6.5 | −0.1, −0.42, −1 | 7.6 | 40 | 0.14 | — | 0.16, 0, 0 | −0.5 → −1.8 | night-ext, relaxes as window lights |
| 5 ending | Bram looks up, smiles (warm) | 0.0, 1.35, −1.42 | −0.45, 0.02, 1 | 7.1 | 32 | 0.11 | — | −0.12, 0, 0 | 0 → −1.5 | — |

Shots 1 and 5 use **opposite diagonals**, so the street recedes in depth. Avoid cameras that face a wall straight on.

### 2.3 Measured on v3 (reference scripts)

| Measure | v3 | Reference p25–p75 |
|---|---|---|
| Fast entry push | 41.7 %/s | fast moves 50 %+/s (p90 52) |
| Slow push-in | 7.0–12.8 %/s | 4.2–27 (median 11.6) |
| Drift | 0.033–0.047 frame widths/s | 0.023–0.17 |
| Roll per shot | 0.5–2.4° | 0.5–5.1° |
| Shake (jitter) | 0 | ~0 |
| Static time | 0 % | 8.7 % |

---

## 3. Framing and proportions

| Item | Locked value | Reference |
|---|---|---|
| Wide (shot 1 start) | head **12.6 %** of frame width | wide 11–18 % |
| Medium | head **24 → 32 %** during the push | ~27 % |
| Close-up | head **40.5 → 51 %** (`rate` 0.09 so it never passes 51 %) | 45–51 % |
| Standing height | ~42–48 % of frame height in medium shots | median 47 % (25–59) |
| Body height | **3.08 head widths**, feet → top of skull (head 0.95 tall, torso −2.18…−1.24, legs −1.30…0; the head overlaps the torso top) | ≈ 3.1 |
| Head outline | **3.4 %** of head width | 3.4 % |
| Arms / legs | single strokes, **5 %** of head width (~1.5× the outline), round dot hands | 5 % |
| Character in world | head width = **0.55 m** → body 1.69 m | — |

Character drawing units are head widths, with the origin between the feet (`src/character/draw.ts`). Texture = 480 px per head width (sharp up to 51 % close-ups).

---

## 4. Color and light

### 4.1 Lights (`LIGHTS` in `src/three/NightStreet.tsx`; since 2026-11-04 the code lives in `src/world/` — preset `lights/nightExterior.tsx`, set `sets/NightStreet.tsx` — same values, all 360 frames re-checked)

| Light | Value | Role |
|---|---|---|
| Hemisphere | sky `#7a86d4`, ground `#3b3452`, **3.6** | night base |
| Moon (directional, shadows) | `#a3b0f5`, **2.0**, moon at `[36, 52, 46]` (visible in reverse shots) | key light on the shop facade |
| Bounce (directional, shadows) | `#9ea4ea`, **2.6**, from `[-15, 18, -36]` | lights walls that face away from the moon |
| Lantern (practical) | `#ff9f4a`, **2.2** × flicker | warm pool, Bram's light |
| Shop window | `#ffa955`, **1.6** | warm pool |
| Across window | `#ff9f4a`, **4.5** × lit | warm accent |
| Warm spill (ending) | `#ffa95a`, **26** × lit, at `[0.5, 2.3, 1.5]` | turns the ending warm |
| Shadows | soft, 4096 map, bias −0.0004, normalBias 0.03 | eaves, sills, chimneys |
| Fog | FogExp2 `#3d3f8e`, 0.035 | distance haze |
| Tone mapping | Three.js **Neutral**, exposure 1.0 | keeps hue |

Lights that change during a shot stay **always mounted** (intensity 0 when off), so the light count never changes mid-shot.

### 4.2 Grade (finishing)

| Layer | Value |
|---|---|
| Global lift (under captions) | `#2b2350`, `screen`, opacity **0.55** → lifted blacks |
| Global vignette | plum `rgba(25,15,45)`, opacity **0.35** |
| Night exterior grade (shots 2, 4) | `brightness(1.3) contrast(1.34) saturate(0.68)`. **Order matters:** brightness → contrast → saturate. |
| Shot 4 while the window lights (`l` = 0…1) | `brightness(1.3 − 0.28 l) contrast(1.34 − 0.44 l) saturate(0.68 + 0.3 l)` |
| Shot 1 | `brightness(1.18) contrast(0.88)` |

### 4.3 Measured on v3

| Measure | v3 whole video (mean) | Per shot | Reference p25–p75 (night shots) |
|---|---|---|---|
| Luma | 90.5 | 77–113 | 74–131 |
| Contrast (std) | 55.1 | 49–60 | 41–54 (warm/mixed 46–60) |
| p5 (darks) | 28.7 | 21–40 | 18–43 |
| p95 (highlights) | 192 | 158–213 | 160–213 |
| Saturation | 0.52 | 0.42–0.61 | 0.40–0.60 |
| Colorfulness | 61.2 | 53–69 | 57–80 |
| Warm / cool / mixed time | 21 / 59 / 20 % | sequence `CC-CCCW`, **1 switch** | 18/20 videos mix both |

**v3 palette** (k-means, share of screen time): `#46295f` 19 % · `#ad96d5` 15 % · `#222b9f` 15 % · `#25163f` 14 % · `#74466d` 12 % · `#7c6ea9` 11 % · `#b77679` 8 % · `#eec5a6` 7 %.
In words: blue-violet night, lilac moonlit walls, warm peach practicals.

### 4.4 Light on the characters (`src/three/CharacterCard.tsx`)
- Characters are flat 2D cards that face the camera and **take scene light**: cool ambient × texture + warm falloff from up to 2 lights.
- Ambient **`#aab6f2` × 0.9**, top tint `#1c2652`.
- Warm light on characters = **`#ffcf8c`** (yellower than the world's warm light): lantern 0.55, shop window 0.35, across window 0.5, ending spill 0.45.
- Resulting faces: pale lilac-white at night (reference castle face `#b5abe6`). **Never magenta.**

---

## 5. World look

| Item | Locked value |
|---|---|
| Line style | **thin line art, 2 px** screen-space (`LineSegments2`), color `#20182c`; measured **1.91 px** |
| Character vs world lines | character outlines always thicker (3.4 % of head ≈ 9–19 px) |
| Textures | procedural "painted" canvas textures (plaster with blotches and brick patches, cobbles, wood, roof tiles), seeded |
| Detail checklist | chimneys, drainpipes, flower boxes, clothesline with laundry, unlit street lamps, bench, barrel, crate, potted plant, awning, hanging sign, more houses so the street continues, distant rooftops in haze |
| Sky | equirect 4096×2048 gradient + stars, moon sprite + large soft halo + moonlit cloud streaks |
| Background blur | 1 shot of 5 (close-up): world layer blurred **3 px**, character sharp (two canvases) |
| Measured sharpness | sharp σ 0.77 px / soft σ 1.27 px (reference 0.62 / 1.14) |

---

## 6. Captions (`src/film/Captions.tsx`)

| Item | Locked value | Measured v3 | Reference |
|---|---|---|---|
| Font | **Montserrat Black (900)**, Google Fonts via `@remotion/google-fonts` | — | unconfirmed; Segoe UI Black closest |
| Size / tracking | **72 px**, −0.02 em | x-height **40.4 px**, ascender 51.2 px | 40.6 / 53 px |
| Position | centered, text-box center at **70.3 % H** (baseline = center + 0.35 em) | 70.4 % H, 50.1 % W | 70.3 % / 49.9 % |
| Fill / outline | white, black stroke **5 px** outside (paint-order stroke) | outline 6 px top | ~6 px |
| Shadow | `feDropShadow dx 4, dy 3, blur 2, black 0.85` | dark to 11 px down / 13 px right | 10 / 13 px |
| Words per caption | 1 word ≈ 2/3, 2 words ≈ 1/3 (hand-chunked) | 21 × 1-word, 11 × 2-word chunks | 67 % / 28 % |
| Pace | first 3 s at **4.0 words/s**, then ~3.6, last 5 words ×1.18 slower, pauses after sentence ends (3–4 frames) | 44 words / 12 s = 3.67 w/s | 4.0 / 3.7 / 3.4 |
| On screen | always | coverage 100 % | 99.5 % |

---

## 7. Story light events (no fake cuts)

| Event | Locked ramp | Why |
|---|---|---|
| Lantern turns on | 10 frames, keys `[0, 0.55, 0.45, 1]` at `+0/+4/+6/+10` (small flicker) | 4 frames was detected as a cut |
| Window turns on | **22 frames**, keys `[0, 0.35, 0.3, 1]` at `+0/+6/+10/+22`; **lit glass cross-fades over the dark glass** (`fade` prop) | the texture swap, not the ramp length, made the hard cut |
| Flame flicker | `1 + 0.05 sin(0.37 f) + 0.03 sin(1.13 f + 1.7)` | slow, never strobing |

---

## 8. Accepted deviations (locked anyway)

| Item | v3 | Range | Decision |
|---|---|---|---|
| Shot 2 p95 | 158 | 160+ | accepted (2 points) |
| Shot 2 saturation | 0.61 | ≤ 0.60 | accepted |
| Shot 2 roll | 0.5° | 0.51°+ | accepted |
| Colorfulness, shots 1 and 4 | 53–54 | 57–80 | accepted |
| Contrast, lit shots | 54–60 | night 41–54 | inside the warm/mixed range 46–60 |
| Window at 8.4–8.8 s | detector sees 2 soft changes | — | measurement artifact: a big light change, not a cut |

---

## 9. What went wrong in v1 / v2, and the fix

### v1 → v2

| # | Problem | Numbers / symptom | Root cause | Fix (now locked) |
|---|---|---|---|---|
| 1 | First 5 frames almost blank | luma 37, contrast 16; detected as a hard cut at 0.17 s | the wide start (`d0` 10.5 m) put the camera **inside the house across the street** | fast entry push done as a **lens zoom** (fov 70 → 44); the camera stays in the street |
| 2 | Captions slightly big, shadow long | x-height 42.4 px; shadow 11 px down / 15 px right | first-guess size | 76 → **72 px**, outline 6 → **5 px**, shadow dx 6 → 4, dy 4 → 3; verified with `style_probe.py` |
| 3 | Shots 2 and 4 dark and flat | luma 36–42, contrast 14–16, p95 44–57 | walls faced away from the moon; dark sky; nothing bright in frame | moon moved into shot 2's sky + halo + cloud streaks; bounce light 2.6; brighter sky; glass moon reflections; lighter wall; soft shadows; per-shot night grade |
| 4 | Shot 2 measured "static" | zoom 1.3 %/s, drift 0.004 | flat image with little to track + far target | more contrast and detail + `rate` 0.15 + drift 0.22 m/s |
| 5 | Framing too tight | heads 33–44 % (medium), 47–60 % (close-up) | distances chosen by eye | `d0` computed from the head-% formula (§2.1) |
| 6 | Push-in a bit slow | 7.6–8.8 %/s measured with `rate` 0.10 | parallax: measured ≈ 0.78 × set | rates 0.11–0.15 |
| 7 | Drift too low | 0.004–0.02 frame widths/s | drift set in meters without thinking of frame width | drift ≈ 0.05 × frame width per second |
| 8 | Magenta faces | face `#cfa3d1` | orange warm light × saturated blue ambient = magenta | ambient `#aab6f2` × 0.9; warm on characters `#ffcf8c`, weaker. Design untouched. |
| 9 | Saturation high | 0.59 mean; 0.68–0.69 in night shots | saturated purple lights + grade | neutral lights + `saturate(0.68)` in the night grade → 0.52 mean |
| 10 | Lantern turning on read as a cut | 4-frame "dissolve" at 1.57 s | 4-frame ramp | 10-frame ramp with a small flicker |
| 11 | World sparse, flat walls | by eye vs the reference alley frame | only a few props; frontal cameras | detail checklist (§5) + diagonal cameras + shadows |

### v2 → v3

| # | Problem | Numbers / symptom | Root cause | Fix (now locked) |
|---|---|---|---|---|
| 12 | Vertical line through Bram | seen in shot 1 stills | with a diagonal camera, the flat card **tilted into the shop window frame** | lantern moved 0.25 m off the wall; Bram's position follows it |
| 13 | Pole missed the lantern | by eye | card yaw shifts the pole sideways | `BRAM_POS` solved from the shot-1 camera yaw at the lighting moment |
| 14 | New bench in front of Bram's legs | shot 5 | prop placed before checking the character spot | bench moved right and made shorter |
| 15 | A contrast grade made frames darker | luma 64 after `contrast(1.22)` | contrast pivots around mid-grey, and night frames sit below it | **brightness first**, then contrast, then saturate |
| 16 | Shot 1 slightly dark | luma 69 | the wide opening has a large dark street foreground | `brightness(1.18) contrast(0.88)` |
| 17 | Window still a **hard cut** | 1-frame cut at 8.4 s even with a slower ramp | glass texture **swapped from dark to lit in one frame**; lit boost 2.4× clipped it to white | lit glass cross-fades over the dark glass; boost 1.3×; more orange texture |
| 18 | No warm shot | sequence `CC-CCC`, 0 switches | violet (hue 130–150) counts as cool in the classifier; warm light too weak | warm spill light from the lit window → ending measures **warm** (w 0.52 / c 0.34) |
| 19 | Lit-window shot too contrasty | contrast 72 | strong night grade + big bright window | grade relaxes with the window light (§4.2) |

### Process lessons
- **Measure with the reference scripts**, not by eye: `visual_analysis.py` + `style_probe.py` on our render give numbers directly comparable to the channel.
- **And look at the frames:** numbers missed the camera inside a house, the card intersection and the bench. Check stills of every shot after each change.
- Test with single stills (`remotion still … --frame=N`) before full renders. A full 12 s render takes ~35 s.
- Tools: on this Windows setup, long inline shell scripts with mixed quotes fail. Write patch scripts to files instead. `python -I` ignores `PYTHONIOENCODING`, so scripts call `sys.stdout.reconfigure(encoding="utf-8")`.

---

## 10. How to re-measure (after any change, e.g. the brightness iteration)

**Short way (since 2026-11-04):** the numbers of this file are also in `locks.json`.

```bash
.venv/Scripts/python -I tools/regress_frames.py          # same look? StyleTest vs frames/ (mp4 vs mp4)
.venv/Scripts/python -I tools/check_render.py <video.mp4> --profile styletest|episode [--captions captions.json]
```

`check_render.py` compares each shot with the reference range **of its own light kind** (cool / warm / mixed). On v3 it finds 0 fails, the 6 accepted deviations of §8, and 4 small warnings not listed in §8: shot 3 (mixed) luma 102 < 104, p5 25 < 26, colorful 68 ≈ 68; shot 7 (warm) luma 96 < 98. All four say "a bit dark", so they are input for the reserved brightness iteration.

**Long way (manual):**

```bash
npx remotion render StyleTest out/vX/style_test_vX.mp4 --crf=16
mkdir -p out/vX/analysis_run/videos && cp out/vX/style_test_vX.mp4 out/vX/analysis_run/videos/style_test.mp4
.venv/Scripts/python -I tools/visual_analysis.py out/vX/analysis_run --workers 1
.venv/Scripts/python -I tools/style_probe.py out/vX/analysis_run --workers 1
.venv/Scripts/python -I tools/numbers_table.py out/v3/analysis_run out/vX/analysis_run --md out/vX/numbers.md
```

Comparison sheet (extract frames 50, 100, 170, 262, 330 into `out/vX/frames/` first):

```bash
.venv/Scripts/python -I tools/compare_sheet.py out/vX/comparison_sheet.jpg v3=style_lock/frames_sheet vX=out/vX/frames
```

### Reserved brightness iteration (only if the phone review asks for it)
- Change **only** the global brightness: the `Grade` lift opacity (0.55) and/or `toneMappingExposure` (1.0). Do not touch per-shot moves, colors or captions.
- After the change, every shot must still measure **luma 74–131** and **p5 18–43**.
- Phone screens in daylight make dark frames look darker than the file. If v3 looks too dark outside, raise exposure in small steps (1.0 → 1.08) and re-measure.

## 11. Warm interior light — v3.1 (locked 2026-11-07)

Preset `warmInterior` (`src/world/lights/warmInterior.tsx`), used by the `workshop` set. Calibrated in 2 iterations (D10), one last try in the look session (D12), then **locked as it is**. Values: see the file (hemi 2.5, key 2.3 `#ffe2c2`, cool fill 0.55 `#8fa0e8` from `[6, 3, -2]`, grade `brightness(1.28) saturate(0.72)`, character ambient `#f0dcc8` 0.9).

**Accepted deviations** (warm reference p25–p75; the user approved the look by eye on the phone):

| Number | Workshop | Reference warm |
|---|---|---|
| colorful | 45–52 | 59–83 (the room is one warm hue; the window is the only cool accent) |
| luma (wide shots) | 86–90 | 98–150 |
| p95 | 175–190 | 202–234 |
| contrast (close shots) | 62–69 | 46–60 |

**Lesson:** the fill comes from slightly behind (z = −2), so it does not reach the back wall; making it stronger (0.9) changed nothing. If a future set needs more cool color, move the fill to the front (z > 0) instead of raising its strength. Reports: `tools/tests/calibration/warm_interior/` (v1–v3, `report_v4_fill.md`).

## 12. Day exterior light — v3.1 (locked 2026-11-07)

Preset `dayExterior` (`src/world/lights/dayExterior.tsx`) on the `day_street` set (the night street by day: `day` switch in `src/world/sets/NightStreet.tsx`, set data `day_street.json` with `"light_kind": "day"`). Target = the **day range**: p25–p75 of 95 reference day outdoor shots marked by eye (`references/analysis/day_shots.json`): luma 119–153, contrast 45–56, p5 40–67, p95 206–233, sat 0.38–0.51, colorful 68–90. v1 + 2 iterations (D10 cap) + 1 extra iteration authorized by the user, brightness only; then **locked as it is**.

Values: see the file (hemi 4.2 `#bcd8f5`/`#b09070`, sun 4.6 `#fff0d8` from `SUN` [−30, 48, 42] with shadows, near-neutral fill 0.9 `#e2e4ea`, light blue haze fog, grade `saturate(1.2)`, character ambient `#fff4e6`). Day dressing: day sky with clouds (`kit/DaySky.tsx`), warm saturated wall paint, sky-blue glass with curtains, green shutters, sand cobbles, practical lights off, both street ends closed with hazy houses.

**Accepted deviations** (approved by the user on the comparison sheet):

| Number | day_street (it3) | Day reference |
|---|---|---|
| luma, close-up on the dark door / wall shot | 101 / 116 | 119–153 |
| p5 (darkest parts) | 28–34 | 40–67 (the locked v3 lift + dark ink lines) |
| p95 | 186–194 in 3 shots | 206–233 |
| sat, colorful (wide shots) | 0.31–0.32, 66 | 0.38–0.51, 68–90 |
| contrast, door close-up | 65 | 45–56 |

**Lessons:** (1) light alone can't make a night set look like day: paint, glass and ground need day versions; (2) day shots need sky in frame (look along the street), and then the street ends must be closed; (3) the locked global lift (`#2b2350` screen) tints day shadows lilac, so the fill must be near-neutral, not blue. Reports: `tools/tests/calibration/day_exterior/` (`report_v1`–`report_v4`).
