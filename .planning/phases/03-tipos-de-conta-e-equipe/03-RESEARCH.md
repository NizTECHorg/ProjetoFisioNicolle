# Phase 3: Tipos de conta e equipe - Research

**Researched:** 2026-09-08
**Domain:** Supabase Auth + Postgres RLS (org/membership) + React SPA cadastro/equipe
**Confidence:** HIGH (stack and auth patterns verified in-repo + official Supabase docs); MEDIUM (live `handle_new_user` body and current `patients` RLS are not in git)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Como o fisio entra na empresa
- **D-01:** O fisio informa um **código da empresa** no cadastro. Sem convite por e-mail nesta fase.
- **D-02:** Código válido = pedido **pendente**. Só entra na equipe depois que o dono **aceita**.
- **D-03:** Cadastro conclui, mas **login fica bloqueado** até a empresa aceitar (sem pacientes, sem agenda, sem uso como autônomo).
- **D-04:** Se a empresa **recusar**, a conta é **cancelada**. A pessoa precisa se cadastrar de novo.

### Pacientes de quem
- **D-05:** A ficha fica **só de quem cadastrou**. Fisios da mesma empresa **não** veem pacientes uns dos outros.
- **D-06:** A conta **Empresa** (dono) **vê** os pacientes de todos os fisios da equipe.
- **D-07:** Esse acesso da empresa é **só consulta** — lista e ficha, sem alterar.

### Claude's Discretion
- Conta **Empresa** = uma pessoa (dono/admin) que representa a clínica, não uma org sem login.
- Equipe: tela própria (ex. `/equipe`), visível **só** para empresa. Autônomo e fisio não veem o item.
- “Alocar funcionários” nesta fase = mostrar o código + lista da equipe + aceitar/recusar pendentes. Sem convite por e-mail.
- Código da empresa gerado automaticamente e copiável na tela de equipe.
- Contas já existentes: tratar como **autônomo** até haver fluxo de migração.
- Recusa cancela a conta (ex. `is_active = false` / exclusão de perfil). Pendente sem decisão = login continua bloqueado.

### Deferred Ideas (OUT OF SCOPE)
- Convite por e-mail
- Compartilhar ficha entre fisios da mesma empresa
- Empresa editar pacientes dos fisios
- Fisio usar o app como autônomo enquanto espera aprovação
- Trocar de empresa / sair da equipe sem recadastro
- Contas já existentes escolher tipo (migração)
- Multi-clínica / isolamento por clínica (já out of scope do marco)
- Permissões finas por sala ou papel além dos três tipos
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-15 | Na criação da conta, escolher autônomo / empresa / fisioterapeuta; empresa aloca fisioterapeutas; tipos e vínculos persistem no Supabase | Cadastro: `registerSchema` + `signUp` metadata + trigger `handle_new_user`. Equipe: `organizations` + `organization_memberships` + RPCs `lookup` / `decide`. Isolamento: `patients.created_by` + helpers RLS em schema `private`. Login: estados pending / rejected além de `is_active`. |
</phase_requirements>

## Summary

This phase adds three account types to an existing email/password SPA that already creates `profiles` on signup and gates the clinic on `profiles.is_active`. There is no application backend: the browser talks to Supabase with the anon key, so **Postgres RLS and SECURITY DEFINER RPCs are the only real authorization**. Today that authority is effectively “any authenticated user sees all clinical rows” (`using (true)` on `patient_evaluations` and `patient_goals`; `createPatient` does not set an owner). REQ-15 is therefore both a product feature (tipo + código + `/equipe`) and a security cutover (per-creator write, company-owner read).

The locked join model is a **stable company code**, not an email invite. The recommended shape is **organization + membership** (not extra columns only on `profiles`): the company owner is still a person with a login; the org holds the copyable code; membership rows carry `pending` / `active` / `rejected`. Signup passes `account_type` and `join_code` in `options.data`; the existing `on_auth_user_created` trigger must be **replaced**, not duplicated. Pending fisioterapeutas keep an Auth user and an active-looking profile but must **not** satisfy `isAuthenticated`. Rejection cannot delete `auth.users` from the browser — `is_active = false` plus a distinct “conta recusada” screen is the implementable form of D-04.

