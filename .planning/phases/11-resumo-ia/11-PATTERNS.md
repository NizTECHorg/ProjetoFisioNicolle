# Phase 11: Resumo IA - Pattern Map

**Mapped:** 2026-09-19  
**Files analyzed:** 16  
**Analogs found:** 15 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/patients/PatientProfileHeader.tsx` | component | request-response | same file (tab buttons) | exact |
| `src/pages/PatientPage.tsx` | route | request-response | same file (`?aba=` + panel mount) | exact |
| `src/lib/dashboardShortcut.ts` | utility | request-response | same file (`patientFichaPath`) | exact |
| `supabase/functions/patient-ai-summary/index.ts` | controller | request-response | `supabase/functions/google-calendar-export/index.ts` | exact |
| `src/services/patientAi.service.ts` | service | request-response | `src/services/googleCalendar.service.ts` | exact |
| `.planning/phases/11-resumo-ia/sql/11-patient-ai-reports.sql` | migration | CRUD | `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql` | exact |
| `src/services/patientAiReports.service.ts` | service | file-I/O + CRUD | `src/services/patientImages.service.ts` | exact |
| `src/hooks/usePatientAiReports.ts` | hook | CRUD | `src/hooks/usePatientImages.ts` | exact |
| `src/components/patients/PatientAiReportsList.tsx` | component | CRUD | `src/components/patients/PatientImagesPanel.tsx` + `PatientEvaluationPanel.tsx` | role-match |
| `src/services/patientAiPdf.service.ts` | service | transform + file-I/O | none for PDF bytes; upload via `patientImages.service.ts` | partial |
| `src/services/patients.service.ts` | service | CRUD | same file (`updatePatient` / `togglePatientFocusArea`) | exact |
| `src/types/patient.ts` | model | — | same file (`PatientImage`, `UpdatePatientInput`) | exact |
| `src/schemas/patientAi.schema.ts` | utility | transform | `src/schemas/googleCalendar.schema.ts` + `patient.schema.ts` (`imageUploadSchema`) | role-match |
| `src/components/patients/PatientAiComposer.tsx` | component | request-response | `src/components/patients/PatientSessionEditorForm.tsx` (mode toggle) | role-match |
| `src/components/patients/PatientResumoIaPanel.tsx` | component | request-response | `PatientEvaluationPanel.tsx` + `PatientImagesPanel.tsx` | role-match |
| Focus-area apply (service/helper) | service | CRUD | `togglePatientFocusArea` insert branch | exact |

## Pattern Assignments

### Tab rename — `PatientProfileHeader.tsx` + `PatientPage.tsx` + `dashboardShortcut.ts`

**Analog:** same files (ficha tab pattern)

**Tab type + button** (`PatientProfileHeader.tsx` lines 7, 122–135):
```typescript
export type PatientTab = 'resumo' | 'cadastro' | 'evolucoes' | 'avaliacao' | 'imagens'
// Rename: add 'resumo-ia'; keep legacy 'avaliacao' accepted in PatientPage for redirects.
// Label text today:
<button ... onClick={() => onTabChange('avaliacao')}>Avaliação</button>
// → label "Resumo IA", prefer onTabChange('resumo-ia')
```

**URL routing** (`PatientPage.tsx` lines 419–465, 534–538):
```typescript
const aba = searchParams.get('aba')
const tab: PatientTab =
  aba === 'cadastro' ? 'cadastro'
    : aba === 'evolucoes' ? 'evolucoes'
      : aba === 'avaliacao' ? 'avaliacao'  // accept legacy → map to resumo-ia panel
        : aba === 'imagens' ? 'imagens'
          : 'resumo'

