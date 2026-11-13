"""Kit catalog: one picture with every piece of src/world/kit/ and its name (scenes plan, session 1).

Usage (from the project root):
  .venv/Scripts/python -I tools/kit_catalog.py [--cols 6] [--check]
  .venv/Scripts/python -I tools/kit_catalog.py --theme home      (theme kit picture, e.g. references/sets/kit_home.jpg)

1. Reads the piece list from src/compositions/KitSheet.tsx (`KIT`: one entry per tile, name / file / theme).
2. Renders one still per piece (composition KitSheet, frame i = piece i) with tools/render_stills.mjs
   → out/kit_catalog/tiles/, and writes the labelled contact sheet references/sets/kit_catalog.jpg.
3. Coverage check: every exported kit piece (React component or geometry maker in src/world/kit/*.tsx) must be
   in KitSheet.tsx AND in references/sets/KIT.md. Missing ones are listed (WARN): add them, then re-run.
   --check = only the coverage check, no render (fast; run it whenever the kit grows).

Re-run it whenever a kit piece is added or changed (BUILDING.md step 3 + step 10).
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SHEET_SRC = ROOT / "src" / "compositions" / "KitSheet.tsx"
KIT_DIR = ROOT / "src" / "world" / "kit"
KIT_MD = ROOT / "references" / "sets" / "KIT.md"
OUT_SHEET = ROOT / "references" / "sets" / "kit_catalog.jpg"
TILE = 360
# exports that are helpers, not pieces (types, contexts, geometry utilities)
NOT_PIECES = {"medievalFile", "DayContext", "facet", "mergeAt", "gridLine", "noise2", "Roof", "loadPack", "usePack", "usePackSize",
              # snow.tsx geometry/texture helpers (described in KIT.md, drawn by the pieces that use them)
              "snowShell", "peakGeometry", "snowGroundGeometry", "snowSlope", "snowGroundTex"}
# theme kit pictures (scenes plan 3 + 4): pieces of one theme, one tile each + combos
THEMES = {
    "home": dict(src=ROOT / "src" / "compositions" / "HomeKitSheet.tsx", comp="HomeKitSheet",
                 out=ROOT / "references" / "sets" / "kit_home.jpg"),
    "medieval": dict(src=ROOT / "src" / "compositions" / "MedievalKitSheet.tsx", comp="MedievalKitSheet",
                     out=ROOT / "references" / "sets" / "kit_medieval.jpg"),
    "snow": dict(src=ROOT / "src" / "compositions" / "SnowKitSheet.tsx", comp="SnowKitSheet",
                 out=ROOT / "references" / "sets" / "kit_snow.jpg"),
}


def catalog_entries(src=SHEET_SRC):
    txt = src.read_text(encoding="utf-8")
    return [e for e in re.findall(r'name: "([^"]+)", file: "([^"]+)", theme: "([^"]+)"', txt) if e[0] != "..."]


def kit_exports():
    out = {}
    for f in sorted(KIT_DIR.glob("*.tsx")):
        for m in re.finditer(r"^export const (\w+)\s*[:=]", f.read_text(encoding="utf-8"), re.M):
            name = m.group(1)
            if name not in NOT_PIECES and not name.isupper():
                out[name] = f.name
    return out


def coverage(entries):
    shown = {n.strip() for name, _, _ in entries for n in name.split("+")}
    md = KIT_MD.read_text(encoding="utf-8") if KIT_MD.exists() else ""
    missing = []
    for name, f in kit_exports().items():
        where = [w for w, ok in (("KitSheet.tsx", name in shown), ("KIT.md", f"`{name}`" in md)) if not ok]
        if where:
            missing.append(f"{name} ({f}) → not in {' / '.join(where)}")
    return missing


def label(img, name, file, theme):
    h = img.shape[0]
    img[h - 62:] = (img[h - 62:] * 0.3).astype(img.dtype)
    cv2.putText(img, name, (10, h - 36), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(img, f"{file}  |  {theme}", (10, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (225, 225, 225), 1, cv2.LINE_AA)
    return img


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--check", action="store_true", help="only the coverage check, no render")
    ap.add_argument("--theme", choices=sorted(THEMES), help="theme kit picture instead of the main catalog")
    a = ap.parse_args()
    comp, out_sheet, tag = "KitSheet", OUT_SHEET, "kit_catalog"
    if a.theme:
        th = THEMES[a.theme]
        comp, out_sheet, tag = th["comp"], th["out"], f"kit_{a.theme}"
    entries = catalog_entries(THEMES[a.theme]["src"] if a.theme else SHEET_SRC)
    missing = coverage(catalog_entries())
    print(f"kit catalog: {len(entries)} tiles, {len(kit_exports())} kit pieces")
    for m in missing:
        print(f"  ⚠️ WARN {m}")
    if a.check:
        sys.exit(1 if missing else 0)

    tiles_dir = ROOT / "out" / tag / "tiles"
    frames = ",".join(str(i) for i in range(len(entries)))
    subprocess.run(["node", str(ROOT / "tools/render_stills.mjs"), "--composition", comp, "--frames", frames,
                    "--out", str(tiles_dir), "--prefix", "k"], cwd=ROOT, check=True, stdin=subprocess.DEVNULL,
                   stdout=subprocess.DEVNULL)
    tiles = []
    for i, (name, file, theme) in enumerate(entries):
        img = cv2.imread(str(tiles_dir / f"k{i:05d}.png"))
        img = cv2.resize(img, (TILE, TILE), interpolation=cv2.INTER_AREA)
        tiles.append(label(img, name, file, theme))
    cols = min(a.cols, len(tiles))
    while len(tiles) % cols:
        tiles.append(np.full_like(tiles[0], 40))
    rows = [np.hstack(tiles[r:r + cols]) for r in range(0, len(tiles), cols)]
    sheet = np.vstack(rows)
    out_sheet.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_sheet), sheet, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(f"sheet → {out_sheet.relative_to(ROOT)} ({sheet.shape[1]}×{sheet.shape[0]})")
    print(f"RESULT: {'WARN' if missing else 'PASS'} — {len(missing)} piece(s) missing from the catalog")


if __name__ == "__main__":
    main()
