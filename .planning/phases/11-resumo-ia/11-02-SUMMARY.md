---
phase: 11-resumo-ia
plan: 02
subsystem: api
tags: [resumo-ia, edge-function, gemini, supabase-functions, patient-ai-summary, typescript]

# Dependency graph
requires:
  - phase: 11-resumo-ia
    provides: PatientAi contracts, mapPatientAiError, updatePatient aiSummary write (11-01)
  - phase: 08-integracao-google-agenda
    provides: Edge Function requireUser / CORS / invoke + error-payload patterns
provides:
  - Deno Edge Function patient-ai-summary (Gemini proxy + RLS context pack)
  - generatePatientAiSummary + applyAiFocusRegionKeys (SPA invoke → ai_summary + additive focus)
  - Hosted deploy with GEMINI_API_KEY Function secret (human-confirmed)
affects: [11-04, wave-4-resumo-ia-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Self-contained EF (no _shared); Gemini via fetch + generativelanguage.googleapis.com
    - gemini-2.5-flash with 404 fallbacks to gemini-2.0-flash / gemini-flash-latest
    - Client owns ai_summary persistence; EF never writes with service_role
    - Additive focus INSERT only (ignore 23505; never DELETE unmarked)

key-files:
  created:
    - supabase/functions/patient-ai-summary/index.ts
    - .planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts
    - src/services/patientAi.service.ts
  modified: []

key-decisions:
  - "D-06: GEMINI_API_KEY Deno.env Function secret only — never VITE_GEMINI on REQ-23 path"
  - "D-03: max clinical context under user JWT RLS; userHint untrusted"
  - "D-04: updatePatient({ aiSummary }) after successful invoke"
  - "Pitfall 7: applyAiFocusRegionKeys additive-only"
  - "Human deployed patient-ai-summary + set GEMINI_API_KEY; typed approved"

patterns-established:
  - "EF fail-closed: 401 unauthorized, 400 invalid_body, 500 misconfigured, 503 ai_unavailable"
  - "mapPatientAiError on invoke failures; Portuguese toasts only"
  - "Twin EF source under phase functions/ + supabase/functions/"

requirements-completed: [REQ-23, REQ-23.3, REQ-23.6]

# Metrics
duration: ~25min
completed: 2026-09-19
---

# Phase 11 Plan 02: patient-ai-summary Edge Function + SPA Invoke Summary

**Gemini-backed clinical summary generation via JWT-gated Edge Function with server-side `GEMINI_API_KEY`, client persistence to `ai_summary`, and additive focus region marks**

## Performance

- **Duration:** ~25 min (Tasks 1–2 automated) + human EF deploy/secret
- **Started:** 2026-09-19T14:33:00Z
- **Completed:** 2026-09-19T14:45:00Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments
- Authored self-contained `patient-ai-summary` EF: requireUser, RLS context pack (omit admin PII), Gemini JSON contract, model fallbacks
- Shipped `generatePatientAiSummary` + `applyAiFocusRegionKeys` — invoke → map errors → `updatePatient({ aiSummary })` → additive focus INSERT
- Human deployed function and set `GEMINI_API_KEY` Function secret (not VITE_*) — generate path unblocked for Wave 4

## Task Commits

Each task was committed atomically:

1. **Task 1: Edge Function patient-ai-summary** - `38bbb0a` (feat)
2. **Task 2: patientAi.service invoke + ai_summary + additive focus** - `07333ce` (feat)
3. **Task 3: Deploy EF + set GEMINI_API_KEY [BLOCKING]** - human-action approved (no code commit; deploy/secret out-of-band)

**Plan metadata:** _(this docs commit)_

## Auth Gates / Human Actions

| Task | Type | Outcome |
|------|------|---------|
| 3 | checkpoint:human-action | Human typed **approved** after Dashboard deploy of `patient-ai-summary` + `GEMINI_API_KEY` Function secret set. No key pasted; no `VITE_GEMINI_*` required for REQ-23 generate. |

## Files Created/Modified
- `supabase/functions/patient-ai-summary/index.ts` — Gemini proxy + context pack + JSON `{ summary, focusRegionKeys? }`
- `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts` — phase twin of EF source
- `src/services/patientAi.service.ts` — invoke, error map, aiSummary write, additive focus apply

## Decisions Made
- Followed plan locks: D-03 context pack, D-04 client write, D-06 secret-only Gemini, Pitfall 7 additive focus
- No `@google/genai` import; fetch to Generative Language API only
- Did not migrate `aiPhysicalEvaluation.service` (D-07 deferred)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — Task 3 blocked on human deploy/secret as planned; resumed after approval.

## User Setup Required
**External services require manual configuration (completed for this plan).**
- Supabase Dashboard → Edge Functions → `patient-ai-summary` deployed
- Function secret `GEMINI_API_KEY` set (rotated preferred; never commit)
- Generate path must not use `VITE_GEMINI_API_KEY`

## Next Phase Readiness
- Wave 2 generate backend ready for Wave 4 UI composer
- Wave 3 PDF/storage already complete (`11-03-SUMMARY.md`)
- Smoke remaining at UAT: unauthenticated → 401; writer JWT → summary or clear `ai_unavailable`/`misconfigured`

## Self-Check: PASSED
- FOUND: `supabase/functions/patient-ai-summary/index.ts`, `src/services/patientAi.service.ts`
- FOUND commits: `38bbb0a`, `07333ce`
- FOUND: `generatePatientAiSummary`, `applyAiFocusRegionKeys`, invoke target `patient-ai-summary`
- Task 3: human-action approved (EF deploy + GEMINI_API_KEY confirmed by user)

---
*Phase: 11-resumo-ia*
*Completed: 2026-09-19*