**Primary recommendation:** Ship org + membership + `private.*` RLS helpers + public RPCs for code lookup and accept/reject; extend register/auth gates; add `/equipe` only for `empresa`; stamp `patients.created_by` and replace `authenticated_all` policies on every `patient_*` table the ficha reads.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Escolher tipo no cadastro | Browser / Client | Database / Storage | Zod + RHF collect `account_type` / `join_code`; trigger persists them. UI cannot be the authority. |
| Validar código da empresa | API / Backend (RPC) | Browser / Client | Anon must look up a code before `signUp`. Exact-match SECURITY DEFINER RPC; do not `SELECT` all orgs. |
| Criar profile + org + membership | Database / Storage | — | `handle_new_user` on `auth.users` is the existing signup path. Client insert after signup races confirmation and RLS. |
| Bloquear login pendente / recusado | Frontend Server N/A (SPA) + Browser | Database / Storage | `AuthProvider` / `ProtectedRoute` hide the clinic; RLS must still deny patient writes if the gate is bypassed. |
| Aceitar / recusar pedido | Database / Storage (RPC) | Browser / Client | Owner must not UPDATE another user’s `profiles` row directly (IDOR). RPC checks owner membership then updates membership + `is_active`. |
| Código copiável | Browser / Client | Database / Storage | Code is generated and stored on `organizations`; UI only copies. |
| Isolar pacientes por criador | Database / Storage | Browser / Client | D-05/D-07 fail if only the UI hides buttons. RLS on `patients` and child tables is the control. |
| Empresa consulta ficha | Database / Storage | Browser / Client | SELECT for org owner; INSERT/UPDATE/DELETE only for `created_by = auth.uid()`. UI hides writes for UX. |
| Item Equipe no menu | Browser / Client | — | Filter `navigationItems`. Route guard is defense in depth; RLS still required on team tables. |

## Standard Stack

