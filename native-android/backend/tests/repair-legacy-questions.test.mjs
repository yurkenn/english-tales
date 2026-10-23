import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planLegacyQuestionRepair} from '../tools/repair-legacy-questions.mjs';
import {draftDocument} from '../tools/content-drafts-lib.mjs';
import {publishedDocuments} from '../tools/content-audit-lib.mjs';
const revision='22222222-2222-4222-a222-222222222222',asset='11111111-1111-4111-a111-111111111111';
function fixture(){
  const questions=[1,2,3].map(n=>({id:`q${n}`,kind:'detail',prompt:`Question ${n}?`,options:['Yes','No'],answer:0}));
  const catalog={schemaVersion:1,words:[{id:'key',word:'key',translation:'anahtar',pronunciation:'key',example:'A key.',translations:{tr:'anahtar',ar:'مفتاح'}}],stories:[{id:'story',title:'The Key',author:'English Tales',level:'A1',genre:'Macera',description:'Bir anahtar.',descriptions:{tr:'Bir anahtar.',ar:'مفتاح.'},coverKey:'cover',questions,sentences:[{id:'s1',english:'A key.',turkish:'Bir anahtar.',translations:{tr:'Bir anahtar.',ar:'مفتاح.'}}]}]};
  const story=catalog.stories[0];
  const snapshot={format:1,project:'fixture',tables:{
    stories:[{id:story.id,current_revision_id:revision,is_archived:false}],
    story_revisions:[{id:revision,story_id:story.id,title:story.title,author:story.author,level:story.level,genre:story.genre,description:story.description,cover_asset_id:asset,published_at:'2026-10-20T00:00:00Z',edit_version:4}],
    story_sentences:[{...story.sentences[0],position:1,revision_id:revision}],revision_words:[{...catalog.words[0],revision_id:revision}],sentence_words:[{revision_id:revision,sentence_id:'s1',word_id:'key'}],
    content_assets:[{id:asset,kind:'cover',mime_type:'image/png',storage_path:'covers/key.png',sha256:'a'.repeat(64),byte_size:5}],story_questions:[],
    sentence_translations:[{revision_id:revision,sentence_id:'s1',lang:'tr',text:'Bir anahtar.'}],word_translations:[{revision_id:revision,word_id:'key',lang:'tr',translation:'anahtar'}],revision_texts:[{revision_id:revision,lang:'tr',description:'Bir anahtar.'}]
  }};return {catalog,snapshot};
}
test('plans append-only missing questions and fills exact-source translations without changing existing content',()=>{
  const {catalog,snapshot}=fixture();const before=structuredClone(snapshot);
  const packet=planLegacyQuestionRepair(catalog,snapshot);
  assert.deepEqual(packet.blockers,[]);assert.equal(packet.drafts.length,1);assert.equal(packet.guards.length,1);
  const plan=packet.drafts[0],doc=plan.save.args.p_document;
  assert.deepEqual(plan.create.args,{p_story_id:'story',p_source_id:revision});
  assert.equal(plan.sourceEditVersion,4);assert.equal(doc.questions.length,3);
  assert.equal(doc.sentences[0].translations.ar,'مفتاح.');assert.equal(doc.words[0].translations.ar,'مفتاح');
  const old=draftDocument(publishedDocuments(snapshot)[0]);
  for(const key of ['title','author','level','genre','description','cover_asset_id','audio_asset_id','tags','links']) assert.deepEqual(doc[key],old[key]);
  assert.deepEqual(snapshot,before);assert.match(plan.documentSHA256,/^[a-f0-9]{64}$/);
});
test('existing server translations win over shipped translations',()=>{
  const {catalog,snapshot}=fixture();snapshot.tables.sentence_translations.push({revision_id:revision,sentence_id:'s1',lang:'ar',text:'Server translation'});
  assert.equal(planLegacyQuestionRepair(catalog,snapshot).drafts[0].save.args.p_document.sentences[0].translations.ar,'Server translation');
});
test('changed English, Turkish or sentence identity blocks any repair',()=>{
  for(const key of ['english','turkish','id']) {
    const {catalog,snapshot}=fixture();snapshot.tables.story_sentences[0][key]=key==='english'?'A key was found.':'changed';
    if(key==='turkish')snapshot.tables.sentence_translations[0].text='changed';
    if(key==='id'){snapshot.tables.sentence_words[0].sentence_id='changed';snapshot.tables.sentence_translations[0].sentence_id='changed';}
    const packet=planLegacyQuestionRepair(catalog,snapshot);assert.equal(packet.drafts.length,0);assert.equal(packet.blockers.length,1);
  }
});
test('never replaces published questions or invents missing shipped questions',()=>{
  const {catalog,snapshot}=fixture();snapshot.tables.story_questions=[{...catalog.stories[0].questions[0],position:1,revision_id:revision}];
  assert.equal(planLegacyQuestionRepair(catalog,snapshot).drafts.length,0);
  snapshot.tables.story_questions=[];delete catalog.stories[0].questions;
  assert.equal(planLegacyQuestionRepair(catalog,snapshot).blockers.length,1);
});
test('missing revision concurrency guard is refused',()=>{
  const {catalog,snapshot}=fixture();delete snapshot.tables.story_revisions[0].edit_version;
  assert.throws(()=>planLegacyQuestionRepair(catalog,snapshot),/Missing edit_version/);
});
