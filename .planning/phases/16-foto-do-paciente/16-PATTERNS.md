# Phase 16: Foto do paciente - Pattern Map

**Mapped:** 2026-09-23
**Files analyzed:** 18
**Analogs found:** 18 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/patients/PatientPhotoControl.tsx` | component | file-I/O | `src/components/patients/PatientImagesPanel.tsx` + `src/pages/KanbanPage.tsx` | role-match |
| `src/lib/cropPatientPhoto.ts` | utility | transform | `src/lib/compressImage.ts` | exact |
| `src/services/patientPhoto.service.ts` | service | file-I/O | `src/services/patientImages.service.ts` | exact |
| `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` | migration | batch | `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql` | exact |
| `src/components/ui/PatientAvatar.tsx` | component | transform | `src/components/ui/PatientAvatar.tsx` | exact |
| `src/schemas/patient.schema.ts` | utility | transform | `imageUploadSchema` in the same file | role-match |
| `src/types/patient.ts` | model | CRUD | `PatientListItem` / `Patient` / `PatientDashboard` | exact |
| `src/services/patients.service.ts` | service | CRUD | same file + `signedUrlByPath` in `patientImages.service.ts` | exact |
| `src/services/calendar.service.ts` | service | CRUD | `listSessionsInRange` | exact |
| `src/services/board.service.ts` | service | CRUD | `listBoard` / `listDueCards` | exact |
| `src/hooks/usePatients.ts` | hook | request-response | `src/hooks/usePatientImages.ts` | role-match |
| `src/components/patients/PatientProfileHeader.tsx` | component | request-response | same file | exact |
| `src/pages/PatientPage.tsx` | component | request-response | same file (`canWrite` + header) | exact |
| `src/pages/PatientsPage.tsx` | component | request-response | same file (mobile `Link` + desktop `tr`) | exact |
| `src/pages/KanbanPage.tsx` | component | request-response | same file (display-only avatar) | exact |
| `src/pages/CalendarPage.tsx` | component | request-response | same file (display-only avatar) | exact |
| `src/pages/DashboardPage.tsx` | component | request-response | same file (upcoming sessions map) | exact |
| `src/components/patients/DashboardClinicalShortcut.tsx` | component | request-response | same file (row `button` + avatar) | exact |

No test files. Do not add Vitest. Gate with `npm run lint` and `npm run typecheck`.

## Pattern Assignments

### `src/components/patients/PatientPhotoControl.tsx` (component, file-I/O)

**Analog:** `src/components/patients/PatientImagesPanel.tsx` (file input) and `src/pages/KanbanPage.tsx` (named group overlay).

**Imports pattern** — gallery panel (`PatientImagesPanel.tsx` lines 7–16) plus Lucide `Camera` (already used as `ArrowLeft` in `PatientProfileHeader.tsx` line 3):

```tsx
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useDeletePatientImage,
  usePatientImages,
  useUpdatePatientImage,
  useUploadPatientImages,
} from '@/hooks/usePatientImages'
```

New control imports `PatientAvatar` from `@/components/ui/PatientAvatar`, `Camera` from `lucide-react`, and the new photo hooks from `@/hooks/usePatients`. Do not import `compressImageForThumb` or `imageUploadSchema`.

**File input to copy the shape of, then diverge** (`PatientImagesPanel.tsx` lines 620–633):

```tsx
type="file"
accept={GALLERY_ACCEPT}
multiple
className="hidden"
onChange={onGalleryChange}
```

```tsx
type="file"
accept={CAMERA_ACCEPT}
capture="environment"
className="hidden"
onChange={onCameraChange}
```

Copy only `type="file"` and `onChange`. For the avatar: `accept="image/png,image/jpeg,.png,.jpg,.jpeg"`, `className="sr-only"` (not `hidden`, not `display: none`), no `multiple`, no `capture`, no `accept="image/*"`. After `change`, set `input.value = ''`.

**Named-group overlay** (`KanbanPage.tsx` lines 186–193) — this is why the class is `group/photo`, not bare `group`:

```tsx
className="group/card cursor-grab rounded-2xl border border-line bg-surface p-3 active:cursor-grabbing"
```

```tsx
className="shrink-0 text-muted opacity-0 transition-opacity hover:text-error group-hover/card:opacity-100 group-focus-within/card:opacity-100 [@media(hover:none)]:opacity-100"
```

The ficha header root is already `group` (`PatientProfileHeader.tsx` line 58). A bare `group-hover` would show the camera on the name and the tabs. Overlay: `pointer-events-none absolute inset-0 ... opacity-0 group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 [@media(hover:none)]:opacity-100`. `Camera` is `aria-hidden`. Pending state replaces the icon with the existing spinner (`PatientPage.tsx` lines 494–496: `h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent`), sized `h-4 w-4` and white on the scrim.

**Remove confirm** (`PatientImagesPanel.tsx` lines 713–724). Copy the dialog, not the gallery copy:

```tsx
<ConfirmDialog
  open={Boolean(pendingDelete)}
  title={pendingDelete && isPdfImage(pendingDelete) ? 'Excluir PDF' : 'Excluir imagem'}
  description={
    pendingDelete && isPdfImage(pendingDelete)
      ? 'O PDF será removido desta ficha.'
      : 'A imagem será removida desta ficha.'
  }
  confirmLabel={pendingDelete && isPdfImage(pendingDelete) ? 'Excluir PDF' : 'Excluir imagem'}
  cancelLabel="Voltar"
  tone="danger"
  isLoading={deleteImage.isPending}
  onClose={() => setPendingDelete(null)}
