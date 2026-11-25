"""Prepare the Blackball reader texts from their pinned Gutenberg source bytes.

Run `python prepare_texts.py INPUT_DIRECTORY OUTPUT_DIRECTORY` with Python and
lxml. The input filenames are in SOURCES below. From a source_url in the TSV,
a GitHub Git Blobs response contains the base64-encoded original file. The Git
blob digest guards edition identity even when the hosting URL changes.
"""

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

from lxml import html


# work, input filename, GITenberg repository, Git blob, Project Gutenberg number
SOURCES = [
    ('douglass', 'douglass.htm', 'Narrative-of-the-Life-of-Frederick-Douglass-an-American-Slave_23',
     '3e5d9f880f2e005709d06dc8cb7ca7c403fb7112', 23),
    ('alcott', 'alcott.htm', 'Hospital-Sketches_3837',
     '431d094258b6ec4c5ad7e52e17aae8b3c78d3efa', 3837),
    ('apology', 'apology.htm', 'Apology_1656',
     '2cb21d287e3ca6e821b27070ecf580a3800c24b3', 1656),
    ('germinal', 'germinal.htm', 'Germinal_56528',
     '610e81f0a8f27c5aa9bcd0c351161c9913a506eb', 56528),
    ('manifesto', 'manifesto.txt', 'The-Communist-Manifesto_61',
     '6b77229ffcac25df8e97f9e8492cf5a8e08855db', 61),
    ('yellow-wallpaper', 'yellow-wallpaper.htm', 'The-Yellow-Wallpaper_1952',
     '853c387918cfc68b679442889ddc1beab24f25e6', 1952),
    ('equiano', 'equiano.htm',
     'The-Interesting-Narrative-of-the-Life-of-Olaudah-Equiano-Or-Gustavus-Vassa-The-AfricanWritten__15399',
     'fe7eda66e7e94ae7e46ba3b5c3fce679dfa4208b', 15399),
]
ROMAN = ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII')


def words(text):
    return ' '.join(text.split())


def body(source, encoding='utf-8'):
    parser = html.HTMLParser(encoding=encoding, remove_comments=True)
    return html.fromstring(source, parser=parser).find('body')


def lines(element):
    # An inline element can split a word. Join native text and tails without
    # inserting spaces on tag boundaries. Keep a real break for <br>.
    def collect(node):
        yield node.text or ''
        for child in node:
            if child.tag == 'br':
                yield '\x1e'
            else:
                yield from collect(child)
            yield child.tail or ''

    parts = ''.join(collect(element)).split('\x1e')
    return '\n'.join(value for part in parts if (value := words(part)))


def paragraphs(element):
    if element.tag == 'pre':
        # Songs, affidavits and inset notes in Douglass use preformatted text.
        for stanza in re.split(r'\n\s*\n', element.text_content().strip()):
            block = '\n'.join(line.strip() for line in stanza.splitlines()).strip()
            if block:
                yield block
    elif element.tag in ('p', 'h3'):
        if value := lines(element):
            yield value
    elif element.tag in ('div', 'blockquote'):
        if element.get('class') == 'poem1' or element.get('id') == 'laddered-signature':
            yield '\n'.join(lines(p) for p in element.iter('p') if lines(p))
        else:
            for child in element:
                yield from paragraphs(child)


def section(collection, identifier, title):
    record = {'id': identifier, 'title': title, 'paragraphs': []}
    collection.append(record)
    return record['paragraphs']


