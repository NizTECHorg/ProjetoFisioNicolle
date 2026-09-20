---
phase: 12
slug: avaliacoes-musculoesqueleticas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-20
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Product plans must not wait on a Vitest harness. Automated command this phase: lint + typecheck. SQL `ficha` column apply and browser UAT stay manual.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — ESLint 9 + `tsc --noEmit`. Vitest intended (TESTING.md) but not installed. |
| **Config file** | none — Wave 0 deferred (do not block product plans) |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` plus SQL Editor checklist + browser UAT |
| **Estimated runtime** | ~20 seconds (lint+tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck` (or lint+typecheck when UI/lint-sensitive)
- **After every plan wave:** `npm run lint && npm run typecheck`; SQL Editor smoke if the wave touched `.sql`
- **Before `/gsd-verify-work`:** lint + typecheck green; SQL `ficha` applied; browser UAT of partial create → reopen → fill → PDF export → empresa read-only
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | REQ-24.3 | T-12-01 | Zod ficha all-optional leaves; form requires only `performedOn` | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 12-01-02 | 01 | 1 | REQ-24.2 | T-12-02 | Idempotent `ficha jsonb` + preserve RLS | source | twin SQL `diff` + grep `ficha`/`can_write_patient` | ⬜ | ⬜ pending |
| 12-01-03 | 01 | 1 | REQ-24.2 | T-12-02 | SQL Editor apply (not db push) | human | SQL Editor checklist | ❌ | ⬜ pending |
| 12-02-01 | 02 | 2 | REQ-24.2 | T-12-03 | Service maps `ficha`; legacy columns seed empty ficha on read | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 12-02-02 | 02 | 2 | REQ-24.2 | T-12-03 | Hooks/types accept `ficha` upsert | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 12-03-01 | 03 | 3 | REQ-24.1 / 24.4 | T-12-04 | Tab `avaliacoes`; dashboard navigate `nova=1`; detach Resumo IA | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 12-03-02 | 03 | 3 | REQ-24.3 / 24.6 | T-12-04 | Multi-block form FLUXO; `!canWrite` hides writes | lint+tsc | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| 12-04-01 | 04 | 4 | REQ-24.5 | T-12-05 | PDF from saved `ficha` sections; omit empties | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 12-04-02 | 04 | 4 | REQ-24.5 | T-12-05 | Composer selects evaluation for PDF | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 12-04-03 | 04 | 4 | REQ-24 all | T-12-04 | E2E UAT partial/PDF/empresa | human UAT | Browser checklist | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck/lint. Vitest install is **deferred** — product plans must not wait on the harness.

- [ ] Optional later: Vitest unit tests for `evaluationFichaSchema` parse of empty `{}` and legacy→ficha mapper
- [ ] Optional later: RLS JWT matrix as SQL comments only
- [ ] Human checklist (blocking for UAT): SQL Editor apply `12-patient-evaluations-ficha.sql`

*Existing infrastructure covers compile-time gates; SQL apply + UAT remain manual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Column `ficha` exists on `patient_evaluations` | REQ-24.2 | Hosted Editor | Paste `12-patient-evaluations-ficha.sql`; `\d` or select default `'{}'` |
| Partial create with date only | REQ-24.3 | Browser | Nova avaliação → only date → Salvar → row appears |
| Reopen and complete blocks | REQ-24.3 | Browser | Edit → fill page 02 → Salvar → detail shows fields |
| Dashboard → picker → create open | REQ-24.4 | Browser | Painel Nova avaliação → pick → URL has `aba=avaliacoes&nova=1` then form open |
| Resumo IA has no eval CRUD embed | REQ-24.1 | Browser | Aba Resumo IA: composer + lista PDFs only |
| PDF export from selected evaluation | REQ-24.5 | Browser | Resumo IA PDF mode → pick avaliação → PDF has ficha sections |
| Empresa colleague: no write | REQ-24.6 | Two accounts | Consult banner: list visible; no Nova/Salvar/Excluir |
| Legacy `?aba=avaliacao` | REQ-24.1 | Browser | Still opens Resumo IA, not Avaliações |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 / human dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none blocking)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter after execution confirms map

**Approval:** pending
