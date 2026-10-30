import {createRevenueCatWebhookHandler} from './handler.js';
import {createRevenueCatClient} from '../_shared/revenuecat.js';

const allowSandbox=Deno.env.get('REVENUECAT_ALLOW_SANDBOX')==='true';
Deno.serve(createRevenueCatWebhookHandler({
  url:Deno.env.get('SUPABASE_URL'),
  key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  authorization:Deno.env.get('REVENUECAT_WEBHOOK_AUTHORIZATION'),
  appId:Deno.env.get('REVENUECAT_APP_ID'),
  allowSandbox,
  revenueCat:createRevenueCatClient({secretKey:Deno.env.get('REVENUECAT_REST_API_KEY') ?? Deno.env.get('REVENUECAT_SECRET_API_KEY'),allowSandbox}),
}));
