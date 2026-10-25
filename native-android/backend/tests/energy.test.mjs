import { test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const publisher='11111111-1111-4111-8111-111111111111';
const stableId=value=>{const h=createHash('sha256').update(`english-tales:${value}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const stories=['quiet-morning','paper-boat','lost-map','red-umbrella','last-train'];
let db, today;
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
const service=(sql,params)=>as('service_role',null,sql,params);
const state=async id=>(await user(id,'select public.get_energy_state() as r'))[0].r;
const unlock=async(id,story)=>(await user(id,'select public.unlock_story($1) as r',[story]))[0].r;
const begin=async id=>(await user(id,'select public.begin_ad_reward() as r'))[0].r.nonce;
const credit=async(nonce,tx,id)=>(await service('select public.credit_ad_reward($1,$2,$3) as r',[nonce,tx,id]))[0].r;
const entitle=async(id,expires,checked)=>(await service('select public.set_premium_entitlement($1,$2,$3) as r',[id,expires,checked]))[0].r;
const hours=n=>new Date(Date.now()+n*3600000).toISOString();
async function reader() {
  const id=randomUUID();
  await db.query('insert into auth.users(id) values($1)',[id]);
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
  for(const story of stories) await user(publisher,'select public.publish_story_revision($1)',[stableId(`${story}:revision:1`)]);
  await db.exec("insert into public.stories(id) values('unpublished-draft'); update private.energy_settings set enabled=true; commit");
});
beforeEach(async()=>{
  await db.exec('begin');
  today=(await db.query("select (now() at time zone 'UTC')::date::text as d")).rows[0].d;
});
afterEach(async()=>{await db.exec('rollback; reset role');});
after(async()=>{await db?.close();});

test('a new reader has three energy for the UTC day and a reset at the next UTC midnight',async()=>{
  const s=await state(await reader());
  const next=new Date(Date.parse(today+'T00:00:00Z')+86400000).toISOString();
  assert.deepEqual(s,{day:today,balance:3,adCredits:0,adCap:3,pendingAdRewards:0,premium:false,premiumUntil:null,resetsAt:next,enabled:true,unlockedStoryIds:[]});
  await assert.rejects(as('anon',null,'select public.get_energy_state()'),/permission denied/);
  await assert.rejects(user(null,'select public.get_energy_state()'),/authentication_required/);
});

test('three new stories spend three energy, the fourth is refused without an error, reopening is free',async()=>{
  const id=await reader();
  for(const [i,story] of stories.slice(0,3).entries()) {
    const r=await unlock(id,story);
    assert.equal(r.allowed,true);assert.equal(r.reason,'energy');assert.equal(r.balance,2-i);
  }
  const again=await unlock(id,'quiet-morning');
  assert.equal(again.reason,'unlocked');assert.equal(again.balance,0);
  const fourth=await unlock(id,'red-umbrella');
  assert.equal(fourth.allowed,false);assert.equal(fourth.reason,'exhausted');assert.equal(fourth.balance,0);
  assert.deepEqual(fourth.unlockedStoryIds,['lost-map','paper-boat','quiet-morning']);
  // Another account shares nothing.
  const other=await state(await reader());
  assert.equal(other.balance,3);assert.deepEqual(other.unlockedStoryIds,[]);
});

test('only published, unarchived stories can be unlocked and unlocks cannot be edited by anyone',async()=>{
  const id=await reader();
  for(const story of ['unpublished-draft','no-such-story',null]) await assert.rejects(unlock(id,story),/story_unavailable/);
  await db.query("update public.stories set is_archived=true where id='last-train'");
  await assert.rejects(unlock(id,'last-train'),/story_unavailable/);
  assert.equal((await state(id)).balance,3);
  await unlock(id,'quiet-morning');
  for(const sql of ['select * from public.story_unlocks','select * from public.energy_wallets','select * from public.ad_reward_tickets','select * from public.premium_entitlements',
    "insert into public.story_unlocks(user_id,story_id,source) values(auth.uid(),'paper-boat','energy')"])
    await assert.rejects(user(id,sql),/permission denied/);
  await assert.rejects(db.query("update public.story_unlocks set source='legacy' where user_id=$1",[id]),/story_unlock_is_immutable/);
});

test('a new UTC day refills to three without carrying over, and keeps earlier unlocks',async()=>{
  const id=await reader();
  for(const story of stories.slice(0,3)) await unlock(id,story);
  await db.query("update public.energy_wallets set day=day-1 where user_id=$1",[id]);
  const s=await state(id);
  assert.equal(s.balance,3);assert.equal(s.unlockedStoryIds.length,3);
  assert.equal((await unlock(id,'red-umbrella')).balance,2);
  assert.deepEqual((await db.query('select day::text,spent,ad_credits from public.energy_wallets where user_id=$1',[id])).rows,[{day:today,spent:1,ad_credits:0}]);
});

test('premium opens stories without spending energy or leaving permanent access',async()=>{
  const id=await reader();
  await unlock(id,'quiet-morning');
  assert.equal((await entitle(id,hours(24),new Date().toISOString())).applied,true);
  const s=await state(id);
  assert.equal(s.premium,true);assert.match(s.premiumUntil,/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  const r=await unlock(id,'paper-boat');
  assert.equal(r.allowed,true);assert.equal(r.reason,'premium');assert.equal(r.balance,2);
  assert.equal((await unlock(id,'quiet-morning')).reason,'unlocked');
  await assert.rejects(begin(id),/premium_active/);
  // Expiry: energy-bought stories stay, premium-opened ones need energy again.
  await entitle(id,null,hours(0.01));
  const after=await state(id);
  assert.equal(after.premium,false);assert.equal(after.premiumUntil,null);assert.deepEqual(after.unlockedStoryIds,['quiet-morning']);
  assert.equal((await unlock(id,'paper-boat')).reason,'energy');
});

test('entitlement updates are server-only, monotonic and only for live accounts',async()=>{
  const id=await reader();
  await assert.rejects(user(id,'select public.set_premium_entitlement($1,$2,$3)',[id,hours(24),new Date().toISOString()]),/permission denied/);
  await assert.rejects(as('anon',null,'select public.set_premium_entitlement($1,$2,$3)',[id,hours(24),new Date().toISOString()]),/permission denied/);
  const t0=hours(-0.05),t1=hours(-0.02);
  assert.equal((await entitle(id,hours(24),t1)).applied,true);
  // A lookup that started earlier but finished later cannot revoke the newer result.
  const stale=await entitle(id,null,t0);
  assert.equal(stale.applied,false);assert.equal(stale.reason,'stale');assert.equal(stale.premium,true);
  assert.equal((await entitle(id,null,t1)).applied,false);
  assert.equal((await state(id)).premium,true);
  // An expiry in the past is stored but grants nothing.
  assert.equal((await entitle(id,hours(-1),hours(0))).premium,false);
  assert.equal((await state(id)).premium,false);
  await assert.rejects(entitle(id,hours(24),hours(1)),/invalid_entitlement/);
  await assert.rejects(entitle(id,hours(24),null),/invalid_entitlement/);
  assert.equal((await entitle(randomUUID(),hours(24),hours(0))).reason,'unknown_user');
  const anonymous=randomUUID();
  await db.query('insert into auth.users(id,is_anonymous) values($1,true)',[anonymous]);
  assert.equal((await entitle(anonymous,hours(24),hours(0))).reason,'unknown_user');
});

test('a verified ad callback adds one energy once, and a retried callback is acknowledged',async()=>{
  const id=await reader();
  for(const story of stories.slice(0,3)) await unlock(id,story);
  const nonce=await begin(id);
  assert.match(nonce,/^[0-9a-f-]{36}$/);
  assert.deepEqual(await credit(nonce,'tx-1',id),{credited:true,duplicate:false,reason:'credited'});
  assert.deepEqual(await credit(nonce,'tx-1',id),{credited:false,duplicate:true,reason:'already_credited'});
  assert.equal((await credit(nonce,'tx-2',id)).reason,'ticket_used');
  const s=await state(id);
  assert.equal(s.adCredits,1);assert.equal(s.balance,1);
  assert.equal((await unlock(id,'red-umbrella')).reason,'energy');
});

test('foreign, unknown, reused, stale and expired callbacks credit nothing',async()=>{
  const id=await reader(),other=await reader();
  const nonce=await begin(id);
  assert.equal((await credit(nonce,'tx-a',other)).reason,'unknown_ticket');
  assert.equal((await credit(randomUUID(),'tx-a',id)).reason,'unknown_ticket');
  assert.equal((await credit(nonce,'',id)).reason,'invalid');
  assert.equal((await credit(nonce,'x'.repeat(201),id)).reason,'invalid');
  await credit(nonce,'tx-a',id);
  // The same Google transaction cannot pay a second ticket, even another user's.
  assert.equal((await credit(await begin(id),'tx-a',id)).reason,'transaction_reused');
  assert.equal((await credit(await begin(other),'tx-a',other)).reason,'transaction_reused');
  const late=await begin(other);
  await db.query("update public.ad_reward_tickets set expires_at=now()-interval '1 second' where nonce=$1",[late]);
  assert.equal((await credit(late,'tx-late',other)).reason,'expired');
  assert.equal((await state(other)).adCredits,0);
  assert.equal((await state(id)).adCredits,1);
  await assert.rejects(user(id,'select public.credit_ad_reward($1,$2,$3)',[nonce,'tx-b',id]),/permission denied/);
});

// Moves the user's wallet and open tickets one UTC day back, as if midnight just passed.
const midnight=async id=>{
  await db.query('update public.energy_wallets set day=day-1 where user_id=$1',[id]);
  await db.query('update public.ad_reward_tickets set issued_day=issued_day-1 where user_id=$1 and transaction_id is null',[id]);
};
const pendingCode=async(id,pattern)=>{
  const error=await begin(id).then(()=>null,e=>e);
  assert.match(error?.message??'',pattern);assert.equal(error.code,'55000');
};

test('the daily ad cap counts open tickets, never hands one nonce to two ads and releases expired ones',async()=>{
  const id=await reader();
  const a=await begin(id),b=await begin(id),c=await begin(id);
  assert.equal(new Set([a,b,c]).size,3);
  assert.equal((await state(id)).pendingAdRewards,3);
  // A fourth request is refused instead of being promised a nonce that another ad already carries.
  await pendingCode(id,/pending_reward/);
  assert.equal((await db.query('select count(*)::int as n from public.ad_reward_tickets where user_id=$1',[id])).rows[0].n,3);
  await db.query("update public.ad_reward_tickets set expires_at=now()-interval '1 second' where nonce=$1",[a]);
  assert.equal((await state(id)).pendingAdRewards,2);
  const d=await begin(id);
  assert.ok(![a,b,c].includes(d));
  for(const [i,nonce] of [b,c,d].entries()) assert.equal((await credit(nonce,'cap-'+i,id)).credited,true);
  await pendingCode(id,/ad_limit_reached/);
  const s=await state(id);
  assert.equal(s.adCredits,3);assert.equal(s.balance,6);assert.equal(s.pendingAdRewards,0);
  // Even a ticket slipped past the reservation cannot exceed three a day.
  await db.query("insert into public.ad_reward_tickets(nonce,user_id,issued_day,expires_at) values($1,$2,$3,now()+interval '1 hour')",[a,id,today]);
  assert.equal((await credit(a,'cap-extra',id)).reason,'limit_reached');
  await db.query('delete from public.ad_reward_tickets where nonce=$1',[a]);
  // Yesterday's credits do not carry over.
  await midnight(id);
  assert.deepEqual([(await state(id)).adCredits,(await state(id)).balance],[0,3]);
  assert.ok(await begin(id));
});

test('a verified ad finished before UTC midnight pays once on the next day within the daily caps',async()=>{
  const id=await reader();
  const [x,y,late]=[await begin(id),await begin(id),await begin(id)];
  await credit(x,'night-1',id);await credit(y,'night-2',id);
  await midnight(id);
  // Fresh day: the open ticket from yesterday still holds one of today's three slots.
  let s=await state(id);
  assert.deepEqual([s.adCredits,s.balance,s.pendingAdRewards],[0,3,1]);
  const t1=await begin(id),t2=await begin(id);
  await pendingCode(id,/pending_reward/);
  assert.deepEqual(await credit(late,'night-3',id),{credited:true,duplicate:false,reason:'credited'});
  // Google retries the late callback after midnight: acknowledged, never paid twice.
  assert.deepEqual(await credit(late,'night-3',id),{credited:false,duplicate:true,reason:'already_credited'});
  assert.equal((await credit(late,'night-4',id)).reason,'ticket_used');
  assert.equal((await credit(x,'night-1',id)).reason,'already_credited');
  for(const [i,nonce] of [t1,t2].entries()) assert.equal((await credit(nonce,'day-'+i,id)).credited,true);
  s=await state(id);
  assert.deepEqual([s.adCredits,s.balance,s.pendingAdRewards],[3,6,0]);
  await pendingCode(id,/ad_limit_reached/);
  // Expiry still bounds a late callback.
  await midnight(id);
  const stale=await begin(id);
  await db.query("update public.ad_reward_tickets set issued_day=issued_day-1,expires_at=now()-interval '1 second' where nonce=$1",[stale]);
  assert.equal((await credit(stale,'night-5',id)).reason,'expired');
  assert.equal((await state(id)).adCredits,0);
});

test('a reader can release only their own open ad ticket; credited tickets stay unchanged',async()=>{
  const id=await reader(),other=await reader();
  const cancel=async(who,nonce)=>(await user(who,'select public.cancel_ad_reward($1) as r',[nonce]))[0].r;
  const [a,b,c]=[await begin(id),await begin(id),await begin(id)];
  await credit(c,'kept',id);
  // Another reader cannot cancel, and cannot tell whether the ticket exists.
  assert.deepEqual(await cancel(other,a),{cancelled:false});
  assert.deepEqual(await cancel(other,randomUUID()),{cancelled:false});
  assert.deepEqual(await cancel(id,c),{cancelled:false});
  assert.deepEqual(await cancel(id,null),{cancelled:false});
  assert.equal((await db.query('select count(*)::int as n from public.ad_reward_tickets where user_id=$1',[id])).rows[0].n,3);
  await pendingCode(id,/pending_reward/);
  // A no-fill releases the slot; the released nonce can never be credited.
  assert.deepEqual(await cancel(id,a),{cancelled:true});
  assert.deepEqual(await cancel(id,a),{cancelled:false});
  assert.equal((await credit(a,'after-cancel',id)).reason,'unknown_ticket');
  const d=await begin(id);
  assert.ok(![a,b,c].includes(d));
  const s=await state(id);
  assert.deepEqual([s.adCredits,s.pendingAdRewards],[1,2]);
  assert.deepEqual((await db.query('select transaction_id from public.ad_reward_tickets where nonce=$1',[c])).rows,[{transaction_id:'kept'}]);
  for(const change of ["transaction_id='swap'","expires_at=now()+interval '9 hours'","transaction_id=null,credited_at=null"]) {
    await db.exec('savepoint edit');
    await assert.rejects(db.query(`update public.ad_reward_tickets set ${change} where nonce=$1`,[c]),/ad_reward_credit_is_immutable/);
    await db.exec('rollback to savepoint edit');
  }
  await assert.rejects(as('anon',null,'select public.cancel_ad_reward($1)',[b]),/permission denied/);
  await assert.rejects(user(null,'select public.cancel_ad_reward($1)',[b]),/authentication_required/);
});

test('the energy policy exposes only the kill switch, to guests and readers alike',async()=>{
  const policy=async role=>(await as(role,role==='authenticated'?await reader():null,'select public.get_energy_policy() as r'))[0].r;
  for(const role of ['anon','authenticated']) assert.deepEqual(await policy(role),{enabled:true});
  assert.deepEqual((await user(null,'select public.get_energy_policy() as r'))[0].r,{enabled:true});
  await db.query('update private.energy_settings set enabled=false');
  assert.deepEqual(await policy('anon'),{enabled:false});
  for(const role of ['anon','authenticated']) await assert.rejects(as(role,null,'select * from private.energy_settings'),/permission denied/);
});

test('energy API execute grants match the inventory',async()=>{
  const expected={
    'public.get_energy_policy()':[true,true,false],
    'public.get_energy_state()':[false,true,false],
    'public.unlock_story(text)':[false,true,false],
    'public.begin_ad_reward()':[false,true,false],
    'public.cancel_ad_reward(uuid)':[false,true,false],
    'public.credit_ad_reward(uuid,text,uuid)':[false,false,true],
    'public.set_premium_entitlement(uuid,timestamp with time zone,timestamp with time zone)':[false,false,true],
  };
  const rows=(await db.query(`select pg_catalog.regexp_replace(p.oid::regprocedure::text,'^(public[.])?','public.') as sig,
      has_function_privilege('anon',p.oid,'execute') as a,has_function_privilege('authenticated',p.oid,'execute') as u,
      has_function_privilege('service_role',p.oid,'execute') as s,p.prosecdef,p.proconfig
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('get_energy_policy','get_energy_state','unlock_story','begin_ad_reward','cancel_ad_reward','credit_ad_reward','set_premium_entitlement')`)).rows;
  assert.deepEqual(Object.fromEntries(rows.map(r=>[r.sig,[r.a,r.u,r.s]])),expected);
  for(const r of rows) {assert.equal(r.prosecdef,true,r.sig);assert.ok(r.proconfig?.includes('search_path=""'),r.sig);}
  const leaked=(await db.query(`select p.proname from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and (p.proname like 'energy%' or p.proname in ('premium_active','backfill_legacy_story_unlocks','story_unlock_is_immutable','ad_reward_credit_is_immutable'))
      and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute'))`)).rows;
  assert.deepEqual(leaked,[]);
});

test('the kill switch disables spending and ads but keeps premium and earlier unlocks',async()=>{
  const id=await reader();
  await unlock(id,'quiet-morning');
  await db.query('update private.energy_settings set enabled=false');
  const r=await unlock(id,'paper-boat');
  assert.equal(r.allowed,true);assert.equal(r.reason,'disabled');assert.equal(r.enabled,false);assert.equal(r.balance,2);
  assert.equal((await unlock(id,'quiet-morning')).reason,'unlocked');
  assert.deepEqual(r.unlockedStoryIds,['quiet-morning']);
  await assert.rejects(begin(id),/energy_disabled/);
  // With the switch off an exhausted reader is not limited either.
  const spent=await reader();
  await db.query('update private.energy_settings set enabled=true');
  for(const story of stories.slice(0,3)) await unlock(spent,story);
  assert.equal((await unlock(spent,'red-umbrella')).allowed,false);
  await db.query('update private.energy_settings set enabled=false');
  for(const story of ['red-umbrella','last-train']) assert.deepEqual(
    [(await unlock(spent,story)).allowed,(await unlock(spent,story)).reason],[true,'disabled']);
  assert.deepEqual((await as('anon',null,'select public.get_energy_policy() as r'))[0].r,{enabled:false});
});

test('legacy progress is kept once as permanent access, later progress grants nothing by itself',async()=>{
  const id=await reader();
  const revision=stableId('lost-map:revision:1');
  const sentence=(await db.query('select id from public.story_sentences where revision_id=$1 order by position limit 1',[revision])).rows[0].id;
  await db.query(`insert into public.user_story_progress(user_id,revision_id,story_id,last_sentence_id,percent,last_event_at,last_event_id)
    values($1,$2,'lost-map',$3,40,now(),gen_random_uuid())`,[id,revision,sentence]);
  assert.deepEqual((await state(id)).unlockedStoryIds,[]);
  assert.equal((await db.query('select private.backfill_legacy_story_unlocks() as n')).rows[0].n,1);
  assert.equal((await db.query('select private.backfill_legacy_story_unlocks() as n')).rows[0].n,0);
  const r=await unlock(id,'lost-map');
  assert.equal(r.reason,'unlocked');assert.equal(r.balance,3);
  await assert.rejects(user(id,'select private.backfill_legacy_story_unlocks()'),/permission denied/);
});

test('account deletion removes wallet, unlocks, tickets and entitlement',async()=>{
  const id=await reader();
  await unlock(id,'quiet-morning');await credit(await begin(id),'tx-del',id);await entitle(id,hours(24),hours(0));
  await db.query('delete from auth.users where id=$1',[id]);
  for(const table of ['energy_wallets','story_unlocks','ad_reward_tickets','premium_entitlements'])
    assert.equal((await db.query(`select * from public.${table} where user_id=$1`,[id])).rows.length,0);
});
