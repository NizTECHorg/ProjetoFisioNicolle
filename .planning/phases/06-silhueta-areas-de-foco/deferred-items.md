# Phase 06 deferred items

Logged during 06-01 execution. Do not treat as this plan's defects.

- `npm run lint` fails on pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (catch `err: any`). Same finding as Phase 05. Out of scope for 06-01 catalog. Lint and typecheck of `src/lib/focusRegions.ts`, `src/types/patient.ts`, and `src/schemas/patient.schema.ts` are green.
- `getPatientById` maps `regionKey: ''` until Plan 06-03 SELECTs `region_key` and skips null keys.
