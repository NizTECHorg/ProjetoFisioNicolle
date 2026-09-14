---
phase: 06-silhueta-areas-de-foco
plan: 01
subsystem: ui
tags: [svg, zod, typescript, focus-regions, catalog]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: patient_focus_areas RLS via can_read_patient / can_write_patient; PatientFocusArea DTO
provides:
  - FOCUS_REGION_KEYS 30-key UI-SPEC tuple
  - FOCUS_REGIONS with Portuguese labels, view, sortOrder, closed SVG paths
  - getFocusRegion, listFocusRegionsByView, focusRegionPathAriaLabel, focusRegionListLabel
  - PatientFocusArea.regionKey
  - focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS)
affects:
  - 06-02 SQL region_key
  - 06-03 togglePatientFocusArea and SELECT skip
  - 06-04 PatientFocusAreasPanel SVG + chip

tech-stack:
  added: []
  patterns:
    - Catalog lives in src/lib/focusRegions.ts; Zod enum imports the tuple, never duplicates keys
    - Path aria-label appends (frente)/(costas) only when the Portuguese label exists on both views
    - List label always appends (frente)/(costas)
    - _l/_r are the patient's anatomical left/right (front view is mirrored)

key-files:
  created:
    - src/lib/focusRegions.ts
  modified:
    - src/types/patient.ts
    - src/schemas/patient.schema.ts
    - src/services/patients.service.ts

key-decisions:
  - "FOCUS_REGION_KEYS is the locked UI-SPEC 30-key tuple; RESEARCH 38-key draft unused (D-08)"
  - "focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS); keys are not duplicated in patient.schema.ts"
  - "_l/_r map to the patient's left/right: front view mirrors, back view does not"

patterns-established:
  - "Named exports, single quotes, no semicolons, 2-space indent; no React in focusRegions.ts"
  - "Closed SVG paths in viewBox 0 0 140 240 with ~4px gaps; arms include mão/punho; legs include tornozelo/pé; back.neck includes nuca"
  - "getFocusRegion uses a Map; never assume find under noUncheckedIndexedAccess"

requirements-completed: [REQ-18]

duration: 7min
completed: 2026-09-14
---

# Phase 6 Plan 01: Contratos catálogo Summary

**Locked UI-SPEC 30-key focus catalog with Portuguese labels, genderless SVG paths, PatientFocusArea.regionKey, and z.enum(FOCUS_REGION_KEYS)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-14T20:35:23Z
- **Completed:** 2026-09-14T20:42:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `src/lib/focusRegions.ts` exports the 30 UI-SPEC keys (frente 15 + costas 15), labels, views, sortOrder 0–29, and closed SVG paths
- Helpers: `getFocusRegion`, `listFocusRegionsByView`, `focusRegionPathAriaLabel` (view suffix only for shared labels), `focusRegionListLabel` (always suffix)
- `PatientFocusArea.regionKey` exists so later SELECT can skip null-key leftovers
- `focusRegionKeySchema` is `z.enum(FOCUS_REGION_KEYS)` — the only write-time key validator in Zod

## Task Commits

Each task was committed atomically:

1. **Task 1: Write focusRegions catalog and PatientFocusArea.regionKey** - `6d19148` (feat)
2. **Task 2: Export focusRegionKeySchema from the catalog tuple** - `f5e0fed` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/lib/focusRegions.ts` — 30-key catalog, SVG paths, aria-label helpers; no React
- `src/types/patient.ts` — `PatientFocusArea.regionKey: string`
- `src/schemas/patient.schema.ts` — `focusRegionKeySchema` from `FOCUS_REGION_KEYS`
- `src/services/patients.service.ts` — mapper includes `regionKey` so typecheck passes (placeholder until 06-03)

## Decisions Made

- Honor UI-SPEC 30 keys over the RESEARCH 38-key draft; `front.hand_*`, `front.foot_*`, `back.hand_*`, `back.foot_*`, and `back.head` are absent
- Anatomical left/right: on the front figure, patient's left is the viewer's right; on the back figure, patient's left is the viewer's left
- Zod enum imports the catalog tuple instead of restating the 30 strings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mapper needs regionKey for typecheck**
- **Found during:** Task 1 (Write focusRegions catalog and PatientFocusArea.regionKey)
- **Issue:** Adding required `regionKey: string` to `PatientFocusArea` broke `mapPatient` in `patients.service.ts` (object literal missing the field)
- **Fix:** Map `regionKey: ''` until Plan 06-03 SELECTs `region_key` and skips null keys
- **Files modified:** `src/services/patients.service.ts`
- **Verification:** `npm run typecheck` exits 0
- **Committed in:** `6d19148` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for typecheck. No scope creep. Plan 06-03 owns the real SELECT.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| `src/services/patients.service.ts` | 324 | `regionKey: ''` | Column not selected yet; Plan 06-03 wires `region_key` and skips nulls |

## Issues Encountered

- `npm run lint` still fails on pre-existing `err: any` in `src/services/aiPhysicalEvaluation.service.ts` (same as Phase 05). Lint of files this plan touched is green. Logged in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 06-02 can ALTER `region_key` against this catalog's `^(front|back).[a-z0-9_]+$` shape
- Plan 06-03 can `import { getFocusRegion } from '@/lib/focusRegions'` and `import { focusRegionKeySchema } from '@/schemas/patient.schema'`
- Plan 06-04 can render `FocusRegion.path` and aria-labels without inventing keys
- REQ-18 remains open until the panel marks/unmarks on the ficha

---
*Phase: 06-silhueta-areas-de-foco*
*Completed: 2026-09-14*

## Self-Check: PASSED
