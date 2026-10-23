import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {questionErrors,matchSpans} from '../admin/workflow.js';

// Q4.7: new stories start here as drafts. They are not in the app catalog until an editor reviews them.
const dir=new URL('../content/drafts/stories/',import.meta.url);
const drafts=readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>({file:f,doc:JSON.parse(readFileSync(new URL(f,dir),'utf8'))}));
const catalog=JSON.parse(readFileSync(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url),'utf8'));
const words=text=>[...text.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)].length;

test('story drafts are well formed, unpublished and do not collide with the catalog',()=>{
  assert.ok(drafts.length>0);
  const storyIds=new Set(catalog.stories.map(s=>s.id)),sentenceIds=new Set(catalog.stories.flatMap(s=>s.sentences.map(x=>x.id)));
  const wordIds=new Set(catalog.words.map(w=>w.id)),tags=new Set(catalog.tags.map(t=>t.id));
  for(const {file,doc} of drafts){
    const s=doc.story;
    assert.equal(file,`${s.id}.json`);
    assert.equal(doc.status,'draft',file);
    assert.ok(doc.reviewedBy===null||typeof doc.reviewedBy==='string',file);
    assert.ok(!storyIds.has(s.id),`${s.id} already in catalog`);
    assert.ok(['A1','A2','B1','B2'].includes(s.level),file);
    for(const field of ['title','author','genre','description','coverKey'])assert.ok(typeof s[field]==='string'&&s[field].trim(),`${file}:${field}`);
    assert.ok(s.tags.length>0&&s.tags.every(t=>tags.has(t)),`${file}:tags`);
    const ids=new Set();
    for(const x of s.sentences){
      assert.ok(x.english.trim()&&x.turkish.trim(),`${file}:${x.id}`);
      assert.ok(!ids.has(x.id)&&!sentenceIds.has(x.id),`${file}:${x.id} duplicate`);ids.add(x.id);
    }
    assert.deepEqual(questionErrors(s.questions),[],file);
    assert.deepEqual([...new Set(s.questions.map(q=>q.kind))].sort(),['detail','inference','main'],file);
    const count=s.sentences.reduce((n,x)=>n+words(x.english),0);
    assert.ok(count>=250&&count<=600,`${file}: ${count} words`);
    assert.ok(Math.max(...s.sentences.map(x=>words(x.english)))<=25,`${file}: sentence too long`);
    for(const w of doc.words){
      assert.ok(w.id===w.word.toLowerCase()&&!wordIds.has(w.id),`${file}:${w.id}`);
      for(const field of ['translation','pronunciation','example'])assert.ok(typeof w[field]==='string'&&w[field].trim(),`${file}:${w.id}:${field}`);
      assert.ok(s.sentences.some(x=>matchSpans(x.english,[w]).length>0),`${file}: ${w.id} not in the story`);
    }
  }
});
test('drafts stay out of the bundled catalog until reviewed',()=>{
  const bundled=new Set(catalog.stories.map(s=>s.id));
  for(const {doc} of drafts)if(doc.status==='draft')assert.ok(!bundled.has(doc.story.id));
});

const revisionDir=new URL('../content/drafts/revisions/',import.meta.url);
// The quality pilot's five revisions; lengthening batches are checked in story-lengthening.test.mjs.
const pilotIds=JSON.parse(readFileSync(new URL('../content/drafts/pilot-scope.json',import.meta.url),'utf8')).activeRevisionStoryIds;
const revisions=pilotIds.map(id=>JSON.parse(readFileSync(new URL(`${id}.json`,revisionDir),'utf8')));
const {createHash}=await import('node:crypto');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const digest=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

test('revision pilot preserves its base identity and accurately reports translation coverage',()=>{
  assert.equal(revisions.length,5);
  for(const doc of revisions){
    const original=catalog.stories.find(s=>s.id===doc.baseStoryId),s=doc.story;
    assert.ok(original,s.id);
    assert.equal(doc.baseStorySHA256,digest(original),`${s.id}: stale source revision`);
    assert.equal(s.id,original.id);assert.equal(s.level,original.level);
    assert.equal(doc.status,'draft');assert.equal(doc.reviewedBy,'oguz');
    const revised=new Map(s.sentences.map(x=>[x.id,x]));
    assert.equal(revised.size,s.sentences.length);
    // Explicit editorial corrections may update text, never identity. Every changed
    // legacy field must retain its exact source and replacement for review.
    const corrections=doc.legacySentenceCorrections??[],used=new Set();
    for(const sentence of original.sentences){
      const expected=structuredClone(sentence);
      for(const correction of corrections.filter(c=>c.sentenceId===sentence.id)){
        const key=`${correction.sentenceId}:${correction.field}`;
        assert.ok(!used.has(key),`${s.id}: duplicate correction`);used.add(key);
        assert.match(correction.field,/^(english|turkish|translations\.(es-419|pt-BR|id|ar|vi|hi|ru|bn|ur|th))$/);
        assert.ok(correction.reason?.trim()&&correction.after?.trim(),`${s.id}: undocumented correction`);
        assert.notEqual(correction.before,correction.after,`${s.id}: empty correction`);
        const parts=correction.field.split('.'),field=parts.pop();
        const parent=parts.reduce((value,key)=>value[key],expected);
        assert.equal(parent[field],correction.before,`${s.id}: stale correction source`);
        parent[field]=correction.after;
      }
      assert.deepEqual(revised.get(sentence.id),expected,`${s.id}: unrecorded legacy sentence change`);
    }
    assert.equal(used.size,corrections.length,`${s.id}: correction refers to an unknown legacy sentence`);
    assert.deepEqual(s.questions.map(q=>q.id),original.questions.map(q=>q.id),`${s.id}: question identity changed`);
    const originalIds=new Set(original.sentences.map(x=>x.id));
    const added=s.sentences.filter(x=>!originalIds.has(x.id));
    assert.ok(added.length>0);
    assert.deepEqual(doc.translationReadiness.newSentenceIds,added.map(x=>x.id));
    const readiness=doc.translationReadiness;
    const actualComplete=readiness.requiredLanguages.filter(lang=>{
      const present=v=>typeof v==='string'&&v.trim().length>0;
      return present(lang==='tr'?s.description:s.descriptions?.[lang])
        &&s.sentences.every(x=>present(lang==='tr'?x.turkish:x.translations?.[lang]))
        &&doc.words.every(w=>present(lang==='tr'?w.translation:w.translations?.[lang]));
    });
    assert.deepEqual(readiness.completeLanguages,actualComplete,`${s.id}: inaccurate language completion`);
    assert.deepEqual(readiness.pendingLanguages,readiness.requiredLanguages.filter(l=>!actualComplete.includes(l)));
    assert.equal(new Set(readiness.requiredLanguages).size,readiness.requiredLanguages.length);
    assert.ok(readiness.requiredLanguages.includes('tr'));
    assert.ok(doc.publicationBlockers.length>0);
    for(const x of added)assert.ok(x.english.trim()&&x.turkish.trim());
    assert.deepEqual(questionErrors(s.questions),[]);
  }
});