def douglass(source):
    sections = []
    active = None
    for e in body(source):
        label = words(e.text_content())
        if e.tag == 'h2':
            if label == 'PREFACE':
                active = section(sections, 'preface', 'Preface by William Lloyd Garrison')
            elif label == 'LETTER FROM WENDELL PHILLIPS, ESQ.':
                active = section(sections, 'letter', 'Letter from Wendell Phillips')
            elif label.startswith('CHAPTER '):
                roman = label.split()[1]
                active = section(sections, f'ch-{ROMAN.index(roman) + 1}', f'Chapter {roman}')
            elif label == 'APPENDIX':
                active = section(sections, 'appendix', 'Appendix')
        elif e.tag == 'h1' and label == 'FREDERICK DOUGLASS.':
            # This Gutenberg transcription inserts a later anonymous biography
            # here. The original 1845 narrative starts at the next heading.
            active = None
        elif e.tag == 'pre' and label.startswith('End of the Project Gutenberg'):
            break
        elif active is not None and label != 'THE END':
            active.extend(paragraphs(e))
    return sections, 'ch-1', '1845 narrative: Garrison preface, Phillips letter with date, chapters I–XI, appendix through the Lynn signature. Later biographical insertion and ebook boilerplate omitted.'


def alcott(source):
    book = body(source)
    for pagenum in book.xpath('.//span[@class="pagenum"]'):
        pagenum.drop_tree()  # Retain the following text, even inside a sentence.
    toc = {a.get('href')[1:]: lines(a) for a in book.xpath('.//table//a')}
    sections = []
    active = None
    for e in book:
        if e.tag == 'h2' and lines(e) == 'New Publication':
            break
        if e.tag == 'div' and e.get('class') == 'chapter':
            names = e.xpath('p[@class="chap-name"]')
            if not names:
                continue
            anchor = e.xpath('a/@name')[0]
            name = lines(names[0]).rstrip('.')
            if toc[anchor] != name:
                raise ValueError(f'Alcott contents disagree with printed heading for {anchor}')
            number = len(sections) + 1
            if anchor != f'chap{number:02}':
                raise ValueError(f'Unexpected Alcott chapter {anchor}')
            active = section(sections, f'ch-{number}', f'Chapter {ROMAN[number - 1]} · {name}')
        elif active is not None and e.tag != 'h2':
            active.extend(paragraphs(e))
    return sections, 'ch-1', 'Six 1863 sketches from Obtaining Supplies through A Postscript, including verse and final signature. Chapter names follow visible print headings and contents. Front matter, advertisements and transcriber notes omitted.'


def apology(source):
    sections = []
    active = None
    for e in body(source):
        label = words(e.text_content())
        if e.tag == 'h2' and label == 'INTRODUCTION.':
            active = section(sections, 'introduction', 'Introduction by Benjamin Jowett')
        elif e.tag == 'h2' and label == 'APOLOGY':
            active = section(sections, 'speech', 'Apology')
        elif e.tag == 'pre' and label.startswith('End of the Project Gutenberg'):
            break
        elif active is not None:
            active.extend(paragraphs(e))
    return sections, 'speech', 'Benjamin Jowett translation. Translator introduction plus the entire speech through the final judgment on death and life.'


def germinal(source):
    part_names = ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN')
    sections = []
    active = None
    part = 0
    counts = []
    for e in body(source):
        label = words(e.text_content())
        if e.tag == 'h4' and label == 'INTRODUCTION BY HAVELOCK ELLIS':
            active = section(sections, 'introduction', 'Introduction by Havelock Ellis')
        elif e.tag == 'h4' and label.startswith('PART '):
            part += 1
            if label != f'PART {part_names[part - 1]}':
                raise ValueError(f'Unexpected Germinal part {label}')
            counts.append(0)
            active = None
        elif e.tag == 'h4' and label.startswith('CHAPTER '):
            chapter = counts[-1] + 1
            counts[-1] = chapter
            roman = ROMAN[chapter - 1]
            if label != f'CHAPTER {roman}':
                raise ValueError(f'Unexpected Germinal chapter {label}')
            active = section(sections, f'p{part}-ch{chapter}', f'Part {ROMAN[part - 1]} · Chapter {roman}')
        elif e.tag == 'hr' and e.get('class') == 'full' and part:
            break  # Contents and Gutenberg notice follow the last chapter.
        elif active is not None:
            active.extend(paragraphs(e))
    if counts != [6, 5, 5, 7, 6, 5, 6]:
        raise ValueError(f'Germinal chapters per part differ: {counts}')
    return sections, 'p1-ch1', 'Havelock Ellis introduction and English translation. Seven parts and 40 chapters (6 / 5 / 5 / 7 / 6 / 5 / 6), through the final harvest image. Back-of-book contents and ebook notices omitted.'


