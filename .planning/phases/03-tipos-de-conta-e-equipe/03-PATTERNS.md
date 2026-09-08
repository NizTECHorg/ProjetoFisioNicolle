# Phase 3: Tipos de conta e equipe - Pattern Map

**Mapped:** 2026-09-08
**Files analyzed:** 28
**Analogs found:** 26 / 28

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/account.ts` | model | transform | `src/types/patient.ts` | exact |
| `src/schemas/auth.schema.ts` | utility | transform | `src/schemas/auth.schema.ts` + `src/schemas/patient.schema.ts` | exact |
| `src/services/auth.service.ts` | service | request-response | `src/services/auth.service.ts` | exact |
| `src/services/team.service.ts` | service | CRUD | `src/services/patients.service.ts` | exact |
| `src/hooks/useTeam.ts` | hook | CRUD | `src/hooks/usePatients.ts` | exact |
| `src/lib/accountAccess.ts` | utility | transform | `src/types/patient.ts` (`statusLabels`) + `src/components/layout/AppShell.tsx` (`roleLabels`) | role-match |
| `src/pages/auth/RegisterPage.tsx` | component | request-response | `src/pages/auth/RegisterPage.tsx` + `src/components/patients/PatientEvolutionsPanel.tsx` (`watch`) | exact |
| `src/pages/auth/LoginPage.tsx` | component | request-response | `src/pages/auth/LoginPage.tsx` | exact |
| `src/pages/auth/WaitingApprovalPage.tsx` | component | request-response | `src/components/auth/ProtectedRoute.tsx` (`AccountWithoutProfile`) | exact |
| `src/pages/TeamPage.tsx` | component | CRUD | `src/pages/PatientsPage.tsx` + `src/components/ui/DataTable.tsx` | exact |
| `src/components/auth/ProtectedRoute.tsx` | middleware | request-response | `src/components/auth/ProtectedRoute.tsx` | exact |
| `src/providers/AuthProvider.tsx` | provider | request-response | `src/providers/AuthProvider.tsx` | exact |
| `src/hooks/useAuth.ts` | hook | request-response | `src/hooks/useAuth.ts` | exact |
| `src/config/navigation.ts` | config | transform | `src/config/navigation.ts` | exact |
| `src/routes/index.tsx` | route | request-response | `src/routes/index.tsx` | exact |
| `src/components/layout/AppShell.tsx` | component | transform | `src/components/layout/AppShell.tsx` | exact |
| `src/services/patients.service.ts` | service | CRUD | `src/services/patients.service.ts` | exact |
| `src/types/patient.ts` | model | transform | `src/types/patient.ts` | exact |
| `src/pages/PatientsPage.tsx` | component | CRUD | `src/pages/PatientsPage.tsx` | exact |
| `src/pages/PatientPage.tsx` | component | CRUD | `src/pages/PatientPage.tsx` | exact |
| `src/services/sessions.service.ts` | service | CRUD | `src/services/sessions.service.ts` (`listActiveTherapists`) | exact |
| `src/components/patients/PatientAlertsPanel.tsx` | component | CRUD | same file | exact |
| `src/components/patients/PatientGoalsPanel.tsx` | component | CRUD | same file | exact |
| `src/components/patients/PatientEvolutionsPanel.tsx` | component | CRUD | same file | exact |
| `src/components/patients/PatientEvaluationPanel.tsx` | component | CRUD | same file | exact |
| `src/components/patients/PatientCadastroPanel.tsx` | component | CRUD | same file | exact |
| `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` | migration | transform | `supabase/patients-req14-goals.sql` | role-match |
| `supabase/03-account-types-team.sql` | migration | transform | same as committed SQL (local paste copy) | exact |

**Do not copy:** `src/pages/EmployeesPage.tsx`, `src/lib/permissions.ts`, `src/services/modules.service.ts` (`admin_update_profile`), bakery `profiles.role` enums.

## Pattern Assignments

### `src/types/account.ts` (model, transform)

**Analog:** `src/types/patient.ts`

**Imports / type style** (lines 1–16): closed unions as `export type`, labels as `Record<Union, string>`, domain objects as `export interface` with camelCase.

```typescript
export type PatientStatus = 'em_tratamento' | 'avaliacao' | 'alta' | 'inativo'
export type GoalStatus = 'em_andamento' | 'concluido'

