---
phase: 03-tipos-de-conta-e-equipe
reviewed: 2026-09-09T20:55:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - src/types/account.ts
  - src/lib/accountAccess.ts
  - src/services/team.service.ts
  - src/schemas/auth.schema.ts
  - src/services/auth.service.ts
  - src/pages/auth/RegisterPage.tsx
  - src/pages/auth/WaitingApprovalPage.tsx
  - src/providers/AuthProvider.tsx
  - src/hooks/useAuth.ts
  - src/components/auth/ProtectedRoute.tsx
  - src/routes/index.tsx
  - src/components/layout/AppShell.tsx
  - src/pages/SettingsPage.tsx
  - src/hooks/useTeam.ts
  - src/pages/TeamPage.tsx
  - src/config/navigation.ts
  - src/types/patient.ts
  - src/services/patients.service.ts
  - src/pages/PatientsPage.tsx
  - src/pages/PatientPage.tsx
  - src/components/patients/PatientAlertsPanel.tsx
  - src/components/patients/PatientGoalsPanel.tsx
  - src/components/patients/PatientEvolutionsPanel.tsx
  - src/components/patients/PatientEvaluationPanel.tsx
  - src/components/patients/PatientCadastroPanel.tsx
  - src/components/patients/PatientPhysicalEvaluationPanel.tsx
  - .planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql
findings:
  critical: 2
  warning: 6
  info: 4
  total: 12
status: issues
---

# Phase 3: Code Review Report

**Reviewed:** 2026-09-09T20:55:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues

## Narrative Findings (AI reviewer)

## Summary

Phase 3 wires account types, org/membership RLS, cadastro, login gates, `/equipe`, `created_by`, and empresa consulta UI. Client predicates are documented as UX-only, which is correct — but the hosted RLS and leftover `profiles_update_own` policy do not actually enforce D-03/D-04 or tenant isolation for every patient row. Two authorization defects must be fixed before this ships: a SELECT hole for `patients.created_by IS NULL`, and unrestricted self-update of `is_active` / `account_type`.

## Critical Issues

### CR-01: Any authenticated session can SELECT patients with null `created_by`

**File:** `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql:525-532`
**Issue:** `patients_select` ORs `private.can_read_patient(id)` with `created_by is null and auth.uid() is not null`. That bypasses the pending/rejected block inside `can_read_patient`. A fisioterapeuta sitting on `/aguardando` (valid JWT, `isAuthenticated === false`) can still `supabase.from('patients').select('*')` and read name, phone, email, queixa, diagnóstico, and other PHI for every leftover null-owner row. The same hole is tenant-wide: autônomo A can read empresa B’s unbackfilled patients. Section 2b only backfills when `count(profiles) = 1`; the policy remains a standing leak for any current or future null.
**Fix:** Drop the OR. Backfill or hide residual nulls instead of opening SELECT to every JWT.

```sql
create policy patients_select
  on public.patients
  for select
  to authenticated
  using ((select private.can_read_patient(id)));

-- then backfill leftover owners, or leave those rows invisible until a real owner is set
```

### CR-02: `profiles_update_own` lets the subject undo D-03 / D-04

**File:** `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql:476-477`
**Issue:** Live policy (dump in `sql/00-live-handle-new-user.md:55`) is `UPDATE profiles WHERE id = auth.uid()` with the same `WITH CHECK` and **no column restriction**. Phase 3 left it in place. App gates key off `profile.isActive` and `profile.accountType` (`AuthProvider.tsx:88-93`, `isRejectedAccount`, `isPendingTherapist`). A rejected or pending user with a session can call PostgREST directly (no `profiles.update` helper is required):

```ts
await supabase.from('profiles').update({ is_active: true, account_type: 'autonomo' }).eq('id', user.id)
```

After refresh, `isAuthenticated` becomes true: pending is no longer `fisioterapeuta`, rejected is no longer `is_active === false`. RLS still blocks most patient writes via membership status, but D-03/D-04 “conta cancelada / clínica bloqueada” is bypassed at the app layer, and any table still on `USING (true)` (board was explicitly left untouched) becomes reachable.
**Fix:** Make `is_active` and `account_type` immutable on client UPDATE (BEFORE UPDATE trigger or replace `profiles_update_own` so NEW cannot change those columns). Only `decide_membership` / `handle_new_user` should write them.

```sql
create or replace function private.protect_profile_auth_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active is distinct from old.is_active
     or new.account_type is distinct from old.account_type then
    raise exception 'is_active e account_type nao podem ser alterados pelo cliente';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_auth_columns on public.profiles;
create trigger profiles_protect_auth_columns
  before update on public.profiles
  for each row
  execute function private.protect_profile_auth_columns();
```

(Keep the trigger off for the SECURITY DEFINER `decide_membership` path — e.g. `SET LOCAL` role, or have the function update via a table owner that bypasses the trigger.)

## Warnings

### WR-01: Anon join-code oracle with 32-bit codes

**File:** `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql:40-45,373-388`
**Issue:** `join_code` is 8 hex chars from `gen_random_uuid()` (~32 bits). `lookup_organization_by_code` is `SECURITY DEFINER`, granted to `anon` and `authenticated`, and returns a boolean with no database rate limit. Client `checkRateLimit` does not apply to raw RPC calls. A valid code is the only signup gate onto an empresa’s pending queue.
**Fix:** Use a longer code (16+ hex), rate-limit the RPC (or wrap it behind a signed edge function), and consider lockout after N misses per IP/session.

