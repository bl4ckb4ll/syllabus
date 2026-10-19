// GitHub's required Node action boundary; replay remains checked Ithon source.
(async () => {
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync, spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const tooling = path.join(root, '.tooling/ithon');
const launcher = path.join(tooling, 'ithon');
const native = path.join(tooling, 'python');
const source = path.join(root, 'parsers/common_crawl_record.pi');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expectedPin = 'd6e83969f82512e920fb17b44326cb54f31d015c';
const observedPin = execFileSync('git', ['-C', tooling, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
if (observedPin !== expectedPin) throw Error('Ithon source pin mismatch');
const nativeBytes = fs.readFileSync(native);
// Absence of the native ELF must fail before the launcher can select host Python.
if (!nativeBytes.subarray(0, 4).equals(Buffer.from([127,69,76,70]))) throw Error('native Ithon ELF required');
fs.accessSync(native, fs.constants.X_OK);
const sourceHash = digest(fs.readFileSync(source));
const out = path.join(root, 'warc-qualification-results');
fs.mkdirSync(out); // Refuse stale evidence from an earlier attempt.
const checkReceipt = path.join(out, 'ithon-checks.ndjson');
const env = {...process.env, ITHON_EXECUTABLE:launcher, ITHON_CHECK_RECEIPT:checkReceipt};
for (const name of ['ITHON_PYTHON', 'PYTHON', 'PYTHONPATH', 'PYTHONHOME']) delete env[name];
const result = spawnSync(launcher, [source, '--self-test'], {env, cwd:root, encoding:'utf8', timeout:120000});
fs.writeFileSync(path.join(out, 'self-test.stdout'), result.stdout || '');
fs.writeFileSync(path.join(out, 'self-test.stderr'), result.stderr || '');
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error || result.status !== 0) throw Error('checked Ithon self-test failed');
const entries = fs.readFileSync(checkReceipt, 'utf8').trim().split('\n').map(line=>JSON.parse(line));
if (entries.length !== 4 || entries.some(entry=>entry.schema !== 'ithon.checked.v1' ||
    path.resolve(entry.filename) !== source || entry.source_sha256 !== sourceHash)) {
  throw Error('four exact-source frontend receipts required');
}
const bad = path.join(out, 'refuse-untyped.pi');
fs.writeFileSync(bad, 'def untyped(value):\n    return value\n');
const before = fs.readFileSync(checkReceipt);
const rejected = spawnSync(launcher, [bad], {env, cwd:root, encoding:'utf8', timeout:10000});
fs.writeFileSync(path.join(out, 'frontend-rejection.stderr'), rejected.stderr || '');
if (rejected.error || rejected.status === 0 || !String(rejected.stderr).includes("parameter 'value' needs a static type") ||
    !fs.readFileSync(checkReceipt).equals(before)) throw Error('frontend rejection control failed');
const fixture = path.join(root, 'parsers/fixtures/common-crawl/reed-20260906235851');
const archive = path.join(fixture, 'range.warc.gz');
if (digest(fs.readFileSync(archive)) !== 'f9652a22cff1d6b5649b6bf9420b9c7c6c7058019348e8d201cb03ed42cf5d58')
  throw Error('authentic compressed source bytes changed');
const bodyPath = path.join(out, 'reed-homepage.html');
const receiptPath = path.join(out, 'reed-replay.json');
const real = spawnSync(launcher, [source, '--index-row', path.join(fixture, 'index-row.json'),
  '--range-file', archive, '--output', bodyPath, '--receipt', receiptPath],
  {env, cwd:root, encoding:'utf8', timeout:30000});
fs.writeFileSync(path.join(out, 'real-replay.stdout'), real.stdout || '');
fs.writeFileSync(path.join(out, 'real-replay.stderr'), real.stderr || '');
if (real.error || real.status !== 0 || digest(fs.readFileSync(bodyPath)) !==
    '1c7f0300f3ed38ba847dace7cb95443c6a865f12396e561f37ba5166a619f894')
  throw Error('authentic Common Crawl checked replay failed');
const realReceipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
if (realReceipt.status !== 'PASS' || realReceipt.record.payload_digest_check !== 'VERIFIED_SHA1' ||
    realReceipt.record.http_status !== 200 || realReceipt.source.url !== 'https://www.reed.edu/')
  throw Error('authentic replay provenance mismatch');
const realChecks = fs.readFileSync(checkReceipt, 'utf8').trim().split('\n').map(line=>JSON.parse(line));
if (realChecks.length !== 5 || realChecks.at(-1).source_sha256 !== sourceHash)
  throw Error('authentic replay needs its own exact-source frontend receipt');
const classifier = path.join(root, 'parsers/classify_syllabus.pi');
if (fs.existsSync(classifier)) {
  const classification = execFileSync(launcher, [classifier, bodyPath, 'UNRELATED_OR_UNSUPPORTED_HTML_NO_ASSIGNMENT_CLAIM'],
    {env, cwd:root, encoding:'utf8', timeout:30000});
  fs.writeFileSync(path.join(out, 'reed-classification.tsv'), classification);
}
// Explicit foreign correctness oracles requested for differential testing.
// Their dependency download is not a source-acquisition implementation.
const oracleDirectory = path.join(out, 'foreign-oracles');
execFileSync('python3', ['-m', 'pip', 'install', '--target', oracleDirectory, 'warcio==1.7.5', 'six==1.17.0'],
  {env, cwd:root, stdio:'inherit', timeout:120000});
const oracleEnv = {...env, PYTHONPATH:oracleDirectory};
const warcio = path.join(oracleDirectory, 'bin/warcio');
execFileSync(warcio, ['check', archive], {env:oracleEnv, cwd:root, stdio:'inherit', timeout:30000});
const warcioBody = execFileSync(warcio, ['extract', '--payload', archive, '0'],
  {env:oracleEnv, cwd:root, timeout:30000});
const jarResponse = await fetch('https://github.com/iipc/jwarc/releases/download/v0.37.0/jwarc-0.37.0.jar');
if (!jarResponse.ok) throw Error('jwarc dependency download failed');
const jar = Buffer.from(await jarResponse.arrayBuffer());
if (digest(jar) !== '30b4f578628b6f3dd430c6b2d559b69f94e4e6c2bb95d9a2e057662f30ee6250')
  throw Error('jwarc 0.37.0 dependency digest changed');
const jarPath = path.join(oracleDirectory, 'jwarc-0.37.0.jar');
fs.writeFileSync(jarPath, jar);
execFileSync('java', ['-jar', jarPath, 'validate', archive], {env, cwd:root, stdio:'inherit', timeout:30000});
const jwarcBody = execFileSync('java', ['-jar', jarPath, 'extract', '--payload', archive, '0'],
  {env, cwd:root, timeout:30000});
if (!warcioBody.equals(fs.readFileSync(bodyPath)) || !jwarcBody.equals(warcioBody))
  throw Error('warcio/jwarc entity differential mismatch');
fs.writeFileSync(path.join(out, 'differential.tsv'),
  'oracle\tversion\tentity_sha256\nwarcio\t1.7.5\t'+digest(warcioBody)+'\njwarc\t0.37.0\t'+digest(jwarcBody)+'\n');
const independent = path.join(root, '.tooling/aici-acquisition/examples/autogenerated/syllabus-acquisition');
const acceptance = spawnSync(launcher, [path.join(independent, 'warc.pi'), launcher, source, fixture],
  {env, cwd:root, encoding:'utf8', timeout:120000});
fs.writeFileSync(path.join(out, 'aici-warc.stdout'), acceptance.stdout || '');
fs.writeFileSync(path.join(out, 'aici-warc.stderr'), acceptance.stderr || '');
if (acceptance.error || acceptance.status !== 0) throw Error('independent authentic WARC acceptance failed');
let assignments = 'NOT_PRESENT_IN_REPLAY_BRANCH';
if (fs.existsSync(path.join(root, 'course information/usf/fall-2026/philosophy/verified-course.tsv'))) {
  const checked = spawnSync(launcher, [path.join(independent, 'check.pi'), root],
    {env, cwd:root, encoding:'utf8', timeout:30000});
  fs.writeFileSync(path.join(out, 'aici-assignments.stdout'), checked.stdout || '');
  fs.writeFileSync(path.join(out, 'aici-assignments.stderr'), checked.stderr || '');
  if (checked.error || checked.status !== 0) throw Error('independent original assignment acceptance failed');
  for (const discipline of ['english', 'history']) {
    const generated = spawnSync(launcher, [path.join(root, 'examples/autogenerated/source-bookshelf/build.pi'),
      '--check', root, 'course information/usf/fall-2026/' + discipline],
      {env, cwd:root, encoding:'utf8', timeout:30000});
    fs.writeFileSync(path.join(out, 'bookshelf-' + discipline + '.stdout'), generated.stdout || '');
    fs.writeFileSync(path.join(out, 'bookshelf-' + discipline + '.stderr'), generated.stderr || '');
    if (generated.error || generated.status !== 0) throw Error('native bookshelf reproducibility failed');
  }
  const searches = execFileSync(launcher, [path.join(root, 'examples/autogenerated/source-bookshelf/searches.pi'), '--check', root],
    {env, cwd:root, encoding:'utf8', timeout:30000});
  fs.writeFileSync(path.join(out, 'bounded-searches.stdout'), searches);
  const originals = ['syllabi/usf/fall-2026/philosophy/simple-syllabus/documents/10e8ekbh6.html',
    'acquisitions/usf-20261019T222542Z/syllabi/usf/fall-2026/english/simple-syllabus/documents/01zbfm1ij.html',
    'acquisitions/usf-20261019T222542Z/syllabi/usf/fall-2026/history/simple-syllabus/documents/06spksbji.html'];
  for (const [index, original] of originals.entries()) {
    const classification = execFileSync(launcher, [classifier, path.join(root, original), 'SYLLABUS_CANDIDATE_READING_EVIDENCE_REQUIRED'],
      {env, cwd:root, encoding:'utf8', timeout:30000});
    fs.writeFileSync(path.join(out, 'syllabus-classification-' + index + '.tsv'), classification);
  }
  assignments = 'PASS';
}
const candidate = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const rows = [
  ['field','value'], ['candidate',candidate], ['ithon_pin',observedPin],
  ['native_sha256',digest(nativeBytes)], ['reader_sha256',sourceHash],
  ['frontend_receipts',String(entries.length)], ['checked_native_synthetic_replay','PASS'],
  ['untyped_frontend_rejection','PASS'], ['real_common_crawl_capture','PASS_REED_HOMEPAGE_NOT_SYLLABUS'],
  ['real_frontend_receipts','1'],
  ['icu_range_acquisition','RETAINED_LOCAL_CANDIDATE_RECEIPT'], ['independent_aici_acceptance','PASS'],
  ['independent_original_assignment_acceptance',assignments]
];
fs.writeFileSync(path.join(out, 'receipt.tsv'), rows.map(row=>row.join('\t')).join('\n')+'\n');
console.log('PASS native Ithon frontend, exact source receipts and untyped-source rejection');
})().catch(error => { console.error(error); process.exitCode = 1; });
