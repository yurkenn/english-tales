import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bundledDocuments,publishedDocuments,compareDocuments} from './content-audit-lib.mjs';
const {url:base,key}=await (await fetch('http://127.0.0.1:4178/api/config')).json();
assert.ok(base?.startsWith('https://')&&key?.startsWith('sb_publishable_'));
const headers={apikey:key};
async function rows(table,order='id'){
 const all=[];for(let offset=0;;offset+=500){const r=await fetch(`${base}/rest/v1/${table}?select=*&order=${order}&limit=500&offset=${offset}`,{headers});assert.equal(r.status,200,table);const page=await r.json();all.push(...page);if(page.length<500)return all;}
}
const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url)));
const tables={stories:await rows('stories'),story_revisions:await rows('story_revisions'),story_sentences:await rows('story_sentences','revision_id,position'),
 revision_words:await rows('revision_words','revision_id,id'),sentence_words:await rows('sentence_words','revision_id,sentence_id,word_id'),content_assets:await rows('content_assets')};
assert.equal(tables.stories.length,catalog.stories.length);
const live=publishedDocuments({format:1,tables});
const assets=new Map(tables.content_assets.map(a=>[a.id,a]));
let checkedCovers=0;
for(const story of catalog.stories){
 const revision=live.find(d=>d.id===story.id);assert.ok(revision?.published_at,story.id);
 const cover=assets.get(revision.cover_asset_id);assert.ok(cover,story.id);
 const expected=await readFile(new URL(`../content/covers/${story.coverKey}.png`,import.meta.url));
 assert.equal(cover.sha256,createHash('sha256').update(expected).digest('hex'),story.id);
 const response=await fetch(`${base}/storage/v1/object/authenticated/story-media/${cover.storage_path}`,{headers});assert.equal(response.status,200,story.id);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,Number(cover.byte_size),story.id);assert.equal(createHash('sha256').update(bytes).digest('hex'),cover.sha256,story.id);checkedCovers++;
}
// Same phrase rule as the app and the exporter: metadata, text, vocabulary and links of every current revision equal the bundle.
const comparison=compareDocuments(bundledDocuments(catalog),live);
assert.ok(comparison.equal,`Live differs from the bundle: ${comparison.differingStories.map(d=>d.storyId).join(', ')||[...comparison.missingStoryIds,...comparison.extraStoryIds].join(', ')}`);
console.log(JSON.stringify({project:new URL(base).hostname,publishedStories:live.length,parity:true,sentences:live.reduce((n,d)=>n+d.sentences.length,0),
 vocabularyEntries:live.reduce((n,d)=>n+d.words.length,0),byteVerifiedCovers:checkedCovers,verifiedAt:new Date().toISOString()},null,2));
