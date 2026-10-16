begin;

-- Q5.5: the known-word model follows the account. A finished story sends the dictionary forms it
-- contains, a lookup sends the form the learner opened. Both are grow-only sets, so replays and
-- devices converge by union; events are idempotent by ID like the other learning events.
create table public.lemma_events (
    user_id uuid not null references auth.users(id) on delete cascade,
    id uuid not null, installation_id uuid not null,
    kind text not null check (kind in ('read','lookup')),
    story_id text check (story_id ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
    occurred_at timestamptz not null,
    payload jsonb not null, received_at timestamptz not null default now(),
    primary key (user_id,id),
    check ((kind='read')=(story_id is not null))
);
create table public.user_lemma_reads (
    user_id uuid not null references auth.users(id) on delete cascade,
    lemma text not null check (lemma ~ '^[[:alnum:]]{1,100}$'),
    story_id text not null,
    primary key (user_id,lemma,story_id)
);
create table public.user_lemma_lookups (
    user_id uuid not null references auth.users(id) on delete cascade,
    lemma text not null check (lemma ~ '^[[:alnum:]]{1,100}$'),
    looked_up_at timestamptz not null,
    primary key (user_id,lemma)
);
alter table public.lemma_events enable row level security;
alter table public.user_lemma_reads enable row level security;
alter table public.user_lemma_lookups enable row level security;
revoke all on public.lemma_events,public.user_lemma_reads,public.user_lemma_lookups from public,anon,authenticated;
grant select on public.lemma_events,public.user_lemma_reads,public.user_lemma_lookups to authenticated;
create policy own_lemma_events on public.lemma_events for select to authenticated using ((select auth.uid())=user_id);
create policy own_lemma_reads on public.user_lemma_reads for select to authenticated using ((select auth.uid())=user_id);
create policy own_lemma_lookups on public.user_lemma_lookups for select to authenticated using ((select auth.uid())=user_id);

create function public.apply_lemma_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_kind text; v_story text; v_existing jsonb; v_applied boolean:=true;
begin
    if jsonb_typeof(p_event)<>'object' or exists(select 1 from jsonb_object_keys(p_event) k where k not in
        ('id','installationId','kind','storyId','lemmas','occurredAt'))
        or jsonb_typeof(p_event->'lemmas') is distinct from 'array'
        or jsonb_array_length(p_event->'lemmas') not between 1 and 3000
        or exists(select 1 from jsonb_array_elements(p_event->'lemmas') l where jsonb_typeof(l)<>'string' or l#>>'{}' !~ '^[[:alnum:]]{1,100}$')
        or p_event->>'kind' not in ('read','lookup')
        or (p_event->>'kind'='read' and jsonb_typeof(p_event->'storyId') is distinct from 'string')
        or (p_event->>'kind'='lookup' and (p_event ? 'storyId' or jsonb_array_length(p_event->'lemmas')<>1)) then
        raise exception 'invalid_lemma_payload' using errcode='22023';
    end if;
    v_user:=private.lock_learning_user(); v_id:=(p_event->>'id')::uuid; v_kind:=p_event->>'kind'; v_story:=p_event->>'storyId';
    if (p_event->>'occurredAt')::timestamptz>now()+interval '5 minutes' then raise exception 'invalid_event_time' using errcode='22023'; end if;
    select payload into v_existing from public.lemma_events where user_id=v_user and id=v_id;
    if found then
        if v_existing<>p_event then raise exception 'operation_id_payload_conflict' using errcode='23505'; end if;
        v_applied:=false;
    else
        insert into public.lemma_events(user_id,id,installation_id,kind,story_id,occurred_at,payload)
        values(v_user,v_id,(p_event->>'installationId')::uuid,v_kind,v_story,(p_event->>'occurredAt')::timestamptz,p_event);
        if v_kind='read' then
            insert into public.user_lemma_reads(user_id,lemma,story_id)
                select distinct v_user,l,v_story from jsonb_array_elements_text(p_event->'lemmas') l
                on conflict do nothing;
        else
            insert into public.user_lemma_lookups(user_id,lemma,looked_up_at)
                select v_user,l,(p_event->>'occurredAt')::timestamptz from jsonb_array_elements_text(p_event->'lemmas') l
                on conflict(user_id,lemma) do update set looked_up_at=least(public.user_lemma_lookups.looked_up_at,excluded.looked_up_at);
        end if;
    end if;
    return jsonb_build_object('applied',v_applied);
end;
$$;
revoke all on function public.apply_lemma_event(jsonb) from public,anon,authenticated;
grant execute on function public.apply_lemma_event(jsonb) to authenticated;

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
    v_lemma_reads jsonb;
    v_lemma_lookups jsonb;
    v_result jsonb;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;

    -- Reject an oversized snapshot as a whole. Never silently truncate an array
    -- and let a client interpret the missing rows as deletions.
    if (select count(*) from (select 1 from public.learning_sessions where user_id=v_user limit 10001) s)>10000
       or (select count(*) from (select 1 from public.user_word_state where user_id=v_user limit 5001) w)>5000
       or (select count(*) from (select 1 from public.user_story_progress where user_id=v_user limit 5001) p)>5000
       or (select count(*) from (select 1 from public.user_story_favorites where user_id=v_user limit 5001) f)>5000
       or (select count(*) from (select 1 from public.user_lemma_reads where user_id=v_user limit 50001) r)>50000
       or (select count(*) from (select 1 from public.user_lemma_lookups where user_id=v_user limit 20001) l)>20000 then
        raise exception 'learning_snapshot_too_large' using errcode='54000';
    end if;

    select to_jsonb(p)-'user_id' into v_profile from public.learning_profiles p where p.user_id=v_user;
    select coalesce(jsonb_agg(jsonb_build_object(
        'id',s.id,'kind',s.kind,'story_id',s.story_id,'revision_id',s.revision_id,
        'study_day',s.study_day,'counted',s.counted,'points',s.points,
        'finished_at',s.finished_at) order by s.finished_at,s.id),'[]'::jsonb)
        into v_sessions from public.learning_sessions s where s.user_id=v_user;
    -- Saved glossary words (Q4.3a) also carry their text, so another device can show and practise them.
    select coalesce(jsonb_agg((to_jsonb(w)-'user_id') || jsonb_build_object('source_revision_id',e.revision_id)
        || case when pw.word_id is null then '{}'::jsonb else jsonb_build_object('word',pw.word,'gloss',pw.gloss) end
        order by w.word_id),'[]'::jsonb)
        into v_words from public.user_word_state w
        left join public.word_events e on e.user_id=w.user_id and e.id=w.last_event_id
        left join public.user_personal_words pw on pw.user_id=w.user_id and pw.word_id=w.word_id
        where w.user_id=v_user;
    select coalesce(jsonb_agg(to_jsonb(p)-'user_id' order by p.story_id,p.revision_id),'[]'::jsonb)
        into v_progress from public.user_story_progress p where p.user_id=v_user;
    select coalesce(jsonb_agg(to_jsonb(b)-'user_id' order by b.badge_id),'[]'::jsonb)
        into v_badges from public.user_badges b where b.user_id=v_user;
    -- Removed favorites stay as tombstones (favorite=false) so another device does not resurrect them.
    select coalesce(jsonb_agg(jsonb_build_object('story_id',f.story_id,'favorite',f.favorite,'updated_at',f.updated_at)
        order by f.story_id),'[]'::jsonb)
        into v_favorites from public.user_story_favorites f where f.user_id=v_user;
    -- Q5.5: reading history for the known-word model; both are grow-only sets.
    select coalesce(jsonb_agg(jsonb_build_object('lemma',r.lemma,'story_id',r.story_id) order by r.story_id,r.lemma),'[]'::jsonb)
        into v_lemma_reads from public.user_lemma_reads r where r.user_id=v_user;
    select coalesce(jsonb_agg(l.lemma order by l.lemma),'[]'::jsonb)
        into v_lemma_lookups from public.user_lemma_lookups l where l.user_id=v_user;
    v_result:=jsonb_build_object('schemaVersion',1,'userId',v_user,'capturedAt',statement_timestamp(),
        'profile',v_profile,'sessions',v_sessions,'words',v_words,'progress',v_progress,'badges',v_badges,'favorites',v_favorites,
        'lemmaReads',v_lemma_reads,'lemmaLookups',v_lemma_lookups);
    if octet_length(v_result::text)>4194304 then
        raise exception 'learning_snapshot_too_large' using errcode='54000';
    end if;
    return v_result;
end;
$$;
commit;
