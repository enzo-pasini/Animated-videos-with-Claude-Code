"""Aggregate style_probe.py results across videos.

Usage: python -I tools/summarize_style.py <references_dir>
Writes <references>/analysis/style_summary.json and prints a digest + per-video light table.
"""
import json
import sys
from pathlib import Path

import numpy as np


def pct(v, qs=(10, 50, 90)):
    v = np.asarray([x for x in v if x is not None], float)
    return {f"p{q}": round(float(np.percentile(v, q)), 3) for q in qs} if len(v) else {}


def main(ref):
    ref = Path(ref)
    vids = [json.loads(p.read_text()) for p in sorted((ref / "analysis" / "style").glob("*.json"))]
    caps = [c for v in vids for c in v["caption_samples"] if "none" not in c]
    allcap = [c for v in vids for c in v["caption_samples"]]
    shots = [s for v in vids for s in v["shots"]]
    words = [c["words"] for c in caps]
    summary = {
        "caption_coverage": round(len(caps) / len(allcap), 3),
        "caption_x_height_px": pct([c["x_height_px"] for c in caps]),
        "caption_ascender_px": pct([c["ascender_px"] for c in caps]),
        "caption_box_h_px": pct([c["box_h_px"] for c in caps]),
        "caption_box_w_px": pct([c["box_w_px"] for c in caps]),
        "caption_center_y": pct([c["cy"] for c in caps]),
        "caption_center_x": pct([c["cx"] for c in caps]),
        "caption_words_share": {str(k): round(words.count(k) / len(words), 3) for k in range(1, 5)},
        "caption_outline_px": {s: pct([c["outline"][s] for c in caps]) for s in ("up", "down", "left", "right")},
        "caption_soft_px": {s: pct([c["soft"][s] for c in caps if c["soft"][s]]) for s in ("up", "down", "left", "right")},
        "blur_sigma_sharp_px": pct([s["blur"]["sigma_sharp_px"] for s in shots if s["blur"]]),
        "blur_sigma_soft_px": pct([s["blur"]["sigma_soft_px"] for s in shots if s["blur"]]),
        "blur_ratio": pct([s["blur"]["ratio"] for s in shots if s["blur"]]),
        "line_stroke_px_by_video": {v["id"]: v["lines"]["stroke_px"] for v in vids},
        "light_time_share": {k: round(float(np.mean([v["light"]["time_share"][k] for v in vids])), 3)
                             for k in ("warm", "cool", "mixed")},
        "videos_with_warm_and_cool": sum(v["light"]["has_both"] for v in vids),
        "warm_cool_switches": pct([v["light"]["warm_cool_switches"] for v in vids]),
        "lab_b_range": pct([v["light"]["lab_b_range"] for v in vids]),
    }
    # does the light flip near the story turn? (beat times from beat_timing.json)
    beats = {b["id"]: b for b in json.loads((ref / "analysis" / "beat_timing.json").read_text())}
    before, after, near_turn, near_rand = [], [], 0, []
    rng = np.random.default_rng(0)
    for v in vids:
        turn = beats[v["id"]]["turn_s"]
        labelled = [(s["t"], s["light"]["kind"]) for s in v["shots"] if s["light"]["kind"] != "mixed"]
        flips = [b[0] for a, b in zip(labelled, labelled[1:]) if a[1] != b[1]]
        for t, k in labelled:
            (before if t < turn else after).append(k == "cool")
        near_turn += any(abs(f - turn) <= 4 for f in flips)
        dur = v["shots"][-1]["t"]
        near_rand.append(np.mean([any(abs(f - r) <= 4 for f in flips) for r in rng.uniform(4, dur - 4, 200)]))
    summary["cool_share_before_turn"] = round(float(np.mean(before)), 3)
    summary["cool_share_after_turn"] = round(float(np.mean(after)), 3)
    summary["videos_with_light_flip_within_4s_of_turn"] = near_turn
    summary["expected_by_chance"] = round(float(np.sum(near_rand)), 1)
    (ref / "analysis" / "style_summary.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")
    for k, v in summary.items():
        print(f"{k}: {json.dumps(v)}")
    print()
    print("| Video | Shots W/C/mixed (time %) | Switches | Sequence (W=warm C=cool -=mixed) |")
    print("|---|---|---|---|")
    for v in vids:
        ts = v["light"]["time_share"]
        print(f"| {v['id']} | {ts['warm']*100:.0f} / {ts['cool']*100:.0f} / {ts['mixed']*100:.0f} | "
              f"{v['light']['warm_cool_switches']} | `{v['light']['sequence']}` |")


if __name__ == "__main__":
    main(sys.argv[1])
