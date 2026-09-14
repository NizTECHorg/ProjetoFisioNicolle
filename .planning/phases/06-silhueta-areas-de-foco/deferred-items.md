# Phase 06 deferred items

Logged during 06-01 execution. Do not treat as this plan's defects.

- `npm run lint` fails on pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (catch `err: any`). Same finding as Phase 05. Out of scope for 06-01 catalog and 06-03 toggle. Lint and typecheck of files those plans touched are green.
- ~~`getPatientById` maps `regionKey: ''` until Plan 06-03 SELECTs `region_key` and skips null keys.~~ Resolved in 06-03.
