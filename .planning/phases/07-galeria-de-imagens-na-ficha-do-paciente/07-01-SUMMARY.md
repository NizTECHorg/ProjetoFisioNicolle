---
phase: 07-galeria-de-imagens-na-ficha-do-paciente
plan: 01
subsystem: api
tags: [zod, typescript, supabase-storage, patient-images, mapStorageError]

requires:
  - phase: 03-tipos-de-conta-e-equipe
    provides: mapDbError 42501 Portuguese permission copy; can_write_patient / can_read_patient for later SQL
provides:
  - PatientImage DTO with sessionRemoved (D-07) and DTO-only signedUrl
  - UpdatePatientImageInput for Editar imagem session re-allocation
  - PATIENT_IMAGE_MIMES / MAX_IMAGE_BYTES / MAX_BATCH_FILES
  - imageUploadSchema and imageMetadataFormSchema
  - mapStorageError Portuguese Storage mapping
affects:
  - 07-02 SQL patient_images session_removed
  - 07-03 patientImages.service parse + mapStorageError
  - 07-04 / 07-05 gallery UI toasts and lote cap

tech-stack:
  added: []
  patterns:
    - signedUrl lives only on the PatientImage DTO (createSignedUrls), never as a table column
    - sessionRemoved is the D-07 flag name SQL and service must use
    - Image MIME/size copy is locked in Zod errorMap and mapStorageError; no raw Storage English
    - MAX_BATCH_FILES = 10 for later lote surplus rejection

key-files:
  created: []
  modified:
    - src/types/patient.ts
    - src/schemas/patient.schema.ts
    - src/lib/security/index.ts

key-decisions:
  - "MAX_BATCH_FILES is 10 so later lote UI can reject the surplus"
  - "sessionRemoved is the D-07 flag; sessionId null alone does not distinguish avulsa-original vs órfã"
  - "mapStorageError permission path reuses mapDbError with code 42501 so copy stays Você não tem permissão para esta ação."

patterns-established:
  - "PatientImage sits next to PatientSessionRecord in src/types/patient.ts; do not add bakery types to database.types.ts"
  - "optionalText(500) is reused for image description; do not duplicate the helper"
  - "mapStorageError sits beside mapDbError and never returns error.message raw"

requirements-completed: [REQ-19, REQ-19.4]

duration: 5min
completed: 2026-09-15
---

# Phase 7 Plan 01: Contratos PatientImage Summary

**PatientImage DTO with sessionRemoved and DTO-only signedUrl, Zod JPEG/PNG/WebP 8 MiB plus batch cap 10, and mapStorageError Portuguese Storage toasts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-15T02:13:09Z
- **Completed:** 2026-09-15T02:18:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `PatientImage`, `PatientImageMime`, and `UpdatePatientImageInput` are named exports on `src/types/patient.ts`
- `imageUploadSchema` rejects HEIC/empty MIME and files over 8 MiB with the locked UI-SPEC Portuguese messages; `MAX_BATCH_FILES` is 10
- `mapStorageError` maps size/MIME/permission Storage errors to Portuguese and never returns raw English vendor text

## Task Commits

Each task was committed atomically:

1. **Task 1: Add PatientImage DTOs** - `43aa95b` (feat)
2. **Task 2: Image Zod schemas and mapStorageError** - `c3d9da7` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/types/patient.ts` - PatientImageMime, PatientImage (sessionRemoved + signedUrl), UpdatePatientImageInput
- `src/schemas/patient.schema.ts` - PATIENT_IMAGE_MIMES, MAX_IMAGE_BYTES, MAX_BATCH_FILES, imageUploadSchema, imageMetadataFormSchema
- `src/lib/security/index.ts` - mapStorageError next to mapDbError

## Decisions Made

- MAX_BATCH_FILES = 10 (Claude discretion) so later lote UI can toast Envie no máximo 10 fotos por vez
- sessionRemoved is the locked D-07 field name; signedUrl is DTO-only (createSignedUrls)
- Permission-like Storage errors call mapDbError with code 42501 so the copy stays Você não tem permissão para esta ação. without changing mapDbError for non-Storage callers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Force 42501 when mapping Storage permission errors**
- **Found during:** Task 2 (mapStorageError)
- **Issue:** mapDbError only returns the permission sentence for code 42501 or operation_not_permitted. A 403 / unauthorized / RLS Storage error would otherwise fall through to Não foi possível concluir a operação.
- **Fix:** Permission branch calls mapDbError with code 42501 when the Storage payload is not already 42501, so T-07-08 copy stays Você não tem permissão para esta ação.
- **Files modified:** src/lib/security/index.ts
- **Verification:** eslint on changed files; npm run typecheck
- **Committed in:** c3d9da7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for T-07-08; mapDbError behavior for existing DB callers is unchanged.

## Issues Encountered

- `npm run lint` (whole repo) still fails on a pre-existing `@typescript-eslint/no-explicit-any` in `src/services/aiPhysicalEvaluation.service.ts`. Out of scope. Verified `npx eslint` on the three plan files plus `npm run typecheck`.
- `src/lib/security/index.ts` had unrelated uncommitted rate-limit WIP. Task 2 staged only the mapStorageError hunk; WIP remains unstaged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 07-02 can name `session_removed` and MIME/size CHECKs after these contracts
- 07-03 can import PatientImage, imageUploadSchema, MAX_BATCH_FILES, and mapStorageError instead of inventing parallel types

## Self-Check: PASSED

- FOUND: src/types/patient.ts
- FOUND: src/schemas/patient.schema.ts
- FOUND: src/lib/security/index.ts
- FOUND: 43aa95b
- FOUND: c3d9da7
- database.types.ts unmodified

---
*Phase: 07-galeria-de-imagens-na-ficha-do-paciente*
*Completed: 2026-09-15*
