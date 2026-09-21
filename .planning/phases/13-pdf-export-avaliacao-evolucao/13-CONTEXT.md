# Phase 13 — PDF export Avaliação / Evolução

**Gathered:** 2026-09-20  
**Status:** Ready for planning  
**Source:** User request via `/gsd-plan-phase` (discuss skipped — intent explicit + ficha style refs)

<domain>
## Phase Boundary

Refatorar o export PDF do Resumo IA (antes: “Avaliação salva” / “Por sessão”) para duas seções claras: **Avaliação** e **Evolução**. Em ambos, o profissional escolhe quais campos preenchidos entram no PDF (todos marcados por padrão; desmarca o que o cliente não deve ver). Evolução permite **várias sessões**; a IA agrega/avalia os dados dessas sessões. O PDF visual segue o estilo das fichas de referência (blocos A–…, bordas, tipografia), mostrando **somente** campos selecionados.

</domain>

<decisions>
## Implementation Decisions

### D-01 — Duas seções de export: Avaliação | Evolução
No composer PDF do Resumo IA, substituir rótulos/escopos atuais (“Avaliação salva”, “Por sessão”) por:
1. **Avaliação** — PDF a partir de uma avaliação musculoesquelética salva (`patient_evaluations` / ficha)
2. **Evolução** — PDF a partir de uma ou mais sessões/evoluções do paciente

Não confundir com a aba Avaliações (CRUD). Isto é só o fluxo de **exportar PDF**.

### D-02 — Seletor de campos (só preenchidos; todos on por padrão)
Antes de gerar o PDF:
- Listar **apenas campos/blocos que têm conteúdo** na fonte escolhida
- Todos vêm **selecionados**
- Usuário **desmarca** o que não deve ir (privacidade / cliente)
- PDF renderiza só o selecionado

Granularidade (campo vs bloco A/B/C…): Claude’s discretion — preferir blocos + campos sensíveis destacados se lista ficar enorme; deve ser usável no mobile.

### D-03 — Avaliação: uma avaliação + picker
Mantém escolha da avaliação (incl. “mais recente”). Depois o field-picker sobre o `ficha` dessa avaliação. Estilo PDF alinhado às refs (01–04 / blocos).

### D-04 — Evolução: multi-sessão + IA agrega
Usuário seleciona **uma ou mais** sessões (evoluções). A IA recebe o pacote clínico dessas sessões (e contexto mínimo do paciente se necessário) e produz conteúdo para o PDF de evolução — não limitar a uma única sessão. Campo-picker também se aplica ao que for exportado (campos preenchidos das sessões + trechos gerados pela IA, conforme research).

### D-05 — Visual do PDF ≈ fichas de referência
Layout com blocos rotulados, bordas, hierarquia tipográfica semelhante às imagens em `refs/` — adaptado à marca FLUXO. Sem inventar dados; omissões = campos não selecionados ou vazios.

### D-06 — Persistência / lista “Avaliações salvas”
PDFs continuam salvos na lista do Resumo IA (Storage + `patient_ai_reports`). Ajustar `kind`/rótulos UI se necessário (evolução vs avaliação) — research decide se precisa SQL novo ou reusa `geral`/`sessao` com metadata.

### D-07 — Fora de escopo
- Redesign da aba Avaliações CRUD
- Phase 8–11 UAT pendente
- Impressão idêntica ao papel A4 da clínica
- Export sem autenticação / link público

### Claude's Discretion
- Campo vs bloco no picker
- EF nova vs estender `patient-ai-summary` para síntese de evolução multi-sessão
- Schema `kind` no Storage (`evolucao` vs reuso)
- Onde montar o picker (Modal step vs inline no composer)

</decisions>

<canonical_refs>
## Canonical References

### Estilo PDF (obrigatório)
- `.planning/phases/13-pdf-export-avaliacao-evolucao/refs/01-anamnese-inicial.png`
- `.planning/phases/13-pdf-export-avaliacao-evolucao/refs/02-comportamento-sintomas.png`
- `.planning/phases/13-pdf-export-avaliacao-evolucao/refs/04-avaliacao-plano.png`

### Código / fases
- `src/components/patients/PatientAiComposer.tsx`
- `src/services/patientAiPdf.service.ts`
- `src/schemas/patientAi.schema.ts` / `evaluationFicha.schema.ts`
- `.planning/phases/12-avaliacoes-musculoesqueleticas/12-CONTEXT.md` (ficha modelo)
- `.planning/phases/11-resumo-ia/11-CONTEXT.md` (composer + Storage)

</canonical_refs>

<specifics>
## Specific Ideas

- UX: seção Avaliação | Evolução → escolher fonte → checklist de campos → Exportar
- Defaults: tudo marcado; “Desmarcar sensíveis” opcional (discretion)
- Evolução multi-select de sessões + chamada IA para síntese

</specifics>

<deferred>
## Deferred Ideas

- Templates de exclusão salvos por profissional
- Watermark “uso interno” automático
- Comparativo visual entre duas avaliações no mesmo PDF

</deferred>

---

*Phase: 13-pdf-export-avaliacao-evolucao*  
*Context gathered: 2026-09-20*
