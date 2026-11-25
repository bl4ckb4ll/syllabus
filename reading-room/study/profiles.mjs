import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { linkSync, mkdirSync, renameSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { items, externalItem } from './catalog.mjs';

const encode = s => s.replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
const decode = s => s.replace(/\\([\\trn])/g, (_, c) => ({ t: '\t', r: '\r', n: '\n', '\\': '\\' })[c]);
const slotName = i => String(i + 1).padStart(12, '0') + '.tsv';
export const profileID = key => /^[a-f0-9]{48}$/.test(key || '') ? createHash('sha256').update(key).digest('hex') : '';
function folder(root, id) {
  if (!/^[0-9a-f]{64}$/.test(id)) throw Error('Open a reader profile first.');
  return join(root, id);
}
export function createProfile(root, name) {
  name = String(name || '').trim();
  if (!name || name.length > 60 || /[\x00-\x1f\x7f]/.test(name)) throw Error('Use a name of 1 to 60 characters.');
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const key = randomBytes(24).toString('hex'), id = profileID(key), dir = folder(root, id);
  const pending = join(root, '.' + randomUUID());
  mkdirSync(pending, { mode: 0o700 });
  writeFileSync(join(pending, 'name'), name + '\n', { mode: 0o600, flag: 'wx' });
  renameSync(pending, dir);
  return { id, key, name };
}
function readEvents(dir) {
  return readdirSync(dir).filter(n => /^\d{12}\.tsv$/.test(n)).sort().map((file, i) => {
    if (file !== slotName(i)) throw Error('The reader journal has a missing entry.');
    const fields = readFileSync(join(dir, file), 'utf8').replace(/\n$/, '').split('\t').map(decode);
    const [request, at, verb, item, arg = '', note = ''] = fields;
    return { request, at, verb, item, arg, note };
  });
}
function reduce(events) {
  const plans = new Map(), links = new Map();
  for (const e of events) {
    if (e.verb === 'ADD') { links.set(e.item, externalItem(e.arg, e.note)); continue; }
    const p = plans.get(e.item) || { id: e.item, status: 'active', report: 'unreported', target: '', reminder: null, history: [] };
    if (e.verb === 'PLAN' || e.verb === 'CONTINUE') {
      if (e.arg && e.arg !== p.target) { p.target = e.arg; p.report = 'unreported'; p.reminder = null; }
      p.status = 'active';
    } else if (e.verb === 'CHECK') { p.report = e.arg; p.reminder = null; }
    else if (e.verb === 'PAUSE' || e.verb === 'STOP') { p.status = e.verb === 'PAUSE' ? 'paused' : 'stopped'; p.reminder = null; }
    else if (e.verb === 'REMIND') p.reminder = { id: e.request, at: e.arg, delivered: false };
    else if (e.verb === 'CLEAR') p.reminder = null;
    else if (e.verb === 'ACK' && p.reminder?.id === e.arg) p.reminder.delivered = true;
    if (['PLAN', 'CONTINUE', 'CHECK', 'PAUSE', 'STOP'].includes(e.verb)) {
      p.history.push({ at: e.at, verb: e.verb, value: e.arg, note: e.note, target: p.target });
    }
    plans.set(e.item, p);
  }
  return { plans, links };
}
export function reader(root, id) {
  const dir = folder(root, id), name = readFileSync(join(dir, 'name'), 'utf8').trim();
  const events = readEvents(dir);
  return { dir, id, name, events, ...reduce(events) };
}
export function snapshot(r) {
  return { id: r.id, name: r.name, links: [...r.links.values()], plans: [...r.plans.values()].map(p => ({
    ...p, title: (items.get(p.id) || r.links.get(p.id))?.title || p.id
  })) };
}

const verbs = new Set(['PLAN', 'CHECK', 'CONTINUE', 'PAUSE', 'STOP', 'REMIND', 'CLEAR', 'ADD', 'ACK']);
export function change(root, id, input, request = randomUUID(), now = new Date()) {
  const { verb, item = '', arg = '', note = '' } = input;
  if (!verbs.has(verb) || ![item, arg, note].every(s => typeof s === 'string' && s.length <= 1800 && !s.includes('\0'))) {
    throw Error('Invalid study command.');
  }
  if (!/^[A-Za-z0-9._-]{1,96}$/.test(request)) throw Error('Invalid message ID.');
  const actualItem = verb === 'ADD' ? externalItem(arg, note).id : item;
  // Each numbered file is one complete decision. link() admits exactly one winner
  // for a journal position. A simultaneous writer replays before validating again.
  for (let attempt = 0; attempt < 30; attempt++) {
    const r = reader(root, id);
    const old = r.events.find(e => e.request === request);
    if (old) {
      if (old.verb !== verb || old.item !== actualItem || old.arg !== arg || old.note !== note) throw Error('That message ID already belongs to another command.');
      return snapshot(r);
    }
    const plan = r.plans.get(actualItem);
    if (verb !== 'ADD' && !items.has(actualItem) && !r.links.has(actualItem) && !plan) throw Error('Unknown reading or course. Use FIND to look it up.');
    if (!['ADD','PLAN'].includes(verb) && !plan) throw Error('Choose a passage or session with PLAN first.');
    if (verb === 'PLAN' && !arg.trim()) throw Error('Choose the passage, lecture or activity you want to try.');
    if (verb === 'CHECK' && !['unread','part','done'].includes(arg)) throw Error('Use unread, part or done for your chosen task.');
    if (verb === 'REMIND') {
      if (plan.status !== 'active') throw Error('Continue the plan before scheduling a check-in.');
      if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(arg) || !(Date.parse(arg) > now.getTime())) {
        throw Error('Choose a future time including its UTC offset.');
      }
    }
    if (verb === 'ACK' && (!plan.reminder || plan.reminder.id !== arg)) throw Error('That reminder is no longer current.');
    const next = join(r.dir, slotName(r.events.length));
    const tmp = join(r.dir, '.' + randomUUID());
    const line = [request, now.toISOString(), verb, actualItem, arg, note].map(encode).join('\t') + '\n';
    writeFileSync(tmp, line, { mode: 0o600, flag: 'wx' });
    try { linkSync(tmp, next); }
    catch (error) { if (error.code === 'EEXIST') continue; throw error; }
    finally { unlinkSync(tmp); }
    return snapshot(reader(root, id));
  }
  throw Error('Your profile is busy. Retry using the same message ID.');
}

export function due(root, now = new Date()) {
  let dirs;
  try { dirs = readdirSync(root, { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  const messages = [];
  for (const entry of dirs) {
    if (!entry.isDirectory() || !/^[a-f0-9]{64}$/.test(entry.name)) continue;
    const r = reader(root, entry.name);
    for (const p of r.plans.values()) {
      const alarm = p.reminder;
      if (!alarm || alarm.delivered || Date.parse(alarm.at) > now.getTime()) continue;
      const title = (items.get(p.id) || r.links.get(p.id))?.title || p.id;
      messages.push({ profile: r.id, item: p.id, reminder: alarm.id,
        text: title + ' — ' + p.target + '. How did it go? CHECK ' + p.id + ' unread, part or done.' });
    }
  }
  return messages;
}
