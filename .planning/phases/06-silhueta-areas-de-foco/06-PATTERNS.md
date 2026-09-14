# Phase 6: Silhueta de áreas de foco - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 9
**Analogs found:** 9 / 9 (hover 500ms chip has no in-repo twin — planner uses UI-SPEC + RESEARCH.md)

Honor CONTEXT over ROADMAP: replace `BodyFocus` + dead side list in the **existing** Resumo card. Persist in `patient_focus_areas` (ALTER `region_key`, no new table). Toggle = INSERT/DELETE. Hide write when `!canWrite`. **Do not** analog `src/lib/permissions.ts`, `src/types/database.types.ts`, Jotform/body-map npm, Radix Tooltip, `Modal`/`ConfirmDialog` for mark/unmark, or `supabase db push`.

UI-SPEC catalog (30 keys) wins over RESEARCH 38-key draft: do **not** reintroduce `front.hand_*`, `front.foot_*`, `back.hand_*`, `back.foot_*`, `back.head`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` | migration | CRUD (ALTER + unique index) | `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` (apply path) + `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (`ADD COLUMN IF NOT EXISTS`) | exact |
| `supabase/06-patient-focus-region-key.sql` (gitignored paste copy) | migration | file-I/O (Editor paste) | `supabase/05-autonomo-finance.sql` / `supabase/03-account-types-team.sql` | exact |
| `src/lib/focusRegions.ts` | utility | transform (catalog) | `src/lib/dashboardShortcut.ts` (lib module) + `src/types/patient.ts` `statusLabels` + `src/schemas/patient.schema.ts` `z.enum` | role-match |
| `src/types/patient.ts` | model | transform | same file, `PatientFocusArea` / `PatientGoal` | exact |
| `src/schemas/patient.schema.ts` | config | transform | same file, `patientStatusSchema` / `alertToneSchema` | exact |
| `src/services/patients.service.ts` | service | CRUD | same file, `createPatientGoal` / `deletePatientGoal` / `FocusRow` — **errors** from `src/services/finance.service.ts` `throwIfError` + `mapDbError` | exact |
| `src/hooks/usePatients.ts` | hook | CRUD | same file, `useCreatePatientGoal` / `useDeletePatientGoal` / `invalidatePatient` | exact |
| `src/components/patients/PatientFocusAreasPanel.tsx` | component | CRUD + pointer UX | `PatientGoalsPanel.tsx` (card wiring / hide `!canWrite` / `toggleDone`) + `PatientPage.tsx` `EvaChart` (inline SVG) | role-match |
| `src/pages/PatientPage.tsx` | component | request-response | same file, `ResumoDoPaciente` mounting `PatientGoalsPanel` | exact |

**Do not create/modify:** `src/types/database.types.ts`, `src/lib/permissions.ts`, `src/lib/accountAccess.ts` (reuse `canWritePatient` as-is), Phase 3 RLS policies (`patient_focus_areas_*`), new routes/tabs, `Modal`/`ConfirmDialog`/`Button` on this card.

**Card chrome ownership (planner must not double-wrap):** `PatientGoalsPanel` owns its outer `rounded-2xl border border-line p-4` + title. UI-SPEC keeps **Áreas de foco** title and that card wrapper **in `PatientPage`**. The new panel is the **card body** (SVGs + chip + empty copy), not a nested second card.

---

## Pattern Assignments

### `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` (migration, CRUD)

**Analog:** Phase 5 SQL header/apply path + Phase 3 `ADD COLUMN IF NOT EXISTS` + Phase 5 partial unique index + Phase 3 CHECK `do $$` + Phase 5 GRANT (optional, RESEARCH A2)

**Header / apply comments** (Phase 5 `05-autonomo-finance.sql` lines 1–4):
```sql
-- REQ-17 financeiro do autonomo. D-01 a D-10. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao alterar patient_sessions com colunas de dinheiro.
```

Copy this shape: `REQ-18`, D-08/D-09, “Cole no SQL Editor”, “Nao use supabase db push”, “Nao DROP patient_focus_areas_*”, “Nao CREATE TABLE”.

**ALTER column** (Phase 3 `03-account-types-team.sql` lines 11–12 and 99–103):
```sql
alter table public.profiles
  add column if not exists account_type text;

alter table public.patients
  add column if not exists created_by uuid references auth.users (id);

create index if not exists patients_created_by_idx
  on public.patients (created_by);
```

