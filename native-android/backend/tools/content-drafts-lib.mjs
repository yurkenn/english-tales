import {questionDocument} from '../admin/workflow.js';
import {createHash} from 'node:crypto';
import {auditCatalog,auditSnapshot,bundledDocuments,publishedDocuments,compareDocuments,translationMap} from './content-audit-lib.mjs';
import {translationEntries} from './export-catalog.mjs';

export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const pick=(row,keys)=>Object.fromEntries(keys.map(key=>[key,row[key]??'']));
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
  Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const encode=value=>JSON.stringify(canonical(value));
const byId=(a,b)=>a.id.localeCompare(b.id);

/** Only writable content participates; server revision IDs and edit counters do not. */
export function draftDocument(doc){
  return {...pick(doc,['title','author','level','genre','description']),
    cover_asset_id:doc.cover_asset_id??null,audio_asset_id:doc.audio_asset_id??null,
    questions:questionDocument(doc.questions),
    tags:[...(doc.tags??[])].sort(),
    descriptions:translationMap(doc,doc.descriptions,doc.description),
    sentences:doc.sentences.map(row=>({...pick(row,['id','english','turkish']),
      translations:translationMap(doc,row.translations,row.turkish)})),
    words:doc.words.map(row=>({...pick(row,['id','word','translation','pronunciation','example']),
      translations:translationMap(doc,row.translations,row.translation)})).sort(byId),
    links:doc.links.map(row=>pick(row,['sentence_id','word_id'])).sort((a,b)=>encode(a).localeCompare(encode(b)))};
}
export const equivalent=(a,b)=>encode(draftDocument(a))===encode(draftDocument(b));

export function generateDrafts(catalog,snapshot,assetManifest){
  if(auditCatalog(catalog).summary.errors||auditSnapshot(snapshot).summary.errors)throw Error('Kaynakta yapısal hata var; önce content:audit çalıştırın.');
  const bundle=bundledDocuments(catalog),live=publishedDocuments(snapshot);
  // Validate optional maps with exactly the exporter contract, including legacy Turkish.
  for(const doc of bundle){
    translationEntries(doc.descriptions,doc.description,doc.id);
    for(const row of doc.sentences)translationEntries(row.translations,row.turkish,row.id);
    for(const row of doc.words)translationEntries(row.translations,row.translation,row.id);
  }
  const comparison=compareDocuments(bundle,live,{manifest:assetManifest,snapshot});
  const blockers=[...comparison.missingStoryIds.map(id=>`Yayımlanmış kaynak hikâye yok: ${id}`),
    ...comparison.extraStoryIds.map(id=>`Pakette olmayan etkin hikâye: ${id}`),
    ...comparison.differingStories.filter(d=>d.coverMismatch).map(d=>`Kapak eşit değil; medya ayrıca hazırlanmalı: ${d.storyId}`)];
  const guards=live.map(doc=>{
    if(!Number.isSafeInteger(doc.edit_version)||doc.edit_version<1)throw Error(`Snapshot edit_version eksik: ${doc.id}`);
    return {storyId:doc.id,currentRevisionId:doc.revisionId,editVersion:doc.edit_version,document:draftDocument(doc)};
  });
  const liveById=new Map(live.map(doc=>[doc.id,doc])),bundleById=new Map(bundle.map(doc=>[doc.id,doc]));
  const drafts=comparison.differingStories.map(changes=>{
    const base=liveById.get(changes.storyId),desired=bundleById.get(changes.storyId);
    const document=draftDocument({...desired,cover_asset_id:base.cover_asset_id,audio_asset_id:base.audio_asset_id});
    return {storyId:base.id,sourceRevisionId:base.revisionId,sourceEditVersion:base.edit_version,
      create:{rpc:'admin_create_draft',args:{p_story_id:base.id,p_source_id:base.revisionId}},
      save:{rpc:'admin_save_draft',args:{p_revision_id:null,p_expected_version:null,p_document:document}},
      documentSHA256:sha256(encode(document)),changes,
      removedWords:base.words.filter(w=>changes.extraWordIds.includes(w.id)),
      asleepDecision:changes.extraWordIds.includes('asleep')?
        'Yeni taslak paket kuralını izler: falls asleep ifadesi asleep kelimesinden önce kazanır. asleep yalnız yeni taslakta çıkarılır; eski yayın ve öğrenme geçmişi korunur.':null};
  });
  return {format:1,purpose:'Yalnız taslak hazırlığı; yayın çağrısı yok.',blockers,comparison,guards,drafts};
}

