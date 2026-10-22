import {createHash} from 'node:crypto';
import {questionDocument,questionErrors,matchWords} from '../admin/workflow.js';

export const LANGUAGES=['tr','es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th'];
const sha256=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
  Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const encode=value=>JSON.stringify(canonical(value));

/**
 * Turns a long-story draft into the document admin_save_draft stores. Turkish lives in the legacy
 * fields and again under `tr`, as in every published revision. Links are the study-word matches the
 * reader highlights, computed with the panel's own matcher.
 */
export function longStoryDocument(draft,coverAssetId=null){
  const s=draft.story,tr=(text,map)=>({...map,tr:text});
  const words=draft.words.map(w=>({id:w.id,word:w.word,translation:w.translation,pronunciation:w.pronunciation,example:w.example,
    translations:tr(w.translation,w.translations)})).sort((a,b)=>a.id.localeCompare(b.id));
  const links=[];
  for(const x of s.sentences)for(const id of new Set(matchWords(x.english,words).map(w=>w.id)))links.push({sentence_id:x.id,word_id:id});
  return {title:s.title,author:s.author,level:s.level,genre:s.genre,description:s.description,
    cover_asset_id:coverAssetId,audio_asset_id:null,questions:questionDocument(s.questions),tags:[...s.tags].sort(),
    descriptions:tr(s.description,s.descriptions),
    sentences:s.sentences.map(x=>({id:x.id,english:x.english,turkish:x.turkish,translations:tr(x.turkish,x.translations)})),
    words,links:links.sort((a,b)=>encode(a).localeCompare(encode(b)))};
}

/** Everything that must hold before a draft may reach readers; returned as readable blockers, never thrown. */
export function longStoryBlockers(draft,{catalogStoryIds=new Set()}={}){
  const s=draft.story,blockers=[];
  if(draft.kind!=='long-story')blockers.push('kind long-story değil');
  if(typeof draft.reviewedBy!=='string'||!draft.reviewedBy.trim())blockers.push('Sahip onayı kayıtlı değil (reviewedBy)');
  const reviewed=new Set(draft.translationReadiness?.reviewedLanguages??[]);
  if(!LANGUAGES.every(l=>reviewed.has(l)))blockers.push('Diller onaylı olarak işaretlenmemiş (reviewedLanguages)');
  if(catalogStoryIds.has(s.id))blockers.push('Bu kimlik paketteki bir hikâyeyle çakışıyor');
  if(questionErrors(s.questions).length)blockers.push('Sorular geçersiz');
  const doc=longStoryDocument(draft),linked=new Set(doc.links.map(l=>l.word_id));
  for(const w of doc.words)if(!linked.has(w.id))blockers.push(`Çalışma kelimesi metinde geçmiyor: ${w.id}`);
  for(const lang of LANGUAGES){
    if(!doc.descriptions[lang]?.trim())blockers.push(`Açıklama eksik: ${lang}`);
    if(doc.sentences.some(x=>!x.translations[lang]?.trim()))blockers.push(`Cümle çevirisi eksik: ${lang}`);
    if(doc.words.some(w=>!w.translations[lang]?.trim()))blockers.push(`Kelime karşılığı eksik: ${lang}`);
  }
  return blockers;
}

export const documentSHA256=doc=>sha256(encode(doc));
