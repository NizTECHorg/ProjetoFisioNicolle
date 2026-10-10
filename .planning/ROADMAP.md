# Roadmap: Fisio — Prontuário clínico

## Overview

Completar o prontuário e o modelo de contas. Phase 15 concluída em 2026-09-23. Phases 8–14 seguem em andamento.

## Phases

- [x] **Phase 1: Avaliação inicial** — Registro estruturado e datado da avaliação do paciente
- [ ] **Phase 2: Metas do tratamento** — Objetivos específicos por paciente, com status e datas
- [x] **Phase 3: Tipos de conta e equipe** — Cadastro como autônomo, empresa ou fisioterapeuta; empresa aloca funcionários (completed 2026-09-09)
- [x] **Phase 4: Atalhos no dashboard** — Criar evolução ou avaliação direto do painel (completed 2026-09-14)
- [x] **Phase 5: Financeiro do autônomo** — Catálogo de preços do autônomo, alocação na sessão e arrecadação por mês/ano/sempre (completed 2026-09-14)
- [x] **Phase 6: Silhueta de áreas de foco** — Marcar partes do corpo na ficha com silhueta frente/costas (completed 2026-09-14)
- [x] **Phase 7: Galeria de imagens na ficha do paciente** — Galeria na ficha, avulsa ou por sessão, com descrição (completed 2026-09-15)
- [ ] **Phase 8: Integração Google Agenda** — Exportar sessões da agenda da aplicação para o Google Calendar *(UAT pendente — não approved)*
- [ ] **Phase 9: Paciente/sessão sem fisioterapeuta (empresa)** — Empresa cria paciente e sessão sem alocar profissional
- [ ] **Phase 10: Responsividade mobile 100%** — Toda a experiência clínica usável e legível em viewport estreito
- [ ] **Phase 11: Resumo IA** — Aba Resumo IA: gerar resumo clínico com contexto completo e PDFs salvos (geral ou por sessão)
- [ ] **Phase 12: Avaliações musculoesqueléticas** — Aba Avaliações (ficha 01–04), CRUD parcial, dashboard → nova, PDF export alinhado
- [ ] **Phase 13: PDF Avaliação / Evolução** — Seções de export, field-picker, multi-sessão + IA, estilo ficha
- [ ] **Phase 14: PDF ficha visual polish** — Layout denso/legível alinhado às refs 01–04 (tipografia, blocos, tabelas, mapa, escala EVA)
- [x] **Phase 15: E-mail Fluxo de confirmação de conta** — Template + SMTP próprio no lugar do e-mail genérico do Supabase (completed 2026-09-23)
- [x] **Phase 16: Foto do paciente** — Hover na foto mostra a câmera; o clique envia PNG ou JPEG (completed 2026-09-24)
- [x] **Phase 17: Isolamento de dados por conta** — Cada conta vê só os próprios dados; nenhum mock permanece no site (completed 2026-09-24)
- [ ] **Phase 18: Minha conta** — Ícone ao lado de Sair abre a página para trocar foto, nome e senha *(oráculo de senha pendente)*
- [ ] **Phase 19: Boneco de área de foco** — Divisões nos braços, pés separados e seleção sem scroll na página
- [ ] **Phase 20: Esqueci minha senha** — Link no login envia e-mail para trocar a senha
- [x] **Phase 21: Agendar sessões em vários dias** — Escolher segunda, quarta, sábado (ou outros) e quantas vezes repetir (completed 2026-10-03)

- [ ] **Phase 22: Resumo do paciente pela IA** — A IA preenche o resumo inteiro; o profissional edita na aba Resumo
- [ ] **Phase 23: Ajustes do resumo IA** — Editar cada caixa no lugar, usar o prontuário e a descrição extra, e rolar o Entenda o caso
- [x] **Phase 24: Atividades da avaliação** — Várias atividades no bloco B da Função, cada uma com capacidade atual, quanto conseguia antes e unidade (completed 2026-10-05)
- [ ] **Phase 25: Mobilidade, palpação e testes** — Bloco B por região e movimento; palpação estruturada; testes clínicos pesquisáveis
- [ ] **Phase 26: PDF, botão Gerando e envio ao cliente** — PDF só com o preenchido; botão de IA com estrela e brilho azul; enviar avaliação ou evolução por e-mail e WhatsApp
- [ ] **Phase 27: Analítica no Financeiro** — Duas abas nos totais: a de hoje e uma analítica com gráficos simples e interativos
- [ ] **Phase 28: Excluir paciente por completo** — Ação na ficha que apaga o paciente e tudo dele do banco e do storage

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

### Phase 8: Integração Google Agenda

