import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createAdmobSsvHandler,derToP1363,VERIFIER_KEYS_URL} from '../supabase/functions/admob-ssv/handler.js';
import {createPremiumSyncHandler} from '../supabase/functions/premium-sync/handler.js';
import {createRevenueCatWebhookHandler} from '../supabase/functions/revenuecat-webhook/handler.js';
import {createRevenueCatClient} from '../supabase/functions/_shared/revenuecat.js';

const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const nonce='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const NOW=Date.parse('2026-10-24T12:00:00Z');
const path=url=>{const u=new URL(url);return u.origin==='https://example.invalid'?u.pathname:u.origin+u.pathname;};

// --- AdMob server-side verification ---------------------------------------------------------
const google=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const stranger=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const spki=key=>key.export({type:'spki',format:'der'}).toString('base64');
const b64url=buffer=>Buffer.from(buffer).toString('base64url');
function callback(overrides={},{key=google.privateKey,keyId='3335741209',encoding='der',tamper}={}) {
  const values={ad_network:'5450213213286189855',ad_unit:'1234567890',custom_data:nonce,reward_amount:'1',reward_item:'energy',
    timestamp:String(NOW-60000),transaction_id:'123456789abcdef',user_id:owner,...overrides};
  const pairs=Array.isArray(overrides)?overrides:Object.entries(values);
  const message=pairs.map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
  const signature=b64url(sign('sha256',Buffer.from(message),{key,dsaEncoding:encoding}));
  return `https://example.invalid/functions/v1/admob-ssv?${tamper?tamper(message):message}&signature=${signature}&key_id=${keyId}`;
}
function ssv({credit={credited:true,duplicate:false,reason:'credited'},creditStatus=200,keysStatus=200,adUnits='ca-app-pub-1/1234567890'}={}) {
  const calls=[];
  const handler=createAdmobSsvHandler({url:'https://example.invalid',key:'server-only-fixture',adUnits,now:()=>NOW,fetcher:async(url,options)=>{
    calls.push({path:path(url),method:options.method,authorization:options.headers?.Authorization,body:options.body&&JSON.parse(options.body)});
    assert.equal(options.redirect,'error');assert.ok(options.signal);
    if(url===VERIFIER_KEYS_URL) return Response.json({keys:[{keyId:3335741209,pem:'unused',base64:spki(google.publicKey)}]},{status:keysStatus});
    if(url.endsWith('/rest/v1/rpc/credit_ad_reward')) return Response.json(credit,{status:creditStatus});
    throw new Error('Unexpected request');
  }});
  const get=async url=>{const r=await handler(new Request(url));return {status:r.status,code:(await r.json()).code};};
  return {handler,calls,get,credits:()=>calls.filter(c=>c.path.endsWith('credit_ad_reward'))};
}

test('a genuinely signed callback credits the ticket through the server-only RPC',async()=>{
  const f=ssv();
  assert.deepEqual(await f.get(callback()),{status:200,code:'reward_credited'});
  assert.deepEqual(f.credits(),[{path:'/rest/v1/rpc/credit_ad_reward',method:'POST',authorization:'Bearer server-only-fixture',
    body:{p_nonce:nonce,p_transaction_id:'123456789abcdef',p_user_id:owner}}]);
  // Keys are fetched once from Google's fixed URL and cached.
  await f.get(callback({transaction_id:'second'}));
  assert.equal(f.calls.filter(c=>c.path===VERIFIER_KEYS_URL).length,1);
});

