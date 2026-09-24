---
phase: 17-isolamento-de-dados-por-conta
plan: 02
subsystem: ui
tags: [gemini, localStorage, fnv1a, physical-evaluation, d-04]

requires:
  - phase: 17-isolamento-de-dados-por-conta
    provides: Account isolation SQL from plan 17-01; this plan does not change policies
provides:
  - analyzePhysicalEvaluationPdf fails closed without VITE_GEMINI_API_KEY
  - PatientPhysicalEvaluationPanel drops only the saved simulated report by FNV-1a 64 digest
affects:
  - 17-03 still owns the board owner stamp and the empty-board copy
  - REQ-28 stays open until plan 17-03

tech-stack:
  added: []
  patterns:
    - Missing Gemini key throws a Portuguese Error and never returns clinical text
    - Invented localStorage rows are recognized by digest, not by the eval_ id prefix

key-files:
  created: []
  modified:
    - src/services/aiPhysicalEvaluation.service.ts
    - src/components/patients/PatientPhysicalEvaluationPanel.tsx

key-decisions:
  - "Without VITE_GEMINI_API_KEY, analyzePhysicalEvaluationPdf throws and does not invent a report (D-04)"
  - "Saved simulated report is discarded only when cinesiologicDiagnosis FNV-1a 64 equals d7513069ba374c9f; eval_ ids with another diagnosis stay"

patterns-established:
  - "Fail closed: no API key means no clinical object, including empty fields"
  - "Do not delete every eval_ row; real Gemini results use that prefix"

requirements-completed: []  # REQ-28 is phase-level; 17-03 still owns the board stamp and empty-board copy

duration: 3min
completed: 2026-09-24
---

# Phase 17 Plan 02: Laudo inventado removido Summary

**Sem chave do Gemini a análise do PDF lança erro em português, e a ficha descarta só o laudo já salvo cujo diagnóstico tem digest FNV-1a 64 `d7513069ba374c9f`.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-24T02:18:42Z
- **Completed:** 2026-09-24T02:21:30Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- `analyzePhysicalEvaluationPdf` não espera 1,8s nem devolve queixa, diagnóstico ou metas inventados. Sem `VITE_GEMINI_API_KEY` lança `A análise do PDF precisa da chave da IA. Sem ela, nenhum laudo é gerado.`
- O ramo com chave permanece: `id` `eval_${Date.now()}`, fallbacks quando o modelo omite um campo, e os throws `Falha no Google Gemini` / `Falha na IA do Google Gemini`
- A hidratação de `fisio.evaluations.${patientId}` remove só o item cujo `cinesiologicDiagnosis` tem digest FNV-1a 64 `d7513069ba374c9f`. JSON inválido ou valor que não é array vira lista vazia. O `useEffect` grava o estado já filtrado
- O `catch` mostra `err.message` quando o erro é `Error` com mensagem não vazia. A lista não recebe um objeto novo quando a função lança

## Task Commits

Each task was committed atomically:

1. **Task 1: Sem chave, o serviço não devolve laudo** - `d0e41e4` (feat)
2. **Task 2: Descartar o laudo já gravado e mostrar o erro** - `8473bbc` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/services/aiPhysicalEvaluation.service.ts` — Falha fechada sem chave; JSDoc deixa de prometer simulação
- `src/components/patients/PatientPhysicalEvaluationPanel.tsx` — Filtro FNV-1a 64 na leitura do localStorage e mensagem do serviço no painel

## Decisions Made

- Sem chave, o serviço lança erro e não persiste texto clínico inventado (D-04). A frase do diagnóstico simulado não fica em `src/`
- O item antigo é reconhecido pelo digest, não pelo prefixo `eval_`, porque o sucesso real continua usando `eval_${Date.now()}`
- REQ-28 não foi marcado como concluído. O plano 17-03 ainda cobre o carimbo de dono no quadro e o estado vazio sem seed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. Sem `VITE_GEMINI_API_KEY` o upload de PDF mostra o erro do serviço. Com a chave, o fetch do Gemini não mudou.

## Next Phase Readiness

Pronto para 17-03 (carimbo `owner_id` no cliente e cópia do quadro vazio). REQ-28 continua aberto até esse plano. O SQL de isolamento do plano 17-01 ainda precisa ser colado no SQL Editor; este plano não altera o banco.

## Verification

- `rg -n "Disfunção cinesiológica" src` não imprime linha
- `rg -n "d7513069ba374c9f" src/components/patients/PatientPhysicalEvaluationPanel.tsx` encontra a constante
- `npm run typecheck` passou depois de cada task

## Self-Check: PASSED

- FOUND: src/services/aiPhysicalEvaluation.service.ts
- FOUND: src/components/patients/PatientPhysicalEvaluationPanel.tsx
- FOUND: d0e41e4
- FOUND: 8473bbc

---
*Phase: 17-isolamento-de-dados-por-conta*
*Completed: 2026-09-24*
