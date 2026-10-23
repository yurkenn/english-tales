begin;

-- Leagues and friend lists show a learner's display name and weekly XP to other learners, so taking part is now
-- an explicit choice: a learner joins only after set_league_opt_out(false), and until then their name and XP stay
-- private. Earlier every counted session enrolled the learner, so nobody enrolled so far has agreed; they are all
-- moved out of view. Their entries and history are kept, hidden, and come back if they choose to join.
alter table public.league_players alter column opted_out set default true;
-- When the learner last chose to join; null while they are out.
alter table public.league_players add column consented_at timestamptz;
-- A hidden entry keeps its XP but is left out of every ranking. Only the current week's entry follows the learner's
-- choice, so a finished week is frozen and settles the same whenever it runs.
alter table public.league_entries add column hidden boolean not null default false;
alter table public.league_entries alter column hidden set default true;

update public.league_players set opted_out=true,updated_at=now() where not opted_out;
update public.league_entries set hidden=true where week_start>=private.league_week(now()) and outcome is null;

-- A hidden entry is ranked among the visible ones only for the learner's own record and never moves their tier.
create or replace function private.league_settle(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_entry record; v_rank integer; v_size integer; v_outcome text;
begin
    -- All entry settlement paths take the player lock first, including opt-out and the session trigger.
    perform 1 from public.league_players where user_id=p_user for update;
    for v_entry in select * from public.league_entries
        where user_id=p_user and outcome is null and week_start<private.league_week(now()) order by week_start for update loop
        select count(*) filter(where e.xp>v_entry.xp or (e.xp=v_entry.xp and (e.xp_at,e.user_id)<(v_entry.xp_at,v_entry.user_id)))+1,count(*)
            into v_rank,v_size from public.league_entries e where e.group_id=v_entry.group_id and (not e.hidden or e.user_id=p_user);
        v_outcome:=case when v_entry.hidden then 'stayed' else private.league_outcome(v_entry.tier,v_rank,v_size,v_entry.xp) end;
        update public.league_entries set final_rank=v_rank,outcome=v_outcome where week_start=v_entry.week_start and user_id=p_user;
        insert into public.league_players(user_id,tier) values(p_user,1) on conflict do nothing;
        update public.league_players set tier=v_entry.tier+case v_outcome when 'promoted' then 1 when 'relegated' then -1 else 0 end,
            updated_at=now() where user_id=p_user;
    end loop;
end;
$$;

-- Only a learner who chose to join is placed in a group; an existing entry counts only while it is visible.
-- Hidden entries still take a seat, so a learner who returns in the same week never overfills their group.
create or replace function private.league_join(p_user uuid,p_week date) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_player public.league_players; v_hidden boolean; v_group uuid;
begin
    select * into v_player from public.league_players where user_id=p_user for update;
    if not found or v_player.opted_out then return false; end if;
    select hidden into v_hidden from public.league_entries where week_start=p_week and user_id=p_user;
    if found then return not v_hidden; end if;
    perform private.league_settle(p_user);
    select * into v_player from public.league_players where user_id=p_user;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('league:'||p_week::text||':'||v_player.tier::text));
    select g.id into v_group from public.league_groups g where g.week_start=p_week and g.tier=v_player.tier
        and (select count(*) from public.league_entries e where e.group_id=g.id)<30 order by g.created_at,g.id limit 1;
    if v_group is null then
        insert into public.league_groups(week_start,tier) values(p_week,v_player.tier) returning id into v_group;
    end if;
    insert into public.league_entries(week_start,user_id,group_id,tier,hidden) values(p_week,p_user,v_group,v_player.tier,false);
    return true;
end;
$$;

