"""Read a fact-check source (web page or PDF) as plain text, find full sentences, and check facts.md quotes.

Usage (from the project root):
  python -I tools/source_text.py <url-or-file> --find "words from the page"   # print the full sentence(s)
  python -I tools/source_text.py <url-or-file> --out page.txt                  # save the whole text
  python -I tools/source_text.py --check videos/<slug>/facts.md                # every quote vs its source

Why: the web-fetch tool returns summaries and cuts long sentences ("…"), and it can't read PDFs. facts.md
needs the EXACT supporting sentence, so copy it from this tool's --find output.
- Sources can be http(s) URLs or local files (a PDF the user downloaded, a saved page).
- PDFs are read with pypdf (installed in .venv); HTML is stripped of scripts, styles and tags.
- Matching ignores case, spacing, curly vs straight quotes and dash styles. A quote with "…" in it is
  checked piece by piece (each piece must be on the page, in order).
- --check: FOUND / NOT FOUND (fail) / UNREACHABLE (warn: the site blocks scripts; check that one by eye).
Exit code 1 if a quote is NOT FOUND.
"""
import argparse
import html
import io
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

UA = "Mozilla/5.0 (compatible; generate-animated-shorts fact check)"
TIMEOUT = 30


class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head"}
    BLOCK = {"p", "div", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "td", "th", "section", "article",
             "blockquote", "dd", "dt", "figcaption", "caption"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def pdf_text(data):
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def html_text(data, charset="utf-8"):
    p = _Text()
    p.feed(data.decode(charset or "utf-8", errors="replace"))
    return html.unescape("".join(p.parts))


def load(src):
    """Plain text of a URL or a local file. Raises OSError/URLError when it can't be read."""
    if re.match(r"(?i)https?://", src):
        req = urllib.request.Request(src, headers={"User-Agent": UA, "Accept": "text/html,application/pdf,*/*"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            data, ctype = r.read(), r.headers.get("Content-Type", "")
            charset = r.headers.get_content_charset()
    else:
        data, ctype, charset = Path(src).read_bytes(), "", None
    if data[:5] == b"%PDF-" or "pdf" in ctype.lower():
        return pdf_text(data)
    return html_text(data, charset)


def norm(text):
    """Lowercase, one space, straight quotes, plain hyphens: for matching only."""
    t = text.lower()
    t = re.sub(r"[‘’‚′`]", "'", t)
    t = re.sub(r"[“”„″]", '"', t)
    t = re.sub(r"[‐‑‒–—―−]", "-", t)
    t = re.sub(r"-\s*\n\s*", "", t)  # words broken over a line in PDFs
    t = re.sub(r"\[(?:\d+|[a-z]|citation needed|edit)\]", "", t)  # reference marks ([4], [a], [edit])
    return re.sub(r"\s+", " ", t).strip()


def pieces(quote):
    q = norm(quote).strip('"').strip()
    return [p.strip(" .,;:") for p in re.split(r"\s*(?:…|\.\.\.)\s*", q) if p.strip(" .,;:")]


def found(quote, page_norm):
    pos = 0
    for p in pieces(quote):
        i = page_norm.find(p, pos)
        if i < 0:
            return False
        pos = i + len(p)
    return True


def sentences_with(text, find):
    """Full sentences (original spelling) that contain `find`."""
    flat = re.sub(r"\[(?:\d+|[a-z]|citation needed|edit)\]", "", text)  # reference marks break sentence ends
    flat = re.sub(r"\s+", " ", flat)
    sents =re.split(r"(?<=[.!?])\s+(?=[\"“(]?[A-Z0-9])", flat)
    want = norm(find)
    head = " ".join(want.split()[:4])
    out, k = [], 0
    while k < len(sents):
        # a quote may span sentences: grow the window, but only from the sentence where the quote starts
        for span in range(1, 4 if head in norm(sents[k]) else 2):
            chunk = " ".join(sents[k:k + span])
            if want in norm(chunk):
                out.append(chunk.strip())
                k += span - 1
                break
        k += 1
    return out


def parse_facts(path):
    """[(fact_id, url, quote)] from facts.md (`- source: <url> — publisher` then `quote: "…"` lines)."""
    rows, fid, url = [], None, None
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        m = re.match(r"##\s+(F\d+)", line)
        if m:
            fid, url = m.group(1), None
            continue
        m = re.match(r"\s*-\s*source:\s*(\S+)", line)
        if m:
            url = m.group(1)
            continue
        m = re.match(r'\s*quote:\s*(.+)$', line)
        if m and url:
            q = m.group(1).strip()
            # the quote is what's inside the quote marks; a note after it ("(the sentence ends: …)") is not checked
            inner = re.match(r'["“](.+?)["”]\s*(?:\(.*\))?\s*$', q)
            rows.append((fid, url, inner.group(1) if inner else q))
    return rows


def check(path):
    rows = parse_facts(path)
    cache, bad, warn = {}, 0, 0
    print(f"# Quote check — {path}\n\n{len(rows)} quotes\n\n| | fact | source | quote |\n|---|---|---|---|")
    for fid, url, quote in rows:
        if url not in cache:
            try:
                cache[url] = norm(load(url))
            except Exception as e:  # noqa: BLE001 — any fetch problem is reported, not fatal
                cache[url] = e
        page = cache[url]
        short = quote if len(quote) <= 70 else quote[:67] + "…"
        if isinstance(page, Exception):
            warn += 1
            print(f"| ⚠️ UNREACHABLE | {fid} | {url} ({type(page).__name__}: {str(page)[:60]}) | {short} |")
        elif found(quote, page):
            print(f"| ✅ FOUND | {fid} | {url} | {short} |")
        else:
            bad += 1
            print(f"| ❌ NOT FOUND | {fid} | {url} | {short} |")
    print(f"\n**{'FAIL' if bad else 'PASS'}** — {bad} not found · {warn} unreachable (check those by eye)")
    return bad


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("source", nargs="?")
    ap.add_argument("--find")
    ap.add_argument("--out")
    ap.add_argument("--check", metavar="FACTS_MD")
    a = ap.parse_args()
    if a.check:
        sys.exit(1 if check(a.check) else 0)
    if not a.source:
        ap.error("give a source (URL or file) or --check facts.md")
    text = load(a.source)
    if a.out:
        Path(a.out).write_text(text, encoding="utf-8")
        print(f"{len(text)} characters → {a.out}")
    if a.find:
        hits = sentences_with(text, a.find)
        print("\n\n".join(hits) if hits else f"not found: “{a.find}”")
        sys.exit(0 if hits else 1)
    if not a.out:
        print(text[:3000])


if __name__ == "__main__":
    main()
