"""Tests for tools/voice_words.py (needs the GPU and the Windows test voice; ~2 min).
Run from the project root:
  .venv/Scripts/python -I tools/tests/test_voice_words.py

Case 1: the voice says the script exactly -> every word heard, first word at 0, no negative tail.
Case 2: the voice says "ship" instead of "boat" and drops the last word "again." -> "boat" is
fuzzy, "again." is not heard (times estimated inside the file), and the report warns.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIX = ROOT / "tools" / "tests" / "voice_words"
OUT = ROOT / "out" / "tests"
PY = [sys.executable, "-I"]


def run_case(name, voice_text):
    vdir = OUT / name
    shutil.rmtree(vdir, ignore_errors=True)
    (vdir / "audio").mkdir(parents=True)
    shutil.copy(FIX / "script.md", vdir / "script.md")
    (vdir / "voice_text.txt").write_text(voice_text, encoding="utf-8")
    subprocess.run(PY + [str(ROOT / "tools/make_test_voice.py"), str(vdir / "voice_text.txt"),
                         str(vdir / "audio/voice_raw.wav"), "--rate", "3"], check=True, capture_output=True)
    r = subprocess.run(PY + [str(ROOT / "tools/voice_words.py"), str(vdir)], capture_output=True, text=True,
                       encoding="utf-8", cwd=ROOT)
    words = json.loads((vdir / "audio/words.json").read_text(encoding="utf-8"))
    return r, words, (vdir / "audio/pace.md").read_text(encoding="utf-8")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    text = (FIX / "voice_text.txt").read_text(encoding="utf-8")
    checks = []

    r, d, pace = run_case("voice_exact", text)
    w = d["words"]
    checks += [
        ("exact: tool exits 0", r.returncode == 0),
        ("exact: every word heard", all(x["match"] != "interpolated" for x in w)),
        ("exact: first word at ≤ 0.08 s", w[0]["start"] <= 0.08),
        ("exact: last word ends inside the file", w[-1]["end"] <= d["duration"] + 0.05),
        ("exact: times never go backwards", all(a["start"] <= b["start"] for a, b in zip(w, w[1:]))),
    ]

    r, d, pace = run_case("voice_changed", text.replace("Every boat", "Every ship").replace("laughed again.", "laughed."))
    by = {x["w"]: x for x in d["words"]}
    checks += [
        ("changed: 'boat' is fuzzy (heard 'ship')", by["boat"]["match"] == "fuzzy" and "ship" in by["boat"]["heard"]),
        ("changed: 'again.' not heard", by["again."]["match"] == "interpolated"),
        ("changed: estimated word stays inside the file", by["again."]["end"] <= d["duration"] + 0.05),
        ("changed: report warns", "doesn't say every script word" in pace),
    ]

    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
