---
phase: 22-resumo-paciente-ia
plan: 01
subsystem: testing
tags: [typescript, zod, node-test, pt-br, patient-summary]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: published patient-ai-summary source the contract test reads as text
  - phase: 19-boneco-de-rea-de-foco
    provides: the 42-key FOCUS_REGION_KEYS catalog in src/lib/focusRegions.ts
provides:
  - Pure patientSummary module (keys, labels, limits, resolve, diff, jsonb narrowers, Zod)
  - node:test coverage for edit-over-original, empty-string clears, and modal copy
  - Source contract that fails until the Edge Function and Resumo page match the locked fields
affects: [22-03 service and types, 22-04 Edge Function prompt, 22-05 Resumo page, 22-06 Resumo IA panel]

tech-stack:
  added: []
  patterns:
    - "Pure lib imports only zod so node --test can load it without the @/ alias"
    - "Contract tests read source with readFileSync(new URL(rel, import.meta.url))"
    - "Generation text is clamped with transform; the modal schema rejects over the limit"

key-files:
  created:
    - src/lib/patientSummary.ts
    - src/lib/patientSummary.test.ts
    - src/lib/patientSummaryContract.test.ts
  modified: []

key-decisions:
  - "aiSummaryResponseSchema and summaryEditsSchema live in patientSummary.ts so the unit test can import them by relative path"
  - "formatGeneratedAt composes pt-BR date and time in America/Sao_Paulo with hourCycle h23"
  - "REQ-33 stays open: this plan ships the pure module; plans 02-07 still own SQL, writes, prompt, and UI"
  - "Contract cases for the pack, the prompt, and ResumoDoPaciente stay red on purpose until 22-04 and 22-05"

patterns-established:
  - "Run the pure suite with: node --test src/lib/patientSummary.test.ts"
  - "Do not treat a red patientSummaryContract.test.ts as a failure of this plan while pack, prompt, and REQ-33.5 are still the old source"

requirements-completed: []

duration: 9min
completed: 2026-10-04
---

# Phase 22 Plan 01: Pure patient summary module Summary

**Pure `patientSummary` module with the six locked labels, edit-over-original resolution, jsonb narrowers, and Zod schemas, plus a source contract that stays red on the old prompt and Resumo page.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-04T00:03:33Z
- **Completed:** 2026-10-04T00:12:30Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `src/lib/patientSummary.ts` is the single source for field keys, UI-SPEC labels, max lengths, rows, `resolveSummaryFields`, `diffSummaryEdits`, jsonb narrowers, `formatGeneratedAt`, and both Zod schemas. It imports only `zod`.
- `src/lib/patientSummary.test.ts`: 19 passing cases. An empty string in edits wins over the original, a cleared field diffs to `{key:''}`, long generation text is cut, and `nextSessionPlan` over 400 characters fails with `Use no máximo 400 caracteres.`
- `src/lib/patientSummaryContract.test.ts` reads the Edge Function, the focus catalog, the Resumo IA panel, and `ResumoDoPaciente` as text. The two cases that already match the repo are green; the three that describe the end of the phase stay red.

## Task Commits

Each task was committed atomically:

1. **Task 1: Criar o módulo puro patientSummary.ts** - `deaa1af` (feat)
2. **Task 2: Testes unitários do módulo puro** - `7f959c8` (test)
3. **Task 3: Teste de contrato que lê os fontes como texto** - `353c742` (test)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `src/lib/patientSummary.ts` - Keys, labels, limits, resolve/diff, narrowers, `formatGeneratedAt`, response and modal Zod schemas
- `src/lib/patientSummary.test.ts` - REQ-33.2/33.3/33.4 unit cases via `node:test`
- `src/lib/patientSummaryContract.test.ts` - Drift lock between the client catalog, the Edge Function source, and the Resumo UI

## Decisions Made

