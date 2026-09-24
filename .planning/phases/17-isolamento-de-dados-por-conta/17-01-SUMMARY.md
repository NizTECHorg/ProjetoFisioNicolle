---
phase: 17-isolamento-de-dados-por-conta
plan: 01
subsystem: database
tags: [supabase, postgres, rls, board, patients]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: private.viewer_org_id, private.can_read_patient, patients_select with the creator branch for INSERT RETURNING
  - phase: 05-financeiro-autonomo
    provides: FORCE ROW LEVEL SECURITY and security-invoker trigger pattern
provides:
  - Idempotent SQL that scopes board_columns and board_cards to a personal owner or one organization
  - patients_select without the null created_by branch
affects:
  - 17-03 board owner stamp in the client
  - operator paste in the Supabase SQL Editor

tech-stack:
  added: []
  patterns:
    - Personal board rows require organization_id null and owner_id = auth.uid()
    - Company board rows require a non-null organization_id equal to private.viewer_org_id()
    - Card scope is copied from the parent column; the client value is ignored

key-files:
  created:
    - .planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql
  modified: []

key-decisions:
  - "SQL Editor is the apply path; do not run supabase db push"
  - "Board personal branch is organization_id null plus owner_id = auth.uid(); company branch uses viewer_org_id() and does not rewrite can_read_patient"
  - "patients_select drops the null created_by branch and keeps created_by = auth.uid() for INSERT RETURNING"

patterns-established:
  - "Null organization_id is a personal board, not a shared bucket"
  - "Proof of RLS stays commented so a paste cannot roll the migration back"

requirements-completed: []  # REQ-28 is phase-level; 17-02 and 17-03 still own mocks and the client stamp

duration: 5min
completed: 2026-09-24
---

# Phase 17 Plan 01: Account isolation SQL Summary

**Board RLS so one autonomo cannot read another's columns or cards, the same company still shares through `private.viewer_org_id()`, and `patients_select` no longer exposes rows with a null owner.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-24T02:11:42Z
- **Completed:** 2026-09-24T02:17:10Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- `board_columns` and `board_cards` gain nullable `owner_id` and `organization_id`, four indexes, ENABLE and FORCE ROW LEVEL SECURITY, and eight `TO authenticated` policies
- Personal rows require `organization_id is null` and `owner_id = (select auth.uid())`. Company rows require a non-null `organization_id` equal to `private.viewer_org_id()`, and the viewer must not be pending or rejected
- Triggers overwrite column scope on insert and copy the parent column onto each card. Card insert and update also require `private.can_read_patient` when `patient_id` is set
- `patients_select` keeps the creator branch for `INSERT … RETURNING` and the `can_read_patient` branch. The null-owner branch is gone. `can_read_patient` and `can_write_patient` are not replaced

## Task Commits

Each task was committed atomically:

1. **Task 1: RLS do quadro com dono pessoal ou organização** - `7995f28` (feat)
2. **Task 2: Fechar patients_select e deixar a prova comentada** - `5e00ae1` (fix)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` — Board policies, scope triggers, `patients_select` without a null owner, commented proof

## Decisions Made

- The operator pastes the script in the Supabase SQL Editor. The header warns not to use supabase db push. This plan does not apply SQL.
- A null `organization_id` is one person's board. Two autonomos do not share it. The company board matches `private.viewer_org_id()` only when that id is not null.
- `private.can_read_patient` stays as phase 3 wrote it. The only patient change is dropping the null `created_by` branch of `patients_select`.
- Existing board rows stay nullable. The backfill `UPDATE` is commented and uses the placeholder `uuid-do-operador`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Invisible parent column returns insufficient privilege**
- **Found during:** Task 1 (RLS do quadro com dono pessoal ou organização)
- **Issue:** A security-invoker trigger cannot see another account's column, so a plain exception would hide the row with a custom SQLSTATE. The commented proof expects 42501.
- **Fix:** When the parent column is not visible, `stamp_board_card_scope` raises `insufficient_privilege` (SQLSTATE 42501) and still ignores the client `owner_id`.
- **Files modified:** `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql`
- **Verification:** The raise is in the card trigger; the digit sequence 42501 appears only in the commented proof.
- **Committed in:** `7995f28` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Stamp functions are not executable by anon**
- **Found during:** Task 1 (RLS do quadro com dono pessoal ou organização)
- **Issue:** A new public function is executable by `PUBLIC` unless revoked. Anon does not need to call the stamp triggers.
- **Fix:** `REVOKE ALL` from `public` and `anon`, then `GRANT EXECUTE` to `authenticated`.
- **Files modified:** `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql`
- **Verification:** Both revoke and grant lines are in the script.
- **Committed in:** `7995f28` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both keep the board fail-closed. No new table, no change to `can_read_patient`, no client filter.

## Issues Encountered

None

## User Setup Required

The operator pastes `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` in the Supabase SQL Editor once. Do not use supabase db push.

- If `board_columns` or `board_cards` counts are above zero, replace `uuid-do-operador`, uncomment only that `UPDATE`, and run it before the policies. Otherwise current rows disappear.
- If patients with `created_by isnull` count above zero, assign a known creator or accept that those rows disappear.
- After Success, run the commented proof separately: autonomo B sees 0 rows for A's card, column, patient, session, and evolution; insert into A's column returns 42501. The company owner still sees the active therapist's patient. Another autonomo sees 0 rows. Insert of a patient with `created_by` equal to the uid and `RETURNING` succeeds.

## Next Phase Readiness

Ready for 17-02 (remove the invented evaluation) and 17-03 (client `owner_id` stamp and empty board copy). The hosted database still has the old board policies until the operator pastes this script. REQ-28 stays open until those plans land.

---
*Phase: 17-isolamento-de-dados-por-conta*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql`
- FOUND: commit `7995f28`
- FOUND: commit `5e00ae1`
- `npm run typecheck` passed
- Commented proof contains `set local role authenticated`, `request.jwt.claim.sub`, and `42501`
- Transaction `begin` and `rollback` appear only on commented lines
