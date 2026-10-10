---
phase: 27-analitica-financeiro
plan: 02
subsystem: payments
tags: [postgrest, react-query, pagination, node-test]

requires:
  - phase: 27-analitica-financeiro
    provides: PaidAnalyticsRow from the pure aggregator in plan 27-01
  - phase: 05-financeiro-autonomo
    provides: autonomo_session_charges RLS and the existing session_id foreign key
provides:
  - Paginated read of paid charges with patient_sessions.scheduled_at and no patient name
  - useFinanceAnalytics on the finance query prefix the existing mutations already invalidate
affects: [27-03, 27-04]

tech-stack:
  added: []
  patterns:
    - "Analytics reads paid charges with an inner session embed, then pages 1000 rows ordered by id"
    - "A missing PostgREST relationship restarts as two queries with session id chunks of 200"
    - "useFinanceAnalytics uses queryKey ['finance', 'analytics', userId] and staleTime 60_000"

key-files:
  created:
    - src/lib/financeAnalyticsRead.contract.test.ts
  modified:
    - src/services/finance.service.ts
    - src/hooks/useFinance.ts

key-decisions:
  - "Paid analytics selects is_paid charges with scheduled_at and never uses listFinanceRealizadas"
  - "A PGRST200 or relationship/schema-cache error discards the embed and falls back to two queries"
  - "REQ-38 stays open because plans 27-03 and 27-04 still own the charts and the tabs"

patterns-established:
  - "Analytics source contract is enforced by reading the service and hook source with node:test"
  - "The finance cache prefix invalidates analytics without a new mutation"

requirements-completed: []

duration: 7min
completed: 2026-10-10
---

# Phase 27 Plan 02: Leitura paginada Summary

**Paginated paid-charge read with session scheduled_at, no patient name, cached under the existing finance query prefix**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-10T01:20:41Z
- **Completed:** 2026-10-10T01:27:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `listFinancePaidForAnalytics` pages paid charges by `id` and takes the date from `patient_sessions.scheduled_at`, including a prepaid session that is still scheduled.
- The select does not ask for the patient name. A missing embed restarts from two queries, and a session that does not come back is dropped.
- `useFinanceAnalytics` sits on `['finance', 'analytics', userId]`, so marking paid or saving the catalog already refreshes it.

## Task Commits

Each task was committed atomically:

1. **Task 1: Ler cobranças pagas paginadas, sem paciente e sem status** - `ad6990a` (test), `b6ef6bb` (feat)
2. **Task 2: Cache useFinanceAnalytics na chave finance** - `9b08a4b` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/services/finance.service.ts` - `listFinancePaidForAnalytics` with a 1000-row page loop and a two-query fallback
- `src/hooks/useFinance.ts` - `useFinanceAnalytics` beside the totals hook
- `src/lib/financeAnalyticsRead.contract.test.ts` - Source contract for the read and the finance cache key

## Decisions Made

- The analytics source is `autonomo_session_charges` with `is_paid` and `patient_sessions!inner(scheduled_at)`. It does not call `requireUserId`, does not filter session status, and does not reuse `listFinanceRealizadas`.
- `amount_brl` becomes `Number` at the map. An embed that arrives as an array uses the first `scheduled_at`. A row without a string `scheduled_at` is dropped.
- If PostgREST returns `PGRST200` or a message that cites `relationship` or `schema cache`, rows already read are discarded and the function pages paid charges (`id, price_name, amount_brl, is_paid, session_id`) then loads `patient_sessions` as `id, scheduled_at` in `.in` chunks of 200. No new foreign key and no SQL.
- `useFinanceAnalytics` copies `useFinanceTotals`: `enabled: signedIn`, `staleTime: 60_000`, no toast. `invalidateFinance` stays `invalidateQueries({ queryKey: ['finance'] })` without `exact: true`.
- REQ-38 stays unchecked. Plans 27-03 and 27-04 still own the SVG charts and the Totais / Analítica tabs. `requirements.mark-complete` was not called.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Advanced the dash progress bullet the SDK leaves behind**
- **Found during:** State update after Task 2
- **Issue:** `state.advance-plan` updates `Plan:` but not the dash bullet `- Progress:`, which would still say `1/4 plans executed` after this plan.
- **Fix:** Set that bullet to `2/4 plans executed`.
- **Files modified:** .planning/STATE.md
- **Verification:** Current Position shows Plan 3 of 4 and 2/4 plans executed
- **Committed in:** docs commit of this summary

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The read and the hook followed the plan. The state bullet fix only keeps the next plan from reading 27-02 as still pending.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 27-03 can call `useFinanceAnalytics` and pass `PaidAnalyticsRow[]` into `buildFinanceAnalytics`.
- `listFinanceRealizadas` still filters `status = 'realizada'`. No SQL, package, or finance page was changed.

## Self-Check: PASSED

- FOUND: src/services/finance.service.ts
- FOUND: src/hooks/useFinance.ts
- FOUND: src/lib/financeAnalyticsRead.contract.test.ts
- FOUND: ad6990a
- FOUND: b6ef6bb
- FOUND: 9b08a4b

## TDD Gate Compliance

- RED `test(27-02)` commit `ad6990a` exists before GREEN `feat(27-02)` commit `b6ef6bb`.
- Task 2 is not TDD. Its contract assertions landed in the same `feat` commit as the hook.

---
*Phase: 27-analitica-financeiro*
*Completed: 2026-10-10*
