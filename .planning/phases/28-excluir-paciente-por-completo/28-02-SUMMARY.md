---
phase: 28-excluir-paciente-por-completo
plan: 02
subsystem: client-logic
tags: [supabase, storage, react-query, tdd]
requires: [28-01 SQL contract]
provides:
  - isDeleteNameMatch, patientFilePathsFromListing, PATIENT_FILE_BUCKETS
  - deletePatientCompletely(patientId)
  - useDeletePatient(patientId)
affects: [28-03, 28-04, 28-05]
key-files:
  created:
    - src/lib/patientDeleteConfirm.ts
    - src/lib/patientDeleteConfirm.test.ts
    - src/services/patientDeletion.service.ts
    - src/lib/phase28Service.contract.test.ts
  modified:
    - src/hooks/usePatients.ts
key-decisions:
  - "Service em arquivo novo patientDeletion.service.ts; limpeza de storage no cliente com RLS, sem Edge Function"
  - "Invalidate de ['patients'] com refetchType none para não refazer a ficha apagada"
requirements-completed: []
duration: 10min
completed: 2026-10-10
---

# Phase 28 Plan 02: Lógica do cliente da exclusão Summary

Comparação de nome (trim, caixa, NFC), service list -> `delete_patient_full` -> remove -> `finish_patient_deletion` com retry de pendências por tombstone, e hook `useDeletePatient` que navega para /pacientes, limpa o cache e usa toasts fixos.

## Tasks
1. Helpers puros + testes: fe0349f
2. Service deletePatientCompletely + contrato: b18680a
3. Hook useDeletePatient: 4f53e4d

## Deviations from Plan
None - plan executed exactly as written. (O teste de contrato do hook ficou no mesmo arquivo commitado na tarefa 2 e só passou após a tarefa 3; ajuste do recorte para `useDeletePatient(` evitou colidir com `useDeletePatientAlert`.)

## Verification
`node --test src/lib/patientDeleteConfirm.test.ts src/lib/phase28Service.contract.test.ts` (10 testes) e `npm run typecheck` verdes. REQ-39 não marcado como completo (UI, aplicação do SQL e verificação humana ficam para planos seguintes).

## Known Stubs
None.

## Self-Check: PASSED
