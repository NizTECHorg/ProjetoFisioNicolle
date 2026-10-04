---
phase: 22-resumo-paciente-ia
plan: 03
subsystem: api
tags: [typescript, supabase, zod, react-query, jsonb, patient-summary]

requires:
  - phase: 22-resumo-paciente-ia
    provides: patientSummary narrowers, aiSummaryResponseSchema, and the SQL Editor script for the two jsonb columns
provides:
  - Patient.aiSummaryFields and Patient.summaryEdits mapped through the jsonb narrowers
  - saveGeneratedPatientSummary as one UPDATE of ai_summary, ai_summary_fields, and summary_edits null
  - savePatientSummaryEdits and useSavePatientSummaryEdits with the locked Portuguese errors
  - The 18 PATIENT_AI_COPY keys the Resumo and Resumo IA screens will consume
affects: [22-05 Resumo editor, 22-06 Resumo IA panel, 22-07 hosted UAT]

tech-stack:
  added: []
  patterns:
    - "Summary generation and edits use dedicated writes; updatePatient stays string | number | null"
    - "PostgREST failures on those writes throw PATIENT_AI_COPY.editError; zero rows throw editForbidden"
    - "generatePatientAiSummary validates with aiSummaryResponseSchema.safeParse before the single UPDATE"

key-files:
  created: []
  modified:
    - src/types/patient.ts
    - src/services/patients.service.ts
    - src/services/patientAi.service.ts
    - src/schemas/patientAi.schema.ts
    - src/hooks/usePatients.ts

key-decisions:
  - "One generation UPDATE writes ai_summary, ai_summary_fields, and summary_edits null; updatePatient is not widened for jsonb"
  - "Save failures throw PATIENT_AI_COPY.editError or editForbidden; the hook shows error.message and does not call mapDbError"
  - "A response with only summary is accepted; the five optional texts stay absent and ai_summary_fields keeps generatedAt"
  - "REQ-33 stays open: plans 22-04 through 22-07 still own the prompt, the Resumo UI, and the hosted UAT"

patterns-established:
  - "DETAIL_COLUMNS reads ai_summary_fields and summary_edits; LIST_COLUMNS and DASHBOARD_COLUMNS do not"
  - "Do not add a generation useMutation; PatientAiComposer keeps calling generatePatientAiSummary directly"

requirements-completed: []

duration: 5min
completed: 2026-10-04
---

# Phase 22 Plan 03: Patient summary reads and dedicated writes Summary

**The chart reads sanitized `aiSummaryFields` and `summaryEdits`, a generation replaces the previous summary in one UPDATE that clears edits, and the edit hook toasts the locked Portuguese copy.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-04T00:19:47Z
- **Completed:** 2026-10-04T00:24:30Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `Patient` exposes `aiSummaryFields` and `summaryEdits`. `mapPatient` runs `narrowAiSummaryFields` and `narrowSummaryEdits`. Legacy program, EVA, and evolution columns stay on the type.
- `saveGeneratedPatientSummary` issues one `UPDATE` of `ai_summary`, `ai_summary_fields` (with `generatedAt`), and `summary_edits: null`. `savePatientSummaryEdits` writes only the diff or `null`.
- Any PostgREST error on those writes throws exactly `Não foi possível salvar o resumo. Tente de novo.` Zero rows throws exactly `Você não tem permissão para editar este paciente.`
- `generatePatientAiSummary` validates with `aiSummaryResponseSchema.safeParse`, then calls `saveGeneratedPatientSummary` and the existing additive `applyAiFocusRegionKeys`.
- `useSavePatientSummaryEdits` invalidates the chart and toasts `Resumo salvo`. `PATIENT_AI_COPY` now has the 18 keys the later UI plans consume.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tipos, leitura das colunas e as duas escritas dedicadas** - `885a706` (feat)
2. **Task 2: Geração validada por Zod gravando os três campos de uma vez** - `0e24cda` (feat)
3. **Task 3: Hook de mutação da edição** - `3f9d324` (feat)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `src/types/patient.ts` - `AiSummaryFields`, `SummaryEdits`, and the two fields on `Patient`
- `src/services/patients.service.ts` - Detail-column read, narrowers, `savePatientSummaryEdits`, `saveGeneratedPatientSummary`
- `src/services/patientAi.service.ts` - Zod validation and the single generation write
- `src/schemas/patientAi.schema.ts` - The 18 new `PATIENT_AI_COPY` keys
- `src/hooks/usePatients.ts` - `useSavePatientSummaryEdits`

## Decisions Made

- Generation and edits do not go through `updatePatient`. That payload stays `Record<string, string | number | null>` so identity updates do not accept jsonb.
- These two writes do not call `mapDbError` or `throwIfError`. The hook's shared `onError` shows `error.message`, so the service throws the UI-SPEC strings directly.
- A body with only `summary` still parses. The five optional texts are omitted, and `ai_summary_fields` is stored with `generatedAt`.
- REQ-33 stays open. This plan ships the client writes and the copy. Plans 22-04, 22-05, 22-06, and 22-07 still own the prompt, the screens, and the hosted proof. `requirements.mark-complete` was not called.

## Verification

- `npm run typecheck` passed after each task and again after the hook.
- `npm run lint` passed with the two pre-existing warnings outside this plan (`state.cjs`, `AttendanceCounts.tsx`). No new lint findings.
- `node --test src/lib/patientSummary.test.ts` — 19 passed, 0 failed. That includes `REQ-33.4: aiSummaryResponseSchema aceita só summary`.
- `rg updatePatient src/services/patientAi.service.ts` — no matches.
- `ai_summary_fields` and `summary_edits` appear on `PatientRow`, `DETAIL_COLUMNS`, `mapPatient`, and the two writes. They do not appear in `LIST_COLUMNS` or `DASHBOARD_COLUMNS`.
- `grep -c "payload: Record<string, string | number | null>" src/services/patients.service.ts` is 1.
- `grep -c "@/lib/security\|@/lib/patientSummary" src/schemas/patientAi.schema.ts` is 0.
- Contract cases that plans 22-04 and 22-05 close were not run as a gate and were not weakened.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See [22-USER-SETUP.md](./22-USER-SETUP.md) for:

- Paste `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql` in the Supabase SQL Editor before opening a patient chart. `DETAIL_COLUMNS` now selects `ai_summary_fields` and `summary_edits`. Without those columns PostgREST refuses the patient read.
- Do not publish `patient-ai-summary` in this plan. The phase 13 source is edited in plan 22-04 and published in the plan 22-07 UAT.

## Next Phase Readiness

- Plan 22-05 can call `useSavePatientSummaryEdits`. Plan 22-06 can read `aiSummaryFields`, `summaryEdits`, and the new copy keys.
- Plan 22-04 still owns the Edge Function prompt. Until that ships, a hosted generation that returns only `summary` is accepted and stored.
- The chart will not load on the hosted project until the operator pastes the plan 22-02 SQL.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/types/patient.ts
- FOUND: src/services/patients.service.ts
- FOUND: src/services/patientAi.service.ts
- FOUND: src/schemas/patientAi.schema.ts
- FOUND: src/hooks/usePatients.ts
- FOUND commits: 885a706, 0e24cda, 3f9d324

---
*Phase: 22-resumo-paciente-ia*
*Completed: 2026-10-04*
