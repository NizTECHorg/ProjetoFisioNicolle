# Phase 5: Financeiro do autônomo - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 15
**Analogs found:** 14 / 15 (totals RPC + `parseBrlInput` have no in-repo twin; planner uses RESEARCH.md)

Honor CONTEXT over ROADMAP: variable catalog + XOR avulso, **not** two location fees. Money is **not** columns on `patient_sessions`. Dedicated `autonomo_prices` + `autonomo_session_charges`. **Do not** analog `src/pages/FinancePage.tsx`, `canManageFinance`, `src/lib/permissions.ts`, or `src/hooks/queries.ts`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` | migration | CRUD + transform (snapshot trigger, SUM RPC) | `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` + `03-02-PLAN.md` apply path | exact |
| `supabase/05-autonomo-finance.sql` (gitignored paste copy) | migration | file-I/O (Editor paste) | `03-02-PLAN.md` Task 3 + `supabase/03-account-types-team.sql` | exact |
| `src/lib/accountAccess.ts` | utility | request-response (UX predicate) | same file, `canManageTeam` | exact |
| `src/config/navigation.ts` | config | request-response | same file, Equipe drawer filter | exact |
| `src/routes/index.tsx` | route | request-response | same file, `/equipe` → `TeamPage` | exact |
| `src/pages/AutonomoFinancePage.tsx` | component | CRUD | `src/pages/TeamPage.tsx` (gate/chrome) + `src/pages/PatientsPage.tsx` (header CTA + Modal) | exact |
| `src/hooks/useFinance.ts` | hook | CRUD | `src/hooks/useTeam.ts` + `src/hooks/usePatients.ts` | exact |
| `src/services/finance.service.ts` | service | CRUD | `src/services/team.service.ts` + `src/services/sessions.service.ts` | exact |
| `src/schemas/finance.schema.ts` | config | transform | `src/schemas/patient.schema.ts` + `src/schemas/evaluation.schema.ts` | role-match |
| `src/types/finance.ts` | model | transform | `src/types/account.ts` + `src/types/evaluation.ts` | exact |
| `src/schemas/patient.schema.ts` | config | transform | same file, `sessionFormSchema.superRefine` | exact |
| `src/components/patients/PatientSessionEditorForm.tsx` | component | request-response | same file + hide pattern `PatientGoalsPanel.tsx` | exact |
| `src/hooks/usePatients.ts` | hook | CRUD | same file, `invalidatePatient` | exact |
| `src/types/patient.ts` | model | transform | same file, `UpsertPatientSessionInput` | exact |
| `src/services/sessions.service.ts` | service | CRUD | same file, explicit `SESSION_LIST_COLUMNS` | exact |

**Do not create/modify:** `src/pages/FinancePage.tsx`, `src/lib/permissions.ts`, `src/hooks/queries.ts`, `src/types/database.types.ts`, `src/pages/CalendarPage.tsx` (no third money UI). `AppShell` already consumes `clinicNavigationItems` — filter in `navigation.ts` only.

---

## Pattern Assignments

### `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` (migration, CRUD + transform)

**Analog:** `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (structure) + `.planning/phases/03-tipos-de-conta-e-equipe/03-02-PLAN.md` (apply path)

**Header / apply comments** (SQL lines 1–6):
```sql
-- Inspecione handle_new_user no Dashboard antes de rodar.
-- REQ-15 — Tipos de conta e equipe (org + membership + RLS).
-- Idempotente. Cole no SQL Editor. Nao use supabase db push.
```

Copy this header shape: REQ-17, D-01–D-10, “nao use supabase db push”, “nao alterar patient_sessions com colunas de dinheiro”.

**Create table + grants without client DELETE** (SQL lines 40–92 — analog for `autonomo_prices` / `autonomo_session_charges`):
```sql
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id),
  name text not null,
  join_code text not null unique
    default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

revoke all on table public.organizations from anon, public;
grant select on table public.organizations to authenticated;
```

Phase 5 adaptation: `grant select, insert, update` only. **No** `grant delete`. RESEARCH: prefer **no DELETE policy** so archive cannot be bypassed via PostgREST.

**BEFORE trigger that overwrites client fields** (SQL lines 105–122 — analog for charge snapshot):
```sql
create or replace function public.set_patient_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is null then
    new.created_by := (select auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists patients_set_created_by on public.patients;
create trigger patients_set_created_by
  before insert on public.patients
  for each row
  execute function public.set_patient_created_by();
```

