---
phase: 05-financeiro-autonomo
plan: 01
subsystem: payments
tags: [zod, typescript, finance, autonomo, brl]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: AccountType including autonomo; canManageTeam UX-only predicate style
affects:
  - 05-02 SQL catalog/charges/RLS
  - 05-03 finance.service and useFinance
  - 05-04 session editor Valor da consulta
  - 05-05 AutonomoFinancePage

tech-stack:
  added: []
  patterns:
    - Clinic finance DTOs live in types/finance.ts; never database.types.ts or bakery FinancePage
    - parseBrlInput accepts 180 / 180,50 / 180.50; rejects empty and <= 0
    - canSeeFinance is UX only; RLS in 05-02 is the authority
    - Session XOR: Boolean(priceId) vs avulso; hidden archived priceId still counts as catalog

key-files:
  created:
    - src/types/finance.ts
    - src/schemas/finance.schema.ts
  modified:
    - src/lib/accountAccess.ts
    - src/schemas/patient.schema.ts

key-decisions:
  - "Catalog form is name + positive BRL string, not two location-tied fees (D-02)"
  - "canSeeFinance true only for autonomo; empresa and fisio are false; UX only (D-01)"
  - "sessionFormSchema keeps place as optional clinical text and copies XOR/Pago superRefine (D-05, D-06, D-08)"
  - "Boolean(priceId) treats a hidden archived catalog id as allocation; Pago without catalog or parseable avulso fails"

patterns-established:
  - "Named exports, single quotes, no semicolons, 2-space indent"
  - "Finance Zod copy in pt-BR from UI-SPEC; no Vitest in this plan"
  - "sessionChargeFieldsSchema is the shared XOR/Pago contract; sessionFormSchema copies the same rules so grep strings live on the session schema"

requirements-completed: [REQ-17]

duration: 3min
completed: 2026-09-14
---

# Phase 5 Plan 01: Contratos financeiro Summary

**Clinic finance DTOs, parseBrlInput, autonomo-only canSeeFinance, and session XOR/Pago Zod without bakery FinancePage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-14T18:30:57Z
- **Completed:** 2026-09-14T18:34:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Locked clinic finance TypeScript contracts (`AutonomoPrice`, `SessionCharge`, `FinanceTotals`, charge draft/upsert inputs) in `src/types/finance.ts`
- Added `parseBrlInput`, `priceFormSchema` (name + BRL string), and `sessionChargeFieldsSchema` (catalog XOR avulso + Pago-requires-amount)
- `canSeeFinance` returns true only for `accountType === 'autonomo'` and is documented as UX only
- `sessionFormSchema` still treats `place` as optional clinical text and rejects catalog plus avulso together

## Task Commits

Each task was committed atomically:

1. **Task 1: Write finance DTOs and catalog/charge Zod** - `ac767ba` (feat)
2. **Task 2: canSeeFinance and sessionFormSchema XOR + Pago** - `bf624b1` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/types/finance.ts` — camelCase clinic finance DTOs (REQ-17); no cents types; no residência/escritório fields
- `src/schemas/finance.schema.ts` — parseBrlInput, priceFormSchema, sessionChargeFieldsSchema, empty form helpers
- `src/lib/accountAccess.ts` — canSeeFinance next to canManageTeam
- `src/schemas/patient.schema.ts` — priceId, adHocAmount, isPaid plus XOR and Pago superRefine; existing realizada patientState/conducts rules kept

## Decisions Made

- Catalog is a name plus a positive BRL string (D-02). ROADMAP “dois valores fixos” is not implemented.
- `canSeeFinance` is a client UX predicate only (T-05-01). Empresa and fisio are false. Plan 05-02 RLS remains the wall.
- Session XOR/Pago rules were copied onto `sessionFormSchema` (plan-allowed alternative to `.and`) so the pt-BR messages live in `patient.schema.ts`. `Boolean(priceId)` still counts a hidden archived catalog id as allocation (D-03/D-07 edit path).
- Neither catalog nor avulso remains valid when `isPaid` is false (D-10 complete later). Pago without a catalog price or parseable avulso fails with `Informe um valor para marcar como pago.`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

`npm run lint` still fails on a **pre-existing** `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (untouched this plan). ESLint on the four task files exits 0. `npm run typecheck` exits 0. Out of scope — not auto-fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Later plans can import `AutonomoPrice`, `SessionCharge`, `FinanceTotals`, `parseBrlInput`, `priceFormSchema`, `sessionChargeFieldsSchema`, and `canSeeFinance` without reading bakery `FinancePage` or `permissions.ts`.

REQ-17 remains open — this plan only shipped TypeScript contracts and Zod. SQL, services, session UI, and `/financeiro` land in 05-02–05-05. Do not treat `canSeeFinance` as authorization.

Ready for 05-02-PLAN.md (SQL catalog/charges/RLS).

## Verification

- `npm run typecheck` exits 0
- Task files pass ESLint
- `parseBrlInput('180,50')` → 180.5; `parseBrlInput('')` and `parseBrlInput('0')` → null
- Exports: AutonomoPrice, SessionCharge, FinanceTotals, FinanceRealizadaRow, parseBrlInput, priceFormSchema, sessionChargeFieldsSchema, canSeeFinance
- `sessionFormSchema` includes `place` and `priceId`; no residência/escritório field names
- XOR copy `Escolha um preço do catálogo ou um valor avulso` and Pago copy `Informe um valor para marcar como pago` present in `patient.schema.ts`

## Self-Check: PASSED

- FOUND: `src/types/finance.ts`
- FOUND: `src/schemas/finance.schema.ts`
- FOUND: `src/lib/accountAccess.ts`
- FOUND: `src/schemas/patient.schema.ts`
- FOUND: `ac767ba`
- FOUND: `bf624b1`
---

*Phase: 05-financeiro-autonomo*
*Completed: 2026-09-14*
