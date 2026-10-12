---
phase: 28
slug: excluir-paciente-por-completo
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| **Quick run command** | `node --test src/lib/patientDeleteConfirm.test.ts src/lib/phase28Sql.contract.test.ts src/lib/phase28Service.contract.test.ts src/lib/phase28Ui.contract.test.ts && npm run typecheck` |
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

| Task | Req | Behavior | Automated Command | Status |
|------|-----|----------|-------------------|--------|
| 28-01-T1 | REQ-39.3/5 | Tombstone e `delete_patient_full` (security definer, search_path vazio, can_write_patient, patients por último) | `node --test src/lib/phase28Sql.contract.test.ts` | ✅ |
| 28-01-T2 | REQ-39.4/5 | Policies de limpeza de storage, finalização e pendências | `node --test src/lib/phase28Sql.contract.test.ts` | ✅ |
| 28-02-T1 | REQ-39.2 | `isDeleteNameMatch` (trim, caixa, vazio, parcial, acentos) e caminhos | `node --test src/lib/patientDeleteConfirm.test.ts` | ✅ |
| 28-02-T2 | REQ-39.4 | Service lista 3 buckets, RPC antes do remove, finish | `node --test src/lib/phase28Service.contract.test.ts` | ✅ |
| 28-02-T3 | REQ-39.6 | Hook invalida caches, navega para `/pacientes`, copy fixa | `node --test src/lib/phase28Service.contract.test.ts` | ✅ |
| 28-03-T1 | REQ-39.2 | Diálogo: título, `Voltar sem excluir`, botão desabilitado sem match, não fecha em pending | `node --test src/lib/phase28Ui.contract.test.ts` | ✅ |
| 28-03-T2 | REQ-39.1 | Ação `Excluir paciente` só com `canWrite` (hoje no bloco Área sensível da aba Resumo), ausente na lista | `node --test src/lib/phase28Ui.contract.test.ts` | ✅ |
| 28-04-T1 | REQ-39.3 | Descoberta de FKs no banco vivo | manual (28-DB-DISCOVERY.md) | ✅ |
| 28-04-T2 | REQ-39.3 | Reconciliação da função com a saída real | `node --test src/lib/phase28Sql.contract.test.ts` | ✅ |
| 28-04-T3 | REQ-39.5 | SQL aplicado e grants conferidos | manual (28-04-SUMMARY.md) | ✅ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/patientDeleteConfirm.ts` + `src/lib/patientDeleteConfirm.test.ts`
- [x] Contrato dividido em `phase28Sql.contract.test.ts`, `phase28Service.contract.test.ts` e `phase28Ui.contract.test.ts` (um por plano, cada wave fica verde sozinha) em vez do único `phase28Contract.test.ts`

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
