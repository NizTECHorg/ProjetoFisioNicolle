---
phase: 05-financeiro-autonomo
plan: 05
subsystem: payments
tags: [react, react-router, tanstack-query, finance, autonomo, catalog]

requires:
  - phase: 05-01
    provides: canSeeFinance UX predicate
  - phase: 05-03
    provides: useFinancePrices, useFinanceTotals, useFinanceRealizadas, catalog and charge mutations
  - phase: 05-04
    provides: session XOR + Pago allocation; finance query family invalidation
provides:
  - Drawer-only Financeiro (Wallet) for autonomo; mobileNavItems stays 4
  - /financeiro AutonomoFinancePage with silent Navigate for empresa/fisio
  - Catalog CRUD (Novo/Cadastrar/Editar/Arquivar preço + ConfirmDialog)
  - Three formatCurrency totals from autonomo_finance_totals RPC
  - Realizadas Completar valor / Marcar como pago
affects:
  - Phase 5 verification / UAT as autonomo vs empresa vs fisio

tech-stack:
  added: []
  patterns:
    - clinicNavigationItems path filters (equipe=empresa, financeiro=autonomo)
    - canSeeFinance Navigate to /pacientes with no toast
    - Totals from useFinanceTotals RPC, never from the realizadas list
    - Archive via ConfirmDialog + useArchivePrice UPDATE; no delete
    - Completar valor XOR modal; Marcar como pago immediate mutate

key-files:
  created:
    - src/pages/AutonomoFinancePage.tsx
  modified:
    - src/config/navigation.ts
    - src/routes/index.tsx

key-decisions:
  - "Drawer-only Wallet Financeiro after clinic items; Equipe still empresa-only; mobileNavItems.length === 4"
  - "canSeeFinance Navigate to /pacientes silent, no toast; do not reuse FinancePage or canManageFinance"
  - "Three totals from RPC formatCurrency; not derived from the realizadas list"
  - "Catalog archives with ConfirmDialog; Completar valor XOR + Pago; Marcar como pago immediate"

patterns-established:
  - "Finance nav is clinicNavigationItems-only, same drawer pattern as Equipe"
  - "AutonomoFinancePage talks to useFinance hooks only; no supabase and no bakery queries.ts"
  - "Realizadas error is independent of the page-level prices/totals error article"

requirements-completed: [REQ-17]

duration: 4min
completed: 2026-09-14
---

# Phase 5 Plan 05: AutonomoFinancePage Summary

**Drawer-only `/financeiro` for autonomo with catalog CRUD, RPC mês/ano/sempre totals via formatCurrency, and realizadas Completar valor / Marcar como pago — bakery FinancePage is not routed**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-14T18:56:51Z
- **Completed:** 2026-09-14T19:01:06Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `clinicNavigationItems` shows **Financeiro** (`Wallet`) only for `autonomo`, after Equipe; `mobileNavItems` stays 4 items
- `/financeiro` renders `AutonomoFinancePage` inside AppShell; empresa/fisio get a silent `Navigate` to `/pacientes` (no toast)
- Catalog: **Novo preço** / **Cadastrar preço** / **Editar preço** / **Arquivar preço?** ConfirmDialog (UPDATE `archived_at`, never delete)
- Totais **Este mês** / **Este ano** / **Sempre** from `useFinanceTotals` + `formatCurrency`; zero is `R$ 0,00`; prepaid hint under the grid
- Sessões realizadas: empty DataTable copy, **Completar valor** XOR modal, **Marcar como pago** immediate; paid rows show Badge only

## Task Commits

Each task was committed atomically:

1. **Task 1: Drawer item, route, and gated page chrome** - `46d4ebe` (feat)
2. **Task 2: Totals cards and catalog CRUD** - `0e1ece0` (feat)
3. **Task 3: Realizadas list Completar valor and Marcar como pago** - `435b500` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/pages/AutonomoFinancePage.tsx` — gated finance screen: totals, catalog CRUD, realizadas follow-up
- `src/config/navigation.ts` — Wallet item + autonomo filter; mobile bar unchanged
- `src/routes/index.tsx` — `/financeiro` → `AutonomoFinancePage` (no `FinancePage` import)

## Decisions Made

- D-01: Financeiro is drawer-only; silent redirect; do not reuse `FinancePage` / `canManageFinance`.
- D-09/D-08: Totals come from the RPC hook, not by summing the realizadas table (prepaid agendada still counts in totals, not in the list).
- D-03/D-04: Archive is ConfirmDialog + `useArchivePrice`; edit hint is future-only.
- D-10: Completar valor uses `sessionChargeFieldsSchema` + `parseBrlInput`; Marcar como pago has no dialog (Equipe Aceitar analog).
- Empty catalog still shows **Novo preço**; empty realizadas has no fake rows; empty catalog Completar valor hides Select and keeps avulso.

## Deviations from Plan

None - plan executed exactly as written.

Project-wide `npm run lint` still fails on a pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (untouched). Touched-file ESLint and `npm run typecheck` exit 0. Out of scope — not auto-fixed.

## Issues Encountered

No browser automation tools in this session. Automated floor: `npm run typecheck` and ESLint on touched files. Human UAT still needed as autonomo vs empresa/fisio.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 5 production plans 01–05 are implemented. Ready for `/gsd-verify-work 5` and UAT:

- Autônomo: drawer Financeiro, catalog CRUD, totals `R$ 0,00` when unpaid, empty realizadas with no fake rows, avulso still available with empty catalog
- Empresa/fisio: no drawer item, `/financeiro` redirects to `/pacientes`, session form has no Valor da consulta

RLS from 05-02 remains the wall; `canSeeFinance` is UX only.

## Verification

- `npm run typecheck` exits 0
- ESLint on `src/pages/AutonomoFinancePage.tsx`, `src/config/navigation.ts`, `src/routes/index.tsx` exits 0
- `navigation.ts` contains `/financeiro` and `Wallet`; `mobileNavItems` has 4 path entries
- `src/routes/index.tsx` imports `AutonomoFinancePage`, not `@/pages/FinancePage`
- Page exports `AutonomoFinancePage`, uses `canSeeFinance`, `formatCurrency`, `useFinanceTotals`, `useArchivePrice`, `useFinanceRealizadas`, `useMarkChargePaid`
- Copy present: Novo preço, Cadastrar preço, Editar preço, Arquivar preço?, Completar valor, Marcar como pago, Nenhuma sessão realizada
- No `.delete(`, no `supabase` on the page, no `canManageFinance`

## Self-Check: PASSED

- FOUND: `src/pages/AutonomoFinancePage.tsx`
- FOUND: `src/config/navigation.ts`
- FOUND: `src/routes/index.tsx`
- FOUND: `46d4ebe`
- FOUND: `0e1ece0`
- FOUND: `435b500`
---

*Phase: 05-financeiro-autonomo*
*Completed: 2026-09-14*
