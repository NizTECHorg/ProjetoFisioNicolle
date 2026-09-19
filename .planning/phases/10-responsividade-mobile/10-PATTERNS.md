# Phase 10: Responsividade mobile - Pattern Map

**Mapped:** 2026-09-19
**Files analyzed:** 28
**Analogs found:** 28 / 28

Honor CONTEXT D-01–D-06 over RESEARCH discretion: clinical routes only; Tailwind `sm`/`md`/`lg` only; no bakery orphans; no Phase 8/9 plan edits; `lg` shell must not regress.

This phase is **audit-and-patch** — every target file already exists. Analogs are the **canonical in-repo pattern to copy into the hotspot**, not greenfield templates.

**Do not invent:** `OrdersPage`, `RecipesPage`, `ProductsPage`, bakery `FinancePage`, `SettingsPage` route wiring, PWA, new UI kit, or Phase 8/9 Google/therapist plan files.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `index.html` | config | request-response | same file + AppShell `env(safe-area-inset-bottom)` | role-match |
| `src/components/layout/AppShell.tsx` | component | request-response | **self** (canonical shell) | exact |
| `src/components/ui/Modal.tsx` | component | request-response | **self** + AppShell safe-area `pb` | exact / patch |
| `src/components/ui/ConfirmDialog.tsx` | component | request-response | Team pending `flex flex-wrap` actions + Modal | role-match |
| `src/components/ui/DataTable.tsx` | component | CRUD (presentational) | **self** + PatientsPage card/table split (consumers) | exact / role-match |
| `src/components/ui/ToastViewport.tsx` | component | event-driven | **self** (already clears bottom nav) | exact |
| `src/components/ui/PageHeader.tsx` | component | request-response | **self** | exact |
| `src/components/ui/Button.tsx` | component | request-response | Modal close `min-h-11 min-w-11` / Finance actions | role-match |
| `src/pages/CalendarPage.tsx` | route | request-response | **self** month grid + Dashboard `lg:` stack | exact |
| `src/pages/KanbanPage.tsx` | route | request-response | **self** board + DataTable contained overflow | exact / role-match |
| `src/pages/DashboardPage.tsx` | route | request-response | **self** (`sm:`/`lg:` progressive) | exact |
| `src/pages/PatientsPage.tsx` | route | CRUD | **self** (canonical card/table) | exact |
| `src/pages/TeamPage.tsx` | route | CRUD | PatientsPage + **self** pending cards | exact |
| `src/pages/AutonomoFinancePage.tsx` | route | CRUD | **self** realizadas cards + PatientsPage for catalog | exact |
| `src/pages/auth/LoginPage.tsx` | route | request-response | `AuthLayout.tsx` | exact |
| `src/pages/auth/RegisterPage.tsx` | route | request-response | `AuthLayout.tsx` | exact |
| `src/pages/auth/WaitingApprovalPage.tsx` | route | request-response | `AuthLayout.tsx` | exact |
| `src/components/auth/AuthLayout.tsx` | component | request-response | **self** | exact |
| `src/pages/PatientPage.tsx` | route | request-response | **self** resumo grids + Dashboard stack | exact |
| `src/components/patients/PatientProfileHeader.tsx` | component | request-response | **self** + Images filter chips scroll | exact |
| `src/components/patients/PatientFocusAreasPanel.tsx` | component | request-response | **self** dual SVG + pointer media | exact |
| `src/components/patients/PatientImagesPanel.tsx` | component | CRUD + file-I/O | **self** (`max-md:opacity-100`) | exact |
| `src/components/patients/PatientEvolutionsPanel.tsx` | component | CRUD | ImagesPanel touch + Modal | role-match |
| `src/components/patients/PatientSessionEditorForm.tsx` | component | CRUD | `PatientEvaluationEditorForm` `sm:grid-cols-2` | role-match |
| `src/components/patients/PatientEvaluationPanel.tsx` | component | request-response | PhysicalEvaluation `lg:grid-cols-[16rem_…]` | exact |
| `src/components/patients/PatientPhysicalEvaluationPanel.tsx` | component | CRUD | ImagesPanel / GoalsPanel always-visible mobile actions | role-match |
| `src/components/patients/PatientEvaluationEditorForm.tsx` | component | CRUD | **self** form grids | exact |
| `src/components/patients/PatientCadastroPanel.tsx` | component | CRUD | **self** (`opacity-100` mobile / hide on `md:`) | exact |
| `src/components/patients/PatientGoalsPanel.tsx` | component | CRUD | **self** (`max-md:opacity-100`) | exact |
| `src/components/patients/PatientAlertsPanel.tsx` | component | CRUD | GoalsPanel list + `min-w-0` | role-match |
| `src/components/patients/DashboardClinicalShortcut.tsx` | component | request-response | Modal + list `min-w-0` | role-match |

