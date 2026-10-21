begin;

-- Daily quest chest: when today's three quests are done, the learner opens a chest worth 20, 30 or 50 bonus points.
-- The server checks the quests itself from synced sessions and rolls the reward, so the app cannot pick its prize.
-- The bonus also counts as league XP for the chest's day, inside the same 500 XP daily cap as sessions.
create table public.quest_chests (
    user_id uuid not null references auth.users(id) on delete cascade,
    study_day date not null,
    points integer not null check (points in (20,30,50)),
    opened_at timestamptz not null default clock_timestamp(),
    primary key (user_id,study_day)
);
alter table public.quest_chests enable row level security;
revoke all on public.quest_chests from public, anon, authenticated;

-- 60% 20 points, 30% 30 points, 10% 50 points.
create function private.chest_points(p_roll double precision) returns integer
language sql immutable set search_path = '' as $$
    select case when p_roll<0.6 then 20 when p_roll<0.9 then 30 else 50 end
$$;

create function private.chest_state(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
    select jsonb_build_object('total',coalesce(sum(c.points),0),
        'recent',coalesce(jsonb_agg(jsonb_build_object('day',c.study_day,'points',c.points) order by c.study_day)
            filter (where c.study_day>=(now() at time zone 'UTC')::date-2),'[]'::jsonb))
    from public.quest_chests c where c.user_id=p_user
$$;

-- The app's quests for a study day: the daily goal in counted sessions, one finished story, and a
-- flawless game (five right answers in a row only happen in a five-question session with no miss).
create function private.chest_quests_done(p_user uuid,p_day date) returns boolean
language sql stable security definer set search_path = '' as $$
    select count(*)>=coalesce((select p.daily_goal from public.learning_profiles p where p.user_id=p_user),1)
        and bool_or(s.kind='reading') and bool_or(s.kind<>'reading' and s.correct_answers=5)
    from public.learning_sessions s where s.user_id=p_user and s.study_day=p_day and s.counted
$$;

-- Opens the chest for p_day once; opening it again, from any device, returns the same reward.
-- The day may differ from the UTC date by one either way, since study days follow the learner's time zone.
create function public.open_quest_chest(p_day date) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_today date:=(now() at time zone 'UTC')::date; v_points integer;
    v_week date:=private.league_week(now()); v_before integer; v_after integer;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
    if p_day is null or p_day not between v_today-1 and v_today+1 then raise exception 'chest_day_out_of_range' using errcode='22023'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('chest:'||v_user::text||':'||p_day::text));
    select points into v_points from public.quest_chests where user_id=v_user and study_day=p_day;
    if v_points is null then
        if not coalesce(private.chest_quests_done(v_user,p_day),false) then
            raise exception 'quests_incomplete' using errcode='55000';
        end if;
        v_points:=private.chest_points(random());
        insert into public.quest_chests(user_id,study_day,points) values(v_user,p_day,v_points);
        insert into private.league_days(user_id,study_day,xp) values(v_user,p_day,0) on conflict do nothing;
        select xp into v_before from private.league_days where user_id=v_user and study_day=p_day for update;
        v_after:=least(500,v_before+v_points);
        -- Like a late session, a chest for a day of last week no longer changes the league.
        if v_after>v_before and private.league_week(p_day::timestamp at time zone 'UTC')=v_week then
            update private.league_days set xp=v_after where user_id=v_user and study_day=p_day;
            if private.league_join(v_user,v_week) then
                update public.league_entries set xp=xp+(v_after-v_before),xp_at=clock_timestamp() where week_start=v_week and user_id=v_user;
            end if;
        end if;
    end if;
    return private.chest_state(v_user)||jsonb_build_object('day',p_day,'points',v_points);
end;
$$;

-- Total chest points and the last few days' chests, so every device shows the same points and opened chest.
create function public.get_quest_chests() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid:=auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
    return private.chest_state(v_user);
end;
$$;

revoke all on function private.chest_points(double precision), private.chest_state(uuid), private.chest_quests_done(uuid,date),
    public.open_quest_chest(date), public.get_quest_chests() from public, anon, authenticated;
grant execute on function public.open_quest_chest(date), public.get_quest_chests() to authenticated;

commit;
