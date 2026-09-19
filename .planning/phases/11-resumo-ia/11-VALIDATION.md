---
phase: 11
slug: resumo-ia
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-19
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Product plans must not wait on a Vitest harness. Automated command this phase: lint + typecheck. SQL RLS, Edge Function deploy, Gemini, and Resumo IA UAT stay manual.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — ESLint 9 + `tsc --noEmit`. Vitest is the intended runner (TESTING.md) but is not installed. |
| **Config file** | none — Wave 0 deferred (do not block product plans) |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` plus SQL Editor RLS checklist + EF smoke + browser UAT |
| **Estimated runtime** | ~20 seconds (lint+tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck` (or lint+typecheck when UI/lint-sensitive)
- **After every plan wave:** `npm run lint && npm run typecheck`; SQL Editor smoke if the wave touched `.sql`; EF smoke after 11-02 deploy
- **Before `/gsd-verify-work`:** lint + typecheck green; SQL applied; `patient-ai-summary` deployed with `GEMINI_API_KEY`; browser UAT of generate / PDF geral+sessão / empresa read-only
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | REQ-23.3 / 23.5 | T-11-04 | `aiSummary` → `ai_summary`; Zod report XOR; PT mapper | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 11-01-02 | 01 | 1 | REQ-23.5 | T-11-01 / T-11-02 | Private bucket + RLS `can_*` | source | `diff` twin SQL + grep bucket/`can_write_patient` | ⬜ | ⬜ pending |
| 11-01-03 | 01 | 1 | REQ-23.5 | T-11-01 | SQL Editor apply (not db push) | human | SQL Editor checklist | ❌ | ⬜ pending |
| 11-02-01 | 02 | 2 | REQ-23.3 / 23.6 | T-11-05 | EF `GEMINI_API_KEY`; no `VITE_GEMINI` | source | file + grep gates | ⬜ | ⬜ pending |
| 11-02-02 | 02 | 2 | REQ-23.3 | T-11-08 / T-11-09 | invoke + `updatePatient` + additive focus | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 11-02-03 | 02 | 2 | REQ-23.3 / D-06 | T-11-05 | Deploy EF + secret | human | Dashboard deploy checklist | ❌ | ⬜ pending |
| 11-03-01 | 03 | 3 | REQ-23.4 | T-11-SC | pdf-lib legitimacy on npmjs | human | npmjs.com verify | ❌ | ⬜ pending |
| 11-03-02 | 03 | 3 | REQ-23.4 / 23.5 | T-11-10–12 | pdf-lib + Storage upload/rollback | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 11-04-01 | 04 | 4 | REQ-23.1 | — | Tab **Resumo IA** / `aba=resumo-ia` | typecheck | `npm run typecheck` | ⬜ | ⬜ pending |
| 11-04-02 | 04 | 4 | REQ-23.2 / 23.4 / 23.6 | T-11-13 | Composer dual mode; `!canWrite` hides writes | lint+tsc | `npm run lint && npm run typecheck` | ⬜ | ⬜ pending |
| 11-04-03 | 04 | 4 | REQ-23 all | T-11-05 / T-11-13 | E2E generate/export/empresa | human UAT | Browser checklist | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck/lint. Vitest install is **deferred** — product plans must not wait on the harness.

- [ ] Optional later: Vitest + Zod unit tests for `patientAiReportUploadSchema` XOR and invoke body
- [ ] Optional later: RLS JWT matrix as SQL comments only (do not mock RLS in the client)
- [ ] Human checklist (blocking for UAT): SQL Editor apply, EF deploy, `GEMINI_API_KEY` secret, pdf-lib npm verify, rotate away from leaked Vite key for REQ-23 path

*Existing infrastructure covers compile-time gates; Storage/RLS/EF/Gemini/UAT remain manual.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SQL bucket + table + RLS applied | REQ-23.5 | Hosted Editor | Paste `11-patient-ai-reports.sql`; confirm Private bucket |
| EF deploy + `GEMINI_API_KEY` | REQ-23.3 / D-06 | Dashboard secrets | Deploy `patient-ai-summary`; set secret; no JWT → 401 |
| Gerar resumo updates Resumo tab | REQ-23.3 | Gemini + UI | Writer: mode resumo → success → aba Resumo shows text |
| Focus areas additive only | REQ-23.3 | Clinical UX | Prior marks remain if AI returns partial keys |
| PDF geral + sessão in Avaliações salvas | REQ-23.4 | Storage + UI | Export both; Abrir/Baixar; session label visible |
| Delete PDF removes row | REQ-23.4 | ConfirmDialog | Writer Excluir → confirm |
| Empresa colleague: no Gerar/Exportar/Excluir | REQ-23.6 | Two accounts | Consult banner path |
| SPA Network has no Gemini host on generate | D-06 / Pitfall 1 | DevTools | Only EF invoke to Supabase Functions |
| Legacy `?aba=avaliacao` opens Resumo IA | REQ-23.1 | Routing | Old deep link still works |
| Portuguese accents in PDF | Pitfall 9 | Visual | Open PDF with “avaliação” / “evolução” |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 / human-check dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (deferred Vitest documented)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter after execution sampling proven

**Approval:** pending
