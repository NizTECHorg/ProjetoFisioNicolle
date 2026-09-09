---
phase: 03-tipos-de-conta-e-equipe
plan: 06
subsystem: api
tags: [supabase, patients, created_by, ownership, rls]

requires:
  - phase: 03-01
    provides: canWritePatient UX predicate keyed on patientCreatedBy
  - phase: 03-02
    provides: patients.created_by column + BEFORE INSERT trigger + private.can_view_profile
provides:
  - createdBy / createdByName on PatientListItem, Patient, PatientDashboard
  - createPatient stamps created_by from supabase.auth.getUser()
  - list/detail/dashboard select created_by and resolve owner names from profiles
affects:
  - 03-07 empresa Ficha de {nome} line and read-only ficha chrome

tech-stack:
  added: []
  patterns:
    - Client stamps created_by; SQL trigger remains the authority against omit/spoof
    - Owner display names via one profiles select, not a bakery RPC or JS tenant filter
    - listActiveTherapists stays unfiltered; RLS can_view_profile scopes it

key-files:
  created: []
  modified:
    - src/types/patient.ts
    - src/services/patients.service.ts

key-decisions:
  - "Batch-resolve createdByName via one profiles select; do not JS-filter patients"
  - "Leave listActiveTherapists unchanged; RLS can_view_profile is the tenant scope"

patterns-established:
  - "createPatient copies createPatientAlert getUser + Sessão expirada. Entre novamente."
  - "createdBy from row.created_by; createdByName from profiles.full_name in one IN query"

requirements-completed: [REQ-15]

duration: 2min
completed: 2026-09-09
---

# Phase 3 Plan 06: created_by no serviço de pacientes Summary

**createPatient stamps `created_by` from the session user; list, detail, and dashboard expose `createdBy` / `createdByName` for D-05/D-06 without filtering patients in JS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-09T20:27:37Z
- **Completed:** 2026-09-09T20:29:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `PatientListItem`, `Patient`, and `PatientDashboard` declare `createdBy` and `createdByName` (`CreatePatientInput` unchanged)
- `createPatient` requires a session (`Sessão expirada. Entre novamente.`) and sets `payload.created_by = user.id` (belt-and-suspenders with the Plan 03-02 trigger)
- `LIST_COLUMNS`, `DETAIL_COLUMNS`, and `DASHBOARD_COLUMNS` select `created_by`; mappers fill `createdBy`
- Owner display names resolved with one `profiles` select (`id, full_name` where `id in (...)`); missing/unreadable names stay `null`
- `src/services/sessions.service.ts` left untouched — `private.can_view_profile` already scopes `listActiveTherapists`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add createdBy to patient types** - `05f07d9` (feat)
2. **Task 2: Stamp created_by and map owner fields** - `8e5e015` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/types/patient.ts` — `createdBy` / `createdByName` on list, detail, and dashboard types
- `src/services/patients.service.ts` — stamp on insert, select `created_by`, map owner id/name

## Decisions Made

- Resolve `createdByName` with a batched `profiles` lookup after the patients query, not an embed or bakery RPC. Autônomo lists are typically self; empresa needs the name for `Ficha de {nome}` in Plan 03-07.
- Do not filter the patient list in JavaScript by account type — RLS (`can_read_patient`) is the authority (T-03-05).
- Do not change `listActiveTherapists`; Plan 03-02 `can_view_profile` already limits profiles to self or active org teammates.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** Executed as specified. No scope creep.

## Issues Encountered

None

## Auth Gates

None

## User Setup Required

None - no external service configuration required. Live SQL already applied (`patients.created_by` exists).

## Next Phase Readiness

Wave 2 client ownership is ready. Plan 03-07 can show `Ficha de {createdByName}` for empresa and gate writes with `canWritePatient(viewerId, patient.createdBy)`.

Legacy rows with `created_by` null remain possible until backfilled; mappers expose `null` and do not invent an owner. REQ-15 stays open until login gates (03-04), equipe (03-05), and empresa ficha UI (03-07) land.

## Verification

- `grep -v '^#' src/types/patient.ts | grep -c "createdBy"` → 9 (>= 3)
- `grep -v '^#' src/services/patients.service.ts | grep -c "created_by"` → 23 (>= 3)
- `grep -v '^#' src/services/patients.service.ts | grep -c "createdBy"` → 11
- `createPatient` payload includes `created_by: user.id` after `supabase.auth.getUser()`
- `LIST_COLUMNS` and `DETAIL_COLUMNS` include `created_by`
- `npm run typecheck` exits 0
- `src/services/sessions.service.ts` unmodified

## Self-Check: PASSED

- FOUND: `src/types/patient.ts`
- FOUND: `src/services/patients.service.ts`
- FOUND: `05f07d9` feat(03-06): add createdBy to patient types
- FOUND: `8e5e015` feat(03-06): stamp created_by on patient create

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-09*
