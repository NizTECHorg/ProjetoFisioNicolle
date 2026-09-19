-- REQ-23 Resumo IA. D-05 D-06. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP patient_sessions_* / can_*.
-- Nao DELETE FROM storage.objects. Nao reescrever private.can_read_patient / can_write_patient.
-- Bucket privado patient-ai-reports (application/pdf, 8 MiB). Tabela patient_ai_reports + RLS.

-- ---------------------------------------------------------------------------
-- Probe opcional. Nao e assercao. Rode sozinho se o INSERT do bucket falhar.
-- select id, name, public, file_size_limit, allowed_mime_types
-- from storage.buckets
-- where id = 'patient-ai-reports';
-- select column_name, is_nullable, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'patient_ai_reports'
-- order by ordinal_position;
-- Esperado apos Success: bucket privado com limite 8388608 e mime application/pdf;
-- tabela com kind, session_id nullable, session_label.
-- Se Storage estiver desligado, ligue no Dashboard e rode de novo.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Bucket privado patient-ai-reports (REQ-23.5, D-05). Nunca publico.
-- ON CONFLICT (id) DO NOTHING. Se um bucket leftover publico reusou este id,
-- corrija no Dashboard Storage — nao faca UPDATE para privado sem inspecionar.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-ai-reports',
  'patient-ai-reports',
  false,
  8388608,
  array['application/pdf']::text[]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. patient_ai_reports — metadados dos PDFs. Bytes ficam no Storage.
-- session_id ON DELETE SET NULL (Pitfall 5): apagar sessao nao apaga PDF.
-- session_label: denormalizado para listar apos delete da sessao.
-- kind XOR session_id: geral⇔null; sessao⇒session_id.
-- ---------------------------------------------------------------------------
create table if not exists public.patient_ai_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  session_id uuid references public.patient_sessions (id) on delete set null,
  kind text not null,
  storage_path text not null unique,
  byte_size bigint not null,
  mime_type text not null default 'application/pdf',
  session_label text null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint patient_ai_reports_kind_ck
    check (kind in ('geral', 'sessao')),
  -- geral nunca tem session_id. sessao pode ficar null apos ON DELETE SET NULL
  -- (Pitfall 5 — kind permanece 'sessao'; session_label denormalizado).
  -- XOR completo na criacao: Zod + INSERT WITH CHECK abaixo.
  constraint patient_ai_reports_kind_session_ck check (
    (kind = 'geral' and session_id is null)
    or (kind = 'sessao')
  ),
  constraint patient_ai_reports_mime_ck
    check (mime_type = 'application/pdf'),
  constraint patient_ai_reports_size_ck
    check (byte_size > 0 and byte_size <= 8388608),
  constraint patient_ai_reports_path_ck check (
    storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$'
  )
);

-- Colunas para schemas ja criados sem session_label (idempotente).
alter table public.patient_ai_reports
  add column if not exists session_label text null;

create index if not exists patient_ai_reports_patient_created_idx
  on public.patient_ai_reports (patient_id, created_at desc);

create index if not exists patient_ai_reports_session_idx
  on public.patient_ai_reports (session_id)
  where session_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Grants: authenticated le/insere/apaga. Sem anon. Sem UPDATE (upsert false).
-- ---------------------------------------------------------------------------
revoke all on table public.patient_ai_reports from anon, public;
grant select, insert, delete on table public.patient_ai_reports to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS. FORCE para o owner nao furar a parede.
-- Politicas so patient_ai_reports_*. Nao DROP can_*.
-- ---------------------------------------------------------------------------
alter table public.patient_ai_reports enable row level security;
alter table public.patient_ai_reports force row level security;

drop policy if exists patient_ai_reports_select on public.patient_ai_reports;
drop policy if exists patient_ai_reports_insert on public.patient_ai_reports;
drop policy if exists patient_ai_reports_delete on public.patient_ai_reports;

create policy patient_ai_reports_select
  on public.patient_ai_reports
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_ai_reports_insert
  on public.patient_ai_reports
  for insert
  to authenticated
  with check (
    (select private.can_write_patient(patient_id))
    and (
      (kind = 'geral' and session_id is null)
      or (
        kind = 'sessao'
        and session_id is not null
        and exists (
          select 1
          from public.patient_sessions s
          where s.id = session_id
            and s.patient_id = patient_ai_reports.patient_id
        )
      )
    )
  );

create policy patient_ai_reports_delete
  on public.patient_ai_reports
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

-- ---------------------------------------------------------------------------
-- 5. Storage RLS. Sempre bucket_id = 'patient-ai-reports'. Regex UUID antes de ::uuid.
-- Sem politica UPDATE (sem upsert). Nao DROP politicas de outros buckets.
-- ---------------------------------------------------------------------------
drop policy if exists patient_ai_reports_storage_select on storage.objects;
drop policy if exists patient_ai_reports_storage_insert on storage.objects;
drop policy if exists patient_ai_reports_storage_delete on storage.objects;

create policy patient_ai_reports_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'patient-ai-reports'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_read_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_ai_reports_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'patient-ai-reports'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_ai_reports_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'patient-ai-reports'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

-- ---------------------------------------------------------------------------
-- 6. Recarrega o schema do PostgREST (opcional; idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success) — D-05 / REQ-23.5:
-- 1. Storage → Buckets → patient-ai-reports: Public = off, MIME application/pdf
-- 2. Tabela public.patient_ai_reports com kind, session_id, session_label, storage_path
-- 3. creator SELECT empty table ok; INSERT/DELETE own patient ok
-- 4. empresa SELECT colleague ok; INSERT colleague → 42501
-- 5. kind='geral' com session_id NOT NULL → CHECK fail
-- 6. kind='sessao' com session_id NULL → CHECK fail
-- 7. Phase 3 can_* helpers unchanged
-- ---------------------------------------------------------------------------
