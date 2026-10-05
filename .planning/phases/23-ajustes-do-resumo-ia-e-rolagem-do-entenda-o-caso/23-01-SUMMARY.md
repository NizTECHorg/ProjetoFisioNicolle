---
phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
plan: 01
subsystem: testing
tags: [typescript, node-test, focus-regions, pt-br, patient-summary]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: patient-ai-summary source the contract test reads as text
  - phase: 19-boneco-de-rea-de-foco
    provides: the 42-label FOCUS_REGIONS catalog
  - phase: 22-resumo-paciente-ia
    provides: patientSummaryContract.test.ts sliceBetween harness and the seven-key prompt assert
provides:
  - Pure allowedFocusKeys matcher (whole catalog label, left boundary, no synonym)
  - Green REQ-34.3 unit cases for antebraço, joelho, raw keys, and catalog order
  - REQ-34 source contracts that stay red until plans 02, 03, and 04
affects: [23-02 Edge Function paste, 23-03 inline editor, 23-04 scroll and composer label]

tech-stack:
  added: []
  patterns:
    - "allowedFocusKeys imports FOCUS_REGIONS with a relative .ts path so node --test type-stripping can load it"
    - "A shorter catalog label that only sits inside a longer one does not mark an extra region"
    - "Contract tests lock the final source and stay red on purpose"

key-files:
  created:
    - src/lib/focusRegionAllow.ts
    - src/lib/focusRegionAllow.test.ts
  modified:
    - src/lib/patientSummaryContract.test.ts

key-decisions:
  - "allowedFocusKeys folds accents with NFD and matches the whole catalog label with a left boundary; a shorter label counts only when it also appears outside a longer catalog label"
  - "The NÃO CONFIÁVEL assert moved from the buildPrompt slice to hintBlockFor; the seven keys and the 42-key parity stay"
  - "REQ-34 stays open: this plan ships the matcher and the contracts; plans 02-05 still own the Edge Function, the inline editor, the scroll, and UAT"

patterns-established:
  - "Run the matcher with: node --test src/lib/focusRegionAllow.test.ts"
  - "Do not treat a red REQ-34 contract as a failure of this plan while pack, prompt, editor, and scroll still match the old source"

requirements-completed: []

duration: 5min
completed: 2026-10-05
---

# Phase 23 Plan 01: Matcher puro de áreas de foco Summary

**Pure `allowedFocusKeys` matcher for whole catalog labels, plus REQ-34 source contracts that stay red until the Edge Function, the inline editor, and the Entenda o caso scroll land.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-05T00:21:30Z
- **Completed:** 2026-10-05T00:26:20Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `allowedFocusKeys` joins the clinical texts with a newline, folds accents, and marks a catalog label only with a left boundary `(?<![a-z])`. `antebraço esquerdo` does not mark Braço. `joelho` alone, `joelhos`, `joelho D`, and the raw key `front.knee_r` mark nothing. `Joelho direito` marks front and back, in catalog order, once.
- A shorter label that only occurs inside a longer catalog label is dropped. `Palma da mão esquerda` marks `front.palm_l` and does not mark `back.hand_l`.
- `REQ-33.6: prompt com 7 chaves` still checks the six `SUMMARY_FIELD_KEYS` and `focusRegionKeys` inside `buildPrompt`. `NÃO CONFIÁVEL` is required on the `hintBlockFor` slice instead. The 42-key parity test is unchanged.
- The final-state contracts `REQ-34.1`, `REQ-34.2`, `REQ-34.4`, and `REQ-34.5` are written and still fail. They were not commented out or weakened.

## Task Commits

Each task was committed atomically:

1. **Task 1: Matcher puro allowedFocusKeys** - `ffc7239` (test, RED) then `8a66e58` (feat, GREEN)
2. **Task 2: Contratos REQ-34 e assert de hintBlockFor** - `080c229` (test)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `src/lib/focusRegionAllow.ts` - `allowedFocusKeys(texts)` from `FOCUS_REGIONS` only
- `src/lib/focusRegionAllow.test.ts` - Eight `REQ-34.3` unit cases, relative `.ts` import
- `src/lib/patientSummaryContract.test.ts` - Hint assert moved; final-state REQ-34 cases added