def manifesto(source):
    text = source.decode('ascii').replace('\r\n', '\n')
    text = text[text.index('A spectre is haunting Europe'):text.index('End of the Project Gutenberg EBook')]
    headings = [
        'Bourgeois and Proletarians', 'Proletarians and Communists',
        'Socialist and Communist Literature',
        'Position of the Communists in Relation to the Various Existing Opposition Parties',
    ]
    labels = {f'{ROMAN[i]}. {heading.upper()}': (f'part-{i + 1}', f'{ROMAN[i]}. {heading}')
              for i, heading in enumerate(headings)}
    sections = []
    active = section(sections, 'preamble', 'Preamble')
    for block in re.split(r'\n\s*\n', text.strip()):
        value = words(block)
        if value in labels:
            active = section(sections, *labels[value])
        else:
            active.append(value)
    return sections, 'part-1', '1888 English edition, edited by Friedrich Engels. Preamble and all four sections, through the final appeal. No later prefaces or ebook notices.'


def yellow_wallpaper(source):
    # The source has ten typographic breaks between its eleven journal entries.
    # They have no printed titles or numbers. The labels serve navigation.
    sections = []
    active = None
    in_story = False
    for element in body(source):
        if element.tag == 'hr':
            in_story = True
        elif in_story and element.tag == 'pre':
            break
        elif in_story and element.tag == 'p':
            text = lines(element)
            if not text:
                active = None
                continue
            if active is None:
                number = len(sections) + 1
                identifier = 'story' if number == 1 else f'entry-{number}'
                active = section(sections, identifier, f'Journal entry {number}')
            active.append(text)
    return sections, 'story', '1892 story in English, from the arrival at the house to the final sentence. The 11 entry labels identify typographic breaks in this transcription.'


def equiano_blocks(node):
    if node.tag in ('p', 'h3', 'h4') or node.get('class') == 'stanza':
        value = lines(node)
        if value:
            yield value
    else:
        for child in node:
            blocks = list(equiano_blocks(child))
            # A period after the first paragraph of the petition to the Queen
            # sits outside its closing tag in this edition.
            if child.tail and child.tail.strip():
                if not blocks:
                    raise ValueError('Unexpected text after an empty Equiano block')
                blocks[-1] += child.tail.strip()
            yield from blocks


def equiano(source):
    # PG #15399 includes both volumes. The source declares Latin-1 and uses the
    # pound sign literally in two places; treating its bytes as UTF-8 loses it.
    sections = []
    active = None
    chapter = 0
    for element in body(source, 'iso-8859-1'):
        label = words(element.text_content())
        if element.tag == 'p' and label.startswith('Behold, God is my salvation;'):
            section(sections, 'epigraph', 'Volume I · Epigraph').append(lines(element))
        elif element.tag == 'div' and label.startswith('To the Lords Spiritual and Temporal,'):
            section(sections, 'dedication', 'Dedication to Parliament').extend(equiano_blocks(element))
        elif element.tag == 'h4' and label == 'LIST of SUBSCRIBERS.':
            active = section(sections, 'subscribers', 'List of subscribers')
        elif element.tag == 'h2' and label == 'CONTENTS':
            active = None
        elif element.tag == 'h2' and re.fullmatch(r'CHAP(?:TER)?\.? [IVX]+\.?', label):
            chapter += 1
            roman = ROMAN[chapter - 1]
            if label.split()[-1].rstrip('.') != roman:
                raise ValueError(f'Unexpected Equiano chapter {label}')
            volume = 'I' if chapter <= 6 else 'II'
            active = section(sections, f'ch-{chapter}', f'Volume {volume} · Chapter {roman}')
        elif element.tag == 'h5' and label == 'END OF THE FIRST VOLUME.':
            active = section(sections, 'vol-2-epigraphs', 'Volume II · Epigraphs')
        elif element.tag == 'pre' and active is not None:
            break
        elif label in ('VOLUME II', 'THE END.'):
            continue
        elif active is not None:
            active.extend(equiano_blocks(element))
    if chapter != 12:
        raise ValueError(f'Expected both volumes of Equiano, found {chapter} chapters')
    return sections, 'ch-1', 'English original. Both 1789 volumes, chapters I–XII, including chapter arguments, verse, petitions and 26 lettered footnotes. The two sets of epigraphs, dedication and subscriber list are accessible. Printer information, duplicate contents and ebook boilerplate omitted.'


