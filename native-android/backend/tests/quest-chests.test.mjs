import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const publisher='11111111-1111-4111-8111-111111111111';
const stableId=value=>{const h=createHash('sha256').update(`english-tales:${value}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const revision=stableId('quiet-morning:revision:1');
let db, clock, today;
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
const iso=(seconds=0)=>new Date(clock+seconds*1000).toISOString();
const session=(extra={})=>({id:randomUUID(),installationId:randomUUID(),kind:'choice',storyRevisionId:revision,startedAt:iso(-60),finishedAt:iso(),activeSeconds:30,correctAnswers:4,questionCount:5,studyTimezone:'UTC',...extra});
const submit=async(id,extra)=>(await user(id,'select public.submit_learning_session($1::jsonb) as r',[JSON.stringify(session(extra))]))[0].r;
const open=async(id,day=today)=>(await user(id,'select public.open_quest_chest($1::date) as r',[day]))[0].r;
const chests=async id=>(await user(id,'select public.get_quest_chests() as r'))[0].r;
const league=async id=>(await user(id,'select public.get_my_league() as r'))[0].r;
async function learner(goal=2) {
  const id=randomUUID();
  await db.query('insert into auth.users(id) values($1)',[id]);
  await db.query('insert into public.learning_profiles(user_id,daily_goal) values($1,$2)',[id,goal]);
  return id;
}
async function finishQuests(id) {
  await submit(id,{kind:'reading',correctAnswers:0,questionCount:0});
  await submit(id,{correctAnswers:5});
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
  const row=(await db.query("select now() as clock,(now() at time zone 'UTC')::date::text as today")).rows[0];
  clock=Date.parse(row.clock); today=row.today;
});
afterEach(async()=>{await db.exec('rollback; reset role');});
after(async()=>{await db?.close();});

test('the chest stays shut until the server sees all three quests done',async()=>{
  const id=await learner(2);
  await assert.rejects(open(id),{code:'55000'});
  await submit(id,{kind:'reading',correctAnswers:0,questionCount:0});
  await submit(id,{correctAnswers:4});
  // Goal and story are done, but no flawless game yet.
  await assert.rejects(open(id),{code:'55000'});
  await submit(id,{correctAnswers:5});
  const chest=await open(id);
  assert.ok([20,30,50].includes(chest.points));
  assert.equal(chest.day,today);
  assert.equal(chest.total,chest.points);
});

test('the daily goal counts sessions, so a reading and a flawless game miss a goal of three',async()=>{
  const id=await learner(3);
  await finishQuests(id);
  await assert.rejects(open(id),{code:'55000'});
  await submit(id,{correctAnswers:1});
  assert.ok((await open(id)).points>0);
});

test('opening again returns the same reward and adds no more XP',async()=>{
  const id=await learner(2);
  await finishQuests(id);
  const first=await open(id);
  const again=await open(id);
  assert.equal(again.points,first.points);
  assert.equal(again.total,first.points);
  assert.deepEqual((await chests(id)).recent,[{day:today,points:first.points}]);
  // 20 for the story, 25 for the flawless game, then the chest.
  assert.equal((await league(id)).members[0].xp,45+first.points);
});

test('only days next to today can be opened, and another learner sees only their own chests',async()=>{
  const id=await learner(1);
  await assert.rejects(open(id,'2020-01-01'),{code:'22023'});
  await finishQuests(id);
  await open(id);
  const other=await learner(1);
  assert.deepEqual(await chests(other),{total:0,recent:[]});
  await assert.rejects(as('anon',null,'select public.get_quest_chests()'));
  await assert.rejects(user(id,'select * from public.quest_chests'));
});

test('rewards are 20, 30 or 50 points with 50 the rarest',async()=>{
  const rows=(await db.query('select private.chest_points(r) as p from unnest(array[0,0.59,0.6,0.89,0.9,0.999]::float8[]) r')).rows;
  assert.deepEqual(rows.map(r=>r.p),[20,20,30,30,50,50]);
});
