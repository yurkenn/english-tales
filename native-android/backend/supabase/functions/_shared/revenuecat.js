import {fetchJson,uuidPattern} from './http.js';

export const ENTITLEMENT='premium';
// Stores whose purchases may grant premium. Promotional grants come only from the RevenueCat dashboard.
const STORES=new Set(['play_store','promotional']);
const time=value=>{const t=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(t)?t:null;};

// Reads the subscriber with the secret API key and returns what the server should store:
// {expiresAt: ISO or null, checkedAt: ISO}. Nothing from the app or webhook body is trusted.
export function createRevenueCatClient({secretKey,allowSandbox=false,fetcher=fetch,now=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),attempts=3}) {
  if(!secretKey) throw new Error('Server configuration required');
  async function subscriber(userId) {
    for(let attempt=1;;attempt++) {
      const started=now();
      let result;
      try {
        result=await fetchJson(fetcher,'https://api.revenuecat.com/v1/subscribers/'+encodeURIComponent(userId),
          {headers:{Authorization:'Bearer '+secretKey,Accept:'application/json'},timeout:8000,limit:262144});
      } catch {result={ok:false,status:0};}
      if(result.ok) return {body:result.json,started};
      const retry=result.status===0||result.status===429||result.status>=500;
      if(!retry||attempt>=attempts) throw new Error('RevenueCat unavailable');
      await sleep(250*2**(attempt-1));
    }
  }
  return {
    async entitlement(userId) {
      if(!uuidPattern.test(userId)) throw new Error('Invalid user');
      const {body,started}=await subscriber(userId);
      const s=body?.subscriber;
      if(!s||typeof s!=='object') throw new Error('RevenueCat unavailable');
      // RevenueCat's own request time orders lookups; fall back to when this lookup started.
      const requested=Number(body.request_date_ms);
      const checked=Number.isSafeInteger(requested)&&Math.abs(requested-now())<300000?requested:started;
      const none={expiresAt:null,checkedAt:new Date(checked).toISOString()};
      // This account must be the customer itself (or its anonymous pre-login id), never an alias of another account.
      const original=s.original_app_user_id;
      if(typeof original!=='string'||(original.toLowerCase()!==userId.toLowerCase()&&!original.startsWith('$RCAnonymousID:'))) return none;
      const entitlement=s.entitlements?.[ENTITLEMENT];
      const product=entitlement?.product_identifier;
      if(typeof product!=='string') return none;
      const subscription=s.subscriptions?.[product]??s.subscriptions?.[product.split(':')[0]];
      if(!subscription||!STORES.has(subscription.store)) return none;
      if(subscription.is_sandbox===true&&!allowSandbox) return none;
      if(subscription.refunded_at) return none;
      // Lifetime (null expiry) is not sold; treat it as no grant rather than forever.
      const expires=time(entitlement.expires_date);
      if(expires===null) return none;
      const grace=time(entitlement.grace_period_expires_date);
      return {expiresAt:new Date(Math.max(expires,grace??0)).toISOString(),checkedAt:none.checkedAt};
    },
  };
}
