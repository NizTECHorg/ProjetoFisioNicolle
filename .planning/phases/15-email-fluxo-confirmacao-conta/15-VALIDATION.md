---
phase: 15
slug: email-fluxo-confirmacao-conta
status: draft
nyquist_compliant: false
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
| 15-01-* | 01 | 1 | REQ-27.4 | T-15-01 | No secrets in runbook | doc | file exists under `docs/ops/` | ❌ | ⬜ pending |
| 15-02-* | 02 | 2 | REQ-27.1–3,5 | T-15-02 | SMTP creds Dashboard-only | manual UAT | register → inbox → confirm link | ❌ | ⬜ pending |
| 15-03-* | 03 | 3 | REQ-27 | — | Optional RegisterPage copy only | typecheck | `npm run typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers lint/typecheck. No new test framework.

*Wave 0: none — deliverable is runbook UAT checklist instead of automated stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confirm email shows Fluxo brand/copy | REQ-27.1 | Dashboard template + real SMTP | Register with real inbox; check From + body |
| From is operator address | REQ-27.2 | SMTP Dashboard config | Inspect From header; change SMTP without redeploy |
| Confirm link completes account flow | REQ-27.3 | Live Auth + PKCE | Click link → session → account-type paths |
| Reset password branded | REQ-27.5 | Dashboard template | Trigger reset if enabled; Invite User untouched |

---

## Validation Sign-Off

- [x] Tasks have `<automated>` verify where code exists; Dashboard UAT is explicit manual
- [x] Sampling continuity: typecheck when SPA touched
- [x] Wave 0: no Vitest install required
- [x] No watch-mode flags
- [x] Feedback latency < 60s for typecheck
- [ ] `nyquist_compliant: true` set after plans map tasks (planner/checker)

**Approval:** pending