Phase 6 adaptation: `region_key text` **nullable**. Do **not** `SET NOT NULL`. Do **not** backfill from `label`.

**CHECK via drop-if + add** (Phase 3 lines 18–25 pattern; RESEARCH SQL example):
```sql
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    -- add constraint
  end if;
end
$$;
```

Or RESEARCH’s simpler `drop constraint if exists` then `add constraint … check (region_key is null or region_key ~ '^(front|back)\.[a-z0-9_]+$')`.

**Partial unique index** (Phase 5 `05-autonomo-finance.sql` lines 22–24):
```sql
create index if not exists autonomo_prices_owner_active_idx
  on public.autonomo_prices (owner_id)
  where archived_at is null;
```

Phase 6: `create unique index if not exists patient_focus_areas_patient_region_key on public.patient_focus_areas (patient_id, region_key) where region_key is not null;`

**Optional GRANT** (Phase 5 lines 74–77 — only if executor hits 42501; do not rewrite RLS):
```sql
revoke all on table public.autonomo_prices from anon, public;
grant select, insert, update on table public.autonomo_prices to authenticated;
```

Phase 6 adaptation if needed: `grant select, insert, update, delete on table public.patient_focus_areas to authenticated;` (unmark is DELETE). **Do not** copy Phase 3 policy CREATE/DROP block (lines 483–721).

**Do not copy:** Phase 3 `drop policy` loop over `patient_focus_areas` (lines 483–505). Policies already exist:

```sql
-- 03-account-types-team.sql lines 698-721 — leave as-is
create policy patient_focus_areas_select
  on public.patient_focus_areas
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));
-- insert/update/delete → can_write_patient
```

**Apply path:** human pastes committed script in hosted SQL Editor. Copy identical file to gitignored `supabase/06-patient-focus-region-key.sql` for paste convenience (same as Phase 5 / 03-02-PLAN.md).

---

### `src/lib/focusRegions.ts` (utility, transform)

**Analog:** `src/lib/dashboardShortcut.ts` (file location, named exports, no React, REQ comments) + `src/types/patient.ts` label maps + `src/schemas/patient.schema.ts` `z.enum`

**Lib module style** (`dashboardShortcut.ts` lines 1–21):
```typescript
/**
 * UX helpers for REQ-16 dashboard shortcuts.
 * canWritePatient is UX-only; RLS remains authority.
 * Do not import permissions.ts.
 */

import { canWritePatient } from '@/lib/accountAccess'
import type { PatientListItem } from '@/types/patient'

export const PATIENT_SEARCH_THRESHOLD = 8

export function writablePatients(
  patients: PatientListItem[],
  viewerId: string | undefined,
): PatientListItem[] {
  if (!viewerId) return []
  return patients.filter((patient) => canWritePatient(viewerId, patient.createdBy))
}
```

`focusRegions.ts` must **not** import React or `accountAccess`. Named `export function` / `export const`. Single quotes, no semicolons.

**Label map** (`src/types/patient.ts` lines 6–16):
```typescript
export const statusLabels: Record<PatientStatus, string> = {
  em_tratamento: 'Em tratamento',
  avaliacao: 'Avaliação',
  alta: 'Alta',
  inativo: 'Inativo',
}

export const goalStatusLabels: Record<GoalStatus, string> = {
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}
```

**Enum at schema boundary** (`src/schemas/patient.schema.ts` lines 34, 128):
```typescript
const patientStatusSchema = z.enum(['em_tratamento', 'avaliacao', 'alta', 'inativo'])
const alertToneSchema = z.enum(['info', 'warning', 'success'])
```

Phase 6: export `FOCUS_REGION_KEYS` as `as const` tuple (30 UI-SPEC keys), `export const focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS)` either here or in `patient.schema.ts` (RESEARCH puts enum in schema; catalog data in `focusRegions.ts`). `getFocusRegion(key)` returns `{ key, label, view, sortOrder, path }`. Paths live with the catalog so the panel does not hardcode `d=`.

Bakery `employeeRoles as const` in `src/schemas/auth.schema.ts` lines 72–80 is **not** the analog (confeitaria leftover).

