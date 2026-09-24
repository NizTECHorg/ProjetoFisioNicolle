---
phase: 19-boneco-de-rea-de-foco
plan: 02
subsystem: database
tags: [sql, supabase, patient_focus_areas, focus-regions]

requires:
  - phase: 06-silhueta-areas-de-foco
    provides: patient_focus_areas.region_key format check and the original eight limb keys
  - phase: 19-boneco-de-rea-de-foco
    provides: 42-key catalog that retires front.arm_*, back.arm_*, front.leg_*, and back.leg_*
provides:
  - Idempotent DELETE of the eight retired focus keys, applied in the hosted SQL Editor
  - Zero-row count on those keys, confirmed by the operator
affects:
  - 19-03 scroll guard on the focus card and evaluation map

tech-stack:
  added: []
  patterns:
    - SQL Editor is the apply path; the repo does not run supabase db push
    - The executable statement is one DELETE with an exact IN list of eight keys

key-files:
  created:
    - .planning/phases/19-boneco-de-rea-de-foco/sql/19-focus-region-retire.sql
  modified: []

key-decisions:
  - "SQL Editor is the apply path for the eight-key DELETE; do not run supabase db push"

patterns-established:
  - "Retired focus marks are removed with an exact IN list, never LIKE, and never copied onto the new limb parts"

requirements-completed: []  # REQ-30 is phase-level; plan 19-03 still owns the scroll guard

duration: 4min
completed: 2026-09-24
---

# Phase 19 Plan 02: DELETE das oito keys Summary

**Hosted DELETE that removes only the eight retired whole-limb focus keys, confirmed at zero rows in the SQL Editor**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T16:28:17Z
- **Completed:** 2026-09-24T16:32:29Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Committed an idempotent DELETE of `front.arm_l`, `front.arm_r`, `back.arm_l`, `back.arm_r`, `front.leg_l`, `front.leg_r`, `back.leg_l`, and `back.leg_r`
- Kept thigh, knee, shoulder, and every other saved region out of the WHERE
- Operator ran the script in the Supabase SQL Editor and the eight-key count returned zero rows

## Task Commits

Each task was committed atomically:

1. **Task 1: DELETE das oito keys e cópia do Editor** - `87b1b09` (feat)
2. **Task 2: Colar o DELETE no SQL Editor** - operator confirmed `applied` (no code commit; hosted run only)

**Plan metadata:** docs commit that adds this summary

## Files Created/Modified
- `.planning/phases/19-boneco-de-rea-de-foco/sql/19-focus-region-retire.sql` - DELETE of the eight retired keys, with the proof SELECT left commented
- `supabase/19-focus-region-retire.sql` - gitignored byte-for-byte copy for the SQL Editor; not in the commit

## Decisions Made
- The hosted project is updated only by pasting the script in the SQL Editor. This plan does not call `supabase db push`.
- The operator reply `applied` closes the checkpoint: the run succeeded and the eight-key count returned zero rows.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. `src/components/layout/AppShell.tsx` stayed unstaged.

## User Setup Required
None for this plan. The SQL Editor run is done. Do not paste the DELETE again and do not use `supabase db push`.

Publishing `patient-ai-summary` is still open from plan 01. See [19-USER-SETUP.md](./19-USER-SETUP.md).

## Next Phase Readiness
Ready for 19-03 (seleção sem scroll no card e no mapa da avaliação). REQ-30 stays open until that plan lands.

## Self-Check: PASSED

- FOUND: .planning/phases/19-boneco-de-rea-de-foco/sql/19-focus-region-retire.sql
- FOUND: supabase/19-focus-region-retire.sql
- FOUND: 87b1b09

---
*Phase: 19-boneco-de-rea-de-foco*
*Completed: 2026-09-24*
