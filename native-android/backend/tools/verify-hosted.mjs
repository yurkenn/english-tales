import assert from 'node:assert/strict';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key?.startsWith('sb_publishable_'))throw new Error('Hosted publishable configuration required');
const headers={apikey:key,'Content-Type':'application/json'};
const storiesResponse=await fetch(`${url}/rest/v1/stories?select=id,current_revision_id`,{headers});assert.equal(storiesResponse.status,200);
const stories=await storiesResponse.json();
assert.ok(stories.every(s=>s.current_revision_id));
for(const name of ['admin_catalog','admin_history','admin_unused_media','get_learning_summary']){
  const body=name==='admin_catalog'?{p_offset:0,p_limit:100}:name==='admin_history'?{p_story_id:'quiet-morning'}:{};
  const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(body)});
  assert.ok(response.status>=400,`${name} must reject anonymous requests`);
}
const revisionsResponse=await fetch(`${url}/rest/v1/story_revisions?select=id,published_at,cover_asset_id`,{headers});assert.equal(revisionsResponse.status,200);
const revisions=await revisionsResponse.json();assert.ok(revisions.every(r=>r.published_at));
const wordsResponse=await fetch(`${url}/rest/v1/learning_sessions?select=id`,{headers});assert.ok(wordsResponse.status>=400);
const forged=await fetch(`${url}/rest/v1/stories?select=id`,{headers:{...headers,Authorization:'Bearer invalid-token'}});assert.ok(forged.status>=400);
console.log(JSON.stringify({project:new URL(url).hostname,publishedStories:stories.length,visiblePublishedRevisions:revisions.length,anonymousAdminDenied:true,anonymousLearningDenied:true,invalidTokenDenied:true}));
