import {test,before,after,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {planRevisions,applyPlan,digest} from '../tools/revision-sync-lib.mjs';
import {bundledDocuments,publishedDocuments,compareDocuments} from '../tools/content-audit-lib.mjs';

const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url),'utf8'));
const publisher='11111111-1111-4111-8111-111111111111';
const editor='22222222-2222-4222-8222-222222222222';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
let db;
async function as(user,sql,params=[]){
  await db.exec('savepoint request');
  try{
    await db.exec('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
    const result=await db.query(sql,params);
    await db.exec('reset role; release savepoint request');
    return result.rows;
  }catch(error){await db.exec('rollback to savepoint request; release savepoint request; reset role');throw error;}
}
const types={admin_create_draft:{p_story_id:'text',p_source_id:'uuid'},admin_save_draft:{p_revision_id:'uuid',p_expected_version:'integer',p_document:'jsonb'},
  admin_publish:{p_revision_id:'uuid',p_expected_version:'integer'}};
const rpcAs=user=>async(name,args)=>{
  const entries=Object.entries(types[name]);
  const sql=`select public.${name}(${entries.map(([key,type],i)=>`${key}=>$${i+1}::${type}`).join(',')}) as result`;
  return (await as(user,sql,entries.map(([key,type])=>type==='jsonb'?JSON.stringify(args[key]):args[key])))[0].result;
};
async function snapshot(){
  const tables={};
  for(const table of ['stories','story_revisions','story_sentences','revision_words','sentence_words','content_assets'])
    tables[table]=(await db.query(`select * from public.${table}`)).rows.map(row=>JSON.parse(JSON.stringify(row)));
  return {format:1,project:'test',createdAt:new Date().toISOString(),tables};
}
const tokens=text=>new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]));
/** Bundle with one extra dictionary word whose token occurs in exactly one story, so live lags the bundle there only. */
function driftedCatalog(){
  const known=new Set(catalog.words.flatMap(w=>[...tokens(w.word)]));
  const owners=new Map();
  for(const story of catalog.stories)for(const token of new Set(story.sentences.flatMap(s=>[...tokens(s.english)])))
    if(!known.has(token)&&/^[a-z]{4,}$/.test(token))owners.set(token,[...(owners.get(token)??[]),story.id]);
  const [token,[storyId]]=[...owners].find(([,ids])=>ids.length===1);
  const word={id:`test-${token}`,word:token,translation:'deneme',pronunciation:'test',example:`A ${token} example.`};
  return {catalog:{...catalog,words:[...catalog.words,word]},storyId,word};
}

before(async()=>{
  db=new PGlite();await db.waitReady;
  await db.exec(await read('./platform-fixture.sql'));
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(directory)).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
  await db.exec(await read('../supabase/seed.sql'));
  await db.exec(`insert into private.content_staff values('${publisher}','publisher'),('${editor}','editor');
    insert into storage.objects(bucket_id,name) select 'story-media',storage_path from public.content_assets; begin;`);
  for(const row of (await db.query('select id from public.story_revisions')).rows)await as(publisher,'select public.publish_story_revision($1)',[row.id]);
  await db.exec('commit');
});
beforeEach(async()=>{await db.exec('begin');});
afterEach(async()=>{await db.exec('rollback; reset role');});
after(async()=>{await db?.close();});

test('the seeded live catalog already matches the bundle, so nothing is planned',async()=>{
  const plan=planRevisions(catalog,await snapshot());
  assert.deepEqual(plan.stories,[]);assert.deepEqual(plan.blocked,[]);
});

