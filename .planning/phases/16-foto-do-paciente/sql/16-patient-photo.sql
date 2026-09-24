-- Foto do paciente. D-01 D-04. Idempotente. Cole no SQL Editor do Supabase.
-- Nao aplique pelo CLI. Nao DROP can_*.
-- Nao DELETE FROM storage.objects. Nao reescrever private.can_read_patient / can_write_patient.
-- Nao DROP politicas da galeria. Bucket privado patient-avatars (jpeg/png, 2 MiB).
-- patients.photo_path nullable. patients_update ja usa can_write_patient — nao criar policy em public.patients.

-- ---------------------------------------------------------------------------
-- 1. Bucket privado patient-avatars. Nunca publico.
-- ON CONFLICT (id) DO NOTHING. Se um leftover publico reusou este id,
-- corrija no Dashboard Storage — nao faca UPDATE para privado sem inspecionar.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-avatars',
  'patient-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png']::text[]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Ponteiro da foto. Null mantem iniciais e photo_tone (D-01).
-- CHECK amarra a pasta ao patients.id e so aceita .jpg ou .png.
-- ---------------------------------------------------------------------------
alter table public.patients
  add column if not exists photo_path text;

alter table public.patients
  drop constraint if exists patients_photo_path_shape;

alter table public.patients
  add constraint patients_photo_path_shape
  check (
    photo_path is null
    or (
      split_part(photo_path, '/', 1) = id::text
      and photo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Storage RLS. Sempre bucket_id = 'patient-avatars'. Regex UUID antes de ::uuid.
-- Sem politica UPDATE (sem upsert). Sem politica para anon.
-- Nao DROP politicas de outros buckets.
-- ---------------------------------------------------------------------------
drop policy if exists patient_avatars_storage_select on storage.objects;
drop policy if exists patient_avatars_storage_insert on storage.objects;
drop policy if exists patient_avatars_storage_delete on storage.objects;

create policy patient_avatars_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$'
    and (select private.can_read_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_avatars_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_avatars_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

-- ---------------------------------------------------------------------------
-- 4. Recarrega o schema do PostgREST (opcional; idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success):
-- 1. bucket privado, file_size_limit 2097152, mime somente jpeg e png
-- 2. photo_path nullable; linhas existentes permanecem null
-- 3. author INSERT object e UPDATE photo_path ok
-- 4. author DELETE object depois de photo_path null ok
-- 5. empresa SELECT e signed URL ok; INSERT e UPDATE falham
-- 6. upload webp ou heic falha
-- 7. politicas da galeria e helpers can_* permanecem inalterados
-- ---------------------------------------------------------------------------