**Out of scope (no classification work):** bakery orphans (`OrdersPage`, `RecipesPage`, …), `SettingsPage` (unrouted), `src/config/navigation.ts` (read-only unless UAT blocks), Phase 8/9 planning files.

---

## Pattern Assignments

### `index.html` (config, request-response)

**Analog:** AppShell bottom nav already uses `env(safe-area-inset-bottom)`; meta currently lacks `viewport-fit=cover`.

**Current viewport** (lines 5–5):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Patch pattern (W1 — from RESEARCH):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Without this, `env(safe-area-inset-*)` stays `0` on iOS — AppShell / Modal safe-area padding is ineffective.

---

### `src/components/layout/AppShell.tsx` (component, request-response)

**Analog:** **Self** — canonical clinical shell. Patch touch targets only; do **not** change `lg:` sidebar semantics (D-05).

**Imports pattern** (lines 1–7):
```typescript
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { clinicNavigationItems, mobileNavItems } from '@/config/navigation'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { useAuth } from '@/hooks/useAuth'
import { accountTypeLabel } from '@/lib/accountAccess'
```

**Desktop cutover + drawer** (lines 23–37):
```tsx
<div className="min-h-dvh bg-canvas text-ink lg:h-dvh lg:overflow-hidden lg:bg-forest">
  {/* overlay lg:hidden */}
  <aside
    className={[
      'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-forest text-white transition-transform duration-200',
      isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ].join(' ')}
  >
```

**Main clearance for bottom nav** (lines 119–121):
```tsx
<main className="px-4 py-6 pb-24 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-6 lg:pb-4 lg:pt-6">
  <Outlet />
</main>
```

**Bottom nav + safe-area** (lines 126–138):
```tsx
<nav
  className="fixed inset-x-0 bottom-0 z-30 px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
  aria-label="Navegação móvel"
>
  <div className="relative mx-auto flex max-w-md items-center justify-around rounded-full bg-forest px-1.5 py-1 …">
    <NavLink
      className={({ isActive }) =>
        [
          'flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] …',
          isActive ? 'text-accent' : 'text-white/50',
        ].join(' ')
      }
    >
```

**W1 patch guidance:** raise hit area toward `min-h-11` on nav items / menu buttons without changing `mobileNavItems` IA (D-06). Keep `pb-24` / `lg:pb-4`. Profile column already uses `min-w-0` (lines 87–89) — preserve.

---

### `src/components/ui/Modal.tsx` (component, request-response)

**Analog:** **Self** (bottom sheet on narrow) + AppShell safe-area `pb-[max(…,env(safe-area-inset-bottom))]`.

**Portal + Escape + body lock** (lines 15–26):
```tsx
useEffect(() => {
  if (!open) return
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
  return () => {
    document.removeEventListener('keydown', onKey)
    document.body.style.overflow = ''
  }
}, [open, onClose])
```

**Bottom sheet shell — missing safe-area today** (lines 31–45):
```tsx
<div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
  …
  <div
    role="dialog"
    className={[
      'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl',
      wide ? 'max-w-3xl' : 'max-w-lg',
    ].join(' ')}
  >
```

**Touch close already correct** (lines 54–58):
```tsx
className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
```

**W1 patch (RESEARCH):**
```tsx
<div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
```

Keep `z-[100]` above bottom nav `z-30`. Do not rewrite with Headless UI.

---

### `src/components/ui/ConfirmDialog.tsx` (component, request-response)

**Analog:** Team pending action row (`flex flex-wrap gap-2`) + Modal composition.

**Current cramped row** (lines 28–40):
```tsx
<Modal open={open} title={title} description={description} onClose={onClose}>
  <div className="flex justify-end gap-3">
    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
      {cancelLabel}
    </Button>
    <Button
      onClick={onConfirm}
      isLoading={isLoading}
      className={tone === 'danger' ? '!bg-error !text-white hover:!bg-error/90' : ''}
    >
      {confirmLabel}
    </Button>
  </div>
</Modal>
```

