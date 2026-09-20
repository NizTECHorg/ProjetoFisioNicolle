---
phase: 12-avaliacoes-musculoesqueleticas
plan: 01
subsystem: database
tags: [avaliacoes, zod, ficha, jsonb, patient-evaluations, typescript, sql-editor]

# Dependency graph
requires:
  - phase: 04-avaliacoes-clinicas
    provides: patient_evaluations table + RLS via can_read_patient / can_write_patient
  - phase: 11-resumo-ia
    provides: SQL Editor-only twin migration pattern (phase sql/ + supabase/)
provides:
  - evaluationFichaSchema + EvaluationFicha + emptyEvaluationFicha (pages 01–04)
  - evaluationFormSchema with performedOn-only required + nested ficha
  - PatientEvaluation.ficha / UpsertPatientEvaluationInput.ficha types
  - Idempotent patient_evaluations.ficha jsonb column (human-applied via SQL Editor)
affects: [12-02, 12-03, 12-04, wave-2-service-ui, wave-3-pdf]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SQL Editor-only apply (no supabase db push); twin files in phase sql/ + supabase/
    - Single JSONB ficha document (not typed columns / child tables); legacy text columns retained
    - Zod nested clinical blocks (anamnese/sintomas/funcao/avaliacaoPlano) with all-optional leaves

key-files:
  created:
    - src/schemas/evaluationFicha.schema.ts
    - .planning/phases/12-avaliacoes-musculoesqueleticas/sql/12-patient-evaluations-ficha.sql
    - supabase/12-patient-evaluations-ficha.sql
  modified:
    - src/schemas/evaluation.schema.ts
    - src/types/evaluation.ts

key-decisions:
  - "D-03: evaluationFormSchema requires only performedOn; mainComplaint min(2) removed"
  - "D-04: evaluationFichaSchema covers pages 01–04 with all-optional leaves so {} parses"
  - "D-05: additive ficha jsonb NOT NULL DEFAULT '{}'; existing RLS unchanged"
  - "SQL applied via hosted SQL Editor only; human confirmed applied"

patterns-established:
  - "Mirror Phase 11: identical DDL under phase sql/ and supabase/; header forbids db push and can_* rewrites"
  - "Types import EvaluationFicha from schema file — no duplicated shape"
  - "emptyEvaluationFicha() = evaluationFichaSchema.parse({}) for form defaults"

requirements-completed: [REQ-24, REQ-24.2, REQ-24.3]

# Metrics
duration: ~25min
completed: 2026-09-20
---

# Phase 12 Plan 01: Ficha Contracts + JSONB Column Summary

**TypeScript/Zod musculoskeletal ficha contracts with performedOn-only form create, plus human-applied `patient_evaluations.ficha` jsonb column**

## Performance

- **Duration:** ~25 min (Tasks 1–2 automated) + human SQL Editor apply
- **Started:** 2026-09-20T19:15:00Z
- **Completed:** 2026-09-20T19:22:30Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments
- Locked `evaluationFichaSchema` covering pages 01–04 (`anamnese` / `sintomas` / `funcao` / `avaliacaoPlano`) with all-optional leaves so `{}` parses (D-04)
- Relaxed `evaluationFormSchema` so only `performedOn` is required; removed `mainComplaint.min(2)`; nested `ficha` via Zod (D-03)
- Extended `PatientEvaluation` and `UpsertPatientEvaluationInput` with `ficha`
- Authored identical idempotent SQL twins; human applied in SQL Editor — `patient_evaluations.ficha jsonb NOT NULL DEFAULT '{}'` live (D-05, REQ-24)

## Task Commits

Each task was committed atomically:

1. **Task 1: Zod ficha document + relax evaluation form contracts** - `c4fade0` (feat)
2. **Task 2: Author patient_evaluations.ficha SQL (additive JSONB)** - `59f1a32` (feat)
3. **Task 3: Apply SQL in hosted SQL Editor [BLOCKING]** - human-action approved (no code commit; schema applied out-of-band)

**Plan metadata:** _(this docs commit)_

## Auth Gates / Human Actions

| Task | Type | Outcome |
|------|------|---------|
| 3 | checkpoint:human-action | Human typed **applied** after SQL Editor succeed. Confirmed: `patient_evaluations.ficha` jsonb column applied. No `supabase db push` used. |

## Files Created/Modified
- `src/schemas/evaluationFicha.schema.ts` — Zod document for musculoskeletal ficha 01–04 + `emptyEvaluationFicha`
- `src/schemas/evaluation.schema.ts` — `performedOn`-only required form schema nesting `ficha`
- `src/types/evaluation.ts` — `PatientEvaluation.ficha` + upsert input; re-exports `EvaluationFicha`
- `.planning/phases/12-avaliacoes-musculoesqueleticas/sql/12-patient-evaluations-ficha.sql` — committed idempotent DDL (ADD COLUMN ficha)
- `supabase/12-patient-evaluations-ficha.sql` — Editor paste twin (gitignored; byte-identical)

## Decisions Made
- Followed plan locks: D-03 date-only create, D-04 optional-leaf ficha document, D-05 additive JSONB only
- Schema apply path remains SQL Editor only (no `supabase db push`)
- Legacy text columns retained for read-compat (Wave 2 maps when ficha empty)
- Reuse Phase 3 `can_read_patient` / `can_write_patient` — do not rewrite helpers or policies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — Task 3 blocked on human SQL Editor apply as planned; resumed after **applied**.

## User Setup Required
**External services require manual configuration (completed for this plan).** Hosted Supabase SQL Editor was used to apply `12-patient-evaluations-ficha.sql`:
- Column `public.patient_evaluations.ficha` (`jsonb NOT NULL DEFAULT '{}'::jsonb`)
- Existing RLS via `can_read_patient` / `can_write_patient` unchanged

No new env vars in this plan.

## Next Phase Readiness
- Wave 1 foundation ready for service/UI plans (12-02+)
- Contracts and live `ficha` column available for upsert/read mapping
- Do not re-apply DDL unless idempotent re-run needed; do not use `supabase db push`

## Self-Check: PASSED
- FOUND: `src/schemas/evaluationFicha.schema.ts`, `src/schemas/evaluation.schema.ts`, `src/types/evaluation.ts`
- FOUND: `.planning/phases/12-avaliacoes-musculoesqueleticas/sql/12-patient-evaluations-ficha.sql`, `supabase/12-patient-evaluations-ficha.sql`
- FOUND commits: `c4fade0`, `59f1a32`
- Task 3: human-action approved (SQL Editor apply confirmed by user — **applied**)

---
*Phase: 12-avaliacoes-musculoesqueleticas*
*Completed: 2026-09-20*
