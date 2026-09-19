# Phase 9: Paciente/sessão sem fisioterapeuta (empresa) - Pattern Map

**Mapped:** 2026-09-18
**Files analyzed:** 9
**Analogs found:** 9 / 9

Honor CONTEXT over RESEARCH on D-01–D-06: optional therapist **only** for `account_type === 'empresa'`; persist `null` (not `''`); assign later via edit; copy **Sem profissional**; no new `account_type` / Equipe / Phase 3 RLS; **do not touch Phase 8** Google Calendar.

Constraints for every clinic edit: named exports, single quotes, no semicolons, page → hook → service → Supabase, UX predicates in `accountAccess.ts` are **not** authorization (RLS remains authority), Portuguese copy.

**Do not create/modify:** `src/pages/CalendarPage.tsx`, `src/services/calendar.service.ts`, `supabase/functions/google-calendar-*`, Phase 8 planning paths, Equipe / `private.can_*` SQL, finance schemas, `src/lib/permissions.ts`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/schemas/patient.schema.ts` | config | transform | same file `sessionFormSchema` + `src/schemas/modules.schema.ts` (`assigned_to` / `courier_id` optional UUID) + `src/schemas/evaluation.schema.ts` (optional therapist) | exact |
| `src/types/patient.ts` | model | transform | same file `UpsertPatientSessionInput` + `src/types/evaluation.ts` (`therapistId: string \| null`) | exact |
| `src/lib/accountAccess.ts` | utility | request-response (UX gate) | same file `canSeeFinance` / `canManageTeam` | exact |
| `src/lib/therapistLabel.ts` (optional NEW) | utility | transform | `accountAccess.ts` `accountTypeLabel` + display map in `patients.service.ts` | role-match |
| `src/services/sessions.service.ts` | service | CRUD | same file `emptyToNull` + `src/services/calendar.service.ts` `createSession` + `src/services/evaluations.service.ts` `toRow` | exact |
| `src/components/patients/PatientSessionEditorForm.tsx` | component | request-response | same file (hotspot) + `PatientEvaluationEditorForm.tsx` (optional therapist submit) | exact |
| `src/components/patients/PatientEvolutionsPanel.tsx` | component | request-response (display) | same file list/viewer therapist lines | exact |
| `src/components/patients/PatientCadastroPanel.tsx` | component | request-response (display) | same file `Field label="Fisioterapeuta"` | exact |
| `src/services/patients.service.ts` | service | transform (DTO map) | same file `mapPatient` `therapist: row.therapist_name ?? '—'` | exact |

**Already OK (no invent / no required edit):** `createPatientSchema.therapistName` optional; `PatientsPage` create modal omits therapist; `calendar.service.createSession` already `?? null`. Leave Calendar alone (D-06 / Open Q1).

---

## Pattern Assignments

### `src/schemas/patient.schema.ts` (config, transform)

**Analog:** same file `sessionFormSchema`; optional-UUID shape from `modules.schema.ts`; optional therapist field from `evaluation.schema.ts`.

**Current hotspot** (lines 165–217) — keep `superRefine` for mode/finance; swap only `therapistId` via factory:
```typescript
export const sessionFormSchema = z
  .object({
    mode: z.enum(['agendar', 'realizada']),
    scheduledAt: z.string().trim().min(1, 'Informe data e horário'),
    sessionType: optionalText(80),
    place: optionalText(80),
    therapistId: z.string().uuid('Selecione o profissional'),
    // ...patientState, finance fields...
  })
  .superRefine((data, ctx) => {
    // mode === 'realizada' + finance rules — DO NOT drop
  })

export type SessionFormData = z.infer<typeof sessionFormSchema>
```

**Optional UUID + empty select** (`src/schemas/modules.schema.ts` lines 101, 105):
```typescript
assigned_to: z.string().uuid().optional().or(z.literal('')),
courier_id: z.string().uuid().optional().or(z.literal('')),
```

**Optional therapist (all accounts — evaluation only; do not copy scope to sessions for non-empresa)** (`src/schemas/evaluation.schema.ts` lines 9–14):
```typescript
export const evaluationFormSchema = z.object({
  performedOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data da avaliação'),
  therapistId: z.string().optional(),
  // ...
})
```

**Patient create already optional** (lines 54, 95) — no change required for D-03 create path:
```typescript
therapistName: optionalText(120),
```

**Phase 9 shape (from RESEARCH Pattern 1):**
```typescript
import type { AccountType } from '@/types/account'

