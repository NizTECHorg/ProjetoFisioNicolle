---
phase: 15-email-fluxo-confirmacao-conta
plan: 03
subsystem: auth
tags: [supabase-auth, gotrue, confirmation-url, email-templates, fluxo]

requires:
  - phase: 15-email-fluxo-confirmacao-conta
    provides: emailRedirectTo pinned to https://fluxofisio.vercel.app/auth/confirm and implicit flow (15-02)
provides:
  - Paste-ready Confirm signup and Reset password HTML with a bare ConfirmationURL CTA
  - Operator runbook for production Site URL, three-entry redirect allow-list, Vercel VITE_APP_URL, and REQ-27 UAT
affects:
  - 15-04 Dashboard paste, allow-list apply, and live cadastro UAT

tech-stack:
  added: []
  patterns:
    - Auth email CTA is the bare Go variable ConfirmationURL; GoTrue builds the verify URL
    - Site URL and Redirect URLs are production-only; local allow-list entries are removed

key-files:
  created: []
  modified:
    - .planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html
    - .planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html
    - docs/ops/auth-email-smtp.md

key-decisions:
  - "Confirm and reset CTAs are a bare ConfirmationURL, including a visible fallback line, so GoTrue verifies before any redirect"
  - "Site URL is https://fluxofisio.vercel.app and the allow-list is only that origin, the wildcard, and /auth/confirm"
  - "Links mailed before this fix stay invalid; the operator must run a new cadastro"

patterns-established:
  - "Never build an Auth email href from Site URL or a client-side token"
  - "Do not document a localhost URL as a copy-pasteable Redirect URLs value"

requirements-completed: []

duration: 3min
completed: 2026-09-23
---

# Phase 15 Plan 03: ConfirmationURL templates and runbook Summary

**Confirm signup and Reset password CTAs are a bare `{{ .ConfirmationURL }}` so GoTrue verifies the account before redirecting to `https://fluxofisio.vercel.app/auth/confirm`, and the runbook keeps Site URL, the allow-list, and `VITE_APP_URL` on that production origin.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-23T22:57:28Z
- **Completed:** 2026-09-23T23:00:20Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Both Fluxo templates use `href="{{ .ConfirmationURL }}"` plus a visible fallback of the same variable. The old Site URL + token link is gone.
- The runbook states Site URL `https://fluxofisio.vercel.app` and the allow-list `https://fluxofisio.vercel.app`, `https://fluxofisio.vercel.app/**`, and `https://fluxofisio.vercel.app/auth/confirm`, and tells the operator to remove local entries.
- A Vercel section says to delete `VITE_APP_URL` unless it is exactly that origin, then redeploy. Section 7 records both production bugs, dead pre-fix links, and mail-scanner consumption. Section 8 is the markable REQ-27 UAT table.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite both Fluxo e-mail templates to a bare ConfirmationURL CTA** - `1758744` (fix)
2. **Task 2: Correct the operator runbook for origin, templates, Vercel and UAT** - `94927d0` (docs)

**Plan metadata:** docs(15-03) close-out commit

## Files Created/Modified

- `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html` - Confirm signup HTML; bare ConfirmationURL button and fallback
- `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html` - Reset password HTML; same CTA rule, recovery copy kept
- `docs/ops/auth-email-smtp.md` - Production Site URL, allow-list, Vercel variable, pitfalls, and REQ-27 UAT

## Decisions Made

- The CTA is exactly `{{ .ConfirmationURL }}` with no path or query appended, because GoTrue confirms on `/auth/v1/verify` before the redirect.
- The allow-list is the three production entries only. An unlisted origin falls back to the Site URL, so local entries are removed rather than documented as values to paste.
- Messages sent before this fix stay invalid. UAT starts with a new cadastro.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required in this plan. Dashboard paste, the allow-list, and the Vercel check are plan 15-04.

## Next Phase Readiness

Ready for 15-04 (paste the templates, apply Site URL and the three redirect entries, redeploy if `VITE_APP_URL` is stale, then a new cadastro). REQ-27 stays unchecked until that live signup passes the section 8 table.

## Known Stubs

None. Runbook placeholders (`<APP_PASSWORD>`, `<OPERATOR_EMAIL>`, `<BREVO_SMTP_KEY>`, `<BREVO_SMTP_LOGIN>`) are intentional secret stand-ins.

## Self-Check: PASSED

- FOUND: `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html`
- FOUND: `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html`
- FOUND: `docs/ops/auth-email-smtp.md`
- FOUND: commit `1758744`
- FOUND: commit `94927d0`
- Template grep gate: TEMPLATES_OK
- Runbook grep gate: RUNBOOK_OK

## TDD Gate Compliance

Not a TDD plan.

---
*Phase: 15-email-fluxo-confirmacao-conta*
*Completed: 2026-09-23*
