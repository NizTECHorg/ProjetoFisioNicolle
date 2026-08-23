<!-- refreshed: 2026-08-23 -->
# Architecture

**Analysis Date:** 2026-08-23

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Presentation (React SPA)                     │
├──────────────────┬──────────────────┬───────────────────────┤
│  Pages           │  Feature UI      │  Shell / Auth UI      │
│  `src/pages/`    │  `components/`   │  `AppShell`, routes   │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Data Hooks (TanStack Query + Auth Context)         │
│  `src/hooks/usePatients.ts` · `useClinic.ts` · `useAuth.ts`  │
│  `src/hooks/queries.ts` (legacy bakery modules, unrouted)    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Domain Services + Zod Schemas                   │
│  `src/services/*.service.ts` · `src/schemas/` · `src/types/` │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (Auth + Postgres + RLS)                            │
│  `src/lib/supabase/client.ts` · SQL in `supabase/*.sql`     │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Bootstrap | Mount React, QueryClient defaults | `src/main.tsx` |
| App gate | Env check → Setup or router + auth | `src/App.tsx` |
| Routes | Guest vs protected trees, clinic paths | `src/routes/index.tsx` |
| AuthProvider | Session + profile loading, signOut | `src/providers/AuthProvider.tsx` |
| Route guards | Require session/profile; redirect guests | `src/components/auth/ProtectedRoute.tsx` |
| AppShell | Sidebar/mobile nav, outlet for pages | `src/components/layout/AppShell.tsx` |
| Patient hooks | List/detail/dashboard/alert mutations | `src/hooks/usePatients.ts` |
| Clinic hooks | Calendar sessions + kanban board | `src/hooks/useClinic.ts` |
| Patient service | Supabase CRUD + row→domain mapping | `src/services/patients.service.ts` |
| Calendar service | `patient_sessions` range queries | `src/services/calendar.service.ts` |
| Board service | Columns/cards + due cards | `src/services/board.service.ts` |
| Auth service | Login/register/signOut/profile fetch | `src/services/auth.service.ts` |
| Security helpers | Sanitize, rate limit, safe redirects | `src/lib/security/index.ts` |
| Toast store | Ephemeral UI feedback (Zustand) | `src/stores/toast.store.ts` |
| SQL schemas | Manual Postgres DDL for Supabase | `supabase/*.sql` |

## Pattern Overview

**Overall:** Client-side SPA with BaaS (Supabase) — layered feature slices, no custom API server.

**Key Characteristics:**
- Pages orchestrate UI; domain I/O lives in `src/services/`; React Query hooks wrap services for cache/invalidation.
- Auth is session + active `profiles` row; RLS is the server-side authority.
- Clinic domain (patients, agenda, quadro) is the routed product surface; bakery/ERP pages and `modules.service` remain in the tree but are not mounted in `src/routes/index.tsx`.
- Domain types for patients use camelCase app models in `src/types/patient.ts`; services map from snake_case DB rows.

## Layers

**Presentation:**
- Purpose: Screens, layout, presentational components, forms
- Location: `src/pages/`, `src/components/`
- Contains: Route pages, patient panels, shared UI primitives, auth layout
- Depends on: Hooks, schemas (via react-hook-form + zodResolver), UI components
- Used by: Router outlet under `AppShell` / guest routes

**Application / data hooks:**
- Purpose: Cache keys, mutations, toast on success/error, query enablement
- Location: `src/hooks/`
- Contains: `usePatients`, `useClinic`, `useAuth`, legacy `queries.ts`
- Depends on: Services, toast store
- Used by: Pages and feature components

**Domain services:**
- Purpose: Supabase calls, boundary validation (Zod in auth), row mapping, throw user-facing errors
- Location: `src/services/`
- Contains: `patients`, `calendar`, `board`, `auth`, legacy `modules`
- Depends on: `supabase` client, types, schemas (auth), security helpers
- Used by: Hooks primarily; auth pages may call `auth.service` directly

**Infrastructure:**
- Purpose: Env, Supabase singleton, security utilities, permissions helpers
- Location: `src/config/`, `src/lib/`
- Contains: `env.ts`, `lib/supabase/client.ts`, `lib/security/`, `lib/permissions.ts`, `lib/avatar.ts`
- Depends on: Vite `import.meta.env`
- Used by: App bootstrap, services, auth UI

