# Roadmap: Fisio — Prontuário clínico

## Overview

Completar o prontuário e o modelo de contas. Próximo: galeria de imagens na ficha (Phase 7). REQ-05 e UAT do REQ-14 ficam para depois.

## Phases

- [x] **Phase 1: Avaliação inicial** — Registro estruturado e datado da avaliação do paciente
- [ ] **Phase 2: Metas do tratamento** — Objetivos específicos por paciente, com status e datas
- [x] **Phase 3: Tipos de conta e equipe** — Cadastro como autônomo, empresa ou fisioterapeuta; empresa aloca funcionários (completed 2026-09-09)
- [x] **Phase 4: Atalhos no dashboard** — Criar evolução ou avaliação direto do painel (completed 2026-09-14)
- [x] **Phase 5: Financeiro do autônomo** — Catálogo de preços do autônomo, alocação na sessão e arrecadação por mês/ano/sempre (completed 2026-09-14)
- [x] **Phase 6: Silhueta de áreas de foco** — Marcar partes do corpo na ficha com silhueta frente/costas (completed 2026-09-14)
- [x] **Phase 7: Galeria de imagens na ficha do paciente** — Galeria na ficha, avulsa ou por sessão, com descrição (completed 2026-09-15)

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
- [x] 04-03-PLAN.md — Extract Nova avaliação form from PatientEvaluationPanel

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-04-PLAN.md — Dashboard header shortcuts + picker/editor overlay (D-01–D-04)

### Phase 5: Financeiro do autônomo

**Goal**: Só o autônomo vê Financeiro. Cria um catálogo de preços (nome + R$), aplica catálogo XOR avulso na sessão com snapshot e Pago, e vê o arrecadado no mês, no ano e no acumulado.
**Depends on**: Phase 3 (account_type) — não depende da Phase 4
**Requirements**: REQ-17
**Success Criteria** (what must be TRUE):

  1. Nav e rota `/financeiro` só para `account_type === 'autonomo'`; outros tipos não veem e são redirecionados
  2. Catálogo variável (nome + R$); preços arquivam, não apagam; editar ativo vale só para alocações futuras (CONTEXT D-02–D-04; overrides “dois valores fixos”)
  3. Sessão: um preço do catálogo XOR um valor avulso; Local permanece texto clínico; a sessão guarda o R$ da época (D-05–D-07)
  4. Totais mês / ano / sempre vêm das sessões com snapshot e Pago (inclui agendada pré-paga), sem mock (D-08–D-09)
  5. RLS: empresa e fisioterapeuta não leem nem escrevem esses dados; dinheiro não vive em `patient_sessions`

**Plans**: 5 plans
**UI hint:** yes

Plans:
**Wave 1**

- [x] 05-01-PLAN.md — Contratos: DTOs, parseBrlInput, canSeeFinance, session XOR/Pago
- [x] 05-02-PLAN.md — SQL catalog/charges/RLS + apply no Editor [BLOCKING]

**Wave 2** *(blocked on Wave 1 completion, including SQL apply)*

- [x] 05-03-PLAN.md — finance.service + useFinance + invalidate ['finance']

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-04-PLAN.md — Valor da consulta no editor compartilhado (D-01, D-05–D-08)
- [x] 05-05-PLAN.md — /financeiro: nav, totais, catálogo, lista de realizadas (D-01, D-10)

### Phase 6: Silhueta de áreas de foco

**Goal**: Na ficha do paciente, o card Áreas de foco deixa de ser um boneco palito decorativo e vira uma silhueta humana simples (frente e costas). Hover 0,5s numa região abre uma abinha; clicar marca ou desmarca aquela parte como área machucada / a trabalhar. Persistido em `patient_focus_areas`.
**Depends on**: Nothing (card Áreas de foco e tabela `patient_focus_areas` já existem; não depende do financeiro)
**Requirements**: REQ-18
**Success Criteria** (what must be TRUE):

  1. O card Áreas de foco mostra silhueta humana frente e costas, não o stick figure atual
  2. Hover de 0,5s numa parte do corpo abre uma abinha com o nome da região
  3. Clicar na abinha marca ou desmarca aquela parte como área de foco
  4. Partes marcadas ficam destacadas na silhueta e persistem no Supabase, sem mock
  5. Quem não pode escrever a ficha vê as áreas, mas não marca
  6. Visual simples e minimalista nas cores da clínica — a segunda imagem é referência de layout (frente/costas + regiões), não cópia do widget navy/laranja

**Plans**: 4 plans
**UI hint:** yes

Plans:
**Wave 1**

- [x] 06-01-PLAN.md — Contratos: catálogo 30 keys, types, Zod
- [x] 06-02-PLAN.md — SQL region_key + unique index + apply no Editor [BLOCKING]

**Wave 2** *(blocked on Wave 1 completion, including SQL apply)*

- [x] 06-03-PLAN.md — togglePatientFocusArea + useTogglePatientFocusArea

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 06-04-PLAN.md — PatientFocusAreasPanel SVG + chip + mount, delete BodyFocus

### Phase 7: Galeria de imagens na ficha do paciente

**Goal:** Na ficha do paciente, a aba Imagens mostra uma galeria persistida (sem mock). Cada foto é avulsa ou ligada a uma sessão, com descrição opcional. No viewport estreito o envio inclui câmera traseira; várias fotos sobem no mesmo lote. Excluir a sessão não apaga as fotos — elas ficam avulsas, com aviso Sessão removida. no lightbox até o profissional salvar Editar. Quem não pode escrever vê a galeria e o lightbox; Adicionar / Editar / Excluir / Compartilhar ficam ocultos.
**Depends on:** Phase 6 (numbering; functionally ficha tabs + patient_sessions + Phase 3 RLS)
**Requirements**: REQ-19 *(proposed — REQUIREMENTS.md still unlocked)*
**Success Criteria** (what must be TRUE):

  1. A aba Imagens (`?aba=imagens`) lista fotos reais do Supabase, sem mock
  2. Cada foto é avulsa ou ligada a uma sessão, com descrição opcional
  3. Viewport estreito: Tirar foto (câmera traseira) e Escolher arquivos; várias no mesmo lote, mesma descrição/sessão
  4. Arquivo inválido (HEIC, MIME, > 8 MB) gera toast em português e não sobe; as válidas do lote sobem
  5. Excluir a sessão não apaga as fotos (`ON DELETE SET NULL`); o lightbox mostra Sessão removida. até salvar Editar; o tile mostra Avulsa
  6. O confirm de excluir sessão em Evoluções avisa: As fotos dessa sessão ficam na ficha como avulsas.
  7. Empresa em consulta vê grid e lightbox; Adicionar / Editar / Excluir / Compartilhar ficam ocultos; RLS `can_read_patient` / `can_write_patient` é a parede
  8. Lightbox tem Compartilhar (`navigator.share` com o arquivo) para quem escreve; sem baixar e sem link público

**Plans:** 5/5 plans complete
**UI hint:** yes

Plans:
**Wave 1**

- [x] 07-01-PLAN.md — Contratos: PatientImage, Zod MIME/lote, mapStorageError
- [x] 07-02-PLAN.md — SQL bucket/table/RLS + apply no Editor [BLOCKING]

**Wave 2** *(blocked on Wave 1 completion, including SQL apply)*

- [x] 07-03-PLAN.md — patientImages.service + hooks + invalidate images (D-06/D-07)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 07-04-PLAN.md — Aba Imagens, galeria leitura, lightbox D-07, D-08 Evoluções

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 07-05-PLAN.md — Lote/câmera, editar/excluir, Compartilhar (D-01–D-05, D-09–D-12)
