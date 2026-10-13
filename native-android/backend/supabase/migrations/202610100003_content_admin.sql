begin;
alter table public.story_revisions add column edit_version integer not null default 1;

create function private.bump_revision_version() returns trigger
language plpgsql set search_path = '' as $$
begin NEW.edit_version:=OLD.edit_version+1; return NEW; end;
$$;
create trigger revision_version before update on public.story_revisions for each row execute function private.bump_revision_version();
create function private.bump_child_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if TG_OP<>'INSERT' then update public.story_revisions set edit_version=edit_version where id=OLD.revision_id; end if;
    if TG_OP<>'DELETE' and (TG_OP='INSERT' or NEW.revision_id<>OLD.revision_id) then
        update public.story_revisions set edit_version=edit_version where id=NEW.revision_id;
    end if;
    return null;
end;
$$;
create trigger sentence_version after insert or update or delete on public.story_sentences for each row execute function private.bump_child_version();
create trigger word_version after insert or update or delete on public.revision_words for each row execute function private.bump_child_version();
create trigger link_version after insert or update or delete on public.sentence_words for each row execute function private.bump_child_version();
revoke all on function private.bump_revision_version(),private.bump_child_version() from public,anon,authenticated;

create function public.content_role() returns text
language sql stable security definer set search_path = '' as $$
    select role from private.content_staff where user_id=auth.uid();