const therapistIdRequired = z.string().uuid('Selecione o profissional')
const therapistIdOptionalEmpresa = z
  .string()
  .uuid('Selecione o profissional')
  .optional()
  .or(z.literal(''))

export function createSessionFormSchema(accountType: AccountType | null | undefined) {
  const therapistId =
    accountType === 'empresa' ? therapistIdOptionalEmpresa : therapistIdRequired
  return z.object({ /* existing fields */ therapistId }).superRefine(/* unchanged */)
}

export const sessionFormSchema = createSessionFormSchema('autonomo')
export type SessionFormData = z.infer<ReturnType<typeof createSessionFormSchema>>
```

---

### `src/types/patient.ts` (model, transform)

**Analog:** same file `UpsertPatientSessionInput` (lines 107–120) + evaluation nullable DTO.

**Current (required strings — blocker for null persist):**
```typescript
export interface UpsertPatientSessionInput {
  mode: SessionFormMode
  scheduledAt: string
  sessionType?: string
  place?: string
  therapistId: string
  therapistName: string
  // ...
}
```

**Copy nullability from** `src/types/evaluation.ts` lines 18–19 / 37–38:
```typescript
therapistId: string | null
therapistName: string | null
// Upsert:
therapistId?: string | null
therapistName?: string | null
```

**Phase 9 change:** `UpsertPatientSessionInput.therapistId` / `therapistName` → `string | null`. Keep `PatientSessionRecord.therapistId/Name` already `string | null` (lines 73–74).

---

### `src/lib/accountAccess.ts` (utility, UX gate)

**Analog:** same file `canSeeFinance` / `canManageTeam` (account-type branch, UX only).

**Imports + comment contract** (lines 1–26):
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

export function canManageTeam(accountType: AccountType | null | undefined): boolean {
  return accountType === 'empresa'
}

export function canSeeFinance(accountType: AccountType | null | undefined): boolean {
  return accountType === 'autonomo'
}
```

**Phase 9 addition (mirror style):**
```typescript
/** Empresa pode criar/editar sessão sem profissional (REQ-21 / D-01). UX only. */
export function canOmitSessionTherapist(
  accountType: AccountType | null | undefined,
): boolean {
  return accountType === 'empresa'
}
```

---

### `src/lib/therapistLabel.ts` (utility, transform) — optional NEW

**Analog:** `accountTypeLabel` in `accountAccess.ts` (lines 55–58); empty-display currently `'—'` in `patients.service.ts` mapPatient.

**Label helper pattern:**
```typescript
export function accountTypeLabel(type: AccountType | null | undefined): string {
  if (!type) return ''
  return accountTypeLabels[type]
}
```

**Phase 9 (RESEARCH Pattern 3):**
```typescript
export function formatTherapistLabel(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed || trimmed === '—') return 'Sem profissional'
  return trimmed
}
```

If planner prefers zero new files: inline the same helper once in `patients.service.ts` + import from display panels — still one PT string **Sem profissional** (D-04).

---

### `src/services/sessions.service.ts` (service, CRUD)

**Analog:** same file `emptyToNull` + insert/update payload; Calendar/evaluations for therapist null coalesce.

**Existing empty helper** (lines 60–63) — reuse for therapist fields:
```typescript
function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}
```

**Current hotspot — writes UUID/name verbatim** (lines 177–178, 221–222):
```typescript
therapist_id: input.therapistId,
therapist_name: input.therapistName,
```

**Copy null coalesce from** `src/services/calendar.service.ts` lines 59–75:
```typescript
export async function createSession(input: {
  patientId: string
  scheduledAt: string
  type: string
  place: string
  therapistId?: string
  therapistName?: string
}) {
  const { error } = await supabase.from('patient_sessions').insert({
    // ...
    therapist_id: input.therapistId ?? null,
    therapist_name: input.therapistName ?? null,
  })
  throwIfError(error)
}
```

**And** `src/services/evaluations.service.ts` lines 101–102:
```typescript
therapist_id: input.therapistId || null,
therapist_name: emptyToNull(input.therapistName ?? undefined),
```

