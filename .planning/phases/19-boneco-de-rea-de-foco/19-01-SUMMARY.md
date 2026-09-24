---
phase: 19-boneco-de-rea-de-foco
plan: 01
subsystem: ui
tags: [svg, focus-regions, pdf, edge-function, body-map]

requires:
  - phase: 06-silhueta-areas-de-foco
    provides: Fixed silhouette catalog, shared-label aria, and z.enum(FOCUS_REGION_KEYS)
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: patient-ai-summary Set that the hosted function deploys from
provides:
  - 42-key focus catalog with arm, forearm, hand, shin, foot, calf, and ankle
  - Exhaustive BODY_MAP_CENTROIDS for every FocusRegionKey
  - Phase 13 AI catalog mirrored to the same 42 keys
affects:
  - 19-02 SQL delete of the eight retired keys
  - 19-03 scroll guard on the focus card and evaluation map

tech-stack:
  added: []
  patterns:
    - New limb keys never reuse front.arm_* or *.leg_*
    - Back *_l paths occupy the x-band of the matching front *_r path
    - Distal palm, hand, foot, and ankle paths are at least 28 viewBox units tall

key-files:
  created: []
  modified:
    - src/lib/focusRegions.ts
    - src/services/patientAiPdf.service.ts
    - .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts

key-decisions:
  - "Retired the eight whole-limb keys; new parts use upper_arm, forearm, palm, hand, shin, foot, calf, and ankle"
  - "Palm, hand, foot, and ankle are 28 viewBox units tall; shin and calf are only the y=206–212 band under the existing knee"
  - "Phase 13 patient-ai-summary Set mirrors the 42 keys; deploy stays on the Dashboard and the phase 11 twin is unchanged"
  - "Centroids of unchanged keys stay the current literals, including back.shoulder_l at x 96"

patterns-established:
  - "Mirror axis x=70: a back *_l path uses the front *_r x-band, not a copy of front *_l"
  - "Elbow and the front ankle gap are shared edges, not regions"

requirements-completed: []  # REQ-30 is phase-level; plans 19-02 and 19-03 still own the SQL delete and the scroll guard

duration: 4min
completed: 2026-09-24
---

# Phase 19 Plan 01: Catálogo de 42 regiões Summary

**42-key silhouette catalog that splits each arm into Braço, Antebraço, and one hand, and splits below the knee into Canela/Pé in front and Panturrilha/Tornozelo in back, with matching PDF centroids and the phase 13 AI set**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-24T16:21:03Z
- **Completed:** 2026-09-24T16:25:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced the eight whole-arm and whole-leg keys with 20 new regions; trunk, shoulder, thigh, and knee paths and sort orders stay
- Pointed every new `BODY_MAP_CENTROIDS` entry inside its path so `Record<FocusRegionKey, …>` typechecks
- Mirrored the same 42 strings into the phase 13 `patient-ai-summary` Set without deploying it

## Task Commits

Each task was committed atomically:

1. **Task 1: Catálogo de 42 regiões e centroids do PDF** - `a8cbcf3` (feat)
2. **Task 2: Espelhar as 42 keys na função patient-ai-summary** - `b8c3347` (feat)

**Plan metadata:** docs commit that adds this summary

## Files Created/Modified
- `src/lib/focusRegions.ts` - 42-key catalog, new limb paths, labels, and sortOrder 30–49
- `src/services/patientAiPdf.service.ts` - centroids for the 20 new keys; unchanged keys keep their literals
- `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` - Set of the same 42 keys
- `.planning/phases/19-boneco-de-rea-de-foco/19-USER-SETUP.md` - Dashboard publish step for patient-ai-summary

## Decisions Made
- The eight retired keys (`front.arm_*`, `back.arm_*`, `front.leg_*`, `back.leg_*`) are gone and not reused. Braço is `upper_arm`, the front hand is `palm`, the back hand is `hand`, and below the knee the front is `shin` then `foot` while the back is `calf` then `ankle`.
- Palm, hand, foot, and ankle paths are exactly 28 viewBox units tall and never pass y=240. Shin and calf occupy only y=206–212, sharing an edge with the distal part. The elbow is that shared edge, not a region.
- Unchanged centroids were copied as-is, including `back.shoulder_l` at x 96. New centroids sit inside the new paths.
- The phase 11 function file still contains `front.arm_l`. Publishing the phase 13 source is operator work.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
The working tree already had an unrelated one-line indent change in `wrapLines`. That indent was restored before the centroid edit and was not part of the task commit. `src/components/layout/AppShell.tsx` stayed unstaged.

## User Setup Required

**External services require manual configuration.** See [19-USER-SETUP.md](./19-USER-SETUP.md) for:
- Publishing `patient-ai-summary` from the phase 13 source in the Supabase Dashboard
- Leaving the phase 11 twin unpublished
- Not using `supabase db push`

## Next Phase Readiness
Ready for 19-02 (DELETE of the eight retired keys in the SQL Editor). The scroll guard is 19-03. REQ-30 stays open until those plans land.

## Self-Check: PASSED

- FOUND: src/lib/focusRegions.ts
- FOUND: src/services/patientAiPdf.service.ts
- FOUND: .planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
- FOUND: a8cbcf3
- FOUND: b8c3347

---
*Phase: 19-boneco-de-rea-de-foco*
*Completed: 2026-09-24*
