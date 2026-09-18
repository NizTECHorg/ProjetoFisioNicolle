---
phase: 08-integracao-google-agenda
plan: 01
subsystem: integrations
tags: [google-calendar, zod, typescript, security, export]

requires:
  - phase: 04-atalhos-dashboard
    provides: CalendarSession / listSessionsInRange agenda contracts
provides:
  - GoogleCalendarConnection / GoogleCalendarExportResult DTOs (no tokens)
  - GOOGLE_CALENDAR_COPY + exportMonthSchema
  - mapSessionToGoogleEvent (60min, America/Sao_Paulo, D-08 allow-list)
  - mapGoogleCalendarError Portuguese mapper (REQ-20.5)
affects:
  - 08-02 SQL / Edge Functions
  - 08-03 googleCalendar.service
  - 08-04 useGoogleCalendar hooks
  - 08-05 CalendarPage Google strip

tech-stack:
  added: []
  patterns:
    - Metadata-only Google connection DTO (never refresh/access tokens on client types)
    - Locked UI-SPEC copy object shared by schema + security mapper
    - Pure CalendarSession → Google event body mapper with fixed duration

key-files:
  created:
    - src/types/googleCalendar.ts
    - src/schemas/googleCalendar.schema.ts
    - src/services/googleCalendar.mapper.ts
  modified:
    - src/lib/security/index.ts

key-decisions:
  - "Import GOOGLE_CALENDAR_COPY into mapGoogleCalendarError to avoid copy drift"
  - "DEFAULT_EVENT_DURATION_MS = 60 minutes; timeZone America/Sao_Paulo"
  - "Omit location when place is empty or em dash placeholder"

patterns-established:
  - "Export-only Portuguese copy lives in GOOGLE_CALENDAR_COPY (D-03)"
  - "Google vendor errors never surface raw — mapGoogleCalendarError only"

requirements-completed: [REQ-20, REQ-20.3, REQ-20.4, REQ-20.5]

duration: 5min
completed: 2026-09-18
---

# Phase 8 Plan 01: Google Calendar contracts Summary

**Locked Google Calendar TypeScript DTOs, Zod export month payload, UI-SPEC exportação copy, pure session→event mapper (60 min / America/Sao_Paulo), and mapGoogleCalendarError Portuguese mapper**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-18T22:15:41Z
- **Completed:** 2026-09-18T22:21:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Client connection DTO exposes only `googleEmail` + `connectedAt` (REQ-20.3 / D-04) — no token fields
- `GOOGLE_CALENDAR_COPY` locks exportação wording including connected notice “não é sincronização bidirecional” (D-03 / REQ-20.4)
- `mapSessionToGoogleEvent` builds Google event bodies from CalendarSession allow-list fields only (D-08)
- `mapGoogleCalendarError` maps 401/403/network/empty/permission to locked Portuguese strings (REQ-20.5)

## Task Commits

Each task was committed atomically:

1. **Task 1: Google Calendar DTOs and Zod schema** - `e938ce8` (feat)
2. **Task 2: mapSessionToGoogleEvent and mapGoogleCalendarError** - `0b1d17b` (feat)

**Plan metadata:** `29556c7` (docs: complete plan)

## Files Created/Modified

- `src/types/googleCalendar.ts` — Connection metadata and export result DTOs
- `src/schemas/googleCalendar.schema.ts` — `exportMonthSchema` + `GOOGLE_CALENDAR_COPY`
- `src/services/googleCalendar.mapper.ts` — Pure session → Google event mapper
- `src/lib/security/index.ts` — Added `mapGoogleCalendarError` beside `mapStorageError`

## Decisions Made

- Prefer importing `GOOGLE_CALENDAR_COPY` in security rather than duplicating reconnect/network/export strings
- Default event end = `scheduledAt + 60 * 60 * 1000` with `America/Sao_Paulo`
- Location omitted when `place` is empty or `'—'`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Kept REQ-20 open in REQUIREMENTS.md**
- **Found during:** Close-out (requirements.mark-complete)
- **Issue:** SDK marked full REQ-20 complete after contracts-only plan; Phase 8 success criteria (connect/export UI) are not shipped yet. Sub-IDs REQ-20.3/20.4/20.5 are not separate REQUIREMENTS.md rows.
- **Fix:** Reverted REQ-20 checkbox and traceability to In Progress; STATE Current Position set to Phase 8 Plan 2 of 5 (advance-plan had stalled on Phase 7 last-plan).
- **Files modified:** `.planning/REQUIREMENTS.md`, `.planning/STATE.md`
- **Verification:** REQ-20 unchecked; ROADMAP shows 1/5 plans; STATE points at 08-02
- **Committed in:** docs close-out commit

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** State/requirements correctness only — no production code change.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required for this contracts plan.

## Next Phase Readiness

Ready for `08-02` (SQL / Edge Functions) to implement against these named contracts. Unrelated local WIP on auth duplicate-email copy was preserved outside these commits.

---
*Phase: 08-integracao-google-agenda*
*Completed: 2026-09-18*

## Self-Check: PASSED
