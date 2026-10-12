---
phase: 25-mobilidade-palpacao-e-testes
plan: 02
subsystem: evaluation
tags: [zod, preprocess, evaluation-ficha, mobilidade, palpacao, node-test]

requires:
  - phase: 25-mobilidade-palpacao-e-testes
    provides: normalizeMobilidade, normalizePalpacaoTestes e formatTestesParaColuna
provides:
  - evaluationFichaSchema consome linhas, ativo, passivo, bilateral, palpacao e testesClinicos
  - Submit grava a frase da coluna tests
  - Rascunho de PDF e legacyToFicha gravam testesRegistroAnterior
affects: [25-03, 25-04, 25-05]

tech-stack:
  added: []
  patterns:
    - "z.preprocess(normalize, schema).default({}) antes do strip, no mesmo encaixe de atividadesAfetadas"
    - "Coluna tests recebe só a string de formatTestesParaColuna"

key-files:
  created: []
  modified:
    - src/schemas/evaluationFicha.schema.ts
    - src/lib/mobilidadePalpacao.test.ts
    - src/components/patients/PatientEvaluationEditorForm.tsx
    - src/components/patients/PatientEvaluationPanel.tsx
    - src/services/evaluations.service.ts
    - src/lib/mobilidadePalpacao.ts

key-decisions:
  - "O preprocess fica fora do default({}) e o valor D/E continua optionalText, nunca z.number()"
  - "A coluna tests não usa values.tests como reserva: ficha vazia grava string vazia"
  - "Rascunho e legado escrevem o parágrafo em testesRegistroAnterior e deixam testes como array"

patterns-established:
  - "Pattern: chave velha some no strip depois do normalize copiar o que era atribuível"
  - "Pattern: emptyToNull continua recebendo string, nunca o objeto de palpacaoTestes"

requirements-completed: [REQ-36]

duration: 9min
completed: 2026-10-05
---

# Phase 25 Plan 02: Preprocess e escritores da ficha Summary

**O parse da ficha normaliza mobilidade e palpação antes do strip, e o submit grava a frase da coluna `tests` em vez de `testesClinicos`**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-05T23:10:16Z
- **Completed:** 2026-10-05T23:19:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `evaluationFichaSchema` devolve `regioes`, `achados` e `testes`. Uma string em `testesClinicos` não derruba a ficha, e `parse({})` continua igual a `emptyEvaluationFicha()`.
- Anamnese e `forca.linhas` sobrevivem. O segundo parse do objeto legado é idêntico ao primeiro.
- O editor espelha `formatTestesParaColuna`. O rascunho do PDF e `legacyToFicha` gravam `testesRegistroAnterior`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Preprocess no schema sem derrubar a ficha** - `87c8eaa` (test), `96ed22d` (feat)
2. **Task 2: Escritores usam registro anterior e a frase da coluna tests** - `8e5f17b` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/schemas/evaluationFicha.schema.ts` - `normalizeMobilidade` e `normalizePalpacaoTestes` via `z.preprocess`
- `src/lib/mobilidadePalpacao.test.ts` - Quatro casos REQ-36 de sobrevivência do parse
- `src/components/patients/PatientEvaluationEditorForm.tsx` - Coluna `tests` a partir da frase formatada
- `src/components/patients/PatientEvaluationPanel.tsx` - Rascunho grava `testesRegistroAnterior` e `testes: []`
- `src/services/evaluations.service.ts` - `legacyToFicha` aponta `tests` para `testesRegistroAnterior`
- `src/lib/mobilidadePalpacao.ts` - Laço da frase de ADM sem o binding `lado` que não era usado

## Decisions Made

- O preprocess usa o import relativo `.ts` e `.default({})` por fora, como `atividadesAfetadas`. Valor de D/E é `optionalText(80)`. Tipo, comparação, lado e achado usam `optionalEnum`. Não há enum gigante de catálogo.
- `shouldUnregister` permanece `false`. Se o formatador devolve `''`, a coluna `tests` grava essa string para o serviço aplicar `emptyToNull`. Não há reserva em `values.tests`.
- `resultados` continua recebendo `measurements`. `resolveEvaluationFicha` e `toRow` não mudaram.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Binding `lado` sem uso quebrava o lint do plano**
- **Found during:** Task 2 (Escritores usam registro anterior e a frase da coluna tests)
- **Issue:** O primeiro laço de `formatLinhaMovimento` declarava `lado` e não passava esse lado a `formatFraseAdm`. O `npm run lint` do plano falhava nesse erro, introduzido no plano 01.
- **Fix:** O laço passou a `for (const [, valor, dor] of lados)`. A frase não muda.
- **Files modified:** `src/lib/mobilidadePalpacao.ts`
- **Verification:** `node --test src/lib/mobilidadePalpacao.test.ts` continua verde, inclusive a frase travada. ESLint nos arquivos deste plano sai 0.
- **Committed in:** `8e5f17b`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Correção só para o lint. Sem pacote, sem SQL, sem mudança de catálogo.

## Issues Encountered

`npm run lint` no repositório inteiro ainda sai 1 por `adminUpdateProfile` em `src/services/modules.service.ts` (commit `957bd15`, anterior a esta fase) e pelos dois avisos já conhecidos em `state.cjs` e `AttendanceCounts.tsx`. Os arquivos deste plano passam no ESLint. Registrado em `deferred-items.md`. `npm run typecheck` e `npm run build` não rodaram: a página 04, o detalhe, o catálogo e o PDF ainda leem as chaves velhas.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- O schema já entrega a forma nova. O plano 03 pode trocar a página 04 para `regioes`, `achados` e `testes`.
- Detalhe, catálogo e PDF continuam nas chaves velhas até o plano 04. Não rodar typecheck do projeto antes disso.

## Self-Check: PASSED

- FOUND: src/schemas/evaluationFicha.schema.ts
- FOUND: src/lib/mobilidadePalpacao.test.ts
- FOUND: src/components/patients/PatientEvaluationEditorForm.tsx
- FOUND: src/components/patients/PatientEvaluationPanel.tsx
- FOUND: src/services/evaluations.service.ts
- FOUND: 87c8eaa
- FOUND: 96ed22d
- FOUND: 8e5f17b

## TDD Gate Compliance

Task 1 has a `test(25-02)` commit (`87c8eaa`) before the `feat(25-02)` commit (`96ed22d`). The four new tests failed on the old schema and pass after the preprocess.

---
*Phase: 25-mobilidade-palpacao-e-testes*
*Completed: 2026-10-05*
