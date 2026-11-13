# Script rules (every format)

Numbers come from the measured reference channel (`references/RULEBOOK.md` §2–3). They describe **rhythm and structure only**. Never reuse a sentence, premise, character or title from the reference transcripts; the RULEBOOK quotes a few of their lines as evidence, and those are off-limits as models too.

## 1. Length and pace

| Item | Rule | Why |
|---|---|---|
| Pace | ≈ **3.5 words/s** overall (D18; reference 3.7); first sentence a bit faster; last 5 s a bit slower | the reference voice starts fast, holds, and lands the last line slower |
| Words | target seconds × 3.5 → 35 s ≈ **120**, 45 s ≈ **160**, 60 s ≈ **210** | the voice must fill the video exactly: no intro, no silent tail |
| First word | on frame 1 | no title card, no logo, no "hey guys" |
| Last word | on the last frame | the video ends when the voice ends |

Count words the way they're **spoken** ("3 a.m." = 3 words: three, A, M).

## 2. Wording

- Spoken, simple English. Short clauses. One idea per sentence.
- Chain causes with **"so"** (≥ 2 per video), flip with **"but" / "then" / "until"**.
- At most **one question**. 0–2 short quoted lines of dialogue, casual ("Nobody's paying for that.").
- One humorous exaggeration in the middle is welcome ("so slow the snail filed a complaint").
- POV: third person (a named character) or second person ("you", "imagine you're…"). Pick one and keep it.
- Numbers: use the one a person would say ("about forty" over "38.6"), and only numbers confirmed in `facts.md`.
- Words that read well as **1–2 word captions**: concrete nouns and strong verbs carry the screen.

## 3. Facts

- Every sentence that states a fact ends with its tag(s) from `facts.md`: `… in the 1800s. [F2]`
- A number or detail that belongs to the **invented story** (Rosa cuts forty onions a day) is tagged `[story]` instead. It needs no source, but it must not look like a real-world statistic.
- `softened` facts use the softer wording written in `facts.md`; `cut` facts don't appear.
- The invented character and situation are fiction; the mechanism they show is true. Don't blur the two: no fake quotes from real people, no invented statistics.

`facts.md` layout (the checker reads the `## F#` headings and the `status:` lines):

```markdown
# Facts — <working title>

## F1 — <the claim in one line>
status: confirmed            (confirmed | softened | cut)
say: <wording to use>        (only for softened)
- source: <url> — <publisher>, <date if shown>
  quote: "<exact supporting sentence from the page>"
- source: <url> — <publisher>
  quote: "<…>"
```

## 4. Originality

`tools/script_check.py` blocks:
- any **5-word sequence** (lowercase, punctuation removed) shared with `references/transcripts/*.txt` or with our own past scripts in `videos/*/script.md`;
- a title too close to a reference title (`references/meta/shorts_list.tsv`).

Beyond the check: if the premise feels like one of their videos with the names changed, choose another angle.

## 5. `script.md` layout

The checker and the later steps parse this layout, so keep it exact.

```markdown
# <working title>
format: explainer · target: 45 s · pov: you · hook: strange-act · you-see: late · ending: button · result: went blind

## Script
[hook] First sentence, with the odd concrete detail. [F1]
[escalation] Next sentence. [F2]
Another escalation sentence (no tag = same beat as the line above).
[turn] But …
[you-see] You see, … [F3]
[reveal] …
[ending] Short last line.

## Notes
Anything for the user (softened facts, alternatives). Not spoken.
```

- A beat tag starts a line and stays active until the next tag.
- `result:` = the words of the hook where the strange result lands (they must end by word 8, ≈ 2 s; see the format file §1b). The checker **fails** if they're late, missing or not found.
- Allowed tags: `[hook] [escalation] [turn] [you-see] [reveal] [ending]`. The format file says which are required and where they go.
- Only the `## Script` section is spoken; `## Notes` is not.
- Approval line (added only when the user approves): `approved: <date> (user)` as the first line.

## 6. What `script_check.py` reports

| Check | Pass if |
|---|---|
| Word count | target seconds × 3.5, ±8 % |
| Hook length (WARN) | first sentence ≤ 12 words (aim ~8: the reference hooks have 6–9). Longer only when the script needs it |
| Hook detail (WARN) | first sentence contains a number or a concrete object |
| Hook result first (FAIL) | the `result:` words end by word 8 (≈ 2 s at 4 w/s) |
| Hook scene opener (WARN) | the hook doesn't open with a scene-setting phrase ("Every night…", "On a cold night…", "After a long…", "Picture…", "<Name> walks…"); check by eye |
| Beats | every required tag present, in order; each starts inside its window (by word position, see the format file) |
| Wording | "so" ≥ 2, questions ≤ 1 |
| Facts | every sentence with a digit or a number word has an `[F#]`; every `[F#]` exists in `facts.md` and isn't `cut` |
| Originality | no shared 5-word sequence; no close title |
