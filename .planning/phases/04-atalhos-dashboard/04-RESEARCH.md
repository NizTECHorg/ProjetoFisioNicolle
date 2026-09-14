# Phase 4: Atalhos no dashboard - Research

**Researched:** 2026-09-14
**Domain:** Clinic SPA overlay wizard (dashboard shortcuts → existing session/evaluation editors) + toast action
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Depois de salvar
- **D-01:** Ao salvar, a pessoa **volta ao dashboard**, com toast de sucesso. O atalho existe para não entrar na ficha.
- **D-02:** Cancelar o formulário **fecha tudo** e volta ao dashboard — mesmo destino do salvar. Não volta à escolha do paciente.
- **D-03:** O toast inclui **“Ver ficha”**: um clique navega para `/pacientes/:id` na aba certa (`?aba=evolucoes` ou `?aba=avaliacao`).
- **D-04:** Para registrar outro paciente, **clica de novo no atalho** do dashboard. Sem “Salvar e registrar outra”. O fluxo fecha; o próximo começa do zero.

### Claude's Discretion
- **Destino do formulário:** D-01/D-02 exigem overlay no `/painel` (picker + form). Não navegar para a ficha no meio do atalho — a ficha só entra pelo “Ver ficha” do toast (D-03).
- **Reuso:** não criar segundo CRUD. Reutilizar o editor de `PatientEvolutionsPanel` / `PatientEvaluationPanel` (hoje já são `Modal`). Na ficha, evolução vive na sessão: o botão é “Nova sessão” (Agendar / Realizada, campos clínicos só em Realizada). O atalho “Nova evolução” abre esse mesmo editor de sessão+evolução; “Nova avaliação” abre o editor de avaliação. Planner escolhe *como* extrair/acionar o editor (prop de auto-abrir vs montar o painel no modal) sem duplicar schema/serviço.
- **Escolha do paciente:** seletor no overlay, a partir de `usePatients`. Só pacientes que `canWritePatient` permite (Phase 3 D-05/D-07). Empresa **não** vê fichas de colega no picker — esconder, não desabilitar. Busca por nome se a lista for longa; padrão `Modal` + `Input`/`Select` existentes.
- **Lista vazia:** atalhos visíveis mesmo sem pacientes; o picker explica e aponta para `/pacientes`. Não esconder os botões.
- **Onde ficam os botões:** ações no header do dashboard (`Nova evolução` / `Nova avaliação`) com `Button` existente. UI-SPEC pode ajustar layout; não substituir os quatro cards de métrica.
- **Erro ao salvar:** o formulário permanece aberto (só sucesso/cancelamento fecham). Toast de erro no padrão atual.
- **Toast “Ver ficha”:** estender o toast atual se precisar de ação/link; não inventar um segundo sistema de notificação.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-16 | No dashboard, o profissional inicia evolução ou avaliação sem abrir a ficha primeiro. Os botões levam ao fluxo já existente, escolhendo o paciente. | Overlay wizard on `/painel`; extract create forms from existing panels; picker filtered by `canWritePatient`; reuse `useCreatePatientSession` / `useCreatePatientEvaluation`. |
| REQ-16 acceptance 1 | Dashboard shows visible actions to create evolução and avaliação. | `PageHeader` `action` slot: primary **Nova evolução**, secondary **Nova avaliação**. Buttons stay visible during dashboard load/error/empty. |
| REQ-16 acceptance 2 | Each action asks for the patient and opens the existing form — not a second CRUD. | Picker Modal → existing Nova sessão / Nova avaliação fields. Evolution “sessão” is the Agendar/Realizada toggle inside that form, not a second picker. |
| REQ-16 acceptance 3 | Who cannot write the ficha (empresa consulting a colleague) cannot create via these shortcuts. | Picker omits rows where `canWritePatient(user.id, patient.createdBy)` is false. RLS remains authority. |
| REQ-16 acceptance 4 | Autônomo, empresa (own fichas), and active fisioterapeuta use the shortcuts. | Anyone who can see `/painel` sees the buttons. Writable patients only in the picker. Pending fisio never reaches `/painel` (Phase 3). |
</phase_requirements>

## Summary

Phase 4 is a **client-only overlay** on the existing clinic dashboard (`/painel`). It does not add tables, RPCs, routes, or a parallel CRUD. The professional clicks **Nova evolução** or **Nova avaliação** in the dashboard header, picks a patient they can write, fills the **same** session or evaluation form already used on the ficha, then lands back on `/painel` with one success toast that can open the ficha tab.

The session editor already lives in a `Modal`. The evaluation editor currently **inlines** on the ficha (not a Modal). The dashboard must wrap the extracted evaluation fields in `Modal wide` so the URL never leaves `/painel` (D-01/D-02). Do not mount the full panels: they render lists, edit/delete, ConfirmDialog, and PDF import — all forbidden on the shortcut path by the approved UI-SPEC.

