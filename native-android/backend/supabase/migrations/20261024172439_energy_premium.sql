begin;

-- Story energy, rewarded-ad credits and premium access. Separate from the learning outbox:
-- learning points are never spent here and no learning contract changes.
-- Every user RPC derives the account from auth.uid() and serialises on one advisory lock per user.
-- The server's UTC date is the only day that counts; device time and time zones cannot add energy.

-- Server kill switch. Off by default: restrictions stay inactive until an operator enables them.
create table private.energy_settings (
    singleton boolean primary key default true check (singleton),
    enabled boolean not null default false,
    updated_at timestamptz not null default now()
);
insert into private.energy_settings default values;
revoke all on private.energy_settings from public, anon, authenticated;

-- One row per user for the current UTC day. A row from an earlier day reads as a fresh day.
create table public.energy_wallets (
    user_id uuid primary key references auth.users(id) on delete cascade,
    day date not null,
    spent smallint not null default 0 check (spent between 0 and 6),
    ad_credits smallint not null default 0 check (ad_credits between 0 and 3),
    updated_at timestamptz not null default now(),
    check (spent<=3+ad_credits)
);
-- Permanent story access, only from spent energy or the one-time legacy progress backfill.
-- Premium opens are never written here, so they end with the subscription.
create table public.story_unlocks (
    user_id uuid not null references auth.users(id) on delete cascade,
    story_id text not null references public.stories(id) on delete cascade,
    source text not null check (source in ('energy','legacy')),
    unlocked_at timestamptz not null default now(),
    primary key (user_id,story_id)
);
-- Single-use rewarded-ad tickets. The nonce travels as AdMob custom_data and is redeemed
-- only by the verified server-side callback. issued_day is informational: a verified reward is
-- credited to the UTC day its callback is processed on, so an ad finished just before midnight
-- still pays once. Credited tickets are kept as replay proof and cannot be changed.
create table public.ad_reward_tickets (
    nonce uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    issued_day date not null,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    transaction_id text unique check (length(transaction_id) between 1 and 200),
    credited_at timestamptz,
    check ((transaction_id is null)=(credited_at is null))
);
create index ad_reward_tickets_user_day on public.ad_reward_tickets(user_id,issued_day);
-- Premium as last verified with RevenueCat by the server. Clients cannot write it.
create table public.premium_entitlements (
    user_id uuid primary key references auth.users(id) on delete cascade,
    expires_at timestamptz,
    checked_at timestamptz not null,
    updated_at timestamptz not null default now()
);

alter table public.energy_wallets enable row level security;
alter table public.story_unlocks enable row level security;
alter table public.ad_reward_tickets enable row level security;
alter table public.premium_entitlements enable row level security;
revoke all on public.energy_wallets, public.story_unlocks, public.ad_reward_tickets, public.premium_entitlements
    from public, anon, authenticated;

create function private.story_unlock_is_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
    raise exception 'story_unlock_is_immutable' using errcode='23514';
end;
$$;
create trigger story_unlocks_immutable before update on public.story_unlocks
    for each row execute function private.story_unlock_is_immutable();

create function private.ad_reward_credit_is_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
    if old.transaction_id is not null then raise exception 'ad_reward_credit_is_immutable' using errcode='23514'; end if;
    return new;
end;
$$;
create trigger ad_reward_tickets_credit_immutable before update on public.ad_reward_tickets
    for each row execute function private.ad_reward_credit_is_immutable();

create function private.energy_iso(p_time timestamptz) returns text
language sql immutable set search_path = '' as $$
    select to_char(p_time at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

create function private.energy_lock(p_user uuid) returns void
language sql volatile set search_path = '' as $$
    select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('energy:'||p_user::text))
$$;

create function private.energy_user() returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare v_user uuid:=auth.uid();
begin
    if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
    perform private.energy_lock(v_user);
    return v_user;
end;
$$;

