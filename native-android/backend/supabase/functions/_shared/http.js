// Shared by the monetization functions. Runs on Deno and Node: only Web APIs are used.
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Responses carry a short code only, never upstream bodies, tokens or URLs.
export function reply(status,code,extra={}) {
  return new Response(JSON.stringify({code,...extra}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}

// Reads at most `limit` bytes from a request or response body; larger bodies throw.
export async function readLimited(source,limit) {
  const length=Number(source.headers.get('Content-Length')||0);
  if(length>limit) {await source.body?.cancel();throw new Error('Body too large');}
  const reader=source.body?.getReader();
  if(!reader) return new Uint8Array(0);
  const chunks=[];let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read();
      if(done) break;
      size+=value.length;
      if(size>limit) {await reader.cancel();throw new Error('Body too large');}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
  return bytes;
}

export async function readJson(source,limit) {
  const bytes=await readLimited(source,limit);
  return bytes.length?JSON.parse(new TextDecoder().decode(bytes)):undefined;
}

// Every outbound call has a timeout, no redirects and a bounded response body.
export async function fetchJson(fetcher,url,{method='GET',headers={},body,timeout=8000,limit=262144}={}) {
  const response=await fetcher(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(timeout)});
  if(!response.ok) {await response.body?.cancel();return {ok:false,status:response.status};}
  return {ok:true,status:response.status,json:await readJson(response,limit)};
}

export function safeEqual(a,b) {
  const x=new TextEncoder().encode(String(a)),y=new TextEncoder().encode(String(b));
  let diff=x.length^y.length;
  for(let i=0;i<x.length;i++) diff|=x[i]^(y[i]??0);
  return diff===0&&x.length>0;
}

// Supabase REST helpers. The service key never leaves the server.
export function supabaseClient({url,key,fetcher}) {
  if(!url?.startsWith('https://')||!key) throw new Error('Server configuration required');
  const base=url.replace(/\/$/,'');
  const call=(path,method,authorization,body)=>fetchJson(fetcher,base+path,{method,body,timeout:10000,limit:65536,
    headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'}});
  return {
    // Verifies a user bearer with Auth; returns the live, non-anonymous user id or null.
    async userId(authorization) {
      const who=await call('/auth/v1/user','GET',authorization);
      if(!who.ok) {if(who.status===401||who.status===403) return null;throw new Error('Auth unavailable');}
      const id=who.json?.id;
      return typeof id==='string'&&uuidPattern.test(id)&&who.json.is_anonymous!==true?id.toLowerCase():null;
    },
    rpcAsUser:(name,authorization,body={})=>call('/rest/v1/rpc/'+name,'POST',authorization,body),
    rpcAsServer:(name,body)=>call('/rest/v1/rpc/'+name,'POST','Bearer '+key,body),
  };
}
