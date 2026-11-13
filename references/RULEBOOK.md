# RULEBOOK — "2D characters in a 3D world" Shorts

Reference: 20 latest Shorts from @RicksClips3000 (uploaded 2026-10-14 → 2026-11-01).
Goal: reproduce the **style** (pacing, structure, camera, look), not the content or the characters.

**How to read the numbers**
- `median (p25–p75)` = typical value (the middle half of all values).
- **[M]** = measured by a script. **[L]** = my labels on the transcripts (then timed by a script). **[O]** = seen on contact sheets or montages (all 20 videos looked at; see STYLE_SHEET.md), not measured.

---

## 0. Quick template: one 60 s Short

| Time | % of video | What happens | Pace |
|---|---|---|---|
| 0.00 s | 0 % | First word on frame 1. No intro, no title card, no logo. | — |
| 0–3.6 s | 0–6 % | **Hook**: one sentence (6–9 words, median 8, measured in `analysis/beat_timing.json`) that states a strange result. | 4.0 words/s |
| ~0.8–1.9 s | — | First visual change (sometimes a fast push-in) | — |
| ~5.4 s | 9 % | **Escalation** starts (context, stakes, people doubting) | 3.7 words/s |
| ~33 s | 56 % | **Turn**: things flip ("Then…", "But…") | 3.7 words/s |
| ~45 s | 75 % | **Twist**: the reveal | 3.7 words/s |
| last 5 s | 92–100 % | **Ending**: short punchy last line, voice ends with the video | 3.4 words/s |

About 220 words in total · about 20 shots · one scene change every ~3 s · camera always moving.

---

## 1. Format [M]

| Rule | Value |
|---|---|
| Resolution / fps | 1080×1920, **30 fps**, H.264 (20/20 videos) |
| Duration | median **59 s** (45–64); range 31–78 s |
| Two length types | short explainers ~31–47 s; stories ~56–78 s |
| Audio loudness | **−14 LUFS** integrated (range −15 to −14), true peak about **−2 dBFS** |
| Music | music under the voice the whole time (captions show `[music]` tags in 20/20) |
| Language | English, original track (YouTube adds 7 AI dubs automatically) |

---

## 2. Script rules

### 2.1 Structure [L, timed by script]

| Beat | Starts at (median) | Middle 50 % of videos |
|---|---|---|
| Hook ends (first `.?!`) | **3.6 s** | 3.2–5.2 s |
| Escalation | **5.4 s** | 4.4–10.5 s |
| Turn | **56 %** of the video | 49–63 % |
| Twist / reveal | **75 %** of the video | 72–82 % |
| "You see…" explanation | 67 % (very spread out) | 44–75 % |

Rules:
1. **Start with the result, then go back in time.** "He bet his life savings on the slowest horse in the race." 11/20 hooks describe a *strange action* (strange-act). Others: paradox/rule (4), challenge "look at these two…" (2), question (1), forbidden rule (1), "you" scene (1).
2. **Add one concrete, odd detail to the hook**: a number or object (39 ft, 1 inch to the left, a bell tied to a finger, 47 scratches).
3. **Explain early, then again late.** "You see," appears in **14/20** videos (15 times). It goes in one of two places: just after the hook (~4 s, to give context) or as the reveal pivot (65–85 %).
4. **Doubters make it worse** (about 6/20 [L]): a crowd, boss or police laughs at the protagonist, so the payoff feels earned ("nobody's laughing anymore").
5. **Twist at about ¾**, then explain the mechanism in 1–3 sentences. The twist often reframes the hook (the man in the coffin was never dead).
6. **Endings** [L]: punchy last line ("button") 11/20 · ends on the explanation 6/20 · **cut off mid-sentence** 3/20 (bait for a loop, e.g. "…right as a train rolls onto").
7. **Point of view**: third person "he" 13/20, second person "you / imagine you're…" 7/20.
8. **Format mix**: story 14 · explainer 5 · "levels of X" list 1.

### 2.2 Wording [M]

