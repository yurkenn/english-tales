import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { randomUUID,createHash } from 'node:crypto';
import { createServer } from 'node:net';

const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url),'utf8'));
const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
const origin=`http://127.0.0.1:${port}`,demoName=`admin-http-${randomUUID()}`;
let child;
async function start(){
  child=spawn(process.execPath,['admin/server.mjs'],{cwd:new URL('../',import.meta.url),windowsHide:true,env:{...process.env,SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',ADMIN_PORT:String(port),ADMIN_DEMO_NAME:demoName},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Admin startup timed out')),20000);
    child.stdout.on('data',data=>{if(data.toString().includes('Content admin:')){clearTimeout(timer);resolve();}});
    child.stderr.on('data',data=>{clearTimeout(timer);reject(new Error(data.toString()));});
    child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Admin exited: ${code}`));});
  });
}
async function stop(){if(child&&child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}}
async function rpc(name,args={}){const response=await fetch(`${origin}/api/rpc`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({name,args})});const result=await response.json();if(!response.ok)throw new Error(result.message);return result;}
try {
  await start();
  assert.equal((await fetch(`${origin}/api/config`)).status,200);
  assert.equal((await fetch(`${origin}/api/config`,{headers:{Origin:'https://other.example'}})).status,403);
  assert.equal((await fetch(`${origin}/api/rpc`,{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'})).status,415);
  await assert.rejects(rpc('arbitrary_sql',{query:'drop table public.stories'}),/operation_not_found/);
  assert.equal(await rpc('content_role'),'publisher');
  const rows=await rpc('admin_catalog',{p_offset:0,p_limit:100});assert.equal(rows.length,catalog.stories.length);
  const d=await rpc('admin_revision',{p_revision_id:rows.find(r=>r.story_id==='quiet-morning').id});
  const cover=await readFile(new URL('../content/covers/cover_quiet_morning.png',import.meta.url));
  const id=randomUUID(),headers={Origin:origin,'Content-Type':'image/png','X-Asset-Id':id,'X-Kind':'cover'};
  assert.equal((await fetch(`${origin}/api/media`,{method:'POST',headers:{...headers,Origin:'https://other.example'},body:cover})).status,403);
  assert.equal((await fetch(`${origin}/api/media`,{method:'POST',headers,body:Buffer.from('not a PNG')})).status,400);
  const response=await fetch(`${origin}/api/media`,{method:'POST',headers,body:cover});assert.equal(response.status,200);const asset=await response.json();
  const downloaded=Buffer.from(await (await fetch(`${origin}/media/${id}`)).arrayBuffer());assert.deepEqual(downloaded,cover);assert.equal(asset.sha256,createHash('sha256').update(downloaded).digest('hex'));
  assert.equal((await fetch(`${origin}/api/media`,{method:'POST',headers,body:cover})).status,400);
  let saved=await rpc('admin_save_draft',{p_revision_id:d.id,p_expected_version:d.edit_version,p_document:{...d,title:'HTTP verified story',questions:[{id:'q-http',kind:'detail',prompt:'When is the morning quiet?',options:['At dawn.','At midnight.'],answer:0}],cover_asset_id:id,descriptions:{...d.descriptions,'es-419':'Descripción'}}});
  assert.deepEqual(saved.questions.map(({revision_id,position,...q})=>q),[{id:'q-http',kind:'detail',prompt:'When is the morning quiet?',options:['At dawn.','At midnight.'],answer:0}]);
  await assert.rejects(rpc('admin_save_draft',{p_revision_id:d.id,p_expected_version:d.edit_version,p_document:d}),/draft_version_conflict/);
  await assert.rejects(rpc('admin_publish',{p_revision_id:d.id,p_expected_version:saved.edit_version}),/revision_translations_incomplete: lang=es-419/);
  for(const row of saved.sentences)row.translations['es-419']='Texto de ejemplo';
  for(const row of saved.words)row.translations['es-419']='Significado';
  saved=await rpc('admin_save_draft',{p_revision_id:d.id,p_expected_version:saved.edit_version,p_document:saved});
  await rpc('admin_publish',{p_revision_id:d.id,p_expected_version:saved.edit_version});
  const clone=await rpc('admin_create_draft',{p_story_id:d.story_id,p_source_id:d.id});assert.equal(clone.revision,2);assert.equal(clone.sentences[0].id,d.sentences[0].id);
  assert.deepEqual(clone.questions.map(({revision_id,...q})=>q),saved.questions.map(({revision_id,...q})=>q));
  assert.deepEqual(clone.descriptions,saved.descriptions);assert.deepEqual(clone.sentences.map(s=>s.translations),saved.sentences.map(s=>s.translations));assert.deepEqual(clone.words.map(w=>w.translations),saved.words.map(w=>w.translations));
  await rpc('admin_archive',{p_story_id:d.story_id,p_archived:true,p_expected_revision:d.id});
  assert.equal((await rpc('admin_revision',{p_revision_id:d.id})).is_archived,true);
  await assert.rejects(rpc('admin_delete_draft',{p_revision_id:clone.id,p_expected_version:clone.edit_version-1}),/draft_version_conflict/);
  await rpc('admin_delete_draft',{p_revision_id:clone.id,p_expected_version:clone.edit_version});
  assert.ok((await rpc('admin_history',{p_story_id:d.story_id,p_before_id:null})).some(h=>h.action==='draft_deleted'));
  const orphanId=randomUUID();
  await fetch(`${origin}/api/media`,{method:'POST',headers:{...headers,'X-Asset-Id':orphanId},body:cover});
  assert.ok((await rpc('admin_unused_media',{p_before_id:null})).some(a=>a.id===orphanId));
  const remove=id=>fetch(`${origin}/api/media/remove`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id})});
  assert.equal((await remove(id)).status,400);
  assert.equal((await remove(orphanId)).status,200);assert.equal((await fetch(`${origin}/media/${orphanId}`)).status,404);
  await stop();await start();
  const restored=await rpc('admin_revision',{p_revision_id:d.id});assert.equal(restored.title,'HTTP verified story');assert.equal(restored.cover_asset_id,id);assert.equal(restored.is_archived,true);assert.ok(restored.published_at);
  assert.deepEqual(restored.questions,saved.questions);
  assert.deepEqual(restored.descriptions,saved.descriptions);assert.deepEqual(restored.sentences.map(s=>s.translations),saved.sentences.map(s=>s.translations));
  assert.deepEqual(Buffer.from(await(await fetch(`${origin}/media/${id}`)).arrayBuffer()),cover);
  console.log('GEÇTİ: origin sınırları, RPC izin listesi, kapak yükleme/hash/indirme, yinelenen yükleme reddi, atomik kayıt/sürüm çakışması, eksik dilde yayın reddi, tamamlanan çevirilerin yayını/kopyalanması/arşivi, taslak silme/geçmiş, kullanılmayan medya temizliği ve yeniden başlatmada çevirilerin korunması. Yerel Auth fixture kullanıldı; canlı Supabase isteği yapılmadı.');
}finally{await stop();}
