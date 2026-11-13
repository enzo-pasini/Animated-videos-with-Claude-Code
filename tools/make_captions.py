"""Cut the timed script words into caption chunks (1-2 words) -> captions.json.

Usage (from the project root):
  python -I tools/make_captions.py videos/<slug> [--fps 30]
  python -I tools/make_captions.py --words-json FILE --out FILE

Reads audio/words.json (from voice_words.py), writes captions.json:
  [{"text": "Every", "start": 0}, {"text": "at 3", "start": 18}, ...]   (start = frame)
The Remotion captions show these chunks, and tools/check_render.py --captions checks that every
change happens on its frame. One file, so the render and the check can't disagree.

Rules (STYLE_SHEET section 5: 1 word 67 %, 2 words 28 %, 3 words 4 %). A chunk is a piece of ONE phrase:
- one word per chunk by default;
- breaks between words have three levels:
  hard = sentence end, comma, colon, dash: never joined;
  soft = a pause in the voice (>= PAUSE_S), a new phrase starting (a content word followed by a
         preposition, conjunction or determiner: "night | into the", "cold | the"), or a subject
         pronoun followed by its verb ("she | walks"): joined only to avoid a flash shorter than
         MIN_FLASH frames;
  none = everything else;
- a function word that opens a phrase glues to the next word ("into the", "at 3", "the empty"),
  except a conjunction before a determiner ("so | its vapor": the determiner belongs to its noun);
  subject pronouns don't glue forward (subject | verb). Fixed pair: "You see,";
- a word that would flash (< MIN_FRAMES) joins its neighbour across a "none" break: first the
  previous chunk ("cold night"), else the next word; max 3 words;
- text = the script spelling and punctuation; time = when the first word starts.
"""
import argparse
import json
import re
import sys
from pathlib import Path

MIN_FRAMES = 5  # a chunk shorter than this flashes: join it with a neighbour across a "none" break
MIN_FLASH = 3  # shorter than this is never allowed: joined even across a soft break
MAX_CHARS = 13  # a two-word chunk must stay short (reference median box ~22 % of the width)
PAUSE_S = 0.15  # a gap this long in the voice is a natural break
PREPOSITIONS = set("at on in of to for by with from into onto as over under through about after before until like near".split())
CONJUNCTIONS = set("and but or so if then than because when while".split())
DETERMINERS = set("a an the this that these those my your his her its our their no".split())
SUBJECTS = set("i you he she it we they".split())
VERB_GLUE = set("is was are were be been am not".split())  # "is cold", "not yet"
GLUE_FWD = PREPOSITIONS | CONJUNCTIONS | DETERMINERS | VERB_GLUE
PHRASE_START = PREPOSITIONS | CONJUNCTIONS | DETERMINERS
FUNCTION = GLUE_FWD | SUBJECTS | {"one"}
FIXED_PAIRS = {("you", "see")}


def ends_phrase(token):
    return bool(re.search(r"[.!?,;:—–]$|[.!?][\"”’']$", token))


def bare(token):
    return re.sub(r"[^a-z0-9']", "", token.lower())


def break_level(words, j):
    """Break between word j and j+1: 'hard', 'soft' or 'none'."""
    if ends_phrase(words[j]["w"]):
        return "hard"
    cur, nxt = bare(words[j]["w"]), bare(words[j + 1]["w"])
    if words[j + 1]["start"] - words[j]["end"] >= PAUSE_S:
        return "soft"
    if cur not in FUNCTION and nxt in PHRASE_START:
        return "soft"  # "night | into", "cold | the"
    if cur in SUBJECTS and (cur, nxt) not in FIXED_PAIRS:
        return "soft"  # subject | verb
    return "none"


def glues_forward(words, j):
    cur, nxt = bare(words[j]["w"]), bare(words[j + 1]["w"])
    if (cur, nxt) in FIXED_PAIRS:
        return True
    if cur not in GLUE_FWD or words[j + 1]["start"] - words[j]["end"] >= PAUSE_S:
        return False
    return not (cur in CONJUNCTIONS and nxt in DETERMINERS)  # "so | its vapor"


def chunk(words, fps=30):
    n = len(words)
    starts = [round(w["start"] * fps) for w in words]
    level = [break_level(words, j) for j in range(n - 1)] + ["hard"]
    # 1. groups: one word, or a phrase-opening function word + the next word
    groups, i = [], 0
    while i < n:
        g = [i]
        if i + 1 < n and level[i] != "hard" and glues_forward(words, i)                 and len(words[i]["w"]) + 1 + len(words[i + 1]["w"]) <= MAX_CHARS:
            g.append(i + 1)
        groups.append(g)
        i = g[-1] + 1

    # 2. flashes: join a too-short group with a neighbour, best break first
    def dur(k):
        end = starts[groups[k + 1][0]] if k + 1 < len(groups) else starts[groups[k][-1]] + MIN_FRAMES
        return end - starts[groups[k][0]]

    changed = True
    while changed:
        changed = False
        for k in range(len(groups)):
            if dur(k) >= MIN_FRAMES:
                continue
            back = k > 0 and level[groups[k - 1][-1]] == "none" and len(groups[k - 1]) + len(groups[k]) <= 3
            fwd = k + 1 < len(groups) and level[groups[k][-1]] == "none" and len(groups[k]) + len(groups[k + 1]) <= 3
            if not (back or fwd) and dur(k) < MIN_FLASH:
                fwd = k + 1 < len(groups) and level[groups[k][-1]] != "hard"
                back = not fwd and k > 0 and level[groups[k - 1][-1]] != "hard"
            if back:
                groups[k - 1] += groups.pop(k)
            elif fwd:
                groups[k] += groups.pop(k + 1)
            else:
                continue
            changed = True
            break
    out = [{"text": " ".join(words[i]["w"] for i in g), "start": starts[g[0]]} for g in groups]
    # two chunks on the same frame can't both be seen: merge the second into the first
    merged = []
    for c in out:
        if merged and c["start"] <= merged[-1]["start"]:
            merged[-1]["text"] += " " + c["text"]
        else:
            merged.append(c)
    if merged:
        merged[0]["start"] = 0  # captions are always on screen, from frame 0
    return merged


def stats(chunks):
    sizes = [len(c["text"].split()) for c in chunks]
    n = len(sizes) or 1
    return {k: round(sum(1 for s in sizes if (s == k if k < 4 else s >= 4)) / n, 3) for k in (1, 2, 3, 4)}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir", nargs="?")
    ap.add_argument("--words-json")
    ap.add_argument("--out")
    ap.add_argument("--fps", type=int, default=30)
    a = ap.parse_args()
    if a.video_dir:
        vdir = Path(a.video_dir)
        src, dst = vdir / "audio" / "words.json", vdir / "captions.json"
    else:
        src, dst = Path(a.words_json), Path(a.out)
    words = json.loads(src.read_text(encoding="utf-8"))["words"]
    chunks = chunk(words, a.fps)
    dst.write_text(json.dumps(chunks, indent=1, ensure_ascii=False), encoding="utf-8")
    s = stats(chunks)
    print(f"{len(chunks)} chunks from {len(words)} words → {dst}")
    print(f"words per chunk: 1 = {s[1]:.0%} · 2 = {s[2]:.0%} · 3 = {s[3]:.0%} · 4+ = {s[4]:.0%} "
          f"(reference 67 % / 28 % / 4 % / 0 %)")
    print(" | ".join(c["text"] for c in chunks))


if __name__ == "__main__":
    main()