test('a plan changes only the vocabulary of the lagging story and keeps live text, metadata and media',async()=>{
  const {catalog:drifted,storyId,word}=driftedCatalog(),live=await snapshot();
  const plan=planRevisions(drifted,live);
  assert.deepEqual(plan.stories.map(p=>p.storyId),[storyId]);
  const [item]=plan.stories,base=publishedDocuments(live).find(d=>d.id===storyId);
  assert.deepEqual(item.changes.addedWordIds,[word.id]);assert.deepEqual(item.changes.removedWordIds,[]);assert.ok(item.changes.addedLinks>=1);
  assert.equal(item.baseRevisionId,base.revisionId);assert.equal(item.document.cover_asset_id,base.cover_asset_id);
  assert.deepEqual(item.document.sentences,base.sentences.map(({id,english,turkish})=>({id,english,turkish})));
  assert.deepEqual(planRevisions(drifted,live,{stories:[catalog.stories.find(s=>s.id!==storyId).id]}).stories,[]);
  assert.throws(()=>planRevisions(drifted,live,{stories:['missing-story']}),/not both bundled and published/);
});

test('changed text is blocked for editors instead of being copied from the bundle',async()=>{
  const live=await snapshot(),story=catalog.stories[0];
  const edited={...catalog,stories:catalog.stories.map(s=>s.id===story.id?{...s,sentences:s.sentences.map((x,i)=>i?x:{...x,turkish:`${x.turkish} (yeni)`})}:s)};
  const plan=planRevisions(edited,live);
  assert.deepEqual(plan.stories,[]);assert.deepEqual(plan.blocked,[{storyId:story.id,reasons:['sentences']}]);
});

test('drafts are prepared by an editor, re-runs are idempotent and publishing restores parity',async()=>{
  const {catalog:drifted,storyId}=driftedCatalog();
  const plan=planRevisions(drifted,await snapshot());
  const first=await applyPlan(plan,rpcAs(editor));
  assert.deepEqual(first.summary,{prepared:1,published:0,staleBase:0,conflicts:0});
  assert.equal(first.results[0].status,'prepared');
  const live=await snapshot();
  assert.equal(compareDocuments(bundledDocuments(drifted),publishedDocuments(live)).differingStories[0].storyId,storyId,'draft is not live yet');
  await assert.rejects(applyPlan(plan,rpcAs(editor),{publish:true}),/publisher_required/);
  const second=await applyPlan(plan,rpcAs(publisher),{publish:true});
  assert.equal(second.results[0].status,'published');assert.equal(second.results[0].draftRevisionId,first.results[0].draftRevisionId);
  const after=compareDocuments(bundledDocuments(drifted),publishedDocuments(await snapshot()));
  assert.equal(after.equal,true);
  const current=publishedDocuments(await snapshot()).find(d=>d.id===storyId);
  assert.equal(current.revisionId,second.results[0].publishedRevisionId);assert.equal(digest(current),plan.stories[0].documentDigest);
});

test('an edited draft or a moved live revision is left untouched',async()=>{
  const {catalog:drifted,storyId}=driftedCatalog();
  const plan=planRevisions(drifted,await snapshot()),[item]=plan.stories;
  const draft=await rpcAs(editor)('admin_create_draft',{p_story_id:storyId,p_source_id:item.baseRevisionId});
  await as(editor,"update public.story_revisions set title='Editörün başlığı' where id=$1",[draft.id]);
  const conflict=await applyPlan(plan,rpcAs(publisher),{publish:true});
  assert.equal(conflict.results[0].status,'existing_draft_conflict');assert.equal(conflict.summary.published,0);
  assert.equal((await db.query('select title,published_at from public.story_revisions where id=$1',[draft.id])).rows[0].title,'Editörün başlığı');
  const version=(await db.query('select edit_version from public.story_revisions where id=$1',[draft.id])).rows[0].edit_version;
  await rpcAs(publisher)('admin_publish',{p_revision_id:draft.id,p_expected_version:version});
  const stale=await applyPlan(plan,rpcAs(publisher),{publish:true});
  assert.equal(stale.results[0].status,'stale_base');assert.equal(stale.summary.published,0);
  const tampered={...plan,stories:[{...item,document:{...item.document,title:'Changed'}}]};
  await assert.rejects(applyPlan(tampered,rpcAs(publisher)),/modified/);
});
