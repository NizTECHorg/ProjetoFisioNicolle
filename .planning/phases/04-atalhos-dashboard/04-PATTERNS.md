# Phase 4: Atalhos no dashboard - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 13
**Analogs found:** 11 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/DashboardPage.tsx` | page | request-response | `src/pages/PatientsPage.tsx` (PageHeader `action`) | exact |
| `src/components/patients/DashboardClinicalShortcut.tsx` | component | request-response | `src/pages/PatientsPage.tsx` (overlay + patient rows) | role-match |
| `src/components/patients/PatientSessionEditorForm.tsx` | component | CRUD | `src/components/patients/PatientEvolutionsPanel.tsx` (create Modal form) | exact |
| `src/components/patients/PatientEvaluationEditorForm.tsx` | component | CRUD | `src/components/patients/PatientEvaluationPanel.tsx` (inline create form) | exact |
| `src/components/patients/PatientEvolutionsPanel.tsx` | component | CRUD | self — wrap extracted form in existing Modal | exact |
| `src/components/patients/PatientEvaluationPanel.tsx` | component | CRUD | self — wrap extracted form in existing inline chrome | exact |
| `src/lib/dashboardShortcut.ts` | utility | transform | `src/lib/accountAccess.ts` | role-match |
| `src/hooks/usePatients.ts` | hook | CRUD | self — `useCreatePatientSession` / `useCreatePatientEvaluation` | exact |
| `src/stores/toast.store.ts` | store | event-driven | self | exact |
| `src/components/ui/ToastViewport.tsx` | component | event-driven | self | exact |
| `src/components/ui/Modal.tsx` | component | request-response | self | exact |
| `src/lib/dashboardShortcut.test.ts` | test | transform | none (no `*.test.ts` in repo) | none |
| `src/stores/toast.store.test.ts` | test | event-driven | none (no `*.test.ts` in repo) | none |

Do **not** create files under `src/components/dashboard/` (bakery `SalesChart.tsx` lives there). Shortcut chrome belongs in `src/components/patients/` per STRUCTURE.md.

## Pattern Assignments

### `src/pages/DashboardPage.tsx` (page, request-response)

**Analog:** `src/pages/PatientsPage.tsx` (header actions) + self (keep metric cards untouched)

**Imports to add** (PatientsPage lines 1–8; Dashboard already has `PageHeader` / `Link`):

```tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DashboardClinicalShortcut } from '@/components/patients/DashboardClinicalShortcut'
```

Keep existing dashboard imports. Do **not** import bakery `SalesChart` or `src/lib/permissions.ts`.

**PageHeader action pattern** (`src/pages/PatientsPage.tsx` lines 71–80) — compose two buttons; keep `className="dash-in"` already on Dashboard:

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
/>
```

Dashboard today (`src/pages/DashboardPage.tsx` lines 336–337) has **no** `action`. Pass the cluster **above** the loading/error branch so buttons stay visible:

```tsx
<PageHeader className="dash-in" title="Dashboard" />
```

`PageHeader` already supports `action` (`src/components/ui/PageHeader.tsx` lines 1–19). Do **not** add a description. Do **not** restyle the four metric cards (lines 353–422).

**Mount wizard beside the header, not inside the loading gate** (`DashboardPage.tsx` lines 339–351). `usePatients()` is already called at line 239 — pass that cache into the shortcut; do not fetch a second list.

**Button variants** (`src/components/ui/Button.tsx` lines 25–31): primary default for **Nova evolução**, `variant="secondary"` for **Nova avaliação**. `type="button"` on both.

**Anti-copy:** `src/pages/CalendarPage.tsx` lines 140–149 also puts “Nova sessão” in `PageHeader`, but that page uses a **different** create path (`useCreateSession` from `useClinic`, hand-rolled `FormEvent`). Dashboard shortcuts must reuse the ficha editors, not Calendar’s modal.

---

### `src/components/patients/DashboardClinicalShortcut.tsx` (component, request-response)

**Analog:** `src/pages/PatientsPage.tsx` (Modal overlay + patient rows + `useAuth`) + `src/pages/TeamPage.tsx` (empty well) + ficha panels (Modal `wide` chrome)

This is the **only** new wizard. One React state machine. Never two Modals at once. URL stays `/painel`.

