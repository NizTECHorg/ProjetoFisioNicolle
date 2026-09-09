---
phase: 03-tipos-de-conta-e-equipe
plan: 04
subsystem: auth
tags: [auth, membership, pending, rejected, routes, clinic-profile]

requires:
  - phase: 03-01
    provides: ClinicProfile, isPendingTherapist, isRejectedAccount
  - phase: 03-03
    provides: fetchMembership (throws on query error) + signup metadata
provides:
  - ClinicProfile-aware fetchProfile without is_active filter
  - isAuthenticated fail-closed for pending and fisio-with-null-membership
  - /aguardando waiting card (Sair da conta)
  - GuestRoute clinic redirect only when isAuthenticated
  - Pedido recusado card (D-04)
affects:
  - 03-05 Equipe nav visibility on AppShell
  - 03-07 empresa ficha read (session must be active non-pending)

tech-stack:
  added: []
  patterns:
    - isLoading waits for session plus fetchProfile and fetchMembership
    - Fisioterapeuta + null membership is not isAuthenticated (D-03 fail-closed)
    - GuestRoute never treats a bare session as a clinic user
    - /aguardando is a sibling of Guest/Protected, not inside AppShell

key-files:
  created:
    - src/pages/auth/WaitingApprovalPage.tsx
  modified:
    - src/services/auth.service.ts
    - src/providers/AuthProvider.tsx
    - src/hooks/useAuth.ts
    - src/components/auth/ProtectedRoute.tsx
    - src/routes/index.tsx
    - src/components/layout/AppShell.tsx
    - src/pages/SettingsPage.tsx

key-decisions:
  - "Fisio + null membership is not authenticated; route that state to /aguardando"
  - "isLoading stays true until profile AND membership fetches settle"
  - "Waiting CTA is Sair da conta; rejected keeps Sair e voltar ao login"

patterns-established:
  - "AuthProvider userId effect loads profile+membership; onAuthStateChange stays synchronous"
  - "shouldAwaitApproval = isPendingTherapist OR (fisioterapeuta && membership === null && isActive)"
  - "AppShell footer uses accountTypeLabel; Equipe item remains Plan 03-05"

requirements-completed: [REQ-15]

duration: 4min
completed: 2026-09-09
---

# Phase 3 Plan 04: Login pendente/recusado e /aguardando Summary

**Pending fisio authenticates but is not `isAuthenticated`; null/failed membership fail-closes to `/aguardando` with Sair da conta; rejected login signs out with Pedido recusado**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-09T20:32:07Z
- **Completed:** 2026-09-09T20:35:58Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- `fetchProfile` returns `ClinicProfile` with `account_type`, no `is_active` filter, so pending and rejected rows load
- `isAuthenticated` requires active profile, not pending, and not (fisioterapeuta && membership === null)
- `/aguardando` sits outside AppShell; GuestRoute sends pending/unknown fisio there instead of `/painel`
- Rejected sign-in calls `signOut` and throws `Pedido recusado. Use outro e-mail para um novo cadastro.`

## Task Commits

Each task was committed atomically:

1. **Task 1: fetchProfile ClinicProfile and rejected sign-in** - `cdb8c96` (feat)
2. **Task 2: AuthProvider membership and isAuthenticated** - `b0d996d` (feat)
3. **Task 3: Waiting route, GuestRoute, rejected card** - `b6072a5` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/services/auth.service.ts` — ClinicProfile map; rejected login signs out with exact D-04 sentence
- `src/hooks/useAuth.ts` — `profile: ClinicProfile | null`, `membership: Membership | null`
- `src/providers/AuthProvider.tsx` — parallel profile+membership fetch; fail-closed `isAuthenticated`
- `src/components/layout/AppShell.tsx` — `fullName` + `accountTypeLabel` (Equipe nav not added)
- `src/pages/SettingsPage.tsx` — `fullName` so typecheck passes after ClinicProfile
- `src/components/auth/ProtectedRoute.tsx` — pending → `/aguardando`; rejected card; GuestRoute clinic only if `isAuthenticated`
- `src/pages/auth/WaitingApprovalPage.tsx` — waiting copy or membership-unknown copy; CTA Sair da conta
- `src/routes/index.tsx` — `/aguardando` sibling of Guest and Protected

## Decisions Made

- Fisioterapeuta with missing or failed membership is treated like pending for routing (D-03 fail-closed), not like autônomo.
- `fetchMembership` throw is caught in AuthProvider: membership stays `null`, `isLoading` still clears (no infinite spinner).
- Waiting CTA is **Sair da conta** (UI FLAG). Rejected card keeps **Sair e voltar ao login**.
- AppShell label switched to `accountTypeLabel` in this plan so ClinicProfile typecheck passes; Equipe item stays 03-05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SettingsPage still read `profile.full_name`**
- **Found during:** Task 2 (AuthProvider membership and isAuthenticated)
- **Issue:** Switching AuthContext `profile` to `ClinicProfile` broke `npm run typecheck` on `src/pages/SettingsPage.tsx` (`full_name` vs `fullName`).
- **Fix:** Read `profile.fullName` on SettingsPage. Did not restyle the bakery settings chrome.
- **Files modified:** `src/pages/SettingsPage.tsx`
- **Verification:** `npm run typecheck` exits 0
- **Committed in:** `b0d996d` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for the typecheck gate. No scope creep.

## Issues Encountered

`npm run lint` still fails on pre-existing `src/services/aiPhysicalEvaluation.service.ts` (`no-explicit-any`). Plan 03-04 files lint clean. Logged in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Wave 4: 03-05 (`/equipe` + Equipe nav for empresa) and 03-07 (empresa ficha consulta).

REQ-15 stays open until equipe and empresa ficha UI land. This plan delivered REQ-15 pending/rejected login gates (D-03, D-04).

Active autônomo / empresa / fisio with `membership.status === 'active'` still enter the clinic.

## Verification

- `npm run typecheck` exits 0
- ESLint on plan files exits 0
- `grep account_type` in `auth.service.ts` ≥ 1; no `.eq('is_active', true)`
- `grep Pedido recusado` in `auth.service.ts` ≥ 1
- `grep membership` in `useAuth.ts`; `fetchMembership` / `isPendingTherapist` / `fisioterapeuta` in AuthProvider
- `grep fullName` in AppShell
- `grep /aguardando` in routes and ProtectedRoute; GuestRoute does not Navigate on session alone
- Waiting page CTA is `Sair da conta`; rejected heading is `Pedido recusado`
- `onAuthStateChange` callback has no `await`

## Self-Check: PASSED

- FOUND: `src/pages/auth/WaitingApprovalPage.tsx`
- FOUND: `src/hooks/useAuth.ts`
- FOUND: `src/providers/AuthProvider.tsx`
- FOUND: `src/components/auth/ProtectedRoute.tsx`
- FOUND: `src/services/auth.service.ts`
- FOUND: `src/routes/index.tsx`
- FOUND: `src/components/layout/AppShell.tsx`
- FOUND: `cdb8c96` feat(03-04): load ClinicProfile and reject cancelled accounts on sign-in
- FOUND: `b0d996d` feat(03-04): fail-close isAuthenticated until membership settles
- FOUND: `b6072a5` feat(03-04): gate pending and rejected sessions away from the clinic

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-09*
