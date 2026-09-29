---
phase: 20-esqueci-minha-senha
plan: 01
subsystem: auth
tags: [supabase-auth, zod, rate-limit, password-recovery, resetPasswordForEmail]

requires:
  - phase: 18-conta-e-senha
    provides: changePassword with current_password wall; passwordSchema; Auth confirm callback
provides:
  - forgotPasswordSchema and recoveryPasswordSchema (no currentPassword)
  - auth:recovery: client rate limit (7/hour)
  - ConfirmCallbackResult.mode signup|recovery
  - requestPasswordReset and setPasswordFromRecovery
affects: [20-02 ForgotPasswordPage, 20-03 AuthConfirmPage recovery branch]

tech-stack:
  added: []
  patterns:
    - Recovery schemas mirror changePassword empty/strength/match without currentPassword
    - mapRecoveryRequestError keeps signup SMTP copy out of reset path
    - Confirm success mode from verified OTP type or initialParams.type===recovery

key-files:
  created: []
  modified:
    - src/schemas/auth.schema.ts
    - src/lib/security/index.ts
    - src/lib/auth/confirmCallback.ts
    - src/services/auth.service.ts

key-decisions:
  - "recoveryPasswordSchema uses password/confirmPassword field names (not newPassword) per plan interfaces"
  - "mapRecoveryRequestError returns fixed UI-SPEC send failure string; rate-limit still via mapAuthError"
  - "typesToTry(null) left without recovery (Pitfall 5 / T-20-05)"

patterns-established:
  - "Recovery write: updateUser({ password }) then signOut — never call changePassword"
  - "Recovery request: resetPasswordForEmail redirectTo env.appUrl/auth/confirm; no profiles probe"

requirements-completed: [REQ-31]

duration: 2min
completed: 2026-09-29
---

# Phase 20 Plan 01: Schemas e serviços de recovery Summary

**Zod forgot/recovery contracts, auth:recovery rate limits, confirmCallback mode, and requestPasswordReset/setPasswordFromRecovery — Phase 18 changePassword and client flowType untouched.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-29T21:04:16Z
- **Completed:** 2026-09-29T21:05:57Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Exported `forgotPasswordSchema` / `recoveryPasswordSchema` with UI-SPEC validation strings and no `currentPassword`
- Extended `limitsFor` so `auth:recovery:*` matches register (7 attempts / 1 hour)
- Widened confirm success to `{ ok: true; mode: 'signup' | 'recovery' }` without blind recovery in `typesToTry(null)`
- Added `requestPasswordReset` (anti-enumeration, recovery send error copy) and `setPasswordFromRecovery` (`updateUser` + `signOut`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schemas forgot + recovery e rate limit recovery** - `7f3be66` (feat)
2. **Task 2: confirmCallback mode recovery + auth.service reset/set** - `3a8a00c` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/schemas/auth.schema.ts` — forgotPasswordSchema, recoveryPasswordSchema, form data types
- `src/lib/security/index.ts` — limitsFor auth:recovery: branch (mapAuthError signup SMTP unchanged)
- `src/lib/auth/confirmCallback.ts` — ConfirmCallbackResult.mode; resolveSuccessMode
- `src/services/auth.service.ts` — requestPasswordReset, setPasswordFromRecovery, mapRecoveryRequestError

## Decisions Made

- Field names `password` / `confirmPassword` on recovery schema match plan interfaces (Wave 2 forms wire the same names).
- Recovery request errors use fixed «Não foi possível enviar o link. Tente de novo.» except server rate-limit, which still uses `mapAuthError`.
- `typesToTry(null)` remains `['signup', 'email', 'magiclink', 'invite']` so signup confirm is not weakened.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None — SMTP/templates remain Dashboard-only (later plans / ops); no new env vars in this plan.

## Next Phase Readiness

- Wave 2 can mount ForgotPasswordPage on `requestPasswordReset` and AuthConfirmPage recovery branch on `result.mode === 'recovery'` + `setPasswordFromRecovery`.
- Do not edit `changePassword` / AccountPage current_password wall; do not change Auth client `flowType` / Redirect URLs.

## Self-Check: PASSED

- FOUND: src/schemas/auth.schema.ts, src/lib/security/index.ts, src/lib/auth/confirmCallback.ts, src/services/auth.service.ts
- FOUND: commits 7f3be66, 3a8a00c
- No stubs in plan-touched files
