# Testing Patterns

**Analysis Date:** 2026-09-04

## Test Framework

**Runner:**
- Not detected. `package.json` has no `test` script. No `vitest.config.*`, `jest.config.*`, or Playwright/Cypress config. `package-lock.json` has no `vitest`, `jest`, `@testing-library/*`, or `playwright`.
- Quality gates that **do** exist: `npm run lint` (`eslint.config.js`) and `npm run typecheck` / the `tsc --noEmit` step in `npm run build` (`package.json`, `tsconfig.json`).
- When introducing automated tests, add **Vitest** (same Vite 6 toolchain as `vite.config.ts`) plus **@testing-library/react** / **@testing-library/user-event** for components, and **Playwright** for browser flows. Do not add Jest in parallel.

**Assertion Library:**
- Not detected. Use Vitest’s `expect` (`import { describe, it, expect, vi, beforeEach } from 'vitest'`).

**Run Commands:**
```bash
npm run lint          # ESLint — current substitute for a test suite
npm run typecheck     # tsc --noEmit
npm run build         # typecheck + production bundle

# Add these when the runner is installed:
npm test              # vitest run
npm run test:watch    # vitest
npm run test:coverage # vitest run --coverage
npm run test:e2e      # playwright test
```

## Test File Organization

**Location:**
- No `*.test.*`, `*.spec.*`, `__tests__/`, `e2e/`, or `tests/` files exist under the repo (application `src/` has 81 TypeScript modules and zero tests). `/supabase/` SQL is gitignored (`.gitignore`) and is not a test target from this tree.
- Adopt **co-located unit tests** next to the module: `src/lib/security/index.test.ts` beside `src/lib/security/index.ts`. Use `*.test.ts` for logic, `*.test.tsx` for React.
- Put Playwright specs in `e2e/` at the repo root (`e2e/auth.spec.ts`, `e2e/patients.spec.ts`), not inside `src/` (Vite app code only).
- GSD `/gsd-add-tests` expects files matching `*.test.*`, `*.spec.*`, or `tests/**` and RED→GREEN commit messages `test(phase-N): ...`. Follow that naming when generating phase tests.

**Naming:**
- `{module}.test.ts` mirroring the source file (`permissions.test.ts` for `src/lib/permissions.ts`).
- E2E: `{flow}.spec.ts` named after the user journey (`login.spec.ts`, `patient-alerts.spec.ts`).

**Structure:**
```
src/lib/security/index.test.ts
src/lib/permissions.test.ts
src/lib/avatar.test.ts
src/schemas/auth.schema.test.ts
src/schemas/patient.schema.test.ts
src/hooks/usePatients.test.ts          # after wrapping QueryClient
e2e/login.spec.ts
e2e/patients-crud.spec.ts
```

## Test Structure

**Suite Organization:**
No in-repo example. Use this pattern (Vitest + arrange/act/assert), matching GSD add-tests:

```typescript
import { describe, it, expect } from 'vitest'
import { mapAuthError, isSafeInternalPath } from '@/lib/security'

describe('mapAuthError', () => {
  it('hides invalid login credentials', () => {
    // Arrange
    const error = { message: 'Invalid login credentials' }

    // Act
    const message = mapAuthError(error)

    // Assert
    expect(message).toBe('E-mail ou senha incorretos.')
  })
})

describe('isSafeInternalPath', () => {
  it('rejects protocol-relative URLs', () => {
    expect(isSafeInternalPath('//evil.example/x')).toBe(false)
  })
})
```

**Patterns:**
- One `describe` per exported function or schema. `it` names state the behavior in English or Portuguese; keep expected strings in Portuguese because production copy is pt-BR (`src/lib/security/index.ts`, `src/schemas/auth.schema.ts`).
- No shared setup/teardown exists. For sessionStorage rate limits (`checkRateLimit` in `src/lib/security/index.ts`), `beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks() })`.
- Assert on exact Portuguese messages for mappers and Zod `.safeParse()` `error.issues[0].message`.
- Prefer `safeParse` over throwing `schema.parse` in unit tests so failures stay assertion-shaped.

## Mocking

**Framework:**
- Not detected. Use Vitest `vi.mock` / `vi.fn`. Do not mock TypeScript types.

