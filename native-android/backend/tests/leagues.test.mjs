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

test('a counted session joins this week\'s bronze group and earns server-side XP',async()=>{
  assert.equal((await league(alice)).joined,false);
  await submit(alice);
  await submit(alice,{kind:'reading',correctAnswers:0,questionCount:0});
  await submit(bob,{correctAnswers:5});
  const mine=await league(alice);
  assert.equal(mine.joined,true);
  assert.equal(mine.tier,1);
  assert.equal(mine.weekStart,week);
  assert.equal(Date.parse(mine.endsAt)-Date.parse(week+'T00:00:00Z'),7*86400000);
  assert.equal(mine.promote,5);
  assert.equal(mine.relegate,0);
  assert.deepEqual(mine.members.map(m=>[m.rank,m.xp,m.me]),[[1,40,true],[2,25,false]]);
  assert.ok(!JSON.stringify(mine).includes(bob));
});

test('quick taps, repeated story reads and late sessions from last week add no XP',async()=>{
  await submit(alice,{activeSeconds:2});
  assert.equal((await league(alice)).joined,false);
  await submit(alice,{kind:'reading',correctAnswers:0,questionCount:0});
  await submit(alice,{kind:'reading',correctAnswers:0,questionCount:0});
  const before=new Date(Date.parse(week+'T00:00:00Z')-3600000).toISOString();
  await submit(alice,{startedAt:new Date(Date.parse(before)-60000).toISOString(),finishedAt:before});
  assert.equal((await league(alice)).members[0].xp,20);
});

test('daily XP is capped at 500',async()=>{
  for(let i=0;i<22;i++) await submit(alice,{correctAnswers:5});
  assert.equal((await league(alice)).members[0].xp,500);
});

test('a full group of 30 opens a new group in the same tier',async()=>{
  const ids=[];
  for(let i=0;i<31;i++){const id=await learner(`L${i}`);ids.push(id);await submit(id);}
  assert.equal((await league(ids[0])).members.length,30);
  assert.equal((await league(ids[30])).members.length,1);
  assert.equal((await db.query('select count(*)::int n from public.league_groups where week_start=$1',[week])).rows[0].n,2);
});

test('last week is settled once: the top five go up, the bottom five go down',async()=>{
  const last=(await db.query("select ($1::date-7)::text d",[week])).rows[0].d;
  const group=(await db.query('insert into public.league_groups(week_start,tier) values($1,2) returning id',[last])).rows[0].id;
  const ids=[alice,bob];
  for(let i=0;i<10;i++) ids.push(await learner(`P${i}`));
  for(const [i,id] of ids.entries()) {
    await db.query('insert into public.league_players(user_id,tier) values($1,2) on conflict(user_id) do update set tier=2',[id]);
    await db.query('insert into public.league_entries(week_start,user_id,group_id,tier,xp) values($1,$2,$3,2,$4)',[last,id,group,i===1?0:500-i*10]);
  }
  const mine=await league(alice);
  assert.deepEqual(mine.lastWeek,{tier:2,rank:1,outcome:'promoted'});
  assert.equal(mine.tier,3);
  assert.equal((await league(alice)).tier,3);
  assert.deepEqual((await league(bob)).lastWeek,{tier:2,rank:12,outcome:'relegated'});
  await submit(bob);
  assert.equal((await league(bob)).tier,1);
  assert.equal((await league(bob)).members.length,1);
  assert.deepEqual((await league(ids[6])).lastWeek,{tier:2,rank:6,outcome:'stayed'});
});

test('opting out leaves the current group and stops joining until the learner returns',async()=>{
  await submit(alice);await submit(bob);
  const out=(await user(alice,'select public.set_league_opt_out(true) as r'))[0].r;
  assert.equal(out.optedOut,true);assert.equal(out.joined,false);
  await submit(alice);
  assert.equal((await league(bob)).members.length,1);
  await user(alice,'select public.set_league_opt_out(false)');
  await submit(alice);
  assert.equal((await league(alice)).members.find(m=>m.me).xp,20);
});

test('league data is reachable only through the signed-in functions',async()=>{
  await submit(alice);
  for(const table of ['public.league_players','public.league_groups','public.league_entries','private.league_days'])
    await assert.rejects(user(alice,`select * from ${table}`),/permission denied/);
  await assert.rejects(user(null,'select public.get_my_league()'),/authentication_required/);
  await assert.rejects(as('anon',null,'select public.get_my_league()'),/permission denied/);
  await db.query('delete from auth.users where id=$1',[alice]);
  assert.equal((await db.query('select count(*)::int n from public.league_entries where user_id=$1',[alice])).rows[0].n,0);
});
