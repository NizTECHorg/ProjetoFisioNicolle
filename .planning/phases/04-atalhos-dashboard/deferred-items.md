# Deferred items — Phase 04-atalhos-dashboard

Discovered during 04-02 execution. Out of scope for this plan (pre-existing, unrelated files).

- `npm run lint` fails on `src/services/aiPhysicalEvaluation.service.ts` (`@typescript-eslint/no-explicit-any` at the Gemini PDF analysis call). Introduced in `e62f767`, not touched by 04-02.
- Unused `eslint-disable` warning in `.cursor/get-shit-done/bin/lib/state.cjs`.
