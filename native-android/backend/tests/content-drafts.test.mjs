import {test,before,after,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdtemp,mkdir,rm,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {exportCatalog} from '../tools/export-catalog.mjs';
import {generateDrafts,applyDrafts,equivalent,sha256,renderDraftReport} from '../tools/content-drafts-lib.mjs';
import {sessionRPC,main as draftsMain} from '../tools/content-drafts.mjs';
import {auditCatalog,auditSnapshot,bundledDocuments,publishedDocuments,compareDocuments,acceptance} from '../tools/content-audit-lib.mjs';
import {verifySnapshotMedia,main as auditMain} from '../tools/audit-content.mjs';
import {catalogFixture,snapshotFixture,knownDiff} from './fixtures/content-drafts.mjs';

const bytes=Buffer.from('local cover fixture'),catalog=catalogFixture();
const exported=await exportCatalog(catalog,{readCover:async()=>bytes}),manifest=exported.manifest;
const fixture=()=>knownDiff(snapshotFixture(catalog,manifest));
const packetFixture=()=>generateDrafts(catalog,fixture(),manifest);

test('generation reviews missing words, missing links and both asleep phrase replacements without inventing stable IDs',()=>{
  const snapshot=fixture(),original=structuredClone(snapshot),packet=generateDrafts(catalog,snapshot,manifest);
  assert.equal(packet.drafts.length,2);assert.deepEqual(packet.blockers,[]);
  assert.equal(packet.comparison.summary.missingRevisionWords,3);
  assert.equal(packet.comparison.summary.extraRevisionWords,2);
  assert.equal(packet.comparison.summary.missingLinks,5);assert.equal(packet.comparison.summary.extraLinks,2);
  for(const plan of packet.drafts){
    const target=plan.save.args.p_document;
    assert.equal(plan.create.args.p_source_id,plan.sourceRevisionId);
    assert.equal(plan.save.args.p_expected_version,null);assert.equal(plan.save.args.p_revision_id,null);
    assert.ok(plan.asleepDecision);assert.ok(!target.words.some(w=>w.id==='asleep'));
    assert.ok(target.words.every(w=>catalog.words.some(b=>b.id===w.id)));
    assert.ok(target.sentences.every(s=>catalog.stories.find(b=>b.id===plan.storyId).sentences.some(b=>b.id===s.id)));
    assert.equal(target.descriptions.tr,target.description);
  }
  assert.deepEqual(snapshot,original);
  packet.inputs={snapshot:{sha256:'fixture'},bundle:{sha256:'fixture'},assetManifest:{sha256:'fixture'}};
  packet.packageSHA256='fixture';const report=renderDraftReport(packet);
  for(const text of ['asleep','falls asleep','eski','The quiet hare','Kelime işlemi','Bağlantı işlemi'])assert.ok(report.includes(text),text);
});

test('translation-only changes are parity differences, maps replace all languages, Turkish follows legacy',()=>{
  const c=catalogFixture(),s=snapshotFixture(c,manifest);
  for(const d of c.stories){d.descriptions={es:'Descripción'};for(const row of d.sentences)row.translations={es:'Texto'};}
  for(const w of c.words)w.translations={es:'Significado'};
  s.tables.revision_texts.push({revision_id:s.tables.story_revisions[0].id,lang:'de',description:'Alt'});
  const p=generateDrafts(c,s,manifest);assert.equal(p.drafts.length,2);
  assert.ok(p.drafts[0].changes.translationChanges.some(t=>t.lang==='de'&&t.expected===null));
  assert.deepEqual(p.drafts[0].save.args.p_document.descriptions,{es:'Descripción',tr:c.stories[0].description});
  c.words[0].translations.tr='wrong';assert.throws(()=>generateDrafts(c,s,manifest),/Turkish translation differs/);
});

test('missing edit versions refuse generation; story-set and media differences are explicit apply blockers',async()=>{
  const s=fixture();delete s.tables.story_revisions[0].edit_version;
  assert.throws(()=>generateDrafts(catalog,s,manifest),/edit_version/);
  const missing=catalogFixture();missing.stories.push({...missing.stories[0],id:'new-story'});
  const p=generateDrafts(missing,fixture(),manifest);assert.match(p.blockers.join(' '),/new-story/);
  await assert.rejects(applyDrafts(p,{apply:true,rpc:()=>assert.fail('No calls before blockers')}),/engelleri/);
  const media=fixture();media.tables.content_assets[0].sha256='0'.repeat(64);
  assert.ok(generateDrafts(catalog,media,manifest).blockers.some(b=>b.includes('Kapak')));
});

test('dry-run is the API and CLI default, needs no session, writes hashed review files, never calls RPC',async()=>{
  const result=await applyDrafts(packetFixture(),{rpc:()=>assert.fail('dry-run must be offline')});
  assert.equal(result.mode,'dry-run');
  const dir=await mkdtemp(path.join(tmpdir(),'draft-cli-'));
  try{
    for(const [name,data] of [['snapshot',fixture()],['bundle',catalog],['assets',manifest]])await writeFile(path.join(dir,`${name}.json`),JSON.stringify(data));
    const out=path.join(dir,'output'),args=[new URL('../tools/content-drafts.mjs',import.meta.url).pathname,
      '--snapshot',path.join(dir,'snapshot.json'),'--bundle',path.join(dir,'bundle.json'),
      '--asset-manifest',path.join(dir,'assets.json'),'--output',out,'--url','https://must-not-connect.invalid','--session-file','/missing'];
    const run=()=>spawnSync(process.execPath,args,{encoding:'utf8'});
    const first=run();assert.equal(first.status,0,first.stderr);
    const packet=JSON.parse(await readFile(path.join(out,'manifest.json')));
    assert.equal(packet.inputs.snapshot.sha256,sha256(await readFile(path.join(dir,'snapshot.json'))));
    assert.equal(packet.inputs.bundle.sha256,sha256(await readFile(path.join(dir,'bundle.json'))));
    assert.equal(packet.inputs.assetManifest.sha256,sha256(await readFile(path.join(dir,'assets.json'))));
    assert.match(await readFile(path.join(out,'review.md'),'utf8'),/SHA-256/);
    for(const plan of packet.drafts)assert.deepEqual(JSON.parse(await readFile(path.join(out,plan.file))),plan);
    assert.equal(run().status,0);
    await writeFile(path.join(dir,'bundle.json'),JSON.stringify({...catalog,testChange:true}));
    const changed=run();assert.equal(changed.status,1);assert.match(changed.stderr,/başka girdilere/);
    assert.equal(JSON.parse(await readFile(path.join(out,'manifest.json'))).packageSHA256,packet.packageSHA256);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('session transport limits RPCs, sends token only in headers, rejects redirects/projects and sanitizes failures',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'draft-session-')),file=path.join(dir,'session.json'),token='SECRET-fixture-access-token';
  try{
    await writeFile(file,JSON.stringify({access_token:token,publishable_key:'sb_publishable_fixture'}),{mode:0o600});
    let requests=0;
    const rpc=await sessionRPC({url:'http://127.0.0.1:4444',sessionFile:file,project:'fixture',fetchImpl:async(url,options)=>{
      requests++;assert.equal(url.pathname,'/rest/v1/rpc/content_role');assert.equal(options.headers.Authorization,`Bearer ${token}`);
      assert.equal(options.redirect,'error');assert.ok(!options.body.includes(token));return {ok:true,json:async()=>'editor'};
    }});
    assert.equal(await rpc('content_role',{}),'editor');await assert.rejects(rpc('admin_publish',{}),/izin listesinde/);assert.equal(requests,1);
    for(const fetchImpl of [async()=>{throw Error(token);},async()=>({ok:false,status:401,json:async()=>({message:token})}),async()=>({ok:true,json:async()=>{throw Error(token);}})]){
      const fail=await sessionRPC({url:'http://localhost:4444',sessionFile:file,project:'fixture',fetchImpl});
      await assert.rejects(fail('content_role',{}),error=>!error.message.includes(token));
    }
    await assert.rejects(sessionRPC({url:'https://wrong.supabase.co',sessionFile:file,project:'fixture'}),/eşleşmiyor/);
    await assert.rejects(sessionRPC({url:'https://fixture.supabase.co/path',sessionFile:file,project:'fixture'}),/proje kökü/);
    await chmod(file,0o644);await assert.rejects(sessionRPC({url:'http://localhost',sessionFile:file}),/chmod 600/);
    await chmod(file,0o600);await writeFile(file,token);
    await assert.rejects(sessionRPC({url:'http://localhost',sessionFile:file}),error=>!error.message.includes(token));
    const trackedRootFile=new URL('../test-output/session-fixture.json',import.meta.url);
    await mkdir(new URL('../test-output/',import.meta.url),{recursive:true});
    try{
      await writeFile(trackedRootFile,'{}',{mode:0o600});
      await assert.rejects(sessionRPC({url:'http://localhost',sessionFile:trackedRootFile.pathname}),/Git çalışma/);
    }finally{await rm(trackedRootFile,{force:true});}
  }finally{await rm(dir,{recursive:true,force:true});}
});

const editor='22222222-2222-4222-8222-222222222222',publisher='11111111-1111-4111-8111-111111111111';
let db,calls;
async function rpcAs(user,name,args={}){
  calls.push({user,name,args});
  assert.ok(/^(content_role|admin_catalog|admin_revision|admin_create_draft|admin_save_draft|admin_publish)$/.test(name));
  const keys=Object.keys(args);assert.ok(keys.every(k=>/^p_[a-z_]+$/.test(k)));
  await db.exec('savepoint request; set local role authenticated');
  try{
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
    const result=(await db.query(`select public.${name}(${keys.map((k,i)=>`${k} => $${i+1}`).join(',')}) as result`,Object.values(args).map(v=>typeof v==='object'&&v!==null?JSON.stringify(v):v))).rows[0].result;
    await db.exec('reset role; release savepoint request');return result;
  }catch(error){await db.exec('rollback to savepoint request; release savepoint request; reset role');throw error;}
}
const rpc=(name,args)=>rpcAs(editor,name,args);
async function publicSnapshot(){
  const tables={};
  await db.exec('savepoint snapshot; set local role anon');
  await db.query("select set_config('request.jwt.claim.sub','',true)");
  for(const table of ['stories','story_revisions','story_sentences','revision_words','sentence_words','content_assets','sentence_translations','word_translations','revision_texts','story_questions'])tables[table]=(await db.query(`select * from public.${table}`)).rows;
  await db.exec('reset role; release savepoint snapshot');
  return {format:1,project:'local-fixture',createdAt:new Date().toISOString(),tables};
}
before(async()=>{
  db=new PGlite();await db.waitReady;
  await db.exec(await readFile(new URL('./platform-fixture.sql',import.meta.url),'utf8'));
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(directory)).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
  const old=catalogFixture();old.words=old.words.filter(w=>!['falls-asleep','quiet'].includes(w.id));
  // A language not present in the desired bundle must remain in history only.
  for(const d of old.stories){d.descriptions={es:'Descripción'};for(const s of d.sentences)s.translations={es:'Texto'};}
  for(const w of old.words)w.translations={es:'Significado'};
  await db.exec((await exportCatalog(old,{readCover:async()=>bytes})).seed);
  await db.exec(`insert into private.content_staff values('${publisher}','publisher'),('${editor}','editor');
    insert into storage.objects(bucket_id,name) select 'story-media',storage_path from public.content_assets; begin;`);
  calls=[];
  for(const row of (await db.query('select id from public.story_revisions')).rows){
    await db.query('delete from public.sentence_words where revision_id=$1 and word_id=$2 and sentence_id in (select id from public.story_sentences where revision_id=$1 and position=1)',[row.id,'night']);
    await rpcAs(publisher,'admin_publish',{p_revision_id:row.id,p_expected_version:(await db.query('select edit_version from public.story_revisions where id=$1',[row.id])).rows[0].edit_version});
  }
  await db.exec('commit');
});
beforeEach(async()=>{await db.exec('begin');calls=[];});
afterEach(async()=>{await db.exec('rollback; reset role');});
after(async()=>{await db?.close();});