**Goal:** O profissional conecta a conta Google e envia as sessões da agenda da aplicação para o Google Calendar. Se a integração bidirecional (Google → app) for viável sem quebrar o modelo clínico, incluir; senão, entregar só app → Google.
**Depends on:** Phase 7 (numbering; functionally agenda/`patient_sessions` + Phase 3 auth)
**Requirements**: REQ-20
**Success Criteria** (what must be TRUE):

  1. Na Agenda (`/agenda`) o profissional consegue conectar/desconectar a conta Google
  2. Sessões da aplicação podem ser enviadas (criar/atualizar) como eventos no Google Calendar
  3. Tokens OAuth ficam seguros (não em localStorage puro; RLS / backend adequado)
  4. Se sync Google → app for inviável ou inseguro, a fase entrega só app → Google e documenta o motivo
  5. Erros de permissão / token expirado aparecem em português, com caminho claro para reconectar

**Plans:** 4/5 plans executed
**UI hint:** yes

Plans:
**Wave 1**

- [x] 08-01-PLAN.md — Types, Zod, mapper D-08, mapGoogleCalendarError, exportação copy
- [x] 08-02-PLAN.md — SQL connections/secrets/links + [BLOCKING] SQL Editor apply

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 08-03-PLAN.md — Edge Functions vault/export/disconnect + [BLOCKING] deploy/secrets

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 08-04-PLAN.md — googleCalendar.service + useGoogleCalendar hooks

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 08-05-PLAN.md — CalendarPage Google strip + UAT connect/export/disconnect

### Phase 9: Paciente/sessão sem fisioterapeuta (empresa)

**Goal:** Conta **empresa** consegue cadastrar paciente e criar/agendar sessão **sem** obrigar a alocação de um fisioterapeuta. O profissional pode ficar vazio e ser atribuído depois.
**Depends on:** Phase 3 (account types + team) — não bloqueia em Phase 8
**Requirements**: REQ-21
**Success Criteria** (what must be TRUE):

  1. Empresa cria paciente sem selecionar/alocar fisioterapeuta
  2. Empresa cria ou agenda sessão sem `therapistId` obrigatório
  3. UI deixa claro quando não há profissional (ex.: Sem profissional) e permite atribuir depois na edição
  4. Autônomo e fisioterapeuta mantêm o comportamento atual (não regredir fluxo solo/equipe)
  5. Persistência e RLS continuam corretos com `therapist_id` / vínculo nulo

**Plans:** 2 plans
**UI hint:** yes

Plans:

- [ ] 09-01-PLAN.md — Schema factory, canOmitSessionTherapist, nullable upsert, sessions.service null coalesce
- [ ] 09-02-PLAN.md — PatientSessionEditorForm empresa omit + Sem profissional displays

### Phase 10: Responsividade mobile 100%

**Goal:** Em viewport estreito (telefone), **todas** as telas clínicas do produto são usáveis sem scroll horizontal indesejado, sem truncar ações críticas, e com hierarquia tocável — o site deixa de ser “parcialmente responsivo” e fica **100%** mobile-ready.
**Depends on:** AppShell + rotas clínicas existentes (Phases 3–7); não bloqueia Phase 8/9
**Requirements**: REQ-22
**Success Criteria** (what must be TRUE):

  1. Em ~360–430px de largura, shell (drawer, bottom nav, header) e páginas clínicas não exigem pan horizontal para usar o fluxo principal
  2. Formulários, tabelas/listas, modais e abas da ficha empilham ou scrollam de forma legível no mobile
  3. Agenda, Painel, Pacientes, Ficha, Equipe, Financeiro (autônomo) e auth passam checklist visual mobile
  4. Desktop (≥lg) não regride: layout atual de sidebar + painel permanece
  5. Safe-area / bottom nav não cobrem CTAs primários

**Plans:** 3/4 plans executed
**UI hint:** yes

Plans:

- [x] 10-01-PLAN.md — Shell/primitives: viewport-fit, Modal/ConfirmDialog safe-area, AppShell targets, DataTable/PageHeader, UI checklist
- [x] 10-02-PLAN.md — Clinical pages: Agenda, Quadro, Painel, Equipe cards, Financeiro catalog cards
- [x] 10-03-PLAN.md — Ficha modules: tabs, silhueta, touch actions, evoluções/forms
- [ ] 10-04-PLAN.md — Human UAT at 360/390/430 + lg smoke (blocking checkpoint)

### Phase 11: Resumo IA

