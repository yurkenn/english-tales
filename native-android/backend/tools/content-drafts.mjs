import {readFile,writeFile,mkdir,realpath,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {generateDrafts,renderDraftReport,applyDrafts,sha256} from './content-drafts-lib.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const json=value=>JSON.stringify(value,null,2)+'\n';
const allowedRPC=new Set(['content_role','admin_catalog','admin_revision','admin_create_draft','admin_save_draft']);

export async function sessionRPC({url,sessionFile,project,fetchImpl=fetch}){
  const base=new URL(url);
  const local=['localhost','127.0.0.1','[::1]'].includes(base.hostname);
  if((base.protocol!=='https:'&&!(local&&base.protocol==='http:'))||base.username||base.password||base.search||base.hash||base.pathname!=='/')
    throw Error('Yalnız HTTPS proje kökü (yerelde localhost HTTP) kullanılabilir');
  if(!local&&base.hostname!==`${project}.supabase.co`)throw Error('URL snapshot projesiyle eşleşmiyor; özel alan adları desteklenmiyor');
  const file=await realpath(sessionFile),info=await stat(file);
  if(!info.isFile()||info.size>1024*1024||(info.mode&0o077))throw Error('Oturum dosyası normal, en fazla 1 MB ve chmod 600 olmalı');
  let inRepository=false;
  try{execFileSync('git',['-C',path.dirname(file),'rev-parse','--show-toplevel'],{stdio:'ignore'});inRepository=true;}catch{}
  if(inRepository)throw Error('Oturum dosyası Git çalışma ağaçlarının dışında olmalı');
  let session;
  try{session=JSON.parse(await readFile(file,'utf8'));}catch{throw Error('Oturum dosyası geçerli JSON olmalı');}
  const token=session?.access_token,key=session?.publishable_key??process.env.SUPABASE_PUBLISHABLE_KEY;
  if(typeof token!=='string'||!token.trim()||/[\r\n]/.test(token)||typeof key!=='string'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))
    throw Error('access_token ve publishable_key (veya SUPABASE_PUBLISHABLE_KEY) gerekli');
  return async(name,args)=>{
    if(!allowedRPC.has(name))throw Error('RPC izin listesinde değil');
    let response;
    try{
      response=await fetchImpl(new URL(`/rest/v1/rpc/${name}`,base),{method:'POST',
        headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),
        redirect:'error',signal:AbortSignal.timeout(30000)});
    }catch{throw Error(`RPC bağlantısı başarısız: ${name}; taslakları panelde kontrol edin ve yeniden çalıştırın`);}
    // Never relay server messages or transport errors: they may reflect credentials.
    if(!response.ok)throw Error(`RPC reddedildi: ${name} (HTTP ${Number(response.status)})`);
    try{return await response.json();}catch{throw Error(`Geçersiz RPC JSON yanıtı: ${name}`);}
  };
}

export async function main(args=process.argv.slice(2),{fetchImpl}={}){
  const options={apply:false,output:path.join(root,'native-android/build/content-drafts'),
    bundle:path.join(root,'native-android/app/src/main/assets/catalog/v1.json'),
    assetManifest:path.join(root,'native-android/backend/supabase/asset-upload-manifest.json')};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--apply')options.apply=true;
    else if(['--snapshot','--bundle','--asset-manifest','--output','--url','--session-file'].includes(arg)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Eksik değer: ${arg}`);
      options[{'--asset-manifest':'assetManifest','--session-file':'sessionFile'}[arg]??arg.slice(2)]=value;
    }else if(arg==='--help'){
      console.log('npm run content:drafts -- --snapshot <catalog.json> [--output <directory>] [--bundle <v1.json>] [--asset-manifest <manifest.json>] [--apply --url <supabase-url> --session-file <outside-git.json>]');return;
    }else throw Error(`Bilinmeyen seçenek: ${arg}`);
  }
  if(!options.snapshot)throw Error('--snapshot gerekli');
  if(options.apply&&(!options.url||!options.sessionFile))throw Error('--apply için --url ve --session-file gerekli');
  const inputs={};
  for(const key of ['snapshot','bundle','assetManifest']){
    const bytes=await readFile(options[key]);inputs[key]={path:path.resolve(options[key]),sha256:sha256(bytes),data:JSON.parse(bytes)};
  }
  const packet=generateDrafts(inputs.bundle.data,inputs.snapshot.data,inputs.assetManifest.data);
  packet.inputs=Object.fromEntries(Object.entries(inputs).map(([key,{path,sha256}])=>[key,{path,sha256}]));
  const toolFiles=['./content-drafts.mjs','./content-drafts-lib.mjs','./content-audit-lib.mjs','./export-catalog.mjs','../admin/workflow.js'];
  packet.inputs.tools={path:toolFiles.join(', '),sha256:sha256(Buffer.concat(await Promise.all(toolFiles.map(file=>readFile(new URL(file,import.meta.url))))))};
  packet.packageSHA256=sha256(JSON.stringify(Object.fromEntries(Object.entries(packet.inputs).map(([key,value])=>[key,value.sha256]))));
  options.output=path.resolve(options.output);
  const manifestFile=path.join(options.output,'manifest.json');
  let previous;
  try{previous=JSON.parse(await readFile(manifestFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(previous&&previous.packageSHA256!==packet.packageSHA256)throw Error('Çıktı dizini başka girdilere ait; yeni --output dizini kullanın ve tekrar inceleyin');
  await mkdir(path.join(options.output,'stories'),{recursive:true});
  for(const [index,plan] of packet.drafts.entries()){
    plan.file=`stories/${String(index+1).padStart(3,'0')}-${sha256(plan.storyId).slice(0,16)}.json`;
    await writeFile(path.join(options.output,plan.file),json(plan));
  }
  await writeFile(manifestFile,json(packet));
  await writeFile(path.join(options.output,'review.md'),renderDraftReport(packet));
  const results=[];
  const progress=status=>writeFile(path.join(options.output,'apply-results.json'),json({packageSHA256:packet.packageSHA256,mode:'apply',status,stories:results}));
  if(options.apply)await progress('running');
  let result;
  try{
    const rpc=options.apply?await sessionRPC({url:options.url,sessionFile:options.sessionFile,project:inputs.snapshot.data.project,fetchImpl}):undefined;
    result=await applyDrafts(packet,{apply:options.apply,rpc,onResult:async row=>{results.push(row);await progress('running');}});
  }catch(error){if(options.apply)await progress('failed');throw error;}
  await writeFile(path.join(options.output,options.apply?'apply-results.json':'dry-run.json'),json({packageSHA256:packet.packageSHA256,status:'completed',...result}));
  console.log(JSON.stringify({output:options.output,packageSHA256:packet.packageSHA256,blockers:packet.blockers,...result},null,2));
  return {packet,result};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  console.error(`Taslak hazırlığı başarısız: ${error.message}`);process.exitCode=1;
});
