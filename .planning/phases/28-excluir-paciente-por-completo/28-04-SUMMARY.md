---
phase: 28-excluir-paciente-por-completo
plan: 04
subsystem: database
tags: [supabase, sql, rls, storage, delete]
requires:
  - phase: 28-01
    provides: 28-delete-patient.sql
provides:
  - SQL de exclusão reconciliado com o banco vivo e aplicado
affects: [28-05]
key-files:
  modified:
    - .planning/phases/28-excluir-paciente-por-completo/sql/28-delete-patient.sql
    - .planning/phases/28-excluir-paciente-por-completo/28-DB-DISCOVERY.md
decisions:
  - "Nenhuma tabela extra; board_cards (set null) mantém delete explícito"
metrics:
  completed: 2026-10-10
---

# Phase 28 Plan 04: Reconciliar e aplicar o SQL de exclusão Summary

Saída real do passo 0 registrada no Bloco 0 do `.sql`, que foi aplicado pelo SQL Editor e conferido pelo usuário.

## Accomplishments
- Bloco 0 do `28-delete-patient.sql` com FKs, colunas e RLS do banco vivo.
- As 12 tabelas ligadas (mais `board_cards`) já tinham `delete from public.<t>`; nada a acrescentar.
- `postgres` tem `rolbypassrls=true`, então o ramo A4 não disparou.
- Contrato `phase28Sql.contract.test.ts` verde (8/8); typecheck limpo; sem `supabase/migrations`.
- Aplicação no SQL Editor confirmada pelo usuário (user-confirmed, "deu tudo certo", sem saída crua): função existe, `anon_exec=false`, `auth_exec=true`, 6 policies de limpeza, tombstone ilegível por `authenticated`, teste de recusa deu `not_authenticated`.

## Task Commits
1. Task 1 (passo 0): satisfeita por 28-DB-DISCOVERY.md, commit 589cf95
2. Task 2: 589cf95
3. Task 3 (aplicação): ação humana, sem commit

## Deviations from Plan
None - plan executed exactly as written.

## Notes
REQ-39 permanece aberto até a verificação.