**Copy from Team pending mobile cards** (`TeamPage.tsx` lines 124–142):
```tsx
<div className="mt-4 flex flex-wrap gap-2">
  <Button type="button" variant="secondary" …>Aceitar pedido</Button>
  <Button type="button" variant="ghost" className="text-error" …>Recusar pedido</Button>
</div>
```

**W1 patch guidance:** on narrow, prefer `flex flex-col-reverse gap-3 sm:flex-row sm:justify-end` and/or `fullWidth` on buttons so long PT labels (“Recusar e cancelar conta”) do not overflow.

---

### `src/components/ui/DataTable.tsx` (component, CRUD presentational)

**Analog:** **Self** for contained overflow; **PatientsPage** for consumer card/table split (do not force cards inside DataTable).

**Contained overflow** (lines 47–50):
```tsx
<div className="overflow-hidden rounded-3xl border border-line bg-surface">
  <div className="overflow-x-auto">
    <table className="min-w-full text-left text-sm">
```

**W1 optional:** wrap with `min-w-0` parent contract + fade/hint affordance; keep API unchanged.

**Consumer pattern — never put page-level pan on `main`:** parents that stay table-only (Team active, Finance catalog) should add the PatientsPage split instead of relying on bare DataTable scroll.

---

### `src/components/ui/ToastViewport.tsx` (component, event-driven)

**Analog:** **Self** — verify only.

**Clears bottom nav** (line 17):
```tsx
<div className="pointer-events-none fixed bottom-24 right-4 z-[80] flex w-full max-w-sm flex-col gap-2 lg:bottom-4">
```

No change unless AppShell `pb-24` / nav height changes — keep offsets in sync.

---

### `src/components/ui/PageHeader.tsx` (component, request-response)

**Analog:** **Self**.

**Stack + min-w-0** (lines 10–18):
```tsx
<div className={['mb-6 shrink-0 lg:mb-4', className].join(' ')}>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <h1 className="font-sans text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.125rem]">
        {title}
      </h1>
```

**W1 optional:** if `action` overflows on ~360px, make action wrapper `w-full sm:w-auto` / full-width Button via `fullWidth`.

---

### `src/components/ui/Button.tsx` (component, request-response)

**Analog:** Modal / Finance `min-h-11 min-w-11` on icon/ghost actions.

**Base today** (lines 22–23) — padding-based, no explicit 44px min:
```typescript
const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold …'
```

**Copy touch convention** (Modal lines 58; Finance 285–293):
```tsx
className="min-h-11 min-w-11"
```

Optional W1: add `min-h-11` to base or document that ghost icon buttons must opt in. Prefer not to change visual weight of primary CTAs.

---

### `src/pages/PatientsPage.tsx` (route, CRUD) — CANONICAL CARD/TABLE

**Analog:** **Self**. Verify in W2; reuse shape everywhere else.

**Pattern** (lines 107–130):
```tsx
<>
  <div className="space-y-2 md:hidden">
    {patients.map((patient, index) => (
      <Link
        key={patient.id}
        to={`/pacientes/${patient.id}`}
        className="dash-card dash-in flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <PatientAvatar … />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{patient.name}</span>
          …
        </span>
      </Link>
    ))}
  </div>

  <div className="dash-in hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
    <table className="min-w-full text-left text-sm">…</table>
  </div>
</>
```

**Apply to:** Team active therapists; Finance price catalog.

---

### `src/pages/TeamPage.tsx` (route, CRUD)

**Analog:** PatientsPage + **self** pending section (already correct).

**Pending already split** (lines 116–147):
```tsx
<div className="space-y-3 md:hidden">{/* cards + flex-wrap actions */}</div>
<div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
  <table>…</table>
</div>
```

**Hotspot — active list always DataTable** (lines 197+):
```tsx
<DataTable columns={[…]} data={active} rowKey={(row) => row.id} />
```

**W2:** duplicate pending/Patients card split for active therapists; keep desktop DataTable.

---

### `src/pages/AutonomoFinancePage.tsx` (route, CRUD)

**Analog:** **Self** realizadas cards + PatientsPage for catalog.

**Realizadas already split** (lines 332–345):
```tsx
<div className="space-y-3 md:hidden">
  {realizadas.map((row) => (
    <article key={row.sessionId} className="rounded-2xl border border-line bg-surface p-4">
      …
      <div className="mt-4">{rowAction(row)}</div>
    </article>
  ))}
</div>
<div className="hidden md:block">
  <DataTable … />
</div>
```

