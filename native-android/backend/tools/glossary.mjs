// Q4.3b: build the app glossary from reviewed drafts, and draw the owner's review sample.
//   node tools/glossary.mjs build   -> writes app/src/main/assets/glossary/<lang>.json for every language
//   node tools/glossary.mjs check   -> fails when an app asset is not what build would write
//   node tools/glossary.mjs sample  -> prints the deterministic 10% review sample (Turkish)
//   node tools/glossary.mjs disputed -> prints entries the cross-check disagreed with, for owner review
// Turkish is the reviewed master. Every other language is a machine draft of the same lemmas
// (`content/glossary/<lang>.json`): same lemma list, inflection table copied from Turkish.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** The languages that carry a tap glossary: the app's SupportLanguage codes except English itself. */
export const languages=['tr','es-419','pt-BR','id','ar','vi','hi','ru','bn','ur','th'];
const source=lang=>new URL(`../content/glossary/${lang}.json`,import.meta.url);
const asset=lang=>new URL(`../../app/src/main/assets/glossary/${lang}.json`,import.meta.url);

/** An entry ships only after a second model checked it, and a disputed one only after the owner reviewed it. */
export const publishable=e=>typeof e.checkedBy==='string'&&e.checkedBy.trim()!==''&&(e.disputed!==true||e.reviewed===true)&&e.gloss.trim()!=='';

export function validate(doc){
  const errors=[];
  if(doc.schemaVersion!==1||doc.lang!=='tr')errors.push('schema');
  const seen=new Set();
  for(const e of doc.entries){
    if(!/^[\p{L}\p{N}]{1,100}$/u.test(e.lemma)||e.lemma!==e.lemma.toLowerCase())errors.push(`lemma:${e.lemma}`);
    if(seen.has(e.lemma))errors.push(`duplicate:${e.lemma}`);seen.add(e.lemma);
    if(typeof e.gloss!=='string'||!e.gloss.trim()||e.gloss.length>200)errors.push(`gloss:${e.lemma}`);
    if(typeof e.source!=='string'||!e.source)errors.push(`source:${e.lemma}`);
    if(e.disputed===true&&e.reviewed!==true&&(typeof e.suggestion!=='string'||!e.suggestion.trim()))errors.push(`suggestion:${e.lemma}`);
  }
  for(const [form,lemma] of Object.entries(doc.forms??{}))if(form!==form.toLowerCase()||lemma!==lemma.toLowerCase()||form===lemma)errors.push(`form:${form}`);
  return errors;
}

/** Nothing ships until the owner has signed off the 10% sample (`sampleApprovedBy`). */
export const sampleApproved=doc=>typeof doc.sampleApprovedBy==='string'&&doc.sampleApprovedBy.trim()!=='';

export function build(doc){
  const errors=validate(doc);if(errors.length)throw Error(`Invalid glossary: ${errors.slice(0,10).join(', ')}`);
  return {schemaVersion:1,lang:doc.lang,
    source:'Built by tools/glossary.mjs from backend/content/glossary/tr.json: cross-checked entries only.',
    entries:sampleApproved(doc)?doc.entries.filter(publishable).map(({lemma,gloss})=>({lemma,gloss})):[],forms:doc.forms};
}

/** Every tenth entry by a stable hash of the lemma, so the sample does not drift as drafts are edited. */
export const sample=doc=>doc.entries.filter(e=>parseInt(createHash('sha256').update(e.lemma).digest('hex').slice(0,8),16)%10===0);

/**
 * A machine-drafted language must cover exactly the Turkish lemmas, with a non-empty meaning each.
 * `sampleApprovedBy` is the owner's decision to ship it; it never implies a native-speaker review.
 */
export function validateTranslation(doc,master,lang){
  const errors=[];
  if(doc.schemaVersion!==1||doc.lang!==lang||doc.reviewStatus!=='machine-draft')errors.push('schema');
  const lemmas=new Set(master.entries.map(e=>e.lemma)),seen=new Set();
  for(const e of doc.entries){
    if(!lemmas.has(e.lemma))errors.push(`unknown:${e.lemma}`);
    if(seen.has(e.lemma))errors.push(`duplicate:${e.lemma}`);seen.add(e.lemma);
    if(typeof e.gloss!=='string'||!e.gloss.trim()||e.gloss!==e.gloss.trim()||e.gloss.length>200||e.gloss.includes('|'))errors.push(`gloss:${e.lemma}`);
  }
  for(const lemma of lemmas)if(!seen.has(lemma))errors.push(`missing:${lemma}`);
  return errors;
}

export function buildTranslation(doc,master,lang){
  const errors=validateTranslation(doc,master,lang);if(errors.length)throw Error(`Invalid ${lang} glossary: ${errors.slice(0,10).join(', ')}`);
  return {schemaVersion:1,lang,
    source:`Built by tools/glossary.mjs from backend/content/glossary/${lang}.json: machine draft, not reviewed by a native speaker.`,
    entries:sampleApproved(doc)?doc.entries.map(({lemma,gloss})=>({lemma,gloss})):[],forms:master.forms};
}

export const serialize=value=>JSON.stringify(value,null,1)+'\n';

if(import.meta.url===`file://${process.argv[1]}`){
  const load=async lang=>JSON.parse(await readFile(source(lang),'utf8'));
  const master=await load('tr'),command=process.argv[2];
  const built=async lang=>lang==='tr'?build(master):buildTranslation(await load(lang),master,lang);
  if(command==='build')for(const lang of languages){const out=await built(lang);await writeFile(asset(lang),serialize(out));console.log(`${lang}: ${out.entries.length}/${master.entries.length} entries published`);}
  else if(command==='check'){
    for(const lang of languages)if(await readFile(asset(lang),'utf8')!==serialize(await built(lang))){console.error(`App glossary ${lang} is stale: run npm run glossary:build`);process.exit(1);}
    console.log('App glossaries match their drafts');
  }
  else if(command==='sample')for(const e of sample(master))console.log(`${e.lemma}\t${e.gloss}\t${e.example}${e.disputed?`\tDISPUTED: ${e.suggestion??''} (${e.note??''})`:''}`);
  else if(command==='disputed')for(const e of master.entries.filter(e=>e.disputed&&!e.reviewed))console.log(`${e.lemma}\t${e.gloss}\t-> ${e.suggestion}\t${e.note??''}\t${e.example}`);
  else{console.error('usage: node tools/glossary.mjs build|check|sample|disputed');process.exit(2);}
}
