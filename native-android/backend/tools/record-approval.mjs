// Records the owner's publication approval on content drafts. It must be typed by the owner in an
// interactive terminal; nothing else (no flag, no pipe) can set it.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {LANGUAGES} from './long-stories-lib.mjs';

const local=file=>fileURLToPath(new URL(file,import.meta.url));
const STATUS='AI-assisted translation drafts approved for publication by the project owner; not native-speaker-approved';
const ask=question=>{const rl=createInterface({input:process.stdin,output:process.stdout,terminal:true});
  return new Promise(resolve=>rl.question(question,answer=>{rl.close();resolve(answer.trim());}));};

async function pending(){
  const found=[];
  for(const dir of ['../content/drafts/long-stories/','../content/drafts/revisions/']){
    for(const file of (await readdir(local(dir))).filter(f=>f.endsWith('.json')).sort()){
      const full=local(dir+file),doc=JSON.parse(await readFile(full,'utf8'));
      if(!doc.reviewedBy)found.push({full,doc,title:doc.story?.title??doc.preview?.title??file});
    }
  }
  return found;
}

export async function main(){
  if(!process.stdin.isTTY||!process.stdout.isTTY)throw Error('Bu araç yalnız etkileşimli terminalde, onaylayan kişi tarafından çalıştırılır');
  const drafts=await pending();
  if(!drafts.length){console.log('Onay bekleyen taslak yok.');return;}
  console.log(`Onay bekleyen ${drafts.length} taslak:`);
  for(const d of drafts)console.log(`- ${path.relative(local('../'),d.full)} · ${d.title}`);
  const name=await ask('Onaylayan kişinin adı: ');
  if(!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(name))throw Error('Geçerli bir ad yazın');
  if((await ask(`Bu taslakların yayınlanmasını onaylıyor musunuz? Onay için "evet" yazın: `)).toLocaleLowerCase('tr')!=='evet'){console.log('Onay kaydedilmedi.');return;}
  for(const {full,doc} of drafts){
    doc.reviewedBy=name;
    doc.translationReadiness={...doc.translationReadiness,reviewedLanguages:[...LANGUAGES],reviewStatus:STATUS};
    if(Array.isArray(doc.publicationBlockers))doc.publicationBlockers=doc.publicationBlockers.filter(b=>!/^Owner \(oguz\) approval/.test(b));
    await writeFile(full,JSON.stringify(doc,null,2)+'\n');
  }
  console.log(`${drafts.length} taslağa onay kaydedildi.`);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  console.error(error.message);process.exitCode=1;
});
