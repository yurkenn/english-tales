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
      // Revoke refresh sessions before deleting the account; all learning rows cascade.
      const revoke=await request('/auth/v1/logout?scope=global','POST',auth);
      if(!revoke.ok) return reply(503,'deletion_unavailable');
      const deleted=await request('/auth/v1/admin/users/'+user.id,'DELETE','Bearer '+key);
      if(!deleted.ok) return reply(503,'deletion_unavailable');
      return reply(200,'account_deleted',{userId:user.id});
    } catch {return reply(503,'deletion_unavailable');}
  };
}