**Patterns:**
```typescript
import { vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@/stores/toast.store', () => ({
  toast: vi.fn(),
}))
```

Chainable query builder for services (`src/services/patients.service.ts` uses `.from().select().eq().maybeSingle()`):

```typescript
function mockQuery(result: { data: unknown; error: { message: string } | null }) {
  const query: Record<string, unknown> = {}
  const self = () => query
  query.select = vi.fn(self)
  query.eq = vi.fn(self)
  query.order = vi.fn(self)
  query.maybeSingle = vi.fn().mockResolvedValue(result)
  return query
}
```

**What to Mock:**
- `@/lib/supabase/client` (`supabase` Proxy in `src/lib/supabase/client.ts`) — never hit a live project in unit tests.
- `toast` from `@/stores/toast.store` when testing hooks (`src/hooks/usePatients.ts`).
- `import.meta.env` / `src/config/env.ts` when testing Setup vs App boot (`src/App.tsx`).
- `fetch` and `FileReader` for `src/services/aiPhysicalEvaluation.service.ts` (Gemini HTTP + PDF base64).
- `sessionStorage` for `checkRateLimit` (`src/lib/security/index.ts`).
- `localStorage` for `src/components/patients/PatientPhysicalEvaluationPanel.tsx` (`fisio.evaluations.${patientId}`).

**What NOT to Mock:**
- Zod schemas (`src/schemas/*.schema.ts`) — call them for real.
- Pure helpers: `src/lib/permissions.ts`, `src/lib/avatar.ts`, `mapAuthError` / `mapDbError` / `escapeIlike` / `formatCurrency` / `safeRedirectPath` in `src/lib/security/index.ts`.
- `statusLabels` and other lookup maps in `src/types/patient.ts`.

## Fixtures and Factories

**Test Data:**
No fixture directory exists. Build small factories next to tests, using camelCase for clinic domain and snake_case for bakery rows:

```typescript
import type { PatientListItem } from '@/types/patient'

export function makePatientListItem(
  overrides: Partial<PatientListItem> = {},
): PatientListItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Ana Costa',
    code: 'PAC-001',
    phone: '11999999999',
    status: 'em_tratamento',
    photoTone: 'bg-forest',
    initials: 'AC',
    program: 'Reabilitação',
    sessionsDone: 2,
    sessionsPlanned: 10,
    ...overrides,
  }
}
```

Row fixtures for services keep snake_case (`PatientRow` / `EvaluationRow` shapes in `src/services/patients.service.ts`, `src/services/evaluations.service.ts`).

**Location:**
- Put factories in the test file until a third test needs them, then `src/test/factories/{domain}.ts`.
- Do not commit `.env`, credentials, or real patient PHI. Use synthetic UUIDs and names.

## Coverage

**Requirements:** None enforced. No coverage reporter, no CI workflow under `.github/`.

**View Coverage:**
```bash
# After Vitest + @vitest/coverage-v8:
npx vitest run --coverage
```

**First-wave targets (highest value, no browser):**
- `src/lib/security/index.ts` — sanitization, open-redirect guard, auth/DB error mapping, ILIKE escape, pt-BR formatters, client rate limit.
- `src/lib/permissions.ts` — role gates (`canManageCatalog`, `isAdmin`, …).
- `src/lib/avatar.ts` — `avatarColor`, `initialsFromName`.
- `src/schemas/auth.schema.ts`, `src/schemas/patient.schema.ts`, `src/schemas/evaluation.schema.ts` — min/max, password rules, session `superRefine`.
- `src/config/env.ts` — reject empty, placeholder, and non-https URLs (needs env mocking).

**Lower priority until a runner + QueryClient wrapper exist:** `src/hooks/usePatients.ts`, `src/hooks/queries.ts` (optimistic `useMoveTask` / `useDismissNotification`). Skip CSS-only and `src/types/database.types.ts`.

## Test Types

**Unit Tests:**
- Not used yet. Treat pure functions and Zod schemas as the default TDD surface (GSD add-tests “TDD” class).
- Extract mappers (`mapEvaluation`, `mapListItem`) only if a test cannot reach them through the exported service with a mocked `supabase`.

