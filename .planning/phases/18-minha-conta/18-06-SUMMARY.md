---
phase: 18-minha-conta
plan: 06
subsystem: ui
tags: [react, react-hook-form, supabase-auth, password, minha-conta]

requires:
  - phase: 18-minha-conta
    provides: changePassword sends password and current_password on one updateUser; mapAuthError returns Senha atual incorreta.
provides:
  - Senha card on /conta that submits only through changePassword
  - Field error Senha atual incorreta. for a wrong current password, with the new-password fields kept
  - Documented hosted Auth oracle for the password reset verification rule
affects:
  - phase verification of REQ-29.4
  - operator Dashboard flag security_update_password_require_current_password

tech-stack:
  added: []
  patterns:
    - Account password form is separate from the name form and calls changePassword with the session email
    - The hosted sign-in oracle is a second client with persistSession false and is not committed

key-files:
  created: []
  modified:
    - src/pages/AccountPage.tsx
    - .planning/phases/18-minha-conta/18-USER-SETUP.md

key-decisions:
  - "Salvar senha calls changePassword only; the page does not call updateUser, signInWithPassword, reauthenticate, or signOut"
  - "A wrong current password sets the field error Senha atual incorreta. and clears only Senha atual"
  - "The hosted Auth oracle was documented and was not executed"
  - "security_update_password_require_current_password stays operator Dashboard setup"

patterns-established:
  - "Password reset verification uses a second createClient with persistSession false and autoRefreshToken false"
  - "Wrong current password copy is exactly Senha atual incorreta."

requirements-completed: [REQ-29]

duration: 4min
completed: 2026-09-24
---

# Phase 18 Plan 06: Senha card Summary

**Senha card on /conta calls changePassword so updateUser sends the new password and current_password together; the hosted sign-in oracle is documented and was not run**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T14:48:57Z
- **Completed:** 2026-09-24T14:53:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Card Senha sits under Foto e nome and asks for Senha atual, Nova senha, and Confirmar nova senha
- Salvar senha calls `changePassword` with the session email; Zod failures never reach that call
- Success toast is Senha atualizada.; a wrong current password shows Senha atual incorreta. on that field and stays on /conta
- The password reset verification rule is written in `18-USER-SETUP.md` as a human check. The hosted sign-in proof was not run

## Task Commits

Each task was committed atomically:

1. **Task 1: Card Senha chama changePassword com a senha atual** - `7679750` (feat)
2. **Task 2: password reset verification rule** - `b1b15d6` (docs)

**Plan metadata:** `bdd4ac1` (docs: complete Senha card plan)

## Files Created/Modified

- `src/pages/AccountPage.tsx` - Senha card, show/hide toggle, and submit that calls changePassword
- `.planning/phases/18-minha-conta/18-USER-SETUP.md` - Dashboard flag and the hosted Auth oracle steps

## Decisions Made

- The password form is separate from the name form. Submit calls `changePassword(email, data)` and no other Auth method.
- The schema refine uses the session email through a resolver that reads the current email, not a password-form email input.
- Wrong current password (`Senha atual incorreta.`) uses `setError` on Senha atual, clears only that value, and focuses that field. Nova senha and Confirmar nova senha stay. There is no success toast and no `signOut`.
- `A nova senha deve ser diferente da atual.` is shown on Nova senha. Rate limit and other Auth failures use toasts.
- The hosted oracle (second client, `persistSession: false`, `autoRefreshToken: false`) is documented for the operator. This execution did not sign in against hosted Auth and does not claim that proof.
- `security_update_password_require_current_password` is Dashboard setup. This agent did not call the Management API and did not run `supabase db push`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [18-USER-SETUP.md](./18-USER-SETUP.md) for:

- SQL Editor script from plan 18-02, still incomplete in that file
- Authentication → Email: turn on `security_update_password_require_current_password` and leave reauthentication off
- The hosted password reset verification rule, which has not been run

## Next Phase Readiness

- Phase 18 plans are implemented. `/conta` can save a new password only together with the current password, through `changePassword`.
- D-05 and REQ-29.4 stay open until the operator turns the Dashboard flag on and runs the hosted oracle in `18-USER-SETUP.md`. If `updateUser({ password })` without `current_password` stores the new password, the flag is off and D-05 is not met.
- `flowType` remains `implicit`. No Vitest or Playwright file was added.

## Self-Check: PASSED

- FOUND: src/pages/AccountPage.tsx
- FOUND: .planning/phases/18-minha-conta/18-USER-SETUP.md
- FOUND: 7679750
- FOUND: b1b15d6

## Verification

- `rg` found Salvar senha, Informe a senha atual para gravar a nova., Senha atual incorreta., Senha atualizada., and changePassword in `src/pages/AccountPage.tsx`
- `rg` found no signInWithPassword, signInWithEmail, reauthenticate, updateUser, esqueci a senha, or signOut in `src/pages/AccountPage.tsx`
- `changePassword` calls `updateUser` with `password` and `current_password` from the parsed form. `npm run typecheck` passed
- Hosted oracle: not run

---
*Phase: 18-minha-conta*
*Completed: 2026-09-24*
