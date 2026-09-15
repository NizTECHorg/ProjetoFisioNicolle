# Phase 7: Galeria de imagens na ficha do paciente - Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 12
**Analogs found:** 12 / 12 (Storage I/O, Storage RLS, câmera/lote, `navigator.share`, e flag D-07 não têm gêmeo no repo — planner usa `07-RESEARCH.md` + CONTEXT D-01–D-12)

Honor CONTEXT over RESEARCH and UI-SPEC on D-01–D-12: lote (várias), **Tirar foto** no viewport estreito, **Compartilhar**, aviso **Sessão removida.** no lightbox, extra no confirm de Evoluções. UI-SPEC wins on tokens, grid, chips, hide-write, copy base.

**Do not** analog `src/lib/permissions.ts`, `src/types/database.types.ts`, `PatientPhysicalEvaluationPanel` localStorage/PDF dropzone (anti-pattern for photos), `sessions.service.ts` / `evaluations.service.ts` `throwIfError` that leaks `error.message`, `supabase db push`, Uppy/HEIC/lightbox npm, or `clsx`. Reuse `canWritePatient` as-is — do **not** edit `src/lib/accountAccess.ts`.

Constraints for every new clinic file: named exports, single quotes, no semicolons, `[...].join(' ')` not `clsx`, page → hook → service → Supabase, hide write when `!canWrite` (unmount, never `disabled` that still looks tappable), SQL Editor only.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql` | migration | CRUD (CREATE TABLE + bucket + RLS) | `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql` (CREATE + GRANT + FORCE RLS) + `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` (`patient_goals_*` calling `can_read_patient` / `can_write_patient`) | exact |
| `supabase/07-patient-images.sql` (gitignored paste copy) | migration | file-I/O (Editor paste) | `supabase/05-autonomo-finance.sql` / `supabase/06-patient-focus-region-key.sql` | exact |
| `src/types/patient.ts` | model | transform | same file, `PatientSessionRecord` / `PatientGoal` | exact |
| `src/schemas/patient.schema.ts` | config | transform | same file, `optionalText` + `patientGoalSchema` + `patientAlertSchema` | exact |
| `src/lib/security/index.ts` | utility | transform (error map) | same file, `mapDbError` | exact |
| `src/services/patientImages.service.ts` | service | CRUD + file-I/O (Storage) | `src/services/finance.service.ts` (`mapDbError` + `sanitizeText` + local Row) + `src/services/sessions.service.ts` (list/map camelCase). Storage API: RESEARCH only | role-match |
| `src/hooks/usePatientImages.ts` | hook | CRUD | `src/hooks/usePatients.ts` (`usePatientSessions` + goal mutations) + `src/hooks/useTeam.ts` (dedicated feature file) | exact |
| `src/hooks/usePatients.ts` | hook | event-driven (invalidate) | same file, `invalidatePatient` | exact |
| `src/components/patients/PatientImagesPanel.tsx` | component | CRUD + file-I/O | `PatientEvolutionsPanel.tsx` (header / empty / hide-write) + `PatientGoalsPanel.tsx` (Modal + ConfirmDialog + Pencil/Trash) + `PatientEvaluationPanel.tsx` (isError article) + `PatientAlertsPanel.tsx` (Textarea + Select) | exact |
| `src/components/patients/PatientProfileHeader.tsx` | component | request-response | same file, `PatientTab` + tab buttons | exact |
| `src/pages/PatientPage.tsx` | route | request-response | same file, `?aba=evolucoes` + mount `PatientEvolutionsPanel` | exact |
| `src/components/patients/PatientEvolutionsPanel.tsx` | component | request-response (copy only) | same file, ConfirmDialog de excluir sessão | exact |

**Do not create/modify:** `src/types/database.types.ts`, `src/lib/permissions.ts`, `src/lib/accountAccess.ts`, Phase 3 `private.can_*` helpers, `Button` / `Modal` / `ConfirmDialog` / `Select` / `Textarea` primitives, Resumo **Documentos · Em breve**, new routes.

**CONTEXT extras the planner must not drop (UI-SPEC/RESEARCH under-specify):** D-01 two file triggers on `< ~768px`; D-03 batch same description/session; D-04 invalid files toast-and-skip, valids upload; D-05 X on lote thumbs; D-07 persist orphan vs avulsa-original; D-08 Evoluções confirm sentence; D-12 `navigator.share` (hide if missing).

---

## Pattern Assignments

### `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql` (migration, CRUD)

**Analog:** Phase 5 CREATE TABLE + GRANT + FORCE RLS; Phase 3 `patient_goals_*` policies; Phase 6 SQL header/apply comments. Bucket + `storage.objects` policies: **no analog** — copy RESEARCH Pattern 1 / Storage RLS.

**Header / apply path** (Phase 6 `06-patient-focus-region-key.sql` lines 1–5):
```sql
-- REQ-18 silhueta de areas de foco. D-08 D-09. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP patient_focus_areas_*. Nao CREATE TABLE.
```

Copy this shape: proposed REQ-19, D-06/D-07/D-11, “Cole no SQL Editor”, “Nao use supabase db push”, “Nao DROP patient_sessions_* / can_*”, “Nao DELETE FROM storage.objects”.

**CREATE TABLE + indexes** (Phase 5 `05-autonomo-finance.sql` lines 9–24):
```sql
create table if not exists public.autonomo_prices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  amount_brl numeric(12, 2) not null check (amount_brl > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists autonomo_prices_owner_idx
  on public.autonomo_prices (owner_id);
```

Phase 7 adaptation: `public.patient_images` per RESEARCH Pattern 2. Add CONTEXT D-07 column (planner names it — `session_removed boolean not null default false` or equivalent) so `session_id` null alone does **not** distinguish avulsa-original vs órfã. FK `session_id … on delete set null` (D-06). Do **not** CASCADE photos with the sessão.

**GRANT / REVOKE** (Phase 5 lines 74–77):
```sql
revoke all on table public.autonomo_prices from anon, public;
revoke all on table public.autonomo_session_charges from anon, public;
grant select, insert, update on table public.autonomo_prices to authenticated;
```

Phase 7: `GRANT select, insert, update, delete` on `patient_images` to `authenticated`. No `anon`. No `service_role`.

**ENABLE + FORCE RLS** (Phase 5 lines 82–85 — Phase 3 clinic tables only ENABLE, not FORCE; new clinic table follows Phase 5):
```sql
alter table public.autonomo_prices enable row level security;
alter table public.autonomo_prices force row level security;
alter table public.autonomo_session_charges enable row level security;
alter table public.autonomo_session_charges force row level security;
```

**Table policies calling Phase 3 helpers** (`03-account-types-team.sql` lines 573–596):
```sql
create policy patient_goals_select
  on public.patient_goals
  for select
  to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_goals_insert
  on public.patient_goals
  for insert
  to authenticated
  with check ((select private.can_write_patient(patient_id)));

create policy patient_goals_update
  on public.patient_goals
  for update
  to authenticated
  using ((select private.can_write_patient(patient_id)))
  with check ((select private.can_write_patient(patient_id)));

create policy patient_goals_delete
  on public.patient_goals
  for delete
  to authenticated
  using ((select private.can_write_patient(patient_id)));
```

Phase 7: same four policies on `patient_images`. INSERT/UPDATE `WITH CHECK` also requires RESEARCH session EXISTS (same `patient_id` or `session_id is null`). **Do not** rewrite `can_read_patient` / `can_write_patient`. **Do not** DROP Phase 3 policies.

**PostgREST reload** (Phase 6 line 52):
```sql
notify pgrst, 'reload schema';
```

**Bucket + Storage RLS:** no in-repo analog. Copy RESEARCH Pattern 1 (`insert into storage.buckets … public, false`, MIME jpeg/png/webp, 8388608) and Storage RLS (`bucket_id = 'patient-images'` + UUID regex **before** `::uuid` + `private.can_*`). No UPDATE policy on `storage.objects`. `ON CONFLICT (id) DO NOTHING` on the bucket.

**SQL Editor checklist** after Success: copy RESEARCH checklist (creator CRUD, empresa SELECT + signed URL, empresa INSERT 42501, HEIC reject, Phase 3 helpers unchanged) plus D-07: delete sessão → `session_id` null and orphan flag true.

---

### `supabase/07-patient-images.sql` (migration, file-I/O)

**Analog:** gitignored `/supabase/` paste copies from Phases 5/6 (`.gitignore` line 14: `/supabase/`).

Identical bytes to the committed `.planning/phases/07-…/sql/07-patient-images.sql`. Human applies in SQL Editor. Never `supabase db push`.

---

### `src/types/patient.ts` (model, transform)

**Analog:** same file — add `PatientImage` next to `PatientSessionRecord` (lines 63–76), not bakery `database.types.ts`.

**Named export + camelCase DTO** (lines 63–76):
```typescript
export interface PatientSessionRecord {
  id: string
  patientId: string
  scheduledAt: string
  dateLabel: string
  timeLabel: string
  type: string
  place: string
  status: SessionStatus
  therapistId: string | null
  therapistName: string | null
  evolution: SessionEvolution | null
}
```

Phase 7 shape (planner): `id`, `patientId`, `sessionId: string | null`, `storagePath`, `description`, `mimeType`, `byteSize`, `createdAt`, `signedUrl: string | null` (DTO only — never persist), plus D-07 `sessionRemoved: boolean` (or equivalent). Optional `UpdatePatientImageInput` `{ description, sessionId }`. Keep `signedUrl` off the table.

---

### `src/schemas/patient.schema.ts` (config, transform)

**Analog:** same file `optionalText` (lines 6–18) + `patientGoalSchema` (lines 150–163) + `patientAlertSchema` max 500 (lines 133–140).

**optionalText helper** (lines 6–18):
```typescript
const optionalText = (max: number, minWhenFilled = 0) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .superRefine((value, ctx) => {
      if (value !== '' && value.length < minWhenFilled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Mínimo de ${minWhenFilled} caracteres`,
        })
      }
    })
```

**Portuguese Zod messages** (lines 150–163):
```typescript
export const patientGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Descreva o objetivo com pelo menos 2 caracteres')
    .max(240, 'Máximo de 240 caracteres'),
  createdOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de criação'),
  achievedOn: optionalDate,
})
```

Use the real goal schema as-is (max 240). For images: `description: optionalText(500)` (empty allowed). RESEARCH MIME enum + size — CONTEXT D-04 toasts those messages per file in the lote, not as a form-blocking single `safeParse` of the whole batch:

```typescript
// Source: 07-RESEARCH.md Code Examples (Zod at the boundary)
const PATIENT_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
```

`sessionId`: `z.string().uuid().nullable()` or empty-string → null in the form schema (Select empty option **Avulsa (sem sessão)**). Export `z.infer` types next to the schemas (same file pattern lines 115–122). Form schema for the modal: description + sessionId (files live in component state, not RHF file fields — RHF here is metadata only, like alerts).

---

### `src/lib/security/index.ts` (utility, transform)

**Analog:** same file `mapDbError` (lines 201–228). Add `mapStorageError` beside it; do **not** throw raw Storage English.

**mapDbError** (lines 201–228):
```typescript
export function mapDbError(error: { message?: string; code?: string }): string {
  const message = error.message?.toLowerCase() ?? ''
  const code = error.code ?? ''

  if (code === '42501' || message.includes('operation_not_permitted')) {
    return 'Você não tem permissão para esta ação.'
  }
  // … duplicate / FK / check / network …
  return 'Não foi possível concluir a operação. Tente novamente.'
}
```

Phase 7: `mapStorageError` maps size → **A imagem deve ter no máximo 8 MB.**; MIME/HEIC → **Envie JPEG, PNG ou WebP. Fotos do iPhone: escolha a opção mais compatível.**; permission → same 42501 string; else `mapDbError(error)` or UI-SPEC save fail **Não foi possível salvar. Verifique o arquivo e tente de novo.** Never `console.log` signed URLs.

**sanitizeText** (lines 5–10) — apply to description at the service boundary, max 500:
```typescript
export function sanitizeText(input: string, maxLength = 255): string {
  return input
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, maxLength)
}
```

---

### `src/services/patientImages.service.ts` (service, CRUD + file-I/O)

**Analog:** `finance.service.ts` for errors + sanitize + local Row; `sessions.service.ts` for list/map/order. **Do not** copy `sessions.service.ts` `throwIfError` (leaks `error.message`). Storage calls: RESEARCH Pattern 3 (no in-repo `supabase.storage`).

**Imports / client / mapDbError** (`finance.service.ts` lines 1–11, 56–58):
```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError, sanitizeText } from '@/lib/security'
import type { AutonomoPrice, CreatePriceInput } from '@/types/finance'

function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}
```

Phase 7: also import `mapStorageError` and image Zod schema. Local `ImageRow` (snake_case) in this file — same as `PriceRow` / `SessionRow`. Do **not** extend `database.types.ts`.

**Local row + camelCase map** (`sessions.service.ts` lines 22–32, 102–116):
```typescript
type SessionRow = {
  id: string
  patient_id: string
  scheduled_at: string
  // …
}

function mapSessionRecord(row: SessionRow): PatientSessionRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    scheduledAt: row.scheduled_at,
    dateLabel: formatDateLabel(row.scheduled_at),
    timeLabel: formatTimeLabel(row.scheduled_at),
    // …
  }
}
```

**List query** (`sessions.service.ts` lines 150–159):
```typescript
export async function listPatientSessions(patientId: string): Promise<PatientSessionRecord[]> {
  const { data, error } = await supabase
    .from('patient_sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('patient_id', patientId)
    .not('scheduled_at', 'is', null)
    .order('scheduled_at', { ascending: false })

  throwIfError(error)
  return ((data ?? []) as SessionRow[]).map(mapSessionRecord)
}
```

Phase 7 list: `.from('patient_images').select(IMAGE_COLUMNS).eq('patient_id', patientId).order('created_at', { ascending: false })` then batch `createSignedUrls(paths, 3600)` and attach `signedUrl` on the DTO. Empty list → `[]`, no mock rows. Skip signed-URL call when there are no paths.

**Sanitize on write** (`finance.service.ts` lines 120–133):
```typescript
export async function createPrice(input: CreatePriceInput): Promise<AutonomoPrice> {
  const ownerId = await requireUserId()
  const { data, error } = await supabase
    .from('autonomo_prices')
    .insert({
      owner_id: ownerId,
      name: sanitizeText(input.name, 80),
      amount_brl: input.amountBrl,
    })
    .select(PRICE_COLUMNS)
    .single()

  throwIfError(error)
  return mapPrice(data as PriceRow)
}
```

**Upload compensate (RESEARCH Pattern 3 — copy into the service; no analog):** generate `imageId` with `crypto.randomUUID()` (same as `toast.store.ts` line 26), path `${patientId}/${imageId}.${ext}`, `storage.from('patient-images').upload(path, file, { contentType, upsert: false })`, then INSERT with `id = imageId`. On INSERT error: `storage.remove([path])` then `throw new Error(mapDbError(error))`. Batch (D-03): loop files; D-04 invalid → skip that file (UI toasts); service still validates each file with Zod.

**Delete inverse** (`sessions.service.ts` lines 268–271 is the **row** half only — wrong order if copied blindly):
```typescript
export async function deletePatientSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('patient_sessions').delete().eq('id', sessionId)
  throwIfError(error)
}
```

Phase 7: `storage.remove([path])` **first**, then DELETE row. If row DELETE fails, throw mapped error and leave the object (retryable). Never SQL-delete `storage.objects`.

**Update metadata:** `.update({ description: sanitizeText(…, 500), session_id, session_removed: false })` — saving Editar imagem clears D-07 aviso even if still avulsa (CONTEXT D-07).

Named exports: `listPatientImages`, `uploadPatientImage`, `updatePatientImage`, `deletePatientImage`. No default export. No `supabase` imported from components.

---

### `src/hooks/usePatientImages.ts` (hook, CRUD)

**Analog:** dedicated file like `useTeam.ts`; query/mutation shape from `usePatients.ts`. RESEARCH Pattern 3 prefers this file **and** images key on `invalidatePatient`.

**Dedicated feature file + onError toast** (`useTeam.ts` lines 1–12, 26–32):
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/stores/toast.store'

function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

**List query** (`usePatients.ts` lines 203–209):
```typescript
export function usePatientSessions(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'sessions'],
    queryFn: () => listPatientSessions(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}
```

Phase 7: `queryKey: ['patients', patientId, 'images']`, `staleTime: 30_000` (signed URLs remint on refetch; RESEARCH Pitfall 8).

**Mutations + Portuguese toast** (`usePatients.ts` lines 147–181):
```typescript
export function useCreatePatientGoal(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertPatientGoalInput) => createPatientGoal(patientId, input),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast('Meta criada', 'success')
    },
    onError,
  })
}
```

Phase 7 toasts (CONTEXT lote + UI-SPEC): upload **Imagem adicionada** / **Imagens adicionadas** when N>1; edit **Descrição atualizada**; delete **Imagem excluída**. Hooks: `usePatientImages`, `useUploadPatientImages` (batch), `useUpdatePatientImage`, `useDeletePatientImage`. All call `invalidatePatient` (after images key is added). MIME/size failures can toast in the panel **before** mutate (D-04) so the hook `onError` stays for RLS/network.

Do **not** colocate the whole feature in `usePatients.ts` unless the planner explicitly prefers fewer files — ARCHITECTURE + RESEARCH prefer a new clinic hook file.

---

### `src/hooks/usePatients.ts` (hook, invalidate)

**Analog:** same file `invalidatePatient` (lines 46–54).

```typescript
function invalidatePatient(qc: ReturnType<typeof useQueryClient>, patientId: string) {
  void qc.invalidateQueries({ queryKey: ['patients'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'dashboard'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'sessions'] })
  void qc.invalidateQueries({ queryKey: ['patients', patientId, 'evaluations'] })
  void qc.invalidateQueries({ queryKey: ['calendar-sessions'] })
  void qc.invalidateQueries({ queryKey: ['finance'] })
}
```

Add `void qc.invalidateQueries({ queryKey: ['patients', patientId, 'images'] })` so session delete (D-06 SET NULL + D-07 flag) refreshes the gallery and drops ghost session chips. `useDeletePatientSession` already calls `invalidatePatient` (lines 280–289) — no extra call in Evoluções if this line exists.

---

### `src/components/patients/PatientImagesPanel.tsx` (component, CRUD + file-I/O)

**Analog:** Evoluções (chrome/empty/hide-write), Goals (Modal + Confirm + hover icons), Avaliação (load error), Alerts (Textarea + Select). Filter chips and camera lote have **no exact twin**.

**Imports / named export / props** (`PatientEvolutionsPanel.tsx` lines 1–26):
```typescript
import { useState } from 'react'
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useDeletePatientSession, usePatientSessions } from '@/hooks/usePatients'

type PatientEvolutionsPanelProps = {
  patientId: string
  canWrite?: boolean
}

export function PatientEvolutionsPanel({ patientId, canWrite = true }: PatientEvolutionsPanelProps) {
```

Phase 7: also `usePatientImages` hooks, `usePatientSessions` for chips + Select labels `` `${dateLabel} · ${timeLabel}` `` (Evoluções line 72). Lucide: `Plus`, `Image`, `Pencil`, `Trash2` (UI-SPEC). Pass `canWrite` from `PatientPage` — default `true` is the Evoluções pitfall; still unmount writes when false.

**Header + hide-write primary CTA** (`PatientEvolutionsPanel.tsx` lines 42–53):
```typescript
<div className="flex flex-wrap items-center justify-between gap-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Evoluções</p>
    <p className="mt-1 text-sm text-muted">Sessões e registros clínicos deste paciente.</p>
  </div>
  {canWrite ? (
    <Button type="button" onClick={() => { setEditing(null); setEditorOpen(true) }}>
      <Plus size={16} />
      Nova sessão
    </Button>
  ) : null}
</div>
```

Copy: eyebrow **Imagens**; support **Fotos avulsas ou ligadas a uma sessão.**; CTA **Adicionar imagem**. Never `disabled` Adicionar.

**Loading spinner + empty card** (`PatientEvolutionsPanel.tsx` lines 55–63):
```typescript
{isLoading ? (
  <div className="flex min-h-32 items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
  </div>
) : sessions.length === 0 ? (
  <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
    <CalendarClock className="mx-auto text-muted" size={22} />
    <p className="mt-3 text-sm text-muted">Nenhuma sessão registrada.</p>
  </article>
```

UI-SPEC: spinner `min-h-48`; empty heading **Nenhuma imagem nesta ficha.**; empty body only if `canWrite`. Filter-empty headings are different strings — do not reuse the global empty heading.

**Load error article** (`PatientEvaluationPanel.tsx` lines 109–113):
```typescript
{isError ? (
  <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
    Não foi possível carregar as avaliações. Confira se o script SQL do REQ-05 já foi executado no Supabase.
  </article>
) : null}
```

Phase 7 copy: **Não foi possível carregar as imagens. Tente de novo em instantes.** (no SQL/English).

**Hover Pencil/Trash unmounted when !canWrite** (`PatientGoalsPanel.tsx` lines 201–220):
```typescript
{canWrite ? (
  <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100">
    <button type="button" aria-label="Editar meta" onClick={() => openEdit(goal)} className="rounded-md p-1 …">
      <Pencil size={12} />
    </button>
    <button type="button" aria-label="Remover meta" onClick={() => setPendingDelete(goal)} className="… hover:text-error">
      <Trash2 size={12} />
    </button>
  </div>
) : null}
```

UI-SPEC: `aria-label="Editar imagem"` / `Excluir imagem`, hit area `min-h-11 min-w-11`. Tile is `<button>` wrapping square `aspect-square` img `object-cover`. Classnames via `[].join(' ')`.

**Modal + RHF + Zod** (`PatientGoalsPanel.tsx` lines 53–56, 228–266 and `PatientAlertsPanel.tsx` lines 193–218):
```typescript
const form = useForm<PatientGoalFormData>({
  resolver: zodResolver(patientGoalSchema),
  defaultValues: emptyForm,
})

{canWrite ? (
  <Modal open={editorOpen} title={editing ? 'Editar meta' : 'Nova meta'} … onClose={closeEditor}>
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Textarea label="Mensagem" rows={4} error={…} {...form.register('message')} />
      <Select label="Tom" options={alertToneOptions} error={…} {...form.register('tone')} />
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={closeEditor}>Cancelar</Button>
        <Button type="submit" isLoading={saving}>Salvar</Button>
      </div>
    </form>
  </Modal>
) : null}
```

Phase 7: cancel labels **Voltar** (UI-SPEC — do not ship **Cancelar**). Upload modal default width; lightbox `wide`. Select **Sessão** options: `{ value: '', label: 'Avulsa (sem sessão)' }` plus `usePatientSessions` rows. Edit modal: description + sessão, **no file replace**.

**Lightbox Modal wide** (`PatientEvolutionsPanel.tsx` lines 132–138 + `Modal.tsx` lines 42–45):
```typescript
<Modal open={editorOpen} title={…} onClose={closeEditor} wide>
```
```typescript
wide ? 'max-w-3xl' : 'max-w-lg'
```

Lightbox: `<img className="max-h-[70vh] w-full object-contain" alt={description || 'Imagem do paciente'} />`. Allocation: tile always **Avulsa** or `dateLabel · timeLabel`; lightbox D-07 **Sessão removida.** until Editar is saved. Writer: Editar (secondary) + Excluir (ghost `text-error`) + **Compartilhar** (D-12). Reader: close chrome only.

**ConfirmDialog danger + cancelLabel** (`PatientEvolutionsPanel.tsx` lines 151–164 + `ConfirmDialog.tsx` lines 8–9, `AutonomoFinancePage.tsx` `cancelLabel="Voltar sem arquivar"`):
```typescript
<ConfirmDialog
  open={Boolean(pendingDelete)}
  title="Excluir sessão"
  description="A sessão e a evolução vinculada serão removidas. Essa ação não pode ser desfeita."
  confirmLabel="Excluir"
  tone="danger"
  isLoading={deleteSession.isPending}
  onClose={() => setPendingDelete(null)}
  onConfirm={() => {
    if (!pendingDelete) return
    deleteSession.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }}
/>
```

Phase 7: title/confirm **Excluir imagem**; description **A imagem será removida desta ficha.**; `cancelLabel="Voltar"`. Unmount ConfirmDialog when `!canWrite`.

**Hidden file input (copy accept only — not the PDF dropzone overlay)** (`PatientPhysicalEvaluationPanel.tsx` lines 163–169 is the **only** `type="file"` analog; do **not** copy drag overlay, `title` tooltip, or `accept=".pdf"`):
```typescript
<input
  type="file"
  accept=".pdf,application/pdf"
  onChange={handleFileInputChange}
  className="absolute inset-0 cursor-pointer opacity-0"
/>
```

Phase 7: hidden inputs triggered by **Button secondary**. `accept="image/jpeg,image/png,image/webp"` — never `image/*`. **Escolher arquivos**: `multiple` without `capture`. D-01 **Tirar foto** only when `window.matchMedia('(max-width: 767px)')` (or Tailwind `md` 768px) — `capture="environment"`, no `multiple`. Camera files join the lote (D-02). Each lote thumb has **X** (D-05). **Voltar** discards the lote. Per-file Zod before upload (D-04).

**Filter chips:** no chip-row analog. Closest chrome is `PatientSessionEditorForm` mode toggle (lines 250–251 `rounded-lg px-3 py-1.5 text-sm font-medium` + `[].join(' ')`). Follow UI-SPEC: `flex gap-2 overflow-x-auto`, chips `shrink-0 min-h-11`, selected `border-accent bg-accent-soft text-forest`, unselected `rounded-full border border-line bg-surface px-4 text-sm text-muted`. Order: **Todas** · **Avulsas** · sessions from `usePatientSessions`. Client-side filter of the fetched list. Default **Todas**.

**Compartilhar (no analog):** if `navigator.share` exists and `canWrite`, fetch the image as `File`/`Blob` from the signed URL and `navigator.share({ files })`. If the API is missing, **hide** the button. Do not copy the signed URL. Not a download (D-10).

**No `supabase` in the component.** Empty array = empty state, not fake tiles. `[...].join(' ')` for conditional classes (`PatientProfileHeader.tsx` lines 84–89).

---

### `src/components/patients/PatientProfileHeader.tsx` (component, request-response)

**Analog:** same file `PatientTab` (line 7) and tab buttons (lines 75–135).

**Tab union + tablist** (lines 7, 75–79):
```typescript
export type PatientTab = 'resumo' | 'cadastro' | 'evolucoes' | 'avaliacao'
```
```typescript
<nav
  className="mt-4 flex items-end gap-5 overflow-hidden border-b border-line sm:gap-6"
  aria-label="Seções do paciente"
  role="tablist"
>
```

Add `'imagens'`. Fifth button after **Avaliação**, label **Imagens**, same `shrink-0` + forest selected chrome (`[].join(' ')`). Change **only** `overflow-hidden` → `overflow-x-auto` (Pitfall 10 / D CONTEXT tablist). Do not restyle typography or underline.

---

### `src/pages/PatientPage.tsx` (route, request-response)

**Analog:** same file `?aba=` parse, `setTab`, mount Evoluções with `canWrite`.

**Imports** (lines 18–33) — add `PatientImagesPanel` next to Evoluções/Avaliação:
```typescript
import {
  PatientProfileHeader,
  type PatientTab,
} from '@/components/patients/PatientProfileHeader'
import { PatientEvolutionsPanel } from '@/components/patients/PatientEvolutionsPanel'
import { canWritePatient } from '@/lib/accountAccess'
```

**aba parse + setTab** (lines 418–457):
```typescript
const aba = searchParams.get('aba')
const tab: PatientTab =
  aba === 'cadastro'
    ? 'cadastro'
    : aba === 'evolucoes'
      ? 'evolucoes'
      : aba === 'avaliacao'
        ? 'avaliacao'
        : 'resumo'

function setTab(next: PatientTab) {
  if (next === 'cadastro') {
    setSearchParams({ aba: 'cadastro' }, { replace: true })
    return
  }
  if (next === 'evolucoes') {
    setSearchParams({ aba: 'evolucoes' }, { replace: true })
    return
  }
  if (next === 'avaliacao') {
    setSearchParams({ aba: 'avaliacao' }, { replace: true })
    return
  }
  setSearchParams({}, { replace: true })
}
```

Add `aba === 'imagens'` / `setSearchParams({ aba: 'imagens' }, { replace: true })` the same way as `evolucoes`.

**canWrite + consult banner + mount** (lines 481–526):
```typescript
const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
const showConsultBanner = profile?.accountType === 'empresa' && !canWrite
// …
{tab === 'evolucoes' ? (
  <PatientEvolutionsPanel patientId={dashboard.id} canWrite={canWrite} />
) : tab === 'avaliacao' ? (
```

Mount `<PatientImagesPanel patientId={dashboard.id} canWrite={canWrite} />` when `tab === 'imagens'`. Do **not** grow upload logic in the page. Reuse existing consult banner — no second LGPD banner (D-09). Do **not** hijack Documentos shortcut.

---

### `src/components/patients/PatientEvolutionsPanel.tsx` (component, copy only)

**Analog:** same file ConfirmDialog (lines 151–164). CONTEXT D-08 **wins** over UI-SPEC “Do not change Evoluções”.

Append to `description` (keep existing first sentence):

**As fotos dessa sessão ficam na ficha como avulsas.**

Optional: `cancelLabel="Voltar"` is **not** required here — only the extra sentence is in scope. Do not change session delete behavior; SET NULL is SQL (D-06). Invalidation comes from `invalidatePatient` images key.

---

## Shared Patterns

### Layers (page → hook → service → Supabase)
**Source:** `PatientPage.tsx` mounts panels; `usePatients.ts` talks to services; `finance.service.ts` / `sessions.service.ts` talk to `supabase`.
**Apply to:** panel, hooks, `patientImages.service.ts`
Components never import `@/lib/supabase/client`.

### Hide write, don't disable
**Source:** `PatientEvolutionsPanel.tsx` lines 47–52, 83–105; `PatientGoalsPanel.tsx` lines 123–133, 201–220, 228, 268
**Apply to:** Adicionar / Editar / Excluir / Compartilhar / file triggers / upload+edit Modals / ConfirmDialog
```typescript
{canWrite ? (
  <Button type="button" onClick={openUpload}>
    Adicionar imagem
  </Button>
) : null}
```
`canWritePatient` (`accountAccess.ts` lines 32–37) is UX-only. RLS `can_write_patient` is the wall (D-11). Empresa colleague: gallery + lightbox visible.

### Named exports, quotes, no semicolons, no clsx
**Source:** every clinic `src/components/patients/*` and `PatientProfileHeader.tsx` lines 84–89
```typescript
className={[
  '-mb-px shrink-0 border-b-2 py-2.5 text-sm font-medium transition-colors',
  activeTab === 'resumo' ? 'border-forest text-forest' : 'border-transparent text-muted hover:border-line hover:text-ink',
].join(' ')}
```

### Error mapping
**Source:** `src/lib/security/index.ts` `mapDbError` (lines 201–228); `finance.service.ts` `throwIfError` (lines 56–58)
**Apply to:** all image service Storage + PostgREST errors
Do **not** copy `sessions.service.ts` lines 56–58 (`throw new Error(error.message)`).

### Validation
**Source:** `patient.schema.ts` Zod + `zodResolver` in Goals/Alerts; service re-parse on write (`togglePatientFocusArea` uses `focusRegionKeySchema.parse`)
**Apply to:** each lote file MIME/size; description max 500; session UUID nullable. Bucket CHECK is the wall.

### Query invalidation
**Source:** `usePatients.ts` `invalidatePatient` (lines 46–54)
**Apply to:** image mutations + session delete (images key)

### SQL Editor apply
**Source:** Phase 5/6 SQL headers; `.gitignore` `/supabase/`
**Apply to:** `07-patient-images.sql`. Human paste. Never `supabase db push`. Never DROP Phase 3 helpers/policies.

### Modal / ConfirmDialog reuse
**Source:** `Modal.tsx` (portal `document.body`, `z-[100]`, `wide`, `aria-label="Fechar"`); `ConfirmDialog.tsx` `tone="danger"` + `cancelLabel`
**Apply to:** upload, edit, lightbox (`wide`), delete. Do not restyle primitives.

### Session labels
**Source:** `PatientEvolutionsPanel.tsx` line 72 `` {session.dateLabel} · {session.timeLabel} `` + `usePatientSessions` (only `scheduled_at` not null)
**Apply to:** filter chips, upload/edit Select. Do not invent a second session list.

---

## No Analog Found

| File / capability | Role | Data Flow | Reason |
|-------------------|------|-----------|--------|
| `supabase.storage.from().upload` / `createSignedUrls` / `remove` inside `patientImages.service.ts` | service | file-I/O | Zero `supabase.storage` calls in `src/`. Copy RESEARCH Pattern 3 + official JS snippets. |
| `storage.objects` policies + `storage.buckets` insert | migration | CRUD | No Storage SQL in committed phases. Copy RESEARCH Pattern 1 + Storage RLS. Bind `bucket_id`. |
| D-01 `capture="environment"` + D-03 lote thumbs + D-05 X | component | file-I/O | Only file input is PDF dropzone (anti-pattern). Follow CONTEXT + UI-SPEC layout. |
| D-12 `navigator.share` | component | file-I/O | No Web Share usage. Hide button if missing; never copy signed URL. |
| D-07 `session_removed` (or equivalent) | model + migration | CRUD | `session_id` null is not enough. Planner adds persisted flag; lightbox copy **Sessão removida.** |

Planner should use `07-RESEARCH.md` Architecture Patterns 1–3 and CONTEXT D-01–D-12 for those rows.

---

## Metadata

**Analog search scope:** `src/pages/`, `src/components/patients/`, `src/components/ui/`, `src/hooks/`, `src/services/`, `src/schemas/`, `src/types/`, `src/lib/security/`, `src/lib/accountAccess.ts`, `src/lib/supabase/`, `.planning/phases/{03,05,06}/**/*.sql`, `.planning/phases/*/0*-PATTERNS.md`
**Files scanned:** 99 `src/**/*.{ts,tsx}` + 4 committed phase SQL files + grep of Storage / canWrite / mapDbError / file input
**Pattern extraction date:** 2026-09-14
**CONTEXT overrides used:** D-01 câmera estreito, D-03/D-04/D-05 lote, D-06 SET NULL, D-07 aviso persistido, D-08 Evoluções copy, D-09 sem LGPD extra, D-10 sem download, D-11 hide-write + RLS, D-12 Compartilhar