```

Avatar copy: title **Remover foto**, description “A foto sai da ficha e das listas. As iniciais voltam.”, confirm **Remover foto**, cancel **Voltar**. Render the trigger only on the ficha, only when `canWrite` and `photoUrl` is set. Classes: `inline-flex min-h-11 items-center px-2 text-xs text-muted hover:text-error`. Unmount when there is no photo. Do not disable it.

---

### `src/lib/cropPatientPhoto.ts` (utility, transform)

**Analog:** `src/lib/compressImage.ts`

**Core pattern** (lines 13–68) — `createImageBitmap` with an `Image` + canvas fallback, then `canvas.toBlob`:

```ts
async function bitmapFromFile(file: File) {
  try {
    return await createImageBitmap(file)
  } catch {
    const objectUrl = URL.createObjectURL(file)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = () => reject(new Error('Não foi possível comprimir a miniatura.'))
        element.src = objectUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Não foi possível comprimir a miniatura.')
      ctx.drawImage(image, 0, 0)
      return await createImageBitmap(canvas)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
}
```

```ts
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Não foi possível comprimir a miniatura.'))
          return
        }
        resolve(result)
      },
      'image/jpeg',
      THUMB_QUALITY,
    )
  })
```

Reuse `bitmapFromFile`’s fallback shape. Do not call `compressImageForThumb` or `thumbStoragePath`. Center-crop to 512×512. Keep PNG as `toBlob(..., 'image/png')` with no quality argument. JPEG uses `'image/jpeg', 0.85`. Reject `file.size > 8 * 1024 * 1024` before decode. Reject the cropped blob over 2 MiB before upload. Sniff magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`); reject `RIFF`…`WEBP` and `ftyp`. User-facing errors are the photo copy in the UI-SPEC, not “Não foi possível comprimir a miniatura.”

---

### `src/services/patientPhoto.service.ts` (service, file-I/O)

**Analog:** `src/services/patientImages.service.ts`

**Imports** (lines 1–11):

```ts
import { supabase } from '@/lib/supabase/client'
import { compressImageForThumb, thumbStoragePath } from '@/lib/compressImage'
import { mapDbError, mapStorageError, sanitizeText } from '@/lib/security'
import { imageUploadSchema } from '@/schemas/patient.schema'
import type { PatientImage, PatientImageMime, UpdatePatientImageInput } from '@/types/patient'

const IMAGE_BUCKET = 'patient-images'
const SIGNED_URL_SECONDS = 3600
```