**Primary recommendation:** Extract the create-form bodies from `PatientEvolutionsPanel` and `PatientEvaluationPanel` into shared form components. Drive a two-step wizard (`picker` → `editor`) from a dashboard-owned component. Extend the existing Zustand toast with an optional `{ label, href }` action. Add `aria-label="Fechar"` on the shared Modal X. Install **no** new runtime packages. Do **not** `supabase db push` and do **not** paste SQL.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Header shortcut buttons | Browser / Client | — | Compose `PageHeader` + `Button` on `DashboardPage`. Visible to anyone already on `/painel`. |
| Patient picker overlay | Browser / Client | — | Filter the already-loaded `usePatients` list with `canWritePatient`. No extra fetch. |
| Session/evaluation create form | Browser / Client | API / Backend | Same Zod + RHF editors. Submit goes through existing hooks → services → Supabase. |
| Persist session / evaluation | Database / Storage | API / Backend | Existing `patient_sessions` / `patient_session_evolutions` / `patient_evaluations` + RLS. No new tables. |
| Authorization (who may write) | Database / Storage | Browser / Client | RLS is authority. `canWritePatient` is UX-only (Phase 3 D-05/D-07). |
| Stay on `/painel` after save/cancel | Browser / Client | — | Wizard state is React `useState`. URL stays `/painel`. |
| Toast “Ver ficha” | Browser / Client | Frontend Server (SSR) N/A | Extend Zustand toast + `Link` from `react-router-dom`. No SSR in this SPA. |
| Ficha tab deep-link | Browser / Client | — | Existing `PatientPage` `?aba=evolucoes\|avaliacao`. |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` is **absent** in this repo. Treat these tracked sources with the same authority as locked decisions:

- **Layers:** page → hooks → services → Supabase. Pages/components do not call `supabase`. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md`]
- **Clinic gating:** `src/lib/accountAccess.ts` only. Do not import bakery `src/lib/permissions.ts` or `FinancePage` / `SalesChart`. [VERIFIED: ARCHITECTURE.md, CONCERNS.md]
- **Hide, don’t disable** write controls that look tappable (Phase 3 D-07). [VERIFIED: CONVENTIONS.md, STATE.md]
- **SQL apply path:** hosted SQL Editor only. Do not recommend `supabase db push`. This phase has **no SQL**. [VERIFIED: ARCHITECTURE.md, STATE.md]
- **Style:** single quotes, no semicolons, 2-space, `[...].join(' ')` not `clsx`, named exports only, no barrels. [VERIFIED: CONVENTIONS.md]
- **Quality gates:** `npm run lint` and `npm run typecheck`. No test runner today. [VERIFIED: `package.json`, `.planning/codebase/TESTING.md`]
- **LGPD:** empty lists stay empty (no fake patients). Picker shows name (+ optional status), not clinical history. `PatientListItem` is already the enxuta list. [VERIFIED: `src/types/patient.ts`, PROJECT empty-state rule in CONVENTIONS]
- **Root `security.skill.md`:** do **not** change Supabase Auth/session storage this phase. Clinic already uses supabase-js persistSession (ARCHITECTURE). Apply only: no `dangerouslySetInnerHTML`, validate toast href as an internal path, keep picker data minimized.

## Standard Stack

Reuse what is already installed. **Do not add runtime packages.** Do not add shadcn, sonner, react-hot-toast, focus-trap, headless-ui, or a command palette.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 (`^19.1.0`) | UI | Existing SPA. [VERIFIED: `.planning/codebase/STACK.md`] |
| react-router-dom | 7.18.1 (`^7.6.1`) | `Link` for **Ver ficha**; stay on `/painel` otherwise | Codebase imports `react-router-dom`, not `react-router`. `ToastViewport` already sits inside `BrowserRouter` in `src/App.tsx`. [VERIFIED: `src/App.tsx`, STACK.md] |
| @tanstack/react-query | 5.101.2 (`^5.76.1`) | `usePatients`, create session/evaluation mutations | Hook `onSuccess` toasts first; `mutate(..., { onSuccess })` closes the overlay second. [CITED: tanstack.com/query/latest/docs/framework/react/guides/mutations] |
| zustand | 5.0.14 (`^5.0.5`) | Toast store | Only client UI store; extend `ToastItem`, do not add a second notification lib. [VERIFIED: `src/stores/toast.store.ts`, STACK.md] |
| react-hook-form + @hookform/resolvers + zod | 7.81.0 / 5.4.0 / 3.25.76 | Existing session + evaluation forms | Do not duplicate schemas. [VERIFIED: STACK.md, `sessionFormSchema`, `evaluationFormSchema`] |
| lucide-react | 1.25.0 | `Plus` on header buttons; `Users` on empty picker | Already used. [VERIFIED: package.json, UI-SPEC] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing UI kit | local | `PageHeader`, `Button`, `Modal`, `Input`, `Select`, `Textarea`, `PatientAvatar`, `ToastViewport` | All new chrome. Do not restyle radius/padding/type size. |
| `canWritePatient` | local | UX filter for picker | Always. RLS still enforces writes. |
| `statusLabels` | `src/types/patient.ts` | Optional muted second line on picker rows | UI-SPEC allows status; **never** `Ficha de {nome}`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Overlay wizard on `/painel` | Navigate to `/pacientes/:id?aba=…&criar=1` | Steel-man: fewer new files, reuses ficha chrome. **Rejected by D-01/D-02** — user must not enter the ficha until **Ver ficha**. |
| Mount full `PatientEvolutionsPanel` with `initialCreate` | Extract create form | Steel-man: one prop. **Rejected by UI-SPEC** — panel always loads the session list, pencils, trash, ConfirmDialog. Shortcut is create-only. |
| sonner / react-hot-toast | Extend Zustand toast | Extra package + second visual language. UI-SPEC forbids a second notification system. |
| focus-trap library | `ref.focus()` on search or first row | UI-SPEC: existing Modal Escape is enough; do not add a trap library. |
| New `/atalho` route | Overlay state | Would leave `/painel` or add a route. Locked: URL stays `/painel`. |

