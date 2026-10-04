---
phase: 22-resumo-paciente-ia
plan: 06
subsystem: ui
tags: [react, confirm-dialog, patient-summary, typography]

requires:
  - phase: 22-resumo-paciente-ia
    provides: formatGeneratedAt, SUMMARY_FIELD_LABELS, PATIENT_AI_COPY regenerate strings, and Patient.aiSummary
provides:
  - Read-only original summary block on the Resumo IA tab
  - ConfirmDialog before regenerating when summary edits exist
  - Optional autoFocusCancel on ConfirmDialog, default false
affects: [22-07 hosted UAT]

tech-stack:
  added: []
  patterns:
    - "Resumo IA reads aiSummary and aiSummaryFields only; it never reads summary edits"
    - "Regenerate confirmation opens only when summaryEdits is present, and initial focus stays on cancel"

key-files:
  created: []
  modified:
    - src/components/ui/ConfirmDialog.tsx
    - src/components/patients/PatientAiComposer.tsx
    - src/components/patients/PatientResumoIaPanel.tsx
    - src/components/patients/PatientGoalsPanel.tsx

key-decisions:
  - "The Nova button on the goals card uses font-semibold because this phase forbids font-medium on these surfaces"
  - "autoFocusCancel defaults to false so the other ConfirmDialog callers keep their previous focus"
  - "REQ-33 stays open after 22-06; plan 22-07 still owns the hosted UAT"

patterns-established:
  - "Generated-at copy uses formatGeneratedAt (Gerado em … às …), not formatDateTime"
  - "Extra AI fields render only when they contain text, with no em dash"

requirements-completed: []

duration: 4min
completed: 2026-10-04
---

# Phase 22 Plan 06: Resumo IA original and regenerate confirmation Summary

**The Resumo IA tab shows the last generated summary as read-only text, and generating again asks before it replaces the professional's edits.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-04T00:35:25Z
- **Completed:** 2026-10-04T00:39:20Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `ConfirmDialog` gained optional `autoFocusCancel`, default `false`, passed through as `autoFocus` on the cancel button.
- `PatientAiComposer` opens that dialog only when `detail.summaryEdits` exists. Without edits, Gerar resumo calls `handleGenerate` directly. PDF export does not open the dialog.
- The Resumo IA panel shows the original summary, the generation date, and the five extra fields that have text. The file does not mention `summaryEdits`.
- The goals card label, status seals, dates, and the Nova button now use 12px and weight 600.

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirmação antes de substituir edições** - `af72b3a` (feat)
2. **Task 2: Bloco somente leitura do original na aba Resumo IA** - `d41d5d5` (feat)
3. **Task 3: Tipografia do card Todos os objetivos** - `df14c87` (style)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `src/components/ui/ConfirmDialog.tsx` - Optional `autoFocusCancel`, default false
- `src/components/patients/PatientAiComposer.tsx` - Danger confirmation before replacing edits
- `src/components/patients/PatientResumoIaPanel.tsx` - Read-only original block between the composer and the PDF list
- `src/components/patients/PatientGoalsPanel.tsx` - Label, seals, dates, and Nova on the declared type scale

## Decisions Made

- The card table named the status seals for `font-semibold`. The Typography section also forbids `font-medium` on these surfaces, so the Nova button moved from `font-medium` to `font-semibold` as well.
- `autoFocusCancel` stays optional and defaults to `false`. The previous callers were not edited.
- The empty original block uses `mt-4` before the empty copy, the same offset as the summary body in the spacing scale.
- REQ-33 stays open. This plan covers the Resumo IA read-only block, the regenerate confirmation, and the goals type scale. Plan 22-07 still owns the hosted proof. `requirements.mark-complete` was not called.

## Verification

- `node --test --test-name-pattern "REQ-33.2" src/lib/patientSummaryContract.test.ts` — passed (`aba Resumo IA não contém summaryEdits`).
- `npm run typecheck` — passed.
- `npm run lint` — passed with the two pre-existing warnings in `state.cjs` and `AttendanceCounts.tsx`. No new warnings.
- `rg -c summaryEdits src/components/patients/PatientResumoIaPanel.tsx` — 0.
- `autoFocus` in `ConfirmDialog.tsx` appears only as the optional `autoFocusCancel` prop, default `false`, on the cancel button.
- `rg -l ConfirmDialog src` lists 17 files. The previous callers were not in this plan's diff. `PatientAiComposer.tsx` is the new caller, so the count is one higher than the 16 files that already mentioned the dialog.
- `rg -c 'text-[10px]|text-[11px]|font-medium' src/components/patients/PatientGoalsPanel.tsx` — 0. Both the `canWrite` branch and the read-only branch were updated.
- The local app at `http://localhost:5173/` shows the login screen. The Resumo IA tab was not clicked in the browser because there is no session.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 22-07 can run the full suite and the hosted UAT. This plan did not edit the Edge Function, SQL, or tests.
- Regenerating still depends on `generatePatientAiSummary` and on `summaryEdits` being null when there is nothing to lose.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/components/ui/ConfirmDialog.tsx
- FOUND: src/components/patients/PatientAiComposer.tsx
- FOUND: src/components/patients/PatientResumoIaPanel.tsx
- FOUND: src/components/patients/PatientGoalsPanel.tsx
- FOUND: .planning/phases/22-resumo-paciente-ia/22-06-SUMMARY.md
- FOUND commits: af72b3a, d41d5d5, df14c87

---
*Phase: 22-resumo-paciente-ia*
*Completed: 2026-10-04*