**Goal:** Na ficha, a aba **Resumo IA** concentra gerar (com IA) o texto de **Resumo do paciente** a partir do contexto clínico completo, e exportar PDFs (geral ou por sessão) que ficam salvos na própria aba.
**Depends on:** Ficha + evoluções + áreas de foco + `ai_summary` (Phases 1–7); não bloqueia 8–10
**Requirements**: REQ-23
**Success Criteria** (what must be TRUE):

  1. Aba da ficha chama-se **Resumo IA** (substitui o rótulo/papel atual de “Avaliação” como hub de IA)
  2. Uma única caixa de input permite escolher: escrever resumo via IA **ou** exportar avaliação em PDF
  3. Gerar resumo usa contexto máximo do paciente (cadastro, queixa, evoluções por sessão, metas, áreas de foco, etc.) e grava em Resumo do paciente (`ai_summary` / área Resumo)
  4. Export PDF: geral (estado atual) **ou** por sessão escolhida; arquivos listados em “Avaliações salvas” com tipo, data e sessão quando aplicável
  5. Quem não pode escrever a ficha só consulta (sem gerar/exportar/excluir)

**Plans:** 1/4 plans executed
**UI hint:** yes

Plans:

- [x] 11-01-PLAN.md — SQL/contracts: `ai_summary` write, Zod/DTOs, `patient_ai_reports` + SQL Editor apply
- [ ] 11-02-PLAN.md — Edge Function `patient-ai-summary` + client invoke + GEMINI secret deploy
- [ ] 11-03-PLAN.md — pdf-lib gate + PDF builder + Storage reports service/hooks
- [ ] 11-04-PLAN.md — Tab Resumo IA, unified composer, Avaliações salvas, canWrite UAT

### Phase 12: Avaliações musculoesqueléticas

**Goal:** A ficha tem uma aba **Avaliações** (separada de Resumo IA) onde o profissional cria e salva inúmeras avaliações no modelo da ficha musculoesquelética (referências 01–04). O dashboard escolhe o paciente e abre a aba com criar ativo. Export PDF de avaliação usa esse documento como referência.
**Depends on:** Ficha + Phase 11 Resumo IA (desacoplar avaliação da aba IA; atualizar PDF export) + Phase 1 `patient_evaluations` brownfield
**Requirements**: REQ-24
**Success Criteria** (what must be TRUE):

  1. Aba **Avaliações** existe na ficha e não depende da aba Resumo IA
  2. É possível listar, criar, editar e excluir múltiplas avaliações por paciente
  3. Formulário cobre os blocos das fichas 01–04; criação parcial (campos em branco permitidos; completar depois)
  4. Dashboard → Avaliações → escolher paciente → abre aba Avaliações com formulário de criar aberto
  5. PDF de exportação de avaliação (fluxo do paciente / Resumo IA) segue o layout/seções do documento de referência
  6. Consulta-only (empresa colega) sem criar/editar/excluir; RLS permanece a parede

**Plans:** 4 plans
**UI hint:** yes

Plans:

- [ ] 12-01-PLAN.md — SQL/contracts: `ficha` jsonb + Zod ficha schema + performedOn-only create + SQL Editor apply
- [ ] 12-02-PLAN.md — Service/hooks map `ficha` + legacy column read-compat
- [ ] 12-03-PLAN.md — Tab Avaliações, rich multi-block form, detach Resumo IA, dashboard `?nova=1`
- [ ] 12-04-PLAN.md — PDF from ficha document + composer select evaluation + UAT

### Phase 13: PDF Avaliação / Evolução

**Goal**: No Resumo IA, o export PDF tem seções **Avaliação** e **Evolução**; o profissional escolhe quais campos preenchidos entram no PDF (todos on por padrão); Evolução agrega várias sessões via IA; o PDF segue o estilo das fichas de referência só com campos selecionados.
**Depends on**: Phase 11 (Resumo IA composer/PDF), Phase 12 (ficha avaliação)
**Requirements**: REQ-25
**Success Criteria** (what must be TRUE):

  1. Composer PDF mostra seções **Avaliação** | **Evolução** (não mais “Avaliação salva” / “Por sessão” como escopos principais)
  2. Field-picker lista só campos preenchidos; todos selecionados por padrão; desmarcar exclui do PDF
  3. Avaliação: escolhe uma avaliação + picker → PDF estilo ficha (blocos) só com selecionados
  4. Evolução: multi-select de sessões; IA agrega dados dessas sessões; picker + PDF
  5. PDFs aparecem na lista do Resumo IA; empresa em consulta não exporta
  6. Visual alinhado às refs em `refs/` (blocos rotulados); sem inventar dados

**Plans**: 6 plans

Plans:
**Wave 1**