**Phase 9 create/update payload:**
```typescript
therapist_id: input.therapistId?.trim() ? input.therapistId : null,
therapist_name: emptyToNull(input.therapistName ?? undefined),
```

Keep `resolveAuthor` / `created_by` as-is — **do not** set `therapist_id` from `author.userId` (D-06).

---

### `src/components/patients/PatientSessionEditorForm.tsx` (component, request-response)

**Analog:** same file (primary hotspot); submit/null mapping from `PatientEvaluationEditorForm.tsx`; account gate from `canSeeFinance` usage in this file.

**Imports + finance UX gate** (lines 16–17, 84–85) — mirror for omit therapist:
```typescript
import { sessionFormSchema, type SessionFormData } from '@/schemas/patient.schema'
import { canSeeFinance } from '@/lib/accountAccess'
// ...
const { profile } = useAuth()
const showFinance = canSeeFinance(profile?.accountType)
```

**Static schema resolver today** (lines 114–115) — replace with factory + `useMemo`:
```typescript
const form = useForm<SessionFormData>({
  resolver: zodResolver(sessionFormSchema),
  // ...
})
```

**Select options** (lines 95–100) — change empty label when omit allowed:
```typescript
const therapistOptions = useMemo(
  () => [
    { value: '', label: 'Selecione…' },
    ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
  ],
  [therapists],
)
```

**Default first therapist (regression risk for empresa)** (lines 156–160):
```typescript
form.reset({
  // ...
  therapistId: therapists[0]?.id ?? '',
  // ...
})
```
Phase 9: if `canOmitSessionTherapist(profile?.accountType)` → default `''`; else keep `therapists[0]?.id ?? ''`.

**Runtime gate (Pitfall 1)** (lines 171–184):
```typescript
function onSubmit(values: SessionFormData) {
  const therapist = therapists.find((item) => item.id === values.therapistId)
  if (!therapist) {
    form.setError('therapistId', { message: 'Selecione o profissional' })
    return
  }

  const input = {
    // ...
    therapistId: therapist.id,
    therapistName: therapist.fullName,
  }
}
```

**Copy optional submit from** `PatientEvaluationEditorForm.tsx` lines 125–142:
```typescript
function onSubmit(values: EvaluationFormData) {
  const therapist = therapists.find((item) => item.id === values.therapistId)
  const input = {
    // ...
    therapistId: therapist?.id ?? null,
    therapistName: therapist?.fullName ?? null,
  }
  // ...
}
```

**Phase 9 onSubmit shape:**
```typescript
const omitOk = canOmitSessionTherapist(profile?.accountType)
const therapist = therapists.find((item) => item.id === values.therapistId)
if (!omitOk && !therapist) {
  form.setError('therapistId', { message: 'Selecione o profissional' })
  return
}
const input = {
  // ...
  therapistId: therapist?.id ?? null,
  therapistName: therapist?.fullName ?? null,
}
```

Empty option label when `omitOk`: `{ value: '', label: 'Sem profissional' }`.

---

### `src/components/patients/PatientEvolutionsPanel.tsx` (component, display)

**Analog:** same file list + viewer therapist lines.

**List omits name when null** (lines 204–207):
```typescript
<p className="mt-1 text-xs text-muted">
  {session.type} · {session.place}
  {session.therapistName ? ` · ${session.therapistName}` : ''}
</p>
```

**Viewer hides profissional entirely when null** (lines 270–272):
```typescript
{viewing.therapistName ? (
  <p className="text-sm text-muted">Profissional · {viewing.therapistName}</p>
) : null}
```

**Phase 9:** always show professional state via `formatTherapistLabel(session.therapistName)` / `formatTherapistLabel(viewing.therapistName)` → **Sem profissional** when empty (D-04). Keep edit buttons / `PatientSessionEditorForm` mount unchanged for assign-later.

`canSeeFinance` usage in this file (line 130) is the same accountAccess import style for any new omit predicate if needed (display does not need omit).

---

### `src/components/patients/PatientCadastroPanel.tsx` (component, display)

**Analog:** same file Field + admin section.

**Display** (line 188) — value comes from DTO that maps null → `'—'`:
```typescript
<Field label="Fisioterapeuta" value={patient.therapist} />
```

