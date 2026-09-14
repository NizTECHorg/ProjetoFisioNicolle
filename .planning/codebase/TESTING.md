# Testing Patterns

**Analysis Date:** 2026-09-14

## Test Framework

**Runner:**
- Not detected. `package.json` has no `test` script. There is no `vitest.config.*`, `jest.config.*`, or `playwright.config.*`.
- `devDependencies` in `package.json` contain ESLint, TypeScript, Vite, and Tailwind only — no Vitest, Jest, Testing Library, or Playwright.
- Quality gates today are `npm run lint` (`eslint.config.js`) and `npm run typecheck` / `npm run build` (`tsc --noEmit`).

When adding tests to this Vite + TypeScript app, use **Vitest** for unit tests (same toolchain as `vite.config.ts`) and **Playwright** for browser E2E. That matches `/gsd-add-tests` and `.cursor/get-shit-done/references/tdd.md`.

**Assertion Library:**
- Not detected. Use Vitest's `expect` from `'vitest'`. Do not add Chai or Jest as a second runner.

**Run Commands:**
```bash
npm run lint                  # ESLint on **/*.{ts,tsx}
npm run typecheck             # tsc --noEmit (current static check)
# After Vitest is added:
npx vitest run                # Run all unit tests once
npx vitest                    # Watch mode
npx vitest run --coverage     # Coverage (only after @vitest/coverage-v8)
# After Playwright is added:
npx playwright test           # E2E
```

