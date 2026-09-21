---
phase: 13-pdf-export-avaliacao-evolucao
plan: 01
subsystem: database
tags: [postgres, zod, rls, patient-ai-reports, kind]

requires:
  - phase: 11-resumo-ia
    provides: patient_ai_reports table, kind CHECK geral|sessao, INSERT policy
provides:
  - Idempotent SQL extending kinds to avaliacao|evolucao (hosted SQL Editor applied 2026-09-21)
  - Client Zod/types/list badges for four kinds
  - Upload XOR matching CHECK (sessionless kinds ⇒ session_id null)
affects:
  - 13-03 (composer export persist)
  - 13-04+ (PDF upload with new kinds)

tech-stack:
  added: []
  patterns:
    - Twin SQL under phase sql/ (tracked) + supabase/ (Editor paste, gitignored)
    - Kind badge switch with PATIENT_AI_COPY keys

key-files:
  created:
    - supabase/13-patient-ai-reports-kinds.sql
    - .planning/phases/13-pdf-export-avaliacao-evolucao/sql/13-patient-ai-reports-kinds.sql
  modified:
    - src/types/patient.ts
    - src/schemas/patientAi.schema.ts
    - src/services/patientAiReports.service.ts
    - src/components/patients/PatientAiReportsList.tsx

key-decisions:
  - "No backfill of legacy geral → avaliacao; list keeps Geral badge"
  - "sessionLabel denorm for evolucao (required) and optional avaliacao title/date"
  - "Tracked SQL twin under .planning/.../sql/; supabase/ twin for Editor (gitignored)"

patterns-established:
  - "Kind enum + Zod XOR mirror SQL CHECK + INSERT WITH CHECK"
  - "List badges: Avaliação / Evolução / Geral / Sessão via switch"

requirements-completed: [REQ-25, REQ-25.5]

duration: 2min
completed: 2026-09-21
---

# Phase 13 Plan 01: SQL kinds + Zod/list badges Summary

**Idempotent SQL + client Zod/types extend `patient_ai_reports` kinds to `avaliacao`/`evolucao` with honest list badges; hosted SQL Editor apply confirmed Success.**

## Performance

- **Duration:** ~2 min (+ human SQL apply)
- **Started:** 2026-09-21T03:15:18Z
- **Completed:** 2026-09-21T12:54:00Z (Task 3 Success)
- **Tasks:** 3/3 complete
- **Files modified:** 6 (5 tracked + supabase twin on disk)

## Accomplishments

- Idempotent migration drops/recreates `patient_ai_reports_kind_ck`, `kind_session_ck`, and INSERT policy for four kinds + XOR
- Client `PatientAiReportKind`, Zod upload XOR, and Avaliações salvas badges match D-06 / UI-SPEC
- Legacy `geral`/`sessao` remain readable; no backfill

## Task Commits

1. **Task 1: Write idempotent SQL for kinds avaliacao/evolucao** - `5f2ce00` (feat)
2. **Task 2: Client kinds, upload XOR, list badges, sessionLabel** - `4f7c943` (feat)
3. **Task 3: Apply kinds SQL in SQL Editor** - Success (user confirmed 2026-09-21)

**Plan metadata:** (docs commit after SUMMARY)

## Files Created/Modified

- `supabase/13-patient-ai-reports-kinds.sql` - Editor paste script (gitignored `/supabase/`; present on disk)
- `.planning/phases/13-pdf-export-avaliacao-evolucao/sql/13-patient-ai-reports-kinds.sql` - tracked twin
- `src/types/patient.ts` - kind union +avaliacao|evolucao
- `src/schemas/patientAi.schema.ts` - enum, XOR, kindAvaliacao/kindEvolucao copy
- `src/services/patientAiReports.service.ts` - sessionLabel for evolucao/avaliacao
- `src/components/patients/PatientAiReportsList.tsx` - four-kind badge switch

## Decisions Made

- No backfill of legacy `geral` rows into `avaliacao` (Open Question 2 / D-06)
- `sessionLabel` always denormalized for `evolucao`; optional for `avaliacao`; unchanged for `sessao`
- `/supabase/` remains gitignored; phase `sql/` twin is the committed source of truth (same as Phases 11–12)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Tracked SQL path under gitignore**
- **Found during:** Task 1
- **Issue:** `git add supabase/13-patient-ai-reports-kinds.sql` ignored by `.gitignore` `/supabase/`
- **Fix:** Committed twin under `.planning/.../sql/` (plan already required twin); left Editor copy at `supabase/` on disk for human paste
- **Files modified:** phase sql twin only in git
- **Verification:** `cmp` twins identical; file exists at supabase path for Editor
- **Committed in:** `5f2ce00`

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** None — Editor path still valid; tracked artifact matches project convention.

## Issues Encountered

None beyond gitignore twin handling above.

## Pending: Task 3 SQL Editor (blocking)

**Status:** pending-SQL — do **not** invent Success.

Human must apply:

`supabase/13-patient-ai-reports-kinds.sql`

(same content as `.planning/phases/13-pdf-export-avaliacao-evolucao/sql/13-patient-ai-reports-kinds.sql`)

via **Supabase Dashboard → SQL Editor**. Do **not** use `supabase db push`.

## User Setup Required

**Hosted SQL must be applied manually** before Wave 3+ persistence of new kinds:

1. Open Supabase Dashboard → SQL Editor
2. Paste full contents of `supabase/13-patient-ai-reports-kinds.sql`
3. Run → expect Success
4. Reply Success (or paste error)

## Next Phase Readiness

- Client ready for composers/uploads using `avaliacao`/`evolucao`
- **Blocked:** hosted CHECK/policy until Task 3 Success — INSERT of new kinds will fail closed until then

## Self-Check: PASSED

- FOUND: supabase/13-patient-ai-reports-kinds.sql
- FOUND: .planning/phases/13-pdf-export-avaliacao-evolucao/sql/13-patient-ai-reports-kinds.sql
- FOUND: 5f2ce00
- FOUND: 4f7c943
- FOUND: kindAvaliacao / PatientAiReportKind union
- typecheck: passed

---
*Phase: 13-pdf-export-avaliacao-evolucao*
*Completed: 2026-09-21 (Tasks 1–2; Task 3 pending-SQL)*
