---
phase: 15
slug: email-fluxo-confirmacao-conta
status: recorded
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-21
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (lint + typecheck only) |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` |
| **Estimated runtime** | ~40 seconds |

Do **not** install Vitest/Playwright for this phase — SMTP/templates are Dashboard state; UAT is manual.

---

## Sampling Rate

- **After every task commit:** `npm run typecheck` if SPA touched; otherwise doc-only (no code gate)
- **After every plan wave:** `npm run lint && npm run typecheck`
- **Before `/gsd-verify-work`:** Manual UAT checklist in runbook green
- **Max feedback latency:** ~40 seconds (typecheck)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-02-01 | 02 | 1 | REQ-27 | T-15-41 | Production origin only | grep + typecheck | `grep PRODUCTION_APP_URL` + `npm run typecheck` | ✅ | ✅ green |
| 15-02-02 | 02 | 1 | REQ-27 | T-15-44 | Implicit confirm, no PKCE verifier | lint + typecheck | `grep flowType: 'implicit'` + `npm run lint && npm run typecheck` | ✅ | ✅ green |
| 15-03-01 | 03 | 1 | REQ-27 | T-15-40 | Bare ConfirmationURL CTA | grep | template gate `TEMPLATES_OK` | ✅ | ✅ green |
| 15-03-02 | 03 | 1 | REQ-27 | T-15-43 | Runbook without secrets or SiteURL CTA | grep | runbook gate `RUNBOOK_OK` | ✅ | ✅ green |
| 15-04-01 | 04 | 2 | REQ-27 | T-15-41 | Deploy gate, no source edits | lint + build | `npm run lint && npm run build` | ✅ | ✅ green |
| 15-04-02 | 04 | 2 | REQ-27 | T-15-40 | Live cadastro human gate | manual | runbook section 8 | ✅ | ✅ green |
| 15-04-03 | 04 | 2 | REQ-27 | T-15-43 | UAT recorded from the operator reply | lint + typecheck | `npm run lint && npm run typecheck` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers lint/typecheck. No new test framework.

*Wave 0: none — deliverable is runbook UAT checklist instead of automated stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confirm link host, landing URL, second device, timestamp, password sign-in, From, Invite User | REQ-27.1–27.6 | Live Dashboard + inbox | `docs/ops/auth-email-smtp.md` section 8 |
| No SMTP secret in git | REQ-27.7 | Operator checks the working tree | Placeholders only, including `<APP_PASSWORD>` |

---

## Validation Sign-Off

- [x] Tasks have `<automated>` verify where code exists; Dashboard UAT is explicit manual
- [x] Sampling continuity: typecheck when SPA touched
- [x] Wave 0: no Vitest install required
- [x] No watch-mode flags
- [x] Feedback latency < 60s for typecheck
- [x] `nyquist_compliant: true` set after plans 02–04 mapped automated commands and the UAT rows were marked from the operator reply

**Approval:** operator replied `approved` on 2026-09-23 without a confirmation timestamp, click device, or a separate sign-in sentence