**Admin edit already optional text** (lines 349–351) — keep; assign later works today:
```typescript
<Input
  label="Fisioterapeuta"
  error={adminForm.formState.errors.therapistName?.message}
  {...adminForm.register('therapistName')}
/>
```

**Phase 9:** ensure displayed value is **Sem profissional** when empty (either fix at `mapPatient` or wrap Field value with `formatTherapistLabel`). Prefer single source in `patients.service` map so list/ficha stay consistent.

---

### `src/services/patients.service.ts` (service, DTO map)

**Analog:** same file `mapPatient` + `emptyToNull` on create.

**Empty display today** (line 316):
```typescript
therapist: row.therapist_name ?? '—',
```

**Create already null-safe** (line 543) — D-03 create path OK:
```typescript
therapist_name: emptyToNull(input.therapistName),
```

**Phase 9:**
```typescript
therapist: formatTherapistLabel(row.therapist_name),
// or: therapist: row.therapist_name?.trim() || 'Sem profissional',
```

Do not add `patients.therapist_id` (Open Q2 / D-05).

---

## Shared Patterns

### Account-type UX predicates
**Source:** `src/lib/accountAccess.ts` (`canSeeFinance`, `canManageTeam`)  
**Apply to:** `PatientSessionEditorForm`, schema factory callers  
```typescript
export function canSeeFinance(accountType: AccountType | null | undefined): boolean {
  return accountType === 'autonomo'
}
```
Add `canOmitSessionTherapist` → `accountType === 'empresa'`. Never treat as RLS.

### Optional UUID select (`''` | uuid)
**Source:** `src/schemas/modules.schema.ts` lines 101, 105  
**Apply to:** empresa branch of `createSessionFormSchema`  
```typescript
z.string().uuid().optional().or(z.literal(''))
```

### Empty → SQL null at service boundary
**Source:** `src/services/calendar.service.ts` 73–74; `evaluations.service.ts` 101–102; local `emptyToNull` in `sessions.service.ts`  
**Apply to:** `createPatientSession` / `updatePatientSession` therapist columns  
```typescript
therapist_id: input.therapistId ?? null,
therapist_name: input.therapistName ?? null,
```

### Optional therapist submit mapping
**Source:** `src/components/patients/PatientEvaluationEditorForm.tsx` 125–142  
**Apply to:** `PatientSessionEditorForm.onSubmit` when omit allowed  
```typescript
therapistId: therapist?.id ?? null,
therapistName: therapist?.fullName ?? null,
```

### Display copy **Sem profissional**
**Source:** D-04 + RESEARCH Pattern 3; replace `'—'` / silent omit  
**Apply to:** `patients.service` mapPatient, `PatientCadastroPanel` Field, `PatientEvolutionsPanel` list + viewer  
```typescript
formatTherapistLabel(name) // → 'Sem profissional' when empty / '—'
```

### Auth / write UX (unchanged)
**Source:** `canWritePatient` + existing panel hide-write  
**Apply to:** no new auth — session create still gated by RLS `can_write_patient(patient_id)`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| *(none required)* | — | — | All Phase 9 touch files have in-repo analogs. Optional `therapistLabel.ts` is a thin extract of existing label helpers. |

**Out of scope (explicit non-analogs / do not invent edits):**

| Path | Reason |
|------|--------|
| `src/pages/CalendarPage.tsx` | Already creates without therapist; D-06 / Open Q1 leave alone |
| `src/services/calendar.service.ts` | Already null-safe — reference only |
| Phase 8 Google paths | D-06 |
| Phase 3 `private.can_*` SQL | D-05 — RLS already correct without `therapist_id` |

---

## Metadata

**Analog search scope:** `src/schemas/`, `src/types/`, `src/lib/accountAccess.ts`, `src/services/{sessions,calendar,evaluations,patients}.service.ts`, `src/components/patients/Patient{SessionEditorForm,EvaluationEditorForm,EvolutionsPanel,CadastroPanel}.tsx`, `src/pages/PatientsPage.tsx` (create path verified optional)  
**Files scanned:** ~20 hotspot files  
**Pattern extraction date:** 2026-09-18  
**Primary hotspots for planner:** `sessionFormSchema.therapistId`, `PatientSessionEditorForm` runtime gate + first-therapist default, `sessions.service` verbatim `therapist_id`, patient/session display `'—'` / omit
)
