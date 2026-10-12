---
phase: 24-atividades-avaliacao-capacidade-e-unidade
plan: 02
subsystem: ui
tags: [zod, react-hook-form, evaluation-ficha, capacidade, unidades]

requires:
  - phase: 24-atividades-avaliacao-capacidade-e-unidade
    provides: normalizeAtividadesAfetadas and the closed catalog ATIVIDADES
provides:
  - evaluationFichaSchema preprocess that migrates legacy bloco B into capacidades
  - Page 03 bloco B with one measure row per checked activity and a shared-field removal
affects: [24-03, 24-04, EvaluationFichaDetail, pdfFieldCatalog, patientAiPdf]

tech-stack:
  added: []
  patterns:
    - "z.preprocess(normalizeAtividadesAfetadas) runs before the object strip, with .default({}) on the field"
    - "Valor and unidade share one bordered flex group; the empty select option is Unidade"
    - "Uncheck clears capacidades.<chave> with setValue only on a true-to-false transition"

key-files:
  created: []
  modified:
    - src/schemas/evaluationFicha.schema.ts
    - src/lib/atividadeCapacidade.test.ts
    - src/components/patients/evaluation/EvaluationPage03.tsx
    - src/components/patients/evaluation/EvaluationFichaForm.tsx

key-decisions:
  - "REQ-35 stays open: detail, catalog 03.B, and the PDF still belong to plan 03"
  - "A missing bloco B keeps .default({}) outside preprocess so parse({}) stays equal to emptyEvaluationFicha()"

patterns-established:
  - "Each checked activity renders Capacidade atual and Quanto conseguia antes, each as a native input plus native select in one border"
  - "shouldUnregister stays false; the page clears the capacity key itself when the checkbox turns false"

requirements-completed: []

duration: 6min
completed: 2026-10-05
---

# Phase 24 Plan 02: Ficha Schema and Activity Rows Summary

**Legacy bloco B is normalized on parse, and each checked activity shows current and previous capacity with valor and unidade in the same border.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-05T02:02:23Z
- **Completed:** 2026-10-05T02:08:27Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `evaluationFichaSchema` runs `normalizeAtividadesAfetadas` before the object strip. Anamnese survives a legacy bloco B, the four old texts are not on the parsed object, and a value longer than 200 characters is clamped instead of failing the ficha.
- Page 03 keeps the 16-checkbox grid. A checked activity reveals its row, in catalog order, with Capacidade atual and Quanto conseguia antes. There is no Adicionar button.
- Unchecking sets that activity's `capacidades` key to `undefined`. The first paint of a checkbox that is already false does not dirty the form.

## Task Commits

Each task was committed atomically. Task 1 is TDD (failing test, then schema):

1. **Task 1: Preprocess no schema e testes de parse da ficha** - `a5ef6a1` (test), `95184de` (feat)
2. **Task 2: Bloco B revela a linha e limpa a capacidade ao desmarcar** - `afe6c15` (feat)

**Plan metadata:** docs commit for this summary

## Files Created/Modified

- `src/schemas/evaluationFicha.schema.ts` - Preprocess of `atividadesAfetadas`, `textoLegado`, and per-activity `capacidades`; the four shared texts are gone from the inferred type
- `src/lib/atividadeCapacidade.test.ts` - Six parse cases for anamnese, dropped keys, orphan capacity, invalid unit, the 200-character clamp, and `parse({})`
- `src/components/patients/evaluation/EvaluationPage03.tsx` - Bloco B rows, native measure control, and uncheck clear
- `src/components/patients/evaluation/EvaluationFichaForm.tsx` - Passes `setValue` into page 03

## Decisions Made

- REQ-35 stays unchecked. Acceptance item 4 (ficha detail, PDF, and export catalog) is plan 03. Plans 03 and 04 still list REQ-35.
- `.default({})` stays on the field, outside `z.preprocess`, so a missing bloco B still parses and `evaluationFichaSchema.parse({})` stays deep-equal to `emptyEvaluationFicha()`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

`REQ-35: parse({}) continua válido` was already green in the RED run, because `emptyEvaluationFicha()` is `evaluationFichaSchema.parse({})`. The other five new tests failed, and the plan 01 cases stayed green. The empty-parse test is the regression guard the plan asked to name. The suite failed, so the RED commit stayed a failing test.

`npm run typecheck` was not run. Catalog and PDF still read the four old keys until plan 03. `npm run lint` finished with 0 errors (two existing warnings in unrelated files).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 can read `capacidades`, `textoLegado`, and `formatLinha` for detail, catalog `03.B`, and the PDF. Those files still mention `capacidadeAtual`, `atividade`, `consigoPor`, and `antesConseguiaPor`.
- `node --test src/lib/atividadeCapacidade.test.ts` — 20 passing.
- `evaluations.service.ts` was not edited. `resolveEvaluationFicha` and `toRow` already call `safeParse`.

## TDD Gate Compliance

Plan type is `execute`. Task 1 used `tdd="true"`:

1. `test(24-02)` `a5ef6a1` then `feat(24-02)` `95184de`

Task 2 is not TDD. Its commit is `feat(24-02)` `afe6c15`.

## Known Stubs

None. The empty-state sentence and the read-only `Registro anterior` paragraph render real ficha data. An empty `capacidades` map is the normalized result, not a placeholder.

## Threat Flags

None. The preprocess and the uncheck `setValue` are the mitigations already listed as T-24-input, T-24-legacy, T-24-write, and T-24-key. No new endpoint, auth path, or SQL.

---
*Phase: 24-atividades-avaliacao-capacidade-e-unidade*
*Completed: 2026-10-05*

## Self-Check: PASSED

- FOUND: src/schemas/evaluationFicha.schema.ts
- FOUND: src/lib/atividadeCapacidade.test.ts
- FOUND: src/components/patients/evaluation/EvaluationPage03.tsx
- FOUND: src/components/patients/evaluation/EvaluationFichaForm.tsx
- FOUND: a5ef6a1
- FOUND: 95184de
- FOUND: afe6c15
