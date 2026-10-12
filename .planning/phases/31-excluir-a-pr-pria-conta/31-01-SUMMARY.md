---
phase: 31-excluir-a-pr-pria-conta
plan: 01
subsystem: database
tags: [postgres, supabase, security-definer, account-deletion, contract-test]
requires:
  - phase: 28-excluir-paciente-por-completo
    provides: ordem de exclusão dos filhos do paciente e padrão de tombstone
provides:
  - public.delete_account_data(uuid) (modos data_owner, org_owner, org_therapist)
  - public.finish_account_deletion(uuid)
  - private.account_deletion_pending (tombstone)
affects: [31-02, 31-05]
tech-stack:
  added: []
  patterns: [função security definer só service_role, tombstone de ids para limpeza de storage retomável]
key-files:
  created:
    - .planning/phases/31-excluir-a-pr-pria-conta/sql/31-delete-account.sql
    - src/lib/phase31Sql.contract.test.ts
  modified: []
key-decisions:
  - "Papel detectado pelas linhas (organizations.owner_id, membership therapist/active), não por account_type"
  - "storage.objects.owner_id tratado por SQL dinâmico, pois só a coluna owner foi confirmada"
requirements-completed: []
duration: 15min
completed: 2026-10-12
---

# Phase 31 Plan 01: SQL de exclusão da própria conta Summary

Função `delete_account_data` tudo-ou-nada (service_role) que apaga ou transfere os dados do usuário, grava tombstone com ids de pacientes e zera as 8 FKs no action antes de `auth.admin.deleteUser`.

## Tasks

1. Teste de contrato (RED): `5033e6a`
2. SQL `31-delete-account.sql` (GREEN): `269757c`

## Verificação

- `node --test src/lib/phase31Sql.contract.test.ts`: 12/12 verdes
- `npm run typecheck`: limpo
- `supabase/migrations` não existe; nada aplicado no banco (plano 31-05).

## Deviations from Plan

None - plan executed exactly as written.

REQ-42 não foi marcado como completo (conforme instrução).

## Self-Check: PASSED
