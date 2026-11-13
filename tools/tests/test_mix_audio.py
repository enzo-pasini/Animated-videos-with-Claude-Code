"""Test for tools/mix_audio.py. Run from the project root (after tools/tests/test_voice_words.py,
which makes out/tests/voice_exact):
  .venv/Scripts/python -I tools/tests/test_mix_audio.py

Makes a synthetic music tone (no licensed track needed), mixes it under the test voice and checks:
-14 +-0.5 LUFS, true peak <= -2 dBTP (+0.2 tolerance), length = whole frames after the last word,
and that the music gain follows the formula (voice LUFS - 20 dB - raw music LUFS). Sound effects (--no-music +
an sfx plan): woosh 1/2 alternation, anchor frames, hit on the anchor, default levels, refusals. It does not
listen to the result: the ducking and the balance still need an ear check on a real voice.
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VDIR = ROOT / "out" / "tests" / "voice_exact"
TONE = ROOT / "out" / "tests" / "music" / "test_tone.wav"


def mix(plan, *extra, shots=()):
    """Run mix_audio.py --no-music with an sfx plan; returns (exit code, mix.json or None, output)."""
    p = ROOT / "out" / "tests" / "music" / "sfx_plan.json"
    p.write_text(json.dumps({"sfx": plan, "shots": list(shots)}), encoding="utf-8")
    (VDIR / "audio/mix.json").unlink(missing_ok=True)
    r = subprocess.run([sys.executable, "-I", str(ROOT / "tools/mix_audio.py"), str(VDIR), "--no-music",
                        "--sfx-plan", str(p), *extra], capture_output=True, text=True, encoding="utf-8", cwd=ROOT)
    j = VDIR / "audio/mix.json"
    return r.returncode, json.loads(j.read_text(encoding="utf-8")) if j.exists() else None, r.stdout + r.stderr


def sfx_checks(words):
    """Sound effects (needs the user's files in assets/sound-effects/; skipped without them)."""
    if not (ROOT / "assets/sound-effects/woosh_1.mp3").exists():
        print("SKIP  sound effects: assets/sound-effects/ is empty (the files are git-ignored)")
        return []
    plan = [{"at": "w:3", "sound": "woosh"}, {"at": "w:1+2", "sound": "woosh"}, {"at": "w:5", "sound": "click"},
            {"at": "f:10", "sound": "woosh"}]
    code, info, out = mix(plan)
    cues = info["sfx"] if info else []
    starts = [round(w["start"] * 30) for w in words]
    loud_code, _, _ = mix([{"at": "w:1", "sound": "woosh", "gain_db": 7}])  # -6 + 7 - 3 = -2 dB: covers words
    bad_code, _, _ = mix([{"at": "w:1", "sound": "trumpet"}])
    # click (the user's rules): one file per shot; the main click, and after 3 scenes in a row with it, one scene with
    # the pop. 5 shots with clicks (shot 1 has two) → main, main, main, main, pop, main; the pop is boosted +6 dB
    _, shot_info, _ = mix([{"at": a, "sound": "click"} for a in ("f:1", "f:3", "w:2", "w:3", "w:4", "w:5")],
                          shots=[{"from": "f:0"}] + [{"from": f"w:{i}"} for i in (2, 3, 4, 5)])
    per_shot = [c["file"] for c in shot_info["sfx"]] if shot_info else []
    pop_rel = [c["rel_db"] for c in shot_info["sfx"] if c["file"].startswith("button")] if shot_info else []
    click_files = ["scribblenauts-button-click.mp3", "button-click-pop-2-sound-effect.mp3"]
    shot_code, _, _ = mix([{"at": "start+3", "sound": "click"}])
    return [
        ("sfx: no-music mix exits 0 and keeps -14 ±0.5 LUFS", code == 0 and abs(info["result_lufs"] + 14) <= 0.5),
        ("sfx: no music in mix.json", info is not None and info["music"] is None),
        ("sfx: woosh alternates 1/2 in time order", [c["file"] for c in cues if c["sound"] == "woosh"]
         == ["woosh_1.mp3", "woosh_2.mp3", "woosh_1.mp3"]),
        ("sfx: anchors = build_props frames (w:1+2)", any(c["at"] == "w:1+2" and c["frame"] == starts[1] + 2 for c in cues)),
        ("sfx: the hit lands on the anchor (start + hit = frame)",
         all(abs(c["start_s"] + c["hit_s"] - c["frame"] / 30) < 0.002 for c in cues)),
        ("sfx: default levels (woosh -9, click -15 vs the voice: single-test level - 3 dB)",
         {c["sound"]: c["rel_db"] for c in cues} == {"woosh": -9.0, "click": -15.0}),
        ("sfx: refuses a sound louder than -3 dB under the voice", loud_code != 0),
        ("sfx: refuses an unknown sound", bad_code != 0),
        ("sfx: click = one file per shot, the pop after 3 scenes in a row with the main click",
         per_shot == [click_files[0]] * 4 + [click_files[1], click_files[0]]),
        ("sfx: the pop is boosted +6 dB and not lowered by the -3 dB (quiet by nature)", pop_rel == [-6.0]),
        ("sfx: refuses a shot anchor (start+k)", shot_code != 0),
    ]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if not (VDIR / "audio" / "words.json").exists():
        raise SystemExit("run tools/tests/test_voice_words.py first (it makes out/tests/voice_exact)")
    TONE.parent.mkdir(parents=True, exist_ok=True)
    expr = ("0.25*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*2*t))+0.18*sin(2*PI*277.2*t)+0.18*sin(2*PI*329.6*t)|"
            "0.25*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*2*t+1))+0.18*sin(2*PI*277.2*t)+0.15*sin(2*PI*440*t)")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "lavfi", "-i", f"aevalsrc={expr}:s=48000:d=30",
                    "-c:a", "pcm_s16le", str(TONE)], check=True)
    r = subprocess.run([sys.executable, "-I", str(ROOT / "tools/mix_audio.py"), str(VDIR), "--music", str(TONE)],
                       capture_output=True, text=True, encoding="utf-8", cwd=ROOT)
    info = json.loads((VDIR / "audio/mix.json").read_text(encoding="utf-8"))
    words = json.loads((VDIR / "audio/words.json").read_text(encoding="utf-8"))["words"]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                "default=nw=1:nk=1", str(VDIR / "audio/mix.wav")], capture_output=True, text=True).stdout)
    checks = [
        ("tool exits 0", r.returncode == 0),
        ("integrated loudness -14 ±0.5 LUFS", abs(info["result_lufs"] + 14) <= 0.5),
        ("true peak ≤ -1.8 dBTP", info["result_true_peak_dbtp"] <= -1.8),
        ("length = whole frames after the last word", info["frames"] == math.ceil((words[-1]["end"] + 0.10) * 30)
         and abs(dur - info["frames"] / 30) < 0.03),
        ("music gain = voice - 20 dB - raw music", abs(info["music_gain_db"] - (info["voice_lufs"] - 20 - info["music_lufs_raw"])) < 0.05),
    ]
    checks += sfx_checks(words)
    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    if failed:
        print(r.stdout[-2000:], r.stderr[-2000:])
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
