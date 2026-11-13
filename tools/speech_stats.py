"""Speech pace statistics from word-level transcripts.

Usage: python -I tools/speech_stats.py <references_dir>

Reads  <references>/transcripts/<id>.json
Writes <references>/analysis/speech_stats.json
"""
import json
import sys
from pathlib import Path

import numpy as np

# Auto-captions only give word START times, so a "pause" is a start-to-start gap
# much longer than this video's typical gap.
PAUSE_X_MEDIAN = 2.5


def wps_window(words, t0, t1):
    n = sum(1 for w in words if t0 <= w["start"] < t1)
    return round(n / (t1 - t0), 2) if t1 > t0 else None


def stats(doc):
    words, dur = doc["words"], doc["duration"] or 0
    if not words:
        return {"id": doc["id"], "words": 0}
    first, last = words[0]["start"], words[-1]["end"]
    gaps = np.array([b["start"] - a["start"] for a, b in zip(words, words[1:])])
    med = float(np.median(gaps)) if len(gaps) else 0
    pauses = [round(float(g), 2) for g in gaps if g >= PAUSE_X_MEDIAN * med]
    speech_span = last - first
    return {
        "id": doc["id"], "title": doc["title"], "duration": dur, "words": len(words),
        "first_word_s": round(first, 2), "last_word_end_s": round(last, 2),
        "tail_after_speech_s": round(dur - last, 2),
        "wps_total": round(len(words) / dur, 2) if dur else None,
        "wps_speech": round(len(words) / speech_span, 2) if speech_span else None,
        "wpm_speech": round(len(words) / speech_span * 60) if speech_span else None,
        "wps_first_3s": wps_window(words, 0, 3),
        "wps_middle": wps_window(words, 3, max(3.01, dur - 5)),
        "wps_last_5s": wps_window(words, max(0, dur - 5), dur),
        "n_pauses": len(pauses), "longest_pause_s": max(pauses) if pauses else 0,
        "median_word_gap_s": round(float(np.median(gaps)), 3) if len(gaps) else None,
    }


def main(ref):
    ref = Path(ref)
    rows = [stats(json.loads(p.read_text(encoding="utf-8")))
            for p in sorted((ref / "transcripts").glob("*.json"))]
    out = ref / "analysis"
    out.mkdir(parents=True, exist_ok=True)
    (out / "speech_stats.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    keys = ["wps_total", "wps_speech", "wps_first_3s", "wps_middle", "wps_last_5s",
            "first_word_s", "tail_after_speech_s", "words", "duration", "n_pauses"]
    for k in keys:
        v = [r[k] for r in rows if r.get(k) is not None]
        if v:
            print(f"{k:22s} median {np.median(v):7.2f}  min {min(v):7.2f}  max {max(v):7.2f}")


if __name__ == "__main__":
    main(sys.argv[1])
