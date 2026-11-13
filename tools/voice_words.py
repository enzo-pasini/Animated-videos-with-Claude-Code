"""Import a voice file, measure the time of every word, and match the words back to the script.

Usage (from the project root):
  python -I tools/voice_words.py videos/<slug> [--input FILE] [--script FILE] [--tempo X]
                                [--model large-v3-turbo] [--device cuda|cpu]

1. Input: --input, or the newest videos/<slug>/audio/voice_raw.* (wav/mp3/m4a/ogg/flac).
2. ffmpeg -> audio/voice.wav: 48 kHz mono, sped up by --tempo (ffmpeg atempo, D18: ElevenLabs
   voices are slow), silence trimmed at both ends (first word at ~0.00 s, the voice ends where
   the video will end).
3. faster-whisper with word timestamps (the script text is given as a prompt to help spelling).
4. Alignment: script words and whisper words are both turned into plain spoken words
   ("3" -> three, "a.m." -> am, "40%" -> forty percent) and matched with difflib.
   Captions keep the SCRIPT spelling; the voice gives the TIMES. Words whisper missed get
   times interpolated from their neighbours and are listed in the report.
5. Writes audio/words.json ({w, start, end, beat, match} per script token, same base format as
   references/transcripts) and audio/pace.md (pace vs the 3.5 w/s target, D18, and the RULEBOOK
   section 3 ranges). If the pace is off target, pace.md gives the --tempo to re-run with.
Exit code 1 if more than 10 % of the words could not be matched.
"""
import argparse
import difflib
import json
import os
import re
import statistics
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))  # -I drops the script folder from the path; add it back explicitly
from script_check import int_words, parse_script, spoken_count  # noqa: E402

ROOT = TOOLS.parent
SR = 48000
TRIM_DB = -45
UNMATCHED_MAX = 0.10

# RULEBOOK section 3 (reference voice): median and range
PACE = {"overall": (3.70, 3.36, 4.11), "first3": (4.00, 3.00, 4.67), "last5": (3.40, 2.80, 4.40)}
TARGET_WPS = 3.5   # D18: the user's chosen pace (reference median 3.7 felt too fast)
TEMPO_OK = 0.1     # w/s: closer than this to the target needs no new --tempo
TEMPO_MAX = 1.6    # D18: atempo tested by ear up to 1.54x; above this ask for a faster voice
FIRST_WORD_MAX = 0.08
TAIL_MAX = 0.2


def canon(token):
    """Plain spoken words of one written token, for matching script vs whisper."""
    t = token.lower().replace("’", "'").strip(".,!?;:\"'()“”‘—–")
    if not t:
        return []
    if re.fullmatch(r"a\.?m\.?", t):
        return ["am"]
    if re.fullmatch(r"p\.?m\.?", t):
        return ["pm"]
    out = []
    for part in re.split(r"[-–/]", t):
        m = re.fullmatch(r"\$?(\d[\d,]*)(?:\.(\d+))?(%|s|st|nd|rd|th|k)?", part)
        if m:
            out += int_words(int(m.group(1).replace(",", "")))
            if m.group(2):
                out += ["point"] + [int_words(int(d))[0] for d in m.group(2)]
            if m.group(3) == "%":
                out.append("percent")
        else:
            w = re.sub(r"[^a-z0-9']", "", part)
            if w:
                out.append(w)
    return out


def find_input(vdir, given):
    if given:
        return Path(given)
    cands = [p for p in (vdir / "audio").glob("voice_raw.*") if p.suffix.lower() in (".wav", ".mp3", ".m4a", ".ogg", ".flac")]
    if not cands:
        raise SystemExit(f"no voice file: put it at {vdir / 'audio' / 'voice_raw.<ext>'} or pass --input")
    return max(cands, key=lambda p: p.stat().st_mtime)


def import_voice(src, dst, tempo=1.0):
    speed = f"atempo={tempo:.4f}," if abs(tempo - 1) > 1e-6 else ""  # before the trim: same result, simpler
    trim = (f"silenceremove=start_periods=1:start_threshold={TRIM_DB}dB:detection=peak,"
            f"areverse,silenceremove=start_periods=1:start_threshold={TRIM_DB}dB:detection=peak,areverse")
    trim = speed + trim
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "1", "-ar", str(SR),
                    "-af", trim, "-c:a", "pcm_s16le", str(dst)], check=True)
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1",
                        str(dst)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def transcribe(wav, model_name, device, prompt):
    os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")  # Windows without symlinks: harmless warning
    import transcribe_whisper as tw  # sets the CUDA DLL paths, then imports faster_whisper
    model = tw.WhisperModel(model_name, device=device, compute_type="float16" if device == "cuda" else "int8")
    segments, _ = model.transcribe(tw.load_audio(wav), language="en", word_timestamps=True, vad_filter=False,
                                   beam_size=5, initial_prompt=prompt[:800])
    return [{"w": w.word.strip(), "start": round(float(w.start), 3), "end": round(float(w.end), 3)}
            for seg in segments for w in seg.words if w.word.strip()]


