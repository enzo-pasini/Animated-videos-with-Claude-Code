# Scene plan (`scene_plan.json`)

The plan says **what** each shot shows; `tools/build_props.py` turns it into frames and camera numbers (`render_props.json`), runs the plan check, and the `Episode` composition draws it. Full working example: `tools/tests/bram_plan/scene_plan.json` (the locked v3 test as a plan).

```bash
.venv/Scripts/python -I tools/build_props.py videos/<slug>          # → render_props.json + plan check
npx remotion still Episode videos/<slug>/storyboard/s01.png --frame=<N> --props=videos/<slug>/render_props.json
npx remotion render Episode videos/<slug>/preview.mp4 --props=videos/<slug>/render_props.json --crf=16
```

## 1. Top level

| Field | Meaning |
|---|---|
| `fps`, `dissolve_frames` | 30 and 8 (locked) |
| `audio.words` | `audio/words.json` (word times) |
| `audio.public_path` | the mix inside `public/`, e.g. `episodes/<slug>/mix.wav` (copy `audio/mix.wav` there first); `null` = silent |
| `captions` | `captions.json` |
| `lights` | light name → keys `[[anchor, level], …]`, linear between keys (levels 0–1). Names come from the set (`src/world/sets/<set>.json` → `lights`) |
| `shots` | list, in order |

Length comes from `audio/mix.json` (exact frames after the last word); without it, `frames` or last word + 0.1 s.

## 2. Anchors (time)

| Anchor | Frame |
|---|---|
| `"f:120"` | frame 120 |
| `"w:12"` | start of word 12 (index in `words.json`, from 0) |
| `"w:12+2"`, `"w:12-3"` | 2 frames after / 3 before |
| `"start"`, `"start+60"` | the shot's first frame (inside a shot only) |

Use word anchors for everything that should land on a word (a light turning on, a smile, a cut on a punch line). Change shots on word starts too: the reference cuts every ~2.4 s, the hook shot ~2.0 s.

## 3. A shot

| Field | Meaning |
|---|---|
| `id`, `beat` | `s01`… and the script beat (`hook`, `escalation`, `turn`, `you-see`, `reveal`, `ending`) |
| `from` | anchor where the shot starts appearing (the 8-frame dissolve into it starts here). First shot `f:0` |

