---
phase: 14-pdf-ficha-visual-polish
plan: 01
subsystem: ui
tags: [pdf-lib, TimesRomanBold, ficha, callout, checkbox-grid]

requires:
  - phase: 13-pdf-export-avaliacao-evolucao
    provides: patientAiPdf.service.ts ficha chrome, selective field gates, drawOptionalBullets/drawCheckboxRow
provides:
  - TimesRomanBold chapter banners with diamond rule
  - Slim ficha header (no heavy accentSoft band)
  - badgeColorForLetter navy/sage only; Triagem danger via opts.danger
  - drawCalloutBanner wired for Triagem observações
  - 02.B característica as checkbox grid
affects:
  - 14-02 (tables, EVA, body map)
  - 14-03 (Evolução visual parity)
  - 14-04 (visual UAT)

tech-stack:
  added: []
  patterns:
    - StandardFonts.TimesRomanBold for chapter titles (no fontkit)
    - footerKind === 'ficha' slim header branch
    - Callout banners for clinical notes (caution/info)

key-files:
  created: []
  modified:
    - src/services/patientAiPdf.service.ts

key-decisions:
  - "Diamond via drawSvgPath (rotated square), not pushOperators"
  - "Ficha header omits accentSoft band; small logo + thin border only"
  - "Triagem observações use drawCalloutBanner('caution') instead of drawOptionalField"

patterns-established:
  - "Chapter chrome: timesBold + flanking rules + SVG diamond"
  - "Multi-selects: drawOptionalBullets/drawCheckboxRow, never drawBulletList"
  - "Danger red only via drawFichaBlockFrame opts.danger"

requirements-completed: [REQ-26, REQ-26.1, REQ-26.2, REQ-26.3]

duration: 3min
completed: 2026-09-21
---

# Phase 14 Plan 01: Ficha visual chrome foundation Summary

**TimesRomanBold chapter banners, slim ficha header, fixed navy/sage badges, Triagem caution callouts, and checkbox grids for Avaliação multi-selects — no new packages.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-21T14:26:36Z
- **Completed:** 2026-09-21T14:29:11Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Serif chapter titles via `StandardFonts.TimesRomanBold` with flanking rules and SVG diamond
- Ficha pages use a ~28–36px slim header (logo + thin rule) so the chapter banner is the hero
- `badgeColorForLetter` no longer forces letter E to danger; Triagem stays red only via `{ danger: true }`
- `drawCalloutBanner` added and wired for filled Triagem observações; 02.B característica uses checkbox grid

## Task Commits

Each task was committed atomically:

1. **Task 1: TimesRoman banner + slim ficha header + badge fix** - `8333f12` (feat)
2. **Task 2: Callouts + checkbox grids for Avaliação multi-selects** - `10bb4a7` (feat)

**Plan metadata:** (docs commit after this SUMMARY)

## Files Created/Modified

- `src/services/patientAiPdf.service.ts` — DrawContext.timesBold, slim ficha header, banner rewrite, badge fix, drawCalloutBanner, Triagem/02.B rewires

## Decisions Made

- Diamond drawn with `drawSvgPath` (no `pushOperators` elsewhere in file)
- Ficha header skips the 92px accentSoft band entirely; fluxo kinds keep the heavy band
- Body-map mark lines (02.A) still use `drawBulletList` — vector body map is Plan 02 scope

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Chrome primitives ready for Plan 02 (tables, EVA scale, body map) and Plan 03 (Evolução parity)
- Visual UAT deferred to Plan 04
- Catalog/picker/SQL untouched (D-06)

## Self-Check: PASSED

- FOUND: `src/services/patientAiPdf.service.ts`
- FOUND: commit `8333f12`
- FOUND: commit `10bb4a7`
- FOUND: `TimesRomanBold`, `drawCalloutBanner(..., 'caution', ...)`, checkbox 02.B
- No stubs blocking plan goal

---
*Phase: 14-pdf-ficha-visual-polish*
*Completed: 2026-09-21*
