-- Fase 31 — Excluir a própria conta
-- Rodar no SQL Editor do Supabase (idempotente). Não é migration.

-- ============================================================
-- Bloco 0 — Resumo da descoberta no banco vivo (31-DB-DISCOVERY.md, 2026-10-12)
-- ============================================================
-- FKs NO ACTION que bloqueiam auth.admin.deleteUser (a função abaixo zera todas):
--   patients.created_by            -> auth.users
--   patient_ai_reports.created_by  -> auth.users
--   patient_images.created_by      -> profiles
--   autonomo_prices.owner_id       -> profiles (NOT NULL)
--   autonomo_session_charges.owner_id -> profiles (NOT NULL)
--   board_cards.owner_id / board_columns.owner_id -> profiles
--   board_cards.organization_id / board_columns.organization_id -> organizations
--   organizations.owner_id         -> profiles (NOT NULL)
-- Cascade / set null (ok sozinhos): profiles.id, google_calendar_*.user_id,
--   organization_memberships.*, patient_alerts/evaluations/session_evolutions/sessions created_by e therapist_id.
-- Gatilhos board_*_stamp_scope preservam OLD em UPDATE: desligados dentro da função (padrão fase 17).
-- protect_profile_fields só age para o papel authenticated; dentro da função (postgres) passa.
-- Gatilhos da fase 29 em patient_sessions pulam quando não há usuário logado (service role).
-- Storage: todos os objetos têm owner; reatribuir ao dono da empresa ou limpar o owner.

