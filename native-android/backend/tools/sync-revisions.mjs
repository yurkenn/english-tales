import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {planRevisions,applyPlan} from './revision-sync-lib.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
// The five A1 classics of the vocabulary density pilot (#9): the first publication group.
export const PILOT=['classic-tortoise-hare','classic-lion-mouse','classic-fox-grapes','classic-dog-shadow','classic-boy-cried-wolf'];
const usage=`node tools/sync-revisions.mjs plan --snapshot <backup/catalog.json> [--pilot | --stories a,b] [--output <plan.json>]
node --env-file=.env.admin tools/sync-revisions.mjs apply --plan <plan.json> [--publish]
  apply signs in with ET_STAFF_EMAIL / ET_STAFF_PASSWORD; SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY come from .env.admin.`;

function options(args){
  const result={command:args[0]};
  for(let i=1;i<args.length;i++){
    const arg=args[i];
    if(['--snapshot','--stories','--output','--plan'].includes(arg)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Missing value: ${arg}`);result[arg.slice(2)]=value;
    }else if(arg==='--pilot')result.pilot=true;
    else if(arg==='--publish')result.publish=true;
    else throw Error(`Unknown argument: ${arg}`);
  }
  return result;
}

async function staffRpc(env=process.env){
  const url=(env.SUPABASE_URL||'').replace(/\/$/,''),key=env.SUPABASE_PUBLISHABLE_KEY||'';
  if(!url.startsWith('https://')||!key.startsWith('sb_publishable_'))throw Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required (use --env-file=.env.admin)');
  if(!env.ET_STAFF_EMAIL||!env.ET_STAFF_PASSWORD)throw Error('ET_STAFF_EMAIL and ET_STAFF_PASSWORD are required');
  const request=async(route,init)=>{
    const response=await fetch(url+route,{...init,redirect:'error',signal:AbortSignal.timeout(30000)});
    const text=await response.text(),body=text.trim()?JSON.parse(text):null;
    if(!response.ok)throw Error(body?.message||body?.error_description||`Request failed (${response.status})`);
    return body;
  };
  const session=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
    body:JSON.stringify({email:env.ET_STAFF_EMAIL,password:env.ET_STAFF_PASSWORD})});
  const headers={apikey:key,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'};
  return {project:new URL(url).hostname,rpc:(name,args)=>request(`/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(args)})};
}

export async function main(args=process.argv.slice(2)){
  const o=options(args);
  if(o.command==='plan'){
    if(!o.snapshot)throw Error('plan requires --snapshot');
    if(o.pilot&&o.stories)throw Error('Use either --pilot or --stories');
    const catalog=JSON.parse(await readFile(path.join(root,'native-android/app/src/main/assets/catalog/v1.json'),'utf8'));
    const snapshot=JSON.parse(await readFile(path.resolve(o.snapshot),'utf8'));
    const plan=planRevisions(catalog,snapshot,{stories:o.pilot?PILOT:o.stories?.split(',').map(s=>s.trim()).filter(Boolean)??null});
    const output=path.resolve(o.output??path.join(root,'native-android/build/content-revisions/plan.json'));
    await mkdir(path.dirname(output),{recursive:true});
    await writeFile(output,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({output,stories:plan.stories.map(p=>({storyId:p.storyId,...p.changes})),blocked:plan.blocked},null,2));
    return plan;
  }
  if(o.command==='apply'){
    if(!o.plan)throw Error('apply requires --plan');
    const plan=JSON.parse(await readFile(path.resolve(o.plan),'utf8'));
    const {project,rpc}=await staffRpc();
    console.error(`Project ${project}: ${o.publish?'preparing and publishing':'preparing drafts for'} ${plan.stories.length} stories.`);
    const result=await applyPlan(plan,rpc,{publish:Boolean(o.publish),log:r=>console.error(`${r.storyId}: ${r.status}`)});
    console.log(JSON.stringify(result,null,2));
    if(result.summary.staleBase||result.summary.conflicts)process.exitCode=1;
    return result;
  }
  console.log(usage);
  if(o.command!=='--help'&&o.command!==undefined)process.exitCode=1;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(`Revision sync failed: ${error.message}`);process.exitCode=1;});
