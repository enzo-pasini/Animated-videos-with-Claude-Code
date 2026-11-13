# Format: explainer

A real fact about the world (science, the body, history, economy, daily life) told as a **mini-story**: an invented character lives through the strange result, and the end explains the true mechanism.

Shape: **strange hook → escalation → "you see" → reveal → short ending.**
Length: **35–60 s**. Reference explainers run 31–47 s; stories run longer. Pick 35–45 s for one clean mechanism, up to 60 s when the escalation has real steps.

## 1. Beats

Positions are % of the video (by spoken time; `script_check.py` measures them by word position).

| Tag | Required | Starts at | What it does |
|---|---|---|---|
| `[hook]` | yes | 0 s, ends by ~3.6 s (first sentence ~8 words, §1b) | The strange result, stated as plain fact, **in the first 8 words** (§1b), with **one odd concrete detail** (a number, an object, a body part). Not a question unless the hook type is `question`. Never "Did you know". |
| `[escalation]` | yes | right after the hook | Context and stakes. Each sentence makes it stranger or raises the cost. A doubter is optional (someone says it can't work). |
| `[turn]` | optional | 49–63 % | The obvious explanation fails, or things flip: "But…", "Then…", "Until…". |
| `[you-see]` | yes | **late: 65–80 %** (default) or **early: right after the hook** | Starts the explanation with "You see,". Early = gives context fast, then the reveal comes later without "you see". |
| `[reveal]` | yes | 72–85 % | The true mechanism in 1–3 plain sentences. Best when it **reframes the hook** (the strange thing was normal all along, or the opposite). |
| `[ending]` | yes | last ~5 s | A short punchy line (button), or end on the last line of the explanation. Default = button; explain only when the explanation is the payoff. No mid-sentence cut-off (PLAN D17, provisional: review after the first 2–3 full videos). |

## 1b. The hook: result first

Why: a viewer decides in ~2 s whether to keep watching. A hook that first places the scene ("Mira walks from the cold night into the warm workshop, and instantly goes blind") spends those seconds on setup and lands the strange part at ~3.5 s. The pipeline test had exactly this problem.

- **The first 8 words already carry the strange result** (≈ 2 s at the hook pace of 4 words/s). The scene, the character and the "when" come after it, or in the escalation.
- **Hook length: aim for ~8 words** in the first sentence; the 20 reference hooks have a first sentence of 6–9 words (median 8, all ≤ 12; `references/analysis/beat_timing.json`). Longer is fine when the script needs it (the checker only warns over 12).
- **Never open by placing the scene or the character**: no "Every night…", "One day…", "In a small town…", "Meet…", "Imagine…", "<Name> walks into…".
- Write the words where the result lands in the format line as `result: <words>`; `script_check.py` **fails** when they end after word 8 or `result:` is missing, and warns when the hook opens with a scene-setting phrase or its first sentence is over 12 words.
- **Frame 1 shows the result**, not the starting situation: if the hook says the glasses fogged, the first shot opens on the fogged glasses (scene plan rule, `references/scene_plan.md` §3). The world and the "before" come later.
- **At step 3, write 3–5 hook options** (different types or angles, all result-first) and show them at A1 for the user to pick. The rest of the script is written around the chosen one.

Shape of a good hook (from the user's review of the pipeline test; examples of the **shape**, don't reuse the words):

| Weak (setup first) | Strong (result first) |
|---|---|
| Mira walks from the cold night into a warm shop, and instantly goes blind. | She went blind the second she walked through the door. |
| — | Your glasses can betray you in under one second. |

## 2. Word budget

At 3.5 w/s (D18; hook a bit faster, ending a bit slower). Escalation includes any early `you see` line.

| Target | Hook | Escalation (to 56 %) | Turn + you see (56–75 %) | Reveal (75 % → last 5 s) | Ending | Total |
|---|---|---|---|---|---|---|
| 35 s | 14 | 59 | 25 | 14 | 17 | **≈ 130** |
| 45 s | 14 | 80 | 32 | 23 | 17 | **≈ 165** |
| 60 s | 14 | 111 | 42 | 37 | 17 | **≈ 220** |

## 3. Hook types

Rotate them across videos (the variety log tracks this). Shares in the reference: strange-act 11/20, paradox 4, look-at-these 2, question 1, forbidden 1, you-scene 1. The lines below show the **shape only** with placeholders; don't reuse them as written. Every shape puts the strange result in the first 8 words (§1b).

| Type | Shape |
|---|---|
| `strange-act` | `<Who> <strange result> <odd concrete detail>, <when/where after it>.` (e.g. shape "She went blind the second she…") |
| `paradox` | `The <thing> that <does X> is the reason it <does the opposite>.` |
| `look-at-these` | `These two <things>: one <strange result>, the other <doesn't>.` |
| `question` | `Why does <everyday thing> <strange behaviour>?` |
| `forbidden` | `It's <forbidden/required> to <odd act> in <place> — for a good reason.` |
| `you-scene` | `Your <everyday thing> can <strange result> in <number>.` |

## 4. The character

- One invented main character per video (cast rules: `PLAN.md` §3.1). Name them only if the name helps; "a baker", "you" are fine.
- The character **experiences** the fact; the narrator explains it. Keep the character's role tied to the topic (a sailor for tides, a cook for chemistry), so the places in the scene plan follow naturally.
- For the body and other "inside" topics, the reveal can cut to an insert card (diagram) instead of a 3D place.

## 5. Checklist before A1

- [ ] 3–5 hook options written, all result-first; the strange result lands in the first 8 words (`result:` in the format line, no hook FAIL; a length WARN is OK if the script needs the words).
- [ ] Hook doesn't open by placing the scene or the character.
- [ ] Hook has a concrete detail and is confirmed in `facts.md`.
- [ ] Every beat present and inside its window; word count inside ±8 %.
- [ ] The reveal explains the real mechanism, not just names it.
- [ ] Ending ≤ 2 short sentences.
- [ ] Hook type, `you see` position, POV and ending differ from the last video in `channel/log.json` in at least two of the four.
