"""Export Butler's Iliad and Norton's Inferno from pinned Gutenberg files."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import re

from lxml import html

SOURCES = {
    "iliad": ("iliad.htm", "The-Iliad_2199", "8b251e6205845a54d4c6b70519bd06867b44c89f", 2199),
    "inferno": ("norton.txt", "The-Divine-Comedy-Volume-1-Hell_1995",
                "7c1d25741533d18373884b7bd11624d754690268", 1995),
}
FIELDS = ("work source_url catalogue input_file git_blob source_sha256 "
          "source_bytes start sections paragraphs json_sha256 coverage").split()


def squash_space(value):
    return " ".join(value.split())


def iliad(source):
    document = html.fromstring(source)
    sections = []
    inside_body = False
    for node in document.xpath("/html/body/*"):
        text = squash_space(node.text_content())
        marker = re.fullmatch(r"BOOK ([IVXL]+)", text) if node.tag == "h3" else None
        if marker:
            number = len(sections) + 1
            sections.append({"id": f"book-{number}", "title": f"Book {marker[1]}", "paragraphs": []})
            inside_body = True
        elif inside_body and node.tag == "pre":
            break
        elif inside_body and node.tag == "p" and node.get("class") != "intro" and text:
            sections[-1]["paragraphs"].append(text)
    assert len(sections) == 24
    assert sections[0]["paragraphs"][0].startswith("Sing, O goddess, the anger of Achilles")
    assert sections[-1]["paragraphs"][-1].endswith("Hector tamer of horses.")
    direct = []
    for para in document.xpath("//h3[normalize-space(text())='BOOK I']/following-sibling::p[not(@class)]"):
        text = squash_space("".join(para.xpath(".//text()")))
        if text:
            direct.append(text)
    assert direct == [p for section in sections for p in section["paragraphs"]]
    return sections


def inferno(source):
    content = source.decode("utf-8").replace("\r\n", "\n")
    body = content.split("\nHELL.\n")[-1].split("\nEnd of the Project Gutenberg", 1)[0]
    headings = list(re.finditer(r"^CANTO ([IVXL]+)\. .*(?:\n[^\n]+)*", body, re.MULTILINE))
    sections = []
    raw_bodies = []
    for index, heading in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(body)
        raw = body[heading.end():end].strip()
        paragraphs = [squash_space(p) for p in re.split(r"\n\s*\n", raw) if p.strip()]
        raw_bodies.append(raw)
        sections.append({"id": f"canto-{index + 1}", "title": f"Canto {heading[1]}", "paragraphs": paragraphs})
    assert len(sections) == 34
    assert sections[0]["paragraphs"][0].startswith("Midway upon the road of our life")
    assert any(p.endswith("see again the stars.") for p in sections[-1]["paragraphs"])
    for src, section in zip(raw_bodies, sections, strict=True):
        assert squash_space(src) == " ".join(section["paragraphs"])
    return sections


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    spec = {
        "iliad": (iliad, "book-1", "Samuel Butler’s English prose. Complete body of 24 books. Project Gutenberg boilerplate, title matter and printed chapter summaries omitted."),
        "inferno": (inferno, "canto-1", "Charles Eliot Norton’s English prose. All 34 cantos and their inline printed notes. Front matter, canto summaries, duplicate contents and Gutenberg notices omitted."),
    }
    rows = []
    for work, (file, repository, blob, book_number) in SOURCES.items():
        source = (args.inputs / file).read_bytes()
        git_header = f"blob {len(source)}\0".encode("ascii")
        assert hashlib.sha1(git_header + source).hexdigest() == blob
        extract, start, scope = spec[work]
        sections = extract(source)
        n = sum(len(section["paragraphs"]) for section in sections)
        out = (json.dumps({"sections": sections, "start": start},
                          ensure_ascii=False, indent=2) + "\n").encode("utf-8")
        (args.output / f"{work}.json").write_bytes(out)
        source_url = f"https://api.github.com/repos/GITenberg/{repository}/git/blobs/{blob}"
        catalogue = f"https://www.gutenberg.org/ebooks/{book_number}"
        rows.append((work, source_url, catalogue, file, blob, hashlib.sha256(source).hexdigest(),
                     len(source), start, len(sections), n, hashlib.sha256(out).hexdigest(), scope))
        print(f"{work}: {len(sections)} sections and {n} paragraphs, verified source and output")
    with (args.output / "provenance.tsv").open("w") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(FIELDS)
        writer.writerows(rows)


if __name__ == "__main__":
    main()