### WR-02: Auth loading gap flashes “Conta sem perfil ativo”

**File:** `src/providers/AuthProvider.tsx:19,47-71,86`
**Issue:** `profileLoading` starts `false` and is set `true` only inside the `userId` effect (after paint). `profile === null` means both “not fetched yet” and “no row”. After `getSession` sets `session` + `sessionLoaded`, one render has `isLoading === false`, `session` present, `profile === null`. `ProtectedRoute` / `GuestRoute` then render `AccountWithoutProfile` (including **Sair e voltar ao login**) before the fetch starts.
**Fix:** Treat “session exists but profile fetch has not settled” as loading:

```ts
const [profileLoading, setProfileLoading] = useState(true)

isLoading: !sessionLoaded || Boolean(userId && profileLoading),
```

### WR-03: Membership/profile errors fail closed inconsistently; raw DB errors leak

**File:** `src/services/auth.service.ts:83-88,149-151` · `src/providers/AuthProvider.tsx:58-60` · `src/services/team.service.ts:38-40,94-101`
**Issue:** `fetchProfile` returns `null` on query error (same as missing row). `fetchMembership` throws on error; AuthProvider swallows to `null`. For a rejected fisio, `isRejectedAccount(false, null)` is false, so they see “Conta sem perfil ativo” and keep the session instead of the D-04 card / sign-out. `throwIfError` in `team.service` surfaces `error.message` (Postgres internals) except on `decideMembership`.
**Fix:** Distinguish network/query failure from “no row”. On membership fetch failure, keep the waiting/unknown copy (already on `WaitingApprovalPage`) and do not treat rejected-as-null. Map all team errors through `mapDbError`.

### WR-04: `canWrite` defaults to `true` on every ficha panel

**File:** `src/components/patients/PatientAlertsPanel.tsx:55` · `PatientGoalsPanel.tsx:44` · `PatientEvolutionsPanel.tsx:52` · `PatientEvaluationPanel.tsx:113` · `PatientCadastroPanel.tsx:102` · `PatientPhysicalEvaluationPanel.tsx:32`
**Issue:** Consult-mode safety is opt-out. Any future mount that forgets `canWrite={...}` silently re-enables Adicionar/Editar/Remover. `PatientPage` forwards the flag today; `/agenda` (`calendar.service.ts` insert/update) was never given `canWritePatient`, so empresa still sees session write UI for teammate patients (RLS is the only backstop; failures look like generic errors).
**Fix:** Default `canWrite` to `false`, or require the prop. Gate calendar/quadro session writes with the same predicate (RLS remains authority).

### WR-05: `['team']` cache is not per-user and is not cleared on sign-out

**File:** `src/hooks/useTeam.ts:14-22` · `src/providers/AuthProvider.tsx:73-77`
**Issue:** `useTeam` uses a global `queryKey: ['team']`. `signOut` clears React auth state but never `queryClient.clear()` / `removeQueries`. On a shared browser, the next empresa can briefly render the previous clinic’s join code, names, and emails from cache (`staleTime: 60_000`).
**Fix:** Key as `['team', userId]` and `queryClient.removeQueries({ queryKey: ['team'] })` (or `clear()`) inside `signOut`.

### WR-06: `organization_memberships` allows multiple rows per profile

**File:** `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql:49-56` · `src/services/team.service.ts:94-99`
**Issue:** Unique is `(organization_id, profile_id)` only. `fetchMembership` uses `.maybeSingle()`. A second membership row (future join path, or a retry edge) makes PostgREST return an error; AuthProvider then stores `null` and fail-closes every fisio to `/aguardando`. `viewer_org_id()` uses `LIMIT 1` without `ORDER BY` if two active rows exist.
**Fix:** `UNIQUE (profile_id)` (one clinic per person, matching D-01) or change the client to `.select().limit(1)` with a defined priority (active > pending).

## Info

### IN-01: Dead `useMembership` hook

**File:** `src/hooks/useTeam.ts:25-31`
**Issue:** Exported but unused. `queryKey: ['membership']` omits `userId`, so it would be wrong if wired later.
**Fix:** Delete it, or add `userId` to the key if AuthProvider is later replaced by this hook.

### IN-02: Settings still shows bakery `profile.role`

**File:** `src/pages/SettingsPage.tsx:29-32`
**Issue:** Clinic gating uses `accountType`, but Settings badges leftover `atendente`.
**Fix:** Show `accountTypeLabel(profile.accountType)`.

### IN-03: `console.error` in consult-gated PDF panel

**File:** `src/components/patients/PatientPhysicalEvaluationPanel.tsx:83`
**Issue:** Debug leftover on the write path that 03-07 gated.
**Fix:** Remove or route through the existing error banner only.

### IN-04: `/aguardando` is not restricted to pending fisio

**File:** `src/pages/auth/WaitingApprovalPage.tsx:21-38` · `src/routes/index.tsx:25`
**Issue:** Any session that is not `isAuthenticated` (inactive empresa, missing profile) sees “Aguardando aprovação” if they open `/aguardando` directly.
**Fix:** Reuse `shouldAwaitApproval`; otherwise `Navigate` to login / inactive card.

---

_Reviewed: 2026-09-09T20:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
