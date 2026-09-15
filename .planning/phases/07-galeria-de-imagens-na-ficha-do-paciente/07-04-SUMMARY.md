---
phase: 07-galeria-de-imagens-na-ficha-do-paciente
plan: 04
subsystem: ui
tags: [patient-ficha, imagens-tab, gallery, lightbox, hide-write, overflow-x-auto]

requires:
  - phase: 07-03
    provides: usePatientImages, PatientImage.sessionRemoved, invalidatePatient images key
provides:
  - Fifth ficha tab Imagens at ?aba=imagens with overflow-x-auto tablist
  - PatientImagesPanel read gallery (chips, grid, empty/error, lightbox)
  - D-07 lightbox Sessão removida. vs tile Avulsa
  - D-08 Evoluções session-delete confirm extra sentence
affects:
  - 07-05 lote/câmera write chrome on the same panel

tech-stack:
  added: []
  patterns:
    - PatientTab + ?aba= parse/setTab for imagens, same as evolucoes
    - canWrite default false (fail-closed); unmount write chrome, never disabled
    - Tile allocation Avulsa when sessionId is null; lightbox Sessão removida. when sessionRemoved
    - Client-only filter chips; usePatientSessions labels dateLabel · timeLabel

key-files:
  created:
    - src/components/patients/PatientImagesPanel.tsx
  modified:
    - src/components/patients/PatientProfileHeader.tsx
    - src/pages/PatientPage.tsx
    - src/components/patients/PatientEvolutionsPanel.tsx

key-decisions:
  - "Fail-closed canWrite default false on PatientImagesPanel (Pitfall 6 — do not copy Evoluções default true)"
  - "Empty/filter-empty states are heading-only this plan so copy never points at a missing Adicionar button"
  - "D-07: tile always Avulsa for null/orphan sessionId; lightbox shows Sessão removida. when sessionRemoved"

patterns-established:
  - "Fifth tab uses overflow-x-auto on the tablist; selected chrome stays forest for all tabs"
  - "Gallery read path: usePatientImages + usePatientSessions; no supabase in the panel"
  - "Hide-write slot on the panel header is unmounted (null), not a disabled Adicionar"

requirements-completed: [REQ-19, REQ-19.1, REQ-19.2, REQ-19.3, REQ-19.6]

duration: 4min
completed: 2026-09-15
---

# Phase 7 Plan 04: Imagens Tab and Read Gallery Summary

**Fifth ficha tab `?aba=imagens` with overflow-x-auto, a read-only `PatientImagesPanel` (chips, signed-URL grid, lightbox D-07), fail-closed hide-write, and Evoluções delete copy that photos stay as avulsas**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-15T02:35:25Z
- **Completed:** 2026-09-15T02:39:21Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Tab **Imagens** is a real `PatientTab` after Avaliação; `?aba=imagens` parses and writes like Evoluções; tablist scrolls with `overflow-x-auto`
- `PatientImagesPanel` lists signed images (or empty heading), filters Todas / Avulsas / session chips, and opens a wide Modal lightbox; **Sessão removida.** only in the lightbox
- Empresa consult reuses the existing banner; `canWrite` defaults false and Adicionar / Editar / Excluir stay unmounted; Evoluções confirm appends **As fotos dessa sessão ficam na ficha como avulsas.**

## Task Commits

Each task was committed atomically:

