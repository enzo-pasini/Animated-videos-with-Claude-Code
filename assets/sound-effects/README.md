# Sound effects

Short sounds placed on a word or frame by `tools/mix_audio.py` (the `sfx` list in `scene_plan.json`).
The audio files are **git-ignored** (like `assets/music/`, decision D7): keep a backup elsewhere.
When to use each sound: the user's rules in `references/sound-effects/Quando-usar-efeitos-sonoros.txt`
and the plan rules in `.claude/skills/generate-animated-shorts/references/scene_plan.md`.

| File | Sound id | Status | Source / license |
|---|---|---|---|
| `woosh_1.mp3`, `woosh_2.mp3` | `woosh` (alternates 1/2) | **locked** | added by the user 2026-11-11, source to fill in |
| `scribblenauts-button-click.mp3` | `click` (main) | **locked** | ⚠ **game sound** (Scribblenauts): tests only, needs a royalty-free lookalike before upload |
| `ding-sound-effect.mp3` | `idea` | **locked** | added by the user 2026-11-11, source to fill in |
| `metal-gear-alert-sound-effect.mp3` | `alert` | **locked** | ⚠ **game sound** (Metal Gear, Konami): tests only, needs a royalty-free lookalike before upload |
| `button-click-pop-2-sound-effect.mp3` | `click` (second: after 3 scenes in a row with the main click; +6 dB) | **locked** | myinstants.com, royalty-free per the user (2026-11-11). myinstants hosts user uploads without a license guarantee: check the original source before an upload |
| `reverse-sound-effect.mp3` | (later) | not used yet | added by the user 2026-11-11, source to fill in |
| `fire-burning.mp3` | (later) | not used yet | added by the user 2026-11-11, source to fill in |
| `cash-register-sound-effect.mp3` | (later) | not used yet | added by the user 2026-11-11, source to fill in |
| `crash-sound-effect.mp3` | (later) | not used yet | added by the user 2026-11-11, source to fill in |

Safe sources for replacements: YouTube Studio → Audio Library → "Sound effects" tab, or a CC0 source.
`mix_audio.py` measures each file by itself (hit = loudest 10 ms, level = RMS of the sounding part), so a new
file needs no hand measuring: add it here and to `SOUNDS` in `tools/mix_audio.py`.