New service: bucket id `patient-avatars`, same `SIGNED_URL_SECONDS = 3600`. Import `mapDbError` only. Do not import `mapStorageError`, `imageUploadSchema`, `compressImageForThumb`, or `sanitizeText`.

**Upload path + compensating delete** (lines 210–223 and 141–144):

```ts
  const imageId = crypto.randomUUID()
  const path = `${patientId}/${imageId}.${mimeToExt(parsed.mimeType)}`

  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: parsed.mimeType,
    upsert: false,
  })
  throwIfStorageError(uploadError)
```

```ts
  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path, thumbStoragePath(path)])
    throw new Error(mapDbError(error))
  }
```

Same sequence for the avatar: `crypto.randomUUID()`, path `{patientId}/{uuid}.jpg|png`, `contentType` `image/jpeg` or `image/png`, `upsert: false`. On `patients` update failure, `storage.remove([newPath])`. On success, best-effort `remove` of the previous `photo_path` when it differs. Do not insert a `patient_images` row. Do not upload a thumb.

**Column update shape** is `patients.service.ts` lines 556–587, but errors must go through `mapDbError`, not `throwIfError`:

```ts
export async function updatePatient(id: string, input: UpdatePatientInput): Promise<void> {
  const payload: Record<string, string | number | null> = {}
  // ...
  const { error } = await supabase.from('patients').update(payload).eq('id', id)
  throwIfError(error)
}
```

`throwIfError` in `patients.service.ts` (lines 123–125) throws `error.message`. Do not copy that into the photo service. Permission failures use `mapDbError` (`security/index.ts` lines 230–236), which already returns “Você não tem permissão para esta ação.” for `42501`.

**Remove order differs from the gallery.** Gallery deletes storage first (`patientImages.service.ts` lines 293–310). Avatar nulls `photo_path` first, then `storage.remove`. A failed object delete is an orphan; a deleted object with the pointer still set is a broken image.

**Signed URL map** (lines 95–112 and 162–166):

```ts
function signedUrlByPath(
  entries:
    | Array<{
        path?: string | null
        signedUrl?: string | null
        signedURL?: string | null
        error?: string | null
      }>
    | null
    | undefined,
) {
  const urls = new Map<string, string>()
  for (const entry of entries ?? []) {
    if (!entry.path || entry.error) continue
    const url = entry.signedUrl || entry.signedURL
    if (url) urls.set(entry.path, url)
  }
  return urls
}
```

```ts
  const { data: signed, error: signedError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(originalPaths, SIGNED_URL_SECONDS)
```

Export a batch signer the patient, calendar, and board services can call. Dedupe paths. Skip entries with `error`. Never persist the URL. Do not call `createSignedUrl` with `transform` (gallery `signedTransformUrl`, lines 197–207) and do not call `getPublicUrl`.

---

### `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` (migration, batch)

**Analog:** `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql`

**Header and bucket** (lines 1–34):

```sql
-- REQ-19 galeria de imagens. D-06 D-07 D-11. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP patient_sessions_* / can_*.
-- Nao DELETE FROM storage.objects. Nao reescrever private.can_read_patient / can_write_patient.
```

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-images',
  'patient-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;
```

New script: bucket id `patient-avatars`, `public = false`, `file_size_limit = 2097152`, `allowed_mime_types = array['image/jpeg', 'image/png']::text[]`, `on conflict (id) do nothing`. Do not `UPDATE` a leftover public bucket. Do not touch `patient-images` or `15-patient-images-pdf.sql`.

**Storage policies** (lines 166–198). Copy the regex-before-`::uuid` shape. New policy names. No UPDATE policy. Do not `drop policy` on `patient_images_storage_*`.

```sql
create policy patient_images_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_read_patient(((storage.foldername(name))[1])::uuid))
  );
