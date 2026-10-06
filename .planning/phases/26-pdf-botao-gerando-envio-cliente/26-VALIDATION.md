---
phase: 26
slug: pdf-botao-gerando-envio-cliente
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-06
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict |
| **Config file** | none — do not install a framework |
| **Quick run command** | `node --test src/lib/patientContact.test.ts src/lib/phase26Contract.test.ts` |
| **Full suite command** | `node --test src/lib/patientContact.test.ts src/lib/phase26Contract.test.ts src/lib/mobilidadePalpacao.test.ts && npm run typecheck` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test src/lib/patientContact.test.ts src/lib/phase26Contract.test.ts` once those files exist, and `npm run typecheck` when the task touches callers
- **After every plan wave:** Run `node --test src/lib/patientContact.test.ts src/lib/phase26Contract.test.ts src/lib/mobilidadePalpacao.test.ts && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green, plus the manual UAT of the real email and of `wa.me`
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | REQ-37.1 | — | PDF omits empty fields; `toWinAnsiSafe` unchanged; drawn arrow becomes `->` | unit | `node --test --test-name-pattern "REQ-37.1" src/lib/phase26Contract.test.ts` | ❌ W0 | ⬜ pending |
| 26-02-01 | 02 | 2 | REQ-37.2 | — | `Button` still says Aguarde...; Gerando + star lives only on the AI control | unit | `node --test --test-name-pattern "REQ-37.2" src/lib/phase26Contract.test.ts` | ❌ W0 | ⬜ pending |
| 26-03-01 | 03 | 3 | REQ-37.4 | T-26-recipient | Missing email or phone is refused in Portuguese; destination is not taken from the request body | unit | `node --test src/lib/patientContact.test.ts` | ❌ W0 | ⬜ pending |
| 26-03-02 | 03 | 3 | REQ-37.3 | T-26-link | Email function sends the PDF; WhatsApp is `wa.me` with the saved PDF link | unit | `node --test --test-name-pattern "REQ-37.3" src/lib/phase26Contract.test.ts` | ❌ W0 | ⬜ pending |
| 26-03-03 | 03 | 3 | REQ-37.5 | T-26-write | Send buttons render only when `canWrite`; function checks `created_by` | unit | `node --test --test-name-pattern "REQ-37.5" src/lib/phase26Contract.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/patientContact.test.ts` — REQ-37.4, prefix `55`, rejection of `—`
- [ ] `src/lib/phase26Contract.test.ts` — REQ-37.1, REQ-37.2, REQ-37.3, REQ-37.5, source contract via `readFileSync`
- [ ] Framework install: none

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| O e-mail com o PDF chega na caixa do paciente | REQ-37.3 | SMTP real e aceite do Gmail | Exportar uma avaliação com e-mail no cadastro e conferir a caixa. Se o SMTP recusar, a tela mostra o erro em português. |
| O WhatsApp abre no telefone do paciente com o link do PDF | REQ-37.3 | `wa.me` abre o app do usuário | Exportar, tocar o logo do WhatsApp e ver a conversa com o link. Sem telefone, a tela não diz que enviou. |
| O botão Gerando tem estrela e brilho azul | REQ-37.2 | Animação visual | Gerar o resumo e olhar o botão até a resposta. Salvar e Exportar PDF de avaliação continuam sem esse visual. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
