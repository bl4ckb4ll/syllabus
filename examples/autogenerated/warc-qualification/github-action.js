// GitHub's required Node action boundary; replay remains checked Ithon source.
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
const candidate = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const rows = [
  ['field','value'], ['candidate',candidate], ['ithon_pin',observedPin],
  ['native_sha256',digest(nativeBytes)], ['reader_sha256',sourceHash],
  ['frontend_receipts',String(entries.length)], ['checked_native_synthetic_replay','PASS'],
  ['untyped_frontend_rejection','PASS'], ['real_common_crawl_capture','NOT_RUN'],
  ['icu_range_acquisition','NOT_RUN'], ['independent_aici_acceptance','NOT_RUN']
];
fs.writeFileSync(path.join(out, 'receipt.tsv'), rows.map(row=>row.join('\t')).join('\n')+'\n');
console.log('PASS native Ithon frontend, exact source receipts and untyped-source rejection');
