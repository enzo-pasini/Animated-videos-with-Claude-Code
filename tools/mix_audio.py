"""Mix the voice with background music and sound effects, and normalize to the channel loudness (-14 LUFS, -2 dBTP).

Usage (from the project root):
  python -I tools/mix_audio.py videos/<slug> [--with-music | --music FILE] [--music-start S] [--gap-db 20] [--duck-db 4]
  (D21: no music by default = voice + sound effects; the user decides about music later)
                                [--sfx-plan FILE]

Needs audio/voice.wav and audio/words.json (from voice_words.py).
Sound effects: the "sfx" list in scene_plan.json (or --sfx-plan FILE), e.g.
  "sfx": [{"at": "w:6", "sound": "woosh"}, {"at": "w:9+2", "sound": "click", "gain_db": -2}]
  - "at": f:N or w:N+-k, the same frames as build_props.py. The sound's HIT (its loudest 10 ms) lands on it.
  - "sound": an id of SOUNDS below. "woosh" alternates woosh_1 / woosh_2 cue by cue (the user's rule);
    "click" keeps ONE file inside a shot: the main click, and after 3 scenes in a row with it, one scene with
    the pop (the shots' "from" anchors come from the same file); "woosh_1" / "click_2"… force one file.
  - level: each sound's default level under the voice (SOUNDS) + optional "gain_db", then ALL_SFX_DB (-3, the
    user's combo choice) except the NOT_LOWERED files (quiet by nature). Levels are RMS of the
    sounding part (sfx) vs RMS of the spoken words (voice), both measured here, so woosh_1 and woosh_2 match.
  - SFX are added after the music and before the loudness step, and do not duck. FAIL if one is set
    louder than 3 dB under the voice (an SFX must never cover a word).
1. Length: the video ends right after the last word (RULEBOOK §3: the voice runs to the last
   frame): last word end + 0.10 s, rounded up to whole frames at 30 fps.
2. Music: --music, else the least recently used track in assets/music/ (channel/log.json), so
   tracks rotate (decision D7: YouTube Audio Library). Music level = voice loudness - gap
   (default 20 dB), minus duck-db (default 4) while words are spoken (volume curve from the word
   times, 0.15 s ramps), fade-out on the last 0.5 s.
3. Loudness: one linear gain + a peak limiter, measured and corrected until -14 +-0.1 LUFS, <= -2 dBTP
   (ffmpeg loudnorm was tried first: it falls back to an inaccurate dynamic mode on peaky voices).
4. Writes audio/mix.wav (48 kHz stereo) and audio/mix.json (length, frames, music, measured levels).
Exit code 1 if the result is outside -14 +-0.5 LUFS or above -1.8 dBTP.
"""
import argparse
import bisect
import json
import math
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
TAIL_S = 0.10
TARGET_I, TARGET_TP, TARGET_LRA = -14.0, -2.0, 11.0
FADE_OUT_S = 0.5
MUSIC_EXT = (".mp3", ".wav", ".m4a", ".ogg", ".flac")
SFX_DIR = ROOT / "assets" / "sound-effects"
# sound id -> files (alternated in time order) and default level in dB relative to the voice (RMS vs RMS).
# Rules for where each one goes: .claude/skills/generate-animated-shorts/references/scene_plan.md.
SOUNDS = {
    "woosh": {"files": ["woosh_1.mp3", "woosh_2.mp3"], "rel_db": -6.0},   # fast moves (never a fright); user chose -6 (test 1 A, 2026-11-11)
    "woosh_1": {"files": ["woosh_1.mp3"], "rel_db": -6.0},
    "woosh_2": {"files": ["woosh_2.mp3"], "rel_db": -6.0},
    # one per repeated action; user chose -12 (click test 1 B). Two files (user's rules, 2026-11-11): ONE file inside a
    # shot (all clicks of a scene sound the same); the first file is the main one; after it played in "run" (3) scenes
    # in a row, the next scene with clicks takes the second file, then back to the first ("per": "shot")
    "click": {"files": ["scribblenauts-button-click.mp3", "button-click-pop-2-sound-effect.mp3"], "rel_db": -12.0,
              "per": "shot", "run": 3},
    "click_1": {"files": ["scribblenauts-button-click.mp3"], "rel_db": -12.0},
    "click_2": {"files": ["button-click-pop-2-sound-effect.mp3"], "rel_db": -12.0},
    "idea": {"files": ["ding-sound-effect.mp3"], "rel_db": -6.0},             # a character has an idea; user chose -6 (ding test 1 A)
    # a fright / a climax or turning point; loud by nature: user chose final -12 (alert test 1 A) = -9 + ALL_SFX_DB
    "alert": {"files": ["metal-gear-alert-sound-effect.mp3"], "rel_db": -9.0},
}
# per-file level correction on top of the RMS match: a very short sound sounds quieter than its RMS says
# (the pop rings 60 ms vs the old click's 120 ms: 3 dB less energy; the user could barely hear it in click test 2)
FILE_TRIM_DB = {"button-click-pop-2-sound-effect.mp3": 6.0}
# the user's combo choice (2026-11-11, combo test B): every sound 3 dB under its single-test level, EXCEPT the sounds
# that are quiet by nature (they would get lost): those keep their level
ALL_SFX_DB = -3.0
NOT_LOWERED = {"button-click-pop-2-sound-effect.mp3"}
RUN_GAP_S = 10.0  # a "run" of scenes with the main file ends after this long without that sound
SFX_MAX_REL_DB = -3.0  # no SFX louder than this under the voice
SR = 48000