- [ ] 13-01-PLAN.md — SQL kinds avaliacao/evolucao + client Zod/list badges + SQL Editor apply
- [ ] 13-02-PLAN.md — pdfFieldCatalog filled blocks (~27) + evolução SOAP/AI ids

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 13-03-PLAN.md — Selective pdf-lib block chrome + drawEvolucao

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 13-04-PLAN.md — Field-picker Modal + composer Avaliação|Evolução + Avaliação export

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 13-05-PLAN.md — EF mode evolucao + Evolução multi-session wire + EF redeploy

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 13-06-PLAN.md — UAT REQ-25 (picker, multi-session IA, empresa read-only)

**UI hint:** yes

### Phase 14: PDF ficha visual polish

**Goal**: O PDF exportado de Avaliação/Evolução fica bonito, denso e legível — visualmente alinhado às fichas de referência 01–04 (blocos, tipografia, grids, tabelas, mapa corporal, EVA, callouts), sem regredir o picker nem inventar dados.
**Depends on**: Phase 13 (export seletivo + kinds + draw paths)
**Requirements**: REQ-26
**Success Criteria** (what must be TRUE):

  1. Capítulos centrados no estilo `01 — ANAMNESE INICIAL` (02–04 equivalentes)
  2. Blocos lettered com badge + borda; navy/sage; triagem vermelha
  3. Underlines / caixas / checkbox grids no lugar de listas esparsas
  4. Multi-coluna onde a ref exige; tabelas Mobilidade/Força com header sombreado
  5. Escala EVA 0–10 e mapa corporal (silhuetas + legendas) quando selecionados
  6. Evolução compartilha o mesmo sistema visual; só conteúdo selecionado

**Plans**: 4 plans

Plans:
**Wave 1**

- [ ] 14-01-PLAN.md — TimesRoman banners, slim header, badge colors, callouts, checkbox grids

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 14-02-PLAN.md — Dual-column blocks, Mobilidade/Força tables, EVA scale, SVG body map

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 14-03-PLAN.md — Evolução shared ficha chrome + ID profissional density

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 14-04-PLAN.md — Visual UAT vs refs 01–04 (blocking)

**UI hint:** yes

### Phase 15: E-mail Fluxo de confirmação de conta

**Goal**: O e-mail de autorização/confirmação na criação de conta é personalizado da Fluxo (marca + copy), enviado por um e-mail próprio do operador por enquanto — sem depender do remetente/template genérico do Supabase.
**Depends on**: Phase 3 (cadastro + confirm email já existem)
**Requirements**: REQ-27
**Success Criteria** (what must be TRUE):

  1. Cadastro dispara e-mail de confirmação com marca/copy Fluxo
  2. Remetente é endereço próprio do operador (SMTP custom no Supabase)
  3. Link de confirmação abre https://fluxofisio.vercel.app (nunca localhost) e confirma a conta
  4. Depois do clique, o usuário entra com e-mail e senha (email_confirmed_at preenchido)
  5. Runbook no repo documenta SMTP + templates + URL configuration no Dashboard
  6. Reset de senha (se ativo) segue a mesma marca; convites de equipe fora

**Plans:** 4/4 plans complete
**UI hint:** no

Plans:

**Wave 1**

- [x] 15-01-PLAN.md — Runbook + paste-ready Confirm/Reset Fluxo HTML templates
- [x] 15-02-PLAN.md — Origem de produção fixa no emailRedirectTo + fluxo implícito travado
- [x] 15-03-PLAN.md — Templates com ConfirmationURL puro + runbook corrigido (Site URL, Vercel, UAT)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 15-04-PLAN.md — Deploy + Dashboard apply + UAT do cadastro novo (gate humano)

### Phase 16: Foto do paciente

**Goal:** Na ficha e nas listas, a foto do paciente aceita PNG ou JPEG: o hover mostra um ícone de câmera e o clique abre a escolha do arquivo. Sem foto, continuam as iniciais.
**Requirements**: TBD
**Depends on:** Phase 7
**Plans:** 6/6 plans complete

Plans:

**Wave 1**

- [x] 16-01-PLAN.md — Bucket patient-avatars, patients.photo_path, and PNG/JPEG schema
- [x] 16-02-PLAN.md — Center-crop gate and PatientAvatar photoUrl

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 16-03-PLAN.md — Upload, remove, signed URLs, and photo mutations

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 16-04-PLAN.md — Select photo_path and sign photoUrl on patient, calendar, and board reads

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 16-05-PLAN.md — Camera and file picker on the ficha and the patient list
- [x] 16-06-PLAN.md — Display the same photo on quadro, agenda, painel, and the shortcut

### Phase 17: Isolamento de dados por conta

