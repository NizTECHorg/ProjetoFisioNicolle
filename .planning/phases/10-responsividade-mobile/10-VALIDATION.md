---
phase: 10
slug: responsividade-mobile
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-19
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> No Vitest/Playwright this phase (RESEARCH A3). Automated command: lint + typecheck. REQ-22 layout acceptance is manual UAT at 360/390/430 + lg.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — ESLint 9 + `tsc --noEmit`. Do not install Vitest/Playwright for this phase. |
| **Config file** | none — Wave 0 = `10-UI-CHECKLIST.md` (manual matrix), not a test harness |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck && npm run lint` plus human UAT checklist |
| **Estimated runtime** | ~20–40 seconds (lint+tsc); UAT human |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck` (prefer `npm run typecheck && npm run lint` when touching many class strings)
- **After every plan wave:** `npm run typecheck && npm run lint`
- **Before `/gsd-verify-work`:** Full static green + `10-UI-CHECKLIST.md` signed (plan 04 approved)
- **Max feedback latency:** 40 seconds for automated; UAT separate

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | REQ-22.4 / D-04 | T-10-01 / T-10-02 | Modal z-100; backdrop aria-label Fechar; viewport-fit | static | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | REQ-22 / D-03 / D-06 | T-10-03 | No bakery routes; nav IA unchanged | static + grep | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 2 | REQ-22.3 / D-03 | T-10-05 | Contained Kanban pan only | static | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-02-02 | 02 | 2 | REQ-22.3 | T-10-04 | Keep Team/Finance account gates | static + grep md:hidden | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 3 | REQ-22.2 | T-10-07 | Silhueta layout only; no API change | static | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-03-02 | 03 | 3 | REQ-22.2 | T-10-06 | canWrite hide-write preserved when fixing opacity | static + grep opacity | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-04-01 | 04 | 4 | REQ-22 | — | Checklist ready; static green | static | `npm run typecheck && npm run lint` | ✅ | ⬜ pending |
| 10-04-02 | 04 | 4 | REQ-22.1–22.5 | T-10-01 / T-10-03 | Human UAT; no bakery | manual | — (checkpoint) | ✅ checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing lint + typecheck cover compile-time. Visual regression harness is **not** required (A3).

- [x] Manual UAT artifact: `.planning/phases/10-responsividade-mobile/10-UI-CHECKLIST.md` — created in plan 10-01 Task 2
- [ ] Optional later: Playwright smoke — **deferred** unless user requests
- [ ] Framework install: **do not** add for this phase

*Existing infrastructure covers static checks; layout acceptance remains manual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No obligatory page pan at ~360/390/430 | REQ-22.1 / D-03 | Layout visual | Device mode; compare scrollWidth vs innerWidth on clinical routes |
| Ficha tabs / silhueta / gallery / evolução usable | REQ-22.2 | Interaction | Open patient ficha; walk tabs; mark region; open lightbox; open evolução modal |
| Agenda, Painel, lists, Equipe, Financeiro coherent | REQ-22.3 | Visual | Walk each route at 360 then 430 |
| Modal / Confirm / Toast clear bottom nav + safe-area | REQ-22.4 / D-04 | Device chrome | Open modal+confirm; trigger toast; prefer real iPhone for env() |
| Desktop lg sidebar + panel intact | REQ-22.5 / D-05 | Regression | Width ≥1024; sidebar + rounded panel + multi-col |
| Kanban horizontal board is contained | D-03 / A2 | Affordance | Quadro: pan board only, not page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 / checkpoint coverage
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 checklist artifact created in 10-01
- [ ] No watch-mode flags
- [ ] Feedback latency &lt; 40s for automated
- [ ] `nyquist_compliant: true` set after plan 04 approval + static green

**Approval:** pending
