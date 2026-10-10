---
phase: 28
slug: excluir-paciente-por-completo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-10
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict (TypeScript por type-stripping) |
| **Config file** | none |
| **Quick run command** | `node --test src/lib/patientDeleteConfirm.test.ts src/lib/phase28Contract.test.ts && npm run typecheck` |
| **Full suite command** | `node --test src/lib/*.test.ts && npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green (except the two pre-existing Phase 26 failures caused by a missing `functions/send-patient-document/index.ts`)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

Filled by the planner per task. Required coverage:

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| REQ-39.2 | `isDeleteNameMatch`: trim, caixa, vazio, parcial, acentos | unit | `node --test src/lib/patientDeleteConfirm.test.ts` | ❌ W0 |
| REQ-39.1 | Ação `Excluir paciente` só com `canWrite`, `text-error`, ausente na lista | contract | `node --test src/lib/phase28Contract.test.ts` | ❌ W0 |
| REQ-39.2 | Diálogo: `Excluir paciente?`, `Voltar sem excluir`, botão desabilitado sem match, não fecha durante pending | contract | idem | ❌ W0 |
| REQ-39.3/5 | `.sql`: todas as tabelas ligadas, `security definer`, `search_path = ''`, `can_write_patient`, revoke/grant, `patients` por último | contract | idem | ❌ W0 |
| REQ-39.4 | Service lista os 3 buckets, chama `delete_patient_full` antes do `remove` | contract | idem | ❌ W0 |
| REQ-39.6 | Hook invalida caches e navega para `/pacientes`; copy exata | contract | idem | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/patientDeleteConfirm.ts` + `src/lib/patientDeleteConfirm.test.ts`
- [ ] `src/lib/phase28Contract.test.ts` (lê fontes e o `.sql` da fase)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FKs reais do banco | REQ-39.3 | Banco vivo; 5 tabelas sem DDL no repo | Rodar a query de descoberta (passo 0 do RESEARCH) no SQL Editor |
| Função aplicada e restrita | REQ-39.5 | SQL só via SQL Editor | Aplicar o `.sql`; `anon` não executa `delete_patient_full` |
| Zero linhas e zero arquivos | REQ-39.3/4 | Exige Supabase real | Paciente de teste com todos os tipos de dado; excluir pela UI; `count(*)` = 0 e pastas vazias nos 3 buckets |
| IDOR | REQ-39.5 | Exige 2 contas | Outra conta chama a RPC: 42501, nada muda |
| Rollback | REQ-39.5 | Exige forçar falha | Falha no meio → nada apagado |
| Telas sem o paciente | REQ-39.6 | Visual | Lista, dashboard, agenda, quadro e financeiro |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