function setTab(next: PatientTab) {
  if (next === 'avaliacao') {
    setSearchParams({ aba: 'avaliacao' }, { replace: true })
    return
  }
  // Add branch: next === 'resumo-ia' → setSearchParams({ aba: 'resumo-ia' })
}
// Mount: tab === 'avaliacao' | 'resumo-ia' → <PatientResumoIaPanel ... canWrite={canWrite} />
```

**Shortcut deep-link** (`dashboardShortcut.ts` lines 39–45):
```typescript
export function patientFichaPath(patientId: string, aba: 'evolucoes' | 'avaliacao'): string {
  return `/pacientes/${patientId}?aba=${aba}`
}
// Extend union with 'resumo-ia'; update Dashboard shortcut label "Avaliação" → "Resumo IA".
```

**canWrite wall** (`PatientPage.tsx` lines 488, 534–538):
```typescript
const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
<PatientEvaluationPanel patientId={...} canWrite={canWrite} />
// Pass same canWrite into PatientResumoIaPanel / composer / reports list.
```

---

### `supabase/functions/patient-ai-summary/index.ts` (controller, request-response)

**Analog:** `supabase/functions/google-calendar-export/index.ts`

**CORS + JSON helpers + clients** (lines 1–53):
```typescript
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function requireUser(
  req: Request,
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  // ... getUser(token); return 401 on failure
  return { user: data.user, authHeader }
}
```

**Entry + body validation + secret via Deno.env** (lines 224–245; secret pattern lines 94–97):
```typescript
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  const { user, authHeader } = auth

  let body: { patientId?: string; userHint?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return jsonResponse({ error: 'invalid_body', code: 'invalid_body' }, 400)
  }
  // Validate patientId UUID; load context with createUserClient(authHeader) under RLS
  const key = Deno.env.get('GEMINI_API_KEY')  // mirror GOOGLE_CLIENT_ID pattern — never VITE_*
  if (!key) return jsonResponse({ error: 'misconfigured', code: 'misconfigured' }, 500)
  // fetch Gemini generateContent + response_mime_type application/json
  // return jsonResponse({ summary, focusRegionKeys })
})
```

**Error codes (Portuguese mapped on client):** reuse `unauthorized` | `invalid_body` | `misconfigured` | add `forbidden` | `ai_unavailable` — client maps like Calendar.

---

### `src/services/patientAi.service.ts` (service, request-response)

**Analog:** `src/services/googleCalendar.service.ts`

**Imports + invoke + error payload** (lines 1–12, 56–116, 200–216):
```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError /* + new mapPatientAiError */ } from '@/lib/security'
// Zod-parse body first (exportMonthSchema pattern)

const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
  body: { patientId: parsed.patientId, userHint: parsed.userHint },
})

if (error) {
  const payload = await readFunctionsErrorPayload(error, data)
  throwMappedFunctionsError(payload) // adapt mapGoogleCalendarError → PT AI copy
}

const body = data as { summary: string; focusRegionKeys?: string[] }
```

**Copy constants pattern** (`schemas/googleCalendar.schema.ts` lines 3–27):
```typescript
export const PATIENT_AI_COPY = {
  generateSuccess: 'Resumo atualizado',
  generateError: 'Não foi possível gerar o resumo. Tente de novo em instantes.',
  unavailable: 'IA indisponível no momento.',
  forbidden: 'Você não tem permissão para esta ação.',
  misconfigured: 'A IA no servidor está incompleta. Confira GEMINI_API_KEY nas Edge Functions.',
}
```

---

### `11-patient-ai-reports.sql` (migration, CRUD)

**Analog:** `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql`

**Bucket private + MIME** (lines 26–34 — change MIME to PDF only):
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-ai-reports',
  'patient-ai-reports',
  false,
  8388608,
  array['application/pdf']::text[]
)
on conflict (id) do nothing;
```

**Table + session SET NULL + path CHECK** (lines 41–58, 63–68):
```sql
create table if not exists public.patient_ai_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  session_id uuid null references public.patient_sessions (id) on delete set null,
  kind text not null check (kind in ('geral', 'sessao')),
  storage_path text not null unique,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 8388608),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  session_label text null, -- denormalize for list after session delete
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users (id),
  -- + kind/session CHECK + path regex ending .pdf
);
```

**RLS FORCE + can_*** (lines 80–133):
```sql
alter table public.patient_ai_reports enable row level security;
alter table public.patient_ai_reports force row level security;

create policy patient_ai_reports_select
  on public.patient_ai_reports for select to authenticated
  using ((select private.can_read_patient(patient_id)));

create policy patient_ai_reports_insert
  on public.patient_ai_reports for insert to authenticated
  with check ((select private.can_write_patient(patient_id)));
-- update optional; delete with can_write_patient
-- Do NOT rewrite private.can_read_patient / can_write_patient
```

