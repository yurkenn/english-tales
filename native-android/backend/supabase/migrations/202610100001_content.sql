begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- Only a trusted database administrator can assign editorial permissions.
create table private.content_staff (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('editor','publisher'))
);
revoke all on private.content_staff from public, anon, authenticated;

create function private.is_staff(p_publish boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
    select exists(select 1 from private.content_staff where user_id=auth.uid()
        and (not p_publish or role='publisher'));
$$;
revoke all on function private.is_staff(boolean) from public, anon, authenticated;
grant execute on function private.is_staff(boolean) to anon, authenticated;

create table public.content_assets (
    id uuid primary key default gen_random_uuid(),
    kind text not null check (kind in ('cover','audio')),
    storage_path text not null unique check (storage_path !~ '(^/|\.\.|\\)' and length(storage_path)>0),
    sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
    byte_size bigint not null check (byte_size between 1 and 20971520),
    mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','audio/mpeg','audio/mp4','audio/ogg')),
    created_at timestamptz not null default now(),
    check ((kind='cover' and mime_type like 'image/%') or (kind='audio' and mime_type like 'audio/%'))
);
create table public.stories (
    id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
    current_revision_id uuid,
    is_archived boolean not null default false,
    created_at timestamptz not null default now()
);
create table public.story_revisions (
    id uuid primary key default gen_random_uuid(),
    story_id text not null references public.stories(id),
    revision integer not null check (revision>0),
    title text not null default '', author text not null default '',
    level text not null check (level in ('A1','A2','B1')),
    genre text not null check (genre in ('Günlük yaşam','Macera','Gizem')),
    description text not null default '',
    cover_asset_id uuid references public.content_assets(id),
    audio_asset_id uuid references public.content_assets(id),
    published_at timestamptz,
    created_at timestamptz not null default now(),
    unique (story_id,revision), unique (story_id,id)
);
alter table public.stories add constraint current_revision_belongs_to_story
    foreign key (id,current_revision_id) references public.story_revisions(story_id,id);

create table public.story_sentences (
    revision_id uuid not null references public.story_revisions(id) on delete cascade,
    id text not null check (length(id) between 1 and 100),
    position integer not null check (position>0),
    english text not null default '', turkish text not null default '',
    primary key (revision_id,id), unique (revision_id,position)
);
create table public.revision_words (
    revision_id uuid not null references public.story_revisions(id) on delete cascade,
    id text not null check (length(id) between 1 and 100),
    word text not null, translation text not null,
    pronunciation text not null default '', example text not null default '',
    primary key (revision_id,id)
);
create table public.sentence_words (
    revision_id uuid not null, sentence_id text not null, word_id text not null,
    primary key (revision_id,sentence_id,word_id),
    foreign key (revision_id,sentence_id) references public.story_sentences(revision_id,id) on delete cascade,
    foreign key (revision_id,word_id) references public.revision_words(revision_id,id) on delete cascade
);
create index revisions_cover on public.story_revisions(cover_asset_id);
create index revisions_audio on public.story_revisions(audio_asset_id);
create index sentence_words_word on public.sentence_words(revision_id,word_id);

create function private.can_read_revision(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select private.is_staff() or exists(select 1 from public.story_revisions r
        join public.stories s on s.id=r.story_id
        where r.id=p_id and r.published_at is not null and not s.is_archived);
$$;
create function private.asset_is_frozen(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select exists(select 1 from public.story_revisions
        where published_at is not null and (cover_asset_id=p_id or audio_asset_id=p_id));
$$;
create function private.can_read_asset(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select private.is_staff() or exists(select 1 from public.story_revisions r
        join public.stories s on s.id=r.story_id where r.published_at is not null
        and not s.is_archived and (r.cover_asset_id=p_id or r.audio_asset_id=p_id));
$$;
create function private.can_edit_revision(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select private.is_staff() and exists(select 1 from public.story_revisions where id=p_id and published_at is null);
$$;
revoke all on function private.can_read_revision(uuid), private.asset_is_frozen(uuid), private.can_read_asset(uuid), private.can_edit_revision(uuid) from public, anon, authenticated;
grant execute on function private.can_read_revision(uuid), private.can_read_asset(uuid) to anon, authenticated;
grant execute on function private.asset_is_frozen(uuid), private.can_edit_revision(uuid) to authenticated;

-- Lock the parent revision before a child mutation; publication uses the same lock.
create function private.guard_revision_child() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
    if TG_OP<>'INSERT' then
        v_id:=OLD.revision_id;
        perform 1 from public.story_revisions where id=v_id for update;
        if exists(select 1 from public.story_revisions where id=v_id and published_at is not null) then
            raise exception 'published_revision_is_immutable' using errcode='23514';
        end if;
    end if;
    if TG_OP<>'DELETE' then
        v_id:=NEW.revision_id;
        perform 1 from public.story_revisions where id=v_id for update;
        if exists(select 1 from public.story_revisions where id=v_id and published_at is not null) then
            raise exception 'published_revision_is_immutable' using errcode='23514';
        end if;
        return NEW;
    end if;
    return OLD;
end;
$$;
create function private.guard_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
    if OLD.published_at is not null then raise exception 'published_revision_is_immutable' using errcode='23514'; end if;
    if TG_OP='DELETE' then return OLD; end if;
    if NEW.id<>OLD.id or NEW.story_id<>OLD.story_id or NEW.revision<>OLD.revision then
        raise exception 'revision_identity_is_immutable' using errcode='23514';
    end if;
    return NEW;
end;
$$;
create function private.guard_asset() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if private.asset_is_frozen(OLD.id) then raise exception 'published_asset_is_immutable' using errcode='23514'; end if;
    if TG_OP='DELETE' then return OLD; end if;
    if NEW.id<>OLD.id then raise exception 'asset_identity_is_immutable' using errcode='23514'; end if;
    return NEW;
end;
$$;
revoke all on function private.guard_revision_child(), private.guard_revision(), private.guard_asset() from public, anon, authenticated;
create trigger immutable_revision before update or delete on public.story_revisions for each row execute function private.guard_revision();
create trigger immutable_sentences before insert or update or delete on public.story_sentences for each row execute function private.guard_revision_child();
create trigger immutable_words before insert or update or delete on public.revision_words for each row execute function private.guard_revision_child();
create trigger immutable_word_links before insert or update or delete on public.sentence_words for each row execute function private.guard_revision_child();
create trigger immutable_asset before update or delete on public.content_assets for each row execute function private.guard_asset();

alter table public.stories enable row level security;
alter table public.story_revisions enable row level security;
alter table public.story_sentences enable row level security;
alter table public.revision_words enable row level security;
alter table public.sentence_words enable row level security;
alter table public.content_assets enable row level security;
revoke all on public.stories, public.story_revisions, public.story_sentences, public.revision_words, public.sentence_words, public.content_assets from public, anon, authenticated;
grant select on public.stories, public.story_revisions, public.story_sentences, public.revision_words, public.sentence_words, public.content_assets to anon, authenticated;
grant insert(id) on public.stories to authenticated;
grant insert(id,story_id,revision,title,author,level,genre,description,cover_asset_id,audio_asset_id) on public.story_revisions to authenticated;
grant update(title,author,level,genre,description,cover_asset_id,audio_asset_id) on public.story_revisions to authenticated;
grant delete on public.story_revisions to authenticated;
grant insert(id,kind,storage_path,sha256,byte_size,mime_type), update(kind,storage_path,sha256,byte_size,mime_type), delete on public.content_assets to authenticated;
grant insert,update,delete on public.story_sentences, public.revision_words, public.sentence_words to authenticated;

create policy story_read on public.stories for select to anon,authenticated using (private.is_staff() or (current_revision_id is not null and not is_archived));
create policy story_create on public.stories for insert to authenticated with check (private.is_staff());
create policy revision_read on public.story_revisions for select to anon,authenticated using (private.can_read_revision(id));
create policy revision_insert on public.story_revisions for insert to authenticated with check (private.is_staff() and published_at is null);
create policy revision_update on public.story_revisions for update to authenticated using (private.can_edit_revision(id)) with check (private.can_edit_revision(id));
create policy revision_delete on public.story_revisions for delete to authenticated using (private.can_edit_revision(id));
create policy sentence_read on public.story_sentences for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy sentence_write on public.story_sentences for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));
create policy word_read on public.revision_words for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy word_write on public.revision_words for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));
create policy link_read on public.sentence_words for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy link_write on public.sentence_words for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));
create policy asset_read on public.content_assets for select to anon,authenticated using (private.can_read_asset(id));
create policy asset_insert on public.content_assets for insert to authenticated with check (private.is_staff());
create policy asset_update on public.content_assets for update to authenticated using (private.is_staff() and not private.asset_is_frozen(id)) with check (private.is_staff() and not private.asset_is_frozen(id));
create policy asset_delete on public.content_assets for delete to authenticated using (private.is_staff() and not private.asset_is_frozen(id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
    ('story-media','story-media',false,20971520,array['image/png','image/jpeg','image/webp','audio/mpeg','audio/mp4','audio/ogg']);
create policy tales_media_read on storage.objects for select to anon,authenticated using (
    bucket_id='story-media' and exists(select 1 from public.content_assets a where a.storage_path=name));
create policy tales_media_insert on storage.objects for insert to authenticated with check (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not private.asset_is_frozen(a.id)));
create policy tales_media_update on storage.objects for update to authenticated using (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not private.asset_is_frozen(a.id))) with check (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not private.asset_is_frozen(a.id)));
create policy tales_media_delete on storage.objects for delete to authenticated using (
    bucket_id='story-media' and private.is_staff() and exists(select 1 from public.content_assets a where a.storage_path=name and not private.asset_is_frozen(a.id)));

