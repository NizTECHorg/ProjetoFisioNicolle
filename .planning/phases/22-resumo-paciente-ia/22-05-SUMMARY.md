---
phase: 22-resumo-paciente-ia
plan: 05
subsystem: ui
tags: [react, react-hook-form, zod, patient-summary]

requires:
  - phase: 22-resumo-paciente-ia
    provides: resolveSummaryFields, diffSummaryEdits, summaryEditsSchema, and useSavePatientSummaryEdits
provides:
  - PatientSummaryEditorModal with six textareas and one summary_edits write
  - ResumoDoPaciente reading resolved text for the fixed card set
affects: [22-06 Resumo IA read-only block, 22-07 hosted UAT]

tech-stack:
  added: []
  patterns:
    - "Editor reset depends only on open and reads resolved text through a ref"
    - "Write controls on the Resumo IA block render only when canWrite is true"

key-files:
  created:
    - src/components/patients/PatientSummaryEditorModal.tsx
  modified:
    - src/pages/PatientPage.tsx

key-decisions:
  - "Form reset depends only on open; resolved text is read through a ref so a patient refetch does not wipe in-progress edits"
  - "EvaChart is unchanged and mounts only when painSeries has rows, so the empty-series message is not shown on Dor e limitações"
  - "REQ-33 stays open after 22-05; plans 22-06 and 22-07 still own the Resumo IA tab, regenerate confirmation, goals typography, and hosted UAT"

patterns-established:
  - "Empty summary text renders as an em dash with aria-label Sem informação"
  - "Card labels on this surface use text-xs and font-semibold"

requirements-completed: []

duration: 3min
completed: 2026-10-04
---

# Phase 22 Plan 05: Resumo cards and edit modal Summary

**The Resumo tab shows the fixed seven-card set from resolved summary text, and a pencil opens one modal that saves a single diff of the six fields.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-04T00:30:21Z
- **Completed:** 2026-10-04T00:34:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `PatientSummaryEditorModal` renders six textareas from `SUMMARY_FIELD_KEYS`, validates with `summaryEditsSchema`, and calls `diffSummaryEdits` once through `useSavePatientSummaryEdits`.
- The reset effect depends only on `open` and `form`. Resolved text is kept in a ref, so a query refresh while the modal is open does not replace what the user typed.
- `ResumoDoPaciente` reads `resolveSummaryFields`. Programa and Dor (EVA) are gone. Plano de tratamento and Dor e limitações show text. The EVA chart renders only when `painSeries.length > 0`.
- The pencil and the modal mount only when `canWrite` is true.

## Task Commits

Each task was committed atomically:

1. **Task 1: Modal único Editar resumo** - `d9ed208` (feat)
2. **Task 2: ResumoDoPaciente com o conjunto fixo de sete cards** - `15f1ece` (feat)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `src/components/patients/PatientSummaryEditorModal.tsx` - Modal Editar resumo with six textareas and one UPDATE of the diff
- `src/pages/PatientPage.tsx` - Resumo tab cards, pencil, and conditional editor

## Decisions Made

- The reset effect does not list `original` or `edits`. Those values are read from a ref updated on each render.
- `EvaChart` was not edited. The card mounts it only when there is at least one pain log, so `Sem registros de dor ainda.` stays inside the chart helper and is not reached from this card.
- REQ-33 stays open. This plan covers the Resumo tab editor (acceptance items 3 and 5 of the requirement). Plans 22-06 and 22-07 still own the Resumo IA read-only block, the regenerate confirmation, goals typography, and the hosted proof. `requirements.mark-complete` was not called.

## Verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with the two pre-existing warnings in `state.cjs` and `AttendanceCounts.tsx`. No new warnings.
- `node --test --test-name-pattern "REQ-33.5" src/lib/patientSummaryContract.test.ts` — passed.
- `text-[11px]` and `text-[10px]` remain only in `Metric` and `EntendaOCaso`, outside `ResumoDoPaciente`.
- `mt-3`, `gap-3`, `space-y-3`, and `mt-1.5` are absent from `PatientSummaryEditorModal.tsx`.
- `Sem registros de dor ainda` appears only inside `EvaChart`.
- The local app at `http://localhost:5173/` shows the login screen. The Resumo tab was not clicked in the browser because there is no session.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 22-06 can add the read-only original block, the regenerate confirmation, and the goals typography. This plan did not edit those files.
- Saving still depends on the SQL from plan 22-02 and on `useSavePatientSummaryEdits` from plan 22-03. Hosted proof remains plan 22-07.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/components/patients/PatientSummaryEditorModal.tsx
- FOUND: src/pages/PatientPage.tsx
- FOUND commits: d9ed208, 15f1ece

---
*Phase: 22-resumo-paciente-ia*
*Completed: 2026-10-04*
