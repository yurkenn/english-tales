begin;

create table public.learning_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default 'Okuyucu' check (length(display_name) between 1 and 30),
    level text not null default 'A1' check (level in ('A1','A2','B1')),
    preferred_genre text not null default 'Günlük yaşam' check (preferred_genre in ('Günlük yaşam','Macera','Gizem')),
    daily_goal integer not null default 1 check (daily_goal between 1 and 3),
    timezone text not null default 'UTC',
    preferences_version bigint not null default 1,
    updated_at timestamptz not null default now()
);
create table public.learning_sessions (
    user_id uuid not null references auth.users(id) on delete cascade,
    id uuid not null,
    installation_id uuid not null,
    kind text not null check (kind in ('reading','choice','card','match','spell')),
    revision_id uuid references public.story_revisions(id),
    story_id text references public.stories(id),
    started_at timestamptz not null, finished_at timestamptz not null,
    active_seconds integer not null check (active_seconds between 0 and 86400),
    correct_answers integer not null check (correct_answers between 0 and 5),
    question_count integer not null check (question_count between 0 and 5),
    study_day date not null, study_timezone text not null,
    counted boolean not null, points integer not null check (points between 0 and 25),
    payload jsonb not null, received_at timestamptz not null default now(),
    primary key (user_id,id),
    check (correct_answers<=question_count and started_at<=finished_at),
    check ((kind='reading' and revision_id is not null and story_id is not null and question_count=0 and points=0)
        or (kind<>'reading' and question_count between 1 and 5 and points=correct_answers*5))
);
create index learning_sessions_day on public.learning_sessions(user_id,study_day desc) where counted;
create unique index one_reading_per_story_day on public.learning_sessions(user_id,story_id,study_day) where kind='reading' and counted;

-- An append-only journal allows removals and late offline answers to converge.
create table public.word_events (
    user_id uuid not null references auth.users(id) on delete cascade,
    id uuid not null, installation_id uuid not null,
    revision_id uuid not null, word_id text not null,
    action text not null check (action in ('save','remove','review')),
    correct boolean,
    occurred_at timestamptz not null, study_timezone text not null,
    payload jsonb not null, received_at timestamptz not null default now(),
    primary key (user_id,id),
    foreign key (revision_id,word_id) references public.revision_words(revision_id,id),
    check ((action='review' and correct is not null) or (action<>'review' and correct is null))
);
create index word_events_replay on public.word_events(user_id,word_id,occurred_at,id);
create table public.user_word_state (
    user_id uuid not null references auth.users(id) on delete cascade,
    word_id text not null,
    saved boolean not null,
    learning_state text not null check (learning_state in ('learning','reviewing','known')),
    correct_count integer not null check (correct_count between 0 and 100),
    next_review_at timestamptz,
    interval_days integer not null check (interval_days in (0,1,3,7,14,30)),
    last_success_day date,
    last_event_id uuid not null,
    updated_at timestamptz not null default now(),
    primary key (user_id,word_id)
);
create table public.progress_events (
    user_id uuid not null references auth.users(id) on delete cascade,
    id uuid not null, installation_id uuid not null,
    revision_id uuid not null references public.story_revisions(id),
    sentence_id text not null,
    percent integer not null check (percent between 0 and 100),
    occurred_at timestamptz not null, payload jsonb not null,
    received_at timestamptz not null default now(),
    primary key (user_id,id),
    foreign key (revision_id,sentence_id) references public.story_sentences(revision_id,id)
);
create table public.user_story_progress (
    user_id uuid not null references auth.users(id) on delete cascade,
    revision_id uuid not null references public.story_revisions(id),
    story_id text not null references public.stories(id),
    last_sentence_id text not null,
    percent integer not null check (percent between 0 and 100),
    last_event_at timestamptz not null, last_event_id uuid not null,
    updated_at timestamptz not null default now(),
    primary key (user_id,revision_id),
    foreign key (revision_id,last_sentence_id) references public.story_sentences(revision_id,id),
    foreign key (story_id,revision_id) references public.story_revisions(story_id,id)
);
create index user_progress_story on public.user_story_progress(user_id,story_id);
create table public.user_badges (
    user_id uuid not null references auth.users(id) on delete cascade,
    badge_id text not null check (badge_id in ('first_story','first_practice','five_words','three_day_streak','seven_day_streak')),
    earned_at timestamptz not null default now(),
    primary key (user_id,badge_id)
);