export const statusLabels: Record<PatientStatus, string> = {
  em_tratamento: 'Em tratamento',
  avaliacao: 'Avaliação',
  alta: 'Alta',
  inativo: 'Inativo',
}
```

**Copy this shape for account types:**

```typescript
export type AccountType = 'autonomo' | 'empresa' | 'fisioterapeuta'
export type MembershipStatus = 'pending' | 'active' | 'rejected'
export type MembershipRole = 'owner' | 'therapist'

export const accountTypeLabels: Record<AccountType, string> = {
  autonomo: 'Autônomo',
  empresa: 'Empresa',
  fisioterapeuta: 'Fisioterapeuta',
}

export interface Organization {
  id: string
  ownerId: string
  name: string
  joinCode: string
}

export interface TeamMember {
  id: string
  profileId: string
  fullName: string
  email: string
  status: MembershipStatus
  role: MembershipRole
}
```

**Do not** put these unions on `profiles.role` in `src/types/database.types.ts`. That file is bakery `EmployeeRole`. Keep clinic account types here. If Auth still types `Profile` from `database.types.ts`, extend via a `ClinicProfile` interface in this file (`Profile` fields + `accountType`) rather than expanding bakery enums.

---

### `src/schemas/auth.schema.ts` (utility, transform)

**Analog:** existing file + `src/schemas/patient.schema.ts` `superRefine`

**Existing register object + `.refine`** (lines 25–50 of `auth.schema.ts`):

```typescript
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres') /* ... */,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
```

**Conditional-field refine** from `patient.schema.ts` lines 161–191 — copy `superRefine` + `ZodIssueCode.custom` + `path`:

```typescript
.superRefine((data, ctx) => {
  if (data.mode !== 'realizada') return
  if (!data.patientState.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o estado do paciente',
      path: ['patientState'],
    })
  }
})
```

**Apply to register:** add `accountType: z.enum(['autonomo', 'empresa', 'fisioterapeuta'], { required_error: 'Escolha o tipo de conta' })` and optional `joinCode`. In `superRefine`, if `accountType === 'fisioterapeuta'`, normalize (trim, uppercase, strip spaces) and require length 8. Keep Zod 3 APIs (`required_error`, `superRefine`). Export `RegisterFormData = z.infer<typeof registerSchema>`. Leave `employeeRoles` unused — do not map them to account types.

---

### `src/services/auth.service.ts` (service, request-response)

**Analog:** same file

**Imports** (lines 1–10):

```typescript
import { supabase } from '@/lib/supabase/client'
import {
  checkRateLimit,
  mapAuthError,
  resetRateLimit,
  sanitizeEmail,
  sanitizeText,
} from '@/lib/security'
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/schemas/auth.schema'
import type { Profile } from '@/types/database.types'
```

**Rate limit + signUp metadata** (lines 12–73): keep `assertRateLimit` on `auth:register:${email}` + `auth:register:global`. Extend `options.data` only:

```typescript
options: {
  data: {
    full_name: fullName,
    account_type: parsed.accountType,
    join_code: parsed.joinCode ?? null,
  },
  emailRedirectTo: `${window.location.origin}/`,
},
```

Keep `isDuplicateProbe` (`identities.length === 0`) and `mapAuthError`. Do not insert `profiles` from the browser.

**`fetchProfile` must change** (lines 82–95) — today it filters `is_active = true` and returns `null` on error, which collapses pending and rejected into “sem perfil”:

```typescript
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, is_active, created_at, updated_at')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) return null
  return data
}
```

**New contract:** select without `is_active` filter; include `account_type`. Still return `null` only when no row / query error. Pending fisio keeps `is_active = true`. Map row → clinic profile in this service or `account.ts`.

---

### `src/services/team.service.ts` (service, CRUD)

**Analog (list/map/throw):** `src/services/patients.service.ts` lines 115–117, 313–319

```typescript
function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function listPatients(): Promise<PatientListItem[]> {
  const { data, error } = await supabase
    .from('patients')
    .select(LIST_COLUMNS)
    .order('full_name', { ascending: true })
  throwIfError(error)
  // ...
}
```

**Analog (RPC call shape only):** `src/services/modules.service.ts` lines 370–377 — use `supabase.rpc` + throw, but **do not** import `throwDb` or bakery RPCs:

```typescript
export async function confirmOrder(orderId: string) {
  const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId })
  if (error) throwDb(error)
}
```

**Copy for team:**

```typescript
export async function lookupOrganizationByCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('lookup_organization_by_code', {
    p_code: normalizeJoinCode(code),
  })
  throwIfError(error)
  return Boolean(data)
}