test('tampered, foreign-key, unknown-key and malformed signatures never reach the database',async()=>{
  const f=ssv();
  for(const url of [
    callback({},{tamper:m=>m.replace('reward_amount=1','reward_amount=3')}),
    callback({},{tamper:m=>m.replace(owner,other)}),
    callback({},{key:stranger.privateKey}),
    callback({},{keyId:'42'}),
    callback().replace(/signature=[^&]+/,'signature=AAAA'),
    callback().replace(/signature=[^&]+/,'signature=%%%'),
  ]) assert.equal((await f.get(url)).status,400,url);
  // Signature and key_id must be the final two parameters, once each.
  assert.equal((await f.get(callback()+'&user_id='+other)).status,400);
  assert.equal((await f.get(callback().replace('&signature=','&x=1&signature='))).status,400);
  assert.equal((await f.get('https://example.invalid/functions/v1/admob-ssv')).status,400);
  assert.equal((await f.handler(new Request(callback(),{method:'POST'}))).status,405);
  assert.equal(f.credits().length,0);
});

test('signed callbacks with repeated parameters, wrong reward, wrong unit or stale time are refused',async()=>{
  const f=ssv();
  const base=Object.entries({ad_unit:'1234567890',custom_data:nonce,reward_amount:'1',reward_item:'energy',timestamp:String(NOW),transaction_id:'t',user_id:owner});
  assert.deepEqual(await f.get(callback([...base,['user_id',other]])),{status:400,code:'invalid_callback'});
  for(const overrides of [{reward_amount:'2'},{reward_item:'coins'},{ad_unit:'999'},{custom_data:'not-a-uuid'},{user_id:'x'},{transaction_id:''},{transaction_id:'a b'}])
    assert.deepEqual(await f.get(callback(overrides)),{status:400,code:'invalid_reward'},JSON.stringify(overrides));
  for(const timestamp of [NOW-3600001,NOW+300001,'soon'])
    assert.deepEqual(await f.get(callback({timestamp:String(timestamp)})),{status:400,code:'stale_callback'});
  assert.equal(f.credits().length,0);
});

test('Google retries are acknowledged, refusals end retries and outages ask for a retry',async()=>{
  assert.deepEqual(await ssv({credit:{credited:false,duplicate:true,reason:'already_credited'}}).get(callback()),{status:200,code:'reward_acknowledged'});
  assert.deepEqual(await ssv({credit:{credited:false,duplicate:false,reason:'expired'}}).get(callback()),{status:200,code:'reward_rejected'});
  assert.deepEqual(await ssv({creditStatus:500}).get(callback()),{status:503,code:'reward_unavailable'});
  assert.deepEqual(await ssv({keysStatus:500}).get(callback()),{status:503,code:'verification_unavailable'});
});

test('DER signatures convert to the WebCrypto form and raw signatures pass through',async()=>{
  const message=Buffer.from('ad_unit=1');
  const der=sign('sha256',message,{key:google.privateKey,dsaEncoding:'der'});
  const raw=derToP1363(new Uint8Array(der));
  assert.equal(raw.length,64);
  const key=await crypto.subtle.importKey('spki',google.publicKey.export({type:'spki',format:'der'}),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  assert.ok(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,raw,message));
  const p1363=sign('sha256',message,{key:google.privateKey,dsaEncoding:'ieee-p1363'});
  assert.deepEqual(derToP1363(new Uint8Array(p1363)),new Uint8Array(p1363));
  for(const bad of [[0x30,0x02,0x02,0x00],[0x31,0x00],[0x30,0x06,0x02,0x01,0x01,0x02,0x01,0x01,0x00]])
    assert.throws(()=>derToP1363(new Uint8Array(bad)));
  assert.equal((await ssv().get(callback({},{encoding:'ieee-p1363'}))).status,200);
  assert.throws(()=>createAdmobSsvHandler({url:'https://example.invalid',key:'k',adUnits:''}));
});