**Installation:**

```bash
# None for the feature. Do not npm install.
```

**Version verification:** Versions above are from `.planning/codebase/STACK.md` (analysis 2026-09-14) cross-checked with `package.json`. No new registry packages for implementation.

## Package Legitimacy Audit

> This phase **does not install external packages** for the product feature.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | No install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

Wave 0 tests (Nyquist): if the planner adds a runner, follow `.planning/codebase/TESTING.md` (Vitest, colocated `*.test.ts`, no Jest). That install is **not** required to ship the overlay. Do not add Playwright this phase.

*slopcheck was not run because no packages are recommended for install.*

## Architecture Patterns

### System Architecture Diagram

```text
[User on /painel]
        |
        | click Nova evolução | Nova avaliação
        v
[PageHeader actions] ---- stay visible even if dashboard body is loading/error
        |
        v
[Wizard state: closed | picker | editor]     URL remains /painel
        |
        | open picker (Modal default width)
        v
[usePatients cache] --> filter canWritePatient(viewerId, createdBy)
        |
        +-- loading --> spinner min-h-32
        +-- error   --> in-modal error article
        +-- 0 writable --> empty + Button "Ir para pacientes" --> close + navigate /pacientes
        +-- N writable --> optional search (>=8) --> row click
        |
        | replace picker (do not stack modals)
        v
[Editor Modal wide]
        |
        +-- evolução --> PatientSessionEditorForm (sessionFormSchema, Agendar/Realizada)
        |                 useCreatePatientSession(patientId, { successAction })
        +-- avaliação --> PatientEvaluationEditorForm (evaluationFormSchema)
                          useCreatePatientEvaluation(patientId, { successAction })
        |
        +-- Voltar ao dashboard / X / backdrop / Escape --> close entire wizard, no toast
        +-- save error --> stay open, one error toast
        +-- save success --> close wizard, stay /painel
                |
                v
        [toast store]  "Sessão salva" | "Avaliação salva"
                |      action: Ver ficha -> /pacientes/:id?aba=evolucoes|avaliacao
                v
        [ToastViewport z-80]  Link + Fechar
                |
                | click Ver ficha
                v
        [PatientPage] already reads ?aba=
```

### Recommended Project Structure

```
src/
├── pages/DashboardPage.tsx                 # PageHeader actions + mount wizard; do not grow metric cards
├── components/patients/
│   ├── DashboardClinicalShortcut.tsx       # wizard state, picker Modal, editor Modal chrome
│   ├── PatientSessionEditorForm.tsx        # extracted from PatientEvolutionsPanel (ficha + shortcut)
│   ├── PatientEvaluationEditorForm.tsx     # extracted from PatientEvaluationPanel (ficha + shortcut)
│   ├── PatientEvolutionsPanel.tsx          # list + Modal wrapping SessionEditorForm
│   └── PatientEvaluationPanel.tsx          # list + inline wrapping EvaluationEditorForm
├── lib/dashboardShortcut.ts                # writable filter, name filter, patientFichaPath
├── hooks/usePatients.ts                    # optional successAction / errorMessage on create session + evaluation only
├── stores/toast.store.ts                   # ToastItem.action + duration 6000ms when action present
└── components/ui/
    ├── ToastViewport.tsx                   # Ver ficha Link
    └── Modal.tsx                           # aria-label="Fechar" on the X (and keep backdrop label)
```

Do **not** put clinic shortcut files in `src/components/dashboard/` — that folder currently holds bakery `SalesChart.tsx`. [VERIFIED: STRUCTURE.md]

### Pattern 1: Extract create forms (prescribed)

**What:** Move the session `<form>` (today inside `PatientEvolutionsPanel` Modal) and the evaluation `<form>` (today inlined in `PatientEvaluationPanel`) into dedicated components that accept chrome labels as props.

