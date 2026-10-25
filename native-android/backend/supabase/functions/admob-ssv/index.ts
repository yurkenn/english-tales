import {createAdmobSsvHandler} from './handler.js';

Deno.serve(createAdmobSsvHandler({
  url:Deno.env.get('SUPABASE_URL'),
  key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  adUnits:Deno.env.get('ADMOB_REWARDED_AD_UNIT_IDS'),
  rewardItem:Deno.env.get('ADMOB_REWARD_ITEM')||'energy',
  rewardAmount:Deno.env.get('ADMOB_REWARD_AMOUNT')||'1',
}));
