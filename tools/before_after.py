"""Before/after sheet: stills of several cameras, before vs after a set change, in one picture (BUILDING.md step 8).

Shoot "before" FIRST (before you change the set), change the set, shoot "after", then make the sheet:
  .venv/Scripts/python -I tools/before_after.py <source> --tag before      (renders the stills now)
  ... change the set ...
  .venv/Scripts/python -I tools/before_after.py <source> --tag after
  .venv/Scripts/python -I tools/before_after.py <source> --sheet [--tags before,after]

<source> = a cams file src/world/sets/<set>_cams.json (the planned cameras of a scene) or a video folder /
its render_props.json (--shots s01,s05 to pick shots; default all 3D shots). Any tag name works (e.g. before, A, B):
--sheet puts one row per tag, in the --tags order, one column per camera.
Output: out/before_after/<name>/<tag>/<camera>.png and out/before_after/<name>/before_after.jpg.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from set_cams import ROOT, load, stills_props  # noqa: E402

TILE_W, TILE_H = 360, 640


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--tag", help="render the stills under this tag (before, after, A, B…)")
    ap.add_argument("--sheet", action="store_true", help="build the sheet from the tags already rendered")
    ap.add_argument("--tags", default="before,after")
    ap.add_argument("--shots", default="")
    ap.add_argument("--name", help="output folder name (default: the source name)")
    a = ap.parse_args()
    if not a.tag and not a.sheet:
        raise SystemExit("give --tag <name> to render stills, or --sheet to build the sheet")
    src = Path(a.source)
    name = a.name or (src.stem if src.is_file() else src.name)
    out = ROOT / "out" / "before_after" / name
    _, cams, props = load(a.source, [s for s in a.shots.split(",") if s])

    if a.tag:
        tag_dir = out / a.tag
        tag_dir.mkdir(parents=True, exist_ok=True)
        props_file = out / "stills_props.json"
        if props is None:
            props_file.write_text(json.dumps(stills_props(a.source, a.source), indent=1), encoding="utf-8")
        else:
            props_file = src / "render_props.json" if src.is_dir() else src
        frames = ",".join(str(c["frame"]) for c in cams)
        subprocess.run(["node", str(ROOT / "tools/render_stills.mjs"), "--props", str(props_file), "--frames", frames,
                        "--out", str(tag_dir), "--prefix", "f"], cwd=ROOT, check=True, stdin=subprocess.DEVNULL,
                       stdout=subprocess.DEVNULL)
        for c in cams:  # name the stills by camera
            (tag_dir / f"f{c['frame']:05d}.png").replace(tag_dir / f"{c['id']}.png")
        print(f"{len(cams)} stills → {tag_dir.relative_to(ROOT)}")

    if a.sheet:
        tags = [t for t in a.tags.split(",") if t]
        rows = []
        for t in tags:
            tiles = []
            for c in cams:
                f = out / t / f"{c['id']}.png"
                img = cv2.imread(str(f)) if f.exists() else None
                img = np.full((TILE_H, TILE_W, 3), 40, np.uint8) if img is None else cv2.resize(img, (TILE_W, TILE_H), interpolation=cv2.INTER_AREA)
                img[:44] = (img[:44] * 0.35).astype(img.dtype)
                cv2.putText(img, f"{t}  {c['id']} {c['label']}", (8, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
                if not f.exists():
                    cv2.putText(img, "not rendered", (8, TILE_H // 2), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (90, 90, 255), 2, cv2.LINE_AA)
                tiles.append(img)
            rows.append(np.hstack(tiles))
        sheet = np.vstack([np.vstack([r, np.full((6, r.shape[1], 3), 255, np.uint8)]) for r in rows])[:-6]
        cv2.imwrite(str(out / "before_after.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
        print(f"sheet ({' / '.join(tags)}, {len(cams)} cameras) → {(out / 'before_after.jpg').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