def pcm(path):
    """Mono float32 samples at 48 kHz."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)


def sfx_info(path):
    """Hit time (loudest 10 ms), sounding part (> hit - 30 dB) and its RMS level in dBFS."""
    import numpy as np
    x, n = pcm(path), SR // 100
    env = np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, axis=1))
    db = 20 * np.log10(env + 1e-9)
    hit = int(np.argmax(db))
    on = np.where(db > db[hit] - 30)[0]
    s, e = int(on[0]), int(on[-1]) + 1
    level = 10 * np.log10(np.mean(x[s * n:e * n] ** 2) + 1e-12)
    return {"hit_s": hit / 100, "start_s": s / 100, "end_s": e / 100, "level_db": round(float(level), 2)}


def voice_level(voice, words):
    """RMS level (dBFS) of the voice over the spoken words."""
    import numpy as np
    x = pcm(voice)
    parts = [x[int(w["start"] * SR):int(w["end"] * SR)] for w in words]
    return float(10 * np.log10(np.mean(np.concatenate(parts) ** 2) + 1e-12))


def anchor_frame(a, starts):
    """Same rule as build_props.py Resolver: f:N, w:N (word start, rounded to a frame), +-k frames."""
    if isinstance(a, (int, float)):
        return int(a)
    m = re.fullmatch(r"(f|w):(\d+)([+-]\d+)?", str(a))
    if not m:
        raise SystemExit(f"sfx: bad anchor '{a}' (use f:N, w:N or w:N+k; shot anchors like start+k are not allowed here)")
    base = int(m.group(2)) if m.group(1) == "f" else starts[int(m.group(2))]
    return base + int(m.group(3) or 0)


def plan_sfx(entries, words, v_rms, length, shots=()):
    """Resolve the sfx list: file, start time, gain. Returns (cues, problems).
    shots: the plan's shots (their "from" anchors) for sounds that change file per shot ("per": "shot")."""
    starts = [round(w["start"] * FPS) for w in words]
    froms = sorted(anchor_frame(s["from"], starts) for s in shots if "from" in s) or [0]
    shot_of = lambda f: max(0, bisect.bisect_right(froms, f) - 1)  # noqa: E731
    # alt: one counter per sound id (wooshes alternate cue by cue); per shot: run of scenes with the main file
    cues, problems, alt, last_shot, run, last_t = [], [], {}, {}, {}, {}
    for k, e in sorted(enumerate(entries), key=lambda ke: anchor_frame(ke[1]["at"], starts)):
        sid = e.get("sound")
        if sid not in SOUNDS:
            problems.append(f"sfx {k}: unknown sound '{sid}' (known: {', '.join(SOUNDS)})")
            continue
        files = SOUNDS[sid]["files"]
        if SOUNDS[sid].get("per") == "shot":
            f_at = anchor_frame(e["at"], starts)
            sh = shot_of(f_at)
            if last_shot.get(sid) != sh:  # a new scene with this sound: pick its file once
                last_shot[sid] = sh
                if f_at / FPS - last_t.get(sid, -1e9) > RUN_GAP_S:
                    run[sid] = 0
                if run.get(sid, 0) >= SOUNDS[sid].get("run", 1):
                    alt[sid], run[sid] = 1, 0
                else:
                    alt[sid], run[sid] = 0, run.get(sid, 0) + 1
            last_t[sid] = f_at / FPS
            name = files[alt[sid] % len(files)]
        else:
            name = files[alt.get(sid, 0) % len(files)]
            alt[sid] = alt.get(sid, 0) + 1
        path = SFX_DIR / name
        if not path.exists():
            problems.append(f"sfx {k}: missing file {path} (see assets/sound-effects/README.md)")
            continue
        info = sfx_info(path)
        frame = anchor_frame(e["at"], starts)
        rel = (SOUNDS[sid]["rel_db"] + float(e.get("gain_db", 0)) + FILE_TRIM_DB.get(name, 0.0)
               + (0.0 if name in NOT_LOWERED else ALL_SFX_DB))
        if rel > SFX_MAX_REL_DB:
            problems.append(f"sfx {k} ({sid} at {e['at']}): {rel:+.1f} dB vs the voice is too loud (max {SFX_MAX_REL_DB:+.0f})")
        t0 = frame / FPS - info["hit_s"]
        if frame < 0 or frame / FPS > length:
            problems.append(f"sfx {k} ({sid} at {e['at']}): frame {frame} is outside the video")
        cues.append({"at": e["at"], "frame": frame, "sound": sid, "file": name, "start_s": round(t0, 3),
                     "hit_s": info["hit_s"], "rel_db": rel, "gain_db": round(v_rms + rel - info["level_db"], 2)})
    return cues, problems


