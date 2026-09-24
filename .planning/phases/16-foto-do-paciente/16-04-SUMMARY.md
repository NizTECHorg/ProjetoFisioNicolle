---
phase: 16-foto-do-paciente
plan: 04
subsystem: api
tags: [supabase, storage, signed-url, patient-avatars]

requires:
  - phase: 16-foto-do-paciente
    provides: signPatientPhotoUrls and photoUrl on the patient DTOs from plan 16-03
provides:
  - photoUrl on list, ficha, and dashboard patient reads from a signed photo_path
  - photoUrl on CalendarSession, BoardCard, and DueBoardCard
affects:
  - 16-05 camera upload on the ficha and the patient list
  - 16-06 photo display on quadro, agenda, painel, and the shortcut

tech-stack:
  added: []
  patterns:
    - Services select photo_path and attach a short-lived photoUrl; the path never leaves the service on the camelCase DTO

key-files:
  created: []
  modified:
    - src/services/patients.service.ts
    - src/services/calendar.service.ts
    - src/services/board.service.ts

key-decisions:
  - "photoUrl comes only from signPatientPhotoUrls and is never written back to Postgres"
  - "A missing photo_path leaves photoUrl null and keeps the existing photoTone"

patterns-established:
  - "Patient, calendar, and board reads sign photo_path once per fetch through patientPhoto.service"

requirements-completed: []

duration: 2min
completed: 2026-09-24
---

# Phase 16 Plan 04: Signed photo on every patient read Summary

**List, ficha, dashboard, agenda, and quadro select `photo_path` and return a 3600-second `photoUrl`, leaving initials when the path is missing.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-24T00:43:02Z
- **Completed:** 2026-09-24T00:45:29Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- `listPatients`, `getPatientById`, and `getPatientDashboard` select `photo_path` and set `photoUrl` from `signPatientPhotoUrls`. `photoTone` stays `row.photo_tone || 'bg-forest'`.
- `listSessionsInRange` embeds `patients(full_name, code, photo_tone, photo_path)` and sets `CalendarSession.photoUrl`. A missing embed keeps `photoTone` as `bg-forest` and `photoUrl` null.
- `listBoard` and `listDueCards` embed `photo_path`, sign once per list, and set `photoUrl` on `BoardCard` and `DueBoardCard`. `photoTone` stays `patient?.photo_tone ?? null`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Select and sign photo_path on patient reads** - `c680701` (feat)
2. **Task 2: Sign photo_path on calendar and board embeds** - `7c61f33` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/services/patients.service.ts` — `photo_path` on DETAIL, LIST, and DASHBOARD selects; mappers set `photoUrl` from the signed map
- `src/services/calendar.service.ts` — `photoUrl` on `CalendarSession` from the patients embed
- `src/services/board.service.ts` — `photoUrl` on `BoardCard` and `DueBoardCard` from both patient embeds

## Decisions Made

- `photoUrl` is resolved in the service from `signPatientPhotoUrls` and is not written back to Postgres. `photo_path` stays off the camelCase DTOs.
- A null or absent path yields `photoUrl` null. `photoTone` mapping is unchanged, so initials remain.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 16-05 can wire the camera and file picker; the reads already return `photoUrl`.
- Plan 16-06 can pass that `photoUrl` into `PatientAvatar` on the quadro, agenda, painel, and shortcut.

## Self-Check: PASSED

- FOUND: src/services/patients.service.ts
- FOUND: src/services/calendar.service.ts
- FOUND: src/services/board.service.ts
- FOUND: c680701
- FOUND: 7c61f33

---
*Phase: 16-foto-do-paciente*
*Completed: 2026-09-24*
