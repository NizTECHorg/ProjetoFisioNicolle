# Roadmap: Fisio — Prontuário clínico

## Overview

Completar o prontuário e o modelo de contas. Próximo: atalhos no dashboard (REQ-16) e financeiro só para autônomo (REQ-17). REQ-05 e UAT do REQ-14 ficam para depois.

## Phases

- [x] **Phase 1: Avaliação inicial** — Registro estruturado e datado da avaliação do paciente
- [ ] **Phase 2: Metas do tratamento** — Objetivos específicos por paciente, com status e datas
- [x] **Phase 3: Tipos de conta e equipe** — Cadastro como autônomo, empresa ou fisioterapeuta; empresa aloca funcionários (completed 2026-09-09)
- [ ] **Phase 4: Atalhos no dashboard** — Criar evolução ou avaliação direto do painel
- [ ] **Phase 5: Financeiro do autônomo** — Valores de consulta (residência vs escritório) e arrecadação por mês/ano/sempre

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

### Phase 3: Tipos de conta e equipe

**Goal**: Na criação da conta, a pessoa escolhe se é autônomo, empresa ou fisioterapeuta que trabalha em empresa. A conta empresa pode alocar mais funcionários (fisioterapeutas).
**Depends on**: Nothing (cadastro e profiles já existem; REQ-14/REQ-05 não bloqueiam)
**Requirements**: REQ-15
**Success Criteria** (what must be TRUE):

  1. O cadastro exige escolher um tipo: autônomo, empresa ou fisioterapeuta
  2. Empresa consegue adicionar/alocar fisioterapeutas na equipe
  3. Fisioterapeuta de empresa entra no contexto da empresa (não cria clínica própria nesta fase)
  4. Autônomo opera sozinho, sem tela de equipe

**Plans**: 7 plans
**UI hint:** yes

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Contratos de tipos de conta e predicados de acesso
- [x] 03-02-PLAN.md — SQL org/membership/RLS + apply no Editor

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-03-PLAN.md — Cadastro: tipo, código e metadata
- [x] 03-06-PLAN.md — created_by no serviço de pacientes

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-04-PLAN.md — Login pendente/recusado e /aguardando

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-05-PLAN.md — /equipe para empresa (código + aceitar/recusar)
- [x] 03-07-PLAN.md — Consulta da empresa na lista e na ficha

### Phase 4: Atalhos no dashboard

**Goal**: No dashboard, o profissional inicia uma evolução ou uma avaliação sem entrar na ficha primeiro — escolhe o paciente e cai no fluxo que já existe.
**Depends on**: Phase 3 (sessão autenticada clínica; `canWritePatient` já existe)
**Requirements**: REQ-16
**Success Criteria** (what must be TRUE):

  1. O dashboard tem botões/ações para Nova evolução e Nova avaliação
  2. Cada ação pede o paciente (e a sessão, se for evolução) e abre o formulário existente
  3. Não existe um segundo CRUD; reutiliza `PatientEvolutionsPanel` / `PatientEvaluationPanel`
  4. Empresa em ficha de colega (consulta) não cria por esses atalhos

**Plans**: 4 plans
**UI hint:** yes

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Helpers, toast Ver ficha, create-hook options, Modal Fechar

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Extract Nova sessão form from PatientEvolutionsPanel
- [ ] 04-03-PLAN.md — Extract Nova avaliação form from PatientEvaluationPanel

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 04-04-PLAN.md — Dashboard header shortcuts + picker/editor overlay (D-01–D-04)

### Phase 5: Financeiro do autônomo

**Goal**: Só o autônomo vê Financeiro. Define valor de consulta na residência e no escritório, aplica o valor em cada sessão, e vê o arrecadado no mês, no ano e no acumulado.
**Depends on**: Phase 3 (account_type) — não depende da Phase 4
**Requirements**: REQ-17
**Success Criteria** (what must be TRUE):

  1. Nav e rota `/financeiro` só para `account_type === 'autonomo'`; outros tipos não veem e são redirecionados
  2. Dois valores fixos salvos: residência e escritório
  3. Cada sessão pode receber o valor correspondente ao local
  4. Totais mês / ano / sempre vêm das sessões com valor, sem mock
  5. RLS: empresa e fisioterapeuta não leem nem escrevem esses dados

**Plans**: 0 plans
**UI hint:** yes

Plans:
- [ ] TBD (run /gsd-plan-phase 5 to break down)
