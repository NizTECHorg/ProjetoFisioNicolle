---
phase: 25-mobilidade-palpacao-e-testes
plan: 04
subsystem: evaluation
tags: [pdf, catalog, detail, mobilidade, palpacao, winansi]

requires:
  - phase: 25-mobilidade-palpacao-e-testes
    provides: formatadores da frase e a página 04 sem as chaves velhas
provides:
  - Detalhe, preview 04.B / 04.E e PDF desenham a mesma frase de região, movimento, achado e teste
  - A seta da ADM vira -> só na string que entra no draw
affects: [25-05]

tech-stack:
  added: []
  patterns:
    - "Os três leitores chamam o formatador e passam string, nunca o objeto"
    - "O preview é a primeira linha; a frase inteira fica no detalhe e no PDF"
    - "replaceAll de → por -> acontece só no draw de 04.B e 04.E"

key-files:
  created: []
  modified:
    - src/components/patients/evaluation/EvaluationFichaDetail.tsx
    - src/lib/pdfFieldCatalog.ts
    - src/services/patientAiPdf.service.ts
    - src/lib/mobilidadePalpacao.ts
    - src/lib/mobilidadePalpacao.test.ts

key-decisions:
  - "O PDF troca → por -> só na string de 04.B e 04.E; toWinAnsiSafe permanece global"
  - "O preview usa a primeira linha formatada, com corte de 40 caracteres já existente"
  - "Tipo, comparação, lado e achado entram no formatador como string, porque o schema infere o enum assim"

patterns-established:
  - "Pattern: detalhe, catálogo e PDF chamam formatCabecalhoRegiao, formatLinhaMovimento, formatAchado e formatTeste"
  - "Pattern: hasMob e hasPalp consideram região, achado, teste marcado e registro anterior"

requirements-completed: [REQ-36]

duration: 8min
completed: 2026-10-05
---

# Phase 25 Plan 04: Leitura, catálogo e PDF Summary

**Detalhe, catálogo e PDF da seção 04 mostram a mesma frase de região, movimento, achado e teste, e a seta vira -> só no draw**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-05T23:38:50Z
- **Completed:** 2026-10-05T23:47:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- A leitura da ficha lista cada região, cada achado e os testes com a frase do helper, em string, e o registro anterior entra com esse rótulo.
- O preview de 04.B e 04.E e o draw do PDF usam os mesmos formatadores. A grade de cinco colunas saiu do bloco B.
- `npm run typecheck` passa depois que a página, o detalhe, o catálogo e o PDF deixaram de ler as chaves velhas.

## Task Commits

Each task was committed atomically:

1. **Task 1: Detalhe da seção 04 usa a frase do helper** - `7cc27a7` (feat)
2. **Task 2: Catálogo e PDF, depois o typecheck** - `a6aad5c` (test), `47fa7bc` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/components/patients/evaluation/EvaluationFichaDetail.tsx` - Folhas de região, achado, testes e registro anterior a partir dos formatadores
- `src/lib/pdfFieldCatalog.ts` - Preview e `filled` de 04.B e 04.E
- `src/services/patientAiPdf.service.ts` - Draw de 04.B e 04.E em linhas, com `->` no lugar da seta
- `src/lib/mobilidadePalpacao.ts` - Entrada dos formatadores aceita a string que o schema infere
- `src/lib/mobilidadePalpacao.test.ts` - Teste de fonte dos leitores 04.B e 04.E

## Decisions Made

- A seta `→` continua no detalhe e no preview. Só a string que entra em `drawOptionalField` nos blocos 04.B e 04.E troca por `->`. `toWinAnsiSafe` não foi alterado.
- O preview é `previewFrom` da primeira linha formatada. A frase inteira fica no detalhe e no PDF.
- Tipo, comparação, lado e achado são `string` na entrada do formatador. O `in` no mapa de rótulos continua descartando valor fora do catálogo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Formatadores aceitam o enum inferido como string**
- **Found during:** Task 2 (Catálogo e PDF, depois o typecheck)
- **Issue:** `optionalEnum` no schema infere `tipo`, `comparacao`, `lado` e `achado` como `string`. Os formatadores exigiam a união fechada, e o typecheck quebrava nos três leitores.
- **Fix:** A entrada passou a ser `string`. O acesso ao rótulo continua atrás do `in` no mapa.
- **Files modified:** `src/lib/mobilidadePalpacao.ts`
- **Verification:** `npm run typecheck` e `node --test src/lib/mobilidadePalpacao.test.ts`
- **Committed in:** `47fa7bc`

**2. [Rule 3 - Blocking] Teste do catálogo lia `key` possivelmente indefinida**
- **Found during:** Task 2 (Catálogo e PDF, depois o typecheck)
- **Issue:** `regiao.movimentos[0]?.key.length` já falhava o typecheck em `mobilidadePalpacao.test.ts` antes deste plano. Este é o primeiro plano da fase que roda o typecheck.
- **Fix:** A comparação usa `(regiao.movimentos[0]?.key ?? '').length`.
- **Files modified:** `src/lib/mobilidadePalpacao.test.ts`
- **Verification:** `npm run typecheck`
- **Committed in:** `47fa7bc`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Os dois ajustes eram necessários para o typecheck fechar. A frase e os leitores seguem o plano.

## Issues Encountered

- `npm run lint` no repositório inteiro continua falhando em `src/services/modules.service.ts`, já registrado em `deferred-items.md`. `EvaluationFichaDetail.tsx` passa no eslint. Este plano não rodou `npm run build`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O plano 05 pode rodar o build e a verificação visual: detalhe, preview e PDF já compartilham a frase, e a grade antiga de mobilidade não é mais desenhada.

## Self-Check: PASSED

- FOUND: src/components/patients/evaluation/EvaluationFichaDetail.tsx
- FOUND: src/lib/pdfFieldCatalog.ts
- FOUND: src/services/patientAiPdf.service.ts
- FOUND: 7cc27a7
- FOUND: a6aad5c
- FOUND: 47fa7bc

---
*Phase: 25-mobilidade-palpacao-e-testes*
*Completed: 2026-10-05*