Copy: `set search_path = ''`, `drop trigger if exists` then `create trigger`, BEFORE row trigger that **overwrites** untrusted client values. Charge trigger additionally copies `name` + `amount_brl` from `autonomo_prices` when `price_id` is set (RESEARCH Pattern 2). Phase 3 has **no** FORCE RLS; RESEARCH still wants `enable` + `force row level security` on the new finance tables.

**Owner-only policy using `(select auth.uid())` subquery** (SQL lines 449–454):
```sql
drop policy if exists organizations_select_owner on public.organizations;
create policy organizations_select_owner
  on public.organizations
  for select
  to authenticated
  using (owner_id = (select auth.uid()));
```

**Why money cannot live on sessions** (SQL lines 611–615 — empresa already SELECTs session rows):
```sql
create policy patient_sessions_select
  on public.patient_sessions
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));
```

Charges `with check` must also call `private.can_write_patient` (SQL lines 183–204) so empresa cannot insert a charge on a colleague session:

```sql
create or replace function private.can_write_patient(p_patient_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.patients p
    where p.id = p_patient_id
      and p.created_by = (select auth.uid())
  )
  -- ... pending/rejected membership guard ...
$$;
```

**SQL Editor checklist footer** (SQL lines 736–744):
```sql
-- Checagens opcionais no SQL Editor (apos Success):
-- 1. Table Editor: profiles.account_type; organizations; organization_memberships
-- 6. empresa consegue SELECT paciente de A (therapist/active)
```

End Phase 5 script with the RESEARCH allow/deny matrix (empresa SELECT finance tables → 0 rows; paid `agendada` increments month total). Optional `notify pgrst, 'reload schema';` (RESEARCH Pitfall 10). Phase 3 script does **not** currently notify PostgREST — add it in 05.

**Apply path analog** (`03-02-PLAN.md` frontmatter lines 15–19 + Task 3 lines 170–180):
```yaml
user_setup:
  - service: supabase
    why: Hosted SQL Editor is the only apply path (Supabase CLI is not installed; /supabase/ is gitignored)
    dashboard_config:
      - task: Dump live handle_new_user, then paste and run 03-account-types-team.sql
        location: Supabase Dashboard → SQL Editor
```

```text
Task 3: Apply SQL in Editor [BLOCKING]
1. Supabase Dashboard → SQL Editor → paste supabase/03-account-types-team.sql → Run.
Wait for the human to confirm the script ran.
```

Planner: committed copy under `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql`; gitignored paste twin `supabase/05-autonomo-finance.sql`; `checkpoint:human-action` before any live UAT. **Do not** `supabase db push`.

**RPC style:** Phase 3 public RPCs use `set search_path = ''`. RESEARCH totals function is `security invoker` (keep RLS). Do **not** copy `decide_membership` SECURITY DEFINER for totals.

---

### `src/lib/accountAccess.ts` (utility, request-response)

**Analog:** same file, `canManageTeam` (lines 1–21)

**Imports + JSDoc + predicate:**
```typescript
/**
 * Predicados de UX para tipo de conta e ficha (REQ-15).
 * Não são autorização: RLS (plano 03-02) é a autoridade (ASVS 4.1.1 / T-03-01).
 * Não importar permissions.ts da confeitaria.
 */

import {
  accountTypeLabels,
  type AccountType,
  type MembershipStatus,
} from '@/types/account'

/** Equipe só para conta Empresa. Autônomo e fisioterapeuta não gerenciam time. */
export function canManageTeam(accountType: AccountType | null | undefined): boolean {
  return accountType === 'empresa'
}
```

Add next to `canManageTeam`:

```typescript
/** Financeiro só para conta Autônomo. Empresa e fisio não veem (D-01). UX only. */
export function canSeeFinance(accountType: AccountType | null | undefined): boolean {
  return accountType === 'autonomo'
}
```

Named export, `can*` boolean, `AccountType | null | undefined`, one-line JSDoc. Never import `src/lib/permissions.ts`.

---

### `src/config/navigation.ts` (config, request-response)

**Analog:** same file (lines 1–27)

