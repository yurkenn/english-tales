import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {exportCatalog} from '../tools/export-catalog.mjs';
import {auditCatalog,auditSnapshot,bundledDocuments,publishedDocuments,compareDocuments,acceptance} from '../tools/content-audit-lib.mjs';
import {generateDrafts,equivalent,renderDraftReport} from '../tools/content-drafts-lib.mjs';
import {questionErrors,questionDocument,backup,readBackup} from '../admin/workflow.js';
import {catalogFixture,snapshotFixture} from './fixtures/content-drafts.mjs';
import {main as auditMain,renderReport} from '../tools/audit-content.mjs';

const question=(extra={})=>({id:'q1',kind:'main',prompt:"What is the hare's problem?",options:["He's asleep.",'He is hungry.'],answer:0,...extra});
const catalog=()=>{const c=catalogFixture();c.stories[0].questions=[question(),question({id:'q2',kind:'detail'}),question({id:'q3',kind:'inference',answer:1})];return c;};
const exportOptions={readCover:async()=>Buffer.from('local cover fixture')};

test('exporter inserts executable English questions in display order, escapes text, and leaves existing revisions unchanged',async()=>{
  const db=new PGlite();await db.waitReady;
  try{
    await db.exec(await readFile(new URL('./platform-fixture.sql',import.meta.url),'utf8'));
    const directory=new URL('../supabase/migrations/',import.meta.url);
    for(const name of (await readdir(directory)).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
    const c=catalog(),{seed}=await exportCatalog(c,exportOptions);await db.exec(seed);
    const rows=(await db.query('select id,position,kind,prompt,options,answer from public.story_questions order by position')).rows;
    assert.deepEqual(rows,c.stories[0].questions.map((q,i)=>({...q,position:i+1})));
    await db.exec(seed);assert.equal((await db.query('select count(*)::int n from public.story_questions')).rows[0].n,3);
    c.stories[0].questions=[];await db.exec((await exportCatalog(c,exportOptions)).seed);
    assert.equal((await db.query('select count(*)::int n from public.story_questions')).rows[0].n,3);
  }finally{await db.close();}
});

test('exporter and audit reject malformed question content without allowing scalar coercion',async()=>{
  for(const qs of [{},null,[null],[question({id:''})],[question({kind:'other'})],[question({prompt:' '})],
    [question({options:['Only']})],[question({options:['Yes',' YES ']})],[question({options:['a',null]})],
    [question({answer:2})],[question({answer:'0'})],[question(),question()]]){
    const c=catalog();c.stories[0].questions=qs;
    await assert.rejects(exportCatalog(c,exportOptions),/Invalid questions/);
    assert.ok(auditCatalog(c).summary.errors>0);
  }
});

test('question parity includes text, kind, IDs, option order, answers and question order; drafts follow the bundle',async()=>{
  const c=catalog(),{manifest}=await exportCatalog(c,exportOptions),s=snapshotFixture(c,manifest);
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s)).equal,true);
  for(const mutate of [q=>q.prompt='Why?',q=>q.kind='detail',q=>q.id='changed',q=>q.options.reverse(),q=>q.answer=1]){
    const changed=structuredClone(s);mutate(changed.tables.story_questions[0]);
    const packet=generateDrafts(c,changed,manifest);assert.equal(packet.drafts.length,1);
    assert.equal(packet.comparison.summary.questionDifferences,1);
    assert.deepEqual(packet.drafts[0].save.args.p_document.questions,c.stories[0].questions);
    assert.equal(equivalent(packet.guards[0].document,packet.drafts[0].save.args.p_document),false);
    packet.inputs={};assert.match(renderDraftReport(packet),/Sorular paket listesiyle değiştirilir/);
  }
  const reordered=structuredClone(s);reordered.tables.story_questions[0].position=2;reordered.tables.story_questions[1].position=1;
  assert.equal(generateDrafts(c,reordered,manifest).drafts.length,1);
  const older=structuredClone(s);delete older.tables.story_questions;
  assert.equal(auditSnapshot(older).summary.errors,0);assert.equal(generateDrafts(c,older,manifest).drafts.length,1);
  const noQuestions=structuredClone(c);delete noQuestions.stories[0].questions;
  assert.deepEqual(generateDrafts(noQuestions,s,manifest).drafts[0].save.args.p_document.questions,[]);
  for(const name of ['sentence_translations','word_translations','revision_texts'])delete older.tables[name];
  assert.equal(auditSnapshot(older).summary.errors,0);assert.equal(generateDrafts(c,older,manifest).drafts.length,1);
});

