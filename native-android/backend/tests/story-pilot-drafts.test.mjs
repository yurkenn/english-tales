import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile,readdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {exportCatalog} from '../tools/export-catalog.mjs';
import {applyDrafts,equivalent} from '../tools/content-drafts-lib.mjs';
import {publishedDocuments} from '../tools/content-audit-lib.mjs';
import {buildPilotPreview} from '../tools/story-pilot-preview-lib.mjs';
import {generatePilotDrafts,renderPilotDraftReport} from '../tools/story-pilot-drafts-lib.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../app/src/main/assets/catalog/v1.json');
const scope=read('../content/drafts/pilot-scope.json');
const drafts=scope.activeRevisionStoryIds.map(id=>read(`../content/drafts/revisions/${id}.json`));
// Tests stand in for the editor's recorded approval; the committed drafts stay unreviewed.
const reviewed=()=>drafts.map(d=>({...structuredClone(d),reviewedBy:'test-editor',
  translationReadiness:{...d.translationReadiness,reviewedLanguages:[...d.translationReadiness.requiredLanguages]}}));
const preview=(docs=reviewed())=>buildPilotPreview(catalog,scope,docs);

const publisher='11111111-1111-4111-8111-111111111111',editor='22222222-2222-4222-8222-222222222222';
let db,calls,snapshot;
async function rpcAs(user,name,args={}){
  calls.push(name);
  const keys=Object.keys(args);
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
  for(const table of ['stories','story_revisions','story_sentences','revision_words','sentence_words','content_assets','sentence_translations','word_translations','revision_texts','story_questions','revision_tags'])
    tables[table]=(await db.query(`select * from public.${table}`)).rows;
  await db.exec('reset role; release savepoint snapshot');
  return {format:1,project:'local-fixture',createdAt:new Date().toISOString(),tables};
}

before(async()=>{
  db=new PGlite();await db.waitReady;
  await db.exec(await readFile(new URL('./platform-fixture.sql',import.meta.url),'utf8'));
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(directory)).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
  // The live service today: the full bundled catalog, published.
  await db.exec((await exportCatalog(catalog)).seed);
  await db.exec(`insert into private.content_staff values('${publisher}','publisher'),('${editor}','editor');
    insert into storage.objects(bucket_id,name) select 'story-media',storage_path from public.content_assets; begin;`);
  calls=[];
  for(const row of (await db.query('select id,edit_version from public.story_revisions')).rows)
    await rpcAs(publisher,'admin_publish',{p_revision_id:row.id,p_expected_version:row.edit_version});
  snapshot=await publicSnapshot();
});
after(async()=>{await db?.close();});

test('unreviewed pilot drafts are listed as blockers and never reach an RPC',async()=>{
  const packet=generatePilotDrafts(catalog,snapshot,buildPilotPreview(catalog,scope,drafts));
  assert.equal(packet.drafts.length,5);
  assert.equal(packet.blockers.filter(b=>b.includes('onayı eksik')).length,5);
  await assert.rejects(applyDrafts(packet,{apply:true,rpc:()=>assert.fail('no calls before blockers')}),/engelleri/);
  packet.packageSHA256='fixture';assert.match(renderPilotDraftReport(packet),/onayı eksik/);
});

test('live text that drifted from the bundled source blocks the pilot story',()=>{
  const stale=structuredClone(snapshot),revision=stale.tables.stories.find(s=>s.id==='paper-boat').current_revision_id;
  stale.tables.story_sentences.find(s=>s.revision_id===revision).english+=' Live edit.';
  const packet=generatePilotDrafts(catalog,stale,preview());
  assert.deepEqual(packet.blockers,['Canlı metin pilotun kaynağından farklı: paper-boat']);
});

test('reviewed pilots become editor drafts only; after publishing, the anonymous catalog serves them in all languages',async()=>{
  const packet=generatePilotDrafts(catalog,snapshot,preview());
  assert.deepEqual(packet.blockers,[]);
  for(const plan of packet.drafts){
    const live=publishedDocuments(snapshot).find(d=>d.id===plan.storyId),doc=plan.save.args.p_document;
    assert.equal(doc.cover_asset_id,live.cover_asset_id);assert.equal(doc.words.length,10);
    assert.equal(Object.keys(doc.descriptions).length,11);
  }
  calls=[];const result=await applyDrafts(packet,{apply:true,rpc});
  assert.ok(result.stories.every(s=>s.status==='saved'));assert.ok(!calls.includes('admin_publish'));
  assert.deepEqual((await publicSnapshot()).tables,snapshot.tables);
  assert.ok((await applyDrafts(packet,{apply:true,rpc})).stories.every(s=>s.status==='skipped-equivalent'));
  for(const s of result.stories)await rpcAs(publisher,'admin_publish',{p_revision_id:s.revisionId,p_expected_version:s.editVersion});
  const live=publishedDocuments(await publicSnapshot());
  for(const plan of packet.drafts){
    const doc=live.find(d=>d.id===plan.storyId);
    assert.ok(equivalent(doc,plan.save.args.p_document),plan.storyId);
    for(const s of doc.sentences)assert.equal(Object.keys(s.translations).length,11,s.id);
  }
  // Earlier revisions, and the stories outside the pilot, are untouched.
  const untouched=publishedDocuments(snapshot).filter(d=>!scope.activeRevisionStoryIds.includes(d.id));
  for(const d of untouched)assert.equal(live.find(x=>x.id===d.id).revisionId,d.revisionId);
  for(const g of packet.guards.filter(g=>scope.activeRevisionStoryIds.includes(g.storyId)))
    assert.ok(equivalent(await rpc('admin_revision',{p_revision_id:g.currentRevisionId}),g.document));
});

test('CLI dry run writes the review packet without a session and refuses --apply while review is pending',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'pilot-drafts-'));
  try{
    const file=path.join(dir,'snapshot.json');await writeFile(file,JSON.stringify(snapshot));
    const cli=new URL('../tools/story-pilot-drafts.mjs',import.meta.url).pathname,out=path.join(dir,'out');
    const dry=spawnSync(process.execPath,[cli,'--snapshot',file,'--output',out],{encoding:'utf8'});
    assert.equal(dry.status,0,dry.stderr);
    const packet=JSON.parse(await readFile(path.join(out,'manifest.json')));
    assert.equal(packet.drafts.length,5);assert.equal(packet.blockers.length,5);
    assert.match(await readFile(path.join(out,'review.md'),'utf8'),/A Quiet Morning/);
    const apply=spawnSync(process.execPath,[cli,'--snapshot',file,'--output',out,'--apply','--url','https://must-not-connect.invalid','--session-file','/missing'],{encoding:'utf8'});
    assert.equal(apply.status,1);assert.match(apply.stderr,/engelleri/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
