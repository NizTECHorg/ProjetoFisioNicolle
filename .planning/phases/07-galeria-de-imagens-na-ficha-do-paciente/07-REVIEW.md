---
phase: 07-galeria-de-imagens-na-ficha-do-paciente
reviewed: 2026-09-15T02:50:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/types/patient.ts
  - src/schemas/patient.schema.ts
  - src/lib/security/index.ts
  - .planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql
  - src/services/patientImages.service.ts
  - src/hooks/usePatientImages.ts
  - src/hooks/usePatients.ts
  - src/components/patients/PatientProfileHeader.tsx
  - src/pages/PatientPage.tsx
  - src/components/patients/PatientImagesPanel.tsx
  - src/components/patients/PatientEvolutionsPanel.tsx
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-09-15T02:50:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the Phase 7 gallery stack from commits 07-01 through 07-05 (uncommitted working tree was unrelated Resumo/auth churn, not the gallery). CONTEXT D-01–D-12 was treated as winning over 07-UI-SPEC on lote, câmera, share, and “Sessão removida.” Hide-write, tab `imagens`, Evoluções D-08 copy, private bucket, and `session_removed` trigger are in place. Two ship-blockers remain: table RLS does not bind `storage_path` to `patient_id` (wrong-patient PHI on a writable ficha), and lote upload reports success while dropping per-file Storage/DB failures. SQL Editor already applied — CR-01 still needs a follow-up paste. Do not restyle `Button` / `Modal` / `ConfirmDialog`; panel-level fixes are enough for the stacked-modal warnings.

## Narrative Findings (AI reviewer)

Adversarial pass on contracts, service, hooks, SQL, and `PatientImagesPanel` write chrome (lote / câmera / share / edit / delete). Findings below.

## Critical Issues

### CR-01: `storage_path` is not bound to `patient_id`

**File:** `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql:56-57,94-127`
**Issue:** The path CHECK only requires `uuid/uuid.ext`. INSERT/UPDATE `WITH CHECK` verifies `can_write_patient(patient_id)` and session ownership, not that the folder UUID equals `patient_id`. `GRANT UPDATE` is table-wide, so `patient_id` / `storage_path` are mutable. `can_read_patient` is broader than write (empresa owner reads colleague fichas). A client that can write patient A and read patient B can INSERT/UPDATE a row on A whose `storage_path` points at B’s object; `createSignedUrls` then succeeds via Storage SELECT on B. Clinical photos land on the wrong ficha (LGPD mis-filing) without using the React UI.
**Fix:** Paste a follow-up SQL Editor script (do not `db push`):

```sql
alter table public.patient_images
  drop constraint if exists patient_images_path_matches_patient;
alter table public.patient_images
  add constraint patient_images_path_matches_patient
  check (split_part(storage_path, '/', 1) = patient_id::text);

revoke update on table public.patient_images from authenticated;
grant update (description, session_id, session_removed) on table public.patient_images to authenticated;
```

Also add `and split_part(storage_path, '/', 1) = patient_id::text` to INSERT/UPDATE `WITH CHECK` so PostgREST cannot drop the CHECK via a future table rewrite.

### CR-02: Lote upload hides Storage/DB failures when any file succeeds

**File:** `src/services/patientImages.service.ts:174-203`
**Issue:** D-04 toasts MIME/size in the panel, then `mutate`s only valids. Inside `uploadPatientImages`, each file that then fails Storage/INSERT is pushed to `failures` and skipped. If `successes.length > 0`, those errors are discarded and the hook toasts **Imagem adicionada** / **Imagens adicionadas** and `onSuccess` closes the modal (`PatientImagesPanel.tsx:308-311`, `usePatientImages.ts:37-41`). The clinician believes the whole lote is on the ficha; missing photos are silent data loss.
**Fix:** Surface partial failure without rolling back already-written objects:

```ts
if (successes.length === 0) {
  throw new Error(failures[0] ?? SAVE_FAILED)
}
if (failures.length > 0) {
  throw new Error(
    successes.length === 1
      ? `1 imagem foi salva. ${failures[0]}`
      : `${successes.length} imagens foram salvas. ${failures[0]}`,
  )
}
return successes
```

In `useUploadPatientImages`, still `invalidatePatient` on both success and this error (or return `{ uploaded, errors }` and toast both). Do not close the modal until remaining failures are visible.

## Warnings

### WR-01: Lightbox stays open under Edit / Confirm — Escape and scroll lock break

**File:** `src/components/patients/PatientImagesPanel.tsx:482-512,599-655`
**Issue:** Editar / Excluir from the lightbox leave `openId` set, so two `Modal`s (lightbox + edit, or lightbox + `ConfirmDialog`) mount at `z-[100]`. `Modal` registers Escape and sets `document.body.style.overflow = 'hidden'` per instance (`src/components/ui/Modal.tsx:15-26`). Escape fires every listener (lightbox closes with the dialog). Closing the top modal clears `overflow` while the lightbox is still open, so the ficha scrolls underneath. Do not restyle `Modal`; this is a panel stacking bug.
**Fix:** Close the lightbox before opening edit/delete:

```ts
function startEdit(image: PatientImage) {
  setOpenId(null)
  setEditing(image)
}
function startDelete(image: PatientImage) {
  setOpenId(null)
  setPendingDelete(image)
}
```

### WR-02: Voltar / Escape / backdrop do not abort an in-flight lote persist

**File:** `src/components/patients/PatientImagesPanel.tsx:253-258,515-519,582-588`
**Issue:** D-05: Voltar discards the lote and must not persist. The Voltar **button** is `disabled={uploadImages.isPending}`, but `Modal onClose={closeUpload}` is not gated. X, backdrop, and Escape still clear `lote` and close while `uploadPatientImages` keeps writing. The user can think they cancelled; toasts then announce **Imagens adicionadas**.
**Fix:**

```tsx
<Modal
  open={uploadOpen}
  title="Adicionar imagem"
  onClose={() => {
    if (uploadImages.isPending) return
    closeUpload()
  }}
>
```

### WR-03: `mapStorageError` treats any “not allowed” as a MIME/HEIC rejection

**File:** `src/lib/security/index.ts:254-274`
**Issue:** The MIME branch matches `message.includes('not allowed')` **before** the 42501/403 branch (which also lists `'not allowed'`). A Storage RLS/policy error whose text contains “not allowed” becomes **Envie JPEG, PNG ou WebP…** instead of **Você não tem permissão para esta ação.** Size errors that contain “maximum allowed size” are saved only because the size branch runs first.
**Fix:** Drop `'not allowed'` from the MIME branch; keep `mime`, `heic`, `heif`, `invalid content type`, `content-type`. Leave permission mapping on `42501` / `403` / `unauthorized` / `row-level security`.

### WR-04: Camera lote rejects JPEGs with empty or `image/jpg` types

**File:** `src/schemas/patient.schema.ts:219-228` and `src/components/patients/PatientImagesPanel.tsx:276-280,290-296`
**Issue:** D-01 **Tirar foto** feeds `file.type` into `imageUploadSchema` (`enum` of `image/jpeg|png|webp` only). Camera captures on some WebViews send `image/jpg` or `""`. D-04 then toasts the HEIC copy and drops the shot even when the bytes are JPEG. Consultório câmera is the path CONTEXT called out.
**Fix:** Normalize before `safeParse`:

```ts
function normalizeImageMime(file: File): string {
  if (file.type === 'image/jpg' || file.type === 'image/pjpeg') return 'image/jpeg'
  if (file.type) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  return file.type
}
```

### WR-05: Signed URLs last 1h with no refetch while the aba stays focused

**File:** `src/services/patientImages.service.ts:7,145-147` and `src/hooks/usePatientImages.ts:16-22`
**Issue:** `SIGNED_URL_SECONDS = 3600` and `staleTime: 30_000` with default React Query refetch-on-focus only. A ficha left on **Imagens** for more than an hour shows **Não foi possível mostrar a imagem.** and Compartilhar no-ops (`shareImage` requires `signedUrl`). RESEARCH Pitfall 8.
**Fix:** `refetchInterval: 45 * 60 * 1000` on `usePatientImages`, or remint signed URLs when `img.onError` fires.

### WR-06: Compartilhar can no-op with no toast

**File:** `src/components/patients/PatientImagesPanel.tsx:333-351,497-500`
**Issue:** D-12 shows **Compartilhar** when `canWrite` and `canShare({ files })` is true for a probe JPEG. `shareImage` then `return`s silently if `signedUrl` is null or `canShare` rejects the real blob (large file). The writer taps the button and nothing happens. AbortError is correctly ignored.
**Fix:** Toast the existing save-fail copy when `!image.signedUrl` or `canShare` is false after fetch; keep AbortError quiet. Optionally hide the button when `!openImage.signedUrl`.

## Info

### IN-01: `PatientImagesPanel` is a single ~480-line component

**File:** `src/components/patients/PatientImagesPanel.tsx:180-659`
**Issue:** Grid, lote modal, edit, lightbox, share, and delete live in one function. Harder to see the stacked-modal and pending-close bugs.
**Fix:** Extract `UploadImageModal`, `EditImageModal`, and `LoteThumbs` (same folder, named exports, no new primitives).

### IN-02: `created_by` is never written

**File:** `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql:51` and `src/services/patientImages.service.ts:110-120`
**Issue:** Column exists; INSERT omits it. Audit of who uploaded a clinical photo is empty.
**Fix:** Set `created_by: (await supabase.auth.getUser()).data.user?.id` on insert, or a `before insert` trigger with `auth.uid()`.

### IN-03: Row mapping uses `as ImageRow`

**File:** `src/services/patientImages.service.ts:129,141,223`
**Issue:** `data as ImageRow` skips a runtime shape check. A missing `session_removed` (partial SQL apply) becomes `undefined` and D-07 copy never shows.
**Fix:** Zod-parse the row (local schema) before `mapImageRow`.

---

_Reviewed: 2026-09-15T02:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