**When to use:** Always for this phase. Same Zod schema, same mutation hooks, different chrome (ficha vs shortcut).

**Props the planner should lock:**

```typescript
// Source: prescribed from UI-SPEC + existing panels (src/components/patients/PatientEvolutionsPanel.tsx)
interface SessionEditorFormProps {
  patientId: string
  cancelLabel: string          // ficha: 'Cancelar' · shortcut: 'Voltar ao dashboard'
  submitLabel: string          // ficha: 'Salvar' · shortcut: 'Salvar sessão'
  successAction?: ToastAction  // shortcut only
  errorMessage?: string        // shortcut: UI-SPEC save-error copy
  onCancel: () => void
  onSuccess: () => void
}
```

Ficha panels keep list/edit/delete/PDF. Shortcut mounts **only** the form inside `Modal wide`.

### Pattern 2: Wizard state machine (one overlay)

**What:** A single piece of React state on `/painel`. Never two Modals at once. Cancel/X/Escape on the editor does **not** return to the picker (D-02).

```typescript
// Source: 04-UI-SPEC.md Interaction Contract + D-01–D-04
type ShortcutKind = 'evolucao' | 'avaliacao'
type ShortcutState =
  | { step: 'closed' }
  | { step: 'picker'; kind: ShortcutKind }
  | { step: 'editor'; kind: ShortcutKind; patientId: string; patientName: string }

function closeShortcut(): ShortcutState {
  return { step: 'closed' }
}
```

Clicking the other header button while open: reset to picker for that kind (D-04 spirit — start from zero).

### Pattern 3: Attach toast action on the hook, not a second toast

**What:** `useCreatePatientSession` already toasts `'Sessão salva'`. UI-SPEC: attach **Ver ficha** to **that** toast.

TanStack Query v5 runs **hook** `onSuccess` first, then **`mutate` `onSuccess`**. [CITED: tanstack.com/query/latest/docs/framework/react/guides/mutations]

```typescript
// Source: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
mutate(input, {
  onSuccess: () => onSuccess(), // close overlay — fires SECOND
})
// Hook onSuccess already toasted — fires FIRST. Do not toast again here.
```

If `mutate({ onError })` is also used, **both** error handlers fire → **two error toasts**. Override copy via hook options, not a second `onError` in `mutate`.

### Anti-Patterns to Avoid

- **Navigate to the ficha mid-flow:** violates D-01/D-02.
- **Mount full panels on the dashboard:** lists, PDF import, ConfirmDialog leak onto the shortcut (UI-SPEC Screens 3–4).
- **Second CRUD / second schema:** duplicate `sessionFormSchema` or services.
- **Disable teammate rows:** Phase 3 D-07 / UI-SPEC — omit them.
- **Hide header buttons** when there are zero patients or dashboard is loading.
- **“Salvar e registrar outra”.**
- **Stack picker + editor Modals** (two `z-[70]` dialogs).
- **Toast the action from DashboardPage after the hook already toasted** — two banners.
- **Import bakery `FinancePage`, `SalesChart`, `permissions.ts`.**
- **Default `canWrite={true}` on a newly mounted panel for an arbitrary id** — CONCERNS.md already flags this. After picker, pass the chosen id and still re-check `canWritePatient` before opening the editor.
- **New SQL / `supabase db push`.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session/evaluation persistence | New service or table | `createPatientSession` / `createPatientEvaluation` | RLS, mapping, invalidation already exist. |
| Form validation | Ad-hoc ifs | `sessionFormSchema` / `evaluationFormSchema` | Clinical required fields (estado/condutas on Realizada; queixa on avaliação). |
| Notifications with a link | New toast library | `toast.store` + `ToastViewport` | UI-SPEC: extend data, not visual language. |
| Patient list for picker | New query | `usePatients` + `PatientListItem.createdBy` | Same cache as dashboard metrics. |
| Write authorization | Client-only allowlist | RLS + hide via `canWritePatient` | ASVS 4.1.1; Phase 3. |
| Focus trap | `focus-trap-react` | `useRef` + `.focus()` | UI-SPEC forbids a new library. |
| Open-redirect on Ver ficha | `window.location = href` | `Link to={patientFichaPath(...)}` after `isSafeInternalPath` | `safeRedirectPath` already exists. [VERIFIED: `src/lib/security/index.ts`] |
| Empty-state geometry | New card kit | Clone `/equipe` empty well (`h-12 w-12 rounded-2xl bg-accent-soft text-accent`, icon 22px) | UI-SPEC + `TeamPage.tsx`. |

**Key insight:** The hard part is **chrome and lifecycle** (stay on `/painel`, one toast with a link, create-only). The clinical write path is already done.

## Common Pitfalls

### Pitfall 1: Double toast on save
**What goes wrong:** Hook toasts “Sessão salva”; dashboard toasts again with **Ver ficha**.
**Why it happens:** TanStack Query v5 always runs both `useMutation.onSuccess` and `mutate.onSuccess`.
**How to avoid:** Optional `successAction` on `useCreatePatientSession` / `useCreatePatientEvaluation` only. `mutate.onSuccess` only closes the wizard.
**Warning signs:** Two stacked banners after save.

