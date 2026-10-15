import {matchSpans, normalize, occurs} from '../admin/workflow.js';

const text=value=>typeof value==='string'?value:'';
const tokens=value=>[...text(value).matchAll(/[\p{L}\p{N}]+/gu)].map(m=>({key:m[0].toLowerCase(),start:m.index,end:m.index+m[0].length}));
const percent=(n,d)=>d?Math.round(n/d*10000)/100:null;
const sorted=values=>[...values].sort();
const linkKey=link=>JSON.stringify([link.sentence_id,link.word_id]);
const fields=['title','author','level','genre','description'];
const wordFields=['word','translation','pronunciation','example'];
const emptyStats=()=>({types:new Set(),covered:new Set(),tokens:0,coveredTokens:0,stories:0});
const stats=group=>({stories:group.stories,uniqueTypes:group.types.size,coveredTypes:group.covered.size,
  typeCoveragePercent:percent(group.covered.size,group.types.size),tokens:group.tokens,coveredTokens:group.coveredTokens,
  tokenCoveragePercent:percent(group.coveredTokens,group.tokens)});

export function bundledDocuments(catalog){
  if(catalog.schemaVersion!==1||!Array.isArray(catalog.stories)||!Array.isArray(catalog.words)) throw Error('Unsupported bundled catalog');
  return catalog.stories.map(story=>{
    const words=new Map(),links=[];
    const sentences=story.sentences.map((s,index)=>{
      const matched=matchSpans(s.english,catalog.words);
      for(const match of matched) words.set(match.word.id,match.word);
      for(const id of new Set(matched.map(m=>m.word.id))) links.push({sentence_id:s.id,word_id:id});
      return {...s,position:index+1};
    });
    return {...story,revisionId:null,sentences,words:[...words.values()],links};
  });
}

export function publishedDocuments(snapshot){
  if(snapshot.format!==1||!snapshot.tables) throw Error('Unsupported public content snapshot');
  for(const table of ['stories','story_revisions','story_sentences','revision_words','sentence_words','content_assets'])
    if(!Array.isArray(snapshot.tables[table])) throw Error(`Snapshot table missing: ${table}`);
  const t=snapshot.tables,revisions=new Map(t.story_revisions.map(r=>[r.id,r]));
  return t.stories.filter(s=>!s.is_archived&&s.current_revision_id).map(story=>{
    const revision=revisions.get(story.current_revision_id);
    return {...revision,id:story.id,revisionId:story.current_revision_id,
      revisionMissing:!revision,revisionWrongOwner:revision&&revision.story_id!==story.id,
      sentences:t.story_sentences.filter(s=>s.revision_id===story.current_revision_id).sort((a,b)=>a.position-b.position),
      words:t.revision_words.filter(w=>w.revision_id===story.current_revision_id),
      links:t.sentence_words.filter(l=>l.revision_id===story.current_revision_id)};
  });
}

