import {readLimited,reply,supabaseClient} from '../_shared/http.js';

// After a purchase or restore the app asks the server to look the signed-in account up in RevenueCat.
// The app's own premium claim is never read; the answer is the server's energy state for this account.
export function createPremiumSyncHandler({url,key,revenueCat,fetcher=fetch}) {
  const db=supabaseClient({url,key,fetcher});
  return async req=>{
    // Native app only: browsers are refused before any work.
    if(req.headers.get('Origin')) return reply(403,'origin_denied');
    if(req.method!=='POST') return reply(405,'method_not_allowed');
    const auth=req.headers.get('Authorization');
    if(!auth?.match(/^Bearer [A-Za-z0-9_.-]{1,4096}$/)) return reply(401,'sign_in_required');
    try {await readLimited(req,64);} catch {return reply(413,'invalid_request');}
    try {
      const userId=await db.userId(auth);
      if(!userId) return reply(401,'sign_in_required');
      let entitlement;
      try {entitlement=await revenueCat.entitlement(userId);} catch {return reply(503,'premium_unavailable');}
      const stored=await db.rpcAsServer('set_premium_entitlement',{p_user_id:userId,p_expires_at:entitlement.expiresAt,p_checked_at:entitlement.checkedAt});
      if(!stored.ok) return reply(503,'premium_unavailable');
      const state=await db.rpcAsUser('get_energy_state',auth);
      if(!state.ok||typeof state.json!=='object'||state.json===null) return reply(503,'premium_unavailable');
      return new Response(JSON.stringify(state.json),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
    } catch {return reply(503,'premium_unavailable');}
  };
}
