"""Check a render against the locked style (style_lock/locks.json) and the reference ranges.

Usage (from the project root):
  python -I tools/check_render.py <video.mp4> [--profile episode|styletest] [--out DIR]
                                  [--captions captions.json] [--plan render_props.json] [--reuse]

What it does
1. Format: ffprobe (size, fps, codec, duration).
2. Copies the video to <out>/analysis_run/videos/<id>.mp4 and runs the SAME scripts we used on the
   reference channel: tools/visual_analysis.py and tools/style_probe.py (--reuse skips this if the
   JSONs already exist).
3. Compares every detected shot with the reference p25-p75 range OF ITS LIGHT KIND (cool / warm /
   mixed), computed from references/analysis like tools/numbers_table.py.
4. Captions (size, place, outline, shadow, words per chunk) and, with --captions, sync: every
   caption change must be within +-1 frame of its expected start frame.
   captions.json = [{"text": "Every", "start": 0}, ...]  (start in frames)
5. Audio loudness (ffmpeg ebur128) for the episode profile.
5b. Flicker (tools/flicker.py): patches that flip A->B->A frame to frame = z-fighting (two surfaces on
   the same plane). Any region is a FAIL, with <out>/flicker_<n>.png (the region in red). Added after the
   bridge video, where the user found it twice by eye (FB2, FB4).
6. Writes <out>/check_report.md and <out>/still_sheet.jpg (middle frame of every detected shot, for
   the eye check: numbers alone missed problems in v1/v2).

Levels: FAIL blocks the video, WARN = look at it, ACCEPTED = a WARN listed in
locks.json "accepted_deviations", SKIP = not measured. Exit code 1 if any FAIL.
"""
import argparse
import glob
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "references" / "analysis"
SETS = ROOT / "src" / "world" / "sets"
LOCKS = ROOT / "style_lock" / "locks.json"
PY = sys.executable
TONE = ["luma", "contrast", "p5", "p95", "sat", "colorful"]


# ---------------------------------------------------------------- helpers
class Report:
    def __init__(self, profile, accepted):
        self.rows = []  # (section, item, value, target, level)
        self.profile = profile
        self.accepted = [a for a in accepted if a["profile"] == profile]

    def add(self, section, item, value, target, ok, level, shot_t=None, metric=None):
        status = "PASS" if ok else level.upper()
        if status == "WARN" and shot_t is not None:
            for a in self.accepted:
                if a["metric"] == metric and abs(a["shot_t"] - shot_t) <= 0.15:
                    status = "ACCEPTED"
                    target = f"{target} ({a['why']})"
        self.rows.append((section, item, value, target, status))

    def skip(self, section, item, why):
        self.rows.append((section, item, "—", why, "SKIP"))

    def count(self, status):
        return sum(1 for r in self.rows if r[4] == status)


ICON = {"PASS": "✅", "WARN": "⚠️", "FAIL": "❌", "ACCEPTED": "☑️", "SKIP": "➖"}


def rng_txt(lo, hi, nd=2):
    return f"{lo:.{nd}f}–{hi:.{nd}f}"


def inside(v, lo, hi):
    return lo <= v <= hi


def ref_ranges():
    """p25-p75 per light kind (cool / warm / mixed) of every reference shot, plus "day": the 95 day
    outdoor shots marked by eye in references/analysis/day_shots.json (2026-11-07, PLAN D12). A day shot
    also stays in its cool / warm / mixed group, like before."""
    vis = {Path(f).stem: json.loads(Path(f).read_text()) for f in glob.glob(str(REF / "visual/*.json"))}
    by_kind = {"cool": [], "warm": [], "mixed": []}
    for f in glob.glob(str(REF / "style/*.json")):
        st = json.loads(Path(f).read_text())
        v = vis[Path(f).stem]
        for i, s in enumerate(st["shots"]):
            by_kind[s["light"]["kind"]].append(v["shots"][i])
    by_kind["day"] = [vis[d["video"]]["shots"][d["shot"]] for d in json.loads((REF / "day_shots.json").read_text())]
    return {k: {m: np.percentile([s[m] for s in shots], [25, 75]).tolist() for m in TONE} for k, shots in by_kind.items()}


