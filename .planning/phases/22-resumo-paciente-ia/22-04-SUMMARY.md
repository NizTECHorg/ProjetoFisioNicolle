---
phase: 22-resumo-paciente-ia
plan: 04
subsystem: api
tags: [deno, edge-function, gemini, prompt, patient-summary]

requires:
  - phase: 22-resumo-paciente-ia
    provides: SUMMARY_FIELD_KEYS, SUMMARY_FIELD_MAX, and the REQ-33.6 contract tests
provides:
  - Resumo context pack without unread defaults or the previous AI summary
  - buildPrompt declaring the seven output keys and the eight non-invention rules
  - parseGeminiJson that clamps the five optional texts and returns a flat JSON body
affects: [22-07 hosted UAT, patient-ai-summary Dashboard publish]

tech-stack:
  added: []
  patterns:
    - "optionalClampedString slices model text to SUMMARY_FIELD_MAX without appending an ellipsis"
    - "focusRegionKeys is always returned, including an empty array, because omitEmpty drops empty arrays"

key-files:
  created: []
  modified:
    - .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts

key-decisions:
  - "PatientRow stays intact; the resumo cleanup is only the select and the object returned by assembleContextPack"
  - "focusRegionKeys is assigned after omitEmpty so an empty catalog result is still sent to the client"
  - "REQ-33 stays open: plans 22-05 through 22-07 still own the Resumo UI and the hosted UAT"
  - "Publishing patient-ai-summary remains a Dashboard step in 22-USER-SETUP.md"

patterns-established:
  - "Resumo mode does not send eva, programProgress, or priorAiSummary; evolucao mode still reads those columns through PatientRow"

requirements-completed: []

duration: 2min
completed: 2026-10-04
---

# Phase 22 Plan 04: Resumo prompt and context pack Summary

**The resumo Edge Function source no longer sends unread EVA or progress defaults, and its prompt and parser follow the seven-key clinical contract.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-04T00:26:10Z
- **Completed:** 2026-10-04T00:28:18Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `assembleContextPack` no longer selects or returns `program`, `programProgress`, `eva`, `evolutionSummary`, `lastConducts`, `nextSessionPlan`, or `priorAiSummary`. Frequency and session counts stay, because they are an allowed source for `treatmentPlan`.
- `buildPrompt` names `summary`, `treatmentPlan`, `evolution`, `conducts`, `nextSessionPlan`, `painLimitations`, and `focusRegionKeys`, with source, meaning, and character limit, plus the eight non-invention rules.
- `parseGeminiJson` requires a non-empty `summary`, clamps each text with `slice`, and the handler returns a flat body via `{ ...result }`.
- `interface PatientRow` and the evolucao PDF path are unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Limpar o contexto do modo resumo** - `dad9c5a` (feat)
2. **Task 2: Prompt de sete chaves, parse estendido e resposta plana** - `e2a6e4b` (feat)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` - Resumo pack, seven-key prompt, clamped parse, and flat HTTP body

## Decisions Made

- `PatientRow` was not edited. `assembleEvolucaoContextPack` still casts to it and still reads `program_name`, `current_eva`, and `evolution_summary` for the PDF path.
- `focusRegionKeys` is written after `omitEmpty`. That helper drops empty arrays, and an empty catalog result must still reach the client.
- `summary` uses `optionalClampedString` at 1500, the same `SUMMARY_FIELD_MAX` limit as the client Zod schema, and without an ellipsis.
- REQ-33 stays open. This plan ships the function source. Plans 22-05, 22-06, and 22-07 still own the screens and the hosted proof. `requirements.mark-complete` was not called.
- The function was not published. `22-USER-SETUP.md` still assigns that Dashboard step to the plan 22-07 UAT.

## Verification

- `node --test --test-name-pattern "REQ-33.6: pack sem campos legados" src/lib/patientSummaryContract.test.ts` — passed.
- `node --test --test-name-pattern "REQ-33.6: prompt com 7 chaves" src/lib/patientSummaryContract.test.ts` — passed.
- `node --test --test-name-pattern "REQ-33.6: paridade das 42 chaves de foco" src/lib/patientSummaryContract.test.ts` — passed (`size === 42` on both catalogs).
- `REQ-33.5: ResumoDoPaciente troca os cards legados` remains red. It belongs to plan 22-05 and was not changed.
- `git diff` for this plan touches only the phase 13 function file. Phase 11 and `supabase/functions` were not modified. No Supabase CLI command was run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Keep empty focusRegionKeys on the response**
- **Found during:** Task 2 (Prompt de sete chaves, parse estendido e resposta plana)
- **Issue:** `omitEmpty` skips empty arrays. Putting `focusRegionKeys` inside it would drop `[]`, so a response with no regions would omit the key old clients still read.
- **Fix:** Optional texts go through `omitEmpty`. `summary` and `focusRegionKeys` are assigned outside it, including an empty array.
- **Files modified:** `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
- **Verification:** The two REQ-33.6 contract tests and the 42-key parity test pass. The handler returns `{ ...result }`.
- **Committed in:** `e2a6e4b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required so an empty focus catalog still returns `focusRegionKeys`. No scope creep.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See [22-USER-SETUP.md](./22-USER-SETUP.md) for:

- Publishing `patient-ai-summary` is still a Dashboard step. This plan edited only `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`. Do not publish the phase 11 twin or the gitignored copy under `supabase/functions`. Do not use `supabase functions deploy`.
- The operator publishes this source during the plan 22-07 UAT, then checks the hosted body for the seven output keys and the 42 focus keys, and that the resumo pack does not contain `priorAiSummary` or `programProgress`.

## Next Phase Readiness

- Plan 22-05 can replace the legacy Resumo cards. `REQ-33.5` is still red on purpose.
- A hosted generation still returns only `summary` and `focusRegionKeys` until the operator pastes this source in the Dashboard. The client already accepts that shape.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
- FOUND commits: dad9c5a, e2a6e4b

---
*Phase: 22-resumo-paciente-ia*
*Completed: 2026-10-04*
