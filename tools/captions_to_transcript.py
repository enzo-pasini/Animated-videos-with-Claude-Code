"""Convert YouTube json3 auto-captions into timestamped transcripts.

Usage: python -I tools/captions_to_transcript.py <references_dir>

Reads   <references>/transcripts/raw/<id>.en-orig.json3
        <references>/meta/info/<id>.info.json
Writes  <references>/transcripts/<id>.json   (word-level timestamps)
        <references>/transcripts/<id>.txt    (one caption line per row)
"""
import json
import subprocess
import sys
from pathlib import Path

MAX_LAST_WORD_S = 0.8   # captions give no word end times; cap the final word's length


def file_duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 3)
    except ValueError:
        return None


def fmt(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:05.2f}"


def parse_json3(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    words, lines = [], []
    for ev in data.get("events", []):
        segs = ev.get("segs")
        if not segs or ev.get("aAppend"):
            continue
        t0 = ev["tStartMs"] / 1000
        t_end = t0 + ev.get("dDurationMs", 0) / 1000
        line_words = []
        for seg in segs:
            text = seg.get("utf8", "").strip()
            if not text:
                continue
            start = t0 + seg.get("tOffsetMs", 0) / 1000
            line_words.append({"w": text, "start": round(start, 3)})
        for i, w in enumerate(line_words):
            nxt = line_words[i + 1]["start"] if i + 1 < len(line_words) else t_end
            w["end"] = round(max(nxt, w["start"]), 3)
        if line_words:
            words.extend(line_words)
            lines.append({"start": line_words[0]["start"], "end": line_words[-1]["end"],
                          "text": " ".join(w["w"] for w in line_words)})
    # Caption events overlap; clip each word's end to the next word's start.
    for i in range(len(words) - 1):
        words[i]["end"] = round(min(words[i]["end"], words[i + 1]["start"]), 3)
    if words:
        words[-1]["end"] = round(min(words[-1]["end"], words[-1]["start"] + MAX_LAST_WORD_S), 3)
    return words, lines


def main(ref):
    ref = Path(ref)
    out = ref / "transcripts"
    for raw in sorted((out / "raw").glob("*.json3")):
        vid = raw.name.split(".")[0]
        info_path = ref / "meta" / "info" / f"{vid}.info.json"
        info = json.loads(info_path.read_text(encoding="utf-8")) if info_path.exists() else {}
        words, lines = parse_json3(raw)
        video = ref / "videos" / f"{vid}.mp4"
        duration = (file_duration(video) if video.exists() else None) or info.get("duration")
        doc = {"id": vid, "title": info.get("title"), "duration": duration,
               "upload_date": info.get("upload_date"), "source": "youtube-auto-captions-en-orig",
               "words": words, "lines": lines}
        (out / f"{vid}.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")
        txt = [f"# {doc['title']} ({vid}) - {doc['duration']}s - source: YouTube auto-captions"]
        txt += [f"[{fmt(l['start'])} -> {fmt(l['end'])}] {l['text']}" for l in lines]
        (out / f"{vid}.txt").write_text("\n".join(txt) + "\n", encoding="utf-8")
        print(f"{vid}: {len(words)} words, {len(lines)} lines")


if __name__ == "__main__":
    main(sys.argv[1])
