---
phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
plan: 02
subsystem: api
tags: [edge-function, gemini, supabase, focus-regions, patient-sessions, pt-br]

requires:
  - phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
    provides: allowedFocusKeys matcher and the REQ-34 source contracts
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: self-contained patient-ai-summary source pasted to the Dashboard
provides:
  - Exact count of patient_sessions with status realizada on the user JWT
  - focusRegionKeys replaced by labels found in raw chart text and the description
  - buildPrompt treats the extra description as FONTE without replacing sessionsDone
affects: [23-05 Dashboard paste of this function, 23-03 inline editor, 23-04 scroll]

tech-stack:
  added: []
  patterns:
    - "sessionsDone is count exact head true on patient_sessions status realizada; a count error omits the key"
    - "The Edge Function pastes FOCUS_REGION_CATALOG and allowedFocusKeys because it cannot import @/"
    - "Resumo HTTP focusRegionKeys is the computed allow-list; applyAiFocusRegionKeys stays insert-only"

key-files:
  created: []
  modified:
    - .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
    - src/services/patientAi.service.ts

key-decisions:
  - "sessionsDone is the exact count of realizada sessions on the user client; a count error omits the key and never reads patients.sessions_done"
  - "The resumo response replaces Gemini focusRegionKeys with allowedFocusKeys on untruncated chart text plus the description, and does not union saved focus areas"
  - "buildPrompt treats the extra description as FONTE and states that it does not replace patient.sessionsDone; evolução still uses the untrusted hint"
  - "REQ-34 stays open: this plan greens 34.2, 34.3 parity, and 34.4; the inline editor and the Entenda o caso scroll stay for later plans"

patterns-established:
  - "Do not count the 20-row sessions array and do not fall back to patients.sessions_done"
  - "Scan focus labels on the raw query strings, before truncate"

requirements-completed: []

duration: 4min
completed: 2026-10-05
---

# Phase 23 Plan 02: Contagem, fonte e áreas de foco no resumo Summary

**The summary Edge Function counts completed sessions, treats the extra description as a source that cannot replace that count, and returns only focus labels found in the raw chart text.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-05T00:29:27Z
- **Completed:** 2026-10-05T00:33:30Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- `assembleContextPack` counts `patient_sessions` with `status = realizada` using `{ count: 'exact', head: true }` on the user JWT, with no row limit. Success stores `sessionsDone: count ?? 0`, including zero. An error omits the key. `patients.sessions_done` is gone from the summary select, and the 20-row context array is not the count. `assembleEvolucaoContextPack` is unchanged.
- The function carries a self-contained copy of the 42 catalog labels and `allowedFocusKeys`. It scans complaint, diagnosis, evaluation fields, loaded evolution fields, and the full description before `truncate`, and the resumo HTTP body sets `focusRegionKeys` to that array. Gemini's list and saved `focusAreas` are not merged in.
- `buildPrompt` no longer calls `hintBlockFor`. A written description is labeled FONTE and quoted. The template says completed sessions are only `patient.sessionsDone` and that the description does not replace that number. `hintBlockFor` still says NÃO CONFIÁVEL and `buildEvolucaoPrompt` still calls it.
- `applyAiFocusRegionKeys` still inserts only, ignores an existing `region_key` and `23505`, and does not delete a mark made by hand.

## Task Commits

Each task was committed atomically:

1. **Task 1: Contar sessões realizada no pack** - `c6e4ea6` (feat)
2. **Task 2: Substituir focusRegionKeys pelo catálogo achado no texto** - `abdd739` (feat)
3. **Task 3: Descrição como FONTE em buildPrompt** - `e3758a1` (feat)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

The REQ-34 contracts already existed from plan 01, so each task confirmed the red test and then committed the implementation. No new test file was added.

## Files Created/Modified

- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` - Count of realizada, pasted catalog and matcher, raw-text allow-list, FONTE prompt. The phase 11 twin was not edited.
- `src/services/patientAi.service.ts` - Comment on `applyAiFocusRegionKeys` states that generation only inserts and never deletes a manual mark.

## Decisions Made

- The count uses the same `client` already created for the authenticated user. There is no service-role client and no fallback to the `sessions_done` column.
- `focusRegionKeys` on the resumo response is the computed allow-list. `filterFocusKeys` remains inside `parseGeminiJson` and is not what the resumo HTTP body returns.
- The description is a source for what it states in writing. It does not replace `patient.sessionsDone`, and the prompt forbids inventing a session count when that key is absent.
- REQ-34 stays unchecked. Acceptance items for the inline editor and the Entenda o caso scroll are still red on purpose (`REQ-34.1`, `REQ-34.5`). Publishing this source to the Dashboard is plan 05.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. This source is not deployed. Plan 05 pastes it in the Supabase Dashboard.

## Next Phase Readiness

- Plans 03 and 04 can edit the inline summary cards and the Entenda o caso scroll without touching this function.
- Plan 05 should paste `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`, not the phase 11 copy and not `supabase/functions/`.
- `REQ-34.1` and `REQ-34.5` are still red. They were not weakened.

## Self-Check: PASSED

- FOUND: `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
- FOUND: `src/services/patientAi.service.ts`
- FOUND: `c6e4ea6`
- FOUND: `abdd739`
- FOUND: `e3758a1`

---
*Phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso*
*Completed: 2026-10-05*
