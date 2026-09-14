---
phase: 04-atalhos-dashboard
plan: 02
subsystem: ui
tags: [react, react-hook-form, zod, sessions, dashboard, shortcuts]

requires:
  - phase: 04-atalhos-dashboard
    provides: ToastAction; useCreatePatientSession toastOptions; Modal Fechar
  - phase: existing-ficha
    provides: PatientEvolutionsPanel create/edit Modal; sessionFormSchema; usePatientSessions
provides:
  - PatientSessionEditorForm named export with Agendar/Realizada and chrome labels as props
  - PatientEvolutionsPanel list/edit/delete wrapping the extracted form in Modal
affects:
  - 04-03 evaluation form extract
  - 04-04 dashboard overlay mounts PatientSessionEditorForm without the panel

tech-stack:
  added: []
  patterns:
    - Shared ficha editor extracted; dashboard mounts the form, not the list panel
    - Create toast stays on Plan 04-01 hook; mutate onSuccess only closes chrome
    - Chrome labels (cancel/submit) are props; ficha omits successAction/errorMessage

key-files:
  created:
    - src/components/patients/PatientSessionEditorForm.tsx
  modified:
    - src/components/patients/PatientEvolutionsPanel.tsx

key-decisions:
  - "PatientSessionEditorForm is the shared create/edit body; ficha Modal wraps it; dashboard will mount the form without the panel"
  - "Ficha omits successAction/errorMessage so Plan 04-01 toast copy stays; shortcut chrome is prop-driven"

patterns-established:
  - "Named export PatientSessionEditorForm; sessionFormSchema stays in patient.schema"
  - "mutate onSuccess only calls onSuccess; do not toast in the form; do not pass mutate onError"

requirements-completed: [REQ-16]

duration: 3min
completed: 2026-09-14
---

# Phase 4 Plan 02: Extract session editor Summary

**Shared PatientSessionEditorForm with Agendar/Realizada; ficha Modal wraps it with Cancelar/Salvar**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-14T14:37:59Z
- **Completed:** 2026-09-14T14:41:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extracted the Nova sessão editor (Agendar / Realizada + clinical fields) into `PatientSessionEditorForm` so Plan 04-04 can mount create-only chrome without a second CRUD
- Ficha evoluções still list, edit, and delete; Modal children are the shared form with `cancelLabel="Cancelar"` and `submitLabel="Salvar"`
- Create still uses the Plan 04-01 `useCreatePatientSession` toast pipeline; no in-form toast and no `Salvar e registrar outra`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract PatientSessionEditorForm** - `796bd4b` (feat)
2. **Task 2: Wrap the extracted form in PatientEvolutionsPanel** - `fccc980` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/patients/PatientSessionEditorForm.tsx` — reusable create/edit form; datetime helpers, RHF+Zod, Agendar/Realizada, optional `editing` update path, chrome labels as props
- `src/components/patients/PatientEvolutionsPanel.tsx` — list + Nova sessão + pencils/trash + ConfirmDialog; Modal wraps `PatientSessionEditorForm`

## Decisions Made

- `PatientSessionEditorForm` owns create/edit fields and optional `editing`. `PatientEvolutionsPanel` keeps list/delete and Modal chrome. Dashboard (04-04) will mount the form without importing the panel (REQ-16.2).
- Ficha does not pass `successAction` or `errorMessage`, so existing 04-01 toast copy stays. Shortcut will pass `Voltar ao dashboard` / `Salvar sessão` and Ver ficha later (D-03). Chrome labels are props (D-02).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing `npm run lint` failures outside this plan's files (`aiPhysicalEvaluation.service.ts` explicit any; unused eslint-disable in GSD `state.cjs`). Logged in `deferred-items.md`. Changed files lint clean; `npm run typecheck` exits 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 04-04 can mount `PatientSessionEditorForm` inside a dashboard Modal without importing `PatientEvolutionsPanel`. Pass `cancelLabel="Voltar ao dashboard"`, `submitLabel="Salvar sessão"`, `successAction` Ver ficha, and UI-SPEC `errorMessage`; omit `editing`.

REQ-16 remains open — this plan only extracted the session editor. Evaluation extract is 04-03; dashboard buttons land in 04-04.

## Verification

- `npm run typecheck` exits 0 after each task
- Form exports `PatientSessionEditorForm`, imports `sessionFormSchema` and `useCreatePatientSession`, contains Agendar and Realizada
- Panel imports `PatientSessionEditorForm`, still calls `usePatientSessions`, still renders ConfirmDialog and Nova sessão
- Neither file contains `Salvar e registrar outra`

## Self-Check: PASSED

- FOUND: `src/components/patients/PatientSessionEditorForm.tsx`
- FOUND: `src/components/patients/PatientEvolutionsPanel.tsx`
- FOUND: `796bd4b` feat(04-02): extract PatientSessionEditorForm
- FOUND: `fccc980` feat(04-02): wrap session form in ficha panel
