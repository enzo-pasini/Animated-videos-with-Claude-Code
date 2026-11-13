# PLAN — the channel skill (Phase 4, part 1 of 2)

**Status:** approved 2026-11-04, building on branch `skill-v1`, one commit per step (§8).

### Decisions taken (2026-11-04)

| # | Decision |
|---|---|
| D1 | Skill name: **`generate-animated-shorts`** at `.claude/skills/generate-animated-shorts/`. It is general (many formats); `explainer` is only the first format. |
| D2 | Work on branch **`skill-v1`**. |
| D3 | Brightness review **after** the pipeline test. If brightness changes, update `style_lock/frames/` **and** `style_lock/locks.json` together, as **v4**. **Result (2026-11-07):** the user's daylight phone review of the foggy-glasses preview says brightness is right → **no change, v3 is final**, the reserved iteration is closed. The "dark" luma warnings (blue street 57–60 vs 74–131; workshop 87–90 vs 98–150) are accepted by eye. |
| D4 | Approved: the "same look" regression test and `style_lock/locks.json`. |
| D5 | When the build reaches one of the other open questions, stop and ask at that moment. |
| D6 | Test voice for the pipeline: **free Windows text-to-speech** (System.Speech). ElevenLabs only for real videos. |
| D7 | Music: **YouTube Audio Library**. You download 3–5 tracks into a folder; the skill rotates them. |
| D8 | ElevenLabs: **free plan for now** (tests). Before monetizing: check the license (the free plan usually needs attribution and allows no commercial use). **→ Closed by D20 (2026-11-11): real videos use the free Kokoro voice.** |
| D9 | Cast: **a new main character every video + one small recurring signature** (an object or a small animal seen somewhere in every video). |
| D10 | New light looks `warmInterior` and `dayExterior`: calibrate with the reference scripts and lock as **style v3.1**, **max 2 iterations each**. |
| D11 | Insert cards: **yes**, flat 2D diagrams / object close-ups in the same style, as their own shots with the usual camera moves. |
| D12 | Warm interior hit the D10 cap (2026-11-04): kept as an **unlocked candidate** (`workshop` set). The rest of the light work (warm finish + `dayExterior`) happens **after the pipeline test**, together with the brightness review (D3), in one look session. Reports: `tools/tests/calibration/warm_interior/`. **Warm finish (2026-11-07):** one last try, a stronger cool window fill (0.55 → 0.9), changed nothing (colorful 48–52 before and after: the fill comes from behind and misses the walls the camera sees; `report_v4_fill.md`). Reverted, and `warmInterior` is **locked as it is, style v3.1** (locks.md §11). **dayExterior (2026-11-07):** day range = 95 reference day shots marked by eye (`references/analysis/day_shots.json`); test set `day_street` (the street by day). v1 + 2 iterations (cap), then the user authorized a **3rd iteration, brightness only**: lighter cobbles, stronger sky/sun, near-neutral fill. Luma 71–85 (v1) → 101–128 (it3), colorful 36–43 → 66–80. Reports `tools/tests/calibration/day_exterior/report_v1–v4.md`. **Locked as it is, style v3.1** (locks.md §12). The look session (D3 + D12) is finished. |
| D13 | Big files (2026-11-04): media in `videos/` stays **out of git** (`*.wav`, `*.mp3`, music, `*.mp4`, storyboard/still PNGs). Text stays in git: script, facts, scene plan, words.json, captions, reports. Back media up outside git. |
| D14 | Approval stops (2026-11-04): A1–A4 each have a fixed title (A1 — SCRIPT: the words that will be spoken; A2 — PLAN; A3 — FRAMES; A4 — PREVIEW), the content in the message, a 3–4 item checklist, and **only an explicit approval** ("I approve the script" / "aprovo o roteiro"…) moves on; a generic "ok" does not. A1 shows the hook options, the clean script and the estimated length. |
| D15 | Fact sources (2026-11-04): `tools/source_text.py` reads pages and PDFs (`pypdf` in `.venv`), gives full sentences for quotes and checks every quote in facts.md before A1. Ideas from step 1 are kept in `channel/ideas.md`. |
| D16 | Hook rules review (A1, 2026-11-07): the strange result (`result:`) must end by **word 8** — a **FAIL** in `script_check.py`, also when `result:` is missing. Hook length is **soft**: aim ~8 words (the 20 reference hooks have 6–9, median 8, all ≤ 12); over 12 = WARN only, because it depends on the script. The scene-opener hint was widened (time/place settings, "Picture…", "After a…") and narrowed (no "When", "Once", "This is"), tested on samples and on the 20 reference hooks. |
| D18 | Voice pace (2026-11-07): ElevenLabs voices (Eleven v4) speak only **2.3–2.6 w/s**, even at the fastest setting with other voices. The user tested by ear: **atempo** sounds natural, rubberband sounds more robotic; 3.7 w/s felt too fast. New target: **3.5 w/s overall** (still inside the reference range 3.36–4.11). The voice is sped up with **ffmpeg atempo** on import (`voice_words.py --tempo X`, X = 3.5 ÷ raw pace; tested OK at 1.33× and 1.54×; above **1.6×** pick a faster voice). **The tempo is per voice and per take, never a fixed number:** every voice has its own pace and pauses (the male take needed 1.33×, the female 1.54×), so always measure the raw take first and compute X; the goal is always **3.5 w/s**. The old "atempo ≤ ±8 %" rule is replaced. Word counts now use 3.5 w/s. **Voice for the first real video: the female Eleven v4 voice** (test take `voice_raw_female.mp3`, raw 2.28 w/s → 1.54×). Test files: `videos/2026-11-04-foggy-glasses/audio/speed_tests/`; speed test files are always named with their measured pace, e.g. `full_female_v4_atempo_1.54-3,50ws.wav`. |
| D17 | Endings (Q10, 2026-11-07) — **PROVISIONAL, review after the first 2–3 full videos.** Only **button** (default: short punchy line) or **explain** (end on the last line of the explanation, when the explanation is the payoff). **No mid-sentence cut-off** for now (reference: button 11/20, explain 6/20, cutoff 3/20; clips of the last 8 s in `out/endings/`). Log rotation still applies. |
| D19 | Character identity, head shapes (2026-11-10): **men = Gumdrop** (round top, flat wide jaw), **women = Chibi** (soft-U chin + big low eyes, small low mouth). User's rule: women cute and petite, men imposing. Decided after 5 mockup/animation rounds. **Built 2026-11-10** (look L3 in `style_lock/locks_v4.md`): `gender` per character in `src/cast/cast_meta.json` + optional `head` override (Juno = man with the Chibi head); `"look": null` keeps round v3 heads; regression baseline `v4id`. Details, numbers and test files: `references/looks/character-identity.md`. |
| D20 | Narrator voice (2026-11-11): **Kokoro-82M, voice `af_heart`** (Apache 2.0, commercial use OK; replaces ElevenLabs for real videos, closes D8). Chosen by ear (round 1: af_heart, af_bella, af_nicole vs the ElevenLabs female take, same 25 s of the bridge script at 3.5 w/s; files in `videos/2026-11-07-bridge-break-step/audio/voice_tests/`). Same voice every video: fixed voice id, speed 1.0. Made by `tools/tts_kokoro.py` from `voice_text.txt` → `audio/voice_raw.wav`, then `voice_words.py` as before (af_heart raw ≈ 3.3–3.4 w/s → `--tempo` ≈ 1.03–1.05, D18 still applies). Runs in a separate **`.venv-tts`** (Python 3.12, CPU PyTorch; Kokoro needs Python < 3.13). **espeak-ng / phonemizer (GPL-3) are NOT installed:** words not in Kokoro's dictionary would be skipped silently, so `tts_kokoro.py` lists them and stops; write the pronunciation in `voice_text.txt` as `[Broughton](/bɹˈɔtən/)`. Pipeline test on a copy of the bridge video: 177/177 words matched, 3.49 w/s, 50.7 s. A channel-own voice is a parked idea (Later). |
| D21 | Music (2026-11-11): **no music for now**: videos are voice + sound effects (`mix_audio.py` default; `--with-music` brings it back). The user decides later after real videos (the reference has music in 20/20 videos). |
**Sources read:** `references/RULEBOOK.md`, `references/STYLE_SHEET.md`, `style_lock/locks.md` (tag `style-v3`), and the v3 code in `src/` and `tools/`.