| Feature | Count |
|---|---|
| "so" (chain of causes) | 48 uses, **20/20** videos (~2.4 per video) |
| "but" | 29 uses, 15/20 |
| "then" | 18 uses, 11/20 |
| "you see" | 15 uses, 14/20 |
| "until" | 10 uses, 8/20 |
| "wait…?" (the viewer's voice asking) | 4/20 |
| Questions per video | median 1 |
| Quoted dialogue lines | median 1 (0–2), short and casual ("Pal, that horse lost a race to the milk cart") |

- Simple spoken English, short clauses, humorous exaggeration in the middle ("so far behind it's practically in the parking lot").
- Titles: "Why…" / "How…" 7/20; "The [noun] that/who…" 5/20.

---

## 3. Voice pace [M]

| Measure | Median | Range |
|---|---|---|
| Words per second (whole video) | **3.70** (~222 wpm) | 3.36–4.11 |
| First 3 s | **4.00** | 3.00–4.67 |
| Middle | 3.71 | 3.41–4.13 |
| Last 5 s | **3.40** | 2.80–4.40 |
| First word starts at | **0.00 s** | 0.00–0.08 s |
| Silence after the last word | about 0 s (voice runs to the last frame) | −0.5 to +0.2 s |
| Long gaps (≥ 2.5× typical gap) | **5 per video** | 2–16 |
| Total words | 220 | 114 (31 s) – 300 (78 s) |

Rules: start fast (4 w/s), stay at about 3.7, slow down a little for the last line. The voice almost never pauses.

---

## 4. Editing rhythm and transitions [M]

| Measure | Median | p10 / p90 |
|---|---|---|
| Shots per video | **20** | 13 / 24 |
| Scene changes per minute | **18.8** | 16.0 / 23.5 |
| Shot length | **2.4 s** | 0.87 s / 5.5 s |
| Shot length in the hook / escalation / after the turn | 2.0 / 2.5 / 2.4 s | — |
| First scene change | **1.9 s** | 0.8 s / 4.1 s |
| Transition type | **dissolve 88 %** (317) · hard cut 12 % (43) | — |
| Dissolve length | **8 frames = 0.27 s** (6–11 frames) | 5 / 13 frames |

Rules:
1. **Default transition = short cross-dissolve of 6–11 frames, while the camera keeps moving**, not a hard cut.
2. Hard cuts are rare (about 2 per video): use them for punches.
3. Hook shots are a bit shorter (2.0 s) than the rest (2.4–2.5 s).
4. **The first second may have a fast push-in** into the subject: seen frame by frame at 0.87 s in one video. In a second video the script found a long, high-motion change at 0.8 s (not checked by eye). 25 % of videos have their first change before 1.0 s.

---

## 5. Camera [M]

The camera is a smooth virtual camera that **is almost never still**.

| Measure | Value |
|---|---|
| Time with a static camera | **only 8.7 %** |
| Time with a push-in (zoom/dolly forward) | **55 %** |
| Time with a pull-out | 28 % |
| Shots with push-in vs pull-out | 257 : 119 (**about 2 : 1**) |
| Zoom speed, absolute | median **11.6 %/s** (4–27 %/s); fast moves 50 %+/s (p90) |
| Pan / drift speed | median **0.07 frame widths/s** (0.02–0.17) |
| Roll per shot | median **1.7°** (0.5–5°) |
| Jitter (shake) | median 0.001 frame width: basically none |
| Character movement inside the frame | median 0.05 frame widths/s: subtle |

Rules:
1. Every shot has a slow move: a **push-in by default (~10 %/s)**, sometimes a pull-out, plus a slow drift.
2. Fast push-ins (50 %+/s) to enter a new place ("into the machine", "into the grave").
3. A small roll (1–5°) is allowed. No handheld shake.
4. Characters move a little (gestures, faces). The camera gives most of the energy.

---

## 6. Look: light and color [M]

| Measure (0–255 luma, 0–1 saturation) | Median | p10 / p90 |
|---|---|---|
| Average brightness (luma) | **116** (mid-tone) | 69 (night) / 162 (day) |
| Contrast (luma std) | **51** | 38 / 66 |
| Darkest 5 % of pixels (p5) | **37**: blacks lifted, not crushed | 16 / 70 |
| Brightest 5 % of pixels (p95) | **211**: whites not clipped | 155 / 240 |
| Saturation | **0.47** | 0.32 / 0.62 |
| Colorfulness (Hasler) | **70** ("quite colorful") | 48 / 94 |
| Change by story part | < 10 %: no grading shift by beat | — |

**Channel palette** (k-means over every shot, weighted by screen time):

| Color | Share | Role [O] |
|---|---|---|
| `#2e1d35` deep plum | 15.6 % | night shadows |
| `#ded7cb` warm off-white | 13.8 % | character heads, highlights |
| `#5a3c45` dusky mauve | 13.2 % | interior shadows |
| `#8e5547` brick | 11.5 % | wood, warm surfaces |
| `#b47d5f` tan | 9.9 % | lamp-lit surfaces |
| `#d1aa7a` sand | 9.3 % | daylight, warm light |
| `#3b3d9b` indigo | 8.7 % | night sky, moonlight |
| `#6e7db8` periwinkle | 7.7 % | cool fill light |
| `#9daac1` grey-blue | 7.6 % | haze, distance |
| `#71a64f` leaf green | 2.7 % | small accent |

Rules: about half the time is **cool blue/purple**, about a third is **warm orange/tan**. The classic mix is a night-blue scene with warm practical lights (lamp, window). Keep lifted blacks and soft highlights (a painterly, not punchy, look).

---

## 7. Characters, world, light and captions

Full details, method and 10 example frames: **[STYLE_SHEET.md](STYLE_SHEET.md)**. Pixel values are at 1080×1920.

| Topic | Rule | Source |
|---|---|---|
| Character proportions | height **≈ 3.1 head widths** (2.65–3.19, 8 standing characters) | [M] 10 frames |
| Head on screen | medium shot **~27 % of frame width** (≈ 290 px); close-up 45–51 %; standing character ≈ **47 % of frame height** | [M] 10 frames |
| Head outline | **≈ 3.4 % of head width** (~9 px on a 270 px head); scales with the character; dark brown in warm light | by eye, 4 heads |
| Limbs | single strokes **≈ 5 % of head width** (13–17 px), ~1.5× the head outline; black or pants color | by eye, 5 legs |
| Character lighting | flat 2D shapes that still take scene light (warm gradients near lamps, blue at night) | [O] |
| World outlines | 10/20 videos none · 6/20 thin line art (**~2 px**) · 4/20 thick cel outlines (**~4 px**); always thinner than the character outlines | [O] labels + [M] strokes |
| Background blur | default sharp; σ > 2 px in **22 %** of shots, σ > 4 px in 8 %; strong blur (σ 6–15 px) on near-camera foreground objects | [M] 380 shots, calibrated ±10 % |
| Warm vs. cool light | **18/20** videos mix both; **~4 switches** per video, in blocks; warm 48 % / cool 36 % / mixed 17 % of time | [M] 20 videos |
| Light vs. story | follows place and time of day, **not** the beats (flip near the turn: 9 videos vs. 8.2 by chance) | [M] |
| Caption size / place | x-height **40 px (2.1 % H)**, ascenders 53 px; center **70.3 % H**, centered; always on screen (99.5 %) | [M] 2 300+ samples |
| Caption words | 1 word **67 %**, 2 words 28 %, 3 words 4 % | [M] |
| Caption style | pure white fill, **~6 px black outline + drop shadow down-right** (dark to 10 px below / 13 px right), sentence case with punctuation | [M] |
| Caption font | closest installed match **Segoe UI Black, −0.04 em** (width 1.00–1.03×); Arial Black has the same shapes but is 16 % wider; **not confirmed** | [M] + by eye |
| Inserts | diagrams and object close-ups (a reel list, a dial, a ticket) explain the mechanism | [O] |

---

## 8. Limits of this analysis

- Transcripts are YouTube **auto-captions** (`en-orig`). They may have small word errors and give no word end times, so "pauses" are approximate.
- Some "dissolves" are really **fast push-ins** (the detector can't separate them). Checked frame by frame: 5/6 were real dissolves, 1/6 was a fast push-in (at 0.87 s).
- Camera motion = one similarity transform per frame (2D). Parallax in 3D scenes and character movement add noise. The "shake" label (17 % of time) is probably fast moves, not real shake (median jitter ≈ 0).
- The beat labels are my reading. Their timestamps are measured.
- Only 20 videos from one channel, all from ~3 weeks.
- Section 7: proportions and line widths come from 17 characters in 10 frames; head outlines and legs were counted by eye on zooms, because the script mixed in hair and body outlines; world looks are visual labels. See STYLE_SHEET.md §6.

---

## Appendix A — per video

| # | Title | Dur s | WPS | Hook ends s | Turn % | Twist % | Ending | Shots | Changes/min | Dissolve/hard |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Why Perfect Railroads Don't Work | 65 | 3.36 | 3.4 | 55 | 74 | cutoff | 21 | 18.4 | 19/1 |
| 2 | Why Sailors Carried Storm Oil | 65 | 3.82 | 5.5 | 57 | 87 | cutoff | 16 | 13.9 | 10/5 |
| 3 | How a Mirror Rigged a Horse Race | 64 | 3.84 | 3.1 | 54 | 82 | button | 26 | 23.4 | 23/2 |
| 4 | The Town Built Around a Button | 66 | 3.75 | 3.4 | 58 | 88 | button | 22 | 19.2 | 18/3 |
| 5 | Why the Second Draw Always Wins | 56 | 3.96 | 3.6 | 30 | 55 | explain | 20 | 20.3 | 17/2 |
| 6 | Every Memory Has a Price | 78 | 3.86 | 3.3 | 72 | 91 | button | 22 | 16.2 | 21/0 |
| 7 | He Could Spot Winning Tickets Just by Looking | 63 | 3.68 | 1.7 | 50 | 76 | button | 23 | 20.9 | 20/2 |
| 8 | What the Grave Bell Really Meant | 60 | 3.7 | 3.1 | 45 | 62 | button | 22 | 21.2 | 20/1 |
| 9 | Why Cashiers Keep Winning The Lottery | 58 | 3.45 | 5.7 | 61 | 65 | explain | 18 | 17.7 | 16/1 |
| 10 | The Job Nobody Wants in Japan | 60 | 3.75 | 4.4 | 70 | 81 | button | 24 | 22.8 | 20/3 |
| 11 | The Burglar Who Only Moved Furniture | 58 | 4.11 | 5.4 | 82 | 85 | button | 22 | 21.6 | 19/2 |
| 12 | The Ancient Jar That Warned an Empire | 65 | 3.65 | 5.2 | 50 | 71 | explain | 26 | 23.1 | 23/2 |
| 13 | Levels of Pirate Cannonballs | 64 | 3.48 | 3.9 | 77 | 84 | button | 20 | 18.0 | 13/6 |
| 14 | This Knight Found the Ultimate Loophole | 41 | 3.94 | 3.4 | 59 | 73 | button | 19 | 26.6 | 14/4 |
| 15 | An Unstoppable Spear vs an Unbreakable Shield | 45 | 3.64 | 6.2 | 38 | 73 | button | 13 | 16.0 | 10/2 |
| 16 | How Painkillers Actually Work | 34 | 3.98 | 2.2 | 43 | 74 | explain | 10 | 15.7 | 8/1 |
| 17 | The Window That Breaks Japan's Gambling Law | 45 | 3.57 | 1.8 | 36 | 67 | button | 14 | 17.3 | 13/0 |
| 18 | The Science Behind Slot Machines | 31 | 3.69 | 4.6 | 53 | 75 | explain | 10 | 17.5 | 8/1 |
| 19 | The Scientist's Insane Time Test | 40 | 3.6 | 5.3 | 71 | 76 | explain | 17 | 24.0 | 13/3 |
| 20 | Why Humans Can't Pick Random Numbers | 47 | 3.5 | 3.5 | 61 | 75 | cutoff | 15 | 17.8 | 12/2 |

## Appendix B — files and how to re-run

| Path | Content |
|---|---|
| `references/videos/<id>.mp4` | the 20 Shorts (original English audio) |
| `references/transcripts/<id>.txt` / `.json` | timestamped transcript / word-level times |
| `references/analysis/beats.json` | hand-labelled beats (edit here) |
| `references/analysis/beat_timing.json`, `speech_stats.json` | script and pace numbers |
| `references/analysis/visual/<id>.json` | shots, transitions, camera, tone, palettes |
| `references/analysis/visual_summary.json` | channel-level numbers |
| `references/analysis/contact_sheets/<id>.jpg` | 16 frames + palette strip per shot |
| `references/STYLE_SHEET.md` | characters, world, blur, light, captions (with example frames) |
| `references/analysis/style_frames/` | 10 example crops + caption references + annotated overlays |
| `references/analysis/style/<id>.json`, `style_summary.json`, `style_frames_measured.json` | style measurements |
| `tools/*.py` | the scripts |

```bash
.venv/Scripts/python -I tools/captions_to_transcript.py references
# only for videos with no YouTube captions (GPU, downloads large-v3-turbo ~1.6 GB the first time):
.venv/Scripts/python -I tools/transcribe_whisper.py references
.venv/Scripts/python -I tools/speech_stats.py references
.venv/Scripts/python -I tools/beat_timing.py references
.venv/Scripts/python -I tools/visual_analysis.py references --workers 4
.venv/Scripts/python -I tools/summarize_visual.py references
.venv/Scripts/python -I tools/style_probe.py references --workers 4
.venv/Scripts/python -I tools/summarize_style.py references
.venv/Scripts/python -I tools/style_frames.py references
```
