"""Test for tools/make_captions.py + the Captions component. Run from the project root after
tools/tests/test_voice_words.py and test_mix_audio.py (they make out/tests/voice_exact):
  .venv/Scripts/python -I tools/tests/test_captions.py

1. make_captions.py on the test voice: chunks are 1-2 words (3 at most), never cross a sentence end
   inside a chunk, start on frame 0, strictly increasing frames.
   Phrase rule (unit cases): no chunk crosses into a new phrase ("night | into"), subject | verb,
   "so | its vapor", a pause breaks a glue, short flashes join the previous word ("cold night").
2. Renders the CaptionTest composition with those chunks and finds every caption change in the
   video with the same detector check_render.py uses: each must be within +-1 frame.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from check_render import caption_changes, caption_masks  # noqa: E402
from make_captions import chunk  # noqa: E402

VDIR = ROOT / "out" / "tests" / "voice_exact"
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


def timed(text, gaps):
    """Words with start times from per-word durations (s); each word ends 0.02 s before the next."""
    out, t = [], 0.0
    for w, d in zip(text.split(), gaps):
        out.append({"w": w, "start": round(t, 3), "end": round(t + d - 0.02, 3)})
        t += d
    return out


def phrase_checks():
    texts = lambda ch: [c["text"] for c in ch]  # noqa: E731
    a = texts(chunk(timed("Mira walks from the cold night into the warm workshop,", [.18, .22, .14, .08, .18, .14, .16, .12, .16, .5])))
    b = texts(chunk(timed("Then she walks home.", [.3, .3, .3, .4])))
    c = texts(chunk(timed("So its vapor turns.", [.4, .12, .2, .4])))
    d_words = timed("Look in the box.", [.3, .4, .2, .4])  # "in" ends 0.25 s before "the": a pause
    d_words[1]["end"] = d_words[1]["start"] + 0.15
    d = texts(chunk(d_words))
    return [
        (f"no chunk crosses into a new phrase: {' | '.join(a)}", not any("night into" in x for x in a)),
        ("a short word joins the previous word of its phrase (cold night)", "cold night" in a),
        (f"subject | verb: {' | '.join(b)}", not any("she walks" in x for x in b)),
        (f"conjunction | determiner + noun: {' | '.join(c)}", c[:2] == ["So", "its vapor"]),
        (f"a pause breaks a glue: {' | '.join(d)}", "in the" not in d),
    ]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    subprocess.run([sys.executable, "-I", str(ROOT / "tools/make_captions.py"), str(VDIR)], check=True,
                   capture_output=True)
    chunks = json.loads((VDIR / "captions.json").read_text(encoding="utf-8"))
    frames = json.loads((VDIR / "audio/mix.json").read_text(encoding="utf-8"))["frames"]
    sizes = [len(c["text"].split()) for c in chunks]
    starts = [c["start"] for c in chunks]
    checks = [
        ("chunks have 1–3 words", all(1 <= s <= 3 for s in sizes)),
        ("no sentence end inside a chunk", all(not re.search(r"[.!?]\s", c["text"]) for c in chunks)),
        ("first chunk on frame 0", starts[0] == 0),
        ("frames strictly increasing", all(a < b for a, b in zip(starts, starts[1:]))),
    ] + phrase_checks()

    props = VDIR / "caption_test_props.json"
    props.write_text(json.dumps({"chunks": chunks, "frames": frames}), encoding="utf-8")
    video = VDIR / "caption_test.mp4"
    subprocess.run([NPX, "remotion", "render", "CaptionTest", str(video), f"--props={props}", "--crf=16",
                    "--log=error"], cwd=ROOT, check=True, stdin=subprocess.DEVNULL)
    seen = caption_changes(caption_masks(video))
    errs = [min(abs(s - f) for s in seen) if seen else 999 for f in starts[1:]]
    extra = [s for s in seen if min(abs(s - f) for f in starts[1:]) > 1]
    checks += [
        (f"every caption change within ±1 frame (worst {max(errs) if errs else 0})", all(e <= 1 for e in errs)),
        ("no unexpected caption changes", not extra),
    ]
    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