---

### `src/types/patient.ts` (model, transform)

**Analog:** same file, `PatientFocusArea` / `PatientGoal`

**Existing DTO** (lines 18–31):
```typescript
export interface PatientGoal {
  id: string
  title: string
  status: GoalStatus
  createdOn: string
  achievedOn: string | null
  isDone: boolean
}

export interface PatientFocusArea {
  id: string
  label: string
  isActive: boolean
}
```

Add `regionKey: string` (camelCase app field). Keep `isActive` if SELECT still returns it; silhouette treats presence of a **keyed** row as marked. `Patient.focusAreas: PatientFocusArea[]` already exists (line 160) — do not add a second array.

Do **not** add types to `database.types.ts`.

---

### `src/schemas/patient.schema.ts` (config, transform)

**Analog:** same file — `z.enum` + named export. **Do not** add a react-hook-form schema for the chip (no Modal, no Input).

**Imports + enum** (lines 1–3, 34, 128–137):
```typescript
import { z } from 'zod'
import { parseBrlInput } from '@/schemas/finance.schema'
import type { AlertTone, PatientStatus } from '@/types/patient'

const patientStatusSchema = z.enum(['em_tratamento', 'avaliacao', 'alta', 'inativo'])
const alertToneSchema = z.enum(['info', 'warning', 'success'])
```

Add `focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS)` importing the tuple from `@/lib/focusRegions` (avoid duplicating the 30 keys). Service parses with this schema before INSERT.

---

### `src/services/patients.service.ts` (service, CRUD)

**Analog:** same file for SELECT/INSERT/DELETE shape. **Error mapping analog:** `src/services/finance.service.ts` — **do not** copy local `throwIfError` (raw `error.message`).

**Imports** (patients.service.ts lines 1–17 + finance.service.ts lines 1–2):
```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError, sanitizeText } from '@/lib/security'
import type { /* Patient, PatientFocusArea, ... */ } from '@/types/patient'
```

New focus writes: `import { mapDbError } from '@/lib/security'` and `import { focusRegionKeySchema } from '@/schemas/patient.schema'` + `getFocusRegion` from `@/lib/focusRegions`.

**Local FocusRow** (lines 76–81) — extend, do not generate from `database.types.ts`:
```typescript
interface FocusRow {
  id: string
  label: string
  is_active: boolean
  sort_order: number
}
```

Add `region_key: string | null`. Optional `FOCUS_COLUMNS = 'id, region_key, label, is_active, sort_order'`.

**Read path** (`getPatientById` lines 387–412 and `mapPatient` 320–322):
```typescript
supabase.from('patient_focus_areas').select('id, label, is_active, sort_order').eq('patient_id', id),
// ...
focusAreas: (extras.focus ?? [])
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((area) => ({ id: area.id, label: area.label, isActive: area.is_active })),
```

Change SELECT to include `region_key`. Mapper: **skip** rows with `region_key == null`. Display label: `getFocusRegion(row.region_key)?.label ?? row.label`.

**Write analog — INSERT** (`createPatientGoal` lines 623–649):
```typescript
export async function createPatientGoal(
  patientId: string,
  input: UpsertPatientGoalInput,
): Promise<PatientGoal> {
  const { data: existing, error: countError } = await supabase
    .from('patient_goals')
    .select('sort_order')
    .eq('patient_id', patientId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  throwIfError(countError)
  // ...
  const { data, error } = await supabase
    .from('patient_goals')
    .insert({
      patient_id: patientId,
      sort_order: nextOrder,
      ...goalPayload(input),
    })
    .select(GOAL_COLUMNS)
    .single()
  throwIfError(error)
```

**Write analog — DELETE** (`deletePatientGoal` lines 657–659 / `deletePatientAlert` 618–620):
```typescript
export async function deletePatientGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('patient_goals').delete().eq('id', goalId)
  throwIfError(error)
}
```

**Lookup-then-branch** (same `maybeSingle` as createPatientGoal count). New function `togglePatientFocusArea(patientId, regionKey): Promise<'marked' | 'unmarked'>`: parse Zod → `select('id').eq('patient_id').eq('region_key').maybeSingle()` → DELETE if row else INSERT `{ patient_id, region_key, label: catalog.label, is_active: true, sort_order: catalog.sortOrder }`. Unmark **deletes** (empty state is `length === 0`). Do not soft-flag `is_active`.

