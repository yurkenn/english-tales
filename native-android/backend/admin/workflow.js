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
export const validSupportLanguage=lang=>typeof lang==='string'&&lang.trim()===lang&&/^[a-z]{2}(-[0-9A-Z]{2,3})?$/.test(lang);
export function supportLanguages(doc){return [...new Set(['tr',...Object.keys(doc.descriptions??{}),...doc.sentences.flatMap(s=>Object.keys(s.translations??{})),...doc.words.flatMap(w=>Object.keys(w.translations??{}))])].sort();}
export function supportValue(entity,key,lang){return lang==='tr'?entity[key]??'':entity[key==='description'?'descriptions':'translations']?.[lang]??'';}
export function setSupportValue(entity,key,lang,value){
  if(!validSupportLanguage(lang))throw new Error('Geçersiz destek dili. Örnek: tr, es-419.');
  if(lang==='tr'){entity[key]=value;return;}
  const map=entity[key==='description'?'descriptions':'translations']??={};
  if(value.trim())map[lang]=value;else delete map[lang];
}
export function supportCompleteness(doc,lang){return {missingSentences:doc.sentences.filter(s=>!supportValue(s,'turkish',lang).trim()).length,missingWords:doc.words.filter(w=>!supportValue(w,'translation',lang).trim()).length,missingDescriptions:Number(!supportValue(doc,'description',lang).trim())};}
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
  for(const map of [d.descriptions,...d.sentences.map(s=>s.translations),...d.words.map(w=>w.translations)]){
    if(map===undefined)continue;
    if(!map||typeof map!=='object'||Array.isArray(map)||Object.entries(map).some(([lang,value])=>!validSupportLanguage(lang)||typeof value!=='string'||!value.trim()))throw new Error('Yedek çeviri haritası geçersiz.');
  }
  if(d.questions!==undefined&&questionErrors(d.questions).length)throw new Error(questionErrors(d.questions).join(' '));
  if(d.links.some(l=>!sentences.has(l.sentence_id)||!words.has(l.word_id)))throw new Error('Yedek kelime bağlantısı geçersiz.');
  return {data,document:{...doc,...Object.fromEntries(['title','author','level','genre','description','sentences','words','links',...(d.questions!==undefined?['questions']:[]),...(Array.isArray(d.tags)?['tags']:[]),...(d.descriptions?['descriptions']:[])].map(k=>[k,d[k]]))}};
}

// Shared by the panel, exporter and offline audit; array order defines position.
export function questionErrors(questions,{positions=false}={}){
  if(!Array.isArray(questions))return ['Soru listesi bir dizi olmalı.'];
  const errors=[],ids=new Set();
  for(const [i,q] of questions.entries()){
    const label=`${i+1}. soru`;
    if(!q||typeof q!=='object'){errors.push(`${label}: Soru bilgileri geçersiz.`);continue;}
    if(typeof q.id!=='string'||[...q.id].length<1||[...q.id].length>100||ids.has(q.id))errors.push(`${label}: Kimlik 1–100 karakter olmalı ve yinelenmemeli.`);
    ids.add(q.id);
    if(!['main','detail','inference'].includes(q.kind))errors.push(`${label}: Tür main, detail veya inference olmalı.`);
    if(typeof q.prompt!=='string'||!q.prompt.trim())errors.push(`${label}: İngilizce soru metni boş olamaz.`);
    const validOptions=Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=4&&q.options.every(o=>typeof o==='string'&&o.trim());
    if(!validOptions)errors.push(`${label}: 2–4 dolu seçenek gerekli.`);
    else if(new Set(q.options.map(o=>o.trim().toLowerCase())).size!==q.options.length)errors.push(`${label}: Seçenekler büyük/küçük harf ve kenar boşlukları yok sayıldığında farklı olmalı.`);
    if(!Number.isInteger(q.answer)||q.answer<0||!Array.isArray(q.options)||q.answer>=q.options.length)errors.push(`${label}: Doğru yanıt mevcut bir seçeneğin sıfır tabanlı indeksi olmalı.`);
    if(positions&&q.position!==i+1)errors.push(`${label}: Sıralar 1’den başlayarak kesintisiz olmalı.`);
  }
  return errors;
}
export const questionDocument=questions=>(questions??[]).map(({id,kind,prompt,options,answer})=>({id,kind,prompt,options,answer}));