```

INSERT and DELETE use `can_write_patient` the same way (lines 180–198). SELECT uses `can_read_patient`. Also `alter table public.patients add column if not exists photo_path text` plus a CHECK that the path is null or `{patients.id}/{uuid}.jpg|png`. Do not rewrite `private.can_read_patient` / `private.can_write_patient`. Existing `patients_update` already checks `can_write_patient`. End with `notify pgrst, 'reload schema';`. Paste in the SQL Editor. Do not use `supabase db push`.

---

### `src/components/ui/PatientAvatar.tsx` (component, transform)

**Analog:** the current component (lines 1–31).

```tsx
import { initialsFromName, avatarColor } from '@/lib/avatar'

export function PatientAvatar({
  name,
  tone,
  initials,
  size = 'md',
  className = '',
}: PatientAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizes[size]} ${className}`}
      style={{ backgroundColor: avatarColor(tone) }}
    >
      {initials || initialsFromName(name)}
    </span>
  )
}
```

Add optional `photoUrl?: string | null`. Add `overflow-hidden` to the span. When `photoUrl` is non-empty, render `<img src={photoUrl} alt="" className="h-full w-full object-cover" />`. `onError` drops the image and shows initials. Keep `backgroundColor: avatarColor(tone)` so a transparent PNG still shows `photo_tone`. No file input, no `Camera`, no `canWrite`.

---

### `src/schemas/patient.schema.ts` (utility, transform)

**Analog:** `imageUploadSchema` (lines 193–208). Add a sibling schema. Do not change `PATIENT_IMAGE_MIMES` or `imageUploadSchema`.

```ts
export const PATIENT_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export const imageUploadSchema = z.object({
  mimeType: z.enum(PATIENT_IMAGE_MIMES, {
    errorMap: () => ({
      message: 'Envie JPEG, PNG, WebP ou PDF. Fotos do iPhone: escolha a opção mais compatível.',
    }),
  }),
  byteSize: z.number().int().positive().max(MAX_IMAGE_BYTES, 'O arquivo deve ter no máximo 8 MB.'),
  sessionId: z.string().uuid().nullable(),
  description: optionalText(500),
})
```

New `patientPhotoSchema`: enum `image/jpeg` | `image/png` only, message **Envie PNG ou JPEG.**, byte cap 8 MiB with message **A foto deve ter no máximo 8 MB.** No `sessionId`, no `description`. Parse with `safeParse` the same way `parseUploadInput` does (`patientImages.service.ts` lines 82–92).

---

### `src/types/patient.ts` (model, CRUD)

**Analog:** existing DTOs (lines 147–227). Add `photoUrl: string | null` on `PatientListItem`, `Patient`, and `PatientDashboard` next to `photoTone`. Do not add `photo_path` to the camelCase DTO. Do not regenerate `src/types/database.types.ts`.

Calendar and board DTOs live in their services, not here: `CalendarSession` (`calendar.service.ts` lines 4–14), `BoardCard` and `DueBoardCard` (`board.service.ts` lines 9–29). Add `photoUrl: string | null` beside `photoTone` on those three.

---

### `src/services/patients.service.ts` (service, CRUD)

**Analog:** column lists and mappers in this file; signing from `signedUrlByPath` above.

**Select lists that ignore new columns until named** (lines 114–121):

```ts
const DETAIL_COLUMNS =
  'id, full_name, code, birth_date, phone, email, status, profession, emergency_name, emergency_phone, emergency_relation, admin_notes, referral_source, treatment_started_on, sessions_done, sessions_planned, frequency, therapist_name, program_name, program_progress, complaint, diagnosis, current_eva, last_visit_on, ai_summary, evolution_summary, last_conducts, next_session_plan, photo_tone, created_by'

const LIST_COLUMNS =
  'id, full_name, code, phone, status, photo_tone, program_name, sessions_done, sessions_planned, created_by'

const DASHBOARD_COLUMNS =
  'id, full_name, code, phone, status, photo_tone, complaint, diagnosis, treatment_started_on, sessions_done, sessions_planned, last_visit_on, created_by'
```

