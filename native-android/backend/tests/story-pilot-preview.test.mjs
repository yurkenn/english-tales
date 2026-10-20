import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,existsSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildPilotPreview,pilotHash} from '../tools/story-pilot-preview-lib.mjs';
import {invalidLinks,supportCompleteness} from '../admin/workflow.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../app/src/main/assets/catalog/v1.json');
const scope=read('../content/drafts/pilot-scope.json');
const drafts=scope.activeRevisionStoryIds.map(id=>read(`../content/drafts/revisions/${id}.json`));
const compile=(docs=drafts,options={})=>buildPilotPreview(catalog,scope,docs,options);

test('all five previews link exactly their selected vocabulary without changing source catalogs',()=>{
  const original=structuredClone({catalog,scope,drafts}),packet=compile();
  assert.equal(packet.status,'local-preview-not-published');assert.equal(packet.stories.length,5);
  for(const row of packet.stories){
    const doc=row.preview;
    assert.match(doc.id,/^[a-f0-9-]{36}$/);assert.equal(Object.hasOwn(doc,'published_at'),false);
    assert.equal(doc.words.length,10);assert.deepEqual(doc.words.map(w=>w.id).sort(),[...row.studyWordIds].sort());
    assert.deepEqual(invalidLinks(doc),[]);
    assert.equal(new Set(doc.links.map(l=>`${l.sentence_id}:${l.word_id}`)).size,doc.links.length);
    for(const word of doc.words)assert.ok(doc.links.some(l=>l.word_id===word.id));
    for(const lang of row.languages)assert.deepEqual(supportCompleteness(doc,lang),{missingSentences:0,missingWords:0,missingDescriptions:0});
    assert.equal(row.review.complete,true);assert.equal(row.review.reviewedBy,'oguz');
  }
  assert.deepEqual({catalog,scope,drafts},original);
});

test('preview IDs are deterministic, change with revised content and retain authored word/sentence IDs',()=>{
  const first=compile();assert.deepEqual(compile(),first);
  const changed=structuredClone(drafts);changed[0].story.questions[0].options[1]+=' today';
  const next=compile(changed);assert.notEqual(next.stories[0].preview.id,first.stories[0].preview.id);
  assert.equal(next.stories[1].preview.id,first.stories[1].preview.id);
  assert.deepEqual(next.stories[0].preview.sentences.map(s=>s.id),first.stories[0].preview.sentences.map(s=>s.id));
  assert.deepEqual(next.stories[0].studyWordIds,first.stories[0].studyWordIds);
});

test('stale sources, excluded stories, unknown or ambiguous study word IDs and broken evidence are rejected',()=>{
  const bad=fn=>{const d=structuredClone(drafts);fn(d);return d;};
  assert.throws(()=>compile(bad(d=>d[0].baseStorySHA256='0'.repeat(64))),/Source catalog changed/);
  assert.throws(()=>compile(bad(d=>d[0].story.id=scope.deferredNewStoryIds[0])),/active existing story/);
  assert.throws(()=>compile(bad(d=>d[0].studyWordIds[0]='unknown')),/Missing study word/);
  assert.throws(()=>compile(bad(d=>d[0].words.push(d[0].words[0]))),/Duplicate word IDs/);
  assert.throws(()=>compile(bad(d=>d[0].words[0].translation='different meaning')),/Existing word meaning changed/);
  assert.throws(()=>compile(bad(d=>d[0].questionEvidence[0].sentenceIds=['missing'])),/Missing question evidence/);
  assert.throws(()=>compile(bad(d=>{d[0].words[4].word='unmatchablexyz';d[0].words[4].example='unmatchablexyz';})),/absent from text/);
});

test('translation holes cannot silently fall back to Turkish or English in a compiled pilot',()=>{
  const d=structuredClone(drafts),added=d[0].story.sentences.find(s=>s.id===d[0].translationReadiness.newSentenceIds[0]);
  delete added.translations.ar;assert.throws(()=>compile(d),/Incomplete translation.*ar/);
  added.translations.ar=' ';assert.throws(()=>compile(d),/Invalid translation/);
});

test('review-required mode rejects current drafts and invalid review metadata; compilation never grants approval',()=>{
  const unreviewed=structuredClone(drafts);
  for(const doc of unreviewed){doc.reviewedBy=null;doc.translationReadiness.reviewedLanguages=[];}
  assert.throws(()=>compile(unreviewed,{requireReviewed:true}),/review pending/);
  assert.ok(compile(drafts,{requireReviewed:true}).stories.every(s=>s.review.complete));
  const d=structuredClone(unreviewed);
  for(const doc of d){doc.reviewedBy='fixture-editor';doc.translationReadiness.reviewedLanguages=[...doc.translationReadiness.requiredLanguages];}
  assert.ok(compile(d,{requireReviewed:true}).stories.every(s=>s.review.complete));
  d[0].translationReadiness.reviewedLanguages=d[0].translationReadiness.requiredLanguages.join(',');
  assert.throws(()=>compile(d,{requireReviewed:true}),/review pending/);
  assert.equal(unreviewed[0].reviewedBy,null);
});

test('Android cache fixture is generated from the actual pilot and stays outside production assets',()=>{
  const fixture=read('../../app/src/androidTest/assets/story-pilot/quiet-morning.json');
  assert.equal(pilotHash(fixture),pilotHash(compile().stories[0].preview));
});

test('CLI writes only local previews and fails review/production-output guards before creating files',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'story-pilot-'));
  const cli=new URL('../tools/story-pilot-preview.mjs',import.meta.url).pathname;
  const run=args=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
  try{
    const out=path.join(dir,'preview'),result=run(['--output',out]);assert.equal(result.status,0,result.stderr);
    assert.ok(existsSync(path.join(out,'quiet-morning.json')));
    const reviewed=path.join(dir,'reviewed');assert.equal(run(['--require-reviewed','--output',reviewed]).status,0);assert.ok(existsSync(path.join(reviewed,'manifest.json')));
    const production=new URL('../../app/src/main/assets/blocked-story-preview',import.meta.url).pathname;
    assert.match(run(['--output',production]).stderr,/production app sources/);assert.equal(existsSync(production),false);
    const link=path.join(dir,'linked-production');symlinkSync(new URL('../../app/src/main/',import.meta.url).pathname,link,'dir');
    assert.match(run(['--output',path.join(link,'assets','blocked-story-preview')]).stderr,/production app sources/);
    assert.notEqual(run(['--apply']).status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
