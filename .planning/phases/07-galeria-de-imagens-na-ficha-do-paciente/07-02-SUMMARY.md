---
phase: 07-galeria-de-imagens-na-ficha-do-paciente
plan: 02
subsystem: database
tags: [postgres, supabase, rls, storage, patient-images, session_removed]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: private.can_read_patient / private.can_write_patient; SQL Editor apply path
  - phase: 07-01
    provides: PatientImage sessionRemoved; MIME/size contracts (jpeg/png/webp, 8 MiB)
provides:
  - Idempotent bucket + patient_images + RLS SQL (committed phase copy + gitignored Editor paste)
  - Private storage.buckets patient-images (public false, jpeg/png/webp, 8 MiB)
  - public.patient_images with session_id ON DELETE SET NULL (D-06) and session_removed (D-07)
  - Table + storage.objects policies calling Phase 3 can_read_patient / can_write_patient (D-11)
  - BEFORE DELETE trigger on patient_sessions marking session_removed before FK SET NULL
  - Hosted schema applied via SQL Editor (not supabase db push)
affects:
  - 07-03 patientImages.service upload/INSERT/signed URLs
  - 07-04 / 07-05 gallery UI persistence

tech-stack:
  added: []
  patterns:
    - SQL Editor apply only; never supabase db push
    - Call Phase 3 can_* helpers; do not DROP or rewrite them
    - session_id ON DELETE SET NULL; BEFORE DELETE trigger sets session_removed true
    - Bucket INSERT public false; ON CONFLICT (id) DO NOTHING; never image/*

key-files:
  created:
    - .planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql
  modified: []

key-decisions:
  - "SQL Editor is the apply path; do not run supabase db push"
  - "session_id ON DELETE SET NULL so deleting a sessão does not delete photos (D-06)"
  - "session_removed boolean default false; BEFORE DELETE on patient_sessions sets it true (D-07)"
  - "Table and storage.objects policies call private.can_read_patient / can_write_patient; Phase 3 helpers are not rewritten (D-11)"

patterns-established:
  - "Identity of an orphan vs avulsa-original is session_removed, not session_id null alone"
  - "Storage policies bind bucket_id = 'patient-images'; UUID regex on folder[1] before ::uuid; no storage UPDATE policy"
  - "ON CONFLICT (id) DO NOTHING on the bucket; leftover public reuse of the id is a Dashboard fix, not a blind UPDATE public = false"

requirements-completed: [REQ-19, REQ-19.3, REQ-19.5, REQ-19.6]

duration: 7min
completed: 2026-09-15
---

# Phase 7 Plan 02: SQL bucket/table/RLS Summary

**Private patient-images bucket (jpeg/png/webp, 8 MiB), patient_images with SET NULL + session_removed, table and Storage RLS via Phase 3 can_* helpers, and D-07 session-delete trigger — applied in SQL Editor, not supabase db push**

## Performance

- **Duration:** 7 min (Task 1 authoring plus human SQL Editor apply; continuation after checkpoint)
- **Started:** 2026-09-15T02:20:00Z
- **Completed:** 2026-09-15T02:27:00Z
- **Tasks:** 2
- **Files modified:** 1 committed (+ gitignored Editor copy)

## Accomplishments

- Authored idempotent SQL: private bucket `patient-images`, table `patient_images` (session_id ON DELETE SET NULL, session_removed, MIME/size/path CHECKs), FORCE RLS, Storage policies, and BEFORE DELETE trigger on `patient_sessions`
- GRANT select/insert/update/delete to `authenticated`; REVOKE from `anon`/`public`; no `service_role`; no `DELETE FROM storage.objects`; Phase 3 `can_*` helpers not rewritten
- Human confirmed resume-signal `applied` — hosted SQL Editor run succeeded. Bucket, table, RLS, and D-07 trigger are live. SQL was not rewritten. `supabase db push` was not used

## Task Commits

Each task was committed atomically:

1. **Task 1: Author committed SQL and Editor copy** - `830d726` (feat)
2. **Task 2: Apply SQL in Editor [BLOCKING]** - n/a (human confirmed `applied`; no further code change)

**Plan metadata:** (this commit)

## Files Created/Modified

- `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql` — source of truth (218 lines)
- `supabase/07-patient-images.sql` — identical Editor paste copy (gitignored `/supabase/`)

## Decisions Made

- Apply path remains hosted SQL Editor; do not run `supabase db push`
- `session_id` references `patient_sessions` ON DELETE SET NULL so deleting a sessão does not delete photos (D-06)
- `session_removed` boolean not null default false; BEFORE DELETE on `patient_sessions` marks matching rows true, then FK SET NULL runs (D-07). Do not use UPDATE OF session_id on `patient_images`
- Table INSERT/UPDATE/DELETE and Storage SELECT/INSERT/DELETE call `private.can_read_patient` / `private.can_write_patient`; Phase 3 helpers and `patient_sessions_*` policies were not dropped or rewritten (D-11)
- No Storage UPDATE policy (no upsert). Bucket INSERT is `public false` with `ON CONFLICT (id) DO NOTHING`; never `image/*`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Human confirmed the hosted SQL Editor run succeeded. SQL was not rewritten. A2/A9 fallbacks (Storage wrapper functions / split bucket INSERT) were not needed.

## Auth Gates

- Task 2 was `checkpoint:human-action` (SQL Editor apply). Normal flow, not a deviation. Resume-signal: `applied`.

## Known Stubs

None. This plan only created schema; no UI stubs.

## User Setup Required

SQL Editor apply for this plan is **done** (human confirmed `applied`). Do not run `supabase db push`.

If the gitignored `supabase/07-patient-images.sql` is missing locally, copy from `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql`.

## Next Phase Readiness

Wave 1 SQL is live. Wave 2 can start: 07-03 `patientImages.service` + hooks (upload/INSERT/signed URLs). Do not implement in this plan.

REQ-19 gallery UI stays open until 07-03–07-05. This plan delivered REQ-19.5 persistence (private bucket + table + RLS) and D-06/D-07 schema.

App code that uploads to `patient-images` or INSERTs `patient_images` may start in 07-03.

## Verification

- Both SQL paths exist, 218 lines, byte-identical
- `grep -v '^--'` contains `patient-images`, `session_removed`, `on delete set null`, `can_read_patient`, `can_write_patient`, `file_size_limit`
- `grep -v '^--'` has 0 matches for `public = true`, `public, true`, `delete from storage.objects`, `supabase db push`, `service_role`, `image/*`
- Footer comments include creator CRUD, empresa SELECT, empresa INSERT 42501, HEIC reject, D-07 orphan flag, Phase 3 helpers unchanged
- Human: SQL Editor run succeeded; no error reported. Do not invent Table Editor screenshots
- Do not run `supabase db push`

## Self-Check: PASSED

- FOUND: `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql`
- FOUND: `supabase/07-patient-images.sql`
- FOUND: `830d726`

---
*Phase: 07-galeria-de-imagens-na-ficha-do-paciente*
*Completed: 2026-09-15*