**Hotspot — catalog always DataTable** (lines 265–304) with long action labels + `min-h-11`:
```tsx
<DataTable
  columns={[
    …
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button … className="min-h-11 min-w-11">Editar preço</Button>
          <Button … className="min-h-11 min-w-11 text-error">Arquivar preço</Button>
        </div>
      ),
    },
  ]}
/>
```

**W2:** mirror realizadas `md:hidden` / `hidden md:block` for catalog cards.

---

### `src/pages/CalendarPage.tsx` (route, request-response)

**Analog:** **Self** + Dashboard `lg:grid-cols` stacking.

**Two-column only at lg** (line 317):
```tsx
<div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
```

**Month grid hotspot** (lines 353–376):
```tsx
<div className="grid grid-cols-7 gap-1 text-center text-[11px] …">…</div>
<div className="grid grid-cols-7 gap-1">
  …
  <button
    className={[
      'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition',
      isSelected ? 'bg-forest text-white' : isToday ? 'bg-accent-soft text-forest' : 'hover:bg-canvas',
    ].join(' ')}
  >
```

**Chevrons undersized** (lines 320–322):
```tsx
className="rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
```

**W2:** keep 7-col month (Open Q recommendation); enlarge chevrons to `min-h-11 min-w-11`; reduce `gap-1` if needed; Google strip already `flex-col … sm:flex-row` (lines 212+).

---

### `src/pages/KanbanPage.tsx` (route, request-response)

**Analog:** **Self** board + DataTable contained overflow contract.

**Intentional horizontal board** (lines 127–148):
```tsx
<div className="flex gap-4 overflow-x-auto pb-4">
  …
  <article className={[
    'dash-in dash-card flex w-72 shrink-0 flex-col rounded-2xl border bg-canvas p-3',
    …
  ].join(' ')}>
```

**Tiny delete** (lines 159–165):
```tsx
<button
  type="button"
  aria-label={`Excluir lista ${column.title}`}
  className="rounded-lg p-1 text-muted hover:text-error"
>
  <Trash2 size={14} />
</button>
```

**W2 (D-03):** keep contained pan; add `min-w-0` ancestor + scroll affordance (fade/peek); bump delete to `min-h-11 min-w-11`. Do **not** invent vertical accordion unless UAT fails (A2).

---

### `src/pages/DashboardPage.tsx` (route, request-response)

**Analog:** **Self**.

**Progressive grids** (lines 354, 425, 497):
```tsx
<div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-3">
…
<div className="mt-4 grid gap-4 lg:mt-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.7fr_1fr] …">
…
<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-4">
```

**W2:** polish only — ensure `min-w-0` on text columns; no new multi-col below `lg` for chart/session split.

---

### Auth: `AuthLayout.tsx` + Login/Register/WaitingApproval (route/component)

**Analog:** `AuthLayout.tsx` — smoke W2.

**Mobile-first form / marketing only at lg** (lines 12–13, 43–46):
```tsx
<div className="auth-shell relative min-h-dvh overflow-hidden lg:flex lg:h-dvh">
  <aside className="relative z-10 hidden w-1/2 … lg:flex">…</aside>
  <div className="relative z-10 lg:flex lg:w-1/2 lg:flex-col lg:p-2.5">
    <main className="auth-form-card flex min-h-dvh items-center justify-center px-4 py-12 lg:min-h-0 …">
      <div className="mb-8 lg:hidden">{/* BrandWordmark */}</div>
```

No AppShell / bottom nav here — do not add `pb-24`.

---

### `src/pages/PatientPage.tsx` (route, request-response)

**Analog:** **Self** + Dashboard stack.

**Resumo stacks to single column below lg** (lines 301, 371):
```tsx
<div className="mt-4 grid gap-4 lg:grid-cols-3 lg:grid-flow-col lg:grid-rows-[auto_auto]">
…
<div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(12rem,1fr)] lg:items-stretch">
```

**W3:** verify shortcut grids (`sm:grid-cols-2`, `grid-cols-2 … lg:grid-cols-4` line 163) do not force page pan; keep `min-w-0` on labels (line 400).

---

### `src/components/patients/PatientProfileHeader.tsx` (component, request-response)

**Analog:** **Self** + ImagesPanel filter chips (`overflow-x-auto` + `shrink-0` + `min-h-11`).

