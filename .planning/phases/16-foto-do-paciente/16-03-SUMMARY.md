---
phase: 16-foto-do-paciente
plan: 03
subsystem: api
tags: [supabase, storage, react-query, patient-avatars, signed-url]

requires:
  - phase: 16-foto-do-paciente
    provides: Private bucket patient-avatars, patients.photo_path, and patientPhotoSchema from plan 16-01
provides:
  - uploadPatientPhoto, removePatientPhoto, and signPatientPhotoUrls on bucket patient-avatars
  - useUploadPatientPhoto and useRemovePatientPhoto with Portuguese toasts
  - photoUrl on PatientListItem, Patient, and PatientDashboard
affects:
  - 16-04 patient, calendar, and board signing

tech-stack:
  added: []
  patterns:
    - New object path per upload, upsert false, signed URL kept in memory for 3600 seconds
    - Null photo_path before storage.remove so initials win if the delete fails

key-files:
  created:
    - src/services/patientPhoto.service.ts
  modified:
    - src/types/patient.ts
    - src/hooks/usePatients.ts
    - src/services/patients.service.ts

key-decisions:
  - "Photo invalidation uses exact query keys so the patients prefix does not refresh the gallery"
  - "Mappers set photoUrl null until plan 16-04 signs photo_path"

patterns-established:
  - "Avatar bytes live only in patient-avatars; this flow never inserts patient_images"
  - "Postgres failures use mapDbError; storage failures use the photo Portuguese sentences"

requirements-completed: []

duration: 3min
completed: 2026-09-24
---

# Phase 16 Plan 03: Patient photo persistence Summary

**Upload and remove a patient avatar on bucket `patient-avatars` with a new object path each time, a 3600-second signed URL that is never stored, and `photoUrl` on the patient DTOs.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-24T00:37:18Z
- **Completed:** 2026-09-24T00:40:37Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- `uploadPatientPhoto` writes `{patientId}/{uuid}.jpg|png` to `patient-avatars` with `upsert: false`, then sets `patients.photo_path`. A failed update deletes the new object via `mapDbError`. A successful replace best-effort deletes the previous path.
- `removePatientPhoto` sets `photo_path` to null before `storage.remove`. A failed delete throws “Não foi possível remover a foto. Tente de novo.” and leaves initials in place.
- `signPatientPhotoUrls` calls `createSignedUrls` for 3600 seconds, skips entries with `error`, and returns a `Map`. It never calls `getPublicUrl`.
- `useUploadPatientPhoto` and `useRemovePatientPhoto` toast “Foto atualizada.” and “Foto removida.” and refresh patients, the ficha, the dashboard, the calendar, and the board without the gallery key.

## Task Commits

Each task was committed atomically:

1. **Task 1: patientPhoto.service upload, remove, and sign** - `e756885` (feat)
2. **Task 2: photoUrl on patient DTOs and photo mutations** - `c5ea56a` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/services/patientPhoto.service.ts` — Upload, remove, and batch sign against `patient-avatars`
- `src/types/patient.ts` — `photoUrl: string | null` beside `photoTone` on the three patient DTOs
- `src/hooks/usePatients.ts` — `useUploadPatientPhoto`, `useRemovePatientPhoto`, and exact photo invalidation
- `src/services/patients.service.ts` — `photoUrl: null` on the three mappers until plan 16-04 signs paths

## Decisions Made

- Photo invalidation uses `exact: true` on `['patients']`, `['patients', id]`, and `['patients', id, 'dashboard']`. TanStack Query prefix matching would otherwise refresh `['patients', id, 'images']`.
- The three patient mappers set `photoUrl: null`. Plan 16-04 owns selecting `photo_path` and calling `signPatientPhotoUrls`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Exact photo invalidation so the gallery stays cached**
- **Found during:** Task 2 (photoUrl on patient DTOs and photo mutations)
- **Issue:** Invalidating `['patients']` without `exact` also matches `['patients', patientId, 'images']`, which would refresh the gallery after an avatar change.
- **Fix:** `invalidatePatientPhoto` uses `exact: true` on the three patient keys. `invalidatePatient` is unchanged and still invalidates images for other mutations.
- **Files modified:** `src/hooks/usePatients.ts`
- **Verification:** The photo helper has no `images` key; `npm run typecheck` passes
- **Committed in:** `c5ea56a` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Ignore a thrown failure when deleting the previous object**
- **Found during:** Task 1 (patientPhoto.service upload, remove, and sign)
- **Issue:** After `photo_path` already points at the new object, a thrown storage error on the old path would surface vendor text and fail a save that already succeeded.
- **Fix:** The previous-path `storage.remove` is wrapped so that failure is ignored. The new object stays the pointer.
- **Files modified:** `src/services/patientPhoto.service.ts`
- **Verification:** `npm run lint` and `npm run typecheck` pass; the file does not import `mapStorageError`
- **Committed in:** `e756885` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both keep the avatar flow correct: the gallery cache stays put, and a successful replace is not reported as a failure. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Known Stubs

- `src/services/patients.service.ts` — `photoUrl: null` in `mapListItem`, `mapPatient`, and the dashboard return. Intentional. Plan 16-04 selects `photo_path` and fills `photoUrl` from `signPatientPhotoUrls`. This plan does not sign inside a mapper or a component.

## Next Phase Readiness

Ready for 16-04. The service can upload, remove, and sign. Screens can read `photoUrl`, which stays null until the patient, calendar, and board services attach signed URLs.

## Self-Check: PASSED

- FOUND: src/services/patientPhoto.service.ts
- FOUND: src/hooks/usePatients.ts
- FOUND: src/types/patient.ts
- FOUND: e756885
- FOUND: c5ea56a

## Verification

- `npm run lint` and `npm run typecheck` passed after each task. One pre-existing warning in `.cursor/get-shit-done/bin/lib/state.cjs` is outside this plan.
- `patient-avatars`, `uploadPatientPhoto`, and `signPatientPhotoUrls` are present. The service does not reference `mapStorageError`, `patient_images`, `getPublicUrl`, or `upsert: true`.
- Hooks toast `Foto atualizada.` and `Foto removida.` and invalidate `['board']` without the images key.

---
*Phase: 16-foto-do-paciente*
*Completed: 2026-09-24*
