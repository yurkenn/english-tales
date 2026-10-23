// Publishes the editor drafts a story-pilot:drafts --apply run created, exactly as that run left them.
// Without --apply it only lists them. Run --apply from the publisher's own terminal.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {contentClient} from './long-stories-publish.mjs';

const json=value=>JSON.stringify(value,null,2)+'\n';

export async function main(args=process.argv.slice(2),{fetchImpl}={}){
  const options={apply:false};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--apply')options.apply=true;
    else if(['--results','--url','--session-file'].includes(arg)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Eksik değer: ${arg}`);
      options[{'--session-file':'sessionFile'}[arg]??arg.slice(2)]=value;
    }else if(arg==='--help'){
      console.log('npm run drafts:publish -- --results <story-pilot-drafts/apply-results.json> [--apply --url <supabase-url|http://127.0.0.1:4178> --session-file <outside-git.json>]');return;
    }else throw Error(`Bilinmeyen seçenek: ${arg}`);
  }
  if(!options.results)throw Error('--results gerekli');
  if(options.apply&&!options.url)throw Error('--apply için --url gerekli');
  const file=path.resolve(options.results),run=JSON.parse(await readFile(file,'utf8'));
  if(run.status!=='completed'||!Array.isArray(run.stories))throw Error('Taslak çalıştırması tamamlanmamış');
  const drafts=run.stories.filter(s=>['saved','skipped-equivalent'].includes(s.status));
  for(const d of drafts)if(typeof d.revisionId!=='string'||!Number.isSafeInteger(d.editVersion))throw Error(`Geçersiz kayıt: ${d.storyId}`);
  if(!options.apply){for(const d of drafts)console.log(`${d.storyId} · ${d.revisionId} · v${d.editVersion}`);return {drafts};}
  const client=await contentClient({url:options.url,sessionFile:options.sessionFile,fetchImpl});
  if(!client.demo&&await client.rpc('content_role',{})!=='publisher')throw Error('Bu hesap yayıncı değil');
  const results=[],out=path.join(path.dirname(file),'publish-results.json');
  for(const d of drafts){
    const doc=await client.rpc('admin_revision',{p_revision_id:d.revisionId});
    if(doc.published_at){results.push({storyId:d.storyId,status:'already-published'});continue;}
    // A draft edited after the run is not what was reviewed; it is left for the panel.
    if(doc.story_id!==d.storyId||doc.edit_version!==d.editVersion)throw Error(`Taslak çalıştırmadan sonra değişmiş: ${d.storyId}`);
    await client.rpc('admin_publish',{p_revision_id:d.revisionId,p_expected_version:d.editVersion});
    results.push({storyId:d.storyId,status:'published',revisionId:d.revisionId});
    await writeFile(out,json({status:'running',stories:results}));
  }
  await writeFile(out,json({status:'completed',stories:results}));
  console.log(JSON.stringify({output:out,stories:results},null,2));
  return {results};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  console.error(`Taslak yayını başarısız: ${error.message}`);process.exitCode=1;
});
