-- REQ-17 financeiro do autonomo. D-01 a D-10. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao alterar patient_sessions com colunas de dinheiro.
-- Catalogo variavel (nome + BRL), archive via archived_at, snapshot na cobranca.
-- Totais: SUM de snapshots pagos em America/Sao_Paulo (inclui agendada paga).

-- ---------------------------------------------------------------------------
-- 1. autonomo_prices — catalogo do dono (D-02). Sem DELETE (D-03).
-- ---------------------------------------------------------------------------
create table if not exists public.autonomo_prices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  amount_brl numeric(12, 2) not null check (amount_brl > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists autonomo_prices_owner_idx
  on public.autonomo_prices (owner_id);

create index if not exists autonomo_prices_owner_active_idx
  on public.autonomo_prices (owner_id)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- 2. autonomo_session_charges — 1:1 com sessao. Snapshot + pago (D-05, D-07).
-- price_id FK sem ON UPDATE CASCADE de amount (D-04).
-- ---------------------------------------------------------------------------
create table if not exists public.autonomo_session_charges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  session_id uuid not null unique references public.patient_sessions (id) on delete cascade,
  price_id uuid references public.autonomo_prices (id),
  price_name text not null,
  amount_brl numeric(12, 2) not null check (amount_brl > 0),
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint autonomo_session_charges_xor
    check (
      (price_id is not null)
      or (price_id is null and price_name = 'Avulso')
    )
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'autonomo_session_charges_xor'
      and conrelid = 'public.autonomo_session_charges'::regclass
  ) then
    alter table public.autonomo_session_charges
      add constraint autonomo_session_charges_xor
      check (
        (price_id is not null)
        or (price_id is null and price_name = 'Avulso')
      );
  end if;
end
$$;

create index if not exists autonomo_session_charges_owner_idx
  on public.autonomo_session_charges (owner_id);

create index if not exists autonomo_session_charges_price_idx
  on public.autonomo_session_charges (price_id);

-- ---------------------------------------------------------------------------
-- 3. Grants: authenticated le/escreve. Sem delete (D-03 / T-05-04).
-- ---------------------------------------------------------------------------
revoke all on table public.autonomo_prices from anon, public;
revoke all on table public.autonomo_session_charges from anon, public;
grant select, insert, update on table public.autonomo_prices to authenticated;
grant select, insert, update on table public.autonomo_session_charges to authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS owner + autonomo. FORCE (D-01 / T-05-07). Sem politica DELETE.
-- ---------------------------------------------------------------------------
alter table public.autonomo_prices enable row level security;
alter table public.autonomo_prices force row level security;
alter table public.autonomo_session_charges enable row level security;
alter table public.autonomo_session_charges force row level security;

drop policy if exists autonomo_prices_all on public.autonomo_prices;
drop policy if exists autonomo_prices_select on public.autonomo_prices;
drop policy if exists autonomo_prices_insert on public.autonomo_prices;
drop policy if exists autonomo_prices_update on public.autonomo_prices;
drop policy if exists autonomo_prices_delete on public.autonomo_prices;

create policy autonomo_prices_select
  on public.autonomo_prices
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );

create policy autonomo_prices_insert
  on public.autonomo_prices
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );

create policy autonomo_prices_update
  on public.autonomo_prices
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );

drop policy if exists autonomo_session_charges_all on public.autonomo_session_charges;
drop policy if exists autonomo_session_charges_select on public.autonomo_session_charges;
drop policy if exists autonomo_session_charges_insert on public.autonomo_session_charges;
drop policy if exists autonomo_session_charges_update on public.autonomo_session_charges;
drop policy if exists autonomo_session_charges_delete on public.autonomo_session_charges;

create policy autonomo_session_charges_select
  on public.autonomo_session_charges
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );

create policy autonomo_session_charges_insert
  on public.autonomo_session_charges
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
    and exists (
      select 1
      from public.patient_sessions s
      where s.id = session_id
        and (select private.can_write_patient(s.patient_id))
    )
  );

create policy autonomo_session_charges_update
  on public.autonomo_session_charges
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
    and exists (
      select 1
      from public.patient_sessions s
      where s.id = session_id
        and (select private.can_write_patient(s.patient_id))
    )
  );

