import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {auditCatalog,auditSnapshot,bundledDocuments,publishedDocuments,compareDocuments,acceptance} from '../tools/content-audit-lib.mjs';
import {verifySnapshotMedia,revisionProposals,renderReport} from '../tools/audit-content.mjs';

const assetId='11111111-1111-4111-a111-111111111111';
const revisionId='22222222-2222-4222-a222-222222222222';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const word=(id,value=id)=>({id,word:value,translation:`anlam-${id}`,pronunciation:'/test/',example:`We say ${value} today.`});
const catalog=()=>({schemaVersion:1,words:[word('picked-up','picked up')],stories:[{id:'story',title:'A story',author:'Author',level:'A1',genre:'Macera',description:'A short story',coverKey:'cover',sentences:[{id:'s1',english:'She picked-up the bag.',turkish:'Çantayı aldı.'}]}]});
function snapshot(bundle=catalog()){
  const d=bundledDocuments(bundle)[0];
  return {format:1,project:'test-project',createdAt:'2026-10-15T00:00:00Z',scope:'Public content',tables:{
    stories:[{id:d.id,current_revision_id:revisionId,is_archived:false}],
    story_revisions:[{...Object.fromEntries(['title','author','level','genre','description'].map(k=>[k,d[k]])),id:revisionId,story_id:d.id,cover_asset_id:assetId,published_at:'2026-10-15T00:00:00Z'}],
    story_sentences:d.sentences.map(s=>({...s,revision_id:revisionId})),revision_words:d.words.map(w=>({...w,revision_id:revisionId})),
    sentence_words:d.links.map(l=>({...l,revision_id:revisionId})),
    content_assets:[{id:assetId,kind:'cover',mime_type:'image/png',storage_path:'covers/test.png',sha256:hash('cover'),byte_size:5}],
  }};
}

test('phrase coverage counts actual consumed tokens and never stems or matches substrings',()=>{
  const c=catalog();c.words.push(word('up'),word('cat'),word('pick'));
  const report=auditCatalog(c);
  assert.equal(report.summary.uniqueTypes,5);assert.equal(report.summary.coveredTypes,2);
  assert.equal(report.summary.coveredTokens,2);assert.equal(report.summary.tokens,5);
  assert.equal(report.summary.typeCoveragePercent,40);
  assert.deepEqual(report.unusedDictionaryIds,['up','cat','pick']);
  assert.deepEqual(report.backlog.map(r=>r.token).sort(),['bag','she','the']);
});

test('live coverage follows actual links rather than pretending every dictionary occurrence is selectable',()=>{
  const s=snapshot();s.tables.revision_words.push({...word('up'),revision_id:revisionId});
  s.tables.sentence_words=[{revision_id:revisionId,sentence_id:'s1',word_id:'up'}];
  const report=auditSnapshot(s);
  assert.equal(report.summary.coveredTokens,1);assert.equal(report.summary.typeCoveragePercent,20);
  assert.equal(report.summary.errors,0);
  assert.ok(report.issues.some(i=>i.code==='unlinked_occurrence_review'&&i.wordId==='picked-up'));
});

test('missing translations, duplicate IDs, broken order and absent linked words are structural errors',()=>{
  const s=snapshot();s.tables.story_sentences[0].turkish=' ';
  s.tables.story_sentences[0].position=2;
  s.tables.revision_words.push({...word('cat'),revision_id:revisionId});
  s.tables.sentence_words.push({revision_id:revisionId,sentence_id:'s1',word_id:'cat'},
    {revision_id:revisionId,sentence_id:'missing',word_id:'cat'});
  s.tables.story_sentences.push({...s.tables.story_sentences[0]});
  const report=auditSnapshot(s),codes=new Set(report.issues.map(i=>i.code));
  for(const code of ['missing_translation','duplicate_sentence_id','non_contiguous_position','word_absent_from_linked_sentence','dangling_link'])assert.ok(codes.has(code),code);
  assert.equal(acceptance({bundle:auditCatalog(catalog()),live:report}).passed,false);
});

test('only active current revisions contribute; archives and previously published revisions do not inflate counts',()=>{
  const s=snapshot();
  s.tables.story_revisions.push({...s.tables.story_revisions[0],id:'old'});
  s.tables.story_sentences.push({...s.tables.story_sentences[0],revision_id:'old',english:'Old text must not count.'});
  s.tables.stories.push({id:'archived',current_revision_id:'old',is_archived:true},{id:'draft',current_revision_id:null,is_archived:false});
  const report=auditSnapshot(s);
  assert.equal(report.summary.stories,1);assert.equal(report.summary.sentences,1);
  assert.equal(report.snapshot.sourceTableCounts.story_sentences,2);
  assert.equal(compareDocuments(bundledDocuments(catalog()),publishedDocuments(s)).equal,true);
});

test('an unavailable or mismatched current revision fails instead of being silently dropped',()=>{
  const s=snapshot();s.tables.stories[0].current_revision_id='absent';
  assert.ok(auditSnapshot(s).issues.some(i=>i.code==='missing_current_revision'));
  const wrong=snapshot();wrong.tables.story_revisions[0].story_id='other';
  assert.ok(auditSnapshot(wrong).issues.some(i=>i.code==='wrong_revision_owner'));
});

