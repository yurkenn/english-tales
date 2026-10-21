begin;

-- Weekly leagues: learners earn XP from counted sessions and compete in groups of up to 30 in the same tier.
-- Weeks start Monday 00:00 UTC. XP is derived on the server from learning_sessions, so the app cannot send a score.
-- Tiers: 1 Bronze, 2 Silver, 3 Gold, 4 Sapphire, 5 Diamond.
create table public.league_players (
    user_id uuid primary key references auth.users(id) on delete cascade,
    tier smallint not null default 1 check (tier between 1 and 5),
    opted_out boolean not null default false,
    updated_at timestamptz not null default now()
);
create table public.league_groups (
    id uuid primary key default gen_random_uuid(),
    week_start date not null check (extract(isodow from week_start)=1),
    tier smallint not null check (tier between 1 and 5),
    created_at timestamptz not null default clock_timestamp()
);
create index league_groups_week on public.league_groups(week_start,tier,created_at);
create table public.league_entries (
    week_start date not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    group_id uuid not null references public.league_groups(id) on delete cascade,
    tier smallint not null check (tier between 1 and 5),
    xp integer not null default 0 check (xp>=0),
    xp_at timestamptz not null default clock_timestamp(),
    final_rank integer check (final_rank>0),
    outcome text check (outcome in ('promoted','stayed','relegated')),
    primary key (week_start,user_id),
    check ((final_rank is null)=(outcome is null))
);
create index league_entries_group on public.league_entries(group_id,xp desc,xp_at);
create index league_entries_open on public.league_entries(user_id,week_start desc) where outcome is null;
-- Per-day totals make the daily cap an O(1) update for each new session.
create table private.league_days (
    user_id uuid not null references auth.users(id) on delete cascade,
    study_day date not null,
    xp integer not null check (xp between 0 and 500),
    primary key (user_id,study_day)
);

alter table public.league_players enable row level security;
alter table public.league_groups enable row level security;
alter table public.league_entries enable row level security;
revoke all on public.league_players, public.league_groups, public.league_entries, private.league_days from public, anon, authenticated;

create function private.league_week(p_at timestamptz) returns date
language sql immutable set search_path = '' as $$ select date_trunc('week',p_at at time zone 'UTC')::date $$;

-- A finished story is worth 20 XP; a game is worth its points (5 per right answer) when it lasted at least five active seconds.
create function private.session_xp(p_kind text,p_points integer,p_active integer) returns integer
language sql immutable set search_path = '' as $$
    select case when p_kind='reading' then 20 when p_active>=5 then p_points else 0 end
$$;

-- Promotion and relegation for a finished week. Groups smaller than 10 never relegate.
create function private.league_outcome(p_tier integer,p_rank integer,p_size integer,p_xp integer) returns text
language sql immutable set search_path = '' as $$
    select case when p_rank<=5 and p_xp>0 and p_tier<5 then 'promoted'
        when p_size>=10 and p_rank>p_size-5 and p_tier>1 then 'relegated'
        else 'stayed' end
$$;

-- Ranks the learner's unsettled past weeks and moves their tier. Past weeks are frozen because only
-- sessions finished in the current week add XP, so the result is the same whenever this runs.
create function private.league_settle(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_entry record; v_rank integer; v_size integer; v_outcome text;
begin
    for v_entry in select * from public.league_entries
        where user_id=p_user and outcome is null and week_start<private.league_week(now()) order by week_start for update loop
        select count(*) filter(where e.xp>v_entry.xp or (e.xp=v_entry.xp and (e.xp_at,e.user_id)<(v_entry.xp_at,v_entry.user_id)))+1,count(*)
            into v_rank,v_size from public.league_entries e where e.group_id=v_entry.group_id;
        v_outcome:=private.league_outcome(v_entry.tier,v_rank,v_size,v_entry.xp);
        update public.league_entries set final_rank=v_rank,outcome=v_outcome where week_start=v_entry.week_start and user_id=p_user;
        insert into public.league_players(user_id,tier) values(p_user,1) on conflict do nothing;
        update public.league_players set tier=v_entry.tier+case v_outcome when 'promoted' then 1 when 'relegated' then -1 else 0 end,
            updated_at=now() where user_id=p_user;
    end loop;
end;
$$;

-- Puts the learner into the oldest group of their tier that still has room, opening a new one when all are full.
create function private.league_join(p_user uuid,p_week date) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_player public.league_players; v_group uuid;
begin
    if exists(select 1 from public.league_entries where week_start=p_week and user_id=p_user) then return true; end if;
    insert into public.league_players(user_id) values(p_user) on conflict do nothing;
    perform private.league_settle(p_user);
    select * into v_player from public.league_players where user_id=p_user for update;
    if v_player.opted_out then return false; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('league:'||p_week::text||':'||v_player.tier::text));
    select g.id into v_group from public.league_groups g where g.week_start=p_week and g.tier=v_player.tier
        and (select count(*) from public.league_entries e where e.group_id=g.id)<30 order by g.created_at,g.id limit 1;
    if v_group is null then
        insert into public.league_groups(week_start,tier) values(p_week,v_player.tier) returning id into v_group;
    end if;
    insert into public.league_entries(week_start,user_id,group_id,tier) values(p_week,p_user,v_group,v_player.tier);
    return true;
