# Codebase Structure

**Analysis Date:** 2026-09-14

## Directory Layout

```
ProjetoFisioNicolle/
├── src/                    # Application source (TypeScript React SPA)
│   ├── assets/brand/       # Wordmark / logomark PNG (onLight + onDark)
│   ├── components/         # UI by role (auth, brand, layout, patients, ui)
│   ├── config/             # Env + navigation
│   ├── hooks/              # TanStack Query + Auth context hook
│   ├── lib/                # Supabase client, security, account UX helpers
│   ├── Logos/              # Duplicate brand PNGs (prefer assets/brand)
│   ├── pages/              # Routed screens + leftover bakery screens
│   ├── providers/          # AuthProvider
│   ├── routes/             # AppRoutes table
│   ├── schemas/            # Zod form contracts
│   ├── services/           # Supabase access + mappers
│   ├── stores/             # Zustand toast store
│   ├── types/              # Domain DTOs (clinic) + bakery Database types
│   ├── App.tsx             # Env gate + router/auth composition
│   ├── main.tsx            # React mount + QueryClient
│   ├── index.css           # Tailwind v4 theme tokens
│   └── vite-env.d.ts       # ImportMetaEnv
├── public/                 # Favicons + Netlify _redirects
├── supabase/               # SQL Editor scripts (gitignored at /supabase/)
├── .planning/              # GSD project state, phases, this codebase map
├── index.html              # SPA shell, CSP, fonts
├── vite.config.ts          # Alias @, chunks, security headers
├── tsconfig.json           # strict TS, paths @/*
├── package.json            # name: fluxo
├── netlify.toml            # Build + SPA rewrite + headers
├── vercel.json             # SPA rewrites
├── security.skill.md       # Healthcare/LGPD review constraints
└── performance-scalability.skill.md
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One file per screen. Clinic screens are wired in `src/routes/index.tsx`. Bakery screens exist but are **not routed**.
- Contains: `*Page.tsx` function components
- Key files: `DashboardPage.tsx`, `PatientsPage.tsx`, `PatientPage.tsx`, `CalendarPage.tsx`, `KanbanPage.tsx`, `TeamPage.tsx`, `AutonomoFinancePage.tsx`, `SetupPage.tsx`
- Subdirectories: `src/pages/auth/` — `LoginPage.tsx`, `RegisterPage.tsx`, `WaitingApprovalPage.tsx`
- Leftover (do not extend for clinic): `ProductsPage.tsx`, `OrdersPage.tsx`, `RecipesPage.tsx`, `StockPage.tsx`, `ClientsPage.tsx`, `CouponsPage.tsx`, `DeliveriesPage.tsx`, `EmployeesPage.tsx`, `FinancePage.tsx`, `ProductionPage.tsx`, `ShoppingPage.tsx`, `TasksPage.tsx`, `ReportsPage.tsx`, `SettingsPage.tsx`, `BlankPage.tsx`

**`src/components/`:**
- Purpose: Reusable UI grouped by role, not by bakery feature
- Contains: `*.tsx` components, no barrel `index.ts` except none at this level
- Key files / subdirs:
  - `components/ui/` — primitives: `Button`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `DataTable`, `Badge`, `PageHeader`, `PatientAvatar`, `ToastViewport`
  - `components/patients/` — ficha panels used only by `PatientPage`
  - `components/auth/` — `AuthLayout`, `ProtectedRoute` (`GuestRoute` in the same file)
  - `components/layout/` — `AppShell` (live); `GlobalSearch` and `NotificationsMenu` are bakery leftovers not mounted in AppShell
  - `components/brand/` — `BrandWordmark.tsx`
  - `components/dashboard/` — `SalesChart.tsx` (bakery; clinic dashboard does not use it)

**`src/hooks/`:**
- Purpose: Data-access hooks for clinic; keep bakery queries isolated
- Contains: `useAuth.ts`, `usePatients.ts`, `usePatientImages.ts`, `useClinic.ts`, `useTeam.ts`, `useFinance.ts`, leftover `queries.ts`
- Key files: add new clinic hooks as `use<Domain>.ts` next to these, not inside `queries.ts`

**`src/services/`:**
- Purpose: Supabase I/O + DTO mapping
- Contains: `*.service.ts` (kebab-case domain + `.service` suffix)
- Key files: `auth.service.ts`, `team.service.ts`, `patients.service.ts`, `sessions.service.ts`, `calendar.service.ts`, `board.service.ts`, `evaluations.service.ts`, `finance.service.ts`, `patientImages.service.ts`, `aiPhysicalEvaluation.service.ts`
- Leftover: `modules.service.ts` (~900 lines of bakery CRUD) — do not add clinic tables here

**`src/types/`:**
- Purpose: TypeScript DTOs. Split clinic vs bakery on purpose
- Contains: `account.ts` (AccountType, membership, ClinicProfile), `patient.ts`, `evaluation.ts`, `finance.ts`, `database.types.ts` (bakery `Database` + `EmployeeRole`)
- Key files: always add clinic unions to `account.ts` / `patient.ts` / `evaluation.ts`, never to `database.types.ts` `EmployeeRole`

**`src/schemas/`:**
- Purpose: Zod objects for forms
- Contains: `auth.schema.ts`, `patient.schema.ts`, `evaluation.schema.ts`, leftover `modules.schema.ts`
- Key files: export `type XFormData = z.infer<typeof xSchema>` beside the schema

**`src/lib/`:**
- Purpose: Shared non-UI helpers
- Contains: `security/index.ts` (imported as `@/lib/security`), `accountAccess.ts`, `avatar.ts`, leftover `permissions.ts`, leftover `labels.tsx`
- Subdirectories: `lib/supabase/client.ts` — only Supabase client module

**`src/config/`:**
- Purpose: Build-time env and nav items
- Contains: `env.ts` (`VITE_SUPABASE_*`, `isConfigured`), `navigation.ts` (`clinicNavigationItems`, `mobileNavItems`)

**`src/providers/`:**
- Purpose: React context providers
- Contains: `AuthProvider.tsx` only. QueryClientProvider lives in `src/main.tsx`, not here

**`src/routes/`:**
- Purpose: The only route registry
- Contains: `index.tsx` exporting `AppRoutes`

**`src/stores/`:**
- Purpose: Client-only UI state that is not server cache
- Contains: `toast.store.ts`

**`src/assets/brand/`:**
- Purpose: Canonical brand images for `BrandWordmark`
- Contains: `logo.png`, `logomark.png`, `logotype.png`, `*-on-dark.png`, `logotype-subtitle*.png`

**`src/Logos/`:**
- Purpose: Extra PNG copies; do not add new files here — use `src/assets/brand/`

**`supabase/`:**
- Purpose: Idempotent SQL for the hosted SQL Editor
- Contains: `03-account-types-team.sql`, `patients-req05-evaluations.sql`, `patients-req14-goals.sql`
- Note: `/supabase/` is in `.gitignore`. Planning copy of account SQL: `.planning/phases/03-tipos-de-conta-e-equipe/sql/`

**`.planning/`:**
- Purpose: GSD workflow artifacts
- Contains: `PROJECT.md`, `STATE.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `phases/`, `codebase/` (this map)

