# Phase 4: Atalhos no dashboard - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

No dashboard (`/painel`), o profissional inicia uma **evolução** ou uma **avaliação** sem abrir a ficha primeiro. Escolhe o paciente, cai no formulário **já existente** (não um CRUD paralelo), e depois de salvar **volta ao dashboard**. Empresa em ficha de colega (consulta) não cria por esses atalhos. Autônomo, empresa nas próprias fichas e fisioterapeuta ativo usam os atalhos.

</domain>

<decisions>
## Implementation Decisions

### Depois de salvar
- **D-01:** Ao salvar, a pessoa **volta ao dashboard**, com toast de sucesso. O atalho existe para não entrar na ficha.
- **D-02:** Cancelar o formulário **fecha tudo** e volta ao dashboard — mesmo destino do salvar. Não volta à escolha do paciente.
- **D-03:** O toast inclui **“Ver ficha”**: um clique navega para `/pacientes/:id` na aba certa (`?aba=evolucoes` ou `?aba=avaliacao`).
- **D-04:** Para registrar outro paciente, **clica de novo no atalho** do dashboard. Sem “Salvar e registrar outra”. O fluxo fecha; o próximo começa do zero.

### Claude's Discretion
- **Destino do formulário:** D-01/D-02 exigem overlay no `/painel` (picker + form). Não navegar para a ficha no meio do atalho — a ficha só entra pelo “Ver ficha” do toast (D-03).
- **Reuso:** não criar segundo CRUD. Reutilizar o editor de `PatientEvolutionsPanel` / `PatientEvaluationPanel` (hoje já são `Modal`). Na ficha, evolução vive na sessão: o botão é “Nova sessão” (Agendar / Realizada, campos clínicos só em Realizada). O atalho “Nova evolução” abre esse mesmo editor de sessão+evolução; “Nova avaliação” abre o editor de avaliação. Planner escolhe *como* extrair/acionar o editor (prop de auto-abrir vs montar o painel no modal) sem duplicar schema/serviço.
- **Escolha do paciente:** seletor no overlay, a partir de `usePatients`. Só pacientes que `canWritePatient` permite (Phase 3 D-05/D-07). Empresa **não** vê fichas de colega no picker — esconder, não desabilitar. Busca por nome se a lista for longa; padrão `Modal` + `Input`/`Select` existentes.
- **Lista vazia:** atalhos visíveis mesmo sem pacientes; o picker explica e aponta para `/pacientes`. Não esconder os botões.
- **Onde ficam os botões:** ações no header do dashboard (`Nova evolução` / `Nova avaliação`) com `Button` existente. UI-SPEC pode ajustar layout; não substituir os quatro cards de métrica.
- **Erro ao salvar:** o formulário permanece aberto (só sucesso/cancelamento fecham). Toast de erro no padrão atual.
- **Toast “Ver ficha”:** estender o toast atual se precisar de ação/link; não inventar um segundo sistema de notificação.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisito
- `.planning/REQUIREMENTS.md` — REQ-16 (acceptance 1–4)
- `.planning/ROADMAP.md` — Phase 4 goal e success criteria
- `.planning/PROJECT.md` — Active REQ-16; camada page → hooks → services → Supabase
- `.planning/phases/03-tipos-de-conta-e-equipe/03-CONTEXT.md` — D-05/D-07 (ficha de quem cadastrou; empresa só consulta)

### Dashboard e ficha
- `src/pages/DashboardPage.tsx` — `/painel`; header + cards; sem ações de criar hoje
- `src/pages/PatientPage.tsx` — `canWritePatient`; abas via `?aba=`; monta os painéis
- `src/components/patients/PatientEvolutionsPanel.tsx` — “Nova sessão” + Modal Agendar/Realizada (evolução na sessão)
- `src/components/patients/PatientEvaluationPanel.tsx` — “Nova avaliação” + editor existente
- `src/lib/accountAccess.ts` — `canWritePatient` (UX; RLS é a autoridade)

### Padrões
- `src/hooks/usePatients.ts` — lista de pacientes para o seletor
- `src/stores/toast.store.ts` — toasts atuais (estender se D-03 precisar de ação)
- `src/components/ui/Button.tsx` / `Modal.tsx` / `Input.tsx` / `Select.tsx` — primitivos; não shadcn
- `.planning/codebase/CONVENTIONS.md` — camadas, `canWrite`, esconder controles (não disabled)
- `.planning/codebase/STRUCTURE.md` — painéis em `components/patients/`; dashboard em `pages/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PatientEvolutionsPanel` / `PatientEvaluationPanel`: já abrem o create em `Modal`; aceitam `canWrite`
- `usePatients` + `PatientListItem`: fonte do seletor; `createdBy` existe para `canWritePatient`
- `Modal`, `Button`, `Input`, `Select`, `PageHeader` em `src/components/ui/`
- `toast()` em `src/stores/toast.store.ts`
- Rotas da ficha: `/pacientes/:id?aba=evolucoes|avaliacao`

### Established Patterns
- Camadas page → hooks → services → Supabase; sem CRUD novo nesta fase
- `canWrite` esconde botões; não desabilita controles que parecem clicáveis (Phase 3)
- Formulários Zod + react-hook-form já nos painéis — atalho só dispara o editor
- Query keys `['patients']` etc.; invalidar após save para o dashboard refletir sessão/avaliação
- UI em português; lista vazia sem placeholders fake

### Integration Points
- `DashboardPage`: único lugar dos botões de atalho
- `canWritePatient(user.id, patient.createdBy)` no picker e ao abrir o editor
- Empresa vê colegas na listagem geral; o **picker do atalho** filtra só writable
- Após save: fechar overlay, toast com “Ver ficha”, permanecer em `/painel`
- Não mexer em `/financeiro`, bakery `FinancePage`, nem SQL de REQ-05/REQ-14

### Creative options
- Prop `initialCreate` nos painéis vs wizard (paciente → editor) só no dashboard — planner escolhe, desde que o editor seja o mesmo
- Toast com `action`/`href` vs toast + botão irmão; o contrato de produto é D-03

</code_context>

<specifics>
## Specific Ideas

- Dois atalhos no dashboard: Nova evolução e Nova avaliação
- Salvar ou cancelar → de volta ao `/painel`
- Toast de sucesso com “Ver ficha” para a aba correspondente
- Próximo registro = clicar de novo no atalho

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 4-atalhos-dashboard*
*Context gathered: 2026-09-14*
