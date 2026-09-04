# Roadmap: Fisio — Prontuário clínico

## Overview

Completar o prontuário com a avaliação inicial estruturada (REQ-05), base clínica para o tratamento e para comparar evoluções depois.

## Phases

- [x] **Phase 1: Avaliação inicial** — Registro estruturado e datado da avaliação do paciente

## Phase Details

### Phase 1: Avaliação inicial
**Goal**: O profissional registra a avaliação inicial do paciente com anamnese, queixa, história, dor, limitações, objetivos, exame, testes, medidas, diagnóstico e planejamento, sempre vinculados à data da realização.
**Depends on**: Nothing (brownfield; ficha e evoluções já existem)
**Requirements**: REQ-05
**Success Criteria** (what must be TRUE):
  1. Na ficha do paciente, a aba Avaliação mostra avaliações salvas no Supabase
  2. É possível criar, editar e excluir uma avaliação com data obrigatória
  3. Todos os campos clínicos do REQ-05 existem e persistem
  4. A avaliação mais antiga do paciente aparece como Inicial
**Plans**: 1 plan
**UI hint:** yes

Plans:
- [x] 01-01: Schema, serviço e UI da avaliação estruturada
