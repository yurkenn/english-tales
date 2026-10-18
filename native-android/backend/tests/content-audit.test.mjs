import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {auditCatalog,auditSnapshot,bundledDocuments,publishedDocuments,compareDocuments,acceptance,levelProfile} from '../tools/content-audit-lib.mjs';
import {verifySnapshotMedia,revisionProposals,renderReport} from '../tools/audit-content.mjs';

const assetId='11111111-1111-4111-a111-111111111111';
const revisionId='22222222-2222-4222-a222-222222222222';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const word=(id,value=id)=>({id,word:value,translation:`anlam-${id}`,pronunciation:'/test/',example:`We say ${value} today.`});
const catalog=()=>({schemaVersion:1,words:[word('picked-up','picked up')],stories:[{id:'story',title:'A story',author:'Author',level:'A1',genre:'Macera',description:'A short story',coverKey:'cover',sentences:[{id:'s1',english:'She picked-up the bag.',turkish:'Çantayı aldı.'}]}]});
function snapshot(bundle=catalog()){
  const d=bundledDocuments(bundle)[0];
  return {format:1,project:'test-project',createdAt:'2026-10-15T00:00:00Z',scope:'Public content',tables:{
    stories:[{id:d.id,current_revision_id:revisionId,is_archived:false}],
    story_revisions:[{...Object.fromEntries(['title','author','level','genre','description'].map(k=>[k,d[k]])),id:revisionId,story_id:d.id,cover_asset_id:assetId,published_at:'2026-10-15T00:00:00Z'}],
    story_sentences:d.sentences.map(s=>({...s,revision_id:revisionId})),revision_words:d.words.map(w=>({...w,revision_id:revisionId})),
    sentence_words:d.links.map(l=>({...l,revision_id:revisionId})),
    content_assets:[{id:assetId,kind:'cover',mime_type:'image/png',storage_path:'covers/test.png',sha256:hash('cover'),byte_size:5}],
  }};
}

test('per-language completeness counts every revision and all three translation kinds without changing default gates',()=>{
  const c=catalog();c.stories.push({...structuredClone(c.stories[0]),id:'second'});
  c.stories[0].sentences[0].translations={'es-419':'Texto'};
  const bundle=auditCatalog(c);
  assert.deepEqual(bundle.translations.tr,{missingSentences:0,missingWords:0,missingDescriptions:0,complete:true});
  assert.deepEqual(bundle.translations['es-419'],{missingSentences:1,missingWords:2,missingDescriptions:2,complete:false});
  assert.equal(acceptance({bundle}).passed,true);
  assert.deepEqual(acceptance({bundle},{requireLang:'es-419'}).failures,['bundle_es-419_translations']);
  assert.equal(acceptance({bundle},{requireLang:'tr'}).passed,true);
  assert.equal(acceptance({bundle},{requireLang:'de'}).passed,false);
  assert.throws(()=>acceptance({bundle},{requireLang:'en-us'}),/Geçersiz/);
});

test('snapshot translation tables are authoritative while old snapshots retain the legacy Turkish fallback',()=>{
  const s=snapshot();assert.equal(auditSnapshot(s).translations.tr.complete,true);
  s.tables.sentence_translations=[];s.tables.word_translations=[];s.tables.revision_texts=[];
  let report=auditSnapshot(s);
  assert.deepEqual(report.translations.tr,{missingSentences:1,missingWords:1,missingDescriptions:1,complete:false});
  for(const lang of ['tr','es-419']){
    s.tables.sentence_translations.push({revision_id:revisionId,sentence_id:'s1',lang,text:s.tables.story_sentences[0].turkish});
    s.tables.word_translations.push({revision_id:revisionId,word_id:'picked-up',lang,translation:s.tables.revision_words[0].translation});
    s.tables.revision_texts.push({revision_id:revisionId,lang,description:s.tables.story_revisions[0].description});
  }
  report=auditSnapshot(s);assert.equal(report.translations.tr.complete,true);assert.equal(report.translations['es-419'].complete,true);
  s.tables.sentence_translations.find(t=>t.lang==='tr').text='Mismatch';
  assert.equal(auditSnapshot(s).translations.tr.missingSentences,1);
  delete s.tables.word_translations;assert.throws(()=>auditSnapshot(s),/Snapshot table missing: word_translations/);
});

