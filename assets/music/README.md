# Music

Background tracks for the videos (decision D7: **YouTube Audio Library**, free and safe for YouTube).

1. Open YouTube Studio → Audio Library, filter by mood/genre, pick calm instrumental tracks without vocals.
2. Download 3–5 tracks into this folder (`.mp3` or `.wav`). Keep the original file names.
3. If a track says "attribution required", copy the attribution text into `ATTRIBUTION.md` here; the skill adds it to the video description.

`tools/mix_audio.py` picks the least recently used track (from `channel/log.json`), puts it ~20 dB under the voice and ducks it 4 dB while words are spoken.
The audio files are git-ignored: they are licensed, not ours.
