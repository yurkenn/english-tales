import {createHash} from 'node:crypto';
import {draftDocument} from './content-drafts-lib.mjs';
import {auditSnapshot,bundledDocuments,publishedDocuments} from './content-audit-lib.mjs';

const sha256=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
  Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const encode=value=>JSON.stringify(canonical(value));

/**
 * Turns verified pilot previews into the same admin draft packet `content:drafts` applies.
 * The live source must still carry the bundled text the pilot was written against.
 * No publish RPC exists here: a publisher still publishes each draft in the panel.
 */
export function generatePilotDrafts(catalog,snapshot,preview){
  if(preview?.format!=='story-pilot-preview/v1')throw Error('Unsupported pilot preview packet');
  if(auditSnapshot(snapshot).summary.errors)throw Error('Canlı snapshot yapısal hata içeriyor; önce content:audit çalıştırın.');
  const live=publishedDocuments(snapshot),liveById=new Map(live.map(doc=>[doc.id,doc]));
  const bundleById=new Map(bundledDocuments(catalog).map(doc=>[doc.id,doc]));
  const guards=live.map(doc=>{
    if(!Number.isSafeInteger(doc.edit_version)||doc.edit_version<1)throw Error(`Snapshot edit_version eksik: ${doc.id}`);
    return {storyId:doc.id,currentRevisionId:doc.revisionId,editVersion:doc.edit_version,document:draftDocument(doc)};
  });
  const blockers=[],drafts=[];
  for(const row of preview.stories){
    const id=row.storyId,base=liveById.get(id),bundled=bundleById.get(id);
    if(!row.review.complete)blockers.push(`İnsan editoryal/dil onayı eksik: ${id}`);
    if(!base){blockers.push(`Yayımlanmış kaynak hikâye yok: ${id}`);continue;}
    // The pilot was authored against the bundled text; a live edit since then must be merged by an editor first.
    const text=doc=>doc.sentences.map(s=>[s.id,s.english]);
    if(!bundled||encode(text(base))!==encode(text(bundled))||base.title!==bundled.title||base.level!==bundled.level)
      blockers.push(`Canlı metin pilotun kaynağından farklı: ${id}`);
    const {id:_localId,story_id:_story,...source}=row.preview;
    const document=draftDocument({...source,cover_asset_id:base.cover_asset_id,audio_asset_id:base.audio_asset_id});
    const current=draftDocument(base),ids=list=>new Set(list.map(x=>x.id));
    const liveSentences=ids(current.sentences),liveWords=ids(current.words),nextWords=ids(document.words);
    drafts.push({storyId:id,sourceRevisionId:base.revisionId,sourceEditVersion:base.edit_version,
      create:{rpc:'admin_create_draft',args:{p_story_id:id,p_source_id:base.revisionId}},
      save:{rpc:'admin_save_draft',args:{p_revision_id:null,p_expected_version:null,p_document:document}},
      documentSHA256:sha256(encode(document)),pilotDraftSHA256:row.draftSHA256,
      summary:{title:document.title,sentences:`${current.sentences.length} → ${document.sentences.length}`,
        addedSentences:document.sentences.filter(s=>!liveSentences.has(s.id)).length,
        changedSentences:document.sentences.filter(s=>liveSentences.has(s.id)&&s.english!==current.sentences.find(x=>x.id===s.id).english).length,
        studyWords:document.words.map(w=>w.id),
        removedWords:current.words.filter(w=>!nextWords.has(w.id)).map(w=>w.id),
        addedWords:document.words.filter(w=>!liveWords.has(w.id)).map(w=>w.id),
        questions:`${current.questions.length} → ${document.questions.length}`,
        languages:Object.keys(document.descriptions).sort()}});
  }
  return {format:1,purpose:'Pilot revizyonları için yalnız taslak hazırlığı; yayın çağrısı yok.',blockers,guards,drafts};
}

const cell=value=>String(value??'—').replace(/[|\r\n]/g,' ');
export function renderPilotDraftReport(packet){
  const lines=['# Hikâye pilotu → canlı revizyon taslakları','',`Paket kimliği: ${packet.packageSHA256}`,'',
    `Hikâye: ${packet.drafts.length}. Araç yalnız taslak oluşturur; yayın panelde yayıncı tarafından yapılır.`,'',
    'Mevcut kapak/ses korunur. Yeni revizyonda yalnız seçili çalışma kelimeleri bağlanır; çıkan kelimeler eski yayında ve öğrenme geçmişinde kalır.',
    '','## Kaynak özetleri','',...Object.entries(packet.inputs??{}).map(([key,value])=>`- ${key}: SHA-256 ${value.sha256}`),
    '','## Uygulama engelleri','',...(packet.blockers.length?packet.blockers.map(b=>`- ${cell(b)}`):['Yok.']),
    '','| Hikâye | Kaynak revizyon | Cümle | Yeni / değişen cümle | Soru | Eklenen kelime | Çıkan kelime | Diller | Payload SHA-256 |',
    '|---|---|---|---|---|---|---|---|---|'];
  for(const d of packet.drafts){
    const s=d.summary;
    lines.push(`| ${cell(s.title)} | ${cell(d.sourceRevisionId)} (v${d.sourceEditVersion}) | ${s.sentences} | ${s.addedSentences} / ${s.changedSentences} | ${s.questions} | ${cell(s.addedWords.join(', '))} | ${cell(s.removedWords.join(', '))} | ${s.languages.length} | ${d.documentSHA256.slice(0,16)} |`);
  }
  return lines.join('\n')+'\n';
}
