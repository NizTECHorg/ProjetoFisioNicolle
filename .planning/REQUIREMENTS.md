# Requirements: Fisio — Prontuário clínico

**Defined:** 2026-08-31
**Core Value:** Documentar cada atendimento e manter a base clínica do paciente.

## Milestone atual

### Prontuário clínico

- [x] **REQ-08**: Evolução individual de cada sessão (entregue; SQL no Supabase)
- [x] **REQ-15**: Tipos de conta (autônomo / empresa / fisioterapeuta) e equipe na empresa
- [x] **REQ-16**: Atalhos no dashboard para criar evolução ou avaliação
- [x] **REQ-17**: Financeiro do autônomo — valores de consulta e arrecadação
- [x] **REQ-18**: Silhueta de áreas de foco — marcar partes do corpo na ficha
- [ ] **REQ-20**: Integração Google Agenda — exportar sessões da agenda para o Google Calendar *(UAT pendente)*
- [ ] **REQ-21**: Empresa cria paciente e sessão sem alocar fisioterapeuta
- [ ] **REQ-22**: Responsividade mobile 100% — experiência clínica completa em viewport estreito
- [ ] **REQ-23**: Resumo IA — gerar resumo clínico e PDFs salvos (geral / por sessão)
- [ ] **REQ-24**: Aba Avaliações — ficha musculoesquelética completa (criar/salvar N avaliações; dashboard → nova)
- [ ] **REQ-14**: Metas do tratamento — objetivos por paciente com status e datas
- [ ] **REQ-05**: Registro da avaliação inicial estruturada *(superseded by REQ-24 — campos simples Phase 1)*

## REQ-23 — Resumo IA

**Indispensável · Artur**

Refatorar o hub de IA na ficha: a aba passa a ser **Resumo IA**. Nela, **uma caixa de input** cobre dois modos: (1) escrever/atualizar o **Resumo do paciente** com IA usando o máximo de contexto clínico; (2) exportar PDF da avaliação (geral ou por sessão). Os PDFs ficam salvos na aba em **Avaliações salvas**.

### Acceptance

1. Aba **Resumo IA** na ficha (rótulo e fluxo claros; não confunde com avaliação estruturada REQ-05 se esta permanecer).
2. Input unificado com escolha de modo: gerar resumo IA **ou** exportar PDF.
3. Gerar resumo: agrega cadastro, clínica, evoluções por sessão, metas, áreas de foco e demais dados disponíveis; atualiza a área Resumo do paciente; pode sugerir/atualizar áreas de foco quando a IA indicar.
4. Export: PDF geral (estado atual) ou PDF de uma sessão escolhida; lista “Avaliações salvas” com tipo (geral/sessão), data e identificação da sessão.
5. Persistência no Supabase (metadados + arquivo); RLS alinhado a `can_write_patient` / leitura da ficha.
6. Erros de IA/rede em português; quem só consulta não gera nem exclui.

## REQ-24 — Aba Avaliações (ficha musculoesquelética)

**Indispensável · Artur**

Voltar **Avaliações** como **aba própria** da ficha (separada de Resumo IA). O profissional cria e salva **inúmeras** avaliações no modelo da ficha de anamnese/evolução musculoesquelética (4 páginas de referência: 01 Anamnese, 02 Sintomas, 03 Função/Segurança, 04 Avaliação e Plano). Criar é parcial como criar paciente: campos opcionais, salva e completa depois. O atalho **Avaliações** no dashboard escolhe o paciente e abre essa aba com o formulário de criar aberto. O PDF de “exportar avaliação” no Resumo IA passa a usar esse documento como referência de layout/conteúdo.

### Acceptance

1. Aba **Avaliações** na ficha, independente de Resumo IA (sem CRUD de avaliação embutido na aba de IA).
2. Lista + criar/editar/excluir N avaliações por paciente; persistência Supabase + RLS `can_read/write_patient`.
3. Formulário cobre os blocos das 4 fichas de referência (campos + design de blocos A–H); quase todos opcionais na criação (exceto o mínimo necessário, ex. data).
4. Dashboard: botão Avaliações → escolher paciente → navega para a aba Avaliações com criar aberto.
5. Export PDF de avaliação (fluxo Resumo IA / export paciente) usa o documento/ficha como referência visual e de seções.
6. Empresa em consulta só lê; sem criar/editar/excluir.

## REQ-22 — Responsividade mobile 100%

**Indispensável · Artur**

