# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-31)

**Core value:** Documentar cada atendimento e manter a base clínica do paciente.

**Current focus:** REQ-05 — Registro da avaliação inicial (implementação)

## Current Position

- Phase: 1 — Avaliação inicial
- Status: código entregue; aguardando SQL no Supabase + UAT
- Progress: UI + service + SQL prontos

## Accumulated Context

### Decisions

- Avaliação estruturada em `patient_evaluations` (Supabase)
- Data da realização obrigatória (`performed_on`)
- Queixa principal obrigatória; demais campos clínicos opcionais
- Mais antiga do paciente = avaliação inicial
- PDF + IA só preenche rascunho; o registro oficial é a ficha
- Aba do paciente: "Avaliação"

### Pending user action

- Executar `supabase/patients-req05-evaluations.sql` no SQL Editor

## Session Continuity

Last session: 2026-08-31 — `/gsd-progress --next` avançou para REQ-05 e implementou a avaliação estruturada.
