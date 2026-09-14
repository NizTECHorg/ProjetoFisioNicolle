---
phase: 04-atalhos-dashboard
plan: 01
subsystem: ui
tags: [react, zustand, toast, dashboard, shortcuts, accessibility]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: canWritePatient UX predicate; RLS remains authority
  - phase: existing-ficha
    provides: PatientListItem, PatientPage aba=evolucoes|avaliacao, isSafeInternalPath

provides:
  - writablePatients / filterPatientsByName / patientFichaPath / PATIENT_SEARCH_THRESHOLD
  - ToastAction optional on ToastItem; toast(..., { action }) with 6000ms dismiss
  - ToastViewport Ver ficha Link gated by isSafeInternalPath
  - useCreatePatientSession / useCreatePatientEvaluation optional toastOptions
  - Modal X aria-label Fechar and 44x44 hit area
affects:
  - 04-02 session form extract
  - 04-03 evaluation form extract
  - 04-04 dashboard overlay picker and Ver ficha wiring

tech-stack:
  added: []
  patterns:
    - Optional ToastAction on existing Zustand toast; no second notification library
    - Ver ficha href only rendered when isSafeInternalPath is true
    - writablePatients fail-closed; canWritePatient is UX-only

key-files:
  created:
    - src/lib/dashboardShortcut.ts
  modified:
    - src/stores/toast.store.ts
    - src/components/ui/ToastViewport.tsx
    - src/hooks/usePatients.ts
    - src/components/ui/Modal.tsx

key-decisions:
  - "Optional ToastAction on existing Zustand toast; 6000ms only when action present"
  - "writablePatients fail-closed when viewerId missing; canWritePatient UX-only"
  - "Create-session/evaluation hooks take optional toastOptions; ficha callers unchanged"

patterns-established:
  - "Named exports in dashboardShortcut.ts; single quotes, no semicolons, 2-space"
  - "Link from react-router-dom inside ToastViewport; never window.location"
  - "Modal X has aria-label Fechar plus min-h-11 min-w-11 hit area"

requirements-completed: [REQ-16]

duration: 3min
completed: 2026-09-14
---

# Phase 4 Plan 01: Helpers, toast Ver ficha, create-hook options, Modal Fechar Summary

**Picker helpers, optional ToastAction Ver ficha gated by isSafeInternalPath, create-hook toastOptions, and labeled Modal X**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-14T14:33:02Z
- **Completed:** 2026-09-14T14:36:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Locked REQ-16.3 picker filter: `writablePatients` uses `canWritePatient` and returns `[]` when `viewerId` is missing
- Extended the existing Zustand toast with optional `ToastAction`; two-arg `toast(message, tone)` still auto-dismisses at 4200ms
- Create session/evaluation hooks accept optional `toastOptions` so later overlays can attach one Ver ficha toast without a second banner

## Task Commits

Each task was committed atomically:

1. **Task 1: Write dashboard shortcut helpers** - `ead931c` (feat)
2. **Task 2: Extend toast pipeline and create-hook options** - `3c8672a` (feat)
3. **Task 3: Name the Modal close control** - `96f38b9` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/lib/dashboardShortcut.ts` — writablePatients, filterPatientsByName, patientFichaPath, PATIENT_SEARCH_THRESHOLD
- `src/stores/toast.store.ts` — ToastAction; optional action on ToastItem; 6000ms when action present
- `src/components/ui/ToastViewport.tsx` — Ver ficha Link only when isSafeInternalPath(href)
- `src/hooks/usePatients.ts` — optional toastOptions on create session/evaluation hooks
- `src/components/ui/Modal.tsx` — X button aria-label Fechar and 44×44 hit area

## Decisions Made

- Optional `ToastAction` lives on the existing Zustand toast. Duration is 6000ms only when `action` is present; existing callers keep 4200ms.
- `writablePatients` fail-closes on missing `viewerId`. `canWritePatient` remains UX-only; RLS is still the authority (T-04-01).
- `useCreatePatientSession` / `useCreatePatientEvaluation` take an optional second argument; ficha callers stay `useCreatePatientSession(patientId)` and still toast without a second banner (D-03).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Later plans can import `patientFichaPath`, `writablePatients`, `ToastAction`, and pass `toastOptions` into the two create hooks without adding a second toast library, SQL, or bakery imports.

REQ-16 remains open — this plan only shipped helpers, toast action, and Modal Fechar. Dashboard header buttons and overlay land in 04-04.

## Verification

- `npm run typecheck` exits 0 after each task
- Helpers export writablePatients, filterPatientsByName, patientFichaPath, PATIENT_SEARCH_THRESHOLD
- ToastViewport gates Ver ficha with isSafeInternalPath
- Modal X and backdrop both have aria-label="Fechar"

## Self-Check: PASSED

- FOUND: `src/lib/dashboardShortcut.ts`
- FOUND: `src/stores/toast.store.ts`
- FOUND: `src/components/ui/ToastViewport.tsx`
- FOUND: `src/hooks/usePatients.ts`
- FOUND: `src/components/ui/Modal.tsx`
- FOUND: `ead931c` feat(04-01): add dashboard shortcut picker helpers
- FOUND: `3c8672a` feat(04-01): add toast Ver ficha action
- FOUND: `96f38b9` feat(04-01): name Modal X as Fechar

---
*Phase: 04-atalhos-dashboard*
*Completed: 2026-09-14*
