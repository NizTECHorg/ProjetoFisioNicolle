---
phase: 18
slug: minha-conta
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-24
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — não introduzir runner nesta fase |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck`
- **Before `/gsd-verify-work`:** `npm run typecheck` verde e o oráculo de senha executado no Auth hospedado
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | REQ-29 | T-18-02, T-18-03 | Bucket privado `account-avatars`; `avatar_url` só aceita path do bucket novo. Legado fora do path aborta com DO/RAISE EXCEPTION, sem UPDATE em massa | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-01-02 | 01 | 1 | REQ-29 | T-18-01 | `authenticated` só atualiza `profiles.full_name` e `profiles.avatar_url` | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-02-01 | 02 | 1 | REQ-29 | T-18-04 | Operador confirma `@supabase/supabase-js@2.117.1` no registry antes do install | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-02-02 | 02 | 1 | REQ-29 | T-18-SC | A troca de senha envia a senha atual na mesma chamada `updateUser`; a sessão do app permanece implícita (não PKCE) | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-03-01 | 03 | 1 | REQ-29 | — | Nome ou senha nova inválidos no zod não chamam o Auth | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-03-02 | 03 | 1 | REQ-29 | T-18-05 | `current_password_invalid` e `current_password_required` viram a cópia `Senha atual incorreta.` | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-04-01 | 04 | 2 | REQ-29 | T-18-06, T-18-07 | `updateOwnName` grava só `full_name`; `changePassword` manda `password` e `current_password` juntos | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-04-02 | 04 | 2 | REQ-29 | T-18-08 | A foto sobe para `account-avatars` e a coluna guarda o path, nunca a signed URL | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-04-03 | 04 | 2 | REQ-29 | — | `reloadProfile` atualiza o rodapé fora de `onAuthStateChange` | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-05-01 | 05 | 3 | REQ-29 | T-18-09 | A página troca foto e nome da conta logada | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-05-02 | 05 | 3 | REQ-29 | T-18-10, T-18-11 | Ícone ao lado de Sair abre `/conta` | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-06-01 | 06 | 4 | REQ-29 | T-18-12, T-18-14 | O card Senha chama `changePassword` com a senha atual | manual-only | `npm run typecheck` | ❌ | ⬜ pending |
| 18-06-02 | 06 | 4 | REQ-29.4 | T-18-12, T-18-13 | password reset verification rule: senha atual errada devolve `current_password_invalid` e a antiga ainda entra; depois do acerto a antiga devolve `invalid_credentials` e a nova cria sessão; `updateUser({ password })` sem `current_password` falha com `current_password_required`; a UI mostra exatamente `Senha atual incorreta.` | manual-only | `npm run typecheck` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Nenhum arquivo de teste novo — não há runner; o gate de senha é o oráculo Auth
- [ ] Checkpoint humano: ligar `security_update_password_require_current_password` e deixar reauthentication desligada
- [ ] Checkpoint humano: colar o SQL da fase no SQL Editor. Não usar `supabase db push`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ícone ao lado de Sair, rótulo acessível Minha conta, abre `/conta` | REQ-29.1 | Sem runner de DOM | Conferir `AppShell` e a rota |
| Página troca foto, nome e senha da conta logada | REQ-29.2 | Sem runner de UI | Salvar na página e recarregar |
| Foto e nome continuam após reload e não alteram outra conta | REQ-29.3 | RLS só fecha no projeto hospedado | Duas contas: a foto de A não aparece em B |
| Resetar a senha confere a senha atual | REQ-29.4 | A prova é credencial no Auth hospedado | Plano 18-06 task 2. Oráculo em 18-RESEARCH.md: senha atual errada devolve `current_password_invalid` e a antiga ainda entra; depois do acerto a antiga devolve `invalid_credentials` e a nova cria sessão. `updateUser({ password })` sem `current_password` tem de falhar com `current_password_required`. A UI mostra exatamente `Senha atual incorreta.` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
