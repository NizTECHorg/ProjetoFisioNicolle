# Coding Conventions

**Analysis Date:** 2026-09-14

## Naming Patterns

**Files:**
- Pages: `PascalCase` + `Page` suffix in `src/pages/` — `PatientsPage.tsx`, `LoginPage.tsx`
- Nested auth pages live in `src/pages/auth/` — `LoginPage.tsx`, `RegisterPage.tsx`, `WaitingApprovalPage.tsx`
- Feature panels: `PascalCase` + domain prefix in `src/components/patients/` — `PatientGoalsPanel.tsx`, `PatientEvolutionsPanel.tsx`
- UI primitives: `PascalCase` in `src/components/ui/` — `Button.tsx`, `DataTable.tsx`, `ConfirmDialog.tsx`
- Services: `camelCase` + `.service.ts` in `src/services/` — `patients.service.ts`, `auth.service.ts`
- Hooks: `use` + `PascalCase` in `src/hooks/` — `usePatients.ts`, `useAuth.ts`
- Schemas: `camelCase` + `.schema.ts` in `src/schemas/` — `patient.schema.ts`, `auth.schema.ts`
- Types: `camelCase` in `src/types/` — `patient.ts`, `account.ts`, `evaluation.ts`
- Stores: `camelCase` + `.store.ts` in `src/stores/` — `toast.store.ts`
- SQL scripts: numbered kebab-case — `supabase/03-account-types-team.sql`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`

**Functions:**
- Use `camelCase` named function declarations for exports: `export function listPatients()`, `export function useCreatePatient()`
- Use `export async function` for all service I/O: `export async function signInWithEmail()` in `src/services/auth.service.ts`
- Keep unexported helpers as `function mapPatient()`, `function throwIfError()` — never `export` mappers
- Boolean helpers start with `is` / `can` / `should`: `isPendingTherapist()`, `canWritePatient()`, `canManageTeam()` in `src/lib/accountAccess.ts`
- Mutation hooks: `use` + verb + noun — `useCreatePatient`, `useUpdatePatientAlert`, `useDecideMembership`

**Variables:**
- Use `camelCase` for JS/TS values: `patientId`, `queryClient` as `qc`, `joinCode`
- Prefix React Query loading/error flags from the library: `isLoading`, `isError`, `isPending`
- Prefix component boolean props with `is` / `can` / `open`: `isLoading`, `canWrite`, `fullWidth`
- Numeric time literals use underscore separators: `60_000`, `120_000`, `15 * 60 * 1000`
- Query keys are string tuples: `['patients']`, `['patients', id, 'sessions']`, `['team']`

**Types:**
- Domain unions use Portuguese snake_case literals matching Postgres: `'em_tratamento' | 'avaliacao' | 'alta' | 'inativo'` in `src/types/patient.ts`
- Account unions: `'autonomo' | 'empresa' | 'fisioterapeuta'` and `'pending' | 'active' | 'rejected'` in `src/types/account.ts`
- App-facing interfaces use `PascalCase` + camelCase fields: `ClinicProfile.fullName`, `PatientListItem.sessionsDone`
- DB row shapes stay local to the service file as `interface PatientRow` / `interface MembershipRow` with snake_case columns
- Zod-inferred form types end with `FormData`: `LoginFormData`, `CreatePatientFormData`, `EvaluationFormData`
- Label maps sit next to the union: `statusLabels`, `accountTypeLabels`, `membershipStatusLabels`

## Code Style

**Formatting:**
- No Prettier, EditorConfig, or format script. Match surrounding files by hand.
- Single quotes for strings. No semicolons.
- 2-space indent. Trailing commas in multiline objects, arrays, and parameter lists.
- Prefer `function` declarations over `const fn = () =>` for named exports and helpers.
- Combine class names with `[...].join(' ')`, not `clsx` / `cn` / `tailwind-merge` — see `src/components/ui/Button.tsx`
- Keep Tailwind token names from `src/index.css` (`forest`, `ink`, `canvas`, `surface`, `line`, `accent`, `error`)

**Linting:**
- ESLint 9 flat config in `eslint.config.js`: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Files: `**/*.{ts,tsx}`; ignore `dist`
- `react-refresh/only-export-components` is `warn` with `allowConstantExport: true`
- TypeScript `strict` in `tsconfig.json` plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
- Run `npm run lint` and `npm run typecheck` before considering a change complete
- Do not add `any` except behind an explicit `eslint-disable-next-line @typescript-eslint/no-explicit-any` (only `src/lib/supabase/client.ts` does this)

## Import Organization

**Order:**
1. External packages (`react`, `react-router-dom`, `@tanstack/react-query`, `zod`, `lucide-react`)
2. Internal `@/` modules: components, then hooks/services, then schemas, then lib, then types, then stores
3. Type-only imports via `import type { ... }` (required by `verbatimModuleSyntax`)

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

When a value and a type come from the same module, inline `type` in the value import: `import { loginSchema, type LoginFormData } from '@/schemas/auth.schema'`.

**Path Aliases:**
- Use `@/` for everything under `src/` (`tsconfig.json` `paths` + `vite.config.ts` `resolve.alias`)
- Never use relative `../` to leave a feature folder toward `src/` — `src/lib/security/index.ts` is imported as `@/lib/security`
- Cross-service imports are allowed (`src/services/auth.service.ts` imports `fetchMembership` from `@/services/team.service`)
- Do not import bakery `src/lib/permissions.ts` from clinic account code — `src/lib/accountAccess.ts` and `src/types/account.ts` are the clinic authority

## Error Handling

**Patterns:**
- Services throw `Error` with a Portuguese user-facing message. Pages and hooks never parse Postgres/Auth internals.
- Map vendor errors through `mapAuthError()` / `mapDbError()` in `src/lib/security/index.ts` before throwing. Example: `src/services/auth.service.ts`, `src/services/modules.service.ts` (`throwDb`).
- Clinic services that still call `throw new Error(error.message)` (`src/services/patients.service.ts` `throwIfError`, `src/services/team.service.ts` `throwIfError`) should prefer `mapDbError` for new code so RLS/unique-violation text never reaches the UI.
- Session expiry: throw `'Sessão expirada. Entre novamente.'` after `supabase.auth.getUser()` returns no user.
- React Query mutations share a local `onError` that toasts `error instanceof Error ? error.message : 'Erro inesperado'` — copy this into every new hook file (`src/hooks/usePatients.ts`, `src/hooks/queries.ts`, `src/hooks/useTeam.ts`, `src/hooks/useClinic.ts`).
- Mutations toast a short Portuguese success string on `onSuccess` (`'Paciente cadastrado'`, `'Alerta removido'`).
- Auth forms catch in `onSubmit` and set `serverError` state with `role="alert"` — `src/pages/auth/LoginPage.tsx`. Do not toast login failures.
- Query error UI: ternary blocks with `isLoading` spinner, `isError` article (`border-error/20 bg-error/5`), then content — `src/pages/TeamPage.tsx`, `src/pages/KanbanPage.tsx`.
- Swallow only when a comment explains why: empty `catch` in `signInWithEmail` keeps the session if membership fetch fails (D-03 fail-closed lives in `AuthProvider`).
- Do not `console.error` except as a last resort (`src/components/patients/PatientPhysicalEvaluationPanel.tsx`). Prefer `toast(..., 'error')` or `setErrorMessage`.

```typescript
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(mapDbError(error))
}
```

## Logging

**Framework:** `console` only. No logger package.

**Patterns:**
- Do not log PII, tokens, or Supabase error objects in production paths.
- The single `console.error` is in `src/components/patients/PatientPhysicalEvaluationPanel.tsx` on PDF analysis failure.
- User feedback goes through `toast()` in `src/stores/toast.store.ts` or inline `role="alert"` banners.
- Comments that document security/auth constraints (`D-03`, `REQ-15`, LGPD) are preferred over debug logs.

## Comments

**When to Comment:**
- Document why a non-obvious constraint exists: fail-closed auth, RLS vs UX predicates, deadlock in `onAuthStateChange`.
- Reference requirement / decision IDs when the file is the source of truth: `REQ-15`, `D-01`–`D-07`, `T-03-01` in `src/lib/accountAccess.ts`, `src/types/account.ts`.
- Explain empty catches and ignored storage failures (`/* private mode / quota */`, `/* ignore */`).
- Do not narrate what the next line does.

**JSDoc/TSDoc:**
- Use a short `/** ... */` block on exported security helpers and domain contracts (`src/lib/security/index.ts`, `src/types/patient.ts`).
- One-liners on predicates: `/** Fisio com pedido pendente: cadastro ok, clínica bloqueada (D-03). */`
- No `@param` / `@returns` boilerplate.

## Function Design

**Size:**
- Keep UI primitives under ~80 lines (`Button`, `Input`, `Modal`).
- Split page concerns into panels (`PatientCadastroPanel`, `PatientGoalsPanel`) rather than growing `PatientPage.tsx`.
- Service files group list/get/create/update/delete for one aggregate. Local `map*` functions convert snake_case rows to camelCase domain objects.

**Parameters:**
- Prefer a single input object for writes: `CreatePatientInput`, `UpsertPatientSessionInput`, `{ id, input }` in mutation hooks.
- Optional IDs for queries: `id: string | undefined` plus `enabled: Boolean(id)`.
- Default boolean props at the destructure: `canWrite = true`, `wide = false`, `tone = 'info'`.

**Return Values:**
- Queries return domain types or `null` (`getPatientById` → `Promise<Patient | null>`).
- Creates that navigate return `{ id: string }`.
- Updates/deletes return `Promise<void>`.
- Always type exported async functions explicitly (`Promise<void>`, `Promise<ClinicProfile | null>`).
- Hooks return the React Query result object; do not unwrap `.data` inside the hook.

## Module Design

**Exports:**
- Named exports only. There is no `export default` anywhere under `src/`.
- One primary component per file; extra helpers in the same file stay unexported (`LoadingScreen` in `src/components/auth/ProtectedRoute.tsx`).
- Form-field primitives that need `react-hook-form` use `forwardRef` + `displayName`: `Button`, `Input`, `Select`, `Textarea`.
- Feature components use `export function Name({ ... }: NameProps)`.
- Colocate `interface NameProps` (unexported) above the component.

**Barrel Files:**
- Do not add barrels. Import the concrete file: `@/components/ui/Button`, `@/hooks/usePatients`.
- The only `index.ts` modules are `src/routes/index.tsx` (`AppRoutes`) and `src/lib/security/index.ts` (imported as `@/lib/security`).

**Layer rules:**
- Pages compose UI + hooks. They do not call `supabase` directly.
- Hooks in `src/hooks/` wrap React Query around `src/services/*`. Put `staleTime`, `enabled`, `onSuccess`/`onError` here.
- Services own Supabase queries, column lists, and `map*` conversions. Validate writes with Zod `.parse()` at the service boundary when the input is a form (`src/services/auth.service.ts`).
- `src/lib/` holds pure predicates and sanitizers with no React.
- Clinic UX gating uses `src/lib/accountAccess.ts`. Bakery role gating stays in `src/lib/permissions.ts`. Do not mix them.
- Field naming: new clinic forms and types use camelCase (`fullName`, `birthDate`) and map to snake_case in the service. Legacy bakery schemas in `src/schemas/modules.schema.ts` keep snake_case (`category_id`, `is_active`) to match those tables — do not copy that style into clinic code.

**React Query:**
- Default client in `src/main.tsx`: `staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`, mutations `retry: 0`.
- Invalidate with `void qc.invalidateQueries({ queryKey })` or `await` when the UI must wait (`src/hooks/queries.ts`).
- Optimistic updates exist only for kanban tasks and notification dismiss in `src/hooks/queries.ts` (`onMutate` snapshot → `onError` rollback → `onSettled` invalidate). Copy that pattern for drag/dismiss UX; do not invent a different cache protocol.

**Forms:**
- `react-hook-form` + `zodResolver(schema)` + `schema.parse` / Zod messages in Portuguese.
- Empty optional strings stay `''` in the form; services convert with `emptyToNull`.
- Auth forms: `noValidate autoComplete="off"` and `role="alert"` for server errors.

**i18n:**
- UI copy is Portuguese (pt-BR). Identifiers and file names are English except domain enums.
- Dates/currency: `Intl.DateTimeFormat('pt-BR')` / `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` in `src/lib/security/index.ts`.

---

*Convention analysis: 2026-09-14*
