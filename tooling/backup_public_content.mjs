// Back up the reader-visible catalog without Auth credentials or a privileged key.
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const settings=Object.fromEntries((await readFile(path.join(root,'native-android/config/production.properties'),'utf8')).split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const n=x.indexOf('=');return [x.slice(0,n),x.slice(n+1)];}));
const base=settings.SUPABASE_URL;
if(base!=='https://gtuangjukckpuerczfxd.supabase.co'||!settings.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) throw Error('Production configuration required');
const parent=path.join(root,'native-android/build/content-backups');
await mkdir(parent,{recursive:true});
const directory=path.join(parent,new Date().toISOString().replaceAll(':','-'));
await mkdir(directory);await mkdir(path.join(directory,'media'));
const headers={apikey:settings.SUPABASE_PUBLISHABLE_KEY};
async function get(route){const response=await fetch(base+route,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Backup read failed: ${response.status}`);return response;}
async function rows(table){const order={story_sentences:'revision_id,id',revision_words:'revision_id,id',sentence_words:'revision_id,sentence_id,word_id'}[table]??'id';const result=[];for(let offset=0;offset<20000;offset+=500){const page=await (await get(`/rest/v1/${table}?select=*&order=${order}&limit=500&offset=${offset}`)).json();result.push(...page);if(page.length<500)return result;}throw Error('Catalog row limit exceeded');}
const tables={};
for(const table of ['stories','content_assets','story_revisions','story_sentences','revision_words','sentence_words'])tables[table]=await rows(table);
const media=[];
for(const asset of tables.content_assets){
  if(!/^[a-f0-9-]{36}$/.test(asset.id)||asset.byte_size>20971520)throw Error('Invalid asset');
  const route=asset.storage_path.split('/').map(encodeURIComponent).join('/');
  const bytes=Buffer.from(await (await get(`/storage/v1/object/authenticated/story-media/${route}`)).arrayBuffer());
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(bytes.length!==Number(asset.byte_size)||hash!==asset.sha256)throw Error('Media checksum mismatch');
  await writeFile(path.join(directory,'media',asset.id),bytes,{flag:'wx'});
  media.push({id:asset.id,sha256:hash,byteSize:bytes.length});
}
const current=await rows('stories');
const signature=stories=>JSON.stringify(stories.map(s=>[s.id,s.current_revision_id,s.is_archived]).sort((a,b)=>a[0].localeCompare(b[0])));
if(signature(current)!==signature(tables.stories))throw Error('Catalog changed during backup; discard this incomplete directory and run again');
await writeFile(path.join(directory,'catalog.json'),JSON.stringify({format:1,project:'gtuangjukckpuerczfxd',createdAt:new Date().toISOString(),scope:'Reader-visible published content only; excludes Auth, learning records, drafts, archives, audit and service configuration',tables,media},null,2),{flag:'wx'});
console.log(JSON.stringify({directory,stories:tables.stories.length,sentences:tables.story_sentences.length,verifiedMedia:media.length,scope:'Published content only'}));
