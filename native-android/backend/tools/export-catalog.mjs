import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { matchWords, validSupportLanguage } from '../admin/workflow.js';

const quote = value => `'${String(value).replaceAll("'", "''")}'`;
export const stableId = value => {
  const hash = createHash('sha256').update(`english-tales:${value}`).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
};
export async function exportCatalog(catalog, {readCover = key => readFile(new URL(`../content/covers/${key}.png`, import.meta.url))} = {}) {
  if (catalog.schemaVersion !== 1) throw new Error('Unsupported bundled schema');
  if (new Set(catalog.stories.map(s => s.id)).size !== catalog.stories.length || new Set(catalog.words.map(w => w.id)).size !== catalog.words.length) throw new Error('Duplicate catalog IDs');
  const lines = ['-- Generated from the native catalog. Drafts only; never changes an existing revision.', 'begin;'];
  const assets = [];
  for (const story of catalog.stories) {
    const revisionId = stableId(`${story.id}:revision:1`);
    const bytes = await readCover(story.coverKey);
    const sha = createHash('sha256').update(bytes).digest('hex');
    const assetId = stableId(`cover:${sha}`);
    const path = `covers/${sha}.png`;
    assets.push({ id: assetId, bucket: 'story-media', path, sha256: sha, byteSize: bytes.length, source: `backend/content/covers/${story.coverKey}.png` });
    lines.push(`insert into public.content_assets(id,kind,storage_path,sha256,byte_size,mime_type) values(${quote(assetId)},'cover',${quote(path)},${quote(sha)},${bytes.length},'image/png') on conflict do nothing;`);
    lines.push(`insert into public.stories(id) values(${quote(story.id)}) on conflict do nothing;`);
    lines.push(`do $seed$ begin if not exists(select 1 from public.story_revisions where id=${quote(revisionId)}) then`);
    lines.push(`insert into public.story_revisions(id,story_id,revision,title,author,level,genre,description,cover_asset_id) values(${[revisionId,story.id].map(quote).join(',')},1,${[story.title,story.author,story.level,story.genre,story.description,assetId].map(quote).join(',')});`);
    for (const [lang, description] of translationEntries(story.descriptions, story.description, story.id))
      lines.push(`insert into public.revision_texts(revision_id,lang,description) values(${[revisionId,lang,description].map(quote).join(',')}) on conflict(revision_id,lang) do update set description=excluded.description;`);
    const selected = new Map();
    const links = [];
    if (!story.sentences.length || new Set(story.sentences.map(s => s.id)).size !== story.sentences.length) throw new Error(`Invalid sentences in ${story.id}`);
    for (const [index, sentence] of story.sentences.entries()) {
      if (!sentence.english.trim() || !sentence.turkish.trim()) throw new Error(`Missing translation ${sentence.id}`);
      lines.push(`insert into public.story_sentences(revision_id,id,position,english,turkish) values(${quote(revisionId)},${quote(sentence.id)},${index+1},${quote(sentence.english)},${quote(sentence.turkish)});`);
      for (const [lang, text] of translationEntries(sentence.translations, sentence.turkish, sentence.id))
        lines.push(`insert into public.sentence_translations(revision_id,sentence_id,lang,text) values(${[revisionId,sentence.id,lang,text].map(quote).join(',')}) on conflict(revision_id,sentence_id,lang) do update set text=excluded.text;`);
      const sentenceWordIds = new Set();
      for (const word of matchWords(sentence.english, catalog.words)) { selected.set(word.id, word); sentenceWordIds.add(word.id); }
      for (const wordId of sentenceWordIds) links.push([revisionId, sentence.id, wordId]);
    }
    for (const word of selected.values()) {
      lines.push(`insert into public.revision_words(revision_id,id,word,translation,pronunciation,example) values(${[revisionId,word.id,word.word,word.translation,word.pronunciation,word.example].map(quote).join(',')});`);
      for (const [lang, translation] of translationEntries(word.translations, word.translation, word.id))
        lines.push(`insert into public.word_translations(revision_id,word_id,lang,translation) values(${[revisionId,word.id,lang,translation].map(quote).join(',')}) on conflict(revision_id,word_id,lang) do update set translation=excluded.translation;`);
    }
    for (const link of links) lines.push(`insert into public.sentence_words(revision_id,sentence_id,word_id) values(${link.map(quote).join(',')});`);
    lines.push('end if; end $seed$;');
  }
  lines.push('commit;', '');
  return {seed: lines.join('\n'), manifest: {schemaVersion: 1, assets}};
}

export function translationEntries(map, legacy, id) {
  if (map !== undefined && (!map || typeof map !== 'object' || Array.isArray(map))) throw new Error(`Invalid translation map: ${id}`);
  const entries = { ...map, tr: legacy };
  if (map?.tr !== undefined && map.tr !== legacy) throw new Error(`Turkish translation differs from legacy: ${id}`);
  for (const [lang, value] of Object.entries(entries)) {
    if (!validSupportLanguage(lang) || typeof value !== 'string' || !value.trim())
      throw new Error(`Invalid translation: ${id}/${lang}`);
  }
  return Object.entries(entries);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(await readFile(new URL('../../app/src/main/assets/catalog/v1.json', import.meta.url), 'utf8'));
  const {seed, manifest} = await exportCatalog(catalog);
  await writeFile(new URL('../supabase/seed.sql', import.meta.url), seed);
  await writeFile(new URL('../supabase/asset-upload-manifest.json', import.meta.url), JSON.stringify(manifest, null, 2)+'\n');
  console.log(`${catalog.stories.length} taslak hikâye, ${catalog.stories.reduce((n,s)=>n+s.sentences.length,0)} cümle ve ${manifest.assets.length} kapak özeti aktarıldı. Yayın yapılmadı.`);
}
