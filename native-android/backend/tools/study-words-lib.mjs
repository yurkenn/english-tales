// Q4.3c: propose 8–15 study words per story from the catalog and the glossary drafts.
// A lemma's level band comes from its rank in the whole catalog: frequent lemmas are easier.
/** Share of the catalog's lemmas, most frequent first, that a level is expected to know. */
export const LEVEL_BANDS={A1:0.25,A2:0.5,B1:0.8};
const STOP=new Set(`a an the and or but if so of to in on at by for from with into onto over under up down out off about as than then there here this that these those it its he him his she her hers they them their we us our you your i me my mine be am is are was were been being have has had do does did not no yes very too can could will would shall should may might must just also only all any some each every one two what which who whom whose when where why how more most much many such own same other again once still even back away`.split(/\s+/));
const tokens=text=>[...String(text).matchAll(/[\p{L}]+(?:['’][\p{L}]+)?/gu)].map(m=>({raw:m[0],key:m[0].toLowerCase().replace(/['’].*$/,''),index:m.index}));

/** Maps a token to a known lemma: irregular forms first, then plain suffix rules checked against known lemmas. */
export function lemmatizer(known,forms){
  return key=>{
    if(forms[key])return forms[key];
    if(known.has(key))return key;
    const tries=[];
    if(key.endsWith('ies'))tries.push(key.slice(0,-3)+'y');
    if(key.endsWith('ied'))tries.push(key.slice(0,-3)+'y');
    if(key.endsWith('es'))tries.push(key.slice(0,-2));
    if(key.endsWith('s'))tries.push(key.slice(0,-1));
    if(key.endsWith('ed')){tries.push(key.slice(0,-2),key.slice(0,-1));if(/(.)\1ed$/.test(key))tries.push(key.slice(0,-3));}
    if(key.endsWith('ing')){tries.push(key.slice(0,-3),key.slice(0,-3)+'e');if(/(.)\1ing$/.test(key))tries.push(key.slice(0,-4));}
    return tries.find(t=>known.has(t))??key;
  };
}

/** Proper nouns: capitalised everywhere they occur, never at the start of a sentence only. */
function properNouns(stories){
  const lower=new Set(),upper=new Set();
  for(const s of stories)for(const x of s.sentences)for(const t of tokens(x.english))(t.raw[0]===t.raw[0].toLowerCase()?lower:upper).add(t.key);
  return new Set([...upper].filter(k=>!lower.has(k)));
}

export function proposeStudyWords(catalog,glossary,{min=8,max=15}={}){
  const learning=new Map(catalog.words.map(w=>[w.word.toLowerCase(),w]));
  const glosses=new Map(glossary.entries.map(e=>[e.lemma,e]));
  const known=new Set([...learning.keys(),...glosses.keys()]);
  const lemma=lemmatizer(known,glossary.forms??{}),names=properNouns(catalog.stories);
  const freq=new Map(),docs=new Map();
  const storyLemmas=catalog.stories.map(story=>{
    const counts=new Map();
    for(const x of story.sentences)for(const t of tokens(x.english)){
      if(names.has(t.key))continue;
      const l=lemma(t.key);counts.set(l,(counts.get(l)??0)+1);freq.set(l,(freq.get(l)??0)+1);
    }
    for(const l of counts.keys())docs.set(l,(docs.get(l)??0)+1);
    return counts;
  });
  const rank=new Map([...freq].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([l],i)=>[l,i+1]));
  const stories=catalog.stories.map((story,i)=>{
    const counts=storyLemmas[i],band=Math.round(rank.size*(LEVEL_BANDS[story.level]??LEVEL_BANDS.B1));
    const content=[...counts].filter(([l])=>!STOP.has(l)&&l.length>2&&/^\p{L}+$/u.test(l));
    const total=content.reduce((n,[,c])=>n+c,0)||1;
    const outOfLevel=content.filter(([l])=>rank.get(l)>band);
    // A word above the band still qualifies when the story repeats it: the story itself teaches it.
    const candidates=content.filter(([l,c])=>rank.get(l)>40&&(rank.get(l)<=band||c>=2)&&(learning.has(l)||glosses.get(l)?.gloss))
      // Editor-chosen learning words come first; then words repeated here, seen elsewhere, and not the easiest of the band.
      .map(([l,c])=>({lemma:l,occurrences:c,stories:docs.get(l),rank:rank.get(l),
        score:(learning.has(l)?6:0)+c*2+Math.min(docs.get(l),5)+Math.min(rank.get(l)/band,1)*3}))
      .sort((a,b)=>b.score-a.score||a.lemma.localeCompare(b.lemma));
    const picked=candidates.slice(0,max).map(({lemma:l,occurrences,stories,rank:r})=>{
      const w=learning.get(l),g=glosses.get(l);
      return {lemma:l,translation:w?.translation??g.gloss,source:w?'learning-word':'glossary-draft',occurrences,stories,rank:r,aboveLevel:r>band};
    });
    return {storyId:story.id,level:story.level,band,
      currentLearningWords:[...new Set(story.sentences.flatMap(x=>tokens(x.english).map(t=>t.key)).filter(k=>learning.has(k)))].length,
      proposed:picked,enough:picked.length>=min,
      outOfLevelPercent:Math.round(outOfLevel.reduce((n,[,c])=>n+c,0)/total*1000)/10,
      outOfLevel:outOfLevel.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,10).map(([l])=>l)};
  });
  return {schemaVersion:1,status:'proposal',reviewedBy:null,bands:LEVEL_BANDS,min,max,stories};
}
