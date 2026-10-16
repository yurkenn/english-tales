begin;

-- F09b: favorite stories follow the account. Events are idempotent by ID; the state per story is the
-- latest event (occurred_at, id), so two devices converge and a removal is kept as a tombstone.
create table public.favorite_events (
    user_id uuid not null references auth.users(id) on delete cascade,
    id uuid not null, installation_id uuid not null,
    story_id text not null check (story_id ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
    favorite boolean not null,
    occurred_at timestamptz not null,
    payload jsonb not null, received_at timestamptz not null default now(),
    primary key (user_id,id)
);
create index favorite_events_replay on public.favorite_events(user_id,story_id,occurred_at desc,id desc);
create table public.user_story_favorites (
    user_id uuid not null references auth.users(id) on delete cascade,
    story_id text not null,
    favorite boolean not null,
    updated_at timestamptz not null,
    last_event_id uuid not null,
    primary key (user_id,story_id)
);
alter table public.favorite_events enable row level security;
alter table public.user_story_favorites enable row level security;
revoke all on public.favorite_events,public.user_story_favorites from public,anon,authenticated;
grant select on public.favorite_events,public.user_story_favorites to authenticated;
create policy own_favorite_events on public.favorite_events for select to authenticated using ((select auth.uid())=user_id);
create policy own_favorites on public.user_story_favorites for select to authenticated using ((select auth.uid())=user_id);

create function public.apply_favorite_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_story text; v_existing jsonb; v_latest public.favorite_events; v_result public.user_story_favorites; v_applied boolean:=true;
begin
    if jsonb_typeof(p_event)<>'object' or exists(select 1 from jsonb_object_keys(p_event) k where k not in
        ('id','installationId','storyId','favorite','occurredAt'))
        or jsonb_typeof(p_event->'favorite') is distinct from 'boolean'
        or jsonb_typeof(p_event->'storyId') is distinct from 'string' then
        raise exception 'invalid_favorite_payload' using errcode='22023';
    end if;
    v_user:=private.lock_learning_user(); v_id:=(p_event->>'id')::uuid; v_story:=p_event->>'storyId';
    if (p_event->>'occurredAt')::timestamptz>now()+interval '5 minutes' then raise exception 'invalid_event_time' using errcode='22023'; end if;
    select payload into v_existing from public.favorite_events where user_id=v_user and id=v_id;
    if found then
        if v_existing<>p_event then raise exception 'operation_id_payload_conflict' using errcode='23505'; end if;
        v_applied:=false;
    else
        insert into public.favorite_events(user_id,id,installation_id,story_id,favorite,occurred_at,payload)
        values(v_user,v_id,(p_event->>'installationId')::uuid,v_story,(p_event->>'favorite')::boolean,(p_event->>'occurredAt')::timestamptz,p_event);
    end if;
    select * into v_latest from public.favorite_events where user_id=v_user and story_id=v_story order by occurred_at desc,id desc limit 1;
    insert into public.user_story_favorites(user_id,story_id,favorite,updated_at,last_event_id)
    values(v_user,v_story,v_latest.favorite,v_latest.occurred_at,v_latest.id)
    on conflict(user_id,story_id) do update set favorite=excluded.favorite,updated_at=excluded.updated_at,last_event_id=excluded.last_event_id
    returning * into v_result;
    return jsonb_build_object('applied',v_applied,'favorite',to_jsonb(v_result)-'user_id');
end;
$$;
revoke all on function public.apply_favorite_event(jsonb) from public,anon,authenticated;
grant execute on function public.apply_favorite_event(jsonb) to authenticated;

create or replace function public.get_learning_snapshot() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_profile jsonb;
    v_sessions jsonb;
    v_words jsonb;
    v_progress jsonb;
    v_badges jsonb;
    v_favorites jsonb;
    v_result jsonb;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;

    -- Reject an oversized snapshot as a whole. Never silently truncate an array
    -- and let a client interpret the missing rows as deletions.
    if (select count(*) from (select 1 from public.learning_sessions where user_id=v_user limit 10001) s)>10000
       or (select count(*) from (select 1 from public.user_word_state where user_id=v_user limit 5001) w)>5000
       or (select count(*) from (select 1 from public.user_story_progress where user_id=v_user limit 5001) p)>5000
       or (select count(*) from (select 1 from public.user_story_favorites where user_id=v_user limit 5001) f)>5000 then
        raise exception 'learning_snapshot_too_large' using errcode='54000';
    end if;

    select to_jsonb(p)-'user_id' into v_profile from public.learning_profiles p where p.user_id=v_user;
    select coalesce(jsonb_agg(jsonb_build_object(
        'id',s.id,'kind',s.kind,'story_id',s.story_id,'revision_id',s.revision_id,
        'study_day',s.study_day,'counted',s.counted,'points',s.points,
        'finished_at',s.finished_at) order by s.finished_at,s.id),'[]'::jsonb)
        into v_sessions from public.learning_sessions s where s.user_id=v_user;
    select coalesce(jsonb_agg((to_jsonb(w)-'user_id') || jsonb_build_object('source_revision_id',e.revision_id)
        order by w.word_id),'[]'::jsonb)
        into v_words from public.user_word_state w
        left join public.word_events e on e.user_id=w.user_id and e.id=w.last_event_id
        where w.user_id=v_user;
    select coalesce(jsonb_agg(to_jsonb(p)-'user_id' order by p.story_id,p.revision_id),'[]'::jsonb)
        into v_progress from public.user_story_progress p where p.user_id=v_user;
    select coalesce(jsonb_agg(to_jsonb(b)-'user_id' order by b.badge_id),'[]'::jsonb)
        into v_badges from public.user_badges b where b.user_id=v_user;
    -- Removed favorites stay as tombstones (favorite=false) so another device does not resurrect them.
    select coalesce(jsonb_agg(jsonb_build_object('story_id',f.story_id,'favorite',f.favorite,'updated_at',f.updated_at)
        order by f.story_id),'[]'::jsonb)
        into v_favorites from public.user_story_favorites f where f.user_id=v_user;
    v_result:=jsonb_build_object('schemaVersion',1,'userId',v_user,'capturedAt',statement_timestamp(),
        'profile',v_profile,'sessions',v_sessions,'words',v_words,'progress',v_progress,'badges',v_badges,'favorites',v_favorites);
    if octet_length(v_result::text)>4194304 then
        raise exception 'learning_snapshot_too_large' using errcode='54000';
    end if;
    return v_result;
end;
$$;
revoke all on function public.get_learning_snapshot() from public, anon, authenticated;
grant execute on function public.get_learning_snapshot() to authenticated;

commit;
