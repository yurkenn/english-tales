import { createServer } from 'node:http';
import { readFile, readdir, mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.ADMIN_PORT||4178);
const demoName=process.env.ADMIN_DEMO_NAME||'admin-demo';
if(!/^[a-z0-9-]{1,80}$/.test(demoName))throw new Error('Invalid local demo name');
const demoPath=resolve(root,'test-output',demoName);
const user='11111111-1111-4111-8111-111111111111';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const url=(process.env.SUPABASE_URL||'').trim().replace(/\/$/,''),key=(process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
if(Boolean(url)!==Boolean(key)) throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be supplied together');
if(url && (new URL(url).protocol!=='https:' || !/^sb_publishable_/.test(key))) throw new Error('Use an HTTPS project URL and a publishable key; secret/legacy keys are not accepted');
let db;
const bundled=new Map();
if(!url) {
  await mkdir(demoPath,{recursive:true});
  db=new PGlite(resolve(demoPath,'database')); await db.waitReady;
  const existing=(await db.query("select to_regclass('auth.users') as name")).rows[0].name;
  if(!existing) await db.exec(await readFile(resolve(root,'tests/platform-fixture.sql'),'utf8'));
  await db.exec('create schema if not exists demo_meta; create table if not exists demo_meta.migrations(name text primary key)');
  for(const name of (await readdir(resolve(root,'supabase/migrations'))).sort()) {
    if(!(await db.query('select 1 from demo_meta.migrations where name=$1',[name])).rows.length) {
      const migration=await readFile(resolve(root,'supabase/migrations',name),'utf8');
      await db.transaction(async tx=>{
        await tx.exec(migration.replace(/^begin;\s*/i,'').replace(/commit;\s*$/i,''));
        await tx.query('insert into demo_meta.migrations values($1)',[name]);
      });
    }
  }
  await db.exec(await readFile(resolve(root,'supabase/seed.sql'),'utf8'));
  await db.exec(`insert into private.content_staff values('${user}','publisher') on conflict do nothing`);
  const manifest=JSON.parse(await readFile(resolve(root,'supabase/asset-upload-manifest.json'),'utf8'));
  for(const asset of manifest.assets) {
    const path=resolve(root,'..',asset.source),bytes=await readFile(path);
    if(bytes.length!==asset.byteSize || createHash('sha256').update(bytes).digest('hex')!==asset.sha256) throw new Error('Bundled cover integrity failed');
    bundled.set(asset.id,path);
    await db.query("insert into storage.objects(bucket_id,name) values('story-media',$1) on conflict do nothing",[asset.path]);
  }
  await mkdir(resolve(demoPath,'media'),{recursive:true});
}
const operations={
  content_role:[],admin_catalog:['p_offset','p_limit'],admin_revision:['p_revision_id'],
  admin_create_draft:['p_story_id','p_source_id'],admin_save_draft:['p_revision_id','p_expected_version','p_document'],
  admin_publish:['p_revision_id','p_expected_version'],set_story_archived:['p_story_id','p_archived'],
  admin_history:['p_story_id','p_before_id'],admin_delete_draft:['p_revision_id','p_expected_version'],
  admin_archive:['p_story_id','p_archived','p_expected_revision'],admin_unused_media:['p_before_id'],
  admin_reserve_media_delete:['p_asset_id'],admin_finalize_media_delete:['p_asset_id']
};
let queue=Promise.resolve();
function serialized(fn) { const next=queue.then(fn); queue=next.catch(()=>{}); return next; }
async function asStaff(fn) {
  await db.exec('begin; set local role authenticated');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
    const result=await fn(); await db.exec('commit; reset role'); return result;
  } catch(error) {await db.exec('rollback; reset role');throw error;}
}
async function body(req,max=2097152) {
  const chunks=[];let length=0;
  for await(const chunk of req) {length+=chunk.length;if(length>max) throw new Error('request_too_large');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
const hash=b=>createHash('sha256').update(b).digest('hex');
function detectType(bytes) {
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255) return 'image/jpeg';
  if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP') return 'image/webp';
  if(bytes.toString('ascii',0,4)==='OggS') return 'audio/ogg';
  if(bytes.toString('ascii',4,8)==='ftyp') return 'audio/mp4';
  if(bytes.toString('ascii',0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)) return 'audio/mpeg';
  throw new Error('unsupported_media');
}
const server=createServer(async(req,res)=>{
  const origins=[`http://127.0.0.1:${port}`,`http://localhost:${port}`];
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; media-src 'self' blob:; connect-src 'self' ${url?new URL(url).origin:''}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  try {
    if(!origins.some(o=>new URL(o).host===req.headers.host) || (req.headers.origin&&!origins.includes(req.headers.origin))) return send(403,{message:'origin_denied'});
    const path=new URL(req.url,origins[0]).pathname;
    if(path==='/api/config'&&req.method==='GET') return send(200,{mode:url?'cloud':'demo',url,key});
    if(path==='/api/rpc'&&req.method==='POST'&&db) {
      if(!req.headers['content-type']?.startsWith('application/json')) return send(415,{message:'json_required'});
      const {name,args={}}=JSON.parse((await body(req)).toString());
      if(!Object.hasOwn(operations,name)) return send(404,{message:'operation_not_found'});
      const keys=operations[name];
      const result=await serialized(()=>asStaff(async()=>{
        const placeholders=keys.map((_,i)=>`$${i+1}`).join(',');
        const values=keys.map(k=>args[k]??null);
        return (await db.query(`select public.${name}(${placeholders}) as result`,values)).rows[0].result;
      }));return send(200,result);
    }
    if(path==='/api/media/remove'&&req.method==='POST'&&db) {
      if(!origins.includes(req.headers.origin)||!req.headers['content-type']?.startsWith('application/json'))return send(403,{message:'origin_and_json_required'});
      const {id}=JSON.parse((await body(req)).toString());if(!uuid.test(id))return send(400,{message:'invalid_asset'});
      const result=await serialized(async()=>{
        const storagePath=await asStaff(async()=>(await db.query('select public.admin_reserve_media_delete($1) as path',[id])).rows[0].path);
        if(!bundled.has(id)){try{await unlink(resolve(demoPath,'media',id));}catch(error){if(error.code!=='ENOENT')throw error;}}
        return asStaff(async()=>{
          await db.query("delete from storage.objects where bucket_id='story-media' and name=$1",[storagePath]);
          return (await db.query('select public.admin_finalize_media_delete($1) as id',[id])).rows[0].id;
        });
      });return send(200,result);
    }
    if(path==='/api/media'&&req.method==='POST'&&db) {
      if(!origins.includes(req.headers.origin)) return send(403,{message:'origin_required'});
      const id=req.headers['x-asset-id'],kind=req.headers['x-kind'];
      if(!uuid.test(id)||!['cover','audio'].includes(kind)) return send(400,{message:'invalid_asset'});
      const bytes=await body(req,6291456),mime=detectType(bytes);
      if(!bytes.length||mime!==req.headers['content-type']||mime.startsWith('image/')!==(kind==='cover')) return send(400,{message:'media_type_mismatch'});
      const storagePath=`${kind}/${id}/${hash(bytes)}`;
      const file=resolve(demoPath,'media',id);
      await writeFile(file,bytes,{flag:'wx'});
      try {
        const asset=await serialized(()=>asStaff(async()=>{
          const result=await db.query('insert into public.content_assets(id,kind,storage_path,sha256,byte_size,mime_type) values($1,$2,$3,$4,$5,$6) returning *',[id,kind,storagePath,hash(bytes),bytes.length,mime]);
          await db.query("insert into storage.objects(bucket_id,name) values('story-media',$1)",[storagePath]);return result.rows[0];
        }));return send(200,asset);
      }catch(error){await unlink(file).catch(()=>{});throw error;}
    }
    if(path.startsWith('/media/')&&req.method==='GET'&&db) {
      const id=path.slice(7);if(!uuid.test(id)) return send(404,{message:'media_not_found'});
      const asset=await serialized(()=>asStaff(async()=>(await db.query('select * from public.content_assets where id=$1',[id])).rows[0]));
      if(!asset) return send(404,{message:'media_not_found'});
      const bytes=await readFile(bundled.get(id)||resolve(demoPath,'media',id));
      if(hash(bytes)!==asset.sha256||bytes.length!==Number(asset.byte_size)) throw new Error('media_integrity_failed');
      res.writeHead(200,{'Content-Type':asset.mime_type});return res.end(bytes);
    }
    const files={'/':'index.html','/app.js':'app.js','/api.js':'api.js','/workflow.js':'workflow.js','/styles.css':'styles.css','/favicon.svg':'favicon.svg'};
    if(req.method==='GET'&&Object.hasOwn(files,path)) {
      const type=path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.svg')?'image/svg+xml':'text/html';
      const bytes=await readFile(resolve(root,'admin',files[path]));res.writeHead(200,{'Content-Type':`${type}; charset=utf-8`});return res.end(bytes);
    }
    send(404,{message:'not_found'});
  }catch(error){send(400,{message:error.message,code:error.code});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Content admin: http://127.0.0.1:${port} (${url?'Supabase':'persistent local demo'})`));
async function stop(){server.close();await queue;await db?.close();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
