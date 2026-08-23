# Testing Patterns

**Analysis Date:** 2026-08-23

## Test Framework

**Runner:**
- Not detected — no Vitest, Jest, Playwright, Cypress, or Testing Library in `package.json`
- No `*.test.*` / `*.spec.*` files under the repo (excluding `node_modules`)

**Assertion Library:**
- Not applicable

**Run Commands:**
```bash
npm run typecheck   # tsc --noEmit (static check only)
npm run lint        # ESLint over **/*.{ts,tsx}
npm run build       # typecheck + Vite production build
```

There is no `npm test` / `npm run test` script. Until a runner is added, treat **typecheck + lint + manual UAT** as the quality gate.

## Test File Organization

**Location:**
- Not established — no co-located or `__tests__` directories

**Naming:**
- Not established

**Recommended structure (when introducing tests — align with Vite/React stack):**
```
src/
  lib/security/
    index.ts
    index.test.ts          # unit: sanitize, redirect, mapAuthError
  schemas/
    patient.schema.ts
    patient.schema.test.ts # unit: Zod edge cases
  services/
    patients.service.ts    # integration/mock Supabase later
```

Prefer co-located `*.test.ts` / `*.test.tsx` next to the module under test. Keep E2E (if added) under `e2e/` at repo root.

## Test Structure

**Suite Organization:**
- Not detected in codebase

**Suggested pattern (Vitest + Testing Library, matching project conventions):**
```typescript
import { describe, expect, it } from 'vitest'
import { sanitizeEmail, safeRedirectPath, mapAuthError } from '@/lib/security'

describe('safeRedirectPath', () => {
  it('rejects open redirects', () => {
    expect(safeRedirectPath('https://evil.example')).toBe('/painel')
    expect(safeRedirectPath('//evil.example')).toBe('/painel')
  })

  it('allows internal app paths', () => {
    expect(safeRedirectPath('/pacientes')).toBe('/pacientes')
  })
})
```

**Patterns:**
- Setup: Not detected
- Teardown: Not detected
- Assertion: Not detected

## Mocking

**Framework:** Not detected

**Patterns:**
```typescript
// Not established. When adding tests, mock at the boundary:
// - @/lib/supabase/client (Supabase client)
// - toast store side effects for mutation hooks
// Prefer testing pure helpers and Zod schemas without mocks first.
```

**What to Mock:**
- Supabase client network I/O (`supabase.from`, `supabase.auth`)
- `window`/storage for rate-limit helpers in `src/lib/security/index.ts` (uses `localStorage` key `fisio.auth.rate`)
- Toast push if asserting hook `onSuccess`/`onError` behavior

**What NOT to Mock:**
- Zod schemas (`src/schemas/*.schema.ts`) — exercise real validation
- Pure mappers/formatters once extracted (dates, `emptyToNull`, code generation)
- `mapAuthError` / `mapDbError` / `sanitizeText` / `isSafeInternalPath` — high value unit targets

## Fixtures and Factories

**Test Data:**
- Not detected

**Suggested factories (match domain types in `src/types/patient.ts`):**
```typescript
import type { PatientAlert } from '@/types/patient'

export function makeAlert(overrides: Partial<PatientAlert> = {}): PatientAlert {
  return {
    id: 'alert-1',
    message: 'Alerta de teste',
    tone: 'warning',
    createdAt: '2026-08-23T12:00:00.000Z',
    createdById: null,
    createdByName: null,
    ...overrides,
  }
}
```

**Location:**
- Prefer `src/test/factories/` or co-located `*.fixtures.ts` when introduced
- Do not put secrets or real clinic PII in fixtures

## Coverage

**Requirements:** None enforced (no coverage tooling or CI coverage thresholds)

**View Coverage:**
```bash
# Not available until a test runner with coverage is configured
# Example once Vitest is added:
# npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Not used
- Highest-priority first targets if added:
  - `src/lib/security/index.ts` (sanitize, redirect safety, error mapping, rate limit)
  - `src/schemas/auth.schema.ts`, `src/schemas/patient.schema.ts` (validation messages, optional fields)
  - Pure helpers inside services if extracted (date/age/code helpers in `patients.service.ts`)

**Integration Tests:**
- Not used
- Natural seam: service functions against mocked Supabase responses (row → camelCase domain mapping)

**E2E Tests:**
- Not used
- Manual flows currently cover login/register, patients CRUD/alerts, calendar, board (Kanban)

**Component / Hook Tests:**
- Not used
- Candidates: form submit error paths (`LoginPage`), mutation `onError` toast wiring (`usePatients`)

## Common Patterns

**Async Testing:**
```typescript
// Not established. Prefer async/await + expect(...).rejects for service throws:
await expect(signInWithEmail(invalid)).rejects.toThrow(/E-mail ou senha/i)
```

**Error Testing:**
```typescript
// Align assertions with Portuguese user-facing messages from mapAuthError / mapDbError / toast copy
expect(mapAuthError({ message: 'Invalid login credentials' })).toBe(
  'E-mail ou senha incorretos.',
)
```

## Current Quality Substitutes

Until automated tests exist, the project relies on:

| Gate | Command / Mechanism | Scope |
|------|---------------------|--------|
| Static types | `npm run typecheck` | `src/**` via `tsconfig.json` |
| Lint | `npm run lint` | ESLint flat config |
| Build | `npm run build` | `tsc --noEmit` + Vite |
| Runtime defaults | `QueryClient` in `src/main.tsx` | staleTime / retry policy |
| Security helpers | `src/lib/security/index.ts` | Auth rate limit, redirect, sanitize |
| Schema validation | Zod + RHF | Forms and service re-parse (auth) |

**CI Pipeline:** Not detected (no `.github/workflows`)

## Guidance for New Work

1. Do not claim coverage exists — document new tests when a runner is introduced
2. Prefer Vitest (Vite-native) over Jest for this stack
3. First tests should lock **security + schema** behavior, not large page snapshots
4. Keep service tests focused on mapping and error throwing; leave RLS verification to Supabase/SQL reviews
5. Match existing Portuguese assertion strings so refactors to `mapAuthError` / schemas break loudly

---

*Testing analysis: 2026-08-23*