**Error handling to copy** (`finance.service.ts` lines 56–64), **not** patients.service.ts 117–119:
```typescript
function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}
```

Toggle does not need `requireUserId` unless adding an author column (table has no `created_by` in current SELECT). RLS is the wall. Local `throwIfError` in this file still throws raw messages — **new** focus helpers must use `mapDbError` (42501 → “Você não tem permissão para esta ação.”; 23505 → “Já existe um registro com esses dados.” — treat unique race as already-marked + refetch).

`mapDbError` source (`src/lib/security/index.ts` lines 201–227):
```typescript
export function mapDbError(error: { message?: string; code?: string }): string {
  const message = error.message?.toLowerCase() ?? ''
  const code = error.code ?? ''
  if (code === '42501' || message.includes('operation_not_permitted')) {
    return 'Você não tem permissão para esta ação.'
  }
  if (message.includes('duplicate') || code === '23505') {
    return 'Já existe um registro com esses dados.'
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}
```

---

### `src/hooks/usePatients.ts` (hook, CRUD)

**Analog:** same file — `useCreatePatientGoal` / `useDeletePatientGoal` / shared `onError` / `invalidatePatient`

**Imports + shared helpers** (lines 1–53):
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPatientGoal,
  deletePatientGoal,
  getPatientById,
  // add togglePatientFocusArea
} from '@/services/patients.service'
import { toast, type ToastAction } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

function invalidatePatient(qc: ReturnType<typeof useQueryClient>, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'dashboard'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'sessions'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'evaluations'] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
  void qc.invalidateQueries({ queryKey: ['finance'] })
}
```

**Mutation shape** (lines 146–180):
```typescript
export function useCreatePatientGoal(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientGoalInput) => createPatientGoal(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Meta criada', 'success')
    },
    onError,
  })
}

export function useDeletePatientGoal(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (goalId: string) => deletePatientGoal(goalId),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Meta removida', 'success')
    },
    onError,
  })
}
```

New `useTogglePatientFocusArea(patientId)`: `mutationFn: (regionKey: string) => togglePatientFocusArea(patientId, regionKey)`, `invalidatePatient` on success, toast **Área marcada** / **Área desmarcada** from return value (UI-SPEC). Error toast: prefer UI-SPEC “Não foi possível salvar a área. Tente de novo em instantes.” **or** `onError` with `mapDbError` message for 42501 — do not show PostgREST English. **No optimistic cache** (kanban is the only optimistic pattern; CONTEXT allows optimism only if invalidated — prefer invalidate-only).

Optional custom `onError` like `useCreatePatientSession` (lines 224–229) if the generic `error.message` is too generic vs UI-SPEC copy.

---

### `src/components/patients/PatientFocusAreasPanel.tsx` (component, CRUD + pointer UX)

**Analog:** `PatientGoalsPanel.tsx` for props / hide-don’t-disable / empty copy / `toggleDone` + `aria-pressed`. `EvaChart` in `PatientPage.tsx` for inline SVG. `DashboardPage.tsx` `matchMedia('(prefers-reduced-motion: reduce)')` for delay skip.

**Do not copy from Goals/Alerts:** `Modal`, `ConfirmDialog`, `useForm`, lucide header icons, “Nova” button. Unmark is immediate DELETE (UI-SPEC: no destructive confirm).

**Imports + props + named export** (`PatientGoalsPanel.tsx` lines 1–47):
```typescript
import { useEffect, useState } from 'react'
import {
  useCreatePatientGoal,
  useDeletePatientGoal,
  useUpdatePatientGoal,
} from '@/hooks/usePatients'
import { goalStatusLabels, type PatientGoal } from '@/types/patient'

type PatientGoalsPanelProps = {
  patientId: string
  goals: PatientGoal[]
  canWrite?: boolean
}

