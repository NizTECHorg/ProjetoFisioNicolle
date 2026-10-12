---
phase: 31-excluir-a-pr-pria-conta
plan: 03
subsystem: client
tags: [account-deletion, helpers, service, contract-test]
requires:
  - phase: 31-02
    provides: Edge Function delete-account (POST {confirm, password})
provides:
  - src/lib/accountDeletion.ts (helpers puros)
  - src/services/accountDeletion.service.ts (deleteOwnAccount, countAccountDeletionPatients, signOutAfterAccountDeletion)
affects: [31-04]
key-files:
  created:
    - src/lib/accountDeletion.ts
    - src/lib/accountDeletion.test.ts
    - src/services/accountDeletion.service.ts
    - src/lib/phase31Service.contract.test.ts
key-decisions:
  - "Corpo do invoke só { confirm, password }; userId só na chave de rate limit local"
  - "Erros do servidor viram uma das 3 copies fixas"
  - "signOut local tolerante após exclusão"
requirements-completed: []
completed: 2026-10-12
---

# Phase 31 Plan 03: Cliente de exclusão de conta Summary

Helpers puros (EXCLUIR exato, tipo de conta, copy por tipo com plural, mapeamento de erro) e service que chama a Edge Function delete-account sem id no corpo, com rate limit local, contagem informativa de pacientes e signOut local tolerante.

## Tasks

1. Helpers puros + 8 testes: `c9d712d`
2. Service + contrato de fonte (7 testes): commit seguinte (`feat(31-03): add accountDeletion service and contract test`)

## Verificação

- `node --test` nos dois arquivos: 15/15 verdes
- `npm run typecheck` e eslint nos arquivos tocados: limpos

## Deviations from Plan

**[Rule 1 - Bug]** No teste de contrato, `new URL(...).pathname` quebrava com o acento em "Área"; trocado por `fileURLToPath`. Também ajustado `m[1] ?? ''` por TS2345.

## Known Stubs

None.

REQ-42 não foi marcado como completo (conforme instrução).

## Self-Check: PASSED
