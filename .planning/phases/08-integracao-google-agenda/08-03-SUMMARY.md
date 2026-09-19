---
phase: 08-integracao-google-agenda
plan: 03
subsystem: api
tags: [google-calendar, edge-functions, deno, oauth, vault]

requires:
  - phase: 08-integracao-google-agenda
    provides: Google Calendar SQL (connections/secrets/links) + mapper contracts
provides:
  - google-calendar-connect Edge Function (vault refresh via service_role)
  - google-calendar-export Edge Function (RLS-scoped month export + Calendar v3)
  - google-calendar-disconnect Edge Function (revoke + delete secrets)
affects:
  - 08-04 googleCalendar.service / hooks
  - 08-05 CalendarPage strip

tech-stack:
  added: []
  patterns:
    - Self-contained Deno handlers (no ../_shared imports) for Dashboard single-file deploy
    - GOOGLE_CLIENT_ID/SECRET only in Function secrets — never VITE_*
    - Export uses caller JWT for patient_sessions; service_role only for secrets table

key-files:
  created:
    - .planning/phases/08-integracao-google-agenda/functions/google-calendar-connect/index.ts
    - .planning/phases/08-integracao-google-agenda/functions/google-calendar-export/index.ts
    - .planning/phases/08-integracao-google-agenda/functions/google-calendar-disconnect/index.ts
    - .planning/phases/08-integracao-google-agenda/functions/_shared/mapSessionToGoogleEvent.ts
  modified: []

key-decisions:
  - "Dashboard deploy cannot resolve sibling _shared — each index.ts is self-contained"
  - "Human deploy via Dashboard + Function secrets; no VITE_GOOGLE_* in Vite env"

patterns-established:
  - "Committed EF source of truth under .planning/.../functions/; mirror to gitignored supabase/functions/"
  - "Calendar REST + token refresh via fetch only (no googleapis npm)"

requirements-completed: [REQ-20, REQ-20.2, REQ-20.3, REQ-20.5]

duration: 40min
completed: 2026-09-18
---

# Phase 8 Plan 03: Edge Functions Summary

**Self-contained connect/export/disconnect Edge Functions vault refresh tokens server-side, export visible-month sessions with RLS, and revoke on disconnect — deployed with Function secrets (REQ-20.2, REQ-20.3)**

## Performance

- **Duration:** ~40 min (includes human Dashboard deploy + secrets)
- **Started:** 2026-09-18T22:30:00Z
- **Completed:** 2026-09-19T00:11:00Z
- **Tasks:** 2
- **Files modified:** 4 committed sources under phase `functions/` (+ gitignored supabase mirror)

## Accomplishments

- `google-calendar-connect` upserts `google_calendar_secrets` + connection metadata via service_role; responses never include refresh tokens
- `google-calendar-export` refreshes access_token with Function secrets, SELECTs sessions with caller JWT (RLS), insert/patch Calendar primary events, upserts `google_calendar_session_links`
- `google-calendar-disconnect` best-effort Google revoke + deletes secrets/connection rows
- Human approved: three functions live + `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set as Function secrets (not VITE_*)
- Dashboard deploy fix: inlined CORS/helpers — no `../_shared` imports (Module not found on single-file upload)

## Task Commits

Each task was committed atomically:

1. **Task 1: Author Edge Function sources (dual path)** - `679d08e` (feat); follow-up `1bf9a7e` (fix: self-contained for Dashboard)
2. **Task 2: Deploy functions + Google/Supabase ops [BLOCKING]** - human-action (approved: secrets + edge functions created)

**Plan metadata:** (docs commit after this SUMMARY)

## Files Created/Modified

- `.planning/phases/08-integracao-google-agenda/functions/google-calendar-connect/index.ts` — Vault connect handler
- `.planning/phases/08-integracao-google-agenda/functions/google-calendar-export/index.ts` — Month export + Calendar v3
- `.planning/phases/08-integracao-google-agenda/functions/google-calendar-disconnect/index.ts` — Disconnect/revoke
- `.planning/phases/08-integracao-google-agenda/functions/_shared/mapSessionToGoogleEvent.ts` — Deno mapper twin (D-08; inlined into export for Dashboard)
- `supabase/functions/google-calendar-*/index.ts` — Deploy paste mirrors (gitignored)

## Decisions Made

- Self-contained `index.ts` per function so Supabase Dashboard bundler does not need sibling `_shared/`
- Secrets stay in Edge Function env only; SPA never sees `GOOGLE_CLIENT_SECRET`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Dashboard Module not found `_shared/cors.ts`**
- **Found during:** Task 2 human deploy
- **Issue:** Dashboard uploads only the function folder’s `index.ts`; relative `../_shared` imports fail at bundle time
- **Fix:** Inlined CORS, clients, token refresh, and mapper into each self-contained `index.ts`
- **Files modified:** three `functions/*/index.ts` under planning tree
- **Committed in:** `1bf9a7e`
- **Verification:** `grep _shared supabase/functions/google-calendar-*/index.ts` → empty; human redeploy succeeded

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan goals:** None — same contracts, deployable on Dashboard

## Issues Encountered

- First Dashboard paste still used old `_shared` import until user replaced full file content

## User Setup Required

- [x] Google Cloud OAuth Web client + Calendar API
- [x] Supabase Google provider + Manual Linking
- [x] Deploy three Edge Functions
- [x] Function secrets `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

## Next Phase Readiness

- SPA service can `functions.invoke` connect/export/disconnect (08-04)
- CalendarPage strip can wire hooks (08-05)

## Self-Check: PASSED

- [x] SUMMARY frontmatter complete
- [x] requirements-completed matches plan
- [x] Human checkpoint approved