Add `photo_path` to all three. Add `photo_path: string | null` on `PatientRow` (line 50 area) and `ListPatientRow` (lines 54–65).

**Mapper** (lines 257–277). Attach `photoUrl` after a batch sign. Null path stays `photoUrl: null`. Do not clear `photoTone`.

```ts
    photoTone: row.photo_tone || 'bg-forest',
    status: row.status,
```

`mapPatient` (line 297) uses the same `photoTone` line. Repeat for the dashboard mapper.

---

### `src/services/calendar.service.ts` (service, CRUD)

**Analog:** `listSessionsInRange` (lines 20–56).

```ts
    .select('id, patient_id, scheduled_at, session_type, place, status, patients(full_name, code, photo_tone)')
```

```ts
        photoTone: patient?.photo_tone ?? 'bg-forest',
```

Embed `photo_path` in the `patients(...)` select. Extend the inline patient type. Sign unique paths, then set `photoUrl`. Missing embed stays initials (`photoUrl: null`).

---

### `src/services/board.service.ts` (service, CRUD)

**Analog:** both embeds.

```ts
    .select('id, column_id, title, description, patient_id, due_on, sort_order, patients(full_name, photo_tone)')
```

(`listBoard`, line 45)

```ts
      .select('id, title, due_on, column_id, patients(full_name, photo_tone)')
```

(`listDueCards`, line 132)

```ts
        photoTone: patient?.photo_tone ?? null,
```

(line 74; `listDueCards` repeats this around line 163). Add `photo_path` to both selects and both patient unions. Sign once per list. `photoUrl` null when there is no patient or no path.

---

### `src/hooks/usePatients.ts` (hook, request-response)

**Analog:** `src/hooks/usePatientImages.ts` (lines 12–69) for the mutation shape, and `invalidatePatient` in this file (lines 42–56) for cache keys.

```ts
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}

export function useUploadPatientImages(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ files, sessionId, description }) =>
      uploadPatientImages(patientId, files, { sessionId, description }),
    onSuccess: (data) => {
      invalidatePatient(qc, patientId)
      if (data.length === 1) toast('Arquivo adicionado', 'success')
    },
    onError,
  })
}
```

Add `useUploadPatientPhoto` and `useRemovePatientPhoto` in `usePatients.ts` with the same `useMutation` + `onError` shape. Success toasts: **Foto atualizada.** and **Foto removida.**

`invalidatePatient` currently also invalidates images, sessions, evaluations, finance (lines 46–55). Photo mutations must invalidate `['patients']`, `['patients', id]`, `['patients', id, 'dashboard']`, `['calendar-sessions']`, and `['board']`. Do not invalidate `['patients', id, 'images']` for an avatar change. Do not call the gallery `invalidatePatient` from `usePatientImages.ts` (that one only covers the patient keys, not the board).

`usePatients` `staleTime` is `60_000` (lines 62–67). Leave it.

---

### `src/components/patients/PatientProfileHeader.tsx` (component, request-response)

**Analog:** the avatar cell and the name row (lines 57–80).

```tsx
      <div
        className="dash-in group mt-5 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4"
```

```tsx
        <PatientAvatar
          name={name}
          tone={photoTone}
          initials={initials}
          size="lg"
          className="!h-14 !w-14 !text-base sm:!h-16 sm:!w-16 sm:!text-lg"
        />
```

```tsx
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{name}</h1>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-forest">
                {statusLabels[status]}
              </span>
            </div>
```

Keep the root `group` (the cadastro pencil uses it). Pass `photoUrl`. When `canWrite`, the avatar cell is `PatientPhotoControl` with the same `size="lg"` and the same `!h-14 !w-14` / `sm:!h-16 !w-16` classes. When `!canWrite`, plain `PatientAvatar` with `photoUrl`. **Remover foto** goes in the name-row flex after the status pill, not on the circle. Do not change `gap-x-3 sm:gap-x-4` or the tab nav.

