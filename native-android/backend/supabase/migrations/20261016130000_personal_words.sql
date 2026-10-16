begin;

-- Q4.3a: glossary words a learner saves follow the account like learning words. They are not part of
-- any story revision, so their events carry no revision and their save carries the word and meaning.
alter table public.word_events alter column revision_id drop not null;
alter table public.word_events add constraint word_events_revision_or_glossary
    check (revision_id is not null or word_id like 'glossary:%');

create table public.user_personal_words (
    user_id uuid not null references auth.users(id) on delete cascade,
    word_id text not null check (word_id ~ '^glossary:[[:alnum:]]{1,100}$'),
    word text not null check (length(word) between 1 and 100 and word ~ '[^[:space:]]'),
    gloss text not null check (length(gloss) between 1 and 1000 and gloss ~ '[^[:space:]]'),
    updated_at timestamptz not null,
    primary key (user_id,word_id)
);
alter table public.user_personal_words enable row level security;
revoke all on public.user_personal_words from public,anon,authenticated;
grant select on public.user_personal_words to authenticated;
create policy personal_words_read on public.user_personal_words for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.apply_word_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_word text; v_revision uuid; v_existing jsonb; v_event record;
    v_saved boolean:=false; v_state text:='learning'; v_count integer:=0; v_due timestamptz; v_interval integer:=0;
    v_success date; v_day date; v_last uuid; v_result public.user_word_state; v_applied boolean:=true;
begin
    if jsonb_typeof(p_event)<>'object' or exists(select 1 from jsonb_object_keys(p_event) k where k not in
        ('id','installationId','storyRevisionId','wordId','action','correct','occurredAt','studyTimezone','word','gloss')) then
        raise exception 'invalid_word_payload' using errcode='22023';
    end if;
    v_user:=private.lock_learning_user(p_event->>'studyTimezone'); v_id:=(p_event->>'id')::uuid;
    v_word:=p_event->>'wordId'; v_revision:=(p_event->>'storyRevisionId')::uuid;
    if (p_event->>'occurredAt')::timestamptz>now()+interval '5 minutes' then raise exception 'invalid_event_time' using errcode='22023'; end if;
    -- Q4.3a: a saved glossary word has no story revision; its save carries the word and meaning.
    if v_word like 'glossary:%' then
        if v_word !~ '^glossary:[[:alnum:]]{1,100}$' or v_revision is not null
            or (p_event->>'action'='save' and (coalesce(p_event->>'word','') !~ '[^[:space:]]' or coalesce(p_event->>'gloss','') !~ '[^[:space:]]'
                or length(p_event->>'word')>100 or length(p_event->>'gloss')>1000))
            or (p_event->>'action'<>'save' and (p_event ? 'word' or p_event ? 'gloss')) then
            raise exception 'invalid_word_payload' using errcode='22023';
        end if;
    elsif p_event ? 'word' or p_event ? 'gloss' then
        raise exception 'invalid_word_payload' using errcode='22023';
    elsif not exists(select 1 from public.revision_words w join public.story_revisions r on r.id=w.revision_id
        where w.revision_id=v_revision and w.id=v_word and r.published_at is not null) then
        raise exception 'published_word_required' using errcode='22023';
    end if;
    select payload into v_existing from public.word_events where user_id=v_user and id=v_id;
    if found then
        if v_existing<>p_event then raise exception 'operation_id_payload_conflict' using errcode='23505'; end if;
        v_applied:=false;
    else
        insert into public.word_events(user_id,id,installation_id,revision_id,word_id,action,correct,occurred_at,study_timezone,payload)
        values(v_user,v_id,(p_event->>'installationId')::uuid,v_revision,v_word,p_event->>'action',(p_event->>'correct')::boolean,
            (p_event->>'occurredAt')::timestamptz,p_event->>'studyTimezone',p_event);
        -- The newest save decides the stored text, whatever order devices upload in.
        if p_event->>'action'='save' and v_word like 'glossary:%' then
            insert into public.user_personal_words(user_id,word_id,word,gloss,updated_at)
            values(v_user,v_word,p_event->>'word',p_event->>'gloss',(p_event->>'occurredAt')::timestamptz)
            on conflict(user_id,word_id) do update set word=excluded.word,gloss=excluded.gloss,updated_at=excluded.updated_at
                where excluded.updated_at>=public.user_personal_words.updated_at;
        end if;
    end if;
    for v_event in select * from public.word_events where user_id=v_user and word_id=v_word order by occurred_at,id loop
        v_last:=v_event.id; v_day:=(v_event.occurred_at at time zone v_event.study_timezone)::date;
        if v_event.action='remove' then
            v_saved:=false; v_state:='learning'; v_count:=0; v_due:=null; v_interval:=0; v_success:=null;
        elsif v_event.action='save' and not v_saved then
            v_saved:=true; v_due:=v_event.occurred_at;
        elsif v_event.action='review' and v_saved then
            if not v_event.correct then
                v_state:='learning'; v_count:=0; v_interval:=0; v_success:=null; v_due:=v_event.occurred_at+interval '10 minutes';
            elsif v_event.occurred_at>=v_due and v_success is distinct from v_day then
                v_count:=least(v_count+1,100); v_interval:=(array[1,3,7,14,30])[least(v_count,5)];
                v_state:=case when v_count>=3 then 'known' else 'reviewing' end;
                v_due:=v_event.occurred_at+v_interval*interval '24 hours'; v_success:=v_day;
            end if;
        end if;
    end loop;
    insert into public.user_word_state(user_id,word_id,saved,learning_state,correct_count,next_review_at,interval_days,last_success_day,last_event_id)
    values(v_user,v_word,v_saved,v_state,v_count,v_due,v_interval,v_success,v_last)
    on conflict(user_id,word_id) do update set saved=excluded.saved,learning_state=excluded.learning_state,
        correct_count=excluded.correct_count,next_review_at=excluded.next_review_at,interval_days=excluded.interval_days,
        last_success_day=excluded.last_success_day,last_event_id=excluded.last_event_id,updated_at=now()
    returning * into v_result;
    perform private.unlock_learning_badges(v_user);
    return jsonb_build_object('applied',v_applied,'wordState',to_jsonb(v_result));
end;
$$;


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
    v_result:=jsonb_build_object('schemaVersion',1,'userId',v_user,'capturedAt',statement_timestamp(),
        'profile',v_profile,'sessions',v_sessions,'words',v_words,'progress',v_progress,'badges',v_badges,'favorites',v_favorites);
    if octet_length(v_result::text)>4194304 then
        raise exception 'learning_snapshot_too_large' using errcode='54000';
    end if;
    return v_result;
end;
$$;
commit;
