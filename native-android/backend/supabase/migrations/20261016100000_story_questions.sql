begin;

-- One-dimensional arrays with a zero-based answer index at the API boundary.
create function private.valid_question_options(p_options text[]) returns boolean
language sql immutable set search_path = '' as $$
    select coalesce(array_ndims(p_options)=1 and array_lower(p_options,1)=1
        and cardinality(p_options) between 2 and 4
        and not exists(select 1 from unnest(p_options) o where o is null or o !~ '[^[:space:]]')
        and (select count(distinct lower(regexp_replace(o,'^[[:space:]]+|[[:space:]]+$','','g'))) from unnest(p_options) o)=cardinality(p_options),false);
$$;
revoke all on function private.valid_question_options(text[]) from public,anon,authenticated;
grant execute on function private.valid_question_options(text[]) to anon,authenticated;

create table public.story_questions (
    revision_id uuid not null references public.story_revisions(id) on delete cascade,
    id text not null check (length(id) between 1 and 100),
    position integer not null check (position>0),
    kind text not null check (kind in ('main','detail','inference')),
    prompt text not null check (prompt ~ '[^[:space:]]'),
    options text[] not null check (private.valid_question_options(options)),
    answer smallint not null check (answer between 0 and array_length(options,1)-1),
    primary key (revision_id,id),
    unique (revision_id,position)
);
alter table public.story_questions enable row level security;
revoke all on public.story_questions from public,anon,authenticated;
grant select on public.story_questions to anon,authenticated;
grant insert,update,delete on public.story_questions to authenticated;
create policy question_read on public.story_questions for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy question_write on public.story_questions for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));
create trigger immutable_questions before insert or update or delete on public.story_questions for each row execute function private.guard_revision_child();
create trigger question_version after insert or update or delete on public.story_questions for each row execute function private.bump_child_version();

-- Both publication RPCs use the parent update, protected by the same row lock.
create function private.check_revision_questions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if OLD.published_at is null and NEW.published_at is not null then
        if exists(select 1 from (
            select position,row_number() over(order by position) expected
            from public.story_questions where revision_id=NEW.id
        ) q where position<>expected) then
            raise exception 'questions_non_contiguous' using errcode='23514';
        end if;
    end if;
    return NEW;
end;
$$;
revoke all on function private.check_revision_questions() from public,anon,authenticated;
create trigger publication_questions before update on public.story_revisions for each row execute function private.check_revision_questions();

create or replace function public.admin_revision(p_revision_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
    if not private.is_staff() then raise exception 'staff_required' using errcode='42501'; end if;
    select to_jsonb(r)||jsonb_build_object(
        'is_archived',s.is_archived,'current_revision_id',s.current_revision_id,
        'descriptions',coalesce((select jsonb_object_agg(lang,description) from public.revision_texts where revision_id=r.id),'{}'::jsonb),
        'sentences',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('translations',coalesce((select jsonb_object_agg(lang,text) from public.sentence_translations where revision_id=t.revision_id and sentence_id=t.id),'{}'::jsonb)) order by position) from public.story_sentences t where revision_id=r.id),'[]'::jsonb),
        'words',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('translations',coalesce((select jsonb_object_agg(lang,translation) from public.word_translations where revision_id=t.revision_id and word_id=t.id),'{}'::jsonb)) order by word,id) from public.revision_words t where revision_id=r.id),'[]'::jsonb),
        'questions',coalesce((select jsonb_agg(to_jsonb(q) order by position) from public.story_questions q where revision_id=r.id),'[]'::jsonb),
        'links',coalesce((select jsonb_agg(to_jsonb(t) order by sentence_id,word_id) from public.sentence_words t where revision_id=r.id),'[]'::jsonb),
        'cover',(select to_jsonb(a) from public.content_assets a where a.id=r.cover_asset_id),
        'audio',(select to_jsonb(a) from public.content_assets a where a.id=r.audio_asset_id)
    ) into v_result from public.story_revisions r join public.stories s on s.id=r.story_id where r.id=p_revision_id;
    if v_result is null then raise exception 'revision_not_found' using errcode='22023'; end if;
    return v_result;
end;
$$;
create or replace function public.admin_create_draft(p_story_id text,p_source_id uuid default null) returns jsonb
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
        insert into public.story_questions select v_id,id,position,kind,prompt,options,answer from public.story_questions where revision_id=p_source_id;
        insert into public.sentence_translations select v_id,sentence_id,lang,text from public.sentence_translations where revision_id=p_source_id and lang<>'tr';
        insert into public.word_translations select v_id,word_id,lang,translation from public.word_translations where revision_id=p_source_id and lang<>'tr';
        insert into public.revision_texts select v_id,lang,description from public.revision_texts where revision_id=p_source_id and lang<>'tr';
    else
        insert into public.story_revisions(id,story_id,revision,level,genre) values(v_id,p_story_id,v_number,'A1','Günlük yaşam');
    end if;
    return public.admin_revision(v_id);
end;
$$;
create or replace function public.admin_save_draft(p_revision_id uuid,p_expected_version integer,p_document jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_revision public.story_revisions%rowtype; v_previous jsonb;
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
    if p_document ? 'questions' then
        if jsonb_typeof(p_document->'questions') is distinct from 'array' then
            raise exception 'questions_invalid' using errcode='22023';
        end if;
        if exists(select 1 from jsonb_array_elements(p_document->'questions') q
            where jsonb_typeof(q) is distinct from 'object'
            or jsonb_typeof(q->'id') is distinct from 'string'
            or jsonb_typeof(q->'kind') is distinct from 'string'
            or jsonb_typeof(q->'prompt') is distinct from 'string'
            or jsonb_typeof(q->'options') is distinct from 'array'
            or jsonb_typeof(q->'answer') is distinct from 'number'
            or (q->>'answer') !~ '^[0-9]+$') then
            raise exception 'questions_invalid' using errcode='22023';
        end if;
        if exists(select 1 from jsonb_array_elements(p_document->'questions') q,
            lateral jsonb_array_elements(q->'options') o where jsonb_typeof(o)<>'string') then
            raise exception 'questions_invalid' using errcode='22023';
        end if;
    end if;
    v_previous:=public.admin_revision(p_revision_id);
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
    if p_document ? 'questions' then
        delete from public.story_questions where revision_id=p_revision_id;
        insert into public.story_questions(revision_id,id,position,kind,prompt,options,answer)
            select p_revision_id,q->>'id',n::integer,q->>'kind',q->>'prompt',
                array(select jsonb_array_elements_text(q->'options')),(q->>'answer')::smallint
            from jsonb_array_elements(p_document->'questions') with ordinality as t(q,n);
    end if;
    perform private.save_translation_maps(p_revision_id,p_document,v_previous);
    return public.admin_revision(p_revision_id);
end;
$$;
commit;