const cell=value=>String(value??'—').replace(/[|\r\n]/g,' ');
export function renderDraftReport(packet){
  const lines=['# Q4.1 — paket → revizyon taslakları','',`Paket kimliği: ${packet.packageSHA256}`,'',
    `Etkilenen hikâye: ${packet.drafts.length}. Varsayılan işlem yerel dry-run; yayın yapılmaz.`,
    '', 'Yalnız paketteki kalıcı cümle/kelime kimlikleri kullanılır. Revizyon UUID’sini sunucu üretir. Mevcut kapak/ses korunur. Çeviri haritaları paketin tamamıyla değiştirilir; pakette olmayan ek diller yalnız yeni taslaktan çıkarılır. Eski yayınlar ve öğrenme geçmişi korunur.',
    '', '## Kaynak özetleri','',...Object.entries(packet.inputs).map(([key,value])=>`- ${key}: SHA-256 ${value.sha256}`),
    '', '## Uygulama engelleri','',...(packet.blockers.length?packet.blockers.map(cell):['Yok.']),
    '', '## asleep kararı','',
    'Uzun ifade önce kazanır. classic-tortoise-hare ve classic-dog-manger içindeki iki fazla asleep satırı yeni taslakta paket kuralına göre çıkarılır; eski revizyonlardan veya öğrenme geçmişinden silinmez. Aşağıdaki hikâye farkları mevcut snapshot için gerçek çıkarımları gösterir.'];
  for(const draft of packet.drafts){
    const d=draft.save.args.p_document,c=draft.changes;
    lines.push('',`## ${cell(draft.storyId)} — ${cell(d.title)}`,'',
      `Kaynak: ${draft.sourceRevisionId} · edit_version: ${draft.sourceEditVersion} · payload SHA-256: ${draft.documentSHA256}`,'',
      `Bilgi alanları: ${c.metadataFields.join(', ')||'yok'}. Cümle ekleme/çıkarma/değiştirme: ${c.missingSentenceIds.length}/${c.extraSentenceIds.length}/${c.modifiedSentences.length}.`,
      '', '| Kelime işlemi | ID | Metin | Anlam | Örnek |','|---|---|---|---|---|');
    for(const [action,words] of [['Ekle',d.words.filter(w=>c.missingWordIds.includes(w.id))],['Çıkar (yeni taslak)',draft.removedWords],['Güncelle',d.words.filter(w=>c.modifiedWords.some(m=>m.id===w.id))]])
      for(const w of words)lines.push(`| ${action} | ${cell(w.id)} | ${cell(w.word)} | ${cell(w.translation)} | ${cell(w.example)} |`);
    if(draft.asleepDecision)lines.push('',draft.asleepDecision);
    lines.push('','| Bağlantı işlemi | Cümle ID | Kelime ID | Örnek cümle |','|---|---|---|---|');
    const old=packet.guards.find(g=>g.storyId===draft.storyId).document;
    for(const [action,links,doc] of [['Ekle',c.missingLinks,d],['Çıkar (yeni taslak)',c.extraLinks,old]])
      for(const link of links)lines.push(`| ${action} | ${cell(link.sentence_id)} | ${cell(link.word_id)} | ${cell(doc.sentences.find(s=>s.id===link.sentence_id)?.english)} |`);
    lines.push('','| Çeviri türü | ID | Dil | Eski | Paket |','|---|---|---|---|---|');
    for(const t of c.translationChanges)lines.push(`| ${t.kind} | ${cell(t.id)} | ${cell(t.lang)} | ${cell(t.actual)} | ${cell(t.expected)} |`);
    if(c.tagChanges?.length)lines.push('',`Etiketler paket listesiyle değiştirilir: ${(old.tags??[]).join(', ')||'yok'} → ${d.tags.join(', ')}.`);
    if(c.questionChanges.length)lines.push('',`Sorular paket listesiyle değiştirilir: ${old.questions.length} → ${d.questions.length}.`, '', '```json',JSON.stringify(d.questions,null,2),'```');
    lines.push('','Cümle örneği: '+cell(d.sentences[0]?.english));
  }
  return lines.join('\n')+'\n';
}