test('audit CLI require-lang reports counts then fails for partial or absent languages and accepts complete Turkish',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'english-tales-audit-lang-'));
  const tool=new URL('../tools/audit-content.mjs',import.meta.url);
  const fixture=path.join(dir,'bundle.json');
  // Keep the missing-language case independent of the languages shipped in the real catalog.
  const script=`import {main} from ${JSON.stringify(tool.href)}; await main(process.argv.slice(1), {bundlePath:${JSON.stringify(fixture)}});`;
  const run=(...args)=>spawnSync(process.execPath,['--input-type=module','-e',script,'--','--output',dir,...args],{encoding:'utf8'});
  try{
    await writeFile(fixture,JSON.stringify(catalog()));
    assert.equal(run('--require-lang','tr').status,0);
    const missing=run('--require-lang','es-419');assert.equal(missing.status,1,missing.stderr);
    let report=JSON.parse(await readFile(path.join(dir,'audit.json')));
    assert.deepEqual(report.bundle.translations['es-419'],{missingSentences:1,missingWords:1,missingDescriptions:1,complete:false});
    assert.match(await readFile(path.join(dir,'report.md'),'utf8'),/Destek dili bütünlüğü/);
    const s=snapshot();s.tables.sentence_translations=[{revision_id:revisionId,sentence_id:'s1',lang:'es-419',text:'Texto'}];s.tables.word_translations=[];s.tables.revision_texts=[];
    const file=path.join(dir,'catalog.json');await writeFile(file,JSON.stringify(s));
    assert.equal(run('--snapshot',file,'--skip-media','--require-lang','es-419').status,1);
    report=JSON.parse(await readFile(path.join(dir,'audit.json')));
    assert.deepEqual(report.live.translations['es-419'],{missingSentences:0,missingWords:1,missingDescriptions:1,complete:false});
    assert.ok(report.acceptance.failures.includes('live_es-419_translations'));
    const invalid=run('--require-lang','en-us');assert.equal(invalid.status,1);assert.match(invalid.stderr,/Geçersiz/);
    assert.equal(run('--require-lang').status,1);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('phrase coverage counts actual consumed tokens and never stems or matches substrings',()=>{
  const c=catalog();c.words.push(word('up'),word('cat'),word('pick'));
  const report=auditCatalog(c);
  assert.equal(report.summary.uniqueTypes,5);assert.equal(report.summary.coveredTypes,2);
  assert.equal(report.summary.coveredTokens,2);assert.equal(report.summary.tokens,5);
  assert.equal(report.summary.typeCoveragePercent,40);
  assert.deepEqual(report.unusedDictionaryIds,['up','cat','pick']);
  assert.deepEqual(report.backlog.map(r=>r.token).sort(),['bag','she','the']);
});

test('live coverage follows actual links rather than pretending every dictionary occurrence is selectable',()=>{
  const s=snapshot();s.tables.revision_words.push({...word('up'),revision_id:revisionId});
  s.tables.sentence_words=[{revision_id:revisionId,sentence_id:'s1',word_id:'up'}];
  const report=auditSnapshot(s);
  assert.equal(report.summary.coveredTokens,1);assert.equal(report.summary.typeCoveragePercent,20);
  assert.equal(report.summary.errors,0);
  assert.ok(report.issues.some(i=>i.code==='unlinked_occurrence_review'&&i.wordId==='picked-up'));
});

test('missing translations, duplicate IDs, broken order and absent linked words are structural errors',()=>{
  const s=snapshot();s.tables.story_sentences[0].turkish=' ';
  s.tables.story_sentences[0].position=2;
  s.tables.revision_words.push({...word('cat'),revision_id:revisionId});
  s.tables.sentence_words.push({revision_id:revisionId,sentence_id:'s1',word_id:'cat'},
    {revision_id:revisionId,sentence_id:'missing',word_id:'cat'});
  s.tables.story_sentences.push({...s.tables.story_sentences[0]});
  const report=auditSnapshot(s),codes=new Set(report.issues.map(i=>i.code));
  for(const code of ['missing_translation','duplicate_sentence_id','non_contiguous_position','word_absent_from_linked_sentence','dangling_link'])assert.ok(codes.has(code),code);
  assert.equal(acceptance({bundle:auditCatalog(catalog()),live:report}).passed,false);
});

test('only active current revisions contribute; archives and previously published revisions do not inflate counts',()=>{
  const s=snapshot();
  s.tables.story_revisions.push({...s.tables.story_revisions[0],id:'old'});
  s.tables.story_sentences.push({...s.tables.story_sentences[0],revision_id:'old',english:'Old text must not count.'});
  s.tables.stories.push({id:'archived',current_revision_id:'old',is_archived:true},{id:'draft',current_revision_id:null,is_archived:false});
  const report=auditSnapshot(s);
  assert.equal(report.summary.stories,1);assert.equal(report.summary.sentences,1);
  assert.equal(report.snapshot.sourceTableCounts.story_sentences,2);
  assert.equal(compareDocuments(bundledDocuments(catalog()),publishedDocuments(s)).equal,true);
});

test('an unavailable or mismatched current revision fails instead of being silently dropped',()=>{
  const s=snapshot();s.tables.stories[0].current_revision_id='absent';
  assert.ok(auditSnapshot(s).issues.some(i=>i.code==='missing_current_revision'));
  const wrong=snapshot();wrong.tables.story_revisions[0].story_id='other';
  assert.ok(auditSnapshot(wrong).issues.some(i=>i.code==='wrong_revision_owner'));
});

test('parity detects metadata, bilingual text, vocabulary meaning, links and missing stories separately',()=>{
  const c=catalog(),s=snapshot(c);
  s.tables.story_revisions[0].title='Changed title';s.tables.story_sentences[0].turkish='Başka çeviri';
  s.tables.revision_words[0].translation='değişen anlam';s.tables.sentence_words=[];
  const diff=compareDocuments(bundledDocuments(c),publishedDocuments(s));
  assert.equal(diff.equal,false);const d=diff.differingStories[0];
  assert.deepEqual(d.metadataFields,['title']);assert.deepEqual(d.modifiedSentences[0].fields,['turkish']);
  assert.deepEqual(d.modifiedWords[0].fields,['translation']);assert.equal(d.missingLinks.length,1);
  assert.deepEqual(compareDocuments(bundledDocuments(c),[]).missingStoryIds,['story']);
  assert.deepEqual(compareDocuments([],publishedDocuments(s)).extraStoryIds,['story']);
});

test('parity compares cover hash and size rather than incidental revision or asset identities',()=>{
  const c=catalog(),s=snapshot(c),manifest={assets:[{source:'backend/content/covers/cover.png',sha256:hash('cover'),byteSize:5}]};
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s),{manifest,snapshot:s}).equal,true);
  s.tables.content_assets[0].sha256=hash('changed');
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s),{manifest,snapshot:s}).differingStories[0].coverMismatch,true);
});

