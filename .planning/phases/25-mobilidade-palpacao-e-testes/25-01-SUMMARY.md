---
phase: 25-mobilidade-palpacao-e-testes
plan: 01
subsystem: evaluation
tags: [catalog, normalize, node-test, mobilidade, palpacao]

requires:
  - phase: 24-atividades-avaliacao-capacidade-e-unidade
    provides: fold NFD, clamp sem lançar e forma nova idempotente
provides:
  - Catálogos fechados de mobilidade, palpação e testes
  - normalizeMobilidade e normalizePalpacaoTestes sem copiar grau nem lado da dor
  - Formatadores únicos da frase compacta, da ADM e da coluna tests
affects: [25-02, 25-03, 25-04, 25-05]

tech-stack:
  added: []
  patterns:
    - "Catálogo { key, label } com chave fold só a-z0-9, única dentro da região"
    - "Match legado por igualdade do rótulo dobrado; ambíguo vai para registro anterior"
    - "Uma função de frase para detalhe, catálogo e PDF"

key-files:
  created:
    - src/lib/mobilidadePalpacao.ts
    - src/lib/mobilidadePalpacao.test.ts
  modified: []

key-decisions:
  - "Rótulo ambíguo não escolhe a primeira região: Flexão fica no registro e Flexão de quadril marca só Quadril / Flexão"
  - "resultados, testeFuncional e resultadoInicial cortam em 2000 para caber no optionalText do plano 02"

patterns-established:
  - "Pattern: formatMovimentoCompacto, formatDor e formatFraseAdm são a única frase de leitura"
  - "Pattern: segunda chamada de cada normalize é deep-equal à primeira"

requirements-completed: [REQ-36]

duration: 16min
completed: 2026-10-05
---

# Phase 25 Plan 01: Catálogos e migração da ficha antiga Summary

**Catálogos fechados (13/71, 20/192, 12/120) com normalize que manda Flexão ambígua ao registro e Flexão de quadril só para o quadril, mais a frase `Flexão de quadril: ADM 115° → dor inicia aos 90°`**

## Performance

- **Duration:** 16 min
- **Started:** 2026-10-05T22:50:44Z
- **Completed:** 2026-10-05T23:07:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Os três catálogos copiam os rótulos do contexto, com `outro` no fim de cada palpação, `Outro` no fim de cada região de teste, `PIP` e `DIP` separados, e `O’Brien` em U+2019.
- `normalizeMobilidade` não lança, não copia um grau para cinco regiões e não preenche o painel de dor com o texto antigo.
- `normalizePalpacaoTestes` marca só rótulo dobrado único (`Schober`), deixa `Schober: 5 cm`, `PA central` e `distração` no registro, e devolve string em `formatTestesParaColuna`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Catálogos fechados e frases travadas** - `bc46376` (test), `0286f77` (feat)
2. **Task 2: Normalizar sem copiar valor nem escolher lado da dor** - `3b5f06c` (test), `0e1b41f` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/lib/mobilidadePalpacao.ts` - Catálogos, normalize e formatadores puros
- `src/lib/mobilidadePalpacao.test.ts` - Casos REQ-36 do helper, sem o schema

## Decisions Made

- A chave é o `fold` da fase 24 seguido da remoção do que não é `a-z` ou `0-9`. Ela é única dentro da região, então `flexao` pode existir em ombro e em quadril.
- O match, nesta ordem, é rótulo inteiro único, segmento depois de ` / ` se continuar único, e composição `{movimento} de {região}` ou `{região} {movimento}` só para o rótulo curto. Mais de uma região manda a linha inteira ao registro anterior.
- Dor e observação antigas se unem em `observacao` do movimento. `dorDireito` e `dorEsquerdo` só entram na forma já nova, com máxima entre 0 e 10.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Teto de 2000 nos três textos livres do bloco E**
- **Found during:** Task 2 (Normalizar sem copiar valor nem escolher lado da dor)
- **Issue:** `resultados`, `testeFuncional` e `resultadoInicial` passam adiante como texto. Sem teto, uma string maior que 2000 faria o `optionalText(2000)` do plano 02 rejeitar a ficha inteira.
- **Fix:** O normalize corta os três em 2000, no mesmo espírito dos outros tetos que não lançam.
- **Files modified:** `src/lib/mobilidadePalpacao.ts`, `src/lib/mobilidadePalpacao.test.ts`
- **Verification:** `REQ-36: distração solta não marca cervical nem Waddell` exige `resultados` com comprimento 2000
- **Committed in:** `0e1b41f` (feat da Task 2; o teste está em `3b5f06c`)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** O corte evita que o preprocess do plano 02 derrube a ficha. Não muda catálogo, match nem frase.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O plano 02 pode importar `normalizeMobilidade` e `normalizePalpacaoTestes` por caminho relativo com `.ts` e colocar os dois no `z.preprocess`.
- A página, o detalhe, o catálogo e o PDF ainda leem `linhas`, `palpacao` e `testesClinicos`. Este plano não rodou `npm run typecheck`.

## Self-Check: PASSED

- FOUND: src/lib/mobilidadePalpacao.ts
- FOUND: src/lib/mobilidadePalpacao.test.ts
- FOUND: bc46376
- FOUND: 0286f77
- FOUND: 3b5f06c
- FOUND: 0e1b41f

## TDD Gate Compliance

- `test(25-01)` `bc46376` precede `feat(25-01)` `0286f77`
- `test(25-01)` `3b5f06c` precede `feat(25-01)` `0e1b41f`

---
*Phase: 25-mobilidade-palpacao-e-testes*
*Completed: 2026-10-05*