test('story quality pilot has exact-match study words, unique questions and traceable answer evidence',()=>{
  const pilot=[...revisions,...drafts.map(x=>x.doc).filter(d=>d.rights)];
  assert.equal(pilot.length,7);
  for(const doc of pilot){
    const s=doc.story,wordMap=new Map(catalog.words.map(w=>[w.id,w]));
    for(const w of doc.words){
      if(wordMap.has(w.id))assert.deepEqual(w,wordMap.get(w.id),`${s.id}: existing word changed`);
      wordMap.set(w.id,w);
      assert.ok(matchSpans(w.example,[w]).length,`${s.id}: example does not use ${w.word}`);
    }
    assert.ok(doc.studyWordIds.length>=8&&doc.studyWordIds.length<=15,s.id);
    assert.equal(new Set(doc.studyWordIds).size,doc.studyWordIds.length,s.id);
    for(const id of doc.studyWordIds){
      const w=wordMap.get(id);assert.ok(w,`${s.id}: unknown study word ${id}`);
      assert.ok(s.sentences.some(x=>matchSpans(x.english,[w]).length),`${s.id}: ${id} absent from text`);
    }
    assert.equal(new Set(s.questions.map(q=>q.id)).size,s.questions.length);
    for(const evidence of doc.questionEvidence){
      assert.ok(s.questions.some(q=>q.id===evidence.questionId),s.id);
      assert.ok(evidence.rationale.trim(),s.id);
      assert.ok(evidence.sentenceIds.length>0);
      for(const id of evidence.sentenceIds)assert.ok(s.sentences.some(x=>x.id===id),`${s.id}: missing evidence ${id}`);
    }
    assert.ok(s.sentences.every(x=>words(x.english)<=(s.level==='A1'?12:18)),`${s.id}: target sentence length`);
  }
});

test('new classic retellings record historical sources and remain separate from live assets',()=>{
  const classics=drafts.map(x=>x.doc).filter(d=>d.rights);
  assert.equal(classics.length,2);
  for(const d of classics){
    assert.ok(d.rights.identifiedContributor.deathYear<1956);
    assert.equal(new URL(d.rights.sourceUrl).hostname,'www.gutenberg.org');
    assert.equal(new URL(d.rights.sourceTextUrl).hostname,'www.gutenberg.org');
    assert.equal(d.rights.sourceCopyrightStatement,'Public domain in the USA');
    assert.match(d.rights.sourceChapterSha256,/^[a-f0-9]{64}$/);
    assert.equal(d.reviewedBy,null);
    assert.equal(d.translationReadiness.pendingLanguages.length,10);
    assert.ok(d.publicationBlockers.some(b=>b.startsWith('Cover')));
    assert.equal(d.readingSections[0].firstSentenceId,d.story.sentences[0].id);
    assert.equal(d.readingSections.at(-1).lastSentenceId,d.story.sentences.at(-1).id);
    let next=0;
    for(const section of d.readingSections){
      const start=d.story.sentences.findIndex(s=>s.id===section.firstSentenceId);
      const end=d.story.sentences.findIndex(s=>s.id===section.lastSentenceId);
      assert.equal(start,next);assert.ok(end>=start);next=end+1;
    }
    assert.equal(next,d.story.sentences.length);
  }
});


test('all five existing story drafts are multilingual with complete question evidence and owner approval without native review',()=>{
  for(const d of revisions){
    assert.equal(d.translationReadiness.completeLanguages.length,11);
    assert.deepEqual(d.translationReadiness.pendingLanguages,[]);
    assert.deepEqual(d.translationReadiness.reviewedLanguages,d.translationReadiness.requiredLanguages);
    assert.equal(d.reviewedBy,'oguz');assert.equal(d.editorialReview.ownerApproval.nativeSpeakerApproval,false);
    assert.ok(d.publicationBlockers.some(x=>x.includes('Native-speaker language review not done')));
    for(const sentence of d.story.sentences){
      assert.equal(Object.keys(sentence.translations).length,10,sentence.id);
      for(const value of Object.values(sentence.translations))assert.ok(value.trim()!==sentence.english.trim(),sentence.id);
    }
    assert.deepEqual(d.questionEvidence.map(e=>e.questionId),d.story.questions.map(q=>q.id));
  }
});
