---
phase: 28-excluir-paciente-por-completo
plan: 01
subsystem: database
tags: [supabase, sql, rls, storage, security-definer]
requires: []
provides:
  - public.delete_patient_full(uuid)
  - public.finish_patient_deletion(uuid)
  - public.list_pending_patient_file_cleanups()
  - private.patient_deletion_tombstones + 6 storage cleanup policies
affects: [28-02, 28-04, 28-05]
key-files:
  created:
    - .planning/phases/28-excluir-paciente-por-completo/sql/28-00-discovery.sql
    - .planning/phases/28-excluir-paciente-por-completo/sql/28-delete-patient.sql
    - src/lib/phase28Sql.contract.test.ts
key-decisions:
  - "Função explícita (deletes ordenados) em vez de alterar FKs para cascade"
  - "board_cards apagados explicitamente (FK é set null no banco vivo)"
  - "Tombstone restrito ao autor libera limpeza de storage após patients sumir"
requirements-completed: [REQ-39]
duration: 15min
completed: 2026-10-10
---

# Phase 28 Plan 01: SQL da exclusão definitiva Summary

SQL tudo-ou-nada `delete_patient_full` (security definer, checagem `can_write_patient`, 42501) com tombstone e policies de limpeza de storage só do autor, travado por teste de contrato; nada aplicado no banco.

## Tasks
1. Passo 0 + tombstone + delete_patient_full + contrato: 851f108
2. Policies de limpeza, finish_patient_deletion, list_pending: 0a31a9b

## Deviations from Plan
None - plan executed exactly as written. Bloco 0 (saída do passo 0) ficou vazio conforme o plano; os resultados vivos estão em 28-DB-DISCOVERY.md (12 tabelas, sem FK restrict, rolbypassrls=true), e nenhum delete extra é necessário.

## Verification
`node --test src/lib/phase28Sql.contract.test.ts` e `npm run typecheck` verdes; sem `supabase/migrations`; discovery só com select.

## Self-Check: PASSED
