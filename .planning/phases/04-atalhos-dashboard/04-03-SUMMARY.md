---
phase: 04-atalhos-dashboard
plan: 03
subsystem: ui
tags: [react, react-hook-form, zod, evaluations, dashboard, shortcuts]

requires:
  - phase: 04-atalhos-dashboard
    provides: ToastAction; useCreatePatientEvaluation toastOptions; Modal Fechar
  - phase: existing-ficha
    provides: PatientEvaluationPanel inline create; evaluationFormSchema; usePatientEvaluations
provides:
  - PatientEvaluationEditorForm named export with FIELD_SECTIONS and chrome labels as props
  - PatientEvaluationPanel list/PDF/delete wrapping the extracted form inline
affects:
  - 04-04 dashboard overlay mounts PatientEvaluationEditorForm without the panel

tech-stack:
  added: []
  patterns:
    - Shared ficha editor extracted; dashboard mounts the form, not the list panel
    - Create toast stays on Plan 04-01 hook; mutate onSuccess only closes chrome
    - Ficha stays inline (not Modal); showInnerHeading hides the h3 when dashboard Modal owns the title

key-files:
  created:
    - src/components/patients/PatientEvaluationEditorForm.tsx
  modified:
    - src/components/patients/PatientEvaluationPanel.tsx

key-decisions:
  - "PatientEvaluationEditorForm is the shared create/edit body; ficha wraps it inline; dashboard will mount the form without the panel"
  - "Ficha omits successAction/errorMessage so Plan 04-01 toast copy stays; showInnerHeading and chrome labels are prop-driven"
  - "Optional draft prop preserves PDF import prefill after extract"

patterns-established:
  - "Named export PatientEvaluationEditorForm; evaluationFormSchema stays in evaluation.schema"
  - "Ficha evaluation editor remains inline rounded-2xl chrome; do not wrap it in Modal"
  - "mutate onSuccess only calls onSuccess; do not toast in the form; do not pass mutate onError"

requirements-completed: [REQ-16]

duration: 3min
completed: 2026-09-14
---

# Phase 4 Plan 03: Extract evaluation editor Summary

**Shared PatientEvaluationEditorForm with História/Funcional/Exame/Conduta; ficha keeps inline chrome, list, chips, and PDF import**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-14T14:42:44Z
- **Completed:** 2026-09-14T14:46:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extracted the Nova avaliação fields (date, profissional, FIELD_SECTIONS) into `PatientEvaluationEditorForm` so Plan 04-04 can wrap them in Modal wide without a second CRUD
- Ficha avaliação still lists, edits, deletes, and imports PDF; inline chrome wraps the shared form with `cancelLabel="Cancelar"` and `submitLabel="Salvar"`
- Create still uses the Plan 04-01 `useCreatePatientEvaluation` toast pipeline; no in-form toast and no `Salvar e registrar outra`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract PatientEvaluationEditorForm** - `4fa255b` (feat)
2. **Task 2: Wrap the extracted form inline on the ficha** - `63e89c3` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/patients/PatientEvaluationEditorForm.tsx` — reusable create/edit form; FIELD_SECTIONS, RHF+Zod, optional `editing` update path, optional `draft` for PDF prefill, chrome labels and `showInnerHeading` as props
- `src/components/patients/PatientEvaluationPanel.tsx` — list + Inicial/Posterior chips + PDF import + ConfirmDialog; inline wrapper around `PatientEvaluationEditorForm`

## Decisions Made

- `PatientEvaluationEditorForm` owns create/edit fields and optional `editing`. `PatientEvaluationPanel` keeps list/PDF/delete and inline chrome (not Modal). Dashboard (04-04) will mount the form without importing the panel (REQ-16.2).
- Ficha does not pass `successAction` or `errorMessage`, so existing 04-01 toast copy stays. Shortcut will pass `Voltar ao dashboard` / `Salvar avaliação`, `showInnerHeading={false}`, and Ver ficha later (D-03). Chrome labels are props (D-02).
- Optional `draft` lets PDF import (`draftFromPdf`) prefill create without calling `usePatientEvaluations` from the form.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Optional draft prop for PDF prefill**
- **Found during:** Task 1 (Extract PatientEvaluationEditorForm)
- **Issue:** Locked props contract had no way to pass `draftFromPdf` into the extracted form. Without it, Importar avaliação de PDF would open an empty editor.
- **Fix:** Added optional `draft?: EvaluationFormData`. Form resets from `editing` when set, otherwise `draft ?? emptyEvaluationForm()`. Panel keeps `draftFromPdf` and passes `createDraft`.
- **Files modified:** `src/components/patients/PatientEvaluationEditorForm.tsx`, `src/components/patients/PatientEvaluationPanel.tsx`
- **Verification:** Panel still contains Importar avaliação de PDF (IA) and wires `openCreate(draftFromPdf(result))`; form does not import `PatientPhysicalEvaluationPanel`
- **Committed in:** `4fa255b` (Task 1) and `63e89c3` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary to keep existing PDF import correct after extract. No scope creep; locked chrome props otherwise unchanged.

## Issues Encountered

Pre-existing `npm run lint` failures outside this plan's files (`aiPhysicalEvaluation.service.ts` explicit any; unused eslint-disable in GSD `state.cjs`). Already logged in `deferred-items.md`. Changed files lint clean; `npm run typecheck` exits 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 04-04 can mount `PatientEvaluationEditorForm` inside a dashboard Modal `wide` without importing `PatientEvaluationPanel`. Pass `cancelLabel="Voltar ao dashboard"`, `submitLabel="Salvar avaliação"`, `showInnerHeading={false}`, `successAction` Ver ficha `?aba=avaliacao`, and UI-SPEC `errorMessage`; omit `editing` and `draft`.

REQ-16 remains open — this plan only extracted the evaluation editor. Dashboard header buttons and overlay land in 04-04.

## Verification

- `npm run typecheck` exits 0 after each task
- Form exports `PatientEvaluationEditorForm`, imports `evaluationFormSchema` and `useCreatePatientEvaluation`, contains História, Funcional, Exame, Conduta
- Form does not import `usePatientEvaluations`, `ConfirmDialog`, or `PatientPhysicalEvaluationPanel`
- Panel imports `PatientEvaluationEditorForm`, still calls `usePatientEvaluations`, still renders ConfirmDialog and Importar avaliação de PDF (IA)
- Panel does not import Modal for the evaluation editor
- Neither file contains `Salvar e registrar outra`
- Changed files pass eslint; repo-wide lint still fails on pre-existing files listed in deferred-items.md

## Self-Check: PASSED

- FOUND: `src/components/patients/PatientEvaluationEditorForm.tsx`
- FOUND: `src/components/patients/PatientEvaluationPanel.tsx`
- FOUND: `4fa255b` feat(04-03): extract PatientEvaluationEditorForm
- FOUND: `63e89c3` feat(04-03): wrap evaluation form inline on ficha
