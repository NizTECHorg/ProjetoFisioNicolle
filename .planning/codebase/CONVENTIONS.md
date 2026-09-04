# Coding Conventions

**Analysis Date:** 2026-09-04

## Naming Patterns

**Files:**
- React components and pages: PascalCase matching the export. Pages end in `Page` (`src/pages/PatientsPage.tsx`, `src/pages/auth/LoginPage.tsx`). Feature panels end in `Panel` (`src/components/patients/PatientAlertsPanel.tsx`). Layout shells use the role name (`src/components/layout/AppShell.tsx`).
- Domain modules: camelCase with a role suffix — `*.service.ts` in `src/services/`, `*.schema.ts` in `src/schemas/`, `use*.ts` in `src/hooks/`.
- Types: singular domain names (`src/types/patient.ts`, `src/types/evaluation.ts`). Generated/hand-kept DB shapes live in `src/types/database.types.ts`.
- UI primitives: PascalCase under `src/components/ui/` (`Button.tsx`, `DataTable.tsx`, `ConfirmDialog.tsx`).
- Stores: `*.store.ts` (`src/stores/toast.store.ts`).
- Do not add a new file as `index.ts` unless it is a real public barrel. Existing barrels are only `src/lib/security/index.ts` and `src/routes/index.tsx`.

**Functions:**
- Use `camelCase` named functions. Export pages and components as `export function PatientsPage()` / `export function PatientAlertsPanel()` — never `React.FC` and never default exports.
- Hooks must start with `use` and wrap TanStack Query: `usePatients`, `useCreatePatientAlert`, `useCalendarSessions` (`src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`, `src/hooks/queries.ts`).
- Service operations are verbs + noun: `listPatients`, `createPatientAlert`, `signInWithEmail`, `mapAuthError` (`src/services/patients.service.ts`, `src/services/auth.service.ts`).
- Unexported row mappers stay private in the same service file: `mapPatient`, `mapEvaluation`, `mapSessionRecord` (`src/services/patients.service.ts`, `src/services/evaluations.service.ts`, `src/services/sessions.service.ts`).
- Prefix unused parameters with `_` to satisfy `noUnusedParameters` (`_data`, `_vars`, `_event` in `src/hooks/queries.ts`, `src/providers/AuthProvider.tsx`).
- Fire-and-forget promises with `void`: `void qc.invalidateQueries(...)` (`src/hooks/usePatients.ts`).

**Variables:**
- Application/domain objects use camelCase (`fullName`, `patientId`, `scheduledAt`) in `src/types/patient.ts` and `src/types/evaluation.ts`.
- Bakery/modules forms and DB-shaped objects keep snake_case to match Postgres columns (`category_id`, `is_active`, `production_time_minutes`) in `src/schemas/modules.schema.ts` and `src/types/database.types.ts`.
- Clinic service row DTOs use PascalCase `*Row` with snake_case fields (`PatientRow`, `EvaluationRow` in `src/services/patients.service.ts`, `src/services/evaluations.service.ts`).
- Module-level constants: `SCREAMING_SNAKE_CASE` (`EVALUATION_COLUMNS`, `MAX_ATTEMPTS_PER_KEY`, `STORAGE_KEY` in `src/services/evaluations.service.ts`, `src/lib/security/index.ts`).
- Boolean props: `isLoading`, `isAuthenticated`, `fullWidth`, `compact`.
- Query keys: lowercase kebab or plural nouns in arrays — `['patients']`, `['patients', id, 'evaluations']`, `['calendar-sessions']`, `['board-dues']` (`src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`).

**Types:**
- PascalCase. Prefer `export interface` for domain models and UI props (`Patient`, `ButtonProps`). Use `export type` for unions and aliases (`PatientStatus`, `ToastTone`, `PatientTab`).
- Form payloads: `z.infer<typeof schema>` named `*FormData` (`LoginFormData` in `src/schemas/auth.schema.ts`, `CreatePatientFormData` in `src/schemas/patient.schema.ts`, `EvaluationFormData` in `src/schemas/evaluation.schema.ts`).
- Service write DTOs: `Create*Input` / `Update*Input` / `Upsert*Input` (`src/types/patient.ts`, `src/types/evaluation.ts`).
- With `verbatimModuleSyntax` in `tsconfig.json`, type-only imports must use `import type { ... }`.

## Code Style

**Formatting:**
- No Prettier / Biome / EditorConfig detected. Match neighboring files by hand.
- 2-space indent. Semicolons required. Single quotes in `.ts`/`.tsx`. Trailing commas in multiline lists and objects.
- Tailwind classes are string arrays joined with `.join(' ')` — do not introduce `clsx` or `tailwind-merge` (`src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`).
- Theme tokens: `forest`, `forest-mid`, `accent`, `accent-soft`, `canvas`, `surface`, `ink`, `muted`, `line`, `error`, `success` (`src/index.css`). Prefer these over raw hex except inside helpers like `avatarColor` (`src/lib/avatar.ts`).
- User-facing copy is Portuguese (pt-BR): toasts, validation messages, empty states, `Intl.DateTimeFormat('pt-BR')` / `Intl.NumberFormat('pt-BR')`.

