---
phase: 24-atividades-avaliacao-capacidade-e-unidade
plan: 01
subsystem: testing
tags: [node-test, evaluation-ficha, capacidade, unidades]

requires:
  - phase: 12-ficha-avaliacao
    provides: bloco B jsonb with 16 activity booleans and four shared text fields
provides:
  - Closed catalog ATIVIDADES and unidades minutos, km, repeticoes
  - formatMedida, formatMiolo, and formatLinha for detail, catalog, and PDF
  - normalizeAtividadesAfetadas that migrates the flat object without inventing a measure
affects: [24-02, 24-03, 24-04, evaluationFichaSchema, EvaluationPage03, pdf]

tech-stack:
  added: []
  patterns:
    - "Pure node:test helper with relative .ts imports and no @/ alias"
    - "normalizeAtividadesAfetadas never throws; unknown units and unknown keys are dropped"

key-files:
  created:
    - src/lib/atividadeCapacidade.ts
    - src/lib/atividadeCapacidade.test.ts
  modified: []

key-decisions:
  - "REQ-35 stays open: this plan ships the helper only; schema, UI, and PDF stay on plans 02-04"
  - "A new-form object keeps textoLegado so a second normalize does not erase the legacy paragraph"
  - "Free text such as 10 min is stored as typed; it is not parsed into minutos"

patterns-established:
  - "formatLinha is the single phrase for a labeled activity: agora and antes, or the label alone"
  - "A shared legacy number is assigned only on an exact catalog label or when exactly one activity is checked"

requirements-completed: []

duration: 6min
completed: 2026-10-05
---

# Phase 24 Plan 01: Activity Capacity Helper Summary

**Pure helper that stores each activity’s current and previous measure on its own catalog key, and formats minutos, km, and repetições without guessing a unit from free text.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-05T01:53:27Z
- **Completed:** 2026-10-05T01:59:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Catalog of 16 activities, from Caminhar through Outra, plus the closed unit keys `minutos`, `km`, and `repeticoes`.
- `formatMedida`, `formatMiolo`, and `formatLinha` produce the phrases detail, catalog `03.B`, and the PDF will share.
- `normalizeAtividadesAfetadas` migrates the flat object: one shared number is not copied onto every checked activity, and a unit outside the enum is dropped.

## Task Commits

Each task was committed atomically. TDD tasks have a failing test commit and then the implementation:

1. **Task 1: Catálogo e formatadores com teste vermelho primeiro** - `02e6d08` (test), `041bbf1` (feat)
2. **Task 2: normalizeAtividadesAfetadas sem inventar número nem unidade** - `0b8bf7e` (test), `aed5a9e` (feat)

**Plan metadata:** docs commit for this summary

## Files Created/Modified

- `src/lib/atividadeCapacidade.ts` - Catalog, unit labels, phrase formatters, and `normalizeAtividadesAfetadas`
- `src/lib/atividadeCapacidade.test.ts` - REQ-35 unit cases for phrases and the legacy migration

## Decisions Made

- REQ-35 stays unchecked. Acceptance still needs the ficha schema, the page 03 editor, and the reading/PDF/catalog lines.
- When the input already has a plain `capacidades` object, the four old texts are ignored and an existing `textoLegado` is kept (trimmed, max 1200).
- `10 min`, `2km`, and `12x` are not interpreted. Only `minutos`, `km`, and `repeticoes` become a unit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Keep textoLegado on the new form**
- **Found during:** Task 2 (normalizeAtividadesAfetadas)
- **Issue:** The plan says the new form ignores the four old texts. It does not say to copy `textoLegado`. Dropping it would erase the legacy paragraph the next time the same object is normalized.
- **Fix:** If `capacidades` is a plain object, copy `textoLegado` when it is a non-empty string and clamp it to 1200. Still ignore `capacidadeAtual`, `atividade`, `consigoPor`, and `antesConseguiaPor`.
- **Files modified:** `src/lib/atividadeCapacidade.ts`, `src/lib/atividadeCapacidade.test.ts`
- **Verification:** `REQ-35: forma nova ignora os quatro textos velhos` keeps `Registro anterior: 4 km` and does not assign `capacidadeAtual: 99`.
- **Committed in:** `aed5a9e` (part of task 2)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required so a saved legacy paragraph survives the next normalize. No schema, UI, or package change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can wrap `atividadesAfetadas` with `z.preprocess(normalizeAtividadesAfetadas, …)` and import the helper by relative `.ts` path.
- This test file does not import `evaluationFichaSchema`. Anamnese surviving a legacy block B parse is plan 02.
- `node --test src/lib/atividadeCapacidade.test.ts` — 14 passing. `npx tsc --noEmit` passes.

## TDD Gate Compliance

Plan type is `execute`. Both tasks used `tdd="true"`:

1. `test(24-01)` `02e6d08` then `feat(24-01)` `041bbf1`
2. `test(24-01)` `0b8bf7e` then `feat(24-01)` `aed5a9e`

## Known Stubs

None. The helper returns real catalog data and normalized measures. Empty `capacidades` is the result for a non-object, not a placeholder.

---
*Phase: 24-atividades-avaliacao-capacidade-e-unidade*
*Completed: 2026-10-05*

## Self-Check: PASSED

- FOUND: src/lib/atividadeCapacidade.ts
- FOUND: src/lib/atividadeCapacidade.test.ts
- FOUND: 02e6d08
- FOUND: 041bbf1
- FOUND: 0b8bf7e
- FOUND: aed5a9e