**Storage policies scoped by bucket** (lines 166–198):
```sql
create policy patient_ai_reports_storage_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'patient-ai-reports'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-...$'
    and (select private.can_read_patient(((storage.foldername(name))[1])::uuid))
  );
-- insert/delete mirror with can_write_patient; no UPDATE policy (no upsert)
```

**Convention header** (lines 1–3): SQL Editor only; no `supabase db push`; no `DELETE FROM storage.objects`.

---

### `src/services/patientAiReports.service.ts` (service, file-I/O + CRUD)

**Analog:** `src/services/patientImages.service.ts`

**Imports + bucket + signed URL + mapDbError** (lines 1–39):
```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError, mapStorageError, sanitizeText } from '@/lib/security'

const REPORT_BUCKET = 'patient-ai-reports'
const SIGNED_URL_SECONDS = 3600
```

**Upload then INSERT; rollback Storage on INSERT fail** (lines 100–131, 192–218):
```typescript
const path = `${patientId}/${reportId}.pdf`
const { error: uploadError } = await supabase.storage.from(REPORT_BUCKET).upload(path, blob, {
  contentType: 'application/pdf',
  upsert: false,
})
throwIfStorageError(uploadError)

const { data, error } = await supabase.from('patient_ai_reports').insert({...}).select(...).single()
if (error) {
  await supabase.storage.from(REPORT_BUCKET).remove([path])
  throw new Error(mapDbError(error))
}
```

**List + createSignedUrls** (lines 134–176):
```typescript
.order('created_at', { ascending: false })
await supabase.storage.from(REPORT_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
// Never persist signed URL in DB
```

**Delete: storage.remove then DELETE row** (lines 273–290):
```typescript
await supabase.storage.from(REPORT_BUCKET).remove([image.storagePath])
await supabase.from('patient_ai_reports').delete().eq('id', id).eq('patient_id', patientId)
```

---

### `src/hooks/usePatientAiReports.ts` (hook, CRUD)

**Analog:** `src/hooks/usePatientImages.ts` (full file)

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidatePatient } from '@/hooks/usePatients'
import { toast } from '@/stores/toast.store'

export function usePatientAiReports(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'ai-reports'],
    queryFn: () => listPatientAiReports(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
}

// useCreate / useDelete: invalidatePatient(qc, patientId); toast PT success/error
```

---

### `src/components/patients/PatientAiReportsList.tsx` (component, CRUD)

**Analogs:** `PatientImagesPanel.tsx` (canWrite + empty + session label) + `PatientEvaluationPanel.tsx` (dated list + badges)

**Props + canWrite gate** (`PatientImagesPanel.tsx` lines 28–31, 181, 238–242, 370+):
```typescript
type Props = { patientId: string; canWrite?: boolean }
export function PatientAiReportsList({ patientId, canWrite = false }: Props) {
  // Hide generate/export/delete when !canWrite
  const emptyBody = canWrite
    ? 'Exporte uma avaliação geral ou por sessão para ver aqui.'
    : undefined
}
```

**Session label for list** (`PatientImagesPanel.tsx` lines 39–44):
```typescript
function tileAllocation(image, sessions) {
  if (!image.sessionId) return 'Avulsa'
  const session = sessions.find((row) => row.id === image.sessionId)
  if (!session) return 'Avulsa'
  return `${session.dateLabel} · ${session.timeLabel}`
}
// For reports: prefer denormalized session_label; fallback to sessions lookup; kind badge geral|sessão
```

**List + kind badge** (`PatientEvaluationPanel.tsx` lines 137–166):
```typescript
<ul className="space-y-2">
  {items.map((item) => (
    <li key={item.id}>
      <button type="button" className="w-full rounded-xl border p-3 text-left ...">
        <p className="text-sm font-semibold text-ink">{item.createdAtLabel}</p>
        <span className="...">{item.kind === 'geral' ? 'Geral' : item.sessionLabel}</span>
      </button>
    </li>
  ))}
