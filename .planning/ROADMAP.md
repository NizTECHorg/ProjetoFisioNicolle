# Roadmap: Fisio — Prontuário clínico

## Overview

Completar o prontuário com metas de tratamento por paciente (REQ-14). A avaliação inicial (REQ-05) fica para depois.

## Phases

- [x] **Phase 1: Avaliação inicial** — Registro estruturado e datado da avaliação do paciente
- [ ] **Phase 2: Metas do tratamento** — Objetivos específicos por paciente, com status e datas

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

### Phase 2: Metas do tratamento
**Goal**: O profissional cria objetivos específicos para cada paciente e acompanha o status (em andamento ou concluído), com data de criação e data em que foi concluído. Clique no card marca como feito.
**Depends on**: Nothing (ficha do paciente já existe; REQ-05 fica para depois)
**Requirements**: REQ-14
**Success Criteria** (what must be TRUE):
  1. Na ficha do paciente dá para criar, editar e acompanhar metas
  2. Cada meta tem status: em andamento ou concluído
  3. Fica registrado quando a meta foi criada e quando foi concluída
  4. Clique no card alterna entre em andamento e concluído
  5. Metas persistem no Supabase, sem dados mockados
**Plans**: 1 plan
**UI hint:** yes

Plans:
- [x] 02-01: Schema, serviço e UI das metas no Resumo
