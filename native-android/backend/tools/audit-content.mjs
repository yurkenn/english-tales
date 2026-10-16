import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {validSupportLanguage} from '../admin/workflow.js';
import {auditCatalog,auditSnapshot,bundledDocuments,publishedDocuments,compareDocuments,acceptance} from './content-audit-lib.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=file=>readFile(file).then(bytes=>JSON.parse(bytes));
const cell=value=>String(value??'—').replace(/[|\r\n]/g,' ');

export async function verifySnapshotMedia(snapshot,snapshotPath){
  const docs=publishedDocuments(snapshot);
  const ids=new Set(docs.flatMap(d=>[d.cover_asset_id,d.audio_asset_id].filter(Boolean)));
  const assets=new Map(snapshot.tables.content_assets.map(a=>[a.id,a]));
  let verified=0;
  for(const id of ids){
    if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id))throw Error('Invalid media ID');
    const asset=assets.get(id);if(!asset)throw Error(`Missing media metadata: ${id}`);
    const file=path.join(path.dirname(snapshotPath),'media',id);
    const size=(await stat(file)).size;
    if(size>20*1024*1024||size!==Number(asset.byte_size))throw Error(`Media size mismatch: ${id}`);
    if(sha(await readFile(file))!==asset.sha256)throw Error(`Media checksum mismatch: ${id}`);
    verified++;
  }
  return {status:'verified',assets:verified};
}

export function revisionProposals(bundle,comparison){
  const docs=new Map(bundle.map(d=>[d.id,d]));
  return {format:1,purpose:'Review packet only. No draft created and no publication performed.',
    proposals:comparison.differingStories.map(diff=>{
      const d=docs.get(diff.storyId);
      return {storyId:d.id,baseLiveRevisionId:diff.liveRevisionId,draftRevisionId:null,
        metadata:Object.fromEntries(['title','author','level','genre','description','coverKey'].map(k=>[k,d[k]])),
        sentences:d.sentences.map(({id,position,english,turkish})=>({id,position,english,turkish})),
        words:d.words.map(({id,word,translation,pronunciation,example})=>({id,word,translation,pronunciation,example})),
        questions:d.questions,links:d.links,changes:diff};
    })};
}

