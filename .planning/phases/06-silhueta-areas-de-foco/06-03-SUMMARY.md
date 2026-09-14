---
phase: 06-silhueta-areas-de-foco
plan: 03
subsystem: api
tags: [supabase, tanstack-query, zod, mapDbError, patient_focus_areas]

requires:
  - phase: 06-01
    provides: FOCUS_REGION_KEYS, getFocusRegion, focusRegionKeySchema, PatientFocusArea.regionKey
  - phase: 06-02
    provides: Hosted patient_focus_areas.region_key nullable column, format CHECK, partial unique index
provides:
  - getPatientById SELECT includes region_key
  - mapPatient skips null/unknown region_key leftovers
  - togglePatientFocusArea INSERT/DELETE with Zod parse and mapDbError
  - useTogglePatientFocusArea mutation with Portuguese toasts
affects:
  - 06-04 PatientFocusAreasPanel mutate(regionKey)

tech-stack:
  added: []
  patterns:
    - page → hook → service → RLS; panel must not import supabase
    - Focus writes use throwIfFocusError(mapDbError); other patient CRUD keeps throwIfError
    - Unmark DELETEs the row; empty state is focusAreas.length === 0
    - INSERT unique race 23505 returns marked without throwing Já existe um registro

key-files:
  created: []
  modified:
    - src/services/patients.service.ts
    - src/hooks/usePatients.ts

key-decisions:
  - "Focus writes use throwIfFocusError + mapDbError; existing throwIfError stays for other patient CRUD (Pitfall 9, T-06-01)"
  - "Unmark DELETEs the patient_focus_areas row; empty state is focusAreas.length === 0 (D-06)"
  - "INSERT 23505 unique race returns marked without Já existe um registro (Pitfall 7)"
  - "useTogglePatientFocusArea closes over ficha patientId; mutate argument is regionKey only (T-06-02)"

patterns-established:
  - "SELECT region_key; skip null or unknown keys so leftovers never highlight (D-07, D-09)"
  - "togglePatientFocusArea parses focusRegionKeySchema then INSERT catalog label or DELETE by id"
  - "useTogglePatientFocusArea invalidates the patient and toasts Área marcada / Área desmarcada; 42501 keeps Você não tem permissão para esta ação."

requirements-completed: [REQ-18]

duration: 4min
completed: 2026-09-14
---

# Phase 6 Plan 03: toggle service Summary

**getPatientById SELECTs region_key and skips leftovers; togglePatientFocusArea INSERT/DELETE with Zod + mapDbError; useTogglePatientFocusArea toasts Área marcada / Área desmarcada**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-14T20:52:24Z
- **Completed:** 2026-09-14T20:56:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `getPatientById` selects `id, region_key, label, is_active, sort_order`; `mapPatient` skips null or unknown keys and uses catalog label/key
- `togglePatientFocusArea` parses `focusRegionKeySchema`, then DELETE if a row exists or INSERT catalog `{ patient_id, region_key, label, is_active: true, sort_order }`
- Focus writes throw `mapDbError` (42501 → Você não tem permissão para esta ação.); unique 23505 race returns `'marked'`
- `useTogglePatientFocusArea(patientId)` mutates with `regionKey` only, invalidates the patient cache, and toasts UI-SPEC copy

## Task Commits

Each task was committed atomically:

1. **Task 1: SELECT region_key and togglePatientFocusArea** - `f8e7871` (feat)
2. **Task 2: useTogglePatientFocusArea mutation** - `4310201` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/services/patients.service.ts` — `FOCUS_COLUMNS`, mapper skip, `throwIfFocusError`, `togglePatientFocusArea`
- `src/hooks/usePatients.ts` — `useTogglePatientFocusArea` with invalidate + Portuguese toasts

## Decisions Made

- Keep existing `throwIfError` (raw `error.message`) for non-focus patient CRUD; only focus writes use `mapDbError` (Pitfall 9, T-06-01)
- Unmark DELETEs the row; do not `UPDATE is_active` — empty state is `focusAreas.length === 0` (D-06)
- INSERT unique race (`23505`) returns `'marked'` without toasting Já existe um registro com esses dados (Pitfall 7)
- Hook closes over ficha `patientId`; `mutate` argument is `regionKey` only (T-06-02)
- INSERT `label` is `catalog.label` from `getFocusRegion`, never chip text (T-06-03)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Project-wide `npm run lint` still fails on pre-existing `err: any` in `src/services/aiPhysicalEvaluation.service.ts` (same as Phase 05 / 06-01). Lint and typecheck of files this plan touched are green. Logged in `deferred-items.md`.

## Auth Gates

None.

## Known Stubs

None. The 06-01 `regionKey: ''` mapper stub is gone — SELECT skips null/unknown keys.

## User Setup Required

None - no external service configuration required. SQL Editor apply from 06-02 already succeeded. Do not run `supabase db push`.

## Next Phase Readiness

- Plan 06-04 can call `useTogglePatientFocusArea(patientId)` and `mutate(regionKey)` without importing supabase
- Do not edit `PatientPage` in this plan; 06-04 owns the panel, chip, and BodyFocus removal
- REQ-18 stays open until the ficha panel marks/unmarks in 06-04

## Verification

- `togglePatientFocusArea` and `useTogglePatientFocusArea` exported
- SELECT includes `region_key`; mapper skips null/unknown keys
- Unmark path calls `.delete(` not `.update(` `is_active`
- Existing `throwIfError` still exists for non-focus functions
- Toasts: Área marcada / Área desmarcada / Não foi possível salvar a área
- `npx eslint src/services/patients.service.ts src/hooks/usePatients.ts` and `npm run typecheck` exit 0

## Self-Check: PASSED

- FOUND: `.planning/phases/06-silhueta-areas-de-foco/06-03-SUMMARY.md`
- FOUND: `src/services/patients.service.ts`
- FOUND: `src/hooks/usePatients.ts`
- FOUND: `f8e7871`
- FOUND: `4310201`

---
*Phase: 06-silhueta-areas-de-foco*
*Completed: 2026-09-14*
