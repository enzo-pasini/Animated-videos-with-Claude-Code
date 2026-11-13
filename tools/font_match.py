"""Compare the caption font with candidate fonts at the same x-height.

Usage: python -I tools/font_match.py <references_dir> <out.jpg> ID@SECONDS=TEXT ... --fonts F.ttf ...

For each sample: crops the real caption (box from style_probe's detector), renders TEXT in
every candidate font scaled to the real x-height, and reports the width ratio
rendered / real (1.00 = same width). Writes a side-by-side sheet to <out.jpg>.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from style_probe import find_caption  # noqa: E402


def render(text, font_path, x_height, stroke, tracking=0.0):
    """Render white text with a black stroke; tracking = extra space between letters, in em."""
    probe = ImageFont.truetype(font_path, 200)
    xb = probe.getbbox("x")
    size = int(round(200 * x_height / (xb[3] - xb[1])))
    font = ImageFont.truetype(font_path, size)
    xs, x = [], 0.0
    for ch in text:
        xs.append(x)
        x += font.getlength(ch) + tracking * size
    l, t, _, b = font.getbbox(text, stroke_width=stroke)
    img = Image.new("RGB", (int(x) + 2 * stroke + 20, b - t + 20), (90, 90, 90))
    draw = ImageDraw.Draw(img)
    for layer in ("stroke", "fill"):           # all strokes first, so a letter's stroke never covers its neighbour
        for ch, cx in zip(text, xs):
            draw.text((10 + stroke + cx, 10 - t), ch, font=font, fill=(255, 255, 255) if layer == "fill" else (0, 0, 0),
                      stroke_width=stroke if layer == "stroke" else 0, stroke_fill=(0, 0, 0))
    ink_l = font.getbbox(text[0])[0]
    ink_r = xs[-1] + font.getbbox(text[-1])[2]
    return np.array(img)[:, :, ::-1].copy(), ink_r - ink_l


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("references")
    ap.add_argument("out")
    ap.add_argument("samples", nargs="+")
    ap.add_argument("--fonts", nargs="+", required=True, help="font.ttf or font.ttf@tracking_em")
    args = ap.parse_args()
    ref = Path(args.references)
    rows, scores = [], {f: [] for f in args.fonts}
    for s in args.samples:
        left, text = s.split("=", 1)
        vid, t = left.split("@")
        cap = cv2.VideoCapture(str(ref / "videos" / f"{vid}.mp4"))
        cap.set(cv2.CAP_PROP_POS_MSEC, float(t) * 1000)
        _, frame = cap.read()
        c = find_caption(frame)
        h, w = frame.shape[:2]
        cy, bw, bh = int(c["cy"] * h), c["box_w_px"], c["box_h_px"]
        real = frame[cy - bh:cy + bh, w // 2 - bw // 2 - 30:w // 2 + bw // 2 + 30]
        tiles = [cv2.putText(real.copy(), "REAL", (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1)]
        for f in args.fonts:
            path, _, track = f.partition("@")
            img, ink_w = render(text, path, c["x_height_px"], stroke=6, tracking=float(track or 0))
            ratio = ink_w / bw
            scores[f].append(ratio)
            label = f"{Path(path).stem}{' ' + track + 'em' if track else ''} w={ratio:.2f}"
            cv2.putText(img, label, (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1)
            tiles.append(img)
        width = max(x.shape[1] for x in tiles)
        rows.append(np.vstack([np.pad(x, ((0, 4), (0, width - x.shape[1]), (0, 0))) for x in tiles]))
    width = max(r.shape[1] for r in rows)
    sheet = np.hstack([np.pad(r, ((0, max(x.shape[0] for x in rows) - r.shape[0]), (0, 10), (0, 0))) for r in rows])
    cv2.imwrite(args.out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
    for f, v in sorted(scores.items(), key=lambda kv: abs(np.mean(kv[1]) - 1)):
        print(f"{Path(f).name:22s} width ratio {np.mean(v):.2f}  per sample {[round(x, 2) for x in v]}")


if __name__ == "__main__":
    main()
