import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A publisher can rerun this projection from the Main sheet's tab-separated export.
// The publisher assigns the offering code. Reruns in another semester keep their own code.
export function importRoster(input, { term, listing }) {
  const columns = ['id','provider','title','subject','level','duration','code','instructor','term','url','school','materials_url','listed_at'];
  const lines = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const grid = [];
  let cell = '', row = [], quoted = false;
  for (let i = 0; i < lines.length; i++) {
    const ch = lines[i];
    if (ch === '"' && (quoted || !cell)) {
      if (quoted && lines[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (!quoted && ch === '\t') { row.push(cell); cell = ''; }
    else if (!quoted && ch === '\n') { row.push(cell); grid.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (quoted) throw Error('Unclosed quoted cell in publisher export.');
  if (cell || row.length) grid.push([...row, cell]);
  const index = grid.findIndex(r => r[0]?.trim() === 'Course ID' && r.includes('Course Name'));
  if (index < 0) throw Error('The Main sheet has no course header.');
  const headers = grid[index].map(x=>x.trim());
  const required = ['Course ID','Discipline','Course Name','SME Name','Institute','Duration','UG/PG','Click here to Join the course','NPTEL URL'];
  if (required.some(name=>!headers.includes(name))) throw Error('The publisher changed the roster columns.');
  const seen = new Set(), output = [columns];
  for (const record of grid.slice(index + 1)) {
    const get = name => (record[headers.indexOf(name)] || '').replace(/\s+/g, ' ').trim();
    const code = get('Course ID').toLowerCase();
    if (!code && !get('Course Name')) continue;
    if (!/^noc\d\d-[a-z0-9]+$/.test(code) || seen.has(code)) throw Error('Unknown or duplicate offering code ' + code);
    seen.add(code);
    const preview = get('Click here to Join the course'), archive = get('NPTEL URL');
    if (!preview.startsWith('https://onlinecourses.nptel.ac.in/') || !get('Course Name')) throw Error('Missing course preview or title for ' + code);
    output.push(['nptel-'+code,'nptel',get('Course Name'),get('Discipline'),get('UG/PG'),get('Duration'),code,
      get('SME Name'),term,preview,get('Institute'),/^https:\/\/(?:www\.)?nptel\.ac\.in\/courses\/\d+\/?$/.test(archive)?archive:'',listing]);
  }
  if (!seen.size) throw Error('No offerings found.');
  return output.map(r=>r.join('\t')).join('\n')+'\n';
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [, , file, term, listing] = process.argv;
  if (!file || !term || !listing) throw Error('Supply the Main sheet TSV, semester label and publisher listing URL.');
  console.log(importRoster(readFileSync(file,'utf8'),{term,listing}).trimEnd());
}
