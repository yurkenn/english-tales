import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate,build,publishable,sample,serialize,sampleApproved} from '../tools/glossary.mjs';

const doc=JSON.parse(readFileSync(new URL('../content/glossary/tr.json',import.meta.url),'utf8'));
const asset=readFileSync(new URL('../../app/src/main/assets/glossary/tr.json',import.meta.url),'utf8');

test('glossary drafts are well formed and the app asset is exactly what the review gate allows',()=>{
  assert.deepEqual(validate(doc),[]);
  assert.ok(doc.entries.length>1000);
  assert.equal(asset,serialize(build(doc)));
  // Until the owner signs off the review sample, no draft meaning reaches learners.
  assert.equal(JSON.parse(asset).entries.length,sampleApproved(doc)?doc.entries.filter(publishable).length:0);
});
test('only cross-checked entries ship, and disputed ones only after owner review',()=>{
  const e={lemma:'walk',gloss:'yürümek',source:'claude-draft',checkedBy:null,disputed:false,reviewed:false};
  assert.equal(publishable(e),false);
  assert.equal(publishable({...e,checkedBy:'codex-2026-10'}),true);
  assert.equal(publishable({...e,checkedBy:'codex-2026-10',disputed:true}),false);
  assert.equal(publishable({...e,checkedBy:'codex-2026-10',disputed:true,reviewed:true}),true);
  const two=[{...e,checkedBy:'codex'},{...e,lemma:'run',gloss:'koşmak'}];
  assert.deepEqual(build({...doc,sampleApprovedBy:null,entries:two}).entries,[]);
  const built=build({...doc,sampleApprovedBy:'owner-2026-10',entries:[{...e,checkedBy:'codex'},{...e,lemma:'run',gloss:'koşmak'}]});
  assert.deepEqual(built.entries,[{lemma:'walk',gloss:'yürümek'}]);
  assert.match(validate({...doc,entries:[e,e]}).join(),/duplicate:walk/);
  assert.match(validate({...doc,entries:[{...e,lemma:'Walk'}]}).join(),/lemma:Walk/);
});
test('the owner review sample is a stable tenth of the drafts',()=>{
  const picked=sample(doc);
  assert.deepEqual(picked.map(e=>e.lemma),sample(structuredClone(doc)).map(e=>e.lemma));
  assert.ok(picked.length>doc.entries.length*0.07&&picked.length<doc.entries.length*0.13,String(picked.length));
});
