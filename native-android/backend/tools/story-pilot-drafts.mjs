import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {applyDrafts,sha256} from './content-drafts-lib.mjs';
import {sessionRPC} from './content-drafts.mjs';
import {buildPilotPreview} from './story-pilot-preview-lib.mjs';
import {generatePilotDrafts,renderPilotDraftReport} from './story-pilot-drafts-lib.mjs';

const json=value=>JSON.stringify(value,null,2)+'\n';
const local=file=>fileURLToPath(new URL(file,import.meta.url));

export async function main(args=process.argv.slice(2),{fetchImpl}={}){
  const options={apply:false,output:local('../../build/story-pilot-drafts/'),scope:local('../content/drafts/pilot-scope.json')};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--apply')options.apply=true;
    else if(['--snapshot','--output','--url','--session-file','--scope'].includes(arg)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Eksik değer: ${arg}`);
      options[{'--session-file':'sessionFile'}[arg]??arg.slice(2)]=value;
    }else if(arg==='--help'){
      console.log('npm run story-pilot:drafts -- --snapshot <catalog.json> [--scope <scope.json>] [--output <directory>] [--apply --url <supabase-url> --session-file <outside-git.json>]\nCreates editor drafts only; never publishes.');return;
    }else throw Error(`Bilinmeyen seçenek: ${arg}`);
  }
  if(!options.snapshot)throw Error('--snapshot gerekli');
  if(options.apply&&(!options.url||!options.sessionFile))throw Error('--apply için --url ve --session-file gerekli');
  const files={snapshot:path.resolve(options.snapshot),bundle:local('../../app/src/main/assets/catalog/v1.json'),
    scope:path.resolve(options.scope)};
  const raw=Object.fromEntries(await Promise.all(Object.entries(files).map(async([key,file])=>[key,await readFile(file)])));
  const data=Object.fromEntries(Object.entries(raw).map(([key,bytes])=>[key,JSON.parse(bytes)]));
  const ids=data.scope.activeRevisionStoryIds;
  if(!Array.isArray(ids)||!ids.every(id=>typeof id==='string'&&/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)))throw Error('Invalid active story IDs');
  const draftFiles=ids.map(id=>local(`../content/drafts/revisions/${id}.json`));
  const draftBytes=await Promise.all(draftFiles.map(file=>readFile(file)));
  // Review is checked before any credential is read; a dry run still shows the pending stories.
  const preview=buildPilotPreview(data.bundle,data.scope,draftBytes.map(bytes=>JSON.parse(bytes)));
  const packet=generatePilotDrafts(data.bundle,data.snapshot,preview);
  packet.inputs={...Object.fromEntries(Object.entries(files).map(([key,file])=>[key,{path:file,sha256:sha256(raw[key])}])),
    drafts:{path:draftFiles.join(', '),sha256:sha256(Buffer.concat(draftBytes))},
    tools:{path:'story-pilot-drafts*.mjs, story-pilot-preview-lib.mjs, content-drafts-lib.mjs',
      sha256:sha256(Buffer.concat(await Promise.all(['./story-pilot-drafts.mjs','./story-pilot-drafts-lib.mjs','./story-pilot-preview-lib.mjs','./content-drafts-lib.mjs']
        .map(file=>readFile(new URL(file,import.meta.url))))))}};
  packet.packageSHA256=sha256(JSON.stringify(Object.fromEntries(Object.entries(packet.inputs).map(([key,value])=>[key,value.sha256]))));
  const output=path.resolve(options.output),manifestFile=path.join(output,'manifest.json');
  let previous;
  try{previous=JSON.parse(await readFile(manifestFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(previous&&previous.packageSHA256!==packet.packageSHA256)throw Error('Çıktı dizini başka girdilere ait; yeni --output dizini kullanın ve tekrar inceleyin');
  await mkdir(path.join(output,'stories'),{recursive:true});
  for(const plan of packet.drafts){plan.file=`stories/${plan.storyId}.json`;await writeFile(path.join(output,plan.file),json(plan));}
  await writeFile(manifestFile,json(packet));
  await writeFile(path.join(output,'review.md'),renderPilotDraftReport(packet));
  const results=[];
  const progress=status=>writeFile(path.join(output,'apply-results.json'),json({packageSHA256:packet.packageSHA256,mode:'apply',status,stories:results}));
  if(options.apply&&packet.blockers.length)throw Error(`Uygulama engelleri var; ${path.join(output,'review.md')} dosyasını inceleyin.`);
  if(options.apply)await progress('running');
  let result;
  try{
    const rpc=options.apply?await sessionRPC({url:options.url,sessionFile:options.sessionFile,project:data.snapshot.project,fetchImpl}):undefined;
    result=await applyDrafts(packet,{apply:options.apply,rpc,onResult:async row=>{results.push(row);await progress('running');}});
  }catch(error){if(options.apply)await progress('failed');throw error;}
  await writeFile(path.join(output,options.apply?'apply-results.json':'dry-run.json'),json({packageSHA256:packet.packageSHA256,status:'completed',...result}));
  console.log(JSON.stringify({output,packageSHA256:packet.packageSHA256,blockers:packet.blockers,...result},null,2));
  return {packet,result};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  console.error(`Pilot taslak hazırlığı başarısız: ${error.message}`);process.exitCode=1;
});
