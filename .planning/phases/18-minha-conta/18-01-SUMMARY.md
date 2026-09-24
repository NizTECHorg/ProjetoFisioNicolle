---
phase: 18-minha-conta
plan: 01
subsystem: database
tags: [supabase, storage, rls, postgres, account-avatars, profiles]

requires:
  - phase: 16-foto-do-paciente
    provides: Private bucket insert, path regex, drop-policy-if-exists, notify pgrst
  - phase: 03-tipos-de-conta-e-equipe
    provides: profiles_update_own without a column list (CR-02)
provides:
  - Idempotent SQL for private bucket account-avatars, avatar_url path check, and column UPDATE grant
affects:
  - 18-04 account photo upload service

tech-stack:
  added: []
  patterns:
    - Account photo lives in account-avatars under auth.uid(), not in the patient bucket
    - authenticated UPDATE on profiles is column-scoped to full_name and avatar_url

key-files:
  created:
    - .planning/phases/18-minha-conta/sql/18-account.sql
    - .planning/phases/18-minha-conta/18-USER-SETUP.md
  modified: []

key-decisions:
  - "SQL Editor is the apply path for account-avatars; do not run supabase db push"
  - "profiles.avatar_url stores a UUID path or null; a legacy value aborts the script instead of being nulled"
  - "authenticated UPDATE on profiles is limited to full_name and avatar_url"

patterns-established:
  - "Account bytes use bucket account-avatars and folder auth.uid(); the pointer column is profiles.avatar_url"
  - "Column GRANT closes profiles_update_own without dropping that policy or revoking service_role"

requirements-completed: []  # REQ-29 is phase-level; later plans still own the page, photo service, and password

duration: 4min
completed: 2026-09-24
---

# Phase 18 Plan 01: Account photo SQL Summary

**Private bucket `account-avatars` (JPEG/PNG/WebP, 2 MiB), a UUID path check on `profiles.avatar_url`, and UPDATE granted only on `full_name` and `avatar_url`.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T13:54:49Z
- **Completed:** 2026-09-24T13:58:50Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- Idempotent SQL creates private bucket `account-avatars` (`public` false, `file_size_limit` 2097152, MIME `image/jpeg`, `image/png`, `image/webp`)
- `profiles_avatar_url_shape` accepts null or a path whose first segment is `id::text` and whose suffix is `.jpg`, `.png`, or `.webp`
- Storage policies are SELECT, INSERT, and DELETE for `authenticated` when the first folder equals `auth.uid()`. There is no UPDATE policy and no anon policy
- `authenticated` keeps UPDATE only on `full_name` and `avatar_url`

## Task Commits

Each task was committed atomically:

1. **Task 1: Bucket account-avatars e CHECK de avatar_url** - `0c68e24` (feat)
2. **Task 2: GRANT só de full_name e avatar_url** - `b5ffb93` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `.planning/phases/18-minha-conta/sql/18-account.sql` — Bucket, path guard, storage policies, and column GRANT for the operator to paste
- `.planning/phases/18-minha-conta/18-USER-SETUP.md` — SQL Editor paste steps

## Decisions Made

- The operator pastes the file in the Supabase SQL Editor. This plan does not run the script or call the Supabase CLI.
- A non-null `avatar_url` that is not a UUID path, or whose first segment is not the profile id, raises before `ADD CONSTRAINT`. The script does not `UPDATE` those rows to null.
- `REVOKE UPDATE` then `GRANT UPDATE (full_name, avatar_url)` limits `authenticated`. `profiles_update_own` stays. `service_role` and the table owner are not revoked.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Drop a leftover UPDATE policy on account-avatars**
- **Found during:** Task 1 (Bucket account-avatars e CHECK de avatar_url)
- **Issue:** T-18-03 forbids an UPDATE policy (upsert). A re-run would leave `account_avatars_storage_update` in place if a previous apply had created it.
- **Fix:** `drop policy if exists account_avatars_storage_update` with no `CREATE POLICY` for update.
- **Files modified:** `.planning/phases/18-minha-conta/sql/18-account.sql`
- **Verification:** The file has the drop and no `create policy` for update, no `to anon`.
- **Committed in:** `0c68e24` (Task 1 commit)

**2. [Rule 2 - Missing Critical] DO block also rejects a path whose first segment is not the profile id**
- **Found during:** Task 1 (Bucket account-avatars e CHECK de avatar_url)
- **Issue:** The constraint requires `split_part(avatar_url, '/', 1) = id::text`. A regex-only guard would still fail at `ADD CONSTRAINT` when the shape matches another id.
- **Fix:** The `DO` block raises when a non-null `avatar_url` fails the path regex or the first segment is distinct from `id::text`.
- **Files modified:** `.planning/phases/18-minha-conta/sql/18-account.sql`
- **Verification:** `raise exception` is present and the file has no `UPDATE` of `avatar_url` to null.
- **Committed in:** `0c68e24` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both keep the path check and the no-upsert rule enforceable on a re-run. No scope creep.

## Verification

Task 2 grep passed: `revoke update on public.profiles from public, anon, authenticated`, `grant update (full_name, avatar_url) on public.profiles to authenticated`, and `notify pgrst, 'reload schema'`. Negative grep found no `patient-avatars`, `can_read_patient`, `can_write_patient`, `handle_new_user`, `on_auth_user_created`, service_role revoke, or `profiles_update_own` drop. The script was not executed from the repository.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [18-USER-SETUP.md](./18-USER-SETUP.md) for:
- Pasting `.planning/phases/18-minha-conta/sql/18-account.sql` in the Supabase SQL Editor once
- Inspecting a legacy `avatar_url` if the DO block aborts, without nulling rows in bulk

## Known Stubs

None

## Authentication Gates

None

## Next Phase Readiness

Ready for 18-02. The SQL file is the storage and column wall. It takes effect only after the operator pastes it in the SQL Editor.

---
*Phase: 18-minha-conta*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/18-minha-conta/sql/18-account.sql`
- FOUND: `.planning/phases/18-minha-conta/18-USER-SETUP.md`
- FOUND: commit `0c68e24`
- FOUND: commit `b5ffb93`
