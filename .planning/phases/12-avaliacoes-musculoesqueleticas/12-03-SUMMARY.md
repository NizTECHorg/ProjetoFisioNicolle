---
phase: 12-avaliacoes-musculoesqueleticas
plan: 03
subsystem: ui
tags: [avaliacoes, ficha, patient-tab, dashboard-shortcut, body-map, rhf, zod]

# Dependency graph
requires:
  - phase: 12-avaliacoes-musculoesqueleticas/02
    provides: evaluations service/hooks with ficha jsonb CRUD
provides:
  - PatientTab avaliacoes + deep-link nova=1 openCreateOnMount
  - Dashboard Nova avaliação navigates to ficha (no inline eval modal)
  - Resumo IA detached from evaluation CRUD (D-01/D-06)
  - Multi-page ficha form 01–04 with FLUXO block chrome + BodyMapPicker
affects: [12-04, wave-3-pdf, resumo-ia-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tab slug avaliacoes distinct from legacy avaliacao→Resumo IA
    - patientFichaPath(aba, { nova }) for dashboard deep-link
    - Page-segmented EvaluationFichaForm + local BodyMapPicker marks in ficha only
    - Fail-closed canWrite=false on PatientEvaluationPanel

key-files:
  created:
    - src/components/patients/evaluation/BodyMapPicker.tsx
    - src/components/patients/evaluation/EvaluationFichaForm.tsx
    - src/components/patients/evaluation/EvaluationPage01.tsx
    - src/components/patients/evaluation/EvaluationPage02.tsx
    - src/components/patients/evaluation/EvaluationPage03.tsx
    - src/components/patients/evaluation/EvaluationPage04.tsx
    - src/components/patients/evaluation/EvaluationFichaDetail.tsx
    - src/components/patients/evaluation/fichaFormPrimitives.tsx
    - src/lib/evaluationFichaContent.ts
  modified:
    - src/components/patients/PatientProfileHeader.tsx
    - src/pages/PatientPage.tsx
    - src/lib/dashboardShortcut.ts
    - src/components/patients/DashboardClinicalShortcut.tsx
    - src/components/patients/PatientResumoIaPanel.tsx
    - src/components/patients/PatientEvaluationPanel.tsx
    - src/components/patients/PatientEvaluationEditorForm.tsx

key-decisions:
  - "Avaliações tab after Evoluções; legacy aba=avaliacao still mounts Resumo IA only"
  - "Dashboard avaliacao picker navigates immediately — no editor Modal step"
  - "Body map marks persist in ficha.sintomas.mapa only — no patient_focus_areas sync"
  - "Completa = any clinical ficha leaf filled; otherwise Parcial"
  - "Panel canWrite defaults false (fail-closed)"

patterns-established:
  - "FichaBlock letter badge + border-line + accent header (FLUXO, not paper serif)"
  - "EvaluationFichaForm page tabs 01–04; only active page mounted"
  - "openCreateOnMount + onOpenCreateConsumed clears nova via replace"

requirements-completed: [REQ-24, REQ-24.1, REQ-24.3, REQ-24.4, REQ-24.6]

# Metrics
duration: 9min
completed: 2026-09-20
---

# Phase 12 Plan 03: Avaliações Tab + Rich Ficha Form Summary

**Dedicated Avaliações ficha tab with dashboard deep-link create and multi-block pages 01–04 form, fully detached from Resumo IA**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-09-20T19:26:33Z
- **Completed:** 2026-09-20T19:35:38Z
- **Tasks:** 2/2
- **Files modified:** 16

## Accomplishments
- Added tab **Avaliações** (`avaliacoes`) after Evoluções; mounts `PatientEvaluationPanel` with fail-closed `canWrite`
- Dashboard **Nova avaliação** navigates to `?aba=avaliacoes&nova=1`; create opens once then query cleared
- Removed Avaliação estruturada embed from `PatientResumoIaPanel` (D-01/D-06)
- Replaced flat editor with page-segmented ficha covering RESEARCH blocks A–H + BodyMapPicker (local marks only)
- Prefill identification from patient on create; Salvar enabled when date valid (partial save)

## Task Commits

Each task was committed atomically:

1. **Task 1: Tab Avaliações + dashboard navigate + detach Resumo IA** - `dfbe1cf` (feat)
2. **Task 2: Rich multi-block form pages 01–04 + body map** - `507ff5b` (feat)

**Plan metadata:** _(docs commit for SUMMARY)_

## Files Created/Modified
- `src/components/patients/PatientProfileHeader.tsx` — PatientTab `avaliacoes` + visible Avaliações tab
- `src/pages/PatientPage.tsx` — aba routing, nova=1 → openCreateOnMount, clear via replace
- `src/lib/dashboardShortcut.ts` — `patientFichaPath(..., { nova })` + `avaliacoes`
- `src/components/patients/DashboardClinicalShortcut.tsx` — navigate for kind avaliacao; evolucao modal kept
- `src/components/patients/PatientResumoIaPanel.tsx` — composer + reports only
- `src/components/patients/PatientEvaluationPanel.tsx` — list/detail + openCreateOnMount + canWrite wall
- `src/components/patients/PatientEvaluationEditorForm.tsx` — RHF + EvaluationFichaForm + patient prefill
- `src/components/patients/evaluation/*` — pages 01–04, BodyMapPicker, block chrome, detail view
- `src/lib/evaluationFichaContent.ts` — Parcial/Completa heuristic

## Decisions Made
- Kept `avaliacao` as legacy Resumo IA alias; never reused for clinical tab (Pitfall 1)
- Body map uses FOCUS_REGIONS SVG locally; never calls `useTogglePatientFocusArea` (T-12-04b)
- Identification prefill is an editable copy inside `ficha` for that evaluation date
- Completeness: any filled clinical leaf → Completa; date-only → Parcial

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Fail-closed canWrite default**
- **Found during:** Task 1
- **Issue:** Panel previously defaulted `canWrite = true`, violating T-12-04 / REQ-24.6
- **Fix:** Default `canWrite = false`; only show write CTAs when true
- **Files modified:** `PatientEvaluationPanel.tsx`
- **Verification:** typecheck
- **Committed in:** `dfbe1cf`

**2. [Rule 3 - Blocking issue] Input label required for mobility/força rows**
- **Found during:** Task 2
- **Issue:** `Input` requires `label: string`; optional labels broke typecheck
- **Fix:** Numbered labels per row (`Movimento 1`, …)
- **Files modified:** `EvaluationPage04.tsx`
- **Verification:** `npm run typecheck`
- **Committed in:** `507ff5b`

---

**Total deviations:** 2 auto-fixed (Rule 2 ×1, Rule 3 ×1)
**Impact on plan:** Correctness/security fixes only; no scope creep.

## Issues Encountered
None beyond the auto-fixes above.

## User Setup Required
None — UI only; relies on Phase 12-01 SQL already applied for `ficha` column.

## Known Stubs
None — form fields bind to `ficha` via RHF; submit persists through existing create/update hooks.

## Threat Flags
None — write CTAs gated by canWrite; body map does not touch focus-area APIs; no new network endpoints.

## Next Phase Readiness
Ready for 12-04 (PDF export of saved avaliação ficha from Resumo IA).

## Self-Check: PASSED
- FOUND: `src/components/patients/evaluation/BodyMapPicker.tsx`
- FOUND: `src/components/patients/evaluation/EvaluationFichaForm.tsx`
- FOUND: `dfbe1cf`
- FOUND: `507ff5b`

---
*Phase: 12-avaliacoes-musculoesqueleticas*
*Completed: 2026-09-20*