</ul>
```

---

### `src/services/patientAiPdf.service.ts` (service, transform)

**Analog:** none in-repo for PDF construction — use RESEARCH pdf-lib sketch. **Persist** via `patientAiReports.service` upload pattern above.

```typescript
import { PDFDocument, StandardFonts } from 'pdf-lib'
const doc = await PDFDocument.create()
// Embed Latin-capable font for PT accents (Pitfall 9)
const bytes = await doc.save()
const blob = new Blob([bytes], { type: 'application/pdf' })
```

---

### `updatePatient` + `ai_summary` — `patients.service.ts` + `types/patient.ts`

**Analog:** same files

**Gap today** (`UpdatePatientInput` lines 228–248 — no `aiSummary`; `updatePatient` lines 556–587 ignores `ai_summary`):
```typescript
// types/patient.ts — add:
export interface UpdatePatientInput {
  // ...existing
  aiSummary?: string
}

// patients.service.ts updatePatient — add branch (same emptyToNull style):
if (input.aiSummary !== undefined) {
  payload.ai_summary = emptyToNull(input.aiSummary)
}
```

**Invalidate after write** (`usePatients.ts` lines 99–108):
```typescript
export function useUpdatePatient() {
  return useMutation({
    mutationFn: ({ id, input }) => updatePatient(id, input),
    onSuccess: (_data, variables) => {
      invalidatePatient(qc, variables.id) // Resumo tab reads detail.aiSummary
      toast('Ficha atualizada', 'success')
    },
  })
}
```

**Display destination** (`PatientPage.tsx` ResumoDoPaciente lines 288–298):
```typescript
<p className="...">Resumo IA</p>
{detail.aiSummary || 'Sem resumo ainda.'}
// Keep read-only on Resumo tab; write happens from Resumo IA composer
```

---

### Focus areas apply — `togglePatientFocusArea` + Zod catalog

**Analog:** `patients.service.ts` lines 684–718 + `focusRegionKeySchema` + `FOCUS_REGION_KEYS`

```typescript
import { focusRegionKeySchema } from '@/schemas/patient.schema'
import { getFocusRegion } from '@/lib/focusRegions'

// Additive mark only (D-03/A3): insert if missing; do NOT delete unmarked keys
for (const raw of focusRegionKeys ?? []) {
  const parsed = focusRegionKeySchema.safeParse(raw)
  if (!parsed.success) continue
  const catalog = getFocusRegion(parsed.data)
  if (!catalog) continue
  const { data: existing } = await supabase
    .from('patient_focus_areas')
    .select('id')
    .eq('patient_id', patientId)
    .eq('region_key', parsed.data)
    .maybeSingle()
  if (existing) continue
  await supabase.from('patient_focus_areas').insert({
    patient_id: patientId,
    region_key: parsed.data,
    label: catalog.label,
    is_active: true,
    sort_order: catalog.sortOrder,
  })
  // 23505 → already marked (same as toggle)
}
```

**Do not call toggle for AI path** — toggle unmarked would wipe regions. Filter with closed catalog only (`FOCUS_REGION_KEYS`).

---

### `PatientAiComposer.tsx` (component, request-response)

**Analog:** `PatientSessionEditorForm.tsx` dual-mode segmented control (lines 235–256)

```typescript
<div className="inline-flex rounded-xl border border-line bg-canvas p-1">
  <button
    type="button"
    onClick={() => setMode('resumo')}
    className={[
      'min-h-11 rounded-lg px-3 text-sm font-medium transition',
      mode === 'resumo' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
    ].join(' ')}
  >
    Escrever resumo (IA)
  </button>
  <button
    type="button"
    onClick={() => setMode('pdf')}
    className={[...].join(' ')}
  >
    Exportar avaliação (PDF)
  </button>
