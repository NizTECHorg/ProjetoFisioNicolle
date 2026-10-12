---
phase: 31
slug: excluir-a-pr-pria-conta
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-12
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test + node:assert/strict (TypeScript por type-stripping, Node v26.4.0) |
| **Config file** | none |
| **Quick run command** | `node --test src/lib/accountDeletion.test.ts src/lib/phase31Sql.contract.test.ts src/lib/phase31Edge.contract.test.ts src/lib/phase31Service.contract.test.ts src/lib/phase31Ui.contract.test.ts && npm run typecheck` |
| **Full suite command** | `node --test src/lib/*.test.ts && npm run typecheck && npm run build` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green (except the two pre-existing Phase 26 failures caused by the missing `functions/send-patient-document/index.ts`)
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01-01 | 01 | 1 | REQ-42 | T-31-01..06 | Contrato do SQL (RED) | contrato SQL | `node --test src/lib/phase31Sql.contract.test.ts` (deve falhar) | ❌ W0 | ⬜ pending |
| 31-01-02 | 01 | 1 | REQ-42 | T-31-01..06 | Só service_role executa; sem auth.uid(); tombstone antes de patients; FKs no action zeradas; gatilhos do quadro desligados na transferência | contrato SQL | `node --test src/lib/phase31Sql.contract.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 31-02-01 | 02 | 1 | REQ-42 | T-31-07..13 | Contrato da Edge Function (RED) | contrato de fonte | `node --test src/lib/phase31Edge.contract.test.ts` (deve falhar) | ❌ W0 | ⬜ pending |
| 31-02-02 | 02 | 1 | REQ-42 | T-31-07..13 | Id só do JWT; EXCLUIR + senha no servidor; rpc → storage → deleteUser; codes fixos | contrato de fonte | `node --test src/lib/phase31Edge.contract.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 31-03-01 | 03 | 1 | REQ-42 | T-31-14 | EXCLUIR exato + senha; copy por tipo; erros fixos | unit | `node --test src/lib/accountDeletion.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 31-03-02 | 03 | 1 | REQ-42 | T-31-07, T-31-09, T-31-12, T-31-13 | Sem id no corpo; sem SERVICE_ROLE em src/; signOut local; sem toast no service | contrato de fonte | `node --test src/lib/phase31Service.contract.test.ts src/lib/accountDeletion.test.ts && npm run typecheck` | ❌ W0 | ⬜ pending |
| 31-04-01 | 04 | 2 | REQ-42 | T-31-12, T-31-14 | Diálogo não fecha em pending; erros com copy fixa | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 31-04-02 | 04 | 2 | REQ-42 | T-31-15 | Área sensível; signOut → clear → navigate('/') → toast | contrato UI | `node --test src/lib/phase31Ui.contract.test.ts src/lib/phase31Service.contract.test.ts src/lib/accountDeletion.test.ts && npm run typecheck && npm run build` | ❌ W0 | ⬜ pending |
| 31-05-01 | 05 | 3 | REQ-42 | T-31-01 | Privilégios das funções no banco vivo | manual | Checagens do Bloco 4 no SQL Editor | — | ⬜ pending |
| 31-05-02 | 05 | 3 | REQ-42 | T-31-16 | Função publicada com verify_jwt | manual | Dashboard | — | ⬜ pending |
| 31-05-03 | 05 | 3 | REQ-42 | T-31-07, T-31-10, T-31-17 | Fluxo real por tipo de conta, IDOR, RPC direta | manual | Checklist 1-6 do plano 31-05 | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/accountDeletion.ts` + `src/lib/accountDeletion.test.ts` (31-03 Task 1)
- [ ] `src/lib/phase31Sql.contract.test.ts` (31-01 Task 1, RED antes do SQL)
- [ ] `src/lib/phase31Edge.contract.test.ts` (31-02 Task 1, RED antes da função)
- [ ] `src/lib/phase31Service.contract.test.ts` (31-03 Task 2)
- [ ] `src/lib/phase31Ui.contract.test.ts` (31-04 Task 2)
- [x] Saída da descoberta 31-00 colada em `31-DB-DISCOVERY.md` (feito em 2026-10-12)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SQL aplicado com privilégios corretos | REQ-42 | SQL só pelo SQL Editor (regra do projeto) | 31-05 Task 1 |
| Edge Function publicada | REQ-42 | Sem supabase CLI/deno; deploy pelo Dashboard | 31-05 Task 2 |
| Exclusão real de autônomo, empresa e fisio ativo; senha errada; IDOR; RPC direta | REQ-42 | Precisa de Auth, Storage e banco vivos com contas descartáveis | 31-05 Task 3, cenários 1-6 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