### Core

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `@supabase/supabase-js` | 2.110.7 (`package.json` ^2.49.8) | Auth `signUp` / session + PostgREST + `rpc()` | Already the only backend client. [VERIFIED: local node_modules] |
| `zod` | 3.25.76 (`package.json` ^3.25.28) | Register + join-code validation | Existing form contract. Stay on Zod 3 — do not upgrade to Zod 4 this phase. [VERIFIED: local node_modules] |
| `react-hook-form` + `@hookform/resolvers` | 7.56.4 / ^5.0.1 | Cadastro and equipe confirm dialogs | Existing pattern in `RegisterPage`. |
| `@tanstack/react-query` | ^5.76.1 | Cache equipe + membership | Existing clinic cache. New keys `['team']`, `['membership']`. |
| React Router DOM | ^7.6.1 | `/cadastro`, `/equipe`, `/aguardando` | Existing router in `src/routes/index.tsx`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Postgres + RLS | Hosted Supabase | Policies, triggers, RPCs | All authorization. [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |
| `lucide-react` | ^1.25.0 | Ícone Equipe (já usa `Users`) | Nav item only. |
| UI kit existente | — | `Select`, `Input`, `Button`, `DataTable`, `ConfirmDialog`, `PageHeader`, `AuthLayout` | Do not add a component library. |
| `navigator.clipboard` | Browser API | Copiar código | No `clipboard` npm package. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `organizations` + `organization_memberships` | Columns only on `profiles` (`company_id`, `join_code`, `membership_status`) | Fewer tables, faster to type. Weak: owner must UPDATE another user’s profile to refuse (IDOR). Join code on a person-row is awkward. Rejected for accept/reject safety. |
| Email invite tokens | Locked out (D-01) | Correct for SaaS; out of scope. |
| Edge Function + `auth.admin.deleteUser` on reject | `is_active = false` | True D-04 “apagar Auth user” needs service role, which this repo must never put in Vite. No Edge Functions exist today. |
| Vitest this phase | `npm run lint` + `npm run typecheck` + UAT | TESTING.md wants Vitest; no runner exists. Do not block REQ-15 on a first-time test harness. `/gsd-add-tests` after the phase. |

**Installation:** none — do not add packages.

**Version verification:** installed `zod@3.25.76`, `@supabase/supabase-js@2.110.7` (2026-09-08). Registry latest zod 4.5.4 and supabase-js 2.116.0 exist; **do not upgrade** in this phase.

## Package Legitimacy Audit

This phase installs **no** new packages.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | No install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

`slopcheck` was not available at research time. No `[VERIFIED]` new package names are recommended.

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` does not exist in this repo. Follow `.planning/codebase/ARCHITECTURE.md` and `CONVENTIONS.md` as the project contract:

- Layers: page → hooks → services → Supabase. Pages must not import `@/lib/supabase/client`.
- No clinic logic in leftover bakery files (`src/services/modules.service.ts`, `src/hooks/queries.ts`, `src/pages/EmployeesPage.tsx`, `src/lib/permissions.ts`).
- Do not reuse `profiles.role` bakery enums (`administrador`, `confeiteiro`, …) for autônomo/empresa/fisioterapeuta.
- `onAuthStateChange` must stay **synchronous** (documented deadlock in `AuthProvider`).
- SQL is applied in the Supabase SQL Editor. `/supabase/` is gitignored — commit the phase script under the phase directory as well.
- Clinic types go in `src/types/<domain>.ts`, not `database.types.ts`.
- User-facing copy in Portuguese. Toasts via `toast()`; auth form errors stay inline (`role="alert"`).
- Client checks are UX only; RLS is authoritative.

## Architecture Patterns

### System Architecture Diagram

```text
                    ┌──────────────┐
   /cadastro        │  RegisterPage │  Zod: accountType + joinCode?
                    └──────┬───────┘
                           │ 1. rpc('lookup_organization_by_code')  [anon]
                           │ 2. auth.signUp({ options.data: { full_name, account_type, join_code } })
                           ▼
                    ┌──────────────────┐
                    │  auth.users INSERT│
                    └────────┬─────────┘
                             │ trigger on_auth_user_created
                             ▼
              ┌──────────────────────────────┐
              │ public.handle_new_user()     │
              │  autonomo → profile only     │
              │  empresa  → profile + org +  │
              │             owner membership │
              │  fisio    → profile + pending│
              │             membership       │
              └──────────────┬───────────────┘
                             ▼
 /  login ──► AuthProvider ──► fetchProfile + fetchMembership
                             │
            ┌────────────────┼────────────────────────┐
            ▼                ▼                        ▼
     no session        pending fisio            is_active=false
     GuestRoute        /aguardando              Conta recusada
                                               (D-04)
                             │
                    active autonomo / empresa / fisio
                             ▼
                      ProtectedRoute + AppShell
                             │
              ┌──────────────┼────────────────┐
              ▼              ▼                ▼
         clinic pages    /equipe (empresa)   patients RLS
         (write own)     code + pendentes    SELECT: self OR
                                             org-owner of creator
                                             WRITE: creator only
```

### Recommended Project Structure

```
src/
├── types/account.ts              # AccountType, MembershipStatus, Organization, TeamMember
├── schemas/auth.schema.ts        # extend registerSchema (accountType, joinCode)
├── services/auth.service.ts      # metadata on signUp; fetchProfile without swallowing pending
├── services/team.service.ts      # NEW: lookupCode, listTeam, decideMembership, fetchMembership
├── hooks/useTeam.ts              # NEW: query keys ['team'], ['membership']
├── lib/accountAccess.ts          # NEW: canManageTeam, canWritePatient, accountTypeLabel
├── pages/auth/RegisterPage.tsx   # Select tipo + código condicional
├── pages/TeamPage.tsx            # NEW: /equipe
├── components/auth/ProtectedRoute.tsx  # pending + rejected screens
├── config/navigation.ts          # Equipe item + filter helper
└── routes/index.tsx              # /equipe, /aguardando

.planning/phases/03-tipos-de-conta-e-equipe/sql/
└── 03-account-types-team.sql     # committed source of truth
supabase/03-account-types-team.sql  # local copy for SQL Editor (gitignored dir)
```

### Pattern 1: Signup metadata → trigger (locked path)

**What:** Pass account fields in `signUp` `options.data`; persist in `handle_new_user` from `new.raw_user_meta_data`.
**When to use:** Every new account. Do not insert `profiles` from the browser after signup (email-confirm has no session; trigger failure must abort the Auth insert).

```typescript
// Source: https://supabase.com/docs/guides/auth/managing-user-data
const { data, error } = await supabase.auth.signUp({
  email: 'valid.email@supabase.io',
  password: 'example-password',
  options: {
    data: {
      first_name: 'John',
      age: 27,
    },
  },
})
```

Project mapping: keep `full_name`; add `account_type` (`autonomo` \| `empresa` \| `fisioterapeuta`) and `join_code` (fisio only).

```sql
-- Source: https://supabase.com/docs/guides/auth/managing-user-data
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  return new;
end;
$$;
```

**Executor must `CREATE OR REPLACE` the live function** after inspecting the current body in the SQL Editor. A second `on_auth_user_created` trigger will double-insert or fail. If the trigger raises, signup is blocked — validate `join_code` in the function and `RAISE EXCEPTION` on miss.

### Pattern 2: Membership RLS via `private` SECURITY DEFINER helpers

**What:** Policies must not `SELECT` `organization_memberships` from inside another membership policy (Postgres `42P17` recursion). Official fix: helper in schema `private`, `security definer`, `set search_path = ''`, wrap calls in `(select ...)`.
**When to use:** Every policy that asks “is this user the org owner?” or “does this user own this patient?”.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
create schema if not exists private;

create function private.user_list_ids()
returns setof uuid
language sql
security definer
set search_path = ''
stable
as $$
  select list_id from public.list_members
  where user_id = (select auth.uid())
$$;

revoke execute on function private.user_list_ids() from public;
grant usage on schema private to authenticated;
grant execute on function private.user_list_ids() to authenticated;
```

**Do not** put RLS helpers in `public` if they can be abused as RPCs. Official caution: a SECURITY DEFINER function in an **exposed** schema is callable over the Data API with the creator’s privileges. [CITED: supabase.com/docs/guides/database/postgres/row-level-security]

### Pattern 3: Public RPCs only for intentional mutations

**What:** `lookup_organization_by_code(code)` (anon + authenticated), `decide_membership(membership_id, accept boolean)` (authenticated owner).
**When to use:** Accept/reject and pre-signup code check. Function body must re-check `auth.uid()` is the org owner. `REVOKE EXECUTE FROM public, anon` except on lookup.

```typescript
// Source: https://supabase.com/docs/guides/database/functions
const { data, error } = await supabase.rpc('hello_world')
```

### Anti-Patterns to Avoid

- **Reuse `src/pages/EmployeesPage.tsx` / `admin_update_profile`:** bakery leftover; would write `profiles.role` confectionery enums.
- **Client-only hide of Equipe / edit buttons:** ASVS 4.1.1 — access control on a trusted layer. RLS or it did not happen.
- **`profiles.role = 'administrador'` meaning empresa:** bakery enum stays; new `account_type` column.
- **`await` inside `onAuthStateChange`:** infinite login spinner (ARCHITECTURE.md).
- **Direct `UPDATE profiles SET is_active` by another user:** IDOR. Use `decide_membership`.
- **`GRANT SELECT ON organizations TO anon`:** code enumeration. Lookup RPC only.
- **Installing a clipboard or uuid package:** `navigator.clipboard` + `gen_random_uuid()` in SQL.
- **Leaving `patient_*` on `using (true)`:** D-05/D-07 become theater.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth user + session | Custom JWT | Supabase Auth | PKCE already configured. |
| Password hashing / email confirm | Own mailer | Supabase Auth settings | Already live. |
| Authorization | `src/lib/permissions.ts` bakery helpers | RLS + `private.*` helpers + RPCs | Client is bypassable (ASVS 4.1.1). |
| Invite email | Token mailer | Company code (D-01) | Deferred. |
| Delete Auth user from SPA | service_role in Vite | `is_active = false` | service_role must never ship in `VITE_*`. |
| CSPRNG for codes | `Math.random()` in JS | `gen_random_uuid()` default + unique index | Browser RNG is not the source of truth. |
| Clipboard lib | `clipboard` npm | `navigator.clipboard.writeText` | One button. |
| Test framework this phase | Jest + Cypress | Existing `lint` / `typecheck` | No runner in repo; don’t expand scope. |

**Key insight:** The hard part is not the `/equipe` screen. It is replacing “any logged-in user can read PHI” with creator-write / owner-read **without** recursive RLS or letting the company owner edit teammate charts.

## Common Pitfalls

### Pitfall 1: RLS recursion on membership

**What goes wrong:** Policy on `organizations` reads `organization_memberships`; policy on memberships reads `organizations` → `42P17` or empty results.
**Why it happens:** Postgres re-enters RLS on the inner table.
**How to avoid:** `private.is_org_owner()`, `private.active_org_id()`, `private.can_read_patient(uuid)` as SECURITY DEFINER with `search_path = ''`.
**Warning signs:** Every team query returns 0 rows or PostgREST “infinite recursion”.

### Pitfall 2: Pending user treated as “sem perfil”

**What goes wrong:** `fetchProfile` filters `.eq('is_active', true)`. Pending and rejected both look like `AccountWithoutProfile`.
**Why it happens:** One boolean cannot express three states (active / waiting / cancelled).
**How to avoid:** Load the profile **without** the `is_active` filter. Derive:

| account_type | membership | is_active | UI |
|--------------|------------|-----------|----|
| autonomo / empresa | n/a | true | Clinic |
| fisioterapeuta | pending | true | `/aguardando` (D-03) |
| fisioterapeuta | rejected | false | Conta recusada (D-04) |
| any | — | false | Conta sem perfil ativo |

Keep `is_active = true` while pending so the waiting copy is possible. `isAuthenticated` must require **not pending**.

**Warning signs:** Fisio pendente entra no `/painel` or sees the generic inactive card.

### Pitfall 3: Same email cannot “cadastrar de novo”

**What goes wrong:** D-04 says re-register. Supabase keeps `auth.users`. With Confirm email on, a second `signUp` returns an obfuscated user and empty `identities` (already handled as `isDuplicateProbe`). With confirm off, error is `User already registered`. [CITED: supabase.com/docs/reference/javascript/auth-signup]
**Why it happens:** Auth email is unique; browser cannot call `auth.admin.deleteUser()`.
**How to avoid:** Reject sets `membership.status = rejected` and `profiles.is_active = false`. Login shows “Pedido recusado. Use outro e-mail para um novo cadastro.” Do **not** build “trocar de empresa” (deferred). Optional operator path: delete the user in Dashboard.
**Warning signs:** Recusado tenta o mesmo e-mail e o formulário “sucede” sem conta nova.

### Pitfall 4: `GuestRoute` redirects any session into the clinic

**What goes wrong:** After signup without confirm, session exists; `GuestRoute` sends them to `/painel`.
**Why it happens:** Guard checks `session`, not `isAuthenticated`.
**How to avoid:** Redirect to clinic only when `isAuthenticated`. If session + pending → `/aguardando`. If session + inactive → rejected/inactive screen (not login).
**Warning signs:** Pendente vê Dashboard vazio or cria paciente (violates D-03).

### Pitfall 5: Patients have no owner today

**What goes wrong:** `createPatient` does not write `created_by`. DETAIL_COLUMNS omit it. D-05 cannot be enforced.
**Why it happens:** Single-tenant leftover; evaluations SQL used `using (true)`.
**How to avoid:** `ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id)`; `BEFORE INSERT` trigger `NEW.created_by := auth.uid()`; client also sends `created_by` as belt-and-suspenders. Backfill: if exactly one `profiles` row, set all NULL `created_by` to that id; otherwise leave NULL with a **transitional** SELECT (`created_by IS NULL` visible to authenticated) and document the debt.
**Warning signs:** Empresa vê zero pacientes after SQL, or still sees every clinic’s rows.

### Pitfall 6: Ficha child tables stay world-readable

**What goes wrong:** Tight `patients` policy, but `patient_sessions` / `patient_evaluations` / `patient_goals` / alerts still `using (true)`.
**Why it happens:** Phase 1–2 SQL shipped open policies.
**How to avoid:** One helper `private.can_read_patient(patient_id)` / `private.can_write_patient(patient_id)` used by every `patient_*` policy. Drop `*_authenticated_all`.
**Warning signs:** Fisio B opens `/pacientes/:id` of A via a leaked UUID and still loads evoluções.

### Pitfall 7: Empresa write leaked through UI-only

**What goes wrong:** Buttons hidden; `updatePatient` still works in the network tab.
**Why it happens:** Services do not check account type.
**How to avoid:** RLS `WITH CHECK` / `USING` for UPDATE/DELETE = `can_write_patient` only. UI uses `canWritePatient(profile, patient.createdBy)`.
**Warning signs:** Owner PATCH on teammate patient returns 200.

### Pitfall 8: Trigger replace without inspecting live SQL

**What goes wrong:** New `CREATE TRIGGER` fails or a second trigger inserts two profiles; bakery columns (`role`, `email`) become NULL and break login.
**Why it happens:** `handle_new_user` is not in git.
**How to avoid:** First plan task: dump `\sf handle_new_user` / Dashboard function editor; `CREATE OR REPLACE` preserving `full_name`, `email`, `role` defaults.
**Warning signs:** Signup 500; existing bakery RPCs break.

### Pitfall 9: `listActiveTherapists` lists every profile

**What goes wrong:** After tightening profiles RLS, session forms break — or they keep listing other clinics’ staff if profiles stay world-readable.
**Why it happens:** `sessions.service.ts` selects all `is_active` profiles.
**How to avoid:** Profiles SELECT = self OR active teammate in same org. Autônomo sees only self.
**Warning signs:** Dropdown shows names from another empresa.

### Pitfall 10: Join code collision / guessable codes

**What goes wrong:** 4-digit codes are brute-forced via anon RPC.
**Why it happens:** Short decimal codes.
**How to avoid:** 8 uppercase hex chars from `gen_random_uuid()`, unique index, retry in org insert. Normalize input: trim, uppercase, strip spaces. Client rate limit already on register (`checkRateLimit`). RPC returns `{ ok: true }` only — no org name to anon.
**Warning signs:** Lookup RPC returns full org rows.

## Code Examples

### Register schema (superRefine, matches existing auth.schema style)

```typescript
// Source: src/schemas/patient.schema.ts superRefine pattern + Zod 3 object API
// https://zod.dev (Zod 3.25 — do not use Zod 4 docs)

accountType: z.enum(['autonomo', 'empresa', 'fisioterapeuta'], {
  required_error: 'Escolha o tipo de conta',
}),
joinCode: z.string().optional(),
// then .superRefine: if accountType === 'fisioterapeuta', joinCode normalized length >= 8
```

### signUp with account metadata

```typescript
// Source: https://supabase.com/docs/guides/auth/managing-user-data
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      account_type: parsed.accountType,
      join_code: parsed.joinCode ?? null,
    },
    emailRedirectTo: `${window.location.origin}/`,
  },
})
```

### RLS helper + policy (official wrap)

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
create policy "Individuals can view their own todos."
on todos for select
to authenticated
using ( (select auth.uid()) = user_id );
```

Project equivalent: `using ( (select private.can_read_patient(id)) )` on `patients`; writes `can_write_patient(id)`.

### Auth gate (keep callback sync)

```typescript
// Source: src/providers/AuthProvider.tsx — do not change this shape
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
  setSession(newSession)
  setSessionLoaded(true)
})
// Load profile + membership in the userId effect, not here.
```

### Clipboard copy

```typescript
await navigator.clipboard.writeText(joinCode)
toast('Código copiado')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| App-layer tenant checks | RLS + `(select auth.uid())` initPlan | Supabase RLS guide (current) | Policies must wrap `auth.uid()` and helpers. [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |
| Membership JOIN inside policies | `private` SECURITY DEFINER helpers | Same guide, “Avoid recursive policies” | Required for org/member tables. |
| Email invites for teams | Shareable join code (this product) | Locked D-01 | No mail provider in repo. |
| Zod 4 rewrite | Zod 3.25 in this app | Zod 4 exists on npm (2026) | Stay on 3; `z.enum` / `superRefine` APIs differ in 4. |

**Deprecated/outdated:**

- Treating `using (true)` on clinical tables as “MVP OK” — CONCERNS.md already flags this as PHI leak; this phase is the first product reason to close it.
- Mapping bakery `profiles.role` to “Fisioterapeuta” in `AppShell` as the account model — replace display with `account_type` labels.

## Recommended Data Model (Claude's Discretion)

```text
account_type: autonomo | empresa | fisioterapeuta   -- column on profiles, NOT profiles.role

organizations
  id uuid pk
  owner_id uuid unique references profiles(id)      -- one org per empresa person
  name text                                         -- default: owner's full_name
  join_code text unique not null                    -- 8 hex uppercase
  created_at timestamptz

organization_memberships
  id uuid pk
  organization_id uuid references organizations
  profile_id uuid references profiles
  role text check (role in ('owner', 'therapist'))
  status text check (status in ('pending', 'active', 'rejected'))
  unique (organization_id, profile_id)
```

Signup outcomes:

| Tipo | Profile | Org | Membership |
|------|---------|-----|------------|
| autonomo | account_type=autonomo, is_active=true | none | none |
| empresa | account_type=empresa, is_active=true | created + join_code | owner / active |
| fisioterapeuta + código válido | account_type=fisioterapeuta, is_active=true | none | therapist / pending |
| fisioterapeuta + código inválido | signup aborted (trigger exception) | — | — |

Existing rows: `UPDATE profiles SET account_type = 'autonomo' WHERE account_type IS NULL`.

## Auth State Machine (planner must implement)

```text
isLoading → spinner

!session → GuestRoute (login / cadastro)

session && !profile → Conta sem perfil (legacy / trigger miss)

session && profile.is_active === false → Conta recusada / inativa
  copy: pedido recusado ou perfil desativado; sair; cadastrar com outro e-mail

session && profile.account_type === 'fisioterapeuta'
        && membership.status === 'pending' → /aguardando
  copy: cadastro ok, aguarde a empresa aceitar; botão Sair
  NÃO criar pacientes, NÃO ver agenda

session && profile.is_active && not pending → isAuthenticated
  empresa → nav includes Equipe
  autonomo / fisio → no Equipe; /equipe redirects to /pacientes
```

`isAuthenticated` today is `!!session && !!profile` after `is_active` filter. Change the definition; do not overload `is_active` for pending.

## Patient Access Rules

| Actor | List / ficha SELECT | INSERT / UPDATE / DELETE patient_* |
|-------|---------------------|-------------------------------------|
| Autônomo | own `created_by` | own |
| Fisioterapeuta (active) | own `created_by` | own |
| Fisioterapeuta (pending) | none (no clinic session; RLS deny anyway) | none |
| Empresa (owner) | own + `created_by IN (active therapists of org)` | **own rows only** (D-07) |

UI: `canWritePatient` hides edit/delete/create-session/evaluation/goal/alert on teammate patients. Calendar/Dashboard inherit isolation from session/patient RLS — no extra query if policies are correct.

`listActiveTherapists`: only self + active org teammates.

Board/Kanban: **out of REQ-15 success criteria**. Leave board policies unchanged this phase unless a card stores another therapist’s PHI (not verified). Flag as residual leak in Open Questions.

## SQL Delivery

`/supabase/` is gitignored (`.gitignore`). Previous scripts (`patients-req05-evaluations.sql`, `patients-req14-goals.sql`) live only on disk.

**Do this:**

1. Write the full script to `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (committed).
2. Copy to `supabase/03-account-types-team.sql` for the human SQL Editor paste.
3. Script must be idempotent (`if not exists`, `drop policy if exists`, `create or replace function`).
4. First executable comment: “Inspecione `handle_new_user` no Dashboard antes de rodar.”

Supabase CLI is **not** installed; `supabase test db` is unavailable. Verification is SQL Editor + in-browser UAT.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Live DB already has `public.handle_new_user` + `on_auth_user_created` that inserts `profiles` with bakery `role` / `email` | Pattern 1 | Blind replace drops required columns; signup or login breaks. |
| A2 | `patients` has no usable `created_by` today | Pitfall 5 | Script `ADD COLUMN` may no-op if a column exists with different meaning. |
| A3 | Clinical tables besides evaluations/goals also use open RLS | Pitfall 6 | Missing a table leaves an IDOR hole. |
| A4 | Rejected users must use a **new email** (cannot delete Auth user from SPA) | Pitfall 3 | Conflicts with a literal reading of D-04 if the user insists on same email. |
| A5 | Single existing profile can be backfilled as owner of all current patients | Patient Access | Wrong if more than one real user already shares the project. |
| A6 | Board/Kanban can stay globally visible this phase | Patient Access | Possible PHI leak via card titles. |
| A7 | Confirm-email setting is unknown; both session-now and confirm-first must work | Auth State | Pending copy on RegisterPage vs LoginPage may be wrong for one mode. |

## Open Questions

1. **Live `handle_new_user` body**
   - What we know: App creates profiles on signup; types expect `full_name`, `email`, `role`, `is_active`.
   - What's unclear: Exact SQL, default `role`, whether it already reads metadata besides `full_name`.
   - Recommendation: Wave 0 inspection in SQL Editor; plan task cannot skip this.

2. **Legacy patients without owner**
   - What we know: `createPatient` does not set `created_by`.
   - What's unclear: How many users exist in the hosted project.
   - Recommendation: Conditional backfill (one profile → that id); else transitional NULL policy.

3. **Board / quadro isolation**
   - What we know: Not in REQ-15 acceptance.
   - What's unclear: Whether cards include patient names.
   - Recommendation: Leave unchanged; note residual risk.

4. **Same-email after reject**
   - What we know: Auth uniqueness + no service_role in client.
   - What's unclear: Whether the user will accept “outro e-mail”.
   - Recommendation: Implement as specified in Pitfall 3; do not add Edge Functions this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | lint / typecheck / vite | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| zod / supabase-js (installed) | app | ✓ | 3.25.76 / 2.110.7 | — |
| Supabase hosted project | SQL + Auth | ✓ (app already uses it) | — | Human applies SQL |
| Supabase CLI | `supabase test db` | ✗ | — | Manual SQL Editor checks |
| ctx7 | docs lookup | ✗ | — | Official docs via WebFetch |
| slopcheck | package gate | ✗ | — | No new packages |
| Vitest / Jest | automated unit tests | ✗ | — | lint + typecheck + UAT |
| Graph `.planning/graphs/graph.json` | cross-doc intel | ✗ | — | Codebase maps used instead |

**Missing dependencies with no fallback:** none that block implementation (SQL Editor is the established path).

**Missing dependencies with fallback:** Supabase CLI → manual policy checks; Vitest → lint/typecheck + `/gsd-add-tests` later.

## Validation Architecture

`.planning/config.json` is absent → treat `workflow.nyquist_validation` as **enabled**.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None. Gates: ESLint 9 + `tsc --noEmit` (TypeScript 5.8.3) |
| Config file | `eslint.config.js`, `tsconfig.json` — no vitest/jest config |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-15.1 | Cadastro exige tipo autônomo/empresa/fisioterapeuta | unit (schema) | n/a until Vitest | ❌ Wave 0 skipped — assert via `registerSchema.safeParse` in UAT / later `src/schemas/auth.schema.test.ts` |
| REQ-15.1 | Fisio sem código falha Zod | unit (schema) | same | ❌ |
| REQ-15.2 | Empresa vê `/equipe` com código + pendentes | manual UAT | — | — |
| REQ-15.3 | Fisio pendente não acessa clínica | manual + RLS | SQL Editor as owner vs pending JWT | ❌ |
| REQ-15.4 | Autônomo não vê Equipe | manual UAT | — | — |
| REQ-15.5 | Tipos e vínculos no Supabase | manual | Table Editor after signup | — |
| D-05/D-07 | Fisio B cannot SELECT A's patient; empresa cannot UPDATE A's patient | integration (RLS) | `supabase test db` unavailable | ❌ manual |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run lint && npm run typecheck`
- **Phase gate:** Full lint/typecheck green + SQL applied + UAT of the four success criteria before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Inspect live `handle_new_user` (blocks SQL authoring) — not a test file
- [ ] Do **not** add Vitest in this phase (no package legitimacy run). Schema unit files are a `/gsd-add-tests` follow-up.
- [ ] Shared fixtures: none

Automated coverage cannot prove RLS without CLI or a hosted test project. Planner verification steps must include explicit SQL Editor allow/deny cases (anon, pending fisio, fisio A, fisio B, empresa owner).

## Security Domain

`security_enforcement` absent → **enabled**.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing Supabase email/password; do not add a second authenticator. Pending user may authenticate but must not be authorized for clinic data. [CITED: github.com/OWASP/ASVS V2] |
| V3 Session Management | yes | Existing PKCE session. Reject/pending must not rely on “forget to render nav”. Sign-out already invalidates refresh via `signOut`. [CITED: ASVS V3] |
| V4 Access Control | **yes — primary** | RLS + RPCs (ASVS 4.1.1 trusted layer, 4.1.3 least privilege, 4.2.1 IDOR). [CITED: asvs.dev/v4.0.3/V4-Access-Control] |
| V5 Input Validation | yes | Zod on register/join code; SQL normalize + unique on `join_code`. |
| V6 Cryptography | no new | Do not hand-roll tokens. Codes from `gen_random_uuid()`. No new hashing libs. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on patient UUID | Information disclosure / Tampering | `can_read_patient` / `can_write_patient`; drop `using (true)` |
| Privilege escalation (fisio updates own membership to active) | Elevation of privilege | Membership UPDATE only via `decide_membership` as owner |
| Privilege escalation (anyone inserts membership for any org) | Elevation of privilege | No client INSERT on memberships except trigger; or INSERT policy: pending + code match via RPC only |
| Enumerate join codes | Information disclosure | 8-char hex, unique, RPC boolean only, existing register rate limit |
| Company owner edits teammate PHI | Tampering | Write policies exclude owner-of-creator |
| Pending fisio uses leaked JWT on REST | Information disclosure | RLS deny; `is_active` true is not enough |
| service_role in frontend | Elevation of privilege | Forbidden (SetupPage already warns) |
| SECURITY DEFINER search_path hijack | Elevation of privilege | `set search_path = ''` + schema-qualified names [CITED: supabase.com/docs/guides/database/functions] |
| Recursive RLS fail-open/fail-closed | Denial of service / disclosure | `private` helpers |
| Open registration still creates Auth users | Spoofing | Unchanged; pending/reject reduce product access. Public signup remains a residual LGPD risk (CONCERNS.md) — out of scope to disable signup. |

## Sources

### Primary (HIGH confidence)

- https://supabase.com/docs/guides/auth/managing-user-data — `options.data` → `raw_user_meta_data`; `handle_new_user` trigger; trigger failure blocks signup
- https://supabase.com/docs/reference/javascript/auth-signup — confirm-email session vs null; duplicate user obfuscation vs `User already registered`
- https://supabase.com/docs/guides/database/postgres/row-level-security — grants vs policies; `(select auth.uid())`; `private` SECURITY DEFINER; recursion; do not expose definer helpers on the API schema
- https://supabase.com/docs/guides/database/functions — `rpc()`, `security definer` + `search_path = ''`, revoke execute from `public`
- https://zod.dev — `z.discriminatedUnion` / object + refine (Zod 3 docs)
- https://asvs.dev/v4.0.3/V4-Access-Control/ — 4.1.1, 4.1.3, 4.2.1
- In-repo: `src/services/auth.service.ts`, `AuthProvider.tsx`, `ProtectedRoute.tsx`, `RegisterPage.tsx`, `patients.service.ts` (`createPatient`), `navigation.ts`, `ARCHITECTURE.md`, `CONCERNS.md`, `TESTING.md`, `supabase/patients-req05-evaluations.sql`, `supabase/patients-req14-goals.sql`

### Secondary (MEDIUM confidence)

- Community join-code default `upper(substring(gen_random_uuid()::text, 1, 8))` — use with unique + retry; not official Supabase API
- Membership-insert IDOR write-ups (DEV/community) — aligned with official “constrain the tenant on INSERT”

### Tertiary (LOW confidence)

- Exact live policies on `patients`, `patient_sessions`, `profiles` — not in git; treat as unknown until SQL Editor inspect

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions read from `node_modules`; no new libraries
- Architecture: HIGH for recommended org/membership + auth gates; MEDIUM for live trigger/RLS unknowns (A1–A3)
- Pitfalls: HIGH — official RLS recursion/definer + verified in-repo auth/patient gaps

**Research date:** 2026-09-08
**Valid until:** 2026-10-08 (Supabase Auth/RLS docs are stable; re-check if Zod is upgraded to 4)
