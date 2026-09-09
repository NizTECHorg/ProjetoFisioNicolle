---
phase: 03-tipos-de-conta-e-equipe
plan: 05
subsystem: ui
tags: [equipe, react-query, navigation, join-code, decide-membership]

requires:
  - phase: 03-03
    provides: team.service listTeamMembers fetchOwnerOrganization decideMembership
  - phase: 03-04
    provides: ClinicProfile accountType on AppShell + isAuthenticated clinic tree
provides:
  - useTeam ['team'] + useDecideMembership toasts
  - /equipe TeamPage for empresa (code copy, pending accept/reject, active list)
  - clinicNavigationItems Equipe drawer-only
affects:
  - 03-07 empresa ficha consulta (active therapists already on the team)

tech-stack:
  added: []
  patterns:
    - clinicNavigationItems filters /equipe unless accountType === empresa
    - TeamPage canManageTeam guard redirects to /pacientes with no toast
    - Recusar goes through decide_membership RPC only (D-04)

key-files:
  created:
    - src/hooks/useTeam.ts
    - src/pages/TeamPage.tsx
  modified:
    - src/config/navigation.ts
    - src/components/layout/AppShell.tsx
    - src/routes/index.tsx

key-decisions:
  - "Equipe is drawer-only via clinicNavigationItems; mobileNavItems stays 4 items"
  - "FLAG CTAs Aceitar pedido, Recusar pedido, Voltar sem recusar; confirm Recusar e cancelar conta"
  - "Copiar código uses visible text plus aria-label; clipboard writes raw 8 characters"
  - "Reject cancels through decide_membership RPC only; page never updates profiles"

patterns-established:
  - "useTeam Promise.all list + owner org under queryKey ['team']"
  - "clinicNavigationItems(accountType) is the AppShell drawer source, not raw navigationItems"
  - "Aceitar mutates immediately; Recusar opens ConfirmDialog then RPC"

requirements-completed: [REQ-15]

duration: 5min
completed: 2026-09-09
---

# Phase 3 Plan 05: Equipe UI Summary

**Empresa-only /equipe with copyable join code, Aceitar pedido / Recusar pedido via decide_membership, and silent /pacientes redirect for autônomo/fisio**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-09T20:38:11Z
- **Completed:** 2026-09-09T20:43:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `useTeam` caches members + owner organization; `useDecideMembership` toasts accept/reject then invalidates `['team']`
- `/equipe` shows grouped join code, pending accept/reject (FLAG copy), and active DataTable
- Equipe appears in the forest drawer only for `empresa`; bottom bar stays four items; other types hitting `/equipe` go to `/pacientes`

## Task Commits

Each task was committed atomically:

1. **Task 1: useTeam query hooks** - `7dadab2` (feat)
2. **Task 2: TeamPage, Equipe nav, /equipe route** - `a81353e` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/hooks/useTeam.ts` — `useTeam`, `useMembership`, `useDecideMembership`; keys `['team']` and `['membership']`
- `src/pages/TeamPage.tsx` — empresa Equipe screen; `canManageTeam` guard; ConfirmDialog on Recusar only
- `src/config/navigation.ts` — Equipe + `UserPlus`; `clinicNavigationItems`; `mobileNavItems` unchanged
- `src/components/layout/AppShell.tsx` — drawer maps `clinicNavigationItems(profile?.accountType)`
- `src/routes/index.tsx` — `/equipe` inside ProtectedRoute + AppShell

## Decisions Made

- Equipe is not on `mobileNavItems` (stays 4). Empresa reaches it from the hamburger drawer, which already renders the filtered `navigationItems`.
- UI FLAG copy wins over the shorter UI-SPEC table: **Aceitar pedido**, **Recusar pedido**, **Voltar sem recusar**. Confirm remains **Recusar e cancelar conta**.
- **Copiar código** is a labeled secondary button (`min-h-11 min-w-11`) with `aria-label="Copiar código"`. Clipboard writes the raw 8-character code, not the spaced display.
- Reject never calls `profiles.update`. `decideMembership` RPC is the only write (D-04 / T-03-12).

## Deviations from Plan

None - plan executed exactly as written.

Repo-wide `npm run lint` still fails on pre-existing `src/services/aiPhysicalEvaluation.service.ts` (`no-explicit-any`). Logged in `deferred-items.md` from 03-04. Plan 03-05 files lint clean. Not a deviation: out of scope, not auto-fixed.

## Issues Encountered

`npm run lint` fails on pre-existing `src/services/aiPhysicalEvaluation.service.ts`. `npm run typecheck` exits 0. Plan files pass ESLint.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Wave 4 sibling 03-07 (empresa ficha consulta: `Ficha de {nome}` + read-only teammate banner).

REQ-15 acceptance 2–4 (allocate, fisio/autônomo must not manage equipe) landed here. 03-07 still delivers D-06/D-07 consulta.

Human check remaining: as empresa, `/equipe` shows code and FLAG CTAs; as autônomo, Equipe absent and `/equipe` → `/pacientes`.

## Verification

- `npm run typecheck` exits 0
- ESLint on plan files exits 0
- `grep /equipe` in `src/routes/index.tsx` = 1
- `grep UserPlus` in `src/config/navigation.ts` = 2
- `grep Aceitar pedido` / `Voltar sem recusar` / `Copiar código` / `canManageTeam` in TeamPage
- `mobileNavItems` length 4 and has no `/equipe`
- AppShell drawer uses `clinicNavigationItems`
- Recusar uses ConfirmDialog; Aceitar does not

## Self-Check: PASSED

- FOUND: `src/hooks/useTeam.ts`
- FOUND: `src/pages/TeamPage.tsx`
- FOUND: `src/config/navigation.ts`
- FOUND: `src/components/layout/AppShell.tsx`
- FOUND: `src/routes/index.tsx`
- FOUND: `7dadab2` feat(03-05): add useTeam query and decide membership hooks
- FOUND: `a81353e` feat(03-05): ship /equipe for empresa with copyable join code

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-09*
