"""Tests for tools/script_check.py. Run from the project root:
  .venv/Scripts/python -I tools/tests/test_script_check.py
"""
import glob
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOOL = ROOT / "tools" / "script_check.py"
FIX = ROOT / "tools" / "tests" / "script_check"

CASES = [
    # (name, args, expected exit code, text(s) that must appear in the output)
    ("good script passes", [FIX / "good/script.md"], 0, "Verdict: PASS"),
    ("copied 5-gram and title fail", [FIX / "copied/script.md", "--facts", FIX / "good/facts.md"], 1,
     "impossible to get fired in"),
    ("good hook: result early, no scene opener", [FIX / "good/script.md"], 0,
     ["✅ PASS | strange result in the first 8 words", "✅ PASS | hook doesn't open by setting the scene"]),
    ("'one swallow' counts as the hook's concrete detail (script from the skill test run)", [FIX / "one_detail/script.md"], 0,
     ["✅ PASS | hook has a concrete detail", "— 0 fail ·"]),
    ("a 14-word hook only warns (length depends on the script)", [FIX / "good/script.md"], 0,
     "⚠️ WARN | hook first sentence length | 14 words"),
    ("late hook fails (result after word 8) and warns (scene opener)",
     [FIX / "late_hook/script.md", "--facts", FIX / "good/facts.md"], 1,
     ["❌ FAIL | strange result in the first 8 words | “cracks in half” ends at word 14",
      "⚠️ WARN | hook doesn't open by setting the scene | starts with “Every winter”"]),
]

# Scene-opener hint (SCENE_OPENER): setup-first hooks must match, result-first hooks must not.
SETUP_FIRST = [
    "Every winter, Theo carries hot tea outside, and the glass cracks.",
    "Last winter, Theo's tea glass cracked in half.",
    "On a cold night, Mira opened the shop door and went blind.",
    "Mira opens the shop door and instantly goes blind.",
    "After a long walk in the snow, Mira went blind.",
    "Picture a baker at four in the morning.",
    "One cold morning, a baker found her bread frozen.",
    "In a small town, a clock ran backwards.",
    "Meet Bram, a sailor with one strange habit.",
]
RESULT_FIRST = [
    "She went blind the second she walked through the door.",
    "Your glasses can betray you in under one second.",
    "When glass gets hot on one side, it snaps.",
    "This is the only fish that drowns in water.",
    "In Japan, it's illegal to let your tea glass crack.",
    "Once a year, the river runs backwards for one hour.",
]


def opener_cases():
    """(name, ok) for the scene-opener samples and for the 20 reference hooks (none may match)."""
    sys.path.insert(0, str(ROOT / "tools"))
    from script_check import SCENE_OPENER
    out = [(f"setup-first matches: {h}", bool(SCENE_OPENER.match(h))) for h in SETUP_FIRST]
    out += [(f"result-first doesn't match: {h}", not SCENE_OPENER.match(h)) for h in RESULT_FIRST]
    n_words = {v["id"]: v["hook_words"] for v in
               json.loads((ROOT / "references/analysis/beat_timing.json").read_text(encoding="utf-8"))}
    for f in sorted(glob.glob(str(ROOT / "references/transcripts/*.json"))):
        j = json.loads(Path(f).read_text(encoding="utf-8"))
        h = " ".join(w["w"] for w in j["words"][:n_words[j["id"]]])
        h = h[:1].upper() + h[1:]
        out.append((f"reference hook doesn't match: {h}", not SCENE_OPENER.match(h)))
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    failed = 0
    for name, args, code, must in CASES:
        r = subprocess.run([sys.executable, "-I", str(TOOL), *map(str, args)], capture_output=True, text=True,
                           encoding="utf-8", cwd=ROOT)
        musts = [must] if isinstance(must, str) else must
        ok = r.returncode == code and all(m in r.stdout for m in musts)
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}  (exit {r.returncode}, expected {code})")
        if not ok:
            print(r.stdout[-1500:], r.stderr[-1500:])
    for name, ok in opener_cases():
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
