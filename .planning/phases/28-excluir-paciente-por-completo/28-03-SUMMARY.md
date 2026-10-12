---
phase: 28-excluir-paciente-por-completo
plan: 03
subsystem: ui
tags: [react, dialog, tdd]
requires: [28-02 useDeletePatient, isDeleteNameMatch]
provides:
  - DeletePatientDialog
  - prop onDeletePatient no PatientProfileHeader
affects: [28-05]
key-files:
  created:
    - src/components/patients/DeletePatientDialog.tsx
    - src/lib/phase28Ui.contract.test.ts
  modified:
    - src/components/patients/PatientProfileHeader.tsx
    - src/pages/PatientPage.tsx
key-decisions:
  - "Botão Excluir paciente na linha de meta do cabeçalho, text-error, só com canWrite"
  - "Diálogo próprio sobre Modal (onClose no-op em pending); ConfirmDialog e Modal intactos"
requirements-completed: []
duration: 8min
completed: 2026-10-10
---

# Phase 28 Plan 03: UI de exclusão na ficha Summary

Botão discreto Excluir paciente no cabeçalho da ficha (todas as abas, só `canWrite`) que abre `DeletePatientDialog`: copy travada, aviso do Google Agenda, campo de nome com `isDeleteNameMatch`, loading e sem fechar durante a exclusão. A lista de pacientes não foi alterada.

## Tasks
1. DeletePatientDialog + contrato: 5209e75
2. Botão no header e ligação na PatientPage: 7008f15

## Deviations from Plan
None - plan executed exactly as written.

## Verification
Testes de contrato (16) e `npm run typecheck` verdes; eslint limpo nos arquivos tocados. REQ-39 segue aberto (verificação humana em 28-05).

## Known Stubs
None.

## Self-Check: PASSED
