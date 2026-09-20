---
phase: 12-avaliacoes-musculoesqueleticas
plan: 02
subsystem: api
tags: [avaliacoes, ficha, jsonb, evaluations-service, react-query, legacy-compat, zod]

# Dependency graph
requires:
  - phase: 12-avaliacoes-musculoesqueleticas/01
    provides: EvaluationFicha schema, UpsertPatientEvaluationInput.ficha, live patient_evaluations.ficha column
provides:
  - evaluations.service select/map/insert/update with ficha jsonb
  - legacyToFicha read-only seed when ficha empty and legacy text present
  - hooks passthrough of UpsertPatientEvaluationInput including ficha
affects: [12-03, 12-04, wave-3-ficha-ui, wave-3-pdf]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Prefer parsed ficha; else legacyToFicha seed; else emptyEvaluationFicha (read-only, no UPDATE)
    - Zod-parse ficha before insert/update; mirror main_complaint from queixa when non-empty
    - Do not regenerate database.types.ts — cast ficha as unknown/Record

key-files:
  created: []
  modified:
    - src/services/evaluations.service.ts
    - src/hooks/usePatients.ts
    - src/components/patients/PatientEvaluationEditorForm.tsx

key-decisions:
  - "Write persists input.ficha (default {}); create does not require mainComplaint (D-03)"
  - "Read-only legacy→ficha seed; never UPDATE rows during list"
  - "Mirror main_complaint from anamnese.queixa.oQueTrouxe for list preview when non-empty"

patterns-established:
  - "legacyToFicha maps legacy text columns into closest EvaluationFicha blocks with documented comment"
  - "resolveEvaluationFicha: non-empty ficha keys or meaningful raw leaves win over legacy seed"
  - "Mutation hooks pass UpsertPatientEvaluationInput intact; callers must include ficha"

requirements-completed: [REQ-24, REQ-24.2]

# Metrics
duration: 3min
completed: 2026-09-20
---

# Phase 12 Plan 02: Service + Hooks Ficha CRUD Summary

**PostgREST evaluations CRUD persists/loads `ficha` jsonb with Zod validation and read-only legacy text→ficha seeding**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-09-20T19:22:50Z
- **Completed:** 2026-09-20T19:25:45Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments
- Extended `EVALUATION_COLUMNS` / `EvaluationRow` with `ficha`; create/update write Zod-parsed JSONB
- Implemented `legacyToFicha` + `resolveEvaluationFicha` so empty `ficha` rows with legacy text remain usable in UI/PDF
- Create accepts `{ performedOn, ficha: {} }` without `mainComplaint`; mirrors complaint from queixa when present
- Hooks keep Portuguese toasts and `['patients', patientId, 'evaluations']` invalidation; form now passes `ficha` on mutate

## Task Commits

Each task was committed atomically:

1. **Task 1: Service select/map/write ficha + legacyToFicha** - `bfd0868` (feat)
2. **Task 2: Hooks toast path accepts ficha upsert** - `3abecd7` (feat)

**Plan metadata:** _(this docs commit)_

## Files Created/Modified
- `src/services/evaluations.service.ts` — ficha select/map/write, `legacyToFicha`, Zod upsert gate, complaint mirror
- `src/hooks/usePatients.ts` — document intact upsert passthrough (query keys + PT toasts unchanged)
- `src/components/patients/PatientEvaluationEditorForm.tsx` — include `ficha` in mutate input (Rule 1)

## Decisions Made
- Prefer live `ficha` when JSON has keys or meaningful raw leaves; otherwise seed from legacy; otherwise `emptyEvaluationFicha()`
- Leave legacy scalar columns writable from optional upsert fields during transitional UI
- Do not call `togglePatientFocusArea`; do not edit `database.types.ts`

## TDD Gate Compliance
- Task 1 marked `tdd="true"`; project has no test runner and plan threat model forbids new packages (`T-12-SC`)
- Behaviors verified via `npm run typecheck` + acceptance greps (`legacyToFicha`, `EVALUATION_COLUMNS` includes `ficha`)
- Warning: no separate `test(12-02)` RED commit — RED/GREEN sequence not applicable without adding a package

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Editor form stripped ficha on submit**
- **Found during:** Task 2 (Hooks toast path accepts ficha upsert)
- **Issue:** `PatientEvaluationEditorForm` built mutate input without `values.ficha`, which would overwrite rich JSONB with `{}` on update
- **Fix:** Pass `ficha: values.ficha` in the upsert payload
- **Files modified:** `src/components/patients/PatientEvaluationEditorForm.tsx`
- **Verification:** typecheck green; grep confirms `ficha: values.ficha`
- **Committed in:** `3abecd7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correctness fix for ficha persistence through the only current UI caller; no scope creep into Wave 3 composer.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Assumes `patient_evaluations.ficha` already applied (12-01).

## Next Phase Readiness
- Service/hooks ready for rich ficha composer (12-03) and PDF (12-04)
- Date-only create is type-safe end-to-end in service + hooks
- Smoke create against live PostgREST still depends on 12-01 SQL already applied

## Self-Check: PASSED
- FOUND: `src/services/evaluations.service.ts` (`legacyToFicha`, `ficha` in columns)
- FOUND: `src/hooks/usePatients.ts`, `src/components/patients/PatientEvaluationEditorForm.tsx`
- FOUND commits: `bfd0868`, `3abecd7`

---
*Phase: 12-avaliacoes-musculoesqueleticas*
*Completed: 2026-09-20*
