import {createHash} from 'node:crypto';
import {occurs} from '../admin/workflow.js';
import {bundledDocuments,publishedDocuments,compareDocuments} from './content-audit-lib.mjs';

const wordFields=['id','word','translation','pronunciation','example'];
const pick=(row,keys)=>Object.fromEntries(keys.map(k=>[k,row[k]]));
const byId=(a,b)=>a.id.localeCompare(b.id);
const linkKey=l=>`${l.sentence_id}\u0000${l.word_id}`;

/** Canonical draft content, independent of row order, so a fresh copy, a target and a saved draft can be compared. */
export function canonical(doc){
  const sentences=[...doc.sentences].sort((a,b)=>(a.position??0)-(b.position??0)).map(s=>pick(s,['id','english','turkish']));
  return {...pick(doc,['title','author','level','genre','description']),cover_asset_id:doc.cover_asset_id??null,audio_asset_id:doc.audio_asset_id??null,
    sentences,words:doc.words.map(w=>pick(w,wordFields)).sort(byId),
    links:doc.links.map(l=>pick(l,['sentence_id','word_id'])).sort((a,b)=>linkKey(a).localeCompare(linkKey(b)))};
}
export const digest=doc=>createHash('sha256').update(JSON.stringify(canonical(doc))).digest('hex');

/**
 * Plans one new draft per published story whose vocabulary differs from the bundle. Only words and links change:
 * text, metadata and media stay those of the live revision, and stories whose text or metadata differ are blocked for editors.
 */
export function planRevisions(catalog,snapshot,{stories=null}={}){
  const bundle=bundledDocuments(catalog),live=publishedDocuments(snapshot);
  const target=new Map(bundle.map(d=>[d.id,d])),current=new Map(live.map(d=>[d.id,d]));
  if(stories)for(const id of stories)if(!target.has(id)||!current.has(id))throw Error(`Story is not both bundled and published: ${id}`);
  const comparison=compareDocuments(bundle,live),selected=stories?new Set(stories):null;
  const plans=[],blocked=[];
  for(const diff of comparison.differingStories){
    if(selected&&!selected.has(diff.storyId))continue;
    const reasons=[];
    if(diff.metadataFields.length)reasons.push(`metadata:${diff.metadataFields.join(',')}`);
    if(diff.missingSentenceIds.length||diff.extraSentenceIds.length||diff.modifiedSentences.length)reasons.push('sentences');
    if(reasons.length){blocked.push({storyId:diff.storyId,reasons});continue;}
    const base=current.get(diff.storyId),wanted=target.get(diff.storyId);
    const document=canonical({...base,words:wanted.words,links:wanted.links});
    const sentences=new Map(document.sentences.map(s=>[s.id,s])),words=new Map(document.words.map(w=>[w.id,w]));
    for(const link of document.links)if(!occurs(sentences.get(link.sentence_id)?.english,words.get(link.word_id)?.word))
      throw Error(`Planned link does not match its sentence: ${diff.storyId}/${link.sentence_id}/${link.word_id}`);
    const linked=new Set(document.links.map(l=>l.word_id));
    for(const word of document.words)if(!linked.has(word.id))throw Error(`Planned word is not linked: ${diff.storyId}/${word.id}`);
    const before=new Map(base.words.map(w=>[w.id,w])),beforeLinks=new Set(base.links.map(linkKey)),afterLinks=new Set(document.links.map(linkKey));
    plans.push({storyId:diff.storyId,baseRevisionId:base.revisionId,baseDigest:digest(base),documentDigest:digest(document),document,
      changes:{addedWordIds:document.words.filter(w=>!before.has(w.id)).map(w=>w.id),
        removedWordIds:base.words.filter(w=>!words.has(w.id)).map(w=>w.id).sort(),
        modifiedWordIds:document.words.filter(w=>before.has(w.id)&&wordFields.some(k=>before.get(w.id)[k]!==w[k])).map(w=>w.id),
        addedLinks:[...afterLinks].filter(k=>!beforeLinks.has(k)).length,removedLinks:[...beforeLinks].filter(k=>!afterLinks.has(k)).length}});
  }
  return {format:1,purpose:'Draft revisions that bring live vocabulary to the bundled catalog. Text, metadata and media are unchanged.',
    snapshot:{project:snapshot.project,createdAt:snapshot.createdAt},stories:plans,blocked};
}

/**
 * Applies a plan through the content panel RPCs as the signed-in staff member. Never overwrites a draft someone else edited
 * and skips stories whose live revision moved since the snapshot. Publishing needs the publisher role and an explicit flag.
 */
export async function applyPlan(plan,rpc,{publish=false,log=()=>{}}={}){
  if(plan?.format!==1||!Array.isArray(plan.stories))throw Error('Unsupported revision plan');
  const results=[];
  for(const item of plan.stories){
    if(digest(item.document)!==item.documentDigest)throw Error(`Plan document was modified: ${item.storyId}`);
    const result={storyId:item.storyId,baseRevisionId:item.baseRevisionId};
    let draft=await rpc('admin_create_draft',{p_story_id:item.storyId,p_source_id:item.baseRevisionId});
    result.draftRevisionId=draft.id;
    if(draft.current_revision_id!==item.baseRevisionId)result.status='stale_base';
    else if(digest(draft)===item.documentDigest)result.status='already_prepared';
    else if(digest(draft)!==item.baseDigest)result.status='existing_draft_conflict';
    else{
      draft=await rpc('admin_save_draft',{p_revision_id:draft.id,p_expected_version:draft.edit_version,p_document:item.document});
      if(digest(draft)!==item.documentDigest)throw Error(`Saved draft does not match the plan: ${item.storyId}`);
      result.status='prepared';
    }
    if(publish&&['prepared','already_prepared'].includes(result.status)){
      result.publishedRevisionId=await rpc('admin_publish',{p_revision_id:draft.id,p_expected_version:draft.edit_version});
      result.status='published';
    }
    log(result);results.push(result);
  }
  const count=status=>results.filter(r=>r.status===status).length;
  return {results,summary:{prepared:count('prepared')+count('already_prepared'),published:count('published'),
    staleBase:count('stale_base'),conflicts:count('existing_draft_conflict')}};
}
