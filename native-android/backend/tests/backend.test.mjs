import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url),'utf8'));
const publisher='11111111-1111-4111-8111-111111111111';
const editor='22222222-2222-4222-8222-222222222222';
const alice='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bob='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const installation=randomUUID();
const stableId=value=>{const h=createHash('sha256').update(`english-tales:${value}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const revision=stableId('quiet-morning:revision:1');
let db, clock;
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
async function as(role,user,sql,params=[]) {
  assert.ok(['anon','authenticated'].includes(role));
  await db.exec('savepoint request');
  try {
    await db.exec(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user??'']);
    const result=await db.query(sql,params);
    await db.exec('reset role; release savepoint request');
    return result.rows;
  } catch(error) {
    await db.exec('rollback to savepoint request; release savepoint request; reset role');
    throw error;
  }
}
const user=(id,sql,params)=>as('authenticated',id,sql,params);
const anon=(sql,params)=>as('anon',null,sql,params);
async function rpc(id,name,payload) {return (await user(id,`select public.${name}($1::jsonb) as result`,[JSON.stringify(payload)]))[0].result;}
const iso=(days=0,seconds=0)=>new Date(clock+days*86400000+seconds*1000).toISOString();
const session=(extra={})=>({id:randomUUID(),installationId:installation,kind:'choice',storyRevisionId:revision,startedAt:iso(0,-60),finishedAt:iso(),activeSeconds:30,correctAnswers:4,questionCount:5,studyTimezone:'UTC',...extra});
const word=(extra={})=>({id:randomUUID(),installationId:installation,storyRevisionId:revision,wordId:'quiet',action:'save',occurredAt:iso(),studyTimezone:'UTC',...extra});
const progress=(extra={})=>({id:randomUUID(),installationId:installation,storyRevisionId:revision,sentenceId:'qm-1',percent:0,occurredAt:iso(),...extra});
async function draft() {
  const id=randomUUID();
  await db.query(`insert into public.story_revisions(id,story_id,revision,title,author,level,genre,description,cover_asset_id)
    select $1,story_id,2,title,author,level,genre,description,cover_asset_id from public.story_revisions where id=$2`,[id,revision]);
  for(const [table,columns] of [['story_sentences','id,position,english,turkish'],['revision_words','id,word,translation,pronunciation,example'],['sentence_words','sentence_id,word_id']])
    await db.query(`insert into public.${table}(revision_id,${columns}) select $1,${columns} from public.${table} where revision_id=$2`,[id,revision]);
  return id;
}
before(async()=>{
  db=new PGlite(); await db.waitReady;
  await db.exec(await read('./platform-fixture.sql'));
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(directory)).sort()) await db.exec(await readFile(new URL(name,directory),'utf8'));
  await db.exec(await read('../supabase/seed.sql'));
  await db.exec(`insert into private.content_staff values('${publisher}','publisher'),('${editor}','editor');
    insert into storage.objects(bucket_id,name) select 'story-media',storage_path from public.content_assets; begin;`);
  const revisions=(await db.query('select id from public.story_revisions')).rows;
  for(const row of revisions) await user(publisher,'select public.publish_story_revision($1)',[row.id]);
  await db.exec('commit');
});
beforeEach(async()=>{await db.exec('begin');clock=Date.parse((await db.query('select now() as clock')).rows[0].clock);});
afterEach(async()=>{await db.exec('rollback; reset role');});
after(async()=>{await db?.close();});

test('account deletion authorization requires own live session created within five minutes',async()=>{
  const own=randomUUID(),foreign=randomUUID(),expired=randomUUID(),old=randomUUID();
  await db.query(`insert into auth.sessions(id,user_id,created_at,not_after) values ($1,$2,now(),null),($3,$4,now(),null),($5,$2,now(),now()-interval '1 minute'),($6,$2,now()-interval '6 minutes',null)`,[own,alice,foreign,bob,expired,old]);
  const allowed=async(id)=>{await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({session_id:id})]);return (await user(alice,'select public.authorize_account_deletion() allowed'))[0].allowed;};
  assert.equal(await allowed(own),true);
  for(const id of [foreign,expired,old,randomUUID(),'invalid']) assert.equal(await allowed(id),false);
  await assert.rejects(anon('select public.authorize_account_deletion()'));
  await db.query('delete from auth.sessions where id=$1',[own]);assert.equal(await allowed(own),false);
});

test('anonymous Auth users cannot authorize account deletion even with a fresh session',async()=>{
  const id=randomUUID();await db.query('update auth.users set is_anonymous=true where id=$1',[alice]);
  await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[id,alice]);
  await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({session_id:id})]);
  assert.equal((await user(alice,'select public.authorize_account_deletion() allowed'))[0].allowed,false);
});

test('learning snapshot is read-only, invoker scoped and rejects anonymous callers',async()=>{
  const before=(await db.query('select count(*)::int n from public.learning_profiles')).rows[0].n;
  const snapshot=(await user(alice,'select public.get_learning_snapshot() result'))[0].result;
  assert.equal(snapshot.userId,alice);
  assert.equal(snapshot.schemaVersion,1);
  assert.equal(snapshot.profile,null);
  assert.deepEqual(snapshot.sessions,[]);
  assert.deepEqual(snapshot.words,[]);
  assert.deepEqual(snapshot.progress,[]);
  assert.equal((await db.query('select count(*)::int n from public.learning_profiles')).rows[0].n,before);
  await assert.rejects(anon('select public.get_learning_snapshot()'),/permission denied/);
  await assert.rejects(user(null,'select public.get_learning_snapshot()'),/authentication_required/);
  const fn=(await db.query("select prosecdef,provolatile,proconfig from pg_proc where oid='public.get_learning_snapshot()'::regprocedure")).rows[0];
  assert.equal(fn.prosecdef,false);
  assert.equal(fn.provolatile,'s');
});

test('snapshot includes acknowledged sessions, word tombstones, revisions and badges without leaking another account',async()=>{
  const operation=session();
  await rpc(alice,'submit_learning_session',operation);
  await rpc(alice,'apply_word_event',word());
  const removal=word({action:'remove',occurredAt:iso(0,1)});
  await rpc(alice,'apply_word_event',removal);
  await rpc(alice,'apply_progress_event',progress({percent:25}));
  await rpc(bob,'submit_learning_session',session({correctAnswers:1}));
  const snapshot=(await user(alice,'select public.get_learning_snapshot() result'))[0].result;
  assert.equal(snapshot.sessions.length,1);
  assert.equal(snapshot.sessions[0].id,operation.id);
  assert.equal(snapshot.sessions[0].points,20);
  assert.equal(snapshot.words.length,1);
  assert.equal(snapshot.words[0].saved,false);
  assert.equal(snapshot.words[0].last_event_id,removal.id);
  assert.equal(snapshot.words[0].source_revision_id,revision);
  assert.equal(snapshot.progress[0].percent,25);
  assert.equal(snapshot.progress[0].revision_id,revision);
  assert.ok(snapshot.badges.some(b=>b.badge_id==='first_practice'));
  assert.equal(snapshot.profile.preferences_version,1);
  assert.ok(!JSON.stringify(snapshot).includes(bob));
  assert.ok(!('user_id' in snapshot.words[0]));
  assert.ok(!('payload' in snapshot.sessions[0]));
});

test('snapshot refuses excessive history instead of returning a partial deletion baseline',async()=>{
  await rpc(alice,'submit_learning_session',session());
  await db.query(`insert into public.learning_sessions
    select user_id,gen_random_uuid(),installation_id,kind,revision_id,story_id,started_at,finished_at,
      active_seconds,correct_answers,question_count,study_day,study_timezone,counted,points,payload,received_at
    from public.learning_sessions cross join generate_series(1,10000) where user_id=$1`,[alice]);
  await assert.rejects(user(alice,'select public.get_learning_snapshot()'),/learning_snapshot_too_large/);
  const bobSnapshot=(await user(bob,'select public.get_learning_snapshot() result'))[0].result;
  assert.deepEqual(bobSnapshot.sessions,[]);
});

test('the exported catalog publishes every bundled story and sentence with repeatable stable IDs',async()=>{
  assert.equal((await anon('select * from public.stories')).length,catalog.stories.length);
  assert.equal((await anon('select * from public.story_sentences')).length,catalog.stories.reduce((sum,story)=>sum+story.sentences.length,0));
  const seed=await read('../supabase/seed.sql');
  await db.exec(seed.replace(/^begin;$/m,'').replace(/^commit;$/m,'')); // Keep the test transaction isolated.
  assert.equal((await db.query('select count(*)::int as n from public.story_revisions')).rows[0].n,catalog.stories.length);
  assert.equal((await anon('select * from storage.objects')).length,new Set(JSON.parse(await read('../supabase/asset-upload-manifest.json')).assets.map(a=>a.path)).size);
});
test('draft metadata, sentences, words and media are hidden from readers',async()=>{
  const id=await draft();
  for(const table of ['story_revisions','story_sentences','revision_words','sentence_words']) {
    const key=table==='story_revisions'?'id':'revision_id';
    assert.equal((await anon(`select * from public.${table} where ${key}=$1`,[id])).length,0);
    assert.equal((await user(alice,`select * from public.${table} where ${key}=$1`,[id])).length,0);
    assert.ok((await user(editor,`select * from public.${table} where ${key}=$1`,[id])).length>0);
  }
  const asset=randomUUID();
  await db.query("insert into public.content_assets(id,kind,storage_path,sha256,byte_size,mime_type) values($1,'cover','draft.png',repeat('a',64),1,'image/png')",[asset]);
  await db.exec("insert into storage.objects(bucket_id,name) values('story-media','draft.png')");
  assert.equal((await anon("select * from storage.objects where name='draft.png'")).length,0);
});
test('ordinary users cannot edit content, grant staff roles or publish; editors cannot publish',async()=>{
  const id=await draft();
  await assert.rejects(user(alice,"insert into public.stories(id) values('injected')"),/row-level security/);
  await assert.rejects(user(alice,"insert into private.content_staff values($1,'publisher')",[alice]),/permission denied/);
  await assert.rejects(user(editor,'select public.publish_story_revision($1)',[id]),/publisher_required/);
  await assert.rejects(user(alice,'select public.publish_story_revision($1)',[id]),/publisher_required/);
  await assert.rejects(user(editor,'update public.stories set current_revision_id=$1 where id=\'quiet-morning\'',[id]),/permission denied/);
  await assert.rejects(anon('select public.publish_story_revision($1)',[id]),/permission denied/);
  await db.query('update auth.users set raw_user_meta_data=$1::jsonb where id=$2',[JSON.stringify({role:'publisher'}),alice]);
  await assert.rejects(user(alice,'select public.publish_story_revision($1)',[id]),/publisher_required/);
  await assert.rejects(user(editor,'update public.story_revisions set published_at=now() where id=$1',[id]),/permission denied/);
});
test('publication rejects missing translations, ordering gaps and missing uploads without switching the live revision',async()=>{
  const id=await draft();
  await user(editor,"update public.story_sentences set turkish='' where revision_id=$1 and position=1",[id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/sentences_incomplete/);
  await user(editor,"update public.story_sentences set turkish='Kontrol' where revision_id=$1 and position=1",[id]);
  await user(editor,'update public.story_sentences set position=20 where revision_id=$1 and position=9',[id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/sentences_incomplete/);
  await user(editor,'update public.story_sentences set position=9 where revision_id=$1 and position=20',[id]);
  await user(editor,'update public.story_revisions set cover_asset_id=null where id=$1',[id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/cover_upload_required/);
  const missingUpload=randomUUID();
  await db.query("insert into public.content_assets(id,kind,storage_path,sha256,byte_size,mime_type) values($1,'cover','missing-file.png',repeat('c',64),1,'image/png')",[missingUpload]);
  await user(editor,'update public.story_revisions set cover_asset_id=$1 where id=$2',[missingUpload,id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/cover_upload_required/);
  assert.equal((await anon("select current_revision_id from public.stories where id='quiet-morning'"))[0].current_revision_id,revision);
});
test('published text cannot change and draft identities cannot move between stories',async()=>{
  const id=await draft();
  assert.equal((await user(editor,"update public.story_sentences set english='changed' where revision_id=$1 returning *",[revision])).length,0);
  for (const [sql,params,error] of [
    ["update public.story_sentences set english='changed' where revision_id=$1",[revision],/published_revision_is_immutable/],
    ['update public.story_revisions set revision=3 where id=$1',[id],/revision_identity_is_immutable/],
    ["update public.story_revisions set story_id='paper-boat' where id=$1",[id],/revision_identity_is_immutable/],
    ['delete from public.story_revisions where id=$1',[revision],/published_revision_is_immutable/],
  ]) {
    await db.exec('savepoint owner_request');
    await assert.rejects(db.query(sql,params),error);
    await db.exec('rollback to savepoint owner_request; release savepoint owner_request');
  }
});
test('editors cannot replace or delete published storage objects',async()=>{
  const path=(await db.query('select storage_path from public.content_assets limit 1')).rows[0].storage_path;
  assert.equal((await user(editor,'delete from storage.objects where name=$1 returning *',[path])).length,0);
  assert.equal((await user(editor,"update storage.objects set metadata='{}' where name=$1 returning *",[path])).length,0);
  const asset=(await db.query('select id from public.content_assets where storage_path=$1',[path])).rows[0].id;
  assert.equal((await user(editor,"update public.content_assets set sha256=repeat('b',64) where id=$1 returning *",[asset])).length,0);
});
test('publishing a new revision preserves the old text and archive hides the story',async()=>{
  const id=await draft();
  await user(editor,"update public.story_sentences set english='It was a quiet morning in a new town.' where revision_id=$1 and position=1",[id]);
  await user(publisher,'select public.publish_story_revision($1)',[id]);
  assert.equal((await anon("select current_revision_id from public.stories where id='quiet-morning'"))[0].current_revision_id,id);
  assert.equal((await anon('select english from public.story_sentences where revision_id=$1 and position=1',[revision]))[0].english,'It was a quiet morning in a small town.');
  await user(publisher,"select public.set_story_archived('quiet-morning',true)");
  assert.equal((await anon("select * from public.stories where id='quiet-morning'")).length,0);
  assert.equal((await anon('select * from public.story_sentences where revision_id=$1',[revision])).length,0);
});
test('a repeated session is counted once and reusing its ID with another payload fails',async()=>{
  const event=session();
  assert.equal((await rpc(alice,'submit_learning_session',event)).applied,true);
  const repeated=await rpc(alice,'submit_learning_session',event);
  assert.equal(repeated.applied,false);assert.equal(repeated.summary.points,20);assert.equal(repeated.summary.todaySessions,1);
  await assert.rejects(rpc(alice,'submit_learning_session',{...event,correctAnswers:5}),/operation_id_payload_conflict/);
});
test('two reading completions of the same story on the same day count as one step',async()=>{
  const first=session({kind:'reading',correctAnswers:0,questionCount:0});
  await rpc(alice,'submit_learning_session',first);
  const second=await rpc(alice,'submit_learning_session',{...first,id:randomUUID(),installationId:randomUUID()});
  assert.equal(second.counted,false);assert.equal(second.summary.todaySessions,1);assert.equal(second.summary.points,0);
  assert.equal((await user(alice,'select * from public.user_badges')).length,1);
});
test('users cannot read each other\'s learning data or directly edit reward tables',async()=>{
  await rpc(alice,'submit_learning_session',session());
  await rpc(alice,'apply_word_event',word());
  await rpc(alice,'apply_progress_event',progress());
  for(const table of ['learning_profiles','learning_sessions','word_events','user_word_state','progress_events','user_story_progress','user_badges']) {
    assert.ok((await user(alice,`select * from public.${table}`)).length>0,table);
    assert.equal((await user(bob,`select * from public.${table}`)).length,0,table);
    await assert.rejects(anon(`select * from public.${table}`),/permission denied/);
  }
  await assert.rejects(user(alice,"update public.learning_sessions set points=25"),/permission denied/);
  await assert.rejects(user(alice,"insert into public.user_badges values($1,'seven_day_streak',now())",[alice]),/permission denied/);
  await assert.rejects(rpc(alice,'submit_learning_session',session({user_id:bob})),/invalid_session_payload/);
});
test('an authenticated database role without a user identity cannot access learning records',async()=>{
  await rpc(alice,'submit_learning_session',session());
  assert.equal((await user(null,'select * from public.learning_sessions')).length,0);
  await assert.rejects(user(null,'select public.get_learning_summary()'),/authentication_required/);
  await assert.rejects(rpc(null,'submit_learning_session',session()),/authentication_required/);
});
test('all application tables have RLS and privileged functions have a fixed search path and explicit grants',async()=>{
  const tables=(await db.query("select c.relname,c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'")).rows;
  assert.equal(tables.length,23);
  assert.ok(tables.every(t=>t.relrowsecurity));
  const functions=(await db.query("select n.nspname,p.proname,p.proconfig,p.oid,has_function_privilege('anon',p.oid,'execute') as anon_execute,has_function_privilege('authenticated',p.oid,'execute') as user_execute from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.proname in ('publish_story_revision','set_story_archived','save_learning_preferences','submit_learning_session','apply_word_event','apply_progress_event','get_learning_summary','lock_learning_user','learning_summary','unlock_learning_badges','guard_revision_child','guard_revision','guard_asset','bump_revision_version','bump_child_version','content_role','admin_catalog','admin_revision','admin_create_draft','admin_save_draft','admin_publish','admin_history','admin_delete_draft','admin_archive','admin_unused_media','admin_reserve_media_delete','admin_finalize_media_delete','record_content_action','audit_content_change','check_learning_links','guard_revision_media','bump_media_revisions','sync_legacy_translation','guard_turkish_translation','check_revision_translations','save_translation_maps','check_revision_questions')")).rows;
  assert.equal(functions.length,37);
  for(const fn of functions) {
    assert.ok(fn.proconfig?.includes('search_path=""'),fn.proname);
    assert.equal(fn.anon_execute,false,fn.proname);
    assert.equal(fn.user_execute,fn.nspname==='public',fn.proname);
  }
});

const admin=async(id,name,args,types)=>{
  const values=Object.values(args),placeholders=values.map((_,i)=>`$${i+1}${types?.[i]?`::${types[i]}`:''}`).join(',');
  return (await user(id,`select public.${name}(${placeholders}) as result`,values))[0].result;
};
const translationTables=['sentence_translations','word_translations','revision_texts'];
async function extraLanguage(id,lang='es-419'){
  await user(editor,'insert into public.sentence_translations select revision_id,id,$2,turkish from public.story_sentences where revision_id=$1',[id,lang]);
  await user(editor,'insert into public.word_translations select revision_id,id,$2,translation from public.revision_words where revision_id=$1',[id,lang]);
  await user(editor,'insert into public.revision_texts select id,$2,description from public.story_revisions where id=$1',[id,lang]);
}

test('translation migration backfills published history and drafts without changing legacy values or edit versions',async()=>{
  const old=new PGlite();await old.waitReady;
  try{
    await old.exec(await read('./platform-fixture.sql'));
    const directory=new URL('../supabase/migrations/',import.meta.url);
    const names=(await readdir(directory)).sort(),latest='20261016090000_translation_tables.sql';
    for(const name of names.filter(n=>n<latest))await old.exec(await readFile(new URL(name,directory),'utf8'));
    await old.exec(await read('../supabase/seed.sql').then(s=>s.split('\n').filter(line=>!['sentence_translations','word_translations','revision_texts','story_questions','content_tags','tag_names','revision_tags'].some(table=>line.startsWith(`insert into public.${table}`))).join('\n')));
    await old.query('update public.story_revisions set published_at=now() where id=$1',[revision]);
    await old.exec("insert into public.stories(id) values('empty-draft'); insert into public.story_revisions(story_id,revision,level,genre) values('empty-draft',1,'A1','Macera')");
    const legacy=async()=>Promise.all(['story_revisions','story_sentences','revision_words'].map(async table=>(await old.query(`select * from public.${table} order by ${table==='story_revisions'?'id':'revision_id,id'}`)).rows));
    const before=await legacy();
    await old.exec(await readFile(new URL(latest,directory),'utf8'));
    assert.deepEqual(await legacy(),before);
    for(const [table,parent,key,field,target] of [['sentence_translations','story_sentences','s.id','turkish','text'],['word_translations','revision_words','s.id','translation','translation'],['revision_texts','story_revisions','s.id','description','description']]){
      const parentRevision=parent==='story_revisions'?'s.id':'s.revision_id',childKey=table==='revision_texts'?'':` and t.${table==='sentence_translations'?'sentence_id':'word_id'}=${key}`;
      assert.equal((await old.query(`select count(*)::int n from public.${parent} s left join public.${table} t on t.revision_id=${parentRevision}${childKey} and t.lang='tr' where btrim(s.${field})<>'' and t.${target} is distinct from s.${field}`)).rows[0].n,0);
      assert.equal((await old.query(`select count(*)::int n from public.${table}`)).rows[0].n,(await old.query(`select count(*)::int n from public.${parent} where btrim(${field})<>''`)).rows[0].n);
    }
  }finally{await old.close();}
});

test('translation RLS exposes paginated published projections and hides draft and archived rows',async()=>{
  const id=await draft();
  for(const table of translationTables){
    assert.equal((await anon(`select * from public.${table} where revision_id=$1`,[id])).length,0);
    assert.equal((await user(alice,`select * from public.${table} where revision_id=$1`,[id])).length,0);
    assert.ok((await user(editor,`select * from public.${table} where revision_id=$1`,[id])).length>0);
  }
  for(const [table,columns,key] of [['sentence_translations','sentence_id,text','sentence_id'],['word_translations','word_id,translation','word_id'],['revision_texts','revision_id,description','revision_id']]){
    const all=await anon(`select ${columns} from public.${table} where revision_id in ($1,$2) and lang='tr' order by ${key} asc`,[revision,id]);
    const pages=[];
    for(let offset=0;offset<all.length;offset+=2)pages.push(...await anon(`select ${columns} from public.${table} where revision_id in ($1,$2) and lang='tr' order by ${key} asc limit 2 offset $3`,[revision,id,offset]));
    assert.deepEqual(pages,all);assert.ok(all.length>0);
    assert.equal((await anon(`select * from public.${table} where revision_id=$1 and lang='xx'`,[revision])).length,0);
  }
  await user(publisher,"select public.set_story_archived('quiet-morning',true)");
  for(const table of translationTables)assert.equal((await anon(`select * from public.${table} where revision_id=$1`,[revision])).length,0);
});

test('translation writes require staff, validate language and text, freeze publications and advance review versions',async()=>{
  const id=await draft();
  for(const [table,columns,values] of [['sentence_translations','sentence_id,lang,text',"'qm-1','es','Texto'"],['word_translations','word_id,lang,translation',"'quiet','es','Texto'"],['revision_texts','lang,description',"'es','Texto'"]]){
    for(const role of ['anon',alice]){
      const request=(sql,args)=>role==='anon'?anon(sql,args):user(role,sql,args);
      await assert.rejects(request(`insert into public.${table}(revision_id,${columns}) values($1,${values})`,[id]),/permission denied|row-level security/);
      if(role==='anon')for(const sql of [`update public.${table} set lang='xx' where revision_id=$1`,`delete from public.${table} where revision_id=$1`])await assert.rejects(request(sql,[id]),/permission denied/);
      else for(const sql of [`update public.${table} set lang='xx' where revision_id=$1 returning *`,`delete from public.${table} where revision_id=$1 returning *`])assert.deepEqual(await request(sql,[id]),[]);
    }
    const before=(await admin(editor,'admin_revision',{id})).edit_version;
    await user(editor,`insert into public.${table}(revision_id,${columns}) values($1,${values})`,[id]);
    assert.ok((await admin(editor,'admin_revision',{id})).edit_version>before);
    await assert.rejects(admin(publisher,'admin_publish',{id,version:before}),/draft_version_conflict/);
    await db.exec('savepoint frozen_translation');
    await assert.rejects(db.query(`insert into public.${table}(revision_id,${columns}) values($1,${values})`,[revision]),/published_revision_is_immutable/);
    await db.exec('rollback to savepoint frozen_translation; release savepoint frozen_translation');
    for(const sql of [`update public.${table} set lang='es' where revision_id=$1`,`delete from public.${table} where revision_id=$1`]){
      await db.exec('savepoint frozen_translation');
      await assert.rejects(db.query(sql,[revision]),/published_revision_is_immutable/);
      await db.exec('rollback to savepoint frozen_translation; release savepoint frozen_translation');
    }
    for(const lang of ['TR','es-4190','es-419\n','en-us',''])await assert.rejects(user(editor,`insert into public.${table}(revision_id,${columns}) values($1,${values.replace("'es'",'$2')})`,[id,lang]),/check constraint/);
    await assert.rejects(user(editor,`insert into public.${table}(revision_id,${columns}) values($1,${values.replace("'es'","'de'").replace("'Texto'","' '")})`,[id]),/check constraint/);
    await assert.rejects(user(editor,`insert into public.${table}(revision_id,${columns}) values($1,${values.replace("'es'","'de'").replace("'Texto'",'null')})`,[id]),/not-null constraint/);
  }
  await assert.rejects(user(editor,"insert into public.sentence_translations values($1,'missing','es','Texto')",[id]),/foreign key/);
  await assert.rejects(user(editor,"insert into public.word_translations values($1,'missing','es','Texto')",[id]),/foreign key/);
});

test('legacy Turkish edits dual-write all three tables and reject divergent direct Turkish writes',async()=>{
  const id=await draft();
  for(const [parent,key,field,table,target,childKey] of [['story_sentences','id','turkish','sentence_translations','text','sentence_id'],['revision_words','id','translation','word_translations','translation','word_id'],['story_revisions','id','description','revision_texts','description',null]]){
    const rowKey=parent==='story_revisions'?id:parent==='story_sentences'?'qm-1':'quiet';
    const where=parent==='story_revisions'?'id=$1':`revision_id=$1 and ${key}=$2`,params=parent==='story_revisions'?[id]:[id,rowKey];
    await user(editor,`update public.${parent} set ${field}='Yeni Türkçe' where ${where}`,params);
    const childWhere=`revision_id=$1 and lang='tr'${childKey?` and ${childKey}=$2`:''}`;
    assert.equal((await user(editor,`select ${target} value from public.${table} where ${childWhere}`,params))[0].value,'Yeni Türkçe');
    await assert.rejects(user(editor,`update public.${table} set ${target}='Farklı' where ${childWhere}`,params),/turkish_translation_must_match_legacy/);
    await user(editor,`update public.${parent} set ${field}='' where ${where}`,params);
    assert.deepEqual(await user(editor,`select * from public.${table} where ${childWhere}`,params),[]);
    await user(editor,`update public.${parent} set ${field}='Tamamlandı' where ${where}`,params);
    assert.equal((await user(editor,`select ${target} value from public.${table} where ${childWhere}`,params))[0].value,'Tamamlandı');
  }
});

test('both publication paths reject missing Turkish rows and mismatches without changing the current revision',async()=>{
  const id=await draft();
  for(const table of translationTables){
    await user(editor,`delete from public.${table} where revision_id=$1 and lang='tr'`,[id]);
    const d=await admin(editor,'admin_revision',{id});
    await assert.rejects(admin(publisher,'admin_publish',{id,version:d.edit_version}),/revision_translations_incomplete: lang=tr/);
    await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/revision_translations_incomplete: lang=tr/);
    if(table==='sentence_translations')await db.query("insert into public.sentence_translations select revision_id,id,'tr',turkish from public.story_sentences where revision_id=$1",[id]);
    if(table==='word_translations')await db.query("insert into public.word_translations select revision_id,id,'tr',translation from public.revision_words where revision_id=$1",[id]);
    if(table==='revision_texts')await db.query("insert into public.revision_texts select id,'tr',description from public.story_revisions where id=$1",[id]);
  }
  for(const [table,trigger,field] of [['sentence_translations','turkish_sentence_translation','text'],['word_translations','turkish_word_translation','translation'],['revision_texts','turkish_revision_text','description']]){
    await db.exec(`savepoint corrupt_translation; alter table public.${table} disable trigger ${trigger}`);
    await db.query(`update public.${table} set ${field}='Corrupt fixture' where revision_id=$1 and lang='tr'`,[id]);
    await db.exec(`alter table public.${table} enable trigger ${trigger}`);
    await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/revision_translations_incomplete: lang=tr/);
    await db.exec('rollback to savepoint corrupt_translation; release savepoint corrupt_translation');
  }
  assert.equal((await anon("select current_revision_id from public.stories where id='quiet-morning'"))[0].current_revision_id,revision);
});

test('a language started in any translation table must be complete before publication',async()=>{
  const id=await draft();
  for(const [table,values] of [['sentence_translations',"$1,'qm-1','es-419','Texto'"],['word_translations',"$1,'quiet','es-419','Texto'"],['revision_texts',"$1,'es-419','Texto'"]]){
    await user(editor,`insert into public.${table} values(${values})`,[id]);
    await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[id]),/revision_translations_incomplete: lang=es-419, sentences=\d+, words=\d+, description=\d+/);
    await user(editor,`delete from public.${table} where revision_id=$1 and lang='es-419'`,[id]);
  }
  await extraLanguage(id);
  const current=await admin(editor,'admin_revision',{id});
  assert.equal(await admin(publisher,'admin_publish',{id,version:current.edit_version}),id);
  for(const table of translationTables)assert.ok((await anon(`select * from public.${table} where revision_id=$1 and lang='es-419'`,[id])).length>0);
});

test('admin maps save atomically, survive legacy clients and cloning, and cascade with deleted entities',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision});
  await extraLanguage(d.id);
  let current=await admin(editor,'admin_revision',{id:d.id});
  assert.ok(current.descriptions['es-419']);assert.ok(current.sentences[0].translations['es-419']);assert.ok(current.words[0].translations['es-419']);
  const oldClient=structuredClone(current);delete oldClient.descriptions;
  for(const row of [...oldClient.sentences,...oldClient.words])delete row.translations;
  oldClient.description='Yeni açıklama';oldClient.sentences[0].turkish='Yeni cümle';oldClient.words[0].translation='Yeni anlam';
  const save=doc=>admin(editor,'admin_save_draft',{id:d.id,version:current.edit_version,document:JSON.stringify(doc)},['uuid','integer','jsonb']);
  const preserved=await save(oldClient);
  assert.equal(preserved.descriptions['es-419'],current.descriptions['es-419']);
  assert.equal(preserved.sentences[0].translations['es-419'],current.sentences[0].translations['es-419']);
  assert.equal(preserved.words[0].translations['es-419'],current.words[0].translations['es-419']);
  assert.equal(preserved.descriptions.tr,oldClient.description);assert.equal(preserved.sentences[0].translations.tr,'Yeni cümle');assert.equal(preserved.words[0].translations.tr,'Yeni anlam');
  current=preserved;
  for(const invalid of [null,[],{es:12},{es:''},{'en-us':'Text'}]){
    const bad=structuredClone(current);bad.sentences[0].translations=invalid;
    await assert.rejects(save(bad),/translation_map_invalid|check constraint/);
    assert.deepEqual(await admin(editor,'admin_revision',{id:d.id}),current);
  }
  const changed=structuredClone(current);changed.sentences[0].translations['es-419']='Revisado';
  changed.descriptions['es-419']='Descripción revisada';changed.words[0].translations['es-419']='Significado revisado';
  current=await save(changed);
  assert.equal(current.sentences[0].translations['es-419'],'Revisado');
  assert.equal(current.descriptions['es-419'],'Descripción revisada');assert.equal(current.words[0].translations['es-419'],'Significado revisado');
  const removed=structuredClone(current);removed.descriptions={};for(const row of [...removed.sentences,...removed.words])row.translations={};
  const cleared=await save(removed);
  assert.deepEqual(cleared.descriptions,{tr:current.description});
  assert.ok([...cleared.sentences,...cleared.words].every(row=>Object.keys(row.translations).join(',')==='tr'));
  const restored=await admin(editor,'admin_save_draft',{id:d.id,version:cleared.edit_version,document:JSON.stringify(current)},['uuid','integer','jsonb']);
  current=restored;
  await admin(publisher,'admin_publish',{id:d.id,version:current.edit_version});
  const clone=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:d.id});
  assert.deepEqual(clone.descriptions,current.descriptions);assert.deepEqual(clone.sentences.map(s=>s.translations),current.sentences.map(s=>s.translations));assert.deepEqual(clone.words.map(w=>w.translations),current.words.map(w=>w.translations));
  await user(editor,"delete from public.story_sentences where revision_id=$1 and id='qm-1'",[clone.id]);
  assert.deepEqual(await user(editor,"select * from public.sentence_translations where revision_id=$1 and sentence_id='qm-1'",[clone.id]),[]);
  await user(editor,"delete from public.revision_words where revision_id=$1 and id='quiet'",[clone.id]);
  assert.deepEqual(await user(editor,"select * from public.word_translations where revision_id=$1 and word_id='quiet'",[clone.id]),[]);
  const latest=await admin(editor,'admin_revision',{id:clone.id});
  await admin(editor,'admin_delete_draft',{id:clone.id,version:latest.edit_version});
  for(const table of translationTables)assert.equal((await db.query(`select * from public.${table} where revision_id=$1`,[clone.id])).rows.length,0);
});
test('admin role and content APIs require a real staff identity',async()=>{
  assert.equal(await admin(publisher,'content_role',{}),'publisher');
  assert.equal(await admin(editor,'content_role',{}),'editor');
  assert.equal(await admin(alice,'content_role',{}),null);
  assert.equal((await admin(editor,'admin_catalog',{offset:0,limit:100})).length,catalog.stories.length);
  for(const name of ['admin_catalog','admin_revision','admin_create_draft','admin_save_draft','admin_publish'])
    assert.equal((await db.query('select has_function_privilege(\'anon\',oid,\'execute\') as allowed from pg_proc where proname=$1',[name])).rows[0].allowed,false);
  await assert.rejects(admin(alice,'admin_catalog',{offset:0,limit:100}),/staff_required/);
  await assert.rejects(admin(alice,'admin_create_draft',{story:'injected',source:null}),/staff_required/);
  await assert.rejects(admin(alice,'admin_revision',{revision}),/staff_required/);
});
test('admin creates one draft and clones immutable published text with stable sentence identities',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision});
  assert.equal(d.revision,2);assert.equal(d.published_at,null);assert.equal(d.sentences[0].id,'qm-1');assert.ok(d.words.length>0);assert.ok(d.links.length>0);
  const same=await admin(publisher,'admin_create_draft',{story:'quiet-morning',source:revision});assert.equal(same.id,d.id);
  const created=await admin(editor,'admin_create_draft',{story:'new-story',source:null});assert.equal(created.sentences.length,0);assert.equal(created.revision,1);
  await assert.rejects(admin(editor,'admin_create_draft',{story:'bad-source',source:revision}),/published_source_required/);
  assert.equal((await db.query("select count(*)::int n from public.stories where id='bad-source'")).rows[0].n,0);
});
test('atomic admin save rolls back every table on invalid links and rejects stale editors',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision});
  const edited={...d,title:'A new title',sentences:[...d.sentences].reverse()};
  for(const invalid of [{...edited,sentences:null},{...edited,title:'x'.repeat(201)},{...edited,words:[{id:'bad',word:'x'.repeat(101)}]}])
    await assert.rejects(admin(editor,'admin_save_draft',{id:d.id,version:d.edit_version,document:JSON.stringify(invalid)},['uuid','integer','jsonb']),/draft_(document|fields)_invalid/);
  const saved=await admin(editor,'admin_save_draft',{id:d.id,version:d.edit_version,document:JSON.stringify(edited)},['uuid','integer','jsonb']);
  assert.equal(saved.title,'A new title');assert.equal(saved.sentences[0].id,edited.sentences[0].id);assert.equal(saved.sentences[0].position,1);assert.ok(saved.edit_version>d.edit_version);
  await assert.rejects(admin(publisher,'admin_save_draft',{id:d.id,version:d.edit_version,document:JSON.stringify(d)},['uuid','integer','jsonb']),/draft_version_conflict/);
  const invalid={...saved,title:'Must not survive',links:[{sentence_id:'missing',word_id:saved.words[0].id}]};
  await assert.rejects(admin(editor,'admin_save_draft',{id:d.id,version:saved.edit_version,document:JSON.stringify(invalid)},['uuid','integer','jsonb']),/foreign key/);
  const after=await admin(editor,'admin_revision',{id:d.id});assert.deepEqual(after,saved);
  await user(editor,"update public.story_sentences set turkish='Başka editör' where revision_id=$1 and position=1",[d.id]);
  await assert.rejects(admin(editor,'admin_save_draft',{id:d.id,version:saved.edit_version,document:JSON.stringify(saved)},['uuid','integer','jsonb']),/draft_version_conflict/);
});
test('admin publication requires the reviewed version and publisher role, preserving historical learning content',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision});
  await assert.rejects(admin(editor,'admin_publish',{id:d.id,version:d.edit_version}),/publisher_required/);
  await user(editor,"update public.story_revisions set title='Reviewed change' where id=$1",[d.id]);
  await assert.rejects(admin(publisher,'admin_publish',{id:d.id,version:d.edit_version}),/draft_version_conflict/);
  const current=await admin(editor,'admin_revision',{id:d.id});
  assert.equal(await admin(publisher,'admin_publish',{id:d.id,version:current.edit_version}),d.id);
  await assert.rejects(admin(editor,'admin_save_draft',{id:d.id,version:current.edit_version,document:JSON.stringify(current)},['uuid','integer','jsonb']),/published_revision_is_immutable/);
  assert.equal((await anon('select english from public.story_sentences where revision_id=$1 and id=\'qm-1\'',[revision]))[0].english,d.sentences[0].english);
});
test('preference versions protect changes made on another device',async()=>{
  await user(alice,'select public.get_learning_summary()');
  await user(alice,"select public.save_learning_preferences(1,'Ada','A2','Macera',3,'Europe/Istanbul')");
  await assert.rejects(user(alice,"select public.save_learning_preferences(1,'Old','A1','Gizem',1,'UTC')"),/preferences_version_conflict/);
  const profile=(await user(alice,'select * from public.learning_profiles'))[0];
  assert.equal(profile.display_name,'Ada');assert.equal(profile.preferences_version,2);
  await assert.rejects(user(alice,"select public.save_learning_preferences(2,'Ada','A2','Macera',3,'Not/AZone')"),/invalid_timezone/);
});
test('scheduled reviews use 1/3/7 day intervals, ignore early repeats and reset after mistakes',async()=>{
  await rpc(alice,'apply_word_event',word({occurredAt:iso(-20)}));
  const answer=(days,seconds=1,correct=true)=>word({action:'review',correct,occurredAt:iso(days,seconds)});
  let result=await rpc(alice,'apply_word_event',answer(-20));assert.equal(result.wordState.interval_days,1);
  result=await rpc(alice,'apply_word_event',answer(-20,30));assert.equal(result.wordState.correct_count,1);
  result=await rpc(alice,'apply_word_event',answer(-19));assert.equal(result.wordState.interval_days,3);
  result=await rpc(alice,'apply_word_event',answer(-16));assert.equal(result.wordState.interval_days,7);assert.equal(result.wordState.learning_state,'known');
  result=await rpc(alice,'apply_word_event',answer(-16,60,false));assert.equal(result.wordState.correct_count,0);assert.equal(result.wordState.learning_state,'learning');
  result=await rpc(alice,'apply_word_event',answer(-16,120));assert.equal(result.wordState.correct_count,0);
  result=await rpc(alice,'apply_word_event',answer(-16,660));assert.equal(result.wordState.correct_count,1);
});
test('late offline saves cannot resurrect a removed word; replayed answers stay idempotent',async()=>{
  const save=word({occurredAt:iso(0,-120)}),review=word({action:'review',correct:true,occurredAt:iso(0,-100)}),remove=word({action:'remove',occurredAt:iso(0,-30)});
  await rpc(alice,'apply_word_event',remove);
  await rpc(alice,'apply_word_event',save);
  let result=await rpc(alice,'apply_word_event',review);assert.equal(result.wordState.saved,false);
  result=await rpc(alice,'apply_word_event',review);assert.equal(result.applied,false);assert.equal(result.wordState.saved,false);
  result=await rpc(alice,'apply_word_event',word());assert.equal(result.wordState.saved,true);assert.equal(result.wordState.correct_count,0);
});
test('late progress preserves the latest cursor and greatest percent, and sentence references are validated',async()=>{
  const latest=progress({sentenceId:'qm-8',percent:88});
  await rpc(alice,'apply_progress_event',latest);
  let result=await rpc(alice,'apply_progress_event',progress({sentenceId:'qm-2',percent:11,occurredAt:iso(0,-120)}));
  assert.equal(result.progress.last_sentence_id,'qm-8');assert.equal(result.progress.percent,88);
  assert.equal((await rpc(alice,'apply_progress_event',latest)).applied,false);
  await assert.rejects(rpc(alice,'apply_progress_event',progress({sentenceId:'other-story-sentence'})),/foreign key constraint/);
  assert.equal((await user(alice,'select * from public.progress_events')).length,2);
});
test('invalid times, unsent drafts and impossible scores do not create sessions',async()=>{
  await assert.rejects(rpc(alice,'submit_learning_session',session({finishedAt:iso(1)})),/invalid_session_time/);
  await assert.rejects(rpc(alice,'submit_learning_session',session({activeSeconds:600})),/invalid_session_time/);
  await assert.rejects(rpc(alice,'submit_learning_session',session({correctAnswers:6})),/check constraint/);
  const id=await draft();
  await assert.rejects(rpc(alice,'submit_learning_session',session({storyRevisionId:id})),/published_revision_required/);
  assert.equal((await user(alice,'select * from public.learning_sessions')).length,0);
});
test('historical sessions converge into a real streak; old activity alone is expired',async()=>{
  const at=days=>session({startedAt:iso(days,-60),finishedAt:iso(days)});
  let result=await rpc(alice,'submit_learning_session',at(-3));assert.equal(result.summary.streak,0);
  await rpc(alice,'submit_learning_session',at(-1));
  result=await rpc(alice,'submit_learning_session',at(0));assert.equal(result.summary.streak,2);
  result=await rpc(alice,'submit_learning_session',at(-2));assert.equal(result.summary.streak,4);
  assert.ok((await user(alice,"select * from public.user_badges where badge_id='three_day_streak'")).length);
});
test('account deletion cascades learning records while keeping published content',async()=>{
  await rpc(alice,'submit_learning_session',session());await rpc(alice,'apply_word_event',word());await rpc(alice,'apply_progress_event',progress());
  await db.query('delete from auth.users where id=$1',[alice]);
  for(const table of ['learning_profiles','learning_sessions','word_events','user_word_state','progress_events','user_story_progress','user_badges'])
    assert.equal((await db.query(`select * from public.${table} where user_id=$1`,[alice])).rows.length,0);
  assert.equal((await anon('select * from public.stories')).length,catalog.stories.length);
});
test('only the server can inventory files for account deletion, including unknown files',async()=>{
  await db.query('update storage.objects set owner=$1,owner_id=$2 where name=(select storage_path from public.content_assets limit 1)',[publisher,publisher]);
  await db.query("insert into storage.objects(bucket_id,name,owner_id) values('story-media','unknown.png',$1)",[publisher]);
  await assert.rejects(user(publisher,'select public.account_owned_media_inventory($1)',[publisher]),/permission denied/);
  await assert.rejects(anon('select public.account_owned_media_inventory($1)',[publisher]),/permission denied/);
  await db.exec('set local role service_role');
  const result=(await db.query('select public.account_owned_media_inventory($1) as media',[publisher])).rows[0].media;
  const other=(await db.query('select public.account_owned_media_inventory($1) as media',[alice])).rows[0].media;
  await db.exec('reset role');
  assert.equal(result.length,2);assert.ok(result.some(row=>row.path==='unknown.png'&&row.assetId===null));assert.deepEqual(other,[]);
});

test('draft deletion is version checked, preserves published content and records the real actor',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision});
  await assert.rejects(admin(alice,'admin_delete_draft',{id:d.id,version:d.edit_version}),/staff_required/);
  await assert.rejects(admin(editor,'admin_delete_draft',{id:revision,version:1}),/published_revision_is_immutable/);
  await assert.rejects(admin(editor,'admin_delete_draft',{id:d.id,version:d.edit_version-1}),/draft_version_conflict/);
  await admin(editor,'admin_delete_draft',{id:d.id,version:d.edit_version});
  assert.equal((await anon("select current_revision_id from public.stories where id='quiet-morning'"))[0].current_revision_id,revision);
  const history=await admin(publisher,'admin_history',{story:'quiet-morning',before:null});
  const deleted=history.find(h=>h.revision_id===d.id&&h.action==='draft_deleted');assert.equal(deleted.actor_id,editor);assert.equal(deleted.actor_role,'editor');
  await assert.rejects(admin(alice,'admin_history',{story:'quiet-morning',before:null}),/staff_required/);
  await assert.rejects(user(editor,'select * from private.content_audit'),/permission denied/);
  const empty=await admin(editor,'admin_create_draft',{story:'disposable-empty',source:null});
  await admin(editor,'admin_delete_draft',{id:empty.id,version:empty.edit_version});
  assert.equal((await db.query("select * from public.stories where id='disposable-empty'")).rows.length,0);
});

test('publication rejects every unlinked word and words absent from their linked sentences',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision});
  await user(editor,"insert into public.revision_words(revision_id,id,word,translation) values($1,'unlinked','moon','ay')",[d.id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[d.id]),/learning_word_unlinked/);
  await user(editor,"insert into public.sentence_words(revision_id,sentence_id,word_id) values($1,'qm-1','unlinked')",[d.id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[d.id]),/learning_word_not_in_sentence/);
  await user(editor,"update public.revision_words set word='!!!' where revision_id=$1 and id='unlinked'",[d.id]);
  await assert.rejects(user(publisher,'select public.publish_story_revision($1)',[d.id]),/learning_word_not_in_sentence/);
});

test('archive rejects a changed current revision without hiding the new publication',async()=>{
  await assert.rejects(admin(publisher,'admin_archive',{story:'quiet-morning',archive:true,current:randomUUID()}),/published_version_conflict/);
  assert.equal((await anon("select is_archived from public.stories where id='quiet-morning'"))[0].is_archived,false);
  await admin(publisher,'admin_archive',{story:'quiet-morning',archive:true,current:revision});
  assert.ok((await admin(editor,'admin_history',{story:'quiet-morning',before:null})).some(h=>h.action==='archived'&&h.actor_id===publisher));
});

test('media deletion reserves unused assets, protects draft attachments and finishes only after storage removal',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'quiet-morning',source:revision}),asset=randomUUID(),path=`test/${asset}`;
  await user(editor,"insert into public.content_assets(id,kind,storage_path,sha256,byte_size,mime_type) values($1,'cover',$2,repeat('f',64),12,'image/png')",[asset,path]);
  await user(editor,"insert into storage.objects(bucket_id,name) values('story-media',$1)",[path]);
  await user(editor,'update public.story_revisions set cover_asset_id=$1 where id=$2',[asset,d.id]);
  await assert.rejects(admin(editor,'admin_reserve_media_delete',{id:asset}),/media_still_referenced/);
  assert.equal((await user(editor,'delete from storage.objects where name=$1 returning *',[path])).length,0);
  const before=(await admin(editor,'admin_revision',{id:d.id})).edit_version;
  await user(editor,'update public.content_assets set byte_size=13 where id=$1',[asset]);
  assert.ok((await admin(editor,'admin_revision',{id:d.id})).edit_version>before);
  await user(editor,'update public.story_revisions set cover_asset_id=null where id=$1',[d.id]);
  assert.ok((await admin(editor,'admin_unused_media',{before:null})).some(a=>a.id===asset));
  assert.equal(await admin(editor,'admin_reserve_media_delete',{id:asset}),path);
  await assert.rejects(user(editor,'update public.story_revisions set cover_asset_id=$1 where id=$2',[asset,d.id]),/media_pending_delete/);
  await assert.rejects(admin(editor,'admin_finalize_media_delete',{id:asset}),/media_object_still_exists/);
  assert.equal((await user(editor,'delete from storage.objects where name=$1 returning *',[path])).length,1);
  await admin(editor,'admin_finalize_media_delete',{id:asset});await admin(editor,'admin_finalize_media_delete',{id:asset});
  assert.equal((await db.query('select * from public.content_assets where id=$1',[asset])).rows.length,0);
});

const question=(extra={})=>({id:'q1',kind:'main',prompt:'What happens?',options:['A quiet morning.','A noisy night.'],answer:0,...extra});
async function putQuestion(id,q=question(),position=1){
  return user(editor,'insert into public.story_questions(revision_id,id,position,kind,prompt,options,answer) values($1,$2,$3,$4,$5,$6,$7)',[id,q.id,position,q.kind,q.prompt,q.options,q.answer]);
}
for(const [name,change] of Object.entries({
  'bad kind':{kind:'vocabulary'},'one option':{options:['Only']},'five options':{options:['a','b','c','d','e']},
  'duplicate options':{options:['YES','yes']},'trimmed duplicate options':{options:['yes',' YES ']},
  'blank option':{options:['a',' ']},'null option':{options:['a',null]},'whitespace option':{options:['a','\t\n']},'empty prompt':{prompt:' '},'whitespace prompt':{prompt:'\t\n'},
  'answer beyond options':{answer:2},'negative answer':{answer:-1},'empty ID':{id:''},'long ID':{id:'q'.repeat(101)}
}))test(`question constraints reject ${name}`,async()=>{
  const id=await draft();await assert.rejects(putQuestion(id,question(change)),/check constraint/);
  assert.equal((await user(editor,'select count(*)::int n from public.story_questions where revision_id=$1',[id]))[0].n,0);
});

test('question keys, positions, option dimensions and FK use revision-child constraints',async()=>{
  const id=await draft();await putQuestion(id);
  await assert.rejects(putQuestion(id,question(),2),/unique constraint/);
  await assert.rejects(putQuestion(id,question({id:'q2'}),1),/unique constraint/);
  await assert.rejects(putQuestion(id,question({id:'q2'}),0),/check constraint/);
  await db.exec('savepoint missing_revision');
  await assert.rejects(db.query("insert into public.story_questions values($1,'q',1,'main','?',array['a','b'],0)",[randomUUID()]),/foreign key constraint/);
  await db.exec('rollback to savepoint missing_revision; release savepoint missing_revision');
  await assert.rejects(putQuestion(id,question({id:'q2',options:[['a','b'],['c','d']]}),2),/check constraint/);
  await putQuestion(id,question({id:'spaces and punctuation!'}),2);
});

test('question RLS hides drafts, rejects anon writes and ordinary users, and advances draft review versions',async()=>{
  const id=await draft(),version=async()=>(await db.query('select edit_version from public.story_revisions where id=$1',[id])).rows[0].edit_version;
  const start=await version();await putQuestion(id);assert.ok(await version()>start);
  assert.deepEqual(await anon('select * from public.story_questions where revision_id=$1',[id]),[]);
  assert.deepEqual(await user(alice,'select * from public.story_questions where revision_id=$1',[id]),[]);
  await assert.rejects(anon("insert into public.story_questions values($1,'x',2,'main','?',array['a','b'],0)",[id]),/permission denied/);
  await assert.rejects(anon('update public.story_questions set answer=1 where revision_id=$1',[id]),/permission denied/);
  await assert.rejects(anon('delete from public.story_questions where revision_id=$1',[id]),/permission denied/);
  await assert.rejects(user(alice,"insert into public.story_questions values($1,'x',2,'main','?',array['a','b'],0)",[id]),/row-level security/);
  assert.deepEqual(await user(alice,"update public.story_questions set prompt='Changed' where revision_id=$1 returning id",[id]),[]);
  const inserted=await version();await user(editor,"update public.story_questions set prompt='Why?' where revision_id=$1",[id]);assert.ok(await version()>inserted);
  const updated=await version();await user(editor,'delete from public.story_questions where revision_id=$1',[id]);assert.ok(await version()>updated);
});

for(const method of ['publish_story_revision','admin_publish'])test(`${method} rejects non-contiguous questions then publishes ordered JSON arrays; archives hide questions`,async()=>{
  const id=await draft();await putQuestion(id,question(),2);
  const publish=async()=>method==='admin_publish'?admin(publisher,method,{p_revision_id:id,p_expected_version:(await admin(editor,'admin_revision',{p_revision_id:id})).edit_version}):user(publisher,'select public.publish_story_revision($1)',[id]);
  await assert.rejects(publish(),/questions_non_contiguous/);
  assert.equal((await db.query('select current_revision_id from public.stories where id=$1',['quiet-morning'])).rows[0].current_revision_id,revision);
  await user(editor,'update public.story_questions set position=1 where revision_id=$1',[id]);await publish();
  const rows=await anon('select id,position,kind,prompt,options,answer from public.story_questions where revision_id=$1 order by position asc limit 1 offset 0',[id]);
  assert.deepEqual(rows,[{...question(),position:1}]);
  assert.deepEqual(await anon('select id from public.story_questions where revision_id=$1 order by position limit 1 offset 1',[id]),[]);
  await user(publisher,"select public.set_story_archived('quiet-morning',true)");
  assert.deepEqual(await anon('select * from public.story_questions where revision_id=$1',[id]),[]);
});

test('published questions are immutable even for the database owner and staff cannot move rows into a publication',async()=>{
  const id=await draft();await putQuestion(id);await user(publisher,'select public.publish_story_revision($1)',[id]);
  for(const sql of ["update public.story_questions set prompt='Changed' where revision_id=$1",'delete from public.story_questions where revision_id=$1',"insert into public.story_questions values($1,'q2',2,'main','?',array['a','b'],0)"]){
    await db.exec('savepoint owner_write');
    await assert.rejects(db.query(sql,[id]),/published_revision_is_immutable/);
    await db.exec('rollback to savepoint owner_write; release savepoint owner_write');
  }
  assert.deepEqual(await user(editor,"update public.story_questions set prompt='Changed' where revision_id=$1 returning id",[id]),[]);
  const next=await admin(editor,'admin_create_draft',{p_story_id:'quiet-morning',p_source_id:id});
  await assert.rejects(user(editor,'update public.story_questions set revision_id=$1 where revision_id=$2',[id,next.id]),/published_revision_is_immutable|row-level security/);
});

test('admin question round-trip replaces by display order, keeps omitted lists, clears empty lists and copies publications',async()=>{
  const id=await draft();let d=await admin(editor,'admin_revision',{p_revision_id:id});assert.deepEqual(d.questions,[]);
  const save=async document=>admin(editor,'admin_save_draft',{p_revision_id:id,p_expected_version:d.edit_version,p_document:JSON.stringify(document)},[null,null,'jsonb']);
  d=await save({...d,questions:[question({id:'q2',kind:'inference',answer:1}),question()]});
  assert.deepEqual(d.questions.map(({revision_id,position,...q})=>q),[question({id:'q2',kind:'inference',answer:1}),question()]);
  assert.deepEqual(d.questions.map(q=>q.position),[1,2]);
  const kept=structuredClone(d);delete kept.questions;d=await save(kept);assert.equal(d.questions.length,2);
  for(const questions of [null,{},[question({options:[1,2]})],[question({answer:'0'})],[question({answer:0.5})],[question({kind:'bad'})],[question(),question()]]){
    await assert.rejects(save({...d,questions}));
    assert.deepEqual((await admin(editor,'admin_revision',{p_revision_id:id})).questions,d.questions);
  }
  const stale=d.edit_version;d=await save(d);
  await assert.rejects(admin(editor,'admin_save_draft',{p_revision_id:id,p_expected_version:stale,p_document:JSON.stringify({...d,questions:[]})},[null,null,'jsonb']),/draft_version_conflict/);
  await user(publisher,'select public.publish_story_revision($1)',[id]);
  const copy=await admin(editor,'admin_create_draft',{p_story_id:'quiet-morning',p_source_id:id});
  assert.deepEqual(copy.questions.map(({revision_id,...q})=>q),d.questions.map(({revision_id,...q})=>q));
  const cleared=await admin(editor,'admin_save_draft',{p_revision_id:copy.id,p_expected_version:copy.edit_version,p_document:JSON.stringify({...copy,questions:[]})},[null,null,'jsonb']);
  assert.deepEqual(cleared.questions,[]);
  await putQuestion(copy.id);await admin(editor,'admin_delete_draft',{p_revision_id:copy.id,p_expected_version:(await admin(editor,'admin_revision',{p_revision_id:copy.id})).edit_version});
  assert.equal((await db.query('select count(*)::int n from public.story_questions where revision_id=$1',[copy.id])).rows[0].n,0);
  assert.equal((await anon('select id from public.story_questions where revision_id=$1',[id])).length,2);
});

test('tags are a public vocabulary that only publishers change, and revisions carry their tags',async()=>{
  assert.deepEqual((await anon('select id from public.content_tags order by position')).map(t=>t.id),['masal','fabl','macera','gunluk-yasam','gizem']);
  assert.equal((await anon("select name from public.tag_names where tag_id='gunluk-yasam' and lang='tr'"))[0].name,'Günlük yaşam');
  assert.deepEqual((await anon('select tag_id from public.revision_tags where revision_id=$1',[revision])).map(t=>t.tag_id),['gunluk-yasam']);
  const aesop=stableId('classic-tortoise-hare:revision:1');
  assert.deepEqual((await anon('select tag_id from public.revision_tags where revision_id=$1 order by tag_id',[aesop])).map(t=>t.tag_id),['fabl','macera']);
  await assert.rejects(anon("insert into public.content_tags values('kisa',9)"),/permission denied/);
  await assert.rejects(user(editor,"insert into public.content_tags values('kisa',9)"),/row-level security/);
  await user(publisher,"insert into public.content_tags values('kisa',9)");
  await user(publisher,"insert into public.tag_names values('kisa','tr','Kısa')");
  assert.equal((await anon("select count(*)::int n from public.tag_names where tag_id='kisa'"))[0].n,1);
  // Published tags are outside the editor's write policy, and the trigger guards direct writes too.
  await user(editor,'delete from public.revision_tags where revision_id=$1',[revision]);
  assert.equal((await anon('select count(*)::int n from public.revision_tags where revision_id=$1',[revision]))[0].n,1);
  await assert.rejects(db.query("insert into public.revision_tags values($1,'gizem')",[revision]),/published_revision_is_immutable/);
});
test('drafts copy tags, saves replace them, and unknown tags are rejected',async()=>{
  const d=await admin(editor,'admin_create_draft',{story:'classic-tortoise-hare',source:stableId('classic-tortoise-hare:revision:1')});
  assert.deepEqual(d.tags,['fabl','macera']);
  const saved=await admin(editor,'admin_save_draft',{id:d.id,version:d.edit_version,document:JSON.stringify({...d,tags:['masal','gizem','masal']})},['uuid','integer','jsonb']);
  assert.deepEqual(saved.tags,['masal','gizem']);assert.ok(saved.edit_version>d.edit_version);
  const untouched=await admin(editor,'admin_save_draft',{id:d.id,version:saved.edit_version,document:JSON.stringify((({tags,...rest})=>rest)(saved))},['uuid','integer','jsonb']);
  assert.deepEqual(untouched.tags,['masal','gizem'],'older panels that omit tags keep them');
  for(const tags of [['unknown'],'masal',[1]])
    await assert.rejects(admin(editor,'admin_save_draft',{id:d.id,version:untouched.edit_version,document:JSON.stringify({...untouched,tags})},['uuid','integer','jsonb']),/tags_invalid/);
  assert.deepEqual((await admin(editor,'admin_revision',{id:d.id})).tags,['masal','gizem']);
});
test('tag migration backfills every revision from its genre and classic source',async()=>{
  const old=new PGlite();await old.waitReady;
  try{
    await old.exec(await read('./platform-fixture.sql'));
    const directory=new URL('../supabase/migrations/',import.meta.url),latest='20261016110000_story_tags.sql';
    for(const name of (await readdir(directory)).sort().filter(n=>n<latest))await old.exec(await readFile(new URL(name,directory),'utf8'));
    await old.exec(`insert into public.stories(id) values('a'),('b'),('c');
      insert into public.story_revisions(story_id,revision,author,level,genre,published_at) values('a',1,'Aesop','A1','Macera',now());
      insert into public.story_revisions(story_id,revision,author,level,genre) values('b',1,'Hans Christian Andersen','A2','Günlük yaşam'),('c',1,'O. Henry','B1','Gizem')`);
    await old.exec(await readFile(new URL(latest,directory),'utf8'));
    const tags=(await old.query("select r.story_id,string_agg(t.tag_id,',' order by c.position) tags from public.revision_tags t join public.story_revisions r on r.id=t.revision_id join public.content_tags c on c.id=t.tag_id group by r.story_id order by r.story_id")).rows;
    assert.deepEqual(tags,[{story_id:'a',tags:'fabl,macera'},{story_id:'b',tags:'masal,gunluk-yasam'},{story_id:'c',tags:'gizem'}]);
  }finally{await old.close();}
});
test('the panel tag list needs a staff role and keeps vocabulary order with localized names',async()=>{
  const tags=await admin(editor,'admin_tags',{});
  assert.deepEqual(tags.map(t=>t.id),['masal','fabl','macera','gunluk-yasam','gizem']);
  assert.equal(tags.find(t=>t.id==='fabl').names.tr,'Fabl');
  await assert.rejects(admin(alice,'admin_tags',{}),/staff_required/);
  await assert.rejects(anon('select public.admin_tags()'),/permission denied/);
});
const favorite=(extra={})=>({id:randomUUID(),installationId:installation,storyId:'quiet-morning',favorite:true,occurredAt:iso(),...extra});
test('favorite events are idempotent and the latest event per story wins across devices',async()=>{
  const add=favorite({occurredAt:iso(0,-60)});
  assert.equal((await rpc(alice,'apply_favorite_event',add)).applied,true);
  assert.equal((await rpc(alice,'apply_favorite_event',add)).applied,false);
  await assert.rejects(rpc(alice,'apply_favorite_event',{...add,favorite:false}),/operation_id_payload_conflict/);
  const remove=favorite({installationId:randomUUID(),favorite:false,occurredAt:iso()});
  assert.equal((await rpc(alice,'apply_favorite_event',remove)).favorite.favorite,false);
  // A late upload of an older add from another device does not resurrect the story.
  const late=await rpc(alice,'apply_favorite_event',favorite({occurredAt:iso(0,-30)}));
  assert.equal(late.favorite.favorite,false);assert.equal(late.favorite.last_event_id,remove.id);
  for(const invalid of [{...favorite(),favorite:'yes'},{...favorite(),extra:1},{...favorite(),storyId:'Bad Id'},{...favorite(),occurredAt:iso(1)}])
    await assert.rejects(rpc(alice,'apply_favorite_event',invalid),/invalid_favorite_payload|invalid_event_time|check constraint/);
  await assert.rejects(anon('select public.apply_favorite_event($1::jsonb)',[JSON.stringify(favorite())]),/permission denied/);
});
test('the learning snapshot carries favorites and their tombstones only to their owner',async()=>{
  await rpc(alice,'apply_favorite_event',favorite({storyId:'paper-boat'}));
  await rpc(alice,'apply_favorite_event',favorite({storyId:'lost-map',favorite:false}));
  const snapshot=(await user(alice,'select public.get_learning_snapshot() as s'))[0].s;
  assert.deepEqual(snapshot.favorites.map(f=>[f.story_id,f.favorite]),[['lost-map',false],['paper-boat',true]]);
  assert.deepEqual((await user(bob,'select public.get_learning_snapshot() as s'))[0].s.favorites,[]);
  assert.deepEqual(await user(bob,'select * from public.user_story_favorites'),[]);
  await assert.rejects(user(alice,"insert into public.user_story_favorites values($1,'x',true,now(),$2)",[alice,randomUUID()]),/permission denied/);
});

const personal=(extra={})=>word({storyRevisionId:null,wordId:'glossary:walk',word:'walk',gloss:'yürümek',...extra});
test('saved glossary words sync without a story revision and keep the newest meaning',async()=>{
  const save=personal({occurredAt:iso(0,-60)});
  assert.equal((await rpc(alice,'apply_word_event',save)).applied,true);
  assert.equal((await rpc(alice,'apply_word_event',save)).applied,false);
  // An older save uploaded later does not overwrite the newer meaning.
  await rpc(alice,'apply_word_event',personal({gloss:'yürüyüş',occurredAt:iso(0,-30)}));
  await rpc(alice,'apply_word_event',personal({gloss:'eski',occurredAt:iso(0,-90)}));
  let snapshot=(await user(alice,'select public.get_learning_snapshot() as s'))[0].s;
  const walk=snapshot.words.find(w=>w.word_id==='glossary:walk');
  assert.equal(walk.saved,true);assert.equal(walk.word,'walk');assert.equal(walk.gloss,'yürüyüş');assert.equal(walk.source_revision_id,null);
  // Learning words carry no text; reviews and removals carry no text either.
  assert.equal(snapshot.words.find(w=>w.word_id==='quiet'),undefined);
  await rpc(alice,'apply_word_event',word());
  snapshot=(await user(alice,'select public.get_learning_snapshot() as s'))[0].s;
  assert.equal('gloss' in snapshot.words.find(w=>w.word_id==='quiet'),false);
  const review=personal({action:'review',correct:true,word:undefined,gloss:undefined,occurredAt:iso(0,-1)});
  delete review.word;delete review.gloss;
  assert.equal((await rpc(alice,'apply_word_event',review)).wordState.saved,true);
  const remove={...review,id:randomUUID(),action:'remove',occurredAt:iso()};delete remove.correct;
  assert.equal((await rpc(alice,'apply_word_event',remove)).wordState.saved,false);
  assert.deepEqual((await user(bob,'select public.get_learning_snapshot() as s'))[0].s.words,[]);
  assert.deepEqual(await user(bob,'select * from public.user_personal_words'),[]);
});
test('glossary word events are validated and cannot borrow learning-word rules',async()=>{
  for(const invalid of [personal({word:''}),personal({gloss:'   '}),personal({wordId:'glossary:two words'}),personal({wordId:'glossary:'}),
    personal({storyRevisionId:revision}),personal({gloss:'x'.repeat(1001)}),word({word:'quiet',gloss:'sessiz'}),
    {...personal({action:'remove'}),correct:undefined}])
    await assert.rejects(rpc(alice,'apply_word_event',JSON.parse(JSON.stringify(invalid))),/invalid_word_payload/);
  // A learning word still needs its published revision.
  await assert.rejects(rpc(alice,'apply_word_event',word({storyRevisionId:null})),/published_word_required|invalid input syntax|null value|word_events_revision_or_glossary/);
  await assert.rejects(user(alice,"insert into public.user_personal_words values($1,'glossary:x','x','y',now())",[alice]),/permission denied/);
});