export function PatientGoalsPanel({ patientId, goals, canWrite = true }: PatientGoalsPanelProps) {
  const createGoal = useCreatePatientGoal(patientId)
```

Panel props: `{ patientId, focusAreas, canWrite }`. Use `useTogglePatientFocusArea(patientId)`. Import catalog from `@/lib/focusRegions`. Class names via `[...].join(' ')`, not `clsx`.

**Hide write controls** (`PatientGoalsPanel.tsx` lines 123–133; same idea `PatientAlertsPanel.tsx` 127–137):
```typescript
{canWrite ? (
  <button type="button" aria-label="Adicionar meta" onClick={openCreate} className="...">
    Nova
  </button>
) : null}
```

Chip: `{canWrite ? <button type="button" …> : null}`. When `!canWrite`: no `tabIndex` on paths, `cursor-default`, no hover preview (UI-SPEC visual states). Do **not** render a disabled-looking chip.

**Toggle persist without confirm** (`PatientGoalsPanel.tsx` lines 98–109 and 152–163) — this is the chip click analog:
```typescript
function toggleDone(goal: PatientGoal) {
  const nextDone = !goal.isDone
  updateGoal.mutate({
    goalId: goal.id,
    input: { /* ... */ },
  })
}

{canWrite ? (
  <button
    type="button"
    onClick={() => toggleDone(goal)}
    aria-pressed={goal.isDone}
    aria-label={/* Marcar / Desmarcar */}
  >
```

Chip: `aria-pressed={selected}`, visible **Marcar {label}** / **Desmarcar {label}**, `onClick` → `toggle.mutate(regionKey)` only. `isPending` → `aria-busy="true"` and ignore extra clicks. Path `onClick` must **not** mutate (D-06).

**Empty copy** (`PatientGoalsPanel.tsx` lines 136–137):
```typescript
{goals.length === 0 ? (
  <p className="mt-3 text-sm text-muted">Sem objetivos cadastrados.</p>
```

UI-SPEC: `mt-4 text-sm text-muted`, heading **Sem áreas registradas.** Body instruction only when `canWrite`. Keep silhouettes visible (do not replace map with icon well). Current copy lives in `PatientPage.tsx` line 364 (`Sem áreas registradas.`) — move into the panel.

**Card title chrome to keep in PatientPage, not restyle** (`PatientPage.tsx` 358–359 / GoalsPanel 119–121):
```tsx
<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Áreas de foco</p>
```

**Inline SVG analog** (`PatientPage.tsx` `EvaChart` 83–94 — tokens, camelCase SVG props):
```tsx
<svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-32 w-full">
  <path d={path} fill="none" stroke="#2f7dff" strokeWidth="2.5" strokeLinejoin="round" />
  <circle cx={point.x} cy={point.y} r="3.5" fill="#0b1d36" />
</svg>
```

Prefer Tailwind tokens (`text-forest`, `fill-accent/35`, `stroke-accent`) over hex. Prefer `currentColor` + `className="text-forest"`. Size: `h-44 w-auto sm:h-52` (UI-SPEC), not BodyFocus `h-36`.

**Delete, do not copy** (`BodyFocus` lines 98–116): stick-figure strokes + hardcoded `circle` at `cy={132}` / `cy={108}`.

**Reduced-motion gate** (`DashboardPage.tsx` lines 90–93):
```typescript
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reduce) {
  setValue(target)
  return
}
```

UI-SPEC: if reduce **or** not fine-hover, delay = 0. Fine hover open: `matchMedia('(hover: hover) and (pointer: fine)')` + `HOVER_OPEN_MS = 500`. No analog for the delayed chip itself — see No Analog Found.

**sr-only marked list:** no in-repo `sr-only` usage. Use Tailwind `sr-only` `<ul>` of `{label} (frente|costas)` when keyed `focusAreas.length > 0` (UI-SPEC). Do not restore the visible side list (D-01).

---

### `src/pages/PatientPage.tsx` (component, request-response)

**Analog:** same file — `ResumoDoPaciente` already mounts `PatientGoalsPanel` with `canWrite`.

**Panel mount** (lines 357–377):
```tsx
<div className="rounded-2xl border border-line p-4">
  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Áreas de foco</p>
  <div className="mt-3 flex items-center gap-4">
    <BodyFocus />
    <ul className="space-y-2 text-sm">
      {detail.focusAreas.length === 0 ? (
        <li className="text-muted">Sem áreas registradas.</li>
      ) : (
        detail.focusAreas.map((area) => (
          <li key={area.id} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${area.isActive ? 'bg-accent' : 'bg-line'}`} />
            {area.label}
          </li>
        ))
      )}
    </ul>
  </div>
</div>

<PatientGoalsPanel patientId={patientId} goals={detail.goals} canWrite={canWrite} />
```

Replace inner `flex` + `BodyFocus` + `<ul>` with:
```tsx
<PatientFocusAreasPanel
  patientId={patientId}
  focusAreas={detail.focusAreas}
  canWrite={canWrite}
/>
```
Keep the outer card + title. Delete `function BodyFocus()`. Add import next to `PatientGoalsPanel` (lines 21–22).

**canWrite already computed** (lines 507–508) and passed into `ResumoDoPaciente` (126, 290–294, 403). Do not import `permissions.ts`. Do not recompute inside the panel.

```typescript
const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
```

---

## Shared Patterns

### Authentication / clinic write UX
**Source:** `src/lib/accountAccess.ts` lines 28–37; `src/pages/PatientPage.tsx` line 507
**Apply to:** `PatientFocusAreasPanel` (prop only), not a new predicate
```typescript
export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}
```
UX only. RLS `private.can_write_patient` / `patient_focus_areas_insert|delete` remains authority. Hide chip when `!canWrite` (Phase 3 D-07 / D-10). Do not import `src/lib/permissions.ts`.

### Error handling
**Source:** `src/services/finance.service.ts` lines 56–58; `src/lib/security/index.ts` `mapDbError`; `src/hooks/usePatients.ts` `onError`
**Apply to:** `togglePatientFocusArea` + `useTogglePatientFocusArea`
```typescript
if (error) throw new Error(mapDbError(error))
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```
Do **not** copy `patients.service.ts` lines 117–119 (`throw new Error(error.message)`).

### Validation
**Source:** `src/schemas/patient.schema.ts` `z.enum`; service parses before write
**Apply to:** `togglePatientFocusArea` — catalog keys only, never free-text `label` from the chip

### Layers
**Source:** `.planning/codebase/CONVENTIONS.md` / `ARCHITECTURE.md`
**Apply to:** page → hook → service → Supabase. Panel must not import `supabase`.

### Style
Named exports, single quotes, no semicolons, 2-space, `[...].join(' ')`, Portuguese UI copy. Quality gate: `npm run lint && npm run typecheck` (no Vitest this phase).

### Toast
**Source:** `src/stores/toast.store.ts` `toast()`; hook `onSuccess` strings
**Apply to:** Área marcada / Área desmarcada / error copy. Do not toast on hover.

### SQL apply
**Source:** Phase 5 + Phase 3 — hosted SQL Editor only; commit under `.planning/phases/06-silhueta-areas-de-foco/sql/`; gitignored `supabase/` paste copy.

---

## No Analog Found

| File / concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| 500ms hover “abinha” (region+chip pointer group, tap-to-open on coarse, Escape dismiss) | component interaction | event-driven (pointer/focus) | No delayed hover, tooltip, or `title=` chip in clinic UI. Implement from `06-UI-SPEC.md` Interaction Contract + RESEARCH Patterns 1–2 (WCAG 1.4.13). |
| Genderless front/back body-map SVG paths | component | transform (hit-testing) | Only SVGs are `BodyFocus` (delete) and `EvaChart` (line chart). Hand-roll non-overlapping filled paths; `pointerEvents="fill"`; outline layer `pointerEvents="none"`. |
| `sr-only` marked-region list | a11y | transform | No `sr-only` usage in `src/`. Use Tailwind `sr-only` per UI-SPEC. |

Planner should treat these as RESEARCH/UI-SPEC patterns, not invent a portal + Floating UI.

---

## Metadata

**Analog search scope:** `src/lib/`, `src/components/patients/`, `src/pages/PatientPage.tsx`, `src/services/patients.service.ts`, `src/services/finance.service.ts`, `src/hooks/usePatients.ts`, `src/schemas/`, `src/types/patient.ts`, `src/lib/accountAccess.ts`, `src/lib/security/index.ts`, `src/stores/toast.store.ts`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/`, `.planning/phases/05-financeiro-autonomo/sql/`, `src/pages/DashboardPage.tsx`, `src/index.css`
**Files scanned:** ~28
**Pattern extraction date:** 2026-09-14
