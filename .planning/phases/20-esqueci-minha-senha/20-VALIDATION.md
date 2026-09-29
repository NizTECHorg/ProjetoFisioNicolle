---
phase: 20
slug: esqueci-minha-senha
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 20-req-31.1 | TBD | TBD | REQ-31 | — | Login tem caminho Esqueci minha senha | typecheck + grep | `npm run typecheck` | ❌ | ⬜ pending |
| 20-req-31.2 | TBD | TBD | REQ-31 | T-20-enum | Sucesso idêntico se o e-mail existe ou não; sem probe de cadastro | typecheck + grep | `npm run typecheck` | ❌ | ⬜ pending |
| 20-req-31.3 | TBD | TBD | REQ-31 | — | Link do e-mail abre o app e grava senha nova | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 20-req-31.4 | TBD | TBD | REQ-31 | — | Senha antiga deixa de entrar; a nova entra | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 20-req-31.5 | TBD | TBD | REQ-31 | — | `changePassword` em `/conta` continua com `current_password` | typecheck + grep | `npm run typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers typecheck. Não instalar Vitest. Sem SQL nesta fase. Prova do e-mail e do sign-in é humana no Auth hospedado.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| E-mail Fluxo chega e o link abre `/auth/confirm` | REQ-31 | SMTP e GoTrue só no projeto hospedado | Pedir reset com e-mail real; abrir o link no celular ou em outro browser |
| Senha antiga falha; senha nova entra | REQ-31 | Credencial no Auth hospedado | Depois de gravar a nova, tentar a antiga (invalid_credentials) e a nova (sessão) |
| E-mail inexistente não revela ausência | REQ-31 | Anti-enumeração | Pedir reset com e-mail inventado; a tela mostra a mesma mensagem de sucesso |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
