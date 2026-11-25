'use strict';

// The catalogue is public. A private study journal is opened only by its reader key.
// Static copies of the Reading Room can browse the same tables without a server.
const studyUI = (() => {
  let tables, loading, profile = null, available = false, model = false, recovery = '';
  const conversations = new Map();
  const searchText = value => String(value || '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const filters = { q:'', provider:'', subject:'', count:24 };
  const rowLink = id => link(tables.items.get(id)?.title || id, 'study/' + id, 'textlink');
  function localTime(value) { return new Date(value).toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' }); }
  async function request(path, data, key) {
    const init = data ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) } : {};
    if (key) init.headers['Idempotency-Key'] = key;
    const response = await fetch('/study/' + path, init);
    if (!response.headers.get('content-type')?.includes('application/json')) throw Error('Reader profiles require the study service.');
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'The request failed.');
    return result;
  }
  async function session() {
    try {
      const data = await request('session'); profile = data.profile; model = data.model; available = true;
    } catch { profile = null; available = false; }
    setReaderScope(profile?.id || '');
  }
  async function load() {
    if (!loading) loading = Promise.all(['open-courses','open-courses-nptel','open-providers','study-guides','open-access'].map(fetchTable))
      .then(entries => {
        const all = Object.fromEntries(entries), providers = new Map(all['open-providers'].map(p => [p.id, p]));
        const courses = [...all['open-courses'], ...all['open-courses-nptel']].map(c => ({ ...c, providerName:providers.get(c.provider).name, kind:'Course' }));
        const books = corpus.works.map(w => ({ id:'book-' + w.id, title:w.title, providerName:w.author, kind:'Book', work:w.id }));
        tables = { courses, providers, guides:all['study-guides'], access:all['open-access'], items:new Map([...courses,...books].map(i => [i.id,i])) };
      }).catch(e => { loading = undefined; throw e; });
    await loading;
  }
  function formField(label, control) { return '<label class="study-field"><span>' + esc(label) + '</span>' + control + '</label>'; }
  function options(values, chosen) { return values.map(([id,title]) => '<option value="' + esc(id) + '"' + (id === chosen ? ' selected':'') + '>' + esc(title) + '</option>').join(''); }
  function btn(label) { return '<button type="submit" class="btn smallbtn">' + esc(label) + '</button>'; }
  function form(kind, html, id='') { return '<form class="study-form" data-study-form="' + kind + '" data-item="' + esc(id) + '">' + html + '<span class="study-error" role="status"></span></form>'; }
  function navPlans() { return link(profile ? profile.name + ' · Study plan' : 'My study plan', 'plans', 'aside-link'); }
  function catalogue() {
    document.title = 'Open courses · Blackball';
    const providers = [...tables.providers.values()];
    const used = new Set(tables.courses.map(c => c.provider));
    const subjects = [...new Set(tables.courses.map(c => c.subject).filter(Boolean))].sort();
    content.innerHTML = '<div class="pagehead"><div><p class="kicker">Reading room</p><h1>Try an open course</h1></div>' + navPlans() + '</div>' +
      '<section class="study-first"><div><p class="overline">The Open University</p><h2>Read Homer for an evening</h2>' +
      '<p>Begin with the quarrel in the first book of the <i>Iliad</i>. See how an Open University tutor approaches it, then decide whether to come back.</p>' +
      link('Open the Iliad study guide','study/book-iliad','btn primary') + '</div><div class="study-choices"><h3>Try another starting point</h3>' +
      ['yale-ital-310','book-apology','hx-cs50'].map(rowLink).join('') + '</div></section>' +
      '<section class="listing"><h2>What would you like to read about?</h2>' +
      form('ask',formField('Topic or question','<input name="question" maxlength="600" placeholder="I want to read about exile. Where should I start?" required>')+btn('Find a starting point'),'discover') +
      '<div id="study-answer" aria-live="polite"></div></section>' +
      '<section class="listing"><h2>Find a course</h2><div class="study-filters">' +
      formField('Title, instructor or topic','<input type="search" id="study-search" value="' + esc(filters.q) + '" placeholder="e.g. Homer">') +
      formField('Provider','<select id="study-provider">' + options([['','All indexed providers'],...providers.filter(p=>used.has(p.id)).map(p=>[p.id,p.name])],filters.provider) + '</select>') +
      formField('Subject','<select id="study-subject">' + options([['','All subjects'],...subjects.map(x=>[x,x])],filters.subject) + '</select>') +
      '</div><p id="study-count" role="status" class="small"></p><div id="study-hits"></div></section>' +
      '<details class="fold"><summary>Browse other course catalogues</summary><div class="study-directories">' +
      providers.map(p=>'<p>' + external(p.name,p.url,'textlink')+'<br><span class="small">'+esc(p.coverage)+'</span></p>').join('') +
      '</div><p>' + link('Save a course from another catalogue','plans','textlink') + '</p></details>' +
      '<details class="fold"><summary>What changed in free access?</summary>' +
      tables.access.map(f=>'<p><strong>' + esc(f.scope) + '</strong> · ' + esc(f.when) + '<br>' + esc(f.observation) + ' ' + external('Source',f.source,'quietlink') + '</p>').join('')+
      '<p class="small">The dated records document access to particular materials. A twenty-year teaching-quality comparison would require comparable courses, old and new teaching materials, and a stated criterion.</p></details>';
    results();
  }
  function results() {
    const terms = searchText(filters.q).split(' ').filter(Boolean);
    const matches = tables.courses.filter(c => (!filters.provider || c.provider === filters.provider) && (!filters.subject || c.subject === filters.subject) &&
      terms.every(t => searchText([c.title,c.providerName,c.school,c.instructor,c.subject,c.code].join(' ')).includes(t)))
      .sort((a,b)=>a.title.localeCompare(b.title));
    document.querySelector('#study-count').textContent = matches.length.toLocaleString() + (matches.length===1?' course':' courses') + ' · ' + Math.min(filters.count,matches.length) + ' shown';
    document.querySelector('#study-hits').innerHTML = matches.slice(0,filters.count).map(c=>'<article class="study-hit"><div><p class="overline">'+esc(c.providerName)+'</p><h3>'+link(c.title,'study/'+c.id)+'</h3></div><p class="small">'+esc([c.subject,c.level,c.duration,c.term].filter(Boolean).join(' · '))+'</p></article>').join('') +
      (matches.length>filters.count?'<button class="btn soft" data-study-action="more">Show more courses</button>':'') +
      (filters.q.trim()?'<p>'+external('Search Class Central for “'+filters.q+'”','https://www.classcentral.com/search?q='+encodeURIComponent(filters.q),'textlink')+'</p>':'');
  }
  function profileForm() {
    if (!available) return '<p class="box">To save a private plan, run the Reading Room study service. '+external('Run instructions','https://github.com/bl4ckb4ll/syllabus/tree/main/reading-room','textlink')+'</p>';
    return '<div class="grid-detail"><section class="box"><h3>Start a private study plan</h3>' +
      form('new',formField('Name or nickname','<input name="name" autocomplete="off" maxlength="60" required>') + btn('Create my profile')) +
      '</section><details class="fold"><summary>Open an existing profile</summary>' +
      form('open',formField('Private reader key','<input name="key" type="password" autocomplete="off" required>') + btn('Open profile')) + '</details></div>';
  }
  function recoveryBox() {
    return recovery ? '<section class="box study-recovery"><h3>Keep your private reader key</h3><p>This key opens your journal on another device connected to this service.</p>' +
      '<code>'+esc(recovery)+'</code><button type="button" class="btn smallbtn" data-study-action="hide-key">I saved my key</button></section>' : '';
  }
  function plans() {
    document.title='My study plan · Blackball';
    content.innerHTML='<div class="pagehead"><div><p class="kicker">Reading room</p><h1>My study plan</h1></div>'+link('Find a course','open','aside-link')+'</div>';
    if (!profile) { content.insertAdjacentHTML('beforeend',profileForm()); return; }
    const p=profile;
    content.insertAdjacentHTML('beforeend', recoveryBox()+'<div class="study-account"><strong>'+esc(p.name)+'</strong><button class="linkbutton" data-study-action="close">Close profile</button></div>' +
      (p.plans.length ? p.plans.map(plan=>'<article class="study-hit"><div><h3>'+link(plan.title,'study/'+plan.id)+'</h3><p>'+esc(plan.target)+'</p></div><p class="small">'+esc(planStatus(plan))+'</p></article>').join('') : '<p>Choose one reading or lecture and name the part you want to try. '+link('Browse open courses','open','textlink')+'</p>') +
      (p.links.length?'<section><h2>Your saved links</h2>'+p.links.map(l=>'<p>'+link(l.title,'study/'+l.id,'textlink')+'</p>').join('')+'</section>':'') +
      '<details class="fold"><summary>Save another course or book link</summary>'+form('add',formField('Title','<input name="title" maxlength="180" required>')+
        formField('Public link','<input name="url" type="url" placeholder="https://" required>')+btn('Save link'))+'</details>');
  }
  const reportLabels={unreported:'No check-in yet',unread:'Haven’t started',part:'Did part of it',done:'Finished this task'};
  function planStatus(p) { return [reportLabels[p.report],p.status, p.reminder?(Date.parse(p.reminder.at)<=Date.now()?'Check-in due ':'Check-in ')+localTime(p.reminder.at):''].filter(Boolean).join(' · '); }
  function journal(item, guide) {
    if (!profile) return profileForm();
    const p=profile.plans.find(p=>p.id===item.id);
    if (!p) return '<h2>Try it yourself</h2>'+form('plan',formField('Which passage, lecture or activity will you try?','<input name="target" maxlength="500" required value="'+esc(guide?.try||'')+'">')+btn('Save my plan'),item.id);
    const history=p.history.slice().reverse();
    return '<section class="box study-journal"><p class="overline">'+esc(profile.name)+'</p><h2>'+esc(p.target)+'</h2><p>'+esc(planStatus(p))+'</p>' +
      form('check',formField('How much of that task did you do?','<select name="report" required><option value="">Choose an answer</option><option value="unread">Haven’t started</option><option value="part">Did part of it</option><option value="done">Finished this task</option></select>')+
        formField('What did you notice, or want to discuss? (optional)','<textarea name="note" maxlength="1200"></textarea>')+btn('Save check-in'),item.id) +
      form('decision',formField('What do you want to do next?','<select name="verb"><option value="CONTINUE">Continue</option><option value="PAUSE">Pause</option><option value="STOP">Stop here</option></select>')+
        formField('Next passage or reason (optional)','<input name="value" maxlength="500">')+btn('Save decision'),item.id) +
      (p.status==='active'?form('remind',formField('Remind me once (your local time)','<input name="time" type="datetime-local" required>')+btn('Save reminder'),item.id):'')+
      (p.reminder?form('clear',btn('Cancel reminder'),item.id):'')+
      '<details class="fold"><summary>My earlier check-ins and decisions</summary>'+history.map(e=>'<p class="small">'+esc(localTime(e.at))+' · '+esc(({PLAN:'Planned',CHECK:'Checked in',CONTINUE:'Continued',STOP:'Stopped',PAUSE:'Paused'})[e.verb])+'<br>'+esc([e.target, e.verb==='CHECK'?reportLabels[e.value]:'',e.note].filter(Boolean).join(' · '))+'</p>').join('')+'</details></section>';
  }
  function itemView(id, edition) {
    const record=tables.items.get(id) || profile?.links.find(i=>i.id===id);
    if (!record) return notFound();
    const sources=tables.guides.filter(g=>g.item===id), provider=tables.providers.get(record.provider);
    document.title=record.title+' · Study · Blackball';
    content.innerHTML='<div class="crumbs">'+link('Open courses','open')+'<i>/</i>'+link('My study plan','plans')+'</div>'+recoveryBox()+
      '<div class="subhead"><p class="kicker">'+esc(record.providerName||'Your saved link')+'</p><h1>'+esc(record.title)+'</h1><p class="small">'+esc([record.school,record.subject,record.level,record.duration,record.instructor,record.term].filter(Boolean).join(' · '))+'</p>'+
      '<div class="actions">'+(record.work?primaryAction(getBook(record.work),chosenRow(record.work,'')?.course||''):external(record.kind==='saved link'?'Open saved link':'Open course',record.url,'btn primary'))+
      (record.materials_url?external('Course materials',record.materials_url,'quietlink'):'')+(record.work?link('Editions & assignments','book/'+record.work,'quietlink'):'')+'</div>'+(provider?'<p class="small">'+esc(provider.access)+' '+external('Catalogue entry',record.listed_at,'quietlink')+'</p>':'')+'</div>'+
      '<div class="grid-detail"><section class="stack">'+(sources.length?'<h2>Before you begin</h2>'+sources.map(g=>'<article><h3>'+esc(g.label)+'</h3><p>'+esc(g.context)+'</p><p class="small">'+esc(g.try)+'</p><div class="rowacts">'+external('Read the source',g.url,'textlink')+(g.related?rowLink(g.related):'')+'</div></article>').join(''):'')+
      (tables.items.has(id)?'<h2>Ask about this '+(record.work?'reading':'course')+'</h2>'+form('ask',(edition?formField('Passage for your question','<select name="section">'+options(edition.sections.map(s=>[s.id,s.title]),getEntry(record.work)?.cursor?.section||edition.start)+'</select>'):'')+formField('Your question','<input name="question" placeholder="Where should I start?" maxlength="600" required>')+btn('Ask'),id)+
       '<p class="small">'+(model?'Questions and public sources go to the configured model.':'Answers draw on the source notes for this item.')+'</p><div id="study-answer" aria-live="polite"></div>':'')+
      '</section><section class="stack">'+journal(record,sources[0])+'</section></div>';
  }
  function askLocal(id, question, sectionId) {
    if(id==='discover'){
      const words=searchText(question).split(' ').filter(w=>w.length>2 && !['what','why','how','want','read','about','where','should','start','would','like','could','the','some','with','book','course'].includes(w));
      const ranked=tables.guides.map(g=>({g,score:words.filter(w=>searchText(g.label+' '+g.context+' '+g.item).includes(w)).length})).filter(x=>x.score).sort((a,b)=>b.score-a.score);
      const sources=ranked.slice(0,4).map(({g})=>({item:g.item,title:g.label,text:g.context,url:g.url}));
      return {mode:'Source notes',answer:sources[0]?.text||'Try a title, author or subject in the course search.',sources};
    }
    const s=tables.guides.filter(g=>g.item===id).map(g=>({title:g.label,text:g.context,url:g.url}));
    const item=tables.items.get(id);
    if(item?.work && sectionId){
      const section=loadedTexts.get(getBook(item.work)?.text)?.sections.find(section=>section.id===sectionId);
      const copy=copies(item.work).find(c=>c.kind==='web');
      if(section && copy)s.unshift({title:getBook(item.work).short+' · '+section.title,text:section.paragraphs[0].slice(0,380),url:copy.url});
    }
    if(!s.length&&item?.work)for(const a of bookRows(item.work))s.push({title:'Assigned reading',text:a.scope,url:a.source});
    if(!s.length&&item?.url)s.push({title:item.title,text:tables.providers.get(item.provider)?.access||item.title,url:item.url});
    return {mode:'Source notes',answer:s[0]?.text||'No reviewed context yet.',sources:s};
  }
  async function show(page,id,token) {
    try {await load(); if(token!==routeToken)return; if(page==='open')catalogue();else if(page==='plans')plans();else {
      const item=tables.items.get(id), edition=item?.work&&getBook(item.work)?.text ? await getText(getBook(item.work).text) : null;
      if(token===routeToken)itemView(id,edition);
    }}
    catch {if(token===routeToken)content.innerHTML='<h1>Open courses could not load</h1><p>Reload to try again.</p>';}
  }
  async function submit(event) {
    const el=event.target.closest('[data-study-form]');if(!el)return;
    event.preventDefault();
    const button=el.querySelector('button[type=submit]'),data=Object.fromEntries(new FormData(el)),id=el.dataset.item,kind=el.dataset.studyForm;
    button.disabled=true;
    try {
      if(kind==='ask'){
        const threadKey=id+'|'+(data.section||'');
        const previous=conversations.get(threadKey)||[];
        const answer=available?await request('ask',{item:id,question:data.question,section:data.section||'',previous}):askLocal(id,data.question,data.section);
        conversations.set(threadKey,[...previous,data.question].slice(-2));
        if(!el.isConnected)return;
        document.querySelector('#study-answer').innerHTML='<p class="overline">'+esc(answer.mode)+'</p><p class="study-answer">'+esc(answer.answer)+'</p><ol>'+answer.sources.map(s=>'<li>'+external(s.title,s.url,'textlink')+(s.item?' · '+link('Open study guide','study/'+s.item,'quietlink'):'')+'</li>').join('')+'</ol>';
        return;
      }
      if(kind==='new'||kind==='open'){
        const result=await request(kind,data);profile=result.profile;recovery=result.key||'';setReaderScope(profile.id);announceSwitch();renderRoute();return;
      }
      const changes = {
        plan:()=>({verb:'PLAN',arg:data.target}),check:()=>({verb:'CHECK',arg:data.report,note:data.note}),
        decision:()=>({verb:data.verb,...(data.verb==='CONTINUE'?{arg:data.value}:{note:data.value})}),
        remind:()=>({verb:'REMIND',arg:new Date(data.time).toISOString()}),clear:()=>({verb:'CLEAR'}),
        add:()=>({verb:'ADD',arg:data.url,note:data.title})
      };
      const payload={...changes[kind](),item:id,profileId:profile.id};
      // Preserve the same message ID when a reply is lost and the form is retried.
      const body=JSON.stringify(payload);
      if(el.dataset.payload!==body){el.dataset.payload=body;el.dataset.request=crypto.randomUUID();}
      const result=await request('change',payload,el.dataset.request);
      profile=result.profile;renderRoute();notice('Saved to your study plan.');
    }catch(e){el.querySelector('.study-error').textContent=e.message;}
    finally{button.disabled=false;}
  }
  function announceSwitch(){conversations.clear();try{localStorage.setItem('blackball.study.switch',String(Date.now()));}catch{}}
  document.addEventListener('submit',submit);
  document.addEventListener('input',e=>{if(e.target.id==='study-search'){filters.q=e.target.value;filters.count=24;results();}});
  document.addEventListener('change',e=>{
    if(['study-provider','study-subject'].includes(e.target.id)){filters[e.target.id.slice(6)]=e.target.value;filters.count=24;results();}
  });
  document.addEventListener('click',async e=>{
    const action=e.target.closest('[data-study-action]')?.dataset.studyAction;
    if(action==='more'){filters.count+=36;results();}
    if(action==='hide-key'){recovery='';renderRoute();}
    if(action==='close'){try{await request('close',{});profile=null;recovery='';setReaderScope('');announceSwitch();renderRoute();}catch(e){notice(e.message);}}
  });
  window.addEventListener('storage',async e=>{if(e.key==='blackball.study.switch'){recovery='';conversations.clear();await session();if(location.hash==='#plans')renderRoute();else location.hash='plans';}});
  return { session, show };
})();
