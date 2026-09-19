---
phase: 08-integracao-google-agenda
plan: 04
subsystem: integrations
tags: [google-calendar, supabase-auth, edge-functions, tanstack-query, oauth]

requires:
  - phase: 08-integracao-google-agenda
    provides: GoogleCalendarConnection DTOs, GOOGLE_CALENDAR_COPY, mapGoogleCalendarError, Edge Functions connect/export/disconnect
provides:
  - googleCalendar.service (linkIdentity + vault/export/disconnect invoke)
  - useGoogleCalendar hooks (connection query + mutations with PT toasts)
affects:
  - 08-05 CalendarPage Google strip

tech-stack:
  added: []
  patterns:
    - Page → hook → service → Auth/functions.invoke (no supabase in hooks)
    - provider_refresh_token vaulted via EF only — never custom localStorage keys
    - Portuguese errors via mapAuthError / mapGoogleCalendarError + GOOGLE_CALENDAR_COPY toasts

key-files:
  created:
    - src/services/googleCalendar.service.ts
    - src/hooks/useGoogleCalendar.ts
  modified: []

key-decisions:
  - "Vault skips when no provider tokens; throws vaultMissing if access present without refresh (Pitfall 1)"
  - "needs_reconnect Error.code drives connection invalidate so strip can switch CTA"
  - "unlinkIdentity is best-effort after disconnect EF succeeds (Pitfall 4)"

patterns-established:
  - "Google OAuth only via linkIdentity from Agenda service — never LoginPage"
  - "Hook toasts lock to GOOGLE_CALENDAR_COPY; onError prefers Error.message else exportError"

requirements-completed: [REQ-20, REQ-20.1, REQ-20.2, REQ-20.5]

duration: 21min
completed: 2026-09-19
---

# Phase 8 Plan 04: Google Calendar Service & Hooks Summary

**Clinic Google Calendar service with linkIdentity + three Edge Function invokes, and TanStack hooks that toast locked Portuguese UI-SPEC copy without talking to Supabase directly**

## Performance

- **Duration:** ~21 min
- **Started:** 2026-09-19T00:12:25Z
- **Completed:** 2026-09-19T00:33:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `linkGoogleCalendar` uses Google provider, `calendar.events.owned`, `access_type=offline`, `prompt=consent`, `redirectTo` `/agenda`
- `vaultGoogleTokensIfPresent` / `exportVisibleMonth` / `disconnectGoogleCalendar` call `functions.invoke` for connect/export/disconnect; no localStorage token keys
- Hooks expose connection query + link/vault/export/disconnect mutations with GOOGLE_CALENDAR_COPY toasts and connection invalidate on vault, disconnect, and needs_reconnect

## Task Commits

Each task was committed atomically:

1. **Task 1: googleCalendar.service.ts** - `87959e0` (feat)
2. **Task 2: useGoogleCalendar hooks** - `0cb620d` (feat)

**Plan metadata:** (docs commit after this SUMMARY)

## Files Created/Modified

- `src/services/googleCalendar.service.ts` — Connection RLS read, linkIdentity, vault/export/disconnect via EF
- `src/hooks/useGoogleCalendar.ts` — TanStack query/mutations for Agenda strip wiring

## Decisions Made

- Missing refresh after OAuth (access token present, no refresh) throws `vaultMissing` so reconnect CTA can fire; silent `skipped` when neither token is present (safe mount call)
- Export failures with 401/403 or `needs_reconnect` attach `Error.code = 'needs_reconnect'` and map to `tokenExpired` copy
- Disconnect always treats EF secret wipe as success; `unlinkIdentity` failures are ignored (Pitfall 4)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Project-wide `npm run lint` still fails on pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (out of scope). New 08-04 files pass eslint and `npm run typecheck` cleanly.

## User Setup Required

None - no new external configuration for this plan (EF secrets / Google provider from 08-03).

## Next Phase Readiness

- CalendarPage (08-05) can mount the Google strip via hooks only: connect → vault on return → export month → disconnect confirm
- No blockers for Agenda UI wiring

## Self-Check: PASSED

- FOUND: `src/services/googleCalendar.service.ts`
- FOUND: `src/hooks/useGoogleCalendar.ts`
- FOUND: `87959e0`
- FOUND: `0cb620d`

---
*Phase: 08-integracao-google-agenda*
*Completed: 2026-09-19*
