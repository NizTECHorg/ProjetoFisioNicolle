---
phase: 16-foto-do-paciente
plan: 05
subsystem: ui
tags: [react, file-input, patient-photo, confirm-dialog]

requires:
  - phase: 16-foto-do-paciente
    provides: preparePatientPhoto, useUploadPatientPhoto, useRemovePatientPhoto, and signed photoUrl from plans 16-02 through 16-04
provides:
  - Camera overlay and PNG/JPEG picker on writable ficha and list avatars
  - Remover foto in the ficha name row after the status pill
affects:
  - 16-06 photo display on quadro, agenda, painel, and the shortcut

tech-stack:
  added: []
  patterns:
    - PatientPhotoControl is the avatar label only; PatientPhotoRemoveButton is a separate export mounted by the ficha header

key-files:
  created:
    - src/components/patients/PatientPhotoControl.tsx
  modified:
    - src/components/patients/PatientProfileHeader.tsx
    - src/pages/PatientPage.tsx
    - src/pages/PatientsPage.tsx

key-decisions:
  - "Remover foto is PatientPhotoRemoveButton after the status pill; the avatar cell always passes showRemove false"
  - "Writable list rows keep the file control outside the link and stop click and keydown on desktop"

patterns-established:
  - "group/photo overlay on the label so the ficha header group does not reveal the camera"
  - "Consulta and read-only list rows keep PatientAvatar and never mount the picker or Remover foto"

requirements-completed: []

duration: 4min
completed: 2026-09-24
---

# Phase 16 Plan 05: Camera and file picker Summary

**Writers change a patient photo from a camera overlay on the ficha and the list, and remove it from the name row after the status pill.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T00:47:04Z
- **Completed:** 2026-09-24T00:51:10Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- `PatientPhotoControl` is a label with `group/photo`, an `sr-only` PNG/JPEG input, and a camera that becomes a white spinner while the upload is pending. `preparePatientPhoto` runs before `useUploadPatientPhoto`.
- `PatientPhotoRemoveButton` confirms with **Voltar** and **Remover foto**. It returns null when there is no photo. The avatar cell never renders it.
- The ficha mounts the control at size `lg` only when `canWrite`. The list mounts it at size `md` only when `canWritePatient` is true, outside the mobile link and with `stopPropagation` on the desktop wrapper.

## Task Commits

Each task was committed atomically:

1. **Task 1: PatientPhotoControl camera, picker, and remove** - `43e852e` (feat)
2. **Task 2: Editable ficha header and patient list** - `1b804d7` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/components/patients/PatientPhotoControl.tsx` — camera label, PNG/JPEG input, and `PatientPhotoRemoveButton`
- `src/components/patients/PatientProfileHeader.tsx` — writable avatar plus Remover foto after the status pill
- `src/pages/PatientPage.tsx` — passes `patientId`, `photoUrl`, and `canWrite` into the header
- `src/pages/PatientsPage.tsx` — writable rows use the control; read-only rows keep `PatientAvatar`

## Decisions Made

- Remover foto lives in `PatientPhotoRemoveButton`, mounted in the name row (`flex-wrap items-center gap-2`) after the status pill. Both the ficha avatar and the list pass `showRemove={false}`, so the circle stays a label only.
- Writable mobile cards put `PatientPhotoControl` beside the `Link`. Writable desktop rows stop `click` and `keydown` on the control wrapper so the picker does not open the ficha.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kept the existing square avatar classes on the ficha**
- **Found during:** Task 2 (Editable ficha header and patient list)
- **Issue:** The plan restated the avatar class as `sm:!h-16 !w-16`, which drops `sm:` on the width and would make the mobile circle 64px wide and 56px tall.
- **Fix:** Kept the class already on `PatientProfileHeader`: `!h-14 !w-14 !text-base sm:!h-16 sm:!w-16 sm:!text-lg`.
- **Files modified:** `src/components/patients/PatientProfileHeader.tsx`
- **Verification:** The header still uses that class string for both the control and the read-only avatar. Lint and typecheck passed.
- **Committed in:** `1b804d7` (Task 2 commit)

**2. [Rule 1 - Bug] Clear the file input when a change arrives during upload**
- **Found during:** Task 1 (PatientPhotoControl camera, picker, and remove)
- **Issue:** Ignoring a change while the upload is pending would leave that file on the input, so choosing it again after the request would not fire `change`.
- **Fix:** That early return also sets `input.value` to an empty string. The success and error path still clears the input in `finally`.
- **Files modified:** `src/components/patients/PatientPhotoControl.tsx`
- **Verification:** Grep confirms the accept list, `sr-only`, and the absence of `capture` and `multiple`. Lint and typecheck passed.
- **Committed in:** `43e852e` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug)
**Impact on plan:** Both keep the circle square and let the same file be chosen again. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 16-06 can pass `photoUrl` into the display-only avatars on quadro, agenda, painel, and the clinical shortcut. Those surfaces must not mount `PatientPhotoControl`.
- Consulta still sees the photo or initials and has no camera and no Remover foto.

---
*Phase: 16-foto-do-paciente*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: src/components/patients/PatientPhotoControl.tsx
- FOUND: src/components/patients/PatientProfileHeader.tsx
- FOUND: src/pages/PatientPage.tsx
- FOUND: src/pages/PatientsPage.tsx
- FOUND: .planning/phases/16-foto-do-paciente/16-05-SUMMARY.md
- FOUND: 43e852e
- FOUND: 1b804d7
