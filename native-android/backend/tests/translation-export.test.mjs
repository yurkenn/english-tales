import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {exportCatalog,stableId} from '../tools/export-catalog.mjs';

const catalog=()=>({schemaVersion:1,stories:[{id:'sample',title:'Sample',author:'Author',level:'A1',genre:'Macera',description:"Türkçe açıklama 'örnek'",coverKey:'sample',sentences:[{id:'s1',english:'A quiet day.',turkish:'Sessiz bir gün.'}]}],words:[{id:'quiet',word:'quiet',translation:'sessiz',pronunciation:'/quiet/',example:'A quiet day.'}]});
const options={readCover:async()=>Buffer.from('local fixture')};

test('exporter emits executable legacy Turkish and optional language rows with stable IDs and repeatable seeds',async()=>{
  const db=new PGlite();await db.waitReady;
  try{
    await db.exec(await readFile(new URL('./platform-fixture.sql',import.meta.url),'utf8'));
    const directory=new URL('../supabase/migrations/',import.meta.url);
    for(const name of (await readdir(directory)).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
    const c=catalog();c.stories[0].descriptions={'es-419':"Descripción 'breve'"};c.stories[0].sentences[0].translations={'es-419':'Un día tranquilo.'};c.words[0].translations={'es-419':'tranquilo'};
    const exported=await exportCatalog(c,options);await db.exec(exported.seed);
    const id=stableId('sample:revision:1');
    assert.deepEqual((await db.query('select lang,text from public.sentence_translations where revision_id=$1 order by lang',[id])).rows,[{lang:'es-419',text:'Un día tranquilo.'},{lang:'tr',text:c.stories[0].sentences[0].turkish}]);
    assert.deepEqual((await db.query('select lang,translation from public.word_translations where revision_id=$1 order by lang',[id])).rows,[{lang:'es-419',translation:'tranquilo'},{lang:'tr',translation:'sessiz'}]);
    assert.deepEqual((await db.query('select lang,description from public.revision_texts where revision_id=$1 order by lang',[id])).rows,[{lang:'es-419',description:"Descripción 'breve'"},{lang:'tr',description:c.stories[0].description}]);
    assert.equal((await db.query('select published_at from public.story_revisions where id=$1',[id])).rows[0].published_at,null);
    await db.exec(exported.seed);assert.equal((await db.query('select count(*)::int n from public.sentence_translations')).rows[0].n,2);
    const changed=catalog();changed.stories[0].description='Must not overwrite';await db.exec((await exportCatalog(changed,options)).seed);
    assert.equal((await db.query("select description from public.revision_texts where lang='tr'")).rows[0].description,c.stories[0].description);
  }finally{await db.close();}
});

test('exporter synthesizes Turkish without maps and rejects conflicting Turkish, invalid languages and blank values',async()=>{
  const {seed}=await exportCatalog(catalog(),options);
  for(const table of ['sentence_translations','word_translations','revision_texts'])assert.match(seed,new RegExp(`insert into public.${table}`));
  for(const map of [{tr:'Conflicting'},{'en-us':'Text'},{'es-419\n':'Text'},{es:' '},{es:null},[],null]){
    const c=catalog();c.stories[0].sentences[0].translations=map;
    await assert.rejects(exportCatalog(c,options),/Invalid translation|Turkish translation differs/);
  }
});
