---
phase: 03-tipos-de-conta-e-equipe
plan: 02
subsystem: database
tags: [postgres, supabase, rls, organizations, membership, handle_new_user]

requires:
  - phase: 03-01
    provides: AccountType / Membership contracts (autonomo | empresa | fisioterapeuta)
  - phase: live-auth
    provides: hosted handle_new_user + on_auth_user_created on auth.users

provides:
  - Idempotent org/membership/RLS SQL (committed phase copy + gitignored Editor paste)
  - profiles.account_type plus organizations and organization_memberships
  - private.is_org_owner / viewer_org_id / can_read_patient / can_write_patient / can_view_profile
  - lookup_organization_by_code and decide_membership RPCs
  - Replaced handle_new_user preserving live insert columns
affects:
  - 03-03 cadastro metadata
  - 03-04 login gates
  - 03-05 equipe accept/reject
  - 03-06 patients.created_by client
  - 03-07 empresa read on ficha

tech-stack:
  added: []
  patterns:
    - SQL Editor apply only; never supabase db push
    - private SECURITY DEFINER helpers with set search_path = ''
    - ALTER patients.created_by before any function that references p.created_by

key-files:
  created:
    - .planning/phases/03-tipos-de-conta-e-equipe/sql/00-live-handle-new-user.md
    - .planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql
  modified: []

key-decisions:
  - "Preserve bakery profiles.role='atendente' on handle_new_user; clinic type is account_type"
  - "ALTER patients.created_by before private helpers (Postgres 42703)"
  - "SQL Editor is the apply path; supabase/ copy is gitignored"

patterns-established:
  - "Dump live handle_new_user before CREATE OR REPLACE"
  - "Creator-write / owner-read patient RLS via private.can_write_patient / can_read_patient"
  - "Reject membership sets profiles.is_active false; never delete auth.users"

requirements-completed: []

# Metrics
duration: 20h 30min
completed: 2026-09-09
---

# Phase 3 Plan 02: SQL org/membership/RLS Summary

**Hosted Postgres now has account_type, organizations, organization_memberships, private RLS helpers, lookup/decide RPCs, and a replaced handle_new_user that honors D-01–D-04**

## Performance

- **Duration:** 20h 30min wall clock (human SQL Editor checkpoint across sessions; active authoring ~10 min)
- **Started:** 2026-09-08T23:47:40Z
- **Completed:** 2026-09-09T20:17:25Z
- **Tasks:** 3 (plus Task 2b 42703 fix)
- **Files modified:** 2 committed (+ gitignored Editor copy)

## Accomplishments

- Dumped live `handle_new_user` before replace: insert columns `id, full_name, email, role, is_active`; trigger `on_auth_user_created`
- Authored idempotent SQL: `account_type`, org + membership tables, private helpers, RPCs, creator-write / owner-read patient policies
- Human applied the script in SQL Editor after a 42703 fix; live schema matches the committed copy

## Task Commits

Each task was committed atomically:

1. **Task 1: Inspect live handle_new_user** - `ebf1a34` (docs)
2. **Task 2: Author committed SQL and Editor copy** - `3e8c898` (feat)
3. **Task 2b: Fix created_by order (42703)** - `36863e1` (fix)
4. **Task 3: Apply SQL in Editor** - n/a (human confirmed `applied`; no further code change)

**Plan metadata:** (this commit)

## Files Created/Modified

- `.planning/phases/03-tipos-de-conta-e-equipe/sql/00-live-handle-new-user.md` — live function body, trigger name, patient/profile policies
- `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` — source of truth (744 lines)
- `supabase/03-account-types-team.sql` — identical Editor paste copy (gitignored `/supabase/`)

## Decisions Made

- Keep bakery `profiles.role = 'atendente'` on signup; clinic type lives in `profiles.account_type` (`autonomo` | `empresa` | `fisioterapeuta`)
- `ALTER TABLE patients ADD created_by` must run before `CREATE FUNCTION` private helpers that read `p.created_by` (Postgres validates function bodies immediately — 42703)
- Apply path remains hosted SQL Editor; do not run `supabase db push`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 42703 undefined column `p.created_by` on first Editor apply**
- **Found during:** Task 3 (Apply SQL in Editor)
- **Issue:** First paste failed because private helpers referenced `patients.created_by` before `ALTER TABLE` added the column. Postgres `CREATE FUNCTION` validates the SQL body immediately.
- **Fix:** Moved `ALTER patients.created_by` (section 2b) before private helper definitions; documented residual null `created_by` SELECT debt in a SQL comment
- **Files modified:** `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (Editor copy re-synced)
- **Verification:** Human re-ran the script and confirmed `applied`
- **Committed in:** `36863e1` (Task 2b)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for the script to apply. No scope creep.

## Issues Encountered

- First SQL Editor run failed with `42703` (`p.created_by` used before `ALTER`). Fix `36863e1` moved the column add before helpers. Human re-ran and confirmed `applied`.
- Live schema now has `account_type`, `organizations`, `organization_memberships`, private helpers, and lookup/decide RPCs.

## Auth Gates

- Task 1 and Task 3 were `checkpoint:human-action` (SQL Editor dump + apply). Normal flow, not deviations. Resume-signal for Task 3: `applied`.

## User Setup Required

SQL Editor apply for this plan is **done** (human confirmed `applied` after the 42703 re-run). Remaining deferred Editor scripts (REQ-05 / REQ-14) are unchanged in STATE.md.

If the gitignored `supabase/03-account-types-team.sql` is missing locally, copy from `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`.

## Next Phase Readiness

Wave 1 SQL is live. Wave 2 can start: 03-03 cadastro (account_type + join code in `raw_user_meta_data`) and 03-06 `created_by` on the patient service.

REQ-15 stays open until cadastro, login gates, equipe, and empresa ficha read land. This plan delivered REQ-15.5 persistence only.

Do not start live signup/equipe/patient UAT that assumes the new schema without this apply — it is now confirmed.

## Verification

- Both SQL paths exist and match (744 lines)
- Script contains `create schema if not exists private`, `lookup_organization_by_code`, `decide_membership`, `private.can_read_patient`, `private.can_write_patient`
- `grep -v '^--'` search_path count is 9 (>= 3)
- No `service_role` and no `delete from auth.users` in executable SQL
- Human: SQL Editor run succeeded; no 42P17 recursion error reported

## Self-Check: PASSED

- FOUND: `.planning/phases/03-tipos-de-conta-e-equipe/sql/00-live-handle-new-user.md`
- FOUND: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`
- FOUND: `supabase/03-account-types-team.sql`
- FOUND: `ebf1a34` docs(03-02): record live handle_new_user dump
- FOUND: `3e8c898` feat(03-02): author org membership RLS SQL
- FOUND: `36863e1` fix(03-02): add patients.created_by before private helpers

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-09*
