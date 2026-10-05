---
phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
plan: 03
subsystem: ui
tags: [react, patient-summary, inline-edit, zod, pt-br]

requires:
  - phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso
    provides: REQ-34.1 source contract and resolveSummaryFields / diffSummaryEdits
  - phase: 22-resumo-paciente-ia
    provides: summary_edits column, useSavePatientSummaryEdits, and the Resumo cards
provides:
  - Inline editor for each of the six summary text keys inside its own Resumo card
  - Save path that diffs all six resolved keys, not the open key alone
  - Removal of PatientSummaryEditorModal
affects: [23-04 Entenda o caso scroll, 23-05 UAT]

tech-stack:
  added: []
  patterns:
    - "One editingKey at a time; native textarea; Salvar and Cancelar; no blur save"
    - "diffSummaryEdits(original, { ...resolveSummaryFields(original, edits), [key]: draft })"
    - "Pencil, textarea, Salvar, and Cancelar render only when canWrite"

key-files:
  created: []
  modified:
    - src/pages/PatientPage.tsx
    - src/components/patients/PatientSummaryEditorModal.tsx

key-decisions:
  - "Each Resumo text field edits inside its card with one editingKey; Salvar calls diffSummaryEdits on all six resolved keys"
  - "REQ-34 stays open: 34.1 is green; 34.5 scroll and composer label stay red for later plans"

patterns-established:
  - "Do not mount the shared Textarea on a card that already has a title; use a native textarea with aria-labelledby"
  - "The draft is born when the pencil opens and is not copied from detail while editingKey is set"

requirements-completed: []

duration: 6min
completed: 2026-10-05
---

# Phase 23 Plan 03: Editor inline em cada caixa do Resumo Summary

**Each generated summary text edits inside its own Resumo card, Salvar writes the diff of all six resolved keys, and the six-field modal is gone.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-05T00:35:18Z
- **Completed:** 2026-10-05T00:41:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `ResumoDoPaciente` edits `summary`, `treatmentPlan`, `evolution`, `conducts`, `nextSessionPlan`, and `painLimitations` in the card that shows that text. Áreas de foco and Todos os objetivos have no text editor. The Resumo IA tab is unchanged and has no pencil.
- One `editingKey` at a time. Salvar validates that key with `summaryEditsSchema.shape[key].safeParse` and sends `diffSummaryEdits(original, { ...resolved, [key]: draft })`. Cancelar and Escape discard the draft. There is no blur save. While the save is pending, other pencils do not open and Cancelar stays disabled. Success leaves edit mode. An error stays in the box with the draft.
- The pencil uses the Entenda o caso classes and `Editar ${SUMMARY_FIELD_LABELS[key]}`. It renders only when `canWrite`. Empty read-mode cards still show `—`; the draft is never seeded with `—` or `Sem resumo ainda.`.
- `PatientSummaryEditorModal.tsx` is deleted. Nothing in the app imports it.

## Task Commits

Each task was committed atomically:

1. **Task 1: Editor inline por chave em ResumoDoPaciente** - `3ba4b3b` (feat)
2. **Task 2: Apagar PatientSummaryEditorModal** - `47595a2` (refactor)

**Plan metadata:** docs commit records this summary plus STATE.md and ROADMAP.md

The `REQ-34.1` contract already existed from plan 01. Task 1 confirmed it red, then implemented the editor. Task 2 deleted the modal and turned that contract green. No new test file was added.

## Files Created/Modified

- `src/pages/PatientPage.tsx` - Inline editor inside each Resumo text card. `EntendaOCaso` still uses `line-clamp-3`.
- `src/components/patients/PatientSummaryEditorModal.tsx` - Deleted. The six-field modal is not replaced.

## Decisions Made

- Save always spreads the six resolved strings and then overlays the open draft. A payload of only `{ [key]: draft }` would wipe the other edits, because the UPDATE replaces `summary_edits`.
- The draft is set when the pencil opens. No effect copies `detail` back into the draft while `editingKey` is set, so a refetch cannot erase what the professional is typing.
- REQ-34 stays unchecked. This plan greens `REQ-34.1` only. `REQ-34.5` (Entenda o caso scroll and the composer label) stays red for plans 04 and 05.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guard a missing Zod issue before showing the alert**
- **Found during:** Task 1 (Editor inline por chave em ResumoDoPaciente)
- **Issue:** `parsed.error.issues[0].message` failed typecheck with `TS2532` under `noUncheckedIndexedAccess`.
- **Fix:** Read `issues[0]` first and set the alert only when that issue exists. A failed parse still does not call mutate.
- **Files modified:** `src/pages/PatientPage.tsx`
- **Verification:** `npm run typecheck`
- **Committed in:** `3ba4b3b` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-only guard. The alert still shows the schema message `Use no máximo N caracteres.`

## Issues Encountered

The logged-in Resumo tab was not clicked through. `http://localhost:5173/` is the login screen, and this plan's checks are the source contract and typecheck. `REQ-34.1` passes. `npm run typecheck` passes. `EntendaOCaso` still has `line-clamp-3`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 can replace `line-clamp-3` on Queixa and Diagnóstico. This plan did not touch that overflow, `src/index.css`, or the Edge Function.
- `REQ-34.5` is still red on purpose: the complaint and diagnosis paragraphs still use `line-clamp-3`, and the composer still says `Orientação opcional`.
- `PatientResumoIaPanel.tsx` still has no `Pencil` and no `summaryEdits`.

## Self-Check: PASSED

- FOUND: `src/pages/PatientPage.tsx`
- MISSING (deleted on purpose): `src/components/patients/PatientSummaryEditorModal.tsx`
- FOUND: `3ba4b3b`
- FOUND: `47595a2`

---
*Phase: 23-ajustes-do-resumo-ia-e-rolagem-do-entenda-o-caso*
*Completed: 2026-10-05*
