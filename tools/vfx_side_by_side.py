"""Side-by-side video: a VFX reference clip (left) vs our test render (right), one segment per test shot.

Usage (from the project root):
  .venv/Scripts/python -I tools/vfx_side_by_side.py <ref.mp4> <ref_start_s> <test.mp4> <out.mp4>
        --shot 100 --seg 90 --labels "day street,night street"

The reference clip [ref_start, ref_start + seg frames] repeats next to each test shot (test frames
shot*i … shot*i + seg). Choose ref_start so the effect starts on the same frame in both. --ref-loop N repeats only the first N
reference frames (for a short reference shot that cuts away before our segment ends).
--test-from N starts each test segment N frames into its shot (our effect starts later in the shot than the reference).
Each half is 540x960 with a label and the frame number. Also writes <out>_keys.jpg (8 key frames).
"""
import argparse
import subprocess

import cv2
import numpy as np

W, H = 540, 960


def tag(img, text):
    cv2.rectangle(img, (0, 0), (W, 44), (0, 0, 0), -1)
    cv2.putText(img, text, (12, 31), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ref")
    ap.add_argument("ref_start", type=float)
    ap.add_argument("test")
    ap.add_argument("out")
    ap.add_argument("--shot", type=int, default=100)
    ap.add_argument("--seg", type=int, default=90)
    ap.add_argument("--labels", default="")
    ap.add_argument("--ref-loop", type=int, default=0, help="repeat only the first N reference frames")
    ap.add_argument("--test-from", type=int, default=0, help="start each test segment this many frames into its shot")
    ap.add_argument("--keys", default="0,20,28,31,34,40,60,89", help="segment frames for the key sheet (first shot)")
    a = ap.parse_args()
    labels = [s.strip() for s in a.labels.split(",") if s.strip()]

    ref = cv2.VideoCapture(a.ref)
    ref.set(cv2.CAP_PROP_POS_MSEC, a.ref_start * 1000)
    n_ref = min(a.ref_loop, a.seg) if a.ref_loop else a.seg
    ref_frames = [cv2.resize(ref.read()[1], (W, H), interpolation=cv2.INTER_AREA) for _ in range(n_ref)]
    test = cv2.VideoCapture(a.test)
    n_shots = max(1, len(labels)) if labels else int(test.get(cv2.CAP_PROP_FRAME_COUNT)) // a.shot
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{2 * W}x{H}",
                           "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", a.out],
                          stdin=subprocess.PIPE)
    keys, key_idx = [], [int(k) for k in a.keys.split(",")]
    for s in range(n_shots):
        test.set(cv2.CAP_PROP_POS_FRAMES, s * a.shot + a.test_from)
        for i in range(a.seg):
            l = ref_frames[i % n_ref].copy()
            r = cv2.resize(test.read()[1], (W, H), interpolation=cv2.INTER_AREA)
            tag(l, f"reference  f{i % n_ref}")
            tag(r, f"ours: {labels[s] if s < len(labels) else s + 1}  f{a.test_from + i}")
            frame = np.hstack([l, r])
            ff.stdin.write(frame.tobytes())
            if s == 0 and i in key_idx:
                keys.append(cv2.resize(frame, (540, 480)))
    ff.stdin.close()
    ff.wait()
    while len(keys) % 4:
        keys.append(np.zeros_like(keys[0]))
    cv2.imwrite(a.out.rsplit(".", 1)[0] + "_keys.jpg", np.vstack([np.hstack(keys[i:i + 4]) for i in range(0, len(keys), 4)]))
    print(a.out)


if __name__ == "__main__":
    main()
