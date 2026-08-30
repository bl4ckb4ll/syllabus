#!/usr/bin/env ithon
"""Normalize one captured USF Simple Syllabus JSON document.

Output is intentionally machine-oriented. Book candidates preserve source text;
this parser does not pretend that a heuristic citation split is a canonical book
record.
"""

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import re
from pathlib import Path

COURSE_RE = re.compile(r"^\s*([A-Za-z]{3})\s*([0-9]{4})\s*[-:–—]?\s*(.*)$")
ISBN_RE = re.compile(r"(?<!\d)(?:97[89][- ]?)?(?:\d[- ]?){9}[\dXx](?!\d)")
BOOK_SECTION_RE = re.compile(r"book|text|reading|material", re.I)


class TextExtractor(HTMLParser):
    BREAK_TAGS = {"br", "p", "div", "li", "tr", "section", "article", "h1", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() in self.BREAK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag.lower() in self.BREAK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)

    def text(self):
        raw = html.unescape("".join(self.parts))
        lines = [re.sub(r"\s+", " ", line).strip() for line in raw.splitlines()]
        return "\n".join(line for line in lines if line)


def html_text(fragment):
    parser = TextExtractor()
    parser.feed(fragment or "")
    parser.close()
    return parser.text()


def normalized_isbns(text):
    out = []
    for match in ISBN_RE.findall(text):
        value = re.sub(r"[- ]", "", match).upper()
        if value not in out:
            out.append(value)
    return out


def editor_names(item):
    names = []
    for editor in item.get("editors") or []:
        if isinstance(editor, dict):
            name = editor.get("name") or editor.get("full_name")
        else:
            name = str(editor)
        if name and name not in names:
            names.append(name)
    return names


def book_candidates(components):
    candidates = []
    seen = set()
    for component in components:
        heading = str(component.get("title") or component.get("name") or "")
        if not BOOK_SECTION_RE.search(heading):
            continue
        text = html_text(component.get("html") or "")
        if not text:
            continue
        for line in text.splitlines():
            if len(line) < 4:
                continue
            key = (heading, line)
            if key in seen:
                continue
            seen.add(key)
            candidates.append({"section": heading, "source_text": line, "isbns": normalized_isbns(line)})
    return candidates


def parse_document(data, source_path, source_uri):
    items = data.get("items") or []
    if len(items) != 1 or not isinstance(items[0], dict):
        raise ValueError("expected exactly one document item")
    item = items[0]

    title = str(item.get("title") or item.get("course_title") or "").strip()
    match = COURSE_RE.match(title)
    if match:
        course_code = match.group(1).upper() + " " + match.group(2)
        course_title = match.group(3).strip()
    else:
        course_code = None
        course_title = title or None

    doc_data = item.get("doc_data") or {}
    components = sorted(doc_data.get("components") or [], key=lambda c: c.get("sort_order") or 0)
    normalized_components = []
    for component in components:
        normalized_components.append({"sort_order": component.get("sort_order"), "title": component.get("title") or component.get("name"), "text": html_text(component.get("html") or "")})

    source_bytes = Path(source_path).read_bytes()
    return {
        "schema": 1,
        "university": "University of South Florida",
        "source": {"path": str(source_path), "uri": source_uri, "sha256": hashlib.sha256(source_bytes).hexdigest()},
        "document_code": item.get("code"),
        "course_code": course_code,
        "course_title": course_title,
        "term": item.get("term_name"),
        "instructors": editor_names(item),
        "book_candidates": book_candidates(components),
        "components": normalized_components,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--source-uri", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    source = Path(args.input)
    data = json.loads(source.read_text(encoding="utf-8"))
    result = parse_document(data, source, args.source_uri)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
