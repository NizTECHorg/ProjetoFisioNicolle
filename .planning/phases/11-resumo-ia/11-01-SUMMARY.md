---
phase: 11-resumo-ia
plan: 01
subsystem: database
tags: [resumo-ia, zod, supabase-storage, rls, patient-ai-reports, typescript]

# Dependency graph
requires:
  - phase: 07-galeria-de-imagens-na-ficha-do-paciente
    provides: patient-images SQL analog (private bucket + can_read/can_write RLS pattern)
  - phase: 03-seguranca-rls
    provides: private.can_read_patient / can_write_patient helpers (reused, not rewritten)
provides:
  - PatientAiReport DTOs + UpdatePatientInput.aiSummary write path
  - PATIENT_AI_COPY + patientAi Zod schemas + mapPatientAiError (pt-BR)
  - Idempotent patient-ai-reports private PDF bucket + patient_ai_reports table with RLS (human-applied via SQL Editor)
affects: [11-02, 11-03, 11-04, wave-3-pdf-export, wave-4-report-list]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SQL Editor-only apply (no supabase db push); twin files in phase sql/ + supabase/
    - DTO signedUrl field never persisted as DB column
    - AI error mapper reuses mapDbError; never returns English Gemini/PostgREST raw

key-files:
  created:
    - src/schemas/patientAi.schema.ts
    - .planning/phases/11-resumo-ia/sql/11-patient-ai-reports.sql
    - supabase/11-patient-ai-reports.sql
  modified:
    - src/types/patient.ts
    - src/lib/security/index.ts
    - src/services/patients.service.ts

key-decisions:
  - "D-04: updatePatient writes patients.ai_summary via emptyToNull when aiSummary is defined"
  - "D-05: private bucket patient-ai-reports (8MiB, application/pdf only) + patient_ai_reports metadata"
  - "D-06: Portuguese PATIENT_AI_COPY + mapPatientAiError for generate/export errors"
  - "SQL applied via hosted SQL Editor only; human confirmed approved"

patterns-established:
  - "Mirror googleCalendar.schema.ts: COPY object + Zod invoke/upload schemas + z.infer exports"
  - "session_id ON DELETE SET NULL + session_label denormalized for list after session delete"
  - "Storage policies bucket-scoped; no UPDATE storage policy; no DELETE FROM storage.objects in DDL"

requirements-completed: [REQ-23, REQ-23.3, REQ-23.5]

# Metrics
duration: ~12min
completed: 2026-09-19
---

# Phase 11 Plan 01: Resumo IA Contracts + Schema Summary

**TypeScript/Zod Resumo IA contracts with `aiSummary` → `patients.ai_summary` write path, plus human-applied private `patient-ai-reports` bucket and `patient_ai_reports` RLS table**

## Performance

- **Duration:** ~12 min (Tasks 1–2 automated) + human SQL Editor apply
- **Started:** 2026-09-19T14:21:32Z
- **Completed:** 2026-09-19T14:33:00Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments
- Locked `PatientAiReport` / `PatientAiReportKind` DTOs and optional `UpdatePatientInput.aiSummary`
- Opened `updatePatient` write branch mapping `aiSummary` → `patients.ai_summary` via `emptyToNull` (D-04)
- Shipped `PATIENT_AI_COPY`, Zod invoke/upload schemas, and `mapPatientAiError` (pt-BR, D-06)
- Authored identical idempotent SQL twins; human applied in SQL Editor — private bucket `patient-ai-reports` + table `patient_ai_reports` with RLS live (D-05, REQ-23.5)

## Task Commits

Each task was committed atomically:

1. **Task 1: Contracts, aiSummary write, Portuguese AI mapper** - `360ef96` (feat)
2. **Task 2: Author patient_ai_reports SQL (bucket + table + RLS)** - `bcfd565` (feat)
3. **Task 3: Apply SQL in hosted SQL Editor [BLOCKING]** - human-action approved (no code commit; schema applied out-of-band)

**Plan metadata:** _(this docs commit)_

## Auth Gates / Human Actions

| Task | Type | Outcome |
|------|------|---------|
| 3 | checkpoint:human-action | Human typed **approved** after SQL Editor succeed. Confirmed: `patient-ai-reports` bucket + `patient_ai_reports` table applied. No `supabase db push` used. |

## Files Created/Modified
- `src/types/patient.ts` — `PatientAiReportKind`, `PatientAiReport`, `UpdatePatientInput.aiSummary`
- `src/schemas/patientAi.schema.ts` — `PATIENT_AI_COPY`, invoke/upload Zod schemas
- `src/lib/security/index.ts` — `mapPatientAiError` Portuguese mapper
- `src/services/patients.service.ts` — `ai_summary` write branch on `updatePatient`
- `.planning/phases/11-resumo-ia/sql/11-patient-ai-reports.sql` — committed idempotent DDL (bucket + table + RLS)
- `supabase/11-patient-ai-reports.sql` — Editor paste twin (gitignored; byte-identical)

## Decisions Made
- Followed plan locks: D-04 write path, D-05 private PDF bucket + metadata table, D-06 PT error strings
- Schema apply path remains SQL Editor only (Supabase CLI not installed; `/supabase/` gitignored)
- `signedUrl` stays DTO-only; never a DB column
- Reuse Phase 3 `can_read_patient` / `can_write_patient` — do not rewrite helpers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — Task 3 blocked on human SQL Editor apply as planned; resumed after approval.

## User Setup Required
**External services require manual configuration (completed for this plan).** Hosted Supabase SQL Editor was used to apply `11-patient-ai-reports.sql`:
- Storage → Buckets → `patient-ai-reports` (Private, MIME `application/pdf`)
- Table `public.patient_ai_reports` with RLS via `can_read_patient` / `can_write_patient`

No new env vars in this plan (Gemini/VITE_GEMINI deferred to later waves).

## Next Phase Readiness
- Wave 1 foundation ready for EF generate and PDF upload plans
- Contracts, mapper, and live RLS wall available for Wave 3 export + Wave 4 list
- Do not re-apply DDL unless idempotent re-run needed; do not use `supabase db push`

## Self-Check: PASSED
- FOUND: `src/types/patient.ts`, `src/schemas/patientAi.schema.ts`, `src/lib/security/index.ts`, `src/services/patients.service.ts`
- FOUND: `.planning/phases/11-resumo-ia/sql/11-patient-ai-reports.sql`, `supabase/11-patient-ai-reports.sql`
- FOUND commits: `360ef96`, `bcfd565`
- Task 3: human-action approved (SQL Editor apply confirmed by user)

---
*Phase: 11-resumo-ia*
*Completed: 2026-09-19*
