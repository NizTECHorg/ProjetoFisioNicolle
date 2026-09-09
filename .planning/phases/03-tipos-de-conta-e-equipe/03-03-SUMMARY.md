---
phase: 03-tipos-de-conta-e-equipe
plan: 03
subsystem: auth
tags: [zod, supabase, cadastro, join-code, account-types, rpc]

requires:
  - phase: 03-01
    provides: AccountType unions + normalizeJoinCode
  - phase: 03-02
    provides: lookup_organization_by_code + handle_new_user metadata
provides:
  - registerSchema accountType + joinCode (D-01)
  - signUp options.data account_type / join_code
  - team.service lookup, membership, org, list, decide
  - RegisterPage Tipo de conta Select + conditional Código da empresa
affects:
  - 03-04 login gates /aguardando
  - 03-05 equipe accept/reject UI
  - handle_new_user trigger metadata

tech-stack:
  added: []
  patterns:
    - Zod 3 superRefine + normalizeJoinCode for fisio join code
    - Pages call team.service; never import supabase on RegisterPage
    - Signup metadata only; browser does not insert profiles

key-files:
  created:
    - src/services/team.service.ts
  modified:
    - src/schemas/auth.schema.ts
    - src/services/auth.service.ts
    - src/pages/auth/RegisterPage.tsx

key-decisions:
  - "Zod enum message covers empty Select so required_error stays without preprocess"
  - "Fisio stays on cadastro with pending copy; GuestRoute in 03-04 owns /aguardando"
  - "team.service is the only org/membership client; no profiles.update"

patterns-established:
  - "Conditional Zod via superRefine + normalizeJoinCode (length 8)"
  - "Boolean-only lookupOrganizationByCode before signUp (T-03-04)"
  - "decideMembership maps errors with mapDbError; RPC is the write path (D-04)"

requirements-completed: [REQ-15]

duration: 5min
completed: 2026-09-09
---

# Phase 3 Plan 03: Cadastro tipo e código Summary

**Cadastro requires autonomo/empresa/fisioterapeuta; fisio must pass an 8-character join-code RPC before signUp; Auth metadata carries account_type and join_code for handle_new_user**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-09T20:20:21Z
- **Completed:** 2026-09-09T20:25:33Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Zod register contract enforces REQ-15.1 type choice and D-01 code-when-fisio
- `signUpWithEmail` writes `full_name`, `account_type`, and `join_code` into Auth metadata (no client profile insert)
- `team.service` exposes lookup / membership / org / list / decide; fetchMembership fails closed on query error
- Cadastro UI: Tipo de conta Select, conditional Código da empresa, fisio lookup before signUp

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend registerSchema with account type and code** - `a116401` (feat)
2. **Task 2: signUp metadata and team.service RPCs** - `1684c98` (feat)
3. **Task 3: RegisterPage type select and conditional code** - `89acf45` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/schemas/auth.schema.ts` — `accountType` enum + optional `joinCode` with superRefine length 8 after normalize
- `src/services/auth.service.ts` — `options.data.account_type` and `join_code` (normalized for fisio, null otherwise)
- `src/services/team.service.ts` — `lookupOrganizationByCode`, `fetchMembership`, `fetchOwnerOrganization`, `listTeamMembers`, `decideMembership`
- `src/pages/auth/RegisterPage.tsx` — Select + conditional join-code Input; lookup before signUp; fisio success copy

## Decisions Made

- Keep Zod 3 `required_error` on the account-type enum and add Zod 3.25 `message` so an empty Select (`''`) shows “Escolha o tipo de conta” without `preprocess` (preprocess widened input to `unknown` and broke `zodResolver`).
- Fisioterapeuta success is exactly “Cadastro concluído. Aguarde a empresa aceitar seu pedido.” No navigate to `/aguardando` here (Plan 03-04 GuestRoute).
- Team writes go through RPCs only. `listTeamMembers` excludes `role = owner`. `fetchMembership` throws on query error and returns null only when `maybeSingle` has no row.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Empty Select must surface Portuguese required copy without breaking types**
- **Found during:** Task 1 (registerSchema)
- **Issue:** Zod 3 forbids combining `required_error` with a custom `errorMap`. `z.preprocess('' → undefined)` made `accountType` input `unknown` and failed `npm run typecheck` on RegisterPage `zodResolver`.
- **Fix:** Keep `required_error` and set Zod 3.25 `message: 'Escolha o tipo de conta'` so `invalid_enum_value` (empty string) and missing value share the UI-SPEC copy.
- **Files modified:** `src/schemas/auth.schema.ts`
- **Verification:** safeParse without type / with `''` both fail with “Escolha o tipo de conta”; typecheck exits 0
- **Committed in:** `a116401` (Task 1)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for Select placeholder + typecheck. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. Wave 1 SQL is already applied.

## Next Phase Readiness

Ready for Wave 2 sibling 03-06 (`created_by` on patients) and Wave 3 03-04 (pending/rejected login gates + `/aguardando`).

REQ-15 stays open until login gates, equipe, and empresa ficha read land. This plan delivered REQ-15.1 cadastro + D-01 lookup-before-signUp only.

`fetchProfile` is unchanged (03-04 owns it). Do not insert profiles from the browser.

## Verification

- `npm run typecheck` exits 0
- `grep account_type` in `auth.service.ts` = 1
- `grep accountType` in `auth.schema.ts` = 2
- `lookupOrganizationByCode` / `decideMembership` / `fetchMembership` exported; no `from('profiles').update`
- RegisterPage has Select “Tipo de conta”, three option values, conditional joinCode, lookup before signUp, exact fisio success string, no supabase client import

## Self-Check: PASSED

- FOUND: `src/schemas/auth.schema.ts`
- FOUND: `src/services/auth.service.ts`
- FOUND: `src/services/team.service.ts`
- FOUND: `src/pages/auth/RegisterPage.tsx`
- FOUND: `a116401` feat(03-03): extend registerSchema with account type and join code
- FOUND: `1684c98` feat(03-03): send signup metadata and add team RPCs
- FOUND: `89acf45` feat(03-03): collect account type and company code on cadastro

---
*Phase: 03-tipos-de-conta-e-equipe*
*Completed: 2026-09-09*