test('local RPC integration saves new drafts, resumes idempotently, preserves history and reaches tr parity only after publisher publishes',async t=>{
  const before=await publicSnapshot(),packet=generateDrafts(catalog,before,manifest);
  const sessionDir=await mkdtemp(path.join(tmpdir(),'draft-apply-command-'));
  t.after(()=>rm(sessionDir,{recursive:true,force:true}));
  for(const [name,data] of [['snapshot',before],['bundle',catalog],['assets',manifest]])await writeFile(path.join(sessionDir,`${name}.json`),JSON.stringify(data));
  const sessionFile=path.join(sessionDir,'session.json'),token='LOCAL-editor-fixture';
  await writeFile(sessionFile,JSON.stringify({access_token:token,publishable_key:'sb_publishable_fixture'}),{mode:0o600});
  const args=['--snapshot',path.join(sessionDir,'snapshot.json'),'--bundle',path.join(sessionDir,'bundle.json'),
    '--asset-manifest',path.join(sessionDir,'assets.json'),'--output',path.join(sessionDir,'review')];
  const transport={fetchImpl:async(url,options)=>{
    assert.equal(options.headers.Authorization,`Bearer ${token}`);assert.ok(!options.body.includes(token));
    const result=await rpc(url.pathname.split('/').at(-1),JSON.parse(options.body));
    return {ok:true,json:async()=>result};
  }};
  await draftsMain(args,transport);assert.equal(calls.length,0);
  const applyArgs=[...args,'--apply','--url','http://127.0.0.1:4444','--session-file',sessionFile];
  const first=(await draftsMain(applyArgs,transport)).result;assert.equal(first.stories.length,2);
  assert.ok(first.stories.every(s=>s.status==='saved'));
  assert.ok(!calls.some(c=>c.name==='admin_publish'));
  assert.deepEqual((await publicSnapshot()).tables,before.tables);
  for(const result of first.stories){
    const draft=await rpc('admin_revision',{p_revision_id:result.revisionId});
    assert.ok(!draft.published_at);assert.ok(equivalent(draft,packet.drafts.find(d=>d.storyId===result.storyId).save.args.p_document));
    assert.deepEqual(Object.keys(draft.descriptions),['tr']);
    assert.ok(draft.words.every(w=>w.id!=='asleep'));
  }
  calls=[];const second=(await draftsMain(applyArgs,transport)).result;
  assert.ok(second.stories.every(s=>s.status==='skipped-equivalent'));
  assert.ok(!calls.some(c=>['admin_create_draft','admin_save_draft','admin_publish'].includes(c.name)));
  assert.equal(JSON.parse(await readFile(path.join(sessionDir,'review/apply-results.json'))).status,'completed');
  await assert.rejects(rpc('admin_publish',{p_revision_id:first.stories[0].revisionId,p_expected_version:first.stories[0].editVersion}),/publisher_required/);
  for(const s of first.stories)await rpcAs(publisher,'admin_publish',{p_revision_id:s.revisionId,p_expected_version:s.editVersion});
  const after=await publicSnapshot(),comparison=compareDocuments(bundledDocuments(catalog),publishedDocuments(after),{manifest,snapshot:after});
  assert.equal(comparison.equal,true);assert.equal(acceptance({bundle:auditCatalog(catalog),live:auditSnapshot(after),comparison},{requireParity:true,requireLang:'tr'}).passed,true);
  const dir=await mkdtemp(path.join(tmpdir(),'draft-published-audit-'));
  try{
    await mkdir(path.join(dir,'media'));
    await writeFile(path.join(dir,'media',manifest.assets[0].id),bytes);
    for(const [name,data] of [['snapshot',after],['bundle',catalog],['assets',manifest]])await writeFile(path.join(dir,`${name}.json`),JSON.stringify(data));
    const audit=await auditMain(['--snapshot',path.join(dir,'snapshot.json'),'--require-parity','--require-lang','tr','--output',path.join(dir,'audit')],
      {bundlePath:path.join(dir,'bundle.json'),assetManifestPath:path.join(dir,'assets.json')});
    assert.equal(audit.acceptance.passed,true);assert.equal(audit.media.status,'verified');
  }finally{await rm(dir,{recursive:true,force:true});}
  for(const g of packet.guards){
    const historical=await rpc('admin_revision',{p_revision_id:g.currentRevisionId});
    assert.ok(historical.words.some(w=>w.id==='asleep'));assert.ok(historical.descriptions.es);
  }
  await assert.rejects(applyDrafts(packet,{apply:true,rpc}),/snapshot_drift/);
});