$$;
create function public.admin_catalog(p_offset integer default 0,p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    return coalesce((select jsonb_agg(to_jsonb(q)) from (
        select r.*,s.is_archived,s.current_revision_id,a.storage_path as cover_path
        from public.story_revisions r join public.stories s on s.id=r.story_id
        left join public.content_assets a on a.id=r.cover_asset_id
        order by r.created_at desc,r.story_id,r.revision desc
        offset greatest(p_offset,0) limit least(greatest(p_limit,1),100)
    ) q),'[]'::jsonb);
end;
$$;
create function public.admin_revision(p_revision_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    select to_jsonb(r)||jsonb_build_object(
        'is_archived',s.is_archived,'current_revision_id',s.current_revision_id,
        'sentences',coalesce((select jsonb_agg(to_jsonb(t) order by position) from public.story_sentences t where revision_id=r.id),'[]'::jsonb),
        'words',coalesce((select jsonb_agg(to_jsonb(t) order by word,id) from public.revision_words t where revision_id=r.id),'[]'::jsonb),
        'links',coalesce((select jsonb_agg(to_jsonb(t) order by sentence_id,word_id) from public.sentence_words t where revision_id=r.id),'[]'::jsonb),
        'cover',(select to_jsonb(a) from public.content_assets a where a.id=r.cover_asset_id),
        'audio',(select to_jsonb(a) from public.content_assets a where a.id=r.audio_asset_id)
    ) into v_result from public.story_revisions r join public.stories s on s.id=r.story_id where r.id=p_revision_id;
    if v_result is null then raise exception 'revision_not_found' using errcode='22023'; end if;
    return v_result;
end;
$$;
create function public.admin_create_draft(p_story_id text,p_source_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_number integer; v_source public.story_revisions%rowtype;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    insert into public.stories(id) values(p_story_id) on conflict do nothing;
    perform 1 from public.stories where id=p_story_id for update;
    select id into v_id from public.story_revisions where story_id=p_story_id and published_at is null order by revision desc limit 1;
    if v_id is not null then return public.admin_revision(v_id); end if;
    select coalesce(max(revision),0)+1 into v_number from public.story_revisions where story_id=p_story_id;
    v_id:=gen_random_uuid();
    if p_source_id is not null then
        select * into v_source from public.story_revisions where id=p_source_id and story_id=p_story_id and published_at is not null;
        if not found then raise exception 'published_source_required' using errcode='22023'; end if;
        insert into public.story_revisions(id,story_id,revision,title,author,level,genre,description,cover_asset_id,audio_asset_id)
        values(v_id,p_story_id,v_number,v_source.title,v_source.author,v_source.level,v_source.genre,v_source.description,v_source.cover_asset_id,v_source.audio_asset_id);
        insert into public.story_sentences select v_id,id,position,english,turkish from public.story_sentences where revision_id=p_source_id;
        insert into public.revision_words select v_id,id,word,translation,pronunciation,example from public.revision_words where revision_id=p_source_id;
        insert into public.sentence_words select v_id,sentence_id,word_id from public.sentence_words where revision_id=p_source_id;
    else
        insert into public.story_revisions(id,story_id,revision,level,genre) values(v_id,p_story_id,v_number,'A1','Günlük yaşam');
    end if;
    return public.admin_revision(v_id);
end;
$$;
create function public.admin_save_draft(p_revision_id uuid,p_expected_version integer,p_document jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_revision public.story_revisions%rowtype;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    select * into v_revision from public.story_revisions where id=p_revision_id for update;
    if not found then raise exception 'revision_not_found' using errcode='22023'; end if;
    if v_revision.published_at is not null then raise exception 'published_revision_is_immutable' using errcode='23514'; end if;
    if p_expected_version is distinct from v_revision.edit_version then raise exception 'draft_version_conflict' using errcode='40001'; end if;
    if jsonb_typeof(p_document) is distinct from 'object'
        or jsonb_typeof(p_document->'sentences') is distinct from 'array'
        or jsonb_typeof(p_document->'words') is distinct from 'array'
        or jsonb_typeof(p_document->'links') is distinct from 'array' then
        raise exception 'draft_document_invalid' using errcode='22023';
    end if;
    if jsonb_array_length(p_document->'sentences')>500 or jsonb_array_length(p_document->'words')>500
        or jsonb_array_length(p_document->'links')>5000 or octet_length(p_document::text)>2097152 then
        raise exception 'draft_document_too_large' using errcode='22023';
    end if;
    if exists(select 1 from jsonb_array_elements(p_document->'sentences') x where coalesce(x->>'id','')='' or length(x->>'id')>128
        or length(coalesce(x->>'english',''))>4000 or length(coalesce(x->>'turkish',''))>4000)
        or exists(select 1 from jsonb_array_elements(p_document->'words') x where coalesce(x->>'id','')='' or length(x->>'id')>128
            or length(coalesce(x->>'word',''))>100 or length(coalesce(x->>'translation',''))>1000
            or length(coalesce(x->>'pronunciation',''))>200 or length(coalesce(x->>'example',''))>4000)
        or length(coalesce(p_document->>'title',''))>200 or length(coalesce(p_document->>'author',''))>200
        or length(coalesce(p_document->>'description',''))>4000 then
        raise exception 'draft_fields_invalid' using errcode='22023';
    end if;
    update public.story_revisions set title=coalesce(p_document->>'title',''),author=coalesce(p_document->>'author',''),
        description=coalesce(p_document->>'description',''),level=p_document->>'level',genre=p_document->>'genre',
        cover_asset_id=nullif(p_document->>'cover_asset_id','')::uuid,audio_asset_id=nullif(p_document->>'audio_asset_id','')::uuid
        where id=p_revision_id;
    delete from public.sentence_words where revision_id=p_revision_id;
    delete from public.story_sentences where revision_id=p_revision_id;
    delete from public.revision_words where revision_id=p_revision_id;
    insert into public.story_sentences(revision_id,id,position,english,turkish)
        select p_revision_id,x->>'id',n::integer,coalesce(x->>'english',''),coalesce(x->>'turkish','')
        from jsonb_array_elements(p_document->'sentences') with ordinality as t(x,n);
    insert into public.revision_words(revision_id,id,word,translation,pronunciation,example)
        select p_revision_id,x->>'id',coalesce(x->>'word',''),coalesce(x->>'translation',''),coalesce(x->>'pronunciation',''),coalesce(x->>'example','')
        from jsonb_array_elements(p_document->'words') x;
    insert into public.sentence_words(revision_id,sentence_id,word_id)
        select p_revision_id,x->>'sentence_id',x->>'word_id' from jsonb_array_elements(p_document->'links') x;
    return public.admin_revision(p_revision_id);
end;
$$;
create function public.admin_publish(p_revision_id uuid,p_expected_version integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_story text; v_version integer;
begin
    if not private.is_staff(true) then raise exception 'publisher_required' using errcode='42501'; end if;
    select story_id into v_story from public.story_revisions where id=p_revision_id;
    perform 1 from public.stories where id=v_story for update;
    select edit_version into v_version from public.story_revisions where id=p_revision_id for update;
    if not found then raise exception 'revision_not_found' using errcode='22023'; end if;
    if p_expected_version is distinct from v_version then raise exception 'draft_version_conflict' using errcode='40001'; end if;
    return public.publish_story_revision(p_revision_id);
end;
$$;
revoke all on function public.content_role(),public.admin_catalog(integer,integer),public.admin_revision(uuid),public.admin_create_draft(text,uuid),public.admin_save_draft(uuid,integer,jsonb),public.admin_publish(uuid,integer) from public,anon,authenticated;
grant execute on function public.content_role(),public.admin_catalog(integer,integer),public.admin_revision(uuid),public.admin_create_draft(text,uuid),public.admin_save_draft(uuid,integer,jsonb),public.admin_publish(uuid,integer) to authenticated;
commit;
