import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const publisher='11111111-1111-4111-8111-111111111111';
const alice='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bob='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const stableId=value=>{const h=createHash('sha256').update(`english-tales:${value}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const revision=stableId('quiet-morning:revision:1');
let db, clock, week;
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
async function as(role,user,sql,params=[]) {
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
const iso=(days=0,seconds=0)=>new Date(clock+days*86400000+seconds*1000).toISOString();
const session=(extra={})=>({id:randomUUID(),installationId:randomUUID(),kind:'choice',storyRevisionId:revision,startedAt:iso(0,-60),finishedAt:iso(),activeSeconds:30,correctAnswers:4,questionCount:5,studyTimezone:'UTC',...extra});
const submit=async(id,extra)=>(await user(id,'select public.submit_learning_session($1::jsonb) as r',[JSON.stringify(session(extra))]))[0].r;
const league=async id=>(await user(id,'select public.get_my_league() as r'))[0].r;
async function learner(name) {
  const id=randomUUID();
  await db.query('insert into auth.users(id) values($1)',[id]);
  await db.query('insert into public.learning_profiles(user_id,display_name) values($1,$2)',[id,name]);
  return id;
}

before(async()=>{
  db=new PGlite(); await db.waitReady;
  await db.exec(await read('./platform-fixture.sql'));
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(directory)).sort()) await db.exec(await readFile(new URL(name,directory),'utf8'));
  await db.exec(await read('../supabase/seed.sql'));
  await db.exec(`insert into private.content_staff values('${publisher}','publisher');
    insert into storage.objects(bucket_id,name) select 'story-media',storage_path from public.content_assets; begin;`);
  await user(publisher,'select public.publish_story_revision($1)',[revision]);
  await db.exec('commit');
});
beforeEach(async()=>{
  await db.exec('begin');
  const row=(await db.query("select now() as clock,date_trunc('week',now() at time zone 'UTC')::date::text as week")).rows[0];
  clock=Date.parse(row.clock); week=row.week;
});
afterEach(async()=>{await db.exec('rollback; reset role');});
after(async()=>{await db?.close();});


const friends=async id=>(await user(id,'select public.get_my_friends() as r'))[0].r;
const call=async(id,fn,arg)=>(await user(id,`select public.${fn}($1) as r`,[arg]))[0].r;
const code=async id=>(await user(id,'select public.get_friend_code() as r'))[0].r.code;

test('friends join by code in both directions and rank by this week\'s league XP',async()=>{
  const mine=await code(alice);
  assert.match(mine,/^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(await code(alice),mine);
  await submit(bob,{correctAnswers:5});
  const list=await call(bob,'add_friend',` ${mine.toLowerCase()} `);
  assert.deepEqual(list.friends.map(f=>[f.rank,f.xp,f.me]),[[1,25,true],[2,0,false]]);
  assert.equal((await friends(alice)).friends.length,2);
  assert.ok(!JSON.stringify(list).includes(alice));
  await assert.rejects(call(alice,'add_friend',mine),/friend_is_self/);
  await assert.rejects(call(alice,'add_friend','ZZZZZZ'),/friend_code_not_found/);
  const token=(await friends(alice)).friends.find(f=>!f.me).id;
  assert.equal((await call(alice,'remove_friend',token)).friends.length,1);
  assert.equal((await friends(bob)).friends.length,1);
});

test('offensive and reported names are masked for others but not for their owner',async()=>{
  await submit(alice);await submit(bob);
  await db.query("update public.learning_profiles set display_name='Ali' where user_id=$1",[bob]);
  const ids=[];for(let i=0;i<3;i++){const id=await learner(`R${i}`);ids.push(id);await submit(id);}
  const bobFor=async viewer=>{const rows=(await league(viewer)).members;return rows.filter(m=>!m.me).map(m=>m.name);};
  assert.ok((await bobFor(alice)).includes('Ali'));
  const bobToken=async viewer=>(await league(viewer)).members.find(m=>m.name==='Ali').id;
  assert.deepEqual(await call(alice,'report_name',await bobToken(alice)),{reported:true});
  assert.ok(!(await bobFor(alice)).includes('Ali'));
  assert.ok((await bobFor(ids[0])).includes('Ali'));
  for(const id of ids.slice(0,2)) await call(id,'report_name',await bobToken(id));
  assert.ok(!(await bobFor(ids[2])).includes('Ali'));
  assert.equal((await league(bob)).members.find(m=>m.me).name,'Ali');
  await db.query("update public.learning_profiles set display_name='Ali Veli' where user_id=$1",[bob]);
  assert.ok((await bobFor(ids[2])).includes('Ali Veli'));
  await db.query("update public.learning_profiles set display_name='xFuckx' where user_id=$1",[bob]);
  assert.ok(!(await bobFor(ids[2])).includes('xFuckx'));
  await assert.rejects(call(alice,'report_name','0000'),/member_not_found/);
});

test('member tokens differ per viewer and friend data stays behind the functions',async()=>{
  await submit(alice);await submit(bob);
  const a=(await league(alice)).members.map(m=>m.id).sort(), b=(await league(bob)).members.map(m=>m.id).sort();
  assert.equal(a.length,2);assert.notDeepEqual(a,b);
  for(const table of ['public.friend_codes','public.friendships','public.name_reports','private.blocked_name_terms'])
    await assert.rejects(user(alice,`select * from ${table}`),/permission denied/);
  await assert.rejects(as('anon',null,'select public.get_my_friends()'),/permission denied/);
});