test('parity detects metadata, bilingual text, vocabulary meaning, links and missing stories separately',()=>{
  const c=catalog(),s=snapshot(c);
  s.tables.story_revisions[0].title='Changed title';s.tables.story_sentences[0].turkish='Başka çeviri';
  s.tables.revision_words[0].translation='değişen anlam';s.tables.sentence_words=[];
  const diff=compareDocuments(bundledDocuments(c),publishedDocuments(s));
  assert.equal(diff.equal,false);const d=diff.differingStories[0];
  assert.deepEqual(d.metadataFields,['title']);assert.deepEqual(d.modifiedSentences[0].fields,['turkish']);
  assert.deepEqual(d.modifiedWords[0].fields,['translation']);assert.equal(d.missingLinks.length,1);
  assert.deepEqual(compareDocuments(bundledDocuments(c),[]).missingStoryIds,['story']);
  assert.deepEqual(compareDocuments([],publishedDocuments(s)).extraStoryIds,['story']);
});

test('parity compares cover hash and size rather than incidental revision or asset identities',()=>{
  const c=catalog(),s=snapshot(c),manifest={assets:[{source:'backend/content/covers/cover.png',sha256:hash('cover'),byteSize:5}]};
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s),{manifest,snapshot:s}).equal,true);
  s.tables.content_assets[0].sha256=hash('changed');
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s),{manifest,snapshot:s}).differingStories[0].coverMismatch,true);
});

test('missing cover rows and incomplete download metadata are structural errors',()=>{
  const missing=snapshot();missing.tables.content_assets=[];
  assert.ok(auditSnapshot(missing).issues.some(i=>i.code==='missing_media_asset'));
  for(const change of [{storage_path:''},{mime_type:'text/plain'},{byte_size:'NaN'},{sha256:'bad'}]){
    const s=snapshot();Object.assign(s.tables.content_assets[0],change);
    assert.ok(auditSnapshot(s).issues.some(i=>i.code==='invalid_media_asset'));
  }
});

test('coverage and parity release gates are explicit and cannot pass on a missing level or missing snapshot',()=>{
  const c=catalog();c.stories.push({...c.stories[0],id:'a2-story',level:'A2'});
  const bundle=auditCatalog(c);
  assert.equal(acceptance({bundle}).passed,true);
  assert.equal(acceptance({bundle},{minCoverage:40}).passed,true);
  assert.deepEqual(acceptance({bundle},{minCoverage:60}).failures,['bundle_A1_coverage','bundle_A2_coverage']);
  assert.ok(acceptance({bundle},{requireParity:true}).failures.includes('bundle_live_parity'));
  assert.ok(acceptance({bundle:auditCatalog(catalog())},{minCoverage:0}).failures.includes('bundle_A2_coverage'));
  assert.throws(()=>acceptance({bundle},{minCoverage:NaN}),/threshold/);
});

test('missing metadata remains an actionable report and does not crash backlog aggregation',()=>{
  for(const value of [undefined,'__proto__','invalid']){
    const c=catalog();c.stories[0].level=value;
    const report=auditCatalog(c);
    assert.ok(report.summary.errors>0);assert.ok(report.levels.unknown);
  }
  assert.throws(()=>auditSnapshot({format:2}),/Unsupported/);
});

test('review proposals preserve identities and source sentences without inventing a writable revision',()=>{
  const c=catalog(),s=snapshot(c);s.tables.sentence_words=[];
  const docs=bundledDocuments(c),diff=compareDocuments(docs,publishedDocuments(s));
  const packet=revisionProposals(docs,diff);
  assert.equal(packet.proposals.length,1);const p=packet.proposals[0];
  assert.equal(p.baseLiveRevisionId,revisionId);assert.equal(p.draftRevisionId,null);
  assert.equal(p.sentences[0].english,c.stories[0].sentences[0].english);
  assert.deepEqual(p.words.map(w=>w.id),['picked-up']);assert.equal(p.links.length,1);
});

test('media verification reads bytes and fails on tampering or unsafe IDs',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'english-tales-audit-'));
  try{
    await mkdir(path.join(dir,'media'));await writeFile(path.join(dir,'media',assetId),'cover');
    const s=snapshot();assert.deepEqual(await verifySnapshotMedia(s,path.join(dir,'catalog.json')),{status:'verified',assets:1});
    await writeFile(path.join(dir,'media',assetId),'other');
    await assert.rejects(verifySnapshotMedia(s,path.join(dir,'catalog.json')),/checksum/);
    s.tables.story_revisions[0].cover_asset_id='../secret';
    await assert.rejects(verifySnapshotMedia(s,path.join(dir,'catalog.json')),/Invalid media ID/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('CLI writes inspectable reports before rejecting an unmet coverage gate and rejects partial strict checks',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'english-tales-audit-cli-'));
  const tool=new URL('../tools/audit-content.mjs',import.meta.url);
  try{
    const run=spawnSync(process.execPath,[tool.pathname,'--output',dir,'--min-coverage','100'],{encoding:'utf8'});
    assert.equal(run.status,1,run.stderr);
    const report=JSON.parse(await readFile(path.join(dir,'audit.json')));
    assert.equal(report.acceptance.passed,false);assert.match(await readFile(path.join(dir,'report.md'),'utf8'),/≥ %60/);
    assert.deepEqual(JSON.parse(await readFile(path.join(dir,'revision-proposals.json'))).proposals,[]);
    const invalid=spawnSync(process.execPath,[tool.pathname,'--require-parity'],{encoding:'utf8'});
    assert.equal(invalid.status,1);assert.match(invalid.stderr,/requires --snapshot/);
    assert.match(renderReport(report),/Anlamsal|anlamsal/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
