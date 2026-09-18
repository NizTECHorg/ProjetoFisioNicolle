-- REQ-20 Google Calendar. D-04 D-09. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Secrets: sem GRANT a authenticated/anon.
-- Nao DROP patient_sessions_* / can_*. Nao adicionar google_event_id em patient_sessions.
-- Nao reescrever private.can_read_patient / can_write_patient.
-- Tabelas: connections (metadata), secrets (service_role only), session_links (D-09).

-- ---------------------------------------------------------------------------
-- 1. google_calendar_connections — metadados por auth.uid() (D-04).
-- Sem tokens. google_email + connected_at apenas.
-- ---------------------------------------------------------------------------
create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  google_email text,
  connected_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. google_calendar_secrets — refresh/access tokens (REQ-20.3).
-- REVOKE ALL de public/anon/authenticated. Sem GRANT a authenticated.
-- Edge Function com service_role apenas. Sem Vault/pgsodium neste plano.
-- ---------------------------------------------------------------------------
create table if not exists public.google_calendar_secrets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. google_calendar_session_links — vinculo sessao <-> evento Google (D-09).
-- PK (user_id, session_id). Nao guardar google_event_id em patient_sessions.
-- ---------------------------------------------------------------------------
create table if not exists public.google_calendar_session_links (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.patient_sessions (id) on delete cascade,
  google_event_id text not null,
  calendar_id text not null default 'primary',
  primary key (user_id, session_id)
);

create index if not exists google_calendar_session_links_session_idx
  on public.google_calendar_session_links (session_id);

-- ---------------------------------------------------------------------------
-- 4. Grants
-- connections + session_links: authenticated CRUD no proprio user_id.
-- secrets: REVOKE ALL — zero GRANT a authenticated/anon (T-08-04 / REQ-20.3).
-- ---------------------------------------------------------------------------
revoke all on table public.google_calendar_connections from anon, public;
grant select, insert, update, delete on table public.google_calendar_connections to authenticated;

revoke all on table public.google_calendar_session_links from anon, public;
grant select, insert, update, delete on table public.google_calendar_session_links to authenticated;

revoke all on table public.google_calendar_secrets from public, anon, authenticated;
-- NO grant to authenticated — service_role / Edge Function only (REQ-20.3)

-- ---------------------------------------------------------------------------
-- 5. RLS. FORCE em connections + session_links (Phase 5 analog).
-- secrets: ENABLE + FORCE sem politicas authenticated (deny-all para JWT).
-- ---------------------------------------------------------------------------
alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_connections force row level security;

alter table public.google_calendar_session_links enable row level security;
alter table public.google_calendar_session_links force row level security;

alter table public.google_calendar_secrets enable row level security;
alter table public.google_calendar_secrets force row level security;

-- connections policies
drop policy if exists google_calendar_connections_select on public.google_calendar_connections;
drop policy if exists google_calendar_connections_insert on public.google_calendar_connections;
drop policy if exists google_calendar_connections_update on public.google_calendar_connections;
drop policy if exists google_calendar_connections_delete on public.google_calendar_connections;

create policy google_calendar_connections_select
  on public.google_calendar_connections
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy google_calendar_connections_insert
  on public.google_calendar_connections
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy google_calendar_connections_update
  on public.google_calendar_connections
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy google_calendar_connections_delete
  on public.google_calendar_connections
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- session_links policies
drop policy if exists google_calendar_session_links_select on public.google_calendar_session_links;
drop policy if exists google_calendar_session_links_insert on public.google_calendar_session_links;
drop policy if exists google_calendar_session_links_update on public.google_calendar_session_links;
drop policy if exists google_calendar_session_links_delete on public.google_calendar_session_links;

create policy google_calendar_session_links_select
  on public.google_calendar_session_links
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy google_calendar_session_links_insert
  on public.google_calendar_session_links
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy google_calendar_session_links_update
  on public.google_calendar_session_links
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy google_calendar_session_links_delete
  on public.google_calendar_session_links
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- secrets: no authenticated policies — revoke + FORCE RLS = deny-all for JWT role

-- ---------------------------------------------------------------------------
-- 6. Recarrega o schema do PostgREST (opcional; idempotente).
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Checagens no SQL Editor (apos Success):
-- 1. Tabelas google_calendar_connections / secrets / session_links existem
-- 2. authenticated SELECT * FROM google_calendar_secrets → permission denied
-- 3. authenticated SELECT em connections (proprio user_id) permitido (vazio ate connect)
-- 4. PK session_links = (user_id, session_id); sem coluna google_event_id em patient_sessions
-- 5. Phase 3 patient_sessions_* / can_* helpers inalterados
-- ---------------------------------------------------------------------------