test('audit counts valid questions by level, lists questionless stories, and rejects ordering gaps and strict minimums',async()=>{
  const c=catalog(),{manifest}=await exportCatalog(c,exportOptions),s=snapshotFixture(c,manifest);
  const bundle=auditCatalog(c);assert.equal(bundle.levels.A1.storiesWithThreeQuestions,1);
  assert.equal(bundle.levels.A2.storiesWithThreeQuestions,0);assert.deepEqual(bundle.storiesWithoutQuestions,['classic-dog-manger']);
  assert.equal(acceptance({bundle},{minQuestions:0}).passed,true);
  assert.deepEqual(acceptance({bundle,live:auditSnapshot(s)},{minQuestions:3}).failures,['bundle_min_questions','live_min_questions']);
  for(const minQuestions of [-1,NaN,1.5,Infinity])assert.throws(()=>acceptance({bundle},{minQuestions}),/tam sayı/);
  s.tables.story_questions[2].position=4;
  const report=auditSnapshot(s);assert.ok(report.summary.errors>0);assert.equal(report.levels.A1.storiesWithThreeQuestions,0);
  assert.ok(report.issues.some(i=>i.code==='invalid_question'&&i.message.includes('kesintisiz')));
});

test('audit min-questions CLI writes Turkish reports, fails for bundle or snapshot shortage, and passes a complete fixture',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'questions-audit-'));
  try{
    const c=catalog();c.stories[1].questions=[question({id:'dog-q'})];
    const {manifest}=await exportCatalog(c,exportOptions),s=snapshotFixture(c,manifest);
    const bundlePath=path.join(dir,'bundle.json'),assetManifestPath=path.join(dir,'manifest.json'),snapshotPath=path.join(dir,'snapshot.json');
    await writeFile(bundlePath,JSON.stringify(c));await writeFile(assetManifestPath,JSON.stringify(manifest));
    await writeFile(snapshotPath,JSON.stringify(s));
    const sources={bundlePath,assetManifestPath};
    let report=await auditMain(['--output',dir,'--snapshot',snapshotPath,'--skip-media','--min-questions','1'],sources);
    assert.equal(report.acceptance.passed,true);assert.match(renderReport(report),/En az 3 geçerli sorulu/);
    s.tables.story_questions=s.tables.story_questions.filter(q=>q.id!=='dog-q');await writeFile(snapshotPath,JSON.stringify(s));
    report=await auditMain(['--output',dir,'--snapshot',snapshotPath,'--skip-media','--min-questions','1'],sources);
    assert.deepEqual(report.acceptance.failures,['live_min_questions']);process.exitCode=0;
    const tool=new URL('../tools/audit-content.mjs',import.meta.url).pathname;
    const result=spawnSync(process.execPath,[tool,'--output',dir,'--min-questions','3'],{encoding:'utf8'});
    assert.equal(result.status,1,result.stderr);
    report=JSON.parse(await readFile(path.join(dir,'audit.json')));assert.ok(report.acceptance.failures.includes('bundle_min_questions'));
    assert.equal(spawnSync(process.execPath,[tool,'--min-questions'],{encoding:'utf8'}).status,1);
    assert.equal(spawnSync(process.execPath,[tool,'--output',dir,'--min-questions','-1'],{encoding:'utf8'}).status,1);
  }finally{process.exitCode=0;await rm(dir,{recursive:true,force:true});}
});

test('panel question validation and backups preserve options and answers while accepting legacy backups',()=>{
  const doc={...bundledDocuments(catalog())[0],story_id:'sample',id:'revision',edit_version:7};
  assert.deepEqual(questionErrors(doc.questions),[]);
  const restored=readBackup(JSON.stringify(backup(doc,'local')),doc,'local').document;
  assert.deepEqual(questionDocument(restored.questions),questionDocument(doc.questions));
  const data=structuredClone(backup(doc,'local'));delete data.document.questions;
  assert.equal(readBackup(JSON.stringify(data),doc,'local').document.edit_version,7);
  data.document.questions=[question({options:['a','A']})];
  assert.throws(()=>readBackup(JSON.stringify(data),doc,'local'),/Seçenekler/);
  assert.ok(questionErrors([question({prompt:'',kind:'invalid',options:['a'],answer:3})]).length>=4);
});
