begin;
create table private.content_audit (
    id bigint generated always as identity primary key,
    story_id text not null,
    revision_id uuid,
    actor_id uuid references auth.users(id) on delete set null,
    actor_role text,
    action text not null,
    details jsonb not null default '{}',
    created_at timestamptz not null default now(),
    transaction_id bigint not null default txid_current(),
    unique(revision_id,transaction_id,action)
);
create index content_audit_story on private.content_audit(story_id,id desc);
alter table private.content_audit enable row level security;
revoke all on private.content_audit from public,anon,authenticated;
create function private.record_content_action(p_story text,p_revision uuid,p_action text,p_details jsonb default '{}') returns void
language plpgsql security definer set search_path = '' as $$
begin
    insert into private.content_audit(story_id,revision_id,actor_id,actor_role,action,details)
    values(p_story,p_revision,auth.uid(),(select role from private.content_staff where user_id=auth.uid()),p_action,p_details)
    on conflict(revision_id,transaction_id,action) do nothing;
end;
$$;
create function private.audit_content_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if TG_TABLE_NAME='stories' then
        if OLD.is_archived is distinct from NEW.is_archived then
            perform private.record_content_action(NEW.id,NEW.current_revision_id,case when NEW.is_archived then 'archived' else 'restored' end);
        end if;
    elsif TG_OP='INSERT' then
        if auth.uid() is not null then perform private.record_content_action(NEW.story_id,NEW.id,'draft_created',jsonb_build_object('revision',NEW.revision,'title',NEW.title)); end if;
    elsif TG_OP='DELETE' then
        perform private.record_content_action(OLD.story_id,OLD.id,'draft_deleted',jsonb_build_object('revision',OLD.revision,'title',OLD.title));
    elsif OLD.published_at is null and NEW.published_at is not null then
        perform private.record_content_action(NEW.story_id,NEW.id,'published',jsonb_build_object('revision',NEW.revision,'title',NEW.title));
    elsif OLD.published_at is null and auth.uid() is not null and not exists(
        select 1 from private.content_audit where revision_id=NEW.id and transaction_id=txid_current() and action in ('draft_created','draft_saved')) then
        perform private.record_content_action(NEW.story_id,NEW.id,'draft_saved',jsonb_build_object('revision',NEW.revision,'title',NEW.title));
    end if;
    return null;
