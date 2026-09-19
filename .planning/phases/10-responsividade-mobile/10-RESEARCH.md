# Phase 10: Responsividade mobile - Research

**Researched:** 2026-09-19
**Domain:** Tailwind CSS v4 mobile-first layout / clinical SPA UI audit
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### D-01 — Escopo: produto clínico (não bakery stubs)
Priorizar rotas/componentes **clínicos** em uso: AppShell, auth (login/cadastro/aguardando), Painel, Pacientes, Ficha (+ abas/módulos), Agenda, Equipe, Financeiro autônomo, Settings. Páginas bakery legadas (`OrdersPage`, `RecipesPage`, etc.) só se ainda forem alcançáveis nas rotas ativas; caso contrário, fora de escopo ou fix mínimo.

#### D-02 — Breakpoints existentes
Manter Tailwind atual: mobile-first; `lg:` = desktop shell (sidebar). Não introduzir framework novo nem redesign visual (cores/tipografia/brand).

#### D-03 — Sem pan horizontal no fluxo principal
Em ~360–430px, o fluxo principal não exige scroll horizontal. Tabelas densas podem usar `overflow-x-auto` **contido** com indicação visual, não empurrar a página inteira.

#### D-04 — Bottom nav + safe-area
CTAs primários, sticky footers e modais respeitam `pb` do bottom nav e `env(safe-area-inset-*)`. Nada crítico fica atrás da barra inferior.

#### D-05 — Desktop não regride
Em `lg+`, sidebar + painel arredondado e layouts multi-coluna atuais permanecem; mudanças são progressive enhancement / stack no mobile.

#### D-06 — Fora de escopo
- Redesign de marca / nova identidade
- PWA / install prompt
- Mudança de navegação IA (itens do bottom nav) salvo se bloquear usabilidade
- Phase 8 Google / Phase 9 therapist (podem rodar em paralelo; não editar esses planos)

### Claude's Discretion
*(Discuss-phase skipped — CONTEXT notes intent explicit: full mobile. Discretion areas for researcher/planner:)*
- Wave split and task granularity
- Whether dense tables get card lists vs contained `overflow-x-auto` + fade/hint
- Exact touch-target patches where `min-h-11` is missing
- UAT checklist detail and viewport matrix

### Deferred Ideas (OUT OF SCOPE)
- Redesign de marca / nova identidade
- PWA / install prompt
- Mudança de navegação IA (itens do bottom nav) salvo se bloquear usabilidade
- Phase 8 Google / Phase 9 therapist plans (do not edit)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-22 | Responsividade mobile 100% — experiência clínica completa em viewport estreito | Inventory of working shell patterns + 8 hotspots; wave split shell→pages→ficha→UAT; bakery routes confirmed unreachable; concrete file list; safe-area / touch-target patterns already in repo |
</phase_requirements>

## Summary

The clinical app already ships a solid mobile shell: drawer + floating bottom nav, `main` with `pb-24`, Toast above the nav (`bottom-24`), and several pages that switch to card lists below `md`. Tailwind v4 mobile-first breakpoints are in use (`sm`/`md`/`lg`), with `lg` as the desktop shell cutover. The gap to “100%” is not a missing framework — it is uneven page/component polish: month calendar cells, Kanban’s intentional horizontal board, DataTables without mobile cards, ficha tab strip / silhueta / gallery edge cases, Modal bottom-sheet vs safe-area, and scattered sub-44px controls.

