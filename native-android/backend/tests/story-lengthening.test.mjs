import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {buildPilotPreview} from '../tools/story-pilot-preview-lib.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const catalog=read('../../app/src/main/assets/catalog/v1.json');
const byId=new Map(catalog.stories.map(s=>[s.id,s]));
const scopes=readdirSync(new URL('../content/drafts/',import.meta.url)).filter(f=>/^lengthening-.*\.json$/.test(f));

for(const file of scopes){
  const scope=read(`../content/drafts/${file}`);
  const drafts=scope.activeRevisionStoryIds.map(id=>read(`../content/drafts/revisions/${id}.json`));

  test(`${file}: drafts compile with complete translations in every support language`,()=>{
    const packet=buildPilotPreview(catalog,scope,drafts);
    assert.equal(packet.stories.length,scope.activeRevisionStoryIds.length);
  });

  test(`${file}: original sentences stay word-for-word and in order; only new sentences are inserted`,()=>{
    for(const d of drafts){
      const base=byId.get(d.baseStoryId),added=new Set(d.translationReadiness.newSentenceIds);
      const kept=d.story.sentences.filter(s=>!added.has(s.id));
      assert.deepEqual(kept,base.sentences,d.baseStoryId);
      assert.deepEqual(d.story.questions.slice(0,base.questions.length),base.questions,d.baseStoryId);
      for(const field of ['title','author','level','genre','description','coverKey','tags','descriptions'])
        assert.deepEqual(d.story[field],base[field],`${d.baseStoryId}.${field}`);
      assert.ok(d.lengthening.wordsAfter>=d.lengthening.wordsBefore*1.5,d.baseStoryId);
    }
  });
}