-- ---------------------------------------------------------------------------
-- 5. snapshot_autonomo_session_charge
-- Catalog copy + archived reject so em INSERT ou price_id mudou.
-- UPDATE com o mesmo price_id: copia amount/name de OLD (preserve-not-recopy).
-- ---------------------------------------------------------------------------
create or replace function public.snapshot_autonomo_session_charge()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
  v_amount numeric(12, 2);
  v_archived timestamptz;
begin
  if NEW.owner_id is null then
    NEW.owner_id := (select auth.uid());
  end if;

  if NEW.price_id is not null then
    if TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and NEW.price_id IS DISTINCT FROM OLD.price_id) then
      select p.name, p.amount_brl, p.archived_at
        into v_name, v_amount, v_archived
      from public.autonomo_prices p
      where p.id = NEW.price_id
        and p.owner_id = NEW.owner_id;

      if not found then
        raise exception 'Preco do catalogo nao encontrado';
      end if;

      if v_archived is not null then
        raise exception 'Nao e possivel alocar um preco arquivado';
      end if;

      NEW.price_name := v_name;
      NEW.amount_brl := v_amount;
    elsif TG_OP = 'UPDATE' then
      NEW.amount_brl := OLD.amount_brl;
      NEW.price_name := OLD.price_name;
    end if;
  else
    NEW.price_name := 'Avulso';
    if NEW.amount_brl is null or NEW.amount_brl <= 0 then
      raise exception 'Informe um valor avulso maior que zero';
    end if;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists autonomo_session_charges_snapshot on public.autonomo_session_charges;
create trigger autonomo_session_charges_snapshot
  before insert or update on public.autonomo_session_charges
  for each row
  execute function public.snapshot_autonomo_session_charge();

-- ---------------------------------------------------------------------------
-- 6. updated_at no catalogo. Nao toca autonomo_session_charges (D-04).
-- ---------------------------------------------------------------------------
create or replace function public.set_autonomo_prices_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists autonomo_prices_set_updated_at on public.autonomo_prices;
create trigger autonomo_prices_set_updated_at
  before update on public.autonomo_prices
  for each row
  execute function public.set_autonomo_prices_updated_at();

-- ---------------------------------------------------------------------------
-- 7. autonomo_finance_totals — SUM snapshots pagos (D-08, D-09).
-- security invoker: RLS da cobranca continua valendo (T-05-08).
-- Buckets America/Sao_Paulo via AT TIME ZONE (A1 fallback, nao date_trunc 3-arg).
-- Nao filtra status: agendada paga entra no mes.
-- ---------------------------------------------------------------------------
create or replace function public.autonomo_finance_totals()
returns table (month_total numeric, year_total numeric, always_total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(c.amount_brl) filter (
      where c.is_paid
        and date_trunc('month', s.scheduled_at AT TIME ZONE 'America/Sao_Paulo')
          = date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
    ), 0),
    coalesce(sum(c.amount_brl) filter (
      where c.is_paid
        and date_trunc('year', s.scheduled_at AT TIME ZONE 'America/Sao_Paulo')
          = date_trunc('year', now() AT TIME ZONE 'America/Sao_Paulo')
    ), 0),
    coalesce(sum(c.amount_brl) filter (where c.is_paid), 0)
  from public.autonomo_session_charges c
  join public.patient_sessions s on s.id = c.session_id;
$$;

revoke execute on function public.autonomo_finance_totals() from public, anon;
grant execute on function public.autonomo_finance_totals() to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Recarrega o schema do PostgREST (opcional; idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success) — RESEARCH Security Domain 1-10:
-- 1. Autônomo A: INSERT/SELECT/UPDATE own prices; archive; INSERT charge on own session.
-- 2. Autônomo A: cannot UPDATE `owner_id` to B.
-- 3. Autônomo A: INSERT charge with `price_id` + different `amount_brl` → stored amount equals catalog (trigger).
-- 4. Autônomo A: change catalog amount → existing charge unchanged.
-- 5. Empresa E: SELECT `autonomo_prices` / `autonomo_session_charges` → 0 rows; INSERT → 42501 / mapped permission.
-- 6. Empresa E: SELECT `patient_sessions` of therapist still works; payload has **no** money fields.
-- 7. Fisio: same deny as empresa on finance tables.
-- 8. Autônomo A: `autonomo_finance_totals()` returns only A’s paid snapshots.
-- 9. Paid `agendada` in current Brazil month increments month_total.
-- 10. Unpaid realizada does **not** increment totals.
-- ---------------------------------------------------------------------------
