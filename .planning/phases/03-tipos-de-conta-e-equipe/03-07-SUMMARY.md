---
phase: 03-tipos-de-conta-e-equipe
plan: 07
subsystem: ui
tags: [empresa, consulta, canWrite, ficha, d-06, d-07]

requires:
  - phase: 03-01
    provides: canWritePatient UX predicate keyed on patientCreatedBy
  - phase: 03-04
    provides: useAuth profile.accountType and user.id
  - phase: 03-06
    provides: createdBy / createdByName on list, detail, and dashboard
provides:
  - Empresa list line Ficha de {createdByName} on teammate rows
  - Consult banner on teammate ficha
  - canWrite hidden write controls across ficha panels
affects:
  - Phase 3 UAT (empresa consulta vs own-ficha writes)
  - Future ficha write surfaces (must honor canWrite)

tech-stack:
  added: []
  patterns:
    - Hide write controls when !canWrite; do not render disabled tappable buttons
    - canWrite?: boolean = true so existing callers keep writing
    - Forward canWrite through PatientEvaluationPanel into PatientPhysicalEvaluationPanel

key-files:
  created: []
  modified:
    - src/pages/PatientsPage.tsx
    - src/pages/PatientPage.tsx
    - src/components/patients/PatientAlertsPanel.tsx
    - src/components/patients/PatientGoalsPanel.tsx
    - src/components/patients/PatientEvolutionsPanel.tsx
    - src/components/patients/PatientEvaluationPanel.tsx
    - src/components/patients/PatientCadastroPanel.tsx
    - src/components/patients/PatientPhysicalEvaluationPanel.tsx

key-decisions:
  - "Forward canWrite through PatientEvaluationPanel because PhysicalEvaluationPanel is nested there, not PatientPage"
  - "Hide write controls; do not disable buttons that look tappable"
  - "PDF import block stays unmounted in consult mode — it only exists to write"

patterns-established:
  - "canWrite?: boolean = true on ficha panels; gate JSX, do not disable"
  - "Nested write surfaces inherit canWrite from the parent that mounts them"

requirements-completed: [REQ-15]

duration: 6min
completed: 2026-09-09
---

# Phase 3 Plan 07: Consulta da empresa na lista e na ficha Summary

**Empresa sees `Ficha de {nome}` on teammate rows and a consult-only ficha: banner plus hidden write controls (`canWritePatient`), including exame físico forwarded through `PatientEvaluationPanel`**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-09T20:43:54Z
- **Completed:** 2026-09-09T20:50:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Empresa list shows `Ficha de {createdByName || 'fisioterapeuta'}` on teammate mobile cards (replaces status · program) and as an extra muted line under the name on desktop; autônomo/fisio keep the original subtitle
- Teammate ficha shows `Somente consulta — você vê a ficha, mas não pode alterar.` and hides identity / Entenda o caso pencils
- `canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)` is passed to every ficha panel
- All six panels declare `canWrite?: boolean = true` and hide Adicionar / Editar / Remover, editors, and delete dialogs when false
- `PatientEvaluationPanel` forwards `canWrite` into `PatientPhysicalEvaluationPanel` so the default `true` cannot leave exame físico writable
- Novo paciente / Cadastrar primeiro paciente stay visible for empresa (own rows)

## Task Commits

Each task was committed atomically:

1. **Task 1: Empresa list line and ficha banner** - `3c8c99c` (feat)
2. **Task 2: Hide write controls on all ficha panels** - `d17b5d7` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/pages/PatientsPage.tsx` — empresa creator line; create actions unguarded
- `src/pages/PatientPage.tsx` — banner, `canWritePatient`, hidden pencils, `canWrite` to panels
- `src/components/patients/PatientAlertsPanel.tsx` — hide add/edit/remove and dialogs
- `src/components/patients/PatientGoalsPanel.tsx` — hide Nova/pencils; no status toggle on click
- `src/components/patients/PatientEvolutionsPanel.tsx` — hide Nova sessão / edit / delete
- `src/components/patients/PatientEvaluationPanel.tsx` — hide Nova/edit/delete; forward `canWrite`
- `src/components/patients/PatientCadastroPanel.tsx` — hide section pencils; skip identity opener
- `src/components/patients/PatientPhysicalEvaluationPanel.tsx` — hide upload/apply/delete

## Decisions Made

- Forward `canWrite` through `PatientEvaluationPanel`. `PatientPhysicalEvaluationPanel` is mounted there, not on `PatientPage`. Passing it only at the page would leave the default `true` and keep exame físico writable on a teammate ficha.
- Hide controls instead of disabling them so consulta UI does not look tappable.
- Unmount the PDF import `<details>` in consult mode. That block only exists to write (upload, apply, open structured create).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Hide Entenda o caso submit editor when !canWrite**
- **Found during:** Task 2 (Hide write controls)
- **Issue:** Task 1 hid the pencil but the Entenda o caso `Modal` (updatePatient submit) still mounted
- **Fix:** Render the modal only when `canWrite`
- **Files modified:** `src/pages/PatientPage.tsx`
- **Verification:** Pencil and modal are both gated; `npm run typecheck` exits 0
- **Committed in:** `d17b5d7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Correctness only — no extra product scope. Matches D-07 hide-not-disable.

## Issues Encountered

`npm run lint` still exits 1 on pre-existing `src/services/aiPhysicalEvaluation.service.ts` (`@typescript-eslint/no-explicit-any`). Out of scope; logged in `deferred-items.md`. ESLint on the eight plan files exits 0. `npm run typecheck` exits 0.

## Auth Gates

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 3 plans are complete. Ready for `/gsd-verify-work 3` (empresa teammate ficha = consulta; own ficha still writes; autônomo has no `Ficha de` line). RLS remains the write authority (T-03-05).

## Verification

- `grep -v '^#' src/pages/PatientsPage.tsx | grep -c "Ficha de"` → 1
- `grep -v '^#' src/pages/PatientPage.tsx | grep -c "canWritePatient"` → 2
- `grep -v '^#' src/pages/PatientPage.tsx | grep -c "Somente consulta"` → 1
- `grep -l canWrite` on the six panels → 6
- `PatientEvaluationPanel` passes `canWrite={canWrite}` to `PatientPhysicalEvaluationPanel`
- Novo paciente / Cadastrar primeiro paciente have no `canWrite` guard
- ESLint on plan files exits 0; `npm run typecheck` exits 0

## Self-Check: PASSED

- FOUND: `src/pages/PatientsPage.tsx`
- FOUND: `src/pages/PatientPage.tsx`
- FOUND: `src/components/patients/PatientAlertsPanel.tsx`
- FOUND: `src/components/patients/PatientGoalsPanel.tsx`
- FOUND: `src/components/patients/PatientEvolutionsPanel.tsx`
- FOUND: `src/components/patients/PatientEvaluationPanel.tsx`
- FOUND: `src/components/patients/PatientCadastroPanel.tsx`
- FOUND: `src/components/patients/PatientPhysicalEvaluationPanel.tsx`
- FOUND: `3c8c99c` feat(03-07): show empresa consult banner and Ficha de line
- FOUND: `d17b5d7` feat(03-07): hide ficha write controls when consult-only

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-09*