## Decisions Made

- The matcher does not import `@/` and has no synonym table. Plan 02 pastes the same behavior into the phase 13 function.
- The absence check in `buildPrompt` uses a `UNTRUSTED` constant so the old `prompt.includes('NÃO CONFIÁVEL')` line is gone, while `hintBlockFor` still must contain the phrase.
- REQ-34 is the whole phase. This plan does not mark it complete.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Drop a shorter label nested inside a longer catalog label**
- **Found during:** Task 1 (Matcher puro allowedFocusKeys)
- **Issue:** A left boundary alone still lets `Palma da mão esquerda` mark `Mão esquerda` (`back.hand_l`), which is an extra region. The letters of `braço` inside `antebraço` were already blocked; this case is a space, not a letter.
- **Fix:** Keep a hit only when that span is not strictly inside a longer catalog-label hit. Shared labels of equal length (`Joelho direito` on front and back) both stay.
- **Files modified:** `src/lib/focusRegionAllow.ts`, `src/lib/focusRegionAllow.test.ts`
- **Verification:** `node --test src/lib/focusRegionAllow.test.ts` — 8 passing, including `REQ-34.3: palma da mão não marca a mão`
- **Committed in:** `8a66e58` (part of the GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The seven planned cases still pass. The extra rule stops a second region from lighting up when the text names a longer catalog label. No schema, package, or UI change.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can paste `allowedFocusKeys` next to `FOCUS_REGION_CATALOG` in the phase 13 function. The contract `REQ-34.3: paridade dos rótulos de foco` throws today because `const FOCUS_REGION_CATALOG` is absent. It also requires `(?<![a-z])`, `normalize('NFD')`, `allowedFocusRegionKeys` after `buildPrompt(packOrError, userHint)`, and the removal of `return jsonResponse({ ...result })`.
- `REQ-34.3: cliente não apaga área de foco` is already green: `applyAiFocusRegionKeys` has no `.delete`. Do not add a delete to make a later plan "change" that slice.
- `node --test --test-name-pattern "REQ-34" src/lib/patientSummaryContract.test.ts` exits 1. That is the expected end state. Do not put `NÃO CONFIÁVEL` back inside `buildPrompt` to turn the suite green.

| Case | Result | First failure | Closes in |
| --- | --- | --- | --- |
| `REQ-34.1: Resumo sem modal e editor por chave` | red | `PatientPage.tsx` still contains `PatientSummaryEditorModal` | 23-03 |
| `REQ-34.2: sessionsDone conta realizada` | red | pack still assigns `sessionsDone: patient.sessions_done` | 23-02 |
| `REQ-34.3: paridade dos rótulos de foco` | red | `const FOCUS_REGION_CATALOG` missing | 23-02 |
| `REQ-34.3: cliente não apaga área de foco` | green | — | already insert-only |
| `REQ-34.4: descrição é FONTE no buildPrompt` | red | `buildPrompt` has no `FONTE` | 23-02 |
| `REQ-34.5: queixa e diagnóstico rolam no parágrafo` | red | `EntendaOCaso` still has `line-clamp-3` | 23-04 |
| `REQ-34.5: rótulo da descrição adicional` | red | composer still says `Orientação opcional` | 23-04 |
| `src/lib/focusRegionAllow.test.ts` | green | — | this plan |

## Self-Check: PASSED

- FOUND: `src/lib/focusRegionAllow.ts`
- FOUND: `src/lib/focusRegionAllow.test.ts`
- FOUND: `src/lib/patientSummaryContract.test.ts`
- FOUND: `ffc7239`
- FOUND: `8a66e58`
- FOUND: `080c229`

---
*Phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso*
*Completed: 2026-10-05*