// --- RevenueCat --------------------------------------------------------------------------------
const future='2026-11-24T12:00:00Z';
function subscriber({id=owner,original=id,expires=future,grace=null,sandbox=false,store='play_store',refunded=null,entitlement=true,requestMs=NOW}={}) {
  const product='premium_monthly:monthly';
  return {request_date_ms:requestMs,subscriber:{original_app_user_id:original,
    entitlements:entitlement?{premium:{expires_date:expires,grace_period_expires_date:grace,product_identifier:product,purchase_date:'2026-10-24T11:00:00Z'}}:{},
    subscriptions:{[product]:{expires_date:expires,is_sandbox:sandbox,store,refunded_at:refunded}}}};
}
function rc({responses={},allowSandbox=false}={}) {
  const lookups=[];
  const client=createRevenueCatClient({secretKey:'rc-secret-fixture',allowSandbox,now:()=>NOW,sleep:async()=>{},fetcher:async(url,options)=>{
    const id=decodeURIComponent(new URL(url).pathname.split('/').pop());
    assert.equal(new URL(url).origin+new URL(url).pathname.replace(/[^/]+$/,''),'https://api.revenuecat.com/v1/subscribers/');
    assert.equal(options.headers.Authorization,'Bearer rc-secret-fixture');assert.equal(options.redirect,'error');assert.ok(options.signal);
    lookups.push(id);
    let next=responses[id]??subscriber({id});
    if(Array.isArray(next)) next=next.shift()??subscriber({id});
    if(next instanceof Error) throw next;
    if(typeof next==='number') return new Response('upstream detail',{status:next});
    if(next instanceof Response) return next;
    return Response.json(next);
  }});
  return {client,lookups};
}

test('RevenueCat lookups grant only a live production premium owned by this account',async()=>{
  const at=async(options,allowSandbox)=>(await rc({responses:{[owner]:subscriber(options)},allowSandbox}).client.entitlement(owner)).expiresAt;
  const checked=new Date(NOW).toISOString();
  assert.deepEqual(await rc().client.entitlement(owner),{expiresAt:new Date(future).toISOString(),checkedAt:checked});
  assert.equal(await at({sandbox:true}),null);
  assert.equal(await at({sandbox:true},true),new Date(future).toISOString());
  assert.equal(await at({original:other}),null);
  assert.equal(await at({original:'$RCAnonymousID:abc'}),new Date(future).toISOString());
  assert.equal(await at({store:'app_store'}),null);
  assert.equal(await at({refunded:'2026-10-24T11:30:00Z'}),null);
  assert.equal(await at({entitlement:false}),null);
  assert.equal(await at({expires:null}),null);
  assert.equal(await at({grace:'2026-12-01T00:00:00Z'}),'2026-12-01T00:00:00.000Z');
  // An expired entitlement is stored as its past expiry, which grants nothing.
  assert.equal(await at({expires:'2026-10-01T00:00:00Z'}),'2026-10-01T00:00:00.000Z');
  // RevenueCat's own clock orders lookups unless it disagrees wildly with ours.
  const later=await rc({responses:{[owner]:subscriber({requestMs:NOW+1000})}}).client.entitlement(owner);
  assert.equal(later.checkedAt,new Date(NOW+1000).toISOString());
  const wild=await rc({responses:{[owner]:subscriber({requestMs:NOW+86400000})}}).client.entitlement(owner);
  assert.equal(wild.checkedAt,checked);
  await assert.rejects(rc().client.entitlement('not-a-uuid'));
});

test('RevenueCat outages are retried a bounded number of times, client errors are not',async()=>{
  const flaky=rc({responses:{[owner]:[503,new Error('network'),subscriber()]}});
  assert.ok((await flaky.client.entitlement(owner)).expiresAt);assert.equal(flaky.lookups.length,3);
  const down=rc({responses:{[owner]:[503,429,500,subscriber()]}});
  await assert.rejects(down.client.entitlement(owner));assert.equal(down.lookups.length,3);
  const missing=rc({responses:{[owner]:[404,subscriber()]}});
  await assert.rejects(missing.client.entitlement(owner));assert.equal(missing.lookups.length,1);
  const huge=rc({responses:{[owner]:new Response('x'.repeat(300000))}});
  await assert.rejects(huge.client.entitlement(owner));
});