### Pitfall 2: Double error toast
**What goes wrong:** Shortcut wants UI-SPEC copy; hook already toasts `error.message`.
**Why it happens:** `mutate({ onError })` **also** runs after the hook `onError`.
**How to avoid:** Optional `errorMessage` on those two create hooks. Shortcut passes `Não foi possível salvar. Verifique os campos e tente de novo.` Ficha omits it (keeps service message — CONTEXT “padrão atual”).
**Warning signs:** Two error toasts; form still correctly stays open.

### Pitfall 3: Evaluation editor is not a Modal on the ficha
**What goes wrong:** Planner assumes `PatientEvaluationPanel` already overlays; dashboard inlines the form over the dashboard body.
**Why it happens:** Only sessions use `Modal`; evaluations swap the list for an inline `<form className="rounded-2xl border...">`.
**How to avoid:** Extract fields; dashboard wraps them in `Modal wide`. Ficha keeps inline chrome.
**Warning signs:** Saving an evaluation from `/painel` still shows dashboard cards behind an uncontained form.

### Pitfall 4: Mounting the full panel fetches lists and PDF
**What goes wrong:** Shortcut shows sessão list, Inicial/Posterior, “Importar avaliação de PDF (IA)”.
**Why it happens:** `usePatientSessions` / `usePatientEvaluations` run as soon as the panel mounts; PDF block is `canWrite && !editorOpen`.
**How to avoid:** Create-only form components. Do not call list queries from the shortcut.
**Warning signs:** Network tab shows `patient_evaluations` select when opening Nova avaliação from the dashboard.

### Pitfall 5: Empresa sees colleagues in the picker
**What goes wrong:** Acceptance 3 fails; write hits RLS `42501`.
**Why it happens:** `listPatients` returns colleague fichas for empresa (D-06). Dashboard metrics correctly use the full list.
**How to avoid:** Filter **only the picker** with `canWritePatient`. Do not JS-filter dashboard cards.
**Warning signs:** Row labeled like PatientsPage `Ficha de {nome}` — UI-SPEC forbids that line here; omit the row instead.

### Pitfall 6: Editor cancel returns to the picker
**What goes wrong:** Violates D-02.
**Why it happens:** Naive `step = step - 1` wizards.
**How to avoid:** Editor `onClose` → `{ step: 'closed' }`.
**Warning signs:** X on Nova sessão reopens “Escolha o paciente”.

### Pitfall 7: Modal X has no accessible name
**What goes wrong:** UI-SPEC: `aria-label="Fechar"` on the **X control itself**. Today only the backdrop has it; the X is an unlabeled `<button>`. [VERIFIED: `src/components/ui/Modal.tsx` lines 53–59]
**How to avoid:** Add `aria-label="Fechar"` on the X. Optionally `min-h-11 min-w-11` for 44×44 hit area (UI-SPEC spacing exception). Do not change Modal padding/radius.
**Warning signs:** axe/unlabeled-button on every overlay, including Pacientes “Novo paciente”.

### Pitfall 8: `?aba=` mismatch
**What goes wrong:** **Ver ficha** opens Resumo.
**Why it happens:** Wrong query (`evolucao` vs `evolucoes`, `avaliacoes` vs `avaliacao`).
**How to avoid:** Helper `patientFichaPath(id, 'evolucoes' | 'avaliacao')` matching `PatientPage` (`aba === 'evolucoes' | 'avaliacao'`). [VERIFIED: `src/pages/PatientPage.tsx` 444–452]
**Warning signs:** URL `/pacientes/:id?aba=evolucao`.

### Pitfall 9: REQ-05 SQL missing
**What goes wrong:** Avaliação save fails (table missing) while sessão works.
**Why it happens:** STATE.md still lists `patients-req05-evaluations.sql` as pending human apply. Out of this phase.
**How to avoid:** No new SQL. Keep form open + error toast. Do not block Phase 4 on that script.
**Warning signs:** Same error already possible on the ficha Avaliação tab.

### Pitfall 10: Toast href open redirect
**What goes wrong:** A future caller passes `action.href = 'https://evil'`.
**Why it happens:** Extending `toast()` with a free-form href.
**How to avoid:** Build href only via `patientFichaPath`. In `ToastViewport`, render `Link` only if `isSafeInternalPath(href)`. Do not use `window.location`.
**Warning signs:** `<a href="https://...">` in the toast.

## Code Examples

### Writable picker filter

