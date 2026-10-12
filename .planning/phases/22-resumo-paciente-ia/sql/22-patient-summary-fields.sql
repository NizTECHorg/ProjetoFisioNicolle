-- REQ-33. Resumo do paciente (IA). Idempotente. Cole no SQL Editor do Supabase.
-- Nao aplique pelo CLI. Nao rode supabase db push.
-- Nao cria policy: patients_update ja usa private.can_write_patient e cobre colunas novas.
-- Nada aqui faz DROP em private.can_read_patient / can_write_patient.
-- Colunas legadas (program_name, program_progress, current_eva, evolution_summary,
-- last_conducts, next_session_plan) permanecem no banco. A fase so deixa de le-las na UI.

-- ---------------------------------------------------------------------------
-- 1. Duas colunas jsonb nullable. Null e o estado antes da primeira geracao.
-- ---------------------------------------------------------------------------
alter table public.patients
  add column if not exists ai_summary_fields jsonb,
  add column if not exists summary_edits jsonb;

-- ---------------------------------------------------------------------------
-- 2. CHECKs de formato e tamanho. drop constraint if exists torna o script
-- re-executavel. So objeto jsonb, no maximo 20000 bytes. Null passa.
-- ---------------------------------------------------------------------------
alter table public.patients
  drop constraint if exists patients_ai_summary_fields_shape;

alter table public.patients
  drop constraint if exists patients_summary_edits_shape;

alter table public.patients
  add constraint patients_ai_summary_fields_shape
  check (
    ai_summary_fields is null
    or (
      jsonb_typeof(ai_summary_fields) = 'object'
      and octet_length(ai_summary_fields::text) <= 20000
    )
  );

alter table public.patients
  add constraint patients_summary_edits_shape
  check (
    summary_edits is null
    or (
      jsonb_typeof(summary_edits) = 'object'
      and octet_length(summary_edits::text) <= 20000
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Recarrega o schema do PostgREST. Sem isso o cliente recebe coluna inexistente.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success). Rodar uma por vez e anotar o resultado.
-- 1. information_schema.columns devolve 2 linhas jsonb:
--    select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'patients'
--      and column_name in ('ai_summary_fields', 'summary_edits');
-- 2. jsonb que nao e objeto falha com 23514, provando o CHECK:
--    update patients set summary_edits = '"x"'::jsonb where id = '<id proprio>';
-- 3. o mesmo update na ficha de um colega, como conta empresa em consulta,
--    devolve 0 linhas ou 42501, provando a RLS:
--    update patients set summary_edits = '{}'::jsonb where id = '<id do colega>';
-- 4. privilegio de UPDATE na coluna (GRANT por coluna no projeto hospedado):
--    select has_column_privilege('authenticated','public.patients','summary_edits','UPDATE');
--    esperado: true. Se false, adicionar grant update na coluna antes de seguir.
-- ---------------------------------------------------------------------------
