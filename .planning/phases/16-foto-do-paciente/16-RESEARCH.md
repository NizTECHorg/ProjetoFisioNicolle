# Phase 16: Foto do paciente - Research

**Researched:** 2026-09-23
**Domain:** Patient avatar photo (private Supabase Storage + existing `PatientAvatar`)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** O alvo é a foto do paciente, hoje as iniciais em `PatientAvatar`. Sem arquivo, as iniciais e a cor (`photo_tone`) continuam.
- **D-02:** Hover na foto mostra um ícone de câmera.
- **D-03:** Clique na foto (ou no ícone) abre a escolha de arquivo.
- **D-04:** Só **PNG** e **JPEG**. Outro tipo não é gravado.

### Claude's Discretion
- Em quais telas o avatar editável aparece (ficha, lista, quadro), desde que a mesma foto persistida apareça onde o avatar do paciente já é desenhado.
- Tamanho máximo, recorte quadrado e caminho no Storage, reusando o padrão de upload da galeria só onde couber.
- Quem pode trocar a foto segue quem já pode editar o paciente.
- Remover a foto e voltar às iniciais, se o fluxo ficar simples.

### Deferred Ideas (OUT OF SCOPE)
- WebP, HEIC, PDF e captura pela câmera do aparelho
- Foto na aba Imagens no lugar do avatar
- Editor de recorte avançado
</user_constraints>

<phase_requirements>
## Phase Requirements