end;
$$;

create function private.league_on_session() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_week date:=private.league_week(now()); v_gain integer; v_before integer; v_after integer;
begin
    v_gain:=private.session_xp(new.kind,new.points,new.active_seconds);
    if not new.counted or v_gain<=0 or private.league_week(new.finished_at)<>v_week then return null; end if;
    insert into private.league_days(user_id,study_day,xp) values(new.user_id,new.study_day,0) on conflict do nothing;
    select xp into v_before from private.league_days where user_id=new.user_id and study_day=new.study_day for update;
    v_after:=least(500,v_before+v_gain);
    if v_after=v_before then return null; end if;
    update private.league_days set xp=v_after where user_id=new.user_id and study_day=new.study_day;
    if private.league_join(new.user_id,v_week) then
        update public.league_entries set xp=xp+(v_after-v_before),xp_at=clock_timestamp() where week_start=v_week and user_id=new.user_id;
    end if;
    return null;
end;
$$;
create trigger league_xp after insert on public.learning_sessions for each row execute function private.league_on_session();
revoke all on function private.league_week(timestamptz), private.session_xp(text,integer,integer),
    private.league_outcome(integer,integer,integer,integer), private.league_settle(uuid), private.league_join(uuid,date),
    private.league_on_session() from public, anon, authenticated;

-- The learner's current group, ordered by XP. Other members appear only by display name and XP.
create function public.get_my_league() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_player public.league_players;
    v_entry public.league_entries; v_last public.league_entries; v_members jsonb:='[]'; v_size integer:=0;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    perform private.league_settle(v_user);
    select * into v_player from public.league_players where user_id=v_user;
    select * into v_entry from public.league_entries where week_start=v_week and user_id=v_user;
    if v_entry.group_id is not null then
        select coalesce(jsonb_agg(jsonb_build_object('rank',r.rank,'name',r.name,'xp',r.xp,'me',r.me) order by r.rank),'[]'),count(*)
            into v_members,v_size from (
                select row_number() over(order by e.xp desc,e.xp_at,e.user_id) as rank,
                    coalesce(p.display_name,'Okuyucu') as name,e.xp,e.user_id=v_user as me
                from public.league_entries e left join public.learning_profiles p on p.user_id=e.user_id
                where e.group_id=v_entry.group_id) r;
    end if;
    select * into v_last from public.league_entries where user_id=v_user and week_start=v_week-7 and outcome is not null;
    return jsonb_build_object('weekStart',v_week,'endsAt',to_char(v_week+7,'YYYY-MM-DD')||'T00:00:00Z',
        'tier',coalesce(v_player.tier,1),'optedOut',coalesce(v_player.opted_out,false),'joined',v_entry.group_id is not null,
        'promote',case when coalesce(v_entry.tier,1)<5 then 5 else 0 end,
        'relegate',case when v_size>=10 and coalesce(v_entry.tier,1)>1 then 5 else 0 end,
        'members',v_members,
        'lastWeek',case when v_last.user_id is null then null else
            jsonb_build_object('tier',v_last.tier,'rank',v_last.final_rank,'outcome',v_last.outcome) end);
end;
$$;

-- Leaving removes the learner from this week's group at once; joining again takes effect with the next session.
create function public.set_league_opt_out(p_opted_out boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    if p_opted_out is null then raise exception 'invalid_league_choice' using errcode='22023'; end if;
    insert into public.league_players(user_id,opted_out) values(v_user,p_opted_out)
        on conflict(user_id) do update set opted_out=excluded.opted_out,updated_at=now();
    if p_opted_out then
        delete from public.league_entries where week_start=private.league_week(now()) and user_id=v_user;
    end if;
    return public.get_my_league();
end;
$$;
revoke all on function public.get_my_league(), public.set_league_opt_out(boolean) from public, anon, authenticated;
grant execute on function public.get_my_league(), public.set_league_opt_out(boolean) to authenticated;

commit;