**Imports + items + filter:**
```typescript
import { CalendarDays, Home, LayoutDashboard, SquareKanban, UserPlus, Users, type LucideIcon } from 'lucide-react'
import type { AccountType } from '@/types/account'

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/painel', icon: LayoutDashboard },
  { label: 'Pacientes', path: '/pacientes', icon: Users },
  { label: 'Agenda', path: '/agenda', icon: CalendarDays },
  { label: 'Quadro', path: '/quadro', icon: SquareKanban },
  { label: 'Equipe', path: '/equipe', icon: UserPlus },
]

export function clinicNavigationItems(accountType: AccountType | null | undefined): NavigationItem[] {
  return navigationItems.filter((item) => item.path !== '/equipe' || accountType === 'empresa')
}

export const mobileNavItems: NavigationItem[] = [
  { label: 'Início', path: '/painel', icon: Home },
  { label: 'Pacientes', path: '/pacientes', icon: Users },
  { label: 'Agenda', path: '/agenda', icon: CalendarDays },
  { label: 'Quadro', path: '/quadro', icon: SquareKanban },
]
```

Add `{ label: 'Financeiro', path: '/financeiro', icon: Wallet }` to `navigationItems` only. Extend the filter:

```typescript
export function clinicNavigationItems(accountType: AccountType | null | undefined): NavigationItem[] {
  return navigationItems.filter((item) => {
    if (item.path === '/equipe') return accountType === 'empresa'
    if (item.path === '/financeiro') return accountType === 'autonomo'
    return true
  })
}
```

`mobileNavItems` stays length **4**. `AppShell` already maps `clinicNavigationItems(profile?.accountType)` (lines 20, 60–77) — do not restyle the drawer.

---

### `src/routes/index.tsx` (route, request-response)

**Analog:** same file (lines 1–44)

**Imports + AppShell child route:**
```typescript
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { TeamPage } from '@/pages/TeamPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/equipe" element={<TeamPage />} />
          <Route path="*" element={<Navigate to="/pacientes" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

Register `/financeiro` beside `/equipe` inside `ProtectedRoute` + `AppShell`. Import `AutonomoFinancePage`. Do **not** import `FinancePage`. Catch-all `*` already sends unknown paths to `/pacientes`.

---

### `src/pages/AutonomoFinancePage.tsx` (component, CRUD)

**Primary analog:** `src/pages/TeamPage.tsx`  
**Secondary analog:** `src/pages/PatientsPage.tsx` (PageHeader `action` + create Modal)

**Do not copy:** `src/pages/FinancePage.tsx` (bakery caramel, `canManageFinance`, expenses).

**Imports + silent Navigate gate** (`TeamPage.tsx` lines 1–33):
```typescript
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Copy, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { useDecideMembership, useTeam } from '@/hooks/useTeam'
import { canManageTeam } from '@/lib/accountAccess'
import { toast } from '@/stores/toast.store'

export function TeamPage() {
  const { profile } = useAuth()
  const { data, isLoading, isError } = useTeam()

  if (!canManageTeam(profile?.accountType)) {
    return <Navigate to="/pacientes" replace />
  }
```

Copy: `export function AutonomoFinancePage()`, `useAuth` + `canSeeFinance(profile?.accountType)`, **no toast** on redirect.

**Page chrome + loading + error + sections** (`TeamPage.tsx` lines 59–80):
```tsx
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Equipe"
        description="Compartilhe o código e aceite os pedidos dos fisioterapeutas."
      />

      {isLoading ? (
        <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar a equipe. Tente de novo em instantes.
        </article>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-6">
```

UI-SPEC copy: title **Financeiro**, description **Catálogo de preços, sessões realizadas e o que já foi pago.** Error article: **Não foi possível carregar o financeiro. Tente de novo em instantes.**

**PageHeader action + Plus** (`PatientsPage.tsx` lines 71–80):
```tsx
      <PageHeader
        className="dash-in"
        title="Pacientes"
        description="Cadastros da clínica. Toque no card ou na linha para abrir a ficha."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Novo paciente
          </Button>
        }
```

Action slot = **Novo preço** (`Button` primary, `<Plus size={16} />`). Visible even when catalog is empty. `PageHeader` already has `action?: React.ReactNode` (`PageHeader.tsx` lines 1–18).

**Create Modal portal** (`PatientsPage.tsx` lines 191–221 + `Modal.tsx` lines 30–67):
```tsx
      <Modal
        open={open}
        title="Novo paciente"
        description="Cadastro rápido. Só o nome é obrigatório — o restante pode ser completado na ficha."
        onClose={() => setOpen(false)}
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Input
            label="Nome completo"
            autoFocus
            error={form.formState.errors.fullName?.message}
            {...form.register('fullName')}
          />
          <Button type="submit" fullWidth isLoading={create.isPending}>
            Criar ficha
          </Button>
        </form>
      </Modal>
```

`Modal` already `createPortal(..., document.body)` at `z-[100]`. Close X `aria-label="Fechar"`. Amount field: `Input` `type="text"` `inputMode="decimal"` `autoComplete="off"` + `hint` (`Input.tsx` lines 32–35). Never `type="number"`.

**Empty catalog well** (`TeamPage.tsx` lines 104–113):
```tsx
              <article className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Inbox size={22} />
                </div>
                <p className="mt-4 text-sm font-medium text-ink">Nenhum pedido pendente</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  Compartilhe o código da empresa. O fisioterapeuta informa esse código no cadastro.
                </p>
              </article>
```

UI-SPEC: icon `Wallet` 22px; heading **Nenhum preço no catálogo**; body 14px (`text-sm`) next-step sentence (do not copy Equipe `text-xs` for this well).

**DataTable empty (realizadas)** (`TeamPage.tsx` lines 197–219):
```tsx
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Nome',
                  render: (row) => <span className="text-sm font-semibold text-ink">{row.fullName || '—'}</span>,
                },
              ]}
              data={active}
              rowKey={(row) => row.id}
              emptyTitle="Nenhum fisioterapeuta na equipe"
              emptyDescription="Quando você aceitar um pedido, o nome aparece aqui."
            />
