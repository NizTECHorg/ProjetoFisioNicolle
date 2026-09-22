-- REQ: anexar PDF na aba Imagens (patient_images). Idempotente. Cole no SQL Editor.
-- NÃO use supabase db push. NÃO DROP can_*. NÃO DELETE storage.objects.
-- Estende MIME + path CHECK para application/pdf (.pdf). Mantém jpeg/png/webp.

-- 1. Bucket: incluir PDF no allow-list (UPDATE explícito — ON CONFLICT DO NOTHING não atualiza).
update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[],
  file_size_limit = 8388608
where id = 'patient-images';

-- 2. Tabela: MIME + extensão de path.
alter table public.patient_images
  drop constraint if exists patient_images_mime_check;

alter table public.patient_images
  add constraint patient_images_mime_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'));

alter table public.patient_images
  drop constraint if exists patient_images_path_check;

alter table public.patient_images
  add constraint patient_images_path_check
  check (
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|pdf)$'
  );

notify pgrst, 'reload schema';