/** Actual selectable spans, including phrases, with no stemming or stop-word removal. */
export function auditDocuments(documents,{source='bundle',dictionary=[]}={}){
  const issues=[],stories=[],levels={},all=emptyStats(),missing=new Map();
  const issue=(severity,code,storyId,details={})=>issues.push({severity,code,storyId,...details});
  const duplicates=(rows,key,code,storyId)=>{
    const seen=new Set();for(const row of rows){const id=key(row);if(seen.has(id))issue('error',code,storyId,{id});seen.add(id);}
  };
  duplicates(documents,d=>d.id,'duplicate_story_id',null);
  if(!documents.length) issue('error','empty_catalog',null);
  if(source==='bundle'){
    duplicates(dictionary,w=>w.id,'duplicate_dictionary_id',null);
    for(const word of dictionary) for(const field of ['id','word','translation'])
      if(!text(word[field]).trim())issue('error','missing_dictionary_field',null,{wordId:word.id,field});
  }
  for(const doc of documents){
    const before=issues.length;
    if(doc.revisionMissing)issue('error','missing_current_revision',doc.id,{revisionId:doc.revisionId});
    if(doc.revisionWrongOwner)issue('error','wrong_revision_owner',doc.id,{revisionId:doc.revisionId});
    if(source==='live'&&!doc.published_at)issue('error','unpublished_current_revision',doc.id);
    for(const field of ['id',...fields]) if(!text(doc[field]).trim())issue('error','missing_story_field',doc.id,{field});
    if(!['A1','A2','B1'].includes(doc.level))issue('error','invalid_level',doc.id,{level:doc.level});
    if(!['Günlük yaşam','Macera','Gizem'].includes(doc.genre))issue('error','invalid_genre',doc.id,{genre:doc.genre});
    if(!doc.sentences.length)issue('error','empty_story',doc.id);
    duplicates(doc.sentences,s=>s.id,'duplicate_sentence_id',doc.id);
    duplicates(doc.words,w=>w.id,'duplicate_word_id',doc.id);
    duplicates(doc.links,linkKey,'duplicate_link',doc.id);
    const bySentence=new Map(doc.sentences.map(s=>[s.id,s])),byWord=new Map(doc.words.map(w=>[w.id,w]));
    const linked=new Map(),used=new Set(),lexemes=new Set();
    for(const word of doc.words){
      for(const field of ['id',...wordFields]) if(!text(word[field]).trim())
        issue(['id','word','translation'].includes(field)?'error':'warning','missing_word_field',doc.id,{wordId:word.id,field});
      const key=normalize(word.word);
      if(!key)issue('error','empty_word_tokens',doc.id,{wordId:word.id});
      if(lexemes.has(key))issue('warning','duplicate_lexeme',doc.id,{wordId:word.id,word:word.word});lexemes.add(key);
      if(text(word.example).trim()&&!occurs(word.example,word.word))issue('warning','example_without_exact_word',doc.id,{wordId:word.id});
    }
    for(const link of doc.links){
      const sentence=bySentence.get(link.sentence_id),word=byWord.get(link.word_id);
      if(!sentence||!word){issue('error','dangling_link',doc.id,{sentenceId:link.sentence_id,wordId:link.word_id});continue;}
      if(!occurs(sentence.english,word.word)){issue('error','word_absent_from_linked_sentence',doc.id,{sentenceId:sentence.id,wordId:word.id});continue;}
      if(!linked.has(sentence.id))linked.set(sentence.id,[]);
      linked.get(sentence.id).push(word);used.add(word.id);
    }
    for(const word of doc.words)if(!used.has(word.id))issue('warning','unlinked_word',doc.id,{wordId:word.id});
    const group=emptyStats();group.stories=1;
    const levelKey=doc.level??'unknown';
    const level=levels[levelKey]??=emptyStats();level.stories++;
    for(const [index,sentence] of doc.sentences.entries()){
      if(!text(sentence.id).trim())issue('error','missing_sentence_id',doc.id);
      if(sentence.position!==index+1)issue('error','non_contiguous_position',doc.id,{sentenceId:sentence.id,position:sentence.position,expected:index+1});
      for(const field of ['english','turkish'])if(!text(sentence[field]).trim())issue('error','missing_translation',doc.id,{sentenceId:sentence.id,field});
      if(text(sentence.english).trim()&&text(sentence.english).trim()===text(sentence.turkish).trim())
        issue('warning','identical_translation_review',doc.id,{sentenceId:sentence.id});
      const allowed=linked.get(sentence.id)??[];
      const actualIds=new Set(allowed.map(w=>w.id));
      for(const match of matchSpans(sentence.english,doc.words))if(!actualIds.has(match.word.id))
        issue('warning','unlinked_occurrence_review',doc.id,{sentenceId:sentence.id,wordId:match.word.id});
      const spans=matchSpans(sentence.english,allowed);
      for(const token of tokens(sentence.english)){
        const covered=spans.some(span=>span.start<=token.start&&span.end>=token.end);
        for(const s of [group,level,all]){s.types.add(token.key);s.tokens++;if(covered){s.covered.add(token.key);s.coveredTokens++;}}
        if(!covered){
          const key=JSON.stringify([levelKey,token.key]);
          if(!missing.has(key))missing.set(key,{token:token.key,level:levelKey,occurrences:0,storyIds:new Set(),examples:[]});
          const entry=missing.get(key);entry.occurrences++;entry.storyIds.add(doc.id);
          if(entry.examples.length<2&&!entry.examples.some(e=>e.storyId===doc.id&&e.sentenceId===sentence.id))
            entry.examples.push({storyId:doc.id,sentenceId:sentence.id,english:sentence.english});
        }
      }
    }
    all.stories++;
    stories.push({id:doc.id,title:doc.title,level:doc.level,revisionId:doc.revisionId,sentences:doc.sentences.length,
      vocabularyEntries:doc.words.length,links:doc.links.length,...stats(group),issueCount:issues.length-before});
  }
  const backlog=[...missing.values()].filter(entry=>!levels[entry.level].covered.has(entry.token)).map(entry=>({...entry,storyIds:sorted(entry.storyIds)}))
    .sort((a,b)=>String(a.level).localeCompare(String(b.level))||b.occurrences-a.occurrences||a.token.localeCompare(b.token));
  return {source,summary:{...stats(all),sentences:documents.reduce((n,d)=>n+d.sentences.length,0),
    vocabularyEntries:documents.reduce((n,d)=>n+d.words.length,0),distinctVocabularyIds:new Set(documents.flatMap(d=>d.words.map(w=>w.id))).size,
    dictionaryEntries:source==='bundle'?dictionary.length:null,links:documents.reduce((n,d)=>n+d.links.length,0),
    errors:issues.filter(i=>i.severity==='error').length,warnings:issues.filter(i=>i.severity==='warning').length},
    levels:Object.fromEntries(Object.entries(levels).map(([key,value])=>[key,stats(value)])),stories,issues,backlog};
}