```

`DataTable` empty already uses `text-sm` heading + `text-xs` description (`DataTable.tsx` lines 35–44). Do not fork. Empty titles: **Nenhuma sessão realizada** / next-step body from UI-SPEC. No fake rows.

**Immediate row action (Aceitar analog for Marcar como pago)** (`TeamPage.tsx` lines 55–57, 125–132):
```typescript
  function acceptMember(member: TeamMember) {
    decide.mutate({ membershipId: member.id, accept: true, fullName: member.fullName })
  }
```

No dialog. Paid rows: `Badge` only — hide the button (`PatientGoalsPanel` hide pattern). Badge tones: `success` / `muted` (`Badge.tsx` lines 1–7).

**Archive ConfirmDialog** (`TeamPage.tsx` lines 224–244):
```tsx
      <ConfirmDialog
        open={Boolean(pendingReject)}
        title="Recusar pedido"
        description={...}
        confirmLabel="Recusar e cancelar conta"
        cancelLabel="Voltar sem recusar"
        tone="danger"
        isLoading={decide.isPending && decide.variables?.accept === false}
        onClose={() => setPendingReject(null)}
        onConfirm={() => {
          if (!pendingReject) return
          decide.mutate(
            { membershipId: pendingReject.id, accept: false, fullName: pendingReject.fullName },
            { onSuccess: () => setPendingReject(null) },
          )
        }}
      />
```

UI-SPEC: title **Arquivar preço?**, confirm **Arquivar preço**, cancel **Voltar sem arquivar**, `tone="danger"`. Archive is UPDATE `archived_at`, never `.delete()`.

**Mobile stacked cards** (`TeamPage.tsx` lines 116–145): clone for realizadas on small screens (`rounded-2xl border border-line bg-surface p-4`).

**Currency display analog (clinic, not bakery page):** `src/pages/OrdersPage.tsx` / `ProductsPage.tsx` — `formatCurrency(Number(row.price))` from `@/lib/security`. Totals cards: Display `text-3xl font-semibold text-ink`, zero is `R$ 0,00`. Do **not** copy bakery `text-5xl` dashboard metrics or `accent-caramel`.

---

### `src/hooks/useFinance.ts` (hook, CRUD)

**Analogs:** `src/hooks/useTeam.ts` (new domain file) + `src/hooks/usePatients.ts` (CRUD mutations + family invalidate)

**Imports + onError + query keys** (`useTeam.ts` lines 1–22):
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  decideMembership,
  fetchMembership,
  fetchOwnerOrganization,
  listTeamMembers,
} from '@/services/team.service'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const [members, organization] = await Promise.all([listTeamMembers(), fetchOwnerOrganization()])
      return { members, organization }
    },
    staleTime: 60_000,
  })
}
```

RESEARCH keys: `['finance']`, `['finance', 'prices']`, `['finance', 'totals']`, `['finance', 'sessions']`. Family prefix `['finance']` for invalidation. **Do not** add to `src/hooks/queries.ts`.