**Primary recommendation:** Keep Tailwind only. Execute four waves — (1) shell/primitives + `viewport-fit=cover`, (2) clinical pages (Agenda, Quadro, Equipe, Financeiro, Painel), (3) ficha modules, (4) manual UAT checklist at 360/390/430 + `lg` regression — reusing the existing PatientsPage / Team pending / Finance realizadas card-list pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Shell layout (drawer, bottom nav, pb-24) | Browser / Client | — | Pure CSS/layout in `AppShell`; no API |
| Safe-area / viewport-fit | CDN / Static + Browser | — | `index.html` meta + CSS `env()`; iOS needs `viewport-fit=cover` for non-zero insets [CITED: developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag] |
| Page stacking / grids | Browser / Client | — | Tailwind responsive utilities in page components |
| Dense tables → cards | Browser / Client | — | Presentational swap; same data hooks |
| Modals / confirms / toasts | Browser / Client | — | Portals + fixed positioning relative to viewport/nav |
| Ficha tabs / silhueta / gallery | Browser / Client | API / Backend | UI layout only; persistence already exists |
| Auth screens | Browser / Client | API / Backend | `AuthLayout` already mobile-first; no shell/nav |
| Touch target sizing | Browser / Client | — | WCAG 2.5.5 44×44 CSS px guidance [CITED: w3.org/WAI/WCAG21/Understanding/target-size.html] |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory found in the project root at research time. No project-rule directives to enforce beyond CONTEXT D-01–D-06 and existing code conventions (Tailwind utility classes, Portuguese UI copy, `min-h-11` ≈ 44px already used in newer clinic UI).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.3.3 (installed; package.json `^4.1.7`) | Responsive utilities, mobile-first breakpoints | Already the project styling system; D-02 forbids a new framework [VERIFIED: node_modules/tailwindcss + npm registry] |
| @tailwindcss/vite | 4.3.3 | Vite integration | Existing toolchain [VERIFIED: package-lock / node_modules] |
| React | 19.1.0 | UI | Existing SPA [VERIFIED: package.json] |
| react-router-dom | 7.6.1 | Routes / live vs dead pages | Source of truth for in-scope pages [VERIFIED: src/routes/index.tsx] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.25.0 | Icons in nav/actions | Already used; keep sizes consistent with touch targets |
| (none new) | — | — | Phase installs **no** new packages |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Card lists below `md` | Always `overflow-x-auto` tables | Cards match PatientsPage/Team pending; tables alone risk D-03 “page feels panned” without fade hint |
| Tailwind only | Container queries (`@container`) | Useful later for ficha cards in split layouts; not required for viewport-first REQ-22 |
| Raise bottom-nav hit area | Redesign nav IA | D-06 forbids IA change unless usability blocked; prefer CSS padding/`min-h-11` on existing items |

**Installation:**

```bash
# No new packages. Use existing Tailwind responsive utilities.
```

**Version verification:** `tailwindcss@4.3.3` and `@tailwindcss/vite@4.3.3` resolved in `node_modules` (2026-09-19). Official responsive docs confirm default breakpoints `sm` 40rem … `lg` 64rem and mobile-first unprefixed-first pattern [CITED: tailwindcss.com/docs/responsive-design].

## Package Legitimacy Audit

> No external packages are recommended for install in this phase.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | n/a | No installs |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time; irrelevant because zero new packages.*

## Inventory: What Already Works

| Pattern | Where | Notes |
|---------|-------|-------|
| Mobile drawer + desktop sidebar | `AppShell.tsx` | `lg:translate-x-0`; overlay `lg:hidden` |
| Bottom nav + safe-area bottom | `AppShell.tsx` | `pb-[max(0.5rem,env(safe-area-inset-bottom))]` `lg:hidden` |
| Main clearance for bottom nav | `AppShell.tsx` | `pb-24` on `<main>` (desktop resets `lg:pb-4`) |
| Toasts clear of bottom nav | `ToastViewport.tsx` | `bottom-24` mobile / `lg:bottom-4` |
| PageHeader stack | `PageHeader.tsx` | `flex-col` → `sm:flex-row`; title `min-w-0` |
| Modal as bottom sheet on narrow | `Modal.tsx` | `items-end` → `sm:items-center`; close `min-h-11 min-w-11` |
| Patients list cards | `PatientsPage.tsx` | `md:hidden` cards / `md:block` table |
| Team pending cards | `TeamPage.tsx` | Same `md:` split for pending requests |
| Finance realizadas cards | `AutonomoFinancePage.tsx` | `md:hidden` cards for session rows |
| Gallery mobile affordances | `PatientImagesPanel.tsx` | Filter chips `overflow-x-auto`; edit/delete `max-md:opacity-100`; many `min-h-11` |
| Ficha tab strip contained scroll | `PatientProfileHeader.tsx` | `overflow-x-auto` on tablist (does not pan page if parent `min-w-0`) |
| Silhueta touch vs hover | `PatientFocusAreasPanel.tsx` | `(hover: hover) and (pointer: fine)` delay; chip clamped to viewport |
| Auth mobile form | `AuthLayout.tsx` | Brand + form full-bleed mobile; marketing pane `lg:flex` only |
| Dashboard / Calendar stacking | `DashboardPage.tsx`, `CalendarPage.tsx` | Multi-col only at `lg:` / `sm:` |

