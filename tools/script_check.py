"""Check a script.md against the script rules of the generate-animated-shorts skill.

Usage (from the project root):
  python -I tools/script_check.py videos/<slug>/script.md [--facts FILE] [--target SECONDS]

Layout and rules: .claude/skills/generate-animated-shorts/references/script_rules.md and
references/formats/<format>.md. The beat windows below mirror the format file: change both together.

Checks: word count (spoken words) vs target x 3.5 +-8 % (D18), hook (result by word 8 = FAIL), beats present / in order / inside
their windows (by word position), "so" and question counts, fact tags vs facts.md, 5-word overlap
with the reference transcripts and our own past scripts, title close to a reference title.
Levels: FAIL blocks A1, WARN = look at it. Exit code 1 if any FAIL.
"""
import argparse
import difflib
import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WPS = 3.5  # D18: target voice pace after the atempo speed-up
COUNT_TOL = 0.08
NGRAM = 5

# Beat windows as fractions of the spoken words. Mirrors references/formats/<format>.md.
FORMATS = {
    "explainer": {
        "required": ["hook", "escalation", "you-see", "reveal", "ending"],
        "order": ["hook", "escalation", "turn", "you-see", "reveal", "ending"],
        "windows": {"turn": (0.49, 0.63), "reveal": (0.72, 0.85)},
        "you_see": {"late": (0.65, 0.80), "early_max_words_after_hook": 12},
        # hook first sentence: the 20 reference hooks have 6-9 words (median 8, all <= 12,
        # references/analysis/beat_timing.json). Longer is allowed when the script needs it: WARN, not FAIL.
        "hook_warn_words": 12,
        "ending_max_words": 25,
        "ending_max_sentences": 2,
    },
}
HOOK_WPS = 4.0  # the hook is spoken a little faster (RULEBOOK §3)
RESULT_MAX_WORDS = 8  # the strange result (result: on the format line) must end by word 8 (≈ 2 s). FAIL.
# hooks that start by placing the scene or the character instead of the strange result (WARN, check by eye).
# Kept narrow on purpose: the real guard is the result-by-word-8 FAIL; this only names the usual setup openers.
_TIME = r"(day|night|morning|evening|afternoon|winter|summer|spring|autumn|fall|week|weekend|month|year)"
SCENE_OPENER = re.compile(
    r"(?i)^("
    # a time setting: "Every winter", "Last night", "One cold morning", "On a cold night", "During the summer"
    rf"(every|each|last|one|that|next|on (a|an|the|one)|during (a|an|the)) (\w+ ){{0,2}}{_TIME}"
    # a place setting: "In a small town", "In the old kingdom"
    r"|in (a|an|the) (\w+ )?(town|village|city|kingdom|land|country)"
    # story openers
    r"|once upon|meet|imagine|picture|it was|there (was|is|are|were|once)|years ago|long ago|a long time ago"
    r"|back in|after (a|an|the)|before (a|an|the)|let me tell"
    r")\b"
    # "<Name> walks into…", "She opens the door…": the character doing a setup action. Only movement/routine
    # verbs: a strange act ("He poured cooking oil into the sea", a reference hook) must not match.
    r"|^[A-Z][a-z]+ (walks|walked|goes|went into|steps|stepped|lives|lived|works|worked|wakes|woke|comes|came|"
    r"enters|entered|sits|sat|stands|stood|opens|opened|arrives|arrived)\b")
ALL_TAGS = {"hook", "escalation", "turn", "you-see", "reveal", "ending"}

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
# "one" is left out: "one night", "no one" are rarely statistics (the digit 1 still counts)
NUMBER_WORDS = set(ONES[2:] + TENS[2:] + ["hundred", "thousand", "million", "billion", "trillion", "percent", "half",
                                          "dozen", "twice", "thrice", "hundreds", "thousands", "millions", "billions"])


