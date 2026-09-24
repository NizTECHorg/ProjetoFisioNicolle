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
| 17-01-02 | 01 | 1 | REQ-28 | T-17-02 | Autônomo B não lê paciente, sessão ou nota de A; empresa ainda lê a ficha do fisioterapeuta ativo | manual SQL | Mesmo bloco: select em `patients`, `patient_sessions`, `patient_session_evolutions` → 0 linhas para outro autônomo | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | REQ-28 | T-17-07 | Sem chave, o serviço não devolve o laudo inventado | search | `rg -n "Disfunção cinesiológica" src` vazio | ✅ | ⬜ pending |
| 17-02-02 | 02 | 1 | REQ-28 | T-17-07 | localStorage da simulação não reidrata; o painel mostra err.message | search | `rg -n "Disfunção cinesiológica" src` vazio e `npm run typecheck` | ✅ | ⬜ pending |
| 17-03-01 | 03 | 2 | REQ-28 | T-17-03 | createColumn e createCard enviam owner_id e não filtram a lista no JS | typecheck | `npm run typecheck` e ausência de `.eq('owner_id')` em `board.service.ts` | ✅ | ⬜ pending |
| 17-03-02 | 03 | 2 | REQ-28 | T-17-05 | Conta nova em `/quadro` não mostra a tarefa do outro autônomo; vazio sem seed | search | `rg -n "board.sql" src/pages/KanbanPage.tsx` vazio | ✅ | ⬜ pending |

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