create function private.energy_state(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_today date:=(now() at time zone 'UTC')::date; v_spent integer:=0; v_ads integer:=0;
    v_until timestamptz; v_enabled boolean; v_pending integer;
begin
    select spent,ad_credits into v_spent,v_ads from public.energy_wallets where user_id=p_user and day=v_today;
    select count(*) into v_pending from public.ad_reward_tickets
        where user_id=p_user and transaction_id is null and expires_at>now();
    select expires_at into v_until from public.premium_entitlements where user_id=p_user and expires_at>now();
    select enabled into v_enabled from private.energy_settings;
    return jsonb_build_object(
        'day',v_today::text,
        'balance',3+coalesce(v_ads,0)-coalesce(v_spent,0),
        'adCredits',coalesce(v_ads,0),
        'adCap',3,
        'pendingAdRewards',v_pending,
        'premium',v_until is not null,
        'premiumUntil',private.energy_iso(v_until),
        'resetsAt',private.energy_iso((v_today+1)::timestamp at time zone 'UTC'),
        'enabled',coalesce(v_enabled,false),
        'unlockedStoryIds',coalesce((select jsonb_agg(u.story_id order by u.story_id)
            from public.story_unlocks u where u.user_id=p_user),'[]'::jsonb));
end;
$$;

-- Moves the user's wallet to today, creating or resetting it, and returns it locked.
create function private.energy_wallet_today(p_user uuid) returns public.energy_wallets
language plpgsql volatile security definer set search_path = '' as $$
declare v_today date:=(now() at time zone 'UTC')::date; v_wallet public.energy_wallets;
begin
    insert into public.energy_wallets(user_id,day) values(p_user,v_today)
    on conflict(user_id) do update set day=v_today,spent=0,ad_credits=0,updated_at=now()
        where public.energy_wallets.day<>v_today;
    select * into v_wallet from public.energy_wallets where user_id=p_user for update;
    return v_wallet;
end;
$$;

create function private.premium_active(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select exists(select 1 from public.premium_entitlements where user_id=p_user and expires_at>now())
$$;

-- The kill switch alone, for guests without a session too. No account data.
create function public.get_energy_policy() returns jsonb
language sql stable security definer set search_path = '' as $$
    select jsonb_build_object('enabled',coalesce((select enabled from private.energy_settings),false))
$$;

create function public.get_energy_state() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
    return private.energy_state(private.energy_user());
end;
$$;

-- Opening a story: already unlocked and premium are free, otherwise one energy buys permanent access.
-- Running out is an answer (allowed=false), not an error. With the kill switch off nothing is spent.
create function public.unlock_story(p_story_id text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_user uuid:=private.energy_user(); v_wallet public.energy_wallets; v_reason text; v_allowed boolean:=true;
begin
    if p_story_id is null or not exists(select 1 from public.stories
        where id=p_story_id and current_revision_id is not null and not is_archived) then
        raise exception 'story_unavailable' using errcode='P0002';
    end if;
    if exists(select 1 from public.story_unlocks where user_id=v_user and story_id=p_story_id) then
        v_reason:='unlocked';
    elsif not (select enabled from private.energy_settings) then
        v_reason:='disabled';
    elsif private.premium_active(v_user) then
        v_reason:='premium';
    else
        v_wallet:=private.energy_wallet_today(v_user);
        if 3+v_wallet.ad_credits-v_wallet.spent>0 then
            update public.energy_wallets set spent=spent+1,updated_at=now() where user_id=v_user;
            insert into public.story_unlocks(user_id,story_id,source) values(v_user,p_story_id,'energy');
            v_reason:='energy';
        else
            v_allowed:=false; v_reason:='exhausted';
        end if;
    end if;
    return private.energy_state(v_user)||jsonb_build_object('allowed',v_allowed,'reason',v_reason);
end;
$$;

-- Reserves a rewarded-ad slot. Invariant: today's ad credits plus open, unexpired tickets of any day
-- never exceed 3. It survives midnight (credits reset to 0, open tickets only shrink), so every open
-- ticket has room on whichever day its callback arrives. A nonce is promised to one ad only: at the
-- cap the call fails with pending_reward (some still open) or ad_limit_reached (all credited).
create function public.begin_ad_reward() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_user uuid:=private.energy_user(); v_today date:=(now() at time zone 'UTC')::date;
    v_credited integer; v_pending integer; v_nonce uuid;
begin
    if not (select enabled from private.energy_settings) then raise exception 'energy_disabled' using errcode='55000'; end if;
    if private.premium_active(v_user) then raise exception 'premium_active' using errcode='55000'; end if;
    delete from public.ad_reward_tickets where user_id=v_user and transaction_id is null and expires_at<=now();
    select coalesce((select ad_credits from public.energy_wallets where user_id=v_user and day=v_today),0) into v_credited;
    select count(*) into v_pending from public.ad_reward_tickets where user_id=v_user and transaction_id is null;
    if v_credited>=3 then raise exception 'ad_limit_reached' using errcode='55000'; end if;
    if v_credited+v_pending>=3 then raise exception 'pending_reward' using errcode='55000'; end if;
    insert into public.ad_reward_tickets(user_id,issued_day,expires_at)
        values(v_user,v_today,now()+interval '1 hour') returning nonce into v_nonce;
    return jsonb_build_object('nonce',v_nonce);
end;
$$;

-- Releases the caller's own open ticket after a no-fill, a show failure or a dismissal without reward.
-- Someone else's, unknown and credited tickets are left alone and all answer cancelled=false.
-- Never call it once the ad SDK reported a reward: that ticket's callback would then be refused.
create function public.cancel_ad_reward(p_nonce uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_user uuid:=private.energy_user();
begin
    delete from public.ad_reward_tickets where nonce=p_nonce and user_id=v_user and transaction_id is null;
    return jsonb_build_object('cancelled',found);
end;
$$;

-- Server-only: redeems a ticket after the AdMob SSV signature has been verified.
-- Idempotent on (nonce, transaction): a repeated valid callback is acknowledged without a second credit.
create function public.credit_ad_reward(p_nonce uuid,p_transaction_id text,p_user_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_ticket public.ad_reward_tickets; v_wallet public.energy_wallets;
begin
    if p_nonce is null or p_user_id is null or p_transaction_id is null or length(p_transaction_id) not between 1 and 200 then
        return jsonb_build_object('credited',false,'duplicate',false,'reason','invalid');
    end if;
    perform private.energy_lock(p_user_id);
    select * into v_ticket from public.ad_reward_tickets where transaction_id=p_transaction_id;
    if found then
        if v_ticket.nonce=p_nonce and v_ticket.user_id=p_user_id then
            return jsonb_build_object('credited',false,'duplicate',true,'reason','already_credited');
        end if;
        return jsonb_build_object('credited',false,'duplicate',false,'reason','transaction_reused');
    end if;
    select * into v_ticket from public.ad_reward_tickets where nonce=p_nonce and user_id=p_user_id for update;
    if not found then return jsonb_build_object('credited',false,'duplicate',false,'reason','unknown_ticket'); end if;
    if v_ticket.transaction_id is not null then
        return jsonb_build_object('credited',false,'duplicate',false,'reason','ticket_used');
    end if;
    if v_ticket.expires_at<=now() then
        return jsonb_build_object('credited',false,'duplicate',false,'reason','expired');
    end if;
    -- Credited to the UTC day the callback arrives, even if the ticket was issued the day before.
    -- The begin_ad_reward invariant makes the check below unreachable through the RPCs; it stays so
    -- a hand-inserted ticket still cannot pass 3 ad credits a day or a balance of 6.
    v_wallet:=private.energy_wallet_today(p_user_id);
    if v_wallet.ad_credits>=3 then
        return jsonb_build_object('credited',false,'duplicate',false,'reason','limit_reached');
    end if;
    update public.ad_reward_tickets set transaction_id=p_transaction_id,credited_at=now() where nonce=p_nonce;
    update public.energy_wallets set ad_credits=ad_credits+1,updated_at=now() where user_id=p_user_id;
    return jsonb_build_object('credited',true,'duplicate',false,'reason','credited');
end;
$$;

-- Server-only: stores the entitlement the server just read from RevenueCat. Lookups that finished
-- out of order cannot roll it back: an older or equal checked_at is ignored. A null expiry clears premium.
create function public.set_premium_entitlement(p_user_id uuid,p_expires_at timestamptz,p_checked_at timestamptz) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_row public.premium_entitlements;
begin
    if p_user_id is null or p_checked_at is null or p_checked_at>now()+interval '5 minutes' then
        raise exception 'invalid_entitlement' using errcode='22023';
    end if;
    perform private.energy_lock(p_user_id);
    if not exists(select 1 from auth.users where id=p_user_id and not coalesce(is_anonymous,false)) then
        return jsonb_build_object('applied',false,'reason','unknown_user');
    end if;
    insert into public.premium_entitlements as e(user_id,expires_at,checked_at) values(p_user_id,p_expires_at,p_checked_at)
    on conflict(user_id) do update set expires_at=excluded.expires_at,checked_at=excluded.checked_at,updated_at=now()
        where e.checked_at<excluded.checked_at
    returning * into v_row;
    if not found then
        select * into v_row from public.premium_entitlements where user_id=p_user_id;
        return jsonb_build_object('applied',false,'reason','stale','premium',coalesce(v_row.expires_at>now(),false),
            'premiumUntil',case when v_row.expires_at>now() then private.energy_iso(v_row.expires_at) end);
    end if;
    return jsonb_build_object('applied',true,'reason','applied','premium',coalesce(v_row.expires_at>now(),false),
        'premiumUntil',case when v_row.expires_at>now() then private.energy_iso(v_row.expires_at) end);
end;
$$;

-- Keeps stories that readers already had progress in from before energy existed. Run by the
-- migration once; an operator may run it again right before enabling the kill switch.
-- Never run from client writes: progress events are client-supplied.
create function private.backfill_legacy_story_unlocks() returns integer
language plpgsql volatile set search_path = '' as $$
declare v_count integer;
begin
    insert into public.story_unlocks(user_id,story_id,source)
    select distinct p.user_id,p.story_id,'legacy' from public.user_story_progress p
    on conflict do nothing;
    get diagnostics v_count=row_count;
    return v_count;
end;
$$;
select private.backfill_legacy_story_unlocks();

revoke all on function private.story_unlock_is_immutable(), private.ad_reward_credit_is_immutable(),
    private.energy_iso(timestamptz), private.energy_lock(uuid),
    private.energy_user(), private.energy_state(uuid), private.energy_wallet_today(uuid), private.premium_active(uuid),
    private.backfill_legacy_story_unlocks(),
    public.get_energy_policy(), public.get_energy_state(), public.unlock_story(text), public.begin_ad_reward(),
    public.cancel_ad_reward(uuid),
    public.credit_ad_reward(uuid,text,uuid), public.set_premium_entitlement(uuid,timestamptz,timestamptz)
    from public, anon, authenticated;
grant execute on function public.get_energy_policy() to anon, authenticated;
grant execute on function public.get_energy_state(), public.unlock_story(text), public.begin_ad_reward(),
    public.cancel_ad_reward(uuid) to authenticated;
grant execute on function public.credit_ad_reward(uuid,text,uuid), public.set_premium_entitlement(uuid,timestamptz,timestamptz) to service_role;

commit;
