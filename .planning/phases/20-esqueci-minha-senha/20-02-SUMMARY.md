---
phase: 20-esqueci-minha-senha
plan: 02
subsystem: auth
tags: [react-router, GuestRoute, forgot-password, anti-enumeration, AuthLayout]

requires:
  - phase: 20-01
    provides: requestPasswordReset; forgotPasswordSchema
provides:
  - ForgotPasswordPage GuestRoute /esqueci-senha with anti-enumeration success UI
  - LoginPage link Esqueci minha senha → /esqueci-senha (min-h-11)
affects: [20-03 AuthConfirmPage recovery UI, 20-04 UAT / Redirect URLs]

tech-stack:
  added: []
  patterns:
    - GuestRoute owns /esqueci-senha; /auth/confirm stays public
    - sent boolean replaces form with identical success copy (no profiles probe)

key-files:
  created:
    - src/pages/auth/ForgotPasswordPage.tsx
  modified:
    - src/routes/index.tsx
    - src/pages/auth/LoginPage.tsx

key-decisions:
  - "Success state hides Lembrou a senha footer; Voltar ao login lives in the centered body"
  - "Forgot link sits inside password space-y-2 under Mostrar senha, above Entrar"

patterns-established:
  - "ForgotPasswordPage: requestPasswordReset only; setSent(true) on any SDK success"
  - "Login forgot link: text-xs text-muted hover:text-forest + min-h-11, not a second primary Button"

requirements-completed: [REQ-31]

duration: 1min
completed: 2026-09-29
---

# Phase 20 Plan 02: Pedido de e-mail (ForgotPasswordPage) Summary

**GuestRoute `/esqueci-senha` with AuthLayout anti-enumeration request form plus LoginPage `Esqueci minha senha` link (min-h-11) — AuthConfirmPage and changePassword untouched.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-29T21:07:24Z
- **Completed:** 2026-09-29T21:08:38Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Created `ForgotPasswordPage` with UI-SPEC copy, `forgotPasswordSchema`, and `requestPasswordReset` only
- Identical success body whether the e-mail exists; no profiles probe or existence branching
- Registered `/esqueci-senha` under `GuestRoute`; `/auth/confirm` remains public
- Added LoginPage link under the password block with `min-h-11` hit area

## Task Commits

Each task was committed atomically:

1. **Task 1: ForgotPasswordPage + rota GuestRoute** - `331afed` (feat)
2. **Task 2: Link Esqueci minha senha no LoginPage** - `8547c65` (feat)

**Plan metadata:** `1750b27` (docs: complete plan)

## Files Created/Modified

- `src/pages/auth/ForgotPasswordPage.tsx` — Guest request form + anti-enumeration success
- `src/routes/index.tsx` — `/esqueci-senha` inside GuestRoute; import ForgotPasswordPage
- `src/pages/auth/LoginPage.tsx` — Link to `/esqueci-senha` under password / above Entrar

## Decisions Made

- On `sent`, omit AuthLayout footer so the only return path is **Voltar ao login** in the success body (avoids duplicate Entrar links).
- Place the forgot link inside the password `space-y-2` block (UI-SPEC preference: under Mostrar senha, above Entrar).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. (Redirect URLs remain plan 04 / dashboard ownership.)

## Next Phase Readiness

- Request path ready for plan 03 (`AuthConfirmPage` recovery branch) and plan 04 (SQL/UAT/Redirect URLs)
- Do not change `flowType`, Redirect URLs, or `changePassword` in subsequent SPA work unless those plans own them

## Self-Check: PASSED

- FOUND: `src/pages/auth/ForgotPasswordPage.tsx`
- FOUND: `src/routes/index.tsx` path `/esqueci-senha` under GuestRoute
- FOUND: `src/pages/auth/LoginPage.tsx` link `Esqueci minha senha` → `/esqueci-senha`
- FOUND: commit `331afed`
- FOUND: commit `8547c65`

---
*Phase: 20-esqueci-minha-senha*
*Completed: 2026-09-29*
