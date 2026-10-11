// Sessions stay in memory. Draft recovery is separate from credentials.
export function createClient({fetch:transport=globalThis.fetch,now=Date.now}={}) {
  let config,session=null,refreshing=null,generation=0;
  const blobs=new Map();
  const expired=()=>Object.assign(new Error('Oturum sona erdi. Tekrar giriş yapın; taslak yedeğiniz korunuyor.'),{code:'session_expired'});
  async function request(url,options={}) {
    const response=await transport(url,{signal:AbortSignal.timeout(30000),...options});
    if(!response.ok){let error;try{error=await response.json();}catch{error={message:`İstek başarısız (${response.status})`};}
      if(response.status===401&&session){session=null;generation++;throw expired();}
      throw Object.assign(new Error(error.message||error.msg||error.error_description||error.error||'İşlem tamamlanamadı'),{status:response.status});}
    const text=await response.text();return text.trim()?JSON.parse(text):null;
  }
  const clearBlobs=()=>{for(const value of blobs.values())URL.revokeObjectURL(value);blobs.clear();};
  function retainMedia(assets){const keys=new Set(assets.filter(Boolean).map(a=>`${a.id}:${a.sha256}`));for(const [key,url] of blobs)if(!keys.has(key)){URL.revokeObjectURL(url);blobs.delete(key);}}
  async function init(){config=await request('/api/config');return config;}
  const identity=()=>config?.mode==='demo'?'local-demo':session?.user?.id;
  async function login(email,password){const current=++generation;const next=await request(`${config.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});if(current!==generation)throw expired();session={...next,expires_at:now()+next.expires_in*1000};}
  async function logout(){const previous=session;session=null;generation++;clearBlobs();if(previous)await request(`${config.url}/auth/v1/logout`,{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${previous.access_token}`}});}
  async function headers(){
    if(config.mode==='demo')return {'Content-Type':'application/json'};
    if(!session)throw expired();
    if(session.expires_at<now()+60000){
      if(!refreshing){const current=generation,token=session.refresh_token;
        refreshing=request(`${config.url}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:token})}).then(next=>{if(current!==generation)throw expired();session={...next,expires_at:now()+next.expires_in*1000};}).catch(error=>{if(error.status===400||error.status===401){session=null;generation++;throw expired();}throw error;}).finally(()=>{refreshing=null;});}
      await refreshing;
    }
    if(!session)throw expired();
    return {apikey:config.key,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'};
  }
  async function rpc(name,args={}){return config.mode==='demo'?request('/api/rpc',{method:'POST',headers:await headers(),body:JSON.stringify({name,args})}):request(`${config.url}/rest/v1/rpc/${name}`,{method:'POST',headers:await headers(),body:JSON.stringify(args)});}
  async function media(asset){
    if(!asset)return '';
    if(config.mode==='demo')return `/media/${asset.id}`;
    const cacheKey=`${asset.id}:${asset.sha256}`;if(blobs.has(cacheKey))return blobs.get(cacheKey);
    const h=await headers();delete h['Content-Type'];
    const response=await transport(`${config.url}/storage/v1/object/authenticated/story-media/${asset.storage_path}`,{headers:h,signal:AbortSignal.timeout(60000)});
    if(response.status===401){session=null;generation++;throw expired();}
    if(!response.ok)throw new Error('Medya indirilemedi. Dosyanın yüklenmesini ve erişim yetkisini kontrol edin.');
    const blob=await response.blob();if(blob.size!==Number(asset.byte_size)||await digest(blob)!==asset.sha256)throw new Error('Medya doğrulaması başarısız.');
    const result=URL.createObjectURL(blob);blobs.set(cacheKey,result);return result;
  }
  async function removeMedia(id){
    if(config.mode==='demo')return request('/api/media/remove',{method:'POST',headers:await headers(),body:JSON.stringify({id})});
    const path=await rpc('admin_reserve_media_delete',{p_asset_id:id});
    await request(`${config.url}/storage/v1/object/story-media`,{method:'DELETE',headers:await headers(),body:JSON.stringify({prefixes:[path]})});
    await rpc('admin_finalize_media_delete',{p_asset_id:id});
    for(const [key,url] of blobs)if(key.startsWith(`${id}:`)){URL.revokeObjectURL(url);blobs.delete(key);}
  }
  async function upload(file,kind){
    const allowed=kind==='cover'?['image/png','image/jpeg','image/webp']:kind==='audio'?['audio/mpeg','audio/mp4','audio/ogg']:[];
    if(!allowed.includes(file.type)||file.size===0||file.size>6291456)throw new Error('PNG, JPEG, WebP kapak veya MP3, M4A, OGG ses seçin. En fazla 6 MB.');
    if(kind==='cover'){const bitmap=await createImageBitmap(file);bitmap.close();}
    const id=crypto.randomUUID();if(config.mode==='demo')return request('/api/media',{method:'POST',headers:{'Content-Type':file.type,'X-Asset-Id':id,'X-Kind':kind},body:file});
    const sha256=await digest(file),asset={id,kind,storage_path:`${kind}/${id}/${sha256}`,sha256,byte_size:file.size,mime_type:file.type};
    await request(`${config.url}/rest/v1/content_assets`,{method:'POST',headers:{...await headers(),Prefer:'return=minimal'},body:JSON.stringify(asset)});
    try{
      await request(`${config.url}/storage/v1/object/story-media/${asset.storage_path}`,{method:'POST',headers:{...await headers(),'Content-Type':file.type,'x-upsert':'false'},body:file,signal:AbortSignal.timeout(60000)});
      await media(asset);return asset;
    }catch(error){try{await removeMedia(id);}catch{error.message+=' Kullanılmayan dosyalar bölümünden yarım kalan yüklemeyi temizleyebilirsiniz.';}throw error;}
  }
  return {init,identity,login,logout,rpc,media,upload,removeMedia,retainMedia};
}
async function digest(file){const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const client=createClient();
export const {init,identity,login,logout,rpc,media,upload,removeMedia,retainMedia}=client;
