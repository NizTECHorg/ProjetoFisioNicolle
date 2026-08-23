# Coding Conventions

**Analysis Date:** 2026-08-23

## Naming Patterns

**Files:**
- React components/pages: `PascalCase.tsx` — e.g. `Button.tsx`, `PatientsPage.tsx`, `PatientAlertsPanel.tsx`
- Hooks: `use` + `PascalCase` — e.g. `usePatients.ts`, `useAuth.ts`, `useClinic.ts`
- Services: `kebab/domain` + `.service.ts` — e.g. `patients.service.ts`, `auth.service.ts`, `board.service.ts`
- Schemas: `domain.schema.ts` — e.g. `patient.schema.ts`, `auth.schema.ts`, `modules.schema.ts`
- Types: `domain.ts` or `database.types.ts` under `src/types/`
- Stores: `name.store.ts` — e.g. `toast.store.ts`
- Feature folders under `src/components/`: lowercase plural/domain — `auth/`, `patients/`, `ui/`, `layout/`, `brand/`, `dashboard/`
- Auth pages live under `src/pages/auth/` (`LoginPage.tsx`, `RegisterPage.tsx`)

**Functions:**
- Exported functions: `camelCase` — `listPatients`, `createPatientAlert`, `signInWithEmail`
- React components: `PascalCase` function declarations preferred — `export function PatientsPage()`
- UI primitives that need refs: `forwardRef` + `displayName` — see `src/components/ui/Button.tsx`
- Local helpers: `camelCase`, often private to the module — `throwIfError`, `ageFrom`, `emptyToNull`, `onError`

**Variables:**
- `camelCase` for locals and props
- `SCREAMING_SNAKE` for module-level constants — `ALERT_COLUMNS`, `DETAIL_COLUMNS`, `MAX_ATTEMPTS_PER_KEY`, `STORAGE_KEY`
- Boolean props/state: `is`/`show`/`open` prefixes — `isLoading`, `showPassword`, `editorOpen`

**Types:**
- Domain unions: string literal unions — `PatientStatus`, `AlertTone`, `SessionStatus` in `src/types/patient.ts`
- Interfaces for domain models: `Patient`, `PatientAlert`, `CreatePatientInput`
- Form data types: inferred from Zod — `export type CreatePatientFormData = z.infer<typeof createPatientSchema>`
- Props: `ComponentNameProps` as `interface` or `type` — `ButtonProps`, `PatientAlertsPanelProps`
- DB row shapes inside services: local `*Row` interfaces with **snake_case** fields matching Postgres — `PatientRow`, `AlertRow` in `src/services/patients.service.ts`
- App-facing models use **camelCase** after mapping in the service layer

## Code Style

**Formatting:**
- No Prettier / Biome / EditorConfig detected
- Style is enforced primarily by TypeScript (`strict`, unused checks) and ESLint
- Prefer single quotes, no trailing commas inconsistency is acceptable; match neighboring file style
- Numeric separators for large literals: `60_000`, `4200`

**Linting:**
- Tool: ESLint flat config — `eslint.config.js`
- Stack: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- Key rules:
  - React Hooks recommended rules
  - `react-refresh/only-export-components`: warn, `allowConstantExport: true`
- Ignore: `dist`
- Run: `npm run lint` → `node node_modules/eslint/bin/eslint.js .`
- Prefer fixing types over `eslint-disable`; the only established exception is the documented `any` bridge in `src/lib/supabase/client.ts`