alter table public.learning_profiles enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.word_events enable row level security;
alter table public.user_word_state enable row level security;
alter table public.progress_events enable row level security;
alter table public.user_story_progress enable row level security;
alter table public.user_badges enable row level security;
revoke all on public.learning_profiles, public.learning_sessions, public.word_events, public.user_word_state,
    public.progress_events, public.user_story_progress, public.user_badges from public, anon, authenticated;
grant select on public.learning_profiles, public.learning_sessions, public.word_events, public.user_word_state,
    public.progress_events, public.user_story_progress, public.user_badges to authenticated;
create policy own_profile on public.learning_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy own_sessions on public.learning_sessions for select to authenticated using ((select auth.uid())=user_id);
create policy own_word_events on public.word_events for select to authenticated using ((select auth.uid())=user_id);
create policy own_words on public.user_word_state for select to authenticated using ((select auth.uid())=user_id);
create policy own_progress_events on public.progress_events for select to authenticated using ((select auth.uid())=user_id);
create policy own_progress on public.user_story_progress for select to authenticated using ((select auth.uid())=user_id);
create policy own_badges on public.user_badges for select to authenticated using ((select auth.uid())=user_id);

-- All writers derive the user from the verified JWT, never from the request body.
create function private.lock_learning_user(p_timezone text default 'UTC') returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then
        raise exception 'invalid_timezone' using errcode='22023';
    end if;
    insert into public.learning_profiles(user_id,timezone) values(v_user,p_timezone) on conflict do nothing;
    perform 1 from public.learning_profiles where user_id=v_user for update;
    return v_user;
