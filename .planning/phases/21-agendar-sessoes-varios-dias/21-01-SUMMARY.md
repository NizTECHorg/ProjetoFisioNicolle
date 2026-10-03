---
phase: 21-agendar-sessoes-varios-dias
plan: 01
subsystem: scheduling
tags: [typescript, node-test, dates, pt-br]

requires:
  - phase: 07-agenda
    provides: weeklyAt/clampWeeks behavior in CalendarPage that this helper replaces
provides:
  - Pure weekly-series generator (start date + weekdays + cycles -> Date[])
  - SERIES_WEEKDAYS catalog (Seg->Dom with JS getDay index)
  - Locked PT-BR preview and CTA copy as testable functions
  - First automated test in the repo (node:test, no new packages)
affects: [21-02 CalendarPage modal UI, 21-03]

tech-stack:
  added: []
  patterns:
    - "Pure lib module with zero imports so it runs under node --test"
    - "Dates built from local components (new Date(y, m, d + n, h, min)), never ms arithmetic"

key-files:
  created:
    - src/lib/sessionSeries.ts
    - src/lib/sessionSeries.test.ts
  modified: []

key-decisions:
  - "Module has zero imports and exactly 7 exports (closed surface for plan 21-02)"
  - "Preview range runs first->last element of the series; year shown on both ends only when they differ"
  - "REQ-32 not marked complete: this plan delivers only the helper; UI wiring is in 21-02/21-03"

patterns-established:
  - "Run tests with: TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts"
  - "Test imports use relative paths with .ts extension"

requirements-completed: []

duration: 8min
completed: 2026-10-03
---

# Phase 21 Plan 01: Weekly series helper Summary

**Pure `sessionSeries` module that turns (start, weekdays, weeks) into local-time dates plus the locked PT-BR preview/CTA copy, proven by 16 `node:test` cases with no new dependencies.**

## Performance

- **Duration:** ~8 min
- **Completed:** 2026-10-03
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments

- `src/lib/sessionSeries.ts`: `MAX_SERIES_WEEKS`, `SeriesWeekday`, `SERIES_WEEKDAYS`, `clampWeeks`, `buildWeeklySeries`, `buildSeriesPreview`, `seriesCtaLabel`; no imports, no `@/` alias.
- `src/lib/sessionSeries.test.ts`: 16 passing tests covering REQ-32 AC1-AC4, month/year rollover, duplicate/empty/out-of-range weekdays, `clampWeeks` bounds, weekday table order, all three preview forms (including singular and `×`), and the CTA label.

## Task Commits

1. **Task 1: Pure module `src/lib/sessionSeries.ts`** - `5d76498` (feat)
2. **Task 2: node:test coverage** - `d2e8d5f` (test)

## AC to test mapping

- AC1 (several weekdays): "AC1 + AC3: segunda, quarta e sábado por 2 semanas rendem 6 datas..."
- AC2 (multiplied by weeks / start date included): "AC2: a data inicial marcada entra junto..."
- AC3 (same time, across month/year): "AC1 + AC3" and "AC3: série que atravessa mês e ano..."
- AC4 (single day == old weekly behavior): "AC4: um único dia por N semanas..."

## Verification

- `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts`: 16 pass, 0 fail
- `npm run typecheck`: clean
- `npm run lint`: 0 errors (2 pre-existing warnings in unrelated files)
- `package.json`, `CalendarPage.tsx`, `calendar.service.ts`, `useClinic.ts` untouched; no SQL; nothing pushed

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None - no new network, auth, file or schema surface.

## Self-Check: PASSED

- FOUND: src/lib/sessionSeries.ts
- FOUND: src/lib/sessionSeries.test.ts
- FOUND commits: 5d76498, d2e8d5f