---

## Briefing (read this first)

| # | Topic | In one line |
|---|---|---|
| 1 | Flow | One `SKILL.md` that walks from idea to final render, with **4 stops for your approval** (+ 1 stop where you make the voice). |
| 2 | Script rules | Mini-story explainer: hook → escalation → "you see" → reveal → short ending; **~3.5 words/s** (D18); 35–60 s = **~120–210 words**. |
| 3 | Code | Turn the Bram test into parts: **cast** (characters from a base), **set kit** (places from blocks), **scene plan JSON** → Remotion, **captions from real word times**. |
| 4 | Audio | Your ElevenLabs file → trim → faster-whisper word times → music under it → **−14 LUFS**. |
| 5 | Checks | One script measures the render with the **same tools** we used on the reference and prints ✅/⬆️/⬇️ vs `locks.md`. |
| 6 | Anti mass-produced | A log of every video; the skill refuses to repeat the same set, cast, hook type and ending too often. |
| 7 | Folders | `SKILL.md` = one flow; format rules in `references/formats/explainer.md` (story.md later). |
| 8 | Build order | 14 small steps, one commit each, ending with a **10 s pipeline test** with a test voice. |
| 9 | Risks | Hardest parts: new places for abstract topics, keeping the locked look in new light, voice pace. |
| — | Your decisions | 11 questions at the end, sorted by when we need the answer. |

