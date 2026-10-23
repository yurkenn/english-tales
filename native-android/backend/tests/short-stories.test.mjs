import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {shortStoryDocument} from '../tools/short-stories-lib.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../app/src/main/assets/catalog/v1.json');
const dir=new URL('../content/drafts/stories/',import.meta.url);
const drafts=readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>read('../content/drafts/stories/'+f));
test('four short stories compile into complete 11-language documents without inventing human approval',()=>{
  assert.equal(drafts.length,4);
  for(const draft of drafts){
    const doc=shortStoryDocument(draft,catalog);
    assert.equal(doc.sentences.length,draft.story.sentences.length);
    assert.equal(doc.questions.length,draft.story.questions.length);
    assert.equal(draft.reviewedBy,null);
    assert.deepEqual(draft.translationReadiness.reviewedLanguages,[]);
    assert.equal(draft.ownerPublicationAuthorization.nativeSpeakerApproved,false);
    assert.ok(existsSync(new URL(`../../app/src/main/res/drawable-nodpi/${draft.story.coverKey}.webp`,import.meta.url)));
  }
});
test('short-story compilation rejects missing translations, absent study words and unsupported answers',()=>{
  const draft=drafts[0];
  let bad=structuredClone(draft);delete bad.story.sentences[0].translations.ar;
  assert.throws(()=>shortStoryDocument(bad,catalog),/Incomplete language/);
  bad=structuredClone(draft);bad.studyWordIds[0]='missing-word';
  assert.throws(()=>shortStoryDocument(bad,catalog),/Unknown study word/);
  bad=structuredClone(draft);bad.questionEvidence=[];
  assert.throws(()=>shortStoryDocument(bad,catalog),/Missing answer evidence/);
});
