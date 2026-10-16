import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {occurs} from '../admin/workflow.js';
const read=p=>readFile(new URL(p,import.meta.url));
const catalog=JSON.parse(await read('../../app/src/main/assets/catalog/v1.json'));
const sources=JSON.parse(await read('../content/classic-sources.json'));
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const hash=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const tokens=s=>new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]);
const legacyIds=['quiet-morning','paper-boat','lost-map','red-umbrella','last-train','attic-letter'];
// Comprehension questions (Q5.3) are added content; the legacy text, IDs and links must stay identical.
const legacy=catalog.stories.filter(s=>legacyIds.includes(s.id)).map(({questions,...story})=>story);
test('classic expansion preserves legacy texts, IDs, original vocabulary and inferred word links',()=>{
 assert.equal(hash(legacy),'ce53ac56dd089ab7db8a489596ea52755c0f6765c71b4b7dc3a3755bee5262be');
 assert.equal(hash(catalog.words.slice(0,39)),'d045b636ec9f046daa618fc847e510078e9982a32749c8581d978558ddc18c76');
 const oldTokens=tokens(legacy.flatMap(s=>s.sentences.map(x=>x.english)).join(' '));
 const legacySentences=legacy.flatMap(s=>s.sentences.map(x=>x.english));
 for(const word of catalog.words.slice(39)) assert.ok(!oldTokens.has(word.word.toLowerCase())&&!legacySentences.some(x=>occurs(x,word.word)),`New word changes legacy links: ${word.word}`);
});
test('the reviewed classic package is complete, bilingual, level-balanced and traceable',()=>{
 assert.equal(catalog.schemaVersion,1);assert.equal(catalog.stories.length,50);assert.equal(catalog.words.length,359);
 assert.equal(catalog.stories.reduce((n,s)=>n+s.sentences.length,0),1002);assert.equal(sources.stories.length,44);
 assert.equal(new Set(catalog.words.map(w=>w.id)).size,catalog.words.length);
 assert.equal(new Set(catalog.words.map(w=>w.word.toLowerCase())).size,catalog.words.length);
 assert.equal(new Set(catalog.stories.map(s=>s.id)).size,50);
 for(const [level,count] of Object.entries({A1:18,A2:18,B1:14})) assert.equal(catalog.stories.filter(s=>s.level===level).length,count);
 for(const source of sources.stories){
  const story=catalog.stories.find(s=>s.id===source.storyId);assert.ok(story);
  assert.ok(story.description.includes('kısa uyarlama'));assert.ok(story.description.includes('Türkçe çeviri: English Tales'));assert.notEqual(story.author,'English Tales');
  assert.ok(['www.gutenberg.org','en.wikisource.org'].includes(new URL(source.sourceTextUrl).hostname));assert.match(source.sourceChapterSha256??source.sourcePageTextSha256,/^[a-f0-9]{64}$/);
  for(const author of [...source.authors,...(source.englishTranslator?[source.englishTranslator]:[])])assert.ok(author.deathYear<1956);
  const limits=story.level==='A1'?[12,18]:story.level==='A2'?[20,30]:[28,40];assert.ok(story.sentences.length>=limits[0]&&story.sentences.length<=limits[1]);
  assert.equal(new Set(story.sentences.map(s=>s.id)).size,story.sentences.length);
  for(const sentence of story.sentences){assert.ok(sentence.english.trim());assert.ok(sentence.turkish.trim());assert.ok(sentence.id.startsWith('cl-'));}
  const all=tokens(story.sentences.map(s=>s.english).join(' '));assert.ok(catalog.words.filter(w=>all.has(w.word.toLowerCase())).length>=6,story.id);
 }
 // New vocabulary examples must demonstrate the exact selectable token (no implicit lemmatization).
 for(const word of catalog.words.slice(39)){assert.ok(word.translation.trim());assert.ok(word.pronunciation.trim());assert.ok(occurs(word.example,word.word),word.id);}
});
test('classics have verified PNGs, historical provenance, cover mappings and matching upload checksums',async()=>{
 const manifest=JSON.parse(await read('../supabase/asset-upload-manifest.json'));
 const coverCode=String(await read('../../app/src/main/java/com/yurken/englishtales/ui/BookCover.kt'));const seen=new Set();
 for(const source of sources.stories){
  const key=source.cover.key,bytes=await read(`../content/covers/${key}.png`);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(16)<=4096);assert.ok(bytes.readUInt32BE(20)>0&&bytes.readUInt32BE(20)<=4096);assert.ok(bytes.length<6*1024*1024);
  const digest=createHash('sha256').update(bytes).digest('hex');if(seen.has(digest)) assert.equal(source.cover.kind,'Historical collection title page');seen.add(digest);
  if(source.cover.kind.startsWith('Historical')) {assert.match(source.cover.sourceSha256,/^[a-f0-9]{64}$/);assert.equal(source.cover.assetSha256,digest);assert.ok(source.cover.illustrator.deathYear<1956);assert.ok(source.cover.sourceImageUrl.startsWith('https://'));assert.ok(source.cover.sourcePageUrl.startsWith('https://'));}
  const asset=manifest.assets.find(a=>a.source.endsWith(`/${key}.png`));assert.ok(asset);assert.equal(asset.sha256,digest);assert.equal(asset.byteSize,bytes.length);
  assert.ok(coverCode.includes(`"${key}" -> R.drawable.${key}`));
 }
});
test('vocabulary density pilot: five A1 classics reach at least 13 selectable words with exact-token examples',()=>{
 const pilot={'classic-tortoise-hare':16,'classic-lion-mouse':15,'classic-fox-grapes':14,'classic-dog-shadow':13,'classic-boy-cried-wolf':19};
 const known=new Set(catalog.words.map(w=>w.word.toLowerCase()));
 for(const [id,count] of Object.entries(pilot)){
  const story=catalog.stories.find(s=>s.id===id);assert.equal(story.level,'A1');
  const covered=[...tokens(story.sentences.map(s=>s.english).join(' '))].filter(t=>known.has(t));
  assert.equal(covered.length,count,id);
 }
 // Pilot words are appended after the classic package; earlier IDs keep their positions.
 assert.deepEqual(catalog.words.slice(316).map(w=>w.id).slice(0,3),['road','laughs','slow']);
});
test('pilot phrases are multi-word entries that occur in their A1 stories and win over single words',()=>{
 const phrases=catalog.words.filter(w=>w.word.includes(' '));
 assert.deepEqual(phrases.map(w=>w.id),['wakes-up','falls-asleep','step-by-step','at-last','again-and-again','one-day']);
 const story=id=>catalog.stories.find(s=>s.id===id).sentences.map(s=>s.english);
 for(const [id,phrase] of [['classic-tortoise-hare','step by step'],['classic-tortoise-hare','wakes up'],['classic-fox-grapes','again and again'],['classic-fox-grapes','at last'],['classic-lion-mouse','one day']])
  assert.ok(story(id).some(x=>occurs(x,phrase)),`${phrase} in ${id}`);
});
test('every story cover ships as a small WebP while the PNG source stays outside the APK',async()=>{
 for(const story of catalog.stories){
  const webp=await read(`../../app/src/main/res/drawable-nodpi/${story.coverKey}.webp`);
  assert.equal(webp.subarray(0,4).toString(),'RIFF',story.coverKey);assert.equal(webp.subarray(8,12).toString(),'WEBP',story.coverKey);
  assert.ok(webp.length<300*1024,`${story.coverKey} is ${webp.length} bytes`);
  await assert.rejects(read(`../../app/src/main/res/drawable-nodpi/${story.coverKey}.png`),story.coverKey);
  assert.ok((await read(`../content/covers/${story.coverKey}.png`)).length>0,story.coverKey);
 }
});