test('drift in current_revision_id, edit_version, archive state or snapshot content refuses before any writes',async()=>{
  const snapshot=await publicSnapshot();
  for(const change of ['revision','version','archive','content']){
    const stale=structuredClone(snapshot);
    if(change==='revision')stale.tables.stories[0].current_revision_id=stale.tables.story_revisions.find(r=>r.story_id!==stale.tables.stories[0].id).id;
    if(change==='version')stale.tables.story_revisions[0].edit_version--;
    if(change==='content')stale.tables.revision_texts=stale.tables.revision_texts.filter(t=>t.lang!=='es');
    // Archive the actual story only after generating a valid plan.
    const packet=change==='revision'?generateDrafts(catalog,snapshot,manifest):generateDrafts(catalog,stale,manifest);
    if(change==='revision')packet.guards[0].currentRevisionId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    if(change==='archive')await db.query('update public.stories set is_archived=true where id=$1',[packet.guards[0].storyId]);
    calls=[];await assert.rejects(applyDrafts(packet,{apply:true,rpc}),/snapshot_(content_)?drift/);
    assert.ok(!calls.some(c=>['admin_create_draft','admin_save_draft'].includes(c.name)));
    if(change==='archive')await db.query('update public.stories set is_archived=false where id=$1',[packet.guards[0].storyId]);
  }
});

