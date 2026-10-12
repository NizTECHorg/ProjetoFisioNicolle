---
phase: 20
slug: esqueci-minha-senha
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-29
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript (`tsc --noEmit`). Sem Vitest. |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck`
- **Before `/gsd-verify-work`:** typecheck verde, mais a prova manual do e-mail hospedado
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-T1 | 01 | 1 | REQ-31 | T-20-04 | Schemas + limitsFor auth:recovery | typecheck + grep | `npm run typecheck` | ✅ | ⬜ pending |
| 20-01-T2 | 01 | 1 | REQ-31 | T-20-01 T-20-02 | requestPasswordReset sem probe; setPasswordFromRecovery sem current_password; mode recovery | typecheck + grep | `npm run typecheck` | ✅ | ⬜ pending |
| 20-02-T1 | 02 | 2 | REQ-31 | T-20-01 | /esqueci-senha success idêntico | typecheck + grep | `npm run typecheck` | ❌ → ✅ on exec | ⬜ pending |
| 20-02-T2 | 02 | 2 | REQ-31 | — | Login link Esqueci minha senha | typecheck + grep | `npm run typecheck` | ✅ | ⬜ pending |
| 20-03-T1 | 03 | 2 | REQ-31 | T-20-02 | Branch recovery sem navigate clinic | typecheck + grep | `npm run typecheck` | ✅ | ⬜ pending |
| 20-03-T2 | 03 | 2 | REQ-31 | T-20-07 | setPasswordFromRecovery; changePassword intocado | typecheck + grep | `npm run typecheck` | ✅ | ⬜ pending |
| 20-04-T1 | 04 | 3 | REQ-31 | T-20-01 T-20-02 | Hosted e-mail + old/new password + anti-enum | typecheck + manual | `npm run typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck. Não instalar Vitest. Sem SQL nesta fase. Prova do e-mail e do sign-in é humana no Auth hospedado (plano 04).

- [x] Framework install: none (skip)
- [x] Manual UAT checklist: plano 04 checkpoint
- [x] No MISSING automated refs that require Vitest

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| E-mail Fluxo chega e o link abre `/auth/confirm` | REQ-31 | SMTP e GoTrue só no projeto hospedado | Plano 04 passos 1–3 |
| Senha antiga falha; senha nova entra | REQ-31 | Credencial no Auth hospedado | Plano 04 passo 4 |
| E-mail inexistente não revela ausência | REQ-31 | Anti-enumeração | Plano 04 passo 5 |
| Minha conta ainda pede senha atual | REQ-31.5 | Regressão Phase 18 | Plano 04 passo 6 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Vitest skipped by phase constraint)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planning-complete
