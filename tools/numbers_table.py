"""Number table for style-test versions vs the reference range (p25-p75).

Usage: python -I tools/numbers_table.py out/v1/analysis_run out/v2/analysis_run [...] --md out/v2/numbers.md
Reads <run>/analysis/visual/style_test.json and <run>/analysis/style/style_test.json
(written by visual_analysis.py and style_probe.py) and the reference files in references/analysis.
"""
import glob
import json
import sys
from pathlib import Path

import numpy as np

REF = Path("references/analysis")


def ref_ranges():
    vis = {Path(f).stem: json.loads(Path(f).read_text()) for f in glob.glob(str(REF / "visual/*.json"))}
    shots = {"cool": [], "all": []}
    for f in glob.glob(str(REF / "style/*.json")):
        st = json.loads(Path(f).read_text())
        v = vis[Path(f).stem]
        for i, s in enumerate(st["shots"]):
            shots["all"].append(v["shots"][i])
            if s["light"]["kind"] == "cool":
                shots["cool"].append(v["shots"][i])
    rng = {}
    for k in ["luma", "contrast", "p5", "p95", "sat", "colorful"]:
        rng[k] = np.percentile([s[k] for s in shots["cool"]], [25, 75])
    summ = json.loads((REF / "visual_summary.json").read_text())
    rng["zoom"] = (summ["abs_zoom_pct_per_s"]["p25"], summ["abs_zoom_pct_per_s"]["p75"])
    rng["pan"] = (summ["pan_rate_w_per_s"]["p25"], summ["pan_rate_w_per_s"]["p75"])
    rng["roll"] = (summ["roll_deg_per_shot"]["p25"], summ["roll_deg_per_shot"]["p75"])
    return rng


def load(run):
    run = Path(run)
    vis = json.loads((run / "analysis/visual/style_test.json").read_text())
    st = json.loads((run / "analysis/style/style_test.json").read_text())
    return vis, st


def mark(v, lo, hi):
    return "✅" if lo <= v <= hi else ("⬇️" if v < lo else "⬆️")


def main():
    args = sys.argv[1:]
    md = None
    if "--md" in args:
        i = args.index("--md")
        md = args[i + 1]
        args = args[:i] + args[i + 2:]
    rng = ref_ranges()
    out = []
    for run in args:
        vis, st = load(run)
        name = Path(run).parent.name
        out.append(f"\n### {name}: {vis['n_shots']} detected shots, transitions {vis['transitions']['dissolve']} dissolve / "
                   f"{vis['transitions']['hard_cut']} hard (dissolve median {vis['transitions']['dissolve_frames_median']} fr)\n")
        out.append("| start s | dur s | light | luma | contrast | p5 | p95 | sat | colorful | zoom %/s | drift W/s | roll ° | move |")
        out.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        for s, l in zip(vis["shots"], st["shots"]):
            if s["dur"] < 0.4:
                continue
            cells = [f"{s['start']:.2f}", f"{s['dur']:.2f}", l["light"]["kind"]]
            for k in ["luma", "contrast", "p5", "p95", "sat", "colorful"]:
                v = s[k]
                cells.append(f"{v:.2f} {mark(v, *rng[k])}" if k == "sat" else f"{v:.0f} {mark(v, *rng[k])}")
            z = abs(s.get("zoom_pct_per_s", 0.0))
            p = s.get("pan_rate_w_per_s", 0.0)
            r = abs(s.get("roll_deg", 0.0))
            cells += [f"{z:.1f} {mark(z, *rng['zoom'])}", f"{p:.3f} {mark(p, *rng['pan'])}", f"{r:.1f} {mark(r, *rng['roll'])}", s["move"]]
            out.append("| " + " | ".join(cells) + " |")
        c = st.get("captions", {})
        out.append(f"\nCaptions: {json.dumps({k: c.get(k) for k in ['x_height_px', 'cy', 'outline_px', 'soft_shadow_px', 'words_hist'] if k in c})}")
    ref = ["\n### Reference range (p25–p75; tone = cool/night shots, camera = all shots)\n",
           "| luma | contrast | p5 | p95 | sat | colorful | zoom %/s | drift W/s | roll ° |", "|---|---|---|---|---|---|---|---|---|",
           "| " + " | ".join(f"{a:.2f}–{b:.2f}" if k in ("sat", "pan") else f"{a:.0f}–{b:.0f}"
                            for k, (a, b) in [(k, rng[k]) for k in ["luma", "contrast", "p5", "p95", "sat", "colorful", "zoom", "pan", "roll"]]) + " |"]
    text = "\n".join(ref + out)
    if md:
        Path(md).write_text(text, encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