CONVERTERS = {'douglass': douglass, 'alcott': alcott, 'apology': apology,
              'germinal': germinal, 'manifesto': manifesto,
              'yellow-wallpaper': yellow_wallpaper, 'equiano': equiano}
# Expected section count and textual boundaries for the opening and final units.
BOUNDARIES = {
    'yellow-wallpaper': (11, 'It is very seldom that mere ordinary people', 'I had to creep over him every time!'),
    'equiano': (16, "The author's account of his country", 'benefactors to mankind!'),
    'douglass': (14, 'I was born in Tuckahoe', 'April 28, 1845.'),
    'alcott': (6, '"I want something to do."', 'Tribulation Periwinkle.'),
    'apology': (2, 'How you, O Athenians', 'Which is better God only knows.'),
    'germinal': (41, 'Over the open plain', 'their germination would soon overturn the earth.'),
    'manifesto': (5, 'The history of all hitherto existing societies', 'WORKING MEN OF ALL COUNTRIES, UNITE!'),
}


def check(work, sections, start):
    indexed = {s['id']: s for s in sections}
    count, first, last = BOUNDARIES[work]
    if len(indexed) != count or len(sections) != count:
        raise ValueError(f'Invalid section count for {work}')
    if any(not s['paragraphs'] or any(not p.strip() for p in s['paragraphs']) for s in sections):
        raise ValueError(f'Empty reading in {work}')
    if not indexed[start]['paragraphs'][0].startswith(first) or not sections[-1]['paragraphs'][-1].endswith(last):
        raise ValueError(f'Unexpected opening or closing text in {work}')
    if any('Project Gutenberg' in p or '\ufffd' in p for s in sections for p in s['paragraphs']):
        raise ValueError(f'Unexpected boilerplate or decoding error in {work}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('output_directory', type=Path)
    args = parser.parse_args()
    outputs, records = {}, []
    for work, filename, repo, blob, catalogue in SOURCES:
        raw = (args.input_directory / filename).read_bytes()
        if hashlib.sha1(f'blob {len(raw)}\0'.encode() + raw).hexdigest() != blob:
            raise ValueError(f'Unexpected source version for {filename}')
        sections, start, coverage = CONVERTERS[work](raw)
        check(work, sections, start)
        payload = (json.dumps({'sections': sections, 'start': start}, ensure_ascii=False, indent=1) + '\n').encode()
        outputs[work] = payload
        records.append([work, f'https://api.github.com/repos/GITenberg/{repo}/git/blobs/{blob}',
                        f'https://www.gutenberg.org/ebooks/{catalogue}', filename, blob,
                        hashlib.sha256(raw).hexdigest(), len(raw), start, len(sections),
                        sum(len(s['paragraphs']) for s in sections), hashlib.sha256(payload).hexdigest(), coverage])
    target = args.output_directory
    target.mkdir(parents=True, exist_ok=True)
    for work, payload in outputs.items():
        (target / f'{work}.json').write_bytes(payload)
    with (target / 'provenance.tsv').open('w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter='\t', lineterminator='\n')
        writer.writerow(['work', 'source_url', 'catalogue', 'input_file', 'git_blob', 'source_sha256',
                         'source_bytes', 'start', 'sections', 'paragraphs', 'json_sha256', 'coverage'])
        writer.writerows(records)
    for r in records:
        print(f'{r[0]}: {r[8]} sections, {r[9]} paragraphs, opening {r[7]}')


if __name__ == '__main__':
    main()