export async function decideMembership(membershipId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('decide_membership', {
    p_membership_id: membershipId,
    p_accept: accept,
  })
  throwIfError(error)
}
```

Private row mapper `mapTeamMember` stays in this file (same as `mapPatient` / `mapAlert`). Throw Portuguese `Error` messages, not `{ error }` tuples. Prefer wrapping RPC/Postgres text with a small mapper (CONVENTIONS: clinic writes should not leak raw Postgres). Session expiry copy from `createPatientAlert` lines 520–525: `'Sessão expirada. Entre novamente.'`

Pages must not import `@/lib/supabase/client` — only this service (and auth.service / AuthProvider, which already do).

---

### `src/hooks/useTeam.ts` (hook, CRUD)

**Analog:** `src/hooks/usePatients.ts` lines 1–41, 52–88

**Imports + shared `onError`:**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

**Query keys** (CONVENTIONS + RESEARCH): `['team']`, `['membership']`. Pattern:

```typescript
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: listPatients,
    staleTime: 60_000,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePatientInput) => createPatient(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patients'] })
      toast('Paciente cadastrado', 'success')
    },
    onError,
  })
}
```

**Accept toast:** `'{nome} entrou na equipe.'` **Reject toast:** `'Pedido de {nome} recusado. A conta foi cancelada.'` Use `void qc.invalidateQueries(...)`.

**Optimistic accept** (UI-SPEC): optional copy from `src/hooks/queries.ts` `useMoveTask` lines 373–394 (`onMutate` snapshot → `onError` rollback → `onSettled` invalidate). Prefer this over bakery query keys. If skipped, invalidate-only like `useCreatePatient` is acceptable.

Do **not** add this hook to `src/hooks/queries.ts` (bakery leftover).

---

### `src/lib/accountAccess.ts` (utility, transform)

**Analog (labels / predicates):** `src/types/patient.ts` `statusLabels` + `AppShell` lines 8–14 — **not** `src/lib/permissions.ts`.

`permissions.ts` is bakery role gates (`administrador`, `gerente`). RESEARCH forbids reusing it. New helpers are UX-only (RLS is authority):

```typescript
export function canManageTeam(accountType: AccountType | null | undefined): boolean {
  return accountType === 'empresa'
}

export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}

export function accountTypeLabel(type: AccountType | null | undefined): string {
  if (!type) return ''
  return accountTypeLabels[type]
}
```

Named exports, camelCase, no default export.

---

### `src/pages/auth/RegisterPage.tsx` (component, request-response)

**Analog:** same file + `Select` + `Input` hint + `watch` from `PatientEvolutionsPanel.tsx` line 87

**Imports** (lines 1–9) — add `Select` and keep AuthLayout / RHF / zodResolver:

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema'
import { signUpWithEmail } from '@/services/auth.service'
```

**Form contract** (lines 16–47): `useForm` + `zodResolver` + `noValidate` + `serverError` `role="alert"` + success `role="status"`. Do not toast register failures.

