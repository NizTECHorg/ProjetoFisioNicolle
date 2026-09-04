<!-- refreshed: 2026-09-04 -->
# Architecture

**Analysis Date:** 2026-09-04

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Browser SPA (FLUXO)                                  │
│  `index.html` → `src/main.tsx` → `src/App.tsx` → `src/routes/index.tsx`    │
├──────────────────┬──────────────────┬──────────────────┬────────────────────┤
│  Pages           │  Feature panels  │  App chrome      │  Auth gates        │
│  `src/pages/`    │  `components/    │  `AppShell`      │  `ProtectedRoute`  │
│                  │   patients/`     │  `src/components │  `GuestRoute`      │
│                  │                  │   /layout/`      │                    │
└────────┬─────────┴────────┬─────────┴────────┬─────────┴─────────┬──────────┘
         │                  │                  │                   │
         ▼                  ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Query + session layer                                                       │
│  TanStack Query hooks: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts` │
│  Auth context: `src/providers/AuthProvider.tsx` + `src/hooks/useAuth.ts`    │
│  Toasts: `src/stores/toast.store.ts`                                         │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Domain services (snake_case DB → camelCase UI)                              │
│  `src/services/*.service.ts`                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Supabase (Postgres + Auth + RLS)                                            │
│  Client: `src/lib/supabase/client.ts`                                        │
│  Env gate: `src/config/env.ts`                                               │
│  Optional AI: Gemini via `src/services/aiPhysicalEvaluation.service.ts`      │
└─────────────────────────────────────────────────────────────────────────────┘
```

FLUXO is a clinic/physiotherapy SPA. There is no application backend in this repo. The browser talks to Supabase with the anon key; Postgres RLS is the security authority. A leftover bakery/confectionery domain (`src/services/modules.service.ts`, `src/hooks/queries.ts`, unrouted pages) still lives in `src/` but is not mounted in `src/routes/index.tsx`.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Vite entry | Mount React, create the QueryClient, load global CSS | `src/main.tsx` |
| App root | Env gate, BrowserRouter, AuthProvider, toasts | `src/App.tsx` |
| Router | Guest vs protected trees, AppShell outlet, redirects | `src/routes/index.tsx` |
| Auth provider | Session + active `profiles` row; `isAuthenticated` requires both | `src/providers/AuthProvider.tsx` |
| Route guards | Redirect guests, block session-without-profile, safe post-login path | `src/components/auth/ProtectedRoute.tsx` |
| App chrome | Sidebar + mobile nav from `navigationItems` | `src/components/layout/AppShell.tsx` |
| Navigation config | Top-level clinic paths | `src/config/navigation.ts` |
| Env | Validate `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | `src/config/env.ts` |
| Supabase client | Lazy singleton + Proxy so imports do not throw before env is ready | `src/lib/supabase/client.ts` |
| Auth service | Login/register/sign-out/profile; Zod + client rate limit | `src/services/auth.service.ts` |
| Patients service | List/detail/dashboard/alerts; maps DB rows to UI models | `src/services/patients.service.ts` |
| Sessions service | Patient sessions + evolutions + therapist list | `src/services/sessions.service.ts` |
| Evaluations service | Structured initial evaluations (`patient_evaluations`) | `src/services/evaluations.service.ts` |
| Calendar service | Range query + create/update session status | `src/services/calendar.service.ts` |
| Board service | Kanban columns/cards + due dates shown on Agenda | `src/services/board.service.ts` |
| AI evaluation | Client-side Gemini PDF analysis; localStorage cache in the panel | `src/services/aiPhysicalEvaluation.service.ts` |
| Bakery leftover | Catalog/orders/finance/tasks/RPCs — do not extend for clinic work | `src/services/modules.service.ts` |
| Clinic query hooks | Query keys, invalidate, toast on mutation | `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts` |
| Bakery query hooks | Unrouted leftover — do not add clinic queries here | `src/hooks/queries.ts` |
| Patient record | Tabbed ficha (`?aba=`) composing feature panels | `src/pages/PatientPage.tsx` |
| Security helpers | Sanitize, safe redirect, auth/db error maps, client rate limit | `src/lib/security/index.ts` |

## Pattern Overview

**Overall:** Layered SPA with a service-per-domain data access layer. Server state lives in TanStack Query. Session identity lives in React context. UI notifications live in a Zustand store.

**Key Characteristics:**
- Pages and feature panels call hooks, not `supabase` directly.
- Services own table access, row mapping, and thrown `Error` messages.
- Forms validate with Zod (`src/schemas/`) + `react-hook-form` + `@hookform/resolvers/zod`.
- Clinic UI types are hand-written in `src/types/patient.ts` and `src/types/evaluation.ts`. `src/types/database.types.ts` still describes the leftover bakery schema plus `profiles`.
- Patient modules that are not built yet use stub routes (`src/pages/PatientModuleStubPage.tsx`), not empty tables.

## Layers

**Presentation:**
- Purpose: Screens, layout, and feature panels. Compose hooks and UI primitives. No Supabase imports.
- Location: `src/pages/`, `src/components/`
- Contains: Routed clinic pages, patient panels, auth layout, shared UI kit
- Depends on: hooks, schemas, types, `src/lib/security`, `src/config/navigation.ts`
- Used by: `src/routes/index.tsx`, `src/App.tsx`

**Auth / session:**
- Purpose: Resolve Supabase session + active profile before any clinic screen renders.
- Location: `src/providers/AuthProvider.tsx`, `src/hooks/useAuth.ts`, `src/components/auth/`
- Contains: Context value, loading gate, guest/protected outlets
- Depends on: `src/services/auth.service.ts`, `src/lib/supabase/client.ts`
- Used by: every protected page via `useAuth()`

**Query hooks:**
- Purpose: Cache clinic reads, run mutations, invalidate related keys, toast success/error.
- Location: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`
- Contains: `useQuery` / `useMutation` wrappers only — no JSX, no raw `.from()`
- Depends on: matching `src/services/*.service.ts`, `src/stores/toast.store.ts`
- Used by: pages and `src/components/patients/`

**Domain services:**
- Purpose: Talk to Postgres/Auth. Map `snake_case` rows to camelCase UI models. Throw on PostgREST errors.
- Location: `src/services/`
- Contains: async functions, private mappers, column lists
- Depends on: `src/lib/supabase/client.ts`, `src/types/*`, sometimes `src/schemas/*` and `src/lib/security`
- Used by: hooks; auth pages also call `src/services/auth.service.ts` directly

**Shared libraries:**
- Purpose: Env, Supabase client, sanitization, formatting, role helpers, labels.
- Location: `src/config/`, `src/lib/`
- Contains: singletons and pure helpers
- Depends on: `import.meta.env`, `@supabase/supabase-js`
- Used by: services, hooks, pages

**Remote store:**
- Purpose: Persist clinic data and identities.
- Location: Supabase project (not a first-class migrations tree in git — `.gitignore` ignores `/supabase/`)
- Contains: `profiles`, `patients`, `patient_*`, `board_*`; leftover bakery tables/RPCs
- Used by: services via the anon client under RLS

## Data Flow

### Primary Request Path

1. `index.html` loads `/src/main.tsx` and mounts `#root`.
2. `src/main.tsx` wraps the tree in `QueryClientProvider` (staleTime 60s, mutation retry 0).
3. `src/App.tsx` returns `SetupPage` when `env.isConfigured` is false (`src/config/env.ts`).
4. Configured builds wrap `AppRoutes` in `BrowserRouter` + `AuthProvider` + `ToastViewport` (`src/App.tsx`).
5. `src/routes/index.tsx` sends `/` and `/cadastro` through `GuestRoute`; clinic paths through `ProtectedRoute` → `AppShell`.
6. `AuthProvider` (`src/providers/AuthProvider.tsx`) reads `supabase.auth.getSession()` and `onAuthStateChange` **synchronously**, then loads `profiles` via `fetchProfile` in a separate effect.
7. `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`) waits for `isLoading`, redirects missing session to `/`, and blocks session-without-active-profile.
8. A page (for example `src/pages/PatientsPage.tsx`) calls `usePatients()` / `useCreatePatient()` from `src/hooks/usePatients.ts`.
9. The hook calls `src/services/patients.service.ts`, which queries `patients` / related tables through `src/lib/supabase/client.ts`.
10. Mutations invalidate query keys and call `toast()` from `src/stores/toast.store.ts`.

### Login Path

1. `src/pages/auth/LoginPage.tsx` validates with `loginSchema` (`src/schemas/auth.schema.ts`).
2. `signInWithEmail` in `src/services/auth.service.ts` re-parses, sanitizes, applies client rate limit (`src/lib/security/index.ts`), then `supabase.auth.signInWithPassword`.
3. `onAuthStateChange` updates session; the profile effect loads an active `profiles` row.
4. `GuestRoute` redirects an existing session to `safeRedirectPath` (default `/painel`).
5. `isAuthenticated` is `!!session && !!profile` (`src/providers/AuthProvider.tsx`). A user without an active profile sees `AccountWithoutProfile`, not the clinic.

### Patient Record Path

1. List: `src/pages/PatientsPage.tsx` → `usePatients()` → `listPatients()` (`src/services/patients.service.ts`) → `patients` + `patient_sessions`.
2. Create: Zod `createPatientSchema` (`src/schemas/patient.schema.ts`) → `useCreatePatient()` → `createPatient()` inserts `status: 'avaliacao'` and a generated `PAC-******` code, then navigates to `/pacientes/:id`.
3. Ficha: `src/pages/PatientPage.tsx` reads `?aba=` and sets `PatientTab` (`resumo` | `cadastro` | `evolucoes` | `avaliacao`).
4. Header + tab switch live in `src/components/patients/PatientProfileHeader.tsx`.
5. `resumo` uses `usePatientDashboard()` (always) and `usePatient()` (after dashboard exists).
6. `cadastro` renders `src/components/patients/PatientCadastroPanel.tsx` (alerts via `src/components/patients/PatientAlertsPanel.tsx`).
7. `evolucoes` renders `src/components/patients/PatientEvolutionsPanel.tsx` → session hooks → `src/services/sessions.service.ts`.
8. `avaliacao` renders `src/components/patients/PatientEvaluationPanel.tsx` → evaluation hooks → `src/services/evaluations.service.ts`, plus PDF AI in `src/components/patients/PatientPhysicalEvaluationPanel.tsx`.
9. Legacy `/pacientes/:id/cadastro` redirects to `?aba=cadastro` (`src/pages/PatientCadastroPage.tsx`). `/pacientes/:id/evolucoes` redirects to `?aba=evolucoes`. Other `/:module` values show `src/pages/PatientModuleStubPage.tsx`.

### Calendar + Board Path

1. `src/pages/CalendarPage.tsx` loads `useCalendarSessions(from, to)` and `useBoard()` from `src/hooks/useClinic.ts`.
2. Sessions come from `patient_sessions` joined to `patients` (`src/services/calendar.service.ts`).
3. Board due dates overlay the month grid (cards with `due_on` from `src/services/board.service.ts`).
4. `src/pages/KanbanPage.tsx` mutates columns/cards; creating a card with `dueOn` surfaces it on Agenda.
5. Patient session writes invalidate `['patients']`, `['patients', id, …]`, and `['calendar-sessions']` (`invalidatePatient` in `src/hooks/usePatients.ts`).

### AI Physical Evaluation Path

1. `src/components/patients/PatientPhysicalEvaluationPanel.tsx` accepts a PDF and calls `analyzePhysicalEvaluationPdf` (`src/services/aiPhysicalEvaluation.service.ts`).
2. The service POSTs Base64 to `https://generativelanguage.googleapis.com` when `VITE_GEMINI_API_KEY` is set; otherwise it returns a demo payload.
3. Results persist in `localStorage` under `fisio.evaluations.${patientId}` — not in `patient_evaluations`.
4. “Apply to chart” uses `useUpdatePatient()` to write `complaint` / `diagnosis` on `patients`.

**State Management:**
- **Server/clinic data:** TanStack Query only. Query keys: `['patients']`, `['patients', id]`, `['patients', id, 'dashboard']`, `['patients', id, 'sessions']`, `['patients', id, 'evaluations']`, `['calendar-sessions', fromIso, toIso]`, `['board']`, `['board-dues', from, to]`, `['therapists']`. Invalidate the shared prefix, not a one-off key, when a write touches related screens.
- **Auth:** React context from `AuthProvider`. Do not store session in Zustand.
- **Toasts:** Zustand `useToastStore` / `toast()` in `src/stores/toast.store.ts`.
- **Ephemeral UI:** `useState` in the page/panel (modals, tab local helpers, drag state).
- **Client-only caches:** `sessionStorage` key `fisio.auth.rate` (auth rate limit); `localStorage` key `fisio.evaluations.${id}` (AI PDF results).

## Key Abstractions

**Domain service:**
- Purpose: One file per clinic capability. Export async functions. Keep mappers private.
- Examples: `src/services/patients.service.ts`, `src/services/sessions.service.ts`, `src/services/evaluations.service.ts`, `src/services/calendar.service.ts`, `src/services/board.service.ts`
- Pattern: `throwIfError` (or `mapAuthError` / `mapDbError`) → return mapped camelCase objects. Never return raw PostgREST rows to UI.

**Query hook module:**
- Purpose: Bind a service to cache + toast.
- Examples: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`
- Pattern: shared `onError` → `toast(..., 'error')`; mutations invalidate the same key family the page reads.

**UI model vs table row:**
- Purpose: Pages consume `Patient`, `PatientListItem`, `PatientDashboard`, `PatientEvaluation` — not `PatientRow`.
- Examples: `src/types/patient.ts`, `src/types/evaluation.ts`
- Pattern: add fields on the UI type, then map in the service. Do not leak `full_name` into new clinic components; use `name`.

**Zod form schema:**
- Purpose: Client validation before mutate.
- Examples: `src/schemas/auth.schema.ts`, `src/schemas/patient.schema.ts`, `src/schemas/evaluation.schema.ts`
- Pattern: `z.object` + `z.infer` exported as `*FormData`. Wire with `zodResolver` in the page/panel.

**Patient tab:**
- Purpose: One route, several clinical surfaces.
- Examples: `src/pages/PatientPage.tsx`, `src/components/patients/PatientProfileHeader.tsx`
- Pattern: `?aba=` query param. Add a tab by extending `PatientTab`, the header nav, and the switch in `PatientPage`. Use `PatientModuleStubPage` only for not-yet-built modules.

**Route gate:**
- Purpose: Separate “has session” from “may use the product”.
- Examples: `src/components/auth/ProtectedRoute.tsx`
- Pattern: loading spinner → no session → `/` → session without profile → `AccountWithoutProfile` → `<Outlet />`.

## Entry Points

**Browser bootstrap:**
- Location: `index.html`, `src/main.tsx`
- Triggers: Vite `npm run dev` / static `dist` host (`netlify.toml`, `vercel.json`, `public/_redirects` all rewrite to `index.html`)
- Responsibilities: CSP/security headers in HTML; React 19 root; QueryClient defaults

**Application shell:**
- Location: `src/App.tsx`
- Triggers: every load
- Responsibilities: refuse to boot without valid HTTPS Supabase env; otherwise provide router + auth + toasts

**HTTP routes:**
- Location: `src/routes/index.tsx`
- Triggers: React Router
- Responsibilities: map clinic URLs. Active: `/`, `/cadastro`, `/painel`, `/pacientes`, `/pacientes/:id`, `/pacientes/:id/cadastro`, `/pacientes/:id/:module`, `/agenda`, `/quadro` (`/kanban` → `/quadro`). Catch-all inside the shell goes to `/pacientes`.

**Supabase:**
- Location: `src/lib/supabase/client.ts`
- Triggers: first property access on the `supabase` Proxy after `env.isConfigured`
- Responsibilities: PKCE session, `X-Client-Info: fisio-web`. Do not instantiate a second client.

**SQL bootstrap (local file, gitignored directory):**
- Location: `supabase/patients-req05-evaluations.sql`
- Triggers: manual paste in Supabase SQL Editor
- Responsibilities: `patient_evaluations` table + permissive authenticated RLS. Other clinic tables are assumed already in the remote project.

## Architectural Constraints

- **Threading:** Single-threaded browser event loop. `onAuthStateChange` in `src/providers/AuthProvider.tsx` must stay synchronous — awaiting DB work inside that callback deadlocks supabase-js auth and freezes login.
- **Global state:** `QueryClient` in `src/main.tsx`; Supabase singleton in `src/lib/supabase/client.ts`; Zustand toast store in `src/stores/toast.store.ts`; Auth context in `src/hooks/useAuth.ts`; client rate-limit maps in `src/lib/security/index.ts`.
- **Circular imports:** `src/providers/AuthProvider.tsx` imports `AuthContext` from `src/hooks/useAuth.ts`. Keep the context object in the hook file; do not import `AuthProvider` from `useAuth.ts`.
- **Layering:** Pages/components must not import `@/lib/supabase/client`. Services must not import React, hooks, or pages. Hooks must not call `.from()` / `.rpc()`.
- **Security authority:** Client checks (Zod, `src/lib/permissions.ts`, rate limit) are UX only. RLS and Auth on Supabase are authoritative.
- **Dual domain:** Do not register leftover bakery pages (`src/pages/OrdersPage.tsx`, `src/pages/ProductsPage.tsx`, …) or add clinic logic to `src/services/modules.service.ts` / `src/hooks/queries.ts`.
- **Types:** Clinic tables are not modeled in `src/types/database.types.ts`. The Supabase client is typed as `any` on purpose (`src/lib/supabase/client.ts`) because generated Insert/Update types collapsed to `never`. New clinic shapes go in `src/types/patient.ts` or a new `src/types/<domain>.ts`.
- **Hosting:** SPA only. `netlify.toml` and `vercel.json` rewrite all paths to `index.html`. There are no Edge Functions or API routes in this repo.

## Anti-Patterns

### Calling Supabase from a page or panel

**What happens:** A component imports `supabase` and runs `.from()` / `.auth`.
**Why it's wrong:** Bypasses mapping, query-key invalidation, and the env Proxy. Duplicates error handling. The current clinic pages do not do this.
**Do this instead:** Add a function in the matching `src/services/*.service.ts` and a hook in `src/hooks/usePatients.ts` or `src/hooks/useClinic.ts`. Auth forms are the exception: they may call `src/services/auth.service.ts` directly (`src/pages/auth/LoginPage.tsx`).

### Extending the bakery module service for clinic features

**What happens:** New patient/agenda code is appended to `src/services/modules.service.ts` or `src/hooks/queries.ts`.
**Why it's wrong:** That stack is the unrouted confectionery domain (orders, recipes, RPCs like `confirm_order`). Clinic query keys and mappings already live in dedicated files.
**Do this instead:** New clinic file `src/services/<domain>.service.ts` + hook module. Leave `modules.service.ts` untouched unless the work is explicitly the leftover domain.

### Treating `database.types.ts` as the clinic schema

**What happens:** New patient fields are added only to `src/types/database.types.ts`, or UI reads `full_name` / bakery `EmployeeRole` values.
**Why it's wrong:** That file is the bakery `Database` shape plus `profiles`. Clinic UI already uses `src/types/patient.ts` (`name`, `PatientStatus`, `SessionStatus`).
**Do this instead:** Extend `src/types/patient.ts` or `src/types/evaluation.ts` and map in the service.

### Async work inside `onAuthStateChange`

**What happens:** `await fetchProfile(...)` (or any query) inside the auth callback in `src/providers/AuthProvider.tsx`.
**Why it's wrong:** supabase-js holds an internal auth lock; this is the documented infinite-spinner login bug.
**Do this instead:** Set `session` synchronously. Load profile in the `userId` effect already in `AuthProvider`.

### New top-level route without navigation + query keys

**What happens:** A page is added to `src/routes/index.tsx` but not `src/config/navigation.ts`, or it fetches in `useEffect` instead of a hook.
**Why it's wrong:** Desktop/mobile nav drift; cache will not invalidate across Dashboard / Agenda / ficha.
**Do this instead:** Register the path in both `navigationItems` and `mobileNavItems` (`src/config/navigation.ts`) and use the shared query-key families.

### Persisting clinical AI output only in `localStorage`

**What happens:** Structured evaluation data stays in `fisio.evaluations.${id}` (`src/components/patients/PatientPhysicalEvaluationPanel.tsx`) and never reaches `patient_evaluations`.
**Why it's wrong:** Data is per-browser, not shared, not RLS-protected, and diverges from `src/services/evaluations.service.ts`.
**Do this instead:** If the result is clinical record, write through `useCreatePatientEvaluation` / `updatePatient`. Keep localStorage only for draft/demo analysis.

## Error Handling

**Strategy:** Services throw `Error`. Hooks toast. Pages show query `isError` / `isLoading` blocks. Auth forms keep a local `serverError` string.

**Patterns:**
- Clinic services: `throwIfError(error)` with `error.message` (`src/services/patients.service.ts`, `src/services/sessions.service.ts`, `src/services/evaluations.service.ts`, `src/services/calendar.service.ts`, `src/services/board.service.ts`).
- Auth: `mapAuthError` + rate-limit message (`src/services/auth.service.ts`, `src/lib/security/index.ts`).
- Leftover bakery: `mapDbError` / `throwDb` in `src/services/modules.service.ts`.
- Mutations: shared `onError` in `src/hooks/usePatients.ts` and `src/hooks/useClinic.ts` → `toast(message, 'error')`.
- Reads: page-level empty/error cards (see `src/pages/PatientPage.tsx`, `src/pages/PatientsPage.tsx`).
- Missing patient id: `<Navigate to="/pacientes" />`.
- Open-redirect: `safeRedirectPath` (`src/lib/security/index.ts`) used by `GuestRoute` and `LoginPage`.

## Cross-Cutting Concerns

**Logging:** No logging SDK. User-visible errors go through toast or inline alerts. Do not add `console.log` in services for control flow.

**Validation:** Zod schemas in `src/schemas/`. Auth service re-parses on the way in. `src/lib/security/index.ts` sanitizes email/text and escapes ILIKE wildcards. Postgres check/unique errors are mapped only on the bakery path (`mapDbError`).

**Authentication:** Supabase Auth (email/password, PKCE) in `src/services/auth.service.ts`. Product access requires `profiles.is_active = true` (`fetchProfile`). Role strings on `profiles.role` still use bakery enums (`administrador`, `gerente`, `atendente`, `confeiteiro`, `entregador`) — `src/components/layout/AppShell.tsx` remaps several to “Fisioterapeuta”. `src/lib/permissions.ts` is bakery capability helpers (`canManageOrders`, …); do not use those names for new clinic authorization. Prefer RLS and, if needed, a clinic-specific helper next to `src/lib/permissions.ts`.

**Styling:** Tailwind v4 tokens in `src/index.css` (`forest`, `accent`, `canvas`, `surface`, `ink`). Use the `src/components/ui/` kit (`Button`, `Input`, `Modal`, `PageHeader`, `PatientAvatar`, …) instead of new raw controls.

**i18n:** Hard-coded pt-BR copy and `Intl.DateTimeFormat('pt-BR')` in services/pages. Keep new UI strings in Portuguese.

---

*Architecture analysis: 2026-09-04*
