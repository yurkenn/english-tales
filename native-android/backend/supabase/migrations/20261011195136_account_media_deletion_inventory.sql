begin;
-- Read-only inventory, callable only by the existing server role. Storage writes
-- remain API operations; neither clients nor this function modify Storage metadata.
grant usage on schema storage to service_role;
grant select on storage.objects, public.content_assets to service_role;
create function public.account_owned_media_inventory(p_user_id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'bucket',o.bucket_id,'path',o.name,'assetId',a.id,'sha256',a.sha256,
    'byteSize',a.byte_size,'mimeType',a.mime_type) order by o.bucket_id,o.name),'[]'::jsonb)
  from storage.objects o left join public.content_assets a
    on o.bucket_id='story-media' and a.storage_path=o.name
  where o.owner_id=p_user_id::text or o.owner=p_user_id;
$$;
revoke all on function public.account_owned_media_inventory(uuid) from public,anon,authenticated;
grant execute on function public.account_owned_media_inventory(uuid) to service_role;
commit;
