---
phase: 05-financeiro-autonomo
plan: 04
subsystem: payments
tags: [react-hook-form, tanstack-query, finance, autonomo, session-editor]

requires:
  - phase: 05-01
    provides: sessionFormSchema XOR + Pago fields; SessionChargeDraft; canSeeFinance
  - phase: 05-03
    provides: upsertSessionCharge, useFinancePrices, useSessionCharge, invalidatePatient finance family
provides:
  - createPatientSession returns { id } without money columns on patient_sessions
  - session hooks upsert autonomo_session_charges after clinical save when XOR is set
  - PatientSessionEditorForm Valor da consulta block for autonomo only (catalog XOR avulso + Pago)
affects:
  - 05-05 AutonomoFinancePage (allocating from /financeiro; same charge rows)

tech-stack:
  added: []
  patterns:
    - createSession.mutate({ ...input, charge? }); updateSession.mutate({ sessionId, input, evolutionId, charge? })
    - Hidden register holds priceId; catalog Select writes only via explicit setValue
    - Hide-don't-disable finance block via canSeeFinance unmount

key-files:
  created: []
  modified:
    - src/services/sessions.service.ts
    - src/hooks/usePatients.ts
    - src/components/patients/PatientSessionEditorForm.tsx

key-decisions:
  - "createSession.mutate still accepts UpsertPatientSessionInput & { charge? }; update keeps { sessionId, input, evolutionId, charge? } so callers that omit charge compile"
  - "Archived priceId stays on a hidden input; Select is visual-only and never register('priceId')"
  - "Skip upsert when both XOR fields are empty so an existing charge row is untouched"
  - "Avulso prefill only when priceName === 'Avulso'; archived catalog snapshots are not rewritten as Avulso"
  - "CalendarPage is unchanged; D-05 agenda money remains deferred"

patterns-established:
  - "Finance block unmounts when !canSeeFinance; Pago is never a disabled checkbox"
  - "priceId binding: hidden register or Controller; Select onChange/setValue only"
  - "Charge persist is hook-side upsertSessionCharge after clinical create/update, not sessions.service"

requirements-completed: [REQ-17]

duration: 4min
completed: 2026-09-14
---

# Phase 5 Plan 04: Session editor Valor da consulta Summary

**Shared session editor mounts catalog XOR avulso + Pago for autonomo only; create returns session id and hooks upsert autonomo_session_charges; archived catalog ids stay on a hidden input so Select cannot wipe the snapshot**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-14T18:50:55Z
- **Completed:** 2026-09-14T18:54:59Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `createPatientSession` returns `{ id }` after the clinical insert (and evolution when realizada) without adding money columns to `SESSION_LIST_COLUMNS`
- `useCreatePatientSession` / `useUpdatePatientSession` accept optional `charge` and call `upsertSessionCharge` only when catalog `priceId` or `adHocAmountBrl` is set
- `PatientSessionEditorForm` shows **Valor da consulta** for autônomo on Agendar and Realizada; empresa/fisio unmount the block; `place` stays the clinical Local field
- Archived catalog edits keep `priceId` in RHF while the Select omits archived options; Avulso prefills only when `priceName === 'Avulso'`

## Task Commits

Each task was committed atomically:

1. **Task 1: Return session id and persist charge from session hooks** - `d9d821a` (feat)
2. **Task 2: Valor da consulta block on PatientSessionEditorForm** - `71131af` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/services/sessions.service.ts` — `createPatientSession` is `Promise<{ id: string }>` after clinical insert; still no `amount_brl` / `is_paid`
- `src/hooks/usePatients.ts` — optional `charge` on create/update mutate; `upsertSessionCharge` after clinical save; skip when XOR empty
- `src/components/patients/PatientSessionEditorForm.tsx` — autonomo-only Valor da consulta (catalog XOR avulso + Pago); hidden `priceId`; CalendarPage untouched

## Decisions Made

- Locked mutate API: `createSession.mutate({ ...input, charge })` and `updateSession.mutate({ sessionId, input, evolutionId, charge })`. Do not wrap as `{ input, charge }`. Existing callers that omit `charge` still compile.
- Hold `priceId` with `{...register('priceId')}` on `type="hidden"`. Catalog Select is controlled visually (`value` from active options only) and writes `priceId` only through user `onChange` → `setValue`. Choosing **Sem valor** is the Select path that clears `priceId`.
- When `useSessionCharge` returns a row: prefill `isPaid`; keep `priceId` even if archived; prefill avulso only if `priceName === 'Avulso'`. Never rewrite an archived catalog snapshot as Avulso.
- Empty XOR on save skips upsert so an existing charge row is left alone (clearing money is out of scope).
- D-05 agenda money stays deferred: `CalendarPage.tsx` was not edited.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

`npm run lint` still fails on a **pre-existing** `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (untouched this plan). ESLint on the three task files exits 0. `npm run typecheck` exits 0. Out of scope — not auto-fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-05-PLAN.md (`AutonomoFinancePage`: catalog CRUD, totals, realizadas list). Session allocation is live on ficha Modal and the dashboard shortcut for autonomo. Agenda create still has no money widget.

REQ-17 remains open until 05-05 ships `/financeiro`. RLS from 05-02 is still the wall; `canSeeFinance` only hides the form block.

## Verification

- `npm run typecheck` exits 0
- Task files pass ESLint
- `Promise<{ id: string }>` in `sessions.service.ts`; no `amount_brl` / `autonomo_session_charges` there
- `upsertSessionCharge`, `evolutionId`, and `charge` in `usePatients.ts`
- Form contains `Valor da consulta`, `canSeeFinance`, `accent-forest`, `sessionId: editing.id`, `evolutionId`, `type="hidden"` for `priceId`
- Form still has label Local; no residência/escritório; no FinancePage import; no `mutate({ input, charge })`
- `CalendarPage.tsx` does not contain Valor da consulta

## Self-Check: PASSED

- FOUND: `src/services/sessions.service.ts`
- FOUND: `src/hooks/usePatients.ts`
- FOUND: `src/components/patients/PatientSessionEditorForm.tsx`
- FOUND: `d9d821a`
- FOUND: `71131af`
---

*Phase: 05-financeiro-autonomo*
*Completed: 2026-09-14*
