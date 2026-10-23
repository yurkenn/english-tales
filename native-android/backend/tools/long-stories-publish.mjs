// Publishes approved long-story drafts as new catalog stories: draft, cover upload, save, publish.
// Without --apply it only writes the documents and a report. Run --apply from the publisher's own terminal.
import {readFile,writeFile,mkdir,readdir,realpath,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {longStoryDocument,longStoryBlockers,documentSHA256} from './long-stories-lib.mjs';

const local=file=>fileURLToPath(new URL(file,import.meta.url));
const json=value=>JSON.stringify(value,null,2)+'\n';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const allowedRPC=new Set(['content_role','admin_catalog','admin_revision','admin_create_draft','admin_save_draft','admin_publish']);

async function readSession(file){
  const real=await realpath(file),info=await stat(real);
  if(!info.isFile()||info.size>1024*1024||(info.mode&0o077))throw Error('Oturum dosyası normal, en fazla 1 MB ve chmod 600 olmalı');
  let inRepository=false;
  try{execFileSync('git',['-C',path.dirname(real),'rev-parse','--show-toplevel'],{stdio:'ignore'});inRepository=true;}catch{}
  if(inRepository)throw Error('Oturum dosyası Git çalışma ağaçlarının dışında olmalı');
  const session=JSON.parse(await readFile(real,'utf8'));
  if(typeof session?.access_token!=='string'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(session?.publishable_key??''))
    throw Error('access_token ve publishable_key gerekli');
  return session;
}

/** Supabase (session file) or the local demo panel (http://127.0.0.1:4178); server messages are never relayed. */
export async function contentClient({url,sessionFile,fetchImpl=fetch}){
  const base=new URL(url),demo=['127.0.0.1','localhost'].includes(base.hostname);
  if((!demo&&(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co')))||base.pathname!=='/'||base.search||base.username)
    throw Error('Yalnız Supabase proje kökü veya yerel panel adresi kullanılabilir');
  const session=demo?null:await readSession(sessionFile);
  const auth=demo?{}:{apikey:session.publishable_key,Authorization:`Bearer ${session.access_token}`};
  const call=async(target,init,label)=>{
    let response;
    try{response=await fetchImpl(new URL(target,base),{redirect:'error',signal:AbortSignal.timeout(60000),...init});}
    catch{throw Error(`Bağlantı başarısız: ${label}`);}
    if(!response.ok)throw Error(`Sunucu reddetti: ${label} (HTTP ${Number(response.status)})`);
    return response;
  };
  const origin={Origin:base.origin};
  return {
    demo,
    async rpc(name,args){
      if(!allowedRPC.has(name))throw Error('RPC izin listesinde değil');
      const response=demo?await call('/api/rpc',{method:'POST',headers:{'Content-Type':'application/json',...origin},body:JSON.stringify({name,args})},name)
        :await call(`/rest/v1/rpc/${name}`,{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify(args)},name);
      const text=await response.text();return text?JSON.parse(text):null;
    },
    async uploadCover(bytes,mime){
      const id=crypto.randomUUID();
      if(demo)return (await call('/api/media',{method:'POST',headers:{'Content-Type':mime,'X-Asset-Id':id,'X-Kind':'cover',...origin},body:bytes},'kapak')).json();
      const asset={id,kind:'cover',storage_path:`cover/${id}/${sha256(bytes)}`,sha256:sha256(bytes),byte_size:bytes.length,mime_type:mime};
      await call('/rest/v1/content_assets',{method:'POST',headers:{...auth,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(asset)},'kapak kaydı');
      await call(`/storage/v1/object/story-media/${asset.storage_path}`,{method:'POST',headers:{...auth,'Content-Type':mime,'x-upsert':'false'},body:bytes},'kapak yükleme');
      const back=Buffer.from(await (await call(`/storage/v1/object/authenticated/story-media/${asset.storage_path}`,{headers:auth},'kapak doğrulama')).arrayBuffer());
      if(back.length!==bytes.length||sha256(back)!==asset.sha256)throw Error('Yüklenen kapak doğrulanamadı');
      return asset;
    }
  };
}

const coverMime=file=>({'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)];

export async function main(args=process.argv.slice(2),{fetchImpl}={}){
  const options={apply:false,ids:null,output:local('../../build/long-stories-publish/')};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--apply')options.apply=true;
    else if(['--ids','--url','--session-file','--output','--drafts'].includes(arg)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Eksik değer: ${arg}`);
      options[{'--session-file':'sessionFile'}[arg]??arg.slice(2)]=value;
    }else if(arg==='--help'){
      console.log('npm run long-stories:publish -- [--ids a,b] [--drafts <dir>] [--output <dir>] [--apply --url <supabase-url|http://127.0.0.1:4178> --session-file <outside-git.json>]');return;
    }else throw Error(`Bilinmeyen seçenek: ${arg}`);
  }
  if(options.apply&&!options.url)throw Error('--apply için --url gerekli');
  const dir=options.drafts?path.resolve(options.drafts):local('../content/drafts/long-stories/');
  const files=(await readdir(dir)).filter(f=>f.endsWith('.json')).sort();
  const wanted=options.ids?new Set(options.ids.split(',')):null;
  const catalog=JSON.parse(await readFile(local('../../app/src/main/assets/catalog/v1.json'),'utf8'));
  const catalogStoryIds=new Set(catalog.stories.map(s=>s.id));
  const plans=[];
  for(const file of files){
    const draft=JSON.parse(await readFile(path.join(dir,file),'utf8'));
    if(wanted&&!wanted.has(draft.story.id))continue;
    const cover=local(`../../app/src/main/res/drawable-nodpi/${draft.story.coverKey}.webp`);
    const blockers=longStoryBlockers(draft,{catalogStoryIds});
    let coverBytes=null;try{coverBytes=await readFile(cover);}catch{blockers.push(`Kapak dosyası yok: ${draft.story.coverKey}`);}
    if(coverBytes&&coverBytes.length>6291456)blockers.push('Kapak 6 MB sınırını aşıyor');
    const document=longStoryDocument(draft);
    plans.push({storyId:draft.story.id,title:draft.story.title,cover,coverSHA256:coverBytes&&sha256(coverBytes),coverBytes,
      blockers,documentSHA256:documentSHA256(document),document,
      summary:{sentences:document.sentences.length,words:document.words.length,links:document.links.length,questions:document.questions.length}});
  }
  if(wanted)for(const id of wanted)if(!plans.some(p=>p.storyId===id))throw Error(`Taslak bulunamadı: ${id}`);
  const output=path.resolve(options.output);await mkdir(output,{recursive:true});
  const report=['# Uzun hikâyeler → yayın','',`Mod: ${options.apply?'uygula':'deneme (yazma yok)'}`,'',
    '| Hikâye | Cümle | Kelime | Bağlantı | Soru | Kapak SHA-256 | Belge SHA-256 | Engeller |','|---|---|---|---|---|---|---|---|',
    ...plans.map(p=>`| ${p.storyId} | ${p.summary.sentences} | ${p.summary.words} | ${p.summary.links} | ${p.summary.questions} | ${(p.coverSHA256??'—').slice(0,12)} | ${p.documentSHA256.slice(0,12)} | ${p.blockers.join('; ')||'Yok'} |`)];
  await writeFile(path.join(output,'report.md'),report.join('\n')+'\n');
  const blocked=plans.filter(p=>p.blockers.length);
  if(!options.apply){console.log(report.join('\n'));return {plans};}
  if(blocked.length)throw Error(`Engelli taslaklar var: ${blocked.map(p=>p.storyId).join(', ')}; ${path.join(output,'report.md')}`);
  const client=await contentClient({url:options.url,sessionFile:options.sessionFile,fetchImpl});
  if(!client.demo&&await client.rpc('content_role',{})!=='publisher')throw Error('Bu hesap yayıncı değil');
  const rows=[];for(let offset=0;;offset+=100){const page=await client.rpc('admin_catalog',{p_offset:offset,p_limit:100});rows.push(...page);if(page.length<100)break;}
  const results=[];const progress=status=>writeFile(path.join(output,'apply-results.json'),json({status,stories:results}));
  for(const plan of plans){
    if(rows.some(r=>r.story_id===plan.storyId&&r.published_at)){results.push({storyId:plan.storyId,status:'already-published'});await progress('running');continue;}
    let revision=await client.rpc('admin_create_draft',{p_story_id:plan.storyId,p_source_id:null});
    const asset=revision.cover?.sha256===plan.coverSHA256?revision.cover:await client.uploadCover(plan.coverBytes,coverMime(plan.cover));
    const document={...plan.document,cover_asset_id:asset.id};
    revision=await client.rpc('admin_save_draft',{p_revision_id:revision.id,p_expected_version:revision.edit_version,p_document:document});
    const ids=list=>list.map(x=>x.id).join(',');
    if(ids(revision.sentences)!==ids(document.sentences)||ids([...revision.words].sort((a,b)=>a.id.localeCompare(b.id)))!==ids(document.words)
      ||revision.links.length!==document.links.length||revision.cover?.id!==asset.id)throw Error(`Kaydedilen taslak beklenenden farklı: ${plan.storyId}`);
    const published=await client.rpc('admin_publish',{p_revision_id:revision.id,p_expected_version:revision.edit_version});
    results.push({storyId:plan.storyId,status:'published',revisionId:published,coverAssetId:asset.id,documentSHA256:plan.documentSHA256});
    await progress('running');
  }
  await progress('completed');
  console.log(JSON.stringify({output,stories:results},null,2));
  return {plans,results};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  console.error(`Uzun hikâye yayını başarısız: ${error.message}`);process.exitCode=1;
});