def ffprobe(video):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,codec_name,r_frame_rate", "-show_entries", "format=duration", "-of", "json", str(video)],
        capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return {"width": s["width"], "height": s["height"], "codec": s["codec_name"],
            "fps": float(num) / float(den), "duration": float(d["format"]["duration"])}


def has_audio(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                          "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout
    return bool(out.strip())


def loudness(video):
    """Integrated LUFS and true peak (dBTP) with ffmpeg's EBU R128 meter."""
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-filter_complex",
                          "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summary = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", summary)
    tp = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", summary, re.S)
    return (float(i.group(1)) if i else None, float(tp.group(1)) if tp and tp.group(1) != "-inf" else None)


def run_analysis(video, out, reuse):
    run = out / "analysis_run"
    vid_id = "render"
    vis_json = run / "analysis" / "visual" / f"{vid_id}.json"
    sty_json = run / "analysis" / "style" / f"{vid_id}.json"
    if not (reuse and vis_json.exists() and sty_json.exists()):
        (run / "videos").mkdir(parents=True, exist_ok=True)
        shutil.copyfile(video, run / "videos" / f"{vid_id}.mp4")
        for tool in ("visual_analysis.py", "style_probe.py"):
            print(f"running {tool} …", flush=True)
            subprocess.run([PY, "-I", str(ROOT / "tools" / tool), str(run), "--workers", "1"], check=True,
                           cwd=ROOT, stdout=subprocess.DEVNULL)
    return json.loads(vis_json.read_text()), json.loads(sty_json.read_text())


# ---------------------------------------------------------------- caption sync
def caption_masks(video):
    """Per frame: binary mask of caption glyphs (white pixels next to a black outline) in the caption band."""
    cap = cv2.VideoCapture(str(video))
    masks = []
    kernel = np.ones((9, 9), np.uint8)
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        h = frame.shape[0]
        band = frame[int(h * 0.703) - 70:int(h * 0.703) + 70]
        white = (band.min(axis=2) > 215).astype(np.uint8)
        dark = (band.max(axis=2) < 50).astype(np.uint8)
        masks.append((white & cv2.dilate(dark, kernel)).astype(bool))
    cap.release()
    return masks


def caption_changes(masks, thresh=0.3):
    changes = []
    for f in range(1, len(masks)):
        a, b = masks[f - 1], masks[f]
        union = (a | b).sum()
        if union and (a ^ b).sum() / union > thresh:
            changes.append(f)
    return changes


def check_sync(rep, video, captions, max_err):
    expected = [c["start"] for c in captions]
    texts = [c["text"] for c in captions]
    changes = caption_changes(caption_masks(video))
    errors = []
    for i, (f, t) in enumerate(zip(expected, texts)):
        if i == 0 or f == expected[i - 1]:
            continue
        nearest = min(changes, key=lambda c: abs(c - f)) if changes else None
        err = abs(nearest - f) if nearest is not None else 999
        errors.append(err)
        if err > max_err:
            rep.add("sync", f"chunk {i} “{t}”", f"seen at frame {nearest}", f"expected {f} ±{max_err}", False, "fail")
    matched = set()
    for f in expected[1:]:
        if changes:
            matched.add(min(changes, key=lambda c: abs(c - f)))
    extra = [c for c in changes if c not in matched]
    worst = max(errors) if errors else 0
    rep.add("sync", "caption changes vs expected", f"{len(errors)} checked, worst error {worst} fr",
            f"≤ {max_err} fr", worst <= max_err, "fail")
    rep.add("sync", "unexpected caption changes", f"{len(extra)}" + (f" at {extra[:8]}" if extra else ""),
            "0", not extra, "warn")


