-- Fase 29 — Fisio anexado na sessão da agenda
-- Rodar no SQL Editor do Supabase (idempotente). Não é migration. Não usar supabase db push.
--
-- Regras:
--   * Só a conta de empresa anexa fisio, e só um fisio ATIVO da própria equipe.
--   * Sessão com fisio anexado: vê o fisio anexado e a empresa (o criador do paciente,
--     que no fluxo da agenda é a própria empresa, continua vendo).
--   * O fisio anexado lê a ficha do paciente (somente leitura) enquanto tiver sessão anexada.
--   * O fisio anexado muda só o status da sessão; o resto da linha fica travado.

-- ============================================================
-- 1. Regra antiga de leitura, preservada com outro nome
-- ============================================================
create or replace function private.can_read_patient_base(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
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

-- ============================================================
-- 2. Fisio ativo da empresa com sessão anexada a ele neste paciente
-- ============================================================
create or replace function private.is_assigned_therapist(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.patient_sessions s
    join public.patients p on p.id = s.patient_id
    join public.organizations o on o.owner_id = p.created_by
    join public.organization_memberships m
      on m.organization_id = o.id
     and m.profile_id = (select auth.uid())
     and m.role = 'therapist'
     and m.status = 'active'
    where s.patient_id = p_patient_id
      and s.therapist_id = (select auth.uid())
  );
$$;

-- ============================================================
-- 3. Leitura do paciente = regra antiga OU fisio anexado
--    (vale para a ficha: paciente, evoluções, avaliações, imagens, relatórios)
-- ============================================================
create or replace function private.can_read_patient(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select (select private.can_read_patient_base(p_patient_id))
      or (select private.is_assigned_therapist(p_patient_id));
$$;

-- ============================================================
-- 4. Leitura da sessão: regra antiga (empresa/criador) OU a sessão é deste fisio
--    Um fisio anexado NÃO vê sessões do paciente anexadas a outro fisio.
-- ============================================================
create or replace function private.can_read_session(p_patient_id uuid, p_therapist_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select (select private.can_read_patient_base(p_patient_id))
      or (
        p_therapist_id = (select auth.uid())
        and (select private.is_assigned_therapist(p_patient_id))
      );
$$;

revoke execute on function private.can_read_patient_base(uuid) from public, anon;
revoke execute on function private.is_assigned_therapist(uuid) from public, anon;
revoke execute on function private.can_read_session(uuid, uuid) from public, anon;
grant execute on function private.can_read_patient_base(uuid) to authenticated;
grant execute on function private.is_assigned_therapist(uuid) to authenticated;
grant execute on function private.can_read_session(uuid, uuid) to authenticated;

drop policy if exists patient_sessions_select on public.patient_sessions;
create policy patient_sessions_select
  on public.patient_sessions
  for select
  to authenticated
  using ((select private.can_read_session(patient_id, therapist_id)));

-- ============================================================
-- 5. Fisio anexado pode atualizar a própria sessão (o gatilho 7 trava tudo menos status)
-- ============================================================
drop policy if exists patient_sessions_update_assigned on public.patient_sessions;
create policy patient_sessions_update_assigned
  on public.patient_sessions
  for update
  to authenticated
  using (
    therapist_id = (select auth.uid())
    and (select private.is_assigned_therapist(patient_id))
  )
  with check (therapist_id = (select auth.uid()));

-- ============================================================
-- 6. Gatilho: só a empresa anexa, e só fisio ativo da própria equipe
-- ============================================================
create or replace function public.check_session_therapist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- SQL Editor / service role: sem usuário, sem checagem
  if (select auth.uid()) is null or new.therapist_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.therapist_id is not distinct from old.therapist_id then
    return new;
  end if;

  -- O próprio profissional pode se marcar (fluxo da ficha do autônomo)
  if new.therapist_id = (select auth.uid()) then
    return new;
  end if;

  if exists (
    select 1
    from public.organizations o
    join public.organization_memberships m on m.organization_id = o.id
    where o.owner_id = (select auth.uid())
      and m.profile_id = new.therapist_id
      and m.role = 'therapist'
      and m.status = 'active'
  ) then
    return new;
  end if;

  raise exception 'therapist_not_in_team' using errcode = '42501';
end;
$$;

revoke execute on function public.check_session_therapist() from public, anon, authenticated;

drop trigger if exists patient_sessions_check_therapist on public.patient_sessions;
create trigger patient_sessions_check_therapist
  before insert or update of therapist_id on public.patient_sessions
  for each row execute function public.check_session_therapist();

-- ============================================================
-- 7. Gatilho: quem não escreve no paciente (fisio anexado) só muda status
-- ============================================================
create or replace function public.guard_assigned_session_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if (select private.can_write_patient(old.patient_id)) then
    return new;
  end if;

  if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'only_status_allowed' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_assigned_session_update() from public, anon, authenticated;

drop trigger if exists patient_sessions_guard_assigned_update on public.patient_sessions;
create trigger patient_sessions_guard_assigned_update
  before update on public.patient_sessions
  for each row execute function public.guard_assigned_session_update();

-- ============================================================
-- Checagens (rodar depois do Success, numa query nova)
-- ============================================================
-- select
--   (select count(*) from pg_proc where proname in
--     ('can_read_patient_base','is_assigned_therapist','can_read_session',
--      'check_session_therapist','guard_assigned_session_update'))            as funcoes,      -- 5
--   (select count(*) from pg_policies where tablename = 'patient_sessions'
--     and policyname in ('patient_sessions_select','patient_sessions_update_assigned')) as policies, -- 2
--   (select count(*) from pg_trigger where tgname in
--     ('patient_sessions_check_therapist','patient_sessions_guard_assigned_update')) as gatilhos;    -- 2

notify pgrst, 'reload schema';