No requirement IDs exist yet. `.planning/REQUIREMENTS.md` has no photo or avatar entries. ROADMAP marks Phase 16 **Requirements: TBD**. Do not invent a REQ id in `REQUIREMENTS.md` or in plans.
</phase_requirements>

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` does not exist. No rule-file directives to copy.

These codebase conventions are binding for the planner (`.planning/codebase/CONVENTIONS.md`, `.planning/codebase/ARCHITECTURE.md`):

- Page → hook → service → Supabase. Components do not call `supabase`.
- Named exports, single quotes, no semicolons, 2-space indent, class names with `[...].join(' ')` (no `clsx`).
- Type-only imports (`verbatimModuleSyntax`). DB rows stay as local snake_case interfaces in the service. App DTOs are camelCase.
- SQL is pasted in the Supabase SQL Editor. Do not use `supabase db push`. Commit the script under `.planning/phases/16-foto-do-paciente/sql/`. Do not rewrite `private.can_read_patient` / `private.can_write_patient`.
- `canWritePatient` is UX only. RLS is the authority. Hide the control when the viewer cannot write; do not disable it.
- `mapDbError` / storage errors must not surface raw `error.message`.
- `src/types/database.types.ts` has no `patients` table. The clinic client is `SupabaseClient<any>` in `src/lib/supabase/client.ts`. Do not regenerate that bakery types file for this column.
- Do not add a test framework. Gate with `npm run lint` and `npm run typecheck`.

## Summary

The avatar is still a colored circle of initials. `PatientAvatar` takes `name`, `tone` (`photo_tone`), and optional `initials`. Nothing in `patients` stores a file. The clinical gallery already uploads to a private bucket, but that path is the wrong store for this photo: `patient-images` allows WebP and PDF, rows show up on the Imagens tab, and there is no Storage UPDATE policy because Phase 7 forbids upsert.

Keep the gallery untouched. Add a nullable `patients.photo_path`, a separate private bucket that allows only `image/jpeg` and `image/png`, and a small service that center-crops in the browser, uploads a new object path (no upsert), then points the column at it. Signed URLs are created in the service, the same way the gallery does, and passed into `PatientAvatar` as an optional image. No file means initials on `photo_tone`, unchanged.

The camera hover and the file picker go on the ficha header and the patient list, and only when `canWritePatient` is true. Kanban, calendar, dashboard, and the clinical shortcut only display the same photo. Removing the photo is a confirm on the ficha header, then the initials return everywhere.

**Primary recommendation:** New private bucket `patient-avatars` plus `patients.photo_path`; render the signed URL in `PatientAvatar`; edit only on the ficha and the patient list; never insert a `patient_images` row and never reuse `imageUploadSchema`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Camera hover and file picker | Browser / Client | — | `<input type="file">` and CSS. No server round-trip until a file is chosen. |
| MIME, size, magic-byte, square crop | Browser / Client | Database / Storage | Reject WebP/HEIC/PDF before upload. Bucket allow-list is the backstop for the declared `Content-Type` and byte size. |
| Who may change the photo | Database / Storage | Browser / Client | `private.can_write_patient` on `patients` UPDATE and on storage INSERT/DELETE. `canWritePatient` only hides the control. |
| Who may see the photo | Database / Storage | — | `private.can_read_patient` on the row and on `storage.objects` SELECT. Empresa consulta sees the photo and cannot change it. |
| Persist the pointer | Database / Storage | — | `patients.photo_path` (null = initials). Do not store the signed URL. |
| Persist the bytes | Database / Storage | — | Private bucket `patient-avatars`. Not the gallery table. |
| Show the photo on every existing avatar | Browser / Client | API / Backend | Services batch-sign paths and return `photoUrl`. `PatientAvatar` only renders. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.110.7 installed (`package.json` `^2.49.8`) | `storage.upload`, `createSignedUrls`, `remove`; `patients` update | Already the gallery client. [VERIFIED: node_modules package.json] [CITED: supabase.com/docs/guides/storage/uploads/standard-uploads] |
| `zod` | `^3.25.28` (already installed) | PNG/JPEG + byte-size schema, separate from the gallery schema | Same validation style as `imageUploadSchema`, with a tighter enum. |
| `lucide-react` | `^1.25.0` (already installed; `Camera` export present) | Hover icon | [VERIFIED: `import('lucide-react')` exposes `Camera`] |
| Browser `createImageBitmap` + `canvas.toBlob` | Baseline since 2021 | Center-square crop to 512px | Already used by `src/lib/compressImage.ts`. [CITED: developer.mozilla.org/en-US/docs/Web/API/createImageBitmap] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | `^5.76.1` (already installed) | Invalidate `['patients']`, dashboard, `['calendar-sessions']`, `['board']` after upload or remove | Existing patient mutations already do this in `src/hooks/usePatients.ts`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New bucket `patient-avatars` | Reuse `patient-images` | Gallery bucket allow-list is jpeg/png/**webp/pdf** (`15-patient-images-pdf.sql`). A WebP would pass the bucket even if the avatar UI rejected it. Gallery policies have no UPDATE, and a `patient_images` row would appear on the Imagens tab. Out of scope. |
| New object path per save | `upsert: true` on `avatar.jpg` | Official upload guide: overwrite returns `400 Asset Already Exists` unless `upsert: true`, and upsert needs SELECT + INSERT + UPDATE policies. Docs also warn that overwrite leaves stale CDN bytes. [CITED: supabase.com/docs/guides/storage/uploads/standard-uploads] [CITED: supabase.com/docs/guides/storage/security/access-control] |
| `image/*` or `capture` | Explicit `image/png,image/jpeg` | `image/*` makes many phones offer the camera. `capture` is the Phase 7 "Tirar foto" behavior. Both are out of scope. [CITED: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file] |
| Crop library / Uppy / `file-type` | Canvas + a 16-byte sniff | CONTEXT defers the advanced crop editor. Phase 7 already forbids new upload packages. |

**Installation:**

```bash
# no new packages
```

**Version verification:** `@supabase/supabase-js` resolved to 2.110.7 in `node_modules`. `lucide-react` `Camera` is a function export. No registry install.

## Package Legitimacy Audit

This phase installs no external packages. slopcheck was not run. Do not add `browser-image-compression`, `react-easy-crop`, `heic2any`, Uppy, or `file-type`.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
[Ficha header or patient list, canWrite]
        |
        | hover: Camera icon
        | click: <input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg">
        v
[Browser gate]
  extension + file.type + magic bytes (JPEG FF D8 FF / PNG 89 50 4E 47)
  reject webp, heic, pdf, gif, svg, empty, > 8 MiB
        |
        v
[createImageBitmap + canvas]
  center square, 512px, keep PNG or JPEG
        |
        v
[patientPhoto.service]
  upload patient-avatars/{patientId}/{uuid}.jpg|png  (upsert: false)
  update patients.photo_path
  on DB failure: storage.remove(new path)
  on success: storage.remove(previous path) best-effort
        |
        v
[patients.photo_path]  ----null----> initials + photo_tone
        |
        v
[createSignedUrls, 3600s, SELECT RLS]
        |
        v
PatientAvatar img   (ficha, list, kanban, calendar, dashboard, shortcut)
```

Read-only surfaces skip the input. They still receive `photoUrl`.

### Recommended Project Structure

```text
src/
├── components/ui/PatientAvatar.tsx          # optional photoUrl; initials when absent
├── components/patients/PatientPhotoControl.tsx  # label + hidden file input + camera overlay
├── lib/cropPatientPhoto.ts                  # sniff + center crop (not the gallery thumb helper)
├── schemas/patient.schema.ts                # patientPhotoSchema only; do not loosen imageUploadSchema
├── services/patientPhoto.service.ts         # upload, remove, sign paths
├── services/patients.service.ts             # select photo_path; attach photoUrl
├── services/calendar.service.ts             # embed photo_path; sign
├── services/board.service.ts                # embed photo_path; sign
└── hooks/usePatients.ts                     # useUploadPatientPhoto / useRemovePatientPhoto

.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql
```

Write plans against `.planning/phases/16-foto-do-paciente/` only. Ignore the stray `.planning/phases/16-foto-do-paciente-com-hover-de-c-mera-e-envio-de-png-ou-jpeg/` gitkeep.

### Pattern 1: Presentational avatar, editable wrapper

**What:** `PatientAvatar` paints either an `<img>` or the initials. It does not open a file dialog. `PatientPhotoControl` wraps it when `canWrite` is true.

**When to use:** Ficha header (`PatientProfileHeader`, size `lg`) and both layouts on `PatientsPage` (size `md`). Pass `patientId` and `createdBy` so the wrapper can call `canWritePatient`.

**Example:**

```tsx
// Display everywhere. photoUrl null keeps D-01.
export function PatientAvatar({ name, tone, initials, photoUrl, size = 'md', className = '' }: PatientAvatarProps) {
  const classes = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${sizes[size]} ${className}`
  return (
    <span className={classes} style={{ backgroundColor: avatarColor(tone) }}>
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials || initialsFromName(name)
      )}
    </span>
  )
}
```

`alt=""` because the patient name is already next to the avatar (list, kanban, header `h1`). Do not announce the name twice.

Editable wrapper: a `<label className="group/photo relative">` around the avatar, overlay `pointer-events-none absolute inset-0 hidden ... group-hover/photo:flex group-focus-within/photo:flex`, Lucide `Camera`, and a visually hidden file input. Use `group/photo`, not bare `group`. The ficha header grid is already `group`; a bare `group-hover` would show the camera when the pointer is on the name or the tabs.

```html
<input
  type="file"
  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
  className="sr-only"
/>
```

Do not set `capture`. Do not set `multiple`. Do not use `accept="image/*"`. [CITED: MDN file input — `image/*` offers the camera on many phones; `accept` is a hint and can be overridden, so validate the `File`.]

After `change`, set `input.value = ''` so the same file can be chosen again.

### Pattern 2: Where the control is editable

**What:** Same persisted photo on every current `PatientAvatar`. The picker only where a click today means "this patient" and the viewer is the author.

| Surface | File | Editable? |
|---------|------|-----------|
| Ficha header | `PatientProfileHeader` via `PatientPage` (`canWrite` already computed) | Yes, if `canWrite` |
| Patient list, mobile `<Link>` and desktop `<tr onClick>` | `PatientsPage` | Yes, if `canWritePatient(user.id, patient.createdBy)` |
| Kanban card (`draggable`, `group/card`) | `KanbanPage` | No — display only |
| Calendar cards | `CalendarPage` | No — display only |
| Dashboard "Próximas sessões" | `DashboardPage` | No — display only |
| Clinical shortcut modal rows are `<button>` | `DashboardClinicalShortcut` | No — display only |

**List click pitfall:** The mobile row is a `<Link>`. A `<label>` / file input inside an `<a>` is invalid and the click navigates away. Render the photo control as a **sibling** of the link, and `stopPropagation` on the desktop row so the row `onClick` does not open the ficha. Same rule if a future row stays a single click target.

### Pattern 3: Store and replace

**What:** One pointer column. A new object per successful save. Gallery code is the template for private bucket, signed URLs, path-under-patient-uuid, and compensating `storage.remove` — not the template for MIME or table.

**Column:** `patients.photo_path text null`. Null keeps initials. Do not clear `photo_tone` when a photo exists; the tone stays the background behind a transparent PNG.

**Path:** `{patientId}/{crypto.randomUUID()}.jpg` or `.png`. Lowercase. `crypto.randomUUID()` is already lowercase. Folder must equal `patients.id`.

**Bucket:** id `patient-avatars`, `public = false`, `file_size_limit = 2097152` (2 MiB, the cropped blob), `allowed_mime_types = {image/jpeg, image/png}` only. `ON CONFLICT (id) DO NOTHING`, same comment as Phase 7: if a public leftover reused the id, fix it in the Dashboard, do not blindly `UPDATE` it to private.

**Policies on `storage.objects` only for this `bucket_id`:** SELECT `can_read_patient(folder uuid)`, INSERT and DELETE `can_write_patient(folder uuid)`. No UPDATE policy. Name must match `^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png)$`. Validate the folder with the uuid regex **before** `::uuid` (Phase 7 pitfall). Do not drop `patient_images_storage_*` policies.

**Replace sequence:**

1. Crop and sniff.
2. `upload` with `contentType` set and `upsert: false`. [CITED: standard uploads — pass `contentType`; default behavior on an existing path is `400`.]
3. `update patients set photo_path = new path where id = patientId`. Existing `patients_update` already is `using` / `with check` `can_write_patient(id)` (`.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`). No new patients policy.
4. If the update fails, `remove` the new object (gallery `insertImageRow` does the same).
5. If it succeeds and the previous path differs, `remove` the old object. Failure here is an orphan file, not a broken avatar.

**Remove (ficha only):** Confirm with the existing `ConfirmDialog`. Set `photo_path` null first, then `remove` the object. A failed delete leaves an orphan; a deleted object with the pointer still set leaves a broken image. Initials must win. Do not put a second control on list rows, kanban, or calendar.

**Sign:** `createSignedUrls(paths, 3600)`. Requires `storage.objects` SELECT. [CITED: supabase.com/docs/reference/javascript/storage-from-createsignedurls]. Dedupe paths. Attach `photoUrl: string | null` on `PatientListItem`, `Patient`, `PatientDashboard`, calendar session DTOs, and board card DTOs. Never write the URL into Postgres.

Column lists that must grow `photo_path` (explicit selects ignore new columns until listed):

- `DETAIL_COLUMNS`, `LIST_COLUMNS`, `DASHBOARD_COLUMNS` in `src/services/patients.service.ts`
- `patients(full_name, code, photo_tone)` in `src/services/calendar.service.ts`
- `patients(full_name, photo_tone)` in both selects in `src/services/board.service.ts`

Invalidate `['patients']`, `['patients', id]`, `['patients', id, 'dashboard']`, `['calendar-sessions']`, and `['board']`. Do not invalidate `['patients', id, 'images']` for an avatar change; the gallery did not change.

`staleTime` for patients is 60s (`usePatients.ts`) and the global default in `src/main.tsx` is 60s. Signed URLs last 3600s, so a refetch renews them before expiry in normal use.

### Pattern 4: Square crop without a crop editor

**What:** Center crop, then scale to 512×512. This is the discretion "recorte quadrado". It is not the deferred advanced editor.

**When to use:** Every accepted file, before upload.

Keep the source type: PNG → `toBlob(..., 'image/png')`, JPEG → `toBlob(..., 'image/jpeg', 0.85)`. Do not run the file through `compressImageForThumb`. That helper always emits JPEG, does not center-crop, and is the gallery thumbnail.

`createImageBitmap(file)` defaults to `imageOrientation: 'from-image'` (EXIF). [CITED: MDN `createImageBitmap`]. Then `drawImage` the center square onto a 512 canvas. Call `bitmap.close()`.

Reject the original `File` when `file.size > 8 * 1024 * 1024` **before** decode. Reject the cropped `Blob` when `blob.size > 2 * 1024 * 1024` before upload.

### Anti-Patterns to Avoid

- **Avatar row in `patient_images`:** it shows on the Imagens tab and must satisfy the gallery path check (`{patientUuid}/{imageUuid}.jpg|png|webp|pdf`).
- **Reusing `imageUploadSchema` or `mapStorageError` for user-facing copy:** both tell the user that WebP and PDF are valid and that the cap is 8 MB (`src/schemas/patient.schema.ts`, `src/lib/security/index.ts`). Avatar copy is only "PNG ou JPEG".
- **`upsert: true`:** needs an UPDATE policy this project has deliberately not used for images, and the CDN can serve the previous bytes. [CITED: standard uploads]
- **Public bucket or `getPublicUrl`:** the Supabase "avatars" sample is public. This photo is clinical. `patient-images` is private. CSP `img-src 'self' data: https:` already allows the signed Supabase URL (`index.html`, `netlify.toml`). Do not widen CSP.
- **Storage image transformations:** gallery uses them only as a thumb fallback (`signedTransformUrl`). Do not depend on them for the avatar. The cropped original is what `<img>` shows.
- **`accept="image/*"` or `capture`:** camera sheet / live capture. Out of scope.
- **Bare `group-hover` on the ficha:** the header wrapper is already `group`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Private upload, signed URL, delete | Custom multipart or a public URL column | `supabase.storage` from the existing client | RLS, expiry, content-type. [CITED: Storage access control + createSignedUrls] |
| Authorization | A new role check | `private.can_read_patient` / `private.can_write_patient` and `canWritePatient` | Phase 3 helpers. Empresa consulta already reads and must not write. |
| Square thumbnail | `react-easy-crop` or a modal editor | `createImageBitmap` + canvas, same family as `compressImage.ts` | Advanced editor is deferred. |
| File-type detection | `file-type` package | 16-byte sniff for JPEG, PNG, and reject RIFF/WEBP and `ftyp` | WebP renamed to `.jpg` still decodes in the browser. Decode success is not a MIME check. |
| HEIC conversion | `heic2any` | Reject with a toast | Deferred. |
| Tests | Vitest | `npm run lint` and `npm run typecheck` | Project has no test runner. TESTING.md even says not to mock RLS. |

**Key insight:** The gallery already solved private storage. The avatar fails if it joins that pipeline, because the gallery's product rules (WebP, PDF, no upsert, rows on the Imagens tab) contradict D-04 and the phase boundary.

## Common Pitfalls

### Pitfall 1: WebP sneaks in through the gallery stack
**What goes wrong:** Avatar upload calls `uploadPatientImage` or `imageUploadSchema`, or the file lands in `patient-images`.
**Why it happens:** That service is the only image upload in the repo, and it allows `image/webp` and `application/pdf`.
**How to avoid:** New schema, new bucket, new service. Gallery `accept` strings stay as they are.
**Warning signs:** A new card on the Imagens tab after a profile photo save, or a toast that mentions WebP or PDF.

### Pitfall 2: `accept` is not validation
**What goes wrong:** HEIC, WebP, or PDF is stored.
**Why it happens:** MDN: the file chooser can be switched to all files; `file.type` is often empty; a renamed WebP still decodes.
**How to avoid:** Allow only `.png`, `.jpg`, `.jpeg` when `file.type` is empty. Sniff bytes. JPEG is `FF D8 FF`. PNG is `89 50 4E 47`. Reject `RIFF`…`WEBP` and `ftyp` (HEIC/HEIF). Then set `contentType` on upload so the bucket allow-list sees `image/jpeg` or `image/png`. [CITED: MDN file input; CITED: bucket `allowedMimeTypes` rejects the request]
**Warning signs:** Toast copy reused from `mapStorageError` ("Envie JPEG, PNG, WebP ou PDF").

### Pitfall 3: List click and kanban drag
**What goes wrong:** Choosing a photo navigates to the ficha, or a kanban card starts a drag and a file dialog.
**Why it happens:** Mobile patients are `<Link>`; desktop rows `navigate` on click; kanban cards are `draggable`.
**How to avoid:** Editable control is a sibling with `stopPropagation` on the list. Kanban, calendar, dashboard, and the shortcut stay display-only.
**Warning signs:** Hover camera on a card that is also `cursor-grab`.

### Pitfall 4: Hover camera on the whole header
**What goes wrong:** The camera appears while reading the patient name or the tabs.
**Why it happens:** `PatientProfileHeader` root grid has `className="... group ..."`.
**How to avoid:** `group/photo` and `group-hover/photo`.
**Warning signs:** Camera visible with the pointer far from the circle.

### Pitfall 5: Overwrite and stale images
**What goes wrong:** The second JPEG at `avatar.jpg` 400s, or the circle keeps the old image.
**Why it happens:** No UPDATE policy; CDN cache on upsert. [CITED: standard uploads]
**How to avoid:** New uuid path each save. Signed URL changes with the path.
**Warning signs:** An UPDATE policy added only for this bucket, or `upsert: true`.

### Pitfall 6: Signed URL stored or missing from a select
**What goes wrong:** Expired images, or initials everywhere except the ficha.
**Why it happens:** Column lists and embeds are explicit. `photo_path` not selected means the DTO never gets a URL.
**How to avoid:** Add `photo_path` to every select listed in Pattern 3. Sign in the service. `photoUrl` only on the DTO.
**Warning signs:** Kanban still initials after a ficha upload, with the network tab showing `patients(full_name, photo_tone)` and no `photo_path`.

### Pitfall 7: PNG flattened to black
**What goes wrong:** Transparent PNG becomes a black disc.
**Why it happens:** `compressImageForThumb` always uses `image/jpeg`.
**How to avoid:** PNG stays PNG. The circle's `backgroundColor` is `photo_tone`, so transparency still shows the tone (D-01).
**Warning signs:** Avatar JPEG path for a `.png` source.

### Pitfall 8: Touch has no hover
**What goes wrong:** The camera is the only hit target and it is `display: none` until hover, so a phone cannot upload.
**Why it happens:** Overlay hidden with `hidden` and only `group-hover` to show it.
**How to avoid:** The `<label>` is the full circle and is always clickable. The icon is decorative (`pointer-events-none`). Also show it on `group-focus-within/photo`. Do not `display: none` the input; `sr-only` keeps it in the accessibility tree (MDN warns that `display: none` / `visibility: hidden` hides it from assistive tech).
**Warning signs:** Upload works with a mouse and not with a tap.

### Pitfall 9: Patient delete orphans the object
**What goes wrong:** Bytes remain after the row is gone.
**Why it happens:** Storage is not FK-cascaded. The gallery has the same gap.
**How to avoid:** Do not build a cleanup trigger in this phase. Removing the photo in-app deletes the object. Document the orphan as accepted, same as Phase 7.

## Code Examples

### Upload (new path, explicit content type)

```javascript
// Source: https://supabase.com/docs/guides/storage/uploads/standard-uploads
const { error } = await supabase.storage.from('patient-avatars').upload(path, blob, {
  contentType: 'image/jpeg',
  upsert: false,
})
```

### Bucket restrictions

```javascript
// Source: https://supabase.com/docs/guides/storage/buckets/creating-buckets
// Apply the same limits in SQL (storage.buckets), not via the client createBucket call.
// public MUST be false. allowed MIME is image/jpeg and image/png only — not image/*.
```

SQL shape to paste (planner writes the full idempotent script):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-avatars',
  'patient-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png']::text[]
)
on conflict (id) do nothing;

alter table public.patients
  add column if not exists photo_path text;

-- CHECK: null, or "{id}/{uuid}.jpg|png" with the folder equal to patients.id.
-- Confirm split_part(photo_path, '/', 1) = id::text in the SQL Editor (A1).
```

### Signed URLs

```javascript
// Source: https://supabase.com/docs/reference/javascript/storage-from-createsignedurls
// Requires storage.objects SELECT. expiresIn is seconds.
const { data, error } = await supabase.storage
  .from('patient-avatars')
  .createSignedUrls(paths, 3600)
```

Match the gallery mapper in `signedUrlByPath` (`signedUrl` or `signedURL`, skip entries with `error`).

### Center crop

```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap
// imageOrientation defaults to "from-image" (EXIF).
const bitmap = await createImageBitmap(file)
const side = Math.min(bitmap.width, bitmap.height)
const sx = (bitmap.width - side) / 2
const sy = (bitmap.height - side) / 2
const canvas = document.createElement('canvas')
canvas.width = 512
canvas.height = 512
const ctx = canvas.getContext('2d')
ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 512, 512)
bitmap.close()
const blob = await new Promise((resolve, reject) => {
  canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('crop'))), 'image/jpeg', 0.85)
})
```

Use `'image/png'` with no quality argument when the sniffed type is PNG.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Initials only (`PatientAvatar`) | Optional signed image on the same circle; initials when `photo_path` is null | This phase | D-01 |
| Gallery upsert avoided; unique path per image | Same for the avatar: new uuid path, no UPDATE policy | Phase 7; restated in current Storage docs | Do not introduce upsert for the avatar |
| Public "avatars" bucket in Supabase samples | Private bucket + `createSignedUrls` | Already the clinic pattern | Do not copy the public sample |

**Deprecated/outdated:**

- Supabase docs sample `createBucket('avatars', { public: true, allowedMimeTypes: ['image/*'] })` is the wrong shape here. Private bucket, jpeg and png only.
- Overwriting one path is documented but discouraged because of CDN lag. Use a new path.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CHECK (photo_path is null OR (split_part(photo_path, '/', 1) = id::text AND photo_path ~ '{uuid}/{uuid}.jpg\|png'))` is valid on this Postgres | Architecture Pattern 3 | Script errors in the SQL Editor. Fix the constraint there. Do not ship a pointer that can name another patient's object. |
| A2 | A 512×512 PNG or JPEG at quality 0.85 fits in 2 MiB | Standard stack / crop | A pathological PNG is rejected client-side. Raise `file_size_limit` (and the client cap) to 4 MiB only if UAT hits it. Do not raise it to the gallery's 8 MiB by default. |

## Open Questions

1. **Requirement IDs**
   - What we know: ROADMAP says TBD. `REQUIREMENTS.md` has no photo requirement.
   - What's unclear: Nothing technical. Product IDs were intentionally not assigned.
   - Recommendation: Plan against D-01–D-04 and the discretion above. Do not invent a REQ id.

2. **Stray phase directory**
   - What we know: Init resolved the phase to `.planning/phases/16-foto-do-paciente/`. A second folder `16-foto-do-paciente-com-hover-de-c-mera-e-envio-de-png-ou-jpeg/` only has a gitkeep.
   - What's unclear: Nothing about the feature.
   - Recommendation: Plans and SQL go in `16-foto-do-paciente` only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | lint, typecheck, Vite | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| `@supabase/supabase-js` | upload + signed URLs | ✓ | 2.110.7 | — |
| Hosted Supabase Storage | bucket + RLS | ✓ in app code (Phase 7 `patient-images` already uploads) | — | Not probed live this session. If Storage is off, the SQL Editor insert fails the same way Phase 7 documented: enable Storage and re-run. |
| `createImageBitmap` / canvas | square crop | ✓ in current browsers | MDN baseline since Sep 2021 | `compressImage.ts` already falls back from `createImageBitmap` to `Image` + canvas. Reuse that fallback shape if bitmap throws. |
| Vitest | — | ✗ | — | Do not add it. `npm run lint` and `npm run typecheck`. |

**Missing dependencies with no fallback:**

- None for implementation. Applying `16-patient-photo.sql` is a human SQL Editor step, same as Phases 3 and 7.

**Missing dependencies with fallback:**

- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none — do not add Vitest or another runner |
| Config file | none |
| Quick run command | `npm run lint && npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` |

### Phase Requirements → Test Map

No REQ ids. Map the locked decisions. Automated commands only check that the TypeScript still compiles; behavior is manual because there is no test runner and RLS is not mocked.

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| D-01 | No `photo_path`: initials and `photo_tone` circle. With a URL: `object-cover` image, tone still the background | manual | `npm run typecheck` | ❌ no unit test — do not create one |
| D-02 | Hover (and keyboard focus) on an editable avatar shows `Camera`. Read-only avatars do not | manual | `npm run lint` | ❌ |
| D-03 | Click / tap opens the file picker. List navigation does not fire. Kanban does not open a picker | manual | `npm run typecheck` | ❌ |
| D-04 | PNG and JPEG save. WebP, HEIC, PDF, and a renamed WebP do not. Gallery MIME list unchanged | manual + SQL Editor for bucket allow-list | `npm run typecheck` | ❌ |
| Discretion | Remove on the ficha returns initials on list, kanban, calendar, dashboard | manual | `npm run typecheck` | ❌ |
| RLS | Author can upload and update `photo_path`. Empresa consulta can sign and see, cannot upload or update. Other user gets 42501 | manual SQL Editor | none — do not mock RLS | ❌ |

### Sampling Rate

- **Per task commit:** `npm run lint && npm run typecheck`
- **Per wave merge:** `npm run lint && npm run typecheck`
- **Phase gate:** Both commands green, plus the SQL Editor checks below, before `/gsd-verify-work`

### Wave 0 Gaps

- None to implement as test files. Do not add Vitest, `*.test.ts`, or a test script.
- Human SQL Editor checks to record in verification (not Wave 0 code):
  - [ ] Bucket `patient-avatars` is private, 2097152 bytes, mime jpeg/png only
  - [ ] `patients.photo_path` nullable; existing rows stay null
  - [ ] Author INSERT object + UPDATE `photo_path` succeeds
  - [ ] Author DELETE object after nulling `photo_path` succeeds
  - [ ] Empresa SELECT / `createSignedUrl` succeeds; INSERT and UPDATE fail (42501)
  - [ ] Upload `image/webp` or `image/heic` to this bucket fails
  - [ ] `patient_images` policies, gallery MIME, and `can_*` helpers unchanged

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing Supabase session. No new login flow. |
| V3 Session Management | yes | Signed URL expires in 3600s. Not stored. Anon has no policy. |
| V4 Access Control | yes | `patients_update` already uses `can_write_patient`. New storage policies use `can_read_patient` / `can_write_patient` on the folder uuid. UI hides the picker with `canWritePatient` (not sufficient alone). |
| V5 Input Validation | yes | New Zod schema: `image/jpeg` \| `image/png`, max 8 MiB before decode, 2 MiB after crop. Magic-byte sniff. Bucket `allowed_mime_types` + `file_size_limit`. Path CHECK. No SVG. |
| V6 Cryptography | no | Do not encrypt or sign URLs by hand. Supabase signs them. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public object URL for a clinical photo | Information disclosure | `public = false`. `createSignedUrls` only. Never `getPublicUrl`. |
| Upload into another patient's folder | Elevation / tampering | Storage policy: folder uuid passes `can_write_patient`. Column CHECK: folder equals `patients.id`. |
| WebP/PDF/SVG via gallery schema or `image/*` | Tampering | Separate bucket and schema. SVG excluded so it is not served as an image document. |
| Spoofed `Content-Type` | Tampering | Client sniff before upload. Bucket rejects a declared type outside jpeg/png. [CITED: creating buckets — request that misses `allowedMimeTypes` is rejected.] Byte-level sniffing inside Storage was not confirmed in the docs; do not claim the bucket inspects magic bytes. |
| File input inside a link (open redirect-style navigation away from the picker) | Tampering (UX) | Sibling control + `stopPropagation`. |
| Raw storage/DB errors | Information disclosure | Photo-specific Portuguese messages. Do not return `mapStorageError` gallery copy and do not return `error.message`. Permission failures still map to the existing "Você não tem permissão para esta ação." |
| Huge image decode | Denial of service | Reject `file.size > 8 MiB` before `createImageBitmap`. |

## Sources

### Primary (HIGH confidence)

- https://supabase.com/docs/guides/storage/uploads/standard-uploads — `upload`, `contentType`, `upsert`, `400 Asset Already Exists`, CDN stale on overwrite
- https://supabase.com/docs/guides/storage/security/access-control — INSERT for new objects; SELECT + INSERT + UPDATE required to upsert
- https://supabase.com/docs/guides/storage/buckets/creating-buckets — `allowedMimeTypes` and `fileSizeLimit` reject the upload
- https://supabase.com/docs/reference/javascript/storage-from-createsignedurls — `createSignedUrls(paths, expiresIn)`; SELECT on `storage.objects`
- https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap — crop rectangle; default `imageOrientation: from-image`
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file — `accept` is not validation; `image/*` offers camera; do not `display: none` the file input
- Repo: `src/components/ui/PatientAvatar.tsx`, `src/lib/avatar.ts`, `src/services/patientImages.service.ts`, `src/schemas/patient.schema.ts`, `src/lib/compressImage.ts`, `src/lib/security/index.ts`, `src/lib/accountAccess.ts`, `07-patient-images.sql`, `15-patient-images-pdf.sql`, `03-account-types-team.sql` (`patients_update`)

### Secondary (MEDIUM confidence)

- Installed `@supabase/supabase-js` 2.110.7 and `lucide-react` `Camera` export, checked in this session
- CSP `img-src https:` in `index.html` and `netlify.toml` already allows signed image URLs

### Tertiary (LOW confidence)

- None material. A1 (CHECK SQL) and A2 (2 MiB headroom) are flagged above rather than stated as fact.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new packages; Storage APIs checked against current Supabase docs and the installed client
- Architecture: HIGH — gallery vs avatar split is forced by the live MIME list, the Imagens tab, and the no-UPDATE storage policies
- Pitfalls: HIGH — list/`Link`, header `group`, and `mapStorageError` copy were read in the current source

**Research date:** 2026-09-23
**Valid until:** 2026-10-23
