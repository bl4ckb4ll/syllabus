#!/usr/bin/env python3
"""Refresh the local bibliographic mirror of Armin Straub's Notices "What Is...?" index.

This mirrors only bibliographic metadata and outbound links. It does not copy AMS
article bodies or PDFs.
"""

from __future__ import annotations

from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urljoin
from urllib.request import Request, urlopen

SOURCE_URL = "https://arminstraub.com/math/what-is-column"
AMS_COLLECTION_URL = "https://www.ams.org/cgi-bin/notices/nxgnotices.pl?cnt=whatis&fm=gen"
OUTPUT = (
    Path(__file__).resolve().parents[1]
    / "life-changing mathematics"
    / "Armin Straub – Notices What Is column – continuity mirror.md"
)


def md_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("[", "\\[").replace("]", "\\]")


class WhatIsParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_li = False
        self.href: str | None = None
        self.parts: list[str] = []
        self.plain: list[str] = []
        self.items: list[str] = []

    def finish_item(self) -> None:
        if not self.in_li:
            return
        plain = re.sub(r"\s+", " ", "".join(self.plain)).strip()
        rendered = re.sub(r"\s+", " ", "".join(self.parts)).strip()
        if plain.lower().startswith("what is"):
            self.items.append(rendered)
        self.in_li = False
        self.href = None
        self.parts = []
        self.plain = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "li":
            self.finish_item()
            self.in_li = True
        elif self.in_li and tag == "a":
            self.href = dict(attrs).get("href")

    def handle_endtag(self, tag: str) -> None:
        if self.in_li and tag == "a":
            self.href = None
        elif tag == "li":
            self.finish_item()
        elif tag == "ol":
            self.finish_item()

    def handle_data(self, data: str) -> None:
        if not self.in_li:
            return
        text = unescape(data)
        self.plain.append(text)
        if not text:
            return
        if self.href and text.strip():
            absolute = urljoin(SOURCE_URL, self.href)
            self.parts.append(f"[{md_escape(text)}]({absolute})")
        else:
            self.parts.append(md_escape(text))


def fetch_items() -> list[str]:
    req = Request(
        SOURCE_URL,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urlopen(req, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")
    parser = WhatIsParser()
    parser.feed(html)
    parser.finish_item()
    if len(parser.items) < 150:
        raise RuntimeError(
            f"refusing to overwrite mirror: extracted only {len(parser.items)} entries "
            f"from {len(html)} bytes"
        )
    return parser.items


def render(items: list[str]) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        '# Notices of the AMS “What Is...?” — continuity mirror',
        "",
        "Armin Straub has maintained a remarkably useful public index to the *Notices of the American Mathematical Society* “What Is...?” column. We are very grateful to him for hosting and maintaining that index for so long. This copy exists for continuity: if his page ever moves or disappears, the bibliographic index and its outbound links should not disappear with it.",
        "",
        "This mirror preserves bibliographic metadata and links only. It does **not** copy or rehost AMS article text or PDFs.",
        "",
        f"- Original Straub index: {SOURCE_URL}",
        f"- Official AMS What Is collection: {AMS_COLLECTION_URL}",
        f"- Last automated refresh: {stamp}",
        f"- Entries mirrored: {len(items)}",
        "",
        "## Straub index snapshot",
        "",
    ]
    lines.extend(f"{i}. {item}" for i, item in enumerate(items, 1))
    lines.extend(
        [
            "",
            "## Additions in Life-changing mathematics",
            "",
            "The following *Notices* survey articles are favorites in this collection and are **not claimed to be entries in Straub’s ‘What Is...?’ index**:",
            "",
            "- [Joshua Evan Greene — *Heegaard Floer Homology*](<Joshua Evan Greene – Heegaard Floer Homology.md>) — January 2021, *Notices of the AMS* 68(1), 19–33; DOI: https://doi.org/10.1090/noti2194",
            "- [Juanita Pinzón-Caicedo and Daniel Ruberman — *Applications of Instanton Floer Homology*](<Juanita Pinzón-Caicedo and Daniel Ruberman – Applications of Instanton Floer Homology.md>) — September 2022, *Notices of the AMS* 69(8), 1307–1319; DOI: https://doi.org/10.1090/noti2536",
            "",
            "## Provenance",
            "",
            "The ordering, title/author/date metadata, and outbound article links in the snapshot are mechanically extracted from Straub’s public index. The gratitude/continuity note and the two additions above are local to this repository.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    items = fetch_items()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render(items), encoding="utf-8")
    print(f"wrote {OUTPUT} with {len(items)} entries")


if __name__ == "__main__":
    main()
