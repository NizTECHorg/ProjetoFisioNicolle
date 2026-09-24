---
phase: 18-minha-conta
plan: 05
subsystem: ui
tags: [react, react-router, account-avatars, footer, minha-conta]

requires:
  - phase: 18-minha-conta
    provides: uploadAccountPhoto, removeAccountPhoto, signAccountAvatarUrl, updateOwnName, and reloadProfile
provides:
  - AccountPage card Foto e nome at /conta for the logged-in account photo and name
  - Icon-only footer NavLink with accessible name Minha conta, immediately before Sair
  - Footer circle that paints a signed avatar or falls back to initials
affects:
  - 18-06 password card on the same AccountPage

tech-stack:
  added: []
  patterns:
    - Account photo display signs profiles.avatar_url at read time and never writes the signed URL back
    - Footer Minha conta is a NavLink to /conta, not a clinicNavigationItems or mobileNavItems entry

key-files:
  created:
    - src/pages/AccountPage.tsx
  modified:
    - src/components/layout/AppShell.tsx
    - src/routes/index.tsx

key-decisions:
  - "The footer control is icon-only; its accessible name and title are exactly Minha conta"
  - "Photo and name saves call reloadProfile; the signed avatar URL stays in component state"
  - "The password card stays out of AccountPage until plan 18-06"

patterns-established:
  - "Route /conta is a child of ProtectedRoute and AppShell, before the shell path=*"
  - "Remover foto mounts only when profiles.avatar_url has a saved path"

requirements-completed: []  # REQ-29 is phase-level; plan 18-06 still owns the password card

duration: 4min
completed: 2026-09-24
---

# Phase 18 Plan 05: Footer Minha conta and photo-name card Summary

**An icon-only footer NavLink named Minha conta opens `/conta`, where the logged-in account replaces its photo and name and `reloadProfile` refreshes the footer in the same session.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T14:42:24Z
- **Completed:** 2026-09-24T14:46:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `AccountPage` shows read-only e-mail and account type, and saves the account photo and name for the signed-in user.
- The footer strip places `CircleUser` immediately before Sair. The control has no visible label. Its accessible name is Minha conta.
- A saved avatar path is signed for the page circle and the footer circle. A broken image or an empty path falls back to initials. The signed URL is not stored on `profiles`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Card Foto e nome em AccountPage** - `fd397f9` (feat)
2. **Task 2: Ícone Minha conta no rodapé e rota /conta** - `5202c61` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified
- `src/pages/AccountPage.tsx` - Card Foto e nome: photo picker, remove confirm, read-only e-mail and account type, Salvar nome
- `src/components/layout/AppShell.tsx` - NavLink `/conta` before Sair, and a footer circle that shows the signed avatar or initials
- `src/routes/index.tsx` - `/conta` inside ProtectedRoute and AppShell, before the shell catch-all

## Decisions Made
- The footer button stays icon-only. `aria-label` and `title` are exactly Minha conta. Clicking it closes the drawer and does not sign out.
- `signAccountAvatarUrl` runs when rendering. The resulting URL lives in React state only.
- Name failures show `Você não tem permissão para esta ação.` when that is the mapped error, and `Não foi possível salvar o nome. Tente de novo.` otherwise.
- The password form is not in this plan. Plan 18-06 adds the Senha card on the same page.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 18-06. `AccountPage` already has the page header copy that mentions senha, and the password card can be added under the identity card. REQ-29 stays open until that card verifies the current password.

## Self-Check: PASSED

- FOUND: src/pages/AccountPage.tsx
- FOUND: src/components/layout/AppShell.tsx
- FOUND: src/routes/index.tsx
- FOUND: fd397f9
- FOUND: 5202c61

---
*Phase: 18-minha-conta*
*Completed: 2026-09-24*
