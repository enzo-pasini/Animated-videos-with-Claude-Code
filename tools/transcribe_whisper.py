"""Fallback transcription with faster-whisper on the GPU (for videos without YouTube captions).

Usage: python -I tools/transcribe_whisper.py <references_dir> [--model large-v3-turbo]
                                              [--only ID ...] [--out DIR] [--force]

Transcribes <references>/videos/<id>.mp4 that have no <out>/<id>.json yet
(use --force to redo). Writes the same format as captions_to_transcript.py:
    <out>/<id>.json  (word-level start/end)   <out>/<id>.txt
Default <out> is <references>/transcripts.
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


def add_cuda_dlls():
    """On Windows, point the DLL loader at the pip-installed cuBLAS / cuDNN."""
    if os.name != "nt":
        return
    nvidia = Path(sys.prefix) / "Lib" / "site-packages" / "nvidia"
    for sub in ("cublas", "cudnn"):
        bin_dir = nvidia / sub / "bin"
        if bin_dir.is_dir():
            os.add_dll_directory(str(bin_dir))
            os.environ["PATH"] = str(bin_dir) + os.pathsep + os.environ["PATH"]


add_cuda_dlls()
import numpy as np  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402  (needs the DLL paths first)


def load_audio(path, sr=16000):
    """Decode to 16 kHz mono float32 with ffmpeg (avoids faster-whisper's PyAV version issues)."""
    r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-vn", "-ac", "1",
                        "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32)


def fmt(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:05.2f}"


def file_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 3)
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("references")
    ap.add_argument("--model", default="large-v3-turbo")
    ap.add_argument("--compute-type", default="float16")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--out")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    ref = Path(args.references)
    out = Path(args.out) if args.out else ref / "transcripts"
    out.mkdir(parents=True, exist_ok=True)

    videos = sorted((ref / "videos").glob("*.mp4"))
    if args.only:
        videos = [v for v in videos if v.stem in args.only]
    todo = [v for v in videos if args.force or not (out / f"{v.stem}.json").exists()]
    if not todo:
        print("nothing to do: every video already has a transcript")
        return
    model = WhisperModel(args.model, device="cuda", compute_type=args.compute_type)

    for video in todo:
        vid = video.stem
        info_path = ref / "meta" / "info" / f"{vid}.info.json"
        info = json.loads(info_path.read_text(encoding="utf-8")) if info_path.exists() else {}
        segments, _ = model.transcribe(load_audio(video), language="en", word_timestamps=True,
                                       vad_filter=True, beam_size=5)
        words, lines = [], []
        for seg in segments:
            seg_words = [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
                         for w in seg.words if w.word.strip()]
            if seg_words:
                words.extend(seg_words)
                lines.append({"start": seg_words[0]["start"], "end": seg_words[-1]["end"],
                              "text": " ".join(w["w"] for w in seg_words)})
        doc = {"id": vid, "title": info.get("title"), "duration": file_duration(video) or info.get("duration"),
               "upload_date": info.get("upload_date"), "source": f"faster-whisper-{args.model}",
               "words": words, "lines": lines}
        (out / f"{vid}.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")
        txt = [f"# {doc['title']} ({vid}) - {doc['duration']}s - source: {doc['source']}"]
        txt += [f"[{fmt(l['start'])} -> {fmt(l['end'])}] {l['text']}" for l in lines]
        (out / f"{vid}.txt").write_text("\n".join(txt) + "\n", encoding="utf-8")
        print(f"{vid}: {len(words)} words", flush=True)


if __name__ == "__main__":
    main()
