begin;

-- Friends join by a short invite code and compare this week's league XP. League and friend lists show other
-- learners by name, so names are masked to the default when they contain a blocked term, when the viewer
-- reported them, or when three learners reported the same name. Members are addressed by an opaque token that
-- differs for every viewer, so no user id leaves the server.
create table public.friend_codes (
    user_id uuid primary key references auth.users(id) on delete cascade,
    code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
    created_at timestamptz not null default now()
);
create table public.friendships (
    user_id uuid not null references auth.users(id) on delete cascade,
    friend_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id,friend_id),
    check (user_id<>friend_id)
);
create index friendships_friend on public.friendships(friend_id);
create table public.name_reports (
    reporter uuid not null references auth.users(id) on delete cascade,
    target uuid not null references auth.users(id) on delete cascade,
    reported_name text not null,
    created_at timestamptz not null default now(),
    primary key (reporter,target,reported_name)
);
create index name_reports_target on public.name_reports(target,reported_name);
create table private.blocked_name_terms (
    term text primary key check (term=lower(term) and length(term) between 3 and 30)
);
insert into private.blocked_name_terms(term) values
    ('fuck'),('shit'),('bitch'),('cunt'),('nigger'),('nigga'),('faggot'),('whore'),('slut'),('pussy'),('asshole'),
    ('bastard'),('hitler'),('nazi'),('penis'),('porn'),('orospu'),('siktir'),('sikiş'),('yarrak'),('yarak'),('amcık'),
    ('ibne'),('kahpe'),('pezevenk'),('gavat'),('yavşak'),('amına'),('piç');

alter table public.friend_codes enable row level security;
alter table public.friendships enable row level security;
alter table public.name_reports enable row level security;
revoke all on public.friend_codes, public.friendships, public.name_reports, private.blocked_name_terms from public, anon, authenticated;

create function private.member_token(p_viewer uuid,p_member uuid) returns text
language sql immutable set search_path = '' as $$
    select left(encode(pg_catalog.sha256(convert_to(p_viewer::text||':'||p_member::text,'UTF8')),'hex'),20)
$$;

create function private.safe_name(p_viewer uuid,p_member uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare v_name text;
begin
    select display_name into v_name from public.learning_profiles where user_id=p_member;
    v_name:=coalesce(v_name,'Okuyucu');
    if p_member=p_viewer then return v_name; end if;
    if exists(select 1 from private.blocked_name_terms t where position(t.term in lower(v_name))>0)
        or exists(select 1 from public.name_reports where reporter=p_viewer and target=p_member)
        or (select count(*) from public.name_reports where target=p_member and reported_name=v_name)>=3 then
        return 'Okuyucu';
    end if;
    return v_name;
end;
$$;

create or replace function public.get_my_league() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_player public.league_players;
    v_entry public.league_entries; v_last public.league_entries; v_members jsonb:='[]'; v_size integer:=0;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    perform private.league_settle(v_user);
    select * into v_player from public.league_players where user_id=v_user;
    select * into v_entry from public.league_entries where week_start=v_week and user_id=v_user;
    if v_entry.group_id is not null then
        select coalesce(jsonb_agg(jsonb_build_object('rank',r.rank,'id',private.member_token(v_user,r.user_id),
                'name',private.safe_name(v_user,r.user_id),'xp',r.xp,'me',r.user_id=v_user) order by r.rank),'[]'),count(*)
            into v_members,v_size from (
                select row_number() over(order by e.xp desc,e.xp_at,e.user_id) as rank,e.user_id,e.xp
                from public.league_entries e where e.group_id=v_entry.group_id) r;
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

-- The learner and their friends, ranked by this week's league XP; learners outside the league count 0.
create function public.get_my_friends() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_code text; v_friends jsonb;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    select code into v_code from public.friend_codes where user_id=v_user;
    select coalesce(jsonb_agg(jsonb_build_object('rank',r.rank,'id',private.member_token(v_user,r.member),
            'name',private.safe_name(v_user,r.member),'xp',r.xp,'me',r.member=v_user) order by r.rank),'[]') into v_friends
        from (select row_number() over(order by coalesce(e.xp,0) desc,m.member) as rank,m.member,coalesce(e.xp,0) as xp
            from (select v_user as member union select friend_id from public.friendships where user_id=v_user) m
            left join public.league_entries e on e.user_id=m.member and e.week_start=v_week) r;
    return jsonb_build_object('code',v_code,'weekStart',v_week,'friends',v_friends);
end;
$$;

-- A six-character code from an alphabet without look-alike characters, created on first use and then kept.
create function public.get_friend_code() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_code text; v_alphabet text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    perform private.lock_learning_user();
    if not exists(select 1 from public.friend_codes where user_id=v_user) then
        loop
            v_code:=(select string_agg(substr(v_alphabet,1+floor(random()*32)::integer,1),'') from generate_series(1,6));
            begin
                insert into public.friend_codes(user_id,code) values(v_user,v_code);
                exit;
            exception when unique_violation then
                if exists(select 1 from public.friend_codes where user_id=v_user) then exit; end if;
            end;
        end loop;
    end if;
    return public.get_my_friends();
end;
$$;

-- Adding by code connects both learners at once: sharing the code is the owner's consent.
-- Errors carry distinct SQLSTATEs for the app: P0002 unknown code, 22023 own code, 54000 friend limit.
create function public.add_friend(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_friend uuid;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    perform private.lock_learning_user();
    select user_id into v_friend from public.friend_codes where code=upper(btrim(coalesce(p_code,'')));
    if v_friend is null then raise exception 'friend_code_not_found' using errcode='P0002'; end if;
    if v_friend=v_user then raise exception 'friend_is_self' using errcode='22023'; end if;
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

create function public.remove_friend(p_member text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_friend uuid;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    select friend_id into v_friend from public.friendships where user_id=v_user and private.member_token(v_user,friend_id)=p_member;
    if v_friend is not null then
        delete from public.friendships where (user_id=v_user and friend_id=v_friend) or (user_id=v_friend and friend_id=v_user);
    end if;
    return public.get_my_friends();
end;
$$;

-- Reports a name the learner can see in their league group or friend list; it is hidden for them at once.
create function public.report_name(p_member text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_week date:=private.league_week(now()); v_target uuid; v_name text;
begin
    if v_user is null then raise exception 'authentication_required' using errcode='42501'; end if;
    select e.user_id into v_target from public.league_entries e
        join public.league_entries mine on mine.group_id=e.group_id and mine.user_id=v_user and mine.week_start=v_week
        where e.week_start=v_week and e.user_id<>v_user and private.member_token(v_user,e.user_id)=p_member;
    if v_target is null then
        select friend_id into v_target from public.friendships where user_id=v_user and private.member_token(v_user,friend_id)=p_member;
    end if;
    if v_target is null then raise exception 'member_not_found' using errcode='P0002'; end if;
    select coalesce(display_name,'Okuyucu') into v_name from public.learning_profiles where user_id=v_target;
    insert into public.name_reports(reporter,target,reported_name) values(v_user,v_target,coalesce(v_name,'Okuyucu')) on conflict do nothing;
    return jsonb_build_object('reported',true);
end;
$$;

revoke all on function private.member_token(uuid,uuid), private.safe_name(uuid,uuid) from public, anon, authenticated;
revoke all on function public.get_my_friends(), public.get_friend_code(), public.add_friend(text), public.remove_friend(text),
    public.report_name(text) from public, anon, authenticated;
grant execute on function public.get_my_friends(), public.get_friend_code(), public.add_friend(text), public.remove_friend(text),
    public.report_name(text) to authenticated;

commit;