async function catalogRows(rpc){
  const result=[];
  for(let offset=0;offset<100000;offset+=100){
    const page=await rpc('admin_catalog',{p_offset:offset,p_limit:100});
    if(!Array.isArray(page))throw Error('Geçersiz admin_catalog yanıtı');
    result.push(...page);if(page.length<100)return result;
  }
  throw Error('Yönetim katalog sınırı aşıldı');
}
function checkGuard(guard,doc){
  if(!doc||doc.story_id!==guard.storyId||doc.is_archived||!doc.published_at||doc.id!==guard.currentRevisionId||
    doc.current_revision_id!==guard.currentRevisionId||doc.edit_version!==guard.editVersion)
    throw Error(`snapshot_drift: ${guard.storyId}; yeni snapshot ve inceleme gerekli`);
  if(!equivalent(doc,guard.document))throw Error(`snapshot_content_drift: ${guard.storyId}; dil tablolarını da içeren yeni snapshot gerekli`);
}
function draftState(draft,target,base){
  if(draft.published_at||draft.story_id!==base.storyId||draft.current_revision_id!==base.currentRevisionId||draft.is_archived)
    throw Error(`snapshot_drift: ${base.storyId}`);
  if(equivalent(draft,target))return 'equivalent';
  if(equivalent(draft,base.document))return 'source-copy';
  throw Error(`open_draft_conflict: ${base.storyId}; paneldeki editoryal taslak korunuyor`);
}

/** No writes, credentials or network access in the default path, even with an RPC supplied. */
export async function applyDrafts(packet,{apply=false,rpc,onResult=()=>{}}={}){
  if(!apply)return {mode:'dry-run',stories:packet.drafts.map(d=>({storyId:d.storyId,status:'planned'}))};
  if(packet.blockers.length)throw Error('Uygulama engelleri var; review.md dosyasını inceleyin.');
  if(!rpc)throw Error('Editör RPC oturumu gerekli');
  const call=rpc;
  rpc=async(name,args)=>{
    const result=await call(name,args);
    return ['admin_revision','admin_create_draft','admin_save_draft'].includes(name)?{...result,translationTablesPresent:true}:result;
  };
  const role=await rpc('content_role',{});
  if(!['editor','publisher'].includes(role))throw Error('Editör veya yayıncı rolü gerekli');
  const rows=await catalogRows(rpc),expected=new Set(packet.guards.map(g=>g.storyId));
  if(rows.some(r=>!r.is_archived&&r.current_revision_id&&!expected.has(r.story_id)))throw Error('snapshot_drift: etkin hikâye listesi değişti');
  // Preflight every current publication and every open draft before the first mutation.
  for(const guard of packet.guards){
    const row=rows.find(r=>r.id===guard.currentRevisionId);
    if(!row||row.current_revision_id!==guard.currentRevisionId||row.edit_version!==guard.editVersion)throw Error(`snapshot_drift: ${guard.storyId}`);
    checkGuard(guard,await rpc('admin_revision',{p_revision_id:guard.currentRevisionId}));
  }
  const candidates=new Map();
  for(const plan of packet.drafts){
    const guard=packet.guards.find(g=>g.storyId===plan.storyId);
    const open=rows.filter(r=>r.story_id===plan.storyId&&!r.published_at);
    if(open.length>1)throw Error(`open_draft_conflict: ${plan.storyId}; birden çok taslak var`);
    if(open.length){
      const doc=await rpc('admin_revision',{p_revision_id:open[0].id});
      draftState(doc,plan.save.args.p_document,guard);candidates.set(plan.storyId,doc);
    }
  }
  const stories=[];
  for(const plan of packet.drafts){
    const guard=packet.guards.find(g=>g.storyId===plan.storyId),target=plan.save.args.p_document;
    checkGuard(guard,await rpc('admin_revision',{p_revision_id:guard.currentRevisionId}));
    const known=candidates.get(plan.storyId);
    let draft=known?await rpc('admin_revision',{p_revision_id:known.id}):await rpc('admin_create_draft',plan.create.args);
    if(!Number.isSafeInteger(draft.edit_version)||!draft.id)throw Error('Geçersiz taslak yanıtı');
    const state=draftState(draft,target,guard);
    if(known&&draft.edit_version!==known.edit_version)throw Error(`draft_version_conflict: ${plan.storyId}`);
    let status='skipped-equivalent';
    if(state!=='equivalent'){
      checkGuard(guard,await rpc('admin_revision',{p_revision_id:guard.currentRevisionId}));
      draft=await rpc('admin_save_draft',{p_revision_id:draft.id,p_expected_version:draft.edit_version,p_document:target});
      if(!equivalent(draft,target)||draft.published_at)throw Error(`draft_verification_failed: ${plan.storyId}`);
      status='saved';
    }
    checkGuard(guard,await rpc('admin_revision',{p_revision_id:guard.currentRevisionId}));
    const result={storyId:plan.storyId,status,revisionId:draft.id,editVersion:draft.edit_version};
    stories.push(result);await onResult(result);
  }
  return {mode:'apply',stories};
}
