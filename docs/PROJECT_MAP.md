# Project map

What each folder and important file is, and where to find things.
**Keep this file up to date:** when a folder or an important file is added, moved, renamed or removed, update this map in the same change (rule in `CLAUDE.md`).

Last update: 2026-11-12.

## Where we are (phase)

| | |
|---|---|
| Phase | **Phase 4, part 1** — building the channel skill `generate-animated-shorts` (plan: `PLAN.md`, branch `skill-v1`) |
| Done | Steps 0–13 of `PLAN.md` §8. The 12 s pipeline test `videos/2026-11-04-foggy-glasses/` went through all four stops (A1–A4); git tag `pipeline-v0` |
| Look | Locked at **v3** and final (tag `style-v3`, `style_lock/locks.md`); D3 brightness: no change. New lights locked as **v3.1** (2026-11-07): `warmInterior` (§11), `dayExterior` (§12) |
| Next | **v4 look track** (2026-11-10): always-on character looks that change the v3 look on purpose (new baseline after approval). L1 head shading + outline, L2 3D clothing: references downloaded and analysed in `references/looks/README.md`; user's decisions taken; branch `look-v4`. **L1 locked** (2026-11-10, always on, half rim; recipe `references/looks/head-shading.md`, code `src/character/look.ts`). **L3 character identity locked** (2026-11-10): head shapes men Gumdrop, women Chibi (PLAN D19 built, `references/looks/character-identity.md`), from `gender` in `src/cast/cast_meta.json` (Juno = Chibi override); cast test `out/identity/cast_test_v4.mp4`. **L2 3D clothing locked** (2026-11-10, always on): torso shading + white streak, outfit details turn with the 3D face, actor `"bg": true` = big shapes only (recipe `references/looks/cloth-3d.md`, test `out/looks/L2-test/`); regression baseline now **`v4cloth`**. Next: **VFX items 5–12** (item 5 edge lines). Narrator voice **decided** (2026-11-11, PLAN D20, branch `narrator-voice`): Kokoro `af_heart`, `tools/tts_kokoro.py`; channel-own voice parked |
| Now | **Style v4 = VFX** (branch `style-v4`, from `skill-v1`): effects learned from reference Shorts, one at a time, each locked only after the user approves its side-by-side test. List and status: `references/effects/README.md`. Locked effects: `style_lock/locks_v4.md`. Item 1 **anger** locked (2026-11-09). Item 2 **heat sweat** locked (2026-11-09; fx `heat` + shared drop `sweat`). Item 3+4 **3D face** locked (2026-11-10; fx `shock`, `laugh`, `shy`, `think`, `happy`; recipe `references/effects/face-stretch.md`). Items 9+11 **jump combo** locked (2026-11-10, on `look-v4`; step channel `jump`: `hop`, `big` + landing dust, face free, face fx `scared`; recipe `references/effects/jump.md`). Item 5 **edge lines** locked (2026-11-11, test 1; shot field `lines` + camera `punch`, for anger / shouting / shock; recipe `references/effects/edge-lines.md`). Item 12 **walk** locked (2026-11-11; actor field `walk`, paces `normal` / `fast` / `rush`; recipe `references/effects/walk.md`). Item 8 **background filling** locked (2026-11-11, on the bridge: B = the most props + a far land with fields, town, trees, uneven ridges in a capped haze; recipe `references/effects/depth-filling.md`). Next: item 7 depth, item 13 mountains (partly built with 8), the other sets, then item 6 laugh tears. **Sound effects** (2026-11-11): woosh, click, idea (ding), alert locked (`references/sound-effects/sfx.md`, plan field `sfx`) |
| Open | First full 35–60 s video, **finished** (2026-11-07), not uploaded yet: `videos/2026-11-07-bridge-break-step/` (A1–A4 approved; `final.mp4` checked in `check_final/`, 0 FAIL; logged in `channel/log.json`; title and description in `upload.md`; feedback FB1–FB8 resolved: music Jigsaw Puzzle 26 dB under the voice, z-fighting fixes + `flicker.py` check, richer background, river into the haze, 76 m shadow box, `set_review.py` + set-building checklist). Done: hook rules (PLAN D16); endings (PLAN D17, provisional: button default / explain, no cut-off; review after 2–3 full videos); voice pace 3.5 w/s with atempo per take + female Eleven v4 voice (PLAN D18). Music: 7 YouTube Audio Library tracks in `assets/music/` (D7, added 2026-11-07) |

