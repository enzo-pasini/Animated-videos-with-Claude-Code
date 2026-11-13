"""Make the narrator voice with Kokoro-82M (PLAN D20): videos/<slug>/voice_text.txt -> audio/voice_raw.wav.

Usage (from the project root; runs in the separate Python 3.12 venv, see PLAN D20):
  .venv-tts/Scripts/python -I tools/tts_kokoro.py videos/<slug> [--voice af_heart] [--out FILE]

- voice_text.txt: lines starting with '#' are notes and are skipped; the rest is read as ONE paragraph
  (Kokoro makes its own pauses at the punctuation).
- Words that are not in Kokoro's dictionary (rare names) would be SKIPPED silently. The tool lists them
  and stops (exit 1). Fix: write the pronunciation in voice_text.txt, e.g. [Broughton](/bɹˈɔtən/)
  (misaki phonemes; captions are not affected, they use script.md).
- espeak-ng / phonemizer (GPL) are not installed on purpose (D20): a stub stands in for misaki.espeak.
- Same voice every time: fixed voice id + speed 1.0. The pace goes to 3.5 w/s later with
  voice_words.py --tempo X (D18); af_heart is ~3.4 w/s raw, so X is about 1.03.
Then: .venv/Scripts/python -I tools/voice_words.py videos/<slug>
"""
import argparse
import re
import sys
import types
from pathlib import Path

VOICE = "af_heart"  # D20: the channel narrator (Kokoro American English female, grade A)
SPEED = 1.0
SR = 24000

stub = types.ModuleType("misaki.espeak")


class _NoEspeak:
    def __init__(self, *a, **k):
        raise RuntimeError("espeak-ng not installed (by choice, PLAN D20)")


stub.EspeakFallback = stub.EspeakG2P = _NoEspeak
sys.modules["misaki.espeak"] = stub

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from kokoro import KPipeline  # noqa: E402


def read_text(path):
    lines = [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip() and not ln.lstrip().startswith("#")]
    return " ".join(" ".join(lines).split())


def unknown_words(pipe, text):
    _, tokens = pipe.g2p(text)
    return [t.text for t in tokens if re.search(r"[A-Za-z]", t.text) and not t.phonemes]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--voice", default=VOICE)
    ap.add_argument("--out")
    a = ap.parse_args()
    vdir = Path(a.video_dir)
    text = read_text(vdir / "voice_text.txt")
    pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    unk = unknown_words(pipe, text)
    if unk:
        print("NOT in Kokoro's dictionary (would be skipped): " + ", ".join(sorted(set(unk))))
        print("Write the pronunciation in voice_text.txt, e.g. [Broughton](/bɹˈɔtən/), then run again.")
        sys.exit(1)
    audio = np.concatenate([r.audio.numpy() for r in pipe(text, voice=a.voice, speed=SPEED, split_pattern=r"\n+")])
    out = Path(a.out) if a.out else vdir / "audio" / "voice_raw.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, audio, SR)
    print(f"{a.voice}: {len(audio) / SR:.2f} s -> {out}")


if __name__ == "__main__":
    main()
