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
-- 2. Listas antigas sem dono somem no RLS. A devolucao esta no bloco 8,
-- no fim deste arquivo. Ele entrega essas listas a conta mais antiga.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 6. patients_select: sai o terceiro OR. O ramo created_by = auth.uid() fica,
-- porque o INSERT ... RETURNING precisa dele. can_read_patient nao e reescrito.
-- Comentario, nao executa: select count(*) from public.patients where created_by isnull;
-- Se a contagem for maior que zero, o operador atribui um created_by conhecido
-- ou aceita que essas linhas sumam. Nao usar a condicao de um unico profile.
-- ---------------------------------------------------------------------------
drop policy if exists patients_select on public.patients;

create policy patients_select
  on public.patients
  for select
  to authenticated
  using (
    (
      created_by = (select auth.uid())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
    or (select private.can_read_patient(id))
  );

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Prova no SQL Editor, so depois do Success, e sempre comentada.
-- Nenhum begin/rollback abaixo pode ser colado sem o traco, senao desfaz o script.
-- ---------------------------------------------------------------------------
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = 'uuid-do-autonomo-B';
-- select id from public.board_cards where id = 'uuid-do-card-de-A';
-- select id from public.board_columns where id = 'uuid-da-coluna-de-A';
-- select id from public.patients where id = 'uuid-do-paciente-de-A';
-- select id from public.patient_sessions where patient_id = 'uuid-do-paciente-de-A';
-- select id from public.patient_session_evolutions where patient_id = 'uuid-do-paciente-de-A';
-- insert into public.board_cards (column_id, title)
-- values ('uuid-da-coluna-de-A', 'prova');
-- esperado: 42501
-- rollback;
--
-- Segundo bloco: sub do dono da empresa ainda ve o paciente do fisioterapeuta ativo.
-- Sub de outro autonomo devolve 0 linhas.
-- Insert de patients com created_by igual ao uid e RETURNING sucede.
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = 'uuid-do-dono-da-empresa';
-- select id from public.patients where id = 'uuid-do-paciente-do-fisioterapeuta';
-- esperado: 1 linha
-- set local request.jwt.claim.sub = 'uuid-do-autonomo-B';
-- select id from public.patients where id = 'uuid-do-paciente-de-A';
-- select id from public.board_cards where id = 'uuid-do-card-de-A';
-- select id from public.patient_sessions where patient_id = 'uuid-do-paciente-de-A';
-- select id from public.patient_session_evolutions where patient_id = 'uuid-do-paciente-de-A';
-- esperado: 0 linhas
-- insert into public.patients (full_name, created_by)
-- values ('Prova', (select auth.uid()))
-- returning id;
-- rollback;
--
-- Terceiro bloco: a prova no papel padrao do Editor nao vale,
-- porque esse papel ignora RLS.

-- ---------------------------------------------------------------------------
-- 8. Devolve as listas criadas antes do isolamento.
-- O gatilho de carimbo recoloca owner_id nulo em qualquer UPDATE.
-- Por isso ele fica desligado so neste bloco. Listas sem dono voltam
-- para a conta mais antiga, a que existia antes da outra conta.
-- Pode rodar este bloco de novo: so mexe em linha com owner_id nulo.
-- ---------------------------------------------------------------------------
alter table public.board_columns disable trigger board_columns_stamp_scope;
alter table public.board_cards disable trigger board_cards_stamp_scope;

update public.board_columns
set owner_id = (
  select id
  from auth.users
  order by created_at asc
  limit 1
)
where owner_id is null
  and organization_id is null;

update public.board_cards as card
set
  owner_id = col.owner_id,
  organization_id = col.organization_id
from public.board_columns as col
where card.column_id = col.id
  and card.owner_id is null;

update public.board_cards
set owner_id = (
  select id
  from auth.users
  order by created_at asc
  limit 1
)
where owner_id is null
  and organization_id is null;

alter table public.board_columns enable trigger board_columns_stamp_scope;
alter table public.board_cards enable trigger board_cards_stamp_scope;

