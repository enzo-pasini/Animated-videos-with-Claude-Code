"""Print a markdown table joining speech, beat and visual numbers per video.

Usage: python -I tools/per_video_table.py <references_dir>
"""
import json
import sys
from pathlib import Path


def main(ref):
    a = Path(ref) / "analysis"
    speech = {r["id"]: r for r in json.loads((a / "speech_stats.json").read_text())}
    beats = json.loads((a / "beat_timing.json").read_text())
    print("| # | Title | Dur s | WPS | Hook ends s | Turn % | Twist % | Ending | Shots | Changes/min | Dissolve/hard |")
    print("|---|---|---|---|---|---|---|---|---|---|---|")
    for n, b in enumerate(beats, 1):
        v = json.loads((a / "visual" / f"{b['id']}.json").read_text())
        s = speech[b["id"]]
        tr = v["transitions"]
        print(f"| {n} | {b['title']} | {v['duration']:.0f} | {s['wps_total']} | {b['hook_sentence_end_s']:.1f} | "
              f"{b['turn_pct']:.0f} | {b['twist_pct']:.0f} | {b['ending']} | {v['n_shots']} | {v['cuts_per_min']} | "
              f"{tr['dissolve']}/{tr['hard_cut']} |")


if __name__ == "__main__":
    main(sys.argv[1])
