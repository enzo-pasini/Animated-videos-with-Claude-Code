# SFX tests (assets/sound-effects/, tools/mix_audio.py "sfx"): one sound at a time, used generously on many moves
# and feelings, each cue numbered on screen (W1, C1…) so the user can say which to keep and which to remove.
# Same picture, two levels: A and B (dB under the voice). The sound's HIT lands on the visual hit of each move
# (timings from src/cast/fx.ts FACE_FX and the recipes face-stretch.md / jump.md), not on the fx start.
#   woosh (test 1, 2026-11-11: user chose A = -6 dB, kept W1–W8; W9 shy → try click):
#     laugh +8 · think / shy turn +3 · happy pop +2 · jump take-off hop +4, big +2 · punch +3
#   click (test 1): one click per repetition (the user's rule):
#     think chin tap: the finger comes down every ~10 frames from +15 · shy: turn +2, peeks +10, +30, +50 ·
#     laugh "ha" bounce every 6 frames from +3 · blinks on chosen words (actor "blink" list)
#     (test 1: user chose B = -12 dB; kept taps, blinks, shy; laugh = woosh only, laugh sound left open)
#   ding (idea, test 1): think → happy (the idea), ding on the happy pop +2; D1 before a pause, D2 mid-sentence
#     (the 1 s tail under the next words), D3 + the locked woosh on a hop take-off, D4 + woosh on the same pop.
# Voice: out/sfx/<test>/ (script.md + voice_text.txt, Kokoro af_heart, voice_words.py --tempo 1.19).
# Usage: .venv/Scripts/python -I tools/vfx_tests/sfx_test_props.py woosh out/sfx/woosh
#   → props.json (silent picture), sfx_A.json, sfx_B.json (for mix_audio.py --no-music --sfx-plan)
import json, math, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from mix_audio import ALL_SFX_DB, SOUNDS  # noqa: E402

DAY, WORK, BRIDGE, NIGHT = ("day_street", [0.2, 0, 3.4], (0.4466, -0.8931)), \
    ("workshop", [0.2, 0, 1.0], (-0.4466, 0.8931)), ("bridge", [-10.0, 3.2, 2.5], (0.4466, 0.8931)), \
    ("night_street", [0.2, 0, 3.4], (-0.4466, -0.8931))
# test → sound, prefix, levels, shots. Shot: (set, first word, camera distance, actors).
# Actor: (who, side offset (+ = screen left), events). Event: (word, fx, jump, [cue offsets in frames], label);
# fx "blink" = a blink on that word (no face fx). A cue offset can be (offset, other sound): that sound plays at its
# locked default level (only the tested sound gets the A / B levels). Events without cues get no number.
TESTS = {
    "woosh": ("woosh", "W", {"A": -6.0, "B": -12.0}, [
        (DAY, 0, 3.0, [("mira", 0, [(5, "laugh", None, [8], "laugh"), (12, "think", None, [3], "think")])]),
        (WORK, 15, 3.0, [("juno", 0, [(17, "think", None, [3], "head left"), (19, "think_l", None, [3], "head right"),
                                      (21, "happy", None, [2], "happy")])]),
        (BRIDGE, 26, 5.6, [("rifleman", 1, [(28, "happy", "hop", [4], "hop + happy")]),
                           ("rifleman_b", -1, [(33, "laugh", "big", [2], "big jump + laugh")])]),
        (NIGHT, 36, 4.6, [("bram", 1, [(38, "anger", None, [3], "anger + punch")]),
                          ("pell", -1, [(42, "shy", None, [3], "shy")])]),
    ]),
    "click": ("click", "C", {"A": -6.0, "B": -12.0}, None),  # shots from the words: SHOT_FNS
    "ding": ("idea", "D", {"A": -6.0, "B": -12.0}, None),  # test 1: user chose A (-6), kept D1–D4 + the woosh combos
    "combo": (None, "K", {"A": 0.0, "B": -3.0}, None),  # sound None: every cue at its locked level + the A / B offset
    "alert": ("alert", "L", {"A": -12.0, "B": -18.0}, None),  # final levels: lower than the woosh (-9), the user's rule
}
PUNCH = {"dur": 0.27, "factor": 1.15}  # = build_props PUNCH


def click_shots(idx):
    return [
        (WORK, 0, 3.0, [("juno", 0, [(idx("tapped"), "think", None, [15, 25, 35, 45, 55], "chin taps")])]),
        (DAY, idx("mira"), 3.0, [("mira", 0, [(idx(w), "blink", None, [0], "blink") for w in ("once", "twice", "three")])]),
        (BRIDGE, idx("the"), 3.4, [("rifleman", 0, [(idx("laughed"), "laugh", None, list(range(3, 48, 6)), "laugh ha-ha")])]),
        (NIGHT, idx("pell"), 3.4, [("pell", 0, [(idx("shyly"), "shy", None, [2, 10, 30, 50], "shy turn + peeks")])]),
    ]


