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
