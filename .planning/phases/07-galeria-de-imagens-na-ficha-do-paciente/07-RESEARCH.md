# Phase 7: Galeria de imagens na ficha do paciente - Research

**Researched:** 2026-09-14
**Domain:** Private Supabase Storage + metadata table + ficha tab (clinic SPA, no new packages)
**Confidence:** HIGH (stack, ficha tabs, RLS helpers, supabase-js Storage API, official bucket/signed-URL docs); MEDIUM (hosted Storage Settings global size cap; `private.can_*` inside `storage.objects` policies untested on this project); LOW (live leftover buckets; exact iPhone HEIC `File.type` on every iOS version)

<user_constraints>
## User Constraints (from orchestrator — no CONTEXT.md; discuss-phase skipped)

There is **no** `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/07-CONTEXT.md`. Do **not** invent locked `D-xx` IDs. The following is the only locked product intent.

### Locked product intent

- New tab on the patient ficha named **Imagens** (Portuguese).
- It is a **gallery** of images.
- An image can be allocated **standalone (avulsa)** OR **tied to a session**.
- Each image can have a **description**.

### Claude's Discretion (research recommends — not locked D-xx)

- Supabase Storage vs another store
- Table shape, RLS, signed URLs vs public bucket
- MIME/size limits, HEIC, compression
- Filter UI (all vs by session)
- Delete / edit description
- canWrite hide vs disable
- SQL Editor apply path like Phases 3/5/6

### Deferred Ideas (OUT OF SCOPE — researcher recommendation, not a discuss-phase list)

- PDF / generic documents (the Resumo card **Documentos · Em breve** is a different product)
- Video, HEIC conversion libraries, TUS/Uppy resumable uploads
- Before/after pairs, comparison slider, AI analysis of photos
- Public share links, image-as-avatar, images on Resumo
- Rewriting Phase 3 `private.can_read_patient` / `private.can_write_patient`
- Financeiro-on-ficha, multi-clínica, retention-policy automation
</user_constraints>

<phase_requirements>
## Phase Requirements

REQUIREMENTS.md has **no REQ-ID** for this phase (TBD). The table below is a **proposal** so the planner can map later. **Do not treat these IDs as locked. Do not edit REQUIREMENTS.md in this research.**

| ID | Description | Research Support |
|----|-------------|------------------|
| **REQ-19** *(proposed)* | Galeria de imagens na ficha — aba Imagens; avulsa ou por sessão; descrição | New tab `imagens`; `patient_images` + private bucket `patient-images`; signed URLs; `canWrite` hides writes |
| REQ-19.1 *(proposed)* | Aba **Imagens** on the ficha (with Resumo / Dados cadastrais / Evoluções / Avaliação) | Extend `PatientTab` + `PatientProfileHeader` + `?aba=imagens` |
| REQ-19.2 *(proposed)* | Gallery of images (grid + lightbox), no mock rows | `listPatientImages` + `createSignedUrls`; empty copy **Nenhuma imagem nesta ficha.** |
| REQ-19.3 *(proposed)* | Image is **avulsa** (`session_id` null) **or** tied to one `patient_sessions` row | Upload Select; filter Todas / Avulsas / sessão; FK `ON DELETE SET NULL` |
| REQ-19.4 *(proposed)* | Each image can have a **description** | Optional text, Zod + `sanitizeText`; edit when `canWrite` |
| REQ-19.5 *(proposed)* | Persist in Supabase (table + Storage); no client-only gallery | SQL Editor script; service upload then INSERT |
| REQ-19.6 *(proposed)* | Empresa viewing a colleague ficha: read-only gallery | Hide write controls; RLS `can_write_patient` is the wall |
</phase_requirements>

## Summary

The ficha already has four tabs (`resumo` | `cadastro` | `evolucoes` | `avaliacao`) driven by `?aba=` on `PatientPage`. There is **no** Storage usage in application code (only `sessionStorage` / `localStorage` for auth rate-limit and a physical-eval draft). Phase 3 already exposes `private.can_read_patient` / `private.can_write_patient` and RLS on `patient_sessions`. Sessions are listed by `listPatientSessions` (`usePatientSessions`, queryKey `['patients', id, 'sessions']`).

Phase 7 adds a fifth tab **Imagens**, a metadata table `public.patient_images`, and a **private** Storage bucket `patient-images`. Objects are never public. The browser uploads through already-installed `@supabase/supabase-js` (`storage.from().upload` / `createSignedUrls` / `remove`). Gallery listing comes from PostgREST on `patient_images`, then one batch `createSignedUrls` for `<img src>`. No new npm packages.

ROADMAP “Depends on: Phase 6” is **numbering only**. Functionally this depends on ficha tabs + `patient_sessions` + Phase 3 RLS — **not** on the silhouette / `region_key` work.