function supabase(extra={}) {
  const calls=[];
  const fetcher=async(url,options)=>{
    calls.push({path:path(url),authorization:options.headers.Authorization,body:options.body&&JSON.parse(options.body)});
    assert.equal(options.redirect,'error');assert.ok(options.signal);
    if(url.endsWith('/auth/v1/user')) return Response.json(extra.user??{id:owner},{status:extra.userStatus??200});
    if(url.endsWith('/rpc/set_premium_entitlement')) return Response.json({applied:true},{status:extra.setStatus??200});
    if(url.endsWith('/rpc/get_energy_state')) return Response.json({day:'2026-10-24',balance:3,premium:true});
    throw new Error('Unexpected request');
  };
  return {calls,fetcher,sets:()=>calls.filter(c=>c.path.endsWith('set_premium_entitlement')).map(c=>c.body)};
}

test('premium sync verifies the bearer, asks RevenueCat and answers with the server state',async()=>{
  const s=supabase(),r=rc();
  const handler=createPremiumSyncHandler({url:'https://example.invalid',key:'server-only-fixture',revenueCat:r.client,fetcher:s.fetcher});
  const response=await handler(new Request('https://example.invalid/functions/v1/premium-sync',{method:'POST',headers:{Authorization:'Bearer user-fixture'},body:'{"premium":true}'}));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{day:'2026-10-24',balance:3,premium:true});
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(s.calls.map(c=>[c.path,c.authorization]),[['/auth/v1/user','Bearer user-fixture'],
    ['/rest/v1/rpc/set_premium_entitlement','Bearer server-only-fixture'],['/rest/v1/rpc/get_energy_state','Bearer user-fixture']]);
  assert.deepEqual(s.sets(),[{p_user_id:owner,p_expires_at:new Date(future).toISOString(),p_checked_at:new Date(NOW).toISOString()}]);
  assert.deepEqual(r.lookups,[owner]);
});

test('premium sync refuses browsers, missing or anonymous sign-in and fails closed on outages',async()=>{
  const run=async({extra={},responses={},headers={Authorization:'Bearer user-fixture'},method='POST',body}={})=>{
    const s=supabase(extra),r=rc({responses});
    const handler=createPremiumSyncHandler({url:'https://example.invalid',key:'server-only-fixture',revenueCat:r.client,fetcher:s.fetcher});
    const response=await handler(new Request('https://example.invalid/functions/v1/premium-sync',{method,headers,body}));
    return {status:response.status,body:await response.json(),s,r};
  };
  assert.equal((await run({headers:{Authorization:'Bearer user-fixture',Origin:'https://attacker.invalid'}})).status,403);
  assert.equal((await run({method:'GET'})).status,405);
  assert.equal((await run({headers:{}})).status,401);
  assert.equal((await run({body:'x'.repeat(65)})).status,413);
  for(const extra of [{userStatus:401},{user:{id:owner,is_anonymous:true}},{user:{id:'nope'}}]) {
    const result=await run({extra});
    assert.equal(result.status,401);assert.equal(result.r.lookups.length,0);
  }
  const down=await run({responses:{[owner]:[500,500,500]}});
  assert.deepEqual([down.status,down.body],[503,{code:'premium_unavailable'}]);assert.equal(down.s.sets().length,0);
  assert.equal((await run({extra:{setStatus:500}})).status,503);
  assert.equal((await run({extra:{userStatus:500}})).status,503);
});

