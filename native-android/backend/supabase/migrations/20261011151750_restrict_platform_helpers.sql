begin;

-- Staff is only read by owner-privileged editorial functions. No client policy.
alter table private.content_staff enable row level security;

-- Dashboard Auto RLS creates this event-trigger helper in the exposed schema.
-- It must remain callable by the database owner, never by API clients.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

commit;
