"""Camera view check: where each planned camera sees the ground, and how big a prop is there (BUILDING.md step 6).

Why (item 8, references/effects/depth-filling.md rule 1): an eye-level camera sees the ground as a THIN BAND, a
strip a few % of the frame high. Flat props there (beds, tufts) vanish; props that should read must be TALL and stand
inside the camera's view cone. This tool shows that cone on a top-down map, before anything is built or rendered.

Usage (from the project root):
  .venv/Scripts/python -I tools/camera_view.py src/world/sets/<set>_cams.json   (planned cameras of a new scene)
  .venv/Scripts/python -I tools/camera_view.py videos/<slug> [--shots s01,s05]   (the shots of a video)
  options: --ground <y> (default: the most common feet height of the set's marks), --prop <m> (default 2),
           --out <dir> (default out/camera_view/<name>/)

Output:
  - a table per camera: for ground points 2…60 m in front of it, the screen row (% from the frame bottom) and the
    height of a <prop> m prop (% of the frame height); where the ground band is thinner than 1 % per metre.
  - map.jpg: one top-down panel per camera (x right, z down = toward the usual camera side): the ground it sees,
    colored by how big a <prop> m prop looks there — green ≥ 10 % of the frame height (reads), yellow 4–10 %,
    red < 4 % (lost in the band); marks (white) and review points (blue dots) of the set. Last panel: all cones.
  Geometry only: nothing blocks the view (walls, the bridge), so check the real stills too (before_after.py).
"""
import argparse
import json
import math
import sys
from collections import Counter
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from set_cams import ROOT, cam_at, cross, dot, load, norm, set_data, sub  # noqa: E402

ASPECT = 1080 / 1920
MAX_D = 80.0
PANEL = 520
COLORS = [(80, 200, 255), (255, 160, 80), (120, 255, 120), (200, 120, 255), (90, 90, 255), (255, 255, 90), (200, 200, 200)]


class View:
    def __init__(self, move, t):
        self.pos, self.target, self.fov = cam_at(move, t)
        self.f = norm(sub(self.target, self.pos))
        self.r = norm(cross(self.f, [0, 1, 0]))
        self.u = cross(self.r, self.f)
        self.th = math.tan(math.radians(self.fov) / 2)

    def project(self, p):
        """→ (x, y) in -1…1 (y up), depth; None behind the camera."""
        v = sub(p, self.pos)
        z = dot(v, self.f)
        if z < 0.05:
            return None
        return dot(v, self.r) / (z * self.th * ASPECT), dot(v, self.u) / (z * self.th), z


def table(view, ground, prop):
    """Ground points straight ahead (horizontal direction of the camera) at several distances."""
    h = norm([view.f[0], 0, view.f[2]])
    rows = []
    for d in (2, 4, 6, 10, 15, 25, 40, 60):
        p = [view.pos[0] + h[0] * d, ground, view.pos[2] + h[2] * d]
        q = view.project(p)
        if not q or abs(q[1]) > 1:
            rows.append((d, None, None))
            continue
        row = (q[1] + 1) * 50
        size = prop / (2 * q[2] * view.th) * 100
        rows.append((d, row, size))
    horizon = None
    if abs(view.f[1]) < 0.999:
        far = [view.pos[0] + h[0] * 1e4, view.pos[1], view.pos[2] + h[2] * 1e4]
        q = view.project(far)
        horizon = (q[1] + 1) * 50 if q else None
    return rows, horizon