end;
$$;
create trigger revision_audit after insert or update or delete on public.story_revisions for each row execute function private.audit_content_change();
create trigger archive_audit after update on public.stories for each row execute function private.audit_content_change();
create function public.admin_history(p_story_id text,p_before_id bigint default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    return coalesce((select jsonb_agg(to_jsonb(q)) from (
        select * from private.content_audit where story_id=p_story_id and (p_before_id is null or id<p_before_id) order by id desc limit 50
    ) q),'[]'::jsonb);
end;
$$;
create function public.admin_delete_draft(p_revision_id uuid,p_expected_version integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_story text; v_revision public.story_revisions%rowtype;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    select story_id into v_story from public.story_revisions where id=p_revision_id;
    perform 1 from public.stories where id=v_story for update;
    select * into v_revision from public.story_revisions where id=p_revision_id for update;
    if not found then raise exception 'revision_not_found' using errcode='22023'; end if;
    if v_revision.published_at is not null then raise exception 'published_revision_is_immutable' using errcode='23514'; end if;
    if p_expected_version is distinct from v_revision.edit_version then raise exception 'draft_version_conflict' using errcode='40001'; end if;
    delete from public.story_revisions where id=p_revision_id;
    delete from public.stories where id=v_story and current_revision_id is null and not exists(select 1 from public.story_revisions where story_id=v_story);
    return p_revision_id;
end;
$$;
create function public.admin_archive(p_story_id text,p_archived boolean,p_expected_revision uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_current uuid;
begin
    if not private.is_staff(true) then raise exception 'publisher_required' using errcode='42501'; end if;
    select current_revision_id into v_current from public.stories where id=p_story_id for update;
    if not found then raise exception 'story_not_found' using errcode='22023'; end if;
    if v_current is distinct from p_expected_revision then raise exception 'published_version_conflict' using errcode='40001'; end if;
    if v_current is null or p_archived is null then raise exception 'published_story_required' using errcode='22023'; end if;
    perform public.set_story_archived(p_story_id,p_archived);
end;
$$;

-- Publication integrity applies even when the original publication RPC is called.
create function private.check_learning_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if OLD.published_at is null and NEW.published_at is not null then
        if exists(select 1 from public.revision_words w where w.revision_id=NEW.id and not exists(
            select 1 from public.sentence_words l where l.revision_id=w.revision_id and l.word_id=w.id)) then
            raise exception 'learning_word_unlinked' using errcode='23514';
        end if;
        if exists(select 1 from public.sentence_words l
            join public.story_sentences s on s.revision_id=l.revision_id and s.id=l.sentence_id
            join public.revision_words w on w.revision_id=l.revision_id and w.id=l.word_id
            where l.revision_id=NEW.id and (btrim(regexp_replace(lower(w.word),'[^[:alnum:]]+',' ','g'))='' or strpos(
                ' '||btrim(regexp_replace(lower(s.english),'[^[:alnum:]]+',' ','g'))||' ',
                ' '||btrim(regexp_replace(lower(w.word),'[^[:alnum:]]+',' ','g'))||' ')=0)) then
            raise exception 'learning_word_not_in_sentence' using errcode='23514';
        end if;
    end if;
    return NEW;
end;
$$;
create trigger publication_word_links before update on public.story_revisions for each row execute function private.check_learning_links();

alter table public.content_assets add column is_deleting boolean not null default false;
create function private.guard_revision_media() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    perform 1 from public.content_assets where id in (NEW.cover_asset_id,NEW.audio_asset_id) order by id for update;
    if exists(select 1 from public.content_assets where id in (NEW.cover_asset_id,NEW.audio_asset_id) and is_deleting) then
        raise exception 'media_pending_delete' using errcode='23514';
    end if;
    return NEW;
end;
$$;
create trigger revision_media before insert or update on public.story_revisions for each row execute function private.guard_revision_media();
create function private.bump_media_revisions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if to_jsonb(NEW) is distinct from to_jsonb(OLD) then
        update public.story_revisions set edit_version=edit_version where published_at is null and (cover_asset_id=NEW.id or audio_asset_id=NEW.id);
    end if;
    return null;
end;
$$;
create trigger asset_revision_version after update on public.content_assets for each row execute function private.bump_media_revisions();
create function public.admin_unused_media(p_before_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    return coalesce((select jsonb_agg(to_jsonb(q)) from (
        select a.* from public.content_assets a where (p_before_id is null or a.id>p_before_id)
        and not exists(select 1 from public.story_revisions r where r.cover_asset_id=a.id or r.audio_asset_id=a.id)
        order by a.id limit 50
    ) q),'[]'::jsonb);
end;
$$;
create function public.admin_reserve_media_delete(p_asset_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_path text;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    select storage_path into v_path from public.content_assets where id=p_asset_id for update;
    if not found then raise exception 'media_not_found' using errcode='22023'; end if;
    if exists(select 1 from public.story_revisions where cover_asset_id=p_asset_id or audio_asset_id=p_asset_id) then
        raise exception 'media_still_referenced' using errcode='23514';
    end if;
    update public.content_assets set is_deleting=true where id=p_asset_id;
    return v_path;
end;
$$;
create function public.admin_finalize_media_delete(p_asset_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_asset public.content_assets%rowtype;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    select * into v_asset from public.content_assets where id=p_asset_id for update;
    if not found then return p_asset_id; end if;
    if not v_asset.is_deleting then raise exception 'media_delete_not_reserved' using errcode='23514'; end if;
    if exists(select 1 from storage.objects where bucket_id='story-media' and name=v_asset.storage_path) then
        raise exception 'media_object_still_exists' using errcode='23514';
    end if;
    delete from public.content_assets where id=p_asset_id;
    return p_asset_id;
end;
$$;
drop policy tales_media_insert on storage.objects;
drop policy tales_media_update on storage.objects;
drop policy tales_media_delete on storage.objects;
create policy tales_media_insert on storage.objects for insert to authenticated with check (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not a.is_deleting and not private.asset_is_frozen(a.id)));
create policy tales_media_update on storage.objects for update to authenticated using (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not a.is_deleting and not private.asset_is_frozen(a.id))) with check (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not a.is_deleting and not private.asset_is_frozen(a.id)));
create policy tales_media_delete on storage.objects for delete to authenticated using (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and a.is_deleting
        and not exists(select 1 from public.story_revisions r where r.cover_asset_id=a.id or r.audio_asset_id=a.id)));

revoke all on function private.record_content_action(text,uuid,text,jsonb),private.audit_content_change(),private.check_learning_links(),private.guard_revision_media(),private.bump_media_revisions() from public,anon,authenticated;
revoke all on function public.admin_history(text,bigint),public.admin_delete_draft(uuid,integer),public.admin_archive(text,boolean,uuid),public.admin_unused_media(uuid),public.admin_reserve_media_delete(uuid),public.admin_finalize_media_delete(uuid) from public,anon,authenticated;
grant execute on function public.admin_history(text,bigint),public.admin_delete_draft(uuid,integer),public.admin_archive(text,boolean,uuid),public.admin_unused_media(uuid),public.admin_reserve_media_delete(uuid),public.admin_finalize_media_delete(uuid) to authenticated;
commit;