</div>
// mode=resumo → optional Textarea hint + CTA generate
// mode=pdf → Select geral|sessão + session Select (reuse PatientImagesPanel sessionOptions) + CTA export
// if (!canWrite) hide CTAs entirely
```

**Session options** (`PatientImagesPanel.tsx` lines 244–250):
```typescript
const sessionOptions = [
  { value: '', label: 'Avulsa (sem sessão)' },
  ...sessions.map((s) => ({
    value: s.id,
    label: `${s.dateLabel} · ${s.timeLabel}`,
  })),
]
```

---

### `PatientResumoIaPanel.tsx` (component, request-response)

**Analogs:** `PatientEvaluationPanel.tsx` (section chrome + embed) + images panel layout

**Section chrome** (`PatientEvaluationPanel.tsx` lines 86–101):
```typescript
<div className="space-y-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Resumo IA</p>
      <p className="mt-1 text-sm text-muted">
        Gere o resumo clínico ou exporte PDFs. O texto aparece em Resumo do paciente.
      </p>
    </div>
  </div>
  <PatientAiComposer patientId={...} canWrite={canWrite} />
  <PatientAiReportsList patientId={...} canWrite={canWrite} />
  {/* Subsection: existing PatientEvaluationPanel without competing page title, or collapsible */}
  {/* Legacy: PatientPhysicalEvaluationPanel inside <details> (D-07) */}
</div>
```

---

### `src/schemas/patientAi.schema.ts` (utility, transform)

**Analogs:** `googleCalendar.schema.ts` (invoke body) + `imageUploadSchema` (MIME/size)

```typescript
import { z } from 'zod'

export const patientAiSummaryInvokeSchema = z.object({
  patientId: z.string().uuid(),
  userHint: z.string().trim().max(2000).optional(),
})

export const patientAiReportKindSchema = z.enum(['geral', 'sessao'])

export const patientAiReportUploadSchema = z.object({
  mimeType: z.literal('application/pdf'),
  byteSize: z.number().int().positive().max(8 * 1024 * 1024),
  kind: patientAiReportKindSchema,
  sessionId: z.string().uuid().nullable(),
}).superRefine((val, ctx) => {
  if (val.kind === 'geral' && val.sessionId !== null) { /* issue */ }
  if (val.kind === 'sessao' && !val.sessionId) { /* issue */ }
})
```

---

## Shared Patterns

### Authentication (Edge Function JWT)
**Source:** `supabase/functions/google-calendar-export/index.ts` lines 36–53, 224–232  
**Apply to:** `patient-ai-summary`  
```typescript
const auth = await requireUser(req)
if (auth instanceof Response) return auth
// Load PHI with createUserClient(authHeader) so RLS applies
```

### Authorization (RLS + UX)
**Source:** `accountAccess` via `PatientPage` `canWritePatient`; SQL `private.can_read_patient` / `can_write_patient`  
**Apply to:** table/storage policies, hide generate/export/delete when `!canWrite`  
```typescript
const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
// UX only — RLS is the wall
```

### Error Handling (Portuguese)
**Source:** `mapDbError` / `mapStorageError` (`patientImages.service.ts`); `readFunctionsErrorPayload` + mapped copy (`googleCalendar.service.ts`)  
**Apply to:** all new services  
```typescript
if (error) throw new Error(mapDbError(error))
if (storageError) throw new Error(mapStorageError(storageError))
// EF codes → PATIENT_AI_COPY.*
```

### Validation (Zod before invoke / upload)
**Source:** `exportMonthSchema.parse` + `imageUploadSchema.safeParse`  
**Apply to:** composer submit, PDF upload metadata, focus keys  

### Storage orphan guard
**Source:** `insertImageRow` rollback remove (lines 126–128)  
**Apply to:** every PDF upload  

### Query invalidation
**Source:** `invalidatePatient` in `usePatientImages` / `useUpdatePatient`  
**Apply to:** after summary save, focus marks, report create/delete  

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/services/patientAiPdf.service.ts` (PDF bytes only) | service | transform | No pdf-lib usage in repo — follow RESEARCH README sketch; persist with Phase 7 upload analog |

## Metadata

**Analog search scope:** `src/components/patients/`, `src/services/`, `src/hooks/`, `src/schemas/`, `src/types/`, `src/lib/`, `src/pages/PatientPage.tsx`, `supabase/functions/google-calendar-export/`, `.planning/phases/07-*/sql/`  
**Files scanned:** ~25 primary + phase SQL/EF  
**Pattern extraction date:** 2026-09-19  
**Key composition:** Phase 8 EF secrets/invoke + Phase 7 private Storage/RLS + ficha tab/`canWrite` UX + SessionEditor mode toggle + closed `FOCUS_REGION_KEYS`