**`public/`:**
- Purpose: Static files copied as-is
- Contains: `favicon.png`, `favicon-32.png`, `apple-touch-icon.png`, `_redirects`

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, CSP, title FLUXO, mounts `#root`
- `src/main.tsx`: React root + QueryClientProvider
- `src/App.tsx`: Env gate, BrowserRouter, AuthProvider, AppRoutes, ToastViewport
- `src/routes/index.tsx`: Path → page mapping

**Configuration:**
- `src/config/env.ts`: Validates `VITE_SUPABASE_URL` (https, not placeholder) and anon key
- `src/config/navigation.ts`: Drawer and mobile items; Equipe only for `accountType === 'empresa'`
- `vite.config.ts`: `@` alias, vendor/supabase manualChunks, dev security headers
- `tsconfig.json`: `strict`, `paths: { "@/*": ["src/*"] }`, `include: ["src"]`
- `eslint.config.js`: typescript-eslint + react-hooks + react-refresh
- `netlify.toml` / `vercel.json`: SPA fallback
- `.env` / `.env.local`: present locally, gitignored — never commit or quote

**Core Logic:**
- `src/providers/AuthProvider.tsx`: Session + profile + membership
- `src/components/auth/ProtectedRoute.tsx`: Guest vs clinic vs waiting vs rejected
- `src/services/patients.service.ts`: Patient aggregate (list, detail, dashboard, goals, alerts)
- `src/services/sessions.service.ts`: Session + evolution rows
- `src/services/patientImages.service.ts`: `patient_images` metadata + private Storage bucket `patient-images`
- `src/services/evaluations.service.ts`: `patient_evaluations`
- `src/services/calendar.service.ts`: Range queries for Agenda
- `src/services/board.service.ts`: Kanban columns/cards
- `src/services/team.service.ts`: Org lookup RPC, membership, decide RPC
- `src/services/finance.service.ts`: Catalog, charges, `autonomo_finance_totals`, realizadas list
- `src/services/auth.service.ts`: signIn / signUp / signOut / fetchProfile
- `src/lib/accountAccess.ts`: Clinic UX predicates
- `src/lib/security/index.ts`: Sanitize, rate limit, error maps, `safeRedirectPath`

