# Sound effects (SFX) — recipe

The user's rules (Portuguese): `Quando-usar-efeitos-sonoros.txt` (this folder). Files: `assets/sound-effects/`
(git-ignored, sources + licenses in its `README.md`). Code: `tools/mix_audio.py` (`SOUNDS`, `plan_sfx`).
Plan field and placement rules for the skill: `.claude/skills/generate-animated-shorts/references/scene_plan.md` §5d.

## How it works

- Plan: `"sfx": [{"at": "w:6+3", "sound": "woosh"}, …]` at the top level of `scene_plan.json`.
  Anchors `f:N` / `w:N±k` (same frames as `build_props.py`; no shot anchors like `start+k`).
- The sound's **hit** (its loudest 10 ms, measured from the file) lands on the anchor frame, not its file start.
- Level = RMS of the sounding part vs RMS of the spoken words, both measured by the tool, so files of different
  loudness (woosh_1 is 6.5 dB louder than woosh_2) come out the same. Default per sound in `SOUNDS`;
  `"gain_db"` changes one cue. Then **every sound −3 dB** (`ALL_SFX_DB`, the user's combo choice 2026-11-11), except
  the sounds quiet by nature (`NOT_LOWERED`: the pop). A cue louder than −3 dB under the voice = FAIL (never cover a word).
- Mix order: voice (+ music) + SFX (no ducking) → −14 LUFS / ≤ −2 dBTP. `--no-music` = voice + SFX only.

## Status

| Sound | id | Final level (single test −3 dB) | Status | Where (approved uses) |
|---|---|---|---|---|
| Woosh (2 files, alternate) | `woosh` | −9 dB (test: −6) | **locked** 2026-11-11 (test 1, A) | fast moves: laugh pop, think / head turn, a quick left→right head move, happy pop, jump take-off (hop, big), anger + edge lines + punch. **Not** shy (→ click), **not** a fright (→ alert) |
| Button click (2 files) | `click` | −15 dB (test: −12); pop −6 (+6, not lowered) | **locked** 2026-11-11 (test 1, B; files: click test 2 + final) | one click per repetition: think chin taps, blinks, shy turn + each peek. **Not** on a laugh (see Open) |
| Idea (ding) | `idea` | −9 dB (test: −6) | **locked** 2026-11-11 (test 1, A) | think → happy: ding on the happy pop; before a pause or mid-sentence; + woosh (hop take-off or the same pop) |
| Alert | `alert` | −12 dB | **locked** 2026-11-11 (test 1, A) | fright (`shock`, `scared`, scared jump), turning point (a light goes out), reveal (shock + lines + punch) |

## Timing: where the hit goes (frames after the fx anchor)

From `src/cast/fx.ts` (`FACE_FX`, `JUMPS`) and the recipes `references/effects/face-stretch.md`, `jump.md`.

| Visual | Sound | Cue | Note |
|---|---|---|---|
| `laugh` | woosh | `+8` | approved at +8 (the face pop in the code is at +3; +8 felt right) |
| `think` / `think_l` (also a fast head turn left↔right) | woosh | `+3` | the turn takes 4 frames |
| `happy` | woosh | `+2` | small pop, frames 0–4 |
| jump `hop` / `big` | woosh | `+4` / `+2` | the take-off frame |
| anger + `lines` + `punch` | woosh | `+3` | inside the 0.27 s push-in |
| `happy` after `think` (the idea) | idea (ding) | `+2` | + woosh `+2` (same pop) or `+4` (hop take-off) |
| `shock` (a fright) | alert | `+5` | the pop |
| `scared` (+ jump `big`) | alert | `+3` | the eyes open |
| a light goes out (turning point) | alert | `+0` | the room darkens with a grade that follows the light |
| reveal: `shock` 4 frames before + `lines` + `punch` on the word | alert | `+1` | |
| `think` chin taps | click | `+15, +25, +35…` | the finger comes down every ~10 frames |
| blink (actor `blink` list) | click | `+0` | on the blink frame |
| `shy` | click | `+2` (turn), `+10, +30, +50…` (peeks) | a peek every 20 frames |

## Tests

Builder: `tools/vfx_tests/sfx_test_props.py <woosh|click> out/sfx/<sound>` (needs `out/sfx/<sound>/script.md` +
`voice_text.txt` → `tts_kokoro.py` → `voice_words.py --tempo 1.19`) → `props.json` + `sfx_A.json` / `sfx_B.json`
→ `mix_audio.py --no-music --sfx-plan …` → `npx remotion render Episode … --props=…` (silent) → ffmpeg adds each mix.

| Test | Result |
|---|---|
| Woosh 1 (W1–W9, A −6 / B −12) | A. W1–W8 kept. W9 shy → click instead |
| W9 with clicks (−6) | click is right for shy, but −6 was too loud |
| Click 1 (C1–C6, A −6 / B −12) | B. Kept chin taps, blinks, shy turn + peeks. Laugh ×8 = too many |
| Click round 2: laugh ×3 | not decided: a laugh keeps only the woosh for now |
| Ding 1 (D1–D4, A −6 / B −12) | A. All kept, the woosh combos too. The user: combos (together or one after another) are good |
| Combo 1 (K1–K8: woosh on the think turn + clicks on the chin taps + ding (+ woosh); A locked levels / B −3 dB) | **B** (everything 3 dB lower) felt better. All clicks kept: with or without the narrator saying the action. Applied (user, 2026-11-11): **every sound −3 dB**, except sounds quiet by nature (the pop) |
| Click test 2 (alternating the old click and the user's pop) | one file **per scene**, not per cue; the pop was too quiet |
| Alert 1 (L1–L4, A −12 / B −18 final) | **A**. All kept: 2 frights, a turning point, a reveal |
| Click final (combo B) | **approved**: Scribblenauts = main click; the pop after 3 click scenes in a row (`run`, reset after 10 s without clicks); pop +6 dB (`FILE_TRIM_DB`: it rings 60 ms vs 120 ms) |

## Open

- **Laugh sound**: a laugh has only the woosh on its pop (+8) for now. Clicks on the "ha-ha" bounce (every 6 frames)
  were usable but not the best (8 too many, 3 not decided). If the user finds a better laugh sound: test it, then replace.

⚠ `click` (Scribblenauts) and `alert` (Metal Gear) are **game sounds**: fine for tests; a video for upload needs a
royalty-free lookalike (YouTube Audio Library "Sound effects", or CC0) first.