def int_words(n):
    """Spoken words of a non-negative integer (years read as two pairs: 1850 -> eighteen fifty)."""
    if n < 20:
        return [ONES[n]]
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if 1100 <= n <= 2099 and n % 100 and not (2000 <= n <= 2009):
        return int_words(n // 100) + int_words(n % 100)
    if n < 1000:
        return int_words(n // 100) + ["hundred"] + (int_words(n % 100) if n % 100 else [])
    for size, name in ((10**9, "billion"), (10**6, "million"), (1000, "thousand")):
        if n >= size:
            rest = n % size
            return int_words(n // size) + [name] + (int_words(rest) if rest else [])
    return [str(n)]


def spoken_count(token):
    """How many words a written token takes when spoken."""
    t = token.strip(".,!?;:\"'()“”‘’—–-")
    if not t:
        return 0
    if re.fullmatch(r"(?i)(a\.?m\.?|p\.?m\.?)", t):
        return 2
    m = re.fullmatch(r"\$?(\d[\d,]*)(\.\d+)?(%|s|st|nd|rd|th|k)?", t)
    if m:
        n = int(m.group(1).replace(",", ""))
        c = len(int_words(n))
        if m.group(2):
            c += 1 + len(m.group(2)) - 1  # "point" + digits
        if m.group(3) == "%":
            c += 1
        if token.startswith("$"):
            c += 1
        return c
    return 1


# ---------------------------------------------------------------- parsing
def parse_script(path):
    text = Path(path).read_text(encoding="utf-8")
    title = next((l[2:].strip() for l in text.splitlines() if l.startswith("# ")), "")
    meta = {}
    for l in text.splitlines():
        if l.startswith("format:"):
            for part in l.split("·"):
                if ":" in part:
                    k, v = part.split(":", 1)
                    meta[k.strip()] = v.strip()
    m = re.search(r"^## Script\s*$(.*?)(?=^## |\Z)", text, re.M | re.S)
    if not m:
        raise SystemExit("script.md has no '## Script' section")
    beats = []  # (tag, line)
    tag = None
    bad_tags = []
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line:
            continue
        t = re.match(r"^\[([a-z-]+)\]\s*", line)
        if t and t.group(1) in ALL_TAGS:
            tag = t.group(1)
            line = line[t.end():]
        elif t and not re.match(r"^\[(F\d+|story)\]", line):
            bad_tags.append(t.group(1))
        beats.append((tag, line))
    return title, meta, beats, bad_tags


def parse_facts(path):
    facts = {}
    if not path.exists():
        return None
    cur = None
    for l in path.read_text(encoding="utf-8").splitlines():
        h = re.match(r"^## (F\d+)\b", l)
        if h:
            cur = h.group(1)
            facts[cur] = "missing-status"
        s = re.match(r"^status:\s*(\w+)", l.strip())
        if s and cur:
            facts[cur] = s.group(1).lower()
    return facts


def words_of(text):
    """Plain lowercase words (for n-grams): numbers kept as written, punctuation dropped."""
    text = text.lower().replace("’", "'")
    return re.findall(r"[a-z0-9']+", text)


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


# ---------------------------------------------------------------- main
def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--facts")
    ap.add_argument("--target", type=float)
    a = ap.parse_args()

    script_path = Path(a.script).resolve()
    title, meta, beats, bad_tags = parse_script(script_path)
    fmt_name = meta.get("format", "explainer")
    if fmt_name not in FORMATS:
        raise SystemExit(f"unknown format '{fmt_name}' (known: {', '.join(FORMATS)})")
    F = FORMATS[fmt_name]
    target = a.target or float(re.sub(r"[^\d.]", "", meta.get("target", "0")) or 0)
    if not target:
        raise SystemExit("no target length: add 'target: 45 s' to the format line or pass --target")
    facts = parse_facts(Path(a.facts) if a.facts else script_path.parent / "facts.md")

    rows = []  # (level, check, detail)

    def add(ok, level, check, detail):
        rows.append(("PASS" if ok else level, check, detail))

    # spoken words with their beat
    tokens = []  # (spoken_index, tag, raw_token)
    n = 0
    for tag, line in beats:
        clean = re.sub(r"\[(F\d+|story)\]", "", line)
        for tok in clean.split():
            c = spoken_count(tok)
            if c:
                tokens.append((n, tag, tok))
                n += c
    total = n
    full_text = " ".join(re.sub(r"\[(F\d+|story)\]", "", l) for _, l in beats)

    # 1. word count
    want = target * WPS
    lo, hi = want * (1 - COUNT_TOL), want * (1 + COUNT_TOL)
    add(lo <= total <= hi, "FAIL", "word count (spoken)",
        f"{total} words for {target:g} s → {total / WPS:.1f} s at {WPS} w/s (target {lo:.0f}–{hi:.0f})")

    # 2. tags
    add(not bad_tags, "FAIL", "beat tags valid", f"unknown: {bad_tags}" if bad_tags else "ok")
    add(beats and beats[0][0] == "hook", "FAIL", "script starts with [hook]", beats[0][0] if beats else "empty")
    starts = {}
    for idx, tag, _ in tokens:
        if tag not in starts:
            starts[tag] = idx
    for req in F["required"]:
        add(req in starts, "FAIL", f"[{req}] present", "ok" if req in starts else "missing")
    present = [t for t in F["order"] if t in starts]
    by_pos = sorted(present, key=lambda t: starts[t])
    you_see_early = "you-see" in starts and "escalation" in starts and starts["you-see"] < starts.get("turn", 10**9) \
        and starts["you-see"] < total * 0.4
    # an early [you-see] sits inside the escalation, so it is left out of the order check
    seq = [t for t in by_pos if not (you_see_early and t == "you-see")]
    want_seq = [t for t in present if not (you_see_early and t == "you-see")]
    add(seq == want_seq, "FAIL", "beats in order", " → ".join(by_pos))

    # 3. hook
    hook_text = " ".join(re.sub(r"\[(F\d+|story)\]", "", l) for t, l in beats if t == "hook")
    first = sentences(hook_text)[0] if hook_text else ""
    first_words = sum(spoken_count(t) for t in first.split())
    add(first_words <= F["hook_warn_words"], "WARN", "hook first sentence length",
        f"{first_words} words (reference 6–9, median 8; over {F['hook_warn_words']} = check it needs them): “{first}”")
    # in the hook, "one" counts as a concrete detail ("one swallow", "one lantern"), except "no one" / "the one"
    hw = words_of(first)
    one_detail = any(w == "one" and (k == 0 or hw[k - 1] not in ("no", "the", "any", "every", "some")) for k, w in enumerate(hw))
    has_num = bool(re.search(r"\d", first)) or any(w in NUMBER_WORDS for w in hw) or one_detail
    add(has_num, "WARN", "hook has a concrete detail", "number found" if has_num else
        "no number: check by eye that it has an odd concrete object")
    add(not re.match(r"(?i)did you know", first), "FAIL", "hook isn't 'Did you know'", "ok")
    # hook: the strange result first (explainer.md §1b). result: on the format line = the words where it lands
    opener = SCENE_OPENER.match(first.strip())
    add(not opener, "WARN", "hook doesn't open by setting the scene",
        f"starts with “{opener.group(0)}”: lead with the strange result, place the scene after it" if opener else "ok")
    res = meta.get("result", "").strip()
    check = f"strange result in the first {RESULT_MAX_WORDS} words"
    if not res:
        add(False, "FAIL", check, "add 'result: <words>' to the format line (the words where the strange result lands)")
    else:
        want = words_of(res)
        spoken = [(i, words_of(tok)) for i, _, tok in tokens]
        flat = [(i, w) for i, ws in spoken for w in ws]
        at = next((k for k in range(len(flat)) if [w for _, w in flat[k:k + len(want)]] == want), None)
        if at is None:
            add(False, "FAIL", check, f"“{res}” not found in the script")
        else:
            last = flat[at + len(want) - 1][0] + 1  # spoken words up to the end of the result
            add(last <= RESULT_MAX_WORDS, "FAIL", check,
                f"“{res}” ends at word {last} ≈ {last / HOOK_WPS:.1f} s (max word {RESULT_MAX_WORDS} ≈ "
                f"{RESULT_MAX_WORDS / HOOK_WPS:g} s)")

    # 4. beat windows
    for tag, (wlo, whi) in F["windows"].items():
        if tag in starts:
            f = starts[tag] / total
            add(wlo <= f <= whi, "WARN", f"[{tag}] position", f"{f:.0%} (window {wlo:.0%}–{whi:.0%})")
    if "you-see" in starts:
        f = starts["you-see"] / total
        hook_end = starts.get("escalation", 0)
        if you_see_early:
            ok = starts["you-see"] - hook_end <= F["you_see"]["early_max_words_after_hook"] or starts["you-see"] <= hook_end
            add(ok, "WARN", "[you-see] position (early)", f"word {starts['you-see']} ({f:.0%})")
        else:
            wlo, whi = F["you_see"]["late"]
            add(wlo <= f <= whi, "WARN", "[you-see] position (late)", f"{f:.0%} (window {wlo:.0%}–{whi:.0%})")
        ys_line = next((l for t, l in beats if t == "you-see"), "")
        add(ys_line.lower().startswith("you see"), "WARN", "[you-see] starts with “You see,”", ys_line[:40])
    end_text = " ".join(re.sub(r"\[(F\d+|story)\]", "", l) for t, l in beats if t == "ending")
    end_words = sum(spoken_count(t) for t in end_text.split())
    add(end_words <= F["ending_max_words"] and len(sentences(end_text)) <= F["ending_max_sentences"], "WARN",
        "ending short", f"{end_words} words, {len(sentences(end_text))} sentences (max {F['ending_max_words']}, "
                        f"{F['ending_max_sentences']})")

    # 5. wording
    ws = words_of(full_text)
    so = ws.count("so")
    add(so >= 2, "WARN", "“so” at least twice", f"{so}")
    q = full_text.count("?")
    add(q <= 1, "WARN", "at most one question", f"{q}")

    # 6. facts
    if facts is None:
        add(False, "FAIL", "facts.md found", "missing (pass --facts or put facts.md next to script.md)")
    else:
        untagged = []
        used = set()
        for _, line in beats:
            # a tag written after the period belongs to the sentence before it: "… ending. [story]"
            line = re.sub(r"([.!?])((?:\s*\[(?:F\d+|story)\])+)", r"\2\1", line)
            for s in sentences(line):
                tags = re.findall(r"\[(F\d+)\]", s)
                used.update(tags)
                story = "[story]" in s  # invented detail of the fiction: needs no source
                plain = re.sub(r"\[(F\d+|story)\]", "", s)
                if (re.search(r"\d", plain) or any(w in NUMBER_WORDS for w in words_of(plain))) and not tags and not story:
                    untagged.append(plain.strip())
        # a tag at the end of a line covers its last sentence only; sentences split across lines are rare
        add(not untagged, "FAIL", "number sentences have a fact tag or [story]",
            "ok" if not untagged else "; ".join(f"“{u[:60]}”" for u in untagged))
        missing = sorted(t for t in used if t not in facts)
        add(not missing, "FAIL", "fact tags exist in facts.md", "ok" if not missing else ", ".join(missing))
        cut = sorted(t for t in used if facts.get(t) == "cut")
        add(not cut, "FAIL", "no cut facts used", "ok" if not cut else ", ".join(cut))
        soft = sorted(t for t in used if facts.get(t) == "softened")
        nostat = sorted(t for t in used if facts.get(t) not in ("confirmed", "softened", "cut"))
        add(not nostat, "FAIL", "used facts have a status", "ok" if not nostat else ", ".join(nostat))
        if soft:
            rows.append(("INFO", "softened facts (show at A1)", ", ".join(soft)))

    # 7. originality: 5-grams vs reference transcripts and our past scripts
    mine = words_of(full_text)
    my_grams = {tuple(mine[i:i + NGRAM]) for i in range(len(mine) - NGRAM + 1)}
    hits = []
    for f in sorted(glob.glob(str(ROOT / "references/transcripts/*.json"))):
        d = json.loads(Path(f).read_text(encoding="utf-8"))
        ref = words_of(" ".join(w["w"] for w in d["words"]))
        for i in range(len(ref) - NGRAM + 1):
            g = tuple(ref[i:i + NGRAM])
            if g in my_grams:
                hits.append((d.get("title", Path(f).stem), " ".join(g)))
    for f in sorted(glob.glob(str(ROOT / "videos/*/script.md"))):
        if Path(f).resolve() == script_path:
            continue
        _, _, other, _ = parse_script(f)
        ref = words_of(" ".join(re.sub(r"\[(F\d+|story)\]", "", l) for _, l in other))
        for i in range(len(ref) - NGRAM + 1):
            g = tuple(ref[i:i + NGRAM])
            if g in my_grams:
                hits.append((f"our {Path(f).parent.name}", " ".join(g)))
    uniq = sorted(set(hits))
    add(not uniq, "FAIL", f"no {NGRAM}-word overlap with reference / past scripts",
        "ok" if not uniq else "; ".join(f"“{g}” ({src})" for src, g in uniq[:8]))

    # 8. title vs reference titles
    titles = []
    tsv = ROOT / "references/meta/shorts_list.tsv"
    if tsv.exists():
        for l in tsv.read_text(encoding="utf-8-sig").splitlines():
            parts = l.split("\t")
            if len(parts) >= 3:
                titles.append(parts[2])
    best = max(titles, key=lambda t: difflib.SequenceMatcher(None, t.lower(), title.lower()).ratio(), default="")
    r = difflib.SequenceMatcher(None, best.lower(), title.lower()).ratio() if best else 0
    add(r < 0.6, "FAIL", "title not close to a reference title", f"closest: “{best}” (similarity {r:.2f}, max 0.60)")

    # report
    order = {"FAIL": 0, "WARN": 1, "INFO": 2, "PASS": 3}
    icon = {"FAIL": "❌", "WARN": "⚠️", "INFO": "ℹ️", "PASS": "✅"}
    fails = sum(1 for r_ in rows if r_[0] == "FAIL")
    warns = sum(1 for r_ in rows if r_[0] == "WARN")
    print(f"# Script check — {title}")
    print(f"format {fmt_name} · target {target:g} s · {total} spoken words · ≈ {total / WPS:.1f} s")
    print(f"**Verdict: {'FAIL' if fails else ('PASS with warnings' if warns else 'PASS')}** — {fails} fail · {warns} warn\n")
    print("| | check | detail |\n|---|---|---|")
    for lvl, check, detail in sorted(rows, key=lambda r_: order[r_[0]]):
        print(f"| {icon[lvl]} {lvl} | {check} | {detail} |")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
