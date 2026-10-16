import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {backupPublicContent} from '../../../tooling/backup_public_content.mjs';
import {exportCatalog} from '../tools/export-catalog.mjs';
import {auditSnapshot,publishedDocuments,compareDocuments,bundledDocuments} from '../tools/content-audit-lib.mjs';
import {generateDrafts} from '../tools/content-drafts-lib.mjs';
import {catalogFixture,snapshotFixture} from './fixtures/content-drafts.mjs';

const bytes=Buffer.from('local cover fixture');
const settings={SUPABASE_URL:'https://gtuangjukckpuerczfxd.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fake'};
const now=()=>new Date('2026-10-16T12:00:00Z');
async function fixture(){
  const catalog=catalogFixture();catalog.stories[0].questions=[{id:'q1',kind:'main',prompt:'Who sleeps?',options:['The hare.','The dog.'],answer:0}];
  const {manifest}=await exportCatalog(catalog,{readCover:async()=>bytes});
  return {catalog,manifest,snapshot:snapshotFixture(catalog,manifest)};
}
function fakeFetch(tables,{missing=[],failure,mutate,page,corrupt=false}={}){
  const calls=[];let storyReads=0;
  const fetchImpl=async(input,options)=>{
    const url=new URL(input);calls.push(url);
    assert.equal(url.origin,settings.SUPABASE_URL);assert.deepEqual(options.headers,{apikey:settings.SUPABASE_PUBLISHABLE_KEY});
    assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
    if(url.pathname.startsWith('/storage/'))return new Response(corrupt?'broken':bytes);
    const table=url.pathname.split('/').at(-1);
    if(failure?.table===table)return new Response(JSON.stringify({code:failure.code}),{status:failure.status});
    if(missing.includes(table))return new Response(JSON.stringify({code:'PGRST205'}),{status:404});
    assert.equal(url.searchParams.get('select'),'*');assert.equal(url.searchParams.get('limit'),'500');
    const offset=Number(url.searchParams.get('offset'));
    if(table==='stories'&&offset===0)storyReads++;
    const rows=page?.(table,offset)??(mutate&&table==='stories'&&storyReads>1?mutate(tables.stories):tables[table]);
    assert.ok(rows,table);
    return Response.json(page?rows:rows.slice(offset,offset+500));
  };
  return {fetchImpl,calls};
}
async function temporary(fn){const parent=await mkdtemp(path.join(tmpdir(),'content-backup-'));try{return await fn(parent);}finally{await rm(parent,{recursive:true,force:true});}}

test('anonymous snapshot collects all ten tables and verifies media; audit and draft tools use actual translations/questions',async()=>temporary(async parent=>{
  const {catalog,manifest,snapshot}=await fixture(),fake=fakeFetch(snapshot.tables);
  const {directory,snapshot:result}=await backupPublicContent({settings,parent,now,...fake});
  assert.equal(Object.keys(result.tables).length,10);assert.deepEqual(result.tables,snapshot.tables);
  assert.deepEqual(JSON.parse(await readFile(path.join(directory,'catalog.json'),'utf8')),result);
  assert.deepEqual(await readFile(path.join(directory,'media',result.tables.content_assets[0].id)),bytes);
  assert.equal(auditSnapshot(result).summary.errors,0);
  assert.equal(compareDocuments(bundledDocuments(catalog),publishedDocuments(result)).equal,true);
  result.tables.story_questions[0].answer=1;result.tables.revision_texts[0].description='Changed';
  const packet=generateDrafts(catalog,result,manifest);assert.equal(packet.drafts.length,1);
  assert.equal(packet.drafts[0].changes.questionChanges.length,1);assert.ok(packet.drafts[0].changes.translationChanges.length);
  for(const [table,order] of Object.entries({sentence_translations:'revision_id,sentence_id,lang',word_translations:'revision_id,word_id,lang',revision_texts:'revision_id,lang',story_questions:'revision_id,position'}))
    assert.equal(fake.calls.find(u=>u.pathname.endsWith('/'+table)).searchParams.get('order'),order);
}));

test('pre-migration six-table snapshot omits unavailable extensions and remains readable by audit/drafts',async()=>temporary(async parent=>{
  const {catalog,manifest,snapshot}=await fixture();
  const missing=['sentence_translations','word_translations','revision_texts','story_questions'];
  const {snapshot:result}=await backupPublicContent({settings,parent,now,...fakeFetch(snapshot.tables,{missing})});
  assert.equal(Object.keys(result.tables).length,6);assert.equal(auditSnapshot(result).translations.tr.complete,true);
  const packet=generateDrafts(catalog,result,manifest);assert.equal(packet.drafts.length,1);
  assert.deepEqual(packet.drafts[0].save.args.p_document.questions,catalog.stories[0].questions);
  delete catalog.stories[0].questions;assert.equal(generateDrafts(catalog,result,manifest).drafts.length,0);
}));

test('snapshot paginates every extension with deterministic composite ordering and enforces the row limit',async()=>{
  const {snapshot}=await fixture(),extensions=['sentence_translations','word_translations','revision_texts','story_questions'];
  await temporary(async parent=>{
    const fake=fakeFetch(snapshot.tables,{page:(table,offset)=>extensions.includes(table)?Array.from({length:offset===0?500:1},(_,i)=>({fixture:i+offset})):snapshot.tables[table]});
    const {snapshot:result}=await backupPublicContent({settings,parent,now,...fake});
    for(const table of extensions){assert.equal(result.tables[table].length,501);assert.ok(fake.calls.some(u=>u.pathname.endsWith('/'+table)&&u.searchParams.get('offset')==='500'));}
  });
  await temporary(async parent=>{
    const fake=fakeFetch(snapshot.tables,{page:(table)=>table==='story_questions'?Array(500).fill({id:'limit'}):snapshot.tables[table]});
    await assert.rejects(backupPublicContent({settings,parent,now,...fake}),/row limit/);
  });
});

test('snapshot never hides permission, network, malformed-page or partial-migration errors as empty extensions',async()=>{
  const {snapshot}=await fixture();
  for(const options of [{missing:['word_translations']},{failure:{table:'story_questions',status:403,code:'42501'}},{failure:{table:'story_questions',status:500,code:'unexpected'}},{page:(table)=>table==='story_questions'?{}:snapshot.tables[table]}])
    await temporary(async parent=>{await assert.rejects(backupPublicContent({settings,parent,now,...fakeFetch(snapshot.tables,options)}),/Incomplete|Backup read failed|Invalid catalog page/);});
  await temporary(async parent=>{await assert.rejects(backupPublicContent({settings,parent,now,fetchImpl:async()=>{throw Error('Network unavailable');}}),/Network unavailable/);});
});

test('snapshot rejects checksum failure and catalog drift without writing a completed catalog',async()=>{
  const {snapshot}=await fixture();
  for(const [options,pattern] of [[{corrupt:true},/checksum/],[{mutate:stories=>stories.map(s=>({...s,current_revision_id:'changed'}))},/Catalog changed/]])
    await temporary(async parent=>{
      await assert.rejects(backupPublicContent({settings,parent,now,...fakeFetch(snapshot.tables,options)}),pattern);
      await assert.rejects(access(path.join(parent,now().toISOString().replaceAll(':','-'),'catalog.json')));
    });
});
