import {bundledDocuments} from '../../tools/content-audit-lib.mjs';

const word=(id,value,translation)=>({id,word:value,translation,pronunciation:'/fixture/',example:`It is ${value} today.`});
export function catalogFixture(){
  return {schemaVersion:1,words:[word('falls-asleep','falls asleep','uykuya dalar'),word('asleep','asleep','uykuda'),
    word('quiet','quiet','sessiz'),word('night','night','gece')],stories:[
    {id:'classic-tortoise-hare',title:'Hare',author:'Aesop',level:'A1',genre:'Macera',description:'Tavşan',coverKey:'fixture',
      sentences:[{id:'hare-1',english:'The quiet hare falls asleep at night.',turkish:'Sessiz tavşan gece uykuya dalar.'},
        {id:'hare-2',english:'At night.',turkish:'Gece.'}]},
    {id:'classic-dog-manger',title:'Dog',author:'Aesop',level:'A2',genre:'Macera',description:'Köpek',coverKey:'fixture',
      sentences:[{id:'dog-1',english:'The dog falls asleep at night.',turkish:'Köpek gece uykuya dalar.'},
        {id:'dog-2',english:'At night.',turkish:'Gece.'}]}]};
}

export function snapshotFixture(catalog,manifest){
  const tables={stories:[],story_revisions:[],story_sentences:[],revision_words:[],sentence_words:[],
    content_assets:[...new Map(manifest.assets.map(a=>[a.id,{id:a.id,kind:'cover',mime_type:'image/png',storage_path:a.path,sha256:a.sha256,byte_size:a.byteSize}])).values()],
    sentence_translations:[],word_translations:[],revision_texts:[],story_questions:[],revision_tags:[]};
  for(const [index,d] of bundledDocuments(catalog).entries()){
    const id=`22222222-2222-4222-a222-${String(index+1).padStart(12,'0')}`;
    const cover=manifest.assets.find(a=>a.source.endsWith(`/${d.coverKey}.png`));
    tables.stories.push({id:d.id,current_revision_id:id,is_archived:false});
    tables.story_revisions.push({id,story_id:d.id,edit_version:1,published_at:'2026-10-16T00:00:00Z',cover_asset_id:cover.id,
      ...Object.fromEntries(['title','author','level','genre','description'].map(k=>[k,d[k]]))});
    tables.story_questions.push(...(d.questions??[]).map(q=>({...q,revision_id:id})));
    tables.revision_tags.push(...(d.tags??[]).map(tag_id=>({revision_id:id,tag_id})));
    tables.story_sentences.push(...d.sentences.map(s=>({...s,revision_id:id})));
    tables.revision_words.push(...d.words.map(w=>({...w,revision_id:id})));
    tables.sentence_words.push(...d.links.map(l=>({...l,revision_id:id})));
    const maps=(map,tr)=>({...map,tr});
    for(const [lang,description] of Object.entries(maps(d.descriptions,d.description)))tables.revision_texts.push({revision_id:id,lang,description});
    for(const s of d.sentences)for(const [lang,text] of Object.entries(maps(s.translations,s.turkish)))tables.sentence_translations.push({revision_id:id,sentence_id:s.id,lang,text});
    for(const w of d.words)for(const [lang,translation] of Object.entries(maps(w.translations,w.translation)))tables.word_translations.push({revision_id:id,word_id:w.id,lang,translation});
  }
  return {format:1,project:'local-fixture',createdAt:'2026-10-16T00:00:00Z',tables};
}

export function knownDiff(snapshot){
  const t=snapshot.tables;
  // The old matcher selected the short word; the bundle consumes the longer phrase.
  for(const rev of t.story_revisions){
    t.revision_words=t.revision_words.filter(w=>w.revision_id!==rev.id||!['falls-asleep','quiet'].includes(w.id));
    t.revision_words.push({revision_id:rev.id,id:'asleep',word:'asleep',translation:'uykuda',pronunciation:'/fixture/',example:'He is asleep.'});
    t.sentence_words=t.sentence_words.filter(l=>l.revision_id!==rev.id);
    const sentence=t.story_sentences.find(s=>s.revision_id===rev.id);
    t.sentence_words.push({revision_id:rev.id,sentence_id:sentence.id,word_id:'asleep'});
    t.sentence_words.push({revision_id:rev.id,sentence_id:t.story_sentences.find(s=>s.revision_id===rev.id&&s.position===2).id,word_id:'night'});
  }
  t.word_translations=t.revision_words.map(w=>({revision_id:w.revision_id,word_id:w.id,lang:'tr',translation:w.translation}));
  return snapshot;
}
