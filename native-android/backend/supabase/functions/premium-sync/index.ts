import {createPremiumSyncHandler} from './handler.js';
import {createRevenueCatClient} from '../_shared/revenuecat.js';

Deno.serve(createPremiumSyncHandler({
  url:Deno.env.get('SUPABASE_URL'),
  key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  revenueCat:createRevenueCatClient({
    secretKey:Deno.env.get('REVENUECAT_REST_API_KEY') ?? Deno.env.get('REVENUECAT_SECRET_API_KEY'),
    // Sandbox purchases count only where this is explicitly "true", never in production.
    allowSandbox:Deno.env.get('REVENUECAT_ALLOW_SANDBOX')==='true',
  }),
}));