Add these scripts to `package.json` when the runner lands — do not invent a Jest script:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test"
```

## Test File Organization

**Location:**
- Not detected. No `src/**/*.test.*`, `src/**/*.spec.*`, `__tests__/`, `tests/`, `e2e/`, or `cypress/` directories.

**Naming:**
- Colocate unit tests next to the source file: `src/lib/accountAccess.test.ts` beside `src/lib/accountAccess.ts`.
- Use `.test.ts` for pure modules and `.test.tsx` only when rendering React.
- Put Playwright specs in `e2e/` at the repo root: `e2e/auth-login.spec.ts`, `e2e/patients-create.spec.ts`.
- Do not use `.spec.ts` for Vitest (reserve `.spec.ts` for Playwright).

**Structure:**
```
src/lib/accountAccess.ts
src/lib/accountAccess.test.ts          # predicates, join-code normalize
src/lib/security/index.ts
src/lib/security/index.test.ts         # mapAuthError, mapDbError, safeRedirectPath
src/schemas/auth.schema.ts
src/schemas/auth.schema.test.ts        # Zod accept/reject cases
src/schemas/patient.schema.ts
src/schemas/patient.schema.test.ts
src/config/navigation.ts
src/config/navigation.test.ts          # clinicNavigationItems filter
e2e/auth-login.spec.ts
e2e/team-join-code.spec.ts
```

Do not test `src/types/*.ts`, SQL under `supabase/`, or `src/index.css`.

## Test Structure

**Suite Organization:**
No suite exists yet. Write Vitest files in the same style as production (single quotes, no semicolons, `@/` imports):

```typescript
import { describe, it, expect } from 'vitest'
import {
  canManageTeam,
  canWritePatient,
  isPendingTherapist,
  isRejectedAccount,
  normalizeJoinCode,
} from '@/lib/accountAccess'

describe('normalizeJoinCode', () => {
  it('trims, strips inner spaces, and uppercases', () => {
    expect(normalizeJoinCode(' ab 12cd ')).toBe('AB12CD')
  })
})

describe('canWritePatient', () => {
  it('allows only the creator', () => {
    expect(canWritePatient('user-1', 'user-1')).toBe(true)
    expect(canWritePatient('user-1', 'user-2')).toBe(false)
    expect(canWritePatient(undefined, 'user-1')).toBe(false)
  })
})

describe('isPendingTherapist', () => {
  it('is true only for fisioterapeuta + pending', () => {
    expect(isPendingTherapist('fisioterapeuta', 'pending')).toBe(true)
    expect(isPendingTherapist('empresa', 'pending')).toBe(false)
    expect(isPendingTherapist('fisioterapeuta', 'active')).toBe(false)
  })
})
```

**Patterns:**
- One `describe` per exported function. `it('does x')` in present tense, Portuguese domain words allowed in the title (`fisioterapeuta`, `join code`).
- No `beforeEach` unless the module mutates (rate-limit store in `src/lib/security/index.ts` uses `sessionStorage` — reset with `sessionStorage.clear()` in `beforeEach` / `afterEach`).
- Assert with `toBe` / `toEqual` / `toThrow`. Prefer `safeParse` on Zod rather than `parse` + try/catch for expected failures.
- Do not enable Vitest globals; always import `describe`, `it`, `expect`, `vi` from `'vitest'` so `tsconfig.json` `include: ["src"]` stays explicit.

## Mocking

**Framework:**
- Not detected. Use Vitest `vi` when a unit test must touch I/O.

**Patterns:**
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
```

Keep the mock surface small. Prefer testing `mapAuthError` / `mapDbError` / `canWritePatient` without mocking at all.

**What to Mock:**
- `@/lib/supabase/client` when a service test cannot stay pure
- `sessionStorage` / `localStorage` for `checkRateLimit` (`src/lib/security/index.ts`) and PDF cache (`src/components/patients/PatientPhysicalEvaluationPanel.tsx`)
- `@google/genai` / `fetch` in `src/services/aiPhysicalEvaluation.service.ts` — never hit Gemini from unit tests
- `window.location` / `navigator.clipboard` in page-level tests (`src/pages/TeamPage.tsx` copy-code path)

**What NOT to Mock:**
- Zod schemas (`src/schemas/*.ts`) — call `.safeParse` on real schemas
- Predicates in `src/lib/accountAccess.ts`, `src/lib/permissions.ts`, `src/lib/avatar.ts`, `src/config/navigation.ts`
- `mapAuthError` / `mapDbError` / `sanitizeText` / `safeRedirectPath` / `escapeIlike` in `src/lib/security/index.ts`
- React Query `onError` toast strings — if testing hooks, wrap with a real `QueryClient` (`retry: false`) rather than mocking `@tanstack/react-query`

Do not mock RLS. Postgres policy behavior is verified with SQL Editor allow/deny cases (see phase research), not Vitest.

## Fixtures and Factories

**Test Data:**
No fixture directory exists. Build small inline objects that match domain types in `src/types/patient.ts` and `src/types/account.ts`:

```typescript
import type { ClinicProfile } from '@/types/account'

function makeProfile(overrides: Partial<ClinicProfile> = {}): ClinicProfile {
  return {
    id: 'profile-1',
    fullName: 'Ana Silva',
    email: 'ana@clinica.test',
    role: 'administrador',
    avatarUrl: null,
    isActive: true,
    accountType: 'empresa',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
```

Zod cases: pass form-shaped objects, not DB rows.

```typescript
import { loginSchema, registerSchema } from '@/schemas/auth.schema'

it('rejects short passwords on register', () => {
  const result = registerSchema.safeParse({
    fullName: 'Ana Silva',
    email: 'ana@clinica.test',
    accountType: 'autonomo',
    password: 'Aa1!',
    confirmPassword: 'Aa1!',
  })
  expect(result.success).toBe(false)
})
```

**Location:**
- Keep factories in the test file until a third file needs the same builder, then add `src/test/factories.ts`.
- Do not commit `.env` fixtures. Tests that construct the Supabase client must stub `import.meta.env` via Vitest `define` / `vi.stubEnv` — never read real keys.

## Coverage

**Requirements:** None enforced. No `coverageThreshold`, no CI workflow under `.github/`, no `test` job.

**View Coverage:**
```bash
# After Vitest + @vitest/coverage-v8:
npx vitest run --coverage
```

When coverage is added, treat it as advisory. Priority surfaces (not line-count theater):

| Priority | Module | Why |
|----------|--------|-----|
| High | `src/lib/accountAccess.ts` | D-03 / D-04 / D-05 gating |
| High | `src/lib/security/index.ts` | Open-redirect, auth/db error mapping, ILIKE escape, rate limit |
| High | `src/schemas/auth.schema.ts` | Password/join-code rules |
| High | `src/config/navigation.ts` | Equipe item only for `empresa` |
| Medium | `src/schemas/patient.schema.ts`, `src/schemas/evaluation.schema.ts` | Form contracts |
| Medium | `src/lib/permissions.ts` | Bakery role flags (legacy pages) |
| Low | Pages, panels, Tailwind | Cover via E2E, not unit |

Do not chase coverage on `src/services/*.ts` until a Supabase mock (or test project) exists. Those files are glue over RLS.

## Test Types

**Unit Tests:**
- Not used. Introduce first for pure functions listed above.
- TDD-ready without a database: `normalizeJoinCode`, `canManageTeam`, `canWritePatient`, `isPendingTherapist`, `isRejectedAccount`, `accountTypeLabel`, `clinicNavigationItems`, `isSafeInternalPath`, `safeRedirectPath`, `mapAuthError`, `mapDbError`, `sanitizeText`, `escapeIlike`, `avatarColor`, `initialsFromName`, Zod schemas.
- GSD classification (`/gsd-add-tests`): these files are **TDD**. SQL, types, and CSS are **Skip**.

**Integration Tests:**
- Not used. A future service test would mock `supabase.from().select()` chain and assert `mapPatient` / `mapTeamMember` output.
- `AuthProvider` (`src/providers/AuthProvider.tsx`) is integration-shaped (session + profile + membership). Prefer E2E for login/pending/rejected; do not unit-test the `onAuthStateChange` deadlock comment by mocking timers.

**E2E Tests:**
- Not used. No Playwright/Cypress.
- When added, drive flows a real user hits:
  1. Login success / invalid credentials banner (`src/pages/auth/LoginPage.tsx`)
  2. Register as `fisioterapeuta` without 8-char join code shows Zod error (`src/schemas/auth.schema.ts`)
  3. Pending fisio lands on `/aguardando` (`src/components/auth/ProtectedRoute.tsx`)
  4. Empresa sees `/equipe`, copies join code (`src/pages/TeamPage.tsx`)
  5. Create patient from `PatientsPage` modal and land on `/pacientes/:id`
  6. Non-creator cannot submit cadastro when `canWrite` is false
- Point Playwright at `npm run dev`. Do not hit production Supabase. Use a dedicated project or skip tests when `VITE_SUPABASE_URL` is unset (`src/config/env.ts` already treats placeholder values as unconfigured and renders `SetupPage`).

## Common Patterns

**Async Testing:**
```typescript
import { expect, it } from 'vitest'
import { signInWithEmail } from '@/services/auth.service'

it('throws a mapped message on invalid credentials', async () => {
  await expect(signInWithEmail({ email: 'a@b.c', password: 'x' })).rejects.toThrow(
    'E-mail ou senha incorretos.',
  )
})
```

Only write this style after mocking `supabase.auth.signInWithPassword` to return `{ error: { message: 'Invalid login credentials' } }`. Unmocked, this test is forbidden (network + secrets).

**Error Testing:**
```typescript
import { describe, expect, it } from 'vitest'
import { mapAuthError, mapDbError, safeRedirectPath } from '@/lib/security'

describe('mapAuthError', () => {
  it('hides duplicate-email details', () => {
    expect(mapAuthError({ message: 'User already registered' })).toBe(
      'Não foi possível concluir o cadastro. Tente entrar ou use outro e-mail.',
    )
  })
})

describe('mapDbError', () => {
  it('maps RLS denial', () => {
    expect(mapDbError({ code: '42501' })).toBe('Você não tem permissão para esta ação.')
  })
})

describe('safeRedirectPath', () => {
  it('rejects open redirects and auth paths', () => {
    expect(safeRedirectPath('https://evil.test')).toBe('/painel')
    expect(safeRedirectPath('//evil.test')).toBe('/painel')
    expect(safeRedirectPath('/login')).toBe('/painel')
    expect(safeRedirectPath('/pacientes')).toBe('/pacientes')
  })
})
```

**Hook testing (when React Testing Library is added):**
- Wrap with `QueryClientProvider` using a fresh `QueryClient({ defaultOptions: { queries: { retry: false } } })`.
- Assert `onError` calls `toast(..., 'error')` by spying `src/stores/toast.store.ts` `toast`.
- Do not snapshot Tailwind class strings.

**SQL / RLS:**
- Automate nothing in Vitest. Record allow/deny matrices in phase `VERIFICATION.md` and run them in the Supabase SQL Editor against `supabase/03-account-types-team.sql`.

**Vitest config to add (do not create until the first test file exists):**
```typescript
// vitest.config.ts — share alias with vite.config.ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Use `environment: 'jsdom'` only for `.test.tsx` files (hooks/components). Pure `src/lib` and `src/schemas` tests stay on `node`. `checkRateLimit` needs `jsdom` or a `sessionStorage` stub.

---

*Testing analysis: 2026-09-14*