**Primary recommendation:** Private bucket + `patient_images` (nullable `session_id`, `description`, `storage_path`). Path `{patient_id}/{image_id}.jpg|png|webp`. Storage RLS and table RLS both call existing `can_read_patient` / `can_write_patient`. Signed URLs (~1h), never stored. JPEG/PNG/WebP only, 8 MiB cap, reject HEIC. Hide Adicionar / Editar / Excluir when `!canWrite`. SQL Editor apply path (copy under `.planning/phases/07-…/sql/` and gitignored `/supabase/`). Do **not** `supabase db push`. Do **not** `DELETE FROM storage.objects` (official schema: that does not delete the S3 object).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tab **Imagens** + `?aba=imagens` | Browser / Client | — | Same pattern as Evoluções / Avaliação. No new route. |
| Gallery grid + lightbox | Browser / Client | CDN / Static | `<img>` via signed URL. Modal already exists. |
| Filter Todas / Avulsas / by session | Browser / Client | API / Backend | Client filter of one list query; session labels from `usePatientSessions`. |
| File pick, MIME/size Zod, optional description | Browser / Client | API / Backend | UX gate. Bucket `allowed_mime_types` / `file_size_limit` are the wall. |
| Multipart upload to Storage | API / Backend (Storage API) | Database / Storage | `supabase.storage.from('patient-images').upload`. |
| Metadata persist (session, description, path) | API / Backend (PostgREST) | Database / Storage | `patient_images` INSERT/UPDATE/DELETE. |
| Signed URL for `<img>` | API / Backend (Storage API) | Browser / Client | `createSignedUrls` requires object SELECT RLS. Expiry in the URL, not the DB. |
| Authorization (read colleague / write own) | Database / Storage | Browser / Client | Table + `storage.objects` policies call Phase 3 helpers. `canWritePatient` is UX-only. |
| Object delete | API / Backend (Storage API) | Database / Storage | `storage.remove` then DELETE row. Do not SQL-delete `storage.objects`. |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` is **absent**. Treat these tracked sources with the same authority as locked decisions:

- **Layers:** page → hooks → services → Supabase. Pages/components do not call `supabase`. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`]
- **Clinic gating:** `src/lib/accountAccess.ts` only. Do **not** import `src/lib/permissions.ts`. [VERIFIED: ARCHITECTURE.md]
- **Hide, don’t disable** write controls that look tappable (Phase 3 D-07). [VERIFIED: CONVENTIONS.md, STATE.md]
- **SQL apply path:** hosted SQL Editor only. Do **not** `supabase db push`. Commit a copy under `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/` (`/supabase/` is gitignored). [VERIFIED: ARCHITECTURE.md, `.gitignore`, Phase 5/6 pattern]
- **Style:** single quotes, no semicolons, 2-space, `[...].join(' ')` not `clsx`, named exports only, no barrels. [VERIFIED: CONVENTIONS.md]
- **Do not restyle** `Button` / `AppShell` / `Input` primitives. Reuse `Modal`, `ConfirmDialog`, `Select`, `Textarea`.
- **Quality gates:** `npm run lint` and `npm run typecheck`. No test runner today. [VERIFIED: `package.json`, `.planning/codebase/TESTING.md`]
- **New clinic writes:** `mapDbError` at the service boundary (do not throw raw Storage/PostgREST `error.message`). [VERIFIED: CONVENTIONS.md]
- **Do not rewrite Phase 3 RLS helpers.** New table/policies **call** `can_read_patient` / `can_write_patient`. [VERIFIED: orchestrator + `03-account-types-team.sql`]
- **Empresa colleague ficha:** read-only gallery. [VERIFIED: orchestrator + `canWritePatient`]
- **No new npm packages** unless Storage upload is impossible with the current client — it is not. [VERIFIED: `@supabase/storage-js` 2.110.7 inside supabase-js]
- **Product copy:** Portuguese. RESEARCH.md is English (Phase 6 style); pt-BR strings are called out below.

## Schema from code (what exists today)

Inferred from application + committed SQL. Live DDL for `patient_sessions` is not fully in git (CREATE lives on hosted); RLS policies are in Phase 3 SQL.

| Artifact | What the code/SQL already does | Phase 7 implication |
|----------|--------------------------------|---------------------|
| `PatientTab` | `'resumo' \| 'cadastro' \| 'evolucoes' \| 'avaliacao'` in `PatientProfileHeader.tsx` | Add `'imagens'`. Fifth `<button role="tab">` labeled **Imagens**. |
| `PatientPage` `?aba=` | Maps `cadastro` / `evolucoes` / `avaliacao`; else Resumo | Add `aba === 'imagens'` and `setSearchParams({ aba: 'imagens' })`. |
| Tab nav overflow | `overflow-hidden` on the tab `nav` | Fifth tab will clip on small screens. Change to `overflow-x-auto` only (not a primitive restyle). |
| Shortcuts row | **Documentos · Em breve** is a dead card | Do **not** hijack it. Imagens is a real tab. |
| `canWrite` | `canWritePatient(user.id, createdBy)` — creator only | Pass into `PatientImagesPanel`. Hide writes. |
| Consult banner | Empresa + `!canWrite` → **Somente consulta — você vê a ficha, mas não pode alterar.** | Reuse; no extra banner. |
| `PatientSessionRecord` | `id`, `dateLabel`, `timeLabel`, `type`, `status`… | Filter/upload labels: `` `${dateLabel} · ${timeLabel}` ``. |
| `listPatientSessions` | `.not('scheduled_at', 'is', null).order('scheduled_at', { ascending: false })` | Reuse `usePatientSessions`. Sessions without `scheduled_at` never appear — do not invent a second list. |
| `patient_sessions` RLS | SELECT `can_read_patient`; INSERT/UPDATE/DELETE `can_write_patient` | Session EXISTS checks in image policies see the same rows the writer already sees. |
| `private.can_write_patient` | `patients.created_by = auth.uid()` AND membership not pending/rejected. Empresa owner is **not** a writer. | Same wall as goals/sessions. |
| `private.can_read_patient` | Creator **or** empresa owner of the creator’s org (active). Pending/rejected denied. | Empresa can SELECT images + mint signed URLs. |
| `invalidatePatient` | Invalidates `patients`, detail, dashboard, sessions, evaluations, calendar, finance. **Not** images. | Add `['patients', patientId, 'images']` so session delete (SET NULL → avulsa) refreshes the gallery. |
| Storage | **Zero** `supabase.storage` calls | New service owns all Storage I/O. |
| `PatientPhysicalEvaluationPanel` | `localStorage` draft of evaluations | **Anti-pattern for photos.** Do not store images in localStorage. |
| `database.types.ts` | Bakery leftover | Keep a local `ImageRow` in the images service. |
| `deletePatient` | **Does not exist** | No patient-hard-delete flow to extend this phase. Document Storage orphan risk if CASCADE ever lands. |

## Standard Stack