**Integration Tests:**
- Not used. Service files are the integration seam with Supabase (`src/services/*.service.ts`). Unit-test them with a mocked client; do not require a local Postgres for CI until an explicit supabase test harness exists.
- TanStack Query defaults live in `src/main.tsx` (`staleTime: 60_000`, `retry: 1`, mutations `retry: 0`). Hook tests must wrap with `QueryClientProvider` using `retry: false`.

**E2E Tests:**
- Not used. When adding Playwright:
  - Base URL: Vite dev server (`npm run dev`).
  - Routes in `src/routes/index.tsx`: `/` and `/cadastro` (guest), `/painel`, `/pacientes`, `/pacientes/:id`, `/agenda`, `/quadro` (protected). `/login` redirects to `/`. `/kanban` redirects to `/quadro`.
  - Auth: `GuestRoute` / `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`). Session without profile shows “Conta sem perfil ativo”.
  - Do not mark E2E green without actually running the browser (GSD add-tests no-skip rule).
  - Seed users via a dedicated test clinic; never use production Supabase.

## Common Patterns

**Async Testing:**
```typescript
it('maps a failed insert to a user-safe error', async () => {
  const { upsertProduct } = await import('@/services/modules.service')
  // after vi.mock of supabase.from → error { code: '23505' }
  await expect(upsertProduct(null, form)).rejects.toThrow(
    'Já existe um registro com esses dados.',
  )
})
```

- Hook mutations: `await result.current.mutateAsync(...)` inside `waitFor`.
- `void qc.invalidateQueries` is fire-and-forget (`src/hooks/usePatients.ts`); assert `invalidateQueries` was called, not that a follow-up fetch finished.

**Error Testing:**
```typescript
it('rejects passwords that contain the email local part', () => {
  const parsed = registerSchema.safeParse({
    fullName: 'Maria Silva',
    email: 'maria@clinica.com',
    password: 'Maria123!',
    confirmPassword: 'Maria123!',
  })
  expect(parsed.success).toBe(false)
})

it('useAuth throws outside AuthProvider', () => {
  expect(() => render(<NeedsAuth />)).toThrow(
    'useAuth deve ser usado dentro de AuthProvider',
  )
})
```

- Auth UI: assert `role="alert"` text, not a toast (`src/pages/auth/LoginPage.tsx`).
- Mutation UI: assert `toast` was called with `('…', 'error')` (`src/hooks/usePatients.ts`).
- `mapAuthError` / `mapDbError` must never return raw `error.message` for known codes (`src/lib/security/index.ts`).
- Clinic `throwIfError` currently rethrows Postgres `error.message` (`src/services/calendar.service.ts`). Tests should document current behavior; new code should map through `mapDbError`.

**Component testing (when RTL is added):**
- Render `Input` / `Select` / `Textarea` with `label` + `error` and assert `aria-invalid` and `role="alert"` (`src/components/ui/Input.tsx`).
- `DataTable` loading spinner vs empty title vs rows (`src/components/ui/DataTable.tsx`).
- `ConfirmDialog` for delete flows (`src/components/patients/PatientAlertsPanel.tsx`).
- Do not snapshot entire pages (`src/pages/PatientPage.tsx` is a large composition). Test panels in isolation with mocked hooks.

**Query keys (keep tests in sync):**
- Patients: `['patients']`, `['patients', id]`, `['patients', id, 'dashboard']`, `['patients', id, 'sessions']`, `['patients', id, 'evaluations']`, `['therapists']` (`src/hooks/usePatients.ts`).
- Clinic: `['calendar-sessions', fromIso, toIso]`, `['board']`, `['board-dues', fromDate, toDate]` (`src/hooks/useClinic.ts`).
- Modules: `['products']`, `['orders', filter]`, `['search', term]` (enabled when `term.trim().length >= 2`) (`src/hooks/queries.ts`).

**Manual / UAT (current practice):**
- Verification today is `npm run lint`, `npm run typecheck`, and in-browser UAT (GSD `/gsd-verify-work`). Gemini PDF analysis without `VITE_GEMINI_API_KEY` returns a simulated result after a delay (`src/services/aiPhysicalEvaluation.service.ts`) — useful for UI UAT, not a substitute for a mocked unit test.

---

*Testing analysis: 2026-09-04*
