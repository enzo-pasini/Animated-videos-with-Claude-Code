"""Test for tools/source_text.py (offline: a small PDF and an HTML page made here). Run from the project root:
  .venv/Scripts/python -I tools/tests/test_source_text.py
1. --find on a PDF returns the full sentence (the PDF reader works, long sentences aren't cut).
2. --find on an HTML page skips scripts and finds the sentence across tags and curly quotes.
3. --check on a facts.md: a found quote, a quote with "…" (checked piece by piece), a quote that isn't on
   the page (NOT FOUND, exit 1) and a missing source (UNREACHABLE, a warning only).
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
T = ROOT / "out" / "tests" / "source_text"
TOOL = [sys.executable, "-I", str(ROOT / "tools/source_text.py")]

PDF_LINES = [
    "Middle ear pressure.",
    "The Eustachian tube is normally closed, and it opens for a moment when you swallow or yawn,",
    "which lets air move between the middle ear and the back of the nose.",
    "Pressure changes during descent are the most common cause of ear pain in flight.",
]


def make_pdf(lines):
    """A one-page PDF with real text (Helvetica), built by hand so the test needs no PDF writer."""
    def esc(s):
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    ops = "BT /F1 11 Tf 40 760 Td 14 TL " + " ".join(f"({esc(s)}) Tj T*" for s in lines) + " ET"
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length %d >>\nstream\n" % len(ops) + ops.encode("latin-1") + b"\nendstream",
    ]
    out, offsets = bytearray(b"%PDF-1.4\n"), []
    for i, body in enumerate(objs, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    out += b"".join(b"%010d 00000 n \n" % o for o in offsets)
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
    return bytes(out)


HTML = """<html><head><title>Ears</title><script>var hidden = "Swallowing is dangerous";</script></head>
<body><article><h1>Flying</h1><p>Cabin air is kept at a pressure like a mountain at <b>8,000 feet</b>.
It isn&rsquo;t the same as sea level, so your ears notice.</p><p>Chewing gum helps because it makes you swallow.</p>
</article></body></html>"""


def run(*args):
    return subprocess.run(TOOL + [str(a) for a in args], capture_output=True, text=True, encoding="utf-8", cwd=ROOT)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    T.mkdir(parents=True, exist_ok=True)
    pdf, page = T / "ears.pdf", T / "ears.html"
    pdf.write_bytes(make_pdf(PDF_LINES))
    page.write_text(HTML, encoding="utf-8")
    facts = T / "facts.md"
    facts.write_text(f"""# Facts — test

## F1 — the tube opens when you swallow
status: confirmed
- source: {pdf} — test PDF
  quote: "The Eustachian tube is normally closed, and it opens for a moment when you swallow or yawn"
- source: {page} — test page
  quote: "Cabin air is kept at a pressure like a mountain … 8,000 feet."

## F2 — a claim the page doesn't make
status: confirmed
- source: {page} — test page
  quote: "Gum repairs the eardrum."
- source: {T / 'missing.pdf'} — not there
  quote: "Anything."
""", encoding="utf-8")

    r1 = run(pdf, "--find", "opens for a moment")
    r2 = run(page, "--find", "isn't the same as sea level")
    r3 = run(page, "--find", "Swallowing is dangerous")
    r4 = run("--check", facts)
    checks = [
        ("PDF: full sentence returned", r1.returncode == 0 and "which lets air move between the middle ear and the back of the nose." in r1.stdout),
        ("HTML: sentence found across tags and a curly quote", r2.returncode == 0 and "It isn’t the same as sea level, so your ears notice." in r2.stdout),
        ("HTML: script text is ignored", r3.returncode == 1),
        ("check: exact quote FOUND", "| ✅ FOUND | F1 |" in r4.stdout),
        ("check: quote with … FOUND piece by piece", r4.stdout.count("✅ FOUND") == 2),
        ("check: invented quote NOT FOUND → exit 1", "| ❌ NOT FOUND | F2 |" in r4.stdout and r4.returncode == 1),
        ("check: missing source is UNREACHABLE (warning)", "⚠️ UNREACHABLE | F2" in r4.stdout),
    ]
    failed = 0
    for name, ok in checks:
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}")
    if failed:
        print(r1.stdout, r1.stderr, r2.stdout, r4.stdout, r4.stderr, sep="\n---\n")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
