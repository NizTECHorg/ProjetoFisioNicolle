---
phase: 16-foto-do-paciente
plan: 01
subsystem: database
tags: [supabase, storage, rls, zod, patient-avatars]

requires:
  - phase: 07-galeria-de-imagens-na-ficha-do-paciente
    provides: Private bucket insert, regex-before-uuid storage policies, notify pgrst
  - phase: 03-tipos-de-conta-e-equipe
    provides: private.can_read_patient, private.can_write_patient, and patients_update
provides:
  - Idempotent SQL for private bucket patient-avatars and nullable patients.photo_path
  - patientPhotoSchema that accepts only image/jpeg and image/png
affects:
  - 16-02 avatar upload service
  - 16-03 signed URL rendering

tech-stack:
  added: []
  patterns:
    - Separate private bucket patient-avatars; gallery bucket left untouched
    - patientPhotoSchema beside imageUploadSchema; gallery MIME list unchanged

key-files:
  created:
    - .planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql
    - .planning/phases/16-foto-do-paciente/16-USER-SETUP.md
  modified:
    - src/schemas/patient.schema.ts

key-decisions:
  - "Private bucket patient-avatars, ON CONFLICT DO NOTHING, no UPDATE of a leftover public bucket"
  - "patients.photo_path stays nullable; no new policy on public.patients"
  - "patientPhotoSchema is JPEG and PNG only; imageUploadSchema still allows WebP and PDF"
  - "Operator pastes the SQL in the Supabase SQL Editor; the script is not applied from this plan"

patterns-established:
  - "Avatar bytes live in patient-avatars; the gallery bucket and its policies stay as they are"
  - "Avatar Zod schema is a sibling of imageUploadSchema, not a tighter enum on the gallery schema"

requirements-completed: []

duration: 3min
completed: 2026-09-24
---

# Phase 16 Plan 01: Patient avatar store and PNG/JPEG schema Summary

**Private bucket `patient-avatars` (JPEG/PNG, 2 MiB) plus nullable `patients.photo_path`, and a `patientPhotoSchema` that does not reuse the gallery WebP/PDF allow-list.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-24T00:27:47Z
- **Completed:** 2026-09-24T00:31:00Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Idempotent SQL creates private bucket `patient-avatars` (`public` false, `file_size_limit` 2097152, MIME `image/jpeg` and `image/png` only) and nullable `patients.photo_path` with CHECK `patients_photo_path_shape`
- Storage policies are SELECT via `can_read_patient` and INSERT/DELETE via `can_write_patient`. There is no UPDATE policy and no anon policy
- `patientPhotoSchema` accepts only PNG and JPEG. `imageUploadSchema` still allows WebP and PDF

## Task Commits

Each task was committed atomically:

1. **Task 1: SQL for patient-avatars and photo_path** - `5994caf` (feat)
2. **Task 2: patientPhotoSchema for PNG and JPEG only** - `6874d5f` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` — Bucket, column, CHECK, and storage policies for the operator to paste
- `src/schemas/patient.schema.ts` — `PATIENT_PHOTO_MIMES`, `MAX_PATIENT_PHOTO_BYTES`, `patientPhotoSchema`, `PatientPhotoInput`
- `.planning/phases/16-foto-do-paciente/16-USER-SETUP.md` — SQL Editor paste steps

## Decisions Made

- Bucket id `patient-avatars` uses `ON CONFLICT (id) DO NOTHING`. A public leftover is fixed in the Dashboard, not by UPDATE.
- No new policy on `public.patients`. Existing `patients_update` already uses `can_write_patient`.
- Avatar validation is a new schema. Gallery `PATIENT_IMAGE_MIMES` and `imageUploadSchema` stay byte-for-byte.
- The SQL file is not applied in this plan. The operator pastes it in the SQL Editor.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration.** See [16-USER-SETUP.md](./16-USER-SETUP.md) for:

- Paste `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` in the Supabase SQL Editor once
- Confirm the bucket is private and `photo_path` stays null on existing rows

## Next Phase Readiness

Ready for 16-02. Upload code can import `patientPhotoSchema`. The bucket and column exist only after the operator runs the SQL.

---
*Phase: 16-foto-do-paciente*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql`
- FOUND: `src/schemas/patient.schema.ts` (`patientPhotoSchema`)
- FOUND: commit `5994caf`
- FOUND: commit `6874d5f`
