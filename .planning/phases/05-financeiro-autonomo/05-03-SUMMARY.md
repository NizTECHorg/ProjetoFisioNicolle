---
phase: 05-financeiro-autonomo
plan: 03
subsystem: payments
tags: [tanstack-query, supabase, finance, autonomo, rpc]

requires:
  - phase: 05-01
    provides: Clinic finance DTOs (AutonomoPrice, SessionCharge, FinanceTotals, UpsertSessionChargeInput)
  - phase: 05-02
    provides: autonomo_prices, autonomo_session_charges, autonomo_finance_totals RPC, FORCE RLS, snapshot trigger
provides:
  - finance.service named exports for catalog, charges, totals RPC, and realizadas list
  - useFinance TanStack hooks under queryKey ['finance', ...]
  - invalidatePatient also drops ['finance'] so session writes refresh /financeiro
affects:
  - 05-04 session editor Valor da consulta (upsertSessionCharge after create id)
  - 05-05 AutonomoFinancePage

tech-stack:
  added: []
  patterns:
    - Page → hook → service → Supabase; clinic finance never imports bakery queries.ts
    - Totals from rpc autonomo_finance_totals mapped with Number, not from the realizadas array
    - Archive is UPDATE archived_at; no .delete() on catalog
    - Catalog upsert omits client amount; markChargePaid is is_paid only (preserve-not-recopy)

key-files:
  created:
    - src/services/finance.service.ts
    - src/hooks/useFinance.ts
  modified:
    - src/hooks/usePatients.ts

key-decisions:
  - "upsertSessionCharge omits client amount when priceId is set; skips write when both priceId and adHoc are empty (D-10 optional allocation)"
  - "markChargePaid is UPDATE is_paid only so the snapshot trigger preserve-not-recopy leaves amount_brl and price_name (D-04, D-07)"
  - "listFinanceRealizadas is realizadas only, no charge embed on the sessions query; empty array not fake rows (D-10, T-05-01)"
  - "invalidatePatient also invalidates queryKey ['finance'] so /financeiro does not stay stale (Pitfall 8)"

patterns-established:
  - "Clinic finance service is the only PostgREST client for autonomo_prices / autonomo_session_charges"
  - "Query keys ['finance'], ['finance', 'prices'], ['finance', 'totals'], ['finance', 'sessions'], ['finance', 'charge', sessionId]"
  - "mapDbError on every service throw; formatCurrency(Number(...)) stays in UI, Number() in the mapper"

requirements-completed: [REQ-17]

duration: 2min
completed: 2026-09-14
---

# Phase 5 Plan 03: Clinic finance service and hooks Summary

**Clinic finance.service maps catalog CRUD, XOR charge upsert, paid totals via autonomo_finance_totals, and realizadas without embedding money on patient_sessions; useFinance plus invalidatePatient refresh queryKey ['finance']**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-14T18:46:22Z
- **Completed:** 2026-09-14T18:48:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `finance.service.ts` is the only PostgREST client for clinic finance tables: active catalog, create/update, archive via `archived_at`, XOR upsert, mark paid, totals RPC, and realizadas list
- Totals come from `autonomo_finance_totals` mapped with `Number`; they are not summed in JS from the realizadas array (D-08, D-09)
- `useFinance` exposes named TanStack queries/mutations with family prefix `['finance']` and UI-SPEC toast copy
- Patient session create/update/delete now invalidate `['finance']` so `/financeiro` does not stay stale (Pitfall 8)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write finance.service.ts** - `fb8adde` (feat)
2. **Task 2: useFinance hooks and invalidatePatient finance family** - `e183edf` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/services/finance.service.ts` — named exports: listActivePrices, createPrice, updatePrice, archivePrice, fetchFinanceTotals, listFinanceRealizadas, upsertSessionCharge, markChargePaid, fetchChargeBySessionId
- `src/hooks/useFinance.ts` — useFinancePrices/Totals/Realizadas, useSessionCharge, catalog and charge mutations; does not import queries.ts
- `src/hooks/usePatients.ts` — invalidatePatient also drops `{ queryKey: ['finance'] }`

## Decisions Made

- When `priceId` is set, the client omits `amount_brl`; the 05-02 trigger copies catalog on INSERT or `price_id` change. Same-`price_id` UPDATE (mark paid / upsert conflict) preserves OLD snapshot (D-04, D-07).
- When both `priceId` and ad-hoc amount are empty, `upsertSessionCharge` returns without insert (D-10 optional allocation). Zero rows are not written.
- Realizadas list selects clinical session columns plus `patients(full_name)` only, then a separate charges select. Missing charge maps to `null`. Empty list is `[]` — no fake rows (T-05-01, D-10).
- Session mutations reuse existing Sessão salva / atualizada / removida toasts; finance cache refresh is via the shared `invalidatePatient` prefix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Split catalog vs avulso upsert payloads**
- **Found during:** Task 1 (finance.service.ts typecheck)
- **Issue:** A single union payload made TypeScript treat catalog `amount_brl` as `undefined`, so the avulso branch (`amount_brl: number`) failed `RejectExcessProperties`
- **Fix:** Two `.upsert` calls — catalog path sends `price_id` + `is_paid` only; avulso path sends `amount_brl`
- **Files modified:** `src/services/finance.service.ts`
- **Verification:** `npm run typecheck` exits 0
- **Committed in:** `fb8adde` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for typecheck. Behavior matches the plan (omit client amount on catalog; send ad-hoc amount otherwise). No scope creep.

## Issues Encountered

`npm run lint` still fails on a **pre-existing** `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (untouched this plan). ESLint on `src/services/finance.service.ts`, `src/hooks/useFinance.ts`, and `src/hooks/usePatients.ts` exits 0. `npm run typecheck` exits 0. Out of scope — not auto-fixed.

## User Setup Required

None - no external service configuration required. SQL from 05-02 must already be applied (human confirmed).

## Next Phase Readiness

Ready for 05-04-PLAN.md (session editor Valor da consulta). Plan 05-04 should call `upsertSessionCharge` after create returns an id — this plan did not add finance fields to `UpsertPatientSessionInput` and did not implement `AutonomoFinancePage`.

REQ-17 remains open until 05-04 and 05-05 ship the XOR UI and `/financeiro` page. Do not treat client hooks as authorization; RLS from 05-02 is the wall.

## Verification

- `npm run typecheck` exits 0
- Task files pass ESLint
- `export async function listActivePrices`, `archivePrice`, `autonomo_finance_totals`, `listFinanceRealizadas` present
- No `.delete(` in `finance.service.ts`
- File does not import FinancePage, permissions, or queries.ts
- `export function useFinancePrices`, `useFinanceTotals`, `useMarkChargePaid` present
- `usePatients.ts` contains `queryKey: ['finance']`

## Self-Check: PASSED

- FOUND: `src/services/finance.service.ts`
- FOUND: `src/hooks/useFinance.ts`
- FOUND: `src/hooks/usePatients.ts`
- FOUND: `fb8adde`
- FOUND: `e183edf`
---

*Phase: 05-financeiro-autonomo*
*Completed: 2026-09-14*