def ding_shots(idx):
    return [
        (WORK, 0, 3.0, [("juno", 0, [(idx("wondered"), "think", None, [], ""),
                                     (idx("got"), "happy", None, [2], "idea, then a pause")])]),
        (DAY, idx("mira"), 3.0, [("mira", 0, [(idx("thought"), "think", None, [], ""),
                                              (idx("smiled"), "happy", None, [2], "idea mid-sentence")])]),
        (BRIDGE, idx("soldier") - 1, 5.6, [("rifleman", 0, [(idx("scratched"), "think", None, [], ""),
                                                             (idx("jumped"), "happy", "hop", [2, (4, "woosh")],
                                                              "idea + hop (with woosh)")])]),
        (NIGHT, idx("pell"), 3.4, [("pell", 0, [(idx("rubbed"), "think", None, [], ""),
                                                (idx("oh"), "happy", None, [2, (2, "woosh")], "idea + woosh")])]),
    ]


def combo_shots(idx):
    """Combo test (the user's idea, 2026-11-11): the ding scene + a woosh on each think head turn (+3) + a click on
    each chin tap (+15, +25, +35: as many as fit before the idea). The soldier ("scratched his head") and Pell
    ("rubbed his chin") have the action in the voice; Juno and Mira don't."""
    def think(taps, label):
        return [(3, "woosh")] + [(15 + 10 * k, "click") for k in range(taps)], f"woosh + {taps} clicks"
    j, m, s, p = think(3, "Juno thinks"), think(2, "Mira thinks"), think(2, "soldier scratches"), think(3, "Pell rubs")
    return [
        (WORK, 0, 3.0, [("juno", 0, [(idx("wondered"), "think", None, *j),
                                     (idx("got"), "happy", None, [(2, "idea")], "ding")])]),
        (DAY, idx("mira"), 3.0, [("mira", 0, [(idx("thought"), "think", None, *m),
                                              (idx("smiled"), "happy", None, [(2, "idea")], "ding")])]),
        (BRIDGE, idx("soldier") - 1, 5.6, [("rifleman", 0, [(idx("scratched"), "think", None, *s),
                                                             (idx("jumped"), "happy", "hop", [(2, "idea"), (4, "woosh")],
                                                              "ding + woosh")])]),
        (NIGHT, idx("pell"), 3.4, [("pell", 0, [(idx("rubbed"), "think", None, *p),
                                                (idx("oh"), "happy", None, [(2, "idea"), (2, "woosh")],
                                                 "ding + woosh")])]),
    ]


def alert_shots(idx):
    """Alert test (the user's rule: a fright, or a climax / turning point; keep it low). The hit lands on the moment:
    shock pop +5 · scared eyes open +3 · lamp off +0 · reveal (shock_lines: the punch on the word) +1."""
    return [
        (DAY, 0, 3.0, [("mira", 0, [(idx("froze"), "shock", None, [5], "fright (shock)")])]),
        (BRIDGE, idx("soldier") - 1, 5.6, [("rifleman", 0, [(idx("bang"), "scared", "big", [3], "fright (scared jump)")])]),
        (WORK, idx("then"), 3.0, [("juno", 0, [(idx("out"), "scared_lamp", None, [0], "turning point (lamp out)")])]),
        (NIGHT, idx("bram"), 3.4, [("bram", 0, [(idx("gone"), "shock_lines", None, [1], "reveal (lines + punch)")])]),
    ]


SHOT_FNS = {"click": click_shots, "ding": ding_shots, "combo": combo_shots, "alert": alert_shots}


