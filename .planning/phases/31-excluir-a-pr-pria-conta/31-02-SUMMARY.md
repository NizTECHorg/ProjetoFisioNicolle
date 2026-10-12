---
phase: 31-excluir-a-pr-pria-conta
plan: 02
subsystem: api
tags: [supabase, edge-function, deno, account-deletion, contract-test]
requires:
  - phase: 31-01
    provides: delete_account_data e finish_account_deletion (service_role)
provides:
  - supabase/functions/delete-account (POST {confirm, password})
affects: [31-03, 31-05]
key-files:
  created:
    - supabase/functions/delete-account/index.ts
    - src/lib/phase31Edge.contract.test.ts
key-decisions:
  - "Id sempre de getUser(token); corpo só fornece confirm e password"
  - "Ordem: senha, ler refresh token, RPC, revogar Google, storage, deleteUser, finish"
requirements-completed: []
completed: 2026-10-12
---

# Phase 31 Plan 02: Edge Function delete-account Summary

Edge Function self-contained que reverifica EXCLUIR e a senha no servidor, chama a RPC atômica, limpa o storage e apaga o login por último, devolvendo apenas codes fixos.

## Tasks

1. Contrato de fonte (RED): `2275463`
2. Edge Function (GREEN): arquivo criado em disco, mas `/supabase/` está no .gitignore (nenhuma função do projeto é versionada); commit só do ajuste de tipagem do teste

## Verificação

- `node --test src/lib/phase31Edge.contract.test.ts`: 10/10 verdes
- `npm run typecheck`: limpo (supabase/functions fora do tsconfig do app)
- Nada foi publicado; deploy é o plano 31-05.

## Deviations from Plan

**[Rule 1 - Bug]** Erro TS2532 de índice possivelmente undefined no teste de ordem; corrigido com `?? ` nos índices.

## Known Stubs

None.

REQ-42 não foi marcado como completo (conforme instrução).

## Self-Check: PASSED