**Mutation toast + invalidate** (`useTeam.ts` lines 34–55 + `usePatients.ts` lines 78–87):
```typescript
export function useDecideMembership() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ membershipId, accept }: { membershipId: string; accept: boolean; fullName: string }) =>
      decideMembership(membershipId, accept),
    onSuccess: (_data, variables) => {
      toast(`${nome} entrou na equipe.`, 'success')
      void qc.invalidateQueries({ queryKey: ['team'] })
    },
    onError,
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

UI-SPEC toasts: **Preço cadastrado**, **Preço atualizado. Sessões já gravadas não mudam.**, **Preço arquivado**, **Valor da sessão salvo**, **Sessão marcada como paga**. Save fail: **Não foi possível salvar. Verifique os campos e tente de novo.** RLS: `mapDbError` message already thrown by the service.

Named exports: `useFinancePrices`, `useFinanceTotals`, `useFinanceRealizadas`, `useCreatePrice`, `useUpdatePrice`, `useArchivePrice`, `useUpsertCharge`, `useMarkChargePaid` (or equivalent `use` + verb + noun). Return the React Query object; do not unwrap `.data`.

---

### `src/services/finance.service.ts` (service, CRUD)

**Analogs:** `src/services/team.service.ts` (mapDbError, requireUserId, explicit columns, map snake→camel) + `src/services/sessions.service.ts` (`emptyToNull`, no `select *`)

**Imports + columns + Row + throwIfError + requireUserId** (`team.service.ts` lines 1–47):
```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError } from '@/lib/security'
import type { TeamMember } from '@/types/account'

const MEMBERSHIP_COLUMNS = 'id, organization_id, profile_id, role, status'

interface MembershipRow {
  id: string
  organization_id: string
  profile_id: string
  role: MembershipRole
  status: MembershipStatus
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}
```

CONVENTIONS: **new clinic code prefers `mapDbError`** on every throw (team already uses it on RPC line 146). Copy:

```typescript
function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}
```

**Explicit select + map** (`team.service.ts` lines 106–117, `sessions.service.ts` lines 34–54, 102–116):
```typescript
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('owner_id', userId)
    .maybeSingle()

function mapSessionRecord(row: SessionRow): PatientSessionRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    scheduledAt: row.scheduled_at,
    place: row.place ?? '—',
    status: row.status,
  }
}
```

Map `amount_brl` with `Number(...)` before `formatCurrency`. Active catalog: `.is('archived_at', null)`. Archive: `.update({ archived_at: new Date().toISOString() })` — **never** `.delete()`. Totals: `supabase.rpc('autonomo_finance_totals')` then `Number` each field. Realizadas: `patient_sessions` clinical columns + **separate** charge select (do not embed charges in `listPatientSessions`).

**sanitizeText on writes** (`auth.service.ts` line 101 + `security/index.ts` lines 5–10):
```typescript
const fullName = sanitizeText(parsed.fullName, 100)
```

Apply to price `name` (and any client `price_name` for avulso — trigger should still force `'Avulso'`).

**emptyToNull** (`sessions.service.ts` lines 60–63): keep optional ad-hoc empty as “no charge row”, not a zero row.

---

### `src/schemas/finance.schema.ts` (config, transform)

**Analogs:** `src/schemas/evaluation.schema.ts` (standalone form + empty helper) + `src/schemas/patient.schema.ts` (`z.object`, Portuguese messages, `FormData` infer)

**Standalone schema + empty helper** (`evaluation.schema.ts` lines 1–48):
```typescript
import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)

export const evaluationFormSchema = z.object({
  performedOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data da avaliação'),
  mainComplaint: z
    .string()
    .trim()
    .min(2, 'Informe a queixa principal')
    .max(4000, 'Máximo de 4000 caracteres'),
})

export type EvaluationFormData = z.infer<typeof evaluationFormSchema>

