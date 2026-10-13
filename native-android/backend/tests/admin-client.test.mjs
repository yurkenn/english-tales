import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '../admin/api.js';
import {backup,readBackup,recoveryKey,occurs,invalidLinks} from '../admin/workflow.js';
const config={mode:'cloud',url:'https://test.supabase.co',key:'sb_publishable_test'};
const response=(value,status=200)=>new Response(status===204?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const session=(expires=3600)=>({user:{id:'user-a'},access_token:'access',refresh_token:'refresh',expires_in:expires});
test('concurrent requests share one refresh and use the renewed credential',async()=>{
  let clock=0,refreshes=0;const seen=[];
  const client=createClient({now:()=>clock,fetch:async(url,options)=>{
    if(url==='/api/config')return response(config);
    if(url.includes('password'))return response(session(120));
    if(url.includes('refresh_token')){refreshes++;return response({...session(),access_token:'renewed'});}
    seen.push(options.headers.Authorization);return response('publisher');
  }});
  await client.init();await client.login('a','p');clock=90000;
  await Promise.all([client.rpc('content_role'),client.rpc('content_role')]);
  assert.equal(refreshes,1);assert.deepEqual(seen,['Bearer renewed','Bearer renewed']);
});
test('logout while refreshing cannot resurrect an old session',async()=>{
  let resolveRefresh;const client=createClient({fetch:async url=>{
    if(url==='/api/config')return response(config);
    if(url.includes('password'))return response(session(0));
    if(url.includes('refresh_token'))return new Promise(resolve=>{resolveRefresh=resolve;});
    return response(null,204);
  }});
  await client.init();await client.login('a','p');const pending=client.rpc('content_role');
  await client.logout();resolveRefresh(response(session()));
  await assert.rejects(pending,e=>e.code==='session_expired');assert.equal(client.identity(),undefined);
});
test('failed authentication and lost sessions report errors without persisting credentials',async()=>{
  let unauthorized=false;const client=createClient({fetch:async url=>url==='/api/config'?response(config):url.includes('password')?response(session()):response(unauthorized?{message:'expired'}:'publisher',unauthorized?401:200)});
  await client.init();await client.login('a','p');unauthorized=true;
  await assert.rejects(client.rpc('admin_catalog'),e=>e.code==='session_expired');
  await assert.rejects(client.rpc('content_role'),e=>e.code==='session_expired');
});
test('storage removal uses a reserved path and finalizes only after the delete response',async()=>{
  const calls=[];const client=createClient({fetch:async(url,options)=>{
    if(url==='/api/config')return response(config);if(url.includes('password'))return response(session());
    calls.push({url,method:options.method,body:JSON.parse(options.body)});
    return response(url.includes('reserve')?'cover/known/hash':null);
  }});
  await client.init();await client.login('a','p');await client.removeMedia('asset');
  assert.equal(calls[0].body.p_asset_id,'asset');assert.equal(calls[1].method,'DELETE');assert.deepEqual(calls[1].body,{prefixes:['cover/known/hash']});assert.ok(calls[2].url.endsWith('admin_finalize_media_delete'));
});
test('a failed upload cleans its reserved metadata and never returns an attachable asset',async()=>{
  const calls=[];const client=createClient({fetch:async(url,options)=>{
    if(url==='/api/config')return response(config);if(url.includes('password'))return response(session());calls.push(url);
    if(url.includes('/object/story-media/'))return response({message:'upload failure'},503);
    return response(url.includes('reserve')?'audio/test/hash':null);
  }});
  await client.init();await client.login('a','p');await assert.rejects(client.upload(new Blob(['ID3sample'],{type:'audio/mpeg'}),'audio'),/upload failure/);
  assert.ok(calls.some(u=>u.endsWith('admin_finalize_media_delete')));
});
test('whole word and phrase checks reject substrings and empty punctuation',()=>{
  assert.ok(occurs('Good MORNING, everyone!','morning'));assert.ok(occurs('He picked-up a book.','picked up'));
  assert.equal(occurs('She quietly left.','quiet'),false);assert.equal(occurs('Hello.','!!!'),false);
  assert.equal(invalidLinks({sentences:[{id:'s',english:'quietly'}],words:[{id:'w',word:'quiet'}],links:[{sentence_id:'s',word_id:'w'}]}).length,1);
});
const doc={id:'revision',story_id:'story',edit_version:4,title:'Title',author:'Author',level:'A1',genre:'Macera',description:'Description',cover_asset_id:'current-cover',sentences:[{id:'s-1',english:'Hello',turkish:'Merhaba'}],words:[{id:'w-1',word:'hello',translation:'merhaba',pronunciation:'',example:''}],links:[{sentence_id:'s-1',word_id:'w-1'}]};
test('recovery retains fresh version and media authority when importing a stale backup',()=>{
  const local=backup({...doc,title:'Local',edit_version:1,cover_asset_id:'old-cover'},config.url);
  const recovered=readBackup(JSON.stringify(local),doc,config.url);assert.equal(recovered.document.title,'Local');assert.equal(recovered.document.edit_version,4);assert.equal(recovered.document.cover_asset_id,'current-cover');
  assert.notEqual(recoveryKey(config.url,'a',doc.id),recoveryKey(config.url,'b',doc.id));
});
test('backups cannot cross projects, revisions, or contain invalid links',()=>{
  const text=JSON.stringify(backup(doc,config.url));assert.throws(()=>readBackup(text,doc,'other'),/başka/);
  assert.throws(()=>readBackup(text,{...doc,id:'other'},config.url),/başka/);
  const corrupt=backup({...doc,links:[{sentence_id:'unknown',word_id:'w-1'}]},config.url);assert.throws(()=>readBackup(JSON.stringify(corrupt),doc,config.url),/bağlantısı/);
});