Reuse what is already installed. **Do not add runtime packages.** Do not add Uppy, TUS clients, `browser-image-compression`, `heic2any`, Cloudinary SDKs, or `clsx`.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 (`^19.1.0`) | Tab + gallery + file input | Existing SPA. [VERIFIED: `.planning/codebase/STACK.md`] |
| @tanstack/react-query | 5.101.2 (`^5.76.1`) | List + mutations + invalidate | Same as sessions/evaluations. [VERIFIED: `src/hooks/usePatients.ts`] |
| @supabase/supabase-js | 2.110.7 (`^2.49.8`) | PostgREST + Storage upload / signed URLs / remove | Already includes `@supabase/storage-js` 2.110.7. [VERIFIED: `package-lock.json`] [CITED: supabase.com/docs/reference/javascript/storage-from-upload] |
| zod | 3.25.76 (`^3.25.28`) | MIME, size, description, optional session UUID | Service + form boundary. [VERIFIED: STACK.md] |
| react-hook-form + resolvers | 7.81.0 / 5.4.0 | Upload + edit-description modals | Existing ficha forms. |
| zustand toast | 5.0.14 | Success/error | Existing `toast()`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind v4 tokens | 4.3.3 | `border-line`, `rounded-2xl`, `text-muted` | Gallery chrome. Hex only if unavoidable. |
| `canWritePatient` | local `accountAccess.ts` | Hide write controls | Always. RLS still enforces. |
| UI kit | local | `Button`, `Modal`, `ConfirmDialog`, `Select`, `Textarea`, `Input` | Do not restyle primitives. |
| `sanitizeText` / `mapDbError` | `src/lib/security/index.ts` | Description + errors | New writes must use these. |
| Hosted Supabase Storage | project feature | Private bucket + RLS on `storage.objects` | Only store. [CITED: supabase.com/docs/guides/storage/buckets/fundamentals] |
| Postgres UUID / FK | Hosted | `patient_id`, nullable `session_id` | Same as other ficha tables. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Private bucket + signed URLs | Public bucket + `getPublicUrl` | **Reject.** Official: public retrieve bypasses ACL; anyone with the URL reads clinical photos (LGPD). [CITED: supabase.com/docs/guides/storage/buckets/fundamentals] |
| `patient_images` + Storage | `bytea` / base64 on a Postgres column | Blows PostgREST payloads; no expiry; couples list query to megabytes. |
| Metadata table | Query `storage.objects` only | No first-class `session_id` / `description`; listing Storage is the wrong UX source. |
| `session_id` NOT NULL | Always require a session | Violates locked **avulsa**. |
| `ON DELETE CASCADE` on session | SET NULL | Deleting a sessão would destroy clinical photos. SET NULL → image becomes avulsa. |
| HEIC + `heic2any` | Reject HEIC | New package forbidden unless necessary; browsers other than Safari often cannot display HEIC. Existing stack **can** upload JPEG/PNG/WebP. |
| Canvas resize / compression | Skip in v1 | EXIF orientation bugs; 8 MiB + standard upload is enough. Revisit only if UAT rejects real phone photos. |
| TUS / Uppy | Standard `upload()` | Official: standard upload is ideal ≤6MB and works up to 5GB; TUS recommended above 6MB for reliability. 8 MiB clinic photos stay on standard upload. [CITED: supabase.com/docs/guides/storage/uploads/standard-uploads] |
| Cloudinary / S3 SDK | Extra vendor + keys | Violates “no new packages / existing Supabase”. |
| Disable write buttons when `!canWrite` | Hide them | Phase 3: disabled controls still look tappable. |

**Installation:**

```bash
# none — do not npm install
```

**Version verification:** Stack versions from `.planning/codebase/STACK.md` (2026-09-14) and `package-lock.json` (`@supabase/supabase-js` **2.110.7**). Registry latest at research time was 2.116.0 — **do not upgrade** this phase. No new registry packages.

## Package Legitimacy Audit

> No external packages are recommended. Gate skipped.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | No installs |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

`slopcheck` was not available at research time. That is irrelevant because this phase installs nothing. If a later plan tries to add Uppy / heic2any / a compressor, that is a constraint violation unless UAT proves JPEG/PNG/WebP + 8 MiB cannot land phone photos.

## Architecture Patterns

### System Architecture Diagram

```text
[Profissional na aba Imagens]
        │
        ▼
┌──────────────────────────────────────────────┐
│ PatientImagesPanel                           │
│  filter: Todas | Avulsas | sessão            │
│  grid ← signedUrl + description              │
│  !canWrite → hide Adicionar / Editar / Excluir│
└───────────────┬──────────────────────────────┘
                │
     upload click (canWrite)
                ▼
   Zod MIME + size + description
                ▼
   uploadPatientImage(patientId, file, { sessionId?, description })
                │
                ├─ storage.from('patient-images')
                │    .upload('{patientId}/{imageId}.jpg', file)
                │         ▼
                │    Storage RLS INSERT
                │    folder[1] = patient_id
                │    AND can_write_patient(patient_id)
                │
                └─ INSERT public.patient_images
                         ▼
                  RLS WITH CHECK can_write_patient
                  + session belongs to same patient
                         │
                         ▼
              invalidate ['patients', id, 'images']
                         │
     list: SELECT patient_images (can_read_patient)
           then createSignedUrls(paths, 3600)
                         │
           empresa colleague: SELECT + signed URLs ok
           INSERT/DELETE: 42501
```

### Recommended Project Structure

```
src/
├── types/patient.ts                         # PatientImage (+ keep sessions)
├── schemas/patient.schema.ts                # imageUploadSchema / imageDescriptionSchema
├── services/patientImages.service.ts        # list / upload / update / delete + signed URLs
├── hooks/usePatients.ts                     # invalidatePatient +images key
├── hooks/usePatientImages.ts                # usePatientImages / useUpload / useUpdate / useDelete
│                                            # (or colocate in usePatients.ts — see Pattern 3)
├── components/patients/PatientImagesPanel.tsx
└── components/patients/PatientProfileHeader.tsx  # tab + overflow-x-auto
src/pages/PatientPage.tsx                    # mount panel; ?aba=imagens
.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/
└── 07-patient-images.sql                    # bucket + table + RLS; SQL Editor only
supabase/07-patient-images.sql               # gitignored paste copy
```

`PatientPage.tsx` only mounts `<PatientImagesPanel patientId={dashboard.id} canWrite={canWrite} />`. Do not grow upload logic in the page.

### Pattern 1: Private bucket, path = patient folder

**What:** One private bucket `patient-images`. Object name `{patient_id}/{image_id}.{ext}` where both UUIDs are generated in the service (`crypto.randomUUID()` for the image id — same as table `id`). First folder is the patient id so Storage RLS can call `can_read_patient` / `can_write_patient` without a join on `patient_images`.

**When to use:** Always.

**Example:**