export const emptyEvaluationForm = (): EvaluationFormData => ({
  performedOn: new Date().toISOString().slice(0, 10),
  therapistId: '',
  mainComplaint: '',
  // ...
})
```

Catalog: `name` min 2 / max ~80, `amount` string (not `z.coerce.number`). UI-SPEC: **Informe o nome do preço**, **Informe um valor maior que zero**. `export type PriceFormData = z.infer<typeof priceFormSchema>`. Completar-valor form can reuse XOR fields from session schema or a shared `sessionChargeFieldsSchema`.

**`parseBrlInput`:** no in-repo analog. Use RESEARCH.md helper as-is in this file (accept `"180"`, `"180,50"`, `"180.50"`; reject `<= 0`). SuperRefine the amount string through it. Do not add `decimal.js`.

---

### `src/types/finance.ts` (model, transform)

**Analogs:** `src/types/account.ts` (new clinic DTO file, JSDoc, camelCase) + `src/types/evaluation.ts` (`Upsert*Input`)

**File header + unions + interfaces** (`account.ts` lines 1–45):
```typescript
/**
 * Contratos de conta da clínica (REQ-15).
 * Única casa para AccountType / membership — não estender EmployeeRole
 * em database.types.ts nem importar permissions.ts da confeitaria.
 */

export type AccountType = 'autonomo' | 'empresa' | 'fisioterapeuta'

export interface TeamMember {
  id: string
  profileId: string
  fullName: string
  email: string
  status: MembershipStatus
  role: MembershipRole
}
```

**Input object** (`evaluation.ts` lines 24–39):
```typescript
export interface UpsertPatientEvaluationInput {
  performedOn: string
  mainComplaint: string
  therapistId?: string | null
}
```

Export `AutonomoPrice`, `SessionCharge`, `FinanceTotals`, `CreatePriceInput`, `UpdatePriceInput`, `UpsertSessionChargeInput`. camelCase app fields. Do **not** add these to `database.types.ts`. Row snake_case stays private in the service.

---

### `src/schemas/patient.schema.ts` (config, transform)

**Analog:** same file, `sessionFormSchema` (lines 161–193)

```typescript
export const sessionFormSchema = z
  .object({
    mode: z.enum(['agendar', 'realizada']),
    scheduledAt: z.string().trim().min(1, 'Informe data e horário'),
    sessionType: optionalText(80),
    place: optionalText(80),
    therapistId: z.string().uuid('Selecione o profissional'),
    patientState: optionalText(4000),
    // ...
  })
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

export type SessionFormData = z.infer<typeof sessionFormSchema>
```

Keep `place` optional text (D-06). Extend the object with optional `priceId`, `adHocAmount`, `isPaid` (default false in form defaults, not required in Zod). Add a **second** `superRefine` (or extend this one): catalog XOR avulso; Pago without amount → **Informe um valor para marcar como pago.** RESEARCH XOR copy: **Escolha um preço do catálogo ou um valor avulso, não os dois.** Neither filled is valid.

---

### `src/components/patients/PatientSessionEditorForm.tsx` (component, request-response)

**Analogs:** same file (shared editor) + hide-don't-disable `PatientGoalsPanel.tsx` lines 123–131

**Imports + RHF + Local field** (form lines 1–15, 71–86, 186–209):
```typescript
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { sessionFormSchema, type SessionFormData } from '@/schemas/patient.schema'

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      mode: 'agendar',
      place: '',
      // add: priceId: '', adHocAmount: '', isPaid: false
    },
  })
```

Local stays:

```tsx
        <Input
          label="Local"
          error={form.formState.errors.place?.message}
          {...form.register('place')}
        />
```

Mount **Valor da consulta** after this grid, **before** the realizada textareas / Agendar helper (lines 211–254).

**Hide entire block** (`PatientGoalsPanel.tsx` lines 123–131):
```tsx
          {canWrite ? (
            <button type="button" aria-label="Adicionar meta" onClick={openCreate}>
              <Plus size={14} />
              Nova
            </button>
          ) : null}
```

Use `canSeeFinance(profile.accountType)` from `useAuth`. Unmount the block for empresa/fisio — do not render a disabled Pago checkbox.

**Select options** (form lines 63–68 + `Select.tsx`):
```typescript
  const therapistOptions = useMemo(
    () => [
      { value: '', label: 'Selecione…' },
      ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
    ],
    [therapists],
  )
```

Catalog options: `{ value: '', label: 'Sem valor' }` + `{nome} — {formatCurrency(amount)}`. If active catalog is empty: **unmount** Select (hide-don't-disable); keep avulso + hint.

**Class join, not clsx** (form lines 167–170):
```tsx
          className={[
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            mode === 'agendar' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
          ].join(' ')}
