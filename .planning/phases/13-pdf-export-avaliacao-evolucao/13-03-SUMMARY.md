---
phase: 13-pdf-export-avaliacao-evolucao
plan: 03
subsystem: pdf-export
tags: [pdf, pdf-lib, avaliacao, evolucao, selectedFieldIds, block-chrome]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: pdfFieldCatalog block ids (01.A–04.ID, evo.session.*, evo.ai.*)
  - phase: 12-avaliacoes-musculoesqueleticas
    provides: drawAvaliacao EvaluationFicha render + FLUXO pdf-lib chrome
provides:
  - selectedFieldIds filter on Avaliação PDF (filled ∩ selected)
  - drawFichaBlockFrame lettered accentSoft header + straight accent border
  - PatientAiEvolucaoPdfInput + drawEvolucao (SOAP + AI sections)
  - buildPatientAiReportPdf kind evolucao → "Evolução clínica"
affects:
  - 13-04 Avaliação composer export wiring
  - 13-05 Evolução composer + picker → PDF

tech-stack:
  added: []
  patterns:
    - selectedFieldIds ReadonlySet omit (undefined = all filled)
    - drawFichaBlockFrame via drawRectangle only (no borderRadius)
    - evo.ai.* frames only when textFilled ∩ selected

key-files:
  created: []
  modified:
    - src/services/patientAiPdf.service.ts

key-decisions:
  - "Block chrome: header fill first, body draw, border stroke after (skip border if page break)"
  - "AI sections lettered A–D (Síntese / Tendências / Condutas agregadas / Alertas)"
  - "SOAP filtered per evo.session.{id}.{field} ids matching catalog"

patterns-established:
  - "Pattern: isFieldSelected(undefined) → all filled (back-compat)"
  - "Pattern: empty selected blocks skip entirely (no empty frame)"

requirements-completed: [REQ-25, REQ-25.3, REQ-25.6]

duration: 6min
completed: 2026-09-21
---

# Phase 13 Plan 03: Selective PDF Block Chrome + drawEvolucao Summary

**pdf-lib Avaliação export with lettered ficha frames filtered by selectedFieldIds, plus Evolução PDF kind rendering SOAP ∩ AI sections without inventing text**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-09-21T12:33:41Z
- **Completed:** 2026-09-21T12:39:12Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Avaliação blocks render only when filled **and** in `selectedFieldIds` (omit set = prior all-filled behavior)
- `drawFichaBlockFrame` uses straight `drawRectangle` chrome (accentSoft header + accent border; no `borderRadius`)
- `drawEvolucao` + `kind: 'evolucao'` dispatch with SOAP leaves and AI A–D frames; empty/unselected omitted

## Task Commits

Each task was committed atomically:

1. **Task 1: Block chrome + selective drawAvaliacao** - `14c10b5` (feat)
2. **Task 2: drawEvolucao + dispatch kind evolucao** - `63a358f` (feat)

**Plan metadata:** (docs commit after this summary)

## Files Created/Modified

- `src/services/patientAiPdf.service.ts` — `selectedFieldIds`, `drawFichaBlockFrame`, selective `drawAvaliacao`, `PatientAiEvolucaoPdfInput`, `drawEvolucao`, evolucao dispatch

## Decisions Made

- Included inextricable Phase 12 WIP (`evaluationTitle` field + doc title) in Task 1 commit so Avaliações titles keep working
- AI Alertas uses letter **D** in the PDF frame (catalog id remains `evo.ai.alertas`)
- Border omitted when a block spills across pages (header still drawn on first page)

## Deviations from Plan

### Auto-fixed Issues

None beyond incorporating Phase 12 WIP already present in the working tree.

**Note:** Dirty Phase 12 `evaluationTitle` changes in `patientAiPdf.service.ts` were committed with Task 1 because they were mixed into the same file and required for `docTitleFor` / meta header.

**Total deviations:** 0 auto-fixed (WIP incorporation noted)
**Impact on plan:** None on scope; Phase 12 title support preserved.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 can wire Avaliação export → catalog → picker → `selectedFieldIds` → `buildPatientAiReportPdf`
- Plan 05 can wire Evolução synthesis → picker → `kind: 'evolucao'` PDF

## Self-Check: PASSED

- FOUND: `src/services/patientAiPdf.service.ts`
- FOUND: commit `14c10b5`
- FOUND: commit `63a358f`
- `npm run typecheck` passed after both tasks
- No stubs/placeholders in PDF builder paths
- No new threat surface beyond plan threat_model (client-side selectedFieldIds filter)

---
*Phase: 13-pdf-export-avaliacao-evolucao*
*Completed: 2026-09-21*
