# Phase 30: Assinatura desenhada na avaliação - Context

**Gathered:** 2026-10-10
**Status:** Ready for planning
**Source:** Pedido do profissional ("a maneira mais simples e leve") + respostas. discuss-phase, pesquisa e UI-SPEC pulados por escolha do usuário.

<domain>
## Phase Boundary

Página 04 da avaliação, bloco **ID — Identificação profissional**: o campo `Assinatura` (hoje `LineField` de texto, `ficha.avaliacaoPlano.profissional.assinatura`, até 200 chars) passa a ser um quadro de desenho. Não muda Fisioterapeuta, CREFITO nem Data. Sem SQL, sem storage, sem pacote npm.

</domain>

<decisions>
## Implementation Decisions

### Abordagem (a mais leve)
- Componente próprio em **SVG + Pointer Events** (mouse, toque e caneta). Sem `<canvas>`, sem biblioteca.
- Traço preto (`#000`), largura ~2.5, `stroke-linecap/linejoin` round, `fill="none"`.
- O desenho é guardado como **um único path SVG** (`M x y L x y ... M ...`) em coordenadas inteiras de um viewBox fixo (ex.: 600×160). Pontos a menos de ~2px do anterior são descartados para manter o texto pequeno.
- Campo novo no schema: `ficha.avaliacaoPlano.profissional.assinaturaTraco` (`optionalText` com limite generoso, ex.: 20000). O campo `assinatura` (texto) continua no schema para avaliações antigas.
- Persistência: o mesmo save da ficha que já existe (JSON da avaliação). Sem SQL.

### Interação
- `touch-action: none` no quadro para não rolar a página ao desenhar; `setPointerCapture` no pointerdown.
- Botão `Apagar assinatura` (variante secundária/ghost) limpa o traço; depois dá para desenhar de novo. Desabilitado quando vazio ou quando a ficha está `disabled`.
- Com `disabled` (somente leitura), mostra o desenho sem permitir desenhar.
- Quadro com borda `border-line`, fundo branco, cantos arredondados, altura ~160px, linha-guia discreta embaixo; texto de apoio `Assine com o mouse ou o dedo.` quando vazio.

### Avaliações antigas
- Se `assinatura` (texto) tiver conteúdo e `assinaturaTraco` estiver vazio: mostrar o texto antigo acima do quadro (`Assinatura registrada como texto: …`).
- Ao desenhar, `assinatura` (texto) é limpo — o desenho substitui o texto.

### PDF
- `src/services/patientAiPdf.service.ts` (bloco "Identificação profissional"): quando houver `assinaturaTraco`, desenhar o path com `page.drawSvgPath` (pdf-lib) em escala para caber numa caixa (~180×48pt), traço preto; senão, manter o texto antigo como hoje.
- `textFilled` de assinatura em `pdfFieldCatalog.ts` e `patientAiPdf.service.ts` considera `assinaturaTraco` também.

### Claude's Discretion
- Nome/local do componente (ex.: `src/components/patients/evaluation/SignaturePad.tsx`) e helpers puros (ex.: `src/lib/signaturePath.ts` para montar/simplificar/escalar o path) com teste `node:test`.
- Ajuste fino de espessura e simplificação.

</decisions>

<canonical_refs>
## Canonical References

- `src/components/patients/evaluation/EvaluationPage04.tsx` — bloco ID (linha ~1600)
- `src/components/patients/evaluation/fichaFormPrimitives.tsx` — `LineField`
- `src/schemas/evaluationFicha.schema.ts` — `profissional`
- `src/lib/pdfFieldCatalog.ts` (~672) e `src/services/patientAiPdf.service.ts` (~1336, ~1463) — PDF
- `src/components/patients/evaluation/EvaluationFichaDetail.tsx` — visualização da ficha (verificar se mostra assinatura)

## Atenção
- `src/services/patientAiPdf.service.ts` tem alterações NÃO commitadas do usuário (só indentação, linhas ~240 e ~344). Ao commitar, use `git add -p` e stage só os hunks desta fase; nunca reverta nem commite os hunks do usuário.
- Também não tocar/stagear: `src/components/patients/DashboardClinicalShortcut.tsx`, `src/pages/DashboardPage.tsx`, `.planning/phases/27-analitica-financeiro/.gitkeep`.

</canonical_refs>

<deferred>
## Deferred Ideas
- Cores/espessuras, desfazer traço a traço.
- Assinatura do paciente.
- Assinatura em evolução.
</deferred>

---
*Phase: 30-assinatura-desenhada-na-avalia-o*