**Goal:** Uma conta não vê dados digitados em outra conta. O quadro, pacientes, sessões, notas e todo o resto do site ficam isolados. Qualquer dado mockado sai do produto.
**Requirements**: REQ-28
**Depends on:** Phase 16
**Success Criteria** (what must be TRUE):

  1. Uma conta nova não vê tarefas do quadro, pacientes, sessões nem notas criados em outra conta
  2. Toda tabela de dado digitável está coberta por regra de acesso no banco e pela leitura no app
  3. Nenhuma tela mostra paciente, sessão, valor ou texto de exemplo que não veio do banco daquela conta

**Plans:** 3/3 plans complete

Plans:

- [x] 17-01-PLAN.md — RLS do quadro e fechamento de patients_select
- [x] 17-02-PLAN.md — Remover o laudo inventado da aba Avaliações
- [x] 17-03-PLAN.md — Carimbar owner_id e esvaziar o texto de seed do quadro

**Wave 1**

- [x] 17-01-PLAN.md — RLS do quadro e fechamento de patients_select
- [x] 17-02-PLAN.md — Remover o laudo inventado da aba Avaliações

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 17-03-PLAN.md — Carimbar owner_id e esvaziar o texto de seed do quadro

### Phase 18: Minha conta

**Goal:** No rodapé da barra lateral, ao lado de Sair, um botão só com ícone abre a página da própria conta. Lá a pessoa troca a foto, o nome e a senha.
**Requirements**: REQ-29
**Depends on:** Phase 17
**Success Criteria** (what must be TRUE):

  1. O rodapé da navegação tem um botão só com ícone, ao lado de Sair, que abre Minha conta
  2. Na página, a pessoa troca a própria foto, o próprio nome e a própria senha
  3. Depois de salvar e recarregar, foto, nome e senha novos valem só para essa conta
  4. Resetar a senha confere a senha atual antes de gravar a nova; senha atual errada não altera nada, e depois do reset a senha antiga deixa de entrar

**Plans:** 6/6 plans complete

Plans:

- [x] 18-01-PLAN.md — SQL do bucket account-avatars e do GRANT de coluna
- [x] 18-02-PLAN.md — Bump de @supabase/supabase-js para 2.117.1
- [x] 18-03-PLAN.md — Schema de nome e senha e mapAuthError por error.code
- [x] 18-04-PLAN.md — Services de nome, senha, foto e reloadProfile
- [x] 18-05-PLAN.md — Ícone Minha conta, rota /conta e card de foto e nome
- [x] 18-06-PLAN.md — Card Senha e password reset verification rule

**Wave 1**

- [x] 18-01-PLAN.md — SQL do bucket account-avatars e do GRANT de coluna
- [x] 18-02-PLAN.md — Bump de @supabase/supabase-js para 2.117.1
- [x] 18-03-PLAN.md — Schema de nome e senha e mapAuthError por error.code

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 18-04-PLAN.md — Services de nome, senha, foto e reloadProfile

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 18-05-PLAN.md — Ícone Minha conta, rota /conta e card de foto e nome

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 18-06-PLAN.md — Card Senha e password reset verification rule

### Phase 19: Boneco de área de foco

**Goal:** Refatorar a silhueta de áreas de foco: os braços passam a ter divisões, os pés viram uma região separada, e selecionar uma área não cria scroll na página. Se o desenho atual não permitir eliminar esse scroll, o boneco é refeito sem o erro.
**Requirements**: REQ-30
**Depends on:** Phase 6
**Success Criteria** (what must be TRUE):

  1. Os braços da silhueta têm divisões, e cada divisão pode ser marcada como área de foco
  2. Os pés são uma região separada das pernas
  3. Selecionar uma área de foco não cria scroll na página
  4. Se o boneco atual não puder ser corrigido sem o scroll, ele é substituído por um desenho em que a seleção não cria scroll

**Plans:** 2/3 plans executed

Plans:

**Wave 1**

- [x] 19-01-PLAN.md — Catálogo de 42 regiões, centroids do PDF e Set da função de IA
- [x] 19-02-PLAN.md — DELETE das oito keys obsoletas no SQL Editor

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 19-03-PLAN.md — Seleção sem scroll no card e no mapa da avaliação

### Phase 20: Esqueci minha senha

**Goal:** No login, um link Esqueci minha senha pede o e-mail e manda a mensagem Fluxo de redefinição. O link do e-mail abre o app para a pessoa escolher uma senha nova e entrar de novo.
**Requirements**: REQ-31
**Depends on:** Phase 15
**Success Criteria** (what must be TRUE):

  1. Na tela de login existe um caminho Esqueci minha senha
  2. Informar o e-mail dispara o e-mail de redefinição (template Fluxo já existente)
  3. Abrir o link do e-mail permite definir uma senha nova
  4. Depois disso, a senha antiga deixa de entrar e a nova entra