**Conditional join-code:** `const accountType = watch('accountType')` — same idea as `const mode = form.watch('mode')` in `PatientEvolutionsPanel.tsx` line 87. Unmount `Input` when not `fisioterapeuta`; `setValue('joinCode', '')` and clear errors.

**Select analog** (`src/components/ui/Select.tsx` lines 9–35): `label`, `options: { value, label }[]`, `error`, `forwardRef` so `{...register('accountType')}` works. First option `value: ''` label `Selecione o tipo`.

**Join-code Input analog** (`Input.tsx` lines 9–40): `hint`, `error` → `aria-invalid` + `role="alert"`. Props from UI-SPEC: `autoComplete="off"`, `spellCheck={false}`, `autoCapitalize="characters"`.

**Lookup before signUp:** call `lookupOrganizationByCode` from `team.service` in `onSubmit`; on false, `setServerError('Código da empresa não encontrado. Confira com o responsável e tente de novo.')`. Do not import supabase in the page.

**Fisio success:** do not show “Você já pode entrar.” If session exists, navigate `/aguardando`. Copy table is in `03-UI-SPEC.md`.

Field order (UI-SPEC): Nome → E-mail → Tipo → Código (conditional) → Senha → Confirmar → mostrar senhas → Criar conta. Keep `space-y-5`.

---

### `src/pages/auth/LoginPage.tsx` (component, request-response)

**Analog:** same file lines 34–43, 58–66

Inline `role="alert"` for server errors. After reject, same-email login should surface: `Pedido recusado. Use outro e-mail para um novo cadastro.` Prefer mapping in `mapAuthError` / `signInWithEmail` after profile+membership load — do not toast. `GuestRoute` (not this page) must stop sending pending sessions to `/painel`.

---

### `src/pages/auth/WaitingApprovalPage.tsx` (component, request-response)

**Analog:** `src/components/auth/ProtectedRoute.tsx` lines 7–37 (`LoadingScreen` + `AccountWithoutProfile`)

Clone card geometry exactly:

```typescript
<div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
  <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-[0_18px_50px_rgba(11,29,54,0.06)]">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
      <ShieldAlert size={22} />
    </div>
    <h1 className="mt-5 text-xl font-semibold text-ink">...</h1>
    <p className="mt-3 text-sm leading-6 text-muted">...</p>
    <Button variant="secondary" fullWidth onClick={() => void signOut()}>...</Button>
  </div>
</div>
```

Waiting variant: `Clock` in `bg-accent-soft text-accent` (48×48 / `h-12 w-12` `rounded-2xl`). Rejected variant: keep `ShieldAlert` + `bg-error/10 text-error`. No AppShell. `useAuth().signOut`. Alternatively keep both cards inside `ProtectedRoute` — same analog, same classes. New file is preferred so `/aguardando` is a real route.

---

### `src/pages/TeamPage.tsx` (component, CRUD)

**Analog (clinic chrome):** `src/pages/PatientsPage.tsx` lines 60–84

```typescript
<section className="mx-auto w-full max-w-7xl">
  <PageHeader
    className="dash-in"
    title="Pacientes"
    description="Cadastros da clínica. Toque no card ou na linha para abrir a ficha."
  />
  {isLoading ? (
    <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
    </div>
  ) : null}
  {isError ? (
    <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
      Não foi possível carregar os pacientes. ...
    </article>
  ) : null}
```

Swap copy: title `Equipe`, description from UI-SPEC, error `Não foi possível carregar a equipe. Tente de novo em instantes.`

**Analog (DataTable API):** `src/components/ui/DataTable.tsx` lines 19–26 — `columns`, `data`, `rowKey`, `emptyTitle`, `emptyDescription`. Do **not** copy `EmployeesPage.tsx` or `ProductsPage.tsx` (bakery leftovers). Badge tones: `info` = Pendente, `success` or `info` = Na equipe (`src/components/ui/Badge.tsx` lines 1–20).

**Analog (destructive confirm):** `src/components/patients/PatientGoalsPanel.tsx` lines 238–249

