---
phase: 18-minha-conta
plan: 02
subsystem: auth
tags: [supabase, supabase-js, current_password, npm]

requires:
  - phase: 18-minha-conta
    provides: Operator approval of the official @supabase/supabase-js@2.117.1 package
provides:
  - @supabase/supabase-js pinned at 2.117.1 so UserAttributes includes current_password
affects:
  - 18-04 password updateUser call
  - 18-06 password card

tech-stack:
  added:
    - "@supabase/supabase-js@2.117.1 (exact pin; replaces ^2.49.8)"
  patterns:
    - Password updateUser can pass current_password without a cast
    - App session stays flowType implicit

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - .planning/codebase/STACK.md

key-decisions:
  - "Installed @supabase/supabase-js@2.117.1 with --save-exact so package.json quotes 2.117.1 with no caret"
  - "Did not edit src/lib/supabase/client.ts; flowType stays implicit"

patterns-established:
  - "UserAttributes.current_password comes from @supabase/auth-js 2.117.1; do not cast the field on the old client"

requirements-completed: []  # REQ-29 is phase-level; later plans still own the page, services, and password card

duration: 1min
completed: 2026-09-24
---

# Phase 18 Plan 02: Supabase JS pin Summary

**`@supabase/supabase-js` is pinned at 2.117.1 so `UserAttributes` includes `current_password`, while the app client stays on implicit flow.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-24T14:31:52Z
- **Completed:** 2026-09-24T14:33:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Operator approval for the official `@supabase/supabase-js@2.117.1` was already recorded, so the install ran without a second pause.
- `package.json` now depends on exactly `2.117.1`, with no caret.
- `@supabase/auth-js` `UserAttributes` declares `current_password?: string`.
- `src/lib/supabase/client.ts` still uses `flowType: 'implicit'`. `npm run typecheck` passed. No crop, dropzone, Vitest, or Playwright package was added.

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirmar @supabase/supabase-js@2.117.1 no registry** — checkpoint already approved for exactly `@supabase/supabase-js@2.117.1` (no commit; nothing installed)
2. **Task 2: Instalar @supabase/supabase-js@2.117.1** - `de034a2` (chore)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `package.json` — `@supabase/supabase-js` exact pin `2.117.1`
- `package-lock.json` — lockfile resolved to supabase-js and auth-js 2.117.1
- `.planning/codebase/STACK.md` — recorded the exact 2.117.1 pin and implicit auth flow

## Decisions Made

- Used `npm install @supabase/supabase-js@2.117.1 --save-exact` so the dependency string is `"2.117.1"` and npm cannot float to another 2.x that lacks the typed field.
- Left `flowType` and `persistSession` on the app client unchanged.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 18-04. `updateUser` can type `current_password` without a cast.
- REQ-29 stays open until the account page, services, and password card land.

## Self-Check: PASSED

- FOUND: package.json (`"@supabase/supabase-js": "2.117.1"`)
- FOUND: package-lock.json
- FOUND: commit de034a2
- `current_password` present in `node_modules/@supabase/auth-js/dist/module/lib/types.d.ts`
- `flowType: 'implicit'` still in `src/lib/supabase/client.ts`
- `npm run typecheck` passed

---
*Phase: 18-minha-conta*
*Completed: 2026-09-24*
