// Plans append-only question/translation repairs from the shipped edition. No auth, network or publication.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditCatalog,auditSnapshot,publishedDocuments} from './content-audit-lib.mjs';
import {draftDocument,sha256} from './content-drafts-lib.mjs';
import {questionErrors} from '../admin/workflow.js';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const hash=value=>sha256(JSON.stringify(canonical(value)));
const sameSource=(a,b)=>JSON.stringify(a.map(s=>[s.id,s.english,s.turkish]))===JSON.stringify(b.map(s=>[s.id,s.english,s.turkish]));

export function planLegacyQuestionRepair(catalog,snapshot) {
  if(auditCatalog(catalog).summary.errors || auditSnapshot(snapshot).summary.errors) throw Error('Source structural errors');
  const live=publishedDocuments(snapshot),drafts=[],blockers=[];
  const guards=live.map(doc=>{
    if(!Number.isSafeInteger(doc.edit_version)||doc.edit_version<1) throw Error(`Missing edit_version: ${doc.id}`);
    return {storyId:doc.id,currentRevisionId:doc.revisionId,editVersion:doc.edit_version,document:draftDocument(doc)};
  });
  for(const doc of live) {
    if(doc.questions.length) continue;
    const source=catalog.stories.find(s=>s.id===doc.id);
    if(!source || !sameSource(source.sentences,doc.sentences)) {blockers.push(`No exact shipped source: ${doc.id}`);continue;}
    if(!Array.isArray(source.questions) || source.questions.length<3 || questionErrors(source.questions).length) {blockers.push(`Invalid shipped questions: ${doc.id}`);continue;}
    const document=draftDocument(doc);
    document.questions=structuredClone(source.questions);
    // Fill only absent translations with an identical source. Existing server text always wins.
    const fill=(target,map)=>{for(const [lang,value] of Object.entries(map??{})) if(!target[lang]?.trim() && value?.trim()) target[lang]=value;};
    if(source.description===doc.description) fill(document.descriptions,source.descriptions);
    for(const row of document.sentences) fill(row.translations,source.sentences.find(s=>s.id===row.id).translations);
    for(const row of document.words) {
      const old=catalog.words.find(w=>w.id===row.id && w.word===row.word && w.translation===row.translation);
      if(old) fill(row.translations,old.translations);
    }
    drafts.push({storyId:doc.id,sourceRevisionId:doc.revisionId,sourceEditVersion:doc.edit_version,
      create:{rpc:'admin_create_draft',args:{p_story_id:doc.id,p_source_id:doc.revisionId}},
      save:{rpc:'admin_save_draft',args:{p_revision_id:null,p_expected_version:null,p_document:document}},
      documentSHA256:hash(document)});
  }
  return {format:1,purpose:'Restore shipped questions and absent exact-source translations. Draft planning only; no publication or new editorial approval.',
    sourceSnapshotSHA256:hash(snapshot),sourceCatalogSHA256:hash(catalog),blockers,guards,drafts};
}

export async function main(args=process.argv.slice(2)) {
  const options={};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--help') {console.log('node tools/repair-legacy-questions.mjs --snapshot <catalog.json> --output <directory>');return;}
    if(!['--snapshot','--output'].includes(args[i]) || !args[i+1] || args[i+1].startsWith('--')) throw Error('Expected --snapshot and --output');
    options[args[i].slice(2)]=args[++i];
  }
  if(!options.snapshot||!options.output) throw Error('Expected --snapshot and --output');
  const catalog=JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url),'utf8'));
  const snapshot=JSON.parse(await readFile(path.resolve(options.snapshot),'utf8'));
  const packet=planLegacyQuestionRepair(catalog,snapshot);
  await mkdir(options.output,{recursive:true});
  await writeFile(path.join(options.output,'packet.json'),JSON.stringify(packet,null,2)+'\n');
  await writeFile(path.join(options.output,'review.md'),`# Legacy question restoration\n\n${packet.drafts.length} append-only drafts; ${packet.blockers.length} blockers.\n\nExisting stories, sentences, words, media, links, tags and translations are preserved. Missing questions come only from the identical shipped English/Turkish source. No publication or editorial approval is performed.\n\n`+packet.drafts.map(d=>`- ${d.storyId}: ${d.save.args.p_document.questions.length} questions, source ${d.sourceRevisionId}`).join('\n')+'\n'+packet.blockers.join('\n'));
  console.log(JSON.stringify({drafts:packet.drafts.length,blockers:packet.blockers,output:path.resolve(options.output)}));
  if(packet.blockers.length) process.exitCode=1;
  return packet;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error.message);process.exitCode=1;});