test('existing editor drafts are preserved on conflict; a source clone from an interrupted run can resume',async()=>{
  const packet=generateDrafts(catalog,await publicSnapshot(),manifest),plan=packet.drafts[1];
  const clone=await rpc('admin_create_draft',plan.create.args);
  const changed=await rpc('admin_save_draft',{p_revision_id:clone.id,p_expected_version:clone.edit_version,p_document:{...clone,title:'Editor work'}});
  calls=[];await assert.rejects(applyDrafts(packet,{apply:true,rpc}),/open_draft_conflict/);
  assert.ok(!calls.some(c=>['admin_create_draft','admin_save_draft'].includes(c.name)));
  assert.equal((await rpc('admin_revision',{p_revision_id:clone.id})).title,'Editor work');
  await rpc('admin_save_draft',{p_revision_id:clone.id,p_expected_version:changed.edit_version,p_document:clone});
  const result=await applyDrafts(packet,{apply:true,rpc});assert.ok(result.stories.every(s=>s.status==='saved'));
  assert.equal(result.stories.find(s=>s.storyId===plan.storyId).revisionId,clone.id);
});

test('an edit racing with save is rejected by the RPC edit_version check without replacing the editor change',async()=>{
  const packet=generateDrafts(catalog,await publicSnapshot(),manifest);let raced=false;
  await assert.rejects(applyDrafts(packet,{apply:true,rpc:async(name,args)=>{
    if(name==='admin_save_draft'&&!raced){
      raced=true;const doc=await rpc('admin_revision',{p_revision_id:args.p_revision_id});
      await rpc('admin_save_draft',{...args,p_document:{...doc,title:'Concurrent edit'}});
    }
    return rpc(name,args);
  }}),/draft_version_conflict/);
  const draft=(await rpc('admin_catalog',{p_offset:0,p_limit:100})).find(d=>!d.published_at);
  assert.equal(draft.title,'Concurrent edit');
});