**Identity grid with minmax(0,1fr)** (lines 47–48):
```tsx
className="dash-in group mt-5 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4"
```

**Contained tab scroll** (lines 75–78):
```tsx
<nav
  className="mt-4 flex items-end gap-5 overflow-x-auto border-b border-line sm:gap-6"
  aria-label="Seções do paciente"
  role="tablist"
>
```

**Tabs < 44px / long label** (lines 84–107): `py-2.5`, `shrink-0`, “Dados cadastrais”.

**Identity pencil absolute** (lines 66–68):
```tsx
<span className="absolute right-0 top-0.5 inline-flex h-8 w-8 items-center justify-center">
```

**W3:** raise tab / identity targets toward `min-h-11`; keep contained `overflow-x-auto` (D-03); ensure ancestors stay `min-w-0`.

---

### `src/components/patients/PatientFocusAreasPanel.tsx` (component, request-response) — silhueta

**Analog:** **Self**.

**Touch vs hover delay** (lines 34, 198):
```typescript
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return HOVER_OPEN_MS
```

**Dual SVG side-by-side** (lines 269–270, 225):
```tsx
<div className="flex items-end justify-center gap-4">
…
className="h-44 w-auto overflow-hidden text-forest sm:h-52"
```

**W3:** if cramped at 360px, stack with `flex-col sm:flex-row` / `items-center`; keep pointer media queries; chip already viewport-clamped — preserve portal math.

---

### `src/components/patients/PatientImagesPanel.tsx` (component, CRUD + file-I/O) — gallery CANONICAL TOUCH ACTIONS

**Analog:** **Self**.

**Filter chips contained scroll + touch height** (lines 378–382):
```tsx
<div className="flex gap-2 overflow-x-auto">
  …
  'shrink-0 rounded-full border px-4 text-sm min-h-11',
```

**Always-visible mobile destructive/edit** (lines 468–481):
```tsx
<div className="absolute right-1 top-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
  <button className="flex min-h-11 min-w-11 items-center justify-center rounded-xl …">
    <Pencil size={16} />
  </button>
  <button className="flex min-h-11 min-w-11 items-center justify-center rounded-xl …">
    <Trash2 size={16} />
  </button>
</div>
```

**Apply to:** `PatientPhysicalEvaluationPanel` hover-delete; any remaining `opacity-0 group-hover` in ficha (Goals already has `max-md:opacity-100`).

**Lightbox / grid:** `grid-cols-2 … sm:grid-cols-3 lg:grid-cols-4` (line 434) — verify lightbox actions clear safe-area via Modal patch.

---

### `src/components/patients/PatientPhysicalEvaluationPanel.tsx` (component, CRUD)

**Analog:** ImagesPanel / GoalsPanel / Cadastro always-visible mobile actions.

**Sidebar stacks below lg** (line 207):
```tsx
<div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
```

**Hover-only delete (broken on touch)** (lines 234–241):
```tsx
<button
  type="button"
  aria-label="Excluir avaliação"
  className="rounded p-1 text-muted opacity-0 hover:bg-error/10 hover:text-error group-hover:opacity-100"
>
  <Trash2 size={14} />
</button>
```

**W3 patch — copy ImagesPanel:**
```tsx
className="… opacity-0 … group-hover:opacity-100 max-md:opacity-100 min-h-11 min-w-11 …"
```
Or Cadastro variant (`opacity-100` default, hide only `md:`):
```tsx
// PatientCadastroPanel.tsx line 66
className="… opacity-100 … md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
```

---

### `src/components/patients/PatientCadastroPanel.tsx` / `PatientGoalsPanel.tsx` / forms

**Cadastro — correct mobile-visible edit** (line 66):
```tsx
className="rounded-lg p-1.5 text-muted opacity-100 transition … md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
```

**Goals — already max-md visible** (line 202):
```tsx
className="flex shrink-0 flex-col gap-0.5 opacity-0 … group-hover:opacity-100 … max-md:opacity-100"
```

**Form grids** (`PatientEvaluationEditorForm` / Cadastro):
```tsx
<div className="grid gap-4 sm:grid-cols-2">
```
Keep mobile-first single column; avoid fixed widths.

**FormActions row** in Cadastro (lines 81–84) mirrors ConfirmDialog — stack on narrow if needed:
```tsx
<div className="flex justify-end gap-3 pt-2">
```

---

