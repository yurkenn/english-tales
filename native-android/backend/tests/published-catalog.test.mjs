import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {convertSnapshot} from '../../../tooling/import_published_catalog.mjs';
import {bundledDocuments,compareDocuments,publishedDocuments} from '../tools/content-audit-lib.mjs';
import {verifyBundleMedia} from '../tools/audit-content.mjs';
const langs=['tr','es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th'];
const revision='11111111-1111-4111-a111-111111111111';
function fixture(){
 const previous={schemaVersion:1,tags:[],stories:[{id:'tale',sentences:[]}],words:[{id:'bank',word:'bank',translation:'banka'}]};
 const snapshot={format:1,project:'gtuangjukckpuerczfxd',createdAt:'2026-10-28T00:00:00Z',tables:{
  stories:[{id:'tale',current_revision_id:revision,created_at:'2026-10-01T00:00:00Z'}],
  story_revisions:[{id:revision,story_id:'tale',title:'Tale',author:'Author',level:'A1',genre:'Macera',description:'Kıyı',published_at:'2026-10-27T00:00:00Z'}],
  story_sentences:[{revision_id:revision,id:'line',position:1,english:'The bank was quiet.',turkish:'Kıyı sessizdi.'}],
  revision_words:[{revision_id:revision,id:'bank',word:'bank',translation:'kıyı',pronunciation:'/bæŋk/',example:'The bank was quiet.'}],
  revision_tags:[],sentence_words:[{revision_id:revision,sentence_id:'line',word_id:'bank'}],content_assets:[],
  sentence_translations:langs.map(lang=>({revision_id:revision,sentence_id:'line',lang,text:'Kıyı sessizdi.'})),
  word_translations:langs.map(lang=>({revision_id:revision,word_id:'bank',lang,translation:'kıyı'})),
  revision_texts:langs.map(lang=>({revision_id:revision,lang,description:'Kıyı'}))}};
 return {previous,snapshot,covers:new Map([['tale',{key:'cover_tale',asset:{}}]])};
}
test('snapshot conversion preserves saved dictionary meaning, editorial meaning, links, revision and original archive',()=>{
 const {previous,snapshot,covers}=fixture(),original=structuredClone(previous);
 const converted=convertSnapshot(snapshot,previous,covers);
 assert.equal(converted.words[0].translation,'banka');
 const [story]=bundledDocuments(converted);
 assert.equal(story.words[0].translation,'kıyı');assert.equal(story.revisionId,revision);
 assert.deepEqual(story.links,[{sentence_id:'line',word_id:'bank'}]);
 assert.deepEqual(converted.legacyCatalog,original);assert.deepEqual(previous,original);
 assert.deepEqual(convertSnapshot(snapshot,converted,covers),converted);
});
test('conversion refuses incomplete translations, drafts and wrong projects',()=>{
 for(const mutate of [s=>s.tables.sentence_translations.pop(),s=>s.tables.story_revisions[0].published_at=null,s=>s.project='staging',s=>delete s.tables.revision_tags,s=>s.tables.revision_tags.push({revision_id:revision,tag_id:'unknown'}),s=>{for(const name of ['sentence_translations','word_translations','revision_texts'])for(const row of s.tables[name])if(row.lang==='ar')row.lang='en';}]){
  const {previous,snapshot,covers}=fixture();mutate(snapshot);
  assert.throws(()=>convertSnapshot(snapshot,previous,covers));
 }
});
test('parity refuses identical text under a different immutable revision ID',()=>{
 const {previous,snapshot,covers}=fixture();
 const docs=bundledDocuments(convertSnapshot(snapshot,previous,covers));
 assert.equal(compareDocuments(docs,publishedDocuments(snapshot)).equal,true);
 docs[0].revisionId='22222222-2222-4222-a222-222222222222';
 const result=compareDocuments(docs,publishedDocuments(snapshot));
 assert.equal(result.equal,false);assert.equal(result.summary.revisionDifferences,1);
});
test('every shipped published cover is physically verified and forged cover checksums fail',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v2.json',import.meta.url)));
 assert.equal(catalog.schemaVersion,2);assert.equal(catalog.stories.length,67);
 await verifyBundleMedia(catalog);
 catalog.stories[0].coverAsset.resourceSha256='0'.repeat(64);
 await assert.rejects(verifyBundleMedia(catalog),/checksum mismatch/);
});
test('published WebP provenance rejects a forged original hash and unsafe source paths',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v2.json',import.meta.url)));
 const story=catalog.stories.find(s=>s.coverAsset.source?.startsWith('art/published-covers/'));
 assert.ok(story);
 const original=story.coverAsset.sha256;
 story.coverAsset.sha256='0'.repeat(64);
 await assert.rejects(verifyBundleMedia(catalog),/provenance mismatch/);
 story.coverAsset.sha256=original;
 story.coverAsset.source='../outside.webp';
 await assert.rejects(verifyBundleMedia(catalog),/Unsafe cover source/);
});
