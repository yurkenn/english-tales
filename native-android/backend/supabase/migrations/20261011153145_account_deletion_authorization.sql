begin;

create function private.account_deletion_authorized() returns boolean
language plpgsql stable security definer set search_path='' as $$
declare v_session text:=auth.jwt()->>'session_id';
begin
  if auth.uid() is null or v_session is null or v_session !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  return exists (
    select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id=v_session::uuid and s.user_id=auth.uid() and not coalesce(u.is_anonymous,false)
      and s.created_at between now()-interval '5 minutes' and now()
      and (s.not_after is null or s.not_after>now())
  );
exception when invalid_text_representation then return false;
end;
$$;
revoke all on function private.account_deletion_authorized() from public,anon,authenticated;
grant execute on function private.account_deletion_authorized() to authenticated;

create function public.authorize_account_deletion() returns boolean
language sql stable security invoker set search_path='' as $$
  select private.account_deletion_authorized();
$$;
revoke all on function public.authorize_account_deletion() from public,anon,authenticated;
grant execute on function public.authorize_account_deletion() to authenticated;

commit;
