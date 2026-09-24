---
phase: 17
slug: isolamento-de-dados-por-conta
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-23
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Nenhum. Typecheck do TypeScript + asserções SQL manuais no Editor |
| **Config file** | `tsconfig` via `npm run typecheck`. Sem arquivo de teste. |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck` e o bloco SQL de prova no SQL Editor |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck` e `rg -n "Disfunção cinesiológica" src`
- **Before `/gsd-verify-work`:** Typecheck verde, busca do laudo inventado vazia, e o operador marca o SQL de prova no UAT
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | REQ-28 | T-17-01 | Autônomo B não lê card/coluna de A; insert na coluna de A devolve 42501 | manual SQL | Bloco em `17-account-isolation.sql` com `set local role authenticated` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | REQ-28 | T-17-02 | Autônomo B não lê paciente, sessão ou nota de A | manual SQL | Mesmo bloco: select em `patients`, `patient_sessions`, `patient_session_evolutions` → 0 linhas | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | REQ-28 | T-17-03 | Empresa continua vendo a ficha do fisioterapeuta ativo; outro autônomo não | manual SQL | `set local` do dono da empresa vê o paciente; sub de outro autônomo → 0 | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 2 | REQ-28 | T-17-04 | Conta nova em `/quadro` não mostra a tarefa do outro autônomo | manual UI | Roteiro UAT: login da conta nova | ❌ | ⬜ pending |
| 17-02-02 | 02 | 2 | REQ-28 | T-17-05 | Nenhum texto de exemplo no lugar de registro | search | `rg -n "Disfunção cinesiológica" src` vazio | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` — políticas, backfill comentado e bloco `begin`/`rollback` de prova (REQ-28)
- [ ] Nenhum `tests/` novo — não há Postgres local e não adicionar Vitest só para afirmar strings

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Autônomo B não vê quadro, agenda nem paciente de A | REQ-28 | RLS do Postgres hospedado não roda no `npm run typecheck` | SQL Editor com `set local role authenticated` e `request.jwt.claim.sub`. Telas `/quadro`, `/agenda`, `/pacientes` e URL `/pacientes/<id-de-A>`. |
| Empresa ainda vê a ficha do fisioterapeuta ativo | REQ-28 | Precisa de dois papéis reais (dono e autônomo de fora) | Dono abre a ficha. Autônomo de fora não vê. |
| Aba Avaliações sem chave Gemini não mostra laudo inventado | REQ-28 | Depende da ausência da chave e da UI | Upload de PDF mostra erro, não queixa lombar. Recarregar não restaura `fisio.evaluations.*`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
