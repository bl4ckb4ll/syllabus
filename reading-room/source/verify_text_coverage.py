"""Compare every non-whitespace body character in the source files and reader assets.

Run `python verify_text_coverage.py INPUT_DIRECTORY READER_TEXT_DIRECTORY`.
This verification reads the original DOM text nodes independently of the converter.
Whitespace, layout and the separately encoded section headings are outside this comparison.
"""

import argparse
import json
import re
from pathlib import Path

from lxml import html


def source_body(work, directory):
    if work == 'manifesto':
        raw = (directory / 'manifesto.txt').read_text(encoding='ascii')
        body = raw[raw.index('A spectre is haunting Europe'):raw.index('End of the Project Gutenberg EBook')]
        heading = (r'^(?:I\.  BOURGEOIS AND PROLETARIANS|II\.  PROLETARIANS AND COMMUNISTS|'
                   r'III\.  SOCIALIST AND COMMUNIST LITERATURE|'
                   r'IV\.  POSITION OF THE COMMUNISTS IN RELATION TO THE\n'
                   r'VARIOUS EXISTING OPPOSITION PARTIES)\s*$')
        return re.sub(heading, '', body, flags=re.MULTILINE)

    encoding = 'iso-8859-1' if work == 'equiano' else 'utf-8'
    parser = html.HTMLParser(encoding=encoding, remove_comments=True)
    book = html.fromstring((directory / f'{work}.htm').read_bytes(), parser=parser).find('body')
    visible = []
    active = False
    for node in book:
        tag = node.tag
        text = ' '.join(node.text_content().split())
        if tag == 'pre' and text.startswith('End of the Project Gutenberg'):
            break
        if work == 'yellow-wallpaper':
            if tag == 'hr':
                active = True
            if tag == 'pre':
                if active:
                    break
                continue
        elif work == 'equiano':
            if tag == 'pre' and active:
                break
            if tag == 'h2' and text == 'CONTENTS':
                active = False
            if tag == 'h2' and text == 'CHAPTER I.':
                active = True
            if tag == 'p' and text.startswith('Behold, God is my salvation;'):
                visible.extend(node.xpath('.//text()'))
            if node.xpath('./p[1][starts-with(normalize-space(.), "To the Lords Spiritual and Temporal")]'):
                visible.extend(node.xpath('.//text()'))
            if tag == 'h4' and text == 'LIST of SUBSCRIBERS.':
                active = True
                continue
            if tag == 'h2' or text in ('END OF THE FIRST VOLUME.', 'VOLUME II', 'THE END.'):
                continue
        elif work == 'alcott':
            if node.xpath('a[@name="chap01"]'):
                active = True
            if tag == 'h2' and text == 'New Publication':
                break
            if node.get('class') == 'chapter' or tag == 'h2':
                continue
        elif work == 'douglass':
            if tag == 'h2' and text in ('PREFACE', 'CHAPTER I'):
                active = True
            if tag == 'h1' and text == 'FREDERICK DOUGLASS.':
                active = False  # Omit the contemporary editor's biography.
            if tag in ('h1', 'h2') or text == 'THE END':
                continue
        elif work == 'apology':
            if tag == 'h2' and text == 'INTRODUCTION.':
                active = True
            if tag == 'h2':
                continue
        elif work == 'germinal':
            if tag == 'h4' and text == 'INTRODUCTION BY HAVELOCK ELLIS':
                active = True
            if tag == 'hr' and node.get('class') == 'full' and active:
                break
            if tag == 'h4':
                continue
        if active:
            visible.extend(node.xpath('.//text()[not(ancestor::*[@class="pagenum"])]'))
    return ''.join(visible)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('reader_text_directory', type=Path)
    args = parser.parse_args()
    for work in ('douglass', 'alcott', 'apology', 'germinal', 'manifesto', 'yellow-wallpaper', 'equiano'):
        path = args.reader_text_directory / f'{work}.json'
        reader = json.loads(path.read_text(encoding='utf-8'))
        display = ''.join(p for s in reader['sections'] for p in s['paragraphs'])
        actual = re.sub(r'\s+', '', display)
        expected = re.sub(r'\s+', '', source_body(work, args.input_directory))
        if actual != expected:
            raise ValueError(f'{work}: source text differs from reader')
        print(f'{work}: all {len(actual):,} non-whitespace source-body characters retained in order')


if __name__ == '__main__':
    main()