## Top 8 Hotspots (breakage risks)

1. **Kanban horizontal board** — `KanbanPage.tsx`: `flex … overflow-x-auto` + columns `w-72 shrink-0`. Contained pan is acceptable under D-03 **if** visual affordance exists; today there is no fade/peek hint and delete controls are tiny (`p-1` / icon-only).
2. **Agenda month `grid-cols-7`** — `CalendarPage.tsx`: seven `aspect-square` day buttons. At ~360px content width (~328px after `px-4`), cells ≈ 45px — borderline WCAG 44px and easy to mis-tap; weekday labels OK (`Seg`…).
3. **DataTable-only surfaces** — `DataTable.tsx` wraps `overflow-x-auto` but **Team** active therapists and **Finance** price catalog always render the table (no `md:hidden` cards). Risk: wide action columns (“Editar preço” / “Arquivar”) force horizontal scroll without hint.
4. **Modal bottom sheet vs safe-area** — `Modal.tsx` uses `p-4` / `items-end` without `pb-[env(safe-area-inset-bottom)]`. On notched phones the sheet can sit under the home indicator; bottom nav is covered by `z-[100]` (good) but safe-area padding is missing. `index.html` lacks `viewport-fit=cover`, so `env(safe-area-inset-*)` may stay `0` on iOS [CITED: MDN viewport-fit].
5. **ConfirmDialog action row** — `ConfirmDialog.tsx`: `flex justify-end gap-3` with long PT labels (“Recusar e cancelar conta”). On ~360px may overflow or cramp; needs `flex-col-reverse` / `w-full` on narrow.
6. **Ficha tab strip + identity action** — `PatientProfileHeader.tsx`: five `shrink-0` tabs; “Dados cadastrais” is long; tab `py-2.5` height &lt; 44px; identity pencil `h-8 w-8` absolute. Contained scroll works; tap comfort does not.
7. **Silhueta dual SVG** — `PatientFocusAreasPanel.tsx`: two `h-44` silhouettes side-by-side (`flex … gap-4`). At 360px each ~160px wide — usually OK, but chip portal + small path hit regions remain touch-awkward; verify stack (`flex-col`) if cramped.
8. **Hover-only destructive controls** — `PatientPhysicalEvaluationPanel.tsx` (and similar): delete `opacity-0 group-hover:opacity-100` — invisible on touch. Gallery already fixed with `max-md:opacity-100`; replicate that pattern.

**Honorable mentions:** Calendar month chevrons `p-2` only; bottom-nav item visual height short (`h-6` icon + `py-0.5`) though width `min-w-[3.25rem]`; `PatientEvolutionsPanel` `grid-cols-4` thumbs inside modal; Settings listed in D-01 but `SettingsPage` is **not routed**.

## Recommended Wave Split

| Wave | Focus | Deliverable |
|------|-------|-------------|
| **W1 — Shell & primitives** | `index.html` viewport-fit; `Modal`/`ConfirmDialog` safe-area + stacked actions; optional DataTable scroll hint / `min-w-0` parent contract; bottom-nav / icon button `min-h-11` where critical | Shared foundation; no page-specific product logic |
| **W2 — Clinical pages** | `CalendarPage`, `KanbanPage`, `DashboardPage`, `TeamPage` (active list cards), `AutonomoFinancePage` (catalog cards), auth smoke | REQ-22 acceptance for Agenda/Painel/Equipe/Financeiro/Quadro |
| **W3 — Ficha modules** | `PatientProfileHeader`, `PatientPage`, focus/gallery/evolutions/evaluation/cadastro/goals/alerts/session forms | Ficha usable at 360px |
| **W4 — UAT checklist** | Manual matrix 360 / 390 / 430 + `lg` regression; document pass/fail | Phase gate before verify-work |

