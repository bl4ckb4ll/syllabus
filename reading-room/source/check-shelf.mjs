import {readFileSync, existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const web = new URL('../web/', import.meta.url);
const dist = existsSync(web) ? web : new URL('../dist/', import.meta.url);
const bytes = name => readFileSync(new URL(name, dist));
function table(name) {
  const [header, ...lines] = bytes(name).toString('utf8').replace(/\r\n/g,'\n').replace(/\n+$/,'').split('\n');
  const keys = header.split('\t');
  return lines.map((line, index) => {
    const values = line.split('\t');
    assert.equal(values.length, keys.length, name + ' line ' + (index + 2));
    return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  });
}
const works = table('data/works.tsv');
const courses = table('data/courses.tsv');
const assignments = table('data/assignments.tsv');
const contexts = table('data/course-context.tsv');
const slots = table('data/slots.tsv');
const supplements = table('data/supplements.tsv');
const starts = table('data/reading-starts.tsv');
const copies = table('data/copies.tsv');
const recordings = table('data/recordings.tsv');
const tracks = table('data/tracks.tsv');
const mirrors = table('data/recording-mirrors.tsv');
const workIds = new Set(works.map(w => w.id));
const courseIds = new Set(courses.map(c => c.id));
assert.equal(workIds.size, works.length);
assert.equal(courseIds.size, courses.length);
const https = url => assert.equal(new URL(url).protocol, 'https:', url);
assert.deepEqual(new Set(contexts.map(c => c.id)), courseIds);
assert.equal(contexts.length, courseIds.size);
for (const c of courses) {
  const context = contexts.find(row => row.id === c.id);
  assert.ok(context.department && ['reviewed','unknown'].includes(context.status));
  if (context.status === 'unknown') {
    assert.ok(context.search);
    assert.ok(!assignments.some(a => a.course === c.id));
  } else {
    https(c.source);
  }
  https(c.listing);
  https(c.catalog);
  if (context.slot) assert.ok(slots.some(s => s.id === context.slot && s.school === c.school));
}
for (const slot of slots) {
  https(slot.rule_url);
  https(slot.term_url);
  const options = contexts.filter(row => row.slot === slot.id);
  assert.equal(options.length, 2, 'A two-section comparison needs both source lists');
  assert.ok(options.every(row => row.status === 'reviewed'));
}
for (const row of [...assignments, ...supplements]) {
  assert.ok(workIds.has(row.work) && courseIds.has(row.course));
  assert.ok(row.role && row.scope && row.locator);
  row.source.split('|').forEach(https);
}
for (const row of supplements) {
  assert.ok(assignments.some(a => a.work===row.parent && a.course===row.course));
  assert.ok(!assignments.some(a => a.work===row.work && a.course===row.course));
}
for (const start of starts) {
  assert.ok(assignments.some(a => a.work===start.work && a.course===start.course));
  assert.ok(copies.some(c => c.work===start.work && c.url===start.url));
}
for (const copy of [...copies, ...recordings]) {
  assert.ok(workIds.has(copy.work));
  https(copy.url);
  https(copy.evidence_url);
}
for (const work of works) {
  assert.ok(copies.some(c => c.work === work.id), 'Missing access route for ' + work.id);
}
const unique = rows => new Set(rows);
assert.equal(unique(copies.map(c => [c.work, c.url].join(' '))).size, copies.length);
const books = cid => unique(assignments.filter(a => a.course === cid).map(a => a.work));
const yale = books('y202');
const grinnell = books('g100');
assert.deepEqual([...yale].filter(id => grinnell.has(id)), ['ordinary']);
assert.equal(books('y119').size, 13);
assert.equal(books('u3401').size, 22);
assert.equal(yale.size, 6);
assert.equal(grinnell.size, 5);
const maynard = books('g2203');
const purcell = books('g2204');
assert.equal(maynard.size, 7);
assert.equal(purcell.size, 7);
assert.deepEqual([...maynard].filter(id => purcell.has(id)), ['arnold']);
assert.ok(maynard.has('yellow-wallpaper') && !purcell.has('yellow-wallpaper'));
assert.ok(purcell.has('equiano') && !maynard.has('equiano'));
assert.ok(contexts.some(c => c.id === 'g1401' && c.status === 'unknown'));
assert.equal(books('mit21l001').size, 10);
assert.ok(!books('mit21l001').has('metamorphoses'));
assert.ok(books('y119').has('foner') && !books('y119').has('foner-long'));
assert.equal(assignments.filter(a => a.work === 'foner-long').length, 0);
assert.ok(copies.some(c => c.work === 'foner' && c.kind === 'sample'));
assert.ok(!works.find(w => w.id === 'foner').text);
assert.ok(copies.some(c => c.work === 'foner' && c.kind === 'interview' && c.url.endsWith('.mp3')));
assert.ok(!copies.some(c => ['lecture','interview'].includes(c.kind) && c.label.startsWith('Audiobook')));
const assignedMarx = assignments.find(a => a.work === 'manifesto' && a.course === 'g100');
assert.ok(assignedMarx.scope.includes('parts I–II') && assignedMarx.scope.includes('part III'));
for (const r of recordings) {
  const selection = tracks.filter(t => t.recording === r.id);
  assert.ok(selection.length > Number(r.start));
  selection.forEach((t, index) => {
    https(t.url);
    assert.equal(Number(t.index), index);
    assert.ok(t.label && t.url.toLowerCase().endsWith('.mp3'));
  });
}
assert.equal(unique(tracks.map(t => t.url)).size, tracks.length);
for (const t of tracks) assert.ok(recordings.some(r => r.id === t.recording));
for (const mirror of mirrors) {
  const recording = recordings.find(r => r.id === mirror.recording);
  assert.ok(recording);
  https(mirror.url);
  assert.ok(!copies.some(c => c.work===recording.work && c.url===mirror.url));
}
const hashes = table('text/provenance.tsv');
for (const work of works.filter(w => w.text)) {
  const input = bytes('text/' + work.id + '.json');
  const book = JSON.parse(input);
  const provenance = hashes.find(row => row.work === work.id);
  assert.equal(createHash('sha256').update(input).digest('hex'), provenance.json_sha256);
  assert.equal(new Set(book.sections.map(s => s.id)).size, book.sections.length);
  assert.ok(book.sections.find(s => s.id === book.start)?.paragraphs[0]);
  assert.ok(book.sections.every(s => s.paragraphs.length && s.paragraphs.every(p => p.trim())));
}
console.log(assignments.length + ' course-to-work records, ' + unique(assignments.map(a => a.work)).size + ' distinct entries on ' + contexts.filter(c => c.status === 'reviewed').length + ' reviewed lists.');
console.log(copies.length + ' access or companion links, ' + recordings.length + ' in-page recordings, ' + tracks.length + ' tracks.');
console.log(hashes.length + ' reader text checksums match. Course choices, bounded differences, edition handling and access types passed.');
