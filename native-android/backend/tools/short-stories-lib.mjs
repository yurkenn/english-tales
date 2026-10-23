import {longStoryDocument,LANGUAGES} from './long-stories-lib.mjs';
import {questionErrors,invalidLinks,supportCompleteness} from '../admin/workflow.js';

/** Compile short stories without assigning editorial or native-speaker approval. */
export function shortStoryDocument(draft,catalog){
  const words=new Map(catalog.words.map(w=>[w.id,w]));
  for(const word of draft.words){if(words.has(word.id))throw Error(`Existing word changed: ${word.id}`);words.set(word.id,word);}
  const selected=draft.studyWordIds.map(id=>{const word=words.get(id);if(!word)throw Error(`Unknown study word: ${id}`);return word;});
  const doc=longStoryDocument({...draft,words:selected});
  if(selected.length<8||selected.length>15||new Set(draft.studyWordIds).size!==selected.length)throw Error('Choose 8–15 distinct study words');
  if(questionErrors(doc.questions).length||invalidLinks(doc).length)throw Error('Invalid questions or word links');
  if(doc.words.some(w=>!doc.links.some(l=>l.word_id===w.id)))throw Error('Unlinked study word');
  for(const lang of LANGUAGES)if(Object.values(supportCompleteness(doc,lang)).some(Boolean))throw Error(`Incomplete language: ${lang}`);
  for(const q of doc.questions){const e=draft.questionEvidence.find(e=>e.questionId===q.id);if(!e?.rationale?.trim()||!e.sentenceIds.length||e.sentenceIds.some(id=>!doc.sentences.some(s=>s.id===id)))throw Error(`Missing answer evidence: ${q.id}`);}
  return doc;
}
