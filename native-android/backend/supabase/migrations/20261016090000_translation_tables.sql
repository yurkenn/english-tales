begin;

create table public.sentence_translations (
    revision_id uuid not null,
    sentence_id text not null,
    lang text not null check (lang ~ '^[a-z]{2}(-[0-9A-Z]{2,3})?$'),
    text text not null check (btrim(text)<>''),
    primary key (revision_id,sentence_id,lang),
    foreign key (revision_id,sentence_id) references public.story_sentences(revision_id,id) on delete cascade
);
create table public.word_translations (
    revision_id uuid not null,
    word_id text not null,
    lang text not null check (lang ~ '^[a-z]{2}(-[0-9A-Z]{2,3})?$'),
    translation text not null check (btrim(translation)<>''),
    primary key (revision_id,word_id,lang),
    foreign key (revision_id,word_id) references public.revision_words(revision_id,id) on delete cascade
);
create table public.revision_texts (
    revision_id uuid not null references public.story_revisions(id) on delete cascade,
    lang text not null check (lang ~ '^[a-z]{2}(-[0-9A-Z]{2,3})?$'),
    description text not null check (btrim(description)<>''),
    primary key (revision_id,lang)
);
create index sentence_translations_language on public.sentence_translations(revision_id,lang,sentence_id);
create index word_translations_language on public.word_translations(revision_id,lang,word_id);
create index revision_texts_language on public.revision_texts(lang,revision_id);

-- Existing drafts may contain blank fields. Absence represents unfinished work.
-- Backfill before attaching immutability/version triggers, including published history.
insert into public.sentence_translations select revision_id,id,'tr',turkish from public.story_sentences where btrim(turkish)<>'';
insert into public.word_translations select revision_id,id,'tr',translation from public.revision_words where btrim(translation)<>'';
insert into public.revision_texts select id,'tr',description from public.story_revisions where btrim(description)<>'';

alter table public.sentence_translations enable row level security;
alter table public.word_translations enable row level security;
alter table public.revision_texts enable row level security;
revoke all on public.sentence_translations,public.word_translations,public.revision_texts from public,anon,authenticated;
grant select on public.sentence_translations,public.word_translations,public.revision_texts to anon,authenticated;
grant insert,update,delete on public.sentence_translations,public.word_translations,public.revision_texts to authenticated;
create policy sentence_translation_read on public.sentence_translations for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy sentence_translation_write on public.sentence_translations for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));
create policy word_translation_read on public.word_translations for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy word_translation_write on public.word_translations for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));
create policy revision_text_read on public.revision_texts for select to anon,authenticated using (private.can_read_revision(revision_id));
create policy revision_text_write on public.revision_texts for all to authenticated using (private.can_edit_revision(revision_id)) with check (private.can_edit_revision(revision_id));

create trigger immutable_sentence_translations before insert or update or delete on public.sentence_translations for each row execute function private.guard_revision_child();
create trigger immutable_word_translations before insert or update or delete on public.word_translations for each row execute function private.guard_revision_child();
create trigger immutable_revision_texts before insert or update or delete on public.revision_texts for each row execute function private.guard_revision_child();
create trigger sentence_translation_version after insert or update or delete on public.sentence_translations for each row execute function private.bump_child_version();
create trigger word_translation_version after insert or update or delete on public.word_translations for each row execute function private.bump_child_version();
create trigger revision_text_version after insert or update or delete on public.revision_texts for each row execute function private.bump_child_version();

-- Legacy Turkish fields remain authoritative for released clients and the panel.
create function private.sync_legacy_translation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    if TG_TABLE_NAME='story_sentences' then
        if btrim(NEW.turkish)='' then
            delete from public.sentence_translations where revision_id=NEW.revision_id and sentence_id=NEW.id and lang='tr';
        else
            insert into public.sentence_translations values(NEW.revision_id,NEW.id,'tr',NEW.turkish)
                on conflict(revision_id,sentence_id,lang) do update set text=excluded.text
                where sentence_translations.text is distinct from excluded.text;
        end if;
    elsif TG_TABLE_NAME='revision_words' then
        if btrim(NEW.translation)='' then
            delete from public.word_translations where revision_id=NEW.revision_id and word_id=NEW.id and lang='tr';
        else
            insert into public.word_translations values(NEW.revision_id,NEW.id,'tr',NEW.translation)
                on conflict(revision_id,word_id,lang) do update set translation=excluded.translation
                where word_translations.translation is distinct from excluded.translation;
        end if;
    else
        if btrim(NEW.description)='' then
            delete from public.revision_texts where revision_id=NEW.id and lang='tr';
        else
            insert into public.revision_texts values(NEW.id,'tr',NEW.description)
                on conflict(revision_id,lang) do update set description=excluded.description
                where revision_texts.description is distinct from excluded.description;
        end if;
    end if;
    return null;
end;
$$;
create trigger legacy_sentence_translation after insert or update of turkish on public.story_sentences for each row execute function private.sync_legacy_translation();
create trigger legacy_word_translation after insert or update of translation on public.revision_words for each row execute function private.sync_legacy_translation();
create trigger legacy_revision_text after insert or update of description on public.story_revisions for each row execute function private.sync_legacy_translation();

