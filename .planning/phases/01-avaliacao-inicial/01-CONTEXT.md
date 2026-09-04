# Phase 1 — Avaliação inicial

## Requirement

REQ-05: avaliação estruturada dentro do paciente, vinculada à data em que foi realizada.

## Locked decisions

- Persistência em Supabase (`patient_evaluations`), não localStorage
- Camadas: types → schema → service → hooks → panel
- Data (`performed_on`) obrigatória; queixa principal obrigatória
- Demais campos clínicos opcionais (podem ser preenchidos ao longo do tempo)
- Múltiplos registros datados: o mais antigo é a avaliação inicial
- Aba atual "Avaliação Física" passa a ser "Avaliação"
- PDF + IA permanece como importador de rascunho, não como fonte oficial

## Existing surfaces

- Aba `avaliacao` em `PatientPage` / `PatientProfileHeader`
- `PatientPhysicalEvaluationPanel` (PDF → localStorage)
- Padrão de CRUD: `PatientEvolutionsPanel` + `sessions.service.ts`
