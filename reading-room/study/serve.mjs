import { createServer } from 'node:http';
import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import { join, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { askGuide, findItems, items, sourcePacket, webRoot } from './catalog.mjs';
import { change, createProfile, due, profileID, reader, snapshot } from './profiles.mjs';

const root = resolve(process.env.STUDY_HOME || join(homedir(), '.local', 'state', 'blackball-study'));
const web = realpathSync(fileURLToPath(webRoot));
if (root === web || root.startsWith(web + sep)) throw Error('Keep reader profiles outside the public web directory.');
const publicTypes = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.tsv':'text/tab-separated-values', '.json':'application/json', '.txt':'text/plain', '.ttf':'font/ttf', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg' };
const cookie = 'bb_study';
const publishedOrigin = process.env.STUDY_ORIGIN ? new URL(process.env.STUDY_ORIGIN) : null;
if (publishedOrigin && (publishedOrigin.protocol !== 'https:' || publishedOrigin.href !== publishedOrigin.origin + '/')) {
  throw Error('STUDY_ORIGIN must be the HTTPS origin used by the reverse proxy.');
}
const help = 'FIND words | ABOUT id | PLAN id passage or session | CHECK id unread/part/done [note] | CONTINUE id [next step] | PAUSE id | STOP id | REMIND id time-with-offset | CLEAR id | STATUS | ASK id question | ADD url title';
function error(message, status = 400) { return Object.assign(Error(message), { status }); }
function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}
async function body(req) {
  let size = 0, chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw error('Message exceeds 8 KiB.', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
function credentials(req, bearerOnly = false) {
  const bearer = (req.headers.authorization || '').match(/^Bearer ([a-f0-9]{48})$/)?.[1];
  const stored = (req.headers.cookie || '').split(/;\s*/).find(x => x.startsWith(cookie + '='))?.slice(cookie.length + 1);
  return profileID(bearer || (!bearerOnly && stored) || '');
}
function authenticated(id) {
  if (!id || !existsSync(join(root, id, 'name'))) throw error('Open a reader profile first.', 401);
  return reader(root, id);
}
function setCookie(res, key) {
  res.setHeader('Set-Cookie', cookie + '=' + key + '; Path=/; HttpOnly; SameSite=Strict;' + (publishedOrigin ? ' Secure;' : '') + ' Max-Age=' + (key ? 31536000 : 0));
}
function statusText(s) {
  return s.plans.map(p => p.title + ' [' + p.id + '] — ' + p.target + ' | ' + p.report + ', ' + p.status +
    (p.reminder ? ' | check-in ' + p.reminder.at : '')).join('\n') || 'No study plans yet. FIND a book or course, then PLAN a short task.';
}
async function jog(r, message, request) {
  const [verbRaw, ...words] = message.trim().split(/\s+/);
  const verb = verbRaw.toUpperCase(), id = words[0] || '', tail = words.slice(1).join(' ');
  if (verb === 'HELP' || verb === '?') return help;
  if (verb === 'STATUS') return statusText(snapshot(r));
  if (verb === 'FIND') return findItems(words.join(' '), 3).map(i => i.id + ' ' + i.title).join('\n') || 'No matching title. Try the provider, author or subject.';
  const item = items.get(id) || r.links.get(id);
  if (verb === 'ABOUT' || verb === 'ASK') {
    if (!item) throw error('Unknown course or work.');
    if (verb === 'ABOUT') {
      const s = sourcePacket(item)[0];
      return item.title + '\n' + (s ? s.text + '\n' + s.url : item.url);
    }
    const answer = await askGuide(item, tail);
    return [answer.mode, answer.answer, ...answer.sources.map((s, i) => '[' + (i + 1) + '] ' + s.url)].join('\n');
  }
  let command;
  if (verb === 'ADD') command = { verb, arg: id, note: tail };
  else if (verb === 'CHECK') command = { verb, item: id, arg: (words[1] || '').toLowerCase(), note: words.slice(2).join(' ') };
  else if (['PLAN','CONTINUE','REMIND'].includes(verb)) command = { verb, item: id, arg: tail };
  else if (['PAUSE','STOP','CLEAR'].includes(verb)) command = { verb, item: id, note: tail };
  else throw error(help);
  const s = change(root, r.id, command, request);
  if (verb === 'ADD') return 'Saved privately. PLAN ' + s.links.find(l => l.url === new URL(id).href).id + ' followed by the task you want to try.';
  const p = s.plans.find(p => p.id === id);
  return p.title + ' — ' + p.target + '. ' + p.report + ', ' + p.status + (p.reminder ? '. Check-in ' + p.reminder.at : '.');
}

function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      const host = req.headers.host || '';
      if (host !== publishedOrigin?.host && !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) throw error('Unknown host.', 403);
      if (req.headers.origin && req.headers.origin !== (publishedOrigin?.origin || 'http://' + host)) throw error('This request requires the same origin.', 403);
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname.startsWith('/jog/')) {
        const id = credentials(req, true);
        if (!id || pathname !== '/jog/' + id) throw error('A matching reader key is required.', 401);
        if (req.method !== 'POST') throw error('Use POST for a text command.', 405);
        const r = authenticated(id);
        const result = await jog(r, await body(req), req.headers['idempotency-key'] || randomUUID());
        return send(res, 200, result, 'text/plain');
      }
      if (pathname.startsWith('/study/')) {
        const id = credentials(req);
        if (req.method === 'GET' && pathname === '/study/session') return send(res, 200, {
          profile: id ? snapshot(authenticated(id)) : null, model: Boolean(process.env.STUDY_MODEL && process.env.STUDY_MODEL_URL)
        });
        if (req.method !== 'POST') throw error('Method unavailable.', 405);
        if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) throw error('Send a JSON study request.', 415);
        let data;
        try { data = JSON.parse(await body(req)); } catch (e) { if (e.status) throw e; throw error('Invalid request body.'); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw error('Invalid request body.');
        if (pathname === '/study/new') {
          const p = createProfile(root, data.name); setCookie(res, p.key);
          return send(res, 201, { profile: snapshot(reader(root, p.id)), key: p.key });
        }
        if (pathname === '/study/open') {
          const r = authenticated(profileID(data.key)); setCookie(res, data.key);
          return send(res, 200, { profile: snapshot(r) });
        }
        if (pathname === '/study/close') { setCookie(res, ''); return send(res, 200, { profile: null }); }
        if (pathname === '/study/ask') {
          const item = items.get(data.item);
          if ((!item && data.item !== 'discover') || typeof data.question !== 'string') throw error('Choose an indexed book or course and enter a question.');
          return send(res, 200, await askGuide(item, data.question, process.env, data.section, data.previous));
        }
        if (pathname === '/study/change') {
          authenticated(id);
          if (data.profileId !== id) throw error('The active reader changed. Reopen your study plan.', 409);
          if (data.verb === 'ACK') throw error('Only the reminder transport can acknowledge delivery.');
          return send(res, 200, { profile: change(root, id, data, req.headers['idempotency-key'] || randomUUID()) });
        }
        throw error('Unknown study action.', 404);
      }
      if (!['GET','HEAD'].includes(req.method)) throw error('Method unavailable.', 405);
      const target = resolve(web, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
      if (!target.startsWith(web + sep) || !existsSync(target)) throw error('Page unavailable.', 404);
      const actual = realpathSync(target), type = publicTypes[extname(actual)];
      if (!actual.startsWith(web + sep) || !type || !statSync(actual).isFile()) throw error('Page unavailable.', 404);
      res.writeHead(200, { 'Content-Type': type + (type.startsWith('text/') ? '; charset=utf-8' : ''), 'X-Content-Type-Options':'nosniff' });
      if (req.method === 'HEAD') res.end();
      else createReadStream(actual).on('error', () => res.destroy()).pipe(res);
    } catch (e) {
      const message = e.code ? 'The study files could not be read or written.' : e.message;
      if (!res.headersSent) send(res, e.status || (e.code ? 500 : 400), { error: message });
    }
  });
  const sender = process.env.STUDY_SMS_SENDER;
  let worker = null;
  function sendDue() {
    if (!sender || worker) return;
    worker = spawn(process.execPath, [fileURLToPath(import.meta.url), 'deliver', sender], { stdio: ['ignore','ignore','inherit'] });
    worker.once('error', e => console.error('Reminder transport:', e.message));
    worker.once('close', () => { worker = null; });
  }
  server.listen(port, '127.0.0.1', () => {
    console.log('Reading Room ' + (publishedOrigin?.origin || 'http://127.0.0.1:' + server.address().port) + '/#open');
    if (sender) { sendDue(); setInterval(sendDue, 60000).unref(); }
  });
}
function deliver(command) {
  if (!command) throw Error('Supply the path to the SMS transport executable.');
  let failures = 0;
  for (const message of due(root)) {
    // Recheck after earlier deliveries. The receiving transport uses the reminder
    // ID as its deduplication key if a crash occurs between delivery and ACK.
    const latest = reader(root, message.profile).plans.get(message.item)?.reminder;
    if (!latest || latest.id !== message.reminder || latest.delivered) continue;
    const result = spawnSync(command, [message.profile, message.reminder], { input: message.text, timeout: 30000, stdio: ['pipe', 'ignore', 'inherit'] });
    if (result.error || result.status !== 0) { failures++; continue; }
    const current = reader(root, message.profile).plans.get(message.item)?.reminder;
    if (current?.id === message.reminder && !current.delivered) change(root, message.profile, { verb: 'ACK', item: message.item, arg: message.reminder });
  }
  if (failures) throw Error(failures + ' reminder delivery attempt(s) failed. Pending reminders can be retried.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [action = 'serve', argument] = process.argv.slice(2);
    if (action === 'serve') serve(Number(argument ?? 8000));
    else if (action === 'due') for (const m of due(root)) console.log([m.profile, m.item, m.reminder, m.text.replace(/\s+/g, ' ')].join('\t'));
    else if (action === 'deliver') deliver(argument);
    else throw Error('Use serve [port], due, or deliver /path/to/sender.');
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