create function public.publish_story_revision(p_revision_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_story text; v_revision public.story_revisions%rowtype; v_current uuid; v_count integer;
begin
    if not private.is_staff(true) then raise exception 'publisher_required' using errcode='42501'; end if;
    select story_id into v_story from public.story_revisions where id=p_revision_id;
    if not found then raise exception 'revision_not_found' using errcode='22023'; end if;
    select current_revision_id into v_current from public.stories where id=v_story for update;
    select * into v_revision from public.story_revisions where id=p_revision_id for update;
    if v_current=p_revision_id then return p_revision_id; end if;
    if v_revision.published_at is not null then raise exception 'revision_already_published' using errcode='23514'; end if;
    if v_current is not null and v_revision.revision<=(select revision from public.story_revisions where id=v_current) then
        raise exception 'revision_must_advance' using errcode='23514';
    end if;
    if btrim(v_revision.title)='' or btrim(v_revision.author)='' or btrim(v_revision.description)='' then
        raise exception 'story_metadata_incomplete' using errcode='23514';
    end if;
    select count(*) into v_count from public.story_sentences where revision_id=p_revision_id;
    if v_count=0 or exists(select 1 from public.story_sentences where revision_id=p_revision_id and (btrim(english)='' or btrim(turkish)=''))
        or (select max(position) from public.story_sentences where revision_id=p_revision_id)<>v_count then
        raise exception 'sentences_incomplete_or_unordered' using errcode='23514';
    end if;
    if exists(select 1 from public.revision_words where revision_id=p_revision_id and (btrim(word)='' or btrim(translation)='')) then
        raise exception 'word_translation_incomplete' using errcode='23514';
    end if;
    if not exists(select 1 from public.sentence_words where revision_id=p_revision_id) then
        raise exception 'learning_words_required' using errcode='23514';
    end if;
    perform 1 from public.content_assets where id in (v_revision.cover_asset_id,v_revision.audio_asset_id) for update;
    if not exists(select 1 from public.content_assets a join storage.objects o on o.bucket_id='story-media' and o.name=a.storage_path
        where a.id=v_revision.cover_asset_id and a.kind='cover') then
        raise exception 'cover_upload_required' using errcode='23514';
    end if;
    if v_revision.audio_asset_id is not null and not exists(select 1 from public.content_assets a join storage.objects o on o.bucket_id='story-media' and o.name=a.storage_path
        where a.id=v_revision.audio_asset_id and a.kind='audio') then
        raise exception 'audio_upload_required' using errcode='23514';
    end if;
    update public.story_revisions set published_at=now() where id=p_revision_id;
    update public.stories set current_revision_id=p_revision_id,is_archived=false where id=v_story;
    return p_revision_id;
end;
$$;
create function public.set_story_archived(p_story_id text,p_archived boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
    if not private.is_staff(true) then raise exception 'publisher_required' using errcode='42501'; end if;
    update public.stories set is_archived=p_archived where id=p_story_id;
    if not found then raise exception 'story_not_found' using errcode='22023'; end if;
end;
$$;
revoke all on function public.publish_story_revision(uuid), public.set_story_archived(text,boolean) from public, anon, authenticated;
grant execute on function public.publish_story_revision(uuid), public.set_story_archived(text,boolean) to authenticated;

commit;
