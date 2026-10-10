-- Passo 0 — rodar no SQL Editor e colar a saída no chat; não altera nada.
-- Fase 28: exclusão definitiva de paciente. Somente leitura (só select).

-- (a) FKs que apontam para patients e seus filhos
select
  c.conrelid::regclass::text as tabela,
  c.conname,
  c.confrelid::regclass::text as referencia,
  case c.confdeltype
    when 'a' then 'no action'
    when 'r' then 'restrict'
    when 'c' then 'cascade'
    when 'n' then 'set null'
    when 'd' then 'set default'
  end as on_delete
from pg_constraint c
where c.contype = 'f'
  and c.confrelid in (
    'public.patients'::regclass,
    'public.patient_sessions'::regclass,
    'public.patient_evaluations'::regclass,
    'public.patient_images'::regclass,
    'public.patient_ai_reports'::regclass,
    'public.patient_session_evolutions'::regclass
  )
order by 1, 2;

-- (b) Colunas que podem referenciar paciente/sessão/avaliação
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and column_name in ('patient_id', 'session_id', 'evaluation_id', 'patient', 'image_id', 'report_id')
order by table_name, column_name;

-- (c) Triggers não internos nas tabelas do inventário
select
  c.relname as tabela,
  t.tgname as trigger,
  p.proname as funcao
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'public'
  and c.relname in (
    'patients', 'patient_sessions', 'patient_evaluations', 'patient_images',
    'patient_ai_reports', 'patient_session_evolutions', 'patient_pain_logs',
    'patient_focus_areas', 'patient_alerts', 'patient_goals', 'board_cards',
    'autonomo_session_charges', 'google_calendar_session_links'
  )
order by 1, 2;

-- (d) RLS e FORCE RLS nas tabelas do inventário
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in (
    'patients', 'patient_sessions', 'patient_evaluations', 'patient_images',
    'patient_ai_reports', 'patient_session_evolutions', 'patient_pain_logs',
    'patient_focus_areas', 'patient_alerts', 'patient_goals', 'board_cards',
    'autonomo_session_charges', 'google_calendar_session_links'
  )
order by relname;

-- (e) Papel que cria a função e bypassrls
select rolname, rolbypassrls
from pg_roles
where rolname in ('postgres', current_user);

-- (f) Policies atuais de storage.objects (conferir nomes)
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
