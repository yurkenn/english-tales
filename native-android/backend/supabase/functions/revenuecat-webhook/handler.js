import {readJson,reply,safeEqual,supabaseClient,uuidPattern} from '../_shared/http.js';

// A webhook is only a hint that something changed. The handler never trusts its expiry, product
// or aliases: it re-reads each affected account from RevenueCat and stores that answer.
export function createRevenueCatWebhookHandler({url,key,authorization,appId,allowSandbox=false,revenueCat,fetcher=fetch,now=()=>Date.now()}) {
  if(!authorization||!appId) throw new Error('Server configuration required');
  const db=supabaseClient({url,key,fetcher});
  const store=async(userId,entitlement)=>{
    const result=await db.rpcAsServer('set_premium_entitlement',{p_user_id:userId,p_expires_at:entitlement.expiresAt,p_checked_at:entitlement.checkedAt});
    if(!result.ok) throw new Error('Store failed');
  };
  return async req=>{
    if(req.method!=='POST') return reply(405,'method_not_allowed');
    if(!safeEqual(req.headers.get('Authorization')??'',authorization)) return reply(401,'unauthorized');
    let event;
    try {event=(await readJson(req,65536))?.event;} catch {return reply(400,'invalid_event');}
    if(!event||typeof event!=='object'||typeof event.type!=='string') return reply(400,'invalid_event');
    // Acknowledged without effect so RevenueCat stops retrying.
    if(event.type==='TEST'||event.app_id!==appId) return reply(200,'ignored');
    if(event.environment!=='PRODUCTION'&&!(event.environment==='SANDBOX'&&allowSandbox)) return reply(200,'ignored');
    const ids=list=>Array.isArray(list)?list.filter(id=>typeof id==='string'&&uuidPattern.test(id)).map(id=>id.toLowerCase()):[];
    const from=event.type==='TRANSFER'?ids(event.transferred_from):[];
    const to=event.type==='TRANSFER'?ids(event.transferred_to):ids([event.app_user_id]);
    const accounts=[...new Set([...from,...to])];
    if(accounts.length>6) return reply(400,'invalid_event');
    if(!accounts.length) return reply(200,'ignored');
    let failed=false;
    for(const userId of accounts) {
      try {
        await store(userId,await revenueCat.entitlement(userId));
      } catch {
        failed=true;
        // A transfer source that cannot be re-read loses premium now; a later lookup restores it if still owed.
        if(from.includes(userId)) {
          try {await store(userId,{expiresAt:null,checkedAt:new Date(now()).toISOString()});} catch {}
        }
      }
    }
    // A failure is reported so RevenueCat retries the whole event; repeating it is harmless.
    return failed?reply(503,'sync_unavailable'):reply(200,'synced');
  };
}
