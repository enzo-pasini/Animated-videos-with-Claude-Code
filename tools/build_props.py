"""Turn a scene plan into render props for the Remotion Episode composition.

Usage (from the project root):
  python -I tools/build_props.py videos/<slug> [--plan scene_plan.json] [--out render_props.json]

Reads (paths in the plan are relative to the plan's folder):
  scene_plan.json      the plan (fields below), word anchors instead of frames
  audio/words.json     word times (voice_words.py)
  captions.json        caption chunks (make_captions.py)
  audio/mix.json       exact length in frames (mix_audio.py); else plan "frames" or last word + 0.1 s
  src/world/sets/<set>.json   marks (where characters stand) and the set's front direction
Writes render_props.json: every anchor resolved to a frame, every camera preset to a raw move.
Remotion only draws what this file says (src/episode/Episode.tsx).

Anchors: "f:120" frame 120 · "w:6" start of word 6 · "w:6+2" / "w:6-3" frames after/before ·
"start" / "start+60" the shot's first frame (inside a shot).
Shots: "from" = the frame the shot starts appearing (the dissolve into it starts there).

Camera: either {"move": {raw v3 move: target, dir, d0, fov, rate, fast, fovStart, drift, roll}}
or a preset {"preset": "push_in|close_up|pull_out|fast_entry", "aim": "mark:door" | [x,y,z],
"part": "head|body", "head_pct": 27, "side": "left|right|front", "fov": 40, "elev": 0.06}.
Optional "punch": "w:6" (or {"at", "factor", "dur"}) = a fast push-in on that word (v4 item 5, 1.15x in 0.27 s).
Shot "lines": "w:6" (or {"at", "len", "center", "n"}) = edge lines from that word (v4 item 5, 15 frames).
Actor "walk": {"from": "mark:a", "to": "mark:b", "at": "w:6", "pace": "normal|fast|rush", "stop": true} = the
actor walks from → to (v4 item 12; "at" default = the shot start; then "at" of the actor is not needed). It ends with
the stop step on "to"; "stop": false = it keeps walking the same way to the end of the shot.
Presets use the locked numbers (locks.md §2): d0 from the head-size formula, rates 0.13 / 0.09 /
-0.10, fast entry = lens zoom 70 -> fov in 0.8 s, drift 0.05 frame widths/s, roll 0.5-2.5 deg.
"""
import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SETS = ROOT / "src" / "world" / "sets"
HEAD_M = 0.55  # head width in meters (locks.md §3)
ASPECT_W = 1080 / 1920
PARTS = {"head": 1.43, "body": 0.9, "feet": 0.0}  # height above the feet mark (m)
PRESETS = {
    "push_in": {"rate": 0.13, "fov": 40},
    "close_up": {"rate": 0.09, "fov": 30},
    "pull_out": {"rate": -0.10, "fov": 40},
    "fast_entry": {"rate": 0.13, "fov": 44, "fovStart": 70, "fast": {"dur": 0.8, "factor": 1}},
}
PUNCH = {"dur": 0.27, "factor": 1.15}  # v4 item 5: mid-shot fast push-in, measured on VS1Z_Q-Klt8 (1.15x in 8 frames)
# v4 item 12 walk (references/effects/walk.md): pace → walk name, frames per step (= WALK in src/cast/fx.ts), m/s
WALK_PACES = {"normal": ("subtle_sway", 10, 1.0), "fast": ("bouncy_sway_fast", 8, 1.6), "rush": ("bouncy_sway_rush", 6, 2.2)}
DEFAULT_HEAD_PCT = {"push_in": 24, "close_up": 40.5, "pull_out": 32, "fast_entry": 21.8}
SIDE_X = {"left": -0.5, "right": 0.5, "front": 0.0}


def dist_for_head(pct, fov):
    """Camera distance (m) so that a 0.55 m head is pct % of the frame width (locks.md §2.1)."""
    return HEAD_M / (pct / 100 * 2 * math.tan(math.radians(fov) / 2) * ASPECT_W)


def max_inside(origin, direction, bounds):
    """Largest t so that origin + t * direction stays inside the box bounds {"x": [lo, hi], ...}."""
    t = float("inf")
    for i, axis in enumerate("xyz"):
        lo, hi = bounds[axis]
        if direction[i] > 1e-9:
            t = min(t, (hi - origin[i]) / direction[i])
        elif direction[i] < -1e-9:
            t = min(t, (lo - origin[i]) / direction[i])
    return max(0.3, t)