def align(tokens, heard, dur):
    """tokens: [(text, beat)] from the script; heard: whisper words; dur: file length (s).
    Returns per token [start, end, match kind, heard words]."""
    s_can, s_owner = [], []
    for i, (tok, _) in enumerate(tokens):
        for c in canon(tok):
            s_can.append(c)
            s_owner.append(i)
    h_can, h_owner = [], []
    for j, w in enumerate(heard):
        for c in canon(w["w"]):
            h_can.append(c)
            h_owner.append(j)
    times = [[None, None, None, []] for _ in tokens]  # start, end, match kind, heard words

    def put(si, hj, kind):
        ti, w = s_owner[si], heard[h_owner[hj]]
        t = times[ti]
        t[0] = w["start"] if t[0] is None else min(t[0], w["start"])
        t[1] = w["end"] if t[1] is None else max(t[1], w["end"])
        t[2] = kind if t[2] in (None, kind) else "fuzzy"
        if w["w"] not in t[3]:
            t[3].append(w["w"])

    sm = difflib.SequenceMatcher(None, s_can, h_can, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                put(i1 + k, j1 + k, "exact")
        elif op == "replace":
            n_s, n_h = i2 - i1, j2 - j1
            for k in range(n_s):  # spread the heard words over the script words, in order
                lo = k * n_h // n_s
                hi = max(lo + 1, (k + 1) * n_h // n_s)  # one script word may cover several heard pieces
                for h in range(lo, min(hi, n_h)):
                    put(i1 + k, j1 + h, "fuzzy")

    # interpolate tokens whisper missed, between their timed neighbours
    for i, t in enumerate(times):
        if t[0] is not None:
            continue
        prev_end = next((times[k][1] for k in range(i - 1, -1, -1) if times[k][1] is not None), 0.0)
        j = next((k for k in range(i + 1, len(times)) if times[k][0] is not None), None)
        # missing words at the very end share the time left before the end of the file
        next_start = times[j][0] if j is not None else max(prev_end, dur)
        run = (j if j is not None else len(times)) - i  # how many untimed tokens in a row
        step = max(0.0, next_start - prev_end) / run
        for k in range(run):
            times[i + k] = [round(prev_end + step * k, 3), round(prev_end + step * (k + 1), 3), "interpolated", []]
    return times


def pace_report(words, dur_file, tempo=1.0):
    spoken = [(w["start"], spoken_count(w["w"])) for w in words]
    total = sum(c for _, c in spoken)
    end = words[-1]["end"]
    overall = total / end
    first3 = sum(c for s, c in spoken if s < 3.0) / 3.0
    last5 = sum(c for s, c in spoken if s >= end - 5.0) / 5.0
    starts = [w["start"] for w in words]
    gaps = [b - a for a, b in zip(starts, starts[1:])]
    med = statistics.median(gaps) if gaps else 0
    long_gaps = [(round(starts[i + 1], 2), round(g, 2)) for i, g in enumerate(gaps) if med and g >= 2.5 * med]
    rows = []

    def row(name, v, lo, hi, ref):
        ok = lo <= v <= hi
        rows.append((name, v, f"{lo}–{hi}", ref, "✅" if ok else ("⬇️" if v < lo else "⬆️")))
        return ok

    row("words/s overall", round(overall, 2), PACE["overall"][1], PACE["overall"][2], TARGET_WPS)
    row("words/s first 3 s", round(first3, 2), PACE["first3"][1], PACE["first3"][2], PACE["first3"][0])
    row("words/s last 5 s", round(last5, 2), PACE["last5"][1], PACE["last5"][2], PACE["last5"][0])
    row("first word starts at s", round(words[0]["start"], 2), 0.0, FIRST_WORD_MAX, 0.0)
    row("silence after last word s", round(dur_file - end, 2), 0.0, TAIL_MAX, 0.0)
    advice = ""
    if abs(overall - TARGET_WPS) > TEMPO_OK:
        new_tempo = tempo * TARGET_WPS / overall
        advice = f"Pace {overall:.2f} w/s is {'slow' if overall < TARGET_WPS else 'fast'} for the {TARGET_WPS} target. "
        if new_tempo <= TEMPO_MAX:
            advice += f"Re-run with --tempo {new_tempo:.2f} (ffmpeg atempo, D18)."
        else:
            advice += (f"It would need --tempo {new_tempo:.2f}, above the {TEMPO_MAX} limit (it starts to sound "
                       f"robotic): ask the user for a faster voice or the ElevenLabs speed setting.")
    return total, end, rows, long_gaps, med, advice


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--input")
    ap.add_argument("--script")
    ap.add_argument("--tempo", type=float, default=1.0, help="speed-up with ffmpeg atempo (D18), e.g. 1.33")
    ap.add_argument("--model", default="large-v3-turbo")
    ap.add_argument("--device", default="cuda", choices=["cuda", "cpu"])
    a = ap.parse_args()

    vdir = Path(a.video_dir).resolve()
    (vdir / "audio").mkdir(parents=True, exist_ok=True)
    script = Path(a.script) if a.script else vdir / "script.md"
    title, _, beats, _ = parse_script(script)
    tokens = []
    for beat, line in beats:
        for tok in re.sub(r"\[(F\d+|story)\]", "", line).split():
            if spoken_count(tok):
                tokens.append((tok, beat))

    src = find_input(vdir, a.input)
    wav = vdir / "audio" / "voice.wav"
    if not 0.5 <= a.tempo <= TEMPO_MAX:
        sys.exit(f"--tempo {a.tempo} is outside 0.5-{TEMPO_MAX} (D18)")
    dur = import_voice(src, wav, a.tempo)
    print(f"imported {src.name} → {wav.relative_to(ROOT) if wav.is_relative_to(ROOT) else wav} "
          f"({dur:.2f} s, tempo {a.tempo:g}×, trimmed)")

    heard = transcribe(wav, a.model, a.device, " ".join(t for t, _ in tokens))
    times = align(tokens, heard, dur)
    words = [{"w": tok, "start": t[0], "end": t[1], "beat": beat, "match": t[2], "heard": " ".join(t[3])}
             for (tok, beat), t in zip(tokens, times)]
    doc = {"id": vdir.name, "title": title, "duration": round(dur, 3), "source": f"faster-whisper-{a.model} + script alignment",
           "voice_file": src.name, "tempo": a.tempo, "words": words, "whisper": heard}
    (vdir / "audio" / "words.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")

    total, end, rows, long_gaps, med, advice = pace_report(words, dur, a.tempo)
    unmatched = [w for w in words if w["match"] == "interpolated"]
    fuzzy = [w for w in words if w["match"] == "fuzzy"]
    lines = [f"# Voice pace — {title}", "",
             f"{total} spoken words · voice {end:.2f} s · file {dur:.2f} s · whisper heard {len(heard)} words", "",
             f"Tempo {a.tempo:g}× (ffmpeg atempo) · raw voice pace ≈ {total / end / a.tempo:.2f} w/s", "",
             "| measure | value | reference range | target (overall: D18) / reference median | |", "|---|---|---|---|---|"]
    lines += [f"| {n} | {v} | {r} | {m} | {i} |" for n, v, r, m, i in rows]
    lines += ["", f"Long gaps (start-to-start ≥ 2.5 × median {med:.2f} s): **{len(long_gaps)}** "
                  f"{long_gaps} (reference: ~5 per 60 s video, 2–16)", ""]
    if advice:
        lines += [f"**{advice}**", ""]
    lines += [f"Matching: {len(words) - len(unmatched) - len(fuzzy)} exact · {len(fuzzy)} fuzzy · {len(unmatched)} not heard"]
    if fuzzy or unmatched:
        heard_text = " ".join(w["w"] for w in heard)
        lines += [f"- fuzzy (script → heard): {', '.join(w['w'] + ' → ' + w['heard'] for w in fuzzy) or '—'}",
                  f"- not heard (times estimated): {', '.join(w['w'] for w in unmatched) or '—'}",
                  f"- whisper heard: “{heard_text}”"]
        if unmatched:
            lines += ["", "**⚠️ The voice doesn't say every script word, so a caption would show a word nobody "
                          "says. Re-generate the voice or change the script, then run this again.** "
                          "(Fuzzy rows are fine when they are only spelling, like a.m. → a .m.)"]
    text = "\n".join(lines) + "\n"
    (vdir / "audio" / "pace.md").write_text(text, encoding="utf-8")
    print(text)
    sys.exit(1 if len(unmatched) > UNMATCHED_MAX * len(words) else 0)


if __name__ == "__main__":
    main()