```typescript
<ConfirmDialog
  open={Boolean(pendingDelete)}
  title="Remover meta"
  description="Este objetivo sairá do prontuário do paciente."
  confirmLabel="Remover"
  tone="danger"
  isLoading={deleteGoal.isPending}
  onClose={() => setPendingDelete(null)}
  onConfirm={() => {
    if (!pendingDelete) return
    deleteGoal.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }}
/>
```

Recusar: `tone="danger"`, confirmLabel `Recusar e cancelar conta`, cancelLabel `Voltar`. Aceitar: immediate mutation, no dialog.

**Clipboard:** `await navigator.clipboard.writeText(rawCode)` then `toast('Código copiado')` (`src/stores/toast.store.ts` lines 31–33). Fail: `toast('Não foi possível copiar. Selecione o código e copie manualmente.', 'error')`. Copy button hit area ≥ 44×44. Display code as `XXXX XXXX`; clipboard gets raw 8 chars.

Guard: if `!canManageTeam(profile.accountType)` → `<Navigate to="/pacientes" replace />` (silent).

---

### `src/components/auth/ProtectedRoute.tsx` (middleware, request-response)

**Analog:** same file lines 40–75

```typescript
export function ProtectedRoute() {
  const { session, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!session) return <Navigate to="/" state={{ from: location }} replace />
  if (!isAuthenticated) return <AccountWithoutProfile />
  return <Outlet />
}

export function GuestRoute() {
  const { session, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (session) return <Navigate to={from} replace />
  return <Outlet />
}
```

**Required change:** `GuestRoute` must redirect to clinic **only when `isAuthenticated`**. Session + pending → `/aguardando`. Session + rejected/inactive → rejected card (do not bounce to `/painel`). `ProtectedRoute` clinic tree stays behind `isAuthenticated`. Pending hitting clinic routes → `/aguardando`. Keep `LoadingScreen` spinner (`h-8 w-8` forest border).

---

### `src/providers/AuthProvider.tsx` + `src/hooks/useAuth.ts` (provider / hook, request-response)

**Analog:** same files

