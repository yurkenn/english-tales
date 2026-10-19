import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate,build,publishable,sample,serialize,sampleApproved,languages,validateTranslation,buildTranslation} from '../tools/glossary.mjs';

const doc=JSON.parse(readFileSync(new URL('../content/glossary/tr.json',import.meta.url),'utf8'));
const asset=readFileSync(new URL('../../app/src/main/assets/glossary/tr.json',import.meta.url),'utf8');

test('glossary drafts are well formed and the app asset is exactly what the review gate allows',()=>{
  assert.deepEqual(validate(doc),[]);
  // Every draft has been cross-checked by a second model, and every dispute is resolved.
  assert.ok(doc.entries.every(e=>e.checkedBy));
  assert.ok(doc.entries.every(e=>!e.disputed||e.reviewed));
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
  assert.match(validate({...doc,entries:[{...e,disputed:true}]}).join(),/suggestion:walk/);
  assert.deepEqual(validate({...doc,entries:[{...e,disputed:true,reviewed:true}]}),[]);
});
test('the owner review sample is a stable tenth of the drafts',()=>{
  const picked=sample(doc);
  assert.deepEqual(picked.map(e=>e.lemma),sample(structuredClone(doc)).map(e=>e.lemma));
  assert.ok(picked.length>doc.entries.length*0.07&&picked.length<doc.entries.length*0.13,String(picked.length));
});

const drafts=languages.filter(lang=>lang!=='tr');
const script={ar:/\p{Script=Arabic}/u,ur:/\p{Script=Arabic}/u,hi:/\p{Script=Devanagari}/u,bn:/\p{Script=Bengali}/u,th:/\p{Script=Thai}/u,ru:/\p{Script=Cyrillic}/u};
const read=lang=>JSON.parse(readFileSync(new URL(`../content/glossary/${lang}.json`,import.meta.url),'utf8'));

test('every other language is a complete machine draft of the Turkish lemma list, and its app asset is what build writes',()=>{
  assert.deepEqual(drafts,['es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th']);
  for(const lang of drafts){
    const draft=read(lang),shipped=readFileSync(new URL(`../../app/src/main/assets/glossary/${lang}.json`,import.meta.url),'utf8');
    assert.deepEqual(validateTranslation(draft,doc,lang),[],lang);
    assert.equal(draft.reviewStatus,'machine-draft');
    assert.equal(shipped,serialize(buildTranslation(draft,doc,lang)),lang);
    assert.equal(JSON.parse(shipped).entries.length,doc.entries.length,lang);
    assert.deepEqual(JSON.parse(shipped).forms,doc.forms);
  }
});
test('non-Latin drafts are written in their own script, not left in Turkish or English',()=>{
  for(const [lang,pattern] of Object.entries(script))
    for(const e of read(lang).entries)assert.match(e.gloss,pattern,`${lang}:${e.lemma}`);
  for(const lang of ['es-419','pt-BR','id','vi'])
    for(const e of read(lang).entries)assert.doesNotMatch(e.gloss,/[ışğİ]/,`${lang}:${e.lemma}`);
});
test('a draft with a missing, unknown, duplicate or blank meaning is rejected, and an unapproved one ships nothing',()=>{
  const draft=read('id');
  const [first,...rest]=draft.entries;
  assert.match(validateTranslation({...draft,entries:rest},doc,'id').join(),/missing:a/);
  assert.match(validateTranslation({...draft,entries:[...draft.entries,{lemma:'zzz',gloss:'x'}]},doc,'id').join(),/unknown:zzz/);
  assert.match(validateTranslation({...draft,entries:[first,...draft.entries]},doc,'id').join(),/duplicate:a/);
  assert.match(validateTranslation({...draft,entries:[{...first,gloss:' '},...rest]},doc,'id').join(),/gloss:a/);
  assert.match(validateTranslation({...draft,reviewStatus:'reviewed'},doc,'id').join(),/schema/);
  assert.deepEqual(buildTranslation({...draft,sampleApprovedBy:null},doc,'id').entries,[]);
});