function webhook({responses,allowSandbox=false,setStatus}={}) {
  const s=supabase({setStatus}),r=rc({responses,allowSandbox});
  const handler=createRevenueCatWebhookHandler({url:'https://example.invalid',key:'server-only-fixture',authorization:'Bearer hook-fixture',appId:'app_prod',
    allowSandbox,revenueCat:r.client,fetcher:s.fetcher,now:()=>NOW});
  const send=async(event,authorization='Bearer hook-fixture')=>{
    const response=await handler(new Request('https://example.invalid/functions/v1/revenuecat-webhook',{method:'POST',
      headers:{Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify({api_version:'1.0',event})}));
    return {status:response.status,code:(await response.json()).code};
  };
  return {send,s,r};
}
const event=(extra={})=>({type:'RENEWAL',app_id:'app_prod',environment:'PRODUCTION',app_user_id:owner,
  // Values a forged or replayed event might carry; none of them is used.
  expiration_at_ms:NOW+10*365*86400000,entitlement_ids:['premium'],aliases:[other],...extra});

test('webhooks need the shared authorization and re-read the account instead of trusting the event',async()=>{
  const w=webhook();
  assert.equal((await w.send(event(),'Bearer wrong')).status,401);
  assert.equal((await w.send(event(),'')).status,401);
  assert.equal(w.s.calls.length+w.r.lookups.length,0);
  assert.deepEqual(await w.send(event()),{status:200,code:'synced'});
  // Only the event's own account is looked up; aliases are never granted.
  assert.deepEqual(w.r.lookups,[owner]);
  assert.deepEqual(w.s.sets(),[{p_user_id:owner,p_expires_at:new Date(future).toISOString(),p_checked_at:new Date(NOW).toISOString()}]);
  // An expiration event clears premium only if RevenueCat says so.
  const gone=webhook({responses:{[owner]:subscriber({entitlement:false})}});
  await gone.send(event({type:'EXPIRATION'}));
  assert.equal(gone.s.sets()[0].p_expires_at,null);
});

test('test, foreign-app, sandbox and anonymous-id events change nothing',async()=>{
  const w=webhook();
  for(const e of [event({type:'TEST'}),event({app_id:'app_other'}),event({app_id:undefined}),event({environment:'SANDBOX'}),
    event({environment:'STAGING'}),event({app_user_id:'$RCAnonymousID:abc'})])
    assert.deepEqual(await w.send(e),{status:200,code:'ignored'},JSON.stringify(e));
  assert.equal(w.r.lookups.length,0);
  assert.equal((await w.send(null)).status,400);
  const sandbox=webhook({allowSandbox:true});
  assert.equal((await sandbox.send(event({environment:'SANDBOX'}))).code,'synced');
});

test('transfers re-read both accounts and conservatively revoke an unreadable source',async()=>{
  const w=webhook({responses:{[owner]:subscriber({id:owner,entitlement:false})}});
  assert.equal((await w.send(event({type:'TRANSFER',app_user_id:undefined,transferred_from:[owner],transferred_to:[other.toUpperCase()]}))).code,'synced');
  assert.deepEqual(w.r.lookups,[owner,other]);
  assert.deepEqual(w.s.sets().map(s=>[s.p_user_id,s.p_expires_at]),[[owner,null],[other,new Date(future).toISOString()]]);
  const failing=webhook({responses:{[owner]:[500,500,500]}});
  assert.deepEqual(await failing.send(event({type:'TRANSFER',transferred_from:[owner],transferred_to:[other]})),{status:503,code:'sync_unavailable'});
  assert.deepEqual(failing.s.sets().map(s=>[s.p_user_id,s.p_expires_at]),[[owner,null],[other,new Date(future).toISOString()]]);
  // A failed destination lookup or store asks RevenueCat to retry.
  assert.equal((await webhook({responses:{[other]:[500,500,500]}}).send(event({type:'TRANSFER',transferred_from:[owner],transferred_to:[other]}))).status,503);
  assert.equal((await webhook({setStatus:500}).send(event())).status,503);
  const many=Array.from({length:7},(_,i)=>`${String(i).repeat(8)}-0000-4000-8000-000000000000`);
  assert.equal((await w.send(event({type:'TRANSFER',transferred_from:many,transferred_to:[]}))).status,400);
});
