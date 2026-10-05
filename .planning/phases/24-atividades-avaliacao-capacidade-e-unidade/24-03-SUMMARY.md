---
phase: 24-atividades-avaliacao-capacidade-e-unidade
plan: 03
subsystem: ui
tags: [react, pdf-lib, evaluation-ficha, formatLinha, bloco-b]

requires:
  - phase: 24-atividades-avaliacao-capacidade-e-unidade
    provides: formatLinha, formatMiolo, ATIVIDADES, and the parsed atividadesAfetadas object from plan 02
provides:
  - Evaluation ficha section 03 lists one leaf per marked activity or measure, plus Registro anterior
  - Export catalog 03.B preview is the first formatLinha, or Registro anterior when only legacy text exists
  - PDF frame B draws the same lines and no longer prints the four shared fields
affects: [24-04, REQ-35.4]

tech-stack:
  added: []
  patterns:
    - "DetailLeaf value is formatMiolo, or true so the existing boolean branch prints Sim"
    - "Catalog 03.B and the PDF frame walk ATIVIDADES in catalog order and call formatLinha"
    - "A marked activity with an empty miolo is drawn with drawText because drawOptionalField skips an empty value"

key-files:
  created: []
  modified:
    - src/components/patients/evaluation/EvaluationFichaDetail.tsx
    - src/lib/pdfFieldCatalog.ts
    - src/services/patientAiPdf.service.ts
    - src/lib/atividadeCapacidade.test.ts

key-decisions:
  - "REQ-35 stays open: plan 04 still owns the full suite gate and UAT"
  - "Name-only PDF lines use drawText and toWinAnsiSafe; lines with a miolo use drawLabeledValue so the label is not repeated"

patterns-established:
  - "Section 03 inserts activity leaves after the three limitation leaves and before Boa melhora"
  - "show03B stays hasAtividades && isFieldSelected(selected, '03.B'); pushBlock keeps id 03.B, label Atividades afetadas, groupLabel 03 · Função · Bloco B"

requirements-completed: []

duration: 5min
completed: 2026-10-05
---

# Phase 24 Plan 03: Ficha Detail and PDF Block B Summary

**Ficha reading, catalog 03.B, and the PDF frame list each activity with valor and unidade from formatLinha, plus Registro anterior when legacy text exists.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-05T02:11:04Z
- **Completed:** 2026-10-05T02:15:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Section 03 of the saved evaluation shows one leaf per catalog activity that is checked or has a measure. The value is `agora 10 minutos; antes 40 minutos` (or one side). A check with no measure prints Sim. Registro anterior appears when `textoLegado` has text.
- Catalog `03.B` stays `Atividades afetadas` / `03 · Função · Bloco B`. The preview is the first non-empty `formatLinha`. If there is no activity line and legacy text exists, the preview is `Registro anterior: ` plus that text.
- PDF frame B draws the activity name with the miolo, or only the name when there is no measure, then Registro anterior. Capacidade atual, Atividade, Consigo por, and Antes conseguia por are gone from that frame. `show03B` still depends on `isFieldSelected(selected, '03.B')`.

## Task Commits

Each task was committed atomically. Task 2 is TDD (failing source test, then catalog and PDF):

1. **Task 1: Folhas do bloco B na leitura da ficha** - `ff9a005` (feat)
2. **Task 2: Catálogo 03.B e desenho do PDF na mesma frase** - `2d86042` (test), `cfbfafc` (feat)

**Plan metadata:** docs commit for this summary

## Files Created/Modified

- `src/components/patients/evaluation/EvaluationFichaDetail.tsx` - One `DetailLeaf` per activity via `formatMiolo`, plus Registro anterior
- `src/lib/atividadeCapacidade.test.ts` - `REQ-35: catálogo e PDF do bloco B usam formatLinha` reads the catalog slice and the PDF frame
- `src/lib/pdfFieldCatalog.ts` - Block `03.B` preview from the first `formatLinha`
- `src/services/patientAiPdf.service.ts` - Frame B lists activities with `formatLinha` / `formatMiolo` and Registro anterior

## Decisions Made

- REQ-35 stays unchecked. Plan 04 still lists it and owns the full suite, lint, build, and UAT. This plan covers acceptance item 4 only.
- A marked activity with no measure cannot go through `drawOptionalField`, which returns false on an empty value. The PDF draws that name with `drawText` and `toWinAnsiSafe`. A line with a miolo uses `drawLabeledValue` so the visible phrase matches `formatLinha` without repeating the label.

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

Task 2 followed RED then GREEN: `2d86042` (`test`) failed on the current catalog and PDF, then `cfbfafc` (`feat`) made `REQ-35: catálogo e PDF do bloco B usam formatLinha` pass. No refactor commit.

## Issues Encountered

`patientAiPdf.service.ts` already had uncommitted body-map centroid edits. Those lines stayed out of `cfbfafc`. The working tree still has that unrelated diff.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Detail, catalog `03.B`, and PDF frame B share the catalog order and `formatLinha`.
- Plan 04 can run the REQ-35 suite and the phase gate. `patient-ai-summary` was not edited.

## Self-Check: PASSED

- FOUND: src/components/patients/evaluation/EvaluationFichaDetail.tsx
- FOUND: src/lib/pdfFieldCatalog.ts
- FOUND: src/services/patientAiPdf.service.ts
- FOUND: src/lib/atividadeCapacidade.test.ts
- FOUND: ff9a005
- FOUND: 2d86042
- FOUND: cfbfafc

---
*Phase: 24-atividades-avaliacao-capacidade-e-unidade*
*Completed: 2026-10-05*
