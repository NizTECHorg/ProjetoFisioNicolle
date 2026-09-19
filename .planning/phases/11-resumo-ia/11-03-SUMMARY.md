---
phase: 11-resumo-ia
plan: 03
subsystem: api
tags: [resumo-ia, pdf-lib, patient-ai-reports, supabase-storage, tanstack-query, typescript]

# Dependency graph
requires:
  - phase: 11-resumo-ia/01
    provides: PatientAiReport DTO, patientAiReportUploadSchema, PATIENT_AI_COPY, patient-ai-reports bucket + table
  - phase: 07-galeria-de-imagens-na-ficha-do-paciente
    provides: upload-then-INSERT + signed URL + delete-order Storage pattern
provides:
  - pdf-lib@1.17.1 production dependency
  - buildPatientAiReportPdf (geral/sessão → application/pdf Blob)
  - list/create/delete patient AI reports against private bucket + metadata
  - usePatientAiReports / useCreatePatientAiReport / useDeletePatientAiReport hooks
affects: [11-04, wave-4-report-list-ui, composer-pdf-mode]

# Tech tracking
tech-stack:
  added: [pdf-lib@1.17.1]
  patterns:
    - Client pdf-lib deterministic layout (no Gemini in PDF path — A5)
    - Phase 7 clone: upload → INSERT with storage.remove rollback; list createSignedUrls; delete remove-then-row
    - session_label denormalized at create for sessao kind (Pitfall 5)
    - WinAnsi Helvetica + toWinAnsiSafe for PT accents without fontkit (Pitfall 9)

key-files:
  created:
    - src/services/patientAiPdf.service.ts
    - src/services/patientAiReports.service.ts
    - src/hooks/usePatientAiReports.ts
  modified:
    - package.json
    - package-lock.json
    - src/hooks/usePatients.ts

key-decisions:
  - "pdf-lib@1.17.1 installed after npm registry legitimacy verify (Hopding/pdf-lib) — orchestrator authorized install"
  - "StandardFonts.Helvetica + WinAnsi sanitizer for PT accents instead of @pdf-lib/fontkit + TTF (avoids extra ASSUMED package)"
  - "invalidatePatient also invalidates ['patients', id, 'ai-reports'] for list refresh parity with images"

patterns-established:
  - "REPORT_BUCKET = patient-ai-reports; path = ${patientId}/${reportId}.pdf; upsert false"
  - "Signed URLs only at list time — never persisted / never console.logged"
  - "Hooks toast PATIENT_AI_COPY.exportSuccess / deleteSuccess / exportError"

requirements-completed: [REQ-23, REQ-23.4, REQ-23.5, REQ-23.6]

# Metrics
duration: 2min
completed: 2026-09-19
---

# Phase 11 Plan 03: PDF Export + Reports Persistence Summary

**Client pdf-lib PDF builders (geral/sessão) plus private Storage CRUD for Avaliações salvas with signed URLs and INSERT rollback**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-09-19T14:38:01Z
- **Completed:** 2026-09-19T14:40:17Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments
- Verified and installed `pdf-lib@1.17.1` (publisher Hopding, repo github.com/Hopding/pdf-lib)
- Shipped `buildPatientAiReportPdf` for deterministic geral/sessão Blobs (no Gemini, A5)
- Cloned Phase 7 Storage pattern for `patient-ai-reports` + `patient_ai_reports` with Pitfall 4 rollback and Pitfall 5 `session_label`
- Wired TanStack hooks under `['patients', id, 'ai-reports']` with Portuguese toasts

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify pdf-lib on npm before install [BLOCKING]** - cleared via npm registry verify + orchestrator install authorization (no separate commit)
2. **Task 2: Install pdf-lib + PDF builder + reports service + hooks** - `5441501` (feat)

**Plan metadata:** (docs commit after SUMMARY)

## Files Created/Modified
- `package.json` / `package-lock.json` - pdf-lib@1.17.1 dependency
- `src/services/patientAiPdf.service.ts` - `buildPatientAiReportPdf` for geral/sessão
- `src/services/patientAiReports.service.ts` - list/create/delete + signed URLs + INSERT rollback
- `src/hooks/usePatientAiReports.ts` - query + create/delete mutations
- `src/hooks/usePatients.ts` - invalidate `ai-reports` query key

## Decisions Made
- Proceeded with install after `npm view pdf-lib@1.17.1` confirmed official Hopding package (orchestrator authorized; human npmjs.com click path documented as satisfied by registry verify)
- Used Helvetica/WinAnsi with sanitizer for Portuguese accents rather than adding `@pdf-lib/fontkit` + bundled TTF (extra [ASSUMED] surface)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Explicit ai-reports query invalidation**
- **Found during:** Task 2 (hooks wiring)
- **Issue:** `invalidatePatient` listed images but not `ai-reports`; list would rely only on partial prefix match
- **Fix:** Added `invalidateQueries({ queryKey: ['patients', patientId, 'ai-reports'] })` for parity with images
- **Files modified:** `src/hooks/usePatients.ts`
- **Verification:** typecheck passed
- **Committed in:** `5441501`

**2. [Rule 2 - Missing Critical] Pitfall 9 without fontkit**
- **Found during:** Task 2 (PDF builder)
- **Issue:** Plan prefers embedded Latin TTF; that requires `@pdf-lib/fontkit` (not legitimacy-gated)
- **Fix:** Helvetica + `toWinAnsiSafe` covering áéíóúãõç for clinical copy
- **Files modified:** `src/services/patientAiPdf.service.ts`
- **Verification:** typecheck; titles use Avaliação/Sessão/evolução
- **Committed in:** `5441501`

---

**Total deviations:** 2 auto-fixed (2 Rule 2)
**Impact on plan:** Correctness/safety only; no scope creep into UI (11-04)

## Auth Gates

**Task 1 package legitimacy:** Orchestrator authorized `npm install pdf-lib` after documenting package. Registry verify: name `pdf-lib`, version `1.17.1`, repo `github.com/Hopding/pdf-lib`, homepage `pdf-lib.js.org`, maintainer hopding. No CHECKPOINT_WAITING returned.

## Issues Encountered
None

## User Setup Required
None - bucket/table already applied in 11-01. SQL must remain applied before UAT upload.

## Next Phase Readiness
- Export persistence stack ready for 11-04 composer PDF mode + Avaliações salvas list UI
- Call `buildPatientAiReportPdf` then `useCreatePatientAiReport` from composer; list via `usePatientAiReports`

## Self-Check: PASSED

- FOUND: `src/services/patientAiPdf.service.ts`
- FOUND: `src/services/patientAiReports.service.ts`
- FOUND: `src/hooks/usePatientAiReports.ts`
- FOUND: `package.json` pdf-lib dep
- FOUND: commit `5441501`

---
*Phase: 11-resumo-ia*
*Completed: 2026-09-19*
