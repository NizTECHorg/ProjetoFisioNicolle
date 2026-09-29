---
phase: 20-esqueci-minha-senha
plan: 03
subsystem: auth
tags: [supabase-auth, recovery, AuthConfirmPage, setPasswordFromRecovery, react-hook-form]

requires:
  - phase: 20-01
    provides: ConfirmCallbackResult.mode; setPasswordFromRecovery; recoveryPasswordSchema
provides:
  - AuthConfirmPage recovery branch with Nova senha form
  - Signup confirm path preserved (toast + navigate)
affects: [20-04 UAT / Redirect URLs]

tech-stack:
  added: []
  patterns:
    - In-page recovery status on public /auth/confirm (not GuestRoute)
    - setPasswordFromRecovery only — never changePassword / current_password

key-files:
  created: []
  modified:
    - src/pages/auth/AuthConfirmPage.tsx

key-decisions:
  - "Recovery ok sets status recovery without toast or clinic navigate (Pitfall 1 / T-20-02)"
  - "Plan verify assert Senha atual not in file false-positives on Senha atualizada toast — kept UI-SPEC toast; checked label=Senha atual absent"

patterns-established:
  - "AuthConfirmPage: result.mode === recovery → form; signup keeps E-mail confirmado toast + delayed navigate"
  - "Recovery errors use Peça um novo link em Esqueci minha senha; signup errors keep Cadastre-se de novo copy"

requirements-completed: [REQ-31]

duration: 3min
completed: 2026-09-29
---

# Phase 20 Plan 03: AuthConfirm recovery branch Summary

**AuthConfirmPage branches on `result.mode === 'recovery'` to show Nova senha + `setPasswordFromRecovery` (no clinic navigate before password write); signup confirm toast/redirect unchanged.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-29T21:10:26Z
- **Completed:** 2026-09-29T21:13:04Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- Recovery success sets `status === 'recovery'` with AuthLayout **Nova senha** — no **E-mail confirmado** toast and no `navigate('/')` until after password save
- Recovery form uses `recoveryPasswordSchema`, dual fields, **Mostrar senhas**, CTA **Salvar nova senha** → `setPasswordFromRecovery` → toast **Senha atualizada.** → login
- Recovery ignored/consumed errors use **Peça um novo link em Esqueci minha senha.**; signup path copy and toast preserved
- No `changePassword` / `current_password` / **Senha atual** on this page (REQ-31.5 wall stays on AccountPage)

## Task Commits

Each task was committed atomically:

1. **Task 1: Branch recovery vs signup no confirm effect** - `b20d933` (feat)
2. **Task 2: Formulário Nova senha + setPasswordFromRecovery** - `bce8665` (feat)

**Plan metadata:**  (docs: complete plan)

## Files Created/Modified

- `src/pages/auth/AuthConfirmPage.tsx` — recovery vs signup branching; Nova senha form wired to `setPasswordFromRecovery`

## Decisions Made

- Detect recovery early via URL `type=recovery` (search/hash) for working copy **Validando o link…** and recovery-aware error strings; success still keys off `result.mode === 'recovery'`.
- Kept toast **Senha atualizada.** per UI-SPEC despite plan automated substring assert colliding with that string.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan Task 2 verify substring vs UI-SPEC toast**
- **Found during:** Task 2 (Formulário Nova senha)
- **Issue:** Automated `assert 'Senha atual' not in t` fails because **Senha atualizada.** contains that substring, while acceptance also requires the toast.
- **Fix:** Kept UI-SPEC toast; verified absence of `changePassword`, `current_password`, and `label="Senha atual"` instead.
- **Files modified:** none (verify interpretation only)
- **Verification:** `npm run typecheck`; targeted asserts; AccountPage/`auth.service` still own `changePassword` / `current_password`
- **Committed in:** `bce8665` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking verify conflict)
**Impact on plan:** No product-scope change; UI-SPEC and threat mitigations honored.

## Issues Encountered

None beyond the plan verify / UI-SPEC string conflict above.

## User Setup Required

None - no external service configuration required. (Redirect URLs remain plan 04 / Dashboard.)

## Next Phase Readiness

- SPA recovery write path ready for plan 04 (UAT / Redirect URLs / templates)
- Do not change `flowType`, AccountPage `changePassword`, or add Redirect URLs in SPA code

## Self-Check: PASSED

- FOUND: `src/pages/auth/AuthConfirmPage.tsx`
- FOUND: commit `b20d933`
- FOUND: commit `bce8665`
- No stubs that block plan goal (password `placeholder` chars only)

---
*Phase: 20-esqueci-minha-senha*
*Completed: 2026-09-29*