test('the actual audit CLI accepts a full bundled-catalog parity fixture, authoritative tr tables and verified media',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'audit-after-publish-'));
  try{
    const realCatalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url)));
    const realManifest=JSON.parse(await readFile(new URL('../supabase/asset-upload-manifest.json',import.meta.url)));
    const snapshot=snapshotFixture(realCatalog,realManifest);await mkdir(path.join(dir,'media'));
    for(const a of realManifest.assets)await writeFile(path.join(dir,'media',a.id),await readFile(new URL(`../../${a.source}`,import.meta.url)));
    const file=path.join(dir,'catalog.json');await writeFile(file,JSON.stringify(snapshot));
    assert.equal((await verifySnapshotMedia(snapshot,file)).status,'verified');
    const run=spawnSync(process.execPath,[new URL('../tools/audit-content.mjs',import.meta.url).pathname,'--bundle',new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url).pathname,'--snapshot',file,
      '--require-parity','--require-lang','tr','--output',path.join(dir,'audit')],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr+run.stdout);
    const report=JSON.parse(await readFile(path.join(dir,'audit/audit.json')));
    assert.equal(report.comparison.equal,true);assert.equal(report.acceptance.passed,true);assert.equal(report.live.translations.tr.complete,true);
  }finally{await rm(dir,{recursive:true,force:true});}
});


