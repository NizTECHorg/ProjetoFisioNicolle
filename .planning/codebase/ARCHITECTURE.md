<!-- refreshed: 2026-09-14 -->
# Architecture

**Analysis Date:** 2026-09-14

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser SPA (Vite + React)                      │
│  `index.html` → `src/main.tsx` → `src/App.tsx` → `src/routes/index.tsx` │
├──────────────────┬──────────────────┬───────────────────────────────────┤
│  Auth / Guest    │  App Shell       │  Clinic pages + patient panels    │
│  `pages/auth/`   │  `AppShell.tsx`  │  `pages/*Page.tsx`                │
│  `ProtectedRoute`│  `navigation.ts` │  `components/patients/`           │
└────────┬─────────┴────────┬─────────┴──────────────────┬────────────────┘
         │                  │                            │
         ▼                  ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data-access hooks                               │
│  `src/hooks/useAuth.ts`  `usePatients.ts`  `useClinic.ts`  `useTeam.ts` │
│  TanStack Query cache (`QueryClient` in `src/main.tsx`)                 │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Service layer                                   │
│  `src/services/*.service.ts`  — map snake_case rows → camelCase DTOs    │
│  Zod re-parse at auth/service boundary (`src/schemas/`)                 │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Supabase (hosted Postgres + Auth + RLS + RPCs)                         │
│  Client: `src/lib/supabase/client.ts`  Schema apply: `supabase/*.sql`   │
└─────────────────────────────────────────────────────────────────────────┘
```

The product is a **single-page clinic app** (FLUXO / Fisio). There is **no application server**. The browser talks to Supabase with the anon key. **Postgres RLS and RPCs are the authorization authority.** Client predicates in `src/lib/accountAccess.ts` are UX only.

A parallel **bakery/confeitaria domain** still lives in the tree (`src/services/modules.service.ts`, `src/hooks/queries.ts`, `src/pages/{Products,Orders,Recipes,…}Page.tsx`, `src/lib/permissions.ts`, `src/types/database.types.ts`). Those pages are **not registered** in `src/routes/index.tsx`. Do not copy bakery RBAC (`EmployeeRole`, `canManageCatalog`) into clinic features.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Vite bootstrap | QueryClient defaults, StrictMode, CSS | `src/main.tsx` |
| App root | Env gate → SetupPage; else Router + Auth + routes + toasts | `src/App.tsx` |
| Route table | Guest / waiting / protected clinic routes | `src/routes/index.tsx` |
| Auth provider | Session listener, profile + membership load, fail-closed `isAuthenticated` | `src/providers/AuthProvider.tsx` |
| Route guards | Redirect unauthenticated, pending therapist, rejected/inactive | `src/components/auth/ProtectedRoute.tsx` |
| App chrome | Drawer + mobile nav from account type | `src/components/layout/AppShell.tsx` |
| Clinic pages | Screen composition, forms, navigation | `src/pages/*.tsx` |
| Patient panels | Tab-scoped CRUD UI for ficha | `src/components/patients/*.tsx` |
| Query hooks | TanStack Query keys, invalidate, toast on mutate | `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`, `src/hooks/useTeam.ts` |
| Services | Supabase I/O + row mapping | `src/services/*.service.ts` |
| Account UX predicates | Team/ficha visibility; not authorization | `src/lib/accountAccess.ts` |
| Security helpers | Sanitize, rate-limit, map errors, safe redirects | `src/lib/security/index.ts` |
| SQL scripts | Tables, RLS, RPCs applied in Supabase SQL Editor | `supabase/*.sql` |

## Pattern Overview

**Overall:** Layered SPA with BaaS (page → hook → service → Supabase). Clinic domain is the live product; bakery modules are leftover and unrouted.

**Key Characteristics:**
- Client-only React 19 + Vite 6; SPA fallback on Netlify (`netlify.toml`) and Vercel (`vercel.json`)
- Path alias `@/` → `src/` (`vite.config.ts`, `tsconfig.json`)
- Server state in TanStack Query; session identity in React Context; toasts in Zustand
- Domain DTOs in camelCase; Postgres columns in snake_case; services own the mapping
- Authorization is RLS + RPCs. Hide write controls in UI; never treat hidden buttons as security
- SQL is pasted into the hosted SQL Editor. Root `supabase/` is gitignored; keep a copy under `.planning/phases/` when shipping schema

## Layers

**Presentation (pages + feature components):**
- Purpose: Compose screens, bind forms (react-hook-form + zodResolver), call hooks, navigate
- Location: `src/pages/`, `src/components/`
- Contains: `*Page.tsx` screens, `components/patients/*Panel.tsx`, `components/ui/*` primitives
- Depends on: hooks, schemas, types, `accountAccess` / `useAuth`, UI kit
- Used by: `src/routes/index.tsx` (pages) and pages (panels)
- Rule: Do not call `supabase` from pages. Auth screens (`LoginPage`, `RegisterPage`) are the documented exception: they call `src/services/auth.service.ts` / `team.service.ts` directly because the session is not established yet.

**Routing and session gate:**
- Purpose: Decide guest vs waiting vs clinic chrome
- Location: `src/routes/index.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/providers/AuthProvider.tsx`
- Contains: `GuestRoute`, `ProtectedRoute`, `AppShell` nested routes
- Depends on: `useAuth`, `accountAccess`, `safeRedirectPath` in `src/lib/security/index.ts`
- Used by: `src/App.tsx`
- Rule: Fail-closed. `fisioterapeuta` with pending or **null** membership is not authenticated (`AuthProvider.tsx`). Send that state to `/aguardando`.

**Data-access hooks:**
- Purpose: Own query keys, `staleTime`, mutation invalidation, success/error toasts
- Location: `src/hooks/`
- Contains: `usePatients.ts` (patients, sessions, evaluations), `usePatientImages.ts` (gallery list/upload/edit/delete), `useClinic.ts` (calendar + board), `useTeam.ts`, `useAuth.ts` (context consumer)
- Depends on: matching `src/services/*.service.ts`, `src/stores/toast.store.ts`
- Used by: pages and patient panels
- Rule: New clinic feature gets a domain hook file (`useX.ts`), not an entry in `src/hooks/queries.ts` (bakery).

**Service layer:**
- Purpose: Encapsulate Supabase calls, map rows, throw `Error` with user-facing Portuguese messages
- Location: `src/services/`
- Contains: exported async functions (no classes). Clinic: `auth`, `team`, `patients`, `sessions`, `calendar`, `board`, `evaluations`, `aiPhysicalEvaluation`. Leftover: `modules.service.ts`
- Depends on: `src/lib/supabase/client.ts`, `src/types/*`, schemas for auth; `mapDbError` for permission-sensitive RPCs
- Used by: hooks (clinic), AuthProvider, auth pages, `PatientPhysicalEvaluationPanel.tsx` (Gemini)
- Rule: Map `snake_case` → camelCase in the service. UI never reads `full_name`.

**Validation and types:**
- Purpose: Form contracts (Zod) and domain DTOs (TypeScript)
- Location: `src/schemas/`, `src/types/`
- Contains: `auth.schema.ts`, `patient.schema.ts`, `evaluation.schema.ts`; `account.ts`, `patient.ts`, `evaluation.ts`. Bakery types stay in `database.types.ts` and `modules.schema.ts`
- Depends on: nothing above services
- Used by: pages (zodResolver), services (auth parse), hooks (input types)
- Rule: Put `AccountType` / `Membership*` only in `src/types/account.ts`. Do not extend `EmployeeRole` in `src/types/database.types.ts`.

**Cross-cutting lib:**
- Purpose: Env, Supabase client, sanitization, clinic UX predicates, navigation config
- Location: `src/config/`, `src/lib/`
- Contains: `config/env.ts`, `lib/supabase/client.ts`, `lib/security/index.ts`, `lib/accountAccess.ts`, `config/navigation.ts`
- Depends on: env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Used by: all layers
- Rule: Import clinic gating from `accountAccess.ts`. Do not import `src/lib/permissions.ts` for clinic.

**Persistence (Supabase):**
- Purpose: Tables, RLS, triggers, RPCs (`lookup_organization_by_code`, `decide_membership`, `handle_new_user`)
- Location: `supabase/*.sql` (local working copies); `.planning/phases/03-tipos-de-conta-e-equipe/sql/`
- Contains: `03-account-types-team.sql`, `patients-req05-evaluations.sql`, `patients-req14-goals.sql`
- Depends on: hosted Supabase project
- Used by: the JS client via PostgREST / Auth / RPC
- Rule: Apply SQL in the Dashboard SQL Editor. Do not assume `supabase db push`. Do not insert `organization_memberships` from the client.

## Data Flow

### Primary Request Path

1. Browser loads `index.html` → `src/main.tsx` creates `QueryClient` (staleTime 60s, retry 1, no refetchOnWindowFocus) and mounts `App`.
2. `src/App.tsx` checks `env.isConfigured` (`src/config/env.ts`). If false, render `src/pages/SetupPage.tsx` and stop.
3. `BrowserRouter` + `AuthProvider` (`src/providers/AuthProvider.tsx`) + `AppRoutes` (`src/routes/index.tsx`) + `ToastViewport`.
4. `ProtectedRoute` / `GuestRoute` (`src/components/auth/ProtectedRoute.tsx`) branch on session, pending therapist, rejected/inactive, `isAuthenticated`.
5. Authenticated clinic routes render inside `AppShell` (`src/components/layout/AppShell.tsx`). Pages call `use*` hooks.
6. Hooks call services; services use `supabase.from(...)` or `supabase.rpc(...)`; RLS filters rows; services map to DTOs.
7. Mutations invalidate query keys and call `toast()` (`src/stores/toast.store.ts`).

### Authentication Flow

1. `LoginPage` (`src/pages/auth/LoginPage.tsx:34`) validates with `loginSchema`, then `signInWithEmail` (`src/services/auth.service.ts:60`).
2. Service sanitizes email, client rate-limits (`checkRateLimit`), `signInWithPassword`, then `fetchProfile` + `fetchMembership`. Rejected accounts sign out immediately.
3. `onAuthStateChange` in `AuthProvider.tsx` **must stay synchronous** (Supabase lock deadlock if awaited). Profile/membership load in a separate `useEffect` on `userId`.
4. `isAuthenticated` requires session + active profile + not pending therapist + fisio must have a membership row.
5. `GuestRoute` sends pending fisio to `/aguardando` (`WaitingApprovalPage.tsx`). Authenticated users go to `safeRedirectPath` (default `/painel`).

### Registration and team join

1. `RegisterPage` (`src/pages/auth/RegisterPage.tsx`) uses `registerSchema` (`accountType`, optional 8-char `joinCode` for `fisioterapeuta`).
2. `signUpWithEmail` stores `account_type` and `join_code` in Auth `user_metadata`. Postgres `handle_new_user` creates `profiles` / org / pending membership.
3. `lookupOrganizationByCode` (`src/services/team.service.ts:86`) calls RPC and returns **boolean only** (never org name).
4. Empresa owner lists team via `listTeamMembers` and decides via `decide_membership` RPC (`team.service.ts:141`). Page never `update`s `profiles` for reject.

### Patient ficha flow

1. `PatientsPage` lists via `usePatients` → `listPatients` (`src/services/patients.service.ts:339`). Create uses `createPatientSchema` + `useCreatePatient`, then navigates to `/pacientes/:id`.
2. `PatientPage` (`src/pages/PatientPage.tsx:438`) reads `?aba=` (`resumo` | `cadastro` | `evolucoes` | `avaliacao`). Dashboard query first; detail query waits until dashboard exists.
3. `canWritePatient(viewerId, patient.createdBy)` (`src/lib/accountAccess.ts`) hides write controls. Empresa can view a colleague’s ficha; RLS blocks writes (D-05 / D-07).
4. Panels (`PatientCadastroPanel`, `PatientGoalsPanel`, `PatientEvolutionsPanel`, `PatientEvaluationPanel`, `PatientAlertsPanel`) call `usePatients` mutations. `canWrite` must be forwarded into nested `PatientPhysicalEvaluationPanel`.
5. `/pacientes/:id/cadastro` redirects to `?aba=cadastro`. Unknown modules hit `PatientModuleStubPage`.

### Calendar and board

1. Agenda: `useCalendarSessions` / `useCreateSession` → `src/services/calendar.service.ts` on `patient_sessions`.
2. Quadro: `useBoard` / card mutations → `src/services/board.service.ts` on `board_columns` / `board_cards`. Due dates surface on Agenda via `listDueCards`.

### Gemini PDF draft (client-side)

1. `PatientPhysicalEvaluationPanel.tsx` calls `analyzePhysicalEvaluationPdf` (`src/services/aiPhysicalEvaluation.service.ts`) with `VITE_GEMINI_API_KEY` (optional; falls back to a local simulation).
2. Results persist in `localStorage` (`fisio.evaluations.${patientId}`). Official evaluation is the structured row in `patient_evaluations`, not the PDF draft.

**State Management:**
- **Server/clinic data:** TanStack Query. Keys: `['patients']`, `['patients', id]`, `['patients', id, 'dashboard'|'sessions'|'evaluations']`, `['calendar-sessions', from, to]`, `['board']`, `['board-dues', from, to]`, `['team']`, `['membership']`, `['therapists']`. Invalidate the family, not a single exact key.
- **Session identity:** `AuthProvider` Context (`session`, `profile`, `membership`, `isAuthenticated`). Do not stash patients in Context.
- **Toasts:** Zustand `src/stores/toast.store.ts` — `toast(message, tone)` from hooks.
- **Ephemeral UI:** `useState` in pages (modals, tab search params).
- **PDF AI drafts:** `localStorage` in `PatientPhysicalEvaluationPanel.tsx` only.

## Key Abstractions

**Named page:**
- Purpose: Routed screen; default export `export function FooPage()`
- Examples: `src/pages/PatientsPage.tsx`, `src/pages/TeamPage.tsx`, `src/pages/auth/LoginPage.tsx`
- Pattern: Compose `PageHeader` + data hooks + UI primitives. Gate with `Navigate` when the account type cannot access (see `TeamPage.tsx` + `canManageTeam`).

**Patient panel:**
- Purpose: One ficha tab or card of CRUD
- Examples: `src/components/patients/PatientGoalsPanel.tsx`, `PatientEvolutionsPanel.tsx`, `PatientEvaluationPanel.tsx`
- Pattern: Receive `patientId` + `canWrite`; call `usePatients` mutations; hide controls when `!canWrite` (do not disable them so they still look tappable).

**Service module:**
- Purpose: All Supabase I/O for one aggregate
- Examples: `src/services/patients.service.ts`, `src/services/team.service.ts`, `src/services/evaluations.service.ts`
- Pattern: File of exported async functions. Private `*Row` types, `mapX()`, `throwIfError` or `mapDbError`. `requireUserId()` via `supabase.auth.getUser()` when the caller must be the session user (team owner queries).

**Query hook:**
- Purpose: Cache + invalidation + toast
- Examples: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`, `src/hooks/useTeam.ts`
- Pattern: `useQuery({ queryKey, queryFn, staleTime, enabled })`. Mutations: `onSuccess` invalidate + `toast(..., 'success')`; `onError` → `toast(error.message, 'error')`. Copy `invalidatePatient()` when a write touches the ficha.

**Zod schema:**
- Purpose: Form input contract and Portuguese messages
- Examples: `src/schemas/patient.schema.ts`, `src/schemas/auth.schema.ts`, `src/schemas/evaluation.schema.ts`
- Pattern: `z.object` + `superRefine` for conditionals. Export `type XFormData = z.infer<typeof xSchema>`. Wire with `zodResolver` in the page/panel. Auth service also `.parse()`s before calling Auth.

**Clinic DTO:**
- Purpose: UI/domain shape (camelCase)
- Examples: `src/types/patient.ts`, `src/types/account.ts`, `src/types/evaluation.ts`
- Pattern: `export type` closed unions + `Record<Union, string>` labels + `export interface` objects. Keep bakery `Profile.role` out of these files.

**UX predicate (not auth):**
- Purpose: Show/hide chrome
- Examples: `canManageTeam`, `canWritePatient`, `isPendingTherapist` in `src/lib/accountAccess.ts`
- Pattern: Pure functions. RLS still enforces. Skip client checks only if the UI can tolerate a mapped permission error.

**Supabase client singleton:**
- Purpose: Lazy `createClient` after env check
- Examples: `getSupabase()` / `supabase` Proxy in `src/lib/supabase/client.ts`
- Pattern: Import `supabase` in services. Do not instantiate another client. Auth: PKCE, persist session, `X-Client-Info: fisio-web`. Client is typed as `any` Database on purpose (Insert/Update inference otherwise collapses to `never`).

## Entry Points

**Browser bootstrap:**
- Location: `index.html` → `src/main.tsx`
- Triggers: Vite `npm run dev` / production static host
- Responsibilities: Mount React, provide QueryClient, load `src/index.css`

**App composition:**
- Location: `src/App.tsx`
- Triggers: After QueryClientProvider
- Responsibilities: Block on missing Supabase env; wrap router, auth, routes, toasts

**Route table:**
- Location: `src/routes/index.tsx`
- Triggers: URL change
- Responsibilities: Register **only** clinic routes. Live paths: `/`, `/cadastro`, `/aguardando`, `/painel`, `/pacientes`, `/pacientes/:id`, `/pacientes/:id/cadastro`, `/pacientes/:id/:module`, `/equipe`, `/agenda`, `/quadro`. Catch-all inside the shell → `/pacientes`.

**SQL apply:**
- Location: `supabase/03-account-types-team.sql`, `supabase/patients-req05-evaluations.sql`, `supabase/patients-req14-goals.sql`
- Triggers: Human paste in Supabase SQL Editor
- Responsibilities: Schema + RLS + RPCs. Scripts are written to be idempotent.

**Static hosting:**
- Location: `netlify.toml`, `vercel.json`, `public/_redirects`
- Triggers: Deploy
- Responsibilities: SPA rewrite to `index.html`; security headers / CSP (Gemini + Supabase hosts in `connect-src`)

## Architectural Constraints

- **Threading:** Single-threaded browser event loop. No Web Workers. Auth callback in `AuthProvider.tsx` must not `await` (deadlock on supabase-js lock).
- **Global state:** `QueryClient` in `src/main.tsx`; `supabase` Proxy in `src/lib/supabase/client.ts`; Zustand toast store; `AuthContext` in `src/hooks/useAuth.ts`; in-memory + `sessionStorage` rate-limit in `src/lib/security/index.ts` (`fisio.auth.rate`).
- **Circular imports:** `AuthProvider` imports `AuthContext` from `useAuth.ts` (context lives with the hook). `auth.service.ts` imports `fetchMembership` from `team.service.ts` (one-way). Do not import providers from services.
- **No backend of our own:** Cannot put secrets in the Vite bundle except the public anon key. Gemini key (`VITE_GEMINI_API_KEY`) is a client secret if set — treat PDF AI as best-effort, not a trust boundary.
- **RLS is the tenant wall:** Empresa vs autônomo vs fisio visibility is decided in SQL (`03-account-types-team.sql`), not by JS-filtering `listPatients`.
- **No route lazy-loading:** All pages are statically imported in `src/routes/index.tsx`. Keep clinic route graph small; do not register bakery pages.
- **SQL vs git:** `/.gitignore` ignores `/supabase/`. Committed planning copy: `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`.
- **LGPD:** Clinical data. Empty lists stay empty (no fake placeholders). Seeds only in development SQL.

## Anti-Patterns

### Bakery RBAC on clinic screens

**What happens:** Import `canManageCatalog` / `isAdmin` from `src/lib/permissions.ts` or gate on `profiles.role` (`EmployeeRole` in `src/types/database.types.ts`).
**Why it's wrong:** Clinic identity is `accountType` + membership (`src/types/account.ts`). Bakery roles (`confeiteiro`, `atendente`, …) do not describe autônomo / empresa / fisioterapeuta.
**Do this instead:** Use `canManageTeam` / `canWritePatient` from `src/lib/accountAccess.ts` and `profile.accountType` from `useAuth()`. Copy `TeamPage.tsx` and `PatientPage.tsx`.

### Client insert of membership or profile cancel

**What happens:** `supabase.from('organization_memberships').insert(...)` or `profiles.update({ is_active: false })` from the app on reject.
**Why it's wrong:** Join and reject are RPC-owned (`decide_membership`). Client writes skip owner re-check (T-03-12 / D-04).
**Do this instead:** `decideMembership` in `src/services/team.service.ts`. Sign-up only passes metadata; the trigger creates rows.

### Supabase calls in UI components

**What happens:** `supabase.from('patients')` inside a page or panel.
**Why it's wrong:** Skips mapping, error mapping, and query-key invalidation; duplicates RLS-aware column lists.
**Do this instead:** Add a function to the domain service and a hook in `usePatients.ts` / `useClinic.ts` / `useTeam.ts`. Exceptions: auth pages (no session yet) and Gemini PDF in `PatientPhysicalEvaluationPanel.tsx`.

### Treating UX predicates as authorization

**What happens:** Skip RLS because the button is hidden, or disable rather than hide writes.
**Why it's wrong:** Hidden UI is not a control. Disabled buttons still look interactive. Direct API calls bypass the page.
**Do this instead:** Keep RLS policies in SQL. Hide write controls when `!canWrite`. Expect `mapDbError` / 42501 if someone bypasses the UI.

### Await inside `onAuthStateChange`

**What happens:** `await fetchProfile()` in the auth callback (`AuthProvider.tsx`).
**Why it's wrong:** Deadlocks supabase-js internal lock → infinite login spinner.
**Do this instead:** Set `session` synchronously; load profile/membership in the `userId` effect.

### Raw Postgres errors in clinic RPCs

**What happens:** `throw new Error(error.message)` on `decide_membership`.
**Why it's wrong:** Leaks internals; permission failures should read as “Você não tem permissão…”.
**Do this instead:** `mapDbError` (`src/lib/security/index.ts`) for RPC/permission paths, as in `decideMembership`. Simple table CRUD may use `throwIfError` but prefer mapped errors for user-facing writes.

### Registering leftover bakery routes

**What happens:** Add `/produtos` or `/pedidos` pointing at `ProductsPage.tsx` / `OrdersPage.tsx`.
**Why it's wrong:** Those screens use bakery tables and `permissions.ts`. They are not the clinic product (`src/config/navigation.ts`).
**Do this instead:** Add routes only for clinic aggregates and follow page → hook → service.

## Error Handling

**Strategy:** Services throw `Error` with a Portuguese message. Hooks catch via mutation `onError` and `toast(..., 'error')`. Auth pages set local `serverError` state. Route guards render dedicated inactive/rejected cards instead of throwing.

**Patterns:**
- Zod at the form (`zodResolver`) and again in `auth.service.ts` before Auth API
- `mapAuthError` for Auth; `mapDbError` for PostgREST/RPC (`42501` → permission copy)
- Client login/register rate limit (5 / 15 min per key; 20 global) in `src/lib/security/index.ts` — does not replace Supabase Auth rate limits
- Query `isError` branches render inline “Não foi possível carregar…” (see `TeamPage.tsx`, `PatientsPage.tsx`)
- Optimistic updates exist only in bakery `useMoveTask` / `useDismissNotification` (`src/hooks/queries.ts`). Clinic board/calendar wait for the server then invalidate

## Cross-Cutting Concerns

**Logging:** No telemetry SDK. `console` is not a product logger. User feedback is toasts + inline error text.

**Validation:** Zod schemas in `src/schemas/`. Sanitize with `sanitizeText` / `sanitizeEmail` / `escapeIlike` before Auth and ILIKE search. Backend/RLS constraints remain mandatory (`security.skill.md`).

**Authentication:** Supabase Auth password + PKCE (`src/lib/supabase/client.ts`). Session persistence is the supabase-js default (not a custom cookie layer). Fail-closed clinic entry in `AuthProvider.tsx`. Open-redirect blocked by `safeRedirectPath`.

**Authorization:** RLS + RPCs in `supabase/03-account-types-team.sql`. UX predicates in `src/lib/accountAccess.ts`. Do not use `src/lib/permissions.ts` for clinic.

**Styling:** Tailwind v4 via `@tailwindcss/vite`. Tokens in `src/index.css` (`forest`, `accent`, `canvas`, `ink`, …). Portuguese UI copy. Empty states with no fake rows (`PROJECT.md`).

**Security headers / CSP:** `index.html`, `vite.config.ts` `server.headers`, `netlify.toml`. `connect-src` allows `https://*.supabase.co`, `wss://*.supabase.co`, `https://generativelanguage.googleapis.com`.

---

*Architecture analysis: 2026-09-14*
*Update when major patterns change*