**Linting:**
- ESLint 9 flat config in `eslint.config.js`: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`.
- Scope: `**/*.{ts,tsx}`. Ignore: `dist`.
- `react-refresh/only-export-components` is `warn` with `allowConstantExport: true` (needed for `AuthContext` in `src/hooks/useAuth.ts`).
- TypeScript (`tsconfig.json`): `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`. Handle possibly-undefined index access (`part[0]`, `data[0]`).
- Run `npm run lint` and `npm run typecheck` (or `npm run build`, which typechecks first). Do not disable rules except the documented `any` on the Supabase client in `src/lib/supabase/client.ts`.

## Import Organization

**Order:**
1. React (`react`, `react-dom`) — including `forwardRef`, `createContext`.
2. Third-party: `react-router-dom`, `react-hook-form`, `@hookform/resolvers/zod`, `@tanstack/react-query`, `lucide-react`, `zod`, `zustand`, `@supabase/supabase-js`.
3. Internal `@/` modules, grouped by layer:
   - `@/components/...`
   - `@/hooks/...`
   - `@/schemas/...`
   - `@/lib/...`
   - `@/services/...`
   - `@/types/...`
   - `@/stores/...`
   - `@/config/...` / `@/providers/...`
4. `import type` lines may sit with the matching module or after value imports; keep types on `import type` because of `verbatimModuleSyntax`.

Example from `src/pages/auth/LoginPage.tsx`:

```typescript
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema'
import { safeRedirectPath } from '@/lib/security'
import { signInWithEmail } from '@/services/auth.service'
```

**Path Aliases:**
- `@/*` → `src/*` (`tsconfig.json` `paths` and `vite.config.ts` `resolve.alias`). Always import via `@/`, never deep relative (`../../../`).
- Import UI from `@/components/ui/Button`, not a barrel. Import security helpers from `@/lib/security` (barrel at `src/lib/security/index.ts`). Import routes via `@/routes` (`src/routes/index.tsx` re-exports `AppRoutes`).

## Error Handling

**Patterns:**
- Services throw `Error` with a Portuguese message. Do not return `{ error }` tuples from new service functions.
- Auth: parse with Zod, then `throw new Error(mapAuthError(error))` (`src/services/auth.service.ts`, mapper in `src/lib/security/index.ts`). Never surface raw Supabase Auth strings.
- Modules/bakery CRUD: `throwDb(error)` → `mapDbError` (`src/services/modules.service.ts`). Map Postgres codes (`42501`, `23505`, `23503`, `23514`) to safe copy.
- Clinic domain (patients, sessions, evaluations, calendar, board): local `throwIfError(error)` rethrows `error.message` (`src/services/patients.service.ts`, `src/services/evaluations.service.ts`, `src/services/calendar.service.ts`, `src/services/board.service.ts`). Prefer wrapping new clinic writes with `mapDbError` instead of leaking Postgres text.
- Session expiry: `throw new Error('Sessão expirada. Entre novamente.')` after `supabase.auth.getUser()` (`src/services/sessions.service.ts`, `src/services/evaluations.service.ts`).
- Hook mutations share:

```typescript
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

  Used in `src/hooks/usePatients.ts`, `src/hooks/useClinic.ts`, `src/hooks/queries.ts`. Success toasts are short Portuguese sentences (`'Paciente cadastrado'`, `'Alerta removido'`).
- Auth pages catch locally into `serverError` and render `role="alert"` (`src/pages/auth/LoginPage.tsx`, `src/pages/auth/RegisterPage.tsx`). Do not toast login/register failures — keep them inline on the form.
- List/query pages branch on `isLoading` / `isError` / empty (`src/pages/PatientsPage.tsx`). Empty and error copy stays in Portuguese.
- Context hooks throw if used outside the provider: `useAuth` in `src/hooks/useAuth.ts`.
- Optimistic mutations (`useMoveTask`, `useDismissNotification` in `src/hooks/queries.ts`) snapshot previous cache, roll back in `onError`, then `invalidateQueries` in `onSettled`.

## Logging

**Framework:** `console` (no logger package)

**Patterns:**
- Do not add `console.log` in feature code. The only `console.error` is in `src/components/patients/PatientPhysicalEvaluationPanel.tsx` for Gemini/PDF failures; prefer `setErrorMessage` / toast for the user.
- User-visible diagnostics go through `toast()` (`src/stores/toast.store.ts`) or inline `role="alert"` banners.
- Swallow storage/quota failures with empty `catch` only when a fallback already exists (rate-limit store in `src/lib/security/index.ts`, localStorage in `src/components/patients/PatientPhysicalEvaluationPanel.tsx`).

## Comments

**When to Comment:**
- Explain a non-obvious constraint, not what the next line does. Example: the auth-state callback must stay synchronous to avoid a supabase-js deadlock (`src/providers/AuthProvider.tsx`).
- Document security intent in JSDoc on `src/lib/security/index.ts` (`sanitizeText`, `isSafeInternalPath`, `mapAuthError`, `checkRateLimit`, `escapeIlike`).
- Short domain notes on types (`src/types/patient.ts`: LGPD/list shape, REQ-02 dashboard).
- One-line `eslint-disable` only where already used (`src/lib/supabase/client.ts`).

**JSDoc/TSDoc:**
- Use Portuguese JSDoc for security and mapping helpers. Do not JSDoc every exported component. Inline `/** ... */` on a prop is fine (`compact` on `src/components/patients/PatientAlertsPanel.tsx`).

## Function Design

**Size:**
- Keep UI primitives small and presentational (`src/components/ui/`). Put data access in `src/services/` and cache/toast in `src/hooks/`.
- Colocate private helpers (`ageFrom`, `emptyToNull`, `formatDateLabel`) in the service file that needs them rather than creating a grab-bag util. Shared sanitization, money/date format, and path safety belong in `src/lib/security/index.ts` or `src/lib/avatar.ts`.
- Pages compose: `PageHeader` + `DataTable`/`Modal` + `useForm` + a `use*` mutation. Follow `src/pages/PatientsPage.tsx` / `src/pages/ProductsPage.tsx`.

**Parameters:**
- Prefer a single input object for writes (`CreatePatientInput`, `UpsertPatientEvaluationInput`).
- Mutation variables are inline object types when they are hook-local (`{ id, input }`, `{ alertId, input }` in `src/hooks/usePatients.ts`).
- Optional UI flags default in the destructure (`compact = false`, `wide = false`, `tone = 'info'`).

**Return Values:**
- Services return domain objects or `void` / `Promise<void>`. Queries return `[]`/`null` on empty, never throw for “not found” unless it is an auth/session failure (`fetchProfile` returns `null` on error in `src/services/auth.service.ts`).
- Explicit `Promise<T>` on exported async functions when the contract matters (`listSessionsInRange`, `signInWithEmail`).
- Zod schemas export both the schema and the inferred type. Optional text fields use `.trim()` + max length + Portuguese messages (`src/schemas/patient.schema.ts`).

## Module Design

**Exports:**
- Named exports only. Zero `export default` under `src/`.
- Form controls that need refs: `forwardRef` + `displayName` (`src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`).
- `as const` for closed lists (`navigationItems` in `src/config/navigation.ts`, `tones` in `src/components/ui/Badge.tsx`, `env` in `src/config/env.ts`).
- Zustand store + a `toast()` helper that calls `useToastStore.getState().push` so non-React modules can notify (`src/stores/toast.store.ts`).

**Barrel Files:**
- Do not add barrels for `components/`, `hooks/`, or `services/`. Import the concrete file (`@/hooks/usePatients`, `@/services/patients.service`).
- Allowed barrels: `@/lib/security` and `@/routes`.

**Layering (follow this when adding code):**
1. Zod schema in `src/schemas/`.
2. Domain type in `src/types/` (camelCase for clinic; snake_case only if mirroring bakery tables).
3. Service function in `src/services/*.service.ts` talking only to `supabase`.
4. Hook in `src/hooks/` with query keys + `onError` toast + `invalidateQueries`.
5. UI in `src/components/...` or `src/pages/...` using `useForm` + `zodResolver`.
6. Route in `src/routes/index.tsx` if it is a new screen. Guard with `ProtectedRoute` / `GuestRoute` (`src/components/auth/ProtectedRoute.tsx`).
7. Nav entry in `src/config/navigation.ts` only for primary chrome.

**Forms:**
- `useForm<T>({ resolver: zodResolver(schema), defaultValues: { ... } })`.
- `noValidate` on `<form>` so the browser does not fight Zod (`src/pages/auth/LoginPage.tsx`).
- Destructive actions go through `ConfirmDialog` (`src/components/ui/ConfirmDialog.tsx`).
- Accessibility: label + `htmlFor`, `aria-invalid`, `role="alert"` on field errors (`src/components/ui/Input.tsx`).

**Auth / env:**
- Read env only via `src/config/env.ts`. If `!env.isConfigured`, `App` renders `SetupPage` (`src/App.tsx`).
- `isAuthenticated` is session **and** active profile (`src/providers/AuthProvider.tsx`). Role checks use `src/lib/permissions.ts`.

---

*Convention analysis: 2026-09-04*