export function compareDocuments(bundle,live,{manifest,snapshot}={}){
  const b=new Map(bundle.map(s=>[s.id,s])),l=new Map(live.map(s=>[s.id,s])),differences=[];
  const assets=new Map(snapshot?.tables.content_assets.map(a=>[a.id,a])??[]);
  const fieldsChanged=(expected,actual,names)=>names.filter(name=>expected[name]!==actual[name]);
  for(const expected of bundle){
    const actual=l.get(expected.id);if(!actual)continue;
    const sentenceMap=new Map(actual.sentences.map(s=>[s.id,s])),wordMap=new Map(actual.words.map(w=>[w.id,w]));
    const sentenceIds=new Set(expected.sentences.map(s=>s.id)),wordIds=new Set(expected.words.map(w=>w.id));
    const expectedLinks=new Set(expected.links.map(linkKey)),actualLinks=new Set(actual.links.map(linkKey));
    const cover=manifest?.assets.find(a=>a.source.endsWith(`/${expected.coverKey}.png`));
    const activeCover=assets.get(actual.cover_asset_id);
    const diff={storyId:expected.id,liveRevisionId:actual.revisionId,metadataFields:fieldsChanged(expected,actual,fields),
      missingSentenceIds:expected.sentences.filter(s=>!sentenceMap.has(s.id)).map(s=>s.id),
      extraSentenceIds:actual.sentences.filter(s=>!sentenceIds.has(s.id)).map(s=>s.id),
      modifiedSentences:expected.sentences.filter(s=>sentenceMap.has(s.id)).map(s=>({id:s.id,fields:fieldsChanged(s,sentenceMap.get(s.id),['position','english','turkish'])})).filter(s=>s.fields.length),
      missingWordIds:expected.words.filter(w=>!wordMap.has(w.id)).map(w=>w.id),
      extraWordIds:actual.words.filter(w=>!wordIds.has(w.id)).map(w=>w.id),
      modifiedWords:expected.words.filter(w=>wordMap.has(w.id)).map(w=>({id:w.id,fields:fieldsChanged(w,wordMap.get(w.id),wordFields)})).filter(w=>w.fields.length),
      missingLinks:expected.links.filter(link=>!actualLinks.has(linkKey(link))),extraLinks:actual.links.filter(link=>!expectedLinks.has(linkKey(link))),
      coverMismatch:manifest&&snapshot?(!cover||!activeCover||cover.sha256!==activeCover.sha256||cover.byteSize!==Number(activeCover.byte_size)):null};
    if(diff.coverMismatch||Object.entries(diff).some(([key,value])=>Array.isArray(value)&&value.length))differences.push(diff);
  }
  const missingStoryIds=sorted([...b.keys()].filter(id=>!l.has(id))),extraStoryIds=sorted([...l.keys()].filter(id=>!b.has(id)));
  const bundleWords=new Set(bundle.flatMap(d=>d.words.map(w=>w.id))),liveWords=new Set(live.flatMap(d=>d.words.map(w=>w.id)));
  return {equal:!differences.length&&!missingStoryIds.length&&!extraStoryIds.length,missingStoryIds,extraStoryIds,
    summary:{comparedStories:bundle.filter(d=>l.has(d.id)).length,comparedCovers:manifest&&snapshot?bundle.filter(d=>l.has(d.id)).length:0,
      metadataFieldDifferences:differences.reduce((n,d)=>n+d.metadataFields.length,0),
      sentenceDifferences:differences.reduce((n,d)=>n+d.missingSentenceIds.length+d.extraSentenceIds.length+d.modifiedSentences.length,0),
      missingRevisionWords:differences.reduce((n,d)=>n+d.missingWordIds.length,0),extraRevisionWords:differences.reduce((n,d)=>n+d.extraWordIds.length,0),
      modifiedRevisionWords:differences.reduce((n,d)=>n+d.modifiedWords.length,0),
      missingLinks:differences.reduce((n,d)=>n+d.missingLinks.length,0),extraLinks:differences.reduce((n,d)=>n+d.extraLinks.length,0),
      coverMismatches:differences.filter(d=>d.coverMismatch).length},
    missingVocabularyIds:sorted([...bundleWords].filter(id=>!liveWords.has(id))),extraVocabularyIds:sorted([...liveWords].filter(id=>!bundleWords.has(id))),
    differingStories:differences};
}

