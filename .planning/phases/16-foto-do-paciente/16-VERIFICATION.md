---
phase: 16-foto-do-paciente
verified: 2026-09-24T00:55:00Z
status: human_needed
score: 20/23 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Paste .planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql into the Supabase SQL Editor and run it once. Then check the bucket and patients.photo_path."
    expected: "Bucket patient-avatars is private, file_size_limit 2097152, allowed MIME only image/jpeg and image/png. patients.photo_path is nullable and existing rows stay null. SELECT uses can_read_patient. INSERT and DELETE use can_write_patient. There is no UPDATE policy and no anon policy."
    why_human: "The SQL file is the operator paste. It was not applied from this machine, so the live bucket, column, and policies cannot be proven here."
  - test: "On the ficha and on the patient list, as someone who can write the patient, hover the circle, then click it and pick a PNG and a JPEG. Also open the same patient with no photo, and open consulta mode (empresa, not the author)."
    expected: "Hover or keyboard focus shows a camera over the circle. Click opens a file picker limited to PNG/JPEG. A saved photo replaces the initials with object-cover. With no photo, initials stay on photo_tone. Consulta mode shows the photo or the initials and no camera. Remover foto appears only on the ficha, after the status pill, and Voltar cancels."
    why_human: "Hover, the OS file dialog, and the circle rendering are visual. The CSS and input exist in PatientPhotoControl; this check does not invent a UAT result."
  - test: "After a successful upload, open quadro, agenda, próximas sessões on the painel, and the clinical shortcut."
    expected: "The same photo appears. Those surfaces show no camera and no file input. With no photo they still show initials."
    why_human: "The signed URL only exists after the bucket is applied and a photo is stored. Display wiring is in code; the picture itself was not loaded in this verification."
---

# Phase 16: Foto do paciente Verification Report

