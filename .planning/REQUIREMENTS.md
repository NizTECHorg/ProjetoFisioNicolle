# Requirements: Fisio — Prontuário clínico

**Defined:** 2026-08-31
**Core Value:** Documentar cada atendimento e manter a base clínica do paciente.

## Milestone atual

### Prontuário clínico

- [x] **REQ-08**: Evolução individual de cada sessão (entregue; SQL no Supabase)
- [x] **REQ-15**: Tipos de conta (autônomo / empresa / fisioterapeuta) e equipe na empresa
- [ ] **REQ-16**: Atalhos no dashboard para criar evolução ou avaliação
- [ ] **REQ-17**: Financeiro do autônomo — valores de consulta e arrecadação
- [ ] **REQ-14**: Metas do tratamento — objetivos por paciente com status e datas
- [ ] **REQ-05**: Registro da avaliação inicial estruturada *(adiado — retomar depois)*

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
| REQ-16 | Phase 4 | In Progress |
| REQ-17 | Phase 5 | Pending |
| REQ-14 | Phase 2 | Implemented (SQL + UAT depois) |
| REQ-05 | Phase 1 | Deferred (SQL + UAT depois) |
| REQ-08 | Prior | Delivered |