# ---------------------------------------------------------------- still sheet
def still_sheet(video, shots, path):
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    tiles = []
    for i, s in enumerate(shots):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int((s["start"] + s["dur"] / 2) * fps))
        ok, fr = cap.read()
        if not ok:
            continue
        fr = cv2.resize(fr, (270, 480), interpolation=cv2.INTER_AREA)
        cv2.rectangle(fr, (0, 0), (270, 28), (0, 0, 0), -1)
        cv2.putText(fr, f"{i + 1}  {s['start']:.2f}s  {s['dur']:.2f}s", (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                    (255, 255, 255), 1, cv2.LINE_AA)
        tiles.append(fr)
    cap.release()
    if not tiles:
        return
    cols = min(6, len(tiles))
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[r:r + cols]) for r in range(0, len(tiles), cols)]
    cv2.imwrite(str(path), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 90])


# ---------------------------------------------------------------- main checks
def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--profile", default="episode", choices=["episode", "styletest", "calibration"])
    ap.add_argument("--out")
    ap.add_argument("--captions")
    ap.add_argument("--reuse", action="store_true")
    ap.add_argument("--plan", help="render_props.json (default: next to the video, if any): marks diagram (insert) shots")
    a = ap.parse_args()

    video = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else video.parent / f"check_{video.stem}"
    out.mkdir(parents=True, exist_ok=True)
    locks = json.loads(LOCKS.read_text(encoding="utf-8"))
    C = locks["checks"]
    prof = C["profiles"][a.profile]
    rep = Report(a.profile, locks["accepted_deviations"])

    # 1. format
    fm = ffprobe(video)
    L = locks["locked"]["format"]
    rep.add("format", "size", f"{fm['width']}×{fm['height']}", f"{L['width']}×{L['height']}",
            (fm["width"], fm["height"]) == (L["width"], L["height"]), "fail")
    rep.add("format", "fps", f"{fm['fps']:.2f}", str(L["fps"]), abs(fm["fps"] - L["fps"]) < 0.01, "fail")
    rep.add("format", "codec", fm["codec"], L["codec"], fm["codec"] == L["codec"], "fail")
    rep.add("format", "duration s", f"{fm['duration']:.2f}", rng_txt(*prof["duration_s"], 1),
            inside(fm["duration"], *prof["duration_s"]), "fail")

    # 2. analysis with the reference tools
    vis, sty = run_analysis(video, out, a.reuse)
    shots, sshots = vis["shots"], sty["shots"]
    dur = vis["duration"]
    # diagram (insert) shots are flat 2D paper: the 3D-world camera and tone ranges don't apply to them
    plan_path = Path(a.plan) if a.plan else video.parent / "render_props.json"
    # day sets ("light_kind": "day" in src/world/sets/<set>.json) are measured against the day range
    spans, day_spans = [], []
    if plan_path.exists():
        rp = json.loads(plan_path.read_text(encoding="utf-8"))
        ps = rp["shots"]
        for k, s in enumerate(ps):
            end = ps[k + 1]["from"] if k + 1 < len(ps) else rp["frames"]
            span = (s["from"] / rp["fps"], end / rp["fps"])
            if s.get("set") == "insert":
                spans.append(span)
                continue
            sf = SETS / f"{s.get('set')}.json"
            if sf.exists() and json.loads(sf.read_text(encoding="utf-8")).get("light_kind") == "day":
                day_spans.append(span)
    is_diagram = [any(lo <= s["start"] + s["dur"] / 2 < hi for lo, hi in spans) for s in shots]
    is_day = [any(lo <= s["start"] + s["dur"] / 2 < hi for lo, hi in day_spans) for s in shots]

    # 3a. edit
    E = C["edit"]
    tr = vis["transitions"]
    rep.add("edit", "dissolve length (median frames)", f"{tr['dissolve_frames_median']}", rng_txt(*E["dissolve_frames_median"], 0),
            tr["dissolve_frames_median"] is None or inside(tr["dissolve_frames_median"], *E["dissolve_frames_median"]), "warn")
    if prof["edit_rates"]:
        hc = tr["hard_cut"] * 60 / dur
        rep.add("edit", "hard cuts per 60 s", f"{hc:.1f}", f"≤ {E['hard_cuts_per_60s_max']}", hc <= E["hard_cuts_per_60s_max"], "warn")
        rep.add("edit", "first scene change s", f"{vis['first_cut_s']:.2f}", rng_txt(*E["first_change_s"], 1),
                inside(vis["first_cut_s"], *E["first_change_s"]), "warn")
        rep.add("edit", "scene changes per min", f"{vis['cuts_per_min']:.1f}", rng_txt(*E["changes_per_min"], 1),
                inside(vis["cuts_per_min"], *E["changes_per_min"]), "warn")
        rep.add("edit", "shot length median s", f"{vis['shot_len']['median']:.2f}", rng_txt(*E["shot_len_median_s"], 1),
                inside(vis["shot_len"]["median"], *E["shot_len_median_s"]), "warn")
    else:
        rep.skip("edit", "cut rates", "not for this profile")

    # 3b. camera, per shot
    K = C["camera"]
    measurable = [s for s, d in zip(shots, is_diagram) if s["dur"] >= K["min_shot_s"] and not d]
    fast = 0
    for i, s in enumerate(shots):
        tag = f"shot {i + 1} @{s['start']:.2f}s"
        if s["dur"] < K["min_shot_s"]:
            rep.skip("camera", tag, f"shot {s['dur']:.2f} s < {K['min_shot_s']} s (too short to track)")
            continue
        if is_diagram[i]:
            rep.skip("camera", tag, "diagram shot: 3D camera ranges don't apply (moving shapes also fool the tracker)")
            continue
        z = abs(s.get("zoom_pct_per_s", 0.0))
        if z > K["zoom_pct_per_s"][1]:
            fast += 1
            rep.add("camera", f"{tag} zoom %/s (fast move)", f"{z:.1f}", f"≤ {K['fast_zoom_pct_per_s_max']}",
                    z <= K["fast_zoom_pct_per_s_max"], "warn", s["start"], "zoom")
        else:
            rep.add("camera", f"{tag} zoom %/s", f"{z:.1f}", rng_txt(*K["zoom_pct_per_s"], 1),
                    inside(z, *K["zoom_pct_per_s"]), "warn", s["start"], "zoom")
        p = s.get("pan_rate_w_per_s", 0.0)
        rep.add("camera", f"{tag} drift W/s", f"{p:.3f}", rng_txt(*K["drift_w_per_s"], 3), inside(p, *K["drift_w_per_s"]),
                "warn", s["start"], "drift")
        r = abs(s.get("roll_deg", 0.0))
        rep.add("camera", f"{tag} roll °", f"{r:.2f}", rng_txt(*K["roll_deg"]), inside(r, *K["roll_deg"]), "warn", s["start"], "roll")
        j = s.get("jitter_w", 0.0)
        rep.add("camera", f"{tag} shake", f"{j:.4f}", f"≤ {K['jitter_w_max']}", j <= K["jitter_w_max"], "warn", s["start"], "jitter")
    static = sum(s["dur"] for s in shots if s["move"] == "static") / dur
    rep.add("camera", "static time share", f"{static:.0%}", f"≤ {K['static_time_max']:.0%}", static <= K["static_time_max"], "warn")
    if measurable:
        fs = fast / len(measurable)
        rep.add("camera", "fast-move share", f"{fs:.0%}", f"≤ {K['fast_share_max']:.0%}", fs <= K["fast_share_max"], "warn")

    # 3c. tone, per shot, vs the reference range of the same light kind
    T = C["tone"]
    ranges = ref_ranges()
    for i, (s, ss) in enumerate(zip(shots, sshots)):
        kind = "day" if is_day[i] else ss["light"]["kind"]
        tag = f"shot {i + 1} @{s['start']:.2f}s ({kind})"
        if s["dur"] < T["min_shot_s"]:
            rep.skip("tone", tag, f"shot {s['dur']:.2f} s < {T['min_shot_s']} s")
            continue
        if is_diagram[i]:
            rep.skip("tone", tag, "diagram shot: flat paper, the 3D-world tone ranges don't apply")
            continue
        for m in T["metrics"]:
            lo, hi = ranges[kind][m]
            nd = 2 if m == "sat" else 0
            rep.add("tone", f"{tag} {m}", f"{s[m]:.{nd}f}", rng_txt(lo, hi, nd), inside(s[m], lo, hi), "warn", s["start"], m)

    # 3d. light blocks
    LI = C["light"]
    lt = sty["light"]
    if prof["light_blocks"]:
        rep.add("light", "warm and cool both used", f"{lt['sequence']}", "both", lt["has_both"], "warn")
        rep.add("light", "warm↔cool switches", f"{lt['warm_cool_switches']}", rng_txt(*LI["switches"], 0),
                inside(lt["warm_cool_switches"], *LI["switches"]), "warn")
    else:
        rep.skip("light", f"blocks (sequence {lt['sequence']})", "not for this profile (too short)")

    # 3e. blur and lines
    B = C["blur"]
    rep.add("blur", "sharpest areas σ px", f"{sty['blur']['sigma_sharp_px']:.2f}", f"≤ {B['sigma_sharp_max_px']}",
            sty["blur"]["sigma_sharp_px"] <= B["sigma_sharp_max_px"], "warn")
    long_shots = [ss for s, ss, d in zip(shots, sshots, is_diagram) if s["dur"] >= T["min_shot_s"] and not d]
    if long_shots:
        share = sum(1 for ss in long_shots if ss["blur"]["sigma_soft_px"] > B["blur_shot_sigma_px"]) / len(long_shots)
        rep.add("blur", f"shots with background σ > {B['blur_shot_sigma_px']} px", f"{share:.0%}", rng_txt(*B["blur_shot_share"]),
                inside(share, *B["blur_shot_share"]), "warn")
    rep.add("lines", "world line width px (info)", f"{sty['lines']['stroke_px']}", "2 (thin line art) or 4 (cel) or none", True, "warn")

    # 4. captions
    CP = C["captions"]
    cp = sty["captions"]
    rep.add("captions", "coverage", f"{cp['coverage']:.1%}", f"≥ {CP['coverage_min']:.0%}", cp["coverage"] >= CP["coverage_min"], "fail")
    rep.add("captions", "x-height px", f"{cp['x_height_px']}", rng_txt(*CP["x_height_px"], 1), inside(cp["x_height_px"], *CP["x_height_px"]), "fail")
    rep.add("captions", "center y (of H)", f"{cp['cy']:.3f}", rng_txt(*CP["center_y"], 3), inside(cp["cy"], *CP["center_y"]), "fail")
    rep.add("captions", "center x (of W)", f"{cp['cx']:.3f}", rng_txt(*CP["center_x"], 3), inside(cp["cx"], *CP["center_x"]), "fail")
    rep.add("captions", "outline above px", f"{cp['outline_px']['up']}", rng_txt(*CP["outline_up_px"], 0),
            inside(cp["outline_px"]["up"], *CP["outline_up_px"]), "fail")
    rep.add("captions", "shadow below px", f"{cp['soft_shadow_px']['down']}", rng_txt(*CP["shadow_down_px"], 0),
            inside(cp["soft_shadow_px"]["down"], *CP["shadow_down_px"]), "warn")
    rep.add("captions", "shadow right px", f"{cp['soft_shadow_px']['right']}", rng_txt(*CP["shadow_right_px"], 0),
            inside(cp["soft_shadow_px"]["right"], *CP["shadow_right_px"]), "warn")
    wh = {int(k): v for k, v in cp["words_hist"].items()}
    n = sum(wh.values()) or 1
    one = wh.get(1, 0) / n
    four = sum(v for k, v in wh.items() if k >= 4)
    rep.add("captions", "one-word chunks share", f"{one:.0%}", rng_txt(*CP["one_word_share"]), inside(one, *CP["one_word_share"]), "warn")
    rep.add("captions", "chunks with 4+ words", f"{four}", f"≤ {CP['four_plus_words_max']}", four <= CP["four_plus_words_max"], "warn")
    if a.captions:
        check_sync(rep, video, json.loads(Path(a.captions).read_text(encoding="utf-8")), C["sync"]["max_error_frames"])
    else:
        rep.skip("sync", "caption timing", "no --captions file given")

    # 5b. flicker (z-fighting): FAIL on any region that flips A->B->A for several frames
    sys.path.insert(0, str(ROOT / "tools"))
    from flicker import MIN_FLIPS, WINDOW, draw_region, find_flicker

    for old in out.glob("flicker_*.png"):
        old.unlink()
    regions, _ = find_flicker(video)
    if not regions:
        rep.add("flicker", "z-fighting regions (A→B→A patches)", "0", "0", True, "fail")
    for i, r in enumerate(regions, 1):
        draw_region(video, r, out / f"flicker_{i}.png")
        x0, y0, x1, y1 = r["box"]
        rep.add("flicker", f"region {i} @{r['frames'][0] / fm['fps']:.2f}–{r['frames'][1] / fm['fps']:.2f}s x {x0}–{x1} y {y0}–{y1} (`flicker_{i}.png`)",
                f"{r['max_flips']} flips in {WINDOW} fr", f"< {MIN_FLIPS} (z-fighting: two faces on one plane?)", False, "fail")

    # 5. audio
    AU = C["audio"]
    if prof["audio"]:
        if not has_audio(video):
            rep.add("audio", "audio track", "none", "voice + music", False, "fail")
        else:
            lufs, tp = loudness(video)
            rep.add("audio", "integrated LUFS", f"{lufs}", rng_txt(*AU["lufs"], 1), lufs is not None and inside(lufs, *AU["lufs"]), "fail")
            rep.add("audio", "true peak dBTP", f"{tp}", f"≤ {AU['true_peak_max_dbtp']}", tp is not None and tp <= AU["true_peak_max_dbtp"], "fail")
    else:
        rep.skip("audio", "loudness", "not for this profile")

    # 6. outputs
    still_sheet(video, shots, out / "still_sheet.jpg")
    verdict = "FAIL" if rep.count("FAIL") else ("PASS with warnings" if rep.count("WARN") else "PASS")
    lines = [
        f"# Check report — {video.name}",
        "",
        f"Profile **{a.profile}** · locks **{locks['version']}** · {fm['width']}×{fm['height']} {fm['fps']:.0f} fps · {fm['duration']:.2f} s · "
        f"{vis['n_shots']} detected shots · light `{lt['sequence']}`",
        "",
        f"**Verdict: {verdict}** — {rep.count('PASS')} pass · {rep.count('WARN')} warn · {rep.count('FAIL')} fail · "
        f"{rep.count('ACCEPTED')} accepted · {rep.count('SKIP')} skipped",
        "",
        "Eye check: `still_sheet.jpg` (middle frame of every detected shot). Numbers alone missed problems in v1/v2.",
        "",
        "| | section | item | value | target |",
        "|---|---|---|---|---|",
    ]
    order = {"FAIL": 0, "WARN": 1, "ACCEPTED": 2, "PASS": 3, "SKIP": 4}
    for sec, item, val, tgt, st in sorted(rep.rows, key=lambda r: order[r[4]]):
        lines.append(f"| {ICON[st]} {st} | {sec} | {item} | {val} | {tgt} |")
    text = "\n".join(lines) + "\n"
    (out / "check_report.md").write_text(text, encoding="utf-8")
    print("\n".join(l for l in lines if not l.startswith("| ✅") and not l.startswith("| ➖")))
    print(f"\nreport: {out / 'check_report.md'}")
    sys.exit(1 if rep.count("FAIL") else 0)


if __name__ == "__main__":
    main()
