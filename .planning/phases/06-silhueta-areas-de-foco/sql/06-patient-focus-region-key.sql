-- REQ-18 silhueta de areas de foco. D-08 D-09. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP patient_focus_areas_*. Nao CREATE TABLE.
-- Nao SET NOT NULL em region_key. Nao backfill a partir de label.
-- Identidade estavel da silhueta (frente/costas compartilham labels). Zod trava o catalogo.
-- Politicas Phase 3 (select/insert/update/delete) ficam intactas.

-- ---------------------------------------------------------------------------
-- Probe opcional (A1). Nao e assercao. Rode sozinho se ADD COLUMN falhar.
-- select column_name, is_nullable, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'patient_focus_areas'
-- order by ordinal_position;
-- Esperado: id, patient_id, label, is_active, sort_order. region_key pode nao existir ainda.
-- Se o nome da tabela for outro, pare. Nao invente tabela nova.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. region_key nullable (D-09, Pitfall 8). Leftovers com so label continuam.
-- ---------------------------------------------------------------------------
alter table public.patient_focus_areas
  add column if not exists region_key text;

-- ---------------------------------------------------------------------------
-- 2. CHECK formato. Null permitido. Catalogo 30 chaves vive no Zod (D-08).
-- T-06-02: chave desconhecida / maiuscula / sem view falha no banco.
-- ---------------------------------------------------------------------------
alter table public.patient_focus_areas
  drop constraint if exists patient_focus_areas_region_key_format;

alter table public.patient_focus_areas
  add constraint patient_focus_areas_region_key_format
  check (region_key is null or region_key ~ '^(front|back)\.[a-z0-9_]+$');

-- ---------------------------------------------------------------------------
-- 3. Unique parcial (REQ-18.4, Pitfall 7). Nulls nao entram no indice.
-- ---------------------------------------------------------------------------
create unique index if not exists patient_focus_areas_patient_region_key
  on public.patient_focus_areas (patient_id, region_key)
  where region_key is not null;

-- ---------------------------------------------------------------------------
-- 4. Grants (A2). Unmark e DELETE. Sem grant a anon. Sem service_role.
-- RLS Phase 3 ja esta ligado; nao reforce aqui.
-- ---------------------------------------------------------------------------
revoke all on table public.patient_focus_areas from anon, public;
grant select, insert, update, delete on table public.patient_focus_areas to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Recarrega o schema do PostgREST (opcional; idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success):
-- 1. creator INSERT own patient_id + region_key front.head ok
-- 2. creator DELETE own row ok
-- 3. second INSERT same (patient_id, region_key) → 23505
-- 4. region_key 'peito' or 'front.HEAD' → 23514
-- 5. other authenticated INSERT on colleague patient_id → 42501
-- 6. empresa SELECT colleague rows still allowed via can_read_patient
-- 7. INSERT with region_key null still allowed for leftovers
-- 8. policies patient_focus_areas_select/insert/update/delete still exist
-- ---------------------------------------------------------------------------
