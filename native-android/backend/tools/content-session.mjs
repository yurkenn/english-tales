// Signs an editor/publisher in from the operator's own terminal and stores the short-lived
// session for content:drafts / story-pilot:drafts. The password is never echoed or stored.
import {readFile,writeFile,mkdir,chmod} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const properties=async()=>Object.fromEntries((await readFile(fileURLToPath(new URL('../../config/production.properties',import.meta.url)),'utf8'))
  .split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const n=x.indexOf('=');return [x.slice(0,n),x.slice(n+1)];}));

function ask(question,{hidden=false}={}){
  const rl=createInterface({input:process.stdin,output:process.stdout,terminal:true});
  if(hidden)rl._writeToOutput=text=>{if(text.startsWith(question))process.stdout.write(question);};
  return new Promise(resolve=>rl.question(question,answer=>{rl.close();if(hidden)process.stdout.write('\n');resolve(answer.trim());}));
}

export async function main(args=process.argv.slice(2),{fetchImpl=fetch,prompt=ask}={}){
  const file=path.resolve(args[0]??path.join(homedir(),'.english-tales','content-session.json'));
  const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}=await properties();
  if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url??'')||!key?.startsWith('sb_publishable_'))throw Error('Üretim yapılandırması okunamadı');
  const email=await prompt('E-posta: '),password=await prompt('Şifre: ',{hidden:true});
  const response=await fetchImpl(`${url}/auth/v1/token?grant_type=password`,{method:'POST',redirect:'error',
    headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(30000)});
  // Server messages are not relayed: they could echo the submitted credentials.
  if(!response.ok)throw Error(`Giriş başarısız (HTTP ${Number(response.status)})`);
  const session=await response.json();
  if(typeof session?.access_token!=='string'||!session.access_token)throw Error('Geçersiz oturum yanıtı');
  await mkdir(path.dirname(file),{recursive:true,mode:0o700});
  await writeFile(file,JSON.stringify({access_token:session.access_token,publishable_key:key})+'\n',{mode:0o600});
  await chmod(file,0o600);
  const minutes=Math.floor(Number(session.expires_in)/60);
  console.log(`Oturum kaydedildi: ${file}${minutes>0?` (yaklaşık ${minutes} dakika geçerli)`:''}`);
  return file;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  console.error(error.message);process.exitCode=1;
});
