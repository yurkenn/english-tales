import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDeletionHandler} from '../supabase/functions/delete-account/handler.js';

const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function fixture({gate=true,userStatus=200,revokeStatus=204,deleteStatus=200}={}) {
  const calls=[];
  const handler=createDeletionHandler({url:'https://example.invalid',key:'server-only-fixture',fetcher:async(url,options)=>{
    calls.push({path:new URL(url).pathname+new URL(url).search,method:options.method,authorization:options.headers.Authorization});
    if(url.endsWith('/auth/v1/user')) return Response.json({id:owner},{status:userStatus});
    if(url.endsWith('/authorize_account_deletion')) return Response.json(gate);
    if(url.includes('/logout?')) return new Response(null,{status:revokeStatus});
    if(url.endsWith('/admin/users/'+owner)) return Response.json({id:owner},{status:deleteStatus});
    throw new Error('Unexpected request');
  }});
  const request=(body={confirm:true},extra={})=>new Request('https://example.invalid/functions/v1/delete-account',{method:'POST',headers:{Authorization:'Bearer user-fixture','Content-Type':'application/json',...extra},body:JSON.stringify(body)});
  return {handler,calls,request};
}
test('account deletion verifies owner and recent session, revokes sessions before privileged deletion',async()=>{
  const f=fixture();const response=await f.handler(f.request());assert.equal(response.status,200);assert.deepEqual(await response.json(),{code:'account_deleted',userId:owner});
  assert.deepEqual(f.calls.map(c=>c.path),['/auth/v1/user','/rest/v1/rpc/authorize_account_deletion','/auth/v1/logout?scope=global','/auth/v1/admin/users/'+owner]);
  assert.ok(f.calls.slice(0,3).every(c=>c.authorization==='Bearer user-fixture'));
  assert.equal(f.calls.at(-1).authorization,'Bearer server-only-fixture');
});
test('expired or foreign session cannot reach revoke or delete',async()=>{
  const f=fixture({gate:false});const response=await f.handler(f.request());assert.equal(response.status,403);assert.equal((await response.json()).code,'reauthentication_required');assert.equal(f.calls.length,2);
});
test('invalid authentication cannot reach privileged deletion',async()=>{
  const f=fixture({userStatus:401});assert.equal((await f.handler(f.request())).status,401);assert.equal(f.calls.length,1);
});
test('failed revocation stops deletion and failed deletion never reports success',async()=>{
  const f=fixture({revokeStatus:503});assert.equal((await f.handler(f.request())).status,503);assert.equal(f.calls.length,3);
  const g=fixture({deleteStatus:503});const response=await g.handler(g.request());assert.equal(response.status,503);assert.equal((await response.json()).code,'deletion_unavailable');
});
test('confirmation, method, origin and oversized request checks have no server effects',async()=>{
  const f=fixture();
  for(const body of [{confirm:false},{confirm:true,userId:owner},{confirm:true,padding:'x'.repeat(200)}]) assert.ok((await f.handler(f.request(body))).status>=400);
  assert.equal((await f.handler(f.request(undefined,{Origin:'https://attacker.invalid'}))).status,403);
  assert.equal((await f.handler(new Request('https://example.invalid',{method:'GET'}))).status,405);
  assert.equal((await f.handler(new Request('https://example.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}))).status,401);
  assert.equal(f.calls.length,0);
});
test('only the public support origin gets CORS access and responses are not cacheable',async()=>{
  const f=fixture();const response=await f.handler(new Request('https://example.invalid',{method:'OPTIONS',headers:{Origin:'https://englishtales-app.web.app'}}));assert.equal(response.status,204);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://englishtales-app.web.app');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(f.calls.length,0);
});