export function renderReport(result){
  const lines=['# İçerik kalite denetimi','',`Üretim zamanı: ${result.generatedAt} · Kaynak commit: ${result.sourceCommit??'bilinmiyor'}`,'',
    'Bu araç yayın yapmaz. Yapısal kontrolün geçmesi, paket/canlı eşitliği veya %60 kapsama hedefinin sağlandığı anlamına gelmez.','',
    '| Kaynak | Hikâye | Cümle | Farklı revision sözlük ID | Benzersiz token kapsamı | Geçiş kapsamı | Hata | Uyarı |',
    '|---|---:|---:|---:|---:|---:|---:|---:|'];
  for(const report of [result.bundle,...(result.live?[result.live]:[])]){
    const s=report.summary;
    lines.push(`| ${report.source} | ${s.stories} | ${s.sentences} | ${s.distinctVocabularyIds} | ${s.coveredTypes}/${s.uniqueTypes} (%${s.typeCoveragePercent}) | %${s.tokenCoveragePercent} | ${s.errors} | ${s.warnings} |`);
  }
  lines.push('','## A1/A2 kapsama hedefi','',
    'Ölçüt: Unicode harf/rakam token türleri; köke indirgeme, durak sözcüğü veya özel ad elemesi yok. Çok kelimeli ifadelerin kapsadığı bütün token’lar sayılır. Canlıda yalnız editörün gerçekten bağladığı kelimeler seçilebilir sayılır. Tür kapsamı en az bir yerde seçilebilen farklı token’ları, geçiş kapsamı her tekil kullanımı ölçer.','',
    '| Kaynak | Seviye | Kapsanan / toplam tür | Yüzde | ≥ %60 |','|---|---|---:|---:|---|');
  for(const report of [result.bundle,...(result.live?[result.live]:[])])for(const level of ['A1','A2']){
    const s=report.levels[level];lines.push(`| ${report.source} | ${level} | ${s?`${s.coveredTypes}/${s.uniqueTypes}`:'—'} | ${s?.typeCoveragePercent??'—'} | ${s?.typeCoveragePercent>=60?'Geçti':'Açık'} |`);
  }
  if(result.comparison){
    const c=result.comparison;
    lines.push('','## Paket / etkin yayın farkı','',`Eşit: ${c.equal?'evet':'hayır'} · Farklı hikâye: ${c.differingStories.length} · Eksik hikâye: ${c.missingStoryIds.length} · Fazla hikâye: ${c.extraStoryIds.length}`,
      '',`Canlıda eksik kelime ID’leri (${c.missingVocabularyIds.length}): ${c.missingVocabularyIds.map(cell).join(', ')||'yok'}`,'',
      '| Hikâye | Bilgi farkı | Cümle farkı | Eksik/fazla kelime | Değişen kelime | Eksik/fazla bağlantı | Çeviri farkı | Soru farkı | Kapak farkı |',
      '|---|---:|---:|---:|---:|---:|---:|---:|---|');
    for(const d of c.differingStories)lines.push(`| ${cell(d.storyId)} | ${d.metadataFields.length} | ${d.missingSentenceIds.length+d.extraSentenceIds.length+d.modifiedSentences.length} | ${d.missingWordIds.length}/${d.extraWordIds.length} | ${d.modifiedWords.length} | ${d.missingLinks.length}/${d.extraLinks.length} | ${d.translationChanges.length} | ${d.questionChanges.length} | ${d.coverMismatch?'var':'yok'} |`);
    lines.push('',`Canlı snapshot: ${result.live.snapshot.createdAt} · Medya: ${result.media.status} (${result.media.assets??0})`);
  }
  lines.push('','## Editör inceleme sırası','',
    'Aşağıdaki liste, henüz hiç seçilemeyen token türlerini tekrar sıklığına göre sıralar. Zamir, bağlaç, çekimli biçim ve özel adlar da bulunur; liste bir CEFR kelime listesi veya otomatik yayın önerisi değildir. Tam liste ve örnek cümleler audit.json içindedir.');
  const target=result.live??result.bundle;
  for(const level of ['A1','A2']){
    lines.push('',`### ${level} — ilk 20`,'','| Token | Geçiş | Hikâye sayısı |','|---|---:|---:|');
    for(const row of target.backlog.filter(r=>r.level===level).slice(0,20))lines.push(`| ${cell(row.token)} | ${row.occurrences} | ${row.storyIds.length} |`);
  }
  lines.push('','## İngilizce anlama soruları','','| Kaynak | Seviye | En az 3 geçerli sorulu hikâye | Toplam hikâye |','|---|---|---:|---:|');
  for(const report of [result.bundle,...(result.live?[result.live]:[])])
    for(const [level,counts] of Object.entries(report.levels))lines.push(`| ${report.source} | ${level} | ${counts.storiesWithThreeQuestions} | ${counts.stories} |`);
  for(const report of [result.bundle,...(result.live?[result.live]:[])])
    lines.push('',`${report.source} — sorusuz hikâyeler: ${report.storiesWithoutQuestions.map(cell).join(', ')||'yok'}`);
  lines.push('','## Destek dili bütünlüğü','','| Kaynak | Dil | Eksik cümle | Eksik kelime | Eksik açıklama | Tam |','|---|---|---:|---:|---:|---|');
  for(const report of [result.bundle,...(result.live?[result.live]:[])])for(const [lang,counts] of Object.entries(report.translations??{}))
    lines.push(`| ${report.source} | ${cell(lang)} | ${counts.missingSentences} | ${counts.missingWords} | ${counts.missingDescriptions} | ${counts.complete?'evet':'hayır'} |`);
  lines.push('','## Kontrol sonucu','',`İstenen kontroller: ${result.acceptance.passed?'geçti':'geçmedi'} · ${result.acceptance.failures.join(', ')||'yapısal hata yok'}`,
    '',`Bundle’da kullanılmayan sözlük ID’leri: ${result.bundle.unusedDictionaryIds.join(', ')||'yok'}`,
    '', 'Eksik/boş çeviri, yanlış kelime bağlantısı, yinelenen kimlik ve bozuk sıra yapısal hatadır. Bağlanmamış sözlük geçişleri ve birebir eş örnek çeviriler editör inceleme uyarısıdır; anlamsal çeviri doğruluğu otomatik kontrol edilmiş sayılmaz.','');
  return lines.join('\n');
}

