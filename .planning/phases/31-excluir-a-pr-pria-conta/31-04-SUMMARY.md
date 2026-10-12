---
phase: 31-excluir-a-pr-pria-conta
plan: 04
subsystem: ui
tags: [account-deletion, dialog, account-page, contract-test]
requires:
  - phase: 31-03
    provides: helpers e service de exclusao de conta
provides:
  - src/components/account/DeleteAccountDialog.tsx
  - Area sensivel em src/pages/AccountPage.tsx
  - src/lib/phase31Ui.contract.test.ts
affects: [31-05]
key-files:
  created:
    - src/components/account/DeleteAccountDialog.tsx
    - src/lib/phase31Ui.contract.test.ts
  modified:
    - src/pages/AccountPage.tsx
key-decisions:
  - "Dialogo nao fecha durante a exclusao (handleClose no-op quando pending)"
  - "Senha errada inline e limpa; demais erros com toast de copy fixa"
  - "Sucesso: signOut local, queryClient.clear, navigate('/'), toast"
requirements-completed: []
completed: 2026-10-12
---

# Phase 31 Plan 04: UI de exclusao da propria conta Summary

Dialogo de exclusao (aviso por tipo de conta, EXCLUIR + senha atual, bloqueio durante a exclusao, erros com copy fixa) e secao Area sensível ao fim de Minha conta, com fluxo de sucesso ate o login e toast "Sua conta foi excluída.".

## Tasks

1. DeleteAccountDialog: `8e4d876`
2. Area sensivel em AccountPage + contrato de UI (5 testes): commit `feat(31-04): add Area sensivel to Minha conta with delete flow`

## Verificacao

- `node --test` nos 3 arquivos da fase 31: 20/20 verdes
- `npm run typecheck`, `npm run build` e eslint nos arquivos tocados: limpos

## Deviations from Plan

None - plan executed as written.

## Known Stubs

None.

REQ-42 nao foi marcado como completo (conforme instrucao).

## Self-Check: PASSED