```typescript
// Source: src/lib/accountAccess.ts + src/types/patient.ts PatientListItem.createdBy
import { canWritePatient } from '@/lib/accountAccess'
import type { PatientListItem } from '@/types/patient'

export function writablePatients(
  patients: PatientListItem[],
  viewerId: string | undefined,
): PatientListItem[] {
  return patients.filter((patient) => canWritePatient(viewerId, patient.createdBy))
}

export function filterPatientsByName(
  patients: PatientListItem[],
  query: string,
): PatientListItem[] {
  const needle = query.trim().toLocaleLowerCase('pt-BR')
  if (!needle) return patients
  return patients.filter((patient) => patient.name.toLocaleLowerCase('pt-BR').includes(needle))
}

export const PATIENT_SEARCH_THRESHOLD = 8

export function patientFichaPath(
  patientId: string,
  aba: 'evolucoes' | 'avaliacao',
): string {
  return `/pacientes/${patientId}?aba=${aba}`
}
```

### Toast with optional action (backward compatible)

```typescript
// Source: extend src/stores/toast.store.ts; duration rule from 04-UI-SPEC.md
export interface ToastAction {
  label: string
  href: string
}

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
  action?: ToastAction
}

export function toast(
  message: string,
  tone: ToastTone = 'info',
  options?: { action?: ToastAction },
) {
  useToastStore.getState().push(message, tone, options)
}

// push: durationMs = options?.action ? 6000 : 4200
// existing callers toast('…', 'success') stay valid
```

Existing success copy already matches UI-SPEC: `'Sessão salva'` / `'Avaliação salva'` in `usePatients.ts`. [VERIFIED]

### Hook option so the first toast carries Ver ficha

```typescript
// Source: src/hooks/usePatients.ts pattern + TanStack Query mutation callbacks
export function useCreatePatientSession(
  patientId: string,
  toastOptions?: { action?: ToastAction; errorMessage?: string },
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientSessionInput) => createPatientSession(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Sessão salva', 'success', toastOptions?.action ? { action: toastOptions.action } : undefined)
    },
    onError: (error: unknown) => {
      toast(
        toastOptions?.errorMessage
          ?? (error instanceof Error ? error.message : 'Erro inesperado'),
        'error',
      )
    },
  })
}
```

Same shape for `useCreatePatientEvaluation` with `'Avaliação salva'` and `?aba=avaliacao`.

### ToastViewport action row

```tsx
// Source: 04-UI-SPEC.md Screen 5 + src/components/ui/ToastViewport.tsx
import { Link } from 'react-router-dom'
import { isSafeInternalPath } from '@/lib/security'

// message (text-sm) | Ver ficha (text-sm font-semibold text-forest) | Fechar (text-xs opacity-60)
{item.action && isSafeInternalPath(item.action.href) ? (
  <Link
    to={item.action.href}
    className="text-sm font-semibold text-forest"
    onClick={() => dismiss(item.id)}
  >
    {item.action.label}
  </Link>
) : null}
```

Keep `role="status"` and `z-[80]`. Import `Link` from `react-router-dom` like the rest of the app, not from `react-router`. [CITED: reactrouter.com/start/declarative/navigating — use `Link` for user-initiated navigation; codebase convention is `react-router-dom`]

### Dashboard header (do not hide)

```tsx
// Source: src/pages/PatientsPage.tsx PageHeader action + 04-UI-SPEC.md Screen 1
<PageHeader
  className="dash-in"
  title="Dashboard"
  action={
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button type="button" onClick={() => openPicker('evolucao')}>
        <Plus size={16} />
        Nova evolução
      </Button>
      <Button type="button" variant="secondary" onClick={() => openPicker('avaliacao')}>
        <Plus size={16} />
        Nova avaliação
      </Button>
    </div>
  }
/>
```

`PageHeader` already sits **above** the dashboard loading/error branch. [VERIFIED: `DashboardPage.tsx` 337–349] Putting `action` there keeps buttons visible as required.

### Modal close control

```tsx
// Source: 04-UI-SPEC.md picker/editor close rules; current gap in src/components/ui/Modal.tsx
<button
  type="button"
  aria-label="Fechar"
  onClick={onClose}
  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
>
  <X size={18} />
</button>
```

This is a shared a11y fix (all Modals). Do not change `p-6`, `rounded-3xl`, or z-index.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Navigate into the ficha to create | Overlay wizard on the current page | This phase (locked D-01/D-02) | URL stays `/painel`; ficha is opt-in via toast |
| Inline evaluation form only | Same fields, Modal chrome on dashboard | Existing ficha vs UI-SPEC Screen 4 | Must extract, not copy |
| Toast = message + Fechar | Toast = message + optional Link + Fechar | This phase D-03 | Extend Zustand item; 6000ms when action present |
| shadcn / sonner toasts | In-house Zustand + Tailwind tokens | Project start | Do not introduce shadcn (`components.json` absent) |

