---
phase: 18-minha-conta
plan: 04
subsystem: auth
tags: [supabase, gotrue, storage, account-avatars, profiles]

requires:
  - phase: 18-minha-conta
    provides: accountNameSchema, changePasswordSchema, mapAuthError code branches, and @supabase/supabase-js 2.117.1 with current_password
provides:
  - updateOwnName writes only profiles.full_name, then aligns user_metadata.full_name in a separate updateUser
  - changePassword sends password and current_password together on the app client
  - account photo upload to account-avatars with the object path stored on profiles.avatar_url
  - reloadProfile refreshes ClinicProfile outside onAuthStateChange
affects:
  - 18-05 account page and footer
  - 18-06 password card

tech-stack:
  added: []
  patterns:
    - Password change is one updateUser({ password, current_password }) with no prior sign-in
    - profiles.avatar_url stores a storage path; signed URLs last 3600 seconds and are not written back

key-files:
  created:
    - src/services/accountPhoto.service.ts
  modified:
    - src/services/auth.service.ts
    - src/providers/AuthProvider.tsx
    - src/hooks/useAuth.ts

key-decisions:
  - "changePassword calls supabase.auth.updateUser with password and current_password together and does not sign in first"
  - "profiles.avatar_url stores the account-avatars object path; signAccountAvatarUrl returns a 3600-second URL and does not write it back"
  - "reloadProfile calls fetchProfile outside onAuthStateChange and does not clear the query cache"

patterns-established:
  - "Account photo lives in bucket account-avatars at {userId}/{uuid}.ext with upsert false"
  - "Footer refresh after a name or photo save uses reloadProfile, not a fetch inside the auth callback"

requirements-completed: []  # REQ-29 is phase-level; plans 18-05 and 18-06 still own the page and password card

duration: 4min
completed: 2026-09-24
---

# Phase 18 Plan 04: Account name, password, and photo writes Summary

**The logged-in account can save its name, change its password with the current password in the same `updateUser`, and store an avatar path in `account-avatars`, then reload the footer profile without touching the auth callback.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T14:36:56Z
- **Completed:** 2026-09-24T14:41:00Z
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- `updateOwnName` updates only `profiles.full_name` for the logged-in id, then calls `updateUser({ data: { full_name } })` with no password fields
- `changePassword` parses with `changePasswordSchema(email)` and sends `password` and `current_password` in one `updateUser` on the app client
- `uploadAccountPhoto` writes `{userId}/{uuid}.ext` to `account-avatars` and stores that path on `profiles.avatar_url`
- `reloadProfile` refetches the clinic profile outside `onAuthStateChange` so the footer can update in the same session

## Task Commits

Each task was committed atomically:

1. **Task 1: updateOwnName e changePassword** - `3a000e2` (feat)
2. **Task 2: Service da foto no bucket account-avatars** - `8e2e1a2` (feat)
3. **Task 3: reloadProfile fora do callback de auth** - `2ae3674` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/services/auth.service.ts` — `updateOwnName` and `changePassword`
- `src/services/accountPhoto.service.ts` — `uploadAccountPhoto`, `signAccountAvatarUrl`, `removeAccountPhoto`
- `src/providers/AuthProvider.tsx` — `reloadProfile` on the context value
- `src/hooks/useAuth.ts` — `reloadProfile` on `AuthContextValue`

## Decisions Made

- `changePassword` is a single `supabase.auth.updateUser({ password, current_password })`. It does not call `signInWithPassword`, `reauthenticate`, or `signOut`.
- `profiles.avatar_url` stores the object path. `signAccountAvatarUrl` returns a 3600-second signed URL and does not write that URL back to Postgres.
- `reloadProfile` calls `fetchProfile` and `setProfile` only when a user id exists. The existing `userId` effect still loads profile and membership on login and logout. `reloadProfile` does not call `queryClient.clear()`.
- REQ-29 stays open in REQUIREMENTS.md. Plans 18-05 and 18-06 still own the account page and the password card. Same deferral as plans 18-01, 18-02, and 18-03.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 18-05. Name, password, and photo writes are exported, and `reloadProfile` is on `useAuth`. The account page and the password card are still unbuilt.

## Self-Check: PASSED

- FOUND: src/services/auth.service.ts
- FOUND: src/services/accountPhoto.service.ts
- FOUND: src/providers/AuthProvider.tsx
- FOUND: src/hooks/useAuth.ts
- FOUND: 3a000e2
- FOUND: 8e2e1a2
- FOUND: 2ae3674

## Verification

- `npm run typecheck` passed after each task
- `changePassword` contains `current_password` and does not contain `signInWithPassword`, `signInWithEmail`, `reauthenticate`, `auth.admin`, or `signOut`
- `accountPhoto.service.ts` uses `account-avatars` and does not mention `patient-avatars` or `uploadPatientPhoto`
- `reloadProfile` exists in `AuthProvider.tsx` and `useAuth.ts`; the `onAuthStateChange` callback has no `await` and no `fetchProfile`

---
*Phase: 18-minha-conta*
*Completed: 2026-09-24*