**Imports pattern** (compose PatientsPage + panels, not GlobalSearch — that file is bakery):

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { PatientSessionEditorForm } from '@/components/patients/PatientSessionEditorForm'
import { PatientEvaluationEditorForm } from '@/components/patients/PatientEvaluationEditorForm'
import { useAuth } from '@/hooks/useAuth'
import { usePatients } from '@/hooks/usePatients'
import { canWritePatient } from '@/lib/accountAccess'
import {
  PATIENT_SEARCH_THRESHOLD,
  filterPatientsByName,
  patientFichaPath,
  writablePatients,
} from '@/lib/dashboardShortcut'
import { statusLabels } from '@/types/patient'
```

**Auth / write filter** — copy `useAuth` + `createdBy` from PatientsPage (`src/pages/PatientsPage.tsx` lines 17–27) **except** do **not** render `Ficha de {nome}`. Omit non-writable rows:

```tsx
export function PatientsPage() {
  const { user, profile } = useAuth()
  const { data: patients = [], isLoading, isError } = usePatients()

  function fichaDeLine(patient: PatientListItem) {
    if (profile?.accountType !== 'empresa' || !patient.createdBy || patient.createdBy === user?.id) {
      return null
    }
    return `Ficha de ${patient.createdByName || 'fisioterapeuta'}`
  }
```

Picker uses `writablePatients(patients, user?.id)` then `canWritePatient` again before opening the editor (`src/lib/accountAccess.ts` lines 27–32). `PatientListItem.createdBy` is already on the list DTO (`src/types/patient.ts` lines 121–122).

**Patient row chrome** (`src/pages/PatientsPage.tsx` lines 107–123) — reuse avatar + name; second line is `statusLabels[patient.status]` only:

```tsx
<Link
  key={patient.id}
  to={`/pacientes/${patient.id}`}
  className="dash-card dash-in flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
>
  <PatientAvatar name={patient.name} tone={patient.photoTone} initials={patient.initials} />
  <span className="min-w-0 flex-1">
    <span className="block truncate font-medium text-ink">{patient.name}</span>
    <span className="block truncate text-xs text-muted">
      {fichaDeLine(patient) ?? `${statusLabels[patient.status]} · ${patient.program}`}
    </span>
  </span>
</Link>
```

Picker rows are **buttons** (`w-full rounded-2xl border border-line bg-surface p-4`, `min-h-11`, `hover:bg-canvas`), not Links. Click → `{ step: 'editor', kind, patientId, patientName }`. No Continuar.

**Loading / error in-modal** — copy spinner + error article geometry from Dashboard (`src/pages/DashboardPage.tsx` lines 339–348) and ficha panels (`PatientEvolutionsPanel.tsx` lines 183–186; `PatientEvaluationPanel.tsx` lines 208–217). Picker spinner uses `min-h-32` (panel pattern), forest border. Error copy is UI-SPEC, not the SQL hint from EvaluationPanel.

**Empty well** (`src/pages/TeamPage.tsx` lines 104–113) — clone geometry, swap `Inbox` → `Users` 22px, copy from UI-SPEC, CTA `Button variant="secondary"` “Ir para pacientes”:

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

Empty CTA: `onClose` then `navigate('/pacientes')` — same `useNavigate` style as PatientsPage line 20.

**Search** — `Input` with `autoFocus` when writable count ≥ 8 (`src/pages/PatientsPage.tsx` lines 198–202). Filter with `filterPatientsByName` (pt-BR), not `GlobalSearch` debounce/ILIKE.

**Modal chrome for picker** (`src/pages/PatientsPage.tsx` lines 191–196) — default width (omit `wide`):

```tsx
<Modal
  open={open}
  title="Novo paciente"
  description="Cadastro rápido. Só o nome é obrigatório — o restante pode ser completado na ficha."
  onClose={() => setOpen(false)}
>
```

Picker titles: **Nova evolução** / **Nova avaliação**. Description: `Escolha o paciente para abrir o formulário.` `onClose` → `{ step: 'closed' }` (D-02).

**Modal chrome for editors** (`src/components/patients/PatientEvolutionsPanel.tsx` lines 260–267) — `wide`, replace picker (do not stack):

```tsx
<Modal
  open={editorOpen}
  title={editing ? 'Editar sessão' : 'Nova sessão'}
  description="Toggle Agendar / Realizada. Agendadas aparecem na Agenda."
  onClose={closeEditor}
  wide
>
```

Shortcut titles stay **Nova sessão** / **Nova avaliação**. Description is `{patientName}` only (UI-SPEC). `onClose` → closed, **not** picker.

**Wizard state** (prescribed; no existing analog — lock this):

```typescript
type ShortcutKind = 'evolucao' | 'avaliacao'
type ShortcutState =
  | { step: 'closed' }
  | { step: 'picker'; kind: ShortcutKind }
  | { step: 'editor'; kind: ShortcutKind; patientId: string; patientName: string }
```

Header click while open: reset to picker for that kind. Editor cancel: `closed`. Success: `closed` via form `onSuccess` only (hook already toasted).

**Do not mount** `PatientEvolutionsPanel` / `PatientEvaluationPanel` here — they always run `usePatientSessions` / `usePatientEvaluations` and render lists, pencils, trash, ConfirmDialog, and PDF import (`PatientEvaluationPanel.tsx` lines 367–380).

---

### `src/components/patients/PatientSessionEditorForm.tsx` (component, CRUD)

**Analog:** `src/components/patients/PatientEvolutionsPanel.tsx` lines 1–163 and 268–370

Extract the **create** form body. Ficha keeps list/edit/delete/ConfirmDialog. Shortcut mounts this inside `Modal wide`.

**Imports pattern** (panel lines 1–19 — drop ConfirmDialog, Plus, Pencil, Trash2, list hooks):

```tsx
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useActiveTherapists, useCreatePatientSession } from '@/hooks/usePatients'
import { sessionFormSchema, type SessionFormData } from '@/schemas/patient.schema'
```

Keep datetime helpers on the extracted form (`PatientEvolutionsPanel.tsx` lines 29–45): `toDatetimeLocalValue`, `fromDatetimeLocalValue`, `defaultScheduledLocal`.

**RHF + Zod** (panel lines 71–88):

```tsx
const form = useForm<SessionFormData>({
  resolver: zodResolver(sessionFormSchema),
  defaultValues: {
    mode: 'agendar',
    scheduledAt: defaultScheduledLocal(),
    sessionType: 'Sessão',
    place: '',
    therapistId: '',
    patientState: '',
    changesSinceLast: '',
    conducts: '',
    treatmentResponse: '',
    incidents: '',
    nextPlan: '',
  },
})
```

Reset on mount like the panel `useEffect` create branch (lines 108–120), including `therapistId: therapists[0]?.id ?? ''`.

**Submit + mutate onSuccess closes chrome** (panel lines 128–163). Shortcut is create-only — **omit** the `editing` / `updateSession` branch:

```tsx
function onSubmit(values: SessionFormData) {
  const therapist = therapists.find((item) => item.id === values.therapistId)
  if (!therapist) {
    form.setError('therapistId', { message: 'Selecione o profissional' })
    return
  }

  const input = {
    mode: values.mode,
    scheduledAt: fromDatetimeLocalValue(values.scheduledAt),
    sessionType: values.sessionType,
    place: values.place,
    therapistId: therapist.id,
    therapistName: therapist.fullName,
    patientState: values.patientState,
    changesSinceLast: values.changesSinceLast,
    conducts: values.conducts,
    treatmentResponse: values.treatmentResponse,
    incidents: values.incidents,
    nextPlan: values.nextPlan,
  }

  createSession.mutate(input, { onSuccess: () => closeEditor() })
}
```

`mutate({ onSuccess })` **only** closes. Do **not** toast here — hook toasts first (`usePatients.ts` lines 193–202). Do **not** pass `onError` to `mutate` (double error toast).

**Agendar / Realizada toggle + fields** (panel lines 268–370) — copy verbatim, including `form.setValue('mode', …, { shouldValidate: true })` and `[...].join(' ')` classNames. Clinical Textareas only when `mode === 'realizada'`. Helper text for Agendar stays.

**Chrome labels as props** (ficha vs shortcut):

```tsx
<Button type="button" variant="secondary" onClick={closeEditor} disabled={saving}>
  Cancelar
