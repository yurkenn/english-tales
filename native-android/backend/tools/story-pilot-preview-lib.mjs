import {createHash} from 'node:crypto';
import {matchWords,questionErrors,supportCompleteness,validSupportLanguage} from '../admin/workflow.js';
import {draftDocument} from './content-drafts-lib.mjs';
import {stableId,translationEntries} from './export-catalog.mjs';

const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
  Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export const pilotHash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const requireValue=(condition,message)=>{if(!condition)throw Error(message);};
const nonblank=value=>typeof value==='string'&&value.trim().length>0;

/** Offline cache-format previews only. No credentials, database writes, approval assignment or publication. */
export function buildPilotPreview(catalog,scope,drafts,{requireReviewed=false}={}){
  requireValue(scope.focus==='existing-stories-only','Pilot scope must contain existing stories only');
  const active=scope.activeRevisionStoryIds;
  requireValue(Array.isArray(active)&&active.length>0&&new Set(active).size===active.length,'Invalid active story IDs');
  const byId=new Map(catalog.stories.map(s=>[s.id,s]));
  const knownWords=new Map(catalog.words.map(w=>[w.id,w]));
  requireValue(drafts.length===active.length,'Active draft count differs from scope');
  const seen=new Set();
  const stories=drafts.map(d=>{
    const s=d.story,id=s?.id,base=byId.get(id);
    requireValue(base&&active.includes(id)&&!seen.has(id)&&d.baseStoryId===id,`Not a unique active existing story: ${id}`);seen.add(id);
    requireValue(d.status==='draft'&&d.kind==='revision',`Not a revision draft: ${id}`);
    requireValue(d.baseStorySHA256===pilotHash(base),`Source catalog changed: ${id}`);
    requireValue(s.coverKey===base.coverKey&&s.level===base.level,`Cover or level changed: ${id}`);
    for(const field of ['title','author','genre','description'])requireValue(nonblank(s[field]),`Missing ${field}: ${id}`);
    requireValue(s.sentences?.length>0&&new Set(s.sentences.map(x=>x.id)).size===s.sentences.length,`Invalid sentence IDs: ${id}`);
    for(const x of s.sentences)requireValue(nonblank(x.id)&&nonblank(x.english)&&nonblank(x.turkish),`Empty sentence: ${id}`);
    requireValue(questionErrors(s.questions).length===0,`Invalid questions: ${id}`);
    requireValue(new Set(s.questions.map(q=>q.id)).size===s.questions.length,`Duplicate question IDs: ${id}`);
    const evidence=new Map((d.questionEvidence??[]).map(e=>[e.questionId,e]));
    for(const q of s.questions){
      const e=evidence.get(q.id);
      requireValue(e&&nonblank(e.rationale)&&e.sentenceIds?.length>0&&e.sentenceIds.every(id=>s.sentences.some(x=>x.id===id)),`Missing question evidence: ${q.id}`);
    }
    const ids=d.studyWordIds;
    requireValue(Array.isArray(ids)&&ids.length>=8&&ids.length<=15&&new Set(ids).size===ids.length,`Invalid study-word list: ${id}`);
    requireValue(Array.isArray(d.words)&&new Set(d.words.map(w=>w.id)).size===d.words.length,`Duplicate word IDs: ${id}`);
    const wordsById=new Map(d.words.map(w=>[w.id,w]));
    const words=ids.map(wordId=>{
      const w=wordsById.get(wordId);requireValue(w&&['id','word','translation','pronunciation','example'].every(k=>nonblank(w[k])),`Missing study word: ${id}/${wordId}`);
      if(knownWords.has(wordId))requireValue(pilotHash(w)===pilotHash(knownWords.get(wordId)),`Existing word meaning changed: ${wordId}`);
      return w;
    });
    const links=s.sentences.flatMap(x=>[...new Set(matchWords(x.english,words).map(w=>w.id))].map(word_id=>({sentence_id:x.id,word_id})));
    for(const w of words)requireValue(links.some(l=>l.word_id===w.id),`Study word absent from text: ${id}/${w.id}`);
    const document=draftDocument({...s,words,links});
    // Reuse the server/exporter translation contract; never invent missing translations via fallback.
    translationEntries(s.descriptions,s.description,id);
    for(const x of s.sentences)translationEntries(x.translations,x.turkish,x.id);
    for(const w of words)translationEntries(w.translations,w.translation,w.id);
    const languages=d.translationReadiness?.requiredLanguages;
    const expected=['tr','es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th'];
    requireValue(Array.isArray(languages)&&languages.length===expected.length&&new Set(languages).size===expected.length&&expected.every(l=>languages.includes(l))&&languages.every(validSupportLanguage),`Invalid support languages: ${id}`);
    for(const lang of languages)requireValue(Object.values(supportCompleteness(document,lang)).every(n=>n===0),`Incomplete translation: ${id}/${lang}`);
    const reviewedLanguages=d.translationReadiness.reviewedLanguages;
    const reviewed=nonblank(d.reviewedBy)&&Array.isArray(reviewedLanguages)&&new Set(reviewedLanguages).size===languages.length
      &&languages.every(l=>reviewedLanguages.includes(l))&&reviewedLanguages.every(l=>languages.includes(l));
    if(requireReviewed)requireValue(reviewed,`Human editorial/language review pending: ${id}`);
    const documentSHA256=pilotHash(document);
    return {storyId:id,draftSHA256:pilotHash(d),documentSHA256,coverKey:s.coverKey,
      review:{complete:reviewed,reviewedBy:d.reviewedBy??null,reviewedLanguages:d.translationReadiness.reviewedLanguages??[]},
      studyWordIds:ids,languages,
      // No published_at: this is a local cache fixture, never a claimed server publication.
      preview:{id:stableId(`local-story-pilot:${id}:${documentSHA256}`),story_id:id,...document}};
  });
  stories.sort((a,b)=>active.indexOf(a.storyId)-active.indexOf(b.storyId));
  return {format:'story-pilot-preview/v1',status:'local-preview-not-published',sourceCatalogSHA256:pilotHash(catalog),stories};
}
