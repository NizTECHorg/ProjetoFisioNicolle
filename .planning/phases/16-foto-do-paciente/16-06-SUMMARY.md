---
phase: 16-foto-do-paciente
plan: 06
subsystem: ui
tags: [react, patient-avatar, photo-url, display-only]

requires:
  - phase: 16-foto-do-paciente
    provides: PatientAvatar photoUrl from 16-02 and signed photoUrl on board, calendar, and patient list DTOs from 16-04
provides:
  - Display-only patient photo on quadro, agenda, próximas sessões, and the clinical shortcut
affects: []

tech-stack:
  added: []
  patterns:
    - Display surfaces pass photoUrl into PatientAvatar and never mount PatientPhotoControl

key-files:
  created: []
  modified:
    - src/pages/KanbanPage.tsx
    - src/pages/CalendarPage.tsx
    - src/pages/DashboardPage.tsx
    - src/components/patients/DashboardClinicalShortcut.tsx

key-decisions:
  - "Calendar due cards copy photoUrl onto the view object so the sm avatar can show the signed URL"
  - "Quadro, agenda, painel, and the shortcut stay display-only; upload remains on the ficha and the list"

patterns-established:
  - "Display-only PatientAvatar call sites receive photoUrl and keep their existing click or drag behavior"

requirements-completed: []

duration: 2min
completed: 2026-09-24
---

# Phase 16 Plan 06: Display photo on quadro, agenda, painel, and shortcut Summary

**Quadro, agenda, próximas sessões, and the clinical shortcut show the saved photo through PatientAvatar and never open a file picker.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-24T00:52:08Z
- **Completed:** 2026-09-24T00:53:47Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- Kanban cards pass `photoUrl={card.photoUrl}` into the existing size `sm` avatar and stay `draggable`.
- Calendar due cards and session rows pass `photoUrl` into `PatientAvatar`. Due cards copy `photoUrl` onto the view object next to `photoTone`.
- Próximas sessões copy `photoUrl: session.photoUrl` beside `tone` and pass `item.photoUrl` into the avatar. The row stays a `Link`.
- The clinical shortcut passes `patient.photoUrl` into the avatar inside the button that still calls `selectPatient`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Display photoUrl on kanban and calendar** - `e7b402d` (feat)
2. **Task 2: Display photoUrl on dashboard and clinical shortcut** - `4420852` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/pages/KanbanPage.tsx` — display-only avatar on the draggable card
- `src/pages/CalendarPage.tsx` — display-only avatars for due cards and sessions
- `src/pages/DashboardPage.tsx` — `photoUrl` on próximas sessões
- `src/components/patients/DashboardClinicalShortcut.tsx` — display-only avatar inside the patient button

## Decisions Made

- The calendar due-card memo must copy `photoUrl: card.photoUrl` or the day view cannot pass a signed URL into the avatar.
- None of these four files import `PatientPhotoControl`, `Camera`, or a file input. A missing `photoUrl` still falls back to initials on `photo_tone` inside `PatientAvatar`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Copy photoUrl onto calendar due cards**
- **Found during:** Task 1 (Display photoUrl on kanban and calendar)
- **Issue:** The due-card view object copied `photoTone` and dropped `photoUrl`, so the size `sm` avatar could not receive the signed URL.
- **Fix:** Added `photoUrl: card.photoUrl` next to `photoTone` in that map, then passed it to `PatientAvatar`.
- **Files modified:** `src/pages/CalendarPage.tsx`
- **Verification:** Typecheck passed. The due-card avatar is `photoUrl={card.photoUrl}`.
- **Committed in:** `e7b402d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for the agenda due card to show the saved photo. No picker and no drag or click change.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 16 plans 16-01 through 16-06 are implemented. Display surfaces show the signed photo or initials and do not upload.
- Verification of the phase can confirm the ficha and list remain the only write surfaces.

## Known Stubs

None. `photoUrl` is the signed URL already on the board, calendar, and patient DTOs. An empty value still renders initials.

---
*Phase: 16-foto-do-paciente*
*Completed: 2026-09-24*

## Self-Check: PASSED

- FOUND: src/pages/KanbanPage.tsx
- FOUND: src/pages/CalendarPage.tsx
- FOUND: src/pages/DashboardPage.tsx
- FOUND: src/components/patients/DashboardClinicalShortcut.tsx
- FOUND: .planning/phases/16-foto-do-paciente/16-06-SUMMARY.md
- FOUND: e7b402d
- FOUND: 4420852
