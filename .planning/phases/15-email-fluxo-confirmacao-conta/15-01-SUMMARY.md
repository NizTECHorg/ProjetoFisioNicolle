---
phase: 15-email-fluxo-confirmacao-conta
plan: 01
subsystem: auth
tags: [supabase-auth, smtp, email-templates, ops-runbook, fluxo-brand]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: Confirm-email signup flow + emailRedirectTo / PKCE session completion
provides:
  - Operator runbook for Custom SMTP + Auth Email Templates (REQ-27.4 / D-06)
  - Paste-ready Confirm signup HTML with {{ .ConfirmationURL }}
  - Paste-ready Reset password HTML (same brand, recovery copy)
affects:
  - 15-02 Dashboard SMTP/template human apply
  - 15-03 optional RegisterPage copy / verify

tech-stack:
  added: []
  patterns:
    - docs/ops runbook with Dashboard numbered steps + placeholder secrets
    - Inline-styled transactional Auth HTML (Arial/Helvetica, Fluxo forest/ink/muted)

key-files:
  created:
    - docs/ops/auth-email-smtp.md
    - .planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html
    - .planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html
  modified: []

key-decisions:
  - "Runbook lives under docs/ops/ (not only .planning) for operators outside GSD folders"
  - "Default interim SMTP = Gmail App Password; Brevo fallback; Resend deferred"
  - "Invite User template explicitly out of scope (D-05)"

patterns-established:
  - "Auth e-mail ops: placeholders only in git; real SMTP pass only in Dashboard"
  - "Auth HTML: bare href={{ .ConfirmationURL }}; web-safe fonts; single CTA"

requirements-completed: [REQ-27]

duration: 2min
completed: 2026-09-21
---

# Phase 15 Plan 01: Auth e-mail SMTP runbook + Fluxo templates Summary

**Repo-side REQ-27 deliverables: secrets-free Custom SMTP runbook under `docs/ops/` plus paste-ready Confirm signup and Reset password HTML using exact `{{ .ConfirmationURL }}`.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-21T23:26:30Z
- **Completed:** 2026-09-21T23:28:00Z
- **Tasks:** 2/2
- **Files modified:** 3 created

## Accomplishments

- Operator runbook covers preflight (confirm email ON), Custom SMTP (Gmail + Brevo), templates paste paths, Site URL / Redirect URLs, rate limits, secrets boundary, pitfalls, and markable UAT for REQ-27.1–27.5
- Confirm signup HTML: Fluxo brand (forest #0b1d36 / ink #102038 / muted #5a6b80), PT-BR copy, single CTA to `{{ .ConfirmationURL }}`
- Reset password HTML mirrors confirm shell with recovery-oriented copy; Invite User left untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Write docs/ops auth-email SMTP runbook** - `2ecd428` (docs)
2. **Task 2: Write paste-ready Confirm and Reset HTML templates** - `45e6e1f` (docs)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified

- `docs/ops/auth-email-smtp.md` — D-06 operator runbook (SMTP, templates, redirects, UAT)
- `.planning/phases/15-email-fluxo-confirmacao-conta/templates/confirm-signup.html` — Dashboard Confirm sign up body
- `.planning/phases/15-email-fluxo-confirmacao-conta/templates/reset-password.html` — Dashboard Reset password body

## Decisions Made

- Prefer `docs/ops/` for the runbook so operators need not dig into phase planning folders
- Gmail App Password as default interim SMTP; Brevo as fallback; Resend deferred until domain ownership
- Subjects documented as `Confirme sua conta na Fluxo` / `Redefina sua senha na Fluxo`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

Dashboard Custom SMTP enable + template paste are **not** done in this plan — human gate in **15-02**. Operators follow `docs/ops/auth-email-smtp.md` (no secrets in repo).

## Known Stubs

None — runbook and HTML are complete paste-ready artifacts; live SMTP/UAT happens in 15-02.

## Threat Flags

None beyond plan threat model (T-15-01…T-15-04). No new network endpoints or schema changes.

## Self-Check: PASSED

- FOUND: `docs/ops/auth-email-smtp.md`
- FOUND: `templates/confirm-signup.html`
- FOUND: `templates/reset-password.html`
- FOUND: commit `2ecd428`
- FOUND: commit `45e6e1f`
