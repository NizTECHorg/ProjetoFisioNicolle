---
phase: 26-pdf-botao-gerando-envio-cliente
plan: 02
subsystem: ui
tags: [react, css, lucide, reduced-motion]

requires:
  - phase: 26-pdf-botao-gerando-envio-cliente
    provides: Clear ficha PDF chrome from 26-01 and pdfEmptyHeading/pdfEmptyBody from 26-03
provides:
  - AiGeneratingButton with Gerando, a star, and the blue glow only while the model runs
  - Optional ConfirmDialog generatingConfirm that leaves every other confirm on Aguarde...
  - Empty filled catalog that shows the empty state and does not build a PDF
affects: [26-04]

tech-stack:
  added: []
  patterns:
    - "Model waits use generatingTarget resumo or sintese; file save stays Button isLoading"
    - "ai-generating is applied only while generating and is the only accent glow"

key-files:
  created:
    - src/components/ui/AiGeneratingButton.tsx
  modified:
    - src/components/ui/ConfirmDialog.tsx
    - src/index.css
    - src/components/patients/PatientAiComposer.tsx
    - src/lib/phase26Contract.test.ts

key-decisions:
  - "Gerando, the star, and ai-generating live only on AiGeneratingButton; Button isLoading still says Aguarde..."
  - "generatingTarget splits resumo and evolução synthesis so export upload does not show the star"
  - "An empty filled catalog sets catalogEmpty and renders pdfEmptyHeading and pdfEmptyBody"
  - "REQ-37 stays open because plan 26-04 still owns the WhatsApp and e-mail controls"

patterns-established:
  - "Idle AiGeneratingButton copies the primary button chrome; the glow class is conditional"
  - "prefers-reduced-motion keeps Gerando and the star and stops the glow loop"

requirements-completed: []

duration: 6min
completed: 2026-10-07
---

# Phase 26 Plan 02: Gerando button and empty PDF Summary

**Gerando, a star, and a blue glow only while the model runs; an empty catalog shows the empty state and does not create a PDF**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-07T00:16:49Z
- **Completed:** 2026-10-07T00:23:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `AiGeneratingButton` shows `Gerando` and a filled star, with class `ai-generating` only while generating. Idle chrome is `rounded-2xl`, `px-6 py-3.5`, `bg-forest`, and `text-white`.
- `Button` still uses the spinner and `Aguarde...`. Export upload, the field picker, and every confirm that does not opt in stay on that path.
- Avaliação and evolução catalogs with no filled fields show `pdfEmptyHeading` and `pdfEmptyBody` and do not call `buildPatientAiReportPdf` or `createReport`.

## Task Commits

Each task was committed atomically:

1. **Task 1: AiGeneratingButton, glow e o confirmar opcional** - `8357477` (test), `89d4d6d` (feat)
2. **Task 2: Ligar Gerando só no modelo e não gravar PDF vazio** - `5a29dfc` (test), `ce76aad` (feat)

**Plan metadata:** docs commit with this summary

## Files Created/Modified

- `src/components/ui/AiGeneratingButton.tsx` - Own button for Gerando, the star, and the glow class
- `src/components/ui/ConfirmDialog.tsx` - Optional `generatingConfirm`; default confirm stays `Button`
- `src/index.css` - `.ai-generating`, `ai-glow`, and the reduced-motion static shadow
- `src/components/patients/PatientAiComposer.tsx` - Split wait target and empty-catalog state
- `src/lib/phase26Contract.test.ts` - Source contracts for REQ-37.2

## Decisions Made

- The wait is `generatingTarget`: `resumo` or `sintese`. One boolean would light Gerar resumo and Exportar PDF together.
- Avaliação export never renders `AiGeneratingButton`. Síntese does, and only while that target is set. `createReport.isPending` with the picker closed uses `Button` `isLoading`.
- `needFields` stays on the picker confirm when every field was unchecked. `pdfEvalEmpty` stays when the ficha has no saved evaluation.
- A filled avaliação catalog still requires a title before the picker opens. An empty catalog returns to the empty state before that check.
- REQ-37 is not checked off. Plan 26-04 still adds the send controls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Empty-catalog test located the call, not the import**
- **Found during:** Task 2 (Ligar Gerando só no modelo e não gravar PDF vazio)
- **Issue:** `indexOf('buildEvolucaoFilledCatalog')` hit the import, which sits after `buildEvaluationFilledCatalog`, so the branch comparison failed even after the empty path was correct.
- **Fix:** The contract searches `buildEvolucaoFilledCatalog(` and `buildEvaluationFilledCatalog(`.
- **Files modified:** `src/lib/phase26Contract.test.ts`
- **Verification:** `node --test --test-name-pattern "REQ-37" src/lib/phase26Contract.test.ts` and `npm run typecheck` pass.
- **Committed in:** `ce76aad`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The test now reads the export branches. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 26-04 can place WhatsApp and e-mail under Exportar PDF, below this empty state.
- Those controls stay on `Button` `isLoading`. Do not import `AiGeneratingButton` into the field picker.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/components/ui/AiGeneratingButton.tsx
- FOUND: src/components/ui/ConfirmDialog.tsx
- FOUND: src/index.css
- FOUND: src/components/patients/PatientAiComposer.tsx
- FOUND: src/lib/phase26Contract.test.ts
- FOUND: 8357477
- FOUND: 89d4d6d
- FOUND: 5a29dfc
- FOUND: ce76aad

---
*Phase: 26-pdf-botao-gerando-envio-cliente*
*Completed: 2026-10-07*
