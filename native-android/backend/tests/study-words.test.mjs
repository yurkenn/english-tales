import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proposeStudyWords,lemmatizer} from '../tools/study-words-lib.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const catalog=read('../../app/src/main/assets/catalog/v1.json'),glossary=read('../content/glossary/tr.json');
const committed=readFileSync(new URL('../content/study-words/proposals.json',import.meta.url),'utf8');

test('committed proposals are what the tool writes and stay an unreviewed proposal',()=>{
  const fresh=proposeStudyWords(catalog,glossary);
  assert.equal(committed,JSON.stringify(fresh,null,1)+'\n');
  assert.equal(fresh.status,'proposal');
  assert.equal(fresh.reviewedBy,null);
});
test('every story gets 8–15 translated study words that occur in it',()=>{
  const {stories}=proposeStudyWords(catalog,glossary);
  assert.equal(stories.length,catalog.stories.length);
  for(const s of stories){
    assert.ok(s.proposed.length>=8&&s.proposed.length<=15,`${s.storyId}: ${s.proposed.length}`);
    assert.equal(new Set(s.proposed.map(p=>p.lemma)).size,s.proposed.length,s.storyId);
    for(const p of s.proposed)assert.ok(p.translation&&p.occurrences>=1,`${s.storyId}:${p.lemma}`);
    assert.ok(s.outOfLevelPercent>=0&&s.outOfLevelPercent<=100);
  }
});
test('learning words chosen by editors come before glossary drafts',()=>{
  const {stories}=proposeStudyWords(catalog,glossary);
  const umbrella=stories.find(s=>s.storyId==='red-umbrella');
  assert.ok(umbrella.proposed.some(p=>p.lemma==='umbrella'&&p.source==='learning-word'));
});
test('lemmatizer prefers irregular forms, then suffix rules that land on a known lemma',()=>{
  const lemma=lemmatizer(new Set(['walk','carry','stop','make']),{went:'go'});
  assert.equal(lemma('went'),'go');
  assert.equal(lemma('walked'),'walk');
  assert.equal(lemma('carried'),'carry');
  assert.equal(lemma('stopped'),'stop');
  assert.equal(lemma('making'),'make');
  assert.equal(lemma('unknownly'),'unknownly');
});
