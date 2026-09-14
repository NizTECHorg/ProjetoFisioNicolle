---
phase: 6
slug: silhueta-areas-de-foco
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-14
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Product plans must not wait on a Vitest harness. Automated command this phase: lint + typecheck. SQL RLS and hover/touch UAT stay manual.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — ESLint 9 + `tsc --noEmit`. Vitest is the intended runner (TESTING.md) but is not installed. |
| **Config file** | none — Wave 0 deferred (do not block product plans) |
| **Quick run command** | `npm run lint && npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` plus SQL Editor RLS checklist + browser UAT |
| **Estimated runtime** | ~20 seconds (lint+tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run typecheck`
- **After every plan wave:** Same; SQL Editor smoke if the wave touched `.sql`
- **Before `/gsd-verify-work`:** lint + typecheck green; SQL applied; browser UAT of hover / touch / empresa read-only
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | 1 | REQ-18.1 | — | `BodyFocus` removed; panel renders frente+costas | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 1 | REQ-18.2 | — | Hover delay 500ms; chip not native `title` | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 1 | REQ-18.3 | T-06-01 | Toggle only from chip; INSERT/DELETE | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 1 | REQ-18.5 | T-06-01 | `region_key` unique; RLS write = `can_write_patient` | source + SQL | grep SQL + SQL Editor | ❌ | ⬜ pending |
| TBD | TBD | 2 | REQ-18.6 | T-06-01 | `canWrite` hides chip; no disabled-looking control | source | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| TBD | TBD | 2 | REQ-18.2 / D-05 | — | Hover 500ms then chip; leave group closes | manual | Browser UAT | ❌ no Playwright | ⬜ pending |

*Filled by planner/executor as PLAN.md tasks exist. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck/lint. Vitest install is **deferred** — product plans must not wait on the harness.

- [ ] Optional later: `vitest` + `src/lib/focusRegions.test.ts` (enum keys unique, every key has label+view)
- [ ] Optional later: catalog `z.enum` rejects unknown keys

*If none: "Existing infrastructure covers all phase requirements."* — lint + typecheck cover compile-time; RLS/UAT remain manual.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover 500ms then chip; leave group closes | REQ-18.2 / D-05 | Timing + pointer path | Desktop: enter region, wait ~0.5s, move onto chip, click, leave |
| Path click does not mark | REQ-18.3 / D-06 | Interaction | Click path only; row count unchanged until chip click |
| Touch: tap region opens, tap chip toggles | Discretion / D-06 | No Playwright | Phone or DevTools coarse pointer |
| Empresa colleague ficha: highlights, no chip | REQ-18.6 / D-10 | Two accounts | Open patient created by another user |
| Empty copy **Sem áreas registradas.** | D-07 | Visual | Patient with zero keyed rows |
| Escape closes chip | WCAG 1.4.13 | Keyboard | Focus region, Esc |
| SQL RLS: creator INSERT ok; other authenticated INSERT fail | REQ-18.5 | Do not mock RLS | SQL Editor as two JWTs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
