# Deferred items — phase 26

## Pre-existing typecheck failure (out of scope for 26-03)

`npm run typecheck` reports unused functions in `src/services/patientAiPdf.service.ts`, committed by 26-01 (`d13517f`):

- `drawNoteBox` (line 613)
- `drawCalloutBanner` (line 976)
- `drawPageBanner` (line 1042)
- `drawSideBySideBlocks` (line 1196)

Plan 26-03 did not edit that file. `noUnusedLocals` fails the project typecheck until those helpers are used again or removed. `node --test src/lib/patientContact.test.ts` passes.