**Lock:** `onAuthStateChange` stays synchronous (lines 27–34). Load profile **and** membership in the `userId` effect (lines 44–63), same `cancelled` flag.

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
  if (!mounted) return
  setSession(newSession)
  setSessionLoaded(true)
})
```

**`isAuthenticated` today** (lines 71–80): `!!session && !!profile`. Change to: session + profile + `is_active` + **not** (fisio + membership pending). Do not overload `is_active` for pending.

Extend `AuthContextValue` in `useAuth.ts` with `membership` (or `accountType` + `membershipStatus`). Keep `useAuth` throw: `'useAuth deve ser usado dentro de AuthProvider'` (lines 16–21).

---

### `src/config/navigation.ts` + `src/routes/index.tsx` + `src/components/layout/AppShell.tsx`

**Nav analog** (`navigation.ts` lines 3–21): `as const` list of `{ label, path, icon }`. Add `{ label: 'Equipe', path: '/equipe', icon: UserPlus }`. Do **not** put Equipe on `mobileNavItems` (stays 4 items). Do **not** reuse `Users` (Pacientes).

Export a filter helper here or in `accountAccess.ts`:

```typescript
export function clinicNavigationItems(accountType: AccountType | undefined): NavigationItem[] {
  return navigationItems.filter((item) => item.path !== '/equipe' || accountType === 'empresa')
}
```

**Routes analog** (`routes/index.tsx` lines 14–38): Guest routes `/` + `/cadastro`. Protected + `AppShell` for clinic. Add `/equipe` inside AppShell. Add `/aguardando` **outside** AppShell (sibling of Guest/Protected, or a third gate). Autônomo/fisio hitting `/equipe` redirects in the page, not only via missing nav.

**AppShell analog** (lines 8–14, 64–85, 93–96): replace bakery `roleLabels` with `accountTypeLabels`. Drawer already maps `navigationItems` — switch that map to the filtered list. Bottom bar stays `mobileNavItems`.

---

### `src/services/patients.service.ts` + `src/types/patient.ts` (service / model, CRUD)

**Analog:** same files

**Stamp owner on insert** — `createPatient` lines 460–480 currently omits `created_by`. Belt-and-suspenders with SQL trigger: add `created_by` from `supabase.auth.getUser()` (copy `createPatientAlert` lines 520–525). Add `created_by` to `LIST_COLUMNS` / `DETAIL_COLUMNS` / `ListPatientRow` / `PatientListItem` / `Patient` as `createdBy: string | null` and optional `createdByName` for empresa list line `Ficha de {nome}`.

`throwIfError` stays. Mapper stays private in the service.

---

### `src/pages/PatientsPage.tsx` + `src/pages/PatientPage.tsx` + patient panels (component, CRUD)

**List creator line:** `PatientsPage.tsx` lines 107–111 already have a second `text-xs text-muted` line. When viewer is empresa and `createdBy !== session.user.id`, show `Ficha de {createdByName}`. Autônomo/fisio: keep current subtitle (status · program).

**Read-only banner (UI-SPEC):** `rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm text-forest` above tabs on `PatientPage`. Copy: `Somente consulta — você vê a ficha, mas não pode alterar.`

**Hide writes, do not disable:** `PatientPage.tsx` lines 155–162 (`Pencil` on Entenda o caso) and `PatientAlertsPanel.tsx` lines 121–129 (`Adicionar`) — wrap with `canWritePatient`. Same for Goals / Evoluções / Avaliação / Cadastro create-edit-delete. Novo paciente on list stays visible (empresa may create **own** rows).

---

### `src/services/sessions.service.ts` (`listActiveTherapists`)

**Analog:** lines 135–147

```typescript
export async function listActiveTherapists(): Promise<TherapistOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
  throwIfError(error)
  return ((data ?? []) as Array<{ id: string; full_name: string }>).map((row) => ({
    id: row.id,
    fullName: row.full_name,
  }))
}
```

After profiles RLS = self OR active teammate, this query becomes correct without a client-side clinic filter. Do not keep selecting every active profile across tenants. Hook `useActiveTherapists` (`queryKey: ['therapists']`) stays.

---

### SQL scripts (migration, transform)

**Analog (delivery + idempotent DDL):** `supabase/patients-req14-goals.sql` lines 1–60

```sql
-- REQ-14 — Metas do tratamento
-- Cole no SQL Editor do Supabase.

create table if not exists public.patient_goals ( ... );
alter table public.patient_goals add column if not exists status text;
alter table public.patient_goals enable row level security;
drop policy if exists patient_goals_authenticated_all on public.patient_goals;
create policy patient_goals_authenticated_all
  on public.patient_goals for all to authenticated
  using (true) with check (true);
```

**Copy:** header comment, `if not exists`, `drop policy if exists`, `create or replace function`, enable RLS. Dual-write: committed `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` + gitignored `supabase/03-account-types-team.sql`.

**Do not copy** `using (true)` / `*_authenticated_all`. First executable comment: inspect live `handle_new_user` before replace (`CREATE OR REPLACE`, do not add a second `on_auth_user_created`).

**No in-repo analog** for `private` SECURITY DEFINER helpers or anon lookup RPC — use RESEARCH.md Pattern 2–3 (`create schema if not exists private`, `set search_path = ''`, `revoke execute from public`, wrap `(select private.can_read_patient(id))`).

---

## Shared Patterns

### Layering
**Source:** `.planning/codebase/CONVENTIONS.md` lines 159–166
**Apply to:** every new clinic feature

1. Zod in `src/schemas/`
2. Domain types in `src/types/<domain>.ts` (camelCase)
3. Service talks only to `supabase`
4. Hook: query keys + `onError` toast + `invalidateQueries`
5. Page/component: `useForm` + `zodResolver`
6. Route + `ProtectedRoute` / `GuestRoute`
7. Nav only for primary chrome

Named exports only. Import via `@/`. No new barrels. Pages must not import `@/lib/supabase/client`.

### Authentication callback
**Source:** `src/providers/AuthProvider.tsx` lines 27–34
**Apply to:** AuthProvider only — do not `await` inside `onAuthStateChange`

### Auth form errors
**Source:** `src/pages/auth/RegisterPage.tsx` lines 63–69, `LoginPage.tsx` lines 58–66
**Apply to:** register, login, join-code RPC failure

```typescript
<div role="alert" className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
  {serverError}