def ff(args):
    return subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", *args], capture_output=True, text=True, encoding="utf-8")


def loudness(path, filt=None):
    """Integrated LUFS and true peak of a file (or of a filtergraph output)."""
    af = (filt + "," if filt else "") + "ebur128=peak=true"
    err = ff(["-i", str(path), "-af", af, "-f", "null", "-"]).stderr
    s = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", s)
    tp = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", s, re.S)
    val = lambda m: None if not m or m.group(1) == "-inf" else float(m.group(1))  # noqa: E731
    return val(i), val(tp)


def pick_music(given):
    if given:
        return Path(given)
    tracks = sorted(p for p in (ROOT / "assets" / "music").glob("*") if p.suffix.lower() in MUSIC_EXT)
    if not tracks:
        raise SystemExit("no music: download tracks from the YouTube Audio Library into assets/music/ or pass --music")
    last_used = {}
    log = ROOT / "channel" / "log.json"
    if log.exists():
        for i, v in enumerate(json.loads(log.read_text(encoding="utf-8")).get("videos", [])):
            if v.get("music"):
                last_used[v["music"]] = i
    return min(tracks, key=lambda p: (last_used.get(p.name, -1), p.name))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("video_dir")
    ap.add_argument("--music")
    ap.add_argument("--music-start", type=float, default=0.0, help="seconds into the track where the video starts")
    ap.add_argument("--gap-db", type=float, default=20.0, help="music this many dB under the voice")
    ap.add_argument("--duck-db", type=float, default=4.0, help="extra music reduction while words are spoken")
    ap.add_argument("--no-music", action="store_true", help="voice + sound effects only (the default now, PLAN D21)")
    ap.add_argument("--with-music", action="store_true", help="add a music track (off by default since D21)")
    ap.add_argument("--sfx-plan", help="JSON file with the sfx list (default: scene_plan.json of the video)")
    a = ap.parse_args()

    vdir = Path(a.video_dir).resolve()
    voice = vdir / "audio" / "voice.wav"
    words = json.loads((vdir / "audio" / "words.json").read_text(encoding="utf-8"))["words"]
    frames = math.ceil((words[-1]["end"] + TAIL_S) * FPS)
    length = frames / FPS

    sfx_src = Path(a.sfx_plan) if a.sfx_plan else vdir / "scene_plan.json"
    src = json.loads(sfx_src.read_text(encoding="utf-8")) if sfx_src.exists() else {}
    entries = src.get("sfx", [])
    v_rms = voice_level(voice, words)
    cues, problems = plan_sfx(entries, words, v_rms, length, src.get("shots", []))
    if problems:
        raise SystemExit("sfx plan problems:\n  " + "\n  ".join(problems))

    v_i, _ = loudness(voice)
    if v_i is None:
        raise SystemExit("could not measure the voice loudness")
    # D21 (2026-11-11): no music by default (voice + SFX); music only with --with-music or --music FILE
    music = pick_music(a.music) if (a.music or a.with_music) and not a.no_music else None
    if music:
        m_i, _ = loudness(music, f"atrim=start={a.music_start}:duration={length},asetpts=PTS-STARTPTS")
        if m_i is None:
            raise SystemExit("could not measure the music loudness")
        music_gain = (v_i - a.gap_db) - m_i
    else:
        m_i = music_gain = None

    # duck: exact volume curve from the word times. Speech segments = words with gaps < 0.4 s merged;
    # inside a segment the music is duck-db lower, with RAMP_S linear ramps in and out.
    segs = []
    for w in words:
        if segs and w["start"] - segs[-1][1] < 0.4:
            segs[-1][1] = w["end"]
        else:
            segs.append([w["start"], w["end"]])
    ramp = 0.15
    inside = [f"clip(min((t-{s - ramp:.3f})/{ramp},({e + ramp:.3f}-t)/{ramp}),0,1)" for s, e in segs]
    presence = inside[0]
    for x in inside[1:]:
        presence = f"max({presence},{x})"
    duck = 10 ** (-a.duck_db / 20)
    envelope = f"volume='1-{1 - duck:.4f}*{presence}':eval=frame"
    inputs, labels = ["-i", str(voice)], ["[v]"]
    graph = f"[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=duration={length}[v];"
    if music:
        inputs += ["-i", str(music)]
        graph += (
            f"[1:a]atrim=start={a.music_start}:duration={length},asetpts=PTS-STARTPTS,"
            f"aformat=sample_rates=48000:channel_layouts=stereo,volume={music_gain:.2f}dB,{envelope},"
            f"apad,atrim=duration={length},afade=t=out:st={max(0.0, length - FADE_OUT_S):.3f}:d={FADE_OUT_S}[m];")
        labels.append("[m]")
    for c in cues:
        k = len(labels)
        inputs += ["-i", str(SFX_DIR / c["file"])]
        head = f"atrim=start={-c['start_s']:.3f},asetpts=PTS-STARTPTS," if c["start_s"] < 0 else ""
        delay = max(0, round(c["start_s"] * 1000))
        graph += (f"[{k}:a]{head}aformat=sample_rates=48000:channel_layouts=stereo,volume={c['gain_db']:.2f}dB,"
                  f"adelay={delay}|{delay},apad,atrim=duration={length}[s{k}];")
        labels.append(f"[s{k}]")
    graph += f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=first[mix]"
    pre = vdir / "audio" / "mix_pre.wav"
    r = ff(["-y", *inputs, "-filter_complex", graph, "-map", "[mix]",
            "-ar", "48000", "-c:a", "pcm_s24le", str(pre)])
    if r.returncode:
        raise SystemExit(r.stderr[-2000:])

    # Loudness: one linear gain to the target + a peak limiter, measured and corrected up to 8 times.
    # (ffmpeg loudnorm falls back to its inaccurate "dynamic" mode when a peaky voice can't reach
    # -14 LUFS linearly under -2 dBTP; a limiter that only touches the few peaks keeps it exact.)
    out = vdir / "audio" / "mix.wav"
    limit = 10 ** ((TARGET_TP - 0.7) / 20)  # sample-peak ceiling with margin for inter-sample (true) peaks
    i0, _ = loudness(pre)
    gain, f_i, f_tp = 0.0, i0, None
    prev = None  # (gain, result) of the previous round
    rounds = 0
    for rounds in range(1, 9):
        if prev is None:
            gain = TARGET_I - i0
        else:
            # the limiter eats part of each extra dB: estimate how much from the last two rounds
            slope = (f_i - prev[1]) / (gain - prev[0]) if gain != prev[0] else 1.0
            slope = min(1.0, max(0.2, slope))
            prev, gain = (gain, f_i), gain + (TARGET_I - f_i) / slope
        if prev is None:
            prev = (0.0, i0)
        chain = f"volume={gain:.3f}dB,alimiter=limit={limit:.4f}:attack=5:release=60:level=0"
        r = ff(["-y", "-i", str(pre), "-af", chain, "-ar", "48000", "-c:a", "pcm_s24le", str(out)])
        if r.returncode:
            raise SystemExit(r.stderr[-2000:])
        f_i, f_tp = loudness(out)
        print(f"  round {rounds}: gain {gain:+.2f} dB -> {f_i} LUFS, {f_tp} dBTP")
        if abs(f_i - TARGET_I) <= 0.1:
            break
    pre.unlink()
    limited_db = gain - (TARGET_I - i0)  # loudness the limiter removed (0 = no peaks touched)
    second = {"normalization_type": f"gain {gain:+.2f} dB + limiter at {TARGET_TP - 0.7:.1f} dBFS ({rounds} rounds)"}
    if limited_db > 4:
        print(f"⚠️ the limiter removed {limited_db:.1f} dB: the voice is very peaky. Listen for a squashed/distorted sound; "
              f"an ElevenLabs voice is usually much smoother than the Windows test voice.")
    ok = f_i is not None and abs(f_i - TARGET_I) <= 0.5 and f_tp is not None and f_tp <= -1.8
    info = {"duration_s": round(length, 3), "frames": frames, "fps": FPS, "music": music.name if music else None,
            "music_start_s": a.music_start, "voice_lufs": v_i, "music_lufs_raw": m_i,
            "music_gain_db": round(music_gain, 2) if music else None,
            "gap_db": a.gap_db, "duck_db": a.duck_db, "voice_rms_db": round(v_rms, 2), "sfx": cues,
            "normalization": second.get("normalization_type"),
            "limiter_db": round(limited_db, 2),
            "result_lufs": f_i, "result_true_peak_dbtp": f_tp, "ok": ok}
    (vdir / "audio" / "mix.json").write_text(json.dumps(info, indent=1), encoding="utf-8")
    m_txt = (f"music {music.name} at {music_gain:+.1f} dB (≈ {a.gap_db:g} dB under the voice, duck ~{a.duck_db:g} dB)"
             if music else "no music")
    print(f"mix: {out} · {length:.2f} s = {frames} frames · {m_txt} · {len(cues)} sound effects")
    for c in cues:
        print(f"  sfx {c['sound']:8s} {c['file']:34s} at {c['at']:8s} (frame {c['frame']}, hit {c['frame'] / FPS:.2f} s) "
              f"{c['rel_db']:+.1f} dB vs voice")
    print(f"loudness: {f_i} LUFS (target {TARGET_I}), true peak {f_tp} dBTP (target ≤ {TARGET_TP}), "
          f"method: {second.get('normalization_type')}")
    print("RESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
