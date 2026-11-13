"""Find the timestamp of each hand-labelled story beat and count discourse markers.

Usage: python -I tools/beat_timing.py <references_dir>

Reads  <references>/analysis/beats.json, <references>/transcripts/<id>.json
Writes <references>/analysis/beat_timing.json
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

MARKERS = ["you see", "then", "so", "but", "yet", "imagine", "wait", "well", "picture",
           "until", "the next morning", "except", "instead", "now"]


def norm(text):
    return re.sub(r"[^a-z0-9' ]", " ", text.lower().replace("’", "'")).split()


def clean_words(words):
    out = []
    for w in words:
        if w["w"].startswith("[") or w["w"] == ">>":
            continue
        for tok in norm(w["w"]):
            out.append((tok, w["start"]))
    return out


def find(tokens, phrase):
    p = norm(phrase)
    toks = [t for t, _ in tokens]
    for i in range(len(toks) - len(p) + 1):
        if toks[i:i + len(p)] == p:
            return tokens[i][1]
    raise ValueError(f"phrase not found: {phrase!r}")


def first_sentence_end(doc):
    for w in doc["words"]:
        if re.search(r"[.?!][\"”]?$", w["w"]):
            return w["end"]
    return None


def main(ref):
    ref = Path(ref)
    spec = json.loads((ref / "analysis" / "beats.json").read_text(encoding="utf-8"))
    rows = []
    for v in spec["videos"]:
        doc = json.loads((ref / "transcripts" / f"{v['id']}.json").read_text(encoding="utf-8"))
        dur = doc["duration"]
        toks = clean_words(doc["words"])
        text = " ".join(t for t, _ in toks)
        row = {"id": v["id"], "title": doc["title"], "duration": dur, "format": v["format"],
               "pov": v["pov"], "hook_type": v["hook_type"], "ending": v["ending"],
               "hook_sentence_end_s": first_sentence_end(doc),
               "hook_words": len(norm(doc["lines"][0]["text"])) if doc["lines"] else None}
        for beat, phrase in v["beats"].items():
            if phrase is None:
                row[beat + "_s"] = row[beat + "_pct"] = None
                continue
            t = find(toks, phrase)
            row[beat + "_s"] = round(t, 2)
            row[beat + "_pct"] = round(100 * t / dur, 1)
        row["markers"] = {m: len(re.findall(r"\b" + m + r"\b", text)) for m in MARKERS}
        row["questions"] = sum(w["w"].endswith("?") or w["w"].endswith("?\"") for w in doc["words"])
        row["quotes_dialogue"] = sum(w["w"].startswith("\"") for w in doc["words"])
        row["numbers"] = sum(bool(re.search(r"\d", w["w"])) for w in doc["words"])
        rows.append(row)
    (ref / "analysis" / "beat_timing.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")

    def summ(key):
        v = [r[key] for r in rows if r.get(key) is not None]
        return f"{key:22s} median {np.median(v):6.1f}  p25 {np.percentile(v, 25):6.1f}  p75 {np.percentile(v, 75):6.1f}  (n={len(v)})"
    for k in ["hook_sentence_end_s", "escalation_s", "turn_pct", "twist_pct", "explain_pct",
              "questions", "quotes_dialogue", "numbers"]:
        print(summ(k))
    for m in MARKERS:
        c = [r["markers"][m] for r in rows]
        print(f"marker {m!r:18s} total {sum(c):3d}  videos using it {sum(1 for x in c if x)}/20")
    for k in ["format", "pov", "hook_type", "ending"]:
        vals = [r[k] for r in rows]
        print(k, {x: vals.count(x) for x in sorted(set(vals))})


if __name__ == "__main__":
    main(sys.argv[1])