create function private.guard_turkish_translation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_legacy text; v_value text;
begin
    if NEW.lang='tr' then
        if TG_TABLE_NAME='sentence_translations' then
            select turkish into v_legacy from public.story_sentences where revision_id=NEW.revision_id and id=NEW.sentence_id;
            v_value:=NEW.text;
        elsif TG_TABLE_NAME='word_translations' then
            select translation into v_legacy from public.revision_words where revision_id=NEW.revision_id and id=NEW.word_id;
            v_value:=NEW.translation;
        else
            select description into v_legacy from public.story_revisions where id=NEW.revision_id;
            v_value:=NEW.description;
        end if;
        if v_value is distinct from v_legacy then
            raise exception 'turkish_translation_must_match_legacy' using errcode='23514';
        end if;
    end if;
    return NEW;
end;
$$;
create trigger turkish_sentence_translation before insert or update on public.sentence_translations for each row execute function private.guard_turkish_translation();
create trigger turkish_word_translation before insert or update on public.word_translations for each row execute function private.guard_turkish_translation();
create trigger turkish_revision_text before insert or update on public.revision_texts for each row execute function private.guard_turkish_translation();

-- Both publication RPCs eventually update published_at under the parent lock.
create function private.check_revision_translations() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_lang text; v_sentences integer; v_words integer; v_description integer;
begin
    if OLD.published_at is null and NEW.published_at is not null then
        for v_lang in
            select 'tr' union select lang from public.sentence_translations where revision_id=NEW.id
            union select lang from public.word_translations where revision_id=NEW.id
            union select lang from public.revision_texts where revision_id=NEW.id
        loop
            select count(*) into v_sentences from public.story_sentences s
                left join public.sentence_translations t on t.revision_id=s.revision_id and t.sentence_id=s.id and t.lang=v_lang
                where s.revision_id=NEW.id and (t.text is null or (v_lang='tr' and t.text is distinct from s.turkish));
            select count(*) into v_words from public.revision_words w
                left join public.word_translations t on t.revision_id=w.revision_id and t.word_id=w.id and t.lang=v_lang
                where w.revision_id=NEW.id and (t.translation is null or (v_lang='tr' and t.translation is distinct from w.translation));
            select count(*) into v_description from (select 1) x where not exists(
                select 1 from public.revision_texts t where t.revision_id=NEW.id and t.lang=v_lang
                and (v_lang<>'tr' or t.description=NEW.description));
            if v_sentences+v_words+v_description>0 then
                raise exception 'revision_translations_incomplete: lang=%, sentences=%, words=%, description=%',
                    v_lang,v_sentences,v_words,v_description using errcode='23514';
            end if;
        end loop;
    end if;
    return NEW;
end;
$$;
create trigger publication_translations before update on public.story_revisions for each row execute function private.check_revision_translations();
revoke all on function private.sync_legacy_translation(),private.guard_turkish_translation(),private.check_revision_translations() from public,anon,authenticated;

-- Optional maps replace that entity's extra translations; omitted maps preserve them.
create function private.save_translation_maps(p_id uuid,p_document jsonb,p_previous jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare v_entity jsonb; v_map jsonb; v_pair record;
begin
    v_map:=coalesce(p_document->'descriptions',p_previous->'descriptions','{}'::jsonb);
    if jsonb_typeof(v_map)<>'object' then raise exception 'translation_map_invalid' using errcode='22023'; end if;
    delete from public.revision_texts where revision_id=p_id and lang<>'tr';
    for v_pair in select * from jsonb_each(v_map) where key<>'tr' loop
        if jsonb_typeof(v_pair.value)<>'string' then raise exception 'translation_map_invalid' using errcode='22023'; end if;
        insert into public.revision_texts values(p_id,v_pair.key,v_pair.value#>>'{}');
    end loop;
    for v_entity in select * from jsonb_array_elements(p_document->'sentences') loop
        v_map:=coalesce(v_entity->'translations',(select x->'translations' from jsonb_array_elements(p_previous->'sentences') x where x->>'id'=v_entity->>'id'),'{}'::jsonb);
        if jsonb_typeof(v_map)<>'object' then raise exception 'translation_map_invalid' using errcode='22023'; end if;
        for v_pair in select * from jsonb_each(v_map) where key<>'tr' loop
            if jsonb_typeof(v_pair.value)<>'string' then raise exception 'translation_map_invalid' using errcode='22023'; end if;
            insert into public.sentence_translations values(p_id,v_entity->>'id',v_pair.key,v_pair.value#>>'{}');
        end loop;
    end loop;
    for v_entity in select * from jsonb_array_elements(p_document->'words') loop
        v_map:=coalesce(v_entity->'translations',(select x->'translations' from jsonb_array_elements(p_previous->'words') x where x->>'id'=v_entity->>'id'),'{}'::jsonb);
        if jsonb_typeof(v_map)<>'object' then raise exception 'translation_map_invalid' using errcode='22023'; end if;
        for v_pair in select * from jsonb_each(v_map) where key<>'tr' loop
            if jsonb_typeof(v_pair.value)<>'string' then raise exception 'translation_map_invalid' using errcode='22023'; end if;
            insert into public.word_translations values(p_id,v_entity->>'id',v_pair.key,v_pair.value#>>'{}');
        end loop;
    end loop;
end;
$$;
revoke all on function private.save_translation_maps(uuid,jsonb,jsonb) from public,anon,authenticated;

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
    perform private.save_translation_maps(p_revision_id,p_document,v_previous);
    return public.admin_revision(p_revision_id);
end;
$$;
commit;
