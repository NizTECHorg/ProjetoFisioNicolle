---
phase: 03-tipos-de-conta-e-equipe
plan: 01
subsystem: auth
tags: [typescript, account-types, access-predicates, clinic]

requires:
  - phase: existing-auth
    provides: profiles + camelCase domain types in src/types/

provides:
  - AccountType / MembershipStatus / MembershipRole unions
  - ClinicProfile, Organization, TeamMember, Membership
  - UX predicates canManageTeam, canWritePatient, normalizeJoinCode, isPendingTherapist
affects:
  - 03-02 SQL org/membership
  - 03-03 cadastro
  - 03-04 login gates
  - 03-05 equipe
  - 03-07 ficha consulta

tech-stack:
  added: []
  patterns:
    - Clinic account types live in src/types/account.ts, never on bakery Profile.role
    - Client access helpers are UX-only; RLS remains authority

key-files:
  created:
    - src/types/account.ts
    - src/lib/accountAccess.ts
  modified: []

key-decisions:
  - "Account types are autonomo | empresa | fisioterapeuta in account.ts, not EmployeeRole"
  - "canManageTeam / canWritePatient are UX-only; Plan 03-02 RLS is the authority"
  - "Org + membership interfaces (not extra columns only on profiles)"

patterns-established:
  - "Closed unions + Record labels + camelCase interfaces, same as patient.ts"
  - "Named exports only; no bakery permissions.ts for clinic gating"

requirements-completed: [REQ-15]

duration: 2min
completed: 2026-09-08
---

# Phase 3 Plan 01: Contratos de tipos de conta Summary

**Clinic AccountType unions and UX predicates (canManageTeam, canWritePatient, join-code normalize) without bakery roles**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-08T23:18:26Z
- **Completed:** 2026-09-08T23:20:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Locked D-01 three account types in TypeScript: Autônomo, Empresa, Fisioterapeuta
- Modeled org + membership (pending / active / rejected) for later SQL and Equipe UI
- Encoded D-03/D-04/D-05/D-07 as named predicates; documented as UX-only (T-03-01)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write clinic account type contracts** - `b2bec1a` (feat)
2. **Task 2: Write account access predicates** - `88a2e64` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/types/account.ts` — AccountType, membership unions, labels, Organization, TeamMember, Membership, ClinicProfile
- `src/lib/accountAccess.ts` — normalizeJoinCode, canManageTeam, canWritePatient, isPendingTherapist, isRejectedAccount, accountTypeLabel

## Decisions Made

- Clinic account types live only in `src/types/account.ts`. `database.types.ts` Profile.role stays bakery EmployeeRole.
- `canManageTeam` is true only for `empresa`. `canWritePatient` is true only when viewer id equals `created_by`.
- Predicates are UX helpers. Plan 03-02 RLS is the authorization authority (ASVS 4.1.1 / T-03-01).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 03-02 (SQL org/membership/RLS). Later plans can import AccountType, ClinicProfile, Membership, canManageTeam, canWritePatient, normalizeJoinCode, isPendingTherapist.

REQ-15 remains open — this plan only shipped contracts. Do not treat the requirement as done until cadastro, SQL, gates, and equipe land.

## Verification

- `npm run typecheck` exits 0
- Required named exports present in both artifacts
- Predicate cases (canManageTeam / canWritePatient / isPendingTherapist / isRejectedAccount / normalizeJoinCode) all PASS via Vite SSR load

## Self-Check: PASSED

- FOUND: `src/types/account.ts`
- FOUND: `src/lib/accountAccess.ts`
- FOUND: `b2bec1a` feat(03-01): write clinic account type contracts
- FOUND: `88a2e64` feat(03-01): write account access predicates

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-08*
