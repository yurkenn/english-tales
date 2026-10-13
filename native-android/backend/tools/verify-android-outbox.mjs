// Local contract check only. Test Auth/Storage fixtures; never connects to a cloud project.
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';

const file=process.argv[2];
if(!file) throw new Error('Pass an exported Android outbox JSON array.');
const events=JSON.parse(await readFile(file,'utf8'));
const allowed=new Set(['apply_word_event','apply_progress_event','submit_learning_session']);
assert.ok(Array.isArray(events));
const db=new PGlite();
try {
  await db.waitReady;
  await db.exec(await readFile(new URL('../tests/platform-fixture.sql',import.meta.url),'utf8'));
  const directory=new URL('../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(directory)).sort()) await db.exec(await readFile(new URL(name,directory),'utf8'));
  await db.exec(await readFile(new URL('../supabase/seed.sql',import.meta.url),'utf8'));
  await db.exec("insert into private.content_staff values('11111111-1111-4111-8111-111111111111','publisher'); insert into storage.objects(bucket_id,name) select 'story-media',storage_path from public.content_assets; begin; set local role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);");
  for(const row of (await db.query('select id from public.story_revisions')).rows) await db.query('select public.publish_story_revision($1)',[row.id]);
  await db.exec("commit; begin; set local role authenticated; select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);");
  const pending=events.filter(e=>e.state==='pending');
  for(const event of pending) {
    assert.ok(allowed.has(event.rpc));
    assert.equal(JSON.parse(event.payload).id,event.id);
    const result=(await db.query(`select public.${event.rpc}($1::jsonb) as value`,[event.payload])).rows[0].value;
    assert.equal(result.applied,true);
  }
  for(const event of pending) {
    const result=(await db.query(`select public.${event.rpc}($1::jsonb) as value`,[event.payload])).rows[0].value;
    assert.equal(result.applied,false);
  }
  const summary=(await db.query('select public.get_learning_summary() as value')).rows[0].value;
  await db.exec('commit');
  console.log(JSON.stringify({accepted:pending.length,duplicateReplays:pending.length,heldLocally:events.length-pending.length,summary},null,2));
} finally {await db.close();}
