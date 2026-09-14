---
phase: 04-atalhos-dashboard
reviewed: 2026-09-14T14:53:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/components/patients/DashboardClinicalShortcut.tsx
  - src/components/patients/PatientEvaluationEditorForm.tsx
  - src/components/patients/PatientEvaluationPanel.tsx
  - src/components/patients/PatientEvolutionsPanel.tsx
  - src/components/patients/PatientSessionEditorForm.tsx
  - src/components/ui/Modal.tsx
  - src/components/ui/ToastViewport.tsx
  - src/hooks/usePatients.ts
  - src/lib/dashboardShortcut.ts
  - src/pages/DashboardPage.tsx
  - src/stores/toast.store.ts
findings:
  critical: 2
  warning: 6
  info: 2
  total: 10
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-14T14:53:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the dashboard clinical shortcuts (picker + create overlays), the extracted session/evaluation editors, toast action wiring, and Modal close behavior. The picker filter, `patientFichaPath` tab values, and `isSafeInternalPath` guard on **Ver ficha** are sound. Two ship-blocking defects remain: closing the editor while a mutation is in flight still persists the record (and drops toast + cache invalidation), and `PatientSessionEditorForm` full-resets whenever the therapist query identity changes, wiping in-progress clinical notes.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Dismissing the editor during save still writes the record

**File:** `src/components/patients/DashboardClinicalShortcut.tsx:50-53,177-213`
**Also:** `src/components/ui/Modal.tsx:14-36,53-60`, `src/components/patients/PatientSessionEditorForm.tsx:159,256-258`, `src/components/patients/PatientEvaluationEditorForm.tsx:152,197-199`, `src/components/patients/PatientEvolutionsPanel.tsx:133-147`, `src/hooks/usePatients.ts:200-213,265-278`

**Issue:** Cancel is disabled while `saving` is true, but Modal X, backdrop, and Escape always call `onClose`. `closeShortcut` / `closeEditor` unmount the form that owns `useCreatePatientSession` / `useCreatePatientEvaluation`. The request is not aborted.

TanStack Query v5 ties `useMutation` `onSuccess` / `onError` to the observer lifecycle. After unmount:

- The insert can still commit (session or evaluation).
- Hook `onSuccess` does **not** run: no **Sessão salva** / **Avaliação salva** toast, no **Ver ficha**, no `invalidatePatient` (dashboard metrics stay stale).
- Hook `onError` does **not** run either, so a failed save after dismiss is silent.

The user believes D-02 (cancel = no write, no toast). They can click the shortcut again and create a duplicate. The same unmount happens on the ficha: `PatientEvolutionsPanel` sets `editorOpen` to false, Modal returns `null`, and the form unmounts mid-mutation.

**Fix:** Ignore close while the mutation is pending, and keep the observer mounted until settle. Minimal Modal API:

```tsx
// Modal.tsx — do not subscribe Escape/backdrop when disableClose
export function Modal({ open, onClose, disableClose = false, ... }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !disableClose) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, disableClose])
  // backdrop + X: if (disableClose) return; onClose()
}
```

Lift `saving` (or `onBusyChange`) to `DashboardClinicalShortcut` / the panels and pass `disableClose={saving}`. Alternatively hoist the create mutations into the parent that stays mounted so toast + invalidation still run if the overlay is dismissed.

### CR-02: Session form `reset()` runs on every `therapists` identity change

**File:** `src/components/patients/PatientSessionEditorForm.tsx:90-120`

**Issue:** The initialize effect depends on `[editing, form, therapists]`. `listActiveTherapists` always `.map()`s a new array, so React Query structural sharing does not keep the reference stable across refetch (`staleTime` 120s + default `refetchOnWindowFocus`).

Consequences:

1. First paint often has `therapists = []`, then data arrives and the effect **wipes** mode, datetime, and any clinical fields already typed under **Realizada**.
2. After two minutes, a window focus refetch resets a long in-progress evolução back to **Agendar** with empty notes.
3. Create path forces `therapistId: therapists[0]?.id` (alphabetical `full_name` across **all** active profiles). The logged-in professional is not preferred; a colleague can be attributed by default.

**Fix:** Reset only when the record identity changes. Do not put the therapists array in that effect. Leave `therapistId` empty until the user picks one (schema already requires a UUID):

```tsx
useEffect(() => {
  if (editing) {
    form.reset({
      mode: editing.status === 'realizada' ? 'realizada' : 'agendar',
      scheduledAt: toDatetimeLocalValue(editing.scheduledAt),
      sessionType: editing.type,
      place: editing.place === '—' ? '' : editing.place,
      therapistId: editing.therapistId ?? '',
      patientState: editing.evolution?.patientState ?? '',
      changesSinceLast: editing.evolution?.changesSinceLast ?? '',
      conducts: editing.evolution?.conducts ?? '',
      treatmentResponse: editing.evolution?.treatmentResponse ?? '',
      incidents: editing.evolution?.incidents ?? '',
      nextPlan: editing.evolution?.nextPlan ?? '',
    })
    return
  }
  form.reset({
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
  })
}, [editing?.id, form])
```

## Warnings

### WR-01: Evaluation default date uses UTC calendar day

