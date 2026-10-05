# Deferred items — phase 25

## Pre-existing lint (plan 02)

`npm run lint` still exits 1 on `src/services/modules.service.ts` (`adminUpdateProfile`: unused `_userId`, `_role`, `_isActive`). That stub is from commit `957bd15`, before this phase. Two warnings also remain in `.cursor/get-shit-done/bin/lib/state.cjs` and `src/components/patients/AttendanceCounts.tsx`.

Files this plan touched lint clean. Not fixed here: the function is a security stub outside the plan.