O produto já tem partes responsivas (AppShell, bottom nav, alguns grids). Esta fatia fecha **todas** as telas e componentes clínicos para uso pleno no celular: sem quebra de layout, sem ações inacessíveis, sem overflow horizontal no fluxo principal.

### Acceptance

1. Viewport ~360px: shell + páginas clínicas usáveis sem pan horizontal obrigatório.
2. Ficha do paciente (abas, formulários longos, silhueta, galeria) funciona no mobile.
3. Agenda, painel, listas, equipe e financeiro do autônomo têm layout mobile coerente.
4. Modais / confirms / toasts não ficam cortados pelo bottom nav ou safe-area.
5. Layout desktop (≥ `lg`) permanece equivalente ao atual.

## REQ-21 — Paciente/sessão sem fisioterapeuta (empresa)

**Indispensável · Artur**

Na conta **empresa**, dá para cadastrar um **paciente** e criar/agendar uma **sessão** **sem** alocar um fisioterapeuta. O vínculo com o profissional fica opcional e pode ser preenchido depois.

### Acceptance

1. Fluxos de novo paciente (empresa) não exigem fisioterapeuta.
2. Fluxos de nova sessão / agendar (empresa) não exigem `therapistId`.
3. Registros sem profissional exibem estado claro na UI e permitem atribuir na edição.
4. Autônomo e fisioterapeuta não perdem o fluxo atual.
5. Dados persistem no Supabase com profissional nulo quando não alocado; RLS de equipe permanece válido.

## REQ-20 — Integração Google Agenda

**Indispensável · Artur**

Na Agenda da aplicação, o profissional conecta a conta Google e sobe as sessões/tarefas agendadas para o Google Calendar. Prioridade é **app → Google**. Se for possível e seguro trazer eventos do Google para dentro da agenda da aplicação, incluir; se não for, entregar só a exportação e documentar o bloqueio.

### Acceptance

1. O profissional conecta e desconecta a conta Google a partir da Agenda.
2. Sessões da aplicação podem ser criadas/atualizadas como eventos no Google Calendar do usuário conectado.
3. Credenciais OAuth não ficam expostas no cliente de forma insegura; acesso respeita o dono da conta.
4. Se sync Google → app for inviável nesta fase, a UI deixa claro que a integração é só exportação.
5. Falha de token / escopo / rede mostra mensagem em português e permite reconectar.

## REQ-18 — Silhueta de áreas de foco

**Indispensável · Artur**

No Resumo da ficha, o card **Áreas de foco** deixa de ser um boneco palito estático. O profissional vê uma **silhueta humana** (frente e costas), passa o cursor 0,5s sobre uma parte do corpo, abre uma **abinha** com o nome da região e clica para marcar ou desmarcar aquela parte como machucada / a trabalhar no paciente.

Referência de layout: widget de seletor de partes do corpo com silhueta frente+costas. Visual do produto: **simples e minimalista**, cores da clínica — não copiar o detalhe muscular navy/laranja da referência.

### Acceptance

1. O card Áreas de foco mostra silhueta humana frente e costas no lugar do stick figure.
2. Hover de 0,5s numa região abre uma abinha clicável com o nome da parte.
3. Clicar na abinha marca ou desmarca a parte como área de foco do paciente.
4. Várias partes podem estar marcadas ao mesmo tempo; o destaque na silhueta reflete o estado salvo.
5. Persistido em `patient_focus_areas` (Supabase), sem dados mockados; RLS existente de leitura/escrita da ficha continua valendo.
6. Quem não pode escrever a ficha (empresa em consulta de colega) só vê; não marca.

## REQ-16 — Atalhos no dashboard

**Indispensável · Artur**

No dashboard, o profissional consegue iniciar uma **evolução** ou uma **avaliação** sem abrir a ficha primeiro. Os botões levam ao fluxo já existente (sessão/evolução e avaliação estruturada), escolhendo o paciente.

### Acceptance

1. O dashboard mostra ações visíveis para criar evolução e para criar avaliação.
2. Cada ação pede o paciente (e, se preciso, a sessão) e abre o formulário existente — não um segundo CRUD paralelo.
3. Quem não pode escrever a ficha (empresa em consulta de colega) não cria registro por esses atalhos.
4. Autônomo, empresa (nas próprias fichas) e fisioterapeuta ativo usam os atalhos.

## REQ-17 — Financeiro do autônomo

**Indispensável · Artur**

Só a conta **autônomo** vê a aba Financeiro. Lá o profissional define um valor fixo de consulta para **residência do paciente** e outro para **escritório/consultório**, salva, e associa o valor a cada sessão. O financeiro soma o dinheiro das consultas com base nas sessões e nos valores alocados, com totais por **mês**, **ano** e **sempre**.