**Golden rule for the whole build:** the style is locked. Every refactor must render `StyleTest` **the same as v3** before we move on.

---

## 1. The flow inside SKILL.md

Each video lives in its own folder: `videos/<yyyy-mm-dd>-<slug>/` (see §7).
⏸ = the skill **stops and waits** for you.

| Step | What Claude does | Output file | Stop? |
|---|---|---|---|
| 1. Topic | You give a topic, **or** say "give me 5 ideas". Each idea = the strange hook, the odd concrete detail, the real mechanism, 2 possible places. Ideas that repeat the log (§6) or a reference title are dropped. | `idea.md` | ⏸ you pick one |
| 2. Fact check | Web search. Every claim in the future script gets **a source URL + the exact sentence that supports it**. Key claims need 2 independent sources (or 1 strong one: a journal, a university, a government agency, an encyclopedia). Claims that fail are cut or softened ("about", "many scientists think"). | `facts.md` | — |
| 3. Script | Writes the script using `references/formats/explainer.md` + the common rules (§2). Runs the script checks (word count, beat positions, originality). Shows the script with its numbers. | `script.md` | **⏸ A1: approve script** |
| 4. ElevenLabs text | Writes a clean text block to paste into ElevenLabs: numbers as words, no stage notes, punctuation for pauses, and the suggested speed setting. | `voice_text.txt` | ⏸ you make the voice and drop the file |
| 5. Import voice | Copies the file in, converts to WAV 48 kHz, trims silence at start and end (first word must be at 0.00 s). | `audio/voice.wav` | — |
| 6. Word times | faster-whisper word times, matched back to the script words (§4). Prints pace: whole video, first 3 s, last 5 s, vs the RULEBOOK. If pace is out of range, it says so and suggests a fix. | `audio/words.json`, `audio/pace.md` | — |
| 7. Scene plan | Builds the shot list on top of the **real** word times: which set, who is there, camera move, light, events, transitions. Runs the plan checks (§5.1). | `scene_plan.json` + a readable table `scene_plan.md` | **⏸ A2: approve plan** |
| 8. Storyboard | Renders 1 still per shot (middle frame) and 1 contact sheet. | `storyboard/sheet.jpg` | **⏸ A3: approve frames** |
| 9. Preview | Full render 1080×1920 with voice + music. | `preview.mp4` | — |
| 10. Auto check | Measures the preview against `locks.md` (§5.2) and writes a report + a still sheet for the eye check. | `check_report.md` | **⏸ A4: approve preview** |
| 11. Final | Final render + final loudness check. Adds the video to the log. Suggests a title ("Why…/How…/The X that…") and a description with the sources. | `final.mp4`, `upload.md`, log entry | — |

If you ask for changes at any stop, the skill goes back **only** to the step that needs it (e.g. a frame change at A3 never touches the script or audio).

---

## 2. Script rules (explainer format)

Built from the RULEBOOK **numbers and structure only**. We never copy a sentence, a premise or a story from the reference transcripts (checked by a script, see the end of this section).

### 2.1 Length and pace

| Item | Rule |
|---|---|
| Duration | 35–60 s |
| Words | duration × 3.5 (D18) → **~120 words (35 s) to 210 words (60 s)** |
| Pace | overall ≈ **3.5 w/s** (D18; reference 3.7); first 3 s ≈ **4.0**, last 5 s ≈ **3.4** (reference shape) |
| Start / end | first word on frame 1; voice runs to the last frame (no outro) |

### 2.2 Structure (beats as % of the video)

