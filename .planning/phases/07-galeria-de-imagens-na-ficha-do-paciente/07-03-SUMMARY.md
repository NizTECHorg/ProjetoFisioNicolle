---
phase: 07-galeria-de-imagens-na-ficha-do-paciente
plan: 03
subsystem: api
tags: [supabase-storage, tanstack-query, patient-images, signed-urls, mapStorageError]

requires:
  - phase: 07-01
    provides: PatientImage DTO, UpdatePatientImageInput, imageUploadSchema, mapStorageError
  - phase: 07-02
    provides: private patient-images bucket, patient_images table, session_removed, Storage+table RLS
provides:
  - listPatientImages with batch createSignedUrls (3600s) and empty [] (no mock tiles)
  - uploadPatientImage / uploadPatientImages Storage-then-INSERT with INSERT-fail compensate
  - updatePatientImage description/sessionId always clearing session_removed (D-07)
  - deletePatientImage storage.remove then row DELETE
  - usePatientImages hooks plus invalidatePatient images key for D-06/D-07 cache refresh
affects:
  - 07-04 gallery read UI
  - 07-05 lote/câmera write UI

tech-stack:
  added: []
  patterns:
    - Service owns all Storage I/O; components/hooks never import supabase
    - Local ImageRow; do not add patient_images to database.types.ts
    - Signed URLs live only on the DTO; never INSERT; never console.log
    - invalidatePatient includes ['patients', id, 'images'] so session delete refreshes the gallery

key-files:
  created:
    - src/services/patientImages.service.ts
    - src/hooks/usePatientImages.ts
  modified:
    - src/hooks/usePatients.ts

key-decisions:
  - "Export invalidatePatient from usePatients so image mutations share the same key set as session delete"
  - "Path is ${patientId}/${crypto.randomUUID()}.ext with upsert false; never user filenames"
  - "Batch upload skips invalid MIME/size files and returns successes; throws first mapped message only if none succeed"

patterns-established:
  - "throwIfDbError / throwIfStorageError via mapDbError / mapStorageError — never raw error.message"
  - "Upload then INSERT; INSERT fail → storage.remove. Delete: remove then row"
  - "usePatientImages staleTime 30_000 remints signed URLs on refetch (Pitfall 8)"

requirements-completed: [REQ-19, REQ-19.2, REQ-19.3, REQ-19.4, REQ-19.5]

duration: 3min
completed: 2026-09-15
---

# Phase 7 Plan 03: Images Service and Hooks Summary

**Private `patient-images` Storage plus `patient_images` CRUD in `patientImages.service`, TanStack hooks with Portuguese lote toasts, and `invalidatePatient` reminting signed URLs after session delete**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-15T02:30:08Z
- **Completed:** 2026-09-15T02:32:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `listPatientImages` SELECTs metadata then `createSignedUrls` (3600s) on bucket `patient-images`; empty table returns `[]` without calling Storage
- Two-phase upload (Storage then INSERT with compensate) and delete (`storage.remove` then row); update always sets `session_removed` false (D-07)
- Dedicated `usePatientImages` hooks toast **Imagem adicionada** / **Imagens adicionadas** / **Descrição atualizada** / **Imagem excluída**; `useDeletePatientSession` already refreshes the gallery via `invalidatePatient`

## Task Commits

Each task was committed atomically:

1. **Task 1: Write patientImages.service.ts** - `3f903d5` (feat)
2. **Task 2: usePatientImages hooks and invalidatePatient images key** - `f850432` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/services/patientImages.service.ts` — list/upload/update/delete; local `ImageRow`; `mapStorageError` / `mapDbError`
- `src/hooks/usePatientImages.ts` — queryKey `['patients', id, 'images']`, staleTime 30_000, four named hooks
- `src/hooks/usePatients.ts` — export `invalidatePatient` and add images query key

## Decisions Made

- Export `invalidatePatient` (plain helper, not a hook) so image mutations and session delete share one key set; `usePatients.ts` already has `allowConstantExport`
- Object path is `${patientId}/${imageId}.{jpg|png|webp}` from route id + `crypto.randomUUID()`; `upsert: false`; never `getPublicUrl`
- Batch `uploadPatientImages` parses each file; Zod/MIME failures skip that file (D-04); Storage/INSERT errors collect mapped Portuguese copy; if none succeed, throw the first mapped message or **Não foi possível salvar. Verifique o arquivo e tente de novo.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Signed URL helper accepts `string | null`**
- **Found during:** Task 1 (`npm run typecheck`)
- **Issue:** supabase-js `createSignedUrls` types `signedUrl` as `string | null`; the zipper initially used `string | undefined`
- **Fix:** Widen the helper to `signedUrl?: string | null` (and `signedURL` for older field name)
- **Files modified:** `src/services/patientImages.service.ts`
- **Verification:** `npm run typecheck` passes
- **Committed in:** `3f903d5` (Task 1)

**2. [Rule 2 - Missing Critical] Batch collects Zod MIME/size messages**
- **Found during:** Task 1
- **Issue:** Plan said skip Zod failures and collect only Storage/INSERT errors; an all-invalid lote would then throw only the generic fallback
- **Fix:** Collect the first Zod issue message (already Portuguese) so D-04 copy still surfaces when every file is HEIC/oversize
- **Files modified:** `src/services/patientImages.service.ts`
- **Verification:** Valid files still upload; one bad MIME does not abort the lote
- **Committed in:** `3f903d5` (Task 1)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Typecheck unblocked; D-04 Portuguese toasts work when the UI filter is skipped. No scope creep.

## Issues Encountered

None. Project-wide `npm run lint` still reports a pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts` (out of scope). Touched files lint and typecheck clean.

## Authentication Gates

None.

## Known Stubs

None. `listPatientImages` returning `[]` is the empty gallery (REQ-19.2), not a mock. Upload/update return `signedUrl: null` on purpose — list refetch remints.

## Threat Flags

None. New Storage/PostgREST surface matches the plan threat model (T-07-03 signed URL DTO-only, T-07-05 generated path, T-07-07 two-phase compensate, T-07-08 mapped errors, T-07-02 no `getPublicUrl`).

## User Setup Required

None - no external service configuration required. SQL from 07-02 is already applied.

## Next Phase Readiness

Ready for **07-04** — aba Imagens, gallery grid/lightbox, D-07 **Sessão removida.**, D-08 Evoluções confirm copy. Panel can consume `usePatientImages` without importing supabase.

REQ-19 write UI (lote, câmera, Editar/Excluir, Compartilhar) stays for 07-05.

## Verification

- Named exports: `listPatientImages`, `uploadPatientImage`, `uploadPatientImages`, `updatePatientImage`, `deletePatientImage`
- Local `ImageRow`; `database.types.ts` unmodified
- `createSignedUrls(..., 3600)`; bucket id `patient-images`
- `update` sets `session_removed` false; delete `remove` then DELETE row
- `grep -v '^[[:space:]]*//' src/services/patientImages.service.ts | grep -c getPublicUrl` → 0
- `invalidatePatient` includes `['patients', patientId, 'images']`
- Hook toasts include **Imagens adicionadas**; `staleTime: 30_000`; no supabase import in the hook file
- `npm run typecheck` passes; eslint on touched files clean

## Self-Check: PASSED

- FOUND: `src/services/patientImages.service.ts`
- FOUND: `src/hooks/usePatientImages.ts`
- FOUND: `src/hooks/usePatients.ts`
- FOUND: `3f903d5`
- FOUND: `f850432`

---
*Phase: 07-galeria-de-imagens-na-ficha-do-paciente*
*Completed: 2026-09-15*
