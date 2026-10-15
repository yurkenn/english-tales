export const normalize=value=>String(value??'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const occurs=(sentence,word)=>Boolean(normalize(word))&&(` ${normalize(sentence)} `).includes(` ${normalize(word)} `);
const tokens=value=>normalize(value).split(' ').filter(Boolean);
// Mirrors Android PhraseMatcher: left to right, longest entry first, matched tokens are consumed.
export function matchSpans(sentence,words){
  const spans=[...String(sentence??'').matchAll(/[\p{L}\p{N}]+/gu)],keys=spans.map(m=>m[0].toLowerCase()),found=[];
  const entries=words.map(word=>({word,parts:tokens(word.word)})).filter(e=>e.parts.length).sort((a,b)=>b.parts.length-a.parts.length);
  for(let i=0;i<keys.length;){
    const hit=entries.find(e=>e.parts.every((p,n)=>keys[i+n]===p));
    if(!hit){i++;continue;}
    const last=spans[i+hit.parts.length-1];found.push({word:hit.word,start:spans[i].index,end:last.index+last[0].length});i+=hit.parts.length;
  }
  return found;
}
export const matchWords=(sentence,words)=>matchSpans(sentence,words).map(m=>m.word);
export function invalidLinks(doc){return doc.links.filter(link=>!occurs(doc.sentences.find(s=>s.id===link.sentence_id)?.english,doc.words.find(w=>w.id===link.word_id)?.word));}
export function recoveryKey(project,user,revision){return `english-tales:draft:${encodeURIComponent(project)}:${user}:${revision}`;}
export function backup(doc,project){return {format:'english-tales-draft',version:1,project,revisionId:doc.id,storyId:doc.story_id,editVersion:doc.edit_version,savedAt:new Date().toISOString(),document:doc};}
export function readBackup(text,doc,project){
  if(text.length>2097152)throw new Error('Yedek en fazla 2 MB olabilir.');
  const data=JSON.parse(text);
  if(data.format!=='english-tales-draft'||data.version!==1||data.project!==project||data.revisionId!==doc.id||data.storyId!==doc.story_id)throw new Error('Bu yedek başka bir proje veya hikâye sürümüne ait.');
  const d=data.document;
  if(!d||!Array.isArray(d.sentences)||!Array.isArray(d.words)||!Array.isArray(d.links)||d.sentences.length>500||d.words.length>500||d.links.length>5000)throw new Error('Yedek içeriği geçersiz.');
  for(const key of ['title','author','level','genre','description'])if(typeof d[key]!=='string')throw new Error('Yedek bilgileri eksik.');
  if(!['A1','A2','B1'].includes(d.level)||!['Günlük yaşam','Macera','Gizem'].includes(d.genre))throw new Error('Yedek seviyesi veya türü geçersiz.');
  const ids=items=>new Set(items.map(x=>x.id));const sentences=ids(d.sentences),words=ids(d.words);
  if(sentences.size!==d.sentences.length||words.size!==d.words.length)throw new Error('Yedekte yinelenen kimlikler var.');
  for(const item of [...d.sentences,...d.words])if(typeof item.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(item.id))throw new Error('Yedek kimliği geçersiz.');
  for(const s of d.sentences)if(typeof s.english!=='string'||typeof s.turkish!=='string')throw new Error('Yedek cümlesi geçersiz.');
  for(const w of d.words)if(['word','translation','pronunciation','example'].some(k=>typeof w[k]!=='string'))throw new Error('Yedek kelimesi geçersiz.');
  if(d.links.some(l=>!sentences.has(l.sentence_id)||!words.has(l.word_id)))throw new Error('Yedek kelime bağlantısı geçersiz.');
  return {data,document:{...doc,...Object.fromEntries(['title','author','level','genre','description','sentences','words','links'].map(k=>[k,d[k]]))}};
}
