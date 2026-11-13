"""Aggregate per-video visual measurements into channel-level numbers.

Usage: python -I tools/summarize_visual.py <references_dir>

Reads  <references>/analysis/visual/*.json, <references>/analysis/beat_timing.json
Writes <references>/analysis/visual_summary.json and prints a readable digest.
"""
import json
import sys
from collections import Counter
from pathlib import Path

import cv2
import numpy as np


def pct(v, qs=(10, 25, 50, 75, 90)):
    v = np.asarray([x for x in v if x is not None], float)
    return {f"p{q}": round(float(np.percentile(v, q)), 3) for q in qs} if len(v) else {}


def lab_to_hex(lab):
    bgr = cv2.cvtColor(np.uint8([[lab]]), cv2.COLOR_LAB2BGR)[0, 0]
    return "#{:02x}{:02x}{:02x}".format(bgr[2], bgr[1], bgr[0])


def main(ref):
    ref = Path(ref)
    vids = [json.loads(p.read_text()) for p in sorted((ref / "analysis" / "visual").glob("*.json"))]
    beats_path = ref / "analysis" / "beat_timing.json"
    beats = {b["id"]: b for b in json.loads(beats_path.read_text())} if beats_path.exists() else {}
    shots = [s for v in vids for s in v["shots"]]
    trans = [t for v in vids for t in v["transitions"]["list"]]

    # time-weighted share of each camera move (a shot can carry several labels)
    move_time = Counter()
    for s in shots:
        for m in s["move"].split("+"):
            move_time[m] += s["dur"]
    total_t = sum(s["dur"] for s in shots)

    # shot length per story section (using the hand-labelled beat times)
    section_len = {"hook": [], "escalation": [], "after_turn": []}
    section_tone = {k: {"luma": [], "sat": [], "contrast": []} for k in section_len}
    for v in vids:
        b = beats.get(v["id"])
        if not b:
            continue
        for s in v["shots"]:
            mid = (s["start"] + s["end"]) / 2
            sec = ("hook" if mid < (b["escalation_s"] or 0) else
                   "escalation" if mid < (b["turn_s"] or 1e9) else "after_turn")
            section_len[sec].append(s["dur"])
            for k in section_tone[sec]:
                section_tone[sec][k].append(s[k])

    # channel palette: k-means over every shot's palette entry, weighted by share * duration
    labs, weights = [], []
    for s in shots:
        for c in s["palette"]:
            labs.append(c["lab"])
            weights.append(c["share"] * s["dur"])
    labs = np.float32(labs)
    reps = np.repeat(labs, np.maximum(1, np.round(np.array(weights) * 20).astype(int)), axis=0)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.2)
    _, lab_idx, centers = cv2.kmeans(reps, 10, None, crit, 5, cv2.KMEANS_PP_CENTERS)
    cnt = np.bincount(lab_idx.ravel(), minlength=10)
    channel_palette = [{"hex": lab_to_hex(centers[i]), "share": round(float(cnt[i] / cnt.sum()), 3)}
                       for i in np.argsort(-cnt)]

    summary = {
        "n_videos": len(vids),
        "resolution_fps": Counter(f"{v['width']}x{v['height']}@{v['fps']}" for v in vids),
        "duration_s": pct([v["duration"] for v in vids]),
        "shots_per_video": pct([v["n_shots"] for v in vids]),
        "changes_per_min": pct([v["cuts_per_min"] for v in vids]),
        "shot_len_s": pct([s["dur"] for s in shots]),
        "shot_len_by_section_median_s": {k: round(float(np.median(v)), 2) for k, v in section_len.items() if v},
        "tone_by_section_median": {sec: {k: round(float(np.median(v)), 3) for k, v in d.items() if v}
                                   for sec, d in section_tone.items()},
        "first_change_s": pct([v["first_cut_s"] for v in vids]),
        "transition_kinds": Counter(t["kind"] for t in trans),
        "dissolve_frames": pct([t["frames"] for t in trans if t["kind"] == "dissolve"]),
        "camera_move_time_share": {m: round(t / total_t, 3) for m, t in move_time.most_common()},
        "zoom_pct_per_s": pct([s.get("zoom_pct_per_s") for s in shots if "zoom_pct_per_s" in s]),
        "abs_zoom_pct_per_s": pct([abs(s["zoom_pct_per_s"]) for s in shots if "zoom_pct_per_s" in s]),
        "push_vs_pull": Counter("push-in" if s["zoom_pct_per_s"] > 0 else "pull-out"
                                for s in shots if "zoom_pct_per_s" in s),
        "pan_rate_w_per_s": pct([s.get("pan_rate_w_per_s") for s in shots if "pan_rate_w_per_s" in s]),
        "roll_deg_per_shot": pct([abs(s["roll_deg"]) for s in shots if "roll_deg" in s]),
        "jitter_w": pct([s.get("jitter_w") for s in shots if "jitter_w" in s]),
        "subject_motion_w_per_s": pct([s.get("subject_motion_w_per_s") for s in shots if "subject_motion_w_per_s" in s]),
        "luma_mean": pct([s["luma"] for s in shots]),
        "luma_contrast_std": pct([s["contrast"] for s in shots]),
        "luma_p5": pct([s["p5"] for s in shots]),
        "luma_p95": pct([s["p95"] for s in shots]),
        "saturation": pct([s["sat"] for s in shots]),
        "colorfulness": pct([s["colorful"] for s in shots]),
        "audio_lufs": pct([v["audio"].get("integrated_lufs") for v in vids]),
        "audio_true_peak_dbfs": pct([v["audio"].get("true_peak_dbfs") for v in vids]),
        "channel_palette": channel_palette,
    }
    (ref / "analysis" / "visual_summary.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")
    for k, v in summary.items():
        print(f"{k}: {json.dumps(v)}")


if __name__ == "__main__":
    main(sys.argv[1])
