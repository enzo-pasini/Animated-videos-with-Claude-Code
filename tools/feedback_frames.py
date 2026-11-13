"""Frames for feedback: the frame at a given second + 2 neighbors, and which shot and code files it belongs to.

Usage (from the project root):
  .venv/Scripts/python -I tools/feedback_frames.py videos/<slug> <seconds> [--video preview.mp4] [--step 0.33]

Reads <video> (default: final.mp4 if it exists, else preview.mp4), render_props.json (exact shot frames),
scene_plan.json (camera presets) and audio/words.json (the words spoken around that time).
Writes videos/<slug>/feedback/t<sec>s_f<frame>.png for each of the 3 frames and t<sec>s_sheet.jpg (the 3 side
by side, labelled), then prints the shot, words and the files most likely responsible.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]

# what draws each part of a shot (see docs/PROJECT_MAP.md "Code")
ALWAYS = {
    "captions": "src/film/Captions.tsx",
    "camera presets": "src/film/camera.ts",
    "color grade (locked)": "src/style/Grade.tsx",
    "shot assembly": "src/episode/Episode.tsx",
}


def load(path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def set_file(set_id):
    if set_id == "insert":
        return "src/world/inserts/Diagram.tsx"
    name = "".join(p.capitalize() for p in set_id.split("_"))
    f = f"src/world/sets/{name}.tsx"
    return f if (ROOT / f).exists() else "src/episode/sets.tsx"


def shots_at(props, frame):
    return [s for s in props["shots"] if s["from"] <= frame < s["from"] + s["len"]]


def words_near(words, t, pad=0.6):
    return " ".join(w["w"] for w in words if w["end"] >= t - pad and w["start"] <= t + pad)


def read_frame(cap, idx):
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ok, img = cap.read()
    return img if ok else None


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("seconds", type=float)
    ap.add_argument("--video", help="file name inside the video folder (default final.mp4, else preview.mp4)")
    ap.add_argument("--step", type=float, default=0.33, help="seconds between the frame and its neighbors")
    ap.add_argument("--item", help="feedback item id, e.g. FB1: the new sheet is also saved as feedback/<item>_after.jpg")
    ap.add_argument("--before", help="with --item: the item's old sheet (feedback/<item>_sheet.jpg); writes "
                                     "feedback/<item>_compare.jpg = BEFORE on top, AFTER below")
    a = ap.parse_args()

    vdir = Path(a.video_dir)
    if not vdir.is_absolute():
        vdir = ROOT / vdir
    if a.video:
        video = vdir / a.video
    else:
        video = vdir / "final.mp4" if (vdir / "final.mp4").exists() else vdir / "preview.mp4"
    if not video.exists():
        sys.exit(f"ERROR: no video at {video} (render the preview first)")

    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if a.seconds < 0 or a.seconds * fps >= total:
        sys.exit(f"ERROR: {a.seconds} s is outside the video (0 to {total / fps:.2f} s)")

    center = int(round(a.seconds * fps))
    step = max(1, int(round(a.step * fps)))
    idxs = sorted({max(0, center - step), center, min(total - 1, center + step)})

    out = vdir / "feedback"
    out.mkdir(exist_ok=True)
    tag = f"t{a.seconds:.2f}s"
    tiles, paths = [], []
    for i in idxs:
        img = read_frame(cap, i)
        if img is None:
            continue
        p = out / f"{tag}_f{i:05d}.png"
        cv2.imwrite(str(p), img)
        paths.append(p)
        tile = cv2.resize(img, (img.shape[1] // 3, img.shape[0] // 3))
        label = f"{i / fps:.2f}s f{i}" + ("  <- asked" if i == center else "")
        cv2.rectangle(tile, (0, 0), (tile.shape[1], 44), (0, 0, 0), -1)
        cv2.putText(tile, label, (10, 31), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
        tiles.append(tile)
    cap.release()
    sheet = out / f"{tag}_sheet.jpg"
    after = np.hstack(tiles)
    cv2.imwrite(str(sheet), after, [cv2.IMWRITE_JPEG_QUALITY, 90])

    rel = lambda p: p.relative_to(ROOT).as_posix() if p.is_relative_to(ROOT) else str(p)
    if a.item:
        cv2.imwrite(str(out / f"{a.item}_after.jpg"), after, [cv2.IMWRITE_JPEG_QUALITY, 90])
        print(f"after:  {rel(out / f'{a.item}_after.jpg')}")
    if a.item and a.before:
        bpath = Path(a.before)
        if not bpath.is_absolute():
            bpath = vdir / bpath if (vdir / bpath).exists() else ROOT / bpath
        before = cv2.imread(str(bpath))
        if before is None:
            sys.exit(f"ERROR: cannot read the before sheet {bpath}")
        if before.shape[1] != after.shape[1]:
            before = cv2.resize(before, (after.shape[1], int(before.shape[0] * after.shape[1] / before.shape[1])))

        def band(img, text, color):
            bar = np.zeros((70, img.shape[1], 3), np.uint8)
            bar[:] = color
            cv2.putText(bar, text, (14, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (255, 255, 255), 3, cv2.LINE_AA)
            return np.vstack([bar, img])

        compare = np.vstack([band(before, f"{a.item}  ANTES", (40, 40, 160)), np.full((12, after.shape[1], 3), 255, np.uint8),
                             band(after, f"{a.item}  DEPOIS", (40, 130, 40))])
        # compare after the same JPEG round trip the before sheet went through
        after_jpg = cv2.imdecode(cv2.imencode(".jpg", after, [cv2.IMWRITE_JPEG_QUALITY, 90])[1], cv2.IMREAD_COLOR)
        if before.shape == after.shape and float(np.abs(before.astype(int) - after_jpg.astype(int)).mean()) < 0.5:
            print("WARNING: AFTER is the same image as BEFORE — the fix is not in this video (not re-rendered?)")
        cpath = out / f"{a.item}_compare.jpg"
        cv2.imwrite(str(cpath), compare, [cv2.IMWRITE_JPEG_QUALITY, 90])
        print(f"compare: {rel(cpath)}")
    print(f"video: {rel(video)}  ({fps:g} fps, {total} frames)")
    print(f"asked: {a.seconds:.2f} s = frame {center}")
    print("frames: " + ", ".join(rel(p) for p in paths))
    print(f"sheet:  {rel(sheet)}")

    props = load(vdir / "render_props.json")
    plan = load(vdir / "scene_plan.json") or {}
    words = (load(vdir / "audio" / "words.json") or {}).get("words", [])
    if words:
        print(f'words around {a.seconds:.2f} s: "{words_near(words, a.seconds)}"')
    if not props:
        print("shot: unknown (no render_props.json; run tools/build_props.py first)")
        return
    plan_shots = {s["id"]: s for s in plan.get("shots", [])}
    found = shots_at(props, center)
    if len(found) > 1:
        print(f"note: frame {center} is inside a dissolve between {' and '.join(s['id'] for s in found)}")
    files = {}
    for s in found:
        cam = plan_shots.get(s["id"], {}).get("camera", {}).get("preset", "custom")
        who = ", ".join(x["who"] for x in s.get("actors", [])) or "—"
        # same times as scene_plan.md: a shot ends where the next one starts (its len also covers the dissolve)
        nxt = [t["from"] for t in props["shots"] if t["from"] > s["from"]]
        start, end = s["from"] / fps, (min(nxt) if nxt else s["from"] + s["len"]) / fps
        print(f"shot: {s['id']} ({s['beat']}) {start:.2f}–{end:.2f} s · set {s['set']} · who {who} · camera {cam}"
              + (f" · blur_bg {s['blur_bg']}" if s.get("blur_bg") else ""))
        files[f"set {s['set']}"] = set_file(s["set"])
        if s.get("actors"):
            files["characters (cast, variants)"] = "src/cast/registry.ts"
            files["character parts / expressions"] = "src/cast/parts.ts, src/cast/expressions.ts"
            files["character drawing (locked)"] = "src/character/draw.ts"
        if s["set"] != "insert":
            light = "src/world/lights/warmInterior.tsx" if re.search("workshop|interior", s["set"]) \
                else "src/world/lights/nightExterior.tsx"
            files[f"light preset ({s['set']})"] = light
    files.update(ALWAYS)
    files["shot data (this video)"] = rel(vdir / "scene_plan.json")
    print("files:")
    for what, f in files.items():
        print(f"  - {what}: {f}")


if __name__ == "__main__":
    main()
