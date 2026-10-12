---
phase: 22-resumo-paciente-ia
plan: 02
subsystem: database
tags: [postgres, jsonb, sql-editor, postgrest, rls, edge-function]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: patients_update policy via private.can_write_patient, which already covers new columns
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: the Edge Function source the operator publishes later, never the phase 11 twin
provides:
  - Idempotent SQL Editor script for ai_summary_fields and summary_edits
  - Operator setup that sequences the SQL paste before plan 22-03 and the function publish after plan 22-04
affects: [22-03 patient chart reads, 22-07 hosted UAT]

tech-stack:
  added: []
  patterns:
    - "SQL Editor only: add column if not exists, drop constraint if exists, then add constraint"
    - "jsonb CHECK is explicit null-or-object plus a 20000-byte cap"
    - "notify pgrst reload schema after new patients columns"

key-files:
  created:
    - .planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql
    - .planning/phases/22-resumo-paciente-ia/22-USER-SETUP.md
  modified: []

key-decisions:
  - "No new RLS policy: patients_update already uses private.can_write_patient"
  - "Operator pastes the SQL before running the app after plan 22-03, or the patient chart fails to load"
  - "Edge Function publish is not part of this plan; it happens in the 22-07 UAT after plan 22-04 edits the phase 13 source"
  - "REQ-33 stays open: this plan ships the SQL script and the operator document only"

patterns-established:
  - "Do not write phase 22 DDL under supabase/migrations and do not run supabase db push"
  - "Do not publish .planning/phases/11-resumo-ia or the gitignored supabase/functions copy"

requirements-completed: []

duration: 2min
completed: 2026-10-04
---

# Phase 22 Plan 02: SQL Editor columns and operator setup Summary

**Idempotent SQL Editor script that adds `ai_summary_fields` and `summary_edits` with object-and-size CHECKs, plus the operator document that pastes that SQL before plan 22-03 and publishes the phase 13 function only in the 22-07 UAT.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-10-04T00:15:32Z
- **Completed:** 2026-10-04T00:17:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql` adds the two nullable jsonb columns, drops and recreates both CHECKs, and reloads the PostgREST schema. Legacy program and EVA columns stay in the table.
- Each CHECK is `col is null or (jsonb_typeof(col) = 'object' and octet_length(col::text) <= 20000)`. The footer lists the four SQL Editor checks, including `has_column_privilege`.
- `22-USER-SETUP.md` tells the operator to paste that script before running the app after plan 22-03, and to publish `patient-ai-summary` only from the phase 13 source after plan 22-04, during the plan 22-07 UAT.

## Task Commits

Each task was committed atomically:

1. **Task 1: Script SQL das duas colunas jsonb** - `f4fc865` (feat)
2. **Task 2: Documento de setup do operador** - `c1fe6bd` (docs)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

## Files Created/Modified

- `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql` - Idempotent DDL, CHECKs, `notify pgrst`, four verification comments
- `.planning/phases/22-resumo-paciente-ia/22-USER-SETUP.md` - Dashboard steps and the eight hosted UAT checks plus the `patient_pain_logs` count

## Decisions Made

- No new policy and no GRANT in the script. `patients_update` with `private.can_write_patient` already covers new columns. Check 4 tells the operator if a column-level GRANT is missing.
- The operator must paste the SQL in the SQL Editor before running the app after plan 22-03. From that plan the chart selects `ai_summary_fields` and `summary_edits`; without the columns PostgREST refuses the patient read.
- This plan does not publish the Edge Function. Publishing happens in the plan 22-07 UAT, after plan 22-04 edits `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`. The phase 11 source and `supabase/functions/patient-ai-summary/index.ts` stay unpublished.
- REQ-33 stays open. Plans 22-03 through 22-07 still own writes, the prompt, and the UI.

## Verification

- Script exists, 64 lines, not empty.
- Outside comments: `add column if not exists` on 2 lines, `jsonb_typeof` on 2 lines, `create policy` / `supabase db push` / `drop column` on 0 lines.
- `grep -c "create policy"` on the script is 0, including comments.
- `supabase/migrations` has no phase 22 file. No Supabase CLI command was run. The SQL was not executed against a live database.
- `22-USER-SETUP.md` cites `22-patient-summary-fields.sql` and `13-pdf-export-avaliacao-evolucao`, forbids the phase 11 source, and mentions `supabase db push` only to forbid it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pending publish step no longer says to publish now**
- **Found during:** STATE.md update after both tasks
- **Issue:** The pending list still told the operator to publish `patient-ai-summary` from the phase 13 file immediately. That would ship the function before plan 22-04 edits it.
- **Fix:** The pending line now waits for the plan 22-07 UAT, and a new line tells the operator to paste `22-patient-summary-fields.sql` before running the app after plan 22-03.
- **Files modified:** `.planning/STATE.md`
- **Verification:** The pending section names the SQL path, forbids `supabase db push` and `supabase functions deploy`, and points publish at plan 22-07.
- **Committed in:** docs commit for this plan

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Operator instructions in STATE match 22-USER-SETUP.md. No SQL or app code changed.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** See [22-USER-SETUP.md](./22-USER-SETUP.md) for:

- No new environment variables. `GEMINI_API_KEY` is already a function secret if phase 11/13 generation already worked. Nothing goes to `VITE_*`.
- Paste `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql` in the Supabase SQL Editor **before running the app after plan 22-03**, then run the four footer checks. Without those columns the patient chart will fail to load.
- Do not publish `patient-ai-summary` in this plan. Publish only in the plan 22-07 UAT, from the phase 13 source after plan 22-04 edits it.

## Next Phase Readiness

- Plan 22-03 can select and write `ai_summary_fields` and `summary_edits`. The hosted database will not have those columns until the operator pastes the script.
- Plan 22-04 edits the phase 13 function. Plan 22-07 is the first plan that asks the operator to publish it.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: .planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql
- FOUND: .planning/phases/22-resumo-paciente-ia/22-USER-SETUP.md
- FOUND commits: f4fc865, c1fe6bd

---
*Phase: 22-resumo-paciente-ia*
*Completed: 2026-10-04*