export function auditCatalog(catalog){
  const docs=bundledDocuments(catalog),result=auditDocuments(docs,{dictionary:catalog.words});
  const used=new Set(docs.flatMap(d=>d.words.map(w=>w.id)));
  result.unusedDictionaryIds=catalog.words.filter(w=>!used.has(w.id)).map(w=>w.id);
  for(const wordId of result.unusedDictionaryIds)result.issues.push({severity:'warning',code:'unused_dictionary_entry',storyId:null,wordId});
  result.summary.warnings=result.issues.filter(i=>i.severity==='warning').length;
  return result;
}
export function auditSnapshot(snapshot){
  const docs=publishedDocuments(snapshot),result=auditDocuments(docs,{source:'live'});
  const assets=new Map(snapshot.tables.content_assets.map(a=>[a.id,a]));
  for(const doc of docs){
    for(const [field,kind] of [['cover_asset_id','cover'],['audio_asset_id','audio']]){
      if(field==='audio_asset_id'&&!doc[field])continue;
      const asset=assets.get(doc[field]);
      if(!asset)result.issues.push({severity:'error',code:'missing_media_asset',storyId:doc.id,field});
      else if(asset.kind!==kind||!text(asset.storage_path).trim()||!text(asset.mime_type).startsWith(kind==='cover'?'image/':'audio/')||!Number.isSafeInteger(Number(asset.byte_size))||Number(asset.byte_size)<=0||!/^[a-f0-9]{64}$/.test(asset.sha256))
        result.issues.push({severity:'error',code:'invalid_media_asset',storyId:doc.id,field,assetId:asset.id});
    }
  }
  result.summary.errors=result.issues.filter(i=>i.severity==='error').length;
  result.snapshot={project:snapshot.project,createdAt:snapshot.createdAt,scope:snapshot.scope,
    sourceTableCounts:Object.fromEntries(Object.entries(snapshot.tables).map(([key,rows])=>[key,rows.length]))};
  return result;
}

/** Strict release gates are opt-in; an audit never labels known drift or low coverage as fixed. */
export function acceptance({bundle,live,comparison},{requireParity=false,minCoverage=null}={}){
  const failures=[];
  if(bundle.summary.errors)failures.push('bundle_structure');
  if(live?.summary.errors)failures.push('live_structure');
  if(requireParity&&!comparison?.equal)failures.push('bundle_live_parity');
  if(minCoverage!==null){
    if(!Number.isFinite(minCoverage)||minCoverage<0||minCoverage>100)throw Error('Coverage threshold must be between 0 and 100');
    for(const report of [bundle,...(live?[live]:[])])for(const level of ['A1','A2'])
      if(report.levels[level]?.typeCoveragePercent==null||report.levels[level].typeCoveragePercent<minCoverage)failures.push(`${report.source}_${level}_coverage`);
  }
  return {passed:!failures.length,failures};
}
