# Phase 23: Ajustes do resumo IA e rolagem do Entenda o caso - Context

**Gathered:** 2026-10-04
**Status:** Ready for planning
**Source:** Decisões do profissional na invocação de `/gsd-plan-phase`

<domain>
## Phase Boundary

Corrigir a edição e a geração do resumo da fase 22, e impedir que o card Entenda o caso corte textos longos. Não reabrir o conjunto de cards nem o original da aba Resumo IA.

</domain>

<decisions>
## Implementation Decisions

### Edição na aba Resumo
- Editar todos os campos de texto do Resumo do paciente, não só o bloco Resumo IA.
- A edição acontece no texto dentro de cada caixa, de uma vez. Não abrir uma janela que mostre todos os campos juntos.
- A aba Resumo IA continua só com o original da última geração.

### Geração: fatos certos
- A IA deve pegar as informações certas do prontuário. O exemplo dado: o número de sessões já feitas está vindo errado. A contagem que vale é a das sessões concluídas, a mesma que o card Entenda o caso mostra, não um campo solto que possa estar desatualizado.
- Área de foco: marcar exatamente o que está no prontuário, mais o que a descrição adicional pediu ao criar o resumo. Sem região extra.

### Descrição adicional
- A descrição escrita antes de clicar em gerar tem 100% de atenção. Hoje ela é ignorada ou tratada como nota sem peso. Nesta fase ela é fonte, junto com o prontuário.

### Entenda o caso
- Quando queixa ou diagnóstico são longos, o texto não pode cortar a página.
- Nesse caso o card ganha um slider simples e minimalista, de baixa opacidade, para rolar de cima para baixo.
- Só essa mudança de overflow. Não redesenhar o restante do card.

### Claude's Discretion
- Como persistir a edição inline (blur, salvar por campo, ou um único save ao sair da caixa), desde que não volte o modal.
- Como contar sessões concluídas no pack da função (query das sessões vs coluna `sessions_done`).
- Como o prompt nomeia a descrição extra, desde que ela deixe de ser "NÃO CONFIÁVEL / só ênfase".

</decisions>

<canonical_refs>
## Canonical References

- `src/pages/PatientPage.tsx` — `ResumoDoPaciente`, `EntendaOCaso` (`line-clamp-3`)
- `src/components/patients/PatientSummaryEditorModal.tsx` — modal a retirar da edição
- `src/components/patients/PatientAiComposer.tsx` — campo de descrição adicional (`userHint`)
- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` — pack usa `patients.sessions_done`; `hintBlockFor` marca o pedido como NÃO CONFIÁVEL
- Fase 22: `22-CONTEXT.md`, `22-UI-SPEC.md`, `22-RESEARCH.md`

</canonical_refs>
