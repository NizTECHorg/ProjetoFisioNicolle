-- REQ-28 isolamento de dados por conta. D-01, D-03, D-05, D-06.
-- Idempotente. Cole no SQL Editor.
-- Aviso ao operador: não use supabase db push.
--
-- D-02 auditoria: ja isolados; este arquivo nao cria politica neles.
-- patient_sessions, patient_session_evolutions, patient_evaluations,
-- patient_goals, patient_alerts, patient_focus_areas, patient_pain_logs,
-- patient_images, patient_ai_reports, bucket patient-avatars,
-- autonomo_prices, autonomo_session_charges,
-- google_calendar_connections, google_calendar_session_links, google_calendar_secrets,
-- organizations, organization_memberships, profiles.
-- O quadro (board_columns, board_cards) e o buraco.

-- ---------------------------------------------------------------------------
-- 1. Colunas de escopo. owner_id e organization_id permanecem anulaveis.
-- ---------------------------------------------------------------------------
alter table public.board_columns
  add column if not exists owner_id uuid references public.profiles (id);

alter table public.board_columns
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.board_cards
  add column if not exists owner_id uuid references public.profiles (id);

alter table public.board_cards
  add column if not exists organization_id uuid references public.organizations (id);

create index if not exists board_columns_owner_idx
  on public.board_columns (owner_id);

create index if not exists board_columns_org_idx
  on public.board_columns (organization_id);

create index if not exists board_cards_owner_idx
  on public.board_cards (owner_id);

create index if not exists board_cards_org_idx
  on public.board_cards (organization_id);

-- ---------------------------------------------------------------------------
-- 2. Backfill comentado. Nao executa neste paste.
-- Se a contagem for zero, siga. Se for maior que zero, troque uuid-do-operador
-- pelo uuid do profile do operador, descomente so o UPDATE e rode antes das
-- politicas. Sem isso as linhas atuais somem (fail closed).
-- Nao repetir backfill de um unico profile.
-- ---------------------------------------------------------------------------
-- select count(*) from public.board_columns;
-- select count(*) from public.board_cards;
-- update public.board_columns
--   set owner_id = 'uuid-do-operador'
--   where owner_id is null;
-- update public.board_cards
--   set owner_id = 'uuid-do-operador'
--   where owner_id is null;

-- ---------------------------------------------------------------------------
-- 3. Derruba politicas antigas do quadro (nomes ao vivo nao estao no git).
-- Nao inclui patients: insert/update/delete de paciente ficam como estao.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
BEGIN
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('board_columns', 'board_cards')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
END
$$;

alter table public.board_columns enable row level security;
alter table public.board_columns force row level security;
alter table public.board_cards enable row level security;
alter table public.board_cards force row level security;

revoke all on public.board_columns from anon, public;
revoke all on public.board_cards from anon, public;
grant select, insert, update, delete on public.board_columns to authenticated;
grant select, insert, update, delete on public.board_cards to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Carimbo. security invoker, search_path vazio.
-- Coluna: INSERT grava auth.uid() e viewer_org_id(); UPDATE preserva OLD.
-- Card: copia o par da coluna pai e ignora o que o cliente enviou.
-- ---------------------------------------------------------------------------
create or replace function public.stamp_board_column_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
BEGIN
  if TG_OP = 'INSERT' then
    NEW.owner_id := (select auth.uid());
    NEW.organization_id := (select private.viewer_org_id());
  elsif TG_OP = 'UPDATE' then
    NEW.owner_id := OLD.owner_id;
    NEW.organization_id := OLD.organization_id;
  end if;
  return NEW;
END;
$$;

create or replace function public.stamp_board_card_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner uuid;
  v_org uuid;
BEGIN
  select c.owner_id, c.organization_id
    into v_owner, v_org
  from public.board_columns c
  where c.id = NEW.column_id;

  if not found then
    raise insufficient_privilege using message = 'Coluna do quadro nao encontrada';
  end if;

  NEW.owner_id := v_owner;
  NEW.organization_id := v_org;
  return NEW;
END;
$$;

revoke all on function public.stamp_board_column_scope() from public, anon;
revoke all on function public.stamp_board_card_scope() from public, anon;
grant execute on function public.stamp_board_column_scope() to authenticated;
grant execute on function public.stamp_board_card_scope() to authenticated;

drop trigger if exists board_columns_stamp_scope on public.board_columns;
create trigger board_columns_stamp_scope
  before insert or update on public.board_columns
  for each row
  execute function public.stamp_board_column_scope();

drop trigger if exists board_cards_stamp_scope on public.board_cards;
create trigger board_cards_stamp_scope
  before insert or update on public.board_cards
  for each row
  execute function public.stamp_board_card_scope();

-- ---------------------------------------------------------------------------
-- 5. Oito politicas. Ramo pessoal: organization_id nulo e owner_id do uid.
-- Ramo empresa: organization_id nao nulo igual a private.viewer_org_id(),
-- e o uid nao esta pending nem rejected.
-- organization_id nulo nao e balde compartilhado (D-05).
-- ---------------------------------------------------------------------------
create policy board_columns_select
  on public.board_columns
  for select
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );

create policy board_columns_insert
  on public.board_columns
  for insert
  to authenticated
  with check (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );

create policy board_columns_update
  on public.board_columns
  for update
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  )
  with check (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );

create policy board_columns_delete
  on public.board_columns
  for delete
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );

create policy board_cards_select
  on public.board_cards
  for select
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );

create policy board_cards_insert
  on public.board_cards
  for insert
  to authenticated
  with check (
    (
      (
        organization_id is null
        and owner_id = (select auth.uid())
      )
      or (
        organization_id is not null
        and organization_id = (select private.viewer_org_id())
        and not exists (
          select 1
          from public.organization_memberships m
          where m.profile_id = (select auth.uid())
            and m.status in ('pending', 'rejected')
        )
      )
    )
    and (
      patient_id is null
      or (select private.can_read_patient(patient_id))
    )
    and exists (
      select 1
      from public.board_columns parent
      where parent.id = column_id
        and parent.owner_id is not distinct from owner_id
        and parent.organization_id is not distinct from organization_id
    )
  );

create policy board_cards_update
  on public.board_cards
  for update
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  )
  with check (
    (
      (
        organization_id is null
        and owner_id = (select auth.uid())
      )
      or (
        organization_id is not null
        and organization_id = (select private.viewer_org_id())
        and not exists (
          select 1
          from public.organization_memberships m
          where m.profile_id = (select auth.uid())
            and m.status in ('pending', 'rejected')
        )
      )
    )
    and (
      patient_id is null
      or (select private.can_read_patient(patient_id))
    )
    and exists (
      select 1
      from public.board_columns parent
      where parent.id = column_id
        and parent.owner_id is not distinct from owner_id
        and parent.organization_id is not distinct from organization_id
    )
  );

create policy board_cards_delete
  on public.board_cards
  for delete
  to authenticated
  using (
    (
      organization_id is null
      and owner_id = (select auth.uid())
    )
    or (
      organization_id is not null
      and organization_id = (select private.viewer_org_id())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
  );