**Plans:** 3/4 plans executed

Plans:
**Wave 1**

- [x] 20-01-PLAN.md — Schemas, rate limit, confirm mode, requestPasswordReset + setPasswordFromRecovery

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 20-02-PLAN.md — Link no login + GuestRoute /esqueci-senha anti-enumeração
- [x] 20-03-PLAN.md — AuthConfirmPage branch recovery + formulário Nova senha

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 20-04-PLAN.md — UAT hospedado REQ-31 + confirmação template Fluxo

### Phase 21: Agendar sessões em vários dias da semana com repetição

**Goal:** No agendamento, o profissional escolhe um ou mais dias da semana (por exemplo segunda, quarta e sábado) e quantas vezes a série se repete. Cada ocorrência vira sessão agendada no mesmo horário. Hoje só dá para repetir o mesmo dia da data escolhida.
**Requirements**: REQ-32
**Depends on:** Nothing (agenda e criação de sessões já existem)
**Success Criteria** (what must be TRUE):

  1. Dá para marcar mais de um dia da semana na mesma série (ex.: segunda, quarta e sábado)
  2. Dá para informar quantas vezes a série se repete
  3. As sessões nascem agendadas, no mesmo horário, nos dias escolhidos
  4. Repetir só um dia continua possível (comportamento de hoje)

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 21-01-PLAN.md — Helper puro `src/lib/sessionSeries.ts` (série semanal, clamp 1–24, catálogo Seg→Dom, cópia PT-BR) provado por `node --test`

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 21-02-PLAN.md — Chips de dias da semana, campo "Repetir por quantas semanas", preview e CTA com contagem no modal Nova sessão

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 21-03-PLAN.md — Full suite + UAT manual da série real na agenda (checkpoint bloqueante)

### Phase 22: Resumo do paciente editável e preenchido pela IA

**Goal:** A geração de Resumo IA grava só o último resultado e preenche, para todo paciente, o mesmo conjunto de campos do Resumo do paciente — incluindo áreas de foco. A aba Resumo IA mostra o texto original gerado. A edição desse texto fica na aba Resumo.
**Requirements**: REQ-33
**Depends on:** Nothing (ficha, áreas de foco e a função de resumo já existem)
**Plans:** 6/7 plans executed

Plans:
**Wave 1**

- [x] 22-01-PLAN.md — Módulo puro patientSummary (chaves, rótulos, limites, resolução, diff, Zod) + node:test + teste de contrato
- [x] 22-02-PLAN.md — Script SQL das colunas jsonb para o SQL Editor + documento de setup do operador

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 22-03-PLAN.md — Tipos, leitura saneada das colunas, as duas escritas dedicadas, geração validada por Zod e hook de edição
- [x] 22-04-PLAN.md — Edge Function: pack do modo resumo limpo, prompt das 7 chaves e parse estendido

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 22-05-PLAN.md — Aba Resumo: os sete cards do conjunto fixo, lápis e modal Editar resumo
- [x] 22-06-PLAN.md — Aba Resumo IA somente leitura, confirmação antes de regenerar e tipografia dos objetivos

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 22-07-PLAN.md — Suíte completa + UAT hospedado bloqueante (SQL, publicação, geração, edição, regeneração)

**Success Criteria** (what must be TRUE):

1. Gerar de novo substitui o resumo anterior; não há histórico de resumos.
2. Na aba Resumo IA o profissional lê o texto original da última geração e não edita ali.
3. Na aba Resumo o profissional edita o texto do resumo e a edição persiste.
4. A mesma geração preenche os campos fixos do resumo (os definidos nesta fase, iguais para todos os pacientes) e as áreas de foco.
5. O system prompt descreve esses campos e só usa o que o prontuário contém.

### Phase 23: Ajustes do resumo IA e rolagem do Entenda o caso

**Goal:** Na aba Resumo cada caixa se edita no próprio texto, sem modal. A geração usa o número real de sessões feitas, marca só as áreas de foco do prontuário e da descrição extra, e trata essa descrição com o mesmo peso do prontuário. No Entenda o caso, queixa e diagnóstico longos rolam por um slider discreto em vez de cortar a página.
**Requirements**: REQ-34
**Depends on:** Phase 22 (cards, persistência original/edição e a função de resumo)
**Plans:** 4/5 plans executed

Plans:
**Wave 1**

