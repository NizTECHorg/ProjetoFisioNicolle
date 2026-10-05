# Phase 24: Atividades da avaliação - Context

**Gathered:** 2026-10-04
**Status:** Ready for planning
**Source:** Decisões do profissional na invocação de `/gsd-plan-phase`

<domain>
## Phase Boundary

Mudar só o bloco B (Atividades afetadas) da página 03 · Função da avaliação. Cada atividade passa a ter a própria capacidade. Não reabrir os blocos A, C–F nem as outras páginas da ficha.

</domain>

<decisions>
## Implementation Decisions

### Várias atividades
- No bloco B dá para registrar mais de uma atividade. O profissional escolhe uma (exemplo: correr), preenche o quanto consegue agora e o quanto conseguia antes, e depois adiciona outra (exemplo: agachar) com as próprias informações.

### Um bloco de capacidade
- Juntar Consigo por e Capacidade atual. Ficam só **capacidade atual** e **quanto conseguia antes**.
- Tirar o campo de texto **Atividade**. A atividade já está marcada em cima.

### Unidade de medida
- Em capacidade atual e em quanto conseguia antes dá para escolher uma unidade. Exemplos travados: minutos, km, repetições.
- O par valor + unidade fica formatado de forma clara, não como dois textos soltos.

### Claude's Discretion
- Como adicionar a próxima atividade (marcar na grade e abrir uma linha, ou um botão Adicionar), desde que cada atividade tenha o próprio par atual/antes.
- Como desenhar o seletor de unidade (lista, chips), desde que minutos, km e repetições existam e o layout fique limpo.
- Como gravar no `ficha` jsonb e como ler fichas antigas que ainda têm um único `capacidadeAtual` / `consigoPor` / `atividade`.
- Como o PDF e o catálogo de export mostram a lista nova.

</decisions>

<canonical_refs>
## Canonical References

- `src/components/patients/evaluation/EvaluationPage03.tsx` — bloco B, grade + quatro campos compartilhados
- `src/schemas/evaluationFicha.schema.ts` — `funcao.atividadesAfetadas`
- `src/lib/pdfFieldCatalog.ts` — grupo `03 · Função · Bloco B`
- `src/services/patientAiPdf.service.ts` — desenho do bloco B
- Fase 12: ficha 01–04 já persistida em jsonb

</canonical_refs>