```

Pago: native checkbox `className="accent-forest"` inside `label` `flex items-center gap-2 text-sm text-ink` `min-h-11`. Do not copy bakery `accent-caramel`.

Dashboard shortcut already mounts this form — finance fields appear automatically. Do not add a parallel widget. Do not change `CalendarPage` create.

Charge persist: after clinical `createPatientSession` / `updatePatientSession`, call `finance.service` upsert when autonomo and (catalog or avulso). Prefer the session hooks so both ficha Modal and dashboard shortcut stay in one path.

---

### `src/hooks/usePatients.ts` (hook, CRUD)

**Analog:** same file, `invalidatePatient` (lines 43–50) + session mutations (193–234)

```typescript
function invalidatePatient(qc: ReturnType<typeof useQueryClient>, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'dashboard'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'sessions'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'evaluations'] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
}
```

Add `void qc.invalidateQueries({ queryKey: ['finance'] })` (family prefix). Also invalidate finance from `useCreatePatientSession` / `useUpdatePatientSession` / `useDeletePatientSession`. Existing success toast **Sessão salva** / **Sessão atualizada** stays.

---

### `src/types/patient.ts` (model, transform)

**Analog:** same file, `UpsertPatientSessionInput` (lines 82–97)

```typescript
export interface UpsertPatientSessionInput {
  mode: SessionFormMode
  scheduledAt: string
  sessionType?: string
  place?: string
  therapistId: string
  therapistName: string
  patientState?: string
  // clinical fields only today
}
```

Optional finance fields may live here **or** as a parallel `UpsertSessionChargeInput` in `types/finance.ts`. Prefer **finance types file** so `sessions.service.ts` never learns money columns. `PatientSessionRecord` stays clinical; finance list DTO lives in `types/finance.ts`.

---

### `src/services/sessions.service.ts` (service, CRUD)

**Analog:** same file (lines 34–54, 150–160, 169–182)

Keep `SESSION_LIST_COLUMNS` **without** charges embed. `calendar.service.ts` lines 20–26 already lists clinical columns only — do not add money there either.

```typescript
const SESSION_LIST_COLUMNS = `
  id,
  patient_id,
  scheduled_at,
  session_type,
  place,
  status,
  therapist_id,
  therapist_name,
  patient_session_evolutions ( ... )
`

  const { data, error } = await supabase
    .from('patient_sessions')
    .insert({
      patient_id: patientId,
      scheduled_at: input.scheduledAt,
      session_type: emptyToNull(input.sessionType) ?? 'Sessão',
      place: emptyToNull(input.place),
      status,
      therapist_id: input.therapistId,
      therapist_name: input.therapistName,
      created_by: author.userId,
    })
```

Return `{ id }` from create if the hook needs `sessionId` for the charge upsert (create currently returns `Promise<void>` after using `.select('id')` internally — expose the id). Do **not** `alter` this table in SQL.

---

## Shared Patterns

### Named exports, quotes, no semicolons
**Source:** `.planning/codebase/CONVENTIONS.md` lines 43–47, 158–167  
**Apply to:** all new TS/TSX

- Named exports only (`export function AutonomoFinancePage`). No `export default`. No barrels.
- Single quotes. No semicolons. 2-space indent. Trailing commas.
- `[...].join(' ')` not `clsx`.
- Import `@/` aliases. `import type` for types-only (`verbatimModuleSyntax`).
- Clinic money types camelCase; map snake_case in the service. Do not copy bakery `modules.schema.ts` snake_case forms.

### Authentication / UX gating
**Source:** `src/lib/accountAccess.ts` lines 1–21; `src/pages/TeamPage.tsx` lines 31–33  
**Apply to:** nav, route page, session finance block

```typescript
export function canManageTeam(accountType: AccountType | null | undefined): boolean {
  return accountType === 'empresa'
}

  if (!canManageTeam(profile?.accountType)) {
    return <Navigate to="/pacientes" replace />
  }
```

`canSeeFinance` is UX only. RLS is authority. Silent redirect, no toast.

### Hide, don't disable
**Source:** `.planning/codebase/ARCHITECTURE.md` lines 190–193, 216–218; `PatientGoalsPanel.tsx` line 123  
**Apply to:** finance fields, paid-row actions, empty catalog Select

```tsx
{canWrite ? ( <button ...>Nova</button> ) : null}
```

Do not show a disabled Pago / Novo preço / Marcar como pago that still looks tappable.

### Error handling
**Source:** `src/lib/security/index.ts` lines 184–211; `src/services/team.service.ts` line 146; `src/hooks/useTeam.ts` lines 10–12  
**Apply to:** finance.service + hooks + page error article

```typescript
export function mapDbError(error: { message?: string; code?: string }): string {
  if (code === '42501' || message.includes('operation_not_permitted')) {
    return 'Você não tem permissão para esta ação.'
  }
  // ...
}

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