**Persistence (external):**
- Purpose: Auth users, profiles, patients, sessions, board tables, RLS policies
- Location: Supabase project; DDL scripts in `supabase/`
- Contains: `schema.sql`, `patients.sql`, additive req SQL, `board.sql`, `board-due.sql`
- Depends on: Manual apply in Supabase SQL Editor
- Used by: Service layer via PostgREST

## Data Flow

### Primary Request Path (authenticated clinic feature)

1. Browser loads SPA; `createRoot` mounts with `QueryClientProvider` (`src/main.tsx`).
2. `App` checks `env.isConfigured`; if false, render `SetupPage`; else `BrowserRouter` + `AuthProvider` + `AppRoutes` (`src/App.tsx`).
3. `AuthProvider` loads session via `supabase.auth.getSession` / `onAuthStateChange`, then `fetchProfile` (`src/providers/AuthProvider.tsx`).
4. `ProtectedRoute` allows outlet only when `session` + active profile (`isAuthenticated`) (`src/components/auth/ProtectedRoute.tsx`).
5. Page (e.g. `PatientsPage`) calls `usePatients()` → `listPatients()` → `supabase.from(...)` (`src/hooks/usePatients.ts`, `src/services/patients.service.ts`).
6. Mutations invalidate query keys (`['patients']`, `['patients', id]`, etc.) and push toast via `toast()` (`src/stores/toast.store.ts`).

### Auth login flow

1. `LoginPage` validates with `loginSchema` + `zodResolver` (`src/pages/auth/LoginPage.tsx`).
2. `signInWithEmail` sanitizes, rate-limits, calls `supabase.auth.signInWithPassword` (`src/services/auth.service.ts`).
3. Auth state change updates context; `GuestRoute` redirects authenticated users via `safeRedirectPath` (`src/lib/security/index.ts`).

### Patient detail + cadastro

1. Route `/pacientes/:id` → `PatientPage` loads `usePatient` + `usePatientDashboard`.
2. Cadastro/alerts UI lives in `PatientCadastroPanel` / `PatientAlertsPanel` under `src/components/patients/`.
3. Legacy `/pacientes/:id/cadastro` redirects to `?aba=cadastro` (`src/pages/PatientCadastroPage.tsx`).
4. Unbuilt clinical modules hit `/pacientes/:id/:module` → `PatientModuleStubPage`.

**State Management:**
- Server state: TanStack Query (staleTime 60s default in `main.tsx`; per-hook overrides).
- Auth state: React Context (`AuthProvider` + `useAuth`).
- UI ephemeral: Zustand toast store only — no global store for domain entities.
- Local UI: `useState` / form state in pages and panels.

## Key Abstractions

**Domain patient model:**
- Purpose: App-facing patient/session/alert shapes (camelCase), separate from DB rows
- Examples: `src/types/patient.ts`
- Pattern: Service maps snake_case rows to domain types before returning to hooks

**Service module:**
- Purpose: One domain area per `*.service.ts`; exported async functions; local `throwIfError`
- Examples: `src/services/patients.service.ts`, `src/services/board.service.ts`, `src/services/calendar.service.ts`
- Pattern: No React imports; pure async I/O plus mapping

