import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { askGuide, courses, items, providers, guides, table, sourcePacket } from '../study/catalog.mjs';
import { change, createProfile, due, profileID, reader, snapshot } from '../study/profiles.mjs';
import { importRoster } from './import-nptel.mjs';

const service = fileURLToPath(new URL('../study/serve.mjs', import.meta.url));
function temporary(t) { const path=mkdtempSync(join(tmpdir(),'blackball-study-')); t.after(()=>rmSync(path,{recursive:true,force:true})); return path; }
const item='book-inferno';
test('catalogue rows link to real provider identities and the published roster reconciles',()=>{
  const ids=new Set(), urls=new Set();
  for(const c of courses){
    assert.ok(c.title && providers.has(c.provider),c.id);
    assert.match(c.id,/^[a-z0-9-]+$/);assert.ok(!ids.has(c.id),c.id);ids.add(c.id);
    for(const url of [c.url,c.listed_at,...(c.materials_url?[c.materials_url]:[])]) assert.equal(new URL(url).protocol,'https:',c.id);
    assert.ok(!urls.has(c.url),c.url);urls.add(c.url);
  }
  for(const p of providers.values())assert.ok(p.access && new URL(p.url).protocol==='https:',p.id);
  const ou=courses.filter(c=>c.provider==='openlearn');
  assert.equal(new Set(ou.map(c=>c.subject)).size,9);assert.ok(ou.length>=900);
  const pages=table('openlearn-pages'); assert.equal(new Set(pages.map(p=>p.listing)).size,pages.length);
  assert.equal(pages.reduce((sum,p)=>sum+Number(p.maintenance_rows),0),1);
  for(const row of guides){assert.ok(items.has(row.item));assert.ok(!row.related || items.has(row.related));assert.ok(row.context && row.try && new URL(row.url).protocol==='https:');}
  assert.ok(courses.some(c=>c.id==='yale-ital-310'));assert.equal(guides.some(g=>g.item==='book-inferno' && g.related==='yale-ital-310'),true);
  const nptel=courses.filter(c=>c.provider==='nptel');
  assert.equal(nptel.filter(c=>c.term==='July–December 2026').length,1054);
  const tab=['Course ID','Discipline','Course Name','SME Name','Institute','Duration','UG/PG','Click here to Join the course','NPTEL URL'].join('\t');
  const proof=nptel.map(c=>[c.code,c.subject,c.title,c.instructor,c.school,c.duration,c.level,c.url,c.materials_url].join('\t')).join('\n');
  const file=readFileSync(new URL('../web/data/open-courses-nptel.tsv',import.meta.url),'utf8');
  assert.equal(importRoster(tab+'\n'+proof,{term:nptel[0].term,listing:nptel[0].listed_at}),file);
  assert.throws(()=>importRoster(tab+'\n'+proof+'\n'+proof.split('\n')[0],{term:'x',listing:'x'}),/duplicate/);
});
test('independent journals survive retries, restarts, changed targets and a decision to stop',t=>{
  const root=temporary(t),a=createProfile(root,'Ada'),b=createProfile(root,'Ada');
  assert.notEqual(a.id,b.id);assert.equal(profileID(a.key),a.id);
  const at=new Date('2030-01-01T18:00:00Z'), when='2030-01-02T13:00:00-05:00', later=new Date('2030-01-03T18:00:00Z');
  const write=(data,key=randomUUID())=>change(root,a.id,{item,...data},key,at);
  write({verb:'PLAN',arg:'Canto I'},'incoming-1');write({verb:'PLAN',arg:'Canto I'},'incoming-1');
  assert.equal(reader(root,a.id).events.length,1);
  assert.throws(()=>write({verb:'PLAN',arg:'Canto II'},'incoming-1'),/already belongs/);
  assert.throws(()=>write({verb:'REMIND',arg:'2030-01-01'}),/future time/);
  write({verb:'REMIND',arg:when},'reminder-1');
  assert.equal(due(root,at).length,0); assert.equal(due(root,later)[0].reminder,'reminder-1');
  write({verb:'CHECK',arg:'part',note:'Lines 1–9\nI would ask about exile.'});
  assert.equal(due(root,later).length,0);assert.equal(reader(root,a.id).plans.get(item).status,'active');
  write({verb:'CONTINUE',arg:'Canto II'});assert.equal(reader(root,a.id).plans.get(item).report,'unreported');
  write({verb:'REMIND',arg:when},'reminder-2');write({verb:'PAUSE',note:'I want to discuss canto I first.'});
  assert.equal(due(root,later).length,0);assert.throws(()=>write({verb:'REMIND',arg:when}),/Continue/);
  write({verb:'CONTINUE'});write({verb:'CHECK',arg:'unread'});write({verb:'STOP'});
  const p=snapshot(reader(root,a.id)).plans[0];assert.equal(p.report,'unread');assert.equal(p.status,'stopped');
  assert.ok(p.history.find(e=>e.note.includes('ask about exile')&&e.target==='Canto I'));
  assert.equal(snapshot(reader(root,b.id)).plans.length,0);
  assert.equal(statSync(join(root,a.id)).mode & 0o777,0o700);
  assert.equal(statSync(join(root,a.id,'000000000001.tsv')).mode & 0o777,0o600);
});
test('text and browser requests share a journal; a transport retry keeps the same reminder',async t=>{
  const root=temporary(t),env={...process.env,STUDY_HOME:root};
  const proc=spawn(process.execPath,[service,'serve','0'],{env,stdio:['ignore','pipe','pipe']});
  t.after(async()=>{if(proc.exitCode===null){const closing=once(proc,'exit');proc.kill();await closing;}});
  const [line]=await once(proc.stdout,'data');
  const url=line.toString().match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  const post=(path,body,headers={})=>fetch(url+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
  const n=await post('/study/new',{name:'Reader'}); assert.equal(n.status,201);
  const cookie=n.headers.get('set-cookie').split(';')[0],{key,profile}=await n.json();
  const text=(message,token=key,request=randomUUID())=>fetch(url+'/jog/'+profile.id,{method:'POST',headers:{authorization:'Bearer '+token,'idempotency-key':request},body:message});
  const index=await fetch(url+'/');assert.match(await index.text(),/Open courses/);
  assert.equal((await post('/study/change',{profileId:profile.id,verb:'PLAN',item,arg:'Canto I'},{cookie})).status,200);
  assert.equal((await post('/study/change',{profileId:'wrong',verb:'STOP',item},{cookie})).status,409);
  assert.equal((await text('STATUS','f'.repeat(48))).status,401);
  assert.match(await (await text('FIND Dante')).text(),/Dante/i);
  assert.equal((await text('CHECK book-inferno part A question about the guide',''+key,'carrier-01')).status,200);
  assert.equal((await text('CHECK book-inferno part A question about the guide',''+key,'carrier-01')).status,200);
  assert.equal((await (await fetch(url+'/study/session',{headers:{cookie}})).json()).profile.plans[0].history.length,2);
  const saved=await (await text('ADD https://example.org/seminar A seminar')).text();const privateId=saved.match(/link-[a-f0-9]+/)[0];
  assert.equal((await text('PLAN '+privateId+' Read the first lecture')).status,200);
  const b=await (await post('/study/new',{name:'Second'})).json();
  assert.equal((await (await fetch(url+'/study/session',{headers:{cookie:'bb_study='+b.key}})).json()).profile.plans.length,0);
  assert.equal((await text('STATUS',b.key)).status,401);
  assert.equal((await fetch(url+'/.git/config')).status,404);
  assert.equal((await post('/study/close',{}, {cookie,origin:'http://elsewhere.example'})).status,403);
  const lastWeek=new Date(Date.now()-7*86400000),yesterday=new Date(Date.now()-86400000).toISOString();
  change(root,profile.id,{verb:'REMIND',item,arg:yesterday},'receipt-7',lastWeek);
  const receiver=join(root,'test-receiver');const sent=join(root,'sent');
  writeFileSync(receiver,'#!/usr/bin/env node\nconst fs=require("node:fs");fs.appendFileSync(process.env.TEST_SENT,process.argv[2]+" "+process.argv[3]+" "+fs.readFileSync(0,"utf8")+"\\n");\n');chmodSync(receiver,0o700);
  const fail=spawnSync(process.execPath,[service,'deliver',join(root,'unavailable')],{env,encoding:'utf8'});
  assert.notEqual(fail.status,0);assert.equal(due(root).length,1);
  for(let i=0;i<2;i++)assert.equal(spawnSync(process.execPath,[service,'deliver',receiver],{env:{...env,TEST_SENT:sent}}).status,0);
  assert.equal(readFileSync(sent,'utf8').trim().split('\n').length,1);assert.match(readFileSync(sent,'utf8'),/receipt-7.*Canto I/);assert.equal(due(root).length,0);
  const closed=await post('/study/close',{}, {cookie});assert.match(closed.headers.get('set-cookie'),/Max-Age=0/);
});
test('guide discovery and summaries use the selected text, cite sources and cannot change reading progress',async t=>{
  const d=await askGuide(undefined,'I want to read about exile.',{});assert.ok(d.sources.find(s=>s.item==='book-inferno'));
  const book=items.get(item),sources=sourcePacket(book,'canto-2');
  assert.match(sources[0].title,/Canto II/);assert.match(sources[0].url,/gutenberg/);
  const model=createServer(async(req,res)=>{let data='';for await(const b of req)data+=b;const packet=JSON.parse(JSON.parse(data).messages.at(-1).content);
    assert.equal(packet.sources[0][2],sources[0].text);assert.deepEqual(packet.previousQuestions,['Who speaks?']);
    res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({choices:[{message:{content:packet.question==='valid'?'A source-labeled reply [1].':'Imaginary evidence [99].'}}]}));});
  model.listen(0,'127.0.0.1');await once(model,'listening');t.after(()=>{model.closeAllConnections();model.close();});
  const config={STUDY_MODEL:'test',STUDY_MODEL_URL:'http://127.0.0.1:'+model.address().port};
  assert.equal((await askGuide(book,'valid',config,'canto-2',['Who speaks?'])).mode,'Model response');
  assert.match((await askGuide(book,'bad',config,'canto-2',['Who speaks?'])).mode,/Source notes/);
  assert.throws(()=>sourcePacket(book,'missing section'),/unavailable/);
});

test('independent processes commit simultaneous replies without overwriting any entry',async t=>{
  const root=temporary(t),p=createProfile(root,'Two devices');
  change(root,p.id,{verb:'PLAN',item,arg:'Canto I'});
  const moduleURL=new URL('../study/profiles.mjs',import.meta.url).href;
  const children=Array.from({length:5},(_,i)=>{
    const script='import {change} from '+JSON.stringify(moduleURL)+';change(process.argv[1],process.argv[2],{verb:"CHECK",item:"book-inferno",arg:"part",note:process.argv[3]},process.argv[3]);';
    const child=spawn(process.execPath,['--input-type=module','-e',script,root,p.id,'device-'+i],{stdio:'inherit'});
    return once(child,'exit').then(([status])=>assert.equal(status,0));
  });
  await Promise.all(children);
  const history=snapshot(reader(root,p.id)).plans[0].history;
  assert.deepEqual(history.filter(e=>e.verb==='CHECK').map(e=>e.note).sort(),['device-0','device-1','device-2','device-3','device-4']);
});
