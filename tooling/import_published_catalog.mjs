/** Read-only snapshot -> reproducible offline catalog. Never writes to a server. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publishedDocuments,auditDocuments} from '../native-android/backend/tools/content-audit-lib.mjs';
import {verifySnapshotMedia} from '../native-android/backend/tools/audit-content.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root=fileURLToPath(new URL('../',import.meta.url));
const languages=['tr','es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th'];
const fields=(row,keys)=>Object.fromEntries(keys.map(k=>[k,row[k]]));
const word=row=>fields(row,['id','word','translation','pronunciation','example','translations']);
export function convertSnapshot(snapshot,previous,coverAssets){
  if(snapshot.project!=='gtuangjukckpuerczfxd')throw Error('Production public snapshot required');
  const docs=publishedDocuments(snapshot),report=auditDocuments(docs);
  if(report.summary.errors||docs.some(d=>!d.published_at)||languages.some(lang=>!report.translations[lang]?.complete)||Object.keys(report.translations).length!==languages.length)
    throw Error('Incomplete or invalid published content');
  if(!Array.isArray(snapshot.tables.revision_tags))throw Error('Snapshot revision tags required');
  const knownTags=new Map(previous.tags.map(tag=>[tag.id,tag]));
  for(const tag of previous.tags)if(languages.some(lang=>!tag.names?.[lang]?.trim()))throw Error('Incomplete tag vocabulary');
  if(docs.some(doc=>doc.tags.some(id=>!knownTags.has(id))))throw Error('Unknown published tag');
  const legacy=(previous.legacyCatalog??previous).stories;
  const order=new Map(legacy.map((s,i)=>[s.id,i]));
  docs.sort((a,b)=>(order.get(a.id)??legacy.length)-(order.get(b.id)??legacy.length)||a.id.localeCompare(b.id,'en'));
  const words=new Map(previous.words.map(w=>[w.id,w]));
  const created=new Map(snapshot.tables.stories.map(s=>[s.id,s.created_at]));
  const stories=docs.map(doc=>{
    for(const row of doc.words)if(!words.has(row.id))words.set(row.id,word(row));
    const cover=coverAssets.get(doc.id);if(!cover)throw Error(`Missing verified cover: ${doc.id}`);
    const sentenceWordIds=Object.fromEntries(doc.sentences.map(s=>[s.id,doc.links.filter(l=>l.sentence_id===s.id).map(l=>l.word_id).sort()]));
    return {...fields(doc,['id','title','author','level','genre','description','descriptions']),revisionId:doc.revisionId,addedAt:created.get(doc.id),
      coverKey:cover.key,coverAsset:cover.asset,
      sentences:doc.sentences.map(s=>fields(s,['id','english','turkish','translations'])),
      vocabulary:doc.words.map(word),sentenceWordIds,
      questions:doc.questions.map(q=>fields(q,['id','kind','prompt','options','answer'])),tags:doc.tags??[]};
  });
  return {schemaVersion:2,sourceSnapshot:{project:snapshot.project,createdAt:snapshot.createdAt},tags:previous.tags,words:[...words.values()],stories,
    legacyCatalog:previous.legacyCatalog??previous};
}
export async function importSnapshot(snapshotPath,previousPath,output){
  const bytes=await readFile(snapshotPath),snapshot=JSON.parse(bytes),previous=JSON.parse(await readFile(previousPath));
  await verifySnapshotMedia(snapshot,snapshotPath);
  const assets=new Map(snapshot.tables.content_assets.map(a=>[a.id,a]));
  const old=new Map(((previous.legacyCatalog??previous).stories).map(s=>[s.id,s]));
  const covers=new Map();
  for(const doc of publishedDocuments(snapshot)){
    const asset=assets.get(doc.cover_asset_id),key=old.get(doc.id)?.coverKey??`cover_${doc.id.replaceAll('-','_')}`;
    if(!/^cover_[a-z0-9_]+$/.test(key))throw Error('Unsafe cover key');
    const resource=`app/src/main/res/drawable-nodpi/${key}.webp`,local=await readFile(path.join(root,'native-android',resource));
    const record={id:asset.id,sha256:asset.sha256,byteSize:Number(asset.byte_size),resource,resourceSha256:sha(local),resourceByteSize:local.length};
    if(sha(local)!==asset.sha256){
      const source=`backend/content/covers/${key}.png`,original=await readFile(path.join(root,'native-android',source));
      if(sha(original)!==asset.sha256||original.length!==Number(asset.byte_size))throw Error(`Cover source differs: ${doc.id}`);
      record.source=source;
    }
    covers.set(doc.id,{key,asset:record});
  }
  const catalog=convertSnapshot(snapshot,previous,covers);catalog.sourceSnapshot.sha256=sha(bytes);
  await writeFile(output,JSON.stringify(catalog,null,2)+'\n');
  console.log(JSON.stringify({output,stories:catalog.stories.length,sentences:catalog.stories.reduce((n,s)=>n+s.sentences.length,0),words:catalog.words.length,legacyRevisions:catalog.legacyCatalog.stories.length}));
  return catalog;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==5)throw Error('Usage: node tooling/import_published_catalog.mjs SNAPSHOT PREVIOUS_CATALOG OUTPUT');
  await importSnapshot(...process.argv.slice(2));
}