- [x] 23-01-PLAN.md — Matcher puro de rótulos (verde) e contratos REQ-34 (parte fica vermelha até os planos seguintes)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 23-02-PLAN.md — Edge Function: count de realizada, descrição como FONTE, focusRegionKeys pelo catálogo
- [x] 23-03-PLAN.md — Editor inline em cada caixa do Resumo e remoção do modal

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 23-04-PLAN.md — Rolagem de Queixa/Diagnóstico e rótulo da descrição adicional

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 23-05-PLAN.md — Suíte completa e UAT hospedado (colar o index.ts da fase 13)

**Cross-cutting constraints:**

- A aba Resumo IA continua só com o original da última geração, sem lápis
- Salvar uma caixa grava o diff das seis chaves resolvidas; a descrição não substitui `patient.sessionsDone`

**Success Criteria** (what must be TRUE):

1. Cada campo de texto do Resumo do paciente se edita dentro da própria caixa. Não abre uma janela com todos os campos.
2. O número de sessões feitas que a IA usa é o das sessões concluídas do prontuário, não um campo desatualizado.
3. As áreas de foco geradas são exatamente as que o prontuário e a descrição extra sustentam.
4. A descrição adicional escrita antes de gerar entra no prompt como fonte, não como nota ignorável.
5. Queixa e diagnóstico longos no Entenda o caso rolam no card, sem estourar o layout.

### Phase 24: Atividades da avaliação

**Goal:** No bloco B de 03 Função, o profissional registra várias atividades. Cada uma tem capacidade atual e quanto conseguia antes, com unidade (minutos, km, repetições). Some o campo Atividade solto e o Consigo por separado.
**Requirements**: REQ-35
**Depends on:** Phase 12 (ficha 03 Função já existe)
**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 24-01-PLAN.md — Helper puro de capacidade (catálogo, normalize, format) e testes verdes

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 24-02-PLAN.md — Preprocess no schema e bloco B do formulário (grade revela a linha)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 24-03-PLAN.md — Leitura, catálogo 03.B e desenho do PDF com formatLinha

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 24-04-PLAN.md — Suíte completa e UAT hospedado do bloco B

**Cross-cutting constraints:**

- Só o bloco B de 03 Função; ficha já é jsonb, sem SQL e sem `supabase db push`
- Não editar `patient-ai-summary`; não inventar EVA nem metas; sem pacote npm novo

**Success Criteria** (what must be TRUE):

1. Dá para marcar mais de uma atividade (correr, depois agachar) e preencher a capacidade de cada uma.
2. Cada atividade mostra só capacidade atual e quanto conseguia antes. Não há campo Atividade nem Consigo por.
3. Capacidade atual e quanto conseguia antes aceitam uma unidade de medida (minutos, km, repetições), com o par valor + unidade formatado de forma clara.
4. A leitura da ficha, o PDF e o catálogo de export mostram as mesmas atividades com valor e unidade.

### Phase 25: Mobilidade, palpação e testes

**Goal:** No bloco B de Avaliação e plano, o profissional escolhe a região e marca só os movimentos que vai medir, com direito e esquerdo no mesmo campo e a dor de cada lado. No bloco E, a palpação vira achados por região e estrutura, e os testes clínicos viram uma lista pesquisável.
**Requirements**: REQ-36
**Depends on:** Phase 12 (página 04 da ficha já existe)
**Plans:** 4/5 plans executed

Plans:

- [x] 25-01-PLAN.md — Catálogos, normalize e frases do helper
- [x] 25-02-PLAN.md — Preprocess no schema e escritores da coluna tests
- [x] 25-03-PLAN.md — Blocos B e E da página 04
- [x] 25-04-PLAN.md — Detalhe, catálogo, PDF e typecheck
- [ ] 25-05-PLAN.md — Suíte completa e UAT hospedado

**Cross-cutting constraints:**

- Só os blocos B e E da página 04 · Avaliação e plano. Blocos A, C–G e as páginas 01–03 ficam como estão
- A ficha já é jsonb: sem SQL e sem `supabase db push`
- Não editar `patient-ai-summary`; sem pacote npm novo
- Leitura, catálogo de export e PDF mostram o que a ficha nova grava

**Success Criteria** (what must be TRUE):

1. Dá para escolher uma região, marcar só os movimentos dela e acrescentar outra região, cada uma com tipo (ativo, passivo ou ambos) e comparação (bilateral ou unilateral).
2. Cada movimento marcado mostra direito e esquerdo no mesmo campo. O valor aceita graus ou Completo, Limitado e Não avaliado. A dor de cada lado abre início, intensidade e observação.
3. A palpação registra achados com região, local filtrado por essa região, lado, achado, dor e observação, numa lista que dá para editar.
4. Os testes clínicos são uma lista pesquisável, com vários por região e Outro no fim.
5. A leitura da ficha, o PDF e o catálogo de export mostram as mesmas regiões, movimentos, achados e testes.