def cone(view, ground, prop, xs, zs):
    """size % of a prop on every map cell the camera sees (NaN = not seen)."""
    X, Z = np.meshgrid(xs, zs)
    vx, vy, vz = X - view.pos[0], ground - view.pos[1], Z - view.pos[2]
    depth = vx * view.f[0] + vy * view.f[1] + vz * view.f[2]
    sx = (vx * view.r[0] + vy * view.r[1] + vz * view.r[2]) / (np.maximum(depth, 1e-3) * view.th * ASPECT)
    sy = (vx * view.u[0] + vy * view.u[1] + vz * view.u[2]) / (np.maximum(depth, 1e-3) * view.th)
    seen = (depth > 0.3) & (np.abs(sx) <= 1) & (np.abs(sy) <= 1) & (np.hypot(vx, vz) < MAX_D)
    size = prop / (2 * np.maximum(depth, 1e-3) * view.th) * 100
    return np.where(seen, size, np.nan)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--shots", default="")
    ap.add_argument("--ground", type=float)
    ap.add_argument("--prop", type=float, default=2.0)
    ap.add_argument("--out")
    a = ap.parse_args()
    set_id, cams, _ = load(a.source, [s for s in a.shots.split(",") if s])
    if not cams:
        raise SystemExit("no 3D cameras found")
    sd = set_data(set_id or cams[0]["set"])
    marks = sd.get("marks", {})
    points = sd.get("review", {}).get("points", {})
    ground = a.ground if a.ground is not None else Counter(round(m[1], 2) for m in marks.values()).most_common(1)[0][0]
    name = Path(a.source).stem if Path(a.source).is_file() else Path(a.source).name
    out = Path(a.out) if a.out else ROOT / "out" / "camera_view" / name
    out.mkdir(parents=True, exist_ok=True)

    print(f"# Camera view — {name} (set {sd['id']}, ground y {ground}, prop {a.prop} m)\n")
    views = [View(c["move"], c["t"]) for c in cams]
    for c, v in zip(cams, views):
        rows, horizon = table(v, ground, a.prop)
        hz = f"horizon at {horizon:.0f} % from the bottom" if horizon is not None and 0 <= horizon <= 100 else "horizon out of frame"
        print(f"## {c['id']} {c['label']} — eye {v.pos[1] - ground:.1f} m above the ground, looking {math.degrees(math.asin(v.f[1])):+.0f}°, {hz}")
        print(f"| ground ahead | screen row (% from bottom) | {a.prop:g} m prop (% of frame height) |")
        print("|---|---|---|")
        last = None
        for d, row, size in rows:
            if row is None:
                print(f"| {d} m | out of frame | |")
                continue
            band = f" (band {(row - last[1]) / (d - last[0]):.1f} %/m)" if last else ""
            flag = " ← thin band" if last and (row - last[1]) / (d - last[0]) < 1 else ""
            print(f"| {d} m | {row:.0f} %{band}{flag} | {size:.0f} % |")
            last = (d, row)
        print()

    # map extent: the set's camera bounds + the cones, capped
    allx = [v.pos[0] for v in views] + [m[0] for m in marks.values()]
    allz = [v.pos[2] for v in views] + [m[2] for m in marks.values()]
    for v in views:  # far ends of each cone: frame-corner rays on the ground, or MAX_D away
        for sx in (-1, 1):
            for sy in (-1, 0, 1):
                d = [v.f[i] + sx * v.th * ASPECT * v.r[i] + sy * v.th * v.u[i] for i in range(3)]
                hd = math.hypot(d[0], d[2]) or 1e-6
                k = (ground - v.pos[1]) / d[1] if d[1] < -1e-6 else float("inf")
                k = min(k, MAX_D / hd)
                allx.append(v.pos[0] + d[0] * k)
                allz.append(v.pos[2] + d[2] * k)
    x0, x1 = min(allx) - 4, max(allx) + 4
    z0, z1 = min(allz) - 4, max(allz) + 4
    side = max(x1 - x0, z1 - z0)
    x1, z1 = x0 + side, z0 + side
    step = side / PANEL
    xs = x0 + (np.arange(PANEL) + 0.5) * step
    zs = z0 + (np.arange(PANEL) + 0.5) * step
    to_px = lambda x, z: (int((x - x0) / step), int((z - z0) / step))

    def base():
        img = np.full((PANEL, PANEL, 3), 46, np.uint8)
        g5 = 5 if side < 120 else 10
        for gx in np.arange(math.ceil(x0 / g5) * g5, x1, g5):
            cv2.line(img, to_px(gx, z0), to_px(gx, z1), (70, 70, 70) if gx else (110, 110, 110), 1)
        for gz in np.arange(math.ceil(z0 / g5) * g5, z1, g5):
            cv2.line(img, to_px(x0, gz), to_px(x1, gz), (70, 70, 70) if gz else (110, 110, 110), 1)
        return img

    def dots(img):
        for p in points.values():
            cv2.circle(img, to_px(p[0], p[2]), 3, (255, 140, 60), -1)
        for k, m in marks.items():
            cv2.circle(img, to_px(m[0], m[2]), 3, (255, 255, 255), -1)

    def cam_icon(img, v, color):
        p = to_px(v.pos[0], v.pos[2])
        h = norm([v.f[0], 0, v.f[2]])
        cv2.circle(img, p, 6, color, -1)
        cv2.arrowedLine(img, p, (int(p[0] + h[0] * 30), int(p[1] + h[2] * 30)), color, 2, tipLength=0.35)

    panels = []
    combo = base()
    for i, (c, v) in enumerate(zip(cams, views)):
        img = base()
        s = cone(v, ground, a.prop, xs, zs)
        col = np.zeros_like(img)
        col[s >= 10] = (90, 200, 90)
        col[(s >= 4) & (s < 10)] = (60, 210, 230)
        col[s < 4] = (70, 70, 220)
        m = ~np.isnan(s)
        img[m] = (0.45 * img[m] + 0.55 * col[m]).astype(np.uint8)
        dots(img)
        cam_icon(img, v, (255, 255, 255))
        cv2.putText(img, f"{c['id']} {c['label']}", (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
        panels.append(img)
        mask = m.astype(np.uint8)
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(combo, cnts, -1, COLORS[i % len(COLORS)], 2)
        cam_icon(combo, v, COLORS[i % len(COLORS)])
        cv2.putText(combo, c["id"], (10 + 52 * i, PANEL - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLORS[i % len(COLORS)], 2, cv2.LINE_AA)
    dots(combo)
    cv2.putText(combo, "all cones", (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
    panels.append(combo)
    cols = min(3, len(panels))
    while len(panels) % cols:
        panels.append(np.full_like(panels[0], 30))
    sheet = np.vstack([np.hstack(panels[r:r + cols]) for r in range(0, len(panels), cols)])
    legend = np.full((40, sheet.shape[1], 3), 30, np.uint8)
    txt = (f"{a.prop:g} m prop: green >= 10% of frame height (reads) | yellow 4-10% | red < 4% (lost) | "
           f"white = marks, blue = review points | grid {5 if side < 120 else 10} m, x right, z down")
    cv2.putText(legend, txt, (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (230, 230, 230), 1, cv2.LINE_AA)
    sheet = np.vstack([sheet, legend])
    cv2.imwrite(str(out / "map.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(f"map → {(out / 'map.jpg').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