Session expiry: `'Sessão expirada. Entre novamente.'` after `getUser()` with no user.

### Validation
**Source:** `src/schemas/patient.schema.ts` `superRefine`; RHF `zodResolver`  
**Apply to:** catalog Modal, session XOR, Completar valor

Portuguese Zod messages. Empty optional strings stay `''`; services `emptyToNull`.

### Currency and dates
**Source:** `src/lib/security/index.ts` lines 213–226  
**Apply to:** totals, catalog Valor column, session Select labels, realizadas list

```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
```

Always `formatCurrency(Number(total))`. Never invent `formatBRL`. Totals SUM in SQL, not JS.

### TanStack Query keys
**Source:** `useTeam.ts` `['team']`; `usePatients.ts` `['patients', id, 'sessions']`  
**Apply to:** `useFinance` + `invalidatePatient`

Tuples. Invalidate with family prefix `{ queryKey: ['finance'] }`. `staleTime: 60_000` (sessions list uses `30_000` if the realizadas list should feel live).

### Modal portal + ConfirmDialog archive
**Source:** `src/components/ui/Modal.tsx` lines 30–67; `ConfirmDialog.tsx` lines 16–41  
**Apply to:** Novo preço, Editar preço, Completar valor, Arquivar preço

Existing `Modal` portals to `document.body`. `ConfirmDialog` wraps `Modal`. Do not nest a second overlay inside AppShell overflow.

### Layers
**Source:** `.planning/codebase/ARCHITECTURE.md` lines 20–36, 169–174  
**Apply to:** all clinic finance code

Page → hook → service → Supabase. Pages do not import `supabase`. SQL Editor apply path only.

### Anti-analogs (forbidden)
| File / symbol | Why |
|---------------|-----|
| `src/pages/FinancePage.tsx` | Bakery expenses, caramel/dark, `canManageFinance(profile.role)` |
| `src/lib/permissions.ts` `canManageFinance` | Bakery `EmployeeRole`, not `accountType` |
| `src/hooks/queries.ts` `useFinanceSummary` / `useExpenses` | Bakery query file |
| Money columns on `patient_sessions` | `patient_sessions_select` uses `can_read_patient` — empresa reads those rows |
| Tying money to `place` | D-06 Local stays clinical |
| `mobileNavItems` Financeiro | Drawer-only, 4 bottom items |
| `supabase db push` | CLI not installed; `/supabase/` gitignored |

---

## No Analog Found

| File / piece | Role | Data Flow | Reason |
|--------------|------|-----------|--------|
| `parseBrlInput` in `finance.schema.ts` | utility | transform | No pt-BR money parser in repo. Use RESEARCH.md helper. |
| `public.autonomo_finance_totals()` | migration | batch/aggregate | No clinic SUM RPC. Copy RESEARCH SQL (`security invoker`, `America/Sao_Paulo`). Fallback `AT TIME ZONE` if 3-arg `date_trunc` fails. |
| Native Pago checkbox | component | request-response | No clinic `Checkbox` primitive. RESEARCH: labeled `<input type="checkbox" className="accent-forest" />`. |
| `FORCE ROW LEVEL SECURITY` | migration | request-response | Phase 3 SQL only `ENABLE`s RLS. RESEARCH still wants FORCE on finance tables. |
| `src/**/*.test.ts` | test | request-response | No Vitest. Wave 0 deferred; product plans must not wait on the harness. |

---

## Metadata

**Analog search scope:** `src/lib/`, `src/config/`, `src/routes/`, `src/pages/`, `src/hooks/`, `src/services/`, `src/schemas/`, `src/types/`, `src/components/ui/`, `src/components/patients/`, `src/components/layout/`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/`, `03-02-PLAN.md`, `.planning/codebase/{ARCHITECTURE,CONVENTIONS}.md`

**Files scanned:** 92 `src/**/*.{ts,tsx}` + Phase 3 SQL (745 lines) + 03-02-PLAN.md  
**Pattern extraction date:** 2026-09-14  
**Strong analogs used:** TeamPage / useTeam / team.service / accountAccess / navigation / routes / PatientSessionEditorForm / patient.schema / usePatients / sessions.service / Phase 3 SQL (stopped at these; bakery finance skipped on purpose)