**Frame 1 shows the strange result** (the hook's `result:`), not the situation before it: fogged glasses, the cracked glass, the crying cook. The "before" and the place can come in the next shots. Why: the first frame and the first ~2 s decide if the viewer stays.

| `transition_in` | `dissolve` (default) or `cut` (≤ 2 per 60 s, only on `reveal`/`ending` punches) |
| `set` | a set id (`night_street`, …) |
| `camera` | a preset (below), or `{"move": {…}}` with raw numbers (only when no preset can do it) |
| `grade` | optional CSS filter on the 3D layer, or `{"from": [b,c,s], "to": [b,c,s], "follow": "<light>"}` |
| `blur_bg` | background blur in px (2–4) — about 1 shot in 5, usually a close-up |
| `extra_warm` | extra warm light on the characters `{pos, color, strength, range, follow}` |
| `actors` | characters in the shot (below) |

## 4. Camera presets

| Preset | Default head size → end | fov | Rate | Use |
|---|---|---|---|---|
| `fast_entry` | wide 13 % → ~24 % in 0.8 s (lens zoom 70 → 44) → ~29 % | 44 | 0.13 | the first shot; entering a new place |
| `push_in` | 24 % → ~32 % | 40 | 0.13 | default shot |
| `close_up` | 40.5 % → ≤ 51 % (slows itself on long shots) | 30 | 0.09 | reactions, with `blur_bg` |
| `pull_out` | 32 % → smaller | 40 | −0.10 | reveals of a place; ~1 in 3 shots at most |

Fields: `aim` (`"mark:<name>"` or `[x, y, z]`), `part` (`head` / `body` / `feet`, for marks), `head_pct` (start size), `side` (`left` / `right` / `front`; default alternates so cameras sit on diagonals), `fov`, `elev`, `roll` `[start, end]`, `rate`. Drift is automatic (0.05 frame widths/s, sideways). Avoid `front` on a wall: v1 lessons say diagonals keep depth.

## 5. Actors

```json
{ "who": "bram", "at": "mark:lantern_spot",
  "pose":   { "armL": 0.62, "lookX": 0.15 },
  "tracks": { "browRaise": [["start", 1], ["w:39", 0.35]] },
  "steps":  { "mouth": [["start", "open"], ["w:36", "smile"]] },
  "blink":  ["w:37+2"] }
```

- `pose`: fixed fields of `Pose` (`src/character/draw.ts`): `armL/armR` (radians up from hanging), `lookX/lookY` (−1…1), `browRaise` (−1 angry … 1 surprised), `headTilt`, `mouth` (`line|smile|open|flat|frown`). Or a named expression: `"pose": {"expr": "worried"}` (fields written next to it win).
- Expressions (`src/cast/expressions.ts`): `neutral happy surprised worried angry thinking laughing proud sad` and gestures `pointing shrug wave`. Switch them on a word with `"steps": {"expr": [["start", "worried"], ["w:20", "happy"]]}`.
- `tracks`: numeric fields that move, eased in/out between keys. `steps`: `mouth` / `expr` change on a frame. `blink`: 4-frame blinks.
- **Effects (style v4, `style_lock/locks_v4.md`)**: `"steps": {"fx": [["w:12", "anger"]]}` starts a timed effect on a word; `["w:30", "none"]` stops it. Only effects listed as locked in `locks_v4.md` may be used. Locked now: `anger` (purple head + smoke + angry acting; it overrides mouth, brows, arms, head tilt and look while it runs). The full locked list (sweat, heat, 3D face, `scared`…) is in `locks_v4.md`.
- **Jump (style v4, body only)**: `"steps": {"jump": [["w:5", "big"]]}` = a jump on that word (`hop` small, `big` with a stretch; landing dust by default, `_nodust` = quiet; `none` = standing). The face is separate: add a face fx on the same word (`"fx": [["w:5", "scared"]]` = a fright, `happy` / `laugh` = joy). Needs the whole body and headroom in the shot. Recipe: `references/effects/jump.md`.
- **Walk (style v4, body only)**: actor `"walk": {"from": "mark:door", "to": "mark:street_center", "at": "w:6", "pace": "normal"}` = the actor walks from → to and stops there (whole steps + a stop step; no `at` mark needed). `pace`: `normal` (calm), `fast` (hurry), `rush` (urgency / panic). `"stop": false` = keeps walking to the shot end. build_props warns when the walk does not fit in the shot. Toward / away from the camera reads best; to travel with the walker use a raw camera move with `drift` = the pace speed (1.0 / 1.6 / 2.2 m/s). The face is free. Recipe: `references/effects/walk.md`.
- **Edge lines (style v4, shot level)**: `"lines": "w:6"` on the shot + `"punch": "w:6"` in its camera = focus lines from the frame edges + a fast push-in (1.15× in 0.27 s) on that word. Use them to **intensify** anger, a character shouting / getting worked up, or a shock, with the face fx on the same beat (`shock` 4 frames before: `["w:6-4", "shock"]`). 15 frames; a few per video at most; `punch` not with `fast_entry`. Recipe: `references/effects/edge-lines.md`.
- **Sound effects**: see §5d (the plan's `sfx` list, placed on the same frames as these effects).
- `"bg": true` (look L2, `style_lock/locks_v4.md`): a **background** actor (ranks, passers-by): the outfit draws only its big shapes (base colour + at most 2). Never on the main character. The 3D clothing shading and the turn with the 3D face are automatic.
- Breathing is automatic. Characters stay subtle (RULEBOOK §5: the camera gives the energy).

## 5b. Cast (D9: a new main character every video)

- `who` = an id in `src/cast/registry.ts` (`CAST`). The v3 characters `pell`, `juno`, `bram` are locked; new ones are made with `makeCharacter(base, parts)` from `src/cast/parts.ts` (hair, hats, face, outfits, accessories).
- A new character needs: **one strong silhouette item** + a main color that differs from the last 5 videos (`silhouette`, `mainColor` fields; the variety check reads them). Tie the look to the role (a sailor for tides, a cook for chemistry).
- Approve it before use: `npx remotion still Lineup out/cast/lineup.png --props='{"ids":["bram","<new>","juno"]}'` (same scale, night street) and `npx remotion still ExpressionSheet out/cast/<new>.png --props='{"id":"<new>","exprs":["neutral","happy","surprised","worried","pointing","shrug"]}'`. Show both to the user.
- Need a part that doesn't exist? Add it to `parts.ts` (head hooks are in head-local units: head center 0,0, half-width 0.5), never edit `src/character/draw.ts` (locked proportions and line widths).

## 5c. Insert shots (D11: flat diagrams that explain the mechanism)

```json
{ "id": "s07", "beat": "reveal", "from": "w:120", "set": "insert", "camera": { "preset": "push_in" },
  "insert": { "background": "paper", "shapes": [
    { "type": "blob",  "x": 540, "y": 760, "r": 330, "fill": "#d9c7e6", "seed": 4, "at": "start" },
    { "type": "dots",  "x": 330, "y": 600, "w": 180, "h": 300, "n": 14, "r": 18, "fill": "#e8c87a", "at": "w:123" },
    { "type": "arrow", "from": [120, 300], "to": [480, 640], "color": "#9daac1", "width": 22, "at": "w:126" } ] } }
```

- Coordinates are pixels of the 1080×1920 frame. Keep shapes **out of the caption band (y 1290–1410)**; the plan check warns.
- Shapes: `circle {x,y,r,fill}`, `rect {x,y,w,h,fill,radius}`, `blob {x,y,r,fill,wobble,seed}` (cells, organs, coins…), `dots {x,y,w,h,n,r,fill,seed,drift:[px/s,px/s]}` (gas, molecules, crowds), `arrow {from,to,color,width}`.
- `at` = word anchor where the shape appears (pop-in; arrows draw themselves). Build the diagram **with the voice**: one new shape per idea.
- `background`: `paper` (graph paper, warm) or `night` (plum). No text inside: the captions carry the words.
- Camera presets for inserts are 2D (`push_in` 10 %/s, `pull_out` −8 %/s, drift, small roll). Use 1–3 inserts per video, usually around the reveal.

## 5d. Sound effects (`sfx`, top level)

`"sfx": [{"at": "w:6+3", "sound": "woosh"}, {"at": "w:9", "sound": "click", "gain_db": -2}]`, mixed by
`tools/mix_audio.py` (step 9): the sound's **hit** lands on the anchor; the level is set against the voice
(default per sound; `gain_db` changes one cue). Only `f:N` / `w:N±k` anchors. Recipe + test history:
`references/sound-effects/sfx.md`. Only these sounds (the user's rules, `references/sound-effects/Quando-usar-efeitos-sonoros.txt`):

| id | Use it on | Never on | Cue (frames after the fx anchor) |
|---|---|---|---|
| `woosh` (**locked**, −9 dB; alternates woosh_1 / woosh_2 by itself) | a **fast move**: a fast change of expression or head move. Approved: `laugh` (+8), `think` / `think_l` and a quick left↔right head turn (+3), `happy` pop (+2), jump take-off (`hop` +4, `big` +2), anger + `lines` + `punch` (+3) | a fright (`shock`, `scared` → `alert`); `shy` (→ `click`) | see the left column |
| `click` (**locked**, −15 dB, the pop −6; two files, picked by `mix_audio.py`: ONE file per shot, the Scribblenauts click by default, the pop after 3 click scenes in a row; `click_1` / `click_2` force one) | a **repeated action, one click per repetition**: `think` chin taps (+15, +25, +35…), blinks (on the blink frame), `shy` turn + each peek (+2, then +10, +30, +50…) | a laugh (a laugh gets only the woosh on its pop, +8; a better laugh sound is an open question) | see the left column |
| `idea` (ding, **locked**, −9 dB) | a character **has an idea**: `think` → `happy` (the idea), ding on the happy pop (+2). Fine before a pause or mid-sentence (its 1 s tail under the next words was OK). Combos approved: + woosh on a hop take-off (+4) or on the same pop (+2) | | +2 after the `happy` anchor |
| `alert` (**locked**, −12 dB: low, it is loud by nature) | a **fright**: `shock` (+5, the pop), `scared` (+3, the eyes open; also with a big jump); a **turning point / climax**: something changes on the word (e.g. a light goes out, +0), a **reveal** with `shock` + `lines` + `punch` (+1 after the punch word) | a woosh on the same fright (never) | see the left column |

- Put a cue only where the move really happens on screen (the actor is in the shot, the fx runs).
- **Combos are good** (the user, 2026-11-11): sounds together or one after another, e.g. woosh on the head turn → clicks on the chin taps → ding on the idea. The levels keep it from being too much (combo test: `references/sound-effects/sfx.md`). Clicks work with or without the narrator naming the action.
- Levels (vs the voice) are set by `mix_audio.py`: each sound's approved single-test level **−3 dB** (the user's combo choice), except sounds quiet by nature (the pop) that keep theirs. Don't add `gain_db` unless a test asks for it.
- A sound must never cover a word: keep the defaults; `mix_audio.py` refuses a cue louder than −3 dB under the voice.
- ⚠ `click` and `alert` are game sounds: before an upload, swap them for royalty-free lookalikes (`assets/sound-effects/README.md`).

## 6. Plan check (runs in build_props.py)

FAIL: a shot under 0.8 s, a shot that doesn't move, a head past 51 %. WARN: shot count vs length, shots outside 1.5–3.5 s, first change outside 0.8–2.5 s, hook shot longer than the median, hard cuts, push < pull, no fast entry, blur share outside 1-in-10…2-in-5, a head under 11 %. Light blocks (warm/cool) are checked on the render by `check_render.py`.
