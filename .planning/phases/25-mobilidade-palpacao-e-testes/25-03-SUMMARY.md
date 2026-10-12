---
phase: 25-mobilidade-palpacao-e-testes
plan: 03
subsystem: evaluation
tags: [react-hook-form, useFieldArray, mobilidade, palpacao, testes, native-controls]

requires:
  - phase: 25-mobilidade-palpacao-e-testes
    provides: catálogos fechados e o schema de regioes, achados e testes
provides:
  - Bloco B escolhe região, marca movimento e mede D e E com dor por lado
  - Bloco E registra achado editável e lista testes com busca e Outro por último
  - EvaluationFichaForm passa setValue só para a página 04
affects: [25-04, 25-05]

tech-stack:
  added: []
  patterns:
    - "Checkbox de catálogo entra e sai do useFieldArray; desmarcar é remove, sem diálogo"
    - "Busca é useState e filtra com fold(label).includes(fold(query)), sem RegExp"
    - "Controle novo é input nativo; ForcaTable continua com Input"

key-files:
  created: []
  modified:
    - src/components/patients/evaluation/EvaluationPage04.tsx
    - src/components/patients/evaluation/EvaluationFichaForm.tsx

key-decisions:
  - "Trocar a região da mobilidade chama replace([]) nos movimentos, para a chave do catálogo anterior não ficar no array"
  - "O rascunho do achado e a busca de teste são useState; o Lado copia o markup do RadioRow sem virar campo da ficha"
  - "Salvar achado fica desabilitado com a região vazia, no mesmo travamento de Adicionar achado"

patterns-established:
  - "Pattern: D e E no mesmo grid, chip escreve o texto exato e o segundo clique limpa só aquele lado"
  - "Pattern: painel de dor é useState local; abrir D não escreve nem abre E"
  - "Pattern: Outro do teste continua por último quando algum outro item da região casa com a busca"

requirements-completed: [REQ-36]

duration: 14min
completed: 2026-10-05
---

# Phase 25 Plan 03: Blocos B e E da página 04 Summary

**Região e movimento com D/E e dor por lado no bloco B, e palpação por achado mais lista pesquisável de testes no bloco E**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-05T23:21:35Z
- **Completed:** 2026-10-05T23:36:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- O bloco B troca a tabela de texto e os três checks globais pelo cartão de região, tipo, comparação e movimento marcado.
- Cada movimento marcado mede D e E no mesmo campo, com chips Completo, Limitado e Não avaliado, e a dor de um lado não preenche o outro.
- O bloco E registra, edita e remove achado, e os testes são uma lista nativa com busca. Resultados relevantes, teste funcional e resultado inicial continuam `TextField`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Bloco B por região e movimento** - `28719b3` (feat)
2. **Task 2: Bloco E com achado e lista de testes** - `eb36918` (feat)

**Plan metadata:** docs commit of this summary

## Files Created/Modified

- `src/components/patients/evaluation/EvaluationPage04.tsx` - Blocos B e E novos; Força e os demais blocos permanecem
- `src/components/patients/evaluation/EvaluationFichaForm.tsx` - `setValue` só na página 04

## Decisions Made

- Trocar a região no cartão de mobilidade zera os movimentos com `replace([])`. A chave do catálogo anterior não pode permanecer no array enquanto os checkboxes da região nova aparecem desmarcados.
- O rascunho do achado não é campo da ficha. O lado usa o mesmo markup do `RadioRow` (legenda `text-xs text-muted`, rádio `accent-forest`) sem `register`.
- Salvar achado também fica `disabled` enquanto a região do rascunho está vazia, para não gravar um item que o schema exige com região.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Limpar movimentos ao trocar a região**
- **Found during:** Task 1 (Bloco B por região e movimento)
- **Issue:** O catálogo de movimentos muda com a região. Sem limpar o array, chaves da região anterior continuavam gravadas e os checkboxes novos pareciam desmarcados.
- **Fix:** O `onChange` do select chama `replace([])` no `useFieldArray` de movimentos.
- **Files modified:** `src/components/patients/evaluation/EvaluationPage04.tsx`
- **Verification:** ESLint do arquivo passou
- **Committed in:** `28719b3` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Correção para o array não guardar movimento de outra região. Sem pacote, sem SQL, sem detalhe, catálogo ou PDF.

## Issues Encountered

`npm run lint` no repositório inteiro ainda sai 1 por `adminUpdateProfile` em `src/services/modules.service.ts` (commit `957bd15`, anterior a esta fase) e pelos dois avisos já conhecidos. Os arquivos deste plano passam no ESLint. A suíte `node --test src/lib/mobilidadePalpacao.test.ts` passou (15 testes). `npm run typecheck` e `npm run build` não rodaram. A tela de avaliação exige login; o fluxo dos blocos B e E não foi exercido no browser.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- A página 04 já grava `mobilidade.regioes`, `palpacaoTestes.achados` e `palpacaoTestes.testes`.
- O plano 04 ainda precisa alinhar detalhe, catálogo e PDF. A aceitação 5 de REQ-36 (leitura, PDF e export) continua nele.
- Não rodar typecheck do projeto antes do plano 04.

## Self-Check: PASSED

- FOUND: src/components/patients/evaluation/EvaluationPage04.tsx
- FOUND: src/components/patients/evaluation/EvaluationFichaForm.tsx
- FOUND: 28719b3
- FOUND: eb36918

---
*Phase: 25-mobilidade-palpacao-e-testes*
*Completed: 2026-10-05*
