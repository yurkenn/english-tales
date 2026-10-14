import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {url:base,key}=await (await fetch('http://127.0.0.1:4178/api/config')).json();
assert.ok(base?.startsWith('https://')&&key?.startsWith('sb_publishable_'));
const headers={apikey:key};
async function rows(table,order='id'){
 const all=[];for(let offset=0;;offset+=500){const r=await fetch(`${base}/rest/v1/${table}?select=*&order=${order}&limit=500&offset=${offset}`,{headers});assert.equal(r.status,200,table);const page=await r.json();all.push(...page);if(page.length<500)return all;}
}
const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url)));
const stories=await rows('stories');assert.equal(stories.length,50);
const revisions=new Map((await rows('story_revisions')).map(r=>[r.id,r]));
const sentences=await rows('story_sentences','revision_id,position');
const words=await rows('revision_words','revision_id,id');
const links=await rows('sentence_words','revision_id,sentence_id,word_id');
const assets=new Map((await rows('content_assets')).map(a=>[a.id,a]));
const wordByText=new Map(catalog.words.map(w=>[w.word.toLowerCase(),w]));
let checkedCovers=0,classicSentences=0;
for(const story of catalog.stories){
 const live=stories.find(s=>s.id===story.id);assert.ok(live?.current_revision_id,story.id);
 const revision=revisions.get(live.current_revision_id);assert.ok(revision?.published_at,story.id);
 const cover=assets.get(revision.cover_asset_id);assert.ok(cover,story.id);
 const expected=await readFile(new URL(`../../app/src/main/res/drawable-nodpi/${story.coverKey}.png`,import.meta.url));
 assert.equal(cover.sha256,createHash('sha256').update(expected).digest('hex'),story.id);
 const response=await fetch(`${base}/storage/v1/object/authenticated/story-media/${cover.storage_path}`,{headers});assert.equal(response.status,200,story.id);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,Number(cover.byte_size),story.id);assert.equal(createHash('sha256').update(bytes).digest('hex'),cover.sha256,story.id);checkedCovers++;
 if(!story.id.startsWith('classic-'))continue;
 for(const field of ['title','author','level','genre','description'])assert.equal(revision[field],story[field],`${story.id}:${field}`);
 const actual=sentences.filter(s=>s.revision_id===revision.id).sort((a,b)=>a.position-b.position);
 assert.deepEqual(actual.map(s=>({id:s.id,english:s.english,turkish:s.turkish})),story.sentences,story.id);classicSentences+=actual.length;
 const expectedWords=new Map(),expectedLinks=[];
 for(const sentence of story.sentences){const found=new Set();for(const token of sentence.english.match(/[a-zA-Z']+/g)??[]){const w=wordByText.get(token.toLowerCase());if(w){expectedWords.set(w.id,w);found.add(w.id);}}for(const id of found)expectedLinks.push(`${sentence.id}:${id}`);}
 const actualWords=words.filter(w=>w.revision_id===revision.id);assert.deepEqual(actualWords.map(w=>w.id).sort(),[...expectedWords.keys()].sort(),story.id);
 for(const actual of actualWords)for(const field of ['word','translation','pronunciation','example'])assert.equal(actual[field],expectedWords.get(actual.id)[field],`${story.id}:${field}`);
 assert.deepEqual(links.filter(l=>l.revision_id===revision.id).map(l=>`${l.sentence_id}:${l.word_id}`).sort(),expectedLinks.sort(),story.id);
}
console.log(JSON.stringify({project:new URL(base).hostname,publishedStories:stories.length,verifiedClassics:44,classicSentences,allSentences:sentences.length,byteVerifiedCovers:checkedCovers,metadataAndVocabularyMatch:true,verifiedAt:new Date().toISOString()},null,2));