end;
$$;
create function private.learning_summary(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_today date; v_anchor date; v_streak integer:=0; v_sessions integer; v_lessons integer; v_readings integer; v_points integer; v_goal integer;
begin
    select (now() at time zone timezone)::date,daily_goal into v_today,v_goal from public.learning_profiles where user_id=p_user;
    select coalesce(sum(points),0),count(*) filter(where kind<>'reading'),
        count(*) filter(where study_day=v_today),count(*) filter(where study_day=v_today and kind='reading')
        into v_points,v_lessons,v_sessions,v_readings from public.learning_sessions where user_id=p_user and counted;
    select max(study_day) into v_anchor from public.learning_sessions where user_id=p_user and counted;
    if v_anchor in (v_today,v_today-1) then
        with recursive consecutive(day) as (
            select v_anchor union all select day-1 from consecutive c
            where exists(select 1 from public.learning_sessions s where s.user_id=p_user and s.counted and s.study_day=c.day-1)
        ) select count(*) into v_streak from consecutive;
    end if;
    return jsonb_build_object('points',v_points,'streak',v_streak,'completedLessons',v_lessons,
        'todaySessions',v_sessions,'todayReadings',v_readings,'dailyGoal',v_goal,'dailyGoalReached',v_sessions>=v_goal);
end;
$$;
create function private.unlock_learning_badges(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_summary jsonb:=private.learning_summary(p_user);
begin
    insert into public.user_badges(user_id,badge_id)
    select p_user,badge from (values
        ('first_story',exists(select 1 from public.learning_sessions where user_id=p_user and kind='reading' and counted)),
        ('first_practice',(v_summary->>'completedLessons')::integer>0),
        ('five_words',(select count(*) from public.user_word_state where user_id=p_user and saved)>=5),
        ('three_day_streak',(v_summary->>'streak')::integer>=3),
        ('seven_day_streak',(v_summary->>'streak')::integer>=7)
    ) as milestones(badge,earned) where earned on conflict do nothing;
end;
$$;
revoke all on function private.lock_learning_user(text), private.learning_summary(uuid), private.unlock_learning_badges(uuid) from public, anon, authenticated;

create function public.save_learning_preferences(p_expected_version bigint,p_name text,p_level text,p_genre text,p_goal integer,p_timezone text)
returns public.learning_profiles language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_result public.learning_profiles;
begin
    v_user:=private.lock_learning_user(p_timezone);
    update public.learning_profiles set display_name=btrim(p_name),level=p_level,preferred_genre=p_genre,
        daily_goal=p_goal,timezone=p_timezone,preferences_version=preferences_version+1,updated_at=now()
        where user_id=v_user and preferences_version=p_expected_version returning * into v_result;
    if not found then raise exception 'preferences_version_conflict' using errcode='40001'; end if;
    return v_result;
end;
$$;

create function public.submit_learning_session(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_kind text; v_revision uuid; v_story text; v_start timestamptz; v_finish timestamptz;
    v_day date; v_timezone text; v_questions integer; v_correct integer; v_active integer; v_counted boolean:=true; v_existing jsonb;
begin
    if jsonb_typeof(p_event)<>'object' or exists(select 1 from jsonb_object_keys(p_event) k where k not in
        ('id','installationId','kind','storyRevisionId','startedAt','finishedAt','activeSeconds','correctAnswers','questionCount','studyTimezone')) then
        raise exception 'invalid_session_payload' using errcode='22023';
    end if;
    v_timezone:=p_event->>'studyTimezone'; v_user:=private.lock_learning_user(v_timezone);
    v_id:=(p_event->>'id')::uuid; v_kind:=p_event->>'kind'; v_revision:=(p_event->>'storyRevisionId')::uuid;
    v_start:=(p_event->>'startedAt')::timestamptz; v_finish:=(p_event->>'finishedAt')::timestamptz;
    v_active:=(p_event->>'activeSeconds')::integer; v_correct:=(p_event->>'correctAnswers')::integer; v_questions:=(p_event->>'questionCount')::integer;
    if v_start is null or v_finish is null or v_finish>now()+interval '5 minutes' or v_start>v_finish
        or v_finish-v_start>interval '7 days' or v_active>extract(epoch from v_finish-v_start)+2 then
        raise exception 'invalid_session_time' using errcode='22023';
    end if;
    select payload into v_existing from public.learning_sessions where user_id=v_user and id=v_id;
    if found then
        if v_existing<>p_event then raise exception 'operation_id_payload_conflict' using errcode='23505'; end if;
        return jsonb_build_object('applied',false,'summary',private.learning_summary(v_user));
    end if;
    if v_revision is not null then
        select story_id into v_story from public.story_revisions where id=v_revision and published_at is not null;
        if not found then raise exception 'published_revision_required' using errcode='22023'; end if;
    end if;
    v_day:=(v_finish at time zone v_timezone)::date;
    if v_kind='reading' then
        v_counted:=not exists(select 1 from public.learning_sessions where user_id=v_user and kind='reading' and counted and story_id=v_story and study_day=v_day);
    end if;
    insert into public.learning_sessions(user_id,id,installation_id,kind,revision_id,story_id,started_at,finished_at,active_seconds,
        correct_answers,question_count,study_day,study_timezone,counted,points,payload)
    values(v_user,v_id,(p_event->>'installationId')::uuid,v_kind,v_revision,v_story,v_start,v_finish,v_active,
        v_correct,v_questions,v_day,v_timezone,v_counted,case when v_kind='reading' then 0 else v_correct*5 end,p_event);
    perform private.unlock_learning_badges(v_user);
    return jsonb_build_object('applied',true,'counted',v_counted,'summary',private.learning_summary(v_user));
end;
$$;

create function public.apply_word_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_word text; v_revision uuid; v_existing jsonb; v_event record;
    v_saved boolean:=false; v_state text:='learning'; v_count integer:=0; v_due timestamptz; v_interval integer:=0;
    v_success date; v_day date; v_last uuid; v_result public.user_word_state; v_applied boolean:=true;
begin
    if jsonb_typeof(p_event)<>'object' or exists(select 1 from jsonb_object_keys(p_event) k where k not in
        ('id','installationId','storyRevisionId','wordId','action','correct','occurredAt','studyTimezone')) then
        raise exception 'invalid_word_payload' using errcode='22023';
    end if;
    v_user:=private.lock_learning_user(p_event->>'studyTimezone'); v_id:=(p_event->>'id')::uuid;
    v_word:=p_event->>'wordId'; v_revision:=(p_event->>'storyRevisionId')::uuid;
    if (p_event->>'occurredAt')::timestamptz>now()+interval '5 minutes' then raise exception 'invalid_event_time' using errcode='22023'; end if;
    if not exists(select 1 from public.revision_words w join public.story_revisions r on r.id=w.revision_id
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

create function public.apply_progress_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_revision uuid; v_story text; v_existing jsonb; v_time timestamptz; v_result public.user_story_progress;
begin
    if jsonb_typeof(p_event)<>'object' or exists(select 1 from jsonb_object_keys(p_event) k where k not in
        ('id','installationId','storyRevisionId','sentenceId','percent','occurredAt')) then
        raise exception 'invalid_progress_payload' using errcode='22023';
    end if;
    v_user:=private.lock_learning_user(); v_id:=(p_event->>'id')::uuid; v_revision:=(p_event->>'storyRevisionId')::uuid;
    v_time:=(p_event->>'occurredAt')::timestamptz;
    if v_time>now()+interval '5 minutes' then raise exception 'invalid_event_time' using errcode='22023'; end if;
    select story_id into v_story from public.story_revisions where id=v_revision and published_at is not null;
    if not found then raise exception 'published_revision_required' using errcode='22023'; end if;
    select payload into v_existing from public.progress_events where user_id=v_user and id=v_id;
    if found then
        if v_existing<>p_event then raise exception 'operation_id_payload_conflict' using errcode='23505'; end if;
        return jsonb_build_object('applied',false);
    end if;
    insert into public.progress_events(user_id,id,installation_id,revision_id,sentence_id,percent,occurred_at,payload)
    values(v_user,v_id,(p_event->>'installationId')::uuid,v_revision,p_event->>'sentenceId',(p_event->>'percent')::integer,v_time,p_event);
    insert into public.user_story_progress(user_id,revision_id,story_id,last_sentence_id,percent,last_event_at,last_event_id)
    values(v_user,v_revision,v_story,p_event->>'sentenceId',(p_event->>'percent')::integer,v_time,v_id)
    on conflict(user_id,revision_id) do update set percent=greatest(public.user_story_progress.percent,excluded.percent),
        last_sentence_id=case when (excluded.last_event_at,excluded.last_event_id)>(public.user_story_progress.last_event_at,public.user_story_progress.last_event_id) then excluded.last_sentence_id else public.user_story_progress.last_sentence_id end,
        last_event_at=greatest(public.user_story_progress.last_event_at,excluded.last_event_at),
        last_event_id=case when (excluded.last_event_at,excluded.last_event_id)>(public.user_story_progress.last_event_at,public.user_story_progress.last_event_id) then excluded.last_event_id else public.user_story_progress.last_event_id end,
        updated_at=now() returning * into v_result;
    return jsonb_build_object('applied',true,'progress',to_jsonb(v_result));
end;
$$;
create function public.get_learning_summary() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=private.lock_learning_user();
begin return private.learning_summary(v_user); end;
$$;
revoke all on function public.save_learning_preferences(bigint,text,text,text,integer,text), public.submit_learning_session(jsonb), public.apply_word_event(jsonb), public.apply_progress_event(jsonb), public.get_learning_summary() from public, anon, authenticated;
grant execute on function public.save_learning_preferences(bigint,text,text,text,integer,text), public.submit_learning_session(jsonb), public.apply_word_event(jsonb), public.apply_progress_event(jsonb), public.get_learning_summary() to authenticated;

commit;
