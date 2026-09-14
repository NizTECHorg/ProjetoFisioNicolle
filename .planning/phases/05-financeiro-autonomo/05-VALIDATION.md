---
phase: 5
slug: financeiro-autonomo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Product plans must not wait on a Vitest harness. Automated command this phase: lint + typecheck. SQL RLS and overlay UAT stay manual.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — ESLint 9 + `tsc --noEmit`. Vitest is the intended runner (TESTING.md) but is not installed. |
| **Config file** | none — Wave 0 deferred (do not block product plans) |
| **Quick run command** | `npm run lint && npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` plus SQL Editor allow/deny checklist |
| **Estimated runtime** | ~20 seconds (lint+tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run typecheck`
- **After every plan wave:** Same; SQL Editor smoke if the wave touched `.sql`
- **Before `/gsd-verify-work`:** lint + typecheck green; SQL checklist; browser UAT
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | REQ-17 | T-05-01 | Empresa/fisio cannot SELECT finance tables | manual | SQL Editor matrix | ❌ | ⬜ pending |
| TBD | TBD | TBD | REQ-17 D-05 | T-05-05 | Catalog XOR avulso | source | `npm run typecheck` + schema | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | REQ-17 D-01 | T-05-01 | `canSeeFinance` only autonomo | source | `npm run typecheck` | ❌ W0 | ⬜ pending |

*Filled by planner/executor as PLAN.md tasks exist. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck/lint. Vitest install is **deferred** — product plans must not wait on the harness.

- [ ] Optional later: `vitest` + `src/lib/accountAccess.test.ts` (`canSeeFinance`)
- [ ] Optional later: `src/config/navigation.test.ts` (Financeiro drawer-only; mobileNavItems length 4)
- [ ] Optional later: XOR schema tests

*If none: "Existing infrastructure covers all phase requirements."* — lint + typecheck cover compile-time; RLS/UAT remain manual.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-autônomo hitting `/financeiro` redirects to `/pacientes` | REQ-17.1 | No Playwright | Sign in as empresa and fisio; open `/financeiro` |
| Totals month/year/always from paid snapshots (incl. prepaid agendada) | REQ-17.4 / D-08 | Needs live DB | SQL Editor: insert paid agendada this Brazil month; assert totals RPC |
| Empresa/fisio cannot read/write finance tables; `patient_sessions` has no money columns | REQ-17.5 | Do not mock RLS | SQL Editor JWT matrix from RESEARCH.md Security Domain |
| Empty catalog: avulso still shown; empty realizadas list has no fake rows | D-10 / LGPD | Visual | Browser as autonomo with empty catalog and empty paid list |
| Session form hides price/pago for empresa | D-01 | Visual | Open Nova sessão as empresa |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (`npm run typecheck` / lint) or documented manual
- [ ] Sampling continuity: no 3 consecutive tasks without lint/typecheck
- [ ] Wave 0 Vitest deferred on purpose (no harness)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: false` until Vitest exists — typecheck is the automated floor

**Approval:** pending