**File:** `src/components/patients/PatientEvaluationEditorForm.tsx:114,122`

**Issue:** `emptyEvaluationForm()` sets `performedOn` via `new Date().toISOString().slice(0, 10)`. In America/Sao_Paulo (UTC−3), after 21:00 local the ISO date is the **next** day. The dashboard shortcut and ficha create flow can persist an evaluation dated tomorrow if the user does not notice the date input.

**Fix:** Compute the local `YYYY-MM-DD` in the form (or in `emptyEvaluationForm`):

```ts
function localISODate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
```

### WR-02: Invalid `datetime-local` value throws before the mutation

**File:** `src/components/patients/PatientSessionEditorForm.tsx:24-26,129-131`

**Issue:** Zod only requires `scheduledAt` to be a non-empty string. `fromDatetimeLocalValue` calls `new Date(value).toISOString()`. An Invalid Date throws `RangeError` inside `onSubmit`. The mutation never runs, `onError` never toasts, and the overlay stays open with no field error (spec: save failure should toast **Não foi possível salvar…**).

**Fix:**

```ts
function fromDatetimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Informe data e horário válidos')
  }
  return date.toISOString()
}
```

Better: validate in the schema (`z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), …)`) and `setError('scheduledAt', …)` instead of throwing.

### WR-03: Patient name filter is not accent-insensitive

**File:** `src/lib/dashboardShortcut.ts:28-37`

**Issue:** Filter lowercases with `pt-BR` but does not fold diacritics. Needle `jose` does not match `José`; `joao` does not match `João`. UI-SPEC asks for case-insensitive name search; for pt-BR names this misses rows the user can see.

**Fix:**

```ts
function foldPt(value: string) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '')
}

export function filterPatientsByName(patients: PatientListItem[], query: string) {
  const needle = foldPt(query.trim())
  if (!needle) return patients
  return patients.filter((patient) => foldPt(patient.name).includes(needle))
}
```

### WR-04: Session list fetch errors render as an empty state

**File:** `src/components/patients/PatientEvolutionsPanel.tsx:27,55-63`

**Issue:** `usePatientSessions` exposes `isError`, but the panel only branches on `isLoading`. A failed query uses `sessions = []` and shows **Nenhuma sessão registrada.** The evaluation panel in the same phase correctly shows an error article. Users may create a duplicate sessão thinking none exist.

**Fix:** Mirror `PatientEvaluationPanel`:

```tsx
const { data: sessions = [], isLoading, isError } = usePatientSessions(patientId)

{isError ? (
  <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
    Não foi possível carregar as sessões. Tente de novo em instantes.
  </article>
) : null}
```

Do not render the empty well or the list when `isError`.

### WR-05: Shared `onError` toasts raw PostgREST messages

**File:** `src/hooks/usePatients.ts:39-41,208-213,273-278,231-233,294-296`

**Issue:** `throwIfError` in the services throws `new Error(error.message)`. Create hooks only mask that when `toastOptions.errorMessage` is passed (dashboard). Ficha creates, all updates, and deletes still `toast(error.message)`. PostgREST/RLS text can leak schema/policy details and is a worse UX than `mapDbError`.

**Fix:** Route every mutation through a mapper:

```ts
function onError(error: unknown) {
  toast(error instanceof Error ? mapDbError({ message: error.message }) : 'Erro inesperado', 'error')
}
```

Keep the dashboard `errorMessage` override for REQ-16 copy, but use `mapDbError` as the default.

### WR-06: Modal close effect depends on an unstable `onClose`

**File:** `src/components/ui/Modal.tsx:14-25`
**Also:** `src/components/patients/DashboardClinicalShortcut.tsx:50-53`

**Issue:** The overflow-lock effect lists `onClose` as a dependency. `closeShortcut` / `closeEditor` are recreated every render. Each parent re-render (patients/sessions query update, weekOffset, etc.) runs cleanup: `document.body.style.overflow = ''`, then locks again. Body scroll can flash behind the overlay; Escape is briefly unsubscribed.

**Fix:** Keep `disableClose` from CR-01, and stabilize the callback:

```tsx
const onCloseRef = useRef(onClose)
onCloseRef.current = onClose
useEffect(() => {
  if (!open) return
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && !disableClose) onCloseRef.current()
  }
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
  return () => {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
  }
}, [open, disableClose])
```

In the shortcut, `useCallback` on `closeShortcut` is still worth doing.

## Info

### IN-01: `patientFichaPath` interpolates `patientId` raw

**File:** `src/lib/dashboardShortcut.ts:43-45`

**Issue:** IDs are UUIDs today, and `ToastViewport` rejects non-internal hrefs. Still, a malformed id with `?` / `#` would break the ficha link.

**Fix:** `return `/pacientes/${encodeURIComponent(patientId)}?aba=${aba}``

### IN-02: Toast auto-dismiss timeouts are never cleared

**File:** `src/stores/toast.store.ts:25-34`

**Issue:** `dismiss` does not `clearTimeout`. Harmless for Zustand (filter by id is a no-op), but stacked timers remain until they fire.

**Fix:** Store the timer id on `ToastItem` and clear it in `dismiss` / when the slot is evicted by `slice(-4)`.

---

_Reviewed: 2026-09-14T14:53:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
