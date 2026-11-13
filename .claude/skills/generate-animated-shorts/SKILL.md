---
name: generate-animated-shorts
description: Make an original animated YouTube Short (1080x1920, 35-60 s) in this project's locked "2D characters in a 3D world" style, from topic to final render — ideas, fact check with saved sources, script, narrator voice (Kokoro, free), word timing, scene plan, storyboard, preview, automatic style check and final render, with the user's approval at each stop. Use this skill whenever the user wants a new Short or video for the channel, asks for video/topic/script ideas ("give me 5 ideas"), wants to write or fix a script or gives a script brief (roteiro) for a new video, has a voice file to import, or wants to continue, re-plan, preview, check or render a video in videos/, or runs /feedback to apply approved feedback — even if they don't say "skill" or name a step. Not for questions about how the project works, finding files, or describing a problem seen in a video ("at 4 s the face is pink"): that is explain-find-feedback, which writes the feedback this skill applies.
---

# Generate animated shorts

One flow for every format. The format (today: `explainer`; later: `story`) only changes the script rules; audio, scene plan, checks and render are shared.

Why the flow is strict: the look is **locked** (`style_lock/locks.md`, tag `style-v3`) and the channel must not look mass-produced. Every video is original, fact-checked and approved by the user at four stops, and every render is measured with the same scripts we used on the reference channel.

## Where things are

| What | Path |
|---|---|
| One video, all its files | `videos/<yyyy-mm-dd>-<slug>/` |
| Format rules | `references/formats/<format>.md` (only `explainer.md` exists; `story.md` is reserved) |
| Rules for every script | `references/script_rules.md` |
| Style numbers we copy (not content) | `references/RULEBOOK.md`, `references/STYLE_SHEET.md` (project root) |
| Locked look | `style_lock/locks.md` (human) and `style_lock/locks.json` (machine) |
| Log of past videos (variety) | `channel/log.json` |
| Build plan and open decisions | `PLAN.md` |
| Map of every folder and file | `docs/PROJECT_MAP.md` (update it when the structure changes) |
| The user's feedback on a video | `videos/<slug>/feedback.md` (see "Feedback") |

Run Python tools from the project root as `.venv/Scripts/python -I tools/<tool>.py …`. Tools marked *planned* below don't exist yet; if a step needs one, say so and stop instead of improvising a replacement.

| Tool | Status | Used in |
|---|---|---|
| `tools/source_text.py` | ready (tests: `tools/tests/test_source_text.py`) — page or PDF → plain text; `--find` = full sentence for a quote; `--check facts.md` = every quote vs its source. PDFs need `pypdf` (in `.venv`) | 2 |
| `tools/script_check.py` | ready (tests: `tools/tests/test_script_check.py`) | 3 |
| `tools/tts_kokoro.py` | ready — narrator voice Kokoro `af_heart` (D20), runs in `.venv-tts` | 4 |
| `tools/voice_words.py` | ready (tests: `tools/tests/test_voice_words.py`) | 5–6 |
| `tools/make_test_voice.py` | ready — free Windows voice, **tests only** (D6) | pipeline tests |
| `tools/mix_audio.py` | ready (tests: `tools/tests/test_mix_audio.py`) | 9 |
| `tools/make_captions.py` | ready (tests: `tools/tests/test_captions.py`) — `words.json` → `captions.json` (1–2 word chunks + start frames) | 6, 9–10 |
| `tools/build_props.py` + `Episode` composition | ready (tests: `tools/tests/test_episode.py`) — plan → `render_props.json` + plan check | 7–11 |
| `tools/storyboard.py` (+ `render_stills.mjs`) | ready — one still per shot + labelled `storyboard/sheet.jpg` (~6 s) | 8 |
| `tools/variety_check.py` | ready (tests: `tools/tests/test_variety.py`) — `--summary`: what the last videos used (no plan needed); `videos/<slug>`: plan vs `channel/log.json`; `--log` adds the video | 1 (`--summary`), 7, 11 |
| `tools/check_render.py` | ready | 10–11 |
| `tools/set_review.py` | ready — whole-set review: shadow-box check of the set's `review.points` (WARN), 8 wide views → `out/set_review/<set>/storyboard/sheet.jpg`, flicker on a moving sweep (FAIL) | 7 (new or changed set, before A2) |
| `tools/new_set.py` | ready — a new set from the template: `<id> --light day\|night\|interior` writes `src/world/sets/<Name>.tsx` (from the outdoor / indoor base in `src/world/sets/base/`), `<id>.json` (marks, camera bounds, review block with the sun side and a sized shadow box) and the registry entry; `--remove` undoes | 7 (new set, `BUILDING.md` step 4) |
| `tools/flicker.py` | ready (tests: `tools/tests/test_flicker.py`) — z-fighting / A→B→A flicker regions; part of `check_render.py` (FAIL); alone for a new set | 7–8 (new set), 10–11 |
| `tools/regress_frames.py` | ready | after any change to `src/` |

