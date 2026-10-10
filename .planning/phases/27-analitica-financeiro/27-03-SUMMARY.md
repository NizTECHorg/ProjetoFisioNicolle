---
phase: 27-analitica-financeiro
plan: 03
subsystem: ui
tags: [svg, react, format-currency, node-test]

requires:
  - phase: 27-analitica-financeiro
    provides: buildFinanceAnalytics, toggleSelectedMonth, and month sentences in integer cents
provides:
  - FinanceAnalyticsCharts with month, price, and previous-month SVG views
  - Locked empty copy and a source contract for fills, roles, and banned animation
affects: [27-04]

tech-stack:
  added: []
  patterns:
    - "Charts are inline SVG. Accent #2f7dff is only unselected month bars, price bars, and the previous-month bar"
    - "Tooltip text is the aria-label: sentence or price name, middle dot, formatCurrency"
    - "Hover wins over focus; mouse leave clears hover and blur clears focus"

key-files:
  created:
    - src/components/finance/FinanceAnalyticsCharts.tsx
    - src/lib/financeAnalyticsCharts.contract.test.ts
  modified: []

key-decisions:
  - "Charts stay hand-drawn SVG; a short bar is 4px tall with a 44px transparent hit target"
  - "Price names render as React text inside foreignObject so CSS ellipsis can clip them; the full name stays on aria-label"
  - "REQ-38 stays open because plan 27-04 still owns the Totais and Analítica tabs"

patterns-established:
  - "FinanceAnalyticsCharts takes rows, now, and selectedMonthKey and does not fetch"
  - "Only the month bar calls toggleSelectedMonth; price and comparison bars are role img"

requirements-completed: []

duration: 12min
completed: 2026-10-10
---

# Phase 27 Plan 03: Visões em SVG Summary

**Three hand-drawn SVG views for month, price, and the previous month, with hover, focus, and a month toggle, plus the locked empty sentence**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-10T01:29:36Z
- **Completed:** 2026-10-10T01:41:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- With no paid rows, the component renders only `Ainda não há pagamentos para analisar.` and no SVG.
- Por mês draws twelve bars. The selected bar is forest; the others are accent. Click, Enter, and Space call `toggleSelectedMonth`. Space does not scroll.
- Por preço lists the selected month's names with a track and an accent fill. A zero month shows `Nenhum pagamento neste mês.` and keeps the month chart.
- Contra o mês anterior shows the selected month and the previous month, with both amounts in `formatCurrency` always visible. Those bars do not change the month.

## Task Commits

Each task was committed atomically:

1. **Task 1: Vazio, barras do mês e comparação** - `12725a4` (test), `05a63f4` (feat)
2. **Task 2: Barras horizontais por preço no mês selecionado** - `6bb6a1b` (test), `a00a69b` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/components/finance/FinanceAnalyticsCharts.tsx` - Three SVG views, tooltips, and the empty state
- `src/lib/financeAnalyticsCharts.contract.test.ts` - Source contract for copy, fills, roles, and the price-bar slice

## Decisions Made

- The charts are inline SVG. There is no chart library, no new package, and no `dash-line` or `transition-all`. Accent `#2f7dff` is only the unselected month bars, the price bars, and the previous-month bar. The selected month is `#0b1d36`.
- A bar shorter than 44px keeps a visible height of at least 4px and a transparent hit rect of 44px, including a zero cent bar. The focus ring stays the global accent outline.
- The tooltip prefers the hovered bar, otherwise the focused bar. Mouse leave clears hover only. Blur clears focus. The label is `${sentence} · ${formatCurrency(amount)}` or `${name} · ${formatCurrency(amount)}`.
- Price names are React children inside `foreignObject`, with CSS truncation. The `aria-label` keeps the full name. The component never reads a patient name.
- REQ-38 stays unchecked. Plan 27-04 still owns the Totais / Analítica tabs. `requirements.mark-complete` was not called.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript rejects `xmlns` on a `div`. The price label uses `createElement` with that attribute so the node inside `foreignObject` stays HTML and `truncate` can ellipsize the name.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 27-04 can mount `FinanceAnalyticsCharts` and pass `rows`, `now`, `selectedMonthKey`, and `onSelectMonth`. The component does not fetch and does not own the tabs.
- `node --test src/lib/financeAnalyticsCharts.contract.test.ts` and `npm run typecheck` passed.

## Self-Check: PASSED

- FOUND: src/components/finance/FinanceAnalyticsCharts.tsx
- FOUND: src/lib/financeAnalyticsCharts.contract.test.ts
- FOUND: 12725a4
- FOUND: 05a63f4
- FOUND: 6bb6a1b
- FOUND: a00a69b

---
*Phase: 27-analitica-financeiro*
*Completed: 2026-10-10*
