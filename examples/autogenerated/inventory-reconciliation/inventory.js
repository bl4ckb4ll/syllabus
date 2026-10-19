// Narrow fallback after the preserved Idriç/Ithon failures in attempt.md.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '../../..');
const C = path.join(ROOT, 'coverage');
const SHER = 'George Sher – Moral Philosophy Selected Readings.md';
const POJMAN = 'Louis P. Pojman – Philosophy of Religion An Anthology.md';
const FRAGMENT = 'where would I read this and who would I read it with/temporary-raw/usf/philosophy/simple-syllabus/html/sppml7syc.html';
const MUSIC = 'where-would-i-read-this-and-who-with/electronic-music/README.md';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (...arguments_) => execFileSync('git', ['-C', ROOT, ...arguments_], {maxBuffer: 16 * 1024 * 1024});
const source = (revision, filename) => git('show', `${revision}:${filename}`);
function fail(message) { throw Error(message); }
function table(filename, directory = C) {
  const text = fs.readFileSync(path.join(directory, filename), 'utf8');
  if (!text.endsWith('\n')) fail(`table-newline:${filename}`);
  const lines = text.slice(0, -1).split('\n');
  const fields = lines.shift().split('\t');
  if (new Set(fields).size !== fields.length) fail(`duplicate-header:${filename}`);
  return lines.map(line => {
    const values = line.split('\t');
    if (values.length !== fields.length) fail(`table-shape:${filename}`);
    return Object.fromEntries(fields.map((field, index) => [field, values[index]]));
  });
}
function save(filename, rows, directory = C, fields = Object.keys(rows[0] || {})) {
  if (!fields.length) fail(`empty-schema:${filename}`);
  fs.mkdirSync(directory, {recursive: true});
  const clean = value => {
    const text = String(value);
    if (/[\t\r\n]/.test(text)) fail(`unescaped-field:${filename}`);
    return text;
  };
  fs.writeFileSync(path.join(directory, filename), [fields.join('\t'), ...rows.map(row => fields.map(field => clean(row[field])).join('\t'))].join('\n') + '\n');
}
function pins() {
  const records = table('snapshots.tsv');
  const result = Object.fromEntries(records.map(row => [row.snapshot_id, row]));
  if (records.length !== Object.keys(result).length) fail('duplicate-snapshot');
  for (const row of records) {
    if (!/^[0-9a-f]{40}$/.test(row.commit) || git('rev-parse', row.commit + '^{commit}').toString().trim() !== row.commit) fail('source-revision-unavailable');
  }
  return result;
}
function role(filename, mode) {
  if (mode === '120000') return 'provenance_symlink';
  if (filename === FRAGMENT) return 'partial_primary_fragment';
  if (filename.includes('/fixtures/')) return 'synthetic_fixture';
  if (filename.includes('/index/') && filename.endsWith('.ndjson')) return 'discovery_response';
  if (filename.endsWith('course-inventory/search.html')) return 'catalog_search_form';
  if (filename.startsWith('syllabi/') && filename !== 'syllabi/README.md') return 'unclassified_capture';
  if (filename.includes('receipt') || filename.startsWith('crawling log/')) return 'receipt_or_schema';
  if (filename.includes('common-crawl-run-history/')) return 'run_history_template';
  if (/\.(py|pi|idric|grease|sh|yml)$/.test(filename)) return 'implementation_or_workflow';
  if (!filename.includes('/') && filename.endsWith('.md') && !['README.md', 'AGENTS.md'].includes(filename)) return 'root_bookshelf_note';
  return 'metadata_or_note';
}
function sourceFiles(p) {
  const rows = [];
  for (const [snapshot_id, pin] of Object.entries(p)) {
    const entries = git('ls-tree', '-rz', pin.commit).toString().split('\0').filter(Boolean).map(entry => {
      const tab = entry.indexOf('\t');
      const [mode, kind, blob] = entry.slice(0, tab).split(' ');
      return {mode, kind, blob, filename: entry.slice(tab + 1)};
    });
    const filenames = new Set(entries.map(entry => entry.filename));
    for (const entry of entries) {
      if (entry.kind !== 'blob') fail('unsupported-tree-entry');
      const bytes = git('cat-file', 'blob', entry.blob);
      let target = 'not_a_symlink', target_state = 'not_a_symlink';
      if (entry.mode === '120000') {
        target = bytes.toString();
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(entry.filename), target));
        target_state = filenames.has(resolved) ? 'resolved' : 'broken';
        if (path.posix.isAbsolute(target) || resolved.startsWith('../')) target_state = 'outside_snapshot';
      }
      rows.push({snapshot_id, commit: pin.commit, path: entry.filename, git_mode: entry.mode, git_blob: entry.blob,
        sha256: hash(bytes), bytes: String(bytes.length), evidence_role: role(entry.filename, entry.mode), symlink_target: target, target_state});
    }
  }
  return rows;
}
function courses(p) {
  const fields = ['course_instance_id','institution_id','institution','discipline','course_code','course_title','section','term','year','instructor','source_snapshot','source_path','evidence_strength','complete_document_sha256','status','first_incomplete_stage','missingness'];
  const records = [
    ['FSU-PHI3670-spring-year-unknown','FSU','Florida State University','philosophy','PHI 3670','Ethical Theory','unknown','Spring','unknown','David McNaughton','main',SHER,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','year_and_10_chapter_titles_and_2_Blackboard_titles_unknown'],
    ['FSU-PHI3700-fall-2006','FSU','Florida State University','philosophy','PHI 3700','Philosophy of Religion','01-02_combined','Fall','2006','David McNaughton','main',POJMAN,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','schedule_selections_unrecovered; combined_sections_not_separate_denominator'],
    ['USF-EDG7067-summer-2026-002','USF','University of South Florida','education','EDG 7067','Philosophies of Inquiry','002','Summer','2026','Vonzell Agosto','usf_parser',FRAGMENT,'PARTIAL_PRIMARY_FRAGMENT','fragment_only','PARTIAL','full_document_retention','page_chrome_policies_and_schedule_omitted; not_philosophy_department'],
    ['UCSD-MUSIC6-fall-2000','UCSD','University of California San Diego','electronic music','Music 6','Electronic Music','unknown','Fall','2000','Miller Puckette','main',MUSIC,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','combined_two_term_notes; per_term_assignment_extraction_incomplete'],
    ['UCSD-MUSIC6-fall-2006','UCSD','University of California San Diego','electronic music','Music 6','Electronic Music','unknown','Fall','2006','Miller Puckette','main',MUSIC,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','combined_two_term_notes; per_term_assignment_extraction_incomplete'],
    ['OHIO-MUS4130-5130-fall-2012','OHIO','Ohio University','electronic music','MUS 4130/5130','The History and Practice of Electronic Music','cross_list_combined','Fall','2012','Mark Phillips','main',MUSIC,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','cross_list_not_two_independently_observed_courses'],
    ['IOWA-electronic-media-fall-1994','IOWA','University of Iowa','electronic music','unknown','Composition: Electronic Media I','unknown','Fall','1994','Larry Fritts','main',MUSIC,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','course_code_and_full_assignment_extraction_unknown'],
    ['BARUCH-MSC3032-2022','BARUCH','Baruch College / CUNY','electronic music','MSC 3032','Electronic Music','unknown','unknown','2022','Ted Gordon','main',MUSIC,'REPOSITORY_ATTESTATION','unknown','PARTIAL','original_document_acquisition','term_and_reading_normalization_unknown'],
    ['CLEMENTE-humanities-1995-96','CLEMENTE','Original Clemente Course','multi discipline','unknown','Course in the Humanities','unknown','1995-96','1995-96','multiple_named_in_source','main','clemente-course/original-1995-96-course.md','RECONSTRUCTED_ACCOUNT','unknown','PARTIAL','original_handout_acquisition','plans_contemporary_attestation_and_retrospective_evidence_remain_distinct']
  ];
  return records.map(values => {
    const row = Object.fromEntries(fields.map((field, index) => [field, values[index]]));
    row.source_revision = p[row.source_snapshot].commit;
    row.source_sha256 = hash(source(row.source_revision, row.source_path));
    row.source_claim_citation = `https://github.com/bl4ckb4ll/syllabus/blob/${row.source_revision}/${row.source_path.split('/').map(encodeURIComponent).join('/')}`;
    row.panel_included = row.institution_id === 'FSU' ? 'yes' : 'no';
    const urls = {
      'FSU-PHI3670-spring-year-unknown':'https://philosophy.fsu.edu/sites/g/files/imported/storage/original/application/9069e23b480dab77c016dcf0d4789cae.pdf',
      'FSU-PHI3700-fall-2006':'https://philosophy.fsu.edu/sites/g/files/imported/storage/original/application/6bada3c0d1243a63cf917563d5d03e18.pdf',
      'USF-EDG7067-summer-2026-002':'https://usf.simplesyllabus.com/doc/sppml7syc/Summer-2026-EDG-7067-%28EU-EDQ%29-002?mode=view',
      'UCSD-MUSIC6-fall-2000':'https://msp.ucsd.edu/syllabi/6.00f/homepage.htm',
      'UCSD-MUSIC6-fall-2006':'https://msp.ucsd.edu/syllabi/6.06f/index.htm',
      'OHIO-MUS4130-5130-fall-2012':'https://sites.ohio.edu/phillipm/M4130_5130_Syllabus.html',
      'IOWA-electronic-media-fall-1994':'https://theremin.music.uiowa.edu/EMS.Files/Syllabi/1994/F.1994/EMS.F1994.Syllabus.pdf',
      'BARUCH-MSC3032-2022':'https://academicworks.cuny.edu/cgi/viewcontent.cgi?article=1111&context=bb_oers',
      'CLEMENTE-humanities-1995-96':'https://harpers.org/archive/1997/09/ii-as-a-weapon-in-the-hands-of-the-restless-poor/'
    };
    row.upstream_source_url = urls[row.course_instance_id];
    row.source_type = row.evidence_strength==='PARTIAL_PRIMARY_FRAGMENT' ? 'retained_partial_HTML_fragment' : row.evidence_strength==='RECONSTRUCTED_ACCOUNT' ? 'repository_reconstruction_with_account_links' : 'repository_note_with_unretained_syllabus_link';
    return row;
  });
}
function assignments(p) {
  const sherText = source(p.main.commit, SHER).toString();
  const schedule = sherText.match(/Required anthology selections, in course order:\s*`([0-9, ()–p. \-]+)`/);
  if (!schedule) fail('FSU-required-schedule-missing');
  const required = schedule[1].split(',').map(value => value.trim());
  const mappings = new Map([...sherText.matchAll(/^- (\d+) — (.+)$/gm)].map(match => [match[1], match[2].split(' — ')[0]]));
  const rootBooks = git('ls-tree','--name-only','-z',p.main.commit).toString().split('\0').filter(filename => filename.endsWith('.md'));
  const rootText = new Map(rootBooks.map(filename => [filename, source(p.main.commit, filename).toString()]));
  const rows = [];
  function add(course_instance_id, source_path, source_snapshot, item_id, reading, assignment_kind, title_resolution, canonical_root_entry, source_span = 'assigned_materials_note') {
    rows.push({course_instance_id,item_id,reading,assignment_kind,title_resolution,source_snapshot,source_path,
      source_revision:p[source_snapshot].commit,source_span,canonical_root_entry});
  }
  const fsu = 'FSU-PHI3670-spring-year-unknown';
  add(fsu,SHER,'main','anthology','George Sher (editor), Moral Philosophy: Selected Readings, second edition; note Wadsworth 2001; bibliographic discrepancy retained','required','documented',SHER);
  for (const selection of required) {
    const number = selection.split(' ')[0];
    const title = mappings.get(number) || 'unknown';
    const canonical = title === 'unknown' ? 'unknown' : rootBooks.find(filename => (rootText.get(filename) || '').includes(`selection ${number} `)) || 'unknown';
    add(fsu,SHER,'main',`chapter-${number}`,title,'required',title === 'unknown' ? 'unknown' : 'second_edition_mapping',canonical,`schedule selection ${selection}`);
  }
  for (const number of ['31','32']) add(fsu,SHER,'main',`chapter-${number}`,'unknown','supplementary','unknown','unknown');
  for (const author of ['Adams','Frankena']) add(fsu,SHER,'main',`Blackboard-${author}`,`${author}: exact title unknown`,'required','unknown','unknown');
  add('FSU-PHI3700-fall-2006',POJMAN,'main','anthology','Louis P. Pojman (editor), Philosophy of Religion: An Anthology, fourth edition, Wadsworth 2003, ISBN 9780534543648','required','documented',POJMAN);
  const fragment = source(p.usf_parser.commit, FRAGMENT).toString();
  if (!fragment.includes('Kerry E. Howell (2013)') || !fragment.includes('Supplementary (Optional)')) fail('USF-fragment-boundary-missing');
  add('USF-EDG7067-summer-2026-002',FRAGMENT,'usf_parser','required-book','Kerry E. Howell (2013), An Introduction to the Philosophy of Methodology, Sage Publications','required','partial_primary_fragment','not_yet_canonical');
  return rows;
}
function discovery(p) {
  const prefix = 'common crawl results pertinent to universities/usf/philosophy/index/';
  return git('ls-tree','-r','--name-only',p.usf_discovery.commit,prefix).toString().trim().split('\n').map(filename => {
    const bytes = source(p.usf_discovery.commit, filename);
    const records = bytes.toString().split('\n').filter(Boolean).map(value => JSON.parse(value));
    const valid = records.filter(row => ['url','timestamp','filename','offset','length'].every(key => Object.hasOwn(row,key))).length;
    const messages = records.filter(row => Object.hasOwn(row,'message')).length;
    if (valid + messages !== records.length) fail('unclassified-CDX-response');
    return {path:filename,source_revision:p.usf_discovery.commit,sha256:hash(bytes),valid_capture_records:String(valid),message_records:String(messages),
      http_status:'unknown',evidence_state:messages ? 'MESSAGE_NOT_CAPTURE' : 'CAPTURE_POINTERS',first_incomplete_stage:'index_response_semantics_and_HTTP_status',absence_claim:'unknown'};
  });
}
function starter(p) {
  const text = source(p.campaign.commit,'coverage/starter-institutions.tsv').toString().trim().split('\n');
  const headers = text.shift().split('\t');
  return text.map(line => {
    const old = Object.fromEntries(line.split('\t').map((value,index) => [headers[index],value]));
    const row = {institution_id:old.institution_id,institution:old.institution,field:old.field,status:'UNSEARCHED',documented_course_instances:'unknown',complete_course_instances:'0',
      course_denominator:'unknown',evidence_source:'no_bounded_recorded_search',next_evidence_action:old.next_evidence_action};
    if (row.institution_id === 'FSU' && row.field === 'philosophy') Object.assign(row,{status:'PARTIAL_READING_EVIDENCE',documented_course_instances:'2',evidence_source:'course-instances.tsv; source-rechecks.tsv; main source notes'});
    if (row.institution_id === 'USF' && row.field === 'philosophy') Object.assign(row,{status:'SEARCH_ATTEMPT_RECORDED',documented_course_instances:'0',evidence_source:'discovery-responses.tsv; usf_discovery snapshot; no observed reading-bearing PHI course',next_evidence_action:'Qualify CDX response/status; retrieve real syllabus URLs using ICU; keep EDG 7067 excluded'});
    return row;
  });
}
function summary(courseRows, readingRows) {
  const groups = new Map();
  for (const course of courseRows) {
    const key = [course.institution_id,course.discipline,course.term,course.year,course.evidence_strength].join('\t');
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(course);
  }
  return [...groups.entries()].sort().map(([key,members]) => {
    const ids = new Set(members.map(row => row.course_instance_id));
    const readings = readingRows.filter(row => ids.has(row.course_instance_id));
    return {...Object.fromEntries(['institution_id','discipline','term','year','evidence_strength'].map((field,index) => [field,key.split('\t')[index]])),
      documented_course_instances:String(members.length),full_primary_syllabi:'0',recorded_reading_rows:String(readings.length),unresolved_reading_titles:String(readings.filter(row=>row.title_resolution==='unknown').length),
      unrecovered_whole_schedules:String(members.filter(row=>row.course_code==='PHI 3700').length),course_denominator:'unknown',source_type:members[0].source_type};
  });
}
function counts(p,files,courseRows,readingRows,cells,attempts) {
  const values = {
    source_snapshot_count:Object.keys(p).length,source_file_observations:files.length,
    main_root_book_notes:files.filter(row=>row.snapshot_id==='main'&&row.evidence_role==='root_bookshelf_note').length,
    main_symlinks:files.filter(row=>row.snapshot_id==='main'&&row.git_mode==='120000').length,
    documented_course_instances:courseRows.length,partial_real_course_fragments:courseRows.filter(row=>row.evidence_strength==='PARTIAL_PRIMARY_FRAGMENT').length,
    full_primary_syllabi:0,recorded_reading_rows:readingRows.length,
    required_FSU3670_chapter_slots:readingRows.filter(row=>row.course_instance_id.startsWith('FSU-PHI3670')&&row.item_id.startsWith('chapter-')&&row.assignment_kind==='required').length,
    unresolved_required_FSU3670_chapter_titles:readingRows.filter(row=>row.course_instance_id.startsWith('FSU-PHI3670')&&row.item_id.startsWith('chapter-')&&row.assignment_kind==='required'&&row.title_resolution==='unknown').length,
    unresolved_required_Blackboard_titles:readingRows.filter(row=>row.item_id.startsWith('Blackboard-')).length,
    starter_cells:cells.length,starter_unsearched_cells:cells.filter(row=>row.status==='UNSEARCHED').length,recorded_CDX_attempts:attempts.length,
    valid_CDX_capture_records:attempts.reduce((total,row)=>total+Number(row.valid_capture_records),0)};
  return Object.entries(values).map(([metric,value])=>({metric,value:String(value)}));
}
function build() {
  const p = pins(), files = sourceFiles(p), courseRows = courses(p), readingRows = assignments(p), cells = starter(p), attempts = discovery(p);
  for (const [filename,rows] of Object.entries({'source-files.tsv':files,'course-instances.tsv':courseRows,'assigned-readings.tsv':readingRows,'starter-institutions.tsv':cells,
    'discovery-responses.tsv':attempts,'summary.tsv':summary(courseRows,readingRows),'counts.tsv':counts(p,files,courseRows,readingRows,cells,attempts)})) save(filename,rows);
}
function same(actual,expected,diagnostic) { if(JSON.stringify(actual)!==JSON.stringify(expected)) fail(diagnostic); }
function check(directory = C) {
  const p = pins(), files = table('source-files.tsv',directory), expectedFiles = sourceFiles(p);
  same(files,expectedFiles,'source-inventory-mismatch');
  if(files.some(row=>['broken','outside_snapshot'].includes(row.target_state))) fail('invalid-symlink');
  const courseRows = table('course-instances.tsv',directory);
  if(new Set(courseRows.map(row=>row.course_instance_id)).size!==courseRows.length) fail('duplicate-course-instance');
  for(const course of courseRows) {
    const row = files.find(row=>row.snapshot_id===course.source_snapshot&&row.path===course.source_path);
    if(!row||row.sha256!==course.source_sha256||row.commit!==course.source_revision) fail('course-source-binding');
    if(row.evidence_role==='synthetic_fixture') fail('synthetic-course-promoted');
    if(course.status!=='PARTIAL'||!['unknown','fragment_only'].includes(course.complete_document_sha256)) fail('invented-course-completion');
    if(course.course_code==='EDG 7067'&&(course.discipline!=='education'||course.panel_included!=='no')) fail('education-as-philosophy');
  }
  if(courseRows.find(row=>row.course_code==='PHI 3670')?.year!=='unknown') fail('invented-spring-year');
  same(courseRows,courses(p),'course-source-fields-mismatch');
  const readingRows = table('assigned-readings.tsv',directory);
  same(readingRows,assignments(p),'assigned-reading-source-mismatch');
  const fsuRequired = readingRows.filter(row=>row.course_instance_id==='FSU-PHI3670-spring-year-unknown'&&row.item_id.startsWith('chapter-')&&row.assignment_kind==='required');
  if(fsuRequired.length!==22 || fsuRequired.filter(row=>row.title_resolution==='unknown').length!==10) fail('FSU-schedule-baseline');
  const cells = table('starter-institutions.tsv',directory);
  if(cells.length!==28||new Set(cells.map(row=>row.institution_id+'\t'+row.field)).size!==28) fail('starter-denominator');
  for(const cell of cells) {
    if(cell.course_denominator!=='unknown'||cell.complete_course_instances!=='0') fail('invented-panel-completion');
    if(!['UNSEARCHED','PARTIAL_READING_EVIDENCE','SEARCH_ATTEMPT_RECORDED'].includes(cell.status)) fail('false-absence');
    if(cell.institution_id==='USF'&&cell.field==='philosophy'&&cell.status!=='SEARCH_ATTEMPT_RECORDED') fail('retained-search-erased');
  }
  same(cells,starter(p),'starter-evidence-mismatch');
  const attempts = table('discovery-responses.tsv',directory);
  if(attempts.some(row=>row.absence_claim!=='unknown')) fail('message-as-absence');
  same(attempts,discovery(p),'CDX-source-mismatch');
  same(table('summary.tsv',directory),summary(courseRows,readingRows),'summary-source-mismatch');
  same(table('counts.tsv',directory),counts(p,files,courseRows,readingRows,cells,attempts),'count-mismatch');
}
function controls() {
  check();
  console.log('PASS\tactual-source-inventory');
  const mutations = [
    ['invented-course-completion','course-instances.tsv','status','COMPLETE',0],
    ['education-as-philosophy','course-instances.tsv','discipline','philosophy',2],
    ['invented-spring-year','course-instances.tsv','year','2006',0],
    ['false-absence','starter-institutions.tsv','status','NO_SYLLABUS_EXISTS',1],
    ['invented-panel-completion','starter-institutions.tsv','complete_course_instances','2',0],
    ['retained-search-erased','starter-institutions.tsv','status','UNSEARCHED',4],
    ['message-as-absence','discovery-responses.tsv','absence_claim','no_syllabi_exist',0],
    ['source-inventory-mismatch','source-files.tsv','sha256','0'.repeat(64),0],
    ['course-source-binding','course-instances.tsv','source_sha256','0'.repeat(64),0],
    ['assigned-reading-source-mismatch','assigned-readings.tsv','reading','Invented book',0],
    ['count-mismatch','counts.tsv','value','999',0]
  ];
  for(const [diagnostic,filename,field,value,index] of mutations) {
    const scratch = fs.mkdtempSync(path.join(require('node:os').tmpdir(),'syllabus-inv-'));
    try {
      for(const filename of fs.readdirSync(C).filter(name=>name.endsWith('.tsv'))) fs.copyFileSync(path.join(C,filename),path.join(scratch,filename));
      const rows = table(filename,scratch); rows[index][field] = value; save(filename,rows,scratch);
      let observed = 'accepted'; try { check(scratch); } catch(error) { observed = error.message; }
      if(observed!==diagnostic) fail(`wrong-control-diagnostic:${diagnostic}:${observed}`);
      console.log(`PASS\treject-${diagnostic}`);
    } finally { fs.rmSync(scratch,{recursive:true,force:true}); }
  }
  const scratch = fs.mkdtempSync(path.join(require('node:os').tmpdir(),'syllabus-inv-'));
  try {
    for(const filename of fs.readdirSync(C).filter(name=>name.endsWith('.tsv'))) fs.copyFileSync(path.join(C,filename),path.join(scratch,filename));
    const rows = table('course-instances.tsv',scratch), synthetic = sourceFiles(pins()).find(row=>row.snapshot_id==='book_first'&&row.path==='parsers/fixtures/usf-course.warc');
    rows[0].source_snapshot = 'book_first'; rows[0].source_path = synthetic.path; rows[0].source_revision = synthetic.commit; rows[0].source_sha256 = synthetic.sha256;
    save('course-instances.tsv',rows,scratch);
    let observed = 'accepted'; try {check(scratch);}catch(error){observed=error.message;}
    if(observed!=='synthetic-course-promoted') fail(`wrong-control-diagnostic:synthetic-course-promoted:${observed}`);
    console.log('PASS\treject-synthetic-course-promoted');
  } finally {fs.rmSync(scratch,{recursive:true,force:true});}
}
function aiciControls(ithon,checker) {
  if(!path.isAbsolute(ithon)||!path.isAbsolute(checker)) fail('explicit-AICI-and-Ithon-paths-required');
  const command = root => execFileSync(ithon,[checker,root,'coverage/inventory.contract.tsv'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  process.stdout.write(command(ROOT));
  const cases = table('aici-cases.tsv');
  const rules = table('inventory.contract.tsv');
  if(new Set(cases.map(row=>row.diagnostic)).size!==rules.length||cases.length!==rules.length) fail('AICI-case-coverage');
  for(const case_ of cases) {
    if(!rules.some(rule=>rule.diagnostic===case_.diagnostic)) fail('AICI-unknown-case');
    const scratch = fs.mkdtempSync(path.join(require('node:os').tmpdir(),'syllabus-aici-'));
    const data = path.join(scratch,'coverage'); fs.mkdirSync(data);
    try {
      fs.symlinkSync(path.join(ROOT,'.git'),path.join(scratch,'.git'),'dir');
      for(const filename of fs.readdirSync(C).filter(name=>name.endsWith('.tsv'))) fs.copyFileSync(path.join(C,filename),path.join(data,filename));
      const full = path.join(data,case_.path), lines = fs.readFileSync(full,'utf8').trimEnd().split('\n');
      const index = Number(case_.data_row_index)+1;
      if(case_.replacement==='DELETE_ROW') lines.splice(index,1);
      else {const fields = lines[index].split('\t');fields[Number(case_.column_index)] = case_.replacement;lines[index]=fields.join('\t');}
      fs.writeFileSync(full,lines.join('\n')+'\n');
      let rejected = false;
      try {command(scratch);} catch(error) {
        if(error.status!==1||!String(error.stderr).includes(`ValueError: ${case_.diagnostic}\n`)) fail(`AICI-wrong-diagnostic:${case_.diagnostic}`);
        rejected = true;
      }
      if(!rejected) fail(`AICI-control-accepted:${case_.diagnostic}`);
      console.log(`PASS\tAICI-reject-${case_.diagnostic}`);
    } finally {fs.rmSync(scratch,{recursive:true,force:true});}
  }
}
try {
  const action = process.argv[2];
  if(action==='build'){build();console.log('PASS\tbuild-source-derived-inventory');}
  else if(action==='check'){check();console.log('PASS\tverify-source-derived-inventory');}
  else if(action==='controls'){controls();}
  else if(action==='aici-controls'){aiciControls(process.argv[3],process.argv[4]);}
  else fail('usage: node inventory.js build|check|controls');
} catch(error) {console.error(`FAIL\t${error.message}`);process.exitCode=1;}
