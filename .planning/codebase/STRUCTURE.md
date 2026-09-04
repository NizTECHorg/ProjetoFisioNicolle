# Codebase Structure

**Analysis Date:** 2026-09-04

## Directory Layout

```
ProjetoFisioNicolle/
├── index.html              # SPA shell, CSP, fonts, title FLUXO
├── vite.config.ts          # React + Tailwind plugins, `@` → `src/`
├── tsconfig.json           # Strict TS, `paths`: `@/*` → `src/*`
├── tsconfig.node.json      # Vite config TS
├── eslint.config.js        # Flat ESLint
├── package.json            # App name `fluxo`; npm scripts
├── netlify.toml            # Build + SPA rewrite + security headers
├── vercel.json             # SPA rewrite
├── public/                 # Favicons + `_redirects`
├── src/                    # Application code (only tree compiled by `tsc`)
│   ├── main.tsx            # React root + QueryClient
│   ├── App.tsx             # Env gate + providers
│   ├── index.css           # Tailwind v4 theme tokens
│   ├── vite-env.d.ts
│   ├── assets/brand/       # Canonical logo files used by BrandWordmark
│   ├── Logos/              # Duplicate raster logos — do not import
│   ├── config/             # env + navigation
│   ├── routes/             # Route tree only
│   ├── providers/          # AuthProvider
│   ├── pages/              # Route screens (+ leftover bakery screens)
│   ├── pages/auth/         # Login + register
│   ├── components/
│   │   ├── auth/           # Gates + AuthLayout
│   │   ├── brand/          # BrandWordmark
│   │   ├── dashboard/      # Leftover SalesChart (unreferenced)
│   │   ├── layout/         # AppShell (+ unused GlobalSearch/Notifications)
│   │   ├── patients/       # Ficha panels
│   │   └── ui/             # Shared primitives
│   ├── hooks/              # TanStack Query + useAuth
│   ├── services/           # Supabase access
│   ├── schemas/            # Zod
│   ├── stores/             # Zustand (toast only)
│   ├── types/              # UI + leftover Database types
│   └── lib/
│       ├── supabase/       # Client singleton
│       ├── security/       # Sanitize, rate limit, error maps
│       ├── permissions.ts  # Leftover bakery role checks
│       ├── labels.tsx      # Leftover bakery badges
│       └── avatar.ts       # Initials + tone → color
├── supabase/               # Gitignored at `/supabase/`; local SQL only
│   └── patients-req05-evaluations.sql
├── .planning/              # GSD roadmap, requirements, codebase maps
├── .cursor/                # GSD skills/workflows
└── dist/                   # Vite output (gitignored)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One file per routed screen (plus leftover unrouted bakery screens).
- Contains: `*Page.tsx` components that own page-level layout, forms, and hook wiring.
- Key files: `src/pages/DashboardPage.tsx`, `src/pages/PatientsPage.tsx`, `src/pages/PatientPage.tsx`, `src/pages/CalendarPage.tsx`, `src/pages/KanbanPage.tsx`, `src/pages/SetupPage.tsx`, `src/pages/auth/LoginPage.tsx`, `src/pages/auth/RegisterPage.tsx`

**`src/pages/auth/`:**
- Purpose: Unauthenticated screens using `AuthLayout`.
- Contains: login and register only.
- Key files: `src/pages/auth/LoginPage.tsx`, `src/pages/auth/RegisterPage.tsx`

**`src/components/patients/`:**
- Purpose: Ficha feature panels composed by `PatientPage`.
- Contains: header + tab panels. Import hooks from `src/hooks/usePatients.ts`, not services (except AI PDF).
- Key files: `src/components/patients/PatientProfileHeader.tsx`, `src/components/patients/PatientCadastroPanel.tsx`, `src/components/patients/PatientAlertsPanel.tsx`, `src/components/patients/PatientEvolutionsPanel.tsx`, `src/components/patients/PatientEvaluationPanel.tsx`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`

**`src/components/ui/`:**
- Purpose: Reusable primitives. No domain fetches.
- Contains: `Button`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `PageHeader`, `Badge`, `DataTable`, `PatientAvatar`, `ToastViewport`.
- Key files: `src/components/ui/Button.tsx`, `src/components/ui/PageHeader.tsx`, `src/components/ui/Modal.tsx`

**`src/components/layout/`:**
- Purpose: App chrome.
- Contains: `AppShell` (in use). `GlobalSearch.tsx` and `NotificationsMenu.tsx` are leftover bakery chrome — not mounted in `AppShell`.
- Key files: `src/components/layout/AppShell.tsx`

**`src/components/auth/`:**
- Purpose: Route gates and login card layout.
- Contains: `ProtectedRoute` / `GuestRoute`, `AuthLayout`.
- Key files: `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/AuthLayout.tsx`

**`src/hooks/`:**
- Purpose: React Query wrappers and `useAuth`.
- Contains: clinic hooks in `usePatients.ts` and `useClinic.ts`. `queries.ts` is leftover bakery — do not add clinic keys there.
- Key files: `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`, `src/hooks/useAuth.ts`

**`src/services/`:**
- Purpose: All Supabase/Auth/Gemini I/O and row mapping.
- Contains: `*.service.ts`. One clinic domain per file.
- Key files: `src/services/auth.service.ts`, `src/services/patients.service.ts`, `src/services/sessions.service.ts`, `src/services/evaluations.service.ts`, `src/services/calendar.service.ts`, `src/services/board.service.ts`, `src/services/aiPhysicalEvaluation.service.ts`

**`src/schemas/`:**
- Purpose: Zod contracts for forms (and auth re-parse in the service).
- Contains: `*.schema.ts` exporting schemas + `z.infer` types.
- Key files: `src/schemas/auth.schema.ts`, `src/schemas/patient.schema.ts`, `src/schemas/evaluation.schema.ts`, `src/schemas/modules.schema.ts` (leftover)

**`src/types/`:**
- Purpose: UI-facing clinic models and leftover generated-style `Database` types.
- Contains: `patient.ts`, `evaluation.ts`, `database.types.ts`.
- Key files: `src/types/patient.ts`, `src/types/evaluation.ts`

**`src/lib/`:**
- Purpose: Non-React shared utilities and the Supabase client.
- Contains: `supabase/client.ts`, `security/index.ts`, `avatar.ts`, leftover `permissions.ts` / `labels.tsx`.
- Key files: `src/lib/supabase/client.ts`, `src/lib/security/index.ts`

**`src/config/`:**
- Purpose: Boot-time configuration.
- Contains: env validation and nav items.
- Key files: `src/config/env.ts`, `src/config/navigation.ts`

**`src/providers/`:**
- Purpose: Tree-wide React providers besides QueryClient (which is in `main.tsx`).
- Contains: `AuthProvider` only.
- Key files: `src/providers/AuthProvider.tsx`

**`src/stores/`:**
- Purpose: Client UI state that is not server cache.
- Contains: toast store only. Do not put patient data here.
- Key files: `src/stores/toast.store.ts`

**`src/routes/`:**
- Purpose: The only place that binds paths to pages.
- Contains: `index.tsx` exporting `AppRoutes`.
- Key files: `src/routes/index.tsx`

**`src/assets/brand/`:**
- Purpose: Canonical brand images imported by `src/components/brand/BrandWordmark.tsx`.
- Contains: `logomark.png`, `logotype.png`, `logo.png`, on-dark variants.
- Key files: `src/assets/brand/logotype.png`

**`supabase/`:**
- Purpose: Ad-hoc SQL (directory is listed in `.gitignore` as `/supabase/`).
- Contains: `patients-req05-evaluations.sql`. There is no `supabase/migrations/` tree in the workspace despite `SetupPage` mentioning it.
- Key files: `supabase/patients-req05-evaluations.sql`

**`.planning/`:**
- Purpose: GSD project memory (requirements, roadmap, phase plans, codebase maps).
- Contains: `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `codebase/`, `phases/`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `index.html`: document, CSP (`connect-src` includes `*.supabase.co` and `generativelanguage.googleapis.com`)
- `src/main.tsx`: `createRoot`, `QueryClientProvider`
- `src/App.tsx`: env gate + router + auth
- `src/routes/index.tsx`: route table

**Configuration:**
- `src/config/env.ts`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `isConfigured`
- `src/config/navigation.ts`: `/painel`, `/pacientes`, `/agenda`, `/quadro`
- `vite.config.ts`: `@` alias, vendor/supabase manual chunks, dev security headers
- `tsconfig.json`: `@/*` paths, `include: ["src"]`
- `netlify.toml` / `vercel.json` / `public/_redirects`: SPA fallback
- `.env` present locally (gitignored) — environment configuration; never commit or quote values

**Core Logic:**
- `src/lib/supabase/client.ts`: `getSupabase()` / `supabase` Proxy
- `src/services/patients.service.ts`: patient CRUD + dashboard + alerts
- `src/services/sessions.service.ts`: sessions + evolutions
- `src/services/evaluations.service.ts`: structured evaluations
- `src/services/calendar.service.ts`: agenda range
- `src/services/board.service.ts`: quadro
- `src/hooks/usePatients.ts` / `src/hooks/useClinic.ts`: cache + invalidate

**Active clinic routes (only these are mounted):**
- `/` → `src/pages/auth/LoginPage.tsx`
- `/cadastro` → `src/pages/auth/RegisterPage.tsx`
- `/painel` → `src/pages/DashboardPage.tsx`
- `/pacientes` → `src/pages/PatientsPage.tsx`
- `/pacientes/:id` → `src/pages/PatientPage.tsx` (`?aba=cadastro|evolucoes|avaliacao`)
- `/pacientes/:id/cadastro` → `src/pages/PatientCadastroPage.tsx` (redirect)
- `/pacientes/:id/:module` → `src/pages/PatientModuleStubPage.tsx`
- `/agenda` → `src/pages/CalendarPage.tsx`
- `/quadro` → `src/pages/KanbanPage.tsx`

**Leftover unrouted bakery screens (do not wire unless reviving that product):**
- `src/pages/BlankPage.tsx`, `src/pages/ClientsPage.tsx`, `src/pages/CouponsPage.tsx`, `src/pages/DeliveriesPage.tsx`, `src/pages/EmployeesPage.tsx`, `src/pages/FinancePage.tsx`, `src/pages/OrdersPage.tsx`, `src/pages/ProductionPage.tsx`, `src/pages/ProductsPage.tsx`, `src/pages/RecipesPage.tsx`, `src/pages/ReportsPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/ShoppingPage.tsx`, `src/pages/StockPage.tsx`, `src/pages/TasksPage.tsx`

**Testing:**
- No `*.test.*` / `*.spec.*` files and no Vitest/Jest config. New tests should go in `src/**/__tests__/` or beside the file as `*.test.ts` once a runner is added (see `TESTING.md`).

## Naming Conventions

**Files:**
- React component / page: `PascalCase.tsx` — `PatientsPage.tsx`, `PatientAlertsPanel.tsx`, `Button.tsx`
- Service: `camelCase.service.ts` — `patients.service.ts`
- Schema: `camelCase.schema.ts` — `patient.schema.ts`
- Store: `camelCase.store.ts` — `toast.store.ts`
- Hook module: `usePascalCase.ts` or a focused name (`usePatients.ts`, `useClinic.ts`, `useAuth.ts`)
- Types: singular domain noun — `patient.ts`, `evaluation.ts`
- Do not add barrel `index.ts` files. Import the concrete path: `@/services/patients.service`.

**Directories:**
- lowercase plural for collections: `pages/`, `components/`, `hooks/`, `services/`, `schemas/`, `types/`, `stores/`
- Feature grouping under `components/<area>/`: `patients`, `auth`, `layout`, `ui`, `brand`
- Auth pages live in `pages/auth/`, not `components/auth/`

**Symbols:**
- Components: `PascalCase` — `export function PatientsPage`
- Functions: `camelCase` — `listPatients`, `createPatientAlert`
- Query keys: lowercase path segments — `['patients', id, 'evaluations']`
- UI types: `PascalCase` — `Patient`, `PatientListItem`
- Zod inferred types: `*FormData` — `CreatePatientFormData`
- DB row helpers inside services: `*Row` — `PatientRow` (keep private to the service)

**URLs:**
- Portuguese path segments: `/painel`, `/pacientes`, `/agenda`, `/quadro`, `/cadastro`
- Patient submodules: `/pacientes/:id/<modulo>` stubs (`reavaliacoes`, `exercicios`, `documentos`, `financeiro`)
- Tab state: `?aba=` not nested routes for built modules

**Imports:**
- Always `@/` alias (`tsconfig.json`, `vite.config.ts`). Do not use `../` hops across `src/` roots.
- Order used in clinic files: external packages → `@/components` → `@/hooks` → `@/services` / `@/schemas` / `@/types` → `@/lib` / `@/stores`.

## Where to Add New Code

**New top-level clinic screen (e.g. Relatórios clínicos):**
- Types: `src/types/<domain>.ts`
- Schema (if forms): `src/schemas/<domain>.schema.ts`
- Service: `src/services/<domain>.service.ts` (map rows; throw `Error`)
- Hooks: new `src/hooks/use<Domain>.ts` **or** extend `src/hooks/useClinic.ts` if it is agenda/board-adjacent
- Page: `src/pages/<Name>Page.tsx`
- Route: register inside the `ProtectedRoute` + `AppShell` tree in `src/routes/index.tsx`
- Nav: add to both arrays in `src/config/navigation.ts`
- Tests: not established — add beside the service/hook when a runner exists

**New patient module that is ready to ship:**
- Panel: `src/components/patients/Patient<Module>Panel.tsx`
- Tab: extend `PatientTab` in `src/components/patients/PatientProfileHeader.tsx` and the `?aba=` switch in `src/pages/PatientPage.tsx`
- Data: functions in the matching service + hooks in `src/hooks/usePatients.ts` with keys `['patients', id, '<module>']`
- Invalidate: add the new key to `invalidatePatient` in `src/hooks/usePatients.ts` if writes should refresh the ficha/agenda

**New patient module that is not ready:**
- Add the slug to `MODULE_TITLES` in `src/pages/PatientModuleStubPage.tsx`
- Link from resumo shortcuts in `src/pages/PatientPage.tsx` using `path: '<slug>'` (not `tab`)
- Do not add an empty table wrapper page

**New UI primitive:**
- Implementation: `src/components/ui/<Name>.tsx`
- Use existing tokens from `src/index.css` (`bg-surface`, `border-line`, `text-ink`, `text-forest`)

**New Zod schema:**
- Implementation: `src/schemas/<domain>.schema.ts`
- Export both the schema and `type XFormData = z.infer<typeof xSchema>`

**Utilities:**
- Pure / security / format: `src/lib/security/index.ts` or a new `src/lib/<name>.ts`
- Avatar helpers: `src/lib/avatar.ts`
- Do not put fetch logic in `src/lib/`

**SQL:**
- Keep scripts under `supabase/` if working locally, and remember `/supabase/` is gitignored. Document the SQL Editor steps in the phase plan so the remote schema is reproducible.
- Table names: `patient_*` / `board_*` already in use. Follow that prefix.

**Do not:**
- Add clinic CRUD to `src/services/modules.service.ts` or `src/hooks/queries.ts`
- Import `@/lib/supabase/client` from `src/pages/` or `src/components/`
- Create `src/services/index.ts` barrels
- Put new logos in `src/Logos/` — use `src/assets/brand/`
- Add a second toast/auth store
- Register leftover bakery pages in `src/routes/index.tsx`

## Special Directories

**`src/Logos/`:**
- Purpose: Duplicate PNG wordmarks.
- Generated: No
- Committed: Yes
- Use `src/assets/brand/` instead (`BrandWordmark` already does).

**`src/pages/` leftover bakery files:**
- Purpose: Previous product screens still compiling.
- Generated: No
- Committed: Yes
- Treat as frozen. Delete only in an explicit cleanup phase.

**`supabase/`:**
- Purpose: Local SQL snippets.
- Generated: No
- Committed: No (root `.gitignore` entry `/supabase/`). `src/lib/supabase/` is the client and is committed.

**`dist/`:**
- Purpose: Vite production build.
- Generated: Yes (`npm run build`)
- Committed: No

**`node_modules/`:**
- Purpose: npm install
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: GSD planning artifacts consumed by later commands.
- Generated: No (authored)
- Committed: Yes

**`.cursor/`:**
- Purpose: GSD skills, agents, workflows.
- Generated: No
- Committed: Yes

**`.env` / `.env.local`:**
- Purpose: Vite env (Supabase URL/anon key; optional `VITE_GEMINI_API_KEY`).
- Generated: No
- Committed: No (`.gitignore`)
- `SetupPage` tells developers to copy `.env.example` — that example file is not in the tree.

---

*Structure analysis: 2026-09-04*