</Button>
<Button type="submit" isLoading={saving}>
  Salvar
</Button>
```

Ficha: `Cancelar` / `Salvar`. Shortcut: `Voltar ao dashboard` / `Salvar sessão`. `isLoading` already renders `Aguarde...` (`Button.tsx` lines 45–49).

**Schema stays put** — `sessionFormSchema` superRefine requires estado/condutas on Realizada (`src/schemas/patient.schema.ts` lines 161–191). Do not duplicate.

**Ficha panel after extract:** keep `usePatientSessions`, list, pencils, ConfirmDialog, and wrap `<PatientSessionEditorForm />` inside the existing `Modal`. Edit path can stay in the panel **or** the form can take an optional `editing` record — planner choice, as long as schema/service are not duplicated.

---

### `src/components/patients/PatientEvaluationEditorForm.tsx` (component, CRUD)

**Analog:** `src/components/patients/PatientEvaluationPanel.tsx` lines 21–56 (FIELD_SECTIONS), 140–187 (form + submit), 220–270 (inline form)

**Imports pattern** (panel lines 1–18 — drop ConfirmDialog, PDF panel, list hooks):

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useActiveTherapists, useCreatePatientEvaluation } from '@/hooks/usePatients'
import { emptyEvaluationForm, evaluationFormSchema, type EvaluationFormData } from '@/schemas/evaluation.schema'
```