def norm(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


class Resolver:
    def __init__(self, words, fps):
        self.starts = [round(w["start"] * fps) for w in words]
        self.fps = fps

    def frame(self, a, shot_from=None):
        if isinstance(a, (int, float)):
            return int(a)
        m = re.fullmatch(r"(f|w):(\d+)([+-]\d+)?", a)
        if m:
            base = int(m.group(2)) if m.group(1) == "f" else self.starts[int(m.group(2))]
            return base + int(m.group(3) or 0)
        m = re.fullmatch(r"start([+-]\d+)?", a)
        if m and shot_from is not None:
            return shot_from + int(m.group(1) or 0)
        raise SystemExit(f"bad anchor '{a}' (use f:N, w:N, w:N+k or start+k inside a shot)")


def resolve_point(p, set_data):
    if isinstance(p, str) and p.startswith("mark:"):
        name = p[5:]
        if name not in set_data["marks"]:
            raise SystemExit(f"set {set_data['id']} has no mark '{name}' (marks: {', '.join(set_data['marks'])})")
        return list(set_data["marks"][name])
    return list(p)


def walk_props(w, R, shot_from, shot_end, set_data, fps, label):
    """v4 walk: plan "walk" → (start pos, path, walk steps). Steps are whole; the stop step brings the feet together
    on "to" (half a stride). Returns a warning text when the walk does not finish inside the shot."""
    if w.get("pace", "normal") not in WALK_PACES:
        raise SystemExit(f"{label}: walk pace must be one of {', '.join(WALK_PACES)}")
    name, step, speed = WALK_PACES[w.get("pace", "normal")]
    a, b = resolve_point(w["from"], set_data), resolve_point(w["to"], set_data)
    start = R.frame(w.get("at", "start"), shot_from)
    d = math.dist(a, b)
    stride = speed * step / fps
    if d < 1e-6:
        raise SystemExit(f"{label}: walk 'from' and 'to' are the same point")
    at = lambda k: [round(a[j] + (b[j] - a[j]) * k, 4) for j in range(3)]
    if w.get("stop", True):
        n = max(1, round(d / stride - 0.5))  # n whole steps + the half-stride stop step
        end = start + n * step
        path = {"frames": [start, end, end + step], "points": [a, at(n / (n + 0.5)), b]}
        steps = [[start, name], [end, "stop"]]
        last = end + step
    else:
        path = {"frames": [start, shot_end], "points": [a, at(speed * (shot_end - start) / fps / d)]}
        steps = [[start, name]]
        last = start
    warn = f"{label}: the walk ends at frame {last}, after the shot ({shot_end})" if last > shot_end else None
    return a, path, steps, warn


def preset_move(cam, set_data, index, len_frames, fps):
    p = PRESETS[cam["preset"]]
    fov = cam.get("fov", p["fov"])
    aim = resolve_point(cam["aim"], set_data)
    aim[1] += PARTS[cam.get("part", "head")] if isinstance(cam["aim"], str) else 0
    pct = cam.get("head_pct", DEFAULT_HEAD_PCT[cam["preset"]])
    d0 = dist_for_head(pct, fov)
    # front = the side of the set the camera stands on. A shot may turn it ("front": [0, 0, -1] on the
    # night street films from the shop side across the street: cool facades and sky, no warm shop window)
    front = norm(cam.get("front", set_data.get("front", [0, 0, 1])))
    side = SIDE_X[cam.get("side", "left" if index % 2 else "right")]
    right = norm([front[2], 0, -front[0]])  # horizontal, perpendicular to front
    elev = cam.get("elev", 0.06)
    direction = norm([front[i] + side * right[i] + (elev if i == 1 else 0) for i in range(3)])
    # drift: 0.05 frame widths per second, sideways
    width = 2 * d0 * math.tan(math.radians(fov) / 2) * ASPECT_W
    sign = -1 if side >= 0 else 1
    drift = [sign * 0.05 * width * right[i] for i in range(3)]
    s = 1 if index % 2 else -1
    rate = cam.get("rate", p["rate"])
    if rate > 0:
        # never push a head past the 51 % close-up maximum (locks.md §3): slow down on long shots
        rate = min(rate, (51.0 / pct) ** (fps / len_frames) - 1)
    # keep the camera inside the set (v1 lesson: a camera inside a house). The farthest point of the
    # move is the start for a push-in and the end for a pull-out.
    bounds = set_data.get("camera_bounds")
    if bounds:
        d_max = max_inside(aim, direction, bounds)
        far = d0 if rate >= 0 else d0 / (1 + rate) ** (len_frames / fps)
        if far > d_max:
            shrink = d_max / far
            print(f"  ⚠️ shot {index + 1}: camera would leave the set ({far:.2f} m > {d_max:.2f} m); "
                  f"distance × {shrink:.2f} → subject {pct / shrink:.0f} % instead of {pct:.0f} %")
            d0 *= shrink
            width = 2 * d0 * math.tan(math.radians(fov) / 2) * ASPECT_W
            drift = [sign * 0.05 * width * right[i] for i in range(3)]
    move = {"target": aim, "dir": direction, "d0": round(d0, 3), "fov": fov, "rate": round(rate, 4),
            "drift": [round(x, 4) for x in drift], "roll": cam.get("roll", [s * 0.8, s * 2.0]),
            "lenS": len_frames / fps}
    for k in ("fovStart", "fast"):
        if k in p:
            move[k] = p[k]
    return move


# 2D camera for insert shots: no parallax, so the set rate is the measured rate (~10 %/s push-in)
INSERT_PRESETS = {"push_in": 0.10, "close_up": 0.08, "pull_out": -0.08, "fast_entry": 0.10}


def insert_move(cam, index, len_frames, fps):
    s = 1 if index % 2 else -1
    rate = cam.get("rate", INSERT_PRESETS.get(cam.get("preset", "push_in"), 0.10))
    return {"kind": "2d", "rate": rate, "drift": cam.get("drift", [s * 0.03, 0.0]), "roll": cam.get("roll", [s * 0.4, s * 1.2]),  # less tilt than 3D shots: flat paper shows every degree
            "zoom0": cam.get("zoom0", 1.0), "lenS": len_frames / fps, "d0": "2d", "fov": "2d"}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--plan", default="scene_plan.json")
    ap.add_argument("--out", default="render_props.json")
    a = ap.parse_args()

    vdir = Path(a.video_dir).resolve()
    plan = json.loads((vdir / a.plan).read_text(encoding="utf-8"))
    fps = plan.get("fps", 30)
    dissolve = plan.get("dissolve_frames", 8)
    au = plan.get("audio", {})
    words = json.loads((vdir / au.get("words", "audio/words.json")).read_text(encoding="utf-8"))["words"]
    captions = json.loads((vdir / plan.get("captions", "captions.json")).read_text(encoding="utf-8"))
    mix_json = vdir / au.get("mix_json", "audio/mix.json")
    if mix_json.exists():
        total = json.loads(mix_json.read_text(encoding="utf-8"))["frames"]
    else:
        total = plan.get("frames") or math.ceil((words[-1]["end"] + 0.10) * fps)
    R = Resolver(words, fps)

    shots_in = plan["shots"]
    froms = [R.frame(s["from"]) for s in shots_in]
    if froms[0] != 0 or any(b <= a_ for a_, b in zip(froms, froms[1:])):
        raise SystemExit(f"shot starts must begin at 0 and increase: {froms}")
    shots = []
    for i, s in enumerate(shots_in):
        nxt_dissolve = i + 1 < len(shots_in) and shots_in[i + 1].get("transition_in", "dissolve") == "dissolve"
        end = froms[i + 1] + (dissolve if nxt_dissolve else 0) if i + 1 < len(shots_in) else total
        length = end - froms[i]
        cam = s["camera"]
        insert = None
        if s["set"] == "insert":
            set_data = {"id": "insert", "marks": {}}
            move = insert_move(cam, i, length, fps)
            insert = {"background": s["insert"].get("background", "paper"),
                      "shapes": [dict(sh, at=R.frame(sh.get("at", "start"), froms[i])) for sh in s["insert"]["shapes"]]}
        else:
            set_data = json.loads((SETS / f"{s['set']}.json").read_text(encoding="utf-8"))
            move = dict(cam["move"], lenS=length / fps) if "move" in cam else preset_move(cam, set_data, i, length, fps)
            if cam.get("punch"):
                # v4 item 5: a fast push-in in the middle of the shot, on a word (with the edge lines)
                pu = cam["punch"] if isinstance(cam["punch"], dict) else {"at": cam["punch"]}
                if move.get("fovStart"):
                    raise SystemExit(f"shot {i + 1}: 'punch' does not work with the fast_entry preset (it already has a fast move)")
                move["fast"] = {"dur": pu.get("dur", PUNCH["dur"]), "factor": pu.get("factor", PUNCH["factor"]),
                                "at": round((R.frame(pu["at"], froms[i]) - froms[i]) / fps, 4)}
        actors = []
        for act in s.get("actors", []):
            tracks = {k: {"frames": [R.frame(f, froms[i]) for f, _ in v], "values": [x for _, x in v]}
                      for k, v in act.get("tracks", {}).items()}
            steps = {k: [[R.frame(f, froms[i]) if f != "start" else -10**6, x] for f, x in v]
                     for k, v in act.get("steps", {}).items()}
            out_act = {"who": act["who"], "base": act.get("pose", {}), "tracks": tracks, "steps": steps,
                       "blink": [R.frame(f, froms[i]) for f in act.get("blink", [])]}
            if act.get("walk"):
                if "walk" in steps:
                    raise SystemExit(f"shot {i + 1} {act['who']}: use the actor field 'walk', not a 'walk' step")
                pos, path, steps["walk"], warn = walk_props(act["walk"], R, froms[i], froms[i] + length, set_data, fps,
                                                            f"shot {i + 1} {act['who']}")
                out_act.update(pos=pos, path=path)
                if warn:
                    print("WARN", warn)
            else:
                out_act["pos"] = resolve_point(act["at"], set_data)
            actors.append(out_act)
        shots.append({
            "id": s.get("id", f"s{i + 1:02d}"), "beat": s.get("beat"), "from": froms[i], "len": length,
            "transition_in": None if i == 0 else s.get("transition_in", "dissolve"),
            "set": s["set"], "camera": move, "grade": s.get("grade"), "blur_bg": s.get("blur_bg", 0),
            "extra_warm": s.get("extra_warm", []), "actors": actors,
        })
        if insert:
            shots[-1]["insert"] = insert
        if s.get("lines"):
            # v4 item 5: edge lines over the shot ("lines": "w:6" or {"at": "w:6", "len": 15, "center": [x, y], "n": 18})
            li = s["lines"] if isinstance(s["lines"], dict) else {"at": s["lines"]}
            shots[-1]["lines"] = dict(li, at=R.frame(li["at"], froms[i]))
    lights = {name: {"frames": [R.frame(f) for f, _ in keys], "values": [v for _, v in keys]}
              for name, keys in plan.get("lights", {}).items()}
    audio = au.get("public_path")  # path inside public/ (Remotion staticFile), or null
    props = {"fps": fps, "frames": total, "dissolve": dissolve, "audio": audio, "captions": captions,
             "lights": lights, "shots": shots}
    out = vdir / a.out
    out.write_text(json.dumps(props, indent=1), encoding="utf-8")
    print(f"{out}: {len(shots)} shots, {total} frames ({total / fps:.2f} s), dissolve {dissolve} fr, "
          f"{len(captions)} caption chunks, audio {audio or 'none'}")
    for s in shots:
        print(f"  {s['id']:>4} {s['beat'] or '':<10} from {s['from']:>4} len {s['len']:>3}  {s['set']}  "
              f"d0 {s['camera']['d0']} fov {s['camera']['fov']} rate {s['camera'].get('rate')}  "
              f"actors {[x['who'] for x in s['actors']]}")
    fails = plan_check(shots, total, fps, dissolve, shots_in)
    sys.exit(1 if fails else 0)


def head_pct(move, t):
    """Head size (% of frame width) of the camera's subject at time t (locks.md §2.1)."""
    scale = (1 + move.get("rate", 0.1)) ** t
    if move.get("fast") and not move.get("fovStart"):
        k = min(1.0, max(0.0, (t - move["fast"].get("at", 0)) / move["fast"]["dur"]))
        scale *= 1 + (move["fast"]["factor"] - 1) * (1 - (1 - k) ** 3)
    fov = move["fov"]
    if move.get("fovStart") and move.get("fast"):
        k = min(1.0, t / move["fast"]["dur"])
        fov = move["fov"] + (move["fovStart"] - move["fov"]) * (1 - (1 - (1 - k) ** 3))
    d = move["d0"] / scale
    return HEAD_M / (2 * d * math.tan(math.radians(fov) / 2) * ASPECT_W) * 100


def plan_check(shots, total, fps, dissolve, shots_in):
    """Rules of PLAN.md §5.1 (RULEBOOK §4-5, locks.md §2-3). FAIL blocks the render, WARN = look at it."""
    rows = []

    def add(ok, level, check, detail):
        rows.append(("PASS" if ok else level, check, detail))

    dur = total / fps
    visible = [((shots[i + 1]["from"] if i + 1 < len(shots) else total) - s["from"]) / fps for i, s in enumerate(shots)]
    want = dur / 60 * 20
    add(abs(len(shots) - want) <= max(1.5, 0.25 * want), "WARN", "shot count",
        f"{len(shots)} for {dur:.1f} s (≈ {want:.0f} ± 25 %)")
    short = [f"{s['id']} {v:.2f}s" for s, v in zip(shots, visible) if v < 0.8]
    add(not short, "FAIL", "no shot under 0.8 s", ", ".join(short) or "ok")
    odd = [f"{s['id']} {v:.2f}s" for s, v in zip(shots, visible) if not 1.5 <= v <= 3.5]
    add(len(odd) <= max(1, len(shots) // 5), "WARN", "shots mostly 1.5–3.5 s", ", ".join(odd) or "all inside")
    if len(shots) > 1:
        first = shots[1]["from"] / fps
        add(0.8 <= first <= 2.5, "WARN", "first scene change 0.8–2.5 s", f"{first:.2f} s")
        add(visible[0] <= sorted(visible)[len(visible) // 2] + 0.01, "WARN", "hook shot not longer than the median shot",
            f"{visible[0]:.2f} s")
    cuts = [s for s in shots if s["transition_in"] == "cut"]
    bad_cuts = [s["id"] for s in cuts if (s.get("beat") or "") not in ("reveal", "twist", "ending", "button")]
    add(len(cuts) * 60 / dur <= 2.5, "WARN", "hard cuts ≤ 2 per 60 s", f"{len(cuts)}")
    add(not bad_cuts, "WARN", "hard cuts only on punches (reveal/ending)", ", ".join(bad_cuts) or "ok")
    rates = [s["camera"].get("rate", 0) for s in shots]
    still = [s["id"] for s, r in zip(shots, rates) if abs(r) < 0.03 and not s["camera"].get("drift")]
    add(not still, "FAIL", "every shot moves", ", ".join(still) or "ok")
    push, pull = sum(r > 0 for r in rates), sum(r < 0 for r in rates)
    add(push >= pull, "WARN", "push-in ≥ pull-out (reference ≈ 2 : 1)", f"{push} : {pull}")
    add(bool(shots[0]["camera"].get("fovStart")) or "fast_entry" == shots_in[0].get("camera", {}).get("preset"),
        "WARN", "first shot opens with a fast push-in", "yes" if shots[0]["camera"].get("fovStart") else "no")
    blur = sum(1 for s in shots if s["blur_bg"])
    add(len(shots) < 4 or 0.1 <= blur / len(shots) <= 0.4, "WARN", "~1 shot in 5 with background blur", f"{blur}/{len(shots)}")
    for s in shots:
        for sh in (s.get("insert") or {}).get("shapes", []):
            if sh["type"] == "arrow":
                ys = [sh["from"][1], sh["to"][1]]
            elif sh["type"] in ("rect", "dots"):
                ys = [sh["y"], sh["y"] + sh["h"]]
            else:
                ys = [sh["y"] - sh["r"], sh["y"] + sh["r"]]
            add(not (min(ys) < 1410 and max(ys) > 1290), "WARN", f"{s['id']} insert shape clear of the caption band",
                f"{sh['type']} spans y {min(ys):.0f}–{max(ys):.0f} (captions at 1290–1410)")
        if not s["actors"]:
            continue
        start, end = head_pct(s["camera"], 0), head_pct(s["camera"], s["len"] / fps)
        add(max(start, end) <= 51.5, "FAIL", f"{s['id']} head never past 51 % (close-up max)", f"{start:.0f} → {end:.0f} %")
        add(min(start, end) >= 10.5, "WARN", f"{s['id']} head not smaller than a wide shot (11 %)", f"{start:.0f} → {end:.0f} %")

    order = {"FAIL": 0, "WARN": 1, "PASS": 2}
    icon = {"FAIL": "❌", "WARN": "⚠️", "PASS": "✅"}
    fails = sum(r[0] == "FAIL" for r in rows)
    warns = sum(r[0] == "WARN" for r in rows)
    print(f"\nPlan check: {'FAIL' if fails else ('PASS with warnings' if warns else 'PASS')} — {fails} fail · {warns} warn")
    for lvl, check, detail in sorted(rows, key=lambda r: order[r[0]]):
        print(f"  {icon[lvl]} {check}: {detail}")
    return fails


if __name__ == "__main__":
    main()
