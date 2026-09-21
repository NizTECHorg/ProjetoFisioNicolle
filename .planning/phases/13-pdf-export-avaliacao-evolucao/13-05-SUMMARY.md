---
phase: 13-pdf-export-avaliacao-evolucao
plan: 05
subsystem: api
tags: [edge-function, gemini, evolucao, multi-session, pdf-export, zod]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: SQL+Zod kinds avaliacao/evolucao; pdfFieldCatalog; drawEvolucao; PatientAiFieldPicker + Avaliacao export
provides:
  - EF mode evolucao (sessionIds 1..12) returning sintese/tendencias/condutasAgregadas/alertas
  - generateEvolucaoSynthesis client API (no ai_summary write)
  - Composer Evolução: EF → picker → PDF kind evolucao
affects:
  - 13-06 UAT (requires hosted EF redeploy)
  - Evolução multi-session IA export path

tech-stack:
  added: []
  patterns:
    - EF mode discriminant (resumo | evolucao) on patient-ai-summary
    - NÃO CONFIÁVEL userHint block + never-invent / omit-empty for evolucao prompt
    - PDF-only synthesis — no updatePatient on evolucao path

key-files:
  created:
    - .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
  modified:
    - src/schemas/patientAi.schema.ts
    - src/services/patientAi.service.ts
    - src/components/patients/PatientAiComposer.tsx
    - supabase/functions/patient-ai-summary/index.ts

key-decisions:
  - "Extend existing patient-ai-summary EF with mode evolucao — no new Edge Function"
  - "Tracked EF source is phase twin under .planning/.../functions/ (/supabase/ is gitignored)"
  - "generateEvolucaoSynthesis never calls updatePatient or applyAiFocusRegionKeys"
  - "On EF failure abort before PDF upload (REQ-25.6)"

patterns-established:
  - "Pattern: mode evolucao validates sessionIds 1..12 UUID, filters pack to those sessions only"
  - "Pattern: Composer Evolução CTA loading → synthesis → picker all-on → kind evolucao upload"

requirements-completed: [REQ-25, REQ-25.4, REQ-25.6]

duration: 4min
completed: 2026-09-21
---

# Phase 13 Plan 05: EF Evolução + Composer Wire Summary

**Edge Function mode `evolucao` + SPA `generateEvolucaoSynthesis` → field-picker → PDF `kind: evolucao`; hosted redeploy still pending (Task 3 blocking).**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-21T12:58:54Z
- **Completed:** 2026-09-21T13:03:01Z
- **Tasks:** 2/3 complete (Task 3 blocking human redeploy)
- **Files modified:** 4 tracked (+ local `/supabase/` deploy copy)

## Accomplishments

- Extended `patient-ai-summary` with `mode: 'evolucao'`: validates 1..12 session UUIDs, assembles patient mínimo + only those sessions, returns structured synthesis JSON without writing `patients.ai_summary`
- Added Zod `patientAiEvolucaoInvokeSchema` / `evolucaoSynthesisSchema` and `generateEvolucaoSynthesis` (reuses Functions error mapping; no VITE_GEMINI)
- Wired Composer Evolução: multi-select (cap 12) → EF → picker → PDF upload `kind: evolucao` with denorm `sessionLabel`; EF failure aborts without invented PDF

## Task Commits

1. **Task 1: EF mode evolucao + client generateEvolucaoSynthesis** - `94bb31f` (feat)
2. **Task 2: Wire Evolução multi-session export in composer** - `ba17010` (feat)
3. **Task 3: [BLOCKING] Redeploy patient-ai-summary** - pending human action

## Files Created/Modified

- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` — tracked twin (Dashboard/CLI deploy source)
- `supabase/functions/patient-ai-summary/index.ts` — local deploy copy (gitignored `/supabase/`)
- `src/schemas/patientAi.schema.ts` — evolucao invoke + synthesis Zod
- `src/services/patientAi.service.ts` — `generateEvolucaoSynthesis`
- `src/components/patients/PatientAiComposer.tsx` — Evolução export path

## Decisions Made

- Reuse single EF with mode discriminant (research lock) rather than a new function
- Twin under phase `functions/` is the committed source of truth because `/supabase/` is gitignored
- Avaliacao scope still never calls Gemini; Evolução only

## Deviations from Plan

None - plan executed exactly as written for Tasks 1–2.

## Issues Encountered

- `/supabase/` is gitignored — EF changes committed via phase twin (same Phase 11 pattern). Local `supabase/functions/patient-ai-summary/index.ts` updated for CLI deploy but not in git.

## User Setup Required

**Task 3 [BLOCKING] — redeploy Edge Function before Evolução UAT:**

1. Deploy updated `patient-ai-summary` from twin:
   - Source: `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
   - Or local copy: `supabase/functions/patient-ai-summary/index.ts`
2. Confirm secret `GEMINI_API_KEY` still set on the hosted project (server-only — never `VITE_*`).
3. Optional smoke: POST with `{ patientId, mode: 'evolucao', sessionIds: [<one uuid>] }` returns `{ sintese: "..." }`.
4. Reply `deployed` or paste the error.

CLI example (if project uses Supabase CLI):

```bash
supabase functions deploy patient-ai-summary
```

Or paste the twin `index.ts` into Supabase Dashboard → Edge Functions → `patient-ai-summary`.

## Next Phase Readiness

- SPA Evolução path is complete and typechecks
- **Blocked:** hosted EF must include `mode === 'evolucao'` before Plan 06 UAT can hit live synthesis
- STATE.md / ROADMAP.md intentionally not updated (orchestrator instruction)

## Threat Flags

None beyond plan threat model — mitigations applied (T-13-06/07/05: Deno.env key, NÃO CONFIÁVEL hint, abort on EF failure).

## Self-Check: PASSED

- FOUND: `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
- FOUND: `94bb31f` (Task 1)
- FOUND: `ba17010` (Task 2)
- FOUND: `mode === 'evolucao'` branch in twin
- FOUND: `generateEvolucaoSynthesis` export + composer call
- FOUND: Zod `sintese` required

---
*Phase: 13-pdf-export-avaliacao-evolucao*
*Completed: 2026-09-21 (Tasks 1–2; Task 3 pending)*
