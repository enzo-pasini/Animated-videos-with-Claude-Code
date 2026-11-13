"""Test for tools/variety_check.py (uses a temporary log, never channel/log.json). Run from the project root:
  .venv/Scripts/python -I tools/tests/test_variety.py
A video checked against an empty log passes; logging it and checking an identical copy fails (D9: the
main character must be new) and warns about the repeated structure; --summary (step 1) lists the log.
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
T = ROOT / "out" / "tests" / "variety"
PY = [sys.executable, "-I", str(ROOT / "tools/variety_check.py")]
SCRIPT = "# The Cook Who Cried\nformat: explainer · target: 45 s · pov: third · hook: strange-act · you-see: late · ending: button\n\n## Script\n[hook] x\n"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    shutil.rmtree(T, ignore_errors=True)
    plan = (ROOT / "tools/tests/insert_plan/scene_plan.json").read_text(encoding="utf-8")
    plan = plan.replace('"../bram_plan/', '"../../../../tools/tests/bram_plan/')
    for name in ("a", "b"):
        (T / name).mkdir(parents=True)
        (T / name / "scene_plan.json").write_text(plan, encoding="utf-8")
        (T / name / "script.md").write_text(SCRIPT, encoding="utf-8")
    log = T / "log.json"
    real_log = ROOT / "channel/log.json"
    real_before = real_log.read_bytes() if real_log.exists() else None  # the test must never write to it
    run =lambda *args: subprocess.run(PY + [*map(str, args), "--log-file", str(log)], capture_output=True, text=True,
                                       encoding="utf-8", cwd=ROOT)
    r1 = run(T / "a", "--log")
    r2 = run(T / "b")
    r3 = run("--summary")
    checks = [
        ("--summary (step 1, no plan) lists the logged video and what to avoid",
         r3.returncode == 0 and "The Cook Who Cried" in r3.stdout and "main characters already used: mira" in r3.stdout),
        ("first video passes and is logged", r1.returncode == 0 and log.exists()),
        ("identical second video fails on the main character (D9)", r2.returncode == 1 and "main character is new" in r2.stdout),
        ("identical structure is flagged", "0 of 4 differ" in r2.stdout),
        ("real channel log untouched", (real_log.read_bytes() if real_log.exists() else None) == real_before),
    ]
    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
