# Phase 22: Resumo do paciente editável e preenchido pela IA - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning
**Source:** Decisões do profissional na invocação de `/gsd-plan-phase`

<domain>
## Phase Boundary

A geração de resumo passa a preencher o Resumo do paciente inteiro, com um esquema de campos fixo para todos os pacientes. Só o último resultado fica salvo. A aba Resumo IA mostra o original dessa geração. A edição do texto fica na aba Resumo.

</domain>

<decisions>
## Implementation Decisions

### Persistência
- Salvar apenas o último resumo de IA. Uma geração nova substitui a anterior. Sem histórico de versões.
- O texto original da geração e o texto editado pelo profissional são coisas distintas: editar não apaga o original mostrado na aba Resumo IA.

### Onde se edita
- A edição acontece na aba Resumo (Resumo do paciente), não na aba Resumo IA.
- A aba Resumo IA fica só com o resumo original criado pela IA.

### O que a geração preenche
- A IA preenche todas as caixas do Resumo do paciente que esta fase definir, não só o bloco Resumo IA.
- Áreas de foco entram nessa geração: a IA marca as regiões que o prontuário sustenta.
- O conjunto de campos é global. Não muda de paciente para paciente. A escolha é feita agora e vale para todo mundo.
- Se um card atual não puder ser preenchido com as informações que a IA tem (o exemplo dado foi Programa), ele é substituído agora, para todos, por um campo que a IA consiga preencher. Não deixar o card vazio como desculpa.

### Prompt
- O system prompt da função de resumo é reescrito para esta tarefa: quais campos existem, o que cada um significa, e que a IA só afirma o que está no prontuário.

### Claude's Discretion
- Quais cards atuais (Programa, Condutas, Evolução geral, Dor) permanecem e quais são trocados, desde que o conjunto final seja único, preenchível pela IA e igual para todos.
- Como separar no banco o texto original do texto editado, desde que a UI obedeça as duas abas.
- A série de EVA e a lista de objetivos continuam vindo dos registros reais se a IA não tiver como produzi-los sem inventar números ou metas. Nesse caso o card é trocado ou permanece como dado clínico já gravado, nunca como número inventado.

</decisions>

<canonical_refs>
## Canonical References

- `src/pages/PatientPage.tsx` — `ResumoDoPaciente` (cards Programa, Evolução geral, Condutas, Dor, Áreas de foco, Objetivos, bloco Resumo IA)
- `src/services/patientAi.service.ts` — geração que hoje grava `ai_summary` e marca regiões de foco
- `src/components/patients/PatientResumoIaPanel.tsx` — aba Resumo IA
- Screenshot do resumo vazio anexado em 2026-10-03

</canonical_refs>
