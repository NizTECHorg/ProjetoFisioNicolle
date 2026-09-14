---
phase: 06-silhueta-areas-de-foco
plan: 04
subsystem: ui
tags: [react, svg, patient-ficha, focus-areas, canWrite, WCAG-1.4.13]

requires:
  - phase: 06-01
    provides: FOCUS_REGIONS paths/labels, listFocusRegionsByView, getFocusRegion, focusRegionPathAriaLabel, focusRegionListLabel
  - phase: 06-03
    provides: useTogglePatientFocusArea(patientId) mutate(regionKey)
provides:
  - PatientFocusAreasPanel frente/costas SVG with HOVER_OPEN_MS = 500 chip
  - Chip-only toggle; path is reveal-only
  - canWrite hide (no chip, no tabIndex, no hover preview)
  - BodyFocus stick figure and visible side list removed from PatientPage
affects:
  - REQ-18 ficha UAT (VALIDATION.md hover/touch/Escape/empresa)

tech-stack:
  added: []
  patterns:
    - Card body panel with page-owned chrome/title; hide write JSX when !canWrite
    - Fine pointer delayed chip via matchMedia hover+fine; coarse tap opens immediately
    - mutate(regionKey) only from HTML button, never from SVG path

key-files:
  created:
    - src/components/patients/PatientFocusAreasPanel.tsx
  modified:
    - src/pages/PatientPage.tsx

key-decisions:
  - "Chip is the only write control; path click never calls mutate (D-06)"
  - "HOVER_OPEN_MS = 500 for fine hover; coarse/touch and prefers-reduced-motion open immediately (D-05)"
  - "When !canWrite the chip is unmounted, paths omit tabIndex, cursor-default, no hover preview (D-10)"
  - "Coarse pointerleave does not close the chip so a finger-lift cannot dismiss before the second tap"

patterns-established:
  - "PatientFocusAreasPanel is card body only (mt-3); PatientPage keeps rounded-2xl title Áreas de foco"
  - "One pointer group per figure (SVG + chip) so travel onto the abinha does not fire leave"
  - "Clinic tokens fill-accent-soft/40, fill-accent/20|/35|/45, stroke-forest/accent — no navy/orange, no Jotform widget"

requirements-completed: [REQ-18]

duration: 6min
completed: 2026-09-14
---

# Phase 6 Plan 04: PatientFocusAreasPanel Summary

**Resumo Áreas de foco is a clinic-token frente/costas SVG map; 500ms hover opens Marcar/Desmarcar; only the chip writes; BodyFocus is gone**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-14T20:58:15Z
- **Completed:** 2026-09-14T21:04:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `PatientFocusAreasPanel` renders frente and costas silhouettes, delayed abinha (`HOVER_OPEN_MS = 500`), empty copy **Sem áreas registradas.** plus the canWrite body sentence, and an sr-only marked list
- Chip click calls `useTogglePatientFocusArea(patientId).mutate(openKey)`; path click never writes
- `!canWrite` unmounts the chip, omits path `tabIndex`, uses `cursor-default`, and skips hover preview while saved fills still show
- `PatientPage` keeps the Áreas de foco card chrome and mounts the panel with existing `canWrite`; `function BodyFocus` and the visible side list are deleted

## Task Commits

Each task was committed atomically:

1. **Task 1: Build PatientFocusAreasPanel SVG, chip, and canWrite hide** - `6a01ec3` (feat)
2. **Task 2: Mount panel on PatientPage and delete BodyFocus** - `1c517fb` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/patients/PatientFocusAreasPanel.tsx` — SVG map, delayed chip, canWrite hide, empty copy, sr-only list
- `src/pages/PatientPage.tsx` — import and mount panel; delete BodyFocus and the visible `ul`

## Decisions Made

- Chip is the only write control; path `onClick`/`onPointerDown` never call `toggle.mutate` (D-06, T-06-01)
- Fine hover waits `HOVER_OPEN_MS = 500`; `prefers-reduced-motion: reduce` and coarse/touch open immediately (D-05)
- When `!canWrite` the chip is unmounted (not disabled-looking), paths omit `tabIndex`, cursor is default, no hover preview (D-10)
- Coarse `pointerleave` does not close the chip — finger-lift on touch would otherwise dismiss before the second tap; tap-outside and Escape still close

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Timeout ref type vs `window.setTimeout`**
- **Found during:** Task 1 (panel)
- **Issue:** `ReturnType<typeof window.setTimeout>` resolved to Node `Timeout` while `window.setTimeout` returns `number`
- **Fix:** Typed `timerRef` as `number | null`
- **Files modified:** `src/components/patients/PatientFocusAreasPanel.tsx`
- **Verification:** `npm run typecheck` exits 0
- **Committed in:** `6a01ec3` (Task 1)

**2. [Rule 2 - Missing Critical] Coarse pointerleave would close the chip on finger-lift**
- **Found during:** Task 1 (hover/chip)
- **Issue:** Group `onPointerLeave` → `closeChip()` would fire when a finger lifts on touch, so the user could never tap the abinha
- **Fix:** Close on pointerleave only when `(hover: hover) and (pointer: fine)` matches; coarse/touch still close via tap-outside and Escape
- **Files modified:** `src/components/patients/PatientFocusAreasPanel.tsx`
- **Verification:** coarse path uses `delayOpenMs() === 0` to open immediately; leave is gated on fine hover
- **Committed in:** `6a01ec3` (Task 1)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both required for typecheck and touch (D-05/D-06). No scope creep.

## Issues Encountered

- Project-wide `npm run lint` still fails on pre-existing `err: any` in `src/services/aiPhysicalEvaluation.service.ts` (same as Phase 05 / 06-01 / 06-03). Lint and typecheck of files this plan touched are green. Logged in `deferred-items.md`.
- Vite HMR accepted `PatientPage.tsx` without overlay errors. Curl to `127.0.0.1:5173` from the executor sandbox could not reach the already-running dev server; no second `npm run dev` was started.

## Auth Gates

None.

## Known Stubs

None. Catalog paths and `useTogglePatientFocusArea` are wired; empty copy is the UI-SPEC empty state, not a placeholder.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 implementation plans 01–04 are done; REQ-18 is in the ficha Resumo card
- Manual UAT remains: hover 500ms, path-click does not write, touch, Escape, empty copy, empresa read-only (VALIDATION.md)
- Do not restore BodyFocus or a visible side list at `xl`

## Verification

- `export function PatientFocusAreasPanel` and `HOVER_OPEN_MS = 500`
- Copy: Marcar / Desmarcar / Sem áreas registradas. / canWrite body sentence / Frente / Costas
- `useTogglePatientFocusArea`; `pointerEvents`; `sr-only`; no `dangerouslySetInnerHTML` / `ConfirmDialog` / path `title=`
- Chip JSX gated on `canWrite`; `toggle.mutate` only from chip `onClick`
- `function BodyFocus` absent; `PatientFocusAreasPanel` mounted with `canWrite={canWrite}`; title Áreas de foco kept
- `npx eslint src/components/patients/PatientFocusAreasPanel.tsx src/pages/PatientPage.tsx` and `npm run typecheck` exit 0

## Self-Check: PASSED

- FOUND: `.planning/phases/06-silhueta-areas-de-foco/06-04-SUMMARY.md`
- FOUND: `src/components/patients/PatientFocusAreasPanel.tsx`
- FOUND: `src/pages/PatientPage.tsx`
- FOUND: `6a01ec3`
- FOUND: `1c517fb`

---
*Phase: 06-silhueta-areas-de-foco*
*Completed: 2026-09-14*