Do **not** edit Phase 8/9 plan files (D-06).

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────┐     ┌──────────────────────────────────────────┐
│  Viewport   │────▶│  AppShell (mobile)                       │
│  360–430px  │     │  header sticky · drawer · bottom nav     │
└─────────────┘     │  main.pb-24                               │
                    └───────────────┬──────────────────────────┘
                                    │ Outlet
                    ┌───────────────▼──────────────────────────┐
                    │  Page (stack / cards / contained scroll)  │
                    │  Dashboard · Patients · Calendar · …      │
                    └───────────────┬──────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
        DataTable/cards      Patient tabs/modules    Modal portal z-100
        (overflow-x OR       (scroll tabs, SVG,      (sheet + safe-area)
         md: card list)       gallery grid)
              │                     │                     │
              └─────────────────────┴─────────────────────┘
                                    │
                          ToastViewport bottom-24
```

### Recommended Project Structure

No new folders. Touch existing clinical files only:

```
src/
├── components/layout/AppShell.tsx          # shell clearance / nav targets
├── components/ui/{Modal,ConfirmDialog,DataTable,PageHeader,Button,ToastViewport}.tsx
├── components/patients/*                   # ficha modules
├── pages/{Dashboard,Calendar,Patients,Patient,Team,AutonomoFinance,Kanban}Page.tsx
├── pages/auth/* + components/auth/AuthLayout.tsx
├── config/navigation.ts                    # read-only unless D-06 exception
├── routes/index.tsx                        # scope gate (do not re-add bakery)
└── index.html                              # viewport-fit=cover
```

### Pattern 1: Mobile card list / desktop table
**What:** Duplicate presentation: cards `< md`, table `≥ md`.
**When to use:** Any multi-column clinical table (Team active, Finance catalog).
**Example:** Mirror `PatientsPage.tsx` / `TeamPage` pending / `AutonomoFinancePage` realizadas.

### Pattern 2: Contained overflow with affordance
**What:** `overflow-x-auto` on an inner wrapper + `min-w-0` on ancestors; optional gradient hint.
**When to use:** Kanban board; last-resort dense tables where cards are impractical.

### Pattern 3: Always-visible mobile actions
**What:** `max-md:opacity-100` (or remove hover-hide) for edit/delete.
**When to use:** Any `group-hover:opacity-0` control in ficha modules.

### Anti-Patterns to Avoid
- **Changing `lg` shell semantics** — desktop regression (D-05).
- **Page-level horizontal scroll** — put overflow on the component, not `body`/`main`.
- **New UI kit / CSS framework** — D-02.
- **Editing bakery orphans or Phase 8/9 plans** — D-01 / D-06.
- **Hiding primary CTAs behind bottom nav** — keep `pb-24` / toast offset; extend to modal padding.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive breakpoints | Custom media query system | Tailwind `sm`/`md`/`lg` | Already configured [CITED: tailwindcss.com/docs/responsive-design] |
| Safe-area insets | Hardcoded iPhone padding | `env(safe-area-inset-*)` + `viewport-fit=cover` | Platform-correct [CITED: MDN] |
| Touch target size | Ad-hoc pixel guessing | `min-h-11 min-w-11` (2.75rem = 44px) | Matches repo convention + WCAG AAA target size guidance |
| Table→mobile UX | New table library | Existing card-list pattern | Consistency with Patients/Team/Finance |
| Bottom sheet modal | Headless UI rewrite | Extend current `Modal.tsx` | Already portal + Escape + body lock |

**Key insight:** This phase is an **audit-and-patch** on existing Tailwind patterns, not a greenfield responsive architecture.

## Common Pitfalls

### Pitfall 1: Flex/grid child overflow without `min-w-0`
**What goes wrong:** Child refuses to shrink; page gains horizontal scroll.
**Why it happens:** Default `min-width: auto` on flex/grid items.
**How to avoid:** Keep/add `min-w-0` on text columns (already used in AppShell profile, PageHeader, many lists).
**Warning signs:** `document.documentElement.scrollWidth > innerWidth` on a “simple” page.

### Pitfall 2: `env(safe-area-inset-*)` always zero
**What goes wrong:** Bottom nav / modal padding looks fine in Chrome DevTools but fails on iPhone notch.
**Why it happens:** Missing `viewport-fit=cover` in meta viewport [CITED: MDN].
**How to avoid:** Add `viewport-fit=cover` to `index.html` in W1; retest on device or Simulator.

### Pitfall 3: Hover-only actions on touch
**What goes wrong:** Users cannot edit/delete.
**Why it happens:** `opacity-0 group-hover:opacity-100`.
**How to avoid:** `max-md:opacity-100` pattern from `PatientImagesPanel`.
**Warning signs:** Works on desktop hover, fails on real phone.

### Pitfall 4: Modal content taller than viewport + keyboard
**What goes wrong:** Submit buttons unreachable.
**Why it happens:** `max-h-[90vh]` without accounting for virtual keyboard / safe-area.
**How to avoid:** Keep overflow-y on dialog; stack actions; optional `interactive-widget` later (out of scope unless UAT fails).

### Pitfall 5: Fixing bakery stubs “while here”
**What goes wrong:** Scope creep; dead code churn.
**Why it happens:** Many orphan pages under `src/pages/`.
**How to avoid:** `src/routes/index.tsx` is the allowlist — bakery files are unreachable.

## Code Examples

### Contained horizontal scroll (Kanban / dense table)

```tsx
// Pattern already in DataTable / Kanban — ensure parent chain has min-w-0
<div className="min-w-0">
  <div className="overflow-x-auto overscroll-x-contain">
    {/* wide content */}
  </div>
