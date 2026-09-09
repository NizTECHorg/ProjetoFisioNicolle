# Deferred items (Phase 03)

## Pre-existing lint (out of scope for 03-04 / 03-07)

`npm run lint` fails on `src/services/aiPhysicalEvaluation.service.ts` (`@typescript-eslint/no-explicit-any` at line 123). Introduced in `e62f767`, unrelated to login gates and empresa consulta UI. Plan 03-07 files lint clean; `npm run typecheck` exits 0.
