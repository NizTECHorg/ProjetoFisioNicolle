-- Inspecione handle_new_user no Dashboard antes de rodar.
-- REQ-15 — Tipos de conta e equipe (org + membership + RLS).
-- Idempotente. Cole no SQL Editor. Nao use supabase db push.
-- Trigger live: on_auth_user_created (nao criar um segundo).
-- handle_new_user deve continuar inserindo id, full_name, email, role, is_active.
-- board_columns / board_cards ficam inalterados (fora de REQ-15).

-- ---------------------------------------------------------------------------
-- 1. profiles.account_type (nao e profiles.role)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists account_type text;

update public.profiles
set account_type = 'autonomo'
where account_type is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type in ('autonomo', 'empresa', 'fisioterapeuta'));
  end if;
end
$$;

alter table public.profiles
  alter column account_type set default 'autonomo';

-- ---------------------------------------------------------------------------
-- 2. organizations + organization_memberships
-- join_code: 8 hex maiusculo a partir de gen_random_uuid() (nao Math.random)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id),
  name text not null,
  join_code text not null unique
    default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_memberships_role_check'
      and conrelid = 'public.organization_memberships'::regclass
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_role_check
      check (role in ('owner', 'therapist'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_memberships_status_check'
      and conrelid = 'public.organization_memberships'::regclass
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_status_check
      check (status in ('pending', 'active', 'rejected'));
  end if;
end
$$;

create index if not exists organization_memberships_profile_idx
  on public.organization_memberships (profile_id);

create index if not exists organization_memberships_org_status_idx
  on public.organization_memberships (organization_id, status);

revoke all on table public.organizations from anon, public;
revoke all on table public.organization_memberships from anon, public;
grant select on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;

-- ---------------------------------------------------------------------------
-- 2b. patients.created_by BEFORE private helpers (42703 if created later)
-- Divida residual: se houver mais de um profile, created_by nulo fica
-- visivel a qualquer autenticado (SELECT transitorio na secao 9).
-- ---------------------------------------------------------------------------
alter table public.patients
  add column if not exists created_by uuid references auth.users (id);

create index if not exists patients_created_by_idx
  on public.patients (created_by);

create or replace function public.set_patient_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is null then
    new.created_by := (select auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists patients_set_created_by on public.patients;
create trigger patients_set_created_by
  before insert on public.patients
  for each row
  execute function public.set_patient_created_by();

do $$
declare
  v_profile_count integer;
  v_sole_id uuid;
begin
  select count(*) into v_profile_count from public.profiles;
  if v_profile_count = 1 then
    select id into v_sole_id from public.profiles;
    update public.patients
    set created_by = v_sole_id
    where created_by is null;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. private helpers (SECURITY DEFINER, search_path vazio, auth.uid encapsulado)
-- ---------------------------------------------------------------------------
create schema if not exists private;

create or replace function private.is_org_owner(p_org_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = p_org_id
      and o.owner_id = (select auth.uid())
  );
$$;

create or replace function private.viewer_org_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select o.id
      from public.organizations o
      where o.owner_id = (select auth.uid())
      limit 1
    ),
    (
      select m.organization_id
      from public.organization_memberships m
      where m.profile_id = (select auth.uid())
        and m.status = 'active'
      limit 1
    )
  );
$$;

create or replace function private.can_write_patient(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  -- D-05 / D-07: so o criador escreve. Dono da empresa nao e writer.
  -- D-03: fisio pending/rejected nao escreve mesmo se created_by = uid.
  select exists (
    select 1
    from public.patients p
    where p.id = p_patient_id
      and p.created_by = (select auth.uid())
  )
  and not exists (
    select 1
    from public.organization_memberships m
    where m.profile_id = (select auth.uid())
      and m.status in ('pending', 'rejected')
  );
$$;

create or replace function private.can_read_patient(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  -- D-05 / D-06: criador ou dono da org com membership therapist/active do criador.
  -- Pending/rejected nao leem (T-03-06).
  select
    not exists (
      select 1
      from public.organization_memberships m
      where m.profile_id = (select auth.uid())
        and m.status in ('pending', 'rejected')
    )
    and exists (
      select 1
      from public.patients p
      where p.id = p_patient_id
        and (
          p.created_by = (select auth.uid())
          or exists (
            select 1
            from public.organizations o
            join public.organization_memberships tm
              on tm.organization_id = o.id
            where o.owner_id = (select auth.uid())
              and tm.profile_id = p.created_by
              and tm.role = 'therapist'
              and tm.status = 'active'
          )
        )
    );
$$;

create or replace function private.can_view_profile(p_profile_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    p_profile_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships target
      where target.profile_id = p_profile_id
        and target.organization_id = (select private.viewer_org_id())
        and (
          (select private.is_org_owner(target.organization_id))
          or (
            target.status = 'active'
            and exists (
              select 1
              from public.organization_memberships viewer
              where viewer.profile_id = (select auth.uid())
                and viewer.organization_id = target.organization_id
                and viewer.status = 'active'
            )
          )
        )
    );
$$;

revoke execute on function private.is_org_owner(uuid) from public, anon;
revoke execute on function private.viewer_org_id() from public, anon;
revoke execute on function private.can_write_patient(uuid) from public, anon;
revoke execute on function private.can_read_patient(uuid) from public, anon;
revoke execute on function private.can_view_profile(uuid) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.is_org_owner(uuid) to authenticated;
grant execute on function private.viewer_org_id() to authenticated;
grant execute on function private.can_write_patient(uuid) to authenticated;
grant execute on function private.can_read_patient(uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. handle_new_user — CREATE OR REPLACE preservando colunas live
-- Live insert: id, full_name, email, role, is_active (role default atendente)
-- Nao criar trigger on_auth_user_created (ja existe, 1 linha no dump)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_account_type text;
  v_join_code text;
  v_org_id uuid;
  v_try integer;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_name := regexp_replace(v_name, '[[:cntrl:]]', '', 'g');
  v_name := left(v_name, 100);

  v_account_type := lower(trim(coalesce(new.raw_user_meta_data ->> 'account_type', 'autonomo')));
  if v_account_type not in ('autonomo', 'empresa', 'fisioterapeuta') then
    v_account_type := 'autonomo';
  end if;

  v_join_code := upper(regexp_replace(trim(coalesce(new.raw_user_meta_data ->> 'join_code', '')), '\s+', '', 'g'));

  insert into public.profiles (id, full_name, email, role, is_active, account_type)
  values (
    new.id,
    v_name,
    new.email,
    'atendente',
    true,
    v_account_type
  );

  if v_account_type = 'empresa' then
    v_try := 0;
    loop
      v_try := v_try + 1;
      begin
        insert into public.organizations (owner_id, name, join_code)
        values (
          new.id,
          v_name,
          upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
        )
        returning id into v_org_id;
        exit;
      exception
        when unique_violation then
          if v_try >= 8 then
            RAISE EXCEPTION 'Nao foi possivel gerar um codigo unico da empresa';
          end if;
      end;
    end loop;

    insert into public.organization_memberships (organization_id, profile_id, role, status)
    values (v_org_id, new.id, 'owner', 'active');

  elsif v_account_type = 'fisioterapeuta' then
    if v_join_code is null or v_join_code = '' then
      RAISE EXCEPTION 'Codigo da empresa invalido ou ausente';
    end if;

    select o.id
      into v_org_id
    from public.organizations o
    where o.join_code = v_join_code;

    if v_org_id is null then
      RAISE EXCEPTION 'Codigo da empresa invalido ou ausente';
    end if;

    insert into public.organization_memberships (organization_id, profile_id, role, status)
    values (v_org_id, new.id, 'therapist', 'pending');
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. lookup_organization_by_code — boolean only (D-01). Sem nome da org.
-- ---------------------------------------------------------------------------
create or replace function public.lookup_organization_by_code(p_code text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organizations o
    where o.join_code = upper(regexp_replace(trim(coalesce(p_code, '')), '\s+', '', 'g'))
  );
$$;

revoke execute on function public.lookup_organization_by_code(text) from public;
grant execute on function public.lookup_organization_by_code(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. decide_membership — so dono, so pending. Recusa: is_active = false (D-04)
-- Nao apaga auth.users. Nao atualiza profiles via policy de cliente.
-- ---------------------------------------------------------------------------
create or replace function public.decide_membership(p_membership_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_profile_id uuid;
  v_status text;
begin
  select m.organization_id, m.profile_id, m.status
    into v_org_id, v_profile_id, v_status
  from public.organization_memberships m
  where m.id = p_membership_id;

  if v_org_id is null then
    RAISE EXCEPTION 'Pedido nao encontrado';
  end if;

  if not (select private.is_org_owner(v_org_id)) then
    RAISE EXCEPTION 'Somente o dono da empresa pode decidir pedidos';
  end if;

  if v_status is distinct from 'pending' then
    RAISE EXCEPTION 'Somente pedidos pendentes podem ser decididos';
  end if;

  if p_accept then
    update public.organization_memberships
    set status = 'active'
    where id = p_membership_id;
  else
    update public.organization_memberships
    set status = 'rejected'
    where id = p_membership_id;

    update public.profiles
    set is_active = false
    where id = v_profile_id;
  end if;
end;
$$;

revoke execute on function public.decide_membership(uuid, boolean) from public, anon;
grant execute on function public.decide_membership(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RLS: org / membership / profiles + drop using(true) nas tabelas clinicas
-- Sem INSERT/UPDATE/DELETE de cliente em organizations ou memberships.
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.profiles enable row level security;

drop policy if exists organizations_select_owner on public.organizations;
create policy organizations_select_owner
  on public.organizations
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists organization_memberships_select_own_or_owner
  on public.organization_memberships;
create policy organization_memberships_select_own_or_owner
  on public.organization_memberships
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select private.is_org_owner(organization_id))
  );

drop policy if exists profiles_select_active_colleagues on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_can_view on public.profiles;
create policy profiles_select_can_view
  on public.profiles
  for select
  to authenticated
  using ((select private.can_view_profile(id)));

-- profiles_update_own permanece (self-update). decide_membership e o unico
-- caminho para alterar is_active de outra pessoa.

-- ---------------------------------------------------------------------------
-- 9. Politicas clinicas: drop using(true) / *_authenticated_all; creator-write
-- patients.created_by ja foi adicionado na secao 2b (antes dos helpers).
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'patients',
        'patient_goals',
        'patient_alerts',
        'patient_sessions',
        'patient_session_evolutions',
        'patient_evaluations',
        'patient_focus_areas',
        'patient_pain_logs'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;

drop policy if exists patient_goals_authenticated_all on public.patient_goals;
drop policy if exists patient_evaluations_authenticated_all on public.patient_evaluations;
drop policy if exists patients_insert_authenticated on public.patients;
drop policy if exists patients_select_authenticated on public.patients;
drop policy if exists patients_update_authenticated on public.patients;
drop policy if exists patient_goals_select_authenticated on public.patient_goals;
drop policy if exists patient_focus_select_authenticated on public.patient_focus_areas;
drop policy if exists patient_pain_select_authenticated on public.patient_pain_logs;

alter table public.patients enable row level security;
alter table public.patient_goals enable row level security;
alter table public.patient_alerts enable row level security;
alter table public.patient_sessions enable row level security;
alter table public.patient_session_evolutions enable row level security;
alter table public.patient_evaluations enable row level security;
alter table public.patient_focus_areas enable row level security;
alter table public.patient_pain_logs enable row level security;

create policy patients_select
  on public.patients
  for select
  to authenticated
  using (
    (select private.can_read_patient(id))
    or (created_by is null and (select auth.uid()) is not null)
  );

create policy patients_insert
  on public.patients
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and not exists (
      select 1
      from public.organization_memberships m
      where m.profile_id = (select auth.uid())
        and m.status in ('pending', 'rejected')
    )
  );

create policy patients_update
  on public.patients
  for update
  to authenticated
  using ((select private.can_write_patient(id)))
  with check ((select private.can_write_patient(id)));

create policy patients_delete
  on public.patients
  for delete
  to authenticated
  using ((select private.can_write_patient(id)));

create policy patient_goals_select
  on public.patient_goals
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_goals_insert
  on public.patient_goals
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_goals_update
  on public.patient_goals
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_goals_delete
  on public.patient_goals
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

create policy patient_alerts_select
  on public.patient_alerts
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_alerts_insert
  on public.patient_alerts
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_alerts_update
  on public.patient_alerts
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_alerts_delete
  on public.patient_alerts
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

create policy patient_sessions_select
  on public.patient_sessions
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_sessions_insert
  on public.patient_sessions
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_sessions_update
  on public.patient_sessions
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_sessions_delete
  on public.patient_sessions
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

create policy patient_session_evolutions_select
  on public.patient_session_evolutions
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_session_evolutions_insert
  on public.patient_session_evolutions
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_session_evolutions_update
  on public.patient_session_evolutions
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_session_evolutions_delete
  on public.patient_session_evolutions
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

create policy patient_evaluations_select
  on public.patient_evaluations
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_evaluations_insert
  on public.patient_evaluations
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_evaluations_update
  on public.patient_evaluations
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_evaluations_delete
  on public.patient_evaluations
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

create policy patient_focus_areas_select
  on public.patient_focus_areas
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_focus_areas_insert
  on public.patient_focus_areas
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_focus_areas_update
  on public.patient_focus_areas
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_focus_areas_delete
  on public.patient_focus_areas
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

create policy patient_pain_logs_select
  on public.patient_pain_logs
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_pain_logs_insert
  on public.patient_pain_logs
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_pain_logs_update
  on public.patient_pain_logs
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_pain_logs_delete
  on public.patient_pain_logs
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));

-- ---------------------------------------------------------------------------
-- Checagens opcionais no SQL Editor (apos Success):
-- 1. Table Editor: profiles.account_type; organizations; organization_memberships
-- 2. anon nao consegue SELECT organizations
-- 3. JWT pending nao consegue SELECT patients
-- 4. fisio B nao consegue SELECT paciente de A
-- 5. empresa nao consegue UPDATE paciente de A
-- 6. empresa consegue SELECT paciente de A (therapist/active)
-- ---------------------------------------------------------------------------
