-- REQ-24 Avaliações musculoesqueléticas. D-05. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao reescrever private.can_read_patient / can_write_patient.
-- Nao DROP policies existentes em patient_evaluations. Nao DROP colunas legacy de texto.
-- Coluna ficha jsonb: documento clínico páginas 01–04 (anamnese/sintomas/funcao/avaliacaoPlano).

-- ---------------------------------------------------------------------------
-- Probe opcional. Nao e assercao. Rode sozinho apos Success para confirmar.
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'patient_evaluations'
--   and column_name = 'ficha';
-- Esperado: data_type = jsonb, is_nullable = NO, default '{}'::jsonb.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. patient_evaluations.ficha — documento JSONB (REQ-24, D-05).
-- ADD COLUMN IF NOT EXISTS: seguro reaplicar. Colunas legacy permanecem.
-- RLS existente (can_read_patient / can_write_patient) cobre a coluna nova.
-- ---------------------------------------------------------------------------
alter table public.patient_evaluations
  add column if not exists ficha jsonb not null default '{}'::jsonb;

comment on column public.patient_evaluations.ficha is
  'Documento clínico musculoesquelético (páginas 01–04). Default {}.';
