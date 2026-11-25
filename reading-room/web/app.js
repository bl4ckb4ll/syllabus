'use strict';

const content = document.querySelector('#content');
const liveNotice = document.querySelector('#notice');
const shelfFilter = {course: '', query: '', all: false};
const compareState = {left: 'g2203', right: 'g2204', group: 'both', query: ''};
const corpus = {};
const textCache = new Map();
const loadedTexts = new Map();
let storageKey = 'blackball.reading-room.v1';
function setReaderScope(profileId) {
  const next = 'blackball.reading-room.v1' + (profileId ? '.' + profileId : '');
  if (next !== storageKey) { closePlayer(); reader = null; }
  storageKey = next;
  state = readState();
}
let state = readState();
let routeToken = 0;
let noteTimer;
let reader = null;
let player = null;
let previousView = '';
let breadcrumb = '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keyText = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const byId = (rows, id) => rows.find(row => row.id === id);
const getBook = id => byId(corpus.works, id);
const getCourse = id => byId(corpus.courses, id);
const courseRows = id => corpus.assignments.filter(a => a.course === id);
const bookRows = id => [...corpus.assignments,...corpus.supplements].filter(a => a.work === id);
const chosenRow = (id, cid) => bookRows(id).find(a => a.course === cid) || bookRows(id)[0];
const courseInfo = course => byId(corpus['course-context'], course.id);
const copies = id => corpus.copies.filter(c => c.work === id);
const recordings = id => corpus.recordings.filter(r => r.work === id);
const safeURL = raw => /^https?:\/\//.test(raw || '') ? esc(raw) : '#';
const external = (label, url, className = '') => `<a class="${className}" href="${safeURL(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const link = (text, hash, classes = '') => `<a href="#${esc(hash)}" class="${classes}">${esc(text)}</a>`;
const select = (id, label, options, selected) => `<label class="select-wrap"><span class="sr-only">${esc(label)}</span><select id="${id}">${options.map(([value,title]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(title)}</option>`).join('')}</select></label>`;
const schoolName = c => ({'Yale University':'Yale','Grinnell College':'Grinnell','University of South Florida':'South Florida','Massachusetts Institute of Technology':'MIT'}[c.school] || c.school);
const courseLabel = c => `${schoolName(c)} · ${c.code}`;
const today = () => new Date().toISOString();
const localDate = date => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
};
const formatDay = iso => { const s = String(iso || '').split('-').map(Number); return s.length === 3 ? localDate(new Date(s[0],s[1]-1,s[2])) : ''; };
const routeFor = (page,id,cid) => [page,id,cid].filter(Boolean).join('/');
const meta = text => `<p class="meta">${esc(text)}</p>`;
const icon = type => `<span class="icon-${type}" aria-hidden="true"></span>`;

function readState() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (data && data.version === 1 && data.books && typeof data.books === 'object') return data;
  } catch {}
  return {version:1, books:{}};
}
function saveState() {
  try {localStorage.setItem(storageKey, JSON.stringify(state));}
  catch {notice('This browser could not save your place. It is available until this page closes.');}
}
function getEntry(id) {return state.books[id] || null;}
function touch(id, cid) {
  const e = state.books[id] ||= {started:today(), notes:[], finished:{}, audio:{}};
  if (cid) e.course = cid;
  e.updated = today();
  return e;
}
function notice(message) {
  clearTimeout(noteTimer);
  liveNotice.textContent = message;
  noteTimer = setTimeout(() => {liveNotice.textContent = '';}, 3500);
}
function parseTable(input) {
  const [header, ...lines] = input.replace(/\r\n/g,'\n').replace(/\n+$/,'').split('\n');
  const keys = header.split('\t');
  return lines.filter(Boolean).map(line => Object.fromEntries(line.split('\t').map((v,i) => [keys[i],v])));
}
async function fetchTable(name) {
  const response = await fetch('data/'+name+'.tsv');
  if (!response.ok) throw Error('Could not open '+name);
  return [name, parseTable(await response.text())];
}
function courseOptions() {
  return corpus.courses.map(c => [c.id,courseLabel(c)+(courseInfo(c).status==='unknown'?' · readings unknown':'')]);
}
function courseSourceLink(course) {
  const info = courseInfo(course);
  return info.status === 'unknown'
    ? external('Course listing',course.listing,'textlink')
    : external('Inspect the syllabus',course.source,'textlink');
}
function crumbs(last) {
  const from = breadcrumb === 'path' ? ['Reading by college','path'] : breadcrumb === 'compare' ? ['Compare syllabi','compare'] : breadcrumb === 'log' ? ['Reading log','log'] : ['Bookshelf','shelf'];
  return `<div class="crumbs">${link(from[0],from[1])}<i>/</i><span>${esc(last)}</span></div>`;
}
// A contextual start describes the first assigned passage in a particular offering.
// The copy catalog remains attached to the work across offerings.
function firstRoute(id, course) {
  const start = corpus['reading-starts'].find(row => row.work === id && row.course === course);
  if (start?.url) return start;
  const routes = copies(id);
  return ['web','sample','library','publisher','catalog','lookup'].map(kind => routes.find(c => c.kind === kind)).find(Boolean) || routes[0];
}
function readLink(label, url, book, cid, style) {
  return `<a class="${style}" data-external-work="${book.id}" data-course="${esc(cid)}" href="${safeURL(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}
function primaryAction(book,cid,style='btn primary', compact=false) {
  const e=getEntry(book.id);
  if (book.text) {
    const label=e?.cursor ? 'Continue reading' : compact ? 'Read here' : 'Read '+book.startLabel;
    const h=routeFor(e?.cursor?.short?'short':'read',book.id,cid);
    return `<a class="${style}" href="#${h}">${style.includes('btn')?icon('book'):''}${esc(label)}</a>`;
  }
  const route=firstRoute(book.id,cid);
  if (!route) return link('See the listing',routeFor('book',book.id,cid),style);
  const label=route.course ? route.label : {sample:'Read a sample',web:'Read online',library:'Find a library copy',publisher:'See the publisher'}[route.kind] || 'Find a copy';
  return readLink(label,route.url,book,cid,style);
}
const questions = {
  douglass: 'Who gets to know their birthday in Douglass’s opening chapter? What does he make of the difference?',
  manifesto: 'How do Marx and Engels distinguish a class from a collection of individuals? Pick a passage that helped you decide.',
  apology: 'Which accusation does Socrates choose to answer first? What reason does he give?',
  germinal: 'What can Étienne learn about the mine before anybody explains how it works?',
  alcott: 'Which detail of hospital work might an official report leave out?',
  foner: 'Which decision changed who could exercise power during Reconstruction? Write down the page.',
  ordinary: 'Which piece of evidence does Browning use to explain a choice? What else could it mean?',
  'yellow-wallpaper':'What does the narrator trust herself to notice? What do the people around her dismiss?',
  equiano:'Where does Equiano distinguish his own memory from what he learned from other people?'
};
const titleAliases = {
  manifesto:'Manifesto of the Communist Party Manifest der kommunistischen Partei',
  apology:'The Apology of Socrates The Defence of Socrates',
  'foner-long':"America's Unfinished Revolution 1863 1877"
};
function matchesWork(book, query) {
  const words=keyText(query).split(' ').filter(Boolean);
  const haystack=keyText([book.title,book.author,titleAliases[book.id]||''].join(' '));
  return words.every(word=>haystack.includes(word));
}
const covers={douglass:'douglass.jpg',alcott:'alcott.png',manifesto:'manifesto.webp',apology:'plato.webp',germinal:'germinal.jpg'};
function shelfRoute(book,cid) {
  return routeFor(book.text ? getEntry(book.id)?.cursor?.short ? 'short' : 'read' : 'book',book.id,cid);
}
function companionAudio(book,cid) {
  if(recordings(book.id).length)return link('Listen',routeFor('listen',book.id,cid),'quietlink');
  if(book.id==='foner'||book.id==='foner-long'){
    const interview=copies(book.id).find(c=>c.kind==='interview' && c.url.endsWith('.mp3'));
    return interview ? external('Foner interview',interview.url,'quietlink') : '';
  }
  const available = copies(book.id).find(copy => copy.kind === 'audiobook' && !/library loan/i.test(copy.detail));
  return available ? external(available.label.startsWith('Play ') ? available.label.split(' · ')[0] : 'Audiobook',available.url,'quietlink') : '';
}
function cover(book,cid) {
  const img=covers[book.id], hue=[...book.id].reduce((sum,c)=>sum+c.charCodeAt(0),0)%360;
  return `<a class="bookcover ${book.id}c ${img?'plate':''}" style="--hue:${hue}" href="#${shelfRoute(book,cid)}" aria-label="${book.text?'Read ':'View '}${esc(book.short)}">${img?`<img src="assets/${img}" loading="lazy" alt="">`:`<span>${esc(book.short.slice(0,48))}</span>`}</a>`;
}
function bookRow(book,cid) {
  const aa=bookRows(book.id);
  const a=chosenRow(book.id,cid);
  const c=a?getCourse(a.course):null;
  const actualCid=c?.id||'';
  const schools=[...new Set(aa.map(row=>schoolName(getCourse(row.course))))];
  const label=cid&&c?courseLabel(c):schools.length>1?schools.join(' + '):c?courseLabel(c):'Related work';
  const start=firstRoute(book.id,actualCid);
  const title=!book.text && start?.kind==='web' ? readLink(book.short,start.url,book,actualCid,'booktitle') : link(book.short,shelfRoute(book,actualCid),'booktitle');
  return `<article class="bookrow">${cover(book,actualCid)}<div>${meta(label)}${title}<p class="byline">${esc(book.author)}</p><div class="rowacts">${primaryAction(book,actualCid,'textlink',true)} ${companionAudio(book,actualCid)} ${link('Copies & details',routeFor('book',book.id,actualCid),'quietlink')}</div></div></article>`;
}
function shelf() {
  const b=getBook('douglass');
  const selected=shelfFilter.course;
  const all=[['','All courses'],...courseOptions()];
  content.innerHTML=`<div class="pagehead"><div><p class="kicker">Liberal arts</p><h1>The reading shelf</h1></div><a class="aside-link" href="#path">Browse by college</a></div>
  <section class="hero" aria-label="Featured reading from Yale"><div class="herocopy">
  <p class="overline">Yale · HIST 119 · Spring 2008</p><h2>Narrative of the Life of Frederick Douglass</h2><p class="heroauthor">Frederick Douglass <span>·</span> 1845</p>
  <p class="extract heroquote">“I have no accurate knowledge of my age, never having seen any authentic record containing it.”</p>
  <div class="actions">${primaryAction(b,'y119')}<a class="btn soft" href="#listen/douglass/y119">${icon('play')} Listen</a></div>
  <p class="herofoot">${link('Copies, editions & syllabus','book/douglass/y119','quietlink')}</p></div>
  <figure class="heroplate"><img src="assets/douglass.jpg" alt="A young Frederick Douglass in a dark coat, painted around 1844." fetchpriority="high"><figcaption>Frederick Douglass, c. 1844</figcaption></figure></section>
  <section class="listing" aria-labelledby="browse-title"><div class="sectitle"><h2 id="browse-title">Browse readings</h2><div class="filters">
  <label class="searchbox"><span class="sr-only">Find a title or author</span><input type="search" id="search" placeholder="Title or author" value="${esc(shelfFilter.query)}"></label>${select('shelf-course','Filter by course',all,selected)}</div></div>
  <div id="books"></div></section>`;
  refreshShelf();
}
function refreshShelf() {
  const {course,query,all}=shelfFilter;
  const output=document.querySelector('#books');
  if (course && courseInfo(getCourse(course)).status==='unknown') {
    output.innerHTML=`<p class="empty">Reading list unknown. ${courseSourceLink(getCourse(course))}</p>`;
    return;
  }
  const q=keyText(query);
  const sourceIds=course?new Set(courseRows(course).map(a=>a.work)):null;
  const order=['alcott','manifesto','apology','germinal','foner','ordinary','douglass'];
  let rows=corpus.works.filter(b=>(sourceIds?sourceIds.has(b.id):bookRows(b.id).length>0||q) && (!q||matchesWork(b,q)));
  rows=rows.sort((a,b)=>{const i=order.indexOf(a.id),j=order.indexOf(b.id);return (i<0?100:i)-(j<0?100:j)||a.title.localeCompare(b.title);});
  const n=rows.length, shown=all||q||course?rows:rows.slice(0,6);
  output.innerHTML=(n?`<div class="books">${shown.map(b=>bookRow(b,course)).join('')}</div>`:'<p class="empty">No titles match this search in the selected course list.</p>')+
    (shown.length<n?`<button class="btn soft smallbtn more" data-action="all-books">Show all ${n} readings</button>`:`<p class="small shelf-intro">${n} ${n===1?'reading':'readings'}${course?' in this course list':''}.</p>`);
}
function assignmentBlock(a) {
  const c=getCourse(a.course);
  const info=courseInfo(c);
  const refs=a.source.split('|');
  return `<div class="stack"><p class="overline">${esc(a.role)}</p><h3>${esc(c.title)}</h3><p class="small">${esc(c.school)} · ${esc(info.department)} · ${esc(c.code)}<br>${esc(c.instructor)} · ${esc(c.term)}</p><p>${esc(a.scope)}</p><p class="small">${esc(a.edition)}</p><div class="sourceLine">${refs.map((url,i)=>external(refs.length===1?a.locator:(a.work==='foner'?['Lecture 21','Lecture 23','Lecture 25'][i]:'Source '+(i+1)),url)).join(' ')}</div><details class="fold"><summary>Program and course context</summary><p class="small">${esc(c.major)}</p><div class="sourceLine copyline">${external(c.id==='u3401'?'Course source':'Program record',c.catalog)}</div></details></div>`;
}
const groupName={web:'Web texts',epub:'EPUB downloads',scan:'Scans & digital editions',sample:'Book samples',library:'Library copies',publisher:'Publishers',catalog:'Catalog records',audiobook:'Audiobooks',lecture:'Lectures & discussions',interview:'Interviews with the author',lookup:'Title lookups'};
function copiesPanel(book,cid) {
  const all=copies(book.id),records=recordings(book.id);
  const groups=['web','epub','scan','sample','audiobook','lecture','interview','library','publisher','catalog','lookup'];
  return groups.map(kind=>{
    const rows=all.filter(c=>c.kind===kind);
    const players=kind==='audiobook'?records:[];
    if(!rows.length&&!players.length)return '';
    return `<details class="fold"><summary>${esc(groupName[kind])} <span class="sr-only">${rows.length+players.length} options</span></summary>${players.map(r=>`<div class="copyline">${link('Play · '+r.reader,routeFor('listen',book.id,cid)+'/'+r.id,'textlink')}<p>LibriVox · ${esc(r.language)} · ${esc(r.length)} · ${external('Recording page',r.url,'quietlink')}</p>${recordingMirrors(r.id)}</div>`).join('')}${rows.map(c=>`<div class="copyline">${external(c.label,c.url)}<p>${esc(c.detail)}</p></div>`).join('')}</details>`;
  }).join('');
}
function recordingMirrors(id) {
  const mirrors=corpus['recording-mirrors'].filter(mirror=>mirror.recording===id);
  return mirrors.map(mirror=>`<p class="small mirror">${external(mirror.label,mirror.url,'quietlink')} · ${esc(mirror.detail)}</p>`).join('');
}
function detail(id,cid) {
  const b=getBook(id); if(!b) return notFound();
  const aa=bookRows(id),ordered=[...aa].sort((a,b)=>Number(b.course===cid)-Number(a.course===cid));
  cid=chosenRow(id,cid)?.course||'';
  const r=recordings(id)[0];
  const logged=!!getEntry(id);
  const start = firstRoute(id,cid);
  const additional = corpus.supplements.filter(row => row.course===cid && row.parent===id);
  content.innerHTML=crumbs('Book details')+`<div class="subhead"><p class="kicker">${aa.length?'On the shelf':'Related reading'}</p><h1>${esc(b.title)}</h1><p class="author">${esc(b.author)}${b.year?' · '+esc(b.year):''}</p>${b.description?`<p class="sub">${esc(b.description)}</p>`:''}
  <div class="actions">${primaryAction(b,cid)}${r?`<a class="btn soft" href="#${routeFor('listen',id,cid)}">${icon('play')} Listen</a>`:companionAudio(b,cid)}${b.text?link('Short screens',routeFor('short',id,cid),'quietlink'):''}${link('Study guide & check-in','study/book-'+id,'quietlink')}<button class="linkbutton" data-action="save-book" data-book="${id}" data-course="${cid}">${logged?'Open my reading log':'Save to my reading log'}</button></div></div>
  <div class="grid-detail"><section class="detail-section"><h2>Copies & editions</h2>${copiesPanel(b,cid)}
  ${start?.course&&!b.text?`<p class="small start-note">${esc(start.detail)}</p>`:''}
  ${additional.length?`<div class="detail-section"><p class="kicker">Also assigned by Cohn</p><div class="stack">${additional.map(row=>`<p>${link(getBook(row.work).short,routeFor('book',row.work,cid),'textlink')}<br><span class="small">${esc(row.scope)}</span></p>`).join('')}</div></div>`:''}
  ${id==='foner'?`<div class="detail-section"><p class="kicker">Related work</p>${link('Reconstruction: America’s Unfinished Revolution','book/foner-long','textlink')}</div>`:''}
  </section><aside class="box">${ordered.length?ordered.map(assignmentBlock).join('<hr class="softline">'):`<div class="stack"><h2>Course evidence</h2><p>Blight’s syllabus lists Foner’s shorter book. This is the related full-length history.</p>${link('See the assigned Foner title','book/foner/y119','textlink')}</div>`}</aside></div>`;
}
function notFound() {content.innerHTML=`<div class="loading"><h1>Reading unavailable</h1><p>This saved link does not match an entry in this edition of the shelf.</p>${link('Return to the bookshelf','shelf','textlink')}</div>`;}
function sources() {
  document.title='Course sources · Blackball';
  content.innerHTML=crumbs('Sources')+`<div class="subhead"><h1>Sources & coverage</h1><p class="sub">Each offering has its own instructor, term and coverage. The comparison uses the reviewed reading lists below.</p></div><section class="sources">${corpus.courses.map(c=>`<article class="box stack"><p class="overline">${esc(c.school)} · ${esc(courseInfo(c).department)} · ${esc(c.code)}</p><h3>${esc(c.title)}</h3><p>${esc(c.instructor)} · ${esc(c.term)}</p><p class="small">${esc(c.coverage)} ${esc(c.major)}</p>${courseInfo(c).search?`<p class="small">${esc(courseInfo(c).search)}</p>`:''}<div class="source-nav">${courseSourceLink(c)} ${c.catalog!==c.listing?external(c.id==='u3401'?'Verified reading records':'Program or publication record',c.id==='u3401'?c.listing:c.catalog):''} ${c.id.startsWith('y')?external('Historical course listing',c.listing):''}</div></article>`).join('')}
  <details class="fold"><summary>Download the reading data</summary><p class="small">The tables document the works, assignments, copies and evidence attached to them. See the course context for review scope and the source status for acquisition.</p><div class="source-nav copyline">${['works','courses','course-context','slots','grinnell-evidence','assignments','supplements','reading-starts','copies','recordings','recording-mirrors','recording-cues','tracks','source-status','open-courses','open-courses-nptel','open-providers','openlearn-pages','open-access','study-guides'].map(s=>`<a href="data/${s}.tsv" download>${s}.tsv</a>`).join(' ')}<a href="text/provenance.tsv" download>Text provenance</a><a href="text/rights.tsv" download>Text rights</a></div></details>
  <details class="fold"><summary>Blackball source projects</summary><div class="copyline source-nav"><a href="https://github.com/bl4ckb4ll/syllabus/tree/main/reading-room" target="_blank" rel="noopener noreferrer">Reading Room source code</a><a href="https://github.com/bl4ckb4ll/syllabus" target="_blank" rel="noopener noreferrer">Syllabus bookshelf</a><a href="https://github.com/bl4ckb4ll/syllabus/pull/40" target="_blank" rel="noopener noreferrer">Yale and Grinnell source intake</a><a href="https://github.com/Ashtray-Archer/sms-book-reader/blob/3ef8aa7896fec64c0e29572ae8f325219df2bb64/README.md" target="_blank" rel="noopener noreferrer">SMS Book Reader mock</a></div><p class="small copyline">The study service accepts plain-text commands and provides opted-in reminders to a configured sender. The separate Go reader handles passage navigation.</p></details>
  <details class="fold"><summary>Text and image credits</summary><p class="small">The built-in readers reproduce public-domain texts in English. Source identities and edition coverage are recorded in the text provenance table. The Douglass portrait is by an unknown artist, c. 1844. The shelf also uses Jules Breton’s The Song of the Lark and Jean Delville’s L’École de Platon via Standard Ebooks, and illustrations from the Alcott and Zola editions at Project Gutenberg.</p><div class="source-nav copyline"><a href="data/art.tsv">Image credits and source records</a><a href="text/provenance.tsv">Edition records</a></div></details>
  </section>`;
}

function compare(leftId,rightId) {
  if (leftId && getCourse(leftId)) compareState.left=leftId;
  if (rightId && getCourse(rightId)) compareState.right=rightId;
  const {left,right}=compareState;
  document.title='Compare syllabi · Blackball';
  const panel=(side,id)=>{
    const c=getCourse(id);
    return `<div class="compare-card"><label for="cmp-${side}">${side==='left'?'First course':'Second course'}</label>${select('cmp-'+side,'Select '+side+' course',courseOptions(),id)}<h3>${esc(c.title)}</h3><p class="small">${esc(c.instructor)} · ${esc(c.term)}</p><p class="small" style="margin:9px 0">${esc(c.coverage)}</p>${courseSourceLink(c)}<details class="fold"><summary>Program and course context</summary><p class="small copyline">${esc(c.major)} ${external('Program or course record',c.catalog,'quietlink')}</p></details></div>`;
  };
  content.innerHTML=`<div class="pagehead"><div><p class="kicker">Liberal arts <span>/</span> Courses</p><h1>Compare syllabi</h1><p class="sub">See which works appear on both reviewed lists and which appear on just one.</p></div></div><div class="panel-group">${panel('left',left)}${panel('right',right)}</div><div id="compare-result"></div>
  <section class="unknown-form box"><h2>Check a title</h2><p class="small">Look for a work in these two lists, including one you expected to find.</p><label class="searchbox" style="margin-top:12px"><span class="sr-only">Title to look for</span><input id="compare-query" type="search" value="${esc(compareState.query)}" placeholder="Try America’s Unfinished Revolution"></label><div class="resultlist" id="lookup-result" aria-live="polite"></div></section>`;
  drawComparison();
  lookupComparison();
}
function compareCourses(leftId,rightId) {
  const left=courseRows(leftId), right=courseRows(rightId);
  const leftWorks=new Set(left.map(row=>row.work));
  const rightWorks=new Set(right.map(row=>row.work));
  return {both:left.filter(row=>rightWorks.has(row.work)),left:left.filter(row=>!rightWorks.has(row.work)),right:right.filter(row=>!leftWorks.has(row.work))};
}
function drawComparison() {
  const panel=document.querySelector('#compare-result');
  const {group,left,right}=compareState, lc=getCourse(left), rc=getCourse(right);
  if(left===right){panel.innerHTML='<p class="empty">Choose two different course lists to compare them.</p>';return;}
  const missing=[lc,rc].filter(course=>courseInfo(course).status==='unknown');
  if(missing.length) {
    panel.innerHTML=missing.map(course=>`<p class="empty"><b>${esc(course.code)} · Reading list unknown</b><br>${esc(courseInfo(course).search)} ${courseSourceLink(course)}</p>`).join('');
    return;
  }
  const diff=compareCourses(left,right), labels={both:'Both lists',left:lc.code+' only',right:rc.code+' only'};
  panel.innerHTML=`<div class="tabs" aria-label="Comparison group">${Object.keys(labels).map(k=>`<button data-action="diff" data-key="${k}" aria-pressed="${group===k}">${esc(labels[k])} <span class="count">${diff[k].length}</span></button>`).join('')}</div>`+
    (diff[group].length?diff[group].map(a=>{
      const b=getBook(a.work),matches=group==='both'?[chosenRow(b.id,left),chosenRow(b.id,right)]:[a];
      return `<article class="compare-result"><div>${link(b.short,routeFor('book',b.id,a.course))}<p class="byline">${esc(b.author)}</p><div class="rowacts">${primaryAction(b,a.course,'textlink',true)}</div></div><div>${matches.map(row=>`<p class="small"><b>${esc(getCourse(row.course).code)}</b> · ${esc(row.scope)} ${external('Source',row.source.split('|')[0])}</p>`).join('')}</div></article>`;
    }).join(''):'<p class="empty">No works in this group across the two reviewed lists.</p>')+
    '<p class="small" style="margin-top:12px">“Only” refers to the two lists above. Other sections, handouts and unreviewed courses can assign the same work.</p>';
}
function lookupComparison() {
  const {left,right,query}=compareState;
  const out=document.querySelector('#lookup-result'),q=keyText(query);
  if(!q||left===right){out.textContent='';return;}
  const matches=corpus.works.filter(b=>matchesWork(b,q));
  const courseIds=[left,right];
  const statusLine=(id,book)=>{
    const course=getCourse(id);
    if (courseInfo(course).status==='unknown') return courseLabel(course)+': reading list unknown';
    return courseLabel(course)+(book&&courseRows(id).some(row=>row.work===book.id)?': on the reviewed list':': no match in the reviewed list');
  };
  if(!matches.length) {
    out.innerHTML=`<p>${esc(courseIds.map(id=>statusLine(id)).join(' · '))}</p><p class="small">Try a title or author as printed on the syllabus.</p>`;return;
  }
  out.innerHTML=matches.map(b=>{
    const source=bookRows(b.id).find(row=>courseIds.includes(row.course));
    return `<p>${link(b.short,routeFor('book',b.id,source?.course),'textlink')}<br><span class="small">${esc(courseIds.map(id=>statusLine(id,b)).join(' · '))}</span></p>`;
  }).join('');
}
function completionKey(cid) {return cid||'independent';}
function notesList(e) {
  if(!e?.notes?.length) return '';
  return e.notes.slice().reverse().map(n=>`<div class="note"><time>${esc(n.kind)} · ${esc(localDate(n.at))}${n.where?' · '+esc(n.where):''}</time><div>${esc(n.text)}</div></div>`).join('');
}
function notebook(id,cid,where='') {
  const e=getEntry(id),key=completionKey(cid),done=!!e?.finished?.[key];
  return `<div class="notebox" data-book="${id}" data-course="${esc(cid)}" data-where="${esc(where)}">
  <label class="field-label" for="kind-${id}">Add a reading note</label>
  <p class="small" style="margin:5px 0 10px">${esc(questions[id]||'What did you take from the reading? Which passage would you return to?')}</p>
  ${select('kind-'+id,'Kind of reading note',[['Before reading','Before reading'],['Reading note','While reading'],['After reading','After reading']],'Reading note')}
  <label class="sr-only" for="note-${id}">What did you take from the reading?</label><textarea id="note-${id}" maxlength="12000" placeholder="What did you notice? Which passage would you come back to?" style="margin-top:9px"></textarea>
  <button class="btn smallbtn" data-action="save-note">Save note</button>
  <div class="notelist">${notesList(e)}</div><hr class="softline">
  <label class="field-label" for="date-${id}">Next check-in on this device</label><div class="formline"><input id="date-${id}" type="date" value="${esc(e?.date||'')}"><button class="btn smallbtn" data-action="save-date">Save date</button></div><p class="small" style="margin-top:5px">The date appears in your log. This preview sends no notifications.</p>
  <hr class="softline"><button class="btn soft smallbtn" data-action="finish" aria-pressed="${done}">${done?'Undo finished mark':cid?'Mark assigned reading finished':'Mark work finished'}</button><p class="small finishlabel" style="margin-top:5px">${done?'Marked finished on '+esc(localDate(e.finished[key]))+'.':'Finish when you have read or listened to the portion you chose.'}</p></div>`;
}
function logView() {
  document.title='Reading log · Blackball';
  const rowIds=Object.keys(state.books).filter(id=>getBook(id)).sort((a,b)=>String(state.books[b].updated).localeCompare(String(state.books[a].updated)));
  content.innerHTML=`<div class="pagehead"><div><p class="kicker">Your reading</p><h1>Reading log</h1><p class="sub">Your place, your notes and the readings you’ve marked finished. Saved in this browser.</p></div>${link('My private study plan','plans','aside-link')}</div>`+
  (!rowIds.length?`<div class="logempty"><h2>Your first reading</h2><p class="sub">Open a text or save a book to start keeping your place.</p><div class="actions">${primaryAction(getBook('douglass'),'y119')}${link('Browse the shelf','shelf','quietlink')}</div></div>`:rowIds.map(id=>{
    const b=getBook(id),e=state.books[id],cid=e.course||'',a=chosenRow(id,cid);
    const finished=e.finished?.[completionKey(cid)],pos=e.cursor;
    const audio=Object.values(e.audio||{}).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')))[0];
    const audioRec=audio?byId(corpus.recordings,audio.recording):null;
    const st=[finished?'Marked finished · '+localDate(finished):pos?'Place saved · '+(pos.title||pos.section):'Saved to your log',e.date?'Check in '+formatDay(e.date):'',audioRec?'Audio · '+audioRec.reader:''].filter(Boolean);
    return `<article class="logitem"><p class="overline">${a?esc(courseLabel(getCourse(a.course))):'Independent reading'}</p><h3>${link(b.short,routeFor('book',id,cid))}</h3><p class="logmeta">${esc(st.join('   /   '))}</p><div class="rowacts">${primaryAction(b,cid,'textlink',true)} ${audioRec?link('Resume audio',routeFor('listen',id,cid)+'/'+audio.recording,'textlink'):''} ${link('Copies & syllabus',routeFor('book',id,cid),'quietlink')}</div><details class="fold"><summary>Notes & check-in${e.notes?.length?' ('+e.notes.length+')':''}</summary>${notebook(id,cid)}</details></article>`;
  }).join(''));
}
function updateNotebook(action, target) {
  const box=target.closest('.notebox'); if(!box)return;
  const {book:id,course:cid,where}=box.dataset;
  const e=touch(id,cid), key=completionKey(cid);
  if(action==='save-note'){
    const input=box.querySelector('textarea'),txt=input.value.trim();
    if(!txt){input.focus();notice('Write a note before saving.');return;}
    e.notes.push({at:today(),text:txt,where,kind:box.querySelector('select').value});
    input.value='';box.querySelector('.notelist').innerHTML=notesList(e);
    const summary=box.closest('details')?.querySelector('summary');if(summary)summary.textContent=`Notes & check-in (${e.notes.length})`;
    notice('Reading note saved.');
  }else if(action==='save-date'){
    e.date=box.querySelector('input[type=date]').value;
    notice(e.date?'Check-in saved for '+formatDay(e.date)+'.':'Check-in cleared.');
  }else if(action==='finish'){
    if(e.finished[key]) delete e.finished[key]; else e.finished[key]=today();
    target.setAttribute('aria-pressed',String(!!e.finished[key]));
    target.textContent=e.finished[key]?'Undo finished mark':cid?'Mark assigned reading finished':'Mark work finished';
    box.querySelector('.finishlabel').textContent=e.finished[key]?'Marked finished on '+localDate(e.finished[key])+'.':'Reading marked in progress.';
    notice(e.finished[key]?'Reading marked finished.':'Finished mark removed.');
  }
  saveState();
  const logItem=box.closest('.logitem');
  if(logItem && action!=='save-note'){
    const opened=!!logItem.querySelector('details')?.open;
    logView();
    if(opened){const newBox=document.querySelector('.notebox[data-book="'+id+'"]'); newBox?.closest('details')?.setAttribute('open','');newBox?.querySelector('[data-action="'+action+'"]')?.focus({preventScroll:true});}
  }
}
function splitParagraph(text, maximum=320) {
  const chunks=[];let start=0;
  while(start<text.length){
    let end=Math.min(start+maximum,text.length);
    if(end<text.length){
      const part=text.slice(start,end);
      const breaks=[...part.matchAll(/[.!?][”"’']?\s+/g)];
      const last=breaks[breaks.length-1];
      if(last&&last.index>maximum/2) end=start+last.index+last[0].length;
      else {
        const whites=[...part.matchAll(/\s+/g)];const w=whites[whites.length-1];
        if(w) end=start+w.index+w[0].length;
      }
      if(end>start && /[\uD800-\uDBFF]/.test(text[end-1]))end--;
    }
    chunks.push(text.slice(start,end));
    start=end;
  }
  return chunks;
}
async function getText(id) {
  if(loadedTexts.has(id))return loadedTexts.get(id);
  if(!textCache.has(id)){
    const promise=fetch('text/'+id+'.json').then(r=>{if(!r.ok)throw Error('Text unavailable');return r.json();}).then(data=>{
      data.sections.forEach(section=>{section.pieces=section.paragraphs.flatMap((p,index)=>splitParagraph(p).map(text=>({paragraph:index,text})));});
      loadedTexts.set(id,data);return data;
    }).catch(err=>{textCache.delete(id);throw err;});
    textCache.set(id,promise);
  }
  return await textCache.get(id);
}
function saveCursor() {
  const {id,cid,sectionIndex,index,short,data}=reader;
  const sec=data.sections[sectionIndex];
  const e=touch(id,cid);
  e.cursor={section:sec.id,title:sec.title,index,short};
  saveState();
}
async function openReader(id,cid,short,token) {
  const b=getBook(id); if(!b?.text){notFound();return;}
  cid=chosenRow(id,cid)?.course||'';
  content.innerHTML=`<div class="loading"><p class="kicker">Opening text</p><h1>${esc(b.short)}</h1></div>`;
  let data;
  try{data=await getText(id);}catch{
    if(token!==routeToken)return;
    const fallback=copies(id).find(c=>c.kind==='web');
    content.innerHTML=`<article class="loading"><h1>This copy could not open</h1><div class="actions">${fallback?external('Read at '+new URL(fallback.url).hostname,fallback.url,'btn primary'):''} <button class="btn soft" data-action="retry">Try again</button></div></article>`;return;
  }
  if(token!==routeToken)return;
  const cursor=getEntry(id)?.cursor;
  let sec=data.sections.findIndex(s=>s.id===(cursor?.section||data.start));
  if(sec<0)sec=Math.max(0,data.sections.findIndex(s=>s.id===data.start));
  const max=data.sections[sec].pieces.length-1;
  const index=Math.min(max,Math.max(0,Number(cursor?.index)||0));
  reader={id,cid,short,sectionIndex:sec,index,data};
  saveCursor();drawReader();
}
function drawReader(restoreFocus=false) {
  const {id,cid,short,sectionIndex,index,data}=reader,b=getBook(id);
  const sec=data.sections[sectionIndex], pieces=sec.pieces, n=short?1:5;
  const end=Math.min(index+n,pieces.length);
  const groups=[];
  pieces.slice(index,end).forEach(p=>{if(groups.at(-1)?.index===p.paragraph)groups[groups.length-1].text+=p.text;else groups.push({index:p.paragraph,text:p.text});});
  const opts=data.sections.map(s=>[s.id,s.title]); const last=sectionIndex===data.sections.length-1&&end===pieces.length;
  const first=sectionIndex===0&&index===0, bpos=sec.title+' · passage '+(index+1);
  document.title=sec.title+' · '+b.short+' · Blackball';
  const a=chosenRow(id,cid);
  const scopeHint=id==='manifesto'?(sec.id==='part-4'?'Part IV is beyond Cohn’s assignment.':'Grinnell assigned parts I–III. Toews’s introduction is a separate reading.'):id==='germinal'?'Havelock Ellis translation. Yale assigned Roger Pearson’s edition.':id==='apology'?'Benjamin Jowett translation. The syllabus permits other translations.':id==='douglass'?'1845 text. Yale assigned David W. Blight’s Bedford edition.':id==='alcott'?'1863 text. Yale assigned Alice Fahs’s Bedford edition.':a?.edition||'';
  const nextLabel=end<pieces.length?(short?'Next screen':'Next page'):sectionIndex<data.sections.length-1?'Next section':'End of text';
  content.innerHTML=`<article class="reader"><div class="readerhead">${link('Copies & syllabus',routeFor('book',id,cid),'quietlink')}<div class="reader-tool seg" aria-label="Page size"><button data-action="read-mode" data-mode="read" aria-pressed="${!short}">Pages</button><button data-action="read-mode" data-mode="short" aria-pressed="${short}">Short screens</button></div></div>
  <p class="kicker">${esc(b.short)}</p><h1 id="reader-title" tabindex="-1">${esc(sec.title)}</h1><p class="small readmeta">${esc(b.author)} ${a?' · '+esc(getCourse(a.course).code):''}</p>
  <div class="progress" aria-hidden="true"><i style="width:${100*(index+1)/pieces.length}%"></i></div>
  <div class="readbody ${short?'short':''}">${groups.map(p=>`<p>${esc(p.text)}</p>`).join('')}</div><div class="pager"><button class="btn soft smallbtn" data-action="prev-page" ${first?'disabled':''}>Previous</button><span class="small">Passage ${index+1}${end>index+1?'–'+end:''} of ${pieces.length}</span><button class="btn primary smallbtn" data-action="next-page" ${last?'disabled':''}>${nextLabel}</button></div>
  <p class="small readerActions">${esc(scopeHint)}${short?' Short screens preview flip-phone reading in this browser.':''}</p>
  <div class="reader-tool"><span class="field-label" style="margin:0">Contents</span>${select('chapter','Jump to a section',opts,sec.id)}</div>
  <details class="fold readerlow" ${last?'open':''}><summary>Notes & check-in</summary>${notebook(id,cid,bpos)}</details>${last?'':`<p class="logfoot">Your place is saved as you read.</p>`}</article>`;
  if(restoreFocus){document.querySelector('#reader-title')?.focus({preventScroll:true});window.scrollTo(0,0);}
}
function turnPage(forward) {
  const r=reader;if(!r)return;
  const size=r.short?1:5, sec=r.data.sections[r.sectionIndex];
  if(forward){
    if(r.index+size<sec.pieces.length)r.index+=size;
    else if(r.sectionIndex<r.data.sections.length-1){r.sectionIndex++;r.index=0;} else return;
  }else{
    if(r.index>0)r.index=Math.max(0,r.index-size);
    else if(r.sectionIndex>0){r.sectionIndex--;const len=r.data.sections[r.sectionIndex].pieces.length;r.index=Math.floor((len-1)/size)*size;}else return;
  }
  saveCursor();drawReader(true);
}


function persistAudio() {
  if(!player?.node||!player.track)return;
  const {node,recording,track,id,cid}=player;
  const e=touch(id,cid), previous=e.audio[recording.id];
  const seconds=Number.isFinite(node.currentTime)&&node.readyState>=1?node.currentTime:(previous?.index===Number(track.index)?previous.seconds:0);
  e.audio[recording.id]={recording:recording.id,index:Number(track.index),seconds:seconds||0,at:today()};
  saveState();
}
function closePlayer() {
  if(!player)return;
  persistAudio();
  if(player.node){player.node.pause();player.node.removeAttribute('src');player.node.load();}
  player=null;
}
function openPlayer(id,cid,rid,shouldPlay) {
  const b=getBook(id),all=recordings(id);
  if(!b||!all.length)return notFound();
  cid=chosenRow(id,cid)?.course||'';
  const previous=Object.values(getEntry(id)?.audio||{}).sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0];
  const rec=byId(all,rid||previous?.recording)||all[0];
  const tracks=corpus.tracks.filter(t=>t.recording===rec.id).sort((a,b)=>Number(a.index)-Number(b.index));
  if(!tracks.length)return notFound();
  const saved=getEntry(id)?.audio?.[rec.id];
  const index=Math.max(0,Math.min(tracks.length-1,saved?.index??Number(rec.start)));
  // A recording can include a preamble before the first assigned passage.
  // The cue is used only on the first open. A saved zero is a real position.
  const cue=cid==='g100' ? Number(rec.cue_seconds || 0) : 0;
  const options=all.map(r=>[r.id,r.reader+' · '+r.length]);
  document.title='Listen · '+b.short+' · Blackball';
  content.innerHTML=crumbs('Audiobook')+`<div class="reader player"><div class="subhead"><p class="overline">Audiobook · LibriVox</p><h1>${esc(b.short)}</h1><p class="author">${esc(b.author)}</p></div>
  <div class="box"><p class="kicker">Now selected</p><h2 id="track-title"></h2><p class="small">Read by ${esc(rec.reader)} · ${esc(rec.language)} · ${esc(rec.length)} for the recording</p>
  <audio id="audio" controls preload="none" aria-label="Audiobook player"></audio><p class="small" id="audio-status" role="status"></p>
  <div class="player-grid"><div><label class="field-label" for="recording">Recording</label>${select('recording','Choose a recording',options,rec.id)}</div><div><label class="field-label" for="track">Track</label>${select('track','Choose a track',tracks.map(t=>[t.index,t.label]),String(index))}</div></div>
  <div class="actions"><button id="audio-prev" class="btn smallbtn soft" data-action="audio-prev">Previous track</button><button id="audio-next" class="btn smallbtn soft" data-action="audio-next">Next track</button>${cue?'<button class="btn smallbtn soft" data-action="audio-zero">Play from track start</button>':''}</div>
  <p class="small readerActions">${external('LibriVox recording page',rec.url,'textlink')} · <a class="quietlink" id="mp3" target="_blank" rel="noopener noreferrer">Open MP3</a></p>${recordingMirrors(rec.id)}</div>
  ${id==='manifesto'?'<p class="small readerActions">Grinnell assigned parts I–III. The last track in either LibriVox recording continues into part IV.</p>':''}
  <div class="actions">${primaryAction(b,cid,'btn soft',true)}${link('Copies, lectures & syllabus',routeFor('book',id,cid),'quietlink')}</div>
  <details class="fold readerlow"><summary>Notes & check-in</summary>${notebook(id,cid,'Audiobook')}</details></div>`;
  const node=document.getElementById('audio');
  player={id,cid,node,recording:rec,tracks,track:null,lastWrite:0};
  node.addEventListener('timeupdate',()=>{if(player?.node===node&&Date.now()-player.lastWrite>5000){persistAudio();player.lastWrite=Date.now();}});
  node.addEventListener('pause',()=>{if(player?.node===node)persistAudio();});
  node.addEventListener('error',()=>{const out=document.querySelector('#audio-status');if(player?.node===node&&out)out.textContent='The stream could not open here. Try Open MP3 or the LibriVox recording page.';});
  node.addEventListener('playing',()=>{const out=document.querySelector('#audio-status');if(player?.node===node&&out)out.textContent='';});
  node.addEventListener('ended',()=>{if(player?.node===node){const i=Number(player.track.index);if(i<tracks.length-1)loadTrack(i+1,true);else{persistAudio();notice('End of recording. You can mark the reading finished in your log.');}}});
  loadTrack(index,shouldPlay,saved?.seconds??cue);
}
function loadTrack(index,autoplay=false,seconds=0) {
  if(!player)return;
  const {tracks,node}=player;
  const track=tracks[index];if(!track)return;
  if(player.track){persistAudio();node.pause();}
  player.track=track;player.lastWrite=Date.now();
  document.querySelector('#audio-status').textContent='';
  document.querySelector('#track-title').textContent=track.label;
  document.querySelector('#track').value=String(index);
  document.querySelector('#audio-prev').disabled=index===0;
  document.querySelector('#audio-next').disabled=index===tracks.length-1;
  document.querySelector('#mp3').href=track.url;
  node.src=track.url;node.preload=seconds>0?'metadata':'none';
  node.onloadedmetadata=()=>{if(seconds>0&&player?.track===track&&node.currentTime<1)node.currentTime=Math.max(0,Math.min(seconds,Number.isFinite(node.duration)?node.duration:seconds));};
  const e=touch(player.id,player.cid);e.audio[player.recording.id]={recording:player.recording.id,index,seconds,at:today()};saveState();
  if(autoplay)node.play().catch(()=>{const el=document.querySelector('#audio-status');if(player?.track===track&&el&&!node.error)el.textContent='Press play to start this track.';});
}
function keepPlaceForExit() {if(player)persistAudio();}
window.addEventListener('pagehide',keepPlaceForExit);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')keepPlaceForExit();});

function renderRoute(autoplay=false) {
  if(!corpus.works)return;
  closePlayer();
  reader=null;
  const token=++routeToken;
  const [page='shelf',id='',cid='',rid='']=location.hash.replace(/^#/,'').split('/').filter(Boolean);
  const navPage=['open','plans','study'].includes(page)?'open':page==='compare'?'compare':page==='log'?'log':'shelf';
  document.querySelectorAll('[data-nav]').forEach(el=>{if(el.dataset.nav===navPage)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  if(['shelf','compare','log','path'].includes(previousView))breadcrumb=previousView;
  previousView=page;
  document.title='Blackball · Reading room';
  if(page==='shelf')shelf();
  else if(page==='compare')compare(id,cid);
  else if(['open','plans','study'].includes(page))studyUI.show(page,id,token);
  else if(page==='log')logView();
  else if(page==='sources')sources();
  else if(page==='path')collegePath(id);
  else if(page==='book'){detail(id,cid);if(getBook(id))document.title=getBook(id).short+' · Blackball';}
  else if(page==='read'||page==='short')openReader(id,cid,page==='short',token);
  else if(page==='listen')openPlayer(id,cid,rid,autoplay);
  else notFound();
  window.scrollTo(0,0);
  if(token>1)content.focus({preventScroll:true});
}
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='search'){shelfFilter.query=el.value;refreshShelf();}
  else if(el.id==='compare-query'){compareState.query=el.value;lookupComparison();}
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='shelf-course'){shelfFilter.course=el.value;refreshShelf();}
  else if(el.id==='cmp-left'||el.id==='cmp-right'){
    compareState[el.id.slice(4)]=el.value;
    compareState.group='both';
    history.replaceState(null,'','#compare/'+compareState.left+'/'+compareState.right);
    compare();
    document.getElementById(el.id)?.focus();
  }
  else if(el.id==='chapter'&&reader){const i=reader.data.sections.findIndex(s=>s.id===el.value);if(i>=0){reader.sectionIndex=i;reader.index=0;saveCursor();drawReader(true);}}
  else if(el.id==='recording'&&player){const route=routeFor('listen',player.id,player.cid)+'/'+el.value;history.replaceState(null,'','#'+route);renderRoute(true);}
  else if(el.id==='track'&&player)loadTrack(Number(el.value),true);
});
document.addEventListener('click',event=>{
  const anchor=event.target.closest('a');
  if(anchor?.dataset.externalWork){touch(anchor.dataset.externalWork,anchor.dataset.course);saveState();}
  if(anchor?.getAttribute('href')?.startsWith('#listen/')&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
    event.preventDefault();history.pushState(null,'',anchor.getAttribute('href'));renderRoute(true);return;
  }
  if(anchor?.classList.contains('skip')){event.preventDefault();content.focus();return;}
  const t=event.target.closest('[data-action]');if(!t)return;
  const action=t.dataset.action;
  if(action==='all-books'){shelfFilter.all=true;refreshShelf();}
  else if(action==='diff'){compareState.group=t.dataset.key;drawComparison();document.querySelector('[data-action="diff"][data-key="'+t.dataset.key+'"]')?.focus({preventScroll:true});}
  else if(action==='save-book'){touch(t.dataset.book,t.dataset.course);saveState();location.hash='log';}
  else if(['save-note','save-date','finish'].includes(action))updateNotebook(action,t);
  else if(action==='next-page'||action==='prev-page')turnPage(action==='next-page');
  else if(action==='read-mode'&&reader){
    const hash=routeFor(t.dataset.mode,reader.id,reader.cid);history.replaceState(null,'','#'+hash);
    reader.short=t.dataset.mode==='short';saveCursor();drawReader();
    document.querySelector('[data-action="read-mode"][data-mode="'+t.dataset.mode+'"]')?.focus({preventScroll:true});
  }else if(action==='retry')renderRoute();
  else if(action==='audio-zero'&&player)loadTrack(Number(player.track.index),true,0);
  else if((action==='audio-next'||action==='audio-prev')&&player){loadTrack(Number(player.track.index)+(action==='audio-next'?1:-1),true);}
});
window.addEventListener('hashchange',()=>renderRoute());
window.addEventListener('storage',event=>{if(event.key===storageKey)state=readState();});
Promise.all(['courses','course-context','slots','works','assignments','supplements','reading-starts','copies','recordings','recording-mirrors','tracks'].map(fetchTable)).then(pairs=>{
  Object.assign(corpus,Object.fromEntries(pairs));return studyUI.session().then(()=>renderRoute());
}).catch(()=>{content.innerHTML=`<section class="loading"><h1>The shelf could not load</h1><p>${external('Read Douglass at chapter I','https://pressbooks.library.torontomu.ca/narrativeofthelifeoffrederickdouglass/chapter/1/','textlink')}</p><button class="btn" onclick="location.reload()">Reload the shelf</button></section>`;});
