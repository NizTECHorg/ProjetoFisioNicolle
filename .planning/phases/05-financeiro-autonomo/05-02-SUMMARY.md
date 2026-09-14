---
phase: 05-financeiro-autonomo
plan: 02
subsystem: database
tags: [postgres, supabase, rls, finance, autonomo, snapshot]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: profiles.account_type autonomo|empresa|fisioterapeuta; private.can_write_patient; SQL Editor apply path
  - phase: 05-01
    provides: Clinic finance DTOs and XOR/Pago Zod (no live tables yet)

provides:
  - Idempotent catalog + charge RLS SQL (committed phase copy + gitignored Editor paste)
  - public.autonomo_prices with archive via archived_at (no DELETE)
  - public.autonomo_session_charges with XOR check and unique(session_id)
  - snapshot_autonomo_session_charge preserve-not-recopy BEFORE trigger
  - public.autonomo_finance_totals security invoker in America/Sao_Paulo
  - Hosted schema applied via SQL Editor (not supabase db push)
affects:
  - 05-03 finance.service and useFinance
  - 05-04 session editor Valor da consulta
  - 05-05 AutonomoFinancePage

tech-stack:
  added: []
  patterns:
    - SQL Editor apply only; never supabase db push
    - Dedicated finance tables; money never on patient_sessions
    - Catalog copy only on INSERT or price_id change; same price_id UPDATE copies name/amount from OLD

key-files:
  created:
    - .planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql
  modified: []

key-decisions:
  - "SQL Editor is the apply path; do not run supabase db push"
  - "Dedicated autonomo_prices and autonomo_session_charges; no money columns on patient_sessions (T-05-01)"
  - "Snapshot trigger preserve-not-recopy: same price_id UPDATE copies amount_brl and price_name from OLD without SELECT live catalog (D-04, D-07)"
  - "FORCE RLS owner+autonomo; GRANT select/insert/update only; no DELETE policy (D-01, D-03)"

patterns-established:
  - "Catalog archive is UPDATE archived_at; charges snapshot name+amount_brl"
  - "autonomo_finance_totals is security invoker SUM of is_paid snapshots; America/Sao_Paulo buckets; includes paid agendada"
  - "Charge INSERT/UPDATE with check requires owner+autonomo AND private.can_write_patient(session.patient_id)"

requirements-completed: [REQ-17]

duration: 10min
completed: 2026-09-14
---

# Phase 5 Plan 02: SQL catalog/charges/RLS Summary

**Hosted Postgres now has autonomo_prices and autonomo_session_charges with XOR + preserve-not-recopy snapshot trigger, owner+autonomo FORCE RLS (no DELETE), and autonomo_finance_totals in America/Sao_Paulo — applied in SQL Editor, not supabase db push**

## Performance

- **Duration:** 10 min (Task 1 authoring plus human SQL Editor apply; continuation after checkpoint)
- **Started:** 2026-09-14T18:35:00Z
- **Completed:** 2026-09-14T18:44:30Z
- **Tasks:** 2
- **Files modified:** 1 committed (+ gitignored Editor copy)

## Accomplishments

- Authored idempotent SQL: `autonomo_prices`, `autonomo_session_charges` (XOR + unique session), FORCE RLS owner+autonomo, no DELETE grant/policy
- Snapshot trigger copies catalog name/amount only on INSERT or `price_id` change; same-`price_id` UPDATE copies `amount_brl` and `price_name` from OLD (preserve-not-recopy)
- `autonomo_finance_totals()` is `security invoker`, buckets in `America/Sao_Paulo`, SUMs paid snapshots including paid `agendada`
- Human applied the script in the hosted SQL Editor; live schema matches the committed copy. `patient_sessions` was not altered with money columns

## Task Commits

Each task was committed atomically:

1. **Task 1: Author committed SQL and Editor copy** - `5a7089d` (feat)
2. **Task 2: Apply SQL in Editor [BLOCKING]** - n/a (human confirmed `applied`; no further code change)

**Plan metadata:** (this commit)

## Files Created/Modified

- `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` — source of truth (341 lines)
- `supabase/05-autonomo-finance.sql` — identical Editor paste copy (gitignored `/supabase/`)

## Decisions Made

- Apply path remains hosted SQL Editor; do not run `supabase db push`
- Money lives on dedicated `autonomo_prices` / `autonomo_session_charges`, not on `patient_sessions` (T-05-01). Empresa can still SELECT colleague sessions without finance fields
- Preserve-not-recopy: catalog SELECT and archived reject run only on INSERT or `NEW.price_id IS DISTINCT FROM OLD.price_id`. Mark-paid / upsert that keeps the same `price_id` copies snapshot columns from `OLD` and must not re-read live catalog (D-04, D-07, T-05-03)
- FORCE RLS + owner+autonomo policies; GRANT select/insert/update only; archive via `archived_at` (D-01, D-03, T-05-04)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Human confirmed the hosted SQL Editor run succeeded. SQL was not rewritten.

## Auth Gates

- Task 2 was `checkpoint:human-action` (SQL Editor apply). Normal flow, not a deviation. Resume-signal: `applied`.

## User Setup Required

SQL Editor apply for this plan is **done** (human confirmed `applied`). Do not run `supabase db push`.

If the gitignored `supabase/05-autonomo-finance.sql` is missing locally, copy from `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql`.

## Next Phase Readiness

Wave 1 SQL is live. Wave 2 can start: 05-03 `finance.service` + `useFinance` (do not implement in this plan).

REQ-17 stays open until session editor Valor da consulta and `/financeiro` land in 05-04–05-05. This plan delivered REQ-17 persistence and RLS only.

App code that talks to `autonomo_prices` / `autonomo_session_charges` / `autonomo_finance_totals` may start in 05-03.

## Verification

- Both SQL paths exist and match (341 lines)
- Script contains `create table if not exists public.autonomo_prices` and `public.autonomo_session_charges`
- Script contains `autonomo_session_charges_xor`, `snapshot_autonomo_session_charge`, `IS DISTINCT FROM`, `OLD.price_name`
- Script contains `autonomo_finance_totals` and `America/Sao_Paulo`
- Script contains `force row level security` and `private.can_write_patient`
- `grep -v '^--'` has 0 matches for `alter table public.patient_sessions`, `grant delete`, `service_role`, `supabase db push`
- Human: SQL Editor run succeeded; treat hosted schema as applied

## Self-Check: PASSED

- FOUND: `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql`
- FOUND: `supabase/05-autonomo-finance.sql`
- FOUND: `5a7089d`
---

*Phase: 05-financeiro-autonomo*
*Completed: 2026-09-14*