- Both Zod schemas stay in the pure module. Re-exporting them from `src/schemas/patientAi.schema.ts` would pull the `@/` alias into `node --test`.
- `formatGeneratedAt` does not call `formatDateTime` from `@/lib/security`. It builds `Gerado em dd/mm/aaaa às hh:mm` with `timeZone: 'America/Sao_Paulo'` and `hourCycle: 'h23'`, so midnight is `00:00`.
- REQ-33 is the whole phase. This plan does not mark it complete.

## Contract tests left red

`node --test src/lib/patientSummaryContract.test.ts` exits 1. That is the expected end state of this plan. Assertions were not weakened, skipped, or commented out.

| Case | Result | First failure | Closes in |
| --- | --- | --- | --- |
| `REQ-33.6: pack sem campos legados` | red | `assembleContextPack` still contains `priorAiSummary` | 22-04 |
| `REQ-33.6: prompt com 7 chaves` | red | `buildPrompt` has no `treatmentPlan` (also missing `painLimitations` and `NÃO CONFIÁVEL` in that slice) | 22-04 |
| `REQ-33.5: ResumoDoPaciente troca os cards legados` | red | `ResumoDoPaciente` still contains `detail.program` | 22-05 |
| `REQ-33.6: paridade das 42 chaves de foco` | green | — | already aligned |
| `REQ-33.2: aba Resumo IA não contém summaryEdits` | green | — | panel does not mention `summaryEdits` |

The plan gate is the unit file plus `npm run typecheck` plus the `REQ-33.2` filter. The full contract file is not a gate until wave 3.

## Verification

- `node --test src/lib/patientSummary.test.ts`: 19 pass, 0 fail
- `npm run typecheck`: clean
- `grep -c "@/" src/lib/patientSummary.ts src/lib/patientSummary.test.ts src/lib/patientSummaryContract.test.ts`: 0 in each file
- `node --test --test-name-pattern "REQ-33.2" src/lib/patientSummaryContract.test.ts`: 1 pass, 0 fail
- `node --test src/lib/patientSummaryContract.test.ts`: 2 pass, 3 fail (the three rows marked red above)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Focus catalog path is a sibling of the test**
- **Found during:** Task 3 (contract test)
- **Issue:** The plan text points the parity case at `../lib/focusRegions.ts`. From `src/lib/patientSummaryContract.test.ts` that URL is `src/lib/lib/focusRegions.ts` and does not exist.
- **Fix:** Read `./focusRegions.ts`, which is the catalog the plan describes (`export const FOCUS_REGION_KEYS` through `] as const`).
- **Files modified:** `src/lib/patientSummaryContract.test.ts`
- **Verification:** `REQ-33.6: paridade das 42 chaves de foco` passes with `size === 42` in both directions
- **Committed in:** `353c742` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The parity case can run. No assertion was relaxed.

## Issues Encountered

None. The three red contract cases are the debt the plan told this wave to leave in place.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 22-03 onward can import keys, labels, limits, narrowers, and schemas from `src/lib/patientSummary.ts` with a relative `.ts` path in tests and `@/lib/patientSummary` from app code.
- 22-04 must make `REQ-33.6: pack sem campos legados` and `REQ-33.6: prompt com 7 chaves` pass without changing the test names.
- 22-05 must make `REQ-33.5` pass. The slice is `function ResumoDoPaciente` through `function ResumoPanel`.

## Known Stubs

None.

## Threat Flags

None. The response schema, jsonb narrowers, length clamp, and source-parity test are the mitigations already listed as T-22-input, T-22-shape, T-22-dos, and T-22-prompt. No new endpoint, auth path, or migration.

## Self-Check: PASSED

- FOUND: src/lib/patientSummary.ts
- FOUND: src/lib/patientSummary.test.ts
- FOUND: src/lib/patientSummaryContract.test.ts
- FOUND commits: deaa1af, 7f959c8, 353c742

---
*Phase: 22-resumo-paciente-ia*
*Completed: 2026-10-04*