### `src/components/patients/PatientEvolutionsPanel.tsx` / `PatientSessionEditorForm.tsx` / `PatientAlertsPanel.tsx` / `DashboardClinicalShortcut.tsx`

**Analogs:** Modal safe-area (W1), ImagesPanel touch targets, list `min-w-0 flex-1` (Evolutions/Alerts already), ConfirmDialog stacked actions.

**Evolutions modal thumbs** RESEARCH note: `grid-cols-4` inside modal — if cramped, follow Images tile density (`grid-cols-2` on narrow).

---

## Shared Patterns

### 1. Mobile card list / desktop table (`md` split)
**Source:** `src/pages/PatientsPage.tsx` lines 107–130; also Team pending, Finance realizadas  
**Apply to:** Team active list; Finance price catalog  
```tsx
<div className="space-y-3 md:hidden">{/* cards */}</div>
<div className="hidden md:block">{/* table / DataTable */}</div>
```

### 2. Contained horizontal overflow + `min-w-0`
**Source:** `DataTable.tsx` 48–49; `KanbanPage.tsx` 127; `PatientProfileHeader.tsx` 76  
**Apply to:** Kanban board affordance; any dense table last resort; ficha tabs  
```tsx
<div className="min-w-0">
  <div className="overflow-x-auto overscroll-x-contain">{/* wide */}</div>
</div>
```
Never set overflow on `body` / `main` for these cases (D-03).

### 3. Safe-area + bottom-nav clearance
**Source:** AppShell 119, 127; ToastViewport 17  
**Apply to:** Modal sheet padding; sticky footers; any new fixed bottom UI  
```tsx
pb-24                                    // main content
pb-[max(0.5rem,env(safe-area-inset-bottom))]  // bottom nav
bottom-24 / lg:bottom-4                  // toasts
pb-[max(1rem,env(safe-area-inset-bottom))]    // modal sheet (patch)
```
Requires `viewport-fit=cover` in `index.html`.

### 4. Touch target `min-h-11 min-w-11` (44px)
**Source:** Modal close; Finance action buttons; ImagesPanel edit/delete  
**Apply to:** Calendar chevrons; Kanban delete; AppShell menu/nav; ficha tabs/identity pencil; ConfirmDialog buttons on narrow  

### 5. Always-visible actions on touch
**Source:** `PatientImagesPanel.tsx` 468; `PatientGoalsPanel.tsx` 202; `PatientCadastroPanel.tsx` 66  
**Apply to:** `PatientPhysicalEvaluationPanel` and any remaining `group-hover`-only controls  
```tsx
opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100
// or: opacity-100 md:opacity-0 md:group-hover:opacity-100
```

### 6. Progressive enhancement at `lg` (desktop no regression)
**Source:** AppShell drawer/`lg:translate-x-0`; Dashboard/Calendar `lg:grid-cols-*`  
**Apply to:** all page patches — unprefixed = mobile stack; `lg:` restores multi-column  

### 7. Class joining convention
**Source:** entire clinic UI  
```tsx
;[a, b, c].join(' ')   // not clsx
```
Named exports, single quotes, no semicolons — match existing files.

---

## No Analog Found

| File / concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| Scroll fade / peek affordance for Kanban | utility / CSS | transform | No gradient-hint component yet — invent thin CSS on wrapper (RESEARCH Pattern 2) |
| Automated visual regression | test | — | No Playwright/Vitest UI suite — Wave 4 manual UAT checklist only |
| `SettingsPage` mobile polish | route | — | Unrouted orphan (bakery tokens) — **skip** (CONTEXT/RESEARCH A1) |

Bakery pages intentionally **not** listed — D-01 / D-06.

---

## Metadata

**Analog search scope:** `src/components/layout`, `src/components/ui`, `src/components/patients`, `src/components/auth`, `src/pages` (clinical routes only), `index.html`  
**Files scanned:** ~35 clinical/layout files (bakery orphans excluded)  
**Pattern extraction date:** 2026-09-19  
**Primary canonicals for planner actions:**
1. PatientsPage card/table split  
2. AppShell safe-area + `pb-24`  
3. Modal bottom sheet (extend, don’t replace)  
4. PatientImagesPanel `max-md:opacity-100` + `min-h-11`  
5. DataTable / Kanban contained `overflow-x-auto`  

### Ready for Planning
Pattern mapping complete. Planner can reference analog paths + line excerpts in PLAN.md waves W1–W4.