</div>
```

Do not toast login/register failures.

### Clinic query / mutation errors
**Source:** `src/hooks/usePatients.ts` lines 39–41, 78–87
**Apply to:** `useTeam` and any new clinic hooks

```typescript
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

Success toasts: short Portuguese sentences. `toast()` from `@/stores/toast.store`.

### Service errors
**Source:** `src/services/patients.service.ts` lines 115–117
**Apply to:** `team.service.ts`, patient/session writes

```typescript
function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}
```

Auth services use `mapAuthError` + `throw new Error(...)`. Never return `{ error }` tuples.

### Validation
**Source:** `src/schemas/auth.schema.ts` + `src/schemas/patient.schema.ts` `superRefine`
**Apply to:** register schema (accountType + joinCode)

Zod 3 only. Portuguese messages. `z.infer` → `*FormData`.

### Clipboard / toast
**Source:** `src/stores/toast.store.ts` lines 31–33
**Apply to:** TeamPage copy button

```typescript
export function toast(message: string, tone: ToastTone = 'info') {
  useToastStore.getState().push(message, tone)
}
```

No clipboard npm package.

### Tailwind class joining
**Source:** `src/components/ui/Select.tsx` lines 22–28, CONVENTIONS
**Apply to:** all new UI — `.join(' ')`, no `clsx`.

Tokens: `forest`, `accent`, `accent-soft`, `canvas`, `surface`, `ink`, `muted`, `line`, `error`, `success`.

### RLS is the authority
**Source:** CONVENTIONS + RESEARCH
**Apply to:** patients, sessions, evaluations, goals, alerts, org, memberships

Client `canWritePatient` / nav filter is UX only. Drop `*_authenticated_all` / `using (true)` on every `patient_*` table the ficha reads.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| SQL `private.*` helpers + `lookup_organization_by_code` / `decide_membership` | migration | request-response | No `private` schema, no anon RPC, no SECURITY DEFINER membership helpers in repo. Use RESEARCH.md Patterns 2–3 and official Supabase RLS excerpts. |
| `src/lib/accountAccess.ts` predicates | utility | transform | Closest file `src/lib/permissions.ts` is a **forbidden** bakery analog. Copy only the *shape* of small named predicate functions + `accountTypeLabels` from `patient.ts` / AppShell. |

## Anti-Patterns (do not copy)

| File | Why |
|------|-----|
| `src/pages/EmployeesPage.tsx` | Bakery employee CRUD; writes `profiles.role` confectionery enums |
| `src/lib/permissions.ts` | Bakery roles (`administrador`, `gerente`) — not account types |
| `src/services/modules.service.ts` `admin_update_profile` | IDOR-shaped profile update; RESEARCH forbids owner updating another profile from the client |
| `src/hooks/queries.ts` | Bakery cache; new keys belong in `useTeam.ts` / `usePatients.ts` |
| `supabase/patients-req14-goals.sql` / `patients-req05-evaluations.sql` policies | `using (true)` is the leak this phase closes |

## Metadata

**Analog search scope:** `src/types/`, `src/schemas/`, `src/services/`, `src/hooks/`, `src/pages/`, `src/pages/auth/`, `src/components/auth/`, `src/components/layout/`, `src/components/patients/`, `src/components/ui/`, `src/providers/`, `src/config/`, `src/routes/`, `src/lib/`, `src/stores/`, `supabase/*.sql`, `.planning/codebase/CONVENTIONS.md`
**Files scanned:** 82 TS/TSX under `src/` + 2 SQL scripts + CONVENTIONS
**Pattern extraction date:** 2026-09-08