## Resume first

Videos take more than one session. Before anything else, if the user names a video or one is in progress, open its folder and find the first missing file. If the folder has a `brief.md` (the user's script brief), read it first: it applies to every step after it.

| Missing | Next step |
|---|---|
| `idea.md` | 1 |
| `facts.md` | 2 |
| `script.md` (or not approved) | 3 |
| `audio/voice.wav` | 4–5 (`tools/tts_kokoro.py`, D20) |
| `audio/words.json` | 6 |
| `scene_plan.json` (or not approved) | 7 |
| `storyboard/sheet.jpg` (or not approved) | 8 |
| `preview.mp4` / `check_report.md` | 9–10 |
| `final.mp4` | 11 |

Then read `videos/<slug>/feedback.md` if it exists and tell the user in one line how many items are `open` (approved, waiting for `/feedback`) and `draft` (waiting for the user's approval), with their titles. Don't apply them (see "Feedback").

Approvals are written at the top of the file that was approved: `approved: 2026-11-05 (user)`, only after the user's explicit approval (see "Approval stops"). Never write that line on your own, and never write it with another value (no `approved: no`).

## The flow

⏸ = stop, show the result, wait for the user. The four approval stops A1–A4 follow **"Approval stops"** below (title, what to show, checklist, explicit approval). The user may ask for changes; go back **only** to the step that needs it (a frame fix never touches the script or the audio).

### 1. Topic
- First run `variety_check.py --summary`: it lists what the last videos used (topics, hook types, structure, main characters, colors, sets) and what a new idea should avoid. (The full variety check needs a scene plan; it runs at step 7.)
- If the user gives a topic, create `videos/<yyyy-mm-dd>-<slug>/idea.md` with it. If they ask for ideas ("give me 5 ideas"), propose 5.
- **Script brief (roteiro).** If the user's first prompt says how they want the script (story, point of view, tone, characters, scenes, ending…), save it **word for word** in `videos/<slug>/brief.md` (`## Brief` = their words, then `## Points` = the brief split into numbered points B1, B2… in plain English, each one checkable). Don't propose 5 ideas: the brief is the idea (`idea.md` = the topic + "from brief.md"). Ask only if a point is unclear.
- Each idea: the hook line (result first, `references/formats/explainer.md` §1b), the odd concrete detail (a number or object), the real mechanism in one sentence, two possible places to show it, hook type (see the format file). Numbers are "not checked yet" until step 2.
- Drop ideas that repeat the log (same topic, same hook type twice in a row) or that sit close to a reference video title (`references/meta/shorts_list.tsv`). We copy the reference **style**, never its topics.
- **Save the ideas** in `channel/ideas.md`: a new `## <date> — <what the user asked>` section at the top with the 5 ideas, so unused ideas aren't lost. When the user picks one, mark it `→ picked: videos/<slug>/` there and create that video's `idea.md`.
- ⏸ the user picks one.

### 2. Fact check → `facts.md`
- Search the web. Every claim the script will make gets an id `F1, F2, …`, the source URL, the publisher and the **exact supporting sentence** copied from the page (open the page; never cite from memory).
- Copy quotes with `source_text.py <url> --find "<a few words>"`: it prints the **full sentence** from the page (the web-fetch tool summarizes and cuts long sentences) and reads **PDF** sources too (papers, government reports). A site that blocks scripts: open it with the fetch tool or the browser and copy by hand.
- Before A1, run `source_text.py --check videos/<slug>/facts.md`: every quote must be FOUND in its source. NOT FOUND = fix the quote or the source; UNREACHABLE = say which ones were checked by eye. A note after a quote goes in parentheses after the closing quote mark.
- Key claims (the hook number, the mechanism) need two independent sources, or one strong one (peer-reviewed paper, university, government agency, major encyclopedia).
- A claim that can't be confirmed is cut or softened ("about", "scientists think"). Write its status: `confirmed / softened / cut`.
- Why: a wrong fact can't be fixed after upload, and the sources go into the video description.

### 3. Script → `script.md`
- Read `references/script_rules.md` and `references/formats/<format>.md`. Write in that format's beat structure, using `script.md`'s layout from `script_rules.md`.
- Every sentence with a fact carries its tag `[F#]`.
- **With a `brief.md`:** write the script from the brief — its story, point of view, tone, characters and ending — inside the project rules (hook first, facts checked, length, format beats). Where a rule or a fact forces a change to a brief point (e.g. the fact can't be confirmed, or the brief's opening places the scene before the hook), keep the point as close as possible and note why in `script.md`'s notes under `## Brief check`.
- **Hook first:** write **3–5 hook options** (different types or angles), each one result-first: the strange result in the first 8 words (first sentence ~8 words), never opening by placing the scene or the character (`references/formats/explainer.md` §1b). Put the chosen one in the script and set `result:` on the format line; keep the others under `## Hook options` in `script.md`'s notes.
- Run `script_check.py` (count, beats, hook, originality vs the reference transcripts, fact tags). Fix and re-run until it passes.
- ⏸ **A1 — approve script. Never skipped, never merged with another stop.** In the message (not only in a file or a button):
see **A1** in "Approval stops". Don't start step 4 (voice text) before the explicit approval. If the user picks another hook, rewrite, re-run the check, and show A1 again.

### 4. Voice text → `voice_text.txt` → the voice (Kokoro `af_heart`, PLAN D20)
- Same words as the approved script, prepared to be spoken: no beat tags, no fact tags, numbers and symbols written as words ("3 a.m." → "three A M"), one sentence per line. Lines starting with `#` are notes (skipped).
- Make the voice: `.venv-tts/Scripts/python -I tools/tts_kokoro.py videos/<slug>` → `audio/voice_raw.wav`. Always the same voice (`af_heart`, speed 1.0): never change the voice id per video.
- If it stops with "NOT in Kokoro's dictionary" (rare names: espeak-ng is not installed on purpose, D20), write the pronunciation in `voice_text.txt` as `[Broughton](/bɹˈɔtən/)` (misaki phonemes) and run again. Never just remove the word.
- No stop here: the user hears the voice at A4. ElevenLabs is not used any more for real videos (D8 closed by D20).

### 5. Import the voice
- `voice_words.py` converts it to `audio/voice.wav` (48 kHz mono) and trims silence, so the first word starts at 0.00 s and the voice ends with the video.

### 6. Word times → `audio/words.json`, `audio/pace.md`, `captions.json`
- `voice_words.py` runs faster-whisper with word timestamps and matches the words back to the script (captions always use the **script** spelling; the voice gives the **times**).
- Report: words/s overall, first 3 s, last 5 s vs the target 3.5 (D18) and the RULEBOOK shape (4.0 first 3 s / 3.4 last 5 s), long gaps, and any word that didn't match.
- Then `make_captions.py videos/<slug>` cuts the words into caption chunks → `captions.json` (rendered as is, and used by the sync check).
- **Caption rule: a chunk is a piece of ONE phrase.** Never join words that belong to different phrases ("night | into the warm", not "night into"). Break first at sentence ends and commas (never crossed), then at pauses in the voice, where a new phrase starts (preposition, conjunction, "the/its…"), and between subject and verb ("she | walks"). A word too short to read (< 5 frames) joins its own phrase, the previous word first ("cold night"). `make_captions.py` does this; read the chunk line it prints and fix by hand only what it can't know (e.g. a noun subject before its verb).
- Kokoro `af_heart` is ≈ 3.3–3.4 w/s raw, so expect `--tempo` ≈ 1.03–1.05 (bridge video test: 1.05 → 3.49 w/s). If the raw pace is off target, `pace.md` gives the factor: re-run `voice_words.py videos/<slug> --tempo X` (ffmpeg atempo, X = 3.5 ÷ raw pace of THIS take: every voice and take has its own pace, so never reuse an old number). Up to 1.6× is OK (tested by ear); above that, ask the user for a faster voice. Never rubberband (it sounded more robotic). Speed test files for the user to compare go in `audio/speed_tests/`, named `<take>_atempo_<X>-<pace>ws.wav` with the MEASURED pace, 2 decimals, comma (e.g. `full_female_v4_atempo_1.54-3,50ws.wav`).

### 7. Scene plan → `scene_plan.json` + `scene_plan.md`
- **A new or changed set first goes through "Building a set" (below) and `set_review.py <set>`**: 0 FAIL, every WARN fixed or explained, and you looked at all 8 tiles. Show the review sheet to the user at A2 with the plan. Why: in the bridge video the planned shots' stills hid the set's edges, flat background shapes and missing shadows; the user found them in the preview (FB3, FB6, FB7).
- Build shots on top of the real word times, using word anchors (`"w:12"`, `"w:12+2"`), sets and marks from the set kit, cast from the cast registry, and camera presets (never raw camera numbers unless a preset can't do it).
- Read `references/scene_plan.md` (fields, anchors, camera presets, actors). Run `build_props.py videos/<slug>`: it writes `render_props.json` and runs the plan check (shot length, first change, dissolves, hard cuts only on punches, camera always moving, ~1 blur shot in 5, head sizes). Fix every FAIL before A2.
- Run `variety_check.py` against `channel/log.json`.
- **With a `brief.md`:** use its wishes about what we see (places, characters, moments, light) in the plan; a wish the plan can't follow (e.g. a set that doesn't exist yet → `src/world/sets/BUILDING.md`) is said at A2.
- ⏸ **A2 — PLAN** (see "Approval stops").

### 8. Storyboard → `storyboard/`
- Run `storyboard.py videos/<slug>`: one still per shot (middle frame) + `storyboard/sheet.jpg` with id, beat, time, set, camera and the words of each shot. Look at every still yourself first: the v1/v2 lessons were a camera inside a house, a character card cutting through a window frame, a prop in front of legs.
- **New or changed set → flicker check before A3.** A still can't show z-fighting (it only appears between consecutive frames: the bridge video's FB2 and FB4 reached the user twice). Render the first 2–3 s of every shot that uses the new/changed set (`npx remotion render Episode out/<slug>_flick.mp4 --props=… --frames=<from>-<from+75>` per shot, or the whole video) and run `tools/flicker.py` on it: it must PASS.
- ⏸ **A3 — FRAMES** (see "Approval stops").

### 9. Preview → `preview.mp4`
- `mix_audio.py`: voice + music, music ~20 dB under the voice and ducked 4 dB during speech, gain + limiter to −14 LUFS / ≤ −2 dBTP → `audio/mix.wav` (+ `mix.json` with the exact length in frames). Music comes from `assets/music/` (YouTube Audio Library, D7), least recently used first. Sound effects: the plan's `sfx` list (`references/scene_plan.md` §5d) is mixed in too, each hit on its anchor. **D21 (2026-11-11): no music by default** (voice + SFX only); music only with `--with-music` when the user asks.
- Copy `audio/mix.wav` to `public/episodes/<slug>/mix.wav`, set `audio.public_path` in the plan, re-run `build_props.py`, then render: `npx remotion render Episode videos/<slug>/preview.mp4 --props=videos/<slug>/render_props.json --crf=16`. Captions come from `captions.json` (step 6).

### 10. Automatic check → `check_report.md`
```bash
.venv/Scripts/python -I tools/check_render.py videos/<slug>/preview.mp4 --profile episode --captions videos/<slug>/captions.json --out videos/<slug>/check
```
- FAIL (format, captions, sync, loudness, **flicker**) must be fixed before A4. A flicker FAIL names the region and saves `check/flicker_<n>.png`: find the two faces on the same plane there and separate them (see the set rule below). WARN on look numbers: explain each one in a line; fix the scene, the set or the light preset, **never** the locked values. Look at `still_sheet.jpg` too.
- ⏸ **A4 — PREVIEW** (see "Approval stops").

### 11. Final
- Final render (same settings), run the check again on `final.mp4`, add the video to the log with `variety_check.py videos/<slug> --log`, write `upload.md` (title idea in the reference patterns "Why…/How…/The X that…", a description with the sources from `facts.md`).

## Building a set (new set, or changes to one)

A set is a whole small world: any camera direction the plan might use must look believable. Before a plan uses it:

**Every new set starts from the template:** `tools/new_set.py <id> --light day|night|interior` (outdoor / indoor base in `src/world/sets/base/`: ground that reaches the sky, locked light, sun side, sized shadow box, capped far haze, 4 layer slots). The base is only the invisible part; the place, props, colours, layout and cameras stay free, so videos don't look alike. Never copy an old set file.

**Step by step:** `src/world/sets/BUILDING.md` (10 steps, the user's stops S1 plan → S2 still → S3 video; kit catalog `references/sets/KIT.md`; tools `camera_view.py`, `before_after.py`, `kit_catalog.py`). The rules below are what the result must meet:

1. **No edge of the world.** Ground, water, roads and towns go out of frame or end in something natural (a bend, a far shore, buildings, hills, haze). Make ground and water planes much larger than the action (the bridge: water and banks 420 m long, hills on the sides and behind the camera) and let the light preset's fog fade them.
2. **Things where they belong.** Hills, houses and trees on land, never in a river or road; check every big shape's footprint against water and paths (the bridge: `|x| - half-width ≥ 12` next to the 10 m river).
3. **Every shape is drawn like the rest.** Low-poly faceted geometry, 2+ tones, ink outlines (`OMesh`), cast + receive shadows. No smooth single-color blobs (they read as a flat backdrop). Background towns are real kit buildings with windows and roofs; `DistantRooftops` only far away as haze.
4. **Shadows reach everything visible.** The sun's shadow box (`DayExteriorLights shadowSize`, default 20 m = the day street) must contain every visible object: put the set's key objects in `<set>.json` `review.points` and let `set_review.py` measure them; raise `shadowSize` (and `shadowMapSize` 8192) for a big set. Choose the set's sun direction so the planned wide shots see form: the sun from one side of the main camera direction (side walls in shade, shadows running out from the corners), not straight behind the camera.
5. **No two faces on one plane** (rule below); `set_review.py` runs the flicker check on a moving sweep.
6. **Locked values stay.** A set may choose its sun *direction*, shadow box and props; it never changes a light preset's intensities, colors, fog or grade (that is a style version). One allowed exception: far meshes (> ~80 m) may cap the fog with `fogMax` (same formula, capped), so the far land stays visible.
7. **Every layer filled** (VFX item 8, `references/effects/depth-filling.md`): foreground props, life around the marks, a back layer, a far land and uneven mountains when the set has a far view. Eye-level cameras show the ground as a thin band: props must be **tall** and stand in the cameras' view cones (check with stills from the planned cameras). Merge many props per color (`kit/country.tsx`, `kit/land.tsx`); the far land beyond the shadow box goes in the capped haze. The corner branch (`branch` shot field) only for close shots on land.

Run `set_review.py <set>`, look at the sheet, fix, repeat. Then `regress_frames.py` if shared code changed.

## Approval stops (A1–A4)

The user approves four times. Each stop is **its own message that ends the turn**, built the same way, so the user always knows what they are approving:

1. **Title line**, exactly as below (bold), so the stop can't be mistaken for a progress note.
2. **What to look at** (the content listed for that stop) in the message itself, never only in a file or a button.
3. **Check this** — the 3–4 item checklist of that stop.
4. **How to approve** — the exact words, e.g. "Reply **I approve the script** (or *aprovo o roteiro*), with the hook number."
5. **Feedback** — re-read `videos/<slug>/feedback.md` before the stop. If items are `open` or `draft`, add one line: "N feedback items open (FB…) — run `/feedback` to apply them before approving." No file or no pending item = no line.

**Only an explicit approval counts.** The reply must say *approve* and name what is approved (script / plan / frames / preview; in Portuguese *aprovo o roteiro / o plano / os quadros / o preview*). A generic "ok", "yes", "looks good", "go on", "continue", or an approval of something else, is **not** an approval: answer with one line asking for the explicit words, and wait. Then write `approved: <date> (user)` at the top of the approved file (`script.md` for A1, `scene_plan.md` for A2–A4, one line per stop) and only then go on.

### ⏸ A1 — SCRIPT: the words that will be spoken
Show:
- the **hook options**, numbered, each with the second where its strange result lands; mark the one used;
- the **full script in clean text**: one plain block, exactly the words the voice will say, in order — no beat tags, no fact tags, no table;
- **estimated length**: spoken words ÷ 3.5 = seconds (and the target), then the beat start times;
- the script check result, the quote check result (`source_text.py --check`: found / checked by eye), and any `softened` facts (with the softer wording);
- **Brief check** (only when the video has a `brief.md` and the switch below is ON): a table, one row per brief point `B#` → ✅ followed (quote the script words that do it) / ⚠️ changed (what and why) / ❌ left out (why).

**Brief check switch: ON** (user, 2026-11-12, for the first videos with a brief). Turn it OFF only when the user says so ("turn off the brief check"); then write `OFF (user, <date>)` here. OFF = no table at A1; the brief is still saved and followed. A1 itself always stays.

Check this:
1. Hook: does the strange result land in the first 8 words (~2 s)? Which option do you want?
2. Read the script aloud: does it sound natural, with nothing unclear or too fast?
3. Facts: are the invented parts clearly story, and are the softened facts OK?
4. Length: does the estimate fit the target?
5. Brief (with the brief check ON): is every point of your brief in the script the way you meant it?

Approve: "**I approve the script**, hook #N" / "*aprovo o roteiro, gancho N*".

### ⏸ A2 — PLAN: what each shot shows
Show: the `scene_plan.md` table (time, words, set, who, camera, light), the plan check and variety check results with every warning explained in a line. If the plan uses a new or changed set: also the `set_review.py` sheet (send the file) and its result.

Check this:
1. Frame 1 shows the strange result, not the situation before it.
2. Each shot shows the right place and person on its words.
3. The places and the light tell the story (e.g. cold outside vs warm inside), and the main character is new.
4. The warnings are acceptable.

Approve: "**I approve the plan**" / "*aprovo o plano*".

### ⏸ A3 — FRAMES: how each shot looks
Show: `storyboard/sheet.jpg` (send the file), what you fixed after your own look, and any plan change since A2 (it is approved here).

Check this:
1. Nothing broken in any still: camera inside a wall, a card cutting through an object, a prop in front of legs.
2. The key object reads at phone size (e.g. the fogged glasses), and faces show the right expression.
3. Diagrams are readable and clear of the caption band.
4. Captions sit in place and read well.

Approve: "**I approve the frames**" / "*aprovo os quadros*".

### ⏸ A4 — PREVIEW: the finished video with sound
Show: `preview.mp4` (send the file), the check verdict, each warning with a one-line explanation, and anything still open.

Check this:
1. Watch it on a phone with sound: the voice is clear and the sound effects stay under it (no music by default, D21).
2. Captions change with the words and split by phrase.
3. The check has 0 FAIL (or only expected ones, explained), every warning is explained.
4. The video ends on the last word, with no silent tail.

Approve: "**I approve the preview**" / "*aprovo o preview*".

## Feedback (`feedback.md` and `/feedback`)

The `explain-find-feedback` skill turns the user's plain notes ("no segundo 4 o rosto fica rosa") into items `FB1, FB2…` in `videos/<slug>/feedback.md`, each with `status:`, where (time, shot, frames), stage, problem, probable cause, suggested fix, scope and `touches lock:`. Status flow: `draft` → `open` (the user approved it) → `resolved`.

- **Apply feedback only when the user runs `/feedback`** (`.claude/commands/feedback.md`). Reading and reporting items is fine at any time; changing anything because of an item is not, outside `/feedback`. `draft` items are never applied.
- Treat the suggested fix as a strong hint, not an order: check the cause yourself in the frames and the code; if the real cause is elsewhere, fix that and say so.
- Fix by the normal rules: go back only to the step the item needs, re-run that step's checks (`build_props.py`, `storyboard.py`, `check_render.py`…), `regress_frames.py` after any `src/` change, and **never** change locked values — an item with `touches lock: yes` waits for the user's v4 decision.
- **Mark an item resolved only after the fix is made and checked:** change `status: open` → `status: resolved`, and add under it `resolved: <date> — <file>: <field> <old value> → <new value> (one per change) — <check result> — compare: feedback/FB<n>_compare.jpg`; the concrete before → after values let `explain-find-feedback` explain the fix in plain words. Not fixed or not verified = stays `open`, with a `note:` line saying why.
- If a fix changes something already approved (the item's `stage` line), that stop's `approved:` line no longer covers it: show the stop again and wait for the explicit approval.

## Rules that never bend

- **Every stop happens.** A1, A2, A3 and A4 each end the turn and wait for the user's **explicit** approval (see "Approval stops"). Never continue past a stop because an earlier stop was approved; the user may approve a stop in advance only by naming it ("apply the fixes, then approve the preview").

- **Original only.** No sentence, premise, character, place or title from the reference channel. `script_check.py` blocks 5-word overlaps with the reference transcripts; beyond that, use judgment: if it feels like their video, it is.
- **No two faces on one plane (z-fighting).** When you build or change a set or kit piece, every visible face must be ≥ 2 cm in front of or behind any face it overlaps: doors, signs, plates and frames in front of walls *and* in front of the wall's base slab; slabs, roads and caps on grass or floors; tops of boxes that meet at a bank or a pier. Same height + overlap = flicker. Hidden faces (a box bottom resting on the ground) are fine. `flicker.py` / `check_render.py` catch what slips through.
- **The look is locked.** Don't change values in `locks.json` / `locks.md` or the locked code (`src/character/draw.ts` proportions, caption style, grade). If you touch shared code in `src/`, run `tools/regress_frames.py`; it must PASS. A look change is a new style version (v4) and is the user's decision.
- **Facts are sourced** in `facts.md`, and the user sees softened claims at A1.
- **The user approves**, never you. When unsure whether a change needs a new approval, ask.
- **Feedback only through `/feedback`.** Never apply a `feedback.md` item unless the user ran `/feedback`.