**Deprecated/outdated:**
- Mounting bakery `src/components/dashboard/SalesChart.tsx` on `/painel`: leftover; clinic dashboard is custom. [VERIFIED: STRUCTURE.md]
- Treating `canWrite` default `true` as safe: CONCERNS.md; shortcut must re-check after pick.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UI-SPEC is the visual contract even though the file frontmatter still says `status: draft` / checker boxes unchecked — STATE.md records it approved. [ASSUMED alignment] | User Constraints / UI | Planner follows draft copy if a later UI FLAG appears. |
| A2 | Shortcut save-error **copy** uses UI-SPEC sentence; ficha keeps `error.message`. CONTEXT said “toast no padrão atual” meaning the Zustand system, not the exact string. [ASSUMED] | Pitfall 2 | User may want identical copy everywhere. |
| A3 | Ficha submit labels stay **Salvar**; overlay uses **Salvar sessão** / **Salvar avaliação**. [ASSUMED from UI-SPEC “create-only”] | Pattern 1 | User may want ficha labels updated too (out of REQ-16). |
| A4 | No Vitest install this phase unless the planner explicitly adds Wave 0 from TESTING.md. [ASSUMED] | Validation Architecture | Nyquist may require a runner; then follow TESTING.md, do not invent Jest. |

**If this table is empty:** n/a — four assumed items above need no extra user workshop if the planner follows UI-SPEC + TESTING.md.

## Open Questions

1. **REQ-05 SQL not applied in some environments**
   - What we know: STATE.md still lists `supabase/patients-req05-evaluations.sql` as pending. Avaliação create uses `patient_evaluations`. [VERIFIED: STATE.md, `evaluations.service.ts`]
   - What's unclear: whether the hosted project Artur uses already has the table.
   - Recommendation: do not add SQL this phase; shortcut surfaces the existing error toast and keeps the form open. Verification note only.

2. **Modal close hit area vs “do not restyle Modal”**
   - What we know: UI-SPEC forbids restyling padding/radius and also requires 44×44 icon-only close.
   - What's unclear: whether `min-h-11 min-w-11` counts as restyle.
   - Recommendation: add `aria-label` (required) + 44×44 hit area (spacing exception). Do not change dialog width/padding.

3. **Graph context**
   - What we know: `.planning/graphs/graph.json` is absent; graphify is disabled.
   - What's unclear: n/a
   - Recommendation: planner relies on this research + CONTEXT canonical files.

## Environment Availability

> Feature is code/config only. No new services.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | lint / typecheck / dev | ✓ | v26.4.0 (local probe 2026-09-14) | — |
| npm | scripts | ✓ | 12.0.2 | — |
| Existing `npm run dev` | Manual UI verify | ✓ (user terminal) | Vite 6 | — |
| Supabase CLI | schema push | not required | — | Do not use |
| Vitest / Playwright | automated UI tests | ✗ | — | `npm run typecheck` + `npm run lint` + manual overlay QA |
| slopcheck | package audit | not needed | — | No installs |

**Missing dependencies with no fallback:** none for the feature.

**Missing dependencies with fallback:** Vitest/Playwright — use lint/typecheck + manual browser pass (user rule: verify UI in the browser).

## Validation Architecture

`workflow.nyquist_validation` is **absent** in `.planning/config.json` → treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed. Quality gates: ESLint 9 + `tsc --noEmit`. If Wave 0 adds a runner: Vitest (TESTING.md) — do not add Jest. |
| Config file | none — see Wave 0 |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-16.1 | Header shows Nova evolução + Nova avaliação | manual / smoke | Browser on `/painel` | ❌ Wave 0 |
| REQ-16.2 | Picker then existing session/evaluation form; no second CRUD | manual | Overlay: pick patient, see Nova sessão / Nova avaliação fields | ❌ Wave 0 |
| REQ-16.2 | `patientFichaPath` query keys | unit | `npx vitest run src/lib/dashboardShortcut.test.ts` (only if Vitest added) | ❌ Wave 0 |
| REQ-16.3 | Picker omits non-writable patients | unit | `writablePatients` + `canWritePatient` cases | ❌ Wave 0 |
| REQ-16.4 | Buttons visible for autonomo / empresa / active fisio | manual | Three account types on `/painel`; empresa picker empty if only colleague fichas | ❌ Wave 0 |
| D-01 | Save closes overlay, URL `/painel`, one success toast | manual | Save sessão/avaliação from shortcut | ❌ |
| D-02 | Cancel/X/Escape closes all; no picker; no toast | manual | | ❌ |
| D-03 | Ver ficha → correct `?aba=` | unit + manual | `patientFichaPath` + click toast Link | ❌ Wave 0 |
| D-04 | No “Salvar e registrar outra”; reopen from header | manual | | ❌ |
| UI-SPEC | Search shown iff writable count ≥ 8 | unit | `PATIENT_SEARCH_THRESHOLD` | ❌ Wave 0 |
| ASVS V4 | RLS still blocks teammate write | manual / SQL Editor | Out of Vitest (TESTING.md: do not mock RLS) | n/a |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run lint`
- **Phase gate:** Full suite green + manual overlay pass on `/painel` before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/dashboardShortcut.ts` + `src/lib/dashboardShortcut.test.ts` — `writablePatients`, `filterPatientsByName`, `patientFichaPath` (REQ-16.3, D-03). Only if planner adds Vitest per TESTING.md; otherwise treat as manual + typecheck.
- [ ] `src/stores/toast.store.test.ts` — optional action, 6000ms vs 4200ms, existing `toast(msg, tone)` still works. Needs Vitest fake timers.
- [ ] Do **not** add Playwright this phase (TESTING.md: pages are Low / E2E later).
- [ ] Do **not** add Testing Library unless a `.test.tsx` is unavoidable. Prefer pure helpers.
- [ ] Framework install: none required. If adding Vitest: follow TESTING.md `vitest.config.ts` (`environment: 'node'`, `include: ['src/**/*.test.ts']`, alias `@`).

