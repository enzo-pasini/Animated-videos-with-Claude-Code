"""Side-by-side sheet: our preview frames (top) vs reference style frames (bottom), with look numbers.

Usage: python -I tools/compare_sheet.py <out.jpg> [label=frames_dir ...]   (run from the project root)
Each label=dir adds one row of our frames (default: ours=out/frames); the reference row is always last.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image, ImageDraw, ImageFont  # noqa: E402
from measure_frames import measure  # noqa: E402

REF = Path("references/analysis/style_frames")
OURS = Path("out/frames")
PAIRS = [
    ("f50.png", "06_alley_night_cool.jpg", "medium · night + warm practical"),
    ("f100.png", "08_castle_night_lineart.jpg", "night world · thin line art"),
    ("f170.png", "02_canyon_walking_closeup.jpg", "close-up · head ~50 % W"),
    ("f262.png", "05_prize_counter_warm.jpg", "warm light moment"),
    ("f330.png", "07_pirates_deck.jpg", "characters · proportions"),
]
TW, TH = 420, 747
FONT = ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", 22)
SMALL = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 18)
PAD, LABEL = 16, 70


def tile(path):
    im = Image.open(path).convert("RGB")
    s = min(TW / im.width, TH / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    t = Image.new("RGB", (TW, TH), (18, 14, 24))
    t.paste(im, ((TW - im.width) // 2, (TH - im.height) // 2))
    return t


def nums(m):
    return (f"luma {m['luma']:.0f} · std {m['contrast']:.0f} · p5 {m['p5']:.0f} · p95 {m['p95']:.0f}",
            f"sat {m['sat']:.2f} · colorful {m['colorful']:.0f} · {m['kind']}")


def main(out, rows):
    cols = len(PAIRS)
    cap_h = 320
    nrows = len(rows) + 1
    W = PAD + cols * (TW + PAD)
    H = 60 + nrows * (TH + LABEL + PAD) + cap_h + PAD
    sheet = Image.new("RGB", (W, H), (30, 26, 40))
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 16), "STYLE TEST  ·  rows: " + " / ".join(l for l, _ in rows) + " (Bram, 12 s)  ·  last row: reference style frames",
           font=FONT, fill=(240, 236, 228))
    for i, (o, r, title) in enumerate(PAIRS):
        x = PAD + i * (TW + PAD)
        items = [(Path(dr) / o, f"{lab.upper()} {o}") for lab, dr in rows] + [(REF / r, "REF " + r[:22])]
        for row, (p, who) in enumerate(items):
            y = 60 + row * (TH + LABEL + PAD)
            sheet.paste(tile(p), (x, y))
            m = measure(p)
            a, b = nums(m)
            ours_row = row < len(rows)
            d.text((x, y + TH + 4), f"{who}  ·  {title}" if row == 0 else who, font=SMALL,
                   fill=(255, 214, 150) if ours_row else (170, 190, 255))
            d.text((x, y + TH + 26), a, font=SMALL, fill=(225, 222, 232))
            d.text((x, y + TH + 46), b, font=SMALL, fill=(225, 222, 232))
    # caption crops at 1:1 (same 1080x1920 scale)
    y = 60 + nrows * (TH + LABEL + PAD)
    ref = Image.open(REF / "12_caption_closeup.png").convert("RGB")  # native 1080x1920 scale
    cx, cy = 540, round(0.703 * 1920)
    ours = Image.open(Path(rows[-1][1]) / "f330.png").convert("RGB").crop(
        (cx - ref.width // 2, cy - ref.height // 2, cx + ref.width - ref.width // 2, cy + ref.height - ref.height // 2))
    d.text((PAD, y), "captions at 1:1 pixel scale (left ours, Montserrat Black 72 px · right reference)", font=SMALL, fill=(240, 236, 228))
    sheet.paste(ours, (PAD, y + 30))
    sheet.paste(ref, (PAD + ours.width + 40, y + 30))
    sheet.save(out, quality=92)
    print("saved", out, sheet.size)


if __name__ == "__main__":
    rows = [tuple(a.split("=", 1)) for a in sys.argv[2:]] or [("ours", str(OURS))]
    main(sys.argv[1], rows)