**Phase Goal:** Na ficha e nas listas, a foto do paciente aceita PNG ou JPEG: o hover mostra um ícone de câmera e o clique abre a escolha do arquivo. Sem foto, continuam as iniciais.
**Verified:** 2026-09-24T00:55:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A private bucket `patient-avatars` accepts only `image/jpeg` and `image/png`, capped at 2097152 bytes. | ? UNCERTAIN | `sql/16-patient-photo.sql` inserts that bucket (`public=false`, limit 2097152, mime jpeg/png) with `ON CONFLICT DO NOTHING`. Not applied from this machine. |
| 2 | `patients.photo_path` is nullable. Null keeps initials and `photo_tone`. | ? UNCERTAIN | SQL adds nullable `photo_path` and a CHECK that allows null. Live column not proven. Client initials path is in `PatientAvatar` when `photoUrl` is absent. |
| 3 | Storage SELECT uses `can_read_patient`. INSERT and DELETE use `can_write_patient`. There is no UPDATE policy. | ? UNCERTAIN | SQL creates those three policies only, no UPDATE, `authenticated` only. Live policies not proven. |
| 4 | `patientPhotoSchema` accepts only jpeg and png. `imageUploadSchema` still allows WebP and PDF. | ✓ VERIFIED | `PATIENT_PHOTO_MIMES` is jpeg/png. `PATIENT_IMAGE_MIMES` still includes webp and pdf. |
| 5 | Without `photoUrl`, `PatientAvatar` still shows initials on `photo_tone`. | ✓ VERIFIED | Circle background is `avatarColor(tone)`. No photo renders `initials` or `initialsFromName`. |
| 6 | With `photoUrl`, the circle shows an `object-cover` image and falls back to initials if the image fails. | ✓ VERIFIED | `img` uses `object-cover`. `onError` sets `failedSrc` and the initials branch renders. |
| 7 | Only PNG and JPEG bytes are cropped. WebP, HEIC, PDF, GIF, and SVG are rejected before upload. | ✓ VERIFIED | `sniffMime` returns jpeg or png from magic bytes, else null. WebP and `ftyp` return null. `preparePatientPhoto` throws `Envie PNG ou JPEG.` |
| 8 | A PNG stays `image/png` so transparency still shows `photo_tone`. | ✓ VERIFIED | `canvas.toBlob(..., 'image/png')` with no quality argument. JPEG uses quality `0.85`. Avatar background stays behind the image. |
| 9 | Upload writes a new object in `patient-avatars` and then sets `patients.photo_path`. It never inserts a `patient_images` row. | ✓ VERIFIED | `upload` with `upsert: false`, then `update({ photo_path })`. No `patient_images` reference in the service. |
| 10 | Remove sets `photo_path` null before deleting the object. | ✓ VERIFIED | `removePatientPhoto` updates `photo_path` to null, then `storage.remove`. |
| 11 | Signed URLs last 3600 seconds and are not written to Postgres. | ✓ VERIFIED | `SIGNED_URL_SECONDS = 3600`. `createSignedUrls` result stays in a `Map`. Postgres update writes only `photo_path`. |
| 12 | Photo mutations refresh patients, the ficha, calendar, and the board, and they do not refresh the gallery query. | ✓ VERIFIED | `invalidatePatientPhoto` invalidates `patients`, the ficha key, dashboard, `calendar-sessions`, and `board`. It does not invalidate `images`. |
| 13 | List, ficha, and dashboard patient reads select `photo_path` and return `photoUrl`. | ✓ VERIFIED | `DETAIL_SELECT`, `LIST_SELECT`, and `DASHBOARD_SELECT` include `photo_path`. Mappers call `signPatientPhotoUrls` and `photoUrlFrom`. |
| 14 | Calendar sessions and board cards select `photo_path` from the patients embed and return `photoUrl`. | ✓ VERIFIED | Embeds include `photo_path`. Both services sign and map `photoUrl`. |
| 15 | A null path yields `photoUrl` null and leaves `photoTone` unchanged. | ✓ VERIFIED | `photoUrlFrom` returns null when path is empty. `photoTone` still comes from `photo_tone`. |
| 16 | Kanban, agenda, and the dashboard can show the same photo the ficha saved. | ✓ VERIFIED | `KanbanPage`, `CalendarPage`, and `DashboardPage` pass `photoUrl` into `PatientAvatar`. Live image depends on the bucket paste. |
| 17 | On the ficha and the patient list, hover or focus shows a camera and click opens a PNG/JPEG file picker. | ✓ VERIFIED | `PatientPhotoControl` label uses `group-hover/photo` and `group-focus-within/photo`, a `Camera` icon, and `<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg">`. Change calls `preparePatientPhoto` then `useUploadPatientPhoto`. Visual hover is still a human check. |
| 18 | Consulta mode shows the photo or the initials and no camera. | ✓ VERIFIED | `PatientProfileHeader` and `PatientsPage` render `PatientAvatar` when `canWrite` is false. `PatientPage` sets `canWrite` from `canWritePatient`. |
| 19 | Choosing a file on the list does not navigate to the ficha. | ✓ VERIFIED | Mobile: control is a sibling of the `Link`. Desktop: wrapper `stopPropagation` on click and keydown. |
| 20 | Remover foto exists only on the ficha, in the name row after the status pill, confirms with Voltar, and restores initials. | ✓ VERIFIED | `PatientPhotoRemoveButton` is only mounted in `PatientProfileHeader` after the status pill, when `canWrite`. Confirm copy uses cancel label `Voltar`. Button unmounts when `photoUrl` is null. |
| 21 | Quadro, agenda, próximas sessões, and the clinical shortcut show the saved photo. | ✓ VERIFIED | All four pass `photoUrl` into `PatientAvatar`. Dashboard upcoming map copies `session.photoUrl`. |
| 22 | Those surfaces do not show a camera and do not open a file picker. | ✓ VERIFIED | No `PatientPhotoControl`, `Camera`, or `type="file"` on `KanbanPage`, `CalendarPage`, `DashboardPage`, or `DashboardClinicalShortcut`. |
| 23 | Without a photo they still show initials on `photo_tone`. | ✓ VERIFIED | Same `PatientAvatar` initials branch. |

**Score:** 20/23 truths verified

