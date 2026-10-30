import {fetchJson,reply,supabaseClient,uuidPattern} from '../_shared/http.js';

// Google's published verifier keys. Fixed here, not configurable, so a setting cannot swap the trust root.
export const VERIFIER_KEYS_URL='https://www.gstatic.com/admob/reward/verifier-keys.json';

const base64url=text=>{
  if(!/^[A-Za-z0-9_-]{1,200}={0,2}$/.test(text||'')) throw new Error('Invalid base64');
  const plain=text.replace(/=+$/,'').replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(plain+'='.repeat((4-plain.length%4)%4)),c=>c.charCodeAt(0));
};

// Google signs with DER-encoded ECDSA; WebCrypto expects the 64-byte r||s form.
export function derToP1363(der) {
  if(der.length===64) return der;
  let i=0;
  const take=()=>{if(i>=der.length) throw new Error('Invalid signature');return der[i++];};
  const length=()=>{const first=take();if(first<0x80) return first;if(first!==0x81) throw new Error('Invalid signature');return take();};
  if(take()!==0x30) throw new Error('Invalid signature');
  if(length()!==der.length-i) throw new Error('Invalid signature');
  const integer=()=>{
    if(take()!==0x02) throw new Error('Invalid signature');
    const n=length();if(n<1||n>33||i+n>der.length) throw new Error('Invalid signature');
    let bytes=der.slice(i,i+n);i+=n;
    while(bytes.length>32&&bytes[0]===0) bytes=bytes.slice(1);
    if(bytes.length>32) throw new Error('Invalid signature');
    const out=new Uint8Array(32);out.set(bytes,32-bytes.length);return out;
  };
  const r=integer(),s=integer();
  if(i!==der.length) throw new Error('Invalid signature');
  const out=new Uint8Array(64);out.set(r);out.set(s,32);return out;
}

// Splits the raw query exactly as Google signed it: everything before "&signature=" is the message,
// and signature and key_id must be the final two parameters. Repeated parameters are rejected.
export function parseCallback(rawUrl) {
  const q=rawUrl.indexOf('?');
  if(q<0) return null;
  const raw=rawUrl.slice(q+1).split('#')[0];
  if(raw.length>4096) return null;
  const at=raw.indexOf('&signature=');
  if(at<1) return null;
  const message=raw.slice(0,at);
  const tail=raw.slice(at+1).split('&');
  if(tail.length!==2||!tail[0].startsWith('signature=')||!tail[1].startsWith('key_id=')) return null;
  const params=new Map();
  for(const part of raw.split('&')) {
    const eq=part.indexOf('=');
    if(eq<1) return null;
    let name,value;
    try {name=decodeURIComponent(part.slice(0,eq));value=decodeURIComponent(part.slice(eq+1).replace(/\+/g,' '));} catch {return null;}
    if(params.has(name)) return null;
    params.set(name,value);
  }
  return {message,params};
}

export function createAdmobSsvHandler({url,key,adUnits,rewardItem='energy',rewardAmount='1',fetcher=fetch,now=()=>Date.now(),keyTtl=6*3600000}) {
  const db=supabaseClient({url,key,fetcher});
  // Google reports the numeric ad unit; accept configured full IDs ("ca-app-pub-x/123") too.
  const units=new Set(String(adUnits||'').split(',').map(v=>v.trim().split('/').pop()).filter(Boolean));
  if(!units.size) throw new Error('Server configuration required');
  let cache={keys:new Map(),at:-Infinity},lastRefresh=-Infinity;
  async function verifierKey(id) {
    const stale=now()-cache.at>keyTtl;
    // Refresh when stale, or for an unknown key id at most once a minute.
    if(stale||(!cache.keys.has(id)&&now()-lastRefresh>60000)) {
      lastRefresh=now();
      try {
        const result=await fetchJson(fetcher,VERIFIER_KEYS_URL,{timeout:5000,limit:65536});
        if(!result.ok||!Array.isArray(result.json?.keys)) throw new Error('Keys unavailable');
        const keys=new Map();
        for(const entry of result.json.keys.slice(0,20)) {
          if(!Number.isSafeInteger(entry?.keyId)||typeof entry.base64!=='string') continue;
          const spki=Uint8Array.from(atob(entry.base64),c=>c.charCodeAt(0));
          keys.set(String(entry.keyId),await crypto.subtle.importKey('spki',spki,{name:'ECDSA',namedCurve:'P-256'},false,['verify']));
        }
        if(!keys.size) throw new Error('Keys unavailable');
        cache={keys,at:now()};
      } catch(error) {if(stale&&!cache.keys.size) throw error;}
    }
    return cache.keys.get(id);
  }
  return async req=>{
    if(req.method!=='GET') return reply(405,'method_not_allowed');
    const callback=parseCallback(req.url);
    if(!callback) return reply(400,'invalid_callback');
    const p=callback.params;
    const keyId=p.get('key_id');
    if(!/^\d{1,20}$/.test(keyId)) return reply(400,'invalid_callback');
    let verified=false;
    try {
      const publicKey=await verifierKey(keyId);
      if(publicKey) verified=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,
        derToP1363(base64url(p.get('signature'))),new TextEncoder().encode(callback.message));
      else return reply(400,'invalid_signature');
    } catch(error) {
      if(error?.message==='Invalid signature'||error?.message==='Invalid base64') return reply(400,'invalid_signature');
      return reply(503,'verification_unavailable');
    }
    if(!verified) return reply(400,'invalid_signature');
    // The signature proves Google sent these values; the values themselves still need checking.
    const timestamp=p.get('timestamp');
    const age=now()-Number(timestamp);
    if(!/^\d{1,16}$/.test(timestamp)||age>3600000||age<-300000) return reply(400,'stale_callback');
    // AdMob's dashboard verifier sends a sample unit, not the configured live unit.
    // Acknowledge a fresh, genuinely signed foreign-unit delivery without touching
    // the database. It must never grant a reward or expand the production allowlist.
    if(!units.has(p.get('ad_unit'))) return reply(200,'reward_rejected');
    if(p.get('reward_item')!==rewardItem||p.get('reward_amount')!==rewardAmount)
      return reply(400,'invalid_reward');
    const nonce=p.get('custom_data'),userId=p.get('user_id'),transaction=p.get('transaction_id');
    if(!uuidPattern.test(nonce||'')||!uuidPattern.test(userId||'')||!/^[\x21-\x7e]{1,200}$/.test(transaction||''))
      return reply(400,'invalid_reward');
    try {
      const result=await db.rpcAsServer('credit_ad_reward',{p_nonce:nonce.toLowerCase(),p_transaction_id:transaction,p_user_id:userId.toLowerCase()});
      if(!result.ok||typeof result.json?.credited!=='boolean') return reply(503,'reward_unavailable');
      // Valid but refused callbacks are acknowledged so Google does not retry them.
      if(result.json.credited) return reply(200,'reward_credited');
      if(result.json.duplicate) return reply(200,'reward_acknowledged');
      return reply(200,'reward_rejected');
    } catch {return reply(503,'reward_unavailable');}
  };
}
