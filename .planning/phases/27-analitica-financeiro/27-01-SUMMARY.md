---
phase: 27-analitica-financeiro
plan: 01
subsystem: payments
tags: [intl, america-sao-paulo, node-test, cents]

requires:
  - phase: 05-financeiro-autonomo
    provides: Paid session charges whose civil month matches America/Sao_Paulo
provides:
  - Pure finance aggregation with a São Paulo month key, a twelve-month window, and integer cents
  - Avulso grouping, price sort, and the previous month even when it sits outside the window
affects: [27-02, 27-03, 27-04]

tech-stack:
  added: []
  patterns:
    - "Month key from Intl.DateTimeFormat formatToParts with timeZone America/Sao_Paulo"
    - "Twelve-month window shifts with year*12+month; empty input returns no bars"
    - "Sums use Math.round(amountBrl * 100); blank price names become Avulso"

key-files:
  created:
    - src/lib/financeAnalytics.ts
    - src/lib/financeAnalytics.test.ts
  modified: []

key-decisions:
  - "Month key uses Intl formatToParts in America/Sao_Paulo; the window shifts by year*12+month"
  - "Blank price names become Avulso and sums are integer cents; an empty list returns no bars"
  - "REQ-38 stays open because plans 27-02, 27-03, and 27-04 still own the read, charts, and tabs"

patterns-established:
  - "Calendar helpers take a Date or a YYYY-MM key and do not call new Date()"
  - "buildFinanceAnalytics may construct a Date only from scheduledAt"

requirements-completed: []

duration: 8min
completed: 2026-10-10
---

# Phase 27 Plan 01: Agregação pura Summary

**São Paulo month key, twelve-month window, and integer-cent sums for paid charges, with an empty list returning no bars**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-10T01:09:50Z
- **Completed:** 2026-10-10T01:17:13Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `2026-04-01T02:30:00.000Z` maps to civil month `2026-03` in `America/Sao_Paulo`.
- The window runs from the oldest of twelve months through the injected current month, including zeros only when at least one payment exists.
- Cents, `Avulso`, price order, the second click, and the previous month outside the window are covered by `node:test`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Mês civil, janela de doze e clique que volta ao corrente** - `4a7c2d8` (test), `d67bb4f` (feat)
2. **Task 2: Somar centavos, preço e mês anterior** - `8a9551f` (test), `75db79d` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/lib/financeAnalytics.ts` - Pure aggregation: month key, window, cents, prices, previous month
- `src/lib/financeAnalytics.test.ts` - REQ-38 contracts for the aggregator, with an injected clock

## Decisions Made

- The month key comes from `Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts`. The window moves with `year * 12 + month`, not `setMonth`.
- `monthSentence` formats day 15 at 15:00 UTC through `Date.parse`, so the calendar helpers never call `new Date()`. `buildFinanceAnalytics` calls `new Date(scheduledAt)` only for the row instant.
- A blank or whitespace `priceName` becomes `Avulso`. Amounts sum as `Math.round(Number(amountBrl) * 100)`, and `amountBrl` is `cents / 100`.
- `rows.length === 0` sets `hasPayments` false and leaves `months` and `prices` empty. With rows, the window is twelve bars, zeros included. `previous` sums the whole history, including months outside that window.
- REQ-38 stays unchecked. Plans 27-02, 27-03, and 27-04 still own the paginated read, the SVG charts, and the Totais / Analítica tabs. `requirements.mark-complete` was not called.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cleared stale phase-complete bullets in Current Position**
- **Found during:** State update after Task 2
- **Issue:** begin-phase left `- Status: Phase complete` and `- Progress: 4/4 plans complete` from phase 26. `state.advance-plan` moved `Plan:` to `2 of 4` but does not match dash-prefixed bullets, so the position still said the phase was finished.
- **Fix:** Set those two bullets to `Ready to execute` and `1/4 plans executed`.
- **Files modified:** .planning/STATE.md
- **Verification:** Current Position shows Plan 2 of 4 and 1/4 plans executed
- **Committed in:** docs commit of this summary

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The aggregator followed the plan. The state bullet fix only stops the next plan from reading phase 27 as already complete.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 27-02 and 27-03 can import `PaidAnalyticsRow`, `FinanceAnalytics`, `buildFinanceAnalytics`, and `toggleSelectedMonth` from this module.
- The helper does not import `@/`, does not format R$, and does not touch SQL or the finance page.

## Self-Check: PASSED

- FOUND: src/lib/financeAnalytics.ts
- FOUND: src/lib/financeAnalytics.test.ts
- FOUND: 4a7c2d8
- FOUND: d67bb4f
- FOUND: 8a9551f
- FOUND: 75db79d

## TDD Gate Compliance

- RED `test(27-01)` commits exist before each `feat(27-01)` commit.

---
*Phase: 27-analitica-financeiro*
*Completed: 2026-10-10*
