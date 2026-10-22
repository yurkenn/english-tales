import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {questionErrors,matchSpans} from '../admin/workflow.js';

// New long stories (about ten minutes of reading) start here as drafts, separate from the short-story pilot.
const dir=new URL('../content/drafts/long-stories/',import.meta.url);
const drafts=readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>({file:f,doc:JSON.parse(readFileSync(new URL(f,dir),'utf8'))}));
const catalog=JSON.parse(readFileSync(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url),'utf8'));
const words=text=>[...text.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)].length;
const languages=['tr','es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th'];

test('long story drafts are complete, unpublished and do not collide with the catalog',()=>{
  assert.ok(drafts.length>0);
  const storyIds=new Set(catalog.stories.map(s=>s.id)),sentenceIds=new Set(catalog.stories.flatMap(s=>s.sentences.map(x=>x.id)));
  const catalogWords=new Map(catalog.words.map(w=>[w.id,w])),tags=new Set(catalog.tags.map(t=>t.id)),seen=new Set();
  for(const {file,doc} of drafts){
    const s=doc.story;
    assert.equal(file,`${s.id}.json`);
    assert.equal(doc.status,'draft');assert.equal(doc.kind,'long-story');
    assert.ok(doc.reviewedBy===null||typeof doc.reviewedBy==='string',file);
    assert.ok(!storyIds.has(s.id),`${s.id} already in catalog`);
    assert.ok(['A1','A2','B1','B2'].includes(s.level),file);
    assert.ok(['Günlük yaşam','Macera','Gizem'].includes(s.genre),`${file}: genre must be one the app shelves`);
    for(const field of ['title','author','genre','description','coverKey'])assert.ok(typeof s[field]==='string'&&s[field].trim(),`${file}:${field}`);
    assert.deepEqual(Object.keys(s.descriptions).sort(),languages.slice(1).sort(),`${file}: descriptions`);
    assert.ok(s.tags.length>0&&s.tags.every(t=>tags.has(t)),`${file}:tags`);
    const count=s.sentences.reduce((n,x)=>n+words(x.english),0);
    assert.ok(count>=1000&&count<=2500,`${file}: ${count} words`);
    for(const x of s.sentences){
      assert.ok(!seen.has(x.id)&&!sentenceIds.has(x.id),`${file}:${x.id} duplicate`);seen.add(x.id);
      assert.ok(words(x.english)<=(s.level==='B2'?25:20),`${file}:${x.id} too long`);
      assert.ok(x.turkish.trim(),`${file}:${x.id}`);
      assert.deepEqual(Object.keys(x.translations).sort(),languages.slice(1).sort(),`${file}:${x.id}`);
      for(const value of Object.values(x.translations))assert.ok(value.trim()&&value.trim()!==x.english.trim(),`${file}:${x.id}`);
    }
    assert.deepEqual(doc.translationReadiness.completeLanguages,languages);
    assert.deepEqual(questionErrors(s.questions),[],file);
    assert.deepEqual([...new Set(s.questions.map(q=>q.kind))].sort(),['detail','inference','main'],file);
    assert.deepEqual(doc.questionEvidence.map(e=>e.questionId),s.questions.map(q=>q.id));
    for(const e of doc.questionEvidence){
      assert.ok(e.rationale.trim()&&e.sentenceIds.length>0,file);
      for(const id of e.sentenceIds)assert.ok(s.sentences.some(x=>x.id===id),`${file}: missing evidence ${id}`);
    }
    assert.ok(doc.studyWordIds.length>=8&&doc.studyWordIds.length<=15,file);
    assert.deepEqual(doc.studyWordIds,doc.words.map(w=>w.id));
    for(const w of doc.words){
      if(catalogWords.has(w.id))assert.deepEqual(w,catalogWords.get(w.id),`${file}: existing word changed`);
      else{
        assert.equal(w.id,w.word.toLowerCase());
        for(const field of ['translation','pronunciation','example'])assert.ok(w[field].trim(),`${file}:${w.id}:${field}`);
        assert.deepEqual(Object.keys(w.translations).sort(),languages.slice(1).sort(),`${file}:${w.id}`);
      }
      assert.ok(matchSpans(w.example,[w]).length,`${file}: example does not use ${w.id}`);
      assert.ok(s.sentences.some(x=>matchSpans(x.english,[w]).length),`${file}: ${w.id} absent from text`);
    }
    let next=0;
    for(const section of doc.readingSections){
      assert.equal(s.sentences.findIndex(x=>x.id===section.firstSentenceId),next,`${file}: ${section.title}`);
      const end=s.sentences.findIndex(x=>x.id===section.lastSentenceId);
      assert.ok(end>=next);next=end+1;
    }
    assert.equal(next,s.sentences.length);
    assert.ok(doc.rights.identifiedContributor.deathYear<1956);
    assert.equal(new URL(doc.rights.sourceUrl).hostname,'www.gutenberg.org');
    assert.equal(doc.rights.sourceCopyrightStatement,'Public domain in the USA');
    assert.ok(doc.publicationBlockers.length>0);
  }
});
