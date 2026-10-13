// Server-only environment. No client receives the privileged key or Auth responses.
export function createDeletionHandler({url,key,fetcher=fetch}) {
  if(!url?.startsWith('https://') || !key) throw new Error('Server configuration required');
  const base=url.replace(/\/$/,'');
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return async req=>{
    const origin=req.headers.get('Origin');
    const allowedOrigin='https://englishtales-app.web.app';
    const headers={'Content-Type':'application/json','Cache-Control':'no-store',Vary:'Origin'};
    if(origin===allowedOrigin) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'});
    const reply=(status,code,extra={})=>new Response(JSON.stringify({code,...extra}),{status,headers});
    if(origin && origin!==allowedOrigin) return reply(403,'origin_denied');
    if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
    if(req.method!=='POST') return reply(405,'method_not_allowed');
    const auth=req.headers.get('Authorization');
    if(!auth?.match(/^Bearer [A-Za-z0-9_.-]+$/)) return reply(401,'sign_in_required');
    if(!req.headers.get('Content-Type')?.startsWith('application/json')) return reply(415,'invalid_request');
    try {
      const reader=req.body?.getReader();let bytes=0;const chunks=[];
      if(!reader) return reply(400,'confirmation_required');
      try {while(true) {const {done,value}=await reader.read();if(done) break;bytes+=value.length;if(bytes>128) {await reader.cancel();return reply(413,'invalid_request');}chunks.push(value);}} finally {reader.releaseLock();}
      const content=new Uint8Array(bytes);let offset=0;for(const chunk of chunks) {content.set(chunk,offset);offset+=chunk.length;}
      const body=JSON.parse(new TextDecoder().decode(content));
      if(body?.confirm!==true || Object.keys(body).length!==1) return reply(400,'confirmation_required');
      const request=(path,method,authorization,payload)=>fetcher(base+path,{method,headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(15000)});
      const who=await request('/auth/v1/user','GET',auth);
      if(!who.ok) return reply(who.status===401 || who.status===403?401:503,'sign_in_required');
      const user=await who.json();
      if(!uuid.test(user.id) || user.is_anonymous===true) return reply(401,'sign_in_required');
      const gate=await request('/rest/v1/rpc/authorize_account_deletion','POST',auth,{});
      if(!gate.ok) return reply(503,'deletion_unavailable');
      if(await gate.json()!==true) return reply(403,'reauthentication_required');
      // Editorial media is shared catalog content, not reader account data.
      // Re-upload identical verified bytes as the server through the supported
      // Storage API so a publisher's Auth account can be deleted independently.
      const inventory=async()=>{
        const response=await request('/rest/v1/rpc/account_owned_media_inventory','POST','Bearer '+key,{p_user_id:user.id});
        if(!response.ok)throw new Error('Media inventory unavailable');
        return await response.json();
      };
      const media=await inventory();
      if(!Array.isArray(media)||media.length>1000) return reply(503,'deletion_unavailable');
      if(media.some(a=>a.bucket!=='story-media'||!uuid.test(a.assetId)||
        !/^[a-f0-9]{64}$/.test(a.sha256)||!Number.isSafeInteger(a.byteSize)||a.byteSize<1||a.byteSize>20971520||
        typeof a.path!=='string'||a.path.startsWith('/')||a.path.includes('..')||a.path.includes('\\')||
        !['image/png','image/jpeg','image/webp','audio/mpeg','audio/mp4','audio/ogg'].includes(a.mimeType)))
        return reply(503,'deletion_unavailable');
      const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
      const readMedia=async(a,path)=>{
        const response=await fetcher(base+path,{method:'GET',headers:{apikey:key,Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(15000)});
        if(!response.ok||Number(response.headers.get('Content-Length')||0)>a.byteSize)throw new Error('Media read failed');
        const reader=response.body.getReader(),chunks=[];let size=0;
        try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>a.byteSize){await reader.cancel();throw new Error('Media size mismatch');}chunks.push(value);}}finally{reader.releaseLock();}
        const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
        if(size!==a.byteSize||await hash(bytes)!==a.sha256)throw new Error('Media checksum mismatch');
        return bytes;
      };
      for(const asset of media){
        const path='/storage/v1/object/story-media/'+asset.path.split('/').map(encodeURIComponent).join('/');
        const bytes=await readMedia(asset,path);
        const update=await fetcher(base+path,{method:'PUT',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':asset.mimeType,'x-upsert':'true'},body:bytes,redirect:'error',signal:AbortSignal.timeout(15000)});
        if(!update.ok)throw new Error('Media ownership transfer failed');
        await readMedia(asset,path);
      }
      if(media.length&&(await inventory()).length!==0) return reply(503,'deletion_unavailable');
      // Revoke refresh sessions before deleting the account; all learning rows cascade.
      const revoke=await request('/auth/v1/logout?scope=global','POST',auth);
      if(!revoke.ok) return reply(503,'deletion_unavailable');
      const deleted=await request('/auth/v1/admin/users/'+user.id,'DELETE','Bearer '+key);
      if(!deleted.ok) return reply(503,'deletion_unavailable');
      return reply(200,'account_deleted',{userId:user.id});
    } catch {return reply(503,'deletion_unavailable');}
  };
}