test('question drafts apply through real RPCs, resume idempotently, preserve history and detect question drift before writes',async()=>{
  const c=catalogFixture();
  c.stories[0].questions=[{id:'hare-q',kind:'inference',prompt:'Why does the hare stop?',options:['He feels safe.','He is lost.'],answer:0}];
  const before=await publicSnapshot(),packet=generateDrafts(c,before,manifest);
  const first=await applyDrafts(packet,{apply:true,rpc});
  assert.ok(first.stories.every(s=>s.status==='saved'));
  const plan=first.stories.find(s=>s.storyId===c.stories[0].id),draft=await rpc('admin_revision',{p_revision_id:plan.revisionId});
  assert.deepEqual(draft.questions.map(({revision_id,position,...q})=>q),c.stories[0].questions);
  const again=await applyDrafts(packet,{apply:true,rpc});assert.ok(again.stories.every(s=>s.status==='skipped-equivalent'));
  assert.deepEqual((await publicSnapshot()).tables,before.tables);
  for(const result of first.stories)await rpcAs(publisher,'admin_publish',{p_revision_id:result.revisionId,p_expected_version:result.editVersion});
  const after=await publicSnapshot();assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(after)).equal,true);
  for(const guard of packet.guards)assert.deepEqual((await rpc('admin_revision',{p_revision_id:guard.currentRevisionId})).questions,[]);
  const stale=structuredClone(after);stale.tables.story_questions[0].answer=1;
  calls=[];await assert.rejects(applyDrafts(generateDrafts(c,stale,manifest),{apply:true,rpc}),/snapshot_content_drift/);
  assert.ok(!calls.some(c=>['admin_create_draft','admin_save_draft'].includes(c.name)));
  const legacy=structuredClone(after);delete legacy.tables.story_questions;
  calls=[];await assert.rejects(applyDrafts(generateDrafts(c,legacy,manifest),{apply:true,rpc}),/snapshot_content_drift/);
  assert.ok(!calls.some(c=>['admin_create_draft','admin_save_draft'].includes(c.name)));
});
