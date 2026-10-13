begin;

-- One MVCC read snapshot across all SELECTs; never bypass existing per-user RLS.
-- No caller-supplied user ID and no profile creation or other write side effects.
create function public.get_learning_snapshot() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
    v_user uuid := auth.uid();
    v_profile jsonb;
    v_sessions jsonb;
    v_words jsonb;
    v_progress jsonb;
    v_badges jsonb;
    v_result jsonb;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;

    -- Reject an oversized snapshot as a whole. Never silently truncate an array
    -- and let a client interpret the missing rows as deletions.
    if (select count(*) from (select 1 from public.learning_sessions where user_id=v_user limit 10001) s)>10000
       or (select count(*) from (select 1 from public.user_word_state where user_id=v_user limit 5001) w)>5000
       or (select count(*) from (select 1 from public.user_story_progress where user_id=v_user limit 5001) p)>5000 then
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
    v_result:=jsonb_build_object('schemaVersion',1,'userId',v_user,'capturedAt',statement_timestamp(),
        'profile',v_profile,'sessions',v_sessions,'words',v_words,'progress',v_progress,'badges',v_badges);
    if octet_length(v_result::text)>4194304 then
        raise exception 'learning_snapshot_too_large' using errcode='54000';
    end if;
    return v_result;
end;
$$;
revoke all on function public.get_learning_snapshot() from public, anon, authenticated;
grant execute on function public.get_learning_snapshot() to authenticated;

commit;