Truths 1–3 are uncertain because the database was not changed from this machine. They are not missing code. No later phase covers them.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` | Idempotent bucket, column, CHECK, and storage policies | ✓ VERIFIED | Contains `patient-avatars`, `can_read_patient`, `can_write_patient`, no UPDATE policy. Not executed here. |
| `src/schemas/patient.schema.ts` | `patientPhotoSchema` separate from the gallery schema | ✓ VERIFIED | Both schemas present and distinct. |
| `src/lib/cropPatientPhoto.ts` | Magic-byte sniff and 512 center crop | ✓ VERIFIED | Exports `preparePatientPhoto`. Crop edge 512. |
| `src/components/ui/PatientAvatar.tsx` | Optional photo on the existing circle | ✓ VERIFIED | `photoUrl` prop, wired at every avatar call site checked. |
| `src/services/patientPhoto.service.ts` | Upload, remove, and batch sign | ✓ VERIFIED | Exports `uploadPatientPhoto`, `removePatientPhoto`, `signPatientPhotoUrls`. |
| `src/hooks/usePatients.ts` | Upload and remove mutations | ✓ VERIFIED | `useUploadPatientPhoto` toasts `Foto atualizada.` |
| `src/types/patient.ts` | `photoUrl` on patient DTOs | ✓ VERIFIED | `PatientListItem`, `Patient`, and `PatientDashboard`. |
| `src/services/patients.service.ts` | `photo_path` on selects and `photoUrl` on mappers | ✓ VERIFIED | Detail, list, and dashboard. |
| `src/services/calendar.service.ts` | `photoUrl` on `CalendarSession` | ✓ VERIFIED | Embed includes `photo_path`. |
| `src/services/board.service.ts` | `photoUrl` on board cards | ✓ VERIFIED | Cards and due cards. |
| `src/components/patients/PatientPhotoControl.tsx` | Label, camera overlay, file input, remove export | ✓ VERIFIED | `PatientPhotoRemoveButton` exported and used. |
| `src/components/patients/PatientProfileHeader.tsx` | Editable avatar and Remover foto after the status pill | ✓ VERIFIED | Control when `canWrite`; remove button in the name row. |
| `src/pages/PatientsPage.tsx` | Sibling photo control on writable rows | ✓ VERIFIED | `canWritePatient` plus `stopPropagation` on the table. |
| `src/pages/KanbanPage.tsx` | Display-only avatar | ✓ VERIFIED | `photoUrl={card.photoUrl}` |
| `src/pages/CalendarPage.tsx` | Display-only avatars | ✓ VERIFIED | Due cards and sessions. |
| `src/pages/DashboardPage.tsx` | `photoUrl` on próximas sessões | ✓ VERIFIED | Upcoming map and `PatientAvatar`. |
| `src/components/patients/DashboardClinicalShortcut.tsx` | Display-only avatar | ✓ VERIFIED | `photoUrl={patient.photoUrl}` |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `sql/16-patient-photo.sql` | `private.can_read_patient` | SELECT policy on `patient-avatars` | ✓ WIRED | Pattern `can_read_patient` in the SELECT policy. Live apply pending. |
| `src/schemas/patient.schema.ts` | `patientPhotoSchema` | `z.enum` of jpeg and png | ✓ WIRED | `z.enum(PATIENT_PHOTO_MIMES)` |
| `PatientAvatar.tsx` | `src/lib/avatar.ts` | `avatarColor(tone)` | ✓ WIRED | Background style uses `avatarColor`. |
| `cropPatientPhoto.ts` | `canvas.toBlob` | png without quality, jpeg at 0.85 | ✓ WIRED | `canvasToBlob` |
| `usePatients.ts` | `patientPhoto.service.ts` | `useMutation` `mutationFn` | ✓ WIRED | `uploadPatientPhoto` and `removePatientPhoto` |
| `patientPhoto.service.ts` | `patient-avatars` | `storage.from` upload, `upsert: false` | ✓ WIRED | Bucket constant and upload options. |
| `patients.service.ts` | `patientPhoto.service.ts` | `signPatientPhotoUrls` | ✓ WIRED | List, detail, and dashboard. |
| `calendar.service.ts` | patients embed | `photo_tone, photo_path` | ✓ WIRED | Select string includes both. |
| `PatientPhotoControl.tsx` | `cropPatientPhoto.ts` | `preparePatientPhoto` before upload | ✓ WIRED | `onPhotoChange` |
| `PatientsPage.tsx` | `accountAccess.ts` | `canWritePatient` | ✓ WIRED | Both list layouts. |
| `PatientProfileHeader.tsx` | `PatientPhotoControl.tsx` | `PatientPhotoRemoveButton` after the status pill | ✓ WIRED | Inside `flex-wrap items-center gap-2`. |
| `DashboardPage.tsx` | `CalendarSession.photoUrl` | upcoming item map | ✓ WIRED | `photoUrl: session.photoUrl` |
| `KanbanPage.tsx` | `BoardCard.photoUrl` | `PatientAvatar` prop | ✓ WIRED | `photoUrl={card.photoUrl}` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `PatientAvatar` | `photoUrl` | Parent prop | Yes, when the parent mapper signed a path | ✓ FLOWING |
| `PatientPhotoControl` | `photoUrl` | `PatientProfileHeader` / `PatientsPage` from patient DTO | Signed URL from `signPatientPhotoUrls`, null when `photo_path` is null | ✓ FLOWING |
| `patients.service.ts` mappers | `photoUrl` | `patients.photo_path` then `createSignedUrls` | Real storage sign; empty map when no paths | ✓ FLOWING |
| `calendar.service.ts` | `photoUrl` | patients embed `photo_path` | Same sign helper | ✓ FLOWING |
| `board.service.ts` | `photoUrl` | patients embed `photo_path` | Same sign helper | ✓ FLOWING |
| Dashboard upcoming | `photoUrl` | `session.photoUrl` from calendar sessions | Not hardcoded empty | ✓ FLOWING |

The sign call returns real URLs only after the bucket exists and an object is stored. That live step is the human check, not a hollow prop.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Photo schema is jpeg/png only; gallery schema still allows WebP and PDF | Read `src/schemas/patient.schema.ts` | `PATIENT_PHOTO_MIMES` jpeg/png; `PATIENT_IMAGE_MIMES` includes webp and pdf | ✓ PASS |
| Ficha and list open a PNG/JPEG picker through the crop gate | Read `PatientPhotoControl.tsx` | `accept="image/png,image/jpeg,.png,.jpg,.jpeg"` then `preparePatientPhoto` then `upload.mutate` | ✓ PASS |
| Display surfaces have no file input | Grep Kanban, Calendar, Dashboard, shortcut | No `type="file"`, no `Camera`, no `PatientPhotoControl` | ✓ PASS |
| Live upload against Supabase | Not run | SQL not applied from this machine; no server started | ? SKIP |

### Probe Execution

No phase probe is declared. Step 7c skipped.

### Requirements Coverage

No requirement IDs are assigned to this phase (`requirements: []` on every plan; roadmap says TBD). Not treated as a failure.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/components/patients/PatientPhotoControl.tsx` | 17 | `showRemove` is declared and passed as `false`, and the component does not read it | ℹ️ Info | Remove is a separate button on the ficha. The unused prop does not hide the camera or the picker. |
| `src/schemas/patient.schema.ts` | 211 | `MAX_PATIENT_PHOTO_BYTES` is 8 MB while the bucket limit is 2 MB | ℹ️ Info | Crop rejects output over 2 MB, and `uploadPatientPhoto` rejects blobs over 2 MB before upload. |

