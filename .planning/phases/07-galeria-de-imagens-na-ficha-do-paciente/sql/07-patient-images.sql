-- REQ-19 galeria de imagens. D-06 D-07 D-11. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP patient_sessions_* / can_*.
-- Nao DELETE FROM storage.objects. Nao reescrever private.can_read_patient / can_write_patient.
-- Bucket privado patient-images (jpeg/png/webp, 8 MiB). Tabela patient_images + RLS + trigger D-07.

-- ---------------------------------------------------------------------------
-- Probe opcional (A1). Nao e assercao. Rode sozinho se o INSERT do bucket falhar.
-- select id, name, public, file_size_limit, allowed_mime_types
-- from storage.buckets
-- where id = 'patient-images';
-- select column_name, is_nullable, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'patient_images'
-- order by ordinal_position;
-- Esperado apos Success: bucket privado com limite 8388608 e mime jpeg/png/webp;
-- tabela com session_id nullable e session_removed boolean.
-- Se Storage estiver desligado, ligue no Dashboard e rode de novo.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Bucket privado patient-images (REQ-19.5, Pitfall 1). Nunca publico.
-- ON CONFLICT (id) DO NOTHING. Se um bucket leftover publico reusou este id,
-- corrija no Dashboard Storage — nao faca UPDATE para privado sem inspecionar.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-images',
  'patient-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. patient_images — metadados da galeria. Bytes ficam no Storage.
-- session_id ON DELETE SET NULL (D-06): apagar sessao nao apaga foto.
-- session_removed (D-07): distingue avulsa-original de orfa de sessao.
-- ---------------------------------------------------------------------------
create table if not exists public.patient_images (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  session_id uuid references public.patient_sessions (id) on delete set null,
  storage_path text not null unique,
  description text not null default '',
  mime_type text not null,
  byte_size integer not null,
  session_removed boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint patient_images_mime_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint patient_images_size_check
    check (byte_size > 0 and byte_size <= 8388608),
  constraint patient_images_path_check
    check (storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$')
);

alter table public.patient_images
  add column if not exists session_removed boolean not null default false;

create index if not exists patient_images_patient_created_idx
  on public.patient_images (patient_id, created_at desc);

create index if not exists patient_images_session_idx
  on public.patient_images (session_id)
  where session_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Grants: authenticated le/escreve/apaga. Sem anon.
-- ---------------------------------------------------------------------------
revoke all on table public.patient_images from anon, public;
grant select, insert, update, delete on table public.patient_images to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS. FORCE para o owner nao furar a parede (Phase 5 analog).
-- Politicas so patient_images_*. Nao DROP patient_sessions_* / can_*.
-- ---------------------------------------------------------------------------
alter table public.patient_images enable row level security;
alter table public.patient_images force row level security;

drop policy if exists patient_images_select on public.patient_images;
drop policy if exists patient_images_insert on public.patient_images;
drop policy if exists patient_images_update on public.patient_images;
drop policy if exists patient_images_delete on public.patient_images;

create policy patient_images_select
  on public.patient_images
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_images_insert
  on public.patient_images
  for insert
  to authenticated
  with check (
    (select private.can_write_patient(patient_id))
    and (
      session_id is null
      or exists (
        select 1
        from public.patient_sessions s
        where s.id = session_id
          and s.patient_id = patient_images.patient_id
      )
    )
  );

create policy patient_images_update
  on public.patient_images
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check (
    (select private.can_write_patient(patient_id))
    and (
      session_id is null
      or exists (
        select 1
        from public.patient_sessions s
        where s.id = session_id
          and s.patient_id = patient_images.patient_id
      )
    )
  );

create policy patient_images_delete
  on public.patient_images
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

-- ---------------------------------------------------------------------------
-- 5. D-07: BEFORE DELETE em patient_sessions marca session_removed.
-- Nao usar UPDATE OF session_id em patient_images (Editar avulsa limpa a flag
-- no cliente). RETURN OLD deixa o FK SET NULL rodar. Fotos permanecem (D-06).
-- ---------------------------------------------------------------------------
create or replace function private.patient_images_on_session_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.patient_images
  set session_removed = true
  where session_id = OLD.id;
  return OLD;
end;
$$;

revoke execute on function private.patient_images_on_session_delete() from public, anon;

drop trigger if exists patient_images_on_session_delete on public.patient_sessions;
create trigger patient_images_on_session_delete
  before delete on public.patient_sessions
  for each row
  execute function private.patient_images_on_session_delete();

-- ---------------------------------------------------------------------------
-- 6. Storage RLS. Sempre bucket_id = 'patient-images'. Regex UUID antes de ::uuid
-- (Pitfall 3). Sem politica UPDATE (sem upsert). Nao DROP politicas de outros buckets.
-- ---------------------------------------------------------------------------
drop policy if exists patient_images_storage_select on storage.objects;
drop policy if exists patient_images_storage_insert on storage.objects;
drop policy if exists patient_images_storage_delete on storage.objects;

create policy patient_images_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_read_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_images_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_images_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

-- ---------------------------------------------------------------------------
-- 7. Recarrega o schema do PostgREST (opcional; idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success) — RESEARCH checklist + D-06/D-07:
-- 1. creator INSERT own patient_images + upload path ok (creator CRUD)
-- 2. creator UPDATE description ok
-- 3. creator DELETE row after storage.remove ok
-- 4. session_id of another patient → WITH CHECK fail
-- 5. other authenticated INSERT colleague patient_id → 42501
-- 6. empresa SELECT colleague rows + createSignedUrl ok
-- 7. empresa INSERT/DELETE colleague → 42501
-- 8. MIME image/heic or image/svg+xml → bucket or CHECK reject (HEIC reject)
-- 9. Phase 3 patient_sessions_* / can_* helpers unchanged
-- 10. delete sessao → session_id null and session_removed true; photos remain (D-06, D-07 orphan flag)
-- 11. avulsa-original stays session_removed false
-- ---------------------------------------------------------------------------
