---
phase: 04-atalhos-dashboard
plan: 04
subsystem: ui
tags: [react, dashboard, shortcuts, overlay, picker, sessions, evaluations]

requires:
  - phase: 04-atalhos-dashboard
    provides: writablePatients; patientFichaPath; ToastAction Ver ficha; PatientSessionEditorForm; PatientEvaluationEditorForm
  - phase: 03-tipos-de-conta-e-equipe
    provides: canWritePatient UX predicate; RLS remains authority
provides:
  - DashboardClinicalShortcut named export with ShortcutState wizard on /painel
  - DashboardPage PageHeader action cluster Nova evolução / Nova avaliação
affects:
  - phase-4 verification / UAT of REQ-16
  - clinic users starting sessão or avaliação without opening the ficha first

tech-stack:
  added: []
  patterns:
    - In-component ShortcutState machine; URL stays /painel until Ver ficha or Ir para pacientes
    - One Modal at a time; picker replaced by create-only extracted forms
    - Header click resets to picker; cancel/X/Escape/backdrop closes the whole shortcut

key-files:
  created:
    - src/components/patients/DashboardClinicalShortcut.tsx
  modified:
    - src/pages/DashboardPage.tsx

key-decisions:
  - "Shortcut wizard state lives in DashboardClinicalShortcut, not a URL query"
  - "Header click while overlay open resets to picker for that kind; editor cancel closes entirely"
  - "Shortcut calls usePatients again on queryKey ['patients']; dashboard metrics stay unfiltered"

patterns-established:
  - "Named export DashboardClinicalShortcut; compose PageHeader action without a description"
  - "writablePatients omits colleagues; canWritePatient re-checked before editor step"
  - "successAction Ver ficha via patientFichaPath; one Zustand toast, no second banner"

requirements-completed: [REQ-16]

duration: 3min
completed: 2026-09-14
---

# Phase 4 Plan 04: Dashboard header shortcuts Summary

**REQ-16 on /painel: Nova evolução / Nova avaliação header shortcuts, writable-patient picker, create-only overlays that stay on the dashboard after save or cancel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-14T14:48:06Z
- **Completed:** 2026-09-14T14:50:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Clinic users on `/painel` can start an evolução or avaliação without opening the ficha first
- Picker lists only `writablePatients`; empresa colleague rows are omitted, not disabled
- Successful save closes the overlay, stays on `/painel`, and uses the Plan 04-01 toast with **Ver ficha**; cancel/X/backdrop/Escape close the whole shortcut with no success toast and no leftover picker

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the dashboard shortcut wizard** - `e86358a` (feat)
2. **Task 2: Wire shortcuts into the dashboard header** - `69ce3d3` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/patients/DashboardClinicalShortcut.tsx` — header cluster, picker Modal, create-only editor Modal; ShortcutState machine
- `src/pages/DashboardPage.tsx` — `PageHeader` `action={<DashboardClinicalShortcut />}` above loading/error; four StatCards unchanged

## Decisions Made

- Wizard state is `{ closed | picker | editor }` inside `DashboardClinicalShortcut`, not a URL query. `/painel` does not change until **Ver ficha** (toast Link) or **Ir para pacientes**.
- Header click while an overlay is open resets to the picker for that kind (D-04, start from zero). **Voltar ao dashboard** / X / backdrop / Escape set `closed` — they do not reopen the picker (D-02).
- The shortcut calls `usePatients()` again (same `['patients']` queryKey). Dashboard metric cards still use the unfiltered list so empresa colleague rows remain in stats (Phase 3 D-05).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing `npm run lint` failures outside this plan's files (`aiPhysicalEvaluation.service.ts` explicit any; unused eslint-disable in GSD `state.cjs`). Already logged in `deferred-items.md`. Changed files lint clean; `npm run typecheck` exits 0.

**Browser verification:** browser tools were not available in this executor session. The `/painel` human-check (click shortcuts, picker, save, cancel, Escape, empty CTA) was not exercised in a real browser. Dev server was already running at `http://localhost:5173/`. Verifier / UAT should walk the Task 2 human-check.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

REQ-16 is reachable from `/painel`. Phase 5 (REQ-17 financeiro do autônomo) is independent of this overlay. Do not add Equipe/Financeiro chrome or SQL from this surface.

Human-check remaining: write-capable clinic user on `/painel` — buttons visible while metrics load; picker omits colleague rows; save stays on `/painel` with one **Ver ficha** toast; cancel does not reopen the picker; no **Salvar e registrar outra**.

## Verification

- `npm run typecheck` exits 0 after each task
- Component exports `DashboardClinicalShortcut`, uses `writablePatients`, mounts `PatientSessionEditorForm` and `PatientEvaluationEditorForm`
- Copy includes Nova evolução, Nova avaliação, Voltar ao dashboard, Salvar sessão, Salvar avaliação
- Neither file contains `Salvar e registrar outra` or imports full ficha panels / bakery finance modules
- Changed files pass eslint; repo-wide lint still fails on pre-existing files listed in deferred-items.md

## Self-Check: PASSED

- FOUND: `src/components/patients/DashboardClinicalShortcut.tsx`
- FOUND: `src/pages/DashboardPage.tsx`
- FOUND: `e86358a` feat(04-04): add dashboard clinical shortcut wizard
- FOUND: `69ce3d3` feat(04-04): wire clinical shortcuts into dashboard header

---
*Phase: 04-atalhos-dashboard*
*Completed: 2026-09-14*
