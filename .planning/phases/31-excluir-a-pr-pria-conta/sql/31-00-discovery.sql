-- Passo 0 — Fase 31 (excluir a própria conta). SOMENTE LEITURA (só select).
-- Rodar no SQL Editor do Supabase e colar as saídas no chat.

-- (a) Toda FK (qualquer schema) que aponta para auth.users, profiles ou organizations
select
  c.conrelid::regclass::text as tabela,
  c.conname,
  (select string_agg(a.attname, ', ')
     from pg_attribute a
    where a.attrelid = c.conrelid and a.attnum = any (c.conkey)) as coluna,
  (select bool_and(not a.attnotnull)
     from pg_attribute a
    where a.attrelid = c.conrelid and a.attnum = any (c.conkey)) as coluna_anulavel,
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
    'auth.users'::regclass,
    'public.profiles'::regclass,
    'public.organizations'::regclass
  )
order by 5, 1, 2;

-- (b) Colunas "de autoria/dono" SEM FK (órfãs) em public
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and column_name in (
    'created_by', 'updated_by', 'owner_id', 'user_id', 'profile_id',
    'therapist_id', 'deleted_by', 'organization_id', 'author_id', 'assigned_to'
  )
order by table_name, column_name;

-- (c) storage.objects: colunas de dono e FKs (documentação Supabase: usuário que é dono
--     de objeto no Storage não pode ser apagado)
select column_name, data_type
from information_schema.columns
where table_schema = 'storage' and table_name = 'objects'
  and column_name in ('owner', 'owner_id', 'bucket_id', 'name');

select bucket_id, count(*) as objetos, count(*) filter (where owner is not null) as com_dono
from storage.objects
group by bucket_id
order by 1;

-- (d) Triggers não internos nas tabelas que a exclusão vai tocar
select c.relname as tabela, t.tgname as trigger, p.proname as funcao
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'public'
  and c.relname in (
    'patients', 'patient_sessions', 'patient_images', 'patient_ai_reports',
    'patient_evaluations', 'board_columns', 'board_cards', 'profiles',
    'organizations', 'organization_memberships', 'autonomo_prices', 'autonomo_session_charges'
  )
order by 1, 2;

-- (e) Triggers em auth.users (além de on_auth_user_created)
select t.tgname, p.proname
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;

-- (f) Papel que cria funções no SQL Editor e se ignora RLS (já confirmado na fase 28: postgres, true)
select current_user, (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls;