*(If planner skips Vitest: “Wave 0 test files skipped; gates remain typecheck + lint + browser verification.”)*

## Security Domain

`security_enforcement` is not set to `false` → included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing Supabase Auth / `ProtectedRoute`. Shortcuts only render on `/painel`. |
| V3 Session Management | no | No session/cookie changes. |
| V4 Access Control | yes | UX: `canWritePatient`. Authority: existing RLS on session/evaluation inserts. Re-check before opening editor. |
| V5 Input Validation | yes | Existing Zod `sessionFormSchema` / `evaluationFormSchema` + RHF. Client-side name filter only (no new ILIKE). |
| V6 Cryptography | no | No new crypto. |

### Known Threat Patterns for this overlay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Create on a colleague’s patient (IDOR) | Elevation of Privilege | Omit from picker; RLS denies insert; do not trust `canWrite` default true |
| Open redirect via toast href | Spoofing | `patientFichaPath` only; `isSafeInternalPath` before `Link` |
| XSS in patient name in picker/toast | Tampering | React text nodes; no `dangerouslySetInnerHTML` (none in `src/` today) |
| Extra clinical data in picker | Information Disclosure (LGPD) | Use `PatientListItem` name + optional `statusLabels`; no complaint/evolution text |
| Leaking PostgREST errors | Information Disclosure | Prefer `mapDbError` for new hook error paths; shortcut may override user-facing save error |
| Stacked auth-sensitive Modals | Elevation of Privilege | One overlay; closing does not leave a writable form bound to a stale id |

Client predicates can be skipped; **RLS must still reject** empresa writes on teammate `patient_id`. Do not add SQL this phase — policies already shipped in Phase 3.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/04-atalhos-dashboard/04-CONTEXT.md` — D-01–D-04, discretion, deferred
- `.planning/phases/04-atalhos-dashboard/04-UI-SPEC.md` — copy, screens, toast action, overlay rules
- `.planning/REQUIREMENTS.md` — REQ-16
- `.planning/ROADMAP.md` — Phase 4 success criteria
- `.planning/STATE.md` — UI-SPEC approved; REQ-05 SQL still pending
- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`, `STRUCTURE.md`, `STACK.md`, `TESTING.md`, `CONCERNS.md`
- `src/pages/DashboardPage.tsx`, `PatientPage.tsx`, `PatientEvolutionsPanel.tsx`, `PatientEvaluationPanel.tsx`
- `src/lib/accountAccess.ts`, `src/hooks/usePatients.ts`, `src/stores/toast.store.ts`
- `src/components/ui/PageHeader.tsx`, `Modal.tsx`, `Button.tsx`, `ToastViewport.tsx`, `Input.tsx`
- TanStack Query v5 Mutations — https://tanstack.com/query/latest/docs/framework/react/guides/mutations (hook vs mutate callbacks)
- React Router declarative navigating — https://reactrouter.com/start/declarative/navigating (`Link` for user clicks)

### Secondary (MEDIUM confidence)
- Phase 3 `03-CONTEXT.md` D-05/D-06/D-07 — empresa consulta colleague fichas; writes are creator-only
- `src/pages/TeamPage.tsx` empty-state icon well — geometry to clone
- `src/pages/PatientsPage.tsx` — `PageHeader` action pattern; `Ficha de {nome}` is **list** chrome, not picker chrome
- `src/lib/security/index.ts` — `isSafeInternalPath` accepts `/pacientes/:id?aba=evolucoes` (no `://`, starts with `/`)

### Tertiary (LOW confidence)
- Graphify — disabled; no `graph.json`
- Context7 / ctx7 CLI — not available in this environment
- UI-SPEC frontmatter still `draft` vs STATE “approved”

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse verified installed libraries; no new packages
- Architecture: HIGH — codebase + locked overlay/toast decisions; evaluation-not-a-Modal is verified in source
- Pitfalls: HIGH — TanStack double-callback documented; picker vs empresa list verified; Modal X unlabeled verified

**Research date:** 2026-09-14
**Valid until:** 2026-10-14 (stable SPA patterns; re-check if toast store or panels are refactored)

---

*Phase: 4-atalhos-dashboard*
*Researched: 2026-09-14*