### Phase 26: PDF, botão Gerando e envio ao cliente

**Goal:** O PDF de avaliação e o de evolução ficam simples e mostram só o que foi preenchido. Todo botão que chama a IA, enquanto gera, mostra Gerando com uma estrela e um brilho azul. Dá para mandar essa avaliação ou evolução direto ao cliente por e-mail ou WhatsApp, com o logo de cada um.
**Requirements**: REQ-37
**Depends on:** Phase 13 (o PDF de avaliação e evolução já existe)
**UI hint**: yes
**Plans:** 4/4 plans complete

Plans:

- [x] 26-01-PLAN.md — PDF de avaliação e evolução só com o preenchido
- [x] 26-03-PLAN.md — Contato do paciente e função de e-mail no SMTP do Fluxo
- [x] 26-02-PLAN.md — Botão Gerando com estrela e brilho azul
- [x] 26-04-PLAN.md — Envio por e-mail e WhatsApp na exportação e na lista

**Cross-cutting constraints:**

- Sem SQL e sem `supabase db push`. Segredos de e-mail só no Dashboard, no SMTP que o Fluxo já usa
- Sem pacote npm novo. Não editar `patient-ai-summary`
- Conta sem escrita não vê e-mail nem WhatsApp. O brilho azul fica só no botão que está gerando com IA

**Success Criteria** (what must be TRUE):

1. O PDF de avaliação e o de evolução mostram só informações preenchidas, com uma formatação simples e limpa.
2. Enquanto a IA gera, o botão diz Gerando, mostra uma estrela e o fundo tem um brilho azul animado.
3. Na exportação, e-mail e WhatsApp aparecem com os logos e enviam a avaliação ou a evolução para o contato do cliente.

### Phase 27: Analítica no Financeiro

**Goal:** Na seção Totais do Financeiro, duas abas. Uma continua com Este mês, Este ano e Sempre. A outra é a Analítica, com visões e gráficos simples e interativos sobre os mesmos pagamentos.
**Requirements**: REQ-38
**Depends on:** Phase 5
**UI hint**: yes
**Plans:** 4/4 plans complete

Plans:
**Wave 1**

- [x] 27-01-PLAN.md — Agregação pura dos pagamentos no fuso de São Paulo

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 27-02-PLAN.md — Leitura paginada das cobranças pagas e hook
- [x] 27-03-PLAN.md — Gráficos SVG das três visões

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 27-04-PLAN.md — Abas Totais e Analítica na seção de totais

**Success Criteria** (what must be TRUE):

1. Onde estão os três totais, dá para trocar entre Totais e Analítica. Totais continua igual.
2. A Analítica mostra arrecadado por mês, mistura por preço e o mês contra o anterior.
3. Passar o mouse ou o foco mostra o valor em R$. Clicar num mês seleciona esse mês e as outras visões acompanham.
4. Os números vêm dos mesmos pagamentos dos totais, inclusive sessão pré-paga. Sem mock, sem SQL novo e sem pacote novo.

### Phase 28: Excluir paciente por completo

**Goal:** Na ficha, quem pode editar o paciente consegue excluí-lo de vez. Depois de confirmar digitando o nome, o paciente e todos os dados ligados a ele saem do banco e os arquivos saem do storage.
**Requirements**: REQ-39
**Depends on:** Phase 27
**UI hint**: yes

**Success Criteria** (what must be TRUE):

1. A ficha mostra Excluir paciente só para quem pode editar.
2. O botão de confirmar só funciona depois de digitar o nome do paciente.
3. Depois de excluir, nenhuma tabela tem linha ligada ao paciente e nenhum arquivo dele fica no storage.
4. Ninguém exclui paciente de outra conta; a exclusão no banco é tudo ou nada.
5. A tela volta para a lista e o paciente some da lista, dashboard, agenda e financeiro.

**Plans:** 3/5 plans executed

Plans:
**Wave 1**

- [x] 28-01-PLAN.md — SQL da exclusão (passo 0, tombstone, delete_patient_full, policies de limpeza de storage) + contrato
- [x] 28-02-PLAN.md — Helpers de confirmação, service deletePatientCompletely e hook useDeletePatient

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 28-03-PLAN.md — Botão Excluir paciente na ficha e diálogo com confirmação por nome
- [ ] 28-04-PLAN.md — Passo 0 no banco vivo, reconciliar e aplicar o SQL pelo SQL Editor (humano)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 28-05-PLAN.md — Suite completa e verificação ponta a ponta no Supabase real (humano)