## Two skills, one command

| What | Path | Job |
|---|---|---|
| `generate-animated-shorts` | `.claude/skills/generate-animated-shorts/` | Makes a video, idea → final render, with stops A1–A4. The only one that changes code or video files |
| `explain-find-feedback` | `.claude/skills/explain-find-feedback/` | Explains the project, finds a video's files, writes feedback in `videos/<slug>/feedback.md`, and explains in Portuguese what `/feedback` changed (before/after image). Never changes code |
| `/feedback` | `.claude/commands/feedback.md` | Applies the approved feedback items of a video, following `generate-animated-shorts` |
| Skill test runs | `.claude/skills/*-workspace/` | skill-creator outputs (git-ignored) |

## Top level

| Path | What it is |
|---|---|
| `CLAUDE.md` | Project rules for Claude (short) |
| `PLAN.md` | Build plan, decisions D1–D19, open questions, parked ideas (e.g. the free narrator voice) |
| `docs/PROJECT_MAP.md` | This map |
| `docs/next_session_prompt.md` | The prompt to paste at the start of the next session (still a copy of `docs/prompts/4-snow-mountains.md`; session 4 snow kit **done 2026-11-12**; the next session is not chosen yet: other themes medical / market, or a first video with a new scene) |
| `docs/prompts/` | Session prompts of the scenes plan: `2-set-template.md` (done 2026-11-12), `3-theme-kits.md` (theme kits + free CC0 3D packs; home interiors + medieval done 2026-11-12), `4-snow-mountains.md` (snowy mountain theme kit: our own pieces, the CC-BY Mountain Cabin as reference only; done 2026-11-12) |
| `videos/` | One folder per video (below) |
| `src/` | Remotion + three.js code that draws the videos (below) |
| `tools/` | Python tools (run as `.venv/Scripts/python -I tools/<tool>.py`) and their tests in `tools/tests/` |
| `references/` | What we learned from the 20 reference Shorts (style only, never content) |
| `style_lock/` | The locked look v3 |
| `channel/` | `log.json` (every finished video, for variety) and `ideas.md` (all proposed ideas) |
| `public/packs/` | Free 3D packs per theme (scenes plan 3): `home-interior/` (30 CC0 `.glb`, Quaternius + Kenney), `medieval/` (CC0: Kenney Castle Kit in one file + Quaternius Castle Fortress; `p_castle_02.glb` NOT used), `snow/` (CC0 Quaternius Rock Snow). `.glb` git-ignored; `README.md`, each pack's `LICENSE.txt` + `sources.txt` in git. In `public/` because Remotion loads files only from there |
| `public/reference-only/` | **Reference-only models** (scenes plan 4): looked at to learn a pattern, NEVER loaded by a set or a video (`README.md`). `snow-cabin/` = the CC-BY "Mountain Cabin" (Alex Safayan), loaded only by the `SnowRefSheet` composition. Model files git-ignored; `README.md` + `sources.txt` in git |
| `assets/music/` | Music tracks from the YouTube Audio Library (git-ignored, only `README.md` in git) |
| `assets/sound-effects/` | Sound effects (the user's MP3s: woosh 1/2, click + pop, ding, alert; later reverse, fire, cash register, crash). Git-ignored, only `README.md` (sources, licenses, ⚠ game sounds) in git. Placed by `mix_audio.py` from the plan's `sfx` list |
| `public/episodes/<slug>/` | Copy of `mix.wav` for Remotion (git-ignored) |
| `out/` | Scratch renders and tests (git-ignored) |
| `node_modules/`, `.venv/` | Installed packages (git-ignored) |
| `.venv-tts/` | Python 3.12 venv for the narrator voice only (Kokoro, CPU PyTorch; PLAN D20; git-ignored). Kokoro needs Python < 3.13, the main `.venv` is 3.14 |

## One video: `videos/<yyyy-mm-dd>-<slug>/`

Files in the order the flow makes them. (git) = in git; (media) = git-ignored (D13), back it up elsewhere.

| File | Step | What it is |
|---|---|---|
| `idea.md` (git) | 1 | The chosen idea |
| `brief.md` (git, optional) | 1 | The user's script brief (roteiro), word for word + numbered points B1, B2…; followed at steps 3 and 7; **brief check** table at A1 (switch ON/OFF in SKILL.md A1) |
| `facts.md` (git) | 2 | Every fact `F1, F2…` with source URL and exact quote |
| `script.md` (git) | 3 | The script with beat and fact tags; `approved:` line on top after A1 |
| `voice_text.txt` (git) | 4 | Text for the voice (`tts_kokoro.py`, D20); rare words get `[word](/phonemes/)` |
| `audio/voice_raw.*`, `audio/voice.wav` (media) | 5 | The voice as made by `tts_kokoro.py` (24 kHz), and sped up + trimmed 48 kHz |
| `audio/words.json`, `audio/pace.md` (git) | 6 | Time of every word; speaking pace report |
| `captions.json` (git) | 6 | Caption chunks with start frames |
| `scene_plan.json` (git) | 7 | **The shot list**: shots, sets, cast, camera, light, timed by word anchors |
| `scene_plan.md` (git) | 7 | Readable table of the plan; `approved:` lines for A2–A4 |
| `render_props.json` (ignored) | 7 | Plan with exact frame numbers (`from`, `len` per shot), made by `build_props.py` |
| `storyboard/` (media) | 8 | One still per shot `f<frame>.png` + `sheet.jpg` |
| `audio/mix.wav`, `audio/mix.json` | 9 | Voice + music (wav = media, json = git) |
| `preview.mp4` (media) | 9 | Preview render |
| `check/check_report.md` (git), `check/still_sheet.jpg` (media) | 10 | Automatic check of the preview |
| `feedback.md` (git) | any | Feedback items `FB1, FB2…` (made by `explain-find-feedback`, fixed by `/feedback`) |
| `feedback/` (media) | any | Feedback frames: `t<sec>s_*` (latest run), `FB<n>_sheet.jpg` (before), `FB<n>_after.jpg`, `FB<n>_compare.jpg` (before on top, after below) |
| `final.mp4` (media), `upload.md` (git) | 11 | Final render; title and description for YouTube |

## Code: `src/` — which file draws what

| Path | What it draws / does |
|---|---|
| `src/Root.tsx`, `src/index.ts` | List of Remotion compositions |
| `src/episode/Episode.tsx` | The **Episode** composition: turns `render_props.json` into the video (v4: `fxAt`, `jumpAt`, `walkAt` step channels; `pathAt` = a walking actor's position) |
| `src/episode/sets.tsx` | Set registry: which set file draws each `set` id, its light and grade, and an optional `actorOffset` (actors ride a moving set, e.g. the bridge deck) |
| `src/episode/types.ts` | Types of the plan/props (v4 walk: `Actor.path` = the feet move along points) |
| `src/film/camera.ts` | Camera presets and moves |
| `src/film/Captions.tsx` | Caption look and timing (**locked** style) |
| `src/film/EdgeLines.tsx` | v4 VFX item 5 **edge lines** (**locked** 2026-11-11): tapered lines from the frame edges toward the subject, shot field `lines` (`types.ts`, drawn in `Episode.tsx`); the mid-shot fast push-in is `fast.at` in `camera.ts` (`punch` in the plan) |
| `src/film/Shots.tsx`, `src/film/script.ts` | v3 StyleTest shots/timing (regression test) |
| `src/character/draw.ts`, `specs.ts` | Base character drawing and proportions (**locked**; v4 hooks only take effect when an effect field is set) |
| `src/character/look.ts` | v4 **looks** L1 + L2 (**locked**, always on): L1 thin/thick ink, light rim on the lit edges (half strength), soft head shading, gloss on hair/hats; L2 torso shading + streak (`shadeTorso`) and the outfit details turning with the 3D face (`turnTorso`). `"look": null` in the props = v3 characters (tests only; `Episode.tsx`, `StyleTest.tsx`); `{"body": 0, "turn": 0}` = without L2. Background actors (`"bg": true`) → `detailBg()` in `draw.ts`: outfits skip small details |
| `src/character/head.ts` | v4 **look L3, character identity** (**locked** 2026-11-10, PLAN D19): head shapes `round` (v3, used when `"look": null`), `gumdrop` (men), `chibi` (women, + chibi **face layout**: big low eyes, small low mouth). The shape comes from the cast (`gender` / `head` in `cast_meta.json` → `registry.ts`); per actor in props `"head"` = tests only. `headPath()` is used by the head, L1 shading, anger fill and face clip |
| `src/character/fx.ts` | v4 effects drawn on the character (anger fill, outlined smoke, grit/yell mouths, V brows, angry lids; sweat drop, heavy tired lids, wavy/pant mouths, cloth in the free hand; 3D face: sphere turn, new eye shapes, smirk/laugh/openSmile mouths; jump landing dust); off by default. Jump legs/stretch: `drawJumpLegs` + body transform in `draw.ts`; v4 walk legs (scissor, knee forward) + dip / sway / lean: `drawWalkLegs`, `upperBody` in `draw.ts`; the jump height (`lift`) moves the card in `src/three/CharacterCard.tsx` |
| `src/cast/` | Cast: `registry.ts` (who exists, variants like `mira_fogged`; riflemen `rifleman`, `rifleman_b`, `rifleman_c` for the bridge video; furnace-ghosts family `lena`, `lena_mom`, `lena_dad`, `priest`, `repairman`, `coat_man`), `parts.ts` (glasses, hair, shako, rifleman jacket, rifle…; 2026-11-13: `braids`, `pajamas`, `longHair`, `robe`, `shortHair`, `sweaterVest`, `clericalCollar`, `prayerBook`, `overalls`, `wrench`, `wideHat`, `longCoat`), `expressions.ts`, `fx.ts` (v4 timed effects, step `fx`: `anger`, `sweat`, `heat`; 3D face `shock`, `laugh`, `shy`, `think`, `happy` + `_l` mirrors, `scared`; step `jump` (body only, `JUMPS`): `hop`, `big`, `_nodust`, `none`; step `walk` (body only, `WALK`, `WALKS`, `walkStop`): `subtle` / `bouncy` + `_sway` + `_fast` / `_rush`, `stop`, `none`), `makeCharacter.ts` (sets `busyHand` from parts that hold a prop, `glasses` from glasses parts), `cast_meta.json` (silhouette, main color, **`gender`** → head shape, optional **`head`** override; `registry.ts` `headOf`) |
| `src/three/` | 3D helpers: `CharacterCard.tsx` (2D character on a card in 3D), `Outlined.tsx` (outlines; `OMesh` options `fog`, `vertexColors`, `fogMax` = capped haze for far meshes), `Rig.tsx`, `textures.ts` (painted textures; bridge set adds river, grass, stone, deck, break-step sign), `NightStreet.tsx` (v3 scene) |
| `src/world/sets/` | Places: `NightStreet.tsx` + `night_street.json` (marks), `day_street.json` (the same street by day, `day` switch in `NightStreet.tsx`), `Workshop.tsx` + `workshop.json`, `Bridge.tsx` + `bridge.json` (chain bridge over a river by day; animated levels `bounce`, `drop`, `march`, `sign`; own sun + 76 m shadow box; props filled + far land, item 8), `bridge_land.tsx` (the bridge's far land: terrain, fields, trees, town, windmill, mountain ranges), `LenaBedroom.tsx` + `lena_bedroom.json` + `lena_bedroom_cams.json` and `OldBasement.tsx` + `old_basement.json` + `old_basement_cams.json` (2026-11-12, warmInterior rooms of an old house at night for `videos/2026-11-12-furnace-ghosts`; levels: bedroom `lamp`, `plant`, `sitter`; basement `furnace`, `bulb`, `cracked`, `door`; `BUILDING.md` has the creepy-basement recipe and the card-through-a-prop rule), `README.md` (set list + set-building checklist), **`BUILDING.md`** (scenes plan 1: how to build a new set, 10 steps with the user's stops S1 plan → S2 still → S3 video), `<id>_cams.json` (a set's planned cameras, e.g. `bridge_cams.json`; read by `camera_view.py`, `before_after.py`, not by the renderer), **`base/`** (scenes plan 2, the **set template**: `OutdoorBase.tsx` day/night (ground disc to the sky, sky ≤ 150, sun side, sized shadow box, capped haze on the `far` slot, `top(n)`), `IndoorBase.tsx` warmInterior (closed room, windows + view slot, `ON_WALL`), 4 layer slots `front`/`middle`/`back`/`far`; `outdoor.tsx.tpl`, `indoor.tsx.tpl` = the starting set files used by `tools/new_set.py`) |
| `src/world/kit/` | Building blocks: `Building`, `Window`, `HangingLantern`, `NightSky`, `DaySky` (`radius`), `Glow`, `interior`, `props`; item 8: `country` (rural props: stall, cart, haystack, boats, reeds, tufts, flowers…), `land` (far land: terrain, trees, town, windmill, barn, `MountainRange`), `Branch` (corner branch near the camera, shot field `branch`, close shots only); scenes plan 3 (free 3D packs): **`pack.tsx`** (`PackPiece`: loads any `.glb` from `public/packs/`, restyles it to our look: our ink lines without triangle lines, our tones, flat faces, duplicates dropped; `anchor` back = on a wall), **`home.tsx`** (theme kit home interiors: `HomePiece` with 30 kinds, kitchen + bathroom + any room, `finish` color variations, `COUNTER_H`), **`medieval.tsx`** (theme kit medieval: `MedievalPiece` (fortress + Kenney walls, flags, siege machines, props; `stone`, `roof` finishes), `Tower`, `CastleRing`; `PackPiece` `node` picks one piece of a many-piece file, `hide` drops materials); scenes plan 4: **`snow.tsx`** (theme kit snow, 100 % our code: `SnowPeak`, `SnowRange`, `SnowGround` + `snowSlope` + `snowGroundTex`, `SnowPines`, `SnowRocks`, `MountainHut`, `Smoke`, `PeakCamp`, `Tent`, `Campfire`, `CampStove`, `Backpack`; `snowShell` = a snow layer lifted on any faceted geometry; `SNOW_TONES`); **`house.tsx`** (theme kit old house, 100 % our code, 2026-11-12/13: `Bed` (`sitter`) + `bedSitAt`, `BedsideLamp`, `Furnace` (`glow`, `cracked`), `Stairs` (`landing`), `CeilingPipe`; creepy mood: `AjarDoor`, `DarkOpening`, `Darkness`, `CornerWeb`, `DrapeWeb`; textures `cobwebTex`, `darknessTex`, `lightSpillTex` in `src/three/textures.ts`) |
| `src/world/lights/` | Light presets: `nightExterior.tsx` (v3), `warmInterior.tsx` (**locked** v3.1), `dayExterior.tsx` (**locked** v3.1), `colors.ts` |
| `src/world/inserts/Diagram.tsx` | Flat 2D diagram shots (inserts) |
| `src/style/Grade.tsx`, `palette.ts` | Color grade and palette (**locked**) |
| `src/compositions/` | Test sheets: `StyleTest` (v3 regression), `Lineup`, `FlatSheet`, `Proposal`, `CaptionTest`, `HeadShapes` (the 3 head shapes on the cast, flat → `out/identity/`), `KitSheet` (every kit piece alone, one per frame, for `kit_catalog.py`; new kit piece = a line in its `KIT` list), `HomeKitSheet` (theme picture home interiors: one tile per `HomePiece` + kitchen/bathroom combos, `kit_catalog.py --theme home`), `MedievalKitSheet` (theme picture medieval: pieces, towers, finishes, castle + siege camp combos, `--theme medieval`), `PackTest` (style test of pack pieces, prop `pack` `home` / `medieval` / `snow`: as it comes / + lines / our look → `out/packs/style_test*.jpg`), `SnowKitSheet` (theme picture snow, `--theme snow`), `SnowRefSheet` (the reference-only Mountain Cabin in our day light, 6 cameras; prop `ours` = our pieces at the same spots → side by side), `SnowKitTest` (9:16 snow test scene: peak camp, hut on a slope, peaks, far range; 4 cameras) + `SnowKitSweep` (3 s camera move for `flicker.py`) |

## Tools: `tools/`

| Tool | Job |
|---|---|
| `source_text.py` | Page/PDF → text; full sentence for a quote; checks quotes in `facts.md` |
| `script_check.py` | Script checks (count, beats, hook, originality, fact tags) |
| `tts_kokoro.py` | **Narrator voice** (PLAN D20): `voice_text.txt` → `audio/voice_raw.wav` with Kokoro `af_heart`; stops on words not in Kokoro's dictionary (fix: `[word](/phonemes/)`). Run with `.venv-tts/Scripts/python -I` |
| `voice_words.py` | Voice import, atempo speed-up (`--tempo`, D18), trim, word times, pace |
| `make_captions.py` | `words.json` → `captions.json` |
| `build_props.py` | `scene_plan.json` → `render_props.json` + plan check (v4: shot `lines`, camera `punch`, actor `walk` → path + walk steps, `WALK_PACES`). Walk test: `tests/test_walk.py` |
| `storyboard.py`, `render_stills.mjs` | One still per shot + `sheet.jpg` |
| `variety_check.py` | Plan vs `channel/log.json`; `--summary`; `--log` |
| `mix_audio.py` | Voice + music + sound effects (`sfx` list in `scene_plan.json`: the sound's hit lands on the anchor, level relative to the voice) → −14 LUFS mix; `--no-music` = voice + SFX only |
| `check_render.py` | Measures a render against `style_lock/locks.json`; shots of a day set (`"light_kind": "day"`) use the day range; includes the flicker check (FAIL) |
| `new_set.py` | **New set from the template** (`BUILDING.md` step 4): `<id> --light day\|night\|interior` → `src/world/sets/<Name>.tsx` + `<id>.json` (marks, camera bounds, review block: sun side, shadow box sized to the set; interior `room`) + registry entry in `src/episode/sets.tsx`; `--remove` undoes a set it made |
| `set_review.py` | Reviews a whole set before a plan uses it: shadow-box check, 8 wide views (`out/set_review/<set>/`), flicker on a moving sweep |
| `kit_catalog.py` | Kit catalog: renders every kit piece (`KitSheet`) → labelled sheet `references/sets/kit_catalog.jpg`; `--check` = every kit export is in `KitSheet.tsx` and `KIT.md`; `--theme home|medieval|snow` = theme picture `references/sets/kit_<theme>.jpg`. Re-run when the kit grows |
| `camera_view.py` | Camera view check (`BUILDING.md` step 5): top-down map of where each planned camera sees the ground, colored by how big a 2 m prop looks there, + the thin-band table → `out/camera_view/<name>/map.jpg`. Input: `<id>_cams.json` or a video folder. Geometry only (no walls block the view) |
| `before_after.py` | Before/after sheet (`BUILDING.md` step 8): `--tag before` / `--tag after` render stills of the planned cameras, `--sheet` puts them in one picture → `out/before_after/<name>/before_after.jpg` |
| `set_cams.py` | Shared by the two tools above: loads cameras (cams file or `render_props.json`), `camAt` math, stills props |
| `flicker.py` | Finds z-fighting (patches that flip A→B→A frame to frame); used by `check_render.py`, or alone on a new set before A3. Test: `tests/test_flicker.py` |
| `regress_frames.py` | Checks that `src/` changes keep the locked look: baseline `v4cloth` (v3 + L1 + L3 head shapes + L2 clothing, default; `v4id`, `v4look` = history); `--baseline v3 --props tools/tests/look_off.json` = v3 drawing path; `--make-baseline` after an approved look change |
| `feedback_frames.py` | Frame at a time + 2 neighbors, and which shot/files it belongs to (for feedback); `--item FB<n> --before …` makes the before/after compare image |
| `vfx_side_by_side.py`, `vfx_tests/` | v4: reference vs our test, side by side (`--ref-loop` for a short reference shot, `--test-from` when our effect starts later in the shot); test props per effect (`anger_smoke_props.py`, `heat_sweat_props.py`, `face_stretch_props.py`) and per look (`look_l1_props.py`: L1 mockup stills; `look_l1_test_props.py`: L1 4-shot moving test; `head_shape_anim_props.py`: identity cast test, the cast in the 4 test sets, pairs doing the same reactions; mode `l2` = the L2 clothing test with background actors `"bg": true`; `jump_props.py`: jump combo test, hop + big jump with different faces in the 4 sets; `edge_lines_props.py`: edge lines + punch test, 4 sets + one A/B shot without the punch; `walk_props.py`: walk A/B test, two walkers toward a camera that travels with them + start/stop; `walk_fast_props.py`: fast walk A/B, mode `rush`: fast vs rush + the 3 paces side by side; `depth_fill_props.py`: background filling test, 5 bridge cameras before / A / B, `--c3` the wide view; history: its `fill` levels no longer exist) |
| `vfx_clip.py` | Cuts a time range of a VFX reference: every frame + labelled contact sheet in `references/effects/frames/<name>/` |
| `make_test_voice.py` | Free Windows test voice (tests only) |
| others (`style_*`, `visual_analysis`, `measure_frames`, `compare_sheet`, `summarize_*`, `speech_stats`, `beat_timing`, `transcribe_whisper`, `grab_frames`, `font_match`, `numbers_table`, `per_video_table`, `captions_to_transcript`) | Reference channel analysis and style measuring |

## Rules and references

| Path | What it is |
|---|---|
| `references/looks/` | **v4 look track** (always-on character looks: L1 head shading + outline, L2 3D clothing): `README.md` (list, status, analysis), `head-shading.md` (L1 recipe), `cloth-3d.md` (L2 recipe, **locked**). `character-identity.md`: look **L3 head shapes, locked** (men Gumdrop, women Chibi; PLAN D19), rounds, numbers, how a new character gets its head. Their frames are in `references/effects/frames/L1-*`, `L2*-*` |
| `references/effects/` | **v4 VFX work:** `references-vfx.txt` (the user's list), `references-for-cloathing.txt` (the user's L2 clothing list, analysed in `references/looks/README.md` L2), `README.md` (status + analysis of every item), `<effect>.md` recipes (`anger-smoke`, `heat-sweat`, `face-stretch`, `jump`, `edge-lines`, `walk`, `depth-filling`); `videos/` and `frames/` are git-ignored |
| `references/sets/` | Scenes plan: **`KIT.md`** (kit catalog: piece, file, settings that make variations, theme; set-only pieces still to move to the kit) + `kit_catalog.jpg` (the picture, made by `kit_catalog.py`), `kit_home.jpg` (theme picture home interiors), `kit_medieval.jpg` (theme picture medieval), `kit_snow.jpg` (theme picture snow, our own pieces), `castle_abc.jpg` (A/B/C test of the main castle: Castle 02 as is / without its Nintendo parts / Quaternius fortress → fortress chosen), **`CREDITS.md`** (3D pack credits: CC-BY lines to paste into `upload.md`; CC0 packs listed), `3d-packs.txt` (the user's list of free 3D pack links per theme, with licenses; used in session 3) |
| `references/sound-effects/` | **Sound effects (2026-11-11: woosh, click, idea, alert locked):** `Quando-usar-efeitos-sonoros.txt` (the user's rules: when to use each sound). Recipe + status + timing table: `sfx.md` (woosh, click, idea, alert **locked**; laugh sound open). The MP3s moved to `assets/sound-effects/`. Tests: `tools/vfx_tests/sfx_test_props.py woosh|click|ding|combo|alert` → `out/sfx/<test>/`. Woosh: user chose −6 dB (default in `mix_audio.py`) |
| `references/RULEBOOK.md` | Style numbers from the reference channel (pace, shot length, camera, captions…) |
| `references/STYLE_SHEET.md` | Visual style description of the reference |
| `references/analysis/`, `transcripts/`, `meta/` | Raw measurements, transcripts, list of the 20 reference Shorts; `analysis/day_shots.json` = the 95 day outdoor shots marked by eye (day range) |
| `style_lock/locks_v4.md` | **v4 = v3 + locked looks (always on: L1, L2, L3) + approved effects**: the lists and how to use them in a plan. Baseline frames `style_lock/frames/v4cloth_f*.png`, `style_test_v4cloth.mp4` (`v4id_*` = L1 + L3, `v4look_*` = L1 only: history) |
| `style_lock/locks.md` / `locks.json` | **The locked look v3** (human / machine). Changing it = v4, the user's decision |
| `style_lock/frames/`, `style_test_v3.mp4` | Reference stills and the locked 12 s test |
| `style_lock/history/`, `source_v3/` | v1/v2 history; backup copy of the v3 code |
| `.claude/skills/generate-animated-shorts/references/` | `script_rules.md`, `scene_plan.md` (plan fields, presets), `formats/explainer.md` |