Move `FIELD_SECTIONS` with the form (panel lines 21–56) so both ficha and shortcut share section titles/rows. Leave `DETAIL_FIELDS` on the panel (list chrome).

**RHF** (panel lines 140–143):

```tsx
const form = useForm<EvaluationFormData>({
  resolver: zodResolver(evaluationFormSchema),
  defaultValues: emptyEvaluationForm(),
})
```

**Submit** (panel lines 162–187) — create-only on shortcut; ficha keeps `editing` branch:

```tsx
function onSubmit(values: EvaluationFormData) {
  const therapist = therapists.find((item) => item.id === values.therapistId)
  const input = {
    performedOn: values.performedOn,
    mainComplaint: values.mainComplaint,
    anamnesis: values.anamnesis,
    history: values.history,
    pain: values.pain,
    limitations: values.limitations,
    goals: values.goals,
    physicalExam: values.physicalExam,
    tests: values.tests,
    measurements: values.measurements,
    physioDiagnosis: values.physioDiagnosis,
    plan: values.plan,
    therapistId: therapist?.id ?? null,
    therapistName: therapist?.fullName ?? null,
  }

  createEvaluation.mutate(input, { onSuccess: closeEditor })
}
```

**Form fields** (panel lines 231–268) — copy the date + profissional grid and `FIELD_SECTIONS.map` Textareas. Do **not** copy the inner `<h3>Nova avaliação</h3>` on the dashboard path (Modal title owns that). Ficha inline chrome may keep the heading (panel lines 221–229).

**Dashboard wraps in Modal `wide`.** Ficha stays inline (`form className="space-y-5 rounded-2xl border border-line bg-surface p-5"`). That split is why extraction is required — evaluation is **not** already a Modal.

**Do not call** `usePatientEvaluations` from this form (panel line 115). Shortcut must not fetch the evaluation list or mount `PatientPhysicalEvaluationPanel`.

---

### `src/components/patients/PatientEvolutionsPanel.tsx` (component, CRUD)

**Analog:** self

After extract: list + `Modal` wrapping `PatientSessionEditorForm` with `cancelLabel="Cancelar"` / `submitLabel="Salvar"`. Keep `canWrite` hide (lines 175–179, 211–233) — never disabled pencils. Keep ConfirmDialog (lines 374–387). Keep `usePatientSessions` (line 53).

---

### `src/components/patients/PatientEvaluationPanel.tsx` (component, CRUD)

**Analog:** self

After extract: list + chips + PDF `details` (lines 367–380) + ConfirmDialog. Inline create still uses `canWrite && editorOpen` (lines 220–270) wrapping `PatientEvaluationEditorForm`. Do not change `canWrite = true` default (line 113) beyond existing ficha usage — PatientPage already passes real `canWrite` (lines 507, 554–557).

---

### `src/lib/dashboardShortcut.ts` (utility, transform)

**Analog:** `src/lib/accountAccess.ts` (pure named exports, Portuguese domain, `can*` helpers)

**File header / export style** (`src/lib/accountAccess.ts` lines 1–32):

```typescript
/**
 * Predicados de UX para tipo de conta e ficha (REQ-15).
 * Não são autorização: RLS (plano 03-02) é a autoridade (ASVS 4.1.1 / T-03-01).
 * Não importar permissions.ts da confeitaria.
 */

export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}
```

New helpers: `writablePatients`, `filterPatientsByName` (`toLocaleLowerCase('pt-BR')`), `PATIENT_SEARCH_THRESHOLD = 8`, `patientFichaPath(id, 'evolucoes' | 'avaliacao')` matching PatientPage tabs.

**Deep-link contract** (`src/pages/PatientPage.tsx` lines 444–452):