```sql
-- Source: https://supabase.com/docs/guides/storage/buckets/creating-buckets
-- Columns: https://supabase.com/docs/guides/storage/schema/design
-- Cole no SQL Editor. Nao use supabase db push.
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

Do **not** set `public = true`. Do **not** use `allowed_mime_types` `image/*` (that admits HEIC, SVG, GIF).

### Pattern 2: Metadata table (gallery source of truth)

**What:** `patient_images` holds listing fields. Storage holds bytes. Never persist `signedUrl`.

```sql
create table if not exists public.patient_images (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  session_id uuid references public.patient_sessions (id) on delete set null,
  storage_path text not null unique,
  description text not null default '',
  mime_type text not null,
  byte_size integer not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  constraint patient_images_mime_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint patient_images_size_check
    check (byte_size > 0 and byte_size <= 8388608),
  constraint patient_images_path_check
    check (storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$')
);

create index if not exists patient_images_patient_created_idx
  on public.patient_images (patient_id, created_at desc);

create index if not exists patient_images_session_idx
  on public.patient_images (session_id)
  where session_id is not null;
```

Session must belong to the same patient — enforce in RLS `WITH CHECK` (no extra trigger required):

```sql
session_id is null
or exists (
  select 1
  from public.patient_sessions s
  where s.id = session_id
    and s.patient_id = patient_images.patient_id
)
```

Table policies (copy Phase 3 goals shape; **do not** DROP Phase 3 policies on other tables):

- SELECT → `can_read_patient(patient_id)`
- INSERT / UPDATE / DELETE → `can_write_patient(patient_id)` plus the session EXISTS on INSERT/UPDATE

`ENABLE` + `FORCE` RLS. `GRANT select, insert, update, delete` to `authenticated`. `REVOKE ALL` from `anon, public`.

### Pattern 3: Service upload (Storage then row; compensate)

**What:** Generate `imageId`. Map MIME → extension (`image/jpeg` → `jpg`, `png`, `webp`). Upload with `contentType` and `upsert: false`. Then INSERT the row with `id = imageId` and `storage_path`. If INSERT fails, `storage.remove([path])` so the object is not orphaned.

**When to use:** Create. Delete is the inverse: `remove` then DELETE row (see Pitfall 4).

**Example:**

```ts
// Source: https://supabase.com/docs/reference/javascript/storage-from-upload
// Source: https://supabase.com/docs/reference/javascript/storage-from-createsignedurls
const IMAGE_BUCKET = 'patient-images'
const SIGNED_URL_SECONDS = 3600

export async function uploadPatientImage(
  patientId: string,
  file: File,
  input: { sessionId: string | null; description: string },
): Promise<PatientImage> {
  const parsed = imageUploadSchema.parse({
    mimeType: file.type,
    byteSize: file.size,
    sessionId: input.sessionId,
    description: input.description,
  })
  const imageId = crypto.randomUUID()
  const ext = mimeToExt(parsed.mimeType)
  const path = `${patientId}/${imageId}.${ext}`

  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: parsed.mimeType,
    upsert: false,
  })
  if (uploadError) throw new Error(mapStorageError(uploadError))

  const { data, error } = await supabase
    .from('patient_images')
    .insert({
      id: imageId,
      patient_id: patientId,
      session_id: parsed.sessionId,
      storage_path: path,
      description: sanitizeText(parsed.description, 500),
      mime_type: parsed.mimeType,
      byte_size: parsed.byteSize,
    })
    .select(IMAGE_COLUMNS)
    .single()

  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path])
    throw new Error(mapDbError(error))
  }
  return mapImageRow(data)
}
```

List: SELECT rows ordered by `created_at` desc, then:

```ts
const { data, error } = await supabase.storage
  .from(IMAGE_BUCKET)
  .createSignedUrls(rows.map((row) => row.storage_path), SIGNED_URL_SECONDS)
```

Attach `signedUrl` only on the DTO returned to the UI (`PatientImage.signedUrl`). Refresh comes from React Query staleTime (recommend `30_000`, same as sessions). Do not write signed URLs to Postgres.

Hooks: prefer `src/hooks/usePatientImages.ts` (ARCHITECTURE: new clinic feature gets its own hook file, not bakery `queries.ts`) **and** add the images query key to `invalidatePatient` so session delete/update refreshes avulsa vs sessão. If the planner wants fewer files, colocating in `usePatients.ts` is acceptable (sessions/evaluations already live there).

### Pattern 4: Tab + panel + hide writes

**What:** Mirror Evoluções. Filter + grid always visible to readers. Write chrome unmounted when `!canWrite`.

**pt-BR copy (product):**

| UI | String |
|----|--------|
| Tab | **Imagens** |
| Add | **Adicionar imagem** |
| Empty (no rows) | **Nenhuma imagem nesta ficha.** |
| Empty (filter avulsas) | **Nenhuma imagem avulsa.** |
| Empty (filter session) | **Nenhuma imagem nesta sessão.** |
| Session none | **Avulsa (sem sessão)** |
| Filter all | **Todas** |
| Filter loose | **Avulsas** |
| Description label | **Descrição** |
| Description placeholder | **Opcional** |
| File helper | **JPEG, PNG ou WebP · até 8 MB** |
| HEIC / bad type | **Envie JPEG, PNG ou WebP. Fotos do iPhone: escolha a opção mais compatível.** |
| Too large | **A imagem deve ter no máximo 8 MB.** |
| Upload toast | **Imagem adicionada** |
| Edit toast | **Descrição atualizada** |
| Delete title | **Excluir imagem** |
| Delete body | **A imagem será removida desta ficha.** |
| Delete confirm | **Excluir** |
| Delete toast | **Imagem excluída** |
| Lightbox close | existing Modal **Fechar** / X |

Filter: chip row or existing `Select` — **Todas** | **Avulsas** | one option per `usePatientSessions` row (`dateLabel · timeLabel`). Client-side filter of the already-fetched list.

Lightbox: existing `Modal` + `<img alt={description \|\| 'Imagem do paciente'} />`. Do not add a lightbox package.

Edit description: small `Modal` + `Textarea` (same as goals editor). Optionally allow changing `session_id` in that modal (allocation is not create-only). Recommend **yes** — cheap and matches “avulsa OR tied”.

Delete: `ConfirmDialog` `tone="danger"` like goals/sessions.

`<input type="file" accept="image/jpeg,image/png,image/webp" />` hidden; trigger from `Button`. Always re-check `file.type` in Zod — iOS can ignore `accept`.

### Storage RLS (folder = patient id)

```sql
-- Source: https://supabase.com/docs/guides/storage/security/access-control
-- Source: https://supabase.com/docs/guides/storage/schema/helper-functions
-- Always bind bucket_id. Policies without it apply to every bucket.

create policy patient_images_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_read_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_images_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );

create policy patient_images_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'patient-images'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (select private.can_write_patient(((storage.foldername(name))[1])::uuid))
  );
```

No UPDATE policy (no upsert). UUID regex **before** `::uuid` so a bad folder name is `false`, not a policy ERROR.

`createSignedUrl` / `createSignedUrls` require **SELECT** on `storage.objects`. [CITED: supabase.com/docs/reference/javascript/storage-from-createsignedurl]

`remove` requires **DELETE** and **SELECT**. [CITED: supabase.com/docs/reference/javascript/storage-from-remove]

### Anti-Patterns to Avoid

- **Public bucket** for clinical photos.
- **`image/*` or SVG/GIF** on the bucket (XSS via SVG; HEIC display gap).
- **User-supplied filename** as the object path (spaces, `../`, HEIC extension).
- **Storing signed URLs** in the table (they expire).
- **Listing Storage** as the gallery (`storage.list`) instead of `patient_images`.
- **`DELETE FROM storage.objects`** in a trigger to “clean S3” — official schema: metadata delete does **not** delete the provider object; you are still billed. [CITED: supabase.com/docs/guides/storage/schema/design]
- **`supabase db push`** / creating the bucket only from the JS client (`createBucket` needs privileges the anon key must not have).
- **Stuffing upload into `PatientPage.tsx`.**
- **`localStorage` / base64** for images.
- **Disabled** Adicionar/Excluir that still look tappable when `!canWrite`.
- **Rewriting** `can_read_patient` / `can_write_patient`.
- **Hijacking** the Documentos shortcut card.
- **New npm** compressor / HEIC / lightbox.
- **Restyling** Button / Input / AppShell.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Object storage + ACL | Custom S3 client, presign server, or bytea | Supabase Storage + RLS | Already in supabase-js; policies share Phase 3 helpers. |
| Temporary view URL | Homegrown token table | `createSignedUrls` | Official expiry; SELECT RLS is the gate. [CITED: JS reference] |
| Confirm delete | Custom overlay | `ConfirmDialog` | Existing goals/sessions. |
| MIME/size ceiling | Trust the `<input>` only | Bucket `allowed_mime_types` + `file_size_limit` + Zod | Bucket is enforced even if the SPA is skipped. [CITED: creating-buckets / file-limits] |
| Ficha authorization | Client-only `if (canWrite)` | Table + Storage RLS | ASVS 4.1.1; empresa JWT can still hit APIs. |
| User-facing vendor errors | `throw new Error(error.message)` | `mapDbError` + a small `mapStorageError` | `throwIfError` in sessions still leaks raw text. New code must not. |
| UUID / timestamps | App clocks as PK without default | `gen_random_uuid()`, `now()`; service may set `id` to match path | Path and row stay 1:1. |

**Key insight:** Hand-roll the **gallery UI and metadata shape** (that is the product). Do **not** hand-roll object storage, signed URLs, or a second authorization system.

## Runtime State Inventory

New table + new bucket (not a rename). Categories checked:

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | No `patient_images` in app types/SQL. No Storage calls. Hosted project may already have unrelated buckets (unknown). | Code + SQL create. Use `ON CONFLICT (id) DO NOTHING` on the bucket insert. Do **not** DROP other storage policies. |
| Live service config | Storage Settings **global file size** lives in the Dashboard, not git. Per-bucket limit cannot exceed it. Free max 50 MB. [CITED: supabase.com/docs/guides/storage/uploads/file-limits] | If uploads 413, human raises global limit (or lowers bucket to the global cap). |
| OS-registered state | None — verified: SPA-only. | none |
| Secrets/env vars | Existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` only. | none — no new `VITE_*` |
| Build artifacts | `database.types.ts` is bakery-only. | Local `ImageRow` only |

**Nothing found in category:** OS / secrets / build artifacts — none, as above.

## Common Pitfalls

### Pitfall 1: Public URL leak
**What goes wrong:** Clinical photos become world-readable.
**Why it happens:** `public = true` or `getPublicUrl` “for convenience”.
**How to avoid:** Private bucket; only `createSignedUrls`.
**Warning signs:** Dashboard shows the bucket as Public; `<img src>` contains `/object/public/`.

### Pitfall 2: Storage policy without `bucket_id`
**What goes wrong:** Policies apply to every bucket (or none of yours).
**Why it happens:** Copy-paste of the official “folder = jwt sub” example without a bucket predicate.
**How to avoid:** Every policy starts with `bucket_id = 'patient-images'`. Never `DROP POLICY` by a generic name that might be another feature’s.
**Warning signs:** Avatars/other buckets suddenly 403 or wide open.

### Pitfall 3: `::uuid` cast throws inside RLS
**What goes wrong:** Storage API returns 500 instead of 403 on a weird path.
**Why it happens:** `(storage.foldername(name))[1]::uuid` on non-UUID text errors the policy.
**How to avoid:** Regex match first (Pattern Storage RLS).
**Warning signs:** Uploads to wrong paths 500.

### Pitfall 4: SQL-delete `storage.objects` thinking S3 is gone
**What goes wrong:** Inaccessible object, still billed; or trigger “cleanup” that official docs forbid.
**Why it happens:** Treating Storage catalog tables as the object store. [CITED: schema/design]
**How to avoid:** `storage.from().remove([path])` then DELETE the `patient_images` row. No AFTER DELETE trigger on `storage.objects`.
**Warning signs:** Trigger functions in `07-*.sql` touching `storage.objects`.

### Pitfall 5: Orphan object after failed INSERT
**What goes wrong:** Bytes in the bucket, no gallery row (or the reverse).
**Why it happens:** Two-phase write without compensate.
**How to avoid:** Upload then INSERT; on INSERT error, `remove`. Delete: `remove` then row; if row DELETE fails, toast and leave the object (retryable) rather than losing the only copy.
**Warning signs:** Dashboard Storage files with no ficha thumbnails.

### Pitfall 6: Empresa sees tappable Adicionar that RLS rejects
**What goes wrong:** Toast **Você não tem permissão para esta ação.**
**Why it happens:** Default `canWrite = true` on the panel (goals/evoluções already do this).
**How to avoid:** Pass `canWrite` from `PatientPage`; unmount write controls. RLS remains authority.
**Warning signs:** Plus button on a colleague ficha.

### Pitfall 7: HEIC from iPhone
**What goes wrong:** Upload “succeeds” or is rejected opaquely; Chrome shows a broken image.
**Why it happens:** `accept="image/*"`; `file.type === 'image/heic'`.
**How to avoid:** Explicit accept + Zod enum of three MIME types; Portuguese helper toast.
**Warning signs:** Empty thumbnails after a phone upload.

### Pitfall 8: Signed URL expiry mid-session
**What goes wrong:** Grid breaks after the tab stays open > expiry.
**Why it happens:** 60s demo expiry copied from docs.
**How to avoid:** `3600` + `staleTime: 30_000` so refetch remints. Do not persist the URL.
**Warning signs:** Images die after ~1 minute (docs sample used `60`).

### Pitfall 9: Session from another patient
**What goes wrong:** Photo attached to the wrong atendimento (or INSERT 23503 / silent).
**Why it happens:** Client sends any UUID.
**How to avoid:** RLS EXISTS same `patient_id`; service also checks the session is in `usePatientSessions` data before submit (UX). Zod: `sessionId` uuid nullable.
**Warning signs:** Filter-by-session shows another patient’s date.

### Pitfall 10: Fifth tab clipped
**What goes wrong:** **Imagens** never appears on mobile.
**Why it happens:** Header `overflow-hidden`.
**How to avoid:** `overflow-x-auto` on the tablist.
**Warning signs:** Only four tabs visible in 375px.

### Pitfall 11: Global  file size < 8 MiB
**What goes wrong:** Bucket says 8 MiB; Storage Settings is 1–2 MB; all phone photos 413.
**Why it happens:** Per-bucket limit cannot exceed the Dashboard global cap. [CITED: file-limits]
**How to avoid:** SQL comment + UAT step: if 413, check Storage Settings. Do not invent a compressor to paper over this.
**Warning signs:** Every large JPEG fails; small PNG works.

### Pitfall 12: Raw Storage errors in the toast
**What goes wrong:** English `The object exceeded the maximum allowed size` / RLS text.
**Why it happens:** Copying `sessions.service.ts` `throwIfError`.
**How to avoid:** `mapStorageError` → size/MIME/permission Portuguese; else `mapDbError`.
**Warning signs:** English/SQL in toast.

### Pitfall 13: Invalidate misses images after session delete
**What goes wrong:** Deleted sessão still listed in the filter; images still grouped under it until hard refresh.
**Why it happens:** `invalidatePatient` today does not know images; SET NULL already ran.
**How to avoid:** Add `['patients', patientId, 'images']` to `invalidatePatient`.
**Warning signs:** Ghost session chip.

## Code Examples

Verified patterns from official sources and this repo:

### Upload (no upsert)

```ts
// Source: https://supabase.com/docs/guides/storage/uploads/standard-uploads
// Source: https://supabase.com/docs/reference/javascript/storage-from-upload
await supabase.storage.from('patient-images').upload(path, file, {
  contentType: 'image/jpeg',
  upsert: false,
})
```

### Batch signed URLs

```ts
// Source: https://supabase.com/docs/reference/javascript/storage-from-createsignedurls
const { data, error } = await supabase.storage
  .from('patient-images')
  .createSignedUrls(paths, 3600)
```

### Remove then delete row

```ts
// Source: https://supabase.com/docs/reference/javascript/storage-from-remove
const { error: storageError } = await supabase.storage.from('patient-images').remove([row.storagePath])
if (storageError) throw new Error(mapStorageError(storageError))
const { error } = await supabase.from('patient_images').delete().eq('id', row.id)
if (error) throw new Error(mapDbError(error))
```

### Zod at the boundary

```ts
// Source: src/schemas/patient.schema.ts optionalText pattern
const PATIENT_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export const imageUploadSchema = z.object({
  mimeType: z.enum(PATIENT_IMAGE_MIMES, {
    errorMap: () => ({ message: 'Envie JPEG, PNG ou WebP. Fotos do iPhone: escolha a opção mais compatível.' }),
  }),
  byteSize: z.number().int().positive().max(MAX_IMAGE_BYTES, 'A imagem deve ter no máximo 8 MB.'),
  sessionId: z.string().uuid().nullable(),
  description: z.string().trim().max(500, 'Máximo de 500 caracteres'),
})
```

### Tab wiring (extend existing)

```tsx
// Source: src/pages/PatientPage.tsx + PatientProfileHeader.tsx
export type PatientTab = 'resumo' | 'cadastro' | 'evolucoes' | 'avaliacao' | 'imagens'

// PatientPage setTab / aba parse: add imagens the same way as evolucoes
// Header: button label Imagens; nav class overflow-x-auto (replace overflow-hidden)
```

### Hide writes (goals/evoluções)

```tsx
// Source: src/components/patients/PatientEvolutionsPanel.tsx
{canWrite ? (
  <Button type="button" onClick={openUpload}>
    Adicionar imagem
  </Button>
) : null}
```

### SQL Editor checklist (after Success)

```sql
-- 1. creator INSERT own patient_images + upload path ok
-- 2. creator UPDATE description ok
-- 3. creator DELETE row after storage.remove ok
-- 4. session_id of another patient → WITH CHECK fail
-- 5. other authenticated INSERT colleague patient_id → 42501
-- 6. empresa SELECT colleague rows + createSignedUrl ok
-- 7. empresa INSERT/DELETE colleague → 42501
-- 8. MIME image/heic or image/svg+xml → bucket or CHECK reject
-- 9. Phase 3 patient_sessions_* / can_* helpers unchanged
```

## Recommended approach (planner waves)

**Wave 1 — contracts + SQL [BLOCKING]**

1. Types + Zod (`PatientImage`, upload/description schemas).
2. `07-patient-images.sql`: bucket + table + grants + table RLS + storage RLS + `notify pgrst`. Copy to gitignored `/supabase/`. Human applies in SQL Editor.

**Wave 2 — service + hooks**

3. `patientImages.service.ts` + `mapStorageError`.
4. Hooks + `invalidatePatient` images key.

**Wave 3 — UI**

5. Tab **Imagens** + `overflow-x-auto`.
6. `PatientImagesPanel`: filter, grid, lightbox, upload modal, edit description, delete confirm, `canWrite` hide.

Do not start Wave 3 against a missing bucket (uploads 404/400).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Public CDN URLs for all files | Private bucket + signed URLs | Storage access model (current docs) | Clinical photos must not use public retrieve |
| Standard upload only | Standard ≤6MB “ideal”; TUS for larger | Current Storage upload guide | 8 MiB clinic still uses standard `upload()` |
| Folder = `auth.uid()` | Folder = `patient_id` + Phase 3 helpers | This phase | Empresa must read colleague folders |
| Native `title` / public img | Author-controlled gallery + Modal | Product | Description is data, not a tooltip |

**Deprecated/outdated:**

- Public bucket for PHI-like clinic photos.
- `database.types.ts` as clinic schema.
- `localStorage` image cache (PhysicalEvaluationPanel is not an analog).
- SQL mutation of `storage.objects` as a substitute for the Storage API.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hosted project has Storage enabled (default on Supabase) | Environment | SQL `storage.buckets` insert fails — human enables Storage in Dashboard. |
| A2 | `storage.objects` policies can `EXECUTE` `private.can_read_patient` / `can_write_patient` (already GRANTed to `authenticated`) | Storage RLS | If Editor errors on schema/search_path, wrap a thin `private.can_*_image_object(name text)` SECURITY DEFINER — do **not** rewrite the Phase 3 helpers. |
| A3 | No existing bucket id `patient-images` | SQL | `ON CONFLICT DO NOTHING` is safe; if a leftover public bucket reused the id, human must fix in Dashboard (do not `UPDATE public = false` blindly without checking objects). |
| A4 | Rejecting HEIC is acceptable for v1 | MIME | iPhone users need a one-line helper. If UAT fails, a later phase may add a converter (new package = new research). |
| A5 | 8 MiB is enough without canvas compression | Size | If UAT 413s on real clinic photos, check global limit first; only then consider native canvas (no package). |
| A6 | `ON DELETE SET NULL` on `session_id` is the right product | Schema | User may prefer CASCADE (lose photos with the sessão). Not locked — planner should keep SET NULL unless discuss-phase appears. |
| A7 | No legal retention period was specified | Security | Do not invent auto-delete. [ASSUMED] |
| A8 | Global Storage file-size setting is ≥ 8 MiB (Free allows up to 50 MB) | File limits | 413 until a human raises the Dashboard cap. |
| A9 | `INSERT` into `storage.buckets` including `file_size_limit` / `allowed_mime_types` is allowed from SQL Editor | Bucket create | Official creating-buckets SQL sample only shows `(id, name, public)`; columns exist on the schema diagram. If INSERT with extra columns fails, insert the three-column row then `UPDATE` limits, or set limits in Dashboard. |

A1–A3/A8–A9 are environment. A4–A7 are discretion — planner should treat them as the recommended default, not fake locks.

## Open Questions

1. **Does `private.can_*` work from `storage.objects` policies on this project?**
   - What we know: helpers are `SECURITY DEFINER`, `search_path = ''`, GRANTed to `authenticated`. Table policies already call them. [VERIFIED: `03-account-types-team.sql`]
   - What's unclear: Storage API role / search_path when evaluating `storage.objects`.
   - Recommendation: Wave 1 SQL includes the policies; Editor checklist item 1/6. Fallback wrapper function — do not block planning.

2. **How many images per patient in real use?**
   - What we know: no product cap specified.
   - What's unclear: whether `createSignedUrls` of 100+ paths is enough.
   - Recommendation: no cap in v1; list `order created_at desc`. If needed later, page in the service.

3. **Should edit re-allocate sessão?**
   - What we know: locked intent is avulsa **or** tied; not “immutable after upload”.
   - What's unclear: user preference.
   - Recommendation: allow `session_id` + description UPDATE (same modal). Cheap.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | lint/typecheck/dev | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| Hosted Supabase SQL Editor | table + bucket + RLS | ✓ (project convention) | — | No CLI `db push` |
| Hosted Supabase Storage | bytes | ✓ assumed (A1) | — | Phase blocked until Storage is on |
| `supabase` CLI | (not used) | ✗ | — | SQL Editor only |
| Vitest | optional unit tests | ✗ | — | `npm run lint && npm run typecheck` |
| Playwright | gallery UAT | ✗ | — | Manual browser UAT |
| ctx7 CLI | docs | ✗ | — | Official supabase.com fetches used |
| slopcheck | package gate | ✗ | — | No installs |

**Missing dependencies with no fallback:** none that block planning. Apply is human + SQL Editor (same as Phases 3/5/6). If Storage is disabled on the project, Wave 1 is blocked until the Dashboard shows Storage.

**Missing dependencies with fallback:** Vitest / Playwright — do not block product plans.

Step 2.6: no new runtime tools. Graph `.planning/graphs/graph.json` is **absent** — graphify skipped.

## Validation Architecture

> `workflow.nyquist_validation` is **absent** in `.planning/config.json` → treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none installed — ESLint 9 + `tsc --noEmit`. Intended unit runner is Vitest (TESTING.md) |
| Config file | `eslint.config.js`, `tsconfig.json` — no vitest/jest config |
| Quick run command | `npm run lint && npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` plus SQL Editor RLS checklist + browser UAT |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-19.1 *(proposed)* | Tab **Imagens**; `aba=imagens` | source | `rg "imagens" src/components/patients/PatientProfileHeader.tsx src/pages/PatientPage.tsx` | ❌ Wave 0 (grep after implement) |
| REQ-19.2 *(proposed)* | Gallery from Supabase; empty copy | source | `rg "Nenhuma imagem nesta ficha" src/components/patients/PatientImagesPanel.tsx`; `rg createSignedUrls src/services/patientImages.service.ts` | ❌ |
| REQ-19.3 *(proposed)* | Avulsa XOR session; filter | source + SQL | `rg session_id .planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/`; panel filter labels **Todas** / **Avulsas** | ❌ |
| REQ-19.4 *(proposed)* | Description persist + edit | source | `rg description src/services/patientImages.service.ts`; Zod max 500 | ❌ |
| REQ-19.5 *(proposed)* | Private bucket; no mock | source + SQL | `rg "public, false" sql` / `public = false`; typecheck | ❌ |
| REQ-19.6 *(proposed)* | `canWrite` hides writes | source | panel `canWrite`; no disabled-looking Adicionar | ❌ |
| REQ-19 MIME | Zod rejects HEIC / oversize | unit (optional) | `npx vitest run src/schemas/patient.schema.test.ts` | ❌ Wave 0 deferred |
| REQ-19.6 RLS | empresa cannot INSERT colleague | manual | SQL Editor JWT matrix | ❌ no Playwright |

### Sampling Rate

- **Per task commit:** `npm run lint && npm run typecheck`
- **Per wave merge:** same; SQL Editor smoke if the wave touched `.sql`
- **Phase gate:** lint + typecheck green; SQL applied; browser UAT of upload / filter / empresa read-only / HEIC reject

### Wave 0 Gaps

- [ ] Optional later: Vitest + schema tests (MIME enum, size, description max)
- [ ] Framework install: **deferred** — product plans must not wait on Vitest (same as 05/06-RESEARCH)

If the planner does **not** introduce Vitest, Nyquist VALIDATION.md should mark schema rows as Wave 0 deferred and keep `npm run typecheck` as the automated command.

### Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload JPEG + description + avulsa appears in grid | REQ-19.2–19.4 | Storage + UI | Writer account, aba Imagens, Adicionar |
| Tie to a sessão; filter Avulsas hides it; filter sessão shows it | REQ-19.3 | Interaction | Use an existing Evoluções session |
| Lightbox opens; description visible | REQ-19.2 / 19.4 | Visual | Click thumbnail |
| Edit description; delete confirm removes from grid | Discretion | Modal + Storage | ConfirmDialog **Excluir** |
| HEIC / 9 MB file rejected in Portuguese | Discretion / Pitfall 7 | Device MIME | iPhone or renamed file |
| Empresa colleague ficha: grid visible, no Adicionar/Excluir | REQ-19.6 | Two accounts | Same consult banner path |
| Tab visible on 375px (scroll) | Pitfall 10 | Layout | Mobile viewport |
| SQL RLS matrix (checklist in SQL section) | REQ-19.5 / 19.6 | Do not mock RLS | SQL Editor as two JWTs |
| 413 → check Storage Settings global limit | Pitfall 11 | Dashboard | Only if phone JPEGs fail |

## Security Domain

> `security_enforcement` is absent in `.planning/config.json` → enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing session; do not change Auth |
| V3 Session Management | no | Unchanged supabase-js `persistSession` |
| V4 Access Control | yes | Table RLS + `storage.objects` RLS → `private.can_read_patient` / `can_write_patient`. UX: `canWritePatient`. [VERIFIED: `03-account-types-team.sql` 183–204] |
| V5 Input Validation | yes | Zod MIME/size/description; bucket MIME + size; path CHECK regex; no user path |
| V6 Cryptography | no | Signed URLs are Storage-minted HMAC-style tokens — do not hand-roll |

### Known Threat Patterns for React + Supabase Storage gallery

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Empresa/fisio INSERT on colleague `patient_id` | Elevation of privilege | Table + Storage INSERT `can_write_patient`. Hide write chrome. |
| Guess `/object/public/patient-images/...` | Information disclosure | Bucket `public = false`. |
| Long-lived or logged signed URL | Information disclosure | 3600s expiry; do not persist; do not `console.log` URLs. |
| SVG / HTML as “image” | XSS | MIME allow-list jpeg/png/webp only; never `dangerouslySetInnerHTML`; `alt` is text. |
| Path `../` or another patient’s folder | Tampering / IDOR | Service builds path from route `patientId` + generated id; Storage RLS folder[1] must pass `can_write_patient`. |
| Attach colleague session id | Tampering | RLS EXISTS same `patient_id`. |
| RLS / Storage error leak | Information disclosure | `mapDbError` / `mapStorageError` (42501 generic). |
| Orphaned PHI in Storage after failed row delete | Repudiation / residual data | `remove` via API; no SQL-only object delete. |
| Mock gallery in the client | Integrity | Empty array is empty; no placeholder photos. |

Clinical photos are health-related data (LGPD). No retention window was specified — do **not** invent auto-purge. [ASSUMED: A7]

`private.can_write_patient`: creator only; empresa owner is **not** a writer. [VERIFIED: `03-account-types-team.sql` 183–204]

## Sources

### Primary (HIGH confidence)

- In-repo: `src/pages/PatientPage.tsx`, `src/components/patients/PatientProfileHeader.tsx`, `src/components/patients/PatientEvolutionsPanel.tsx`, `src/components/patients/PatientGoalsPanel.tsx`, `src/hooks/usePatients.ts`, `src/services/sessions.service.ts`, `src/lib/accountAccess.ts`, `src/lib/security/index.ts`, `src/lib/supabase/client.ts`, `src/types/patient.ts`
- `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` — `can_read_patient` / `can_write_patient` + `patient_sessions_*`
- `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` — SQL Editor header, FORCE RLS, GRANT
- `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` — Editor apply path
- `.planning/codebase/{ARCHITECTURE,CONVENTIONS,STACK,TESTING}.md`
- Storage overview — https://supabase.com/docs/guides/storage
- Access control — https://supabase.com/docs/guides/storage/security/access-control
- Helper functions — https://supabase.com/docs/guides/storage/schema/helper-functions
- Standard uploads — https://supabase.com/docs/guides/storage/uploads/standard-uploads
- File limits — https://supabase.com/docs/guides/storage/uploads/file-limits
- Bucket fundamentals (private vs public) — https://supabase.com/docs/guides/storage/buckets/fundamentals
- Creating buckets (SQL insert) — https://supabase.com/docs/guides/storage/buckets/creating-buckets
- Storage schema (`file_size_limit`, `allowed_mime_types`; do not SQL-delete objects) — https://supabase.com/docs/guides/storage/schema/design
- JS `upload` / `createSignedUrl(s)` / `remove` — https://supabase.com/docs/reference/javascript/storage-from-upload (and createsignedurl, createsignedurls, remove)

### Secondary (MEDIUM confidence)

- Community SQL samples that add `file_size_limit` / `allowed_mime_types` on `INSERT` (columns confirmed on official schema diagram; creating-buckets JS API is the documented restriction path)
- Phase 5/6 RESEARCH apply-path template

### Tertiary (LOW confidence)

- Exact iOS `File.type` for every HEIC capture path
- Hosted leftover buckets / global size cap (not queried)
- Whether Storage policy evaluation can see `private.*` without a wrapper (A2)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — reuse React/TanStack/Zod/supabase-js Storage; no new packages
- Architecture: HIGH — tab + panel + service + Phase 3 helpers is the ficha pattern; private bucket is official for sensitive files
- Pitfalls: HIGH — public bucket, policy scope, S3-vs-SQL delete, HEIC, and canWrite hide are documented in official docs or this repo

**Research date:** 2026-09-14
**Valid until:** 2026-10-14 (stable Storage API; bucket limits and HEIC UX may tighten after UAT)