export async function main(args=process.argv.slice(2),sources={}){
  const options={output:path.join(root,'native-android/build/content-audit'),snapshot:null,skipMedia:false,requireParity:false,minCoverage:null,requireLang:null,minQuestions:null};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(['--output','--snapshot','--min-coverage','--require-lang','--min-questions'].includes(arg)){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Missing value: ${arg}`);
      if(arg==='--output')options.output=path.resolve(value);
      if(arg==='--snapshot')options.snapshot=path.resolve(value);
      if(arg==='--require-lang')options.requireLang=value;
      if(arg==='--min-questions')options.minQuestions=Number(value);
      if(arg==='--min-coverage')options.minCoverage=Number(value);
    }else if(arg==='--require-parity')options.requireParity=true;
    else if(arg==='--skip-media')options.skipMedia=true;
    else if(arg==='--help'){
      console.log('node tools/audit-content.mjs [--snapshot <backup/catalog.json>] [--output <directory>] [--require-parity] [--min-coverage <0..100>] [--skip-media] [--require-lang <lang>] [--min-questions <n>]');return;
    }else throw Error(`Unknown argument: ${arg}`);
  }
  if((options.requireParity||options.skipMedia)&&!options.snapshot)throw Error('--require-parity/--skip-media requires --snapshot');
  const bundlePath=sources.bundlePath??path.join(root,'native-android/app/src/main/assets/catalog/v1.json');
  const bytes=await readFile(bundlePath),catalog=JSON.parse(bytes),docs=bundledDocuments(catalog);
  let sourceCommit=null,sourceDirty=null;
  try{
    sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
    sourceDirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8'}).trim());
  }catch{}
  const toolFiles=await Promise.all(['./audit-content.mjs','./content-audit-lib.mjs','../admin/workflow.js'].map(file=>readFile(new URL(file,import.meta.url))));
  const result={format:1,generatedAt:new Date().toISOString(),sourceCommit,sourceDirty,toolSHA256:sha(Buffer.concat(toolFiles)),bundleSHA256:sha(bytes),bundle:auditCatalog(catalog)};
  if(options.snapshot){
    const snapshotBytes=await readFile(options.snapshot),snapshot=JSON.parse(snapshotBytes);
    result.snapshotSHA256=sha(snapshotBytes);result.live=auditSnapshot(snapshot);
    result.comparison=compareDocuments(docs,publishedDocuments(snapshot),{snapshot,manifest:await json(sources.assetManifestPath??path.join(root,'native-android/backend/supabase/asset-upload-manifest.json'))});
    try{result.media=options.skipMedia?{status:'skipped'}:await verifySnapshotMedia(snapshot,options.snapshot);}
    catch(error){result.media={status:'failed',error:error.message};}
  }
  if(options.requireLang){
    if(!validSupportLanguage(options.requireLang))throw Error('Geçersiz destek dili');
    for(const report of [result.bundle,...(result.live?[result.live]:[])])
      report.translations[options.requireLang]??={missingSentences:report.summary.sentences,missingWords:report.summary.vocabularyEntries,missingDescriptions:report.summary.stories,complete:false};
  }
  result.acceptance=acceptance(result,options);
  if(result.media?.status==='failed'||(options.requireParity&&result.media?.status!=='verified')){
    result.acceptance.passed=false;result.acceptance.failures.push('media_integrity');
  }
  await mkdir(options.output,{recursive:true});
  await writeFile(path.join(options.output,'audit.json'),JSON.stringify(result,null,2)+'\n');
  await writeFile(path.join(options.output,'report.md'),renderReport(result));
  await writeFile(path.join(options.output,'revision-proposals.json'),JSON.stringify(result.comparison?revisionProposals(docs,result.comparison):
    {format:1,purpose:'No live comparison requested.',proposals:[]},null,2)+'\n');
  console.log(JSON.stringify({output:options.output,bundle:result.bundle.summary,live:result.live?.summary,
    equal:result.comparison?.equal,media:result.media,acceptance:result.acceptance},null,2));
  if(!result.acceptance.passed)process.exitCode=1;
  return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(`Content audit failed: ${error.message}`);process.exitCode=1;});