**Clinic UI surfaces:**
- `src/pages/PatientPage.tsx`: Ficha tabs via `?aba=`
- `src/components/patients/PatientProfileHeader.tsx`: Tab type `resumo | cadastro | evolucoes | avaliacao`
- `src/pages/TeamPage.tsx`: Empresa-only equipe
- `src/pages/AutonomoFinancePage.tsx`: Autônomo-only `/financeiro` (catalog, totals, realizadas)
- `src/pages/DashboardPage.tsx`: Clinic week metrics from patients + calendar (not bakery `useDashboardMetrics`)

**Testing:**
- Not detected. No `*.test.*` / `*.spec.*`, no `vitest.config.*` / `jest.config.*`. Put new tests next to the file as `foo.test.ts` under `src/` if a runner is added; do not invent a `__tests__/` tree until the project adopts one.

**Documentation:**
- `README.md`: Stack and service overview
- `AI_EVALUATION_FLOW.md`: PDF → Gemini draft flow
- `security.skill.md` / `performance-scalability.skill.md`: Review constraints for agents
- `.planning/PROJECT.md`: Product scope and layer rule (page → hooks → services → Supabase)

## Naming Conventions

**Files:**
- Pages: PascalCase + `Page` suffix — `PatientsPage.tsx`, `WaitingApprovalPage.tsx`
- Components: PascalCase matching the export — `PatientGoalsPanel.tsx`, `ConfirmDialog.tsx`
- Services: kebab-case domain + `.service.ts` — `patients.service.ts`, `aiPhysicalEvaluation.service.ts`
- Hooks: `use` + PascalCase domain — `usePatients.ts`, `useClinic.ts` (calendar+board together)
- Schemas: kebab-case + `.schema.ts` — `patient.schema.ts`
- Types: kebab-case noun — `account.ts`, `patient.ts` (not `account.types.ts`)
- CSS: `index.css` only for global tokens; Tailwind utilities in TSX
- SQL: numbered or req id prefix — `03-account-types-team.sql`, `patients-req05-evaluations.sql`

**Directories:**
- Lowercase plural for collections: `pages/`, `hooks/`, `services/`, `components/patients/`
- Role folders under `components/`: `ui`, `auth`, `layout`, `patients`, `brand`
- Auth pages live in `pages/auth/`, not `components/auth/`

**Exports:**
- Named function export matching the file: `export function PatientsPage`
- No directory barrels. Exception: `src/lib/security/index.ts` imported as `@/lib/security`
- Types: `export type` for unions, `export interface` for objects, `export const xLabels: Record<Union, string>`

**Symbols:**
- Functions and hooks: camelCase — `listPatients`, `useCreatePatient`, `canWritePatient`
- Components: PascalCase
- Query keys: lowercase kebab strings in arrays — `['patients', id, 'dashboard']`, `['calendar-sessions', fromIso, toIso]`
- DB columns: snake_case only inside services (`full_name`). UI uses DTO camelCase (`fullName`)
- CSS tokens: `forest`, `ink`, `canvas`, `accent` (see `src/index.css`). Do not introduce bakery token names (`chocolate`, `caramel`) in new UI — they exist only as aliases

