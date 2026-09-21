---
phase: 13-pdf-export-avaliacao-evolucao
plan: 04
subsystem: ui
tags: [pdf, field-picker, modal, avaliacao, evolucao, composer, canWrite]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: SQL+Zod kinds avaliacao/evolucao; pdfFieldCatalog; selective PDF selectedFieldIds
provides:
  - PatientAiFieldPicker Modal checklist (Marcar todos / Desmarcar sensíveis)
  - Composer scopes Avaliação | Evolução (D-01)
  - Avaliação export path: catalog → picker → PDF kind avaliacao upload
  - Evolução multi-select UI shell (export deferred to 13-05)
affects:
  - 13-05 Evolução EF → picker → PDF kind evolucao
  - 13-06 UAT picker defaults / sensitive omit

tech-stack:
  added: []
  patterns:
    - Modal field-picker as export step (all filled selected by default)
    - PdfExportScope avaliacao|evolucao; Exportar disabled for evolucao until Plan 05
    - Upload kind avaliacao with sessionId null (no geral mapping)

key-files:
  created:
    - src/components/patients/PatientAiFieldPicker.tsx
  modified:
    - src/components/patients/PatientAiComposer.tsx
    - src/schemas/patientAi.schema.ts

key-decisions:
  - "Evolução Exportar disabled until Plan 05 (multi-select state kept; no SOAP-only PDF)"
  - "Phase 12 evaluation.title WIP left unstaged — composer uses performedOnLabel only"
  - "exportSuccess copy → PDF exportado; pdfScopeAvaliacao → Avaliação"

patterns-established:
  - "Pattern: buildEvaluationFilledCatalog → picker Set → selectedFieldIds on buildPatientAiReportPdf"
  - "Pattern: Desmarcar sensíveis only clears item.sensitive === true"

requirements-completed: [REQ-25, REQ-25.1, REQ-25.2, REQ-25.3, REQ-25.5]

duration: 3min
completed: 2026-09-21
---

# Phase 13 Plan 04: Field-picker Modal + Avaliação Export Summary

**Modal field-picker with Marcar todos / Desmarcar sensíveis, composer scopes Avaliação|Evolução, and Avaliação selective PDF upload as kind avaliacao**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-09-21T12:55:01Z
- **Completed:** 2026-09-21T12:58:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `PatientAiFieldPicker` Modal checklist grouped by `groupLabel`, min-h-11 / accent-forest checkboxes, Sensível caption
- PDF scopes renamed to **Avaliação | Evolução**; Evolução multi-select checkbox list (sessions with evolution first)
- Avaliação Exportar opens picker (all on) → builds PDF with `selectedFieldIds` → `createReport` kind `avaliacao` / `sessionId: null`
- `!canWrite` still returns null; `avaliacao→geral` storage map removed

## Task Commits

Each task was committed atomically:

1. **Task 1: PatientAiFieldPicker Modal checklist** - `bec0219` (feat)
2. **Task 2: Composer scopes + Avaliação export with picker** - `12e566d` (feat)

**Plan metadata:** (docs commit after this summary)

## Files Created/Modified

- `src/components/patients/PatientAiFieldPicker.tsx` — reusable Modal picker for both scopes
- `src/schemas/patientAi.schema.ts` — picker/scope/toast copy (pt-BR)
- `src/components/patients/PatientAiComposer.tsx` — scopes + Avaliação picker export path

## Decisions Made

- Disabled Evolução Exportar until Plan 05 wires EF synthesis → picker → kind `evolucao` (avoids shipping SOAP-only as Evolução)
- Did not stage Phase 12 `evaluation.title` WIP; labels stay `performedOnLabel` so this plan typechecks without those files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Avoid Phase 12 title WIP dependency**
- **Found during:** Task 2
- **Issue:** Composer WIP used `evaluation.title`, which exists only in unstaged Phase 12 types/service
- **Fix:** Dropped title from labels/PDF input so Task 2 commits only plan files and typechecks on HEAD evaluation types
- **Files modified:** `src/components/patients/PatientAiComposer.tsx`
- **Verification:** `npm run typecheck`
- **Committed in:** `12e566d`

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** No scope creep; Evolução export still correctly deferred to 13-05

## Issues Encountered

None beyond the WIP-title dependency handled above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 05 can reuse `PatientAiFieldPicker` + `selectedSessionIds` state for Evolução EF → picker → `kind: evolucao`
- Human UAT of picker defaults / sensitive omit is Plan 06

## Self-Check: PASSED

- FOUND: `src/components/patients/PatientAiFieldPicker.tsx`
- FOUND: `src/components/patients/PatientAiComposer.tsx`
- FOUND: commits `bec0219`, `12e566d`

---
*Phase: 13-pdf-export-avaliacao-evolucao*
*Completed: 2026-09-21*