-- ============================================================
-- Bloco 1 — Tombstone (sem PII: só UUIDs e data)
-- ============================================================
create table if not exists private.account_deletion_pending (
  user_id uuid primary key,
  patient_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table private.account_deletion_pending enable row level security;

revoke all on table private.account_deletion_pending from public, anon, authenticated;

-- ============================================================
-- Bloco 2 — Exclusão dos dados da conta, tudo-ou-nada (uma transação)
-- Modos: data_owner (autônomo / fisio sem empresa ativa), org_owner (empresa),
--        org_therapist (fisio ativo de empresa).
-- ============================================================
create or replace function public.delete_account_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode text;
  v_org_owned uuid;
  v_active_org uuid;
  v_org_owner uuid;
  v_patient_ids uuid[] := '{}';
  v_active_therapists uuid[] := '{}';
  v_tomb_ids text[] := '{}';
  v_has_owner_id boolean;
begin
  -- (1) Validação e trava do perfil (serializa tentativas simultâneas)
  if p_user_id is null then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  -- (2) Papel detectado pelas linhas, não só por account_type
  select o.id into v_org_owned
  from public.organizations o
  where o.owner_id = p_user_id
  limit 1;

  if v_org_owned is not null then
    v_mode := 'org_owner';
  else
    select m.organization_id, o.owner_id
      into v_active_org, v_org_owner
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.profile_id = p_user_id
      and m.role = 'therapist'
      and m.status = 'active'
    limit 1;

    if found then
      v_mode := 'org_therapist';
    else
      v_mode := 'data_owner';
    end if;
  end if;

  -- (3) Conjunto de pacientes a apagar
  if v_mode = 'org_owner' then
    select coalesce(array_agg(m.profile_id), '{}') into v_active_therapists
    from public.organization_memberships m
    where m.organization_id = v_org_owned
      and m.role = 'therapist'
      and m.status = 'active';

    select coalesce(array_agg(p.id), '{}') into v_patient_ids
    from public.patients p
    where p.created_by = p_user_id
       or p.created_by = any(v_active_therapists);
  elsif v_mode = 'data_owner' then
    select coalesce(array_agg(p.id), '{}') into v_patient_ids
    from public.patients p
    where p.created_by = p_user_id;
  end if;

  -- (4) Tombstone ANTES de apagar patients (limpeza de storage retomável)
  insert into private.account_deletion_pending (user_id, patient_ids)
  values (p_user_id, v_patient_ids)
  on conflict (user_id) do update
    set patient_ids = array(
      select distinct unnest(private.account_deletion_pending.patient_ids || excluded.patient_ids)
    );

  -- (5) Subárvore dos pacientes
  delete from public.google_calendar_session_links
  where session_id in (select s.id from public.patient_sessions s where s.patient_id = any(v_patient_ids));

  delete from public.autonomo_session_charges
  where session_id in (select s.id from public.patient_sessions s where s.patient_id = any(v_patient_ids));

  delete from public.patient_session_evolutions where patient_id = any(v_patient_ids);
  delete from public.patient_images where patient_id = any(v_patient_ids);
  delete from public.patient_ai_reports where patient_id = any(v_patient_ids);
  delete from public.patient_pain_logs where patient_id = any(v_patient_ids);
  delete from public.patient_focus_areas where patient_id = any(v_patient_ids);
  delete from public.patient_alerts where patient_id = any(v_patient_ids);
  delete from public.patient_goals where patient_id = any(v_patient_ids);
  delete from public.patient_evaluations where patient_id = any(v_patient_ids);
  delete from public.board_cards where patient_id = any(v_patient_ids);
  delete from public.patient_sessions where patient_id = any(v_patient_ids);
  delete from public.patients where id = any(v_patient_ids);

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'storage'
      and table_name = 'objects'
      and column_name = 'owner_id'
  ) into v_has_owner_id;

  -- (6) Fisio ativo de empresa: tudo passa ao dono da empresa
  if v_mode = 'org_therapist' then
    update public.patients set created_by = v_org_owner where created_by = p_user_id;
    update public.patient_images set created_by = v_org_owner where created_by = p_user_id;
    update public.patient_ai_reports set created_by = v_org_owner where created_by = p_user_id;
    update public.patient_sessions set therapist_id = null where therapist_id = p_user_id;

    alter table public.board_columns disable trigger board_columns_stamp_scope;
    alter table public.board_cards disable trigger board_cards_stamp_scope;

    update public.board_columns
      set owner_id = v_org_owner
      where owner_id = p_user_id and organization_id = v_active_org;
    update public.board_cards
      set owner_id = v_org_owner
      where owner_id = p_user_id and organization_id = v_active_org;

    alter table public.board_columns enable trigger board_columns_stamp_scope;
    alter table public.board_cards enable trigger board_cards_stamp_scope;

    update storage.objects
      set owner = v_org_owner
      where owner = p_user_id
        and bucket_id in ('patient-avatars', 'patient-images', 'patient-ai-reports');

    if v_has_owner_id then
      execute 'update storage.objects set owner_id = $1 where owner_id = $2 and bucket_id = any($3)'
        using v_org_owner::text, p_user_id::text,
          array['patient-avatars', 'patient-images', 'patient-ai-reports'];
    end if;
  end if;

  -- (7) Financeiro (todos os modos): cobranças antes de preços
  delete from public.autonomo_session_charges
  where owner_id = p_user_id
     or price_id in (select ap.id from public.autonomo_prices ap where ap.owner_id = p_user_id);

  delete from public.autonomo_prices where owner_id = p_user_id;

  -- (8) Empresa: quadro, equipe, vínculos e organização
  if v_mode = 'org_owner' then
    delete from public.board_cards where organization_id = v_org_owned;
    delete from public.board_columns where organization_id = v_org_owned;

    -- Nenhum fisio da equipe (active, pending, rejected) fica preso em /aguardando
    update public.profiles
      set account_type = 'autonomo'
      where id in (
        select m.profile_id
        from public.organization_memberships m
        where m.organization_id = v_org_owned
          and m.role = 'therapist'
      );

    delete from public.organization_memberships where organization_id = v_org_owned;
    delete from public.organizations where id = v_org_owned;
  end if;

  -- (9) Quadro pessoal (todos os modos)
  delete from public.board_cards
  where owner_id = p_user_id
     or column_id in (select c.id from public.board_columns c where c.owner_id = p_user_id);

  delete from public.board_columns where owner_id = p_user_id;

  -- (10) Vínculos e Google Calendar
  delete from public.organization_memberships where profile_id = p_user_id;
  delete from public.google_calendar_session_links where user_id = p_user_id;
  delete from public.google_calendar_secrets where user_id = p_user_id;
  delete from public.google_calendar_connections where user_id = p_user_id;

  -- (11) Rede de segurança
  update public.patient_images set created_by = null where created_by = p_user_id;
  update public.patient_ai_reports set created_by = null where created_by = p_user_id;

  select coalesce(array_agg(x::text), '{}') into v_tomb_ids
  from private.account_deletion_pending t, unnest(t.patient_ids) as x
  where t.user_id = p_user_id;

  update storage.objects
    set owner = null
    where owner = p_user_id
      and not (
        bucket_id in ('patient-avatars', 'patient-images', 'patient-ai-reports')
        and split_part(name, '/', 1) = any(v_tomb_ids)
      )
      and not (
        bucket_id = 'account-avatars'
        and split_part(name, '/', 1) = p_user_id::text
      );

  if v_has_owner_id then
    execute 'update storage.objects set owner_id = null where owner_id = $1 '
      || 'and not (bucket_id in (''patient-avatars'', ''patient-images'', ''patient-ai-reports'') '
      || 'and split_part(name, ''/'', 1) = any($2)) '
      || 'and not (bucket_id = ''account-avatars'' and split_part(name, ''/'', 1) = $1)'
      using p_user_id::text, v_tomb_ids;
  end if;

  -- (12) Guarda final: nenhuma FK no action pode sobrar
  if exists (select 1 from public.patients where created_by = p_user_id)
     or exists (select 1 from public.patient_ai_reports where created_by = p_user_id)
     or exists (select 1 from public.patient_images where created_by = p_user_id)
     or exists (select 1 from public.autonomo_prices where owner_id = p_user_id)
     or exists (select 1 from public.autonomo_session_charges where owner_id = p_user_id)
     or exists (select 1 from public.board_cards where owner_id = p_user_id)
     or exists (select 1 from public.board_columns where owner_id = p_user_id)
     or exists (select 1 from public.organizations where owner_id = p_user_id)
  then
    raise exception 'account_still_referenced' using errcode = 'P0001';
  end if;

  -- (13) Resultado
  return jsonb_build_object(
    'mode', v_mode,
    'patient_ids', coalesce(
      (select to_jsonb(t.patient_ids) from private.account_deletion_pending t where t.user_id = p_user_id),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.delete_account_data(uuid) from public, anon, authenticated;
grant execute on function public.delete_account_data(uuid) to service_role;

-- ============================================================
-- Bloco 3 — Finalizar exclusão: só apaga o tombstone quando o storage estiver limpo
-- ============================================================
create or replace function public.finish_account_deletion(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tomb_ids text[] := '{}';
begin
  select coalesce(array_agg(x::text), '{}') into v_tomb_ids
  from private.account_deletion_pending t, unnest(t.patient_ids) as x
  where t.user_id = p_user_id;

  if exists (
    select 1
    from storage.objects o
    where (o.bucket_id = 'account-avatars' and o.name like p_user_id::text || '/%')
       or (
         o.bucket_id in ('patient-avatars', 'patient-images', 'patient-ai-reports')
         and split_part(o.name, '/', 1) = any(v_tomb_ids)
       )
  ) then
    return false;
  end if;

  delete from private.account_deletion_pending where user_id = p_user_id;

  return found;
end;
$$;

revoke all on function public.finish_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.finish_account_deletion(uuid) to service_role;

-- ============================================================
-- Bloco 4 — Checagens no SQL Editor (após Success)
-- ============================================================
-- select has_function_privilege('authenticated', 'public.delete_account_data(uuid)', 'execute');   -- false
-- select has_function_privilege('anon', 'public.delete_account_data(uuid)', 'execute');            -- false
-- select has_function_privilege('service_role', 'public.delete_account_data(uuid)', 'execute');    -- true
-- select has_function_privilege('authenticated', 'public.finish_account_deletion(uuid)', 'execute'); -- false
-- select has_function_privilege('anon', 'public.finish_account_deletion(uuid)', 'execute');        -- false
-- select has_function_privilege('service_role', 'public.finish_account_deletion(uuid)', 'execute'); -- true
-- select has_table_privilege('authenticated', 'private.account_deletion_pending', 'select');       -- false

-- ============================================================
-- Bloco 5 — Recarregar schema do PostgREST
-- ============================================================
notify pgrst, 'reload schema';
