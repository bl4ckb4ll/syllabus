#!/usr/bin/env ithon
"""Normalize captured USF Simple Syllabus evidence.

Output is intentionally machine-oriented. Book candidates preserve source text;
this parser does not pretend that a heuristic citation split is a canonical book
record. Legacy full-page JSON remains replayable; current acquisition uses the
public HTML fragment plus the corresponding public library item metadata.
"""

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import re
from pathlib import Path

COURSE_RE = re.compile(r"^\s*([A-Za-z]{3})\s*([0-9]{4})\s*[-:–—]?\s*(.*)$")
COURSE_SECTION_RE = re.compile(r"^\s*([A-Za-z]{3})\s*([0-9]{4})(?:\s+\(AC\.[^)]+\))?(?:\s+([^\s]+))?")
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
        return normalize_parts(self.parts)


def normalize_parts(parts):
    raw = html.unescape("".join(parts))
    lines = [re.sub(r"\s+", " ", line).strip() for line in raw.splitlines()]
    return "\n".join(line for line in lines if line)


class ComponentExtractor(HTMLParser):
    """Extract public Simple Syllabus component wrappers without a DOM dependency."""

    BREAK_TAGS = TextExtractor.BREAK_TAGS | {"dd", "dt", "td", "th", "ul", "ol"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.components = []
        self.active = None
        self.div_depth = 0
        self.heading_depth = 0
        self.skip_depth = 0

    @staticmethod
    def classes(attrs):
        return set(dict(attrs).get("class", "").split())

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        classes = self.classes(attrs)
        if self.active is None and tag == "div" and "component-wrapper" in classes:
            self.active = {"heading": [], "body": []}
            self.div_depth = 1
            return
        if self.active is None:
            return
        if tag == "div":
            self.div_depth += 1
        if tag in {"script", "style"}:
            self.skip_depth += 1
        if tag in {"h1", "h2", "h3"} and "component-name" in classes:
            self.heading_depth += 1
        elif tag in self.BREAK_TAGS and not self.skip_depth:
            self.active["body"].append("\n")

    def handle_startendtag(self, tag, attrs):
        if self.active is not None and tag.lower() == "br" and not self.skip_depth:
            self.active["body"].append("\n")

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self.active is None:
            return
        if tag in {"h1", "h2", "h3"} and self.heading_depth:
            self.heading_depth -= 1
        elif tag in self.BREAK_TAGS and not self.skip_depth:
            self.active["body"].append("\n")
        if tag in {"script", "style"} and self.skip_depth:
            self.skip_depth -= 1
        if tag == "div":
            self.div_depth -= 1
            if self.div_depth == 0:
                heading = normalize_parts(self.active["heading"])
                body = normalize_parts(self.active["body"])
                self.components.append({"sort_order": len(self.components), "title": heading or None, "text": body})
                self.active = None

    def handle_data(self, data):
        if self.active is None or self.skip_depth:
            return
        if self.heading_depth:
            self.active["heading"].append(data)
        else:
            self.active["body"].append(data)


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


def text_book_candidates(components):
    candidates = []
    seen = set()
    for component in components:
        heading = str(component.get("title") or "")
        if not BOOK_SECTION_RE.search(heading):
            continue
        for line in (component.get("text") or "").splitlines():
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


def parse_public_html(source_path, metadata_path, source_uri, public_uri):
    metadata = json.loads(Path(metadata_path).read_text(encoding="utf-8"))
    if not isinstance(metadata, dict):
        raise ValueError("expected one Simple Syllabus library item as metadata")

    title = str(metadata.get("title") or "").strip()
    match = COURSE_SECTION_RE.match(title)
    course_code = None
    section = None
    if match:
        course_code = match.group(1).upper() + " " + match.group(2)
        section = match.group(3)

    source_bytes = Path(source_path).read_bytes()
    source_text = source_bytes.decode("utf-8")
    extractor = ComponentExtractor()
    extractor.feed(source_text)
    extractor.close()
    components = extractor.components
    if not components:
        fallback = html_text(source_text)
        components = [{"sort_order": 0, "title": "Document", "text": fallback}]

    metadata_bytes = Path(metadata_path).read_bytes()
    return {
        "schema": 2,
        "university": "University of South Florida",
        "source": {
            "path": str(source_path),
            "uri": source_uri,
            "public_uri": public_uri,
            "sha256": hashlib.sha256(source_bytes).hexdigest(),
            "metadata_path": str(metadata_path),
            "metadata_sha256": hashlib.sha256(metadata_bytes).hexdigest(),
        },
        "document_code": metadata.get("code"),
        "course_code": course_code,
        "course_section": section,
        "course_title": metadata.get("sub_title") or None,
        "term": metadata.get("term_name"),
        "instructors": editor_names(metadata),
        "book_candidates": text_book_candidates(components),
        "components": components,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--metadata")
    parser.add_argument("--source-uri", required=True)
    parser.add_argument("--public-uri")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    source = Path(args.input)
    if args.metadata:
        if not args.public_uri:
            parser.error("--public-uri is required with --metadata")
        result = parse_public_html(source, args.metadata, args.source_uri, args.public_uri)
    else:
        data = json.loads(source.read_text(encoding="utf-8"))
        result = parse_document(data, source, args.source_uri)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
