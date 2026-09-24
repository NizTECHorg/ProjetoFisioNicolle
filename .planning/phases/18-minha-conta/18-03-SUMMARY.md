---
phase: 18-minha-conta
plan: 03
subsystem: auth
tags: [zod, supabase, gotrue, password, mapAuthError]

requires:
  - phase: 18-minha-conta
    provides: UI-SPEC password copy and the existing cadastro passwordSchema
provides:
  - changePasswordSchema and accountNameSchema with UI-SPEC empty, strength, and mismatch copy
  - mapAuthError branches for current_password_invalid, current_password_required, same_password, and over_request_rate_limit
affects:
  - 18-04 account name and password services
  - 18-06 password card and reset verification

tech-stack:
  added: []
  patterns:
    - Empty new password is rejected before passwordSchema so the copy is Informe a nova senha.
    - mapAuthError reads error.code before any message that contains the word password

key-files:
  created: []
  modified:
    - src/schemas/auth.schema.ts
    - src/lib/security/index.ts

key-decisions:
  - "Blank new password fails with Informe a nova senha. before passwordSchema, so an empty field does not show the 8-character rule"
  - "mapAuthError branches on error.code before any message that contains password, so current_password_invalid is Senha atual incorreta."

patterns-established:
  - "changePasswordSchema(email) takes the logged-in address only for the local-part refine; the form has no editable e-mail field"
  - "current_password_invalid and current_password_required share Senha atual incorreta. and are not the login copy"

requirements-completed: []  # REQ-29 is phase-level; later plans still own the page, services, and password card

duration: 5min
completed: 2026-09-24
---

# Phase 18 Plan 03: Account name and password validation Summary

**Zod `changePasswordSchema` and `accountNameSchema` reject empty, weak, and unchanged passwords with the UI-SPEC copy, and `mapAuthError` maps GoTrue `current_password_invalid` to Senha atual incorreta. before the generic password branch.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-24T14:00:42Z
- **Completed:** 2026-09-24T14:06:10Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- `accountNameSchema` is the single name rule (trim, 2–100, cadastro regex) and `registerSchema.fullName` uses it
- `changePasswordSchema(email)` requires current, new, and confirm passwords and fails in Zod before `updateUser`
- `mapAuthError` accepts `error.code` and returns Senha atual incorreta. for `current_password_invalid` and `current_password_required` even when the GoTrue message contains the word password

## Task Commits

Each task was committed atomically:

1. **Task 1: Schemas de nome e de troca de senha** - `e7fb640` (feat)
2. **Task 2: mapAuthError lê error.code antes do texto password** - `e42e250` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/schemas/auth.schema.ts` — Exports `passwordSchema`, `accountNameSchema`, `changePasswordSchema`, and `ChangePasswordFormData`
- `src/lib/security/index.ts` — `mapAuthError` branches on GoTrue `error.code` before `message.includes('password')`

## Decisions Made

- A blank or whitespace-only new password adds **Informe a nova senha.** and does not run `passwordSchema`, so the person does not see the minimum-of-8 line for an empty field.
- `current_password_invalid` and `current_password_required` both return **Senha atual incorreta.** `same_password` returns **A nova senha deve ser diferente da atual.** `over_request_rate_limit` returns **Muitas tentativas. Aguarde e tente novamente mais tarde.** `weak_password` still uses the generic password branch. Invalid login credentials stays **E-mail ou senha incorretos.**
- REQ-29 stays open in REQUIREMENTS.md. This plan only closes the client copy; later plans still own the page, the services, and the password card. Same deferral as plan 18-01.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Empty fields keep the empty-field copy**
- **Found during:** Task 1 (Schemas de nome e de troca de senha)
- **Issue:** A blank new password is equal to a blank current password, and it differs from a filled confirmation. Those refines would add “deve ser diferente” or “não coincidem” on top of the empty-field messages. A current password longer than 128 characters would also surface Zod’s English default.
- **Fix:** Skip the mismatch refine when the new password is blank or the confirmation is empty. Skip the same-password refine when the new password is blank. `currentPassword` max 128 uses the existing Portuguese maximum message from `passwordSchema`.
- **Files modified:** `src/schemas/auth.schema.ts`
- **Verification:** Runtime parse of empty, whitespace, mismatch, same-password, weak, and local-part cases returned only the expected UI-SPEC string. `npm run typecheck` passed.
- **Committed in:** `e7fb640` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The extra guards keep empty submits on the UI-SPEC empty copy. No new fields, packages, or auth calls.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 18-04, which should call `changePasswordSchema` before `updateUser` and throw `Error(mapAuthError(error))`.
- 18-02 (supabase-js bump) is still open and does not block this schema.

## Self-Check: PASSED

- FOUND: src/schemas/auth.schema.ts
- FOUND: src/lib/security/index.ts
- FOUND: e7fb640
- FOUND: e42e250

---
*Phase: 18-minha-conta*
*Completed: 2026-09-24*