def main():
    test, d = sys.argv[1], Path(sys.argv[2])
    sound, prefix, levels, SHOTS = TESTS[test]
    words = json.loads((d / "audio" / "words.json").read_text(encoding="utf-8"))["words"]
    if SHOTS is None:  # the cue words are found in words.json (word -> index), so the script can change
        def idx(w, n=1):
            return [i for i, x in enumerate(words) if x["w"].strip(".,!?").lower() == w][n - 1]
        SHOTS = SHOT_FNS[test](idx)
    W = [round(w["start"] * 30) for w in words]  # = build_props / mix_audio anchor rule
    total = math.ceil((words[-1]["end"] + 0.10) * 30)
    shots, caps, cues = [], [], []
    starts = [W[s[1]] for s in SHOTS] + [total]
    n, lamp_off = 0, None
    for i, ((set_, pos, (dx, dz)), _, d0, actors_in) in enumerate(SHOTS):
        f0, L = starts[i], starts[i + 1] - starts[i]
        side = (-dz, dx)
        cam = {"target": [pos[0], pos[1] + (1.55 if d0 > 5 else 1.25), pos[2]], "dir": [dx, 0.0536, dz], "d0": d0,
               "fov": 40, "rate": 0.015, "drift": [0, 0, 0], "roll": [-0.6, -1.0], "lenS": L / 30}
        shot = {"id": f"s{i+1:02d}", "beat": None, "from": f0, "len": L, "transition_in": "cut" if i else None,
                "set": set_, "camera": cam, "grade": None, "blur_bg": 0, "extra_warm": [], "actors": []}
        for who, k, events in actors_in:
            p = [pos[0] + k * 0.45 * side[0], pos[1], pos[2] + k * 0.45 * side[1]]
            steps, blinks = {"fx": []}, []
            for wi, fx, jump, offs, label in events:
                if fx == "blink":
                    blinks.append(W[wi])
                elif fx == "shock_lines":  # a reveal: shock 4 frames before + edge lines + punch on the word (item 5)
                    steps["fx"].append([W[wi] - 4, "shock"])
                    cam["fast"] = dict(PUNCH, at=(W[wi] - f0) / 30)
                    shot["lines"] = {"at": W[wi], "len": 15, "center": [0.5, 0.42]}
                elif fx == "scared_lamp":  # a turning point: the workshop lamp goes out on the word + a scared face
                    steps["fx"].append([W[wi], "scared"])
                    lamp_off = W[wi]
                    # the room goes dark with the lamp (grade follows the light: lamp 0 → "from")
                    shot["grade"] = {"from": [0.45, 1.1, 0.75], "to": [1, 1, 1], "follow": "lamp"}
                else:
                    steps["fx"].append([W[wi], fx])
                if jump:
                    steps.setdefault("jump", []).append([W[wi], jump])
                if fx == "anger":  # the edge lines + punch-in on the outburst (locked item 5)
                    cam["fast"] = dict(PUNCH, at=(W[wi] - f0) / 30)
                    shot["lines"] = {"at": W[wi], "len": 15, "center": [0.62, 0.42]}
                offs = [o if isinstance(o, tuple) else (o, sound) for o in offs]
                offs = [o for o in offs if W[wi] + o[0] < starts[i + 1]]  # only cues inside the shot
                if not offs:
                    continue
                n += 1
                for o, snd in offs:
                    cues.append({"at": f"w:{wi}+{o}", "sound": snd, "label": f"{prefix}{n} {label}"})
                main_offs = [o for o, snd in offs if snd == sound]
                reps = f" ×{len(main_offs)}" if len(main_offs) > 1 else ""
                caps.append({"text": f"{prefix}{n} · {label}{reps}", "start": W[wi] + offs[0][0]})
            shot["actors"].append({"who": who, "pos": p, "base": {"expr": "neutral"}, "tracks": {}, "steps": steps,
                                   "blink": blinks or [f0 + 6]})
        shots.append(shot)
    one = lambda v: {"frames": [0], "values": [v]}  # noqa: E731
    props = {"fps": 30, "frames": total, "dissolve": 8, "audio": None,
             "captions": [{"text": f"{test} test", "start": 0}] + caps,
             "lights": {"lantern": one(1), "window_across": one(0),
                        "lamp": {"frames": [0, lamp_off - 1, lamp_off], "values": [1, 1, 0]} if lamp_off else one(1),
                        "march": one(0), "bounce": one(0), "drop": one(0), "sign": one(0)}, "shots": shots}
    (d / "props.json").write_text(json.dumps(props, indent=1), encoding="utf-8")
    for name, lvl in levels.items():
        if sound is None:  # combo: the level is an offset for every cue (on top of ALL_SFX_DB)
            sfx = [dict(c, gain_db=lvl) for c in cues]
        else:
            # levels A / B are the final levels vs the voice (mix_audio adds ALL_SFX_DB)
            sfx = [dict(c, gain_db=lvl - SOUNDS[sound]["rel_db"] - ALL_SFX_DB) if c["sound"] == sound else c
                   for c in cues]
        shots_from = [{"from": f"f:{s['from']}"} for s in shots]  # mix_audio: click = one file per shot
        (d / f"sfx_{name}.json").write_text(json.dumps({"sfx": sfx, "shots": shots_from}, indent=1), encoding="utf-8")
    print(f"{test}: {len(shots)} shots, {total} frames, {len(cues)} cues")


if __name__ == "__main__":
    main()