test('missing cover rows and incomplete download metadata are structural errors',()=>{
  const missing=snapshot();missing.tables.content_assets=[];
  assert.ok(auditSnapshot(missing).issues.some(i=>i.code==='missing_media_asset'));
  for(const change of [{storage_path:''},{mime_type:'text/plain'},{byte_size:'NaN'},{sha256:'bad'}]){
    const s=snapshot();Object.assign(s.tables.content_assets[0],change);
    assert.ok(auditSnapshot(s).issues.some(i=>i.code==='invalid_media_asset'));
  }
});

test('coverage and parity release gates are explicit and cannot pass on a missing level or missing snapshot',()=>{
  const c=catalog();c.stories.push({...c.stories[0],id:'a2-story',level:'A2'});
  const bundle=auditCatalog(c);
  assert.equal(acceptance({bundle}).passed,true);
  assert.equal(acceptance({bundle},{minCoverage:40}).passed,true);
  assert.deepEqual(acceptance({bundle},{minCoverage:60}).failures,['bundle_A1_coverage','bundle_A2_coverage']);
  assert.ok(acceptance({bundle},{requireParity:true}).failures.includes('bundle_live_parity'));
  assert.ok(acceptance({bundle:auditCatalog(catalog())},{minCoverage:0}).failures.includes('bundle_A2_coverage'));
  assert.throws(()=>acceptance({bundle},{minCoverage:NaN}),/threshold/);
});

test('missing metadata remains an actionable report and does not crash backlog aggregation',()=>{
  for(const value of [undefined,'__proto__','invalid']){
    const c=catalog();c.stories[0].level=value;
    const report=auditCatalog(c);
    assert.ok(report.summary.errors>0);assert.ok(report.levels.unknown);
  }
  assert.throws(()=>auditSnapshot({format:2}),/Unsupported/);
});

test('review proposals preserve identities and source sentences without inventing a writable revision',()=>{
  const c=catalog(),s=snapshot(c);s.tables.sentence_words=[];
  const docs=bundledDocuments(c),diff=compareDocuments(docs,publishedDocuments(s));
  const packet=revisionProposals(docs,diff);
  assert.equal(packet.proposals.length,1);const p=packet.proposals[0];
  assert.equal(p.baseLiveRevisionId,revisionId);assert.equal(p.draftRevisionId,null);
  assert.equal(p.sentences[0].english,c.stories[0].sentences[0].english);
  assert.deepEqual(p.words.map(w=>w.id),['picked-up']);assert.equal(p.links.length,1);
});

