# Phase 27: Analítica no Financeiro - Context

**Gathered:** 2026-10-09
**Status:** Ready for planning
**Source:** Decisões do profissional na invocação de `/gsd-plan-phase` (discuss-phase pulado — intenção explícita)

<domain>
## Phase Boundary

Na aba Financeiro, a seção **Totais** passa a ter duas abas que se trocam. **Totais** continua com Este mês, Este ano e Sempre. **Analítica** mostra visões e gráficos simples e interativos sobre os mesmos pagamentos.

Não muda o catálogo de preços, a lista de realizadas, o valor na sessão nem quem pode abrir Financeiro. Sem SQL novo, sem `supabase/migrations` e sem `supabase db push`. Sem pacote npm novo. Não reabre a tela bakery `FinancePage`.

</domain>

<decisions>
## Implementation Decisions

### Duas abas
- A troca fica só na seção que hoje se chama Totais. Catálogo e realizadas continuam abaixo, sempre visíveis.
- Os nomes das abas são exatamente `Totais` e `Analítica`.
- `Totais` mostra os três cartões de hoje: Este mês, Este ano e Sempre, com a frase `Soma das sessões pagas, inclusive pré-pagas agendadas.`
- A aba escolhida fica na tela. Não vira rota nova.

### Analítica
- Três visões, simples:
  1. **Por mês** — barras do arrecadado nos últimos 12 meses, do mais antigo ao mais novo.
  2. **Por preço** — quanto entrou em cada nome de preço. Avulso sem nome de catálogo aparece como `Avulso`.
  3. **Contra o mês anterior** — o mês selecionado ao lado do mês imediatamente anterior, os dois em R$.
- O conjunto é o mesmo dos totais: cobrança com pago, inclusive sessão ainda agendada que já foi pré-paga. Não usar só as sessões com status realizada.
- Sem pagamento, a Analítica não desenha gráfico vazio nem número inventado. Mostra `Ainda não há pagamentos para analisar.`

### Interação
- Passar o mouse ou focar um ponto mostra o rótulo e o valor em R$.
- Clicar uma barra de mês seleciona esse mês. Por preço e Contra o mês anterior passam a falar desse mês.
- Sem clique, o mês selecionado é o mês corrente.
- Clicar de novo a mesma barra volta para o mês corrente.
- Com `prefers-reduced-motion`, os gráficos continuam e não animam.

### Claude's Discretion
- A forma exata da barra e do destaque do mês selecionado, desde que o gráfico seja simples, use as cores já do Fluxo e não pareça um painel de outro produto.
- Se Por preço, no mês selecionado, vira lista com barra ou barras horizontais, desde que o hover e o valor em R$ existam.
- O texto curto do tooltip, em português, sem dado de paciente.

### Filtros (adicionados ao refazer a fase, 2026-10-10)
- Três filtros na aba Analítica, acima dos gráficos: **Mês**, **Ano** e **Paciente**.
- Mês e Ano movem o mesmo mês selecionado das barras. Por mês passa a mostrar janeiro a dezembro do ano escolhido.
- Ano lista os anos com pagamento mais o ano corrente.
- Paciente: `Todos os pacientes` ou um paciente com cobrança paga. As três visões obedecem. Sem pagamento do paciente: `Nenhum pagamento deste paciente para analisar.`
- A leitura traz só `patient_id`; o nome vem da lista de pacientes já carregada (sem `full_name` na consulta financeira).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Financeiro atual
- `src/pages/AutonomoFinancePage.tsx` — seção Totais, cartões Este mês / Este ano / Sempre
- `src/services/finance.service.ts` — `fetchFinanceTotals` e `listFinanceRealizadas`
- `src/types/finance.ts` — `FinanceTotals`, `SessionCharge`
- `src/lib/accountAccess.ts` — `canSeeFinance`
- `.planning/phases/05-financeiro-autonomo/05-CONTEXT.md` — totais vêm de snapshot pago, inclusive pré-pago

### Gráfico que já existe
- `src/pages/DashboardPage.tsx` — `ActivityChart` em SVG, com hover, sem biblioteca de gráfico

### Fora desta fase
- `src/pages/FinancePage.tsx` — tela bakery; não editar
- `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` — não criar outro SQL

</canonical_refs>

<specifics>
## Specific Ideas

- Abas: `Totais` e `Analítica`.
- Visões: `Por mês`, `Por preço`, `Contra o mês anterior`.
- Vazio: `Ainda não há pagamentos para analisar.`
- SQL só pelo SQL Editor, e esta fase não pede SQL. Não criar `supabase/migrations`. Não rodar `supabase db push`.
- Sem pacote npm novo. Gráfico em SVG, no estilo do dashboard.

</specifics>

<deferred>
## Deferred Ideas

- Exportar a analítica em PDF ou planilha.
- Meta de faturamento, despesa, imposto ou lucro.
- Mudar o significado de Este mês, Este ano e Sempre.

</deferred>

<code_context>
## Existing Code Insights

### Reusable Assets
- Os três totais já vêm de `autonomo_finance_totals()`. A Analítica não substitui essa função.
- `formatCurrency` já formata R$.
- `ActivityChart` mostra como desenhar barra ou ponto em SVG com hover, sem pacote novo.

### Integration Points
- A data do pagamento não está na cobrança. Ela está em `patient_sessions.scheduled_at`. A leitura da Analítica junta a cobrança paga com a sessão do mesmo profissional.
- `listFinanceRealizadas` só traz status `realizada`. A Analítica não pode usar só essa lista, porque o total inclui pré-pago agendado.

</code_context>

---

*Phase: 27-analitica-financeiro*
*Context gathered: 2026-10-09*