No `TBD`, `FIXME`, or `XXX` markers in the phase source files.

### Human Verification Required

### 1. Apply the patient photo SQL

**Test:** Paste `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` into the Supabase SQL Editor and run it once. Confirm the checks listed at the bottom of that file.
**Expected:** Private bucket `patient-avatars` (2097152 bytes, jpeg and png only), nullable `patients.photo_path`, SELECT via `can_read_patient`, INSERT and DELETE via `can_write_patient`, no UPDATE policy.
**Why human:** The script is for the operator. It was not applied from this machine. This report does not claim the bucket exists in the project.

### 2. Hover, picker, and initials

**Test:** On the ficha and the patient list, hover the circle and click it. Try a PNG, a JPEG, and a non-image. Look at a patient with no photo, and at consulta mode.
**Expected:** Hover shows the camera. Click opens the file chooser. PNG or JPEG replaces the initials. Anything else toasts `Envie PNG ou JPEG.` and leaves the circle. No photo keeps the initials. Consulta mode has no camera. Remover foto is only on the ficha, after the status pill, and Voltar cancels.
**Why human:** Hover and the operating-system file dialog are not visible from a static read.

### 3. Same photo on the other screens

**Test:** After a successful upload, open quadro, agenda, próximas sessões, and the clinical shortcut.
**Expected:** The same photo. No camera and no file picker. Initials when there is no photo.
**Why human:** A signed URL needs the applied bucket and a stored object.

### Gaps Summary

No code gap blocks the phase goal. The ficha and the patient list wire a camera overlay and a PNG/JPEG picker into `preparePatientPhoto` and `uploadPatientPhoto`. Missing photos still render initials. Quadro, agenda, painel, and the shortcut only display `photoUrl`.

The three uncertain truths are the live Supabase objects in `16-patient-photo.sql`. `16-USER-SETUP.md` still marks that paste incomplete. Until someone runs it, upload and signed URLs cannot succeed. That is a human check, not a missing implementation.

---

_Verified: 2026-09-24T00:55:00Z_
_Verifier: Claude (gsd-verifier)_