</div>
```

### Mobile cards / desktop table (canonical)

```tsx
// Source: src/pages/PatientsPage.tsx (verified in-repo)
<>
  <div className="space-y-2 md:hidden">{/* cards */}</div>
  <div className="hidden overflow-hidden … md:block">{/* table */}</div>
</>
```

### Safe-area on bottom sheet modal (recommended W1)

```tsx
// Extend Modal shell — do not invent a new modal library
<div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
```

### Touch target

```tsx
// Repo convention already used in Modal / Finance / Images
className="flex min-h-11 min-w-11 items-center justify-center …"
```

## Concrete File List for Planner

### In scope (clinical / shared)

| File | Wave | Why |
|------|------|-----|
| `index.html` | W1 | `viewport-fit=cover` |
| `src/components/layout/AppShell.tsx` | W1 | Bottom nav targets / clearance audit |
| `src/components/ui/Modal.tsx` | W1 | Safe-area sheet padding |
| `src/components/ui/ConfirmDialog.tsx` | W1 | Stack actions on narrow |
| `src/components/ui/DataTable.tsx` | W1 | Optional scroll hint / docs for consumers |
| `src/components/ui/ToastViewport.tsx` | W1 | Verify only (already `bottom-24`) |
| `src/components/ui/PageHeader.tsx` | W1 | Verify stack; action full-width if needed |
| `src/components/ui/Button.tsx` | W1 | Optional default `min-h-11` |
| `src/pages/CalendarPage.tsx` | W2 | Month grid + chevrons + Google strip wrap |
| `src/pages/KanbanPage.tsx` | W2 | Board scroll affordance + touch delete |
| `src/pages/DashboardPage.tsx` | W2 | Stat/grid polish |
| `src/pages/PatientsPage.tsx` | W2 | Verify (already strong) |
| `src/pages/TeamPage.tsx` | W2 | Active therapists → cards |
| `src/pages/AutonomoFinancePage.tsx` | W2 | Price catalog → cards |
| `src/pages/auth/LoginPage.tsx` | W2 | Smoke |
| `src/pages/auth/RegisterPage.tsx` | W2 | Smoke |
| `src/pages/auth/WaitingApprovalPage.tsx` | W2 | Smoke |
| `src/components/auth/AuthLayout.tsx` | W2 | Verify |
| `src/components/auth/ProtectedRoute.tsx` | W2 | Centered cards OK |
| `src/pages/PatientPage.tsx` | W3 | Resumo grids / shortcuts |
| `src/components/patients/PatientProfileHeader.tsx` | W3 | Tabs + targets |
| `src/components/patients/PatientFocusAreasPanel.tsx` | W3 | Silhueta layout |
| `src/components/patients/PatientImagesPanel.tsx` | W3 | Gallery/lightbox |
| `src/components/patients/PatientEvolutionsPanel.tsx` | W3 | Modal thumbs / forms |
| `src/components/patients/PatientSessionEditorForm.tsx` | W3 | Form grids |
| `src/components/patients/PatientEvaluationPanel.tsx` | W3 | Layout |
| `src/components/patients/PatientPhysicalEvaluationPanel.tsx` | W3 | Hover-delete + sidebar |
| `src/components/patients/PatientEvaluationEditorForm.tsx` | W3 | Form grids |
| `src/components/patients/PatientCadastroPanel.tsx` | W3 | Dense forms |
| `src/components/patients/PatientGoalsPanel.tsx` | W3 | Lists/forms |
| `src/components/patients/PatientAlertsPanel.tsx` | W3 | Lists |
| `src/components/patients/DashboardClinicalShortcut.tsx` | W3 | Modal list (if opened from Painel) |
| `src/config/navigation.ts` | — | Read-only unless UAT blocks (D-06) |
| `src/routes/index.tsx` | — | Scope reference only |

### Out of scope (unreachable bakery / orphans)

Confirmed **not** imported in `src/routes/index.tsx`:

`OrdersPage`, `RecipesPage`, `ProductsPage`, `FinancePage` (bakery), `ReportsPage`, `TasksPage`, `ProductionPage`, `SettingsPage`, `ClientsPage`, `CouponsPage`, `DeliveriesPage`, `EmployeesPage`, `ShoppingPage`, `StockPage`, `BlankPage`, `SetupPage` (unless used as error gate — verify if referenced elsewhere before touching).

Live clinic routes: `/`, `/cadastro`, `/aguardando`, `/painel`, `/pacientes`, `/pacientes/:id`, `/pacientes/:id/cadastro` (redirect), `/pacientes/:id/:module` (stubs), `/agenda`, `/quadro`, `/equipe`, `/financeiro`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bakery dark-theme pages | Clinic light theme + AppShell | Prior phases | Orphans unused |
| Desktop-only tables | Card / table split at `md` | Patients, Team pending, Finance rows | Reuse for remaining tables |
| Hover-only chip delay | Pointer media queries | Phase 6 silhueta | Touch opens immediately |

**Deprecated/outdated:**
- Relying on `group-hover` alone for critical actions on mobile.
- Assuming `env(safe-area-inset-*)` works without `viewport-fit=cover`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Settings in D-01 means “if/when routed”; current `SettingsPage` is orphan dark-theme stub | File list / Open Questions | Planner may schedule dead work — confirm skip |
| A2 | Kanban intentional horizontal scroll satisfies D-03 if affordance added (no full redesign to vertical lists) | Hotspot 1 | User may want stacked columns instead — confirm in UAT |
| A3 | No automated visual regression tooling will be added this phase (manual UAT only) | Validation | Coverage depends on human checklist |
| A4 | `min-h-11` (2.75rem) equals 44 CSS px under default root font size | Touch targets | Rem root changes would desync |

## Open Questions

1. **SettingsPage**
   - What we know: Listed in D-01; file exists; **not** in `routes/index.tsx`.
   - What's unclear: Wire a route vs treat as out of scope until product wants Configurações.
   - Recommendation: **Skip** in Phase 10 unless product asks to route it (orphan uses bakery color tokens).

2. **Kanban UX on phone**
   - What we know: Horizontal columns are standard for boards; D-03 allows contained overflow.
   - What's unclear: Affordance-only vs vertical accordion.
   - Recommendation: Affordance + larger controls in W2; escalate only if UAT fails.

3. **Calendar day cell size**
   - What we know: 7-column month is dense at 360px.
   - What's unclear: Shrink typography vs switch mobile to agenda-list-first.
   - Recommendation: Keep month grid; enlarge hit area / reduce gap; list panel already stacks below on small screens via `lg:grid-cols`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build / preview | ✓ | v26.4.0 | — |
| npm | Scripts | ✓ | 12.0.2 | — |
| Tailwind (local) | Utilities | ✓ | 4.3.3 | — |
| Vite | `npm run dev` / preview | ✓ | ^6.3.5 | — |
| Physical phone / Simulator | Safe-area UAT | ? | — | Chrome device mode + flag need for real `env()` |
| Playwright / Vitest | Automated UI tests | ✗ | — | Manual UAT checklist (Wave 4) |

**Missing dependencies with no fallback:** none for implementation (code-only).

**Missing dependencies with fallback:** automated e2e — use manual checklist.

Step 2.6 note: External services (Supabase) not required for CSS/layout tasks; use existing seeded clinic data for UAT.

## Validation Architecture

> `workflow.nyquist_validation` absent in `.planning/config.json` → treat as **enabled**. No unit/e2e test runner configured in `package.json` (only `dev` / `build` / `lint` / `typecheck` / `preview`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none (typecheck + eslint only) |
| Config file | none — see Wave 0 |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-22.1 | No obligatory page pan at ~360px on clinical routes | manual UAT | — | ❌ Wave 0 checklist |
| REQ-22.2 | Ficha tabs/forms/silhueta/gallery usable | manual UAT | — | ❌ |
| REQ-22.3 | Agenda, Painel, listas, Equipe, Financeiro coherent | manual UAT | — | ❌ |
| REQ-22.4 | Modal/confirm/toast clear of bottom nav + safe-area | manual UAT | — | ❌ |
| REQ-22.5 | Desktop `lg+` unchanged | manual UAT | — | ❌ |
| REQ-22 | No TS/lint regressions from class edits | static | `npm run typecheck && npm run lint` | ✅ scripts |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run lint`
- **Phase gate:** Full static green + UAT checklist signed off before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `.planning/phases/10-responsividade-mobile/10-UI-CHECKLIST.md` (or UI-SPEC) — viewport matrix 360/390/430 + `lg`, routes list, pass/fail
- [ ] Optional: Playwright smoke later — **not** required if manual UAT accepted (A3)
- [ ] Framework install: **do not** add for this phase unless user requests

