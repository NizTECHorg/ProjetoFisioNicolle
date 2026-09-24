---
phase: 16-foto-do-paciente
plan: 02
subsystem: ui
tags: [canvas, magic-bytes, patient-avatar, png, jpeg]

requires:
  - phase: 16-foto-do-paciente
    provides: patientPhotoSchema JPEG/PNG only and private bucket patient-avatars
provides:
  - preparePatientPhoto magic-byte sniff and 512 center crop
  - PatientAvatar optional photoUrl with object-cover and initials fallback
affects:
  - 16-03 patient photo upload
  - 16-04 signed URL on the ficha and lists

tech-stack:
  added: []
  patterns:
    - Sniff JPEG FF D8 FF and PNG 89 50 4E 47 before createImageBitmap
    - PNG stays image/png so photo_tone shows through transparency

key-files:
  created:
    - src/lib/cropPatientPhoto.ts
  modified:
    - src/components/ui/PatientAvatar.tsx

key-decisions:
  - "preparePatientPhoto accepts only JPEG FF D8 FF and PNG 89 50 4E 47; PNG stays image/png and JPEG uses quality 0.85"
  - "PatientAvatar paints a non-empty photoUrl with object-cover and falls back to initials on photo_tone when the URL is missing or the image errors"
  - "PatientAvatar lg stays h-16 w-16; the live size map was kept"

patterns-established:
  - "Avatar bytes are cropped in the browser with preparePatientPhoto; compressImageForThumb is not used"
  - "PatientAvatar never opens a file dialog; photoUrl is display only"

requirements-completed: []

duration: 2min
completed: 2026-09-24
---

# Phase 16 Plan 02: PNG/JPEG crop and avatar photo Summary

**Browser gate that center-crops only PNG and JPEG to 512, and a PatientAvatar that paints that image or the initials on photo_tone.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-24T00:33:28Z
- **Completed:** 2026-09-24T00:36:30Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- `preparePatientPhoto` rejects WebP (RIFF/WEBP), HEIC/HEIF (`ftyp`), GIF, SVG, and PDF before decode, and rejects files over 8 MB before `createImageBitmap`
- A PNG stays `image/png` with no quality argument so transparency still shows `photo_tone`; JPEG is `image/jpeg` at 0.85, drawn as a 512 center square
- `PatientAvatar` accepts optional `photoUrl` and paints `object-cover` inside the existing circle; null, empty, and failed images still show initials

## Task Commits

Each task was committed atomically:

1. **Task 1: Sniff and center-crop PNG or JPEG** - `d6dc054` (feat)
2. **Task 2: PatientAvatar renders photoUrl or initials** - `072e79b` (feat)

**Plan metadata:** docs commit that includes this SUMMARY

## Files Created/Modified

- `src/lib/cropPatientPhoto.ts` — Magic-byte sniff, 8 MB gate, 512 center crop, 2 MB output gate
- `src/components/ui/PatientAvatar.tsx` — Optional `photoUrl`, `overflow-hidden`, `object-cover`, initials on error

## Decisions Made

- Sniff agrees with `file.type` when it is set (`image/png` or `image/jpeg` only). An empty `file.type` still requires a `.png`, `.jpg`, or `.jpeg` filename.
- PNG output omits the `toBlob` quality argument so a transparent PNG is not flattened. The circle background stays `avatarColor(tone)`.
- The live size map stays `sm` h-9, `md` h-10, `lg` h-16. Call sites were not changed.
- A failed image is remembered by URL, so a later `photoUrl` can paint again.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Decode fallback always throws the photo save message**
- **Found during:** Task 1 (Sniff and center-crop PNG or JPEG)
- **Issue:** The `compressImage.ts` fallback throws “Não foi possível comprimir a miniatura.” A later `createImageBitmap` failure in that fallback could surface a different message.
- **Fix:** Copied the fallback shape and throw only “Não foi possível salvar a foto. Tente de novo.” `bitmap.close()` runs in `finally`.
- **Files modified:** `src/lib/cropPatientPhoto.ts`
- **Verification:** `npm run lint` and `npm run typecheck` pass; the file does not import `compressImageForThumb`
- **Committed in:** `d6dc054` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The fallback message matches the photo toast copy. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 16-03. `preparePatientPhoto` returns `{ blob, mimeType }` and does not upload. `PatientAvatar` can show a URL but no call site passes `photoUrl` yet.

## Self-Check: PASSED

- FOUND: src/lib/cropPatientPhoto.ts
- FOUND: src/components/ui/PatientAvatar.tsx
- FOUND: d6dc054
- FOUND: 072e79b

---
*Phase: 16-foto-do-paciente*
*Completed: 2026-09-24*