Não reutilizar a tela bakery de despesas (`FinancePage` caramel/dark, `canManageFinance` em `profiles.role`). Esta fatia é clínica, gated por `account_type === 'autonomo'`.

### Acceptance

1. Item Financeiro no drawer (e rota `/financeiro`) aparece só para autônomo. Empresa e fisioterapeuta não veem e `/financeiro` redireciona.
2. Dá para cadastrar e salvar dois valores: consulta na residência e consulta no escritório.
3. Dá para alocar o valor correspondente em cada sessão (pelo local da sessão).
4. Totais de arrecadação: mês corrente, ano corrente e acumulado (sempre), derivados das sessões com valor — sem mock.
5. Persistido no Supabase; RLS impede empresa/fisio de ler/escrever esses dados.

## REQ-15 — Tipos de conta e equipe

**Indispensável · Artur**

Na criação da conta, a pessoa escolhe o tipo:

- **Autônomo** — profissional que opera sozinho
- **Empresa** — clínica/organização que pode alocar mais funcionários (fisioterapeutas)
- **Fisioterapeuta** — profissional que trabalha em uma empresa

A empresa consegue adicionar mais fisioterapeutas à equipe.

### Acceptance

1. O formulário de cadastro exige escolher autônomo, empresa ou fisioterapeuta.
2. Conta empresa tem um lugar para alocar/adicionar funcionários (fisioterapeutas).
3. Fisioterapeuta vinculado a empresa não gerencia a equipe nesta fase.
4. Autônomo não vê gestão de equipe.
5. Tipos e vínculos persistem no Supabase.

## REQ-14 — Metas do tratamento

**Indispensável · Artur**

Permitir criar objetivos específicos para cada paciente e acompanhar seu status: não iniciado, em andamento e atingido. Deve ser possível registrar quando um objetivo foi criado e quando foi atingido.

O prontuário acompanha não apenas o que foi feito, mas para onde o tratamento está caminhando.

### Acceptance

1. Na ficha do paciente, o profissional cria e edita metas específicas.
2. Cada meta tem um status: não iniciado, em andamento ou atingido.
3. A data de criação da meta é registrada e visível.
4. Quando o status passa a atingido, fica registrada a data em que foi atingida.
5. Metas persistem no Supabase, sem dados mockados.

## REQ-05 — Registro da avaliação inicial

**Indispensável · 10/09/2026 · Artur**

Dentro do paciente deve existir uma avaliação estruturada onde possam ser registrados:

- Anamnese
- Queixa principal
- História do quadro
- Dor
- Limitações
- Objetivos
- Exame físico
- Testes
- Medidas
- Diagnóstico fisioterapêutico
- Planejamento

A avaliação permanece vinculada à **data em que foi realizada**. É a base clínica para acompanhar o tratamento e comparar posteriormente a evolução.

### Acceptance

1. A aba Avaliação do paciente lista avaliações reais (Supabase), sem dados mockados.
2. O profissional consegue criar, editar e excluir uma avaliação.
3. Data da avaliação é obrigatória e visível na lista e no registro.
4. Os campos clínicos acima existem no formulário e são persistidos.
5. A primeira avaliação (data mais antiga) é marcada como inicial; as seguintes ficam disponíveis para comparação futura.
6. Upload de PDF com IA pode preencher um rascunho; o registro oficial é a ficha estruturada.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Reavaliações como módulo separado | REQ-05 cobre o registro datado; reavaliação usa o mesmo modelo |
| Relatórios comparativos de evolução | Depois; a data já permite comparar |
| Multi-clínica | Ainda não |
| Financeiro para empresa/equipe (rateio, comissão) | Só autônomo nesta fatia |
| Despesas, lucro e ticket da padaria (`FinancePage` bakery) | Fora do prontuário clínico |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-15 | Phase 3 | Complete |
| REQ-16 | Phase 4 | Complete |
| REQ-17 | Phase 5 | Complete |
| REQ-18 | Phase 6 | Complete |
| REQ-14 | Phase 2 | Implemented (SQL + UAT depois) |
| REQ-05 | Phase 1 | Deferred (SQL + UAT depois) |
| REQ-08 | Prior | Delivered |
| REQ-20 | Phase 8 | In Progress (UAT pendente) |
| REQ-21 | Phase 9 | Planned |
| REQ-22 | Phase 10 | Planned |
| REQ-23 | Phase 11 | Planned |
| REQ-24 | Phase 12 | Planned |
