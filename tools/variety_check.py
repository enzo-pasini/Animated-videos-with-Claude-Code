"""Variety check against the channel log (PLAN §6: no "mass-produced" look), and the log itself.

Usage (from the project root):
  python -I tools/variety_check.py videos/<slug>          # check the plan vs the last videos
  python -I tools/variety_check.py videos/<slug> --log    # add/update this video in channel/log.json (step 11)
  python -I tools/variety_check.py --summary              # step 1 (no plan yet): what the last videos used

Reads scene_plan.json, script.md (format line: hook, you-see, ending, pov), src/cast/cast_meta.json,
src/world/sets/<set>.json (light_preset) and channel/log.json.
Checks (FAIL blocks A2, WARN = look at it):
- main character is new (D9) — FAIL if it was the main character in any logged video;
  WARN if its silhouette item or main color repeats one of the last 5;
- at least 2 places (sets) in the video; no set in 3+ of the last 5 videos unless re-dressed
  (plan "redress": ["<set>", ...]);
- light sequence and camera sequence differ from the last 3 videos;
- hook type, "you see" position, ending, POV: at least 2 of 4 differ from the last video, and the
  hook type is not the same 3 times in a row;
- title not too close to a logged title.
"""
import argparse
import datetime
import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "channel" / "log.json"
LIGHT = {"nightExterior": "C", "warmInterior": "W", "dayExterior": "W"}


def hex_rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def color_close(a, b, limit=60):
    return sum((x - y) ** 2 for x, y in zip(hex_rgb(a), hex_rgb(b))) ** 0.5 < limit


def describe(vdir):
    plan = json.loads((vdir / "scene_plan.json").read_text(encoding="utf-8"))
    meta = json.loads((ROOT / "src/cast/cast_meta.json").read_text(encoding="utf-8"))
    script = (vdir / "script.md").read_text(encoding="utf-8") if (vdir / "script.md").exists() else ""
    title = next((l[2:].strip() for l in script.splitlines() if l.startswith("# ")), plan.get("id", vdir.name))
    fmt = {}
    for l in script.splitlines():
        if l.startswith("format:"):
            for part in l.split("·"):
                if ":" in part:
                    k, v = part.split(":", 1)
                    fmt[k.strip()] = v.strip()
    shots = plan["shots"]
    sets = [s["set"] for s in shots if s["set"] != "insert"]
    light = ""
    for s in shots:
        if s["set"] == "insert":
            light += "-"
        else:
            sd = json.loads((ROOT / f"src/world/sets/{s['set']}.json").read_text(encoding="utf-8"))
            light += LIGHT.get(sd.get("light_preset", ""), "?")
    cast = []
    for s in shots:
        for a in s.get("actors", []):
            if a["who"] not in cast:
                cast.append(a["who"])
    main = cast[0] if cast else None
    m = meta.get(main, {}) if main else {}
    camera = [s["camera"].get("preset", "raw") for s in shots]
    words, duration, music = None, None, None
    if (vdir / "audio/words.json").exists():
        ws = json.loads((vdir / "audio/words.json").read_text(encoding="utf-8"))["words"]
        words, duration = len(ws), round(ws[-1]["end"], 2)
    if (vdir / "audio/mix.json").exists():
        mix = json.loads((vdir / "audio/mix.json").read_text(encoding="utf-8"))
        music, duration = mix.get("music"), mix.get("duration_s", duration)
    return {
        "slug": vdir.name, "title": title, "format": fmt.get("format", plan.get("format", "explainer")),
        "sets": sorted(set(sets)), "redress": plan.get("redress", []), "cast": cast, "main_character": main,
        "silhouette": m.get("silhouette"), "main_color": m.get("mainColor"),
        "light_seq": light, "camera_seq": "/".join(camera),
        "hook": fmt.get("hook"), "you_see": fmt.get("you-see"), "ending": fmt.get("ending"), "pov": fmt.get("pov"),
        "words": words, "duration_s": duration, "music": music,
    }