---

### `src/pages/PatientPage.tsx` (component, request-response)

**Analog:** write gate and header props (lines 513–531).

```tsx
  const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
  const showConsultBanner = profile?.accountType === 'empresa' && !canWrite
```

```tsx
          Somente consulta — você vê a ficha, mas não pode alterar.
```

```tsx
      <PatientProfileHeader
        name={dashboard.name}
        initials={dashboard.initials}
        photoTone={dashboard.photoTone}
```

Pass `photoUrl={dashboard.photoUrl}` and `canWrite`. Do not add a second consult banner. `canWritePatient` is imported from `@/lib/accountAccess` (already on line 36).

---

### `src/pages/PatientsPage.tsx` (component, request-response)

**Analog:** mobile link and desktop row (lines 105–158). `user` is already in scope (line 17).

```tsx
              <Link
                key={patient.id}
                to={`/pacientes/${patient.id}`}
                className="dash-card dash-in flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
              >
                <PatientAvatar name={patient.name} tone={patient.photoTone} initials={patient.initials} />
                <span className="min-w-0 flex-1">
```

```tsx
                    <tr
                      key={patient.id}
                      tabIndex={0}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/80"
                      onClick={() => navigate(`/pacientes/${patient.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/pacientes/${patient.id}`)
                        }
                      }}
                    >
```

When `canWritePatient(user?.id, patient.createdBy)`: mobile card chrome moves to a wrapper `div` (`flex items-center gap-3`); `PatientPhotoControl` is the first sibling; the `Link` is `min-w-0 flex-1` and holds only the name and meta. A `label` inside an `a` is invalid. Desktop: `stopPropagation` on `click` and `keydown` of the photo control so Enter/Space and click do not `navigate`. Read-only rows stay a single `Link` / row click with plain `PatientAvatar` and `photoUrl`. Size `md`. No **Remover foto** on the list.

---

### Display-only call sites (component, request-response)

Pass `photoUrl`. Do not mount `PatientPhotoControl`.

**Kanban** (`KanbanPage.tsx` lines 180–207). The card is `draggable` and `group/card`. A camera here is a bug.

```tsx
                        draggable
                        onDragStart={() => setDraggingId(card.id)}
                        className="group/card cursor-grab rounded-2xl border border-line bg-surface p-3 active:cursor-grabbing"
```

```tsx
                            <PatientAvatar name={card.patientName} tone={card.photoTone} size="sm" />
```

**Calendar sessions and due cards** (`CalendarPage.tsx` lines 430–432 and the session avatar near line 447):

```tsx
                      <PatientAvatar name={card.patientName} tone={card.photoTone} size="sm" />
```

**Dashboard upcoming** (`DashboardPage.tsx` lines 300–306 and 473). The view object only copies `tone: session.photoTone`. Add `photoUrl: session.photoUrl` in that map, then pass it to the avatar. The row stays a `Link`.

```tsx
          tone: session.photoTone,
```

```tsx
                        <PatientAvatar name={item.name} tone={item.tone} />
```

**Clinical shortcut** (`DashboardClinicalShortcut.tsx` lines 155–165). The row is a `button`. Display only.

```tsx
                    <button
                      type="button"
                      className={[
                        'flex w-full min-h-11 min-w-0 items-center gap-2 rounded-2xl border border-line bg-surface p-4 text-left',
                        'hover:bg-canvas',
                      ].join(' ')}
                      onClick={() => selectPatient(state.kind, patient)}
                    >
                      <PatientAvatar name={patient.name} tone={patient.photoTone} initials={patient.initials} />
```

Class names stay `[...].join(' ')`. No `clsx`.

## Shared Patterns

### Authorization (UX hide, RLS enforces)

**Source:** `src/lib/accountAccess.ts` lines 32–37
**Apply to:** `PatientPhotoControl` mount sites (ficha header, patient list). Do not use it as the only check in the service.

```ts
export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}
```

`!canWrite` unmounts the control. Do not render a disabled camera. Storage INSERT/DELETE and `patients` UPDATE stay on `private.can_write_patient`. SELECT of the object stays on `private.can_read_patient`.

### Database errors

**Source:** `src/lib/security/index.ts` lines 230–236
**Apply to:** `patientPhoto.service.ts` only. Do not reuse `mapStorageError` (lines 262–305). That function tells the user WebP and PDF are valid and that the cap is the gallery’s 8 MB toast.

```ts
  if (code === '42501' || message.includes('operation_not_permitted')) {
    return 'Você não tem permissão para esta ação.'
  }
```

Other photo failures throw the UI-SPEC strings: **Envie PNG ou JPEG.**, **A foto deve ter no máximo 8 MB.**, **Não foi possível salvar a foto. Tente de novo.**, **Não foi possível remover a foto. Tente de novo.** Never throw `error.message`.

### Toasts

**Source:** `src/stores/toast.store.ts` lines 38–41 and `usePatientImages.ts` lines 12–14
**Apply to:** the two new mutations.

```ts
export function toast(
  message: string,
```

```ts
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

Success: `toast('Foto atualizada.', 'success')` and `toast('Foto removida.', 'success')`. Dismissed picker: no toast. Signed URL that fails to paint: no toast; `PatientAvatar` `onError` falls back to initials.

### Confirm dialog

**Source:** `src/components/ui/ConfirmDialog.tsx` lines 4–27
**Apply to:** ficha remove only.

```tsx
interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}
```

Default cancel is **Cancelar**. Pass `cancelLabel="Voltar"` and `tone="danger"`. **Voltar**, X, Escape, and backdrop call `onClose` with no write.

### Signing

**Source:** `signedUrlByPath` and `createSignedUrls(..., 3600)` in `src/services/patientImages.service.ts` lines 95–112 and 162–166
**Apply to:** `patients.service.ts`, `calendar.service.ts`, `board.service.ts` via one helper in `patientPhoto.service.ts`. Bucket `patient-avatars`. Do not sign from a component. Components do not import `supabase`.

### Query invalidation

**Source:** `src/hooks/usePatients.ts` lines 46–55
**Apply to:** photo upload and remove, with the narrower key set in the hook assignment. `staleTime` 60s and a 3600s signed URL means a refetch renews the URL in normal use.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Every planned file has an analog. Do not add a test file, a crop modal, or a gallery row. |

## Metadata

**Analog search scope:** `src/components/ui/PatientAvatar.tsx`, `src/components/patients/`, `src/pages/PatientsPage.tsx`, `src/pages/PatientPage.tsx`, `src/pages/KanbanPage.tsx`, `src/pages/CalendarPage.tsx`, `src/pages/DashboardPage.tsx`, `src/services/patientImages.service.ts`, `src/services/patients.service.ts`, `src/services/calendar.service.ts`, `src/services/board.service.ts`, `src/hooks/usePatients.ts`, `src/hooks/usePatientImages.ts`, `src/lib/compressImage.ts`, `src/lib/accountAccess.ts`, `src/lib/security/index.ts`, `src/schemas/patient.schema.ts`, `src/types/patient.ts`, `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql`
**Files scanned:** 18 planned files, 12 analog sources read
**Pattern extraction date:** 2026-09-23

## Planner notes

- Page → hook → service → Supabase. `PatientPhotoControl` calls a hook, not `supabase`.
- Named exports, single quotes, no semicolons, 2-space indent, class strings with `[...].join(' ')`.
- Do not loosen `imageUploadSchema`. Do not upload into `patient-images`. Do not set `upsert: true`.
- Editable surfaces: ficha header and `PatientsPage` only. Kanban, calendar, dashboard, and the clinical shortcut display `photoUrl`.
- SQL lives only in `.planning/phases/16-foto-do-paciente/sql/`. Ignore the stray `16-foto-do-paciente-com-hover-de-c-mera-e-envio-de-png-ou-jpeg/` directory.