**TypeScript:**
- Config: `tsconfig.json` — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`
- `verbatimModuleSyntax: true` → **always** use `import type` / `export type` for type-only imports
- Path alias: `@/*` → `src/*` (mirrored in `vite.config.ts`)
- Build gate: `npm run typecheck` / `npm run build` runs `tsc --noEmit` before Vite build

## Import Organization

**Order (observed pattern):**
1. External packages (`react`, `react-router-dom`, `@tanstack/react-query`, `zod`, `lucide-react`, etc.)
2. Internal `@/` absolute imports grouped loosely: components → hooks → schemas → services/lib → types → stores
3. Relative imports are rare; prefer `@/`

**Path Aliases:**
- Use `@/` for all app imports — e.g. `import { Button } from '@/components/ui/Button'`
- Do not invent deep relative paths (`../../../`) when `@/` works

**Type imports:**
```typescript
import type { PatientAlert, CreatePatientInput } from '@/types/patient'
import { patientAlertSchema, type PatientAlertFormData } from '@/schemas/patient.schema'
```

## Error Handling

**Patterns:**
1. **Services throw `Error` with user-facing Portuguese messages** — never return error tuples
2. **Auth / modules:** map provider/DB errors via `mapAuthError` / `mapDbError` in `src/lib/security/index.ts` before throw
3. **Patients / board / calendar:** local `throwIfError(error)` helpers that throw `new Error(error.message)` — prefer aligning new clinic code with mapped messages when user-facing
4. **React Query mutations:** shared `onError` → `toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')` — see `src/hooks/usePatients.ts`, `src/hooks/queries.ts`, `src/hooks/useClinic.ts`
5. **Auth pages (imperative submit):** `try/catch` + local `serverError` state with `role="alert"` — see `src/pages/auth/LoginPage.tsx`
6. **Success feedback:** `toast('…', 'success')` from `@/stores/toast.store` after mutations
7. **Guard hooks:** throw if used outside provider — `useAuth` in `src/hooks/useAuth.ts`

**Do this:**
```typescript
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

// in service
if (error) throw new Error(mapDbError(error)) // or throwIfError for raw message
```

**Do not:**
- Swallow errors silently in mutations
- Surface raw Supabase/Postgres strings to auth UX when `mapAuthError` / `mapDbError` apply
- Log secrets or full auth payloads to `console`

## Logging

**Framework:** Not detected (no Sentry, logger package, or structured logging)

**Patterns:**
- Prefer user toasts / inline alerts over `console.*` for product UX
- Dev-only diagnostics are not standardized; avoid adding noisy logs in services

## Comments

**When to Comment:**
- Explain non-obvious security or typing trade-offs — e.g. Supabase client typing note in `src/lib/supabase/client.ts`, sanitize/RLS reminder in `src/lib/security/index.ts`
- Brief domain notes on types — e.g. LGPD/list-shape comment on `PatientListItem` in `src/types/patient.ts`
- Section markers in large services — e.g. `// ---- Catalog ----` in `src/services/modules.service.ts`

**JSDoc/TSDoc:**
- Sparse; short block comments for public security helpers (`sanitizeText`, `isSafeInternalPath`, `mapAuthError`)
- Do not add JSDoc to every export; match the file’s existing density

## Function Design

**Size:**
- Prefer small focused exports in UI/hooks
- Services may be large (`modules.service.ts` ~900 lines, `patients.service.ts` ~540 lines) with private mappers and column constants at top — when adding logic, keep mappers next to the CRUD they support

**Parameters:**
- Prefer typed input objects for creates/updates — `CreatePatientInput`, form data types
- Mutation variables often `{ id, input }` objects — see `useUpdatePatient` in `src/hooks/usePatients.ts`

**Return Values:**
- Services: `async` functions returning domain types or `void` / small result objects
- Hooks: return React Query results (`useQuery` / `useMutation`) directly
- Forms: Zod schemas export both schema and `z.infer` form types

## Module Design

**Exports:**
- Named exports for components, hooks, services, schemas (default exports uncommon)
- App entry uses named `App` from `src/App.tsx`
- Barrel files: only established for `src/lib/security/index.ts` and `src/routes/index.tsx` — do **not** add barrels per folder by default

**Layering (prescriptive):**
| Layer | Location | Responsibility |
|-------|----------|----------------|
| Pages | `src/pages/` | Route screens, compose panels, wire forms |
| Components | `src/components/` | Presentational UI + feature panels |
| Hooks | `src/hooks/` | React Query keys, invalidate, toast |
| Services | `src/services/` | Supabase I/O, row→domain mapping |
| Schemas | `src/schemas/` | Zod validation + form option lists |
| Types | `src/types/` | Domain + DB shared types |
| Lib | `src/lib/` | Cross-cutting helpers (security, avatar, supabase) |
| Stores | `src/stores/` | Lightweight Zustand UI state (toasts) |

**Forms:**
- Always: `react-hook-form` + `zodResolver(schema)` + schema from `src/schemas/*`
- Re-parse/sanitize sensitive paths in services when needed (`auth.service.ts` calls `loginSchema.parse` + `sanitizeEmail`)

**React Query:**
- Query keys: string arrays — `['patients']`, `['patients', id]`, `['patients', id, 'dashboard']`, `['board']`
- Default client options in `src/main.tsx`: `staleTime: 60_000`, query `retry: 1`, mutation `retry: 0`, `refetchOnWindowFocus: false`
- On success: `void qc.invalidateQueries({ queryKey: [...] })` then success toast

**UI components:**
- Tailwind utility classes; brand tokens like `forest`, `accent`, `ink`, `line`, `surface`
- Class composition via array `.join(' ')` or template strings — see `Button.tsx`
- Optional `className = ''` prop for extension
- Icons from `lucide-react`

**i18n / copy:**
- User-facing strings in Portuguese (pt-BR)
- Dates/currency via `Intl` with `pt-BR` (`formatDate`, `formatCurrency` in security helpers or local service formatters)

## Naming: Domain vs Database

**Prescriptive mapping rule:**
- Postgres / Supabase select columns: `snake_case` (`full_name`, `created_at`)
- TypeScript domain objects & form fields: `camelCase` (`fullName`, `createdAt`)
- Status enum values stored as Portuguese snake tokens: `'em_tratamento'`, `'avaliacao'`
- Map in the service layer; pages/components should not consume raw DB rows

---

*Convention analysis: 2026-08-23*