| Beat | Where | Rule |
|---|---|---|
| **Hook** | 0 → ~3.6 s (first sentence ~8 words; D16) | A strange result or action stated as fact, landing in the first 8 words. Must contain **one odd concrete detail** (a number, an object). No "Did you know". |
| **Escalation** | ~5.4 s → ~55 % | Context and stakes pile up. Chain of causes with "so". Optional doubter (someone laughs or says it's impossible). One humorous exaggeration. |
| **"You see"** | one of 2 spots: right after the hook (~4 s) **or** as the pivot before the reveal (65–85 %) | The phrase that starts the explanation. Use it once (at most twice). |
| **Turn** | ~56 % (49–63 %) | Things flip: "But…", "Then…", "Until…". |
| **Reveal** | ~75 % (72–82 %) | The real mechanism in 1–3 plain sentences. Best when it **reframes the hook**. |
| **Ending** | last ~5 s | Short punchy line (default), or end on the explanation. No mid-sentence cut-off for now (D17, provisional). |

### 2.3 Wording

- Spoken, simple English, short clauses. Third person "he/she/they" or second person "you / imagine you're…".
- Per video: "so" ≥ 2, at most 1 question, 0–2 short quoted lines of dialogue.
- Numbers must be **checked in `facts.md`**; round them the way a person would say them.
- The explainer twist: our topics are real facts (science, body, history, economy, daily life), so the "story" is a **character living the fact** (a person whose stomach "eats itself", a merchant who…). The character is invented; the fact is true and sourced.

### 2.4 Automatic script checks (`tools/script_check.py`, new)

| Check | Pass if |
|---|---|
| Word count | inside the range for the target length |
| Hook | strange result (`result:`) ends by word 8 = FAIL; first sentence over 12 words = WARN; a number or a concrete noun (WARN) |
| Beat markers | a turn word between 45–65 %, "you see" present, reveal sentence between 65–85 % (by word position) |
| Originality | **no 5-word sequence** shared with any `references/transcripts/*.txt`, and no title close to a reference title |
| Facts | every sentence with a number or a claim has a `[F#]` tag pointing to `facts.md` |

---

## 3. Making the Bram test code general

Today `src/` is one hard-coded film: `script.ts` (fixed words and timing), `Shots.tsx` (5 shots written by hand), `NightStreet.tsx` (one 640-line place), `specs.ts` (3 characters). The plan keeps every **locked number** and only changes how things are put together.

### 3.1 Cast: new characters from one base

- **Keep `src/character/draw.ts` as the locked base body** (3.08 head widths, outline 3.4 %, limbs 5 %, 480 px per head). Not touched.
- New folder `src/cast/`:
  - `parts/` — reusable pieces taken out of Pell, Juno and Bram and new ones: hair shapes, hats, glasses, outfits (apron, coat, lab coat, uniform), accessories (bag, tool, pole), face extras (blush, freckles, beard).
  - `characters/<id>.ts` — one character = base colors + 1 strong silhouette item + 1–2 outfit details (STYLE_SHEET §1.3). Most characters are just a list of parts; a custom drawing hook only when needed.
  - `expressions.ts` — named poses on top of `Pose`: `surprised`, `laughing`, `worried`, `thinking`, `pointing`, `proud`, `shrug`.
  - `registry.ts` — all characters by id.
- **Lineup sheet** (from the existing `Proposal` / `FlatSheet` compositions): every new character is shown next to 2 old ones at the same scale, before it is used.
- Rule: a new character must differ from the last 5 videos' cast in silhouette item **and** main color.

### 3.2 Set kit: new places fast

- Split `NightStreet.tsx` into:
  - `src/world/kit/` — building blocks with the locked line look (`OMesh`, 2 px lines, painted textures): wall/facade, window (dark ↔ lit with the cross-fade fix), door, roof, floor, lamp, table, shelf, bench, crate, barrel, plant, sign, sky dome, distant rooftops.
  - `src/world/lights/` — **light presets**: `nightExterior` (the locked v3 lights), plus new `warmInterior`, `dayExterior`, `sunset`. Each preset = hemisphere + key + bounce + fog + the grade + the light on characters.
  - `src/world/sets/<id>.ts` — a set is **data**: a list of kit pieces with positions + named **marks** (`mark:door`, `mark:counter`, `mark:sky`) where characters stand and cameras aim.
  - `src/world/inserts/` — 2D "insert cards" for the mechanism (a diagram, a close-up of an object, a simple chart), drawn in the same flat style. RULEBOOK §7 says the reference uses them; explainers need them most.
- First sets: `night_street` (the v3 street, rebuilt from the kit), then **one warm interior** (e.g. a kitchen/workshop) and **one day exterior**. Each later video adds at most 1 new set and re-dresses old ones (other props, other time of day).
- Rule from the lock lessons: cameras on diagonals, check every shot still (camera inside a wall, card through a window frame, prop in front of legs).

### 3.3 Scene plan JSON → Remotion composition

One file per video, `scene_plan.json`. Times are **word anchors**, not seconds, so the plan follows the real voice.

```json
{
  "id": "2026-11-06-stomach-acid",
  "format": "explainer",
  "audio": { "mix": "audio/mix.wav", "words": "audio/words.json" },
  "cast": ["mira", "otto"],
  "shots": [
    {
      "id": "s01", "beat": "hook",
      "from": "w:0", "to": "w:9",
      "set": "night_street", "light": "nightExterior",
      "camera": { "preset": "fast_entry", "aim": "mark:door", "head_pct": [12.6, 24], "side": "left" },
      "actors": [
        { "who": "mira", "at": "mark:door", "pose": "worried",
          "keys": [ { "at": "w:5+2", "pose": "surprised" } ] }
      ],
      "events": [ { "at": "w:7", "type": "light_on", "target": "window_a" } ],
      "blur_bg": 0,
      "transition_in": "dissolve"
    }
  ]
}
```

- `w:7+2` = 2 frames after word 7 starts. `to` of one shot = `from` of the next; the 8-frame dissolve overlaps them.
- **Camera presets** compute `d0` from the wanted head size with the locked formula `head% = 0.55 / (2·d·tan(fov/2)·0.5625)` and use the locked rates: `push_in` (rate 0.13), `close_up` (0.09, never past 51 %), `pull_out` (−0.10), `fast_entry` (lens zoom 70→44 in 0.8 s), plus drift ≈ 0.05 frame widths/s and roll 0.5–2.5°.
- New composition `src/compositions/Episode.tsx`: reads the plan through Remotion props (`--props=videos/<slug>/scene_plan.json`), sets the length with `calculateMetadata` from the last word, and builds a `TransitionSeries` like `StyleTest` (dissolve 8 frames; `hard_cut` allowed ≤ 2 per video).
- A plan validator runs before any render (§5.1).
- **Regression test:** a `scene_plan.json` that describes the Bram test must render frames equal to `style_lock/frames/` (tiny pixel difference only). This proves the refactor kept the lock.

### 3.4 Captions from real word times

- `Captions.tsx` keeps its locked look (Montserrat Black 900, 72 px, −0.02 em, 5 px outline, shadow 4/3/2, center 70.3 % H). Only the **input** changes: chunks + start frames come from `words.json`.
- Chunker rules: 1 word by default; join 2 words when they are short and belong together ("at 3", "the whole", "you see,"); never join across a sentence end; target ~67 % one-word / ~28 % two-word / ≤ 4 % three-word.
- Text shown = the **script** spelling (case and punctuation), times = the **voice**. A chunk appears on the frame its first word starts and stays until the next chunk (always on screen).
- Story events (`light_on`, pose keys) use the same word anchors, so actions land on the word, like `wordFrame("lit")` today.

---

## 4. Audio

| Step | How | Tool |
|---|---|---|
| Import | Copy your ElevenLabs file into `audio/voice_raw.*`; convert to WAV 48 kHz mono | ffmpeg (installed) |
| Trim | Remove silence at start and end (first word at 0.00 s, tail ≤ 0.2 s) | ffmpeg `silenceremove` |
| Word times | faster-whisper `large-v3-turbo` on the GPU, `word_timestamps=True` (already installed in `.venv`, code base in `tools/transcribe_whisper.py`) | new `tools/voice_words.py` |
| Match to script | Align whisper words to script words (sequence matching). Whisper may hear "3" vs "three", "a.m." vs "AM": keep script text, take whisper times. Report any word that doesn't match. | same tool |
| Pace report | Same format as the reference transcripts (`{w, start, end}`), so the existing `tools/speech_stats.py` logic measures it vs RULEBOOK §3 | reuse |
| Music | One instrumental track under the whole video. Volume about **18–22 dB under the voice**, slightly lower (ducking) while words are spoken, fade-in 0, fade-out on the last 0.5 s | new `tools/mix_audio.py` (fixed gain + a volume curve from the word times) |
| Loudness | linear gain + peak limiter, measured and corrected until **−14 LUFS integrated, true peak ≤ −2 dBTP** (2-pass `loudnorm` was tried: it falls back to an inaccurate dynamic mode on peaky voices) | same tool |
| Verify | Measure the **final mp4** again (AAC can change peaks a little): pass if −15…−13 LUFS and TP ≤ −1.5 | `check_render.py` |

If the voice pace is off (D18): speed it up with `atempo` on import (`voice_words.py --tempo X`, X = 3.5 ÷ raw pace). Tested by ear: up to ~1.55× sounds natural with Eleven v4 voices; above 1.6× pick a faster voice. Do not use rubberband (it sounded more robotic).

---

## 5. Checks

### 5.1 Before rendering (plan check, fast)

| Check | Range (from RULEBOOK / locks) |
|---|---|
| Shot count | duration/60 × 20 (±25 %) |
| Shot length | 1.5–3.5 s mostly; hook shot shortest (~2.0 s); none under 0.8 s |
| First scene change | 0.8–2.5 s |
| Transitions | dissolve 8 frames; hard cuts ≤ 2 per 60 s, only on beats `twist` or `button` |
| Camera | every shot moves; push-in : pull-out ≈ 2 : 1; first shot `fast_entry` |
| Framing | medium head 24–32 %, close-up ≤ 51 %, wide 11–18 % |
| Blur | ~1 shot in 5 with `blur_bg` 2–4 px |
| Light | warm and cool both used; 2–6 switches, in blocks of ≥ 2 shots; night sets keep one warm practical |

### 5.2 After rendering (`tools/check_render.py`, new)

1. Puts the render in the folder layout the reference tools expect and runs the **existing** `visual_analysis.py` and `style_probe.py` (same measures as the reference, as in `locks.md` §10).
2. Reads a new machine-readable **`style_lock/locks.json`** (the numbers of `locks.md` §1–6, written once tomorrow) and compares:
   - **Format:** 1080×1920, 30 fps, H.264, 35–60 s (ffprobe).
   - **Per shot:** luma, contrast, p5, p95, saturation, colorfulness vs the reference p25–p75 **for that light type** (cool / warm / mixed; today `numbers_table.py` only has cool and all — add warm).
   - **Motion:** zoom %/s, drift, roll, static time, dissolve length, hard cuts.
   - **Captions:** x-height 39–42 px, center 70.3 % ±0.5, outline ~6 px, words per chunk histogram, coverage ≥ 99 %.
   - **Sync:** every caption change within ±1 frame of its word start.
   - **Audio:** LUFS and true peak (ffmpeg `ebur128`).
3. Writes `check_report.md` with the same ✅ / ⬆️ / ⬇️ table style as `numbers_v1_v2_v3.md`, plus a list of **accepted deviations** (like locks §8) so known small misses don't block.
4. Writes a still sheet of every shot for the **eye check** (lesson from v1/v2: numbers missed the camera inside a house and the card through a window).

Rule: fail on format, loudness, captions or sync. Warn on look numbers just outside the range. A4 is still your decision.

---

## 6. Against "mass-produced" content

YouTube's monetization rules penalize content that looks mass-produced or repetitive (the policy was renamed "inauthentic content" in 2025 — wording to re-check before monetizing). Our answer: real variety + visible human work.

| Area | How we vary | Enforced by |
|---|---|---|
| Places | ≥ 2 sets per video; no set used in more than 2 of the last 5 videos without a re-dress (new props, other time of day) | `variety_check.py` |
| Cast | new main character for each video (or a new outfit/role if we choose a recurring host); new silhouette item + color | same |
| Light | the light sequence (e.g. `CCWWC`) differs from the last 3 videos | same |
| Structure | rotate hook types (strange act / paradox / "look at these two" / question / "you" scene), "you see" position (early / late), ending (button / explain), POV (he/she / you) | same |
| Camera | presets mixed per video, not the same shot order | same |
| Words | no repeated hook pattern ("He did X with Y…") in the last 5; per-video originality check vs our own past scripts too | `script_check.py` |
| Human input | your choice of topic, your approvals (A1–A4), your voice choice; sources listed in the description | the flow itself |

`channel/log.json` stores per video: date, topic, sets, cast, light sequence, hook type, "you see" position, ending, POV, word count. The skill reads it at step 1 and step 7.

---

## 7. Folder structure

```
Claude-Animation/
├─ .claude/skills/generate-animated-shorts/   ← the skill (D1)
│  ├─ SKILL.md                        ← ONE flow for every format (steps 1–11 + stops)
│  └─ references/
│     ├─ formats/
│     │  ├─ explainer.md              ← first: beats, lengths, hook types, examples we write ourselves
│     │  └─ story.md                  ← reserved (later)
│     ├─ script_rules.md              ← rules common to all formats (pace, wording, originality)
│     ├─ scene_plan.md                ← JSON fields, camera presets, sets and marks, examples
│     ├─ elevenlabs.md                ← how to write voice_text.txt + settings
│     └─ checks.md                    ← what each check means and what to do when it fails
├─ src/
│  ├─ character/  (locked base)       cast/  (parts, characters, expressions, registry)
│  ├─ world/  (kit, lights, sets, inserts)
│  ├─ film/   (camera, captions, timeline from words, plan loader)
│  └─ compositions/  (StyleTest = regression, Episode = real videos, Lineup)
├─ tools/   (existing analysis + new: voice_words, mix_audio, script_check, check_render, storyboard, variety_check)
├─ style_lock/  (+ locks.json)
├─ channel/log.json
└─ videos/<date>-<slug>/
   ├─ idea.md  facts.md  script.md  voice_text.txt
   ├─ audio/  (voice_raw, voice.wav, music.*, mix.wav, words.json, pace.md)
   ├─ scene_plan.json  scene_plan.md
   ├─ storyboard/  check_report.md  upload.md
   └─ preview.mp4  final.mp4          ← big files: git-ignored (decision below)
```

How a format plugs in: `SKILL.md` step 3 says "read `references/formats/<format>.md`". The format file owns the beats, lengths and hook list; everything else (audio, plan, checks) is shared. Adding `story.md` later = one new file, no new flow.

Remotion needs audio inside `public/`: the preview step copies `audio/mix.wav` to `public/episodes/<slug>/mix.wav` (git-ignored).

---

## 8. Build order (small steps, 1 commit each)

Every step ends with: run it, look at the result, commit. Work on a branch (name: your decision).

| # | Step | Done when | Commit |
|---|---|---|---|
| 0 | Branch + this plan | branch created, PLAN.md committed | `Add skill plan` |
| 1 | **Checker first**: `locks.json` + `check_render.py` | running it on `style_lock/style_test_v3.mp4` passes, except the accepted deviations in locks §8 | `Add render checker` |
| 2 | Skill skeleton with `skill-creator`: SKILL.md flow + `formats/explainer.md` + `script_rules.md` (text only) | the skill shows up and reads the files | `Add skill skeleton` |
| 3 | `script_check.py` (count, beats, originality, fact tags) | a sample script passes; a script with a copied 5-gram fails | `Add script checks` |
| 4 | `voice_words.py` (trim, faster-whisper, match to script, pace report) | works on a 10 s test voice | `Add voice word timing` |
| 5 | `mix_audio.py` (music + gain/limiter to −14 LUFS) | test mix measures −14 ±0.5 LUFS, TP ≤ −2 | `Add audio mix` |
| 6 | Captions from `words.json` + chunker | StyleTest still renders identical (it keeps its own timing); a test words file gives the right chunks | `Captions from word times` |
| 7 | Scene plan loader + `Episode` + camera presets | **Bram plan as JSON renders the same frames as v3** | `Scene plan to composition` |
| 8 | Set kit: split NightStreet into kit + `nightExterior` preset + `night_street` set | StyleTest still identical | `Split world into set kit` |
| 9 | Cast: parts library + expressions + 1 new character + lineup sheet | you like the new character; Pell/Juno/Bram unchanged | `Add cast system` |
| 10 | New light preset + 1 new set (warm interior) | its shots measure inside the **warm** reference ranges; no magenta faces | `Add warm interior set` |
| 11 | Insert cards (1 diagram type) | looks like the world (flat, outlined) | `Add insert cards` |
| 12 | Storyboard sheet + `variety_check.py` + `channel/log.json` | sheet renders; variety check flags a copied plan | `Add storyboard and variety log` |
| 13 | **Pipeline test, 10 s**: a ~35-word original mini-script, test voice, 2 sets, 4 shots, through every step and every stop. Then the `skill-creator` test runs (with/without skill) on 2–3 prompts, since only now can the skill run end to end | `check_report.md` passes; you approve | `Pipeline test 10 s` + tag `pipeline-v0` |

**Step 13 result (2026-11-04):** `videos/2026-11-04-foggy-glasses/` (12.4 s, 6 shots, night_street + workshop + 1 diagram) went through every step and all four stops (A1–A4 approved by the user); tag `pipeline-v0`. Check: only FAIL = length (test is 12 s). Found and fixed on the way: invisible fogged lenses, captions crossing phrases, warm-reading "cold" shots (camera `front` option + `street_far` mark), diagram shots measured with 3D ranges. Skill test runs (`skill-creator`, 3 cases): 95 % of checks with the skill vs 79 % without; the 4 gaps they found are fixed (D15, hook "one", step 1 summary). Still open: the hook rules (A1) from the user's review (→ done, D16); the blue street measures dark (→ D3 brightness review).

Only after step 13: the first full 35–60 s video. Steps 10–11 can move after 13 if we want the pipeline test sooner (then the test uses only `night_street`).

---

## 9. Risks and hardest parts

| Risk | Why it's hard | What we do |
|---|---|---|
| **Places for abstract topics** (inside the body, an economy) | Every 3D place is code; v3's street took 3 versions | Kit + re-dress + insert cards carry the "inside" parts; max 1 new set per video |
| **New light breaks the locked look** | Only night was tuned; v1 had magenta faces and dark flat shots | Calibrate each new preset once with the reference scripts (warm ranges), iteration cap like the style work; character warm light stays `#ffcf8c` |
| **Voice pace** | ElevenLabs voices speak 2.3–2.6 w/s (D18) | atempo to 3.5 w/s on import (≤ 1.6×); pace check before planning |
| **Word matching** | Whisper changes numbers and short words | Sequence matching with the script; report mismatches; captions always use script text |
| **Refactor breaks v3** | Moving code can change pixels | Regression render vs `style_lock/frames` after steps 6, 7, 8 |
| **Wrong facts** | Easy to sound sure and be wrong | Source + quote for every claim; you see `facts.md` at A1; sources go in the description |
| **Copying the reference** | Same channel style can pull same ideas | 5-gram check vs reference transcripts and titles; topics checked vs their 20 titles |
| **Music claims** | Content ID can claim the video | Only tracks with a clear license (decision below) |
| **Character acting** | Flat cards, few poses, no walking yet | RULEBOOK §5: the camera gives most of the energy; a small expression set is enough for v1 |
| **Render time / WebGL on Windows** | ~35 s per 12 s → ~3 min per 60 s; blur shots use 2 canvases | Stills first (storyboard), full render only at preview and final |
| **Scope creep** | Many good ideas | v1 = explainer only, 3 sets, insert type 1; everything else goes to a "later" list |

---

## Questions for you (decide before or during the build)

**Needed tomorrow at the start**

1. ~~Skill name and place~~ → answered: D1.
2. ~~Branch~~ → answered: D2.
3. ~~Reserved brightness iteration~~ → answered: D3.

**Needed before the audio steps (4–5)**

4. ~~ElevenLabs~~ → answered: D8; pace and voice (female) D18.
5. ~~Test voice~~ → answered: D6.
6. ~~Music source~~ → answered: D7.

**Needed before the cast and sets (steps 9–11)**

7. ~~Recurring host or new cast~~ → answered: D9.
8. ~~New light looks~~ → answered: D10.
9. ~~Insert cards~~ → answered: D11.

**Needed before the first full video**

10. ~~Endings~~ → answered provisionally: D17 (review after the first 2–3 full videos).
11. ~~Big files in git~~ → answered: D13.

## Later (parked ideas, not planned yet)

- **Better mountains, VFX item 13 (parked 2026-11-11, user: "if one day I see we need better backgrounds"):** the bridge already has two uneven ridges (`MountainRange` in `src/world/kit/land.tsx`, locked as part of item 8, `references/effects/depth-filling.md`). Left to do: compare only the mountains with the reference (`references/effects/README.md` §13: one big mountain + smaller peaks, very faint, each layer paler), tune shape / haze / composition with an A/B, a short recipe `references/effects/mountains.md` for other sets. Process: briefing → still frames → a few seconds of video, max 2 rounds. Snow version DONE 2026-11-12 (`SnowPeak`, `SnowRange` in `src/world/kit/snow.tsx`); this entry = the green ridges only.
- **Channel identity voice (2026-11-11, user idea):** a narrator voice that belongs to the channel (af_heart, D20, is a popular public voice: the user feels they have heard it before). Ways, cheapest first: (1) **Kokoro voice mix**: blend voice vectors (e.g. 60 % af_heart + 40 % af_bella), save as a .pt file, 100 % identical every video, no new install; (2) **Qwen3-TTS VoiceDesign** (Apache 2.0, ~4–5 GB, tight on the 6 GB GPU): describe the voice in words → a brand-new voice, keep a 10 s sample and clone it each video; (3) the user's own voice or a voice actor with written permission, cloned. Never clone ElevenLabs or a real person without permission. Chatterbox (MIT) is retired since Aug 2026 (archive only). Start by asking the user to describe the voice as a person (age, warmth, energy, accent).

- **Sound effects layer (2026-11-07, user idea from the bridge video FB1):** effects timed to the picture by word anchors (boots on a wooden deck, a bridge creak, a splash, low shouts, river/city ambience), mixed under the voice by `mix_audio.py` from a `sfx` list in `scene_plan.json`; files from the YouTube Audio Library "Sound effects" tab into `assets/sfx/`. Open question: SFX only vs SFX + a quiet music bed (the reference has music in 20/20 videos). Full cue-list example: `videos/2026-11-07-bridge-break-step/feedback.md` FB1. **Started 2026-11-11** (files in `assets/sound-effects/`, recipe `references/sound-effects/sfx.md`): woosh, click (2 files), idea (ding) and alert locked; every SFX −3 dB except the quiet ones; later reverse, fire, cash register, crash.
- **A better sound for laughs (2026-11-11, user):** a laugh uses only the woosh on its pop for now (8 clicks on the "ha-ha" was too much, 3 not decided). If the user finds a better laugh sound, test it and replace (`references/sound-effects/sfx.md` → Open).
