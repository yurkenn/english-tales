begin;

-- Q5.7: FSRS-5 schedules word reviews (see docs/FSRS_PLAN.md). The formulas and weights match
-- backend/tools/fsrs.mjs and the Android Fsrs model; tests/fixtures/fsrs-vectors.csv pins all three.
alter table public.user_word_state
    add column stability double precision check (stability is null or stability>0),
    add column difficulty double precision check (difficulty is null or difficulty between 1 and 10),
    add column last_reviewed_at timestamptz;

create function private.fsrs_review(p_s double precision,p_d double precision,p_correct boolean,p_elapsed double precision,
    out s double precision,out d double precision)
language plpgsql immutable set search_path = '' as $$
declare
    w double precision[]:=array[0.40255,1.18385,3.173,15.69105,7.1949,0.5345,1.4604,0.0046,1.54575,0.1192,
        1.01925,1.9395,0.11,0.29605,2.2698,0.2315,2.9898,0.51655,0.6621];
    g integer:=case when p_correct then 3 else 1 end; r double precision; d0 double precision;
begin
    -- w is 1-based here: w[1] is FSRS w0.
    if p_s is null then
        s:=w[g]; d:=least(10,greatest(1,w[5]-exp(w[6]*(g-1))+1)); return;
    end if;
    d0:=least(10,greatest(1,w[5]-exp(w[6]*3)+1));
    d:=least(10,greatest(1,w[8]*d0+(1-w[8])*(p_d-w[7]*(g-3)*(10-p_d)/9)));
    if p_elapsed<1 then s:=p_s*exp(w[18]*(g-3+w[19])); return; end if;
    r:=power(1+(19.0/81.0)*p_elapsed/p_s,-0.5);
    if p_correct then s:=p_s*(exp(w[9])*(11-p_d)*power(p_s,-w[10])*(exp(w[11]*(1-r))-1)+1);
    else s:=least(w[12]*power(p_d,-w[13])*(power(p_s+1,w[14])-1)*exp(w[15]*(1-r)),p_s);
    end if;
end;
$$;
create function private.fsrs_interval(p_s double precision) returns integer
language sql immutable set search_path = '' as $$ select least(36500,greatest(1,floor(p_s+0.5)::integer)) $$;
create function private.elapsed_days(p_from timestamptz,p_to timestamptz) returns double precision
language sql immutable set search_path = '' as $$ select coalesce(extract(epoch from p_to-p_from)/86400.0,0) $$;
revoke all on function private.fsrs_review(double precision,double precision,boolean,double precision) from public,anon,authenticated;
revoke all on function private.fsrs_interval(double precision) from public,anon,authenticated;
revoke all on function private.elapsed_days(timestamptz,timestamptz) from public,anon,authenticated;

-- Existing words start from their current interval; the next event for a word replays its whole history with FSRS.
update public.user_word_state set stability=greatest(interval_days,0.4),difficulty=5 where saved;

create or replace function public.apply_word_event(p_event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_id uuid; v_word text; v_revision uuid; v_existing jsonb; v_event record;
    v_saved boolean:=false; v_state text:='learning'; v_count integer:=0; v_due timestamptz; v_interval integer:=0;
    v_success date; v_day date; v_last uuid; v_result public.user_word_state; v_applied boolean:=true;
    v_s double precision; v_d double precision; v_reviewed timestamptz; v_days integer; v_memory record;
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
            v_s:=null; v_d:=null; v_reviewed:=null;
        elsif v_event.action='save' and not v_saved then
            v_saved:=true; v_due:=v_event.occurred_at;
        elsif v_event.action='review' and v_saved then
            -- Q5.7: FSRS-5 decides the interval; a wrong answer still returns after ten minutes, and an early
            -- or same-day correct answer still changes nothing, so mastery cannot be inflated by replaying.
            if not v_event.correct then
                select * into v_memory from private.fsrs_review(v_s,v_d,false,private.elapsed_days(v_reviewed,v_event.occurred_at));
                v_s:=v_memory.s; v_d:=v_memory.d; v_reviewed:=v_event.occurred_at;
                v_state:='learning'; v_count:=0; v_interval:=0; v_success:=null; v_due:=v_event.occurred_at+interval '10 minutes';
            elsif v_event.occurred_at>=v_due and v_success is distinct from v_day then
                select * into v_memory from private.fsrs_review(v_s,v_d,true,private.elapsed_days(v_reviewed,v_event.occurred_at));
                v_s:=v_memory.s; v_d:=v_memory.d; v_reviewed:=v_event.occurred_at;
                v_count:=least(v_count+1,100); v_days:=private.fsrs_interval(v_s);
                -- interval_days keeps the legacy buckets older apps validate; next_review_at is the real schedule.
                v_interval:=coalesce((select max(b) from unnest(array[1,3,7,14,30]) b where b<=v_days),1);
                v_state:=case when v_s>=21 then 'known' else 'reviewing' end;
                v_due:=v_event.occurred_at+v_days*interval '24 hours'; v_success:=v_day;
            end if;
        end if;
    end loop;
    insert into public.user_word_state(user_id,word_id,saved,learning_state,correct_count,next_review_at,interval_days,last_success_day,last_event_id,stability,difficulty,last_reviewed_at)
    values(v_user,v_word,v_saved,v_state,v_count,v_due,v_interval,v_success,v_last,v_s,v_d,v_reviewed)
    on conflict(user_id,word_id) do update set saved=excluded.saved,learning_state=excluded.learning_state,
        correct_count=excluded.correct_count,next_review_at=excluded.next_review_at,interval_days=excluded.interval_days,
        last_success_day=excluded.last_success_day,last_event_id=excluded.last_event_id,stability=excluded.stability,
        difficulty=excluded.difficulty,last_reviewed_at=excluded.last_reviewed_at,updated_at=now()
    returning * into v_result;
    perform private.unlock_learning_badges(v_user);
    return jsonb_build_object('applied',v_applied,'wordState',to_jsonb(v_result));
end;
$$;
commit;
