---
phase: 06-silhueta-areas-de-foco
plan: 02
subsystem: database
tags: [postgres, supabase, rls, region_key, patient_focus_areas]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: patient_focus_areas table + select/insert/update/delete RLS via private.can_read_patient / private.can_write_patient; SQL Editor apply path
  - phase: 06-01
    provides: FOCUS_REGION_KEYS 30-key catalog; region_key shape ^(front|back).[a-z0-9_]+$
provides:
  - Idempotent ALTER region_key SQL (committed phase copy + gitignored Editor paste)
  - public.patient_focus_areas.region_key text nullable (no SET NOT NULL, no label backfill)
  - CHECK patient_focus_areas_region_key_format (null or ^(front|back).[a-z0-9_]+$)
  - Partial unique index patient_focus_areas_patient_region_key (patient_id, region_key) WHERE region_key IS NOT NULL
  - Hosted schema applied via SQL Editor (not supabase db push)
affects:
  - 06-03 togglePatientFocusArea INSERT/DELETE on region_key
  - 06-04 PatientFocusAreasPanel persistence

tech-stack:
  added: []
  patterns:
    - SQL Editor apply only; never supabase db push
    - ALTER existing patient_focus_areas; do not CREATE TABLE or rewrite Phase 3 policies
    - region_key stays nullable so leftover label-only rows remain readable

key-files:
  created:
    - .planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql
  modified: []

key-decisions:
  - "SQL Editor is the apply path; do not run supabase db push"
  - "region_key stays nullable; leftover label-only rows are not SET NOT NULL or backfilled (D-09, Pitfall 8)"
  - "Phase 3 patient_focus_areas_select/insert/update/delete policies left intact; no DROP/CREATE POLICY (D-09, D-10)"

patterns-established:
  - "Identity is region_key, not Portuguese label (front/back share labels)"
  - "Partial unique (patient_id, region_key) WHERE region_key IS NOT NULL prevents double-mark races; null keys stay out of the index"
  - "CHECK is format-only; Zod enum in 06-01 is the 30-key catalog lock"

requirements-completed: [REQ-18]

duration: 9min
completed: 2026-09-14
---

# Phase 6 Plan 02: SQL region_key Summary

**Hosted patient_focus_areas now has nullable region_key, format CHECK, and partial unique (patient_id, region_key) — applied in SQL Editor, not supabase db push; Phase 3 RLS policies were not dropped**

## Performance

- **Duration:** 9 min (Task 1 authoring plus human SQL Editor apply; continuation after checkpoint)
- **Started:** 2026-09-14T20:43:00Z
- **Completed:** 2026-09-14T20:52:00Z
- **Tasks:** 2
- **Files modified:** 1 committed (+ gitignored Editor copy)

## Accomplishments

- Authored idempotent SQL: `ADD COLUMN IF NOT EXISTS region_key text` (nullable), `patient_focus_areas_region_key_format` CHECK, partial unique index `patient_focus_areas_patient_region_key`
- GRANT select/insert/update/delete to `authenticated`; REVOKE from `anon`/`public`; no `service_role`; no `CREATE TABLE`; no policy rewrite
- Human confirmed resume-signal `applied` — hosted SQL Editor run succeeded. `region_key` is live and nullable. Phase 3 `patient_focus_areas_*` policies were not dropped

## Task Commits

Each task was committed atomically:

1. **Task 1: Author committed SQL and Editor copy** - `2219670` (feat)
2. **Task 2: Apply SQL in Editor [BLOCKING]** - n/a (human confirmed `applied`; no further code change)

**Plan metadata:** (this commit)

## Files Created/Modified

- `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` — source of truth (64 lines)
- `supabase/06-patient-focus-region-key.sql` — identical Editor paste copy (gitignored `/supabase/`)

## Decisions Made

- Apply path remains hosted SQL Editor; do not run `supabase db push`
- `region_key` stays nullable; leftover label-only rows are not `SET NOT NULL` and are not backfilled from `label` (D-09, Pitfall 8)
- Phase 3 policies `patient_focus_areas_select/insert/update/delete` were left intact; this script does not DROP or CREATE POLICY (D-09, D-10, T-06-01)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Human confirmed the hosted SQL Editor run succeeded. SQL was not rewritten.

The 8-check allow/deny matrix in the script footer was **not fully re-run by the human this session**. Apply succeeded; do not block. Checks 5–6 (colleague INSERT 42501 / empresa SELECT via `can_read_patient`) rely on unchanged Phase 3 policies, which the human confirmed were not dropped.

## Auth Gates

- Task 2 was `checkpoint:human-action` (SQL Editor apply). Normal flow, not a deviation. Resume-signal: `applied`.

## Known Stubs

None. This plan only ALTER'd schema; no UI stubs.

## User Setup Required

SQL Editor apply for this plan is **done** (human confirmed `applied`). Do not run `supabase db push`.

If the gitignored `supabase/06-patient-focus-region-key.sql` is missing locally, copy from `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql`.

## Next Phase Readiness

Wave 1 SQL is live. Wave 2 can start: 06-03 `togglePatientFocusArea` + `useTogglePatientFocusArea` (do not implement in this plan).

REQ-18 stays open until the ficha panel marks/unmarks in 06-03–06-04. This plan delivered REQ-18.5 persistence (`region_key` + unique index) only.

App code that INSERTs/DELETEs `region_key` on `patient_focus_areas` may start in 06-03.

## Verification

- Both SQL paths exist, 64 lines, byte-identical
- Script contains `add column if not exists region_key`
- Script contains `patient_focus_areas_region_key_format` and `^(front|back).[a-z0-9_]+$`
- Script contains unique index `patient_focus_areas_patient_region_key`
- `grep -v '^--'` has 0 matches for `drop policy`, `create policy`, `create table`, `set not null`, `service_role`, `supabase db push`
- Footer comments list the 8 allow/deny checks
- Human: SQL Editor run succeeded; `region_key` live and nullable; Phase 3 policies not dropped. 8-check matrix not fully re-run this session — not blocking
- Do not invent Table Editor screenshots

## Self-Check: PASSED

- FOUND: `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql`
- FOUND: `supabase/06-patient-focus-region-key.sql`
- FOUND: `2219670`

---
*Phase: 06-silhueta-areas-de-foco*
*Completed: 2026-09-14*
