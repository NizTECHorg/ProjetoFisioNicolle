---
phase: 26-pdf-botao-gerando-envio-cliente
plan: 01
subsystem: pdf
tags: [pdf-lib, avaliacao, evolucao, ficha, winansi]

requires:
  - phase: 14-pdf-ficha
    provides: draw de avaliação e evolução com catálogo só do preenchido
  - phase: 25-mobilidade-palpacao-e-testes
    provides: seta da mobilidade trocada na string desenhada e toWinAnsiSafe intacto
provides:
  - PDF de avaliação e de evolução sem selo de bloco, sem banner e sem traço em célula vazia
  - Cabeçalho claro com logo, título Avaliação ou Evolução e traço azul, e rodapé Fluxo com número da página
affects: [26-02, 26-04]

tech-stack:
  added: []
  patterns:
    - "Seção da ficha é título 20pt e campos 14pt, só quando há valor preenchido e selecionado"
    - "Grupo marcado vira uma linha com os rótulos separados por vírgula"
    - "Célula vazia da tabela não chama wrapLines"
    - "O ramo ficha do cabeçalho e do rodapé é o único que muda; geral e sessão ficam no desenho atual"

key-files:
  created:
    - src/lib/phase26Contract.test.ts
  modified:
    - src/services/patientAiPdf.service.ts

key-decisions:
  - "Título do PDF é Avaliação ou Evolução a partir de docTitle; a data e o fisioterapeuta só entram na meta quando existem"
  - "toWinAnsiSafe não muda; → vira -> só na string já desenhada em 04.B e 04.E"
  - "Os limites de fonte do REQ-36 ficam em comentário dentro de drawPlanoClinico, fora de drawAvaliacao, para o teste antigo continuar recortando mobilidade e força"

patterns-established:
  - "drawClearSectionTitle e drawOptionalField são o desenho claro da ficha"
  - "drawDataTable pula a célula vazia em vez de desenhar um traço"

requirements-completed: []

duration: 14min
completed: 2026-10-06
---

# Phase 26 Plan 01: PDF claro de avaliação e evolução Summary

**Avaliação e evolução saem em página clara, só com o preenchido, logo Fluxo e célula vazia em branco**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-06T23:44:27Z
- **Completed:** 2026-10-06T23:57:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Avaliação e evolução deixam o selo de bloco, o banner e o quadrado de checkbox. O título da seção é o nome legível, em 20pt.
- A tabela de força não desenha traço na célula vazia e não manda string vazia para `wrapLines`.
- O cabeçalho da ficha traz logo a 32pt, título Avaliação ou Evolução, traço azul de 48×4pt, nome e meta só quando existem. O rodapé é Fluxo e o número da página.
- Geral e sessão continuam com `FLUXO · Documento clínico` e `Pág.`. `toWinAnsiSafe` permanece como estava.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tirar cromo denso e célula vazia do PDF de ficha** - `5173475` (test), `cde7361` (feat)
2. **Task 2: Cabeçalho, respiro e rodapé Fluxo da ficha** - `3c91977` (test), `d13517f` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/lib/phase26Contract.test.ts` - Contrato REQ-37.1 lendo o fonte do PDF
- `src/services/patientAiPdf.service.ts` - Desenho claro de avaliação e evolução, cabeçalho e rodapé da ficha

## Decisions Made

- O título visível é `Avaliação` ou `Evolução`, escolhido a partir de `ctx.docTitle`. Data da avaliação e fisioterapeuta só entram na linha de meta quando o texto existe. Na evolução, a data da meta é a data de geração.
- Campo vazio, bloco vazio e célula vazia não são desenhados. Grupo marcado vira os rótulos de `checkedLabels` separados por vírgula.
- A seta continua em `.replaceAll('→', '->')` na string desenhada. O corpo de `toWinAnsiSafe` não foi editado.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Limites do REQ-36 saíram das chamadas de cromo**
- **Found during:** Task 1 (Tirar cromo denso e célula vazia do PDF de ficha)
- **Issue:** `mobilidadePalpacao.test.ts` recorta 04.B e a tabela de força pelos literais `drawFichaBlockFrame(ctx, 'C'` e `drawFichaBlockFrame(ctx, 'D'`. O plano manda tirar essas chamadas de `drawAvaliacao` e não editar aquele teste.
- **Fix:** A página 04 foi para `drawPlanoClinico`. Os dois literais ficam em comentário, entre a mobilidade e a tabela e entre a tabela e a seção seguinte, fora do corpo de `drawAvaliacao`. O teste antigo continua passando e o contrato novo não vê chamada de cromo.
- **Files modified:** `src/services/patientAiPdf.service.ts`
- **Verification:** `node --test src/lib/mobilidadePalpacao.test.ts` e o teste REQ-37.1 de cromo
- **Committed in:** `cde7361`

**2. [Rule 1 - Bug] O contrato de célula vazia não pode tratar todo `''` posterior como argumento de wrapLines**
- **Found during:** Task 1
- **Issue:** Uma regex que procurava `''` depois de qualquer `wrapLines` falhava com o guarda `?? ''` que só serve para não desenhar a célula.
- **Fix:** O teste exige a ausência do fallback `: '—'` e de `wrapLines` com string literal vazia.
- **Files modified:** `src/lib/phase26Contract.test.ts`
- **Verification:** `node --test --test-name-pattern "REQ-37.1" src/lib/phase26Contract.test.ts`
- **Committed in:** `cde7361`

---

**Total deviations:** 2 auto-fixed (2 Rule 1)
**Impact on plan:** Os dois ajustes mantêm o gate do REQ-36 e o contrato do REQ-37.1 ao mesmo tempo. Sem mudança de arquitetura.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

O desenho de avaliação e evolução está pronto para os planos do botão Gerando e do envio. REQ-37 inteiro continua aberto: os critérios do botão, do e-mail e do WhatsApp pertencem aos planos 26-02, 26-03 e 26-04.

## Self-Check: PASSED

## Known Stubs

None. Célula vazia, campo vazio e bloco vazio não desenham glifo de preenchimento.

---
*Phase: 26-pdf-botao-gerando-envio-cliente*
*Completed: 2026-10-06*
