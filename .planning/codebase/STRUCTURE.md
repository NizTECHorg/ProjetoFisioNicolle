# Codebase Structure

**Analysis Date:** 2026-08-23

## Directory Layout

```
fisioterapia/
├── index.html              # SPA HTML entry
├── package.json            # Scripts and dependencies
├── vite.config.ts          # Vite + Tailwind + `@` alias
├── tsconfig.json           # Strict TS; paths `@/*` → `src/*`
├── eslint.config.js        # ESLint flat config
├── vercel.json             # SPA rewrite to index.html
├── public/                 # Static assets (favicon, logo, `_redirects`)
├── supabase/               # Manual SQL DDL for Supabase
│   ├── schema.sql          # profiles / auth bootstrap
│   ├── patients.sql        # patients clinical base
│   ├── patients-req01.sql  # additive patient req
│   ├── patients-req04-alerts.sql
│   ├── board.sql
│   └── board-due.sql
├── .planning/              # GSD planning docs (incl. codebase maps)
└── src/
    ├── main.tsx            # React + QueryClient bootstrap
    ├── App.tsx             # Env gate, router, auth, toasts
    ├── index.css           # Design tokens / Tailwind entry
    ├── vite-env.d.ts
    ├── config/             # Env + navigation
    ├── routes/             # Route table
    ├── providers/          # React context providers
    ├── pages/              # Route-level screens
    │   └── auth/           # Login / register
    ├── components/         # UI by concern
    │   ├── auth/
    │   ├── brand/
    │   ├── layout/
    │   ├── patients/
    │   ├── dashboard/      # Legacy sales chart (bakery)
    │   └── ui/
    ├── hooks/              # React Query + auth hooks
    ├── services/           # Supabase domain I/O
    ├── schemas/            # Zod validators
    ├── types/              # TS domain + DB types
    ├── stores/             # Zustand (toast only)
    ├── lib/                # Client, security, helpers
    │   ├── supabase/
    │   └── security/
    └── data/               # Empty placeholder (no fixtures yet)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One screen per route (or thin redirect/stub wrappers)
- Contains: `*Page.tsx` files; clinic pages are active; bakery pages exist but are unrouted
- Key files: `PatientsPage.tsx`, `PatientPage.tsx`, `CalendarPage.tsx`, `KanbanPage.tsx`, `DashboardPage.tsx`, `SetupPage.tsx`, `auth/LoginPage.tsx`, `auth/RegisterPage.tsx`

**`src/components/`:**
- Purpose: Reusable UI and feature panels (not route owners)
- Contains: `ui/` primitives, `patients/` feature panels, `layout/` shell, `auth/` guards/layout, `brand/`
- Key files: `layout/AppShell.tsx`, `auth/ProtectedRoute.tsx`, `patients/PatientCadastroPanel.tsx`, `patients/PatientAlertsPanel.tsx`, `patients/PatientProfileHeader.tsx`

**`src/hooks/`:**
- Purpose: Data-fetching and auth consumption APIs for UI
- Contains: Domain hooks + legacy mega-hook file
- Key files: `usePatients.ts`, `useClinic.ts`, `useAuth.ts`, `queries.ts` (legacy bakery)

**`src/services/`:**
- Purpose: All Supabase reads/writes and row mapping
- Contains: `*.service.ts` modules
- Key files: `patients.service.ts`, `calendar.service.ts`, `board.service.ts`, `auth.service.ts`, `modules.service.ts` (legacy)

**`src/schemas/`:**
- Purpose: Zod schemas for forms and boundary validation
- Contains: `auth.schema.ts`, `patient.schema.ts`, `modules.schema.ts` (legacy)

**`src/types/`:**
- Purpose: Shared TypeScript models
- Contains: `patient.ts` (clinic domain), `database.types.ts` (profiles + bakery schema typings)

**`src/config/`:**
- Purpose: App configuration constants
- Contains: `env.ts` (Supabase URL/key presence), `navigation.ts` (sidebar/mobile items)

**`src/lib/`:**
- Purpose: Cross-cutting utilities without React Query
- Contains: Supabase client, security helpers, permissions, avatar, labels
- Key files: `supabase/client.ts`, `security/index.ts`, `permissions.ts`

**`src/providers/`:**
- Purpose: Top-level React context providers
- Contains: `AuthProvider.tsx`

**`src/stores/`:**
- Purpose: Client UI state stores
- Contains: `toast.store.ts` only

**`src/routes/`:**
- Purpose: Central route definitions
- Contains: `index.tsx` exporting `AppRoutes`

**`supabase/`:**
- Purpose: Source-of-truth SQL to apply manually in Supabase
- Contains: Bootstrap + patient + board scripts (not auto-migrated by the app)

**`public/`:**
- Purpose: Static files copied as-is by Vite
- Contains: Favicons, logo, Netlify-style `_redirects`

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell
- `src/main.tsx`: React mount + QueryClient
- `src/App.tsx`: Configured app vs setup screen
- `src/routes/index.tsx`: Route tree

**Configuration:**
- `vite.config.ts`: Aliases, security headers (dev), chunk split
- `tsconfig.json`: Strict TS + `@/*` paths
- `src/config/env.ts`: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `src/config/navigation.ts`: Nav items for `AppShell`
- `vercel.json`: Client-side routing rewrite

**Core Logic:**
- `src/services/patients.service.ts`: Patient list/detail/dashboard/alerts CRUD
- `src/services/calendar.service.ts`: Session scheduling queries
- `src/services/board.service.ts`: Kanban columns/cards
- `src/services/auth.service.ts`: Sign-in/up/out + profile fetch
- `src/hooks/usePatients.ts` / `useClinic.ts`: Query keys for clinic features

**Testing:**
- Not detected — no `*.test.*` / `*.spec.*` or test runner config in package scripts

## Naming Conventions

**Files:**
- Pages: `PascalCase` + `Page` suffix — `PatientsPage.tsx`, `LoginPage.tsx`
- Components: `PascalCase` — `AppShell.tsx`, `Button.tsx`
- Hooks: `use` + camelCase — `usePatients.ts`, `useClinic.ts`
- Services: kebab/camel domain + `.service.ts` — `patients.service.ts`
- Schemas: domain + `.schema.ts` — `patient.schema.ts`
- Stores: domain + `.store.ts` — `toast.store.ts`
- Types: domain noun — `patient.ts`, `database.types.ts`
- SQL: descriptive kebab — `patients-req04-alerts.sql`

**Directories:**
- Lowercase plural or concern name: `pages`, `components`, `hooks`, `services`
- Feature subfolders under components: `patients`, `auth`, `layout`, `ui`

**Symbols:**
- Components/pages: `PascalCase` exports matching filename
- Functions: `camelCase` (`listPatients`, `signInWithEmail`)
- Types/interfaces: `PascalCase` (`Patient`, `PatientListItem`)
- Constants: `camelCase` or `SCREAMING` for closed sets as needed (`LIST_COLUMNS` in services)
- Query keys: string arrays like `['patients']`, `['board']`, `['calendar-sessions', from, to]`

## Where to Add New Code

**New clinic feature (preferred path):**
1. Types in `src/types/` (new file or extend `patient.ts` if patient-scoped)
2. Zod schemas in `src/schemas/` if forms are involved
3. Service functions in `src/services/<domain>.service.ts`
4. Hooks in `src/hooks/use<Domain>.ts` (or extend `useClinic` / `usePatients` if tightly related)
5. UI: feature components under `src/components/<domain>/`, page under `src/pages/`
6. Register route in `src/routes/index.tsx` and nav item in `src/config/navigation.ts`
7. SQL DDL additive script under `supabase/` if schema changes

**New shared UI primitive:**
- Implementation: `src/components/ui/<Name>.tsx`
- Match existing Button/Input/Modal patterns (forwardRef where needed)

**New auth-related helper:**
- Prefer `src/lib/security/index.ts` for sanitization/redirect/error mapping
- Auth API calls stay in `src/services/auth.service.ts`

**Utilities:**
- Shared helpers: `src/lib/`
- Do not put Supabase queries in `lib/` — those belong in `services/`

**Legacy bakery modules:**
- Existing code lives in `src/pages/*Page.tsx` (products, orders, etc.), `src/services/modules.service.ts`, `src/hooks/queries.ts`, `src/schemas/modules.schema.ts`
- Do not extend these for physiotherapy features; treat as inactive unless a deliberate product decision re-activates them

**Tests (when introduced):**
- Prefer co-located `*.test.ts(x)` next to the unit under test, or `src/**/__tests__/` — no established convention yet

## Special Directories

**`supabase/`:**
- Purpose: Manual SQL for operators to paste into Supabase SQL Editor
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes
- Committed: No (build artifact)

**`node_modules/`:**
- Purpose: npm packages
- Generated: Yes
- Committed: No

**`src/data/`:**
- Purpose: Intended for static fixtures/seed data
- Generated: No
- Committed: Yes (currently empty)

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: By GSD workflows
- Committed: Typically yes for team shared planning

**`.env` / `.env.*`:**
- Purpose: Local Vite secrets (`VITE_SUPABASE_*`)
- Generated: No (developer-created)
- Committed: No — never commit secrets; note existence only

---

*Structure analysis: 2026-08-23*
