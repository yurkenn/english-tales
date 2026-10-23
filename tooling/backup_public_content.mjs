// Back up the reader-visible catalog without Auth credentials or a privileged key.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const coreTables=['stories','content_assets','story_revisions','story_sentences','revision_words','sentence_words'];
const translations=['sentence_translations','word_translations','revision_texts'];
const orders={story_sentences:'revision_id,id',revision_words:'revision_id,id',sentence_words:'revision_id,sentence_id,word_id',
  sentence_translations:'revision_id,sentence_id,lang',word_translations:'revision_id,word_id,lang',revision_texts:'revision_id,lang',story_questions:'revision_id,position',revision_tags:'revision_id,tag_id'};
const signature=stories=>JSON.stringify(stories.map(s=>[s.id,s.current_revision_id,s.is_archived]).sort((a,b)=>a[0].localeCompare(b[0])));

/** Importing this module never reads credentials, writes files or opens a connection. */
export async function backupPublicContent({settings,parent,fetchImpl=fetch,now=()=>new Date(),cursorPaging=false}={}){
  settings??=Object.fromEntries((await readFile(path.join(root,'native-android/config/production.properties'),'utf8')).split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const n=x.indexOf('=');return [x.slice(0,n),x.slice(n+1)];}));
  const base=settings.SUPABASE_URL;
  if(base!=='https://gtuangjukckpuerczfxd.supabase.co'||!settings.SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_'))throw Error('Production configuration required');
  parent??=path.join(root,'native-android/build/content-backups');
  await mkdir(parent,{recursive:true});
  const directory=path.join(parent,now().toISOString().replaceAll(':','-'));
  await mkdir(directory);await mkdir(path.join(directory,'media'));
  const headers={apikey:settings.SUPABASE_PUBLISHABLE_KEY};
  async function get(route,{retryTimeout=true}={}){
    const response=await fetchImpl(base+route,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok){
      let code;try{code=(await response.json()).code;}catch{}
      // A concurrent publication can briefly exhaust the read-only statement budget.
      // Retry this idempotent GET once; never hide permissions or other server errors.
      if(code==='57014'&&retryTimeout)return get(route,{retryTimeout:false});
      const error=Error(`Backup read failed: ${response.status}`);
      error.missingTable=[404,400].includes(response.status)&&['PGRST205','42P01'].includes(code);
      throw error;
    }
    return response;
  }
  async function rows(table,{optional=false}={}){
    const result=[];let last;
    const keys=(orders[table]??"id").split(",");
    const literal=value=>`"${String(value).replaceAll("\\","\\\\").replaceAll('"','\\"')}"`;
    // Translation rows grow with both languages and retained published revisions.
    for(let offset=0;offset<100000;offset+=500){
      let response;
      try{
        let route=`/rest/v1/${table}?select=*&order=${orders[table]??'id'}&limit=500&offset=${cursorPaging?0:offset}`;
        if(cursorPaging&&last){
          const terms=keys.map((key,i)=>{
            const equal=keys.slice(0,i).map(k=>`${k}.eq.${literal(last[k])}`);
            const greater=`${key}.gt.${literal(last[key])}`;
            return equal.length?`and(${[...equal,greater].join(',')})`:greater;
          });
          route+='&or='+encodeURIComponent(`(${terms.join(',')})`);
        }
        response=await get(route);
      }
      catch(error){if(optional&&offset===0&&error.missingTable)return undefined;throw error;}
      const page=await response.json();
      if(!Array.isArray(page)||page.length>500)throw Error(`Invalid catalog page: ${table}`);
      result.push(...page);if(page.length<500)return result;
      if(cursorPaging){
        const next=page.at(-1);
        if(keys.some(k=>typeof next[k]!=='string')||last&&keys.every(k=>last[k]===next[k]))throw Error(`Invalid pagination cursor: ${table}`);
        last=next;
      }
    }
    throw Error('Catalog row limit exceeded');
  }
  const tables={};
  for(const table of coreTables)tables[table]=await rows(table);
  for(const table of [...translations,'story_questions','revision_tags']){
    const result=await rows(table,{optional:true});
    if(result!==undefined)tables[table]=result;
  }
  // A partial translation group must not masquerade as a complete snapshot.
  const present=translations.filter(table=>tables[table]!==undefined);
  if(present.length&&present.length!==translations.length)throw Error('Incomplete translation tables');
  const media=[];
  for(const asset of tables.content_assets){
    if(!/^[a-f0-9-]{36}$/.test(asset.id)||!Number.isSafeInteger(Number(asset.byte_size))||Number(asset.byte_size)<=0||asset.byte_size>20971520)throw Error('Invalid asset');
    const route=asset.storage_path.split('/').map(encodeURIComponent).join('/');
    const bytes=Buffer.from(await (await get(`/storage/v1/object/authenticated/story-media/${route}`)).arrayBuffer());
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(bytes.length!==Number(asset.byte_size)||hash!==asset.sha256)throw Error('Media checksum mismatch');
    await writeFile(path.join(directory,'media',asset.id),bytes,{flag:'wx'});
    media.push({id:asset.id,sha256:hash,byteSize:bytes.length});
  }
  if(signature(await rows('stories'))!==signature(tables.stories))throw Error('Catalog changed during backup; discard this incomplete directory and run again');
  const snapshot={format:1,project:'gtuangjukckpuerczfxd',createdAt:now().toISOString(),scope:'Reader-visible published content only; excludes Auth, learning records, drafts, archives, audit and service configuration',tables,media};
  await writeFile(path.join(directory,'catalog.json'),JSON.stringify(snapshot,null,2),{flag:'wx'});
  return {directory,snapshot};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {directory,snapshot:{tables,media}}=await backupPublicContent({cursorPaging:true});
  console.log(JSON.stringify({directory,stories:tables.stories.length,sentences:tables.story_sentences.length,questions:tables.story_questions?.length??null,verifiedMedia:media.length,scope:'Published content only'}));
}