```tsx
const aba = searchParams.get('aba')
const tab: PatientTab =
  aba === 'cadastro'
    ? 'cadastro'
    : aba === 'evolucoes'
      ? 'evolucoes'
      : aba === 'avaliacao'
        ? 'avaliacao'
        : 'resumo'
```

Href must be `/pacientes/${id}?aba=evolucoes` or `?aba=avaliacao` — **not** `evolucao` / `avaliacoes`.

**Safe path check for toast Link** (`src/lib/security/index.ts` lines 20–47) — `isSafeInternalPath` already accepts `/pacientes/:id?aba=evolucoes` (starts with `/`, no `://`). Build href **only** via `patientFichaPath`. Do not use `window.location`.

Single quotes, no semicolons, `import type { PatientListItem }`.

---

### `src/hooks/usePatients.ts` (hook, CRUD)

**Analog:** self — extend **create** hooks only

**Shared error + invalidation** (lines 39–50):

```typescript
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
}
```

Keep `invalidatePatient` as-is so dashboard metrics refresh after shortcut save (`['patients']` + `['calendar-sessions']`).

**Create session today** (lines 193–203):

```typescript
export function useCreatePatientSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientSessionInput) => createPatientSession(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Sessão salva', 'success')
    },
    onError,
  })
}
```

**Create evaluation today** (lines 246–256) — same shape, `'Avaliação salva'`.

Add optional third-arg-style options `{ action?: ToastAction; errorMessage?: string }` on **these two hooks only**. Existing ficha callers stay `useCreatePatientSession(patientId)`. Shortcut passes `action: { label: 'Ver ficha', href: patientFichaPath(...) }` and UI-SPEC error copy. Do **not** change update/delete hooks.

TanStack v5: hook `onSuccess` runs **before** `mutate({ onSuccess })`. One toast in the hook; overlay close in mutate.

---

### `src/stores/toast.store.ts` (store, event-driven)

**Analog:** self (lines 1–33)

```typescript
import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info') => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, tone }],
    }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4200)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string, tone: ToastTone = 'info') {
  useToastStore.getState().push(message, tone)
}
```

Extend `ToastItem` with optional `action?: { label: string; href: string }`. Keep `toast(message, tone)` valid. Duration: `options?.action ? 6000 : 4200`. Cap still `slice(-4)`. Do **not** add sonner / react-hot-toast.

---

### `src/components/ui/ToastViewport.tsx` (component, event-driven)

**Analog:** self (lines 1–39) + `src/App.tsx` lines 14–17 (`ToastViewport` already inside `BrowserRouter`, so `Link` from `react-router-dom` is valid)

```tsx
import { useToastStore } from '@/stores/toast.store'

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore()
  // ...
  <div className="pointer-events-none fixed bottom-24 right-4 z-[80] ...">
    <div ... role="status">
      <div className="flex items-start justify-between gap-3">
        <p>{item.message}</p>
        <button type="button" className="text-xs opacity-60 hover:opacity-100" onClick={() => dismiss(item.id)}>
          Fechar
        </button>
      </div>
    </div>
  </div>
}
```

Insert **Ver ficha** between message and Fechar: `Link` + `text-sm font-semibold text-forest`, `onClick={() => dismiss(item.id)}`, only if `isSafeInternalPath(item.action.href)`. Keep `role="status"`, `z-[80]`, `toneStyles`, `[...].join(' ')`. Do not restyle radius/padding.

---

### `src/components/ui/Modal.tsx` (component, request-response)

**Analog:** self (lines 13–64)

Escape + body overflow (lines 14–25) already match UI-SPEC — keep. Backdrop already has `aria-label="Fechar"` (lines 31–36). The **X is unlabeled** (lines 53–59):

```tsx
<button
  type="button"
  onClick={onClose}
  className="rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
>
  <X size={18} />
</button>
```

Add `aria-label="Fechar"` and `flex min-h-11 min-w-11 items-center justify-center` (44×44). Do **not** change `p-6`, `rounded-3xl`, `z-[70]`, or `wide ? 'max-w-3xl' : 'max-w-lg'`. This shared fix also covers Pacientes “Novo paciente”.

`TeamPage.tsx` line 91 already uses `min-h-11 min-w-11` + `aria-label` on an icon-adjacent button — copy that hit-area habit.

---

### `src/lib/dashboardShortcut.test.ts` / `src/stores/toast.store.test.ts` (test)

