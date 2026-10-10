---
phase: 27
slug: analitica-financeiro
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-09
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — do not install a framework |
| **Quick run command** | `node --test src/lib/financeAnalytics.test.ts && npm run typecheck` |
| **Full suite command** | `node --test src/lib/*.test.ts && npm run typecheck` |
| **Estimated runtime** | ~40 seconds |

`npm run lint` stays out of the phase gate. It already fails on unused arguments of `adminUpdateProfile` in `src/services/modules.service.ts`. Do not “fix” that file for this phase.

---

## Sampling Rate

- **After every task commit:** Run `node --test src/lib/financeAnalytics.test.ts && npm run typecheck` once the helper exists
- **After every plan wave:** Run `node --test src/lib/*.test.ts && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green, plus the manual check of the two tabs on `/financeiro`
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 27-W0 | — | 0 | REQ-38 | — | Pure aggregator; no write-back | unit | `node --test src/lib/financeAnalytics.test.ts` | ❌ W0 | ⬜ pending |

Behaviors the unit file must cover, with `agora` injected (do not call `new Date()` inside the assertion):

- `2026-04-01T02:30:00.000Z` maps to month key `2026-03` in `America/Sao_Paulo`
- Twelve month keys, oldest to current; a month with no payments stays at zero
- Sums in cents; empty `price_name` becomes `Avulso`; equal names add together
- A prepaid row is included; session status is not an argument of the pure function
- A second click on the same month key returns to the current month
- An empty set produces no bars

---

## Wave 0 Requirements

- [ ] `src/lib/financeAnalytics.ts` — pure aggregation, no `@/`
- [ ] `src/lib/financeAnalytics.test.ts` — REQ-38 behaviors above
- [ ] Framework install: none

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tabs, SVG, hover, focus, and click | REQ-38 | No DOM runner; do not install one | As autônomo, open `/financeiro`. Totais still shows the three cards. Analítica shows the three views. Hover or focus shows R$. Click a month and the other views follow. Click again and it returns to the current month. |
| Empty analytics | REQ-38 | Needs an account with no paid charges | The screen says `Ainda não há pagamentos para analisar.` and draws no fake chart. |
| Other account types | REQ-38 | Session type is not a unit input | Empresa and fisioterapeuta do not see Financeiro and `/financeiro` still redirects to `/pacientes`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
