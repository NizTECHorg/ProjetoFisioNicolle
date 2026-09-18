---
phase: 08-integracao-google-agenda
plan: 02
subsystem: database
tags: [google-calendar, sql, rls, supabase, secrets]

requires:
  - phase: 08-integracao-google-agenda
    provides: Google Calendar DTOs / mapper contracts (08-01)
provides:
  - google_calendar_connections (metadata, FORCE RLS, auth.uid())
  - google_calendar_secrets (REVOKE ALL from authenticated; service_role only)
  - google_calendar_session_links PK (user_id, session_id) for D-09
affects:
  - 08-03 Edge Functions vault writes
  - 08-04 googleCalendar.service / hooks
  - 08-05 CalendarPage connect/export

tech-stack:
  added: []
  patterns:
    - Dual-path SQL (committed under .planning/.../sql/ + gitignored supabase/ paste)
    - Secrets wall via REVOKE ALL + no GRANT to authenticated (REQ-20.3)
    - Per-user event links table instead of patient_sessions.google_event_id (D-09 / Pitfall 5)

key-files:
  created:
    - .planning/phases/08-integracao-google-agenda/sql/08-google-calendar.sql
    - supabase/08-google-calendar.sql
  modified: []

key-decisions:
  - "SQL Editor only — never supabase db push"
  - "Plaintext refresh_token column behind REVOKE; no Vault/pgsodium"
  - "Composite PK (user_id, session_id) on session_links; no ALTER patient_sessions"

patterns-established:
  - "Google Calendar schema ships as idempotent Editor script with FORCE RLS on connections/links"
  - "google_calendar_secrets deny-all for JWT role (revoke + FORCE RLS, zero authenticated policies)"

requirements-completed: [REQ-20, REQ-20.3, REQ-20.2]

duration: 6min
completed: 2026-09-18
---

# Phase 8 Plan 02: Google Calendar SQL Summary

**Idempotent hosted schema for Google Calendar connections, service-role-only secrets (REQ-20.3), and per-user session↔event links (D-09) — applied via SQL Editor**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-18T22:23:32Z
- **Completed:** 2026-09-18T22:30:30Z
- **Tasks:** 2
- **Files modified:** 2 (identical SQL twins; one committed, one gitignored paste)

## Accomplishments

- `google_calendar_connections` stores per-user metadata only (`google_email`, `connected_at`) with FORCE RLS `user_id = auth.uid()` (D-04)
- `google_calendar_secrets` has `REVOKE ALL` from `public`/`anon`/`authenticated` and **no GRANT** to authenticated — Edge Function `service_role` only (REQ-20.3 / T-08-04)
- `google_calendar_session_links` uses PK `(user_id, session_id)` + `google_event_id` text; no `google_event_id` column on `patient_sessions` (D-09 / Pitfall 5)
- Human applied script in hosted SQL Editor; plan did not use `supabase db push`

## Task Commits

Each task was committed atomically:

1. **Task 1: Author idempotent 08-google-calendar.sql** - `7849aa5` (feat)
2. **Task 2: Apply SQL in Editor [BLOCKING]** - human-action (no code commit; approved after SQL Editor + privilege guidance)

**Plan metadata:** `5175a95` (docs: complete plan)

## Files Created/Modified

- `.planning/phases/08-integracao-google-agenda/sql/08-google-calendar.sql` — Committed idempotent schema (connections + secrets + session_links + RLS)
- `supabase/08-google-calendar.sql` — Identical Editor paste copy (`/supabase/` gitignored)

## Decisions Made

- SQL Editor is the only apply path (Supabase CLI not installed; same dual-path as Phase 5/7)
- Secrets baseline is plaintext columns behind revoke — no Vault/pgsodium in this plan
- Do not ALTER `patient_sessions`; event ids live only on `google_calendar_session_links`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Kept REQ-20 open in REQUIREMENTS.md**
- **Found during:** Close-out (requirements.mark-complete)
- **Issue:** SDK marked full REQ-20 complete after SQL-only plan; Phase 8 success criteria (connect/export UI) are not shipped yet. Sub-IDs REQ-20.2/20.3 are not separate REQUIREMENTS.md rows.
- **Fix:** Reverted REQ-20 checkbox to unchecked; traceability stays In Progress.
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Verification:** REQ-20 unchecked; ROADMAP shows 2/5 plans; STATE points at 08-03
- **Committed in:** docs close-out commit

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** State/requirements correctness only — no production SQL change.

## Issues Encountered

None

## Authentication Gates / Human Actions

- **Task 2:** Human pasted/ran `08-google-calendar.sql` in Supabase SQL Editor and replied **approved** (privilege-check guidance given; continue authorized). Schema ready for Edge Function vault writes.

## User Setup Required

**External service step completed for this plan.** Hosted SQL Editor apply of `08-google-calendar.sql` was the blocking setup; human confirmed success. Remaining Google Cloud / Auth / Edge Function secrets belong to later plans (08-03+).

## Next Phase Readiness

Ready for `08-03` (Edge Functions) to write tokens into `google_calendar_secrets` and upsert `google_calendar_session_links`. Hosted tables + secrets wall are in place.

---
*Phase: 08-integracao-google-agenda*
*Completed: 2026-09-18*

## Self-Check: PASSED
