import {createDeletionHandler} from './handler.js';

Deno.serve(createDeletionHandler({
  url:Deno.env.get('SUPABASE_URL'),
  key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
}));
