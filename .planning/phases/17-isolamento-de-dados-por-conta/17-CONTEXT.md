# Phase 17: Isolamento de dados por conta - Context

**Gathered:** 2026-09-23
**Status:** Ready for planning
**Source:** Pedido em `/gsd-plan-phase` (decisões já fechadas pelo operador)

<domain>
## Phase Boundary

Uma conta não pode ver dados criados em outra conta. O caso que disparou a fase: a cliente criou uma conta só dela e viu no quadro uma tarefa criada na conta do operador. Isso não pode acontecer em nenhuma tela.

A fase cobre o site inteiro e todo tipo de dado digitável (pacientes, sessões, evoluções, avaliações, metas, áreas de foco, imagens, notas, quadro, financeiro, alertas, resumos, fotos). Também remove qualquer dado mockado ou de exemplo que ainda apareça no produto.

SQL novo vai para `.planning/phases/17-isolamento-de-dados-por-conta/sql/` e é aplicado no SQL Editor. Não usar `supabase db push`.

</domain>

<decisions>
## Implementation Decisions

### Isolamento
- **D-01:** Contas independentes não compartilham dados. Uma tarefa, paciente ou nota da conta A nunca aparece na conta B.
- **D-02:** O buraco do quadro é obrigatório, mas a fase procura o mesmo tipo de falha em todo dado digitável do site, no banco e nas consultas do app.
- **D-03:** A leitura e a escrita seguem o dono do registro. Não basta esconder no front se o banco ainda devolve a linha.
- **D-05:** O vazamento ocorreu de conta autônomo para conta autônomo. Autônomo nunca vê dados de outro autônomo.
- **D-06:** Quem está na mesma empresa continua vendo os dados dessa empresa. O isolamento novo não desfaz a equipe.

### Mocks
- **D-04:** Qualquer dado mockado, fixture de demonstração ou texto de exemplo que finja registro real sai do site. Telas vazias mostram estado vazio, não um paciente ou tarefa inventados.

### Claude's Discretion
- Ordem dos planos (mapa dos buracos, correção de políticas, limpeza de mocks), desde que D-01 a D-04 sejam cumpridos.
- Como nomear a coluna ou a política quando o padrão já existente de dono/organização puder ser reutilizado sem alargar o que cada conta vê.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Quadro (vazamento reportado)
- `src/services/board.service.ts` — leitura e escrita de colunas e cards
- `src/pages/KanbanPage.tsx` — quadro na interface

### Contas
- `src/lib/accountAccess.ts` — quem pode ver ou editar um paciente
- `.planning/phases/03-tipos-de-conta-e-equipe/` — modelo autônomo, empresa e fisioterapeuta já entregue

</canonical_refs>

<specifics>
## Specific Ideas

A cliente, com a conta recém-criada, viu uma tarefa do quadro que o operador tinha criado na conta dele. O restante do site precisa do mesmo isolamento: pacientes, notas e qualquer campo que o usuário preenche.

</specifics>

<deferred>
## Deferred Ideas

None — phase covers the isolation audit, the fixes, and mock removal.

</deferred>

---

*Phase: 17-isolamento-de-dados-por-conta*
*Context gathered: 2026-09-23*