-- Others' names are shown only for learners who joined the league; anyone else appears as the default name.
create or replace function private.safe_name(p_viewer uuid,p_member uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_name text;
begin
    select display_name into v_name from public.learning_profiles where user_id=p_member;
    v_name:=coalesce(v_name,'Okuyucu');
    if p_member=p_viewer then return v_name; end if;
    if not exists(select 1 from public.league_players where user_id=p_member and not opted_out)
        or exists(select 1 from private.blocked_name_terms t where position(t.term in lower(v_name))>0)
        or exists(select 1 from public.name_reports where reporter=p_viewer and target=p_member)
        or (select count(*) from public.name_reports where target=p_member and reported_name=v_name)>=3 then
        return 'Okuyucu';
    end if;
    return v_name;
end;
$$;

-- A learner who has not joined, or has left, sees no group and appears in none.
create or replace function public.get_my_league() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_player public.league_players;
    v_entry public.league_entries; v_last public.league_entries; v_members jsonb:='[]'; v_size integer:=0; v_joined boolean;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    perform private.league_settle(v_user);
    select * into v_player from public.league_players where user_id=v_user;
    select * into v_entry from public.league_entries where week_start=v_week and user_id=v_user;
    v_joined:=v_entry.group_id is not null and not v_entry.hidden and not coalesce(v_player.opted_out,true);
    if v_joined then
        select coalesce(jsonb_agg(jsonb_build_object('rank',r.rank,'id',private.member_token(v_user,r.user_id),
                'name',private.safe_name(v_user,r.user_id),'xp',r.xp,'me',r.user_id=v_user) order by r.rank),'[]'),count(*)
            into v_members,v_size from (
                select row_number() over(order by e.xp desc,e.xp_at,e.user_id) as rank,e.user_id,e.xp
                from public.league_entries e join public.league_players p on p.user_id=e.user_id and not p.opted_out
                where e.group_id=v_entry.group_id and not e.hidden) r;
    end if;
    select * into v_last from public.league_entries where user_id=v_user and week_start=v_week-7 and outcome is not null and not hidden;
    return jsonb_build_object('weekStart',v_week,'endsAt',to_char(v_week+7,'YYYY-MM-DD')||'T00:00:00Z',
        'tier',coalesce(v_player.tier,1),'optedOut',coalesce(v_player.opted_out,true),'joined',v_joined,
        'promote',case when coalesce(v_entry.tier,1)<5 then 5 else 0 end,
        'relegate',case when v_size>=10 and coalesce(v_entry.tier,1)>1 then 5 else 0 end,
        'members',v_members,
        'lastWeek',case when v_last.user_id is null then null else
            jsonb_build_object('tier',v_last.tier,'rank',v_last.final_rank,'outcome',v_last.outcome) end);
end;
$$;

-- Joining is the learner's explicit choice. Leaving hides this week's entry at once but keeps its XP, so joining
-- again in the same week returns to the same seat; the daily XP cap is counted apart and is not reset either way.
-- XP earned while out is not added later. Without an entry, joining takes effect with the next session.
create or replace function public.set_league_opt_out(p_opted_out boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    if p_opted_out is null then raise exception 'invalid_league_choice' using errcode='22023'; end if;
    insert into public.league_players(user_id,opted_out,consented_at) values(v_user,p_opted_out,case when not p_opted_out then now() end)
        on conflict(user_id) do update set opted_out=excluded.opted_out,
            consented_at=case when excluded.opted_out then null else coalesce(public.league_players.consented_at,excluded.consented_at) end,
            updated_at=now();
    update public.league_entries set hidden=p_opted_out where week_start=private.league_week(now()) and user_id=v_user;
    return public.get_my_league();
end;
$$;

-- Friends who have not joined the league, or have left it, show the default name and 0 XP.
create or replace function public.get_my_friends() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_code text; v_friends jsonb;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    select code into v_code from public.friend_codes where user_id=v_user;
    select coalesce(jsonb_agg(jsonb_build_object('rank',r.rank,'id',private.member_token(v_user,r.member),
            'name',private.safe_name(v_user,r.member),'xp',r.xp,'me',r.member=v_user) order by r.rank),'[]') into v_friends
        from (select row_number() over(order by coalesce(e.xp,0) desc,m.member) as rank,m.member,coalesce(e.xp,0) as xp
            from (select v_user as member union select friend_id from public.friendships where user_id=v_user) m
            left join public.league_players p on p.user_id=m.member and not p.opted_out
            left join public.league_entries e on e.user_id=p.user_id and e.week_start=v_week and not e.hidden) r;
    return jsonb_build_object('code',v_code,'weekStart',v_week,'friends',v_friends);
end;
$$;

-- Only members the learner can see in their group, or their friends, can be reported.
create or replace function public.report_name(p_member text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_target uuid; v_name text;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    select e.user_id into v_target from public.league_entries e
        join public.league_entries mine on mine.group_id=e.group_id and mine.user_id=v_user and mine.week_start=v_week and not mine.hidden
        join public.league_players p on p.user_id=e.user_id and not p.opted_out
        where e.week_start=v_week and e.user_id<>v_user and not e.hidden and private.member_token(v_user,e.user_id)=p_member;
    if v_target is null then
        select friend_id into v_target from public.friendships where user_id=v_user and private.member_token(v_user,friend_id)=p_member;
    end if;
    if v_target is null then raise exception 'member_not_found' using errcode='P0002'; end if;
    v_name:=private.safe_name(v_user,v_target);
    insert into public.name_reports(reporter,target,reported_name) values(v_user,v_target,coalesce(v_name,'Okuyucu')) on conflict do nothing;
    return jsonb_build_object('reported',true);
end;
$$;

create or replace function public.add_friend(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_friend uuid;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    select user_id into v_friend from public.friend_codes where code=upper(btrim(coalesce(p_code,'')));
    if v_friend is null then raise exception 'friend_code_not_found' using errcode='P0002'; end if;
    if v_friend=v_user then raise exception 'friend_is_self' using errcode='22023'; end if;
    -- Serialize both endpoints in a stable order: simultaneous invites cannot overflow either friend cap.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('friend:'||least(v_user::text,v_friend::text)));
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('friend:'||greatest(v_user::text,v_friend::text)));
    if not exists(select 1 from public.friendships where user_id=v_user and friend_id=v_friend) then
        if (select count(*) from public.friendships where user_id=v_user)>=50
            or (select count(*) from public.friendships where user_id=v_friend)>=50 then
            raise exception 'friend_limit_reached' using errcode='54000';
        end if;
        insert into public.friendships(user_id,friend_id) values(v_user,v_friend),(v_friend,v_user) on conflict do nothing;
    end if;
    return public.get_my_friends();
end;
$$;

revoke all on function private.league_settle(uuid), private.league_join(uuid,date), private.safe_name(uuid,uuid)
    from public, anon, authenticated;
revoke all on function public.get_my_league(), public.set_league_opt_out(boolean), public.get_my_friends(), public.report_name(text), public.add_friend(text)
    from public, anon, authenticated;
grant execute on function public.get_my_league(), public.set_league_opt_out(boolean), public.get_my_friends(), public.report_name(text), public.add_friend(text)
    to authenticated;

commit;