1. **Task 1: Tab Imagens and aba parse** - `b13e500` (feat)
2. **Task 2: PatientImagesPanel read gallery and page mount** - `cceb29f` (feat)
3. **Task 3: Evoluções session-delete photo warning** - `f77a6e8` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/patients/PatientImagesPanel.tsx` — named export; filter, grid, empty/error, lightbox; `usePatientImages` / `usePatientSessions`
- `src/components/patients/PatientProfileHeader.tsx` — `PatientTab` includes `imagens`; fifth tab; `overflow-x-auto`
- `src/pages/PatientPage.tsx` — aba parse/setTab `imagens`; mount `<PatientImagesPanel patientId={dashboard.id} canWrite={canWrite} />`
- `src/components/patients/PatientEvolutionsPanel.tsx` — D-08 extra ConfirmDialog sentence

## Decisions Made

- Default `canWrite = false` (Pitfall 6). Evoluções defaults true; this panel must fail closed so a missed prop cannot show write chrome later
- Empty and filter-empty copy is heading-only this plan (`Nenhuma imagem nesta ficha.` / `Nenhuma imagem avulsa.` / `Nenhuma imagem nesta sessão.`) because Adicionar ships in 07-05
- CONTEXT D-07 wins: tile allocation is **Avulsa** when `sessionId` is null or the session row is gone; lightbox uses **Sessão removida.** when `sessionRemoved` is true

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoid cadastro flash on aba=imagens before the panel existed**
- **Found during:** Task 1
- **Issue:** Adding `'imagens'` to the tab union without a mount made the existing ternary fall through to Dados cadastrais
- **Fix:** Render `null` for `tab === 'imagens'` in Task 1; Task 2 replaced it with `PatientImagesPanel`
- **Files modified:** `src/pages/PatientPage.tsx`
- **Verification:** `?aba=imagens` no longer selects cadastro; Task 2 mounts the gallery
- **Committed in:** `b13e500` (Task 1), replaced in `cceb29f` (Task 2)

**2. [Rule 3 - Blocking] Isolate PatientPage commits from unrelated Resumo layout WIP**
- **Found during:** Task 1
- **Issue:** `PatientPage.tsx` already had uncommitted Resumo grid/layout edits unrelated to 07-04
- **Fix:** Restored HEAD, applied only tab/panel hunks, committed, then restored the WIP on the working tree
- **Files modified:** none in the 07-04 commits beyond intended hunks
- **Verification:** `git show b13e500` / `cceb29f` contain only imagens wiring, not Resumo layout
- **Committed in:** `b13e500`, `cceb29f`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Correct tab content; no scope creep into Resumo. Pre-existing PatientPage WIP remains uncommitted.

## Issues Encountered

None. Project-wide `npm run lint` still reports a pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (out of scope). Touched files lint and typecheck clean. No browser MCP tools in this session — gallery was verified by typecheck, eslint on touched files, and acceptance greps, not a live click-through.

## Authentication Gates

None.

## Known Stubs

- `src/components/patients/PatientImagesPanel.tsx` header `{canWrite ? null : null}` — intentional hide-write slot; **Adicionar imagem** / Editar / Excluir / Compartilhar belong to 07-05. Empty headings have no CTA body for the same reason.

## Threat Flags

None. Signed `img src` and description/alt text match the plan threat model (T-07-01 fail-closed canWrite, T-07-03 no persist/console.log of URLs, T-07-09 text nodes and alt only).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for **07-05** — lote/câmera upload, Editar/Excluir, Compartilhar (D-01–D-05, D-09–D-12). The panel already receives `canWrite`; write chrome should unmount when false, not disable.

Documentos · Em breve on Resumo is unchanged.

## Verification

- `PatientTab` includes `imagens`; header nav `overflow-x-auto` (no `overflow-hidden`)
- `PatientPage` aba parse/setTab `imagens`; mounts `PatientImagesPanel` with `canWrite`
- Copy: Imagens, Todas, Avulsas, Nenhuma imagem nesta ficha., Sessão removida.
- No `Adicionar imagem`, no `supabase` import, no `clsx`; `canWrite = false`
- Evoluções ConfirmDialog includes **As fotos dessa sessão ficam na ficha como avulsas.** and the first sessão/evolução sentence
- Documentos · Em breve string unchanged
- `npx eslint` on touched files clean; `npm run typecheck` passes

## Self-Check: PASSED

- FOUND: `src/components/patients/PatientImagesPanel.tsx`
- FOUND: `src/components/patients/PatientProfileHeader.tsx`
- FOUND: `src/pages/PatientPage.tsx`
- FOUND: `src/components/patients/PatientEvolutionsPanel.tsx`
- FOUND: `b13e500`
- FOUND: `cceb29f`
- FOUND: `f77a6e8`