**Routes (Portuguese paths):**
- `/` login, `/cadastro` register, `/aguardando` pending, `/painel` dashboard, `/pacientes`, `/pacientes/:id`, `/equipe`, `/agenda`, `/quadro`
- Patient tabs: query `?aba=cadastro|evolucoes|avaliacao` (omit for resumo)
- Redirects: `/login` → `/`, `/kanban` → `/quadro`, `/pacientes/:id/cadastro` → `?aba=cadastro`

## Where to Add New Code

**New clinic feature (e.g. documents on the ficha):**
- Types: `src/types/<domain>.ts` or extend `src/types/patient.ts` if it is part of the ficha
- Zod: `src/schemas/<domain>.schema.ts`
- Service: `src/services/<domain>.service.ts` — table access + mappers
- Hooks: add to `src/hooks/usePatients.ts` if it is patient-scoped; otherwise new `src/hooks/use<Domain>.ts`
- UI: panel in `src/components/patients/` if it is a ficha tab; otherwise `src/pages/<Name>Page.tsx`
- Route: register in `src/routes/index.tsx` inside `ProtectedRoute` > `AppShell`
- Nav: `src/config/navigation.ts` (`clinicNavigationItems` and `mobileNavItems` separately — Equipe is drawer-only)
- SQL: new `supabase/<req>-<name>.sql` plus a copy under `.planning/phases/<phase>/sql/` so git has it
- Tests: not established — colocate `*.test.ts` when a runner exists

**New form field on an existing clinic screen:**
- Schema first in `src/schemas/patient.schema.ts` (or the matching schema)
- Mapper + write payload in the service
- Bind with `useForm` + `zodResolver` in the page/panel (copy `PatientsPage.tsx` / `PatientCadastroPanel.tsx`)

**New UI primitive:**
- Implementation: `src/components/ui/<Name>.tsx` (PascalCase file, named export)
- Reuse `Button`, `Modal`, `ConfirmDialog`, `DataTable` before creating variants

**New auth/account behavior:**
- Predicates: `src/lib/accountAccess.ts`
- Types: `src/types/account.ts`
- Persistence: `src/services/team.service.ts` or `auth.service.ts` + SQL RPC
- Gates: `src/providers/AuthProvider.tsx` and `src/components/auth/ProtectedRoute.tsx`
- Do not use `src/lib/permissions.ts`

**Utilities:**
- Security / formatting / redirects: `src/lib/security/index.ts`
- Avatar colors / initials: `src/lib/avatar.ts`
- Env: `src/config/env.ts` only

**Do not add clinic code here:**
- `src/services/modules.service.ts`
- `src/hooks/queries.ts`
- `src/lib/permissions.ts`
- `src/types/database.types.ts` employee/order types
- Unrouted `src/pages/{Products,Orders,Recipes,…}Page.tsx`

**New route:**
- Page file in `src/pages/` (or `src/pages/auth/`)
- Import in `src/routes/index.tsx` — guest vs `ProtectedRoute` vs waiting
- If it needs chrome, nest under `AppShell`

## Special Directories

**`dist/`:**
- Purpose: Vite production build
- Generated: Yes (`npm run build`)
- Committed: No (`.gitignore`)

**`node_modules/`:**
- Purpose: npm packages
- Generated: Yes
- Committed: No

**`supabase/`:**
- Purpose: Local SQL Editor scripts
- Generated: No (hand-written)
- Committed: No (`/supabase/` in `.gitignore`). Duplicate into `.planning/phases/*/sql/` when the phase must keep SQL in git

**`.planning/`:**
- Purpose: GSD plans, state, codebase map
- Generated: Partially (workflow)
- Committed: Yes (project convention)

**`.cursor/`:**
- Purpose: GSD skills, agents, workflows
- Generated: Installer / sync
- Committed: Yes in this repo

**`.env` / `.env.local`:**
- Purpose: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_GEMINI_API_KEY`
- Generated: No
- Committed: No — note existence only; never quote values

**`src/Logos/` vs `src/assets/brand/`:**
- Purpose: Brand PNGs
- Generated: No
- Committed: Yes
- Use `src/assets/brand/` for new brand files

---

*Structure analysis: 2026-09-14*
*Update when directory structure changes*
