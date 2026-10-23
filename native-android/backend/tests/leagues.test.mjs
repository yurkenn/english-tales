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
const optOut=async(id,out)=>(await user(id,'select public.set_league_opt_out($1) as r',[out]))[0].r;
const join=id=>optOut(id,false);
const entries=async id=>(await db.query('select xp,hidden from public.league_entries where user_id=$1 and week_start=$2',[id,week])).rows;
async function learner(name,joined=true) {
  const id=randomUUID();
  await db.query('insert into auth.users(id) values($1)',[id]);
  await db.query('insert into public.learning_profiles(user_id,display_name) values($1,$2)',[id,name]);
  if(joined) await join(id);
  return id;
}
const directory=new URL('../supabase/migrations/',import.meta.url);
const consentMigration='20261023190101_league_consent.sql';

before(async()=>{
  db=new PGlite(); await db.waitReady;
  await db.exec(await read('./platform-fixture.sql'));
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

test('after joining, a counted session enters this week\'s bronze group and earns server-side XP',async()=>{
  assert.equal((await league(alice)).joined,false);
  await join(alice);await join(bob);
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
  await join(alice);
  await submit(alice,{activeSeconds:2});
  assert.equal((await league(alice)).joined,false);
  await submit(alice,{kind:'reading',correctAnswers:0,questionCount:0});
  await submit(alice,{kind:'reading',correctAnswers:0,questionCount:0});
  const before=new Date(Date.parse(week+'T00:00:00Z')-3600000).toISOString();
  await submit(alice,{startedAt:new Date(Date.parse(before)-60000).toISOString(),finishedAt:before});
  assert.equal((await league(alice)).members[0].xp,20);
});

test('daily XP is capped at 500',async()=>{
  await join(alice);
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
    await db.query('insert into public.league_players(user_id,tier,opted_out) values($1,2,false) on conflict(user_id) do update set tier=2,opted_out=false',[id]);
    await db.query('insert into public.league_entries(week_start,user_id,group_id,tier,xp,hidden) values($1,$2,$3,2,$4,false)',[last,id,group,i===1?0:500-i*10]);
  }
  // A learner who left during that week keeps their entry, but it neither outranks anyone nor moves their tier.
  const gone=await learner('Gone',false);
  await db.query('insert into public.league_players(user_id,tier) values($1,2) on conflict(user_id) do update set tier=2',[gone]);
  await db.query('insert into public.league_entries(week_start,user_id,group_id,tier,xp,hidden) values($1,$2,$3,2,999,true)',[last,gone,group]);
  const mine=await league(alice);
  assert.deepEqual(mine.lastWeek,{tier:2,rank:1,outcome:'promoted'});
  assert.equal(mine.tier,3);
  assert.equal((await league(alice)).tier,3);
  assert.deepEqual((await league(bob)).lastWeek,{tier:2,rank:12,outcome:'relegated'});
  await submit(bob);
  assert.equal((await league(bob)).tier,1);
  assert.equal((await league(bob)).members.length,1);
  assert.deepEqual((await league(ids[6])).lastWeek,{tier:2,rank:6,outcome:'stayed'});
  const hidden=await league(gone);
  assert.equal(hidden.lastWeek,null);
  assert.equal(hidden.tier,2);
  assert.equal(hidden.joined,false);
});

test('learners who never chose to join stay out of every group, whatever an older app sends',async()=>{
  // Older apps only submit sessions; that alone must not enroll anyone.
  for(let i=0;i<3;i++){await submit(alice,{correctAnswers:5});await submit(bob,{correctAnswers:5});}
  for(const id of [alice,bob]) {
    const mine=await league(id);
    assert.equal(mine.optedOut,true);assert.equal(mine.joined,false);assert.deepEqual(mine.members,[]);
  }
  assert.equal((await db.query('select count(*)::int n from public.league_entries where user_id in ($1,$2)',[alice,bob])).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from public.league_players where user_id in ($1,$2) and not opted_out',[alice,bob])).rows[0].n,0);
  // Another learner who joined sees only themself.
  const carol=await learner('Carol');
  await submit(carol);
  assert.deepEqual((await league(carol)).members.map(m=>[m.name,m.me]),[['Carol',true]]);
});

test('opting out hides the entry but keeps its XP; returning in the same week reuses it',async()=>{
  await join(alice);await join(bob);
  await submit(alice);await submit(bob);
  const out=await optOut(alice,true);
  assert.equal(out.optedOut,true);assert.equal(out.joined,false);assert.deepEqual(out.members,[]);
  await submit(alice);
  assert.deepEqual(await entries(alice),[{xp:20,hidden:true}]);
  assert.deepEqual((await league(bob)).members.map(m=>m.me),[true]);
  const back=await join(alice);
  assert.equal(back.optedOut,false);assert.equal(back.joined,true);
  // XP earned while out is not added later.
  assert.equal(back.members.find(m=>m.me).xp,20);
  await submit(alice);
  assert.deepEqual(await entries(alice),[{xp:40,hidden:false}]);
  assert.equal((await league(bob)).members.length,2);
  assert.equal((await db.query('select count(*)::int n from public.league_groups where week_start=$1',[week])).rows[0].n,1);
});

test('joining is explicit and repeatable, and leaving and returning cannot get round the daily cap',async()=>{
  const first=await join(alice);
  assert.equal(first.optedOut,false);assert.equal(first.joined,false);
  assert.ok((await db.query('select consented_at from public.league_players where user_id=$1',[alice])).rows[0].consented_at);
  // Choosing again keeps the time of the original choice.
  await db.query("update public.league_players set consented_at='2026-01-05T00:00:00Z' where user_id=$1",[alice]);
  await join(alice);
  assert.equal((await db.query('select consented_at from public.league_players where user_id=$1',[alice])).rows[0].consented_at.toISOString(),'2026-01-05T00:00:00.000Z');
  for(let i=0;i<10;i++) await submit(alice,{correctAnswers:5});
  assert.deepEqual(await entries(alice),[{xp:250,hidden:false}]);
  await optOut(alice,true);
  assert.equal((await db.query('select consented_at from public.league_players where user_id=$1',[alice])).rows[0].consented_at,null);
  // Studying while out still uses up the day's cap, so returning cannot earn it a second time.
  for(let i=0;i<10;i++) await submit(alice,{correctAnswers:5});
  await join(alice);await join(alice);
  for(let i=0;i<10;i++) await submit(alice,{correctAnswers:5});
  assert.deepEqual(await entries(alice),[{xp:250,hidden:false}]);
  assert.equal((await db.query('select xp from private.league_days where user_id=$1',[alice])).rows[0].xp,500);
  await assert.rejects(user(alice,'select public.set_league_opt_out(null)'),/invalid_league_choice/);
});

test('the consent migration hides every learner enrolled without a choice and keeps their history',async()=>{
  const main=db;
  db=new PGlite();
  try {
    await db.waitReady;
    await db.exec(await read('./platform-fixture.sql'));
    for(const name of (await readdir(directory)).sort().filter(n=>n<consentMigration)) await db.exec(await readFile(new URL(name,directory),'utf8'));
    await db.exec(`insert into public.learning_profiles(user_id,display_name) values('${alice}','Alice Private'),('${bob}','Bob')`);
    const now=(await db.query("select date_trunc('week',now() at time zone 'UTC')::date::text as w")).rows[0].w;
    const last=(await db.query('select ($1::date-7)::text d',[now])).rows[0].d;
    const groups=(await db.query('insert into public.league_groups(week_start,tier) values($1,1),($2,2) returning id',[now,last])).rows.map(r=>r.id);
    // The old default enrolled both learners with opted_out=false, this week and last.
    await db.query('insert into public.league_players(user_id,tier) values($1,2),($2,2)',[alice,bob]);
    await db.query('insert into public.league_entries(week_start,user_id,group_id,tier,xp) values($1,$2,$3,1,120),($1,$4,$3,1,60)',[now,alice,groups[0],bob]);
    await db.query("insert into public.league_entries(week_start,user_id,group_id,tier,xp,final_rank,outcome) values($1,$2,$3,2,300,1,'stayed')",[last,alice,groups[1]]);
    await db.query('insert into public.league_entries(week_start,user_id,group_id,tier,xp) values($1,$2,$3,2,100)',[last,bob,groups[1]]);
    await db.query("insert into private.league_days(user_id,study_day,xp) values($1,(now() at time zone 'UTC')::date,120)",[alice]);
    await db.exec(await readFile(new URL(consentMigration,directory),'utf8'));

    assert.equal((await db.query('select count(*)::int n from public.league_players where not opted_out')).rows[0].n,0);
    assert.deepEqual((await db.query('select user_id,xp,hidden from public.league_entries where week_start=$1 order by xp desc',[now])).rows,
      [{user_id:alice,xp:120,hidden:true},{user_id:bob,xp:60,hidden:true}]);
    assert.deepEqual((await db.query("select xp,hidden,outcome from public.league_entries where week_start=$1 and user_id=$2",[last,alice])).rows,
      [{xp:300,hidden:false,outcome:'stayed'}]);
    await db.exec('begin');
    try {
      for(const id of [alice,bob]) {
        const mine=(await user(id,'select public.get_my_league() as r'))[0].r;
        assert.equal(mine.optedOut,true);assert.equal(mine.joined,false);assert.deepEqual(mine.members,[]);
      }
      // Finished weeks stay as they were, so bob's open week from before the migration settles unchanged.
      assert.deepEqual((await user(bob,'select public.get_my_league() as r'))[0].r.lastWeek,{tier:2,rank:2,outcome:'promoted'});
      // Bob joins again and returns to the kept seat, but alice, who has not chosen, stays out of sight.
      const bobBack=(await user(bob,'select public.set_league_opt_out(false) as r'))[0].r;
      assert.deepEqual(bobBack.members.map(m=>[m.xp,m.me]),[[60,true]]);
      assert.ok(!JSON.stringify(bobBack).includes('Alice Private'));
      const friendsOfBob=(await user(bob,'select public.get_my_friends() as r'))[0].r;
      assert.ok(!JSON.stringify(friendsOfBob).includes('Alice Private'));
      // Once alice chooses to join, the kept XP comes back too.
      const back=(await user(alice,'select public.set_league_opt_out(false) as r'))[0].r;
      assert.equal(back.joined,true);
      assert.deepEqual(back.members.map(m=>[m.name,m.xp,m.me]),[['Alice Private',120,true],['Bob',60,false]]);
    } finally { await db.exec('rollback'); }
  } finally {
    await db.close();
    db=main;
  }
});

test('league data is reachable only through the signed-in functions',async()=>{
  await join(alice);
  await submit(alice);
  for(const table of ['public.league_players','public.league_groups','public.league_entries','private.league_days'])
    await assert.rejects(user(alice,`select * from ${table}`),/permission denied/);
  await assert.rejects(user(null,'select public.get_my_league()'),/authentication_required/);
  await assert.rejects(as('anon',null,'select public.get_my_league()'),/permission denied/);
  await assert.rejects(user(null,'select public.set_league_opt_out(false)'),/authentication_required/);
  await assert.rejects(as('anon',null,'select public.set_league_opt_out(false)'),/permission denied/);
  for(const fn of ['private.league_join(uuid,date)','private.league_settle(uuid)','private.safe_name(uuid,uuid)'])
    assert.equal((await db.query(`select has_function_privilege('authenticated','${fn}','execute') as ok`)).rows[0].ok,false,fn);
  await db.query('delete from auth.users where id=$1',[alice]);
  assert.equal((await db.query('select count(*)::int n from public.league_entries where user_id=$1',[alice])).rows[0].n,0);
});
