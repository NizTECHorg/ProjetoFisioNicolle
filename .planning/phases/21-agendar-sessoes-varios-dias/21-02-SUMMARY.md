---
phase: 21-agendar-sessoes-varios-dias
plan: 02
subsystem: scheduling
tags: [react, calendar, weekday-chips, pt-br, a11y]

requires:
  - phase: 21-agendar-sessoes-varios-dias
    provides: sessionSeries helper (buildWeeklySeries, clampWeeks, buildSeriesPreview, seriesCtaLabel, SERIES_WEEKDAYS)
provides:
  - Weekday chips (Seg-Dom) in the "Nova sessao" modal with multi-select and minimum of one
  - "Repetir por quantas semanas" field replacing "Horario fixo"
  - Live preview box and count-aware CTA ("Agendar N sessoes")
  - Single batched mutate carrying the generated series
affects: [21-03]

tech-stack:
  added: []
  patterns:
    - "Series derived in render body from state (no useMemo); total always series.length"
    - "Last selected chip uses aria-disabled without visual change; click ignored"

key-files:
  created: []
  modified:
    - src/pages/CalendarPage.tsx

key-decisions:
  - "seriesStartAt() is the only place applying clock time; empty time falls back to 09:00 (Number('') === 0 would otherwise yield 00:00)"
  - "Weekday pre-selection follows the chosen date until the first chip touch (weekdaysTouched)"
  - "Both Nova sessao and Agendar sessao neste dia call openComposer so patient, date, weeks and chips reset"

patterns-established:
  - "Pre-existing uncommitted Google-hide hunks were kept out of plan commits by reversing the saved patch, committing, then re-applying it"

requirements-completed: [REQ-32]

duration: 10min
completed: 2026-10-03
---

# Phase 21 Plan 02: Weekday chips in session modal Summary

**"Nova sessao" modal now takes Seg-Dom chips, "Repetir por quantas semanas", a live preview and an "Agendar N sessoes" button, submitting the whole series in one `create.mutate` built by `buildWeeklySeries`.**

## Task Commits

1. **Task 1: State, reset and series submit** - `9191aa5` (feat)
2. **Task 2: Chips, weeks field, preview and CTA** - `45a7d6a` (feat)

## Accomplishments

- Removed local `weeklyAt`/`clampWeeks`; imports now come from `@/lib/sessionSeries`.
- `weekdays` / `weekdaysTouched` state, reset in `openComposer`; `chooseSessionDate` moves the mark only before the first chip touch.
- `seriesStartAt()` applies the time; empty field gives 09:00.
- Chips with `aria-pressed`, full `aria-label`, `min-h-11`, `role="group"` labelled by `dias-semana-label`; sole selected chip is `aria-disabled` with no visual change.
- Preview `<p role="status" aria-live="polite">` and CTA text come only from the helper.
- "Horario fixo" string removed.

## Verification

- `npm run typecheck`: clean
- `npm run lint`: 0 errors (2 pre-existing warnings in unrelated files)
- `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts`: 16 pass
- Plan greps (copy strings, `min-h-11`, `onClick={openComposer}` x2, `setOpen(true)` x1, `create.mutate` x1): all pass
- `calendar.service.ts`, `useClinic.ts`, `Input/Modal/Button`, `package.json` untouched
- `npm run build` left to plan 21-03 as specified

## Deviations from Plan

None - plan executed exactly as written. Note: `CalendarPage.tsx` carried unrelated uncommitted changes (Google Calendar UI hidden behind `GOOGLE_CALENDAR_UI_VISIBLE`). They were temporarily reversed to keep the plan commits scoped, then restored to the working tree uncommitted.

## Known Stubs

None.

## Threat Flags

None - no new network, auth, file or schema surface.

## Self-Check: PASSED

- FOUND: src/pages/CalendarPage.tsx
- FOUND commits: 9191aa5, 45a7d6a