test('media verification reads bytes and fails on tampering or unsafe IDs',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'english-tales-audit-'));
  try{
    await mkdir(path.join(dir,'media'));await writeFile(path.join(dir,'media',assetId),'cover');
    const s=snapshot();assert.deepEqual(await verifySnapshotMedia(s,path.join(dir,'catalog.json')),{status:'verified',assets:1});
    await writeFile(path.join(dir,'media',assetId),'other');
    await assert.rejects(verifySnapshotMedia(s,path.join(dir,'catalog.json')),/checksum/);
    s.tables.story_revisions[0].cover_asset_id='../secret';
    await assert.rejects(verifySnapshotMedia(s,path.join(dir,'catalog.json')),/Invalid media ID/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('CLI writes inspectable reports before rejecting an unmet coverage gate and rejects partial strict checks',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'english-tales-audit-cli-'));
  const tool=new URL('../tools/audit-content.mjs',import.meta.url);
  try{
    const run=spawnSync(process.execPath,[tool.pathname,'--output',dir,'--min-coverage','100'],{encoding:'utf8'});
    assert.equal(run.status,1,run.stderr);
    const report=JSON.parse(await readFile(path.join(dir,'audit.json')));
    assert.equal(report.acceptance.passed,false);assert.match(await readFile(path.join(dir,'report.md'),'utf8'),/≥ %60/);
    assert.deepEqual(JSON.parse(await readFile(path.join(dir,'revision-proposals.json'))).proposals,[]);
    const invalid=spawnSync(process.execPath,[tool.pathname,'--require-parity'],{encoding:'utf8'});
    assert.equal(invalid.status,1);assert.match(invalid.stderr,/requires --snapshot/);
    assert.match(renderReport(report),/Anlamsal|anlamsal/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('tag parity compares the tag set and ignores snapshots taken before tags existed',()=>{
  const c=catalog();c.stories[0].tags=['masal','macera'];
  const s=snapshot(c);s.tables.revision_tags=[{revision_id:revisionId,tag_id:'macera'},{revision_id:revisionId,tag_id:'masal'}];
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s)).equal,true,'order does not matter');
  s.tables.revision_tags.pop();
  const d=compareDocuments(bundledDocuments(c),publishedDocuments(s));
  assert.equal(d.equal,false);assert.deepEqual(d.differingStories[0].tagChanges,[{expected:['macera','masal'],actual:['macera']}]);
  assert.equal(d.summary.tagDifferences,1);
  delete s.tables.revision_tags;
  assert.equal(compareDocuments(bundledDocuments(c),publishedDocuments(s)).equal,true,'unknown live tags are not drift');
});

test('level profile flags a story that is unusually hard for its own level and checks level order',()=>{
  const story=(id,level,sentences)=>({id,level,sentences:sentences.map((english,i)=>({id:`${id}-${i}`,english}))});
  const plain=['The cat sat.','The dog ran.','A cat and a dog.'];
  const docs=[1,2,3,4].map(i=>story(`a1-${i}`,'A1',plain))
    .concat([story('a1-long','A1',['The cat that the old dog saw near the red house by the river sat on the mat all day long.',...plain])])
    .concat([1,2,3,4].map(i=>story(`a2-${i}`,'A2',['The small cat sat on the warm mat today.','The brown dog ran to the old park quickly.'])));
  const profile=levelProfile(docs,{band:5});
  assert.equal(profile.levels.A1.stories,5);assert.equal(profile.levels.A2.stories,4);
  assert.equal(profile.levels.A1.meanSentenceTokens.median,3.7);
  const long=profile.outliers.filter(o=>o.storyId==='a1-long').map(o=>o.metric);
  assert.ok(long.includes('longestSentenceTokens')&&long.includes('meanSentenceTokens'),JSON.stringify(profile.outliers));
  assert.ok(profile.outliers.every(o=>o.storyId==='a1-long'));
  // Too few B1 stories: medians are reported but no limit is invented.
  assert.equal(levelProfile([...docs,story('b1','B1',plain)]).levels.B1.meanSentenceTokens.limit,null);
  // A2 reads longer than A1 here, so sentence length is in order; a B1 story shorter than A2 is reported.
  assert.ok(!profile.orderIssues.some(i=>i.metric==='meanSentenceTokens'));
  const reversed=levelProfile([...docs,...[1,2,3,4].map(i=>story(`b1-${i}`,'B1',['Go.','Stop.']))]);
  assert.ok(reversed.orderIssues.some(i=>i.metric==='meanSentenceTokens'&&i.lower==='A2'&&i.upper==='B1'));
});
test('the bundled catalog audit carries a level profile for every level',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url)));
  const profile=auditCatalog(catalog).levelProfile;
  for(const level of ['A1','A2','B1'])assert.ok(profile.levels[level].stories>=4&&profile.levels[level].meanSentenceTokens.limit>0);
  assert.equal(profile.stories.length,catalog.stories.length);
  assert.ok(profile.levels.A1.meanSentenceTokens.median<profile.levels.B1.meanSentenceTokens.median);
});