def summary(log):
    """Step 1 (ideas, no plan yet): what the last videos used, and what a new idea should avoid."""
    past = log["videos"]
    print(f"# Channel log summary — {len(past)} videos")
    if not past:
        print()
        print("The log is empty: nothing to avoid yet (the pipeline test is not logged).")
        return
    print()
    print("| date | title | hook | you-see | ending | pov | main | silhouette | color | sets | light |")
    print("|---|---|---|---|---|---|---|---|---|---|---|")
    for v in past[-10:]:
        print(f"| {v.get('date', '')} | {v['title']} | {v.get('hook')} | {v.get('you_see')} | {v.get('ending')} | {v.get('pov')} "
              f"| {v.get('main_character')} | {v.get('silhouette')} | {v.get('main_color')} | {', '.join(v.get('sets', []))} "
              f"| {v.get('light_seq')} |")
    last5, last = past[-5:], past[-1]
    hooks = [v.get("hook") for v in past[-2:]]
    sets = {}
    for v in last5:
        for s in v.get("sets", []):
            sets[s] = sets.get(s, 0) + 1
    print()
    print("**A new idea should avoid:**")
    if len(hooks) == 2 and hooks[0] == hooks[1]:
        print(f"- hook type `{hooks[0]}` (used twice in a row)")
    print(f"- the same structure as the last video (hook `{last.get('hook')}`, you-see `{last.get('you_see')}`, "
          f"ending `{last.get('ending')}`, pov `{last.get('pov')}`): change at least 2 of the 4")
    print(f"- main characters already used: {', '.join(sorted({v['main_character'] for v in past if v.get('main_character')}))} (D9)")
    looks = "; ".join(f"{v.get('silhouette')} {v.get('main_color')}" for v in last5)
    print(f"- silhouettes / colors of the last 5: {looks}")
    over = [s for s, n in sets.items() if n >= 3]
    if over:
        print(f"- sets in 3+ of the last 5 (re-dress them or pick others): {', '.join(over)}")
    print(f"- topics and titles: {'; '.join(v['title'] for v in past)}")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir", nargs="?")
    ap.add_argument("--log", action="store_true")
    ap.add_argument("--log-file", help="another log file (tests)")
    ap.add_argument("--summary", action="store_true", help="step 1: summarize the log, no video needed")
    a = ap.parse_args()
    log_path = Path(a.log_file) if a.log_file else LOG
    if a.summary or not a.video_dir:
        summary(json.loads(log_path.read_text(encoding="utf-8")) if log_path.exists() else {"videos": []})
        return
    vdir = Path(a.video_dir).resolve()
    me = describe(vdir)
    log = json.loads(log_path.read_text(encoding="utf-8")) if log_path.exists() else {"videos": []}
    past = [v for v in log["videos"] if v["slug"] != me["slug"]]
    last5, last3, last = past[-5:], past[-3:], (past[-1] if past else None)

    rows = []

    def add(ok, level, check, detail):
        rows.append(("PASS" if ok else level, check, detail))

    if me["main_character"]:
        used = [v["slug"] for v in past if v.get("main_character") == me["main_character"]]
        add(not used, "FAIL", "main character is new (D9)", f"{me['main_character']}" + (f" was main in {used}" if used else ""))
        sil = [v["slug"] for v in last5 if v.get("silhouette") and v["silhouette"] == me["silhouette"]]
        add(not sil, "WARN", "silhouette item differs from the last 5", f"{me['silhouette']}" + (f" = {sil}" if sil else ""))
        col = [v["slug"] for v in last5 if v.get("main_color") and me["main_color"] and color_close(v["main_color"], me["main_color"])]
        add(not col, "WARN", "main color differs from the last 5", f"{me['main_color']}" + (f" ≈ {col}" if col else ""))
    else:
        add(False, "WARN", "main character", "no character in the plan")
    add(len(me["sets"]) >= 2, "WARN", "at least 2 places", ", ".join(me["sets"]) or "none")
    for st in me["sets"]:
        n = sum(1 for v in last5 if st in v.get("sets", []))
        add(n < 3 or st in me["redress"], "WARN", f"set '{st}' not overused", f"in {n} of the last 5" + (" (re-dressed)" if st in me["redress"] else ""))
    same_light = [v["slug"] for v in last3 if v.get("light_seq") == me["light_seq"]]
    add(not same_light, "WARN", "light sequence differs from the last 3", f"{me['light_seq']}" + (f" = {same_light}" if same_light else ""))
    same_cam = [v["slug"] for v in last3 if v.get("camera_seq") == me["camera_seq"]]
    add(not same_cam, "WARN", "camera sequence differs from the last 3", "ok" if not same_cam else f"= {same_cam}")
    if last:
        diff = sum(1 for k in ("hook", "you_see", "ending", "pov") if me.get(k) != last.get(k))
        add(diff >= 2, "WARN", "structure differs from the last video (2 of 4)",
            f"{diff} of 4 differ (hook {me['hook']}, you-see {me['you_see']}, ending {me['ending']}, pov {me['pov']})")
    hooks = [v.get("hook") for v in past[-2:]]
    add(not (len(hooks) == 2 and all(h == me["hook"] for h in hooks)), "WARN", "hook type not 3 times in a row", f"{me['hook']}")
    close = max(((difflib.SequenceMatcher(None, me["title"].lower(), v["title"].lower()).ratio(), v["title"]) for v in past),
                default=(0, ""))
    add(close[0] < 0.6, "WARN", "title differs from logged titles", f"closest “{close[1]}” ({close[0]:.2f})" if close[1] else "no past videos")

    order = {"FAIL": 0, "WARN": 1, "PASS": 2}
    icon = {"FAIL": "❌", "WARN": "⚠️", "PASS": "✅"}
    fails = sum(r[0] == "FAIL" for r in rows)
    warns = sum(r[0] == "WARN" for r in rows)
    print(f"# Variety check — {me['title']} ({len(past)} videos in the log)")
    print(f"**{'FAIL' if fails else ('PASS with warnings' if warns else 'PASS')}** — {fails} fail · {warns} warn\n")
    for lvl, check, detail in sorted(rows, key=lambda r: order[r[0]]):
        print(f"- {icon[lvl]} {check}: {detail}")

    if a.log:
        entry = dict(me, date=datetime.date.today().isoformat())
        log["videos"] = past + [entry]
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text(json.dumps(log, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nlogged → {log_path} ({len(log['videos'])} videos)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