**Analog:** none in repo. If planner adds Vitest, copy the **prescribed** suite shape from `.planning/codebase/TESTING.md` lines 73–94:

```typescript
import { describe, it, expect } from 'vitest'
import { canWritePatient, normalizeJoinCode } from '@/lib/accountAccess'

describe('canWritePatient', () => {
  it('allows only the creator', () => {
    expect(canWritePatient('user-1', 'user-1')).toBe(true)
    expect(canWritePatient('user-1', 'user-2')).toBe(false)
    expect(canWritePatient(undefined, 'user-1')).toBe(false)
  })
})
```

Colocate `*.test.ts`. One `describe` per export. Prefer pure helpers; skip Testing Library / Playwright this phase. If Vitest is skipped: typecheck + lint + browser overlay QA only.

## Shared Patterns

### Authentication / write UX
**Source:** `src/lib/accountAccess.ts` lines 27–32; `src/pages/PatientPage.tsx` lines 507, 551–557; `src/hooks/useAuth.ts` lines 17–22
**Apply to:** picker + editor open in `DashboardClinicalShortcut.tsx`

```typescript
export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}
```

RLS remains authority. Hide teammate rows; do not disable them. Anyone already on `/painel` sees header buttons (pending fisio never reaches the page).

### Hide, don’t disable
**Source:** `PatientEvolutionsPanel.tsx` lines 175–179; CONVENTIONS / Phase 3 D-07
**Apply to:** picker rows, shortcut create-only chrome

```tsx
{canWrite ? (
  <Button type="button" onClick={() => { setEditing(null); setEditorOpen(true) }}>
    <Plus size={16} />
    Nova sessão
  </Button>
) : null}
```

### Error handling (mutations)
**Source:** `src/hooks/usePatients.ts` lines 39–41, 193–202
**Apply to:** create session/evaluation

```typescript
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

Shortcut overrides copy via hook `errorMessage`. Form stays open on error (`mutate` has no close-on-error). Ficha keeps `error.message`.

### Validation
**Source:** panels + `sessionFormSchema` / `evaluationFormSchema`
**Apply to:** extracted forms only — `useForm` + `zodResolver`. No ad-hoc ifs except therapist lookup `setError` on session submit (panel lines 129–133).

### Toast + Link
**Source:** `toast.store.ts`; `App.tsx` lines 14–17; `src/lib/security/index.ts` `isSafeInternalPath`
**Apply to:** D-03 Ver ficha. Import `Link` from `react-router-dom`, same as DashboardPage line 2.

### Query invalidation
**Source:** `invalidatePatient` in `usePatients.ts` lines 43–50
**Apply to:** unchanged after shortcut save so `/painel` cards refresh. Do not add new query keys.

### UI composition
**Source:** `Button.tsx`, `Modal.tsx`, `Input.tsx`, `PageHeader.tsx`
**Apply to:** all new chrome. `[...].join(' ')`, named exports, single quotes, no semicolons, 2-space. Portuguese copy from UI-SPEC.

### In-modal loading / error
**Source:** `DashboardPage.tsx` 339–348; `PatientEvaluationPanel.tsx` 208–217
**Apply to:** picker states. Empty lists stay empty (no fake patients).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/dashboardShortcut.test.ts` | test | transform | No `*.test.ts` in the repo. Use TESTING.md Vitest template if Wave 0 is added. |
| `src/stores/toast.store.test.ts` | test | event-driven | Same. Needs fake timers for 4200 vs 6000 ms. |

No existing two-step overlay wizard. Closest composition is PatientsPage Modal + patient rows + EvolutionsPanel create form. Planner should **not** copy:

- `src/pages/CalendarPage.tsx` session create (`useCreateSession` / `FormEvent` / unfiltered patient `<Select>`) — parallel CRUD, no evolução fields, no `canWritePatient`
- `src/components/layout/GlobalSearch.tsx` — bakery search, different tokens, ILIKE
- `src/components/dashboard/SalesChart.tsx` — bakery
- Mounting full ficha panels on `/painel`

## Metadata

**Analog search scope:** `src/pages/`, `src/components/patients/`, `src/components/ui/`, `src/hooks/`, `src/stores/`, `src/lib/`, `src/schemas/`, `src/types/`, `.planning/codebase/`
**Files scanned:** 88 `src/**/*.{ts,tsx}` (Glob); 0 existing `*.test.ts`
**Pattern extraction date:** 2026-09-14
