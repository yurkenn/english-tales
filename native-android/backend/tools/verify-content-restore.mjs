// Restore a real public-content backup into an isolated database, never production.
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
const directory=process.argv[2];if(!directory)throw Error('Provide the backup directory');
const backup=JSON.parse(await readFile(path.join(directory,'catalog.json'),'utf8'));
assert.equal(backup.format,1);assert.equal(backup.project,'gtuangjukckpuerczfxd');
assert.deepEqual(Object.keys(backup.tables).sort(),['content_assets','revision_words','sentence_words','stories','story_revisions','story_sentences'].sort());
const db=new PGlite();await db.waitReady;
try{
  await db.exec(await readFile(new URL('../tests/platform-fixture.sql',import.meta.url),'utf8'));
  const migrations=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(migrations)).sort())await db.exec(await readFile(new URL(name,migrations),'utf8'));
  await db.exec('begin');
  // Preserve the backed-up optimistic-lock counter during this isolated restore.
  // Integrity/immutability/media triggers and foreign keys remain enabled.
  await db.exec('alter table public.story_revisions disable trigger revision_version');
  for(const table of ['content_assets','stories','story_revisions','story_sentences','revision_words','sentence_words']){
    const columns=(await db.query('select column_name from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position',['public',table])).rows.map(r=>r.column_name);
    for(const original of backup.tables[table]){
      assert.ok(Object.keys(original).every(c=>columns.includes(c)));
      const row={...original};if(table==='stories')row.current_revision_id=null;if(table==='story_revisions')row.published_at=null;
      const keys=Object.keys(row);
      await db.query(`insert into public.${table}(${keys.map(k=>`"${k}"`).join(',')}) values(${keys.map((_,i)=>`$${i+1}`).join(',')})`,keys.map(k=>row[k]));
    }
  }
  // Storage fixture verifies schema relationships; physical bytes are checked separately below.
  for(const asset of backup.tables.content_assets)await db.query("insert into storage.objects(bucket_id,name,metadata) values('story-media',$1,$2)",[asset.storage_path,JSON.stringify({size:asset.byte_size,mimetype:asset.mime_type})]);
  for(const revision of backup.tables.story_revisions)await db.query('update public.story_revisions set published_at=$1 where id=$2',[revision.published_at,revision.id]);
  for(const story of backup.tables.stories)await db.query('update public.stories set current_revision_id=$1 where id=$2',[story.current_revision_id,story.id]);
  await db.exec('alter table public.story_revisions enable trigger revision_version');
  await db.exec('commit');
  for(const [table,expected] of Object.entries(backup.tables)){
    const actual=(await db.query(`select * from public.${table}`)).rows;
    const normalized=rows=>rows.map(row=>Object.fromEntries(Object.keys(row).sort().map(k=>[k,row[k] instanceof Date?row[k].toISOString():row[k]]))).map(row=>JSON.stringify(row)).sort();
    // PGlite represents timestamps in UTC; compare their instants rather than text formatting.
    const timestamps=rows=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v!==null&&/(_at)$/.test(k)?new Date(v).toISOString():v])));
    assert.deepEqual(normalized(timestamps(actual)),normalized(timestamps(expected)),`Restored ${table} differs`);
  }
  await db.exec('set role anon');
  assert.equal((await db.query('select count(*)::int as n from public.stories')).rows[0].n,backup.tables.stories.length);
  await db.exec('reset role');
  for(const asset of backup.tables.content_assets){assert.match(asset.id,/^[a-f0-9-]{36}$/);const bytes=await readFile(path.join(directory,'media',asset.id));assert.equal(bytes.length,Number(asset.byte_size));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
  console.log(JSON.stringify({restoredStories:backup.tables.stories.length,restoredSentences:backup.tables.story_sentences.length,verifiedMedia:backup.media.length,allSixTablesMatch:true,limitation:'Isolated PGlite schema/data restore and media checksum proof; not a hosted Storage/Auth/full database disaster recovery test'}));
}finally{await db.close();}