**UAT checklist (minimum):**
1. Auth: login / cadastro / aguardando
2. Painel, Pacientes (list + open ficha), Agenda (month + day list + Google strip), Quadro
3. Equipe (empresa), Financeiro (autônomo)
4. Ficha: all tabs; silhueta mark; gallery upload/lightbox; evolução modal
5. Open Modal + ConfirmDialog; confirm primary actions not under home indicator
6. Toast appears above bottom nav
7. `lg` desktop: sidebar + rounded panel intact

## Security Domain

> Layout-only phase; no new auth/data flows. `security_enforcement` not disabled in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (UI layout only on existing auth pages) | — |
| V3 Session Management | no | — |
| V4 Access Control | no (do not weaken route guards) | Keep `ProtectedRoute` / account redirects |
| V5 Input Validation | no new inputs | Existing zod forms unchanged |
| V6 Cryptography | no | — |

### Known Threat Patterns for responsive UI patches

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Accidental CTA exposure under overlay | Elevation / UX spoof | Maintain z-index: modal 100 &gt; nav 30; do not lower |
| Clickjacking via transparent overlays | Tampering | Keep explicit backdrop buttons with aria-labels |
| Leaking bakery admin routes | Information | Do not re-register orphan routes |

## Sources

### Primary (HIGH confidence)
- In-repo files listed in File List — layout classes verified by Read/Grep 2026-09-19
- [tailwindcss.com/docs/responsive-design](https://tailwindcss.com/docs/responsive-design) — breakpoints, mobile-first
- [MDN Viewport meta / viewport-fit](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag) — safe-area prerequisite
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) — 44×44 CSS px
- `src/routes/index.tsx` — live vs bakery scope
- `.planning/phases/10-responsividade-mobile/10-CONTEXT.md` — D-01–D-06
- `.planning/REQUIREMENTS.md` REQ-22 — acceptance criteria

### Secondary (MEDIUM confidence)
- npm/`node_modules` Tailwind 4.3.3 version pin vs package.json `^4.1.7`

### Tertiary (LOW confidence)
- Physical-device safe-area behavior without Simulator run in this research session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libs; Tailwind verified installed
- Architecture: HIGH — routes + shell + page patterns read from source
- Pitfalls: HIGH — overflow/`min-w-0`/hover-hide/safe-area are well-known and evidenced in-repo

**Research date:** 2026-09-19
**Valid until:** 2026-10-19 (stable UI stack; re-check if Tailwind major bump)

## Graph Context

`graphify` is disabled in this project (`gsd-tools graphify status` → not enabled). No graph relationships injected.
