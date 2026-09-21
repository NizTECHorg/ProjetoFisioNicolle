---
phase: 13
slug: pdf-export-avaliacao-evolucao
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-20
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none (no Vitest/Jest) |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck && npm run lint` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green + SQL applied + EF redeployed
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | REQ-25 / D-06 | T-13-01 | kind CHECK + XOR session_id | SQL matrix | manual SQL Editor | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | REQ-25.5 | T-13-01 | Zod kinds avaliacao/evolucao; list badges | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-01-03 | 01 | 1 | REQ-25 | T-13-01 | Human applies SQL in Editor | blocking | — | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | REQ-25.2 | — | Ficha catalog ~27 filled blocks; EVA 0 kept | typecheck | `npm run typecheck` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | REQ-25.4 | — | Evolução SOAP + evo.ai.* catalog | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-03-01 | 03 | 2 | REQ-25.3/6 | — | Selective ficha PDF + block chrome | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-03-02 | 03 | 2 | REQ-25.4/6 | — | drawEvolucao filters selectedFieldIds | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-04-01 | 04 | 3 | REQ-25.2 | T-13-02 | Modal picker all-on; Desmarcar sensíveis | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-04-02 | 04 | 3 | REQ-25.1/3/5 | T-13-02 | Scopes Avaliação\|Evolução; Avaliação export; !canWrite hide | typecheck + UAT | `npm run typecheck` | ❌ | ⬜ pending |
| 13-05-01 | 05 | 4 | REQ-25.4/6 | T-13-03 | EF mode evolucao; no invent; no ai_summary write | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-05-02 | 05 | 4 | REQ-25.4 | T-13-03 | Composer Evolução: EF→picker→PDF kind evolucao | typecheck | `npm run typecheck` | ❌ | ⬜ pending |
| 13-05-03 | 05 | 4 | REQ-25.4 | T-13-03 | Human redeploys patient-ai-summary | blocking | — | — | ⬜ pending |
| 13-06-01 | 06 | 5 | REQ-25.1–25.6 | — | Full UAT checklist | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `supabase/13-patient-ai-reports-kinds.sql` — CHECK + policy for `avaliacao`/`evolucao`
- [ ] `src/lib/pdfFieldCatalog.ts` — pure catalog (typecheck as proxy)
- [ ] UAT checklist in 13-06-PLAN.md

*Existing infrastructure (typecheck/lint) covers compile safety. No Vitest install this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scopes Avaliação \| Evolução | REQ-25.1 | UI | Resumo IA → Exportar PDF → 2 seções |
| Field-picker defaults all on | REQ-25.2 | UI | Modal com todos checked |
| PDF omits unselected | REQ-25.3/6 | PDF visual | Desmarcar bloco → exportar |
| Multi-session IA | REQ-25.4 | EF + PDF | ≥2 sessões → síntese agregada |
| Consulta-only | REQ-25.5 | Role | Empresa colega → sem CTA export |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 / manual UAT
- [ ] Sampling continuity: typecheck after each auto task
- [ ] Wave 0 covers SQL kinds
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` after Wave 0 SQL + typecheck green

**Approval:** pending
