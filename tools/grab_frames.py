"""Save full-resolution frames (optionally cropped) from the reference videos.

Usage: python -I tools/grab_frames.py <videos_dir> <out_dir> ID@SECONDS[:x0,y0,x1,y1] ...
Crop box is in fractions of the frame (0-1). Output: <out_dir>/<ID>_<SECONDS>s.png
"""
import sys
from pathlib import Path

import cv2


def grab(video, t):
    cap = cv2.VideoCapture(str(video))
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise RuntimeError(f"cannot read {video} at {t}s")
    return frame


def main(videos, out, specs):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    for spec in specs:
        vid, rest = spec.split("@")
        t, _, box = rest.partition(":")
        frame = grab(Path(videos) / f"{vid}.mp4", float(t))
        if box:
            h, w = frame.shape[:2]
            x0, y0, x1, y1 = (float(v) for v in box.split(","))
            frame = frame[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]
        path = out / f"{vid}_{float(t):.1f}s.png"
        cv2.imwrite(str(path), frame)
        print(path)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