**Query/mutation hook:**
- Purpose: Stable `queryKey`s, invalidate related keys, surface errors via toast
- Examples: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`
- Pattern: `useQuery` / `useMutation` wrapping a single service function

**Zod form schema:**
- Purpose: Client validation for forms and service auth payloads
- Examples: `src/schemas/patient.schema.ts`, `src/schemas/auth.schema.ts`
- Pattern: `react-hook-form` + `zodResolver`; infer form types from schemas

**Lazy Supabase client:**
- Purpose: Singleton client created only when env is configured
- Examples: `src/lib/supabase/client.ts`
- Pattern: `getSupabase()` plus Proxy export `supabase` for ergonomic imports

**Route layout nesting:**
- Purpose: Shared chrome and auth gates without prop drilling
- Examples: `src/routes/index.tsx`, `ProtectedRoute`, `AppShell`
- Pattern: React Router layout routes with `<Outlet />`

## Entry Points

**Vite / browser:**
- Location: `index.html` → `src/main.tsx`
- Triggers: Dev server (`npm run dev`) or static host (Vercel SPA rewrite in `vercel.json`)
- Responsibilities: Create root, QueryClient, render `App`

**Application shell:**
- Location: `src/App.tsx`
- Triggers: After mount when env configured
- Responsibilities: Router, auth provider, routes, toast viewport; otherwise `SetupPage`

**Route table:**
- Location: `src/routes/index.tsx`
- Triggers: Navigation
- Responsibilities: Guest (`/`, `/cadastro`), protected clinic routes under `AppShell`

**Database scripts:**
- Location: `supabase/*.sql`
- Triggers: Manual run in Supabase SQL Editor
- Responsibilities: profiles/auth bootstrap, patients clinical schema, board tables, additive reqs

## Architectural Constraints

- **Threading:** Single-threaded browser event loop; no Web Workers detected.
- **Global state:** Module-level Supabase client singleton (`src/lib/supabase/client.ts`); Zustand toast store; QueryClient instance created in `main.tsx`.
- **Circular imports:** Avoid importing pages from services. Context is declared in `src/hooks/useAuth.ts` and provided from `src/providers/AuthProvider.tsx` — keep provider as the only writer of auth context.
- **No custom backend:** All persistence goes through Supabase JS client; do not add Express/Next API routes in this repo's current shape.
- **Auth callback sync rule:** `onAuthStateChange` handler must stay synchronous (no await inside callback) to avoid supabase-js auth lock deadlocks — load profile in a separate effect (`AuthProvider`).
- **Dual codebase domains:** Active clinic routes vs orphan bakery pages (`ProductsPage`, `OrdersPage`, etc.) and `modules.service` / `hooks/queries.ts`. Prefer clinic patterns for new work.

## Anti-Patterns

### Calling Supabase from page components

**What happens:** Page imports `supabase` and runs `.from()` inline.
**Why it's wrong:** Bypasses mapping, error mapping, and query-key conventions; duplicates logic.
**Do this instead:** Add/extend a function in `src/services/*.service.ts` and a hook in `src/hooks/`.

### Putting domain entities in Zustand

**What happens:** Global store mirrors patient lists or board state.
**Why it's wrong:** Diverges from React Query cache already used for server state.
**Do this instead:** Use TanStack Query keys; reserve Zustand for UI-only concerns like toasts (`src/stores/toast.store.ts`).

### Wiring bakery pages into clinic navigation without a domain decision

**What happens:** Re-adding `ProductsPage` / `OrdersPage` under `AppShell` using `hooks/queries.ts`.
**Why it's wrong:** Those modules target a food-business schema (`database.types.ts` products/orders), not physiotherapy.
**Do this instead:** Build new clinic features via `patients` / `calendar` / `board` services (or a new dedicated service), and keep nav in `src/config/navigation.ts` aligned with `src/routes/index.tsx`.

### Awaiting work inside `onAuthStateChange`

**What happens:** Profile fetch inside the auth listener callback.
**Why it's wrong:** Can deadlock supabase-js auth lock (infinite login spinner) — documented in `AuthProvider`.
**Do this instead:** Set session synchronously; fetch profile in a `useEffect` keyed on `userId`.

## Error Handling

**Strategy:** Services throw `Error` with user-safe Portuguese messages; hooks catch via mutation `onError` and toast; auth forms set local `serverError` state.

**Patterns:**
- `throwIfError(error)` after Supabase responses in services (`patients.service.ts`, `board.service.ts`, `calendar.service.ts`).
- `mapAuthError` / `mapDbError` in `src/lib/security/index.ts` for sanitized messages.
- Client-side rate limiting for auth attempts (`checkRateLimit`) — complementary to server limits, not a replacement.
- React Query: mutations `retry: 0`; queries `retry: 1` (defaults in `main.tsx`).

## Cross-Cutting Concerns

**Logging:** No dedicated logger; prefer user toasts over `console` for product errors. Dev may use browser console only.

**Validation:** Zod schemas in `src/schemas/`; auth service re-parses with Zod before calling Supabase; forms use `zodResolver`.

**Authentication:** Supabase Auth (PKCE, persisted session) + `profiles` row required for `isAuthenticated`. Route guards in `ProtectedRoute` / `GuestRoute`. Role helpers in `src/lib/permissions.ts` still reflect bakery role names used by legacy pages.

**Styling:** Global tokens/utilities in `src/index.css`; Tailwind v4 via `@tailwindcss/vite` (`vite.config.ts`). Prefer existing forest/canvas/ink token classes used by `AppShell` and clinic pages.

**Navigation config:** Sidebar and mobile items in `src/config/navigation.ts` must stay in sync with protected routes in `src/routes/index.tsx`.

---

*Architecture analysis: 2026-08-23*
