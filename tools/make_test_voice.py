"""Make a TEST voice with the free Windows text-to-speech (decision D6). Not for real videos.

Usage (from the project root):
  python -I tools/make_test_voice.py <voice_text.txt> <out.wav> [--voice "Microsoft David Desktop"] [--rate 2]

voice_text.txt: the ElevenLabs-style text (numbers as words). Lines starting with '#' are notes
and are skipped. --rate is the System.Speech rate (-10 slow .. 10 fast; 0 = normal).
"""
import argparse
import subprocess
import sys
from pathlib import Path


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("text_file")
    ap.add_argument("out_wav")
    ap.add_argument("--voice", default="Microsoft David Desktop")
    ap.add_argument("--rate", type=int, default=2)
    a = ap.parse_args()

    lines = [l.strip() for l in Path(a.text_file).read_text(encoding="utf-8").splitlines()]
    text = " ".join(l for l in lines if l and not l.startswith("#"))
    out = Path(a.out_wav).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".txt.tmp")
    tmp.write_text(text, encoding="utf-8")  # passed by file: avoids quoting problems in PowerShell
    ps = (
        "Add-Type -AssemblyName System.Speech; "
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        f"$s.SelectVoice('{a.voice}'); $s.Rate = {a.rate}; "
        f"$s.SetOutputToWaveFile('{out}'); "
        f"$s.Speak([IO.File]::ReadAllText('{tmp}', [Text.Encoding]::UTF8)); $s.Dispose()"
    )
    subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], check=True)
    tmp.unlink()
    print(f"test voice: {out} ({len(text.split())} words, voice {a.voice}, rate {a.rate})")


if __name__ == "__main__":
    main()
