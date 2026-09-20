# Phase 12: Avaliações musculoesqueléticas - Pattern Map

**Mapped:** 2026-09-20  
**Files analyzed:** 15  
**Analogs found:** 14 / 15  
**Upstream:** `12-CONTEXT.md` (RESEARCH.md ausente — padrões do código + Phase 11 PATTERNS)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/patients/PatientProfileHeader.tsx` | component | request-response | same file (tab buttons + `PatientTab`) | exact |
| `src/pages/PatientPage.tsx` | route | request-response | same file (`?aba=` + panel mount + `canWrite`) | exact |
| `src/lib/dashboardShortcut.ts` | utility | request-response | same file (`patientFichaPath`) | exact |
| `src/components/patients/DashboardClinicalShortcut.tsx` | component | request-response | same file (picker); navigate branch like `goToPatients` | exact |
| `src/components/patients/PatientResumoIaPanel.tsx` | component | request-response | same file (remove `<details>` eval embed) | exact |
| `src/components/patients/PatientEvaluationPanel.tsx` | component | CRUD | same file (list + composer + `canWrite`) | exact |
| `src/components/patients/PatientEvaluationEditorForm.tsx` | component | CRUD | same file + `PatientCadastroPanel` (block sections) + `PatientsPage` (partial create) | role-match |
| `src/schemas/evaluation.schema.ts` | utility | transform | same file + `createPatientSchema` (`optionalText`) | exact |
| `src/types/evaluation.ts` | model | — | same file (`PatientEvaluation` / `UpsertPatientEvaluationInput`) | exact |
| `src/services/evaluations.service.ts` | service | CRUD | same file (`list/create/update/delete` + `emptyToNull`) | exact |
| `src/hooks/usePatients.ts` | hook | CRUD | same file (`usePatientEvaluations` / create/update/delete) | exact |
| `src/services/patientAiPdf.service.ts` | service | transform + file-I/O | same file (`drawField` / `drawGeral` / brand tokens) | exact |
| `src/components/patients/PatientAiComposer.tsx` | component | request-response | same file (`buildPatientAiReportPdf` + `canWrite` wall) | exact |
| `.planning/phases/12-…/sql/12-patient-evaluations*.sql` | migration | CRUD | `supabase/11-patient-ai-reports.sql` + Phase 03 RLS on `patient_evaluations` | exact |
| Body map / silhueta (Bloco 02-A) | component | CRUD | `PatientFocusAreasPanel.tsx` + `focusRegions.ts` | exact |
| Query `nova=1` open-create | utility | request-response | **none** — invent from `useSearchParams` + `openCreate()` | none |

## Pattern Assignments

### Tab Avaliações — `PatientProfileHeader.tsx` + `PatientPage.tsx` + `dashboardShortcut.ts`

**Analog:** same files (ficha tab pattern from Phase 11)

**Tab type + button** (`PatientProfileHeader.tsx` lines 7, 122–148):
```typescript
export type PatientTab =
  | 'resumo' | 'cadastro' | 'evolucoes' | 'resumo-ia' | 'avaliacao' | 'imagens'
// Phase 12: add 'avaliacoes'. Keep legacy 'avaliacao' as alias → Resumo IA only
// (do NOT reuse 'avaliacao' for the new clinical tab — CONTEXT prefers slug `avaliacoes`).

// Insert new tab button AFTER Evoluções (or after Resumo IA — planner chooses order).
// Active: activeTab === 'avaliacoes'
// onClick={() => onTabChange('avaliacoes')}
// Label: "Avaliações"
```

**URL routing** (`PatientPage.tsx` lines 419–467, 490, 531–541):
```typescript
const aba = searchParams.get('aba')
const nova = searchParams.get('nova') === '1' // NEW — open create composer

const tab: PatientTab =
  aba === 'cadastro' ? 'cadastro'
    : aba === 'evolucoes' ? 'evolucoes'
      : aba === 'avaliacoes' ? 'avaliacoes'       // NEW primary slug
        : aba === 'resumo-ia' ? 'resumo-ia'
          : aba === 'avaliacao' ? 'avaliacao'     // legacy → Resumo IA panel
            : aba === 'imagens' ? 'imagens'
              : 'resumo'

function setTab(next: PatientTab) {
  if (next === 'avaliacoes') {
    setSearchParams({ aba: 'avaliacoes' }, { replace: true })
    return
  }
  if (next === 'resumo-ia' || next === 'avaliacao') {
    setSearchParams({ aba: 'resumo-ia' }, { replace: true })
    return
  }
  // … existing branches; do not collapse avaliacoes into resumo-ia
}

const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)

// Mount:
// tab === 'avaliacoes' → <PatientEvaluationPanel patientId={…} canWrite={canWrite} openCreate={nova} />
// tab === 'resumo-ia' || tab === 'avaliacao' → <PatientResumoIaPanel … /> WITHOUT eval embed
```

**Shortcut deep-link** (`dashboardShortcut.ts` lines 39–48):
```typescript
export function patientFichaPath(
  patientId: string,
  aba: 'evolucoes' | 'resumo-ia' | 'avaliacao' | 'avaliacoes',
  opts?: { nova?: boolean },
): string {
  const params = new URLSearchParams({ aba })
  if (opts?.nova) params.set('nova', '1')
  return `/pacientes/${patientId}?${params.toString()}`
}
// Dashboard "Nova avaliação" → patientFichaPath(id, 'avaliacoes', { nova: true })
```

**canWrite wall** (`PatientPage.tsx` lines 490, 535–540; `accountAccess.ts` lines 32–37):
```typescript
export function canWritePatient(
  viewerId: string | undefined,
  patientCreatedBy: string | null | undefined,
): boolean {
  return Boolean(viewerId && patientCreatedBy && viewerId === patientCreatedBy)
}
// Pass canWrite into panel / editor / body map. Fail closed: canWrite = false default on panels.
// UX only — RLS via private.can_write_patient remains authority.
```

---

### Dashboard picker → navigate (not inline editor)

**Analog:** `DashboardClinicalShortcut.tsx` (picker) + `goToPatients` navigate pattern

**Current (change away from editor step)** (lines 65–74, 177–214):
```typescript
// TODAY: selectPatient → step: 'editor' + PatientEvaluationEditorForm in Modal
// PHASE 12 (D-02): selectPatient for kind === 'avaliacao' → navigate + close

function selectPatient(kind: ShortcutKind, patient: PatientListItem) {
  if (!canWritePatient(user?.id, patient.createdBy)) return
  if (kind === 'avaliacao') {
    closeShortcut()
    navigate(patientFichaPath(patient.id, 'avaliacoes', { nova: true }))
    return
  }
  // evolucao may keep editor Modal (out of Phase 12 scope) OR same navigate pattern
  setState({ step: 'editor', kind, patientId: patient.id, patientName: patient.name })
}
```

**Picker reuse** (lines 99–174): keep Modal + `writablePatients` + `filterPatientsByName` + `PATIENT_SEARCH_THRESHOLD` — only change destination after select.

---

### Decouple Resumo IA — `PatientResumoIaPanel.tsx`

**Analog:** same file (D-01 / D-06)

**Remove embed** (lines 1–3, 33–44):
```typescript
// DELETE import PatientEvaluationPanel
// DELETE <details>…Avaliação estruturada…</details> block
// Keep: heading + PatientAiComposer + PatientAiReportsList only
```

---

### Evaluation CRUD panel — `PatientEvaluationPanel.tsx`

**Analog:** same file (list + openCreate + canWrite + ConfirmDialog)

**Open-create API** (extend for `nova=1`) (lines 56–72, 95–100):
```typescript
type PatientEvaluationPanelProps = {
  patientId: string
  patientName?: string
  canWrite?: boolean
  /** When true (from ?nova=1), open composer once then clear query. */
  openCreateOnMount?: boolean
}

const [editorOpen, setEditorOpen] = useState(false)

useEffect(() => {
  if (!openCreateOnMount || !canWrite) return
  openCreate()
  // Parent should replace searchParams to drop nova=1 (avoid re-open on remount)
}, [openCreateOnMount, canWrite])

// canWrite && !editorOpen → "Nova avaliação" button
// canWrite && editorOpen → PatientEvaluationEditorForm
// !canWrite → hide create/edit/delete; list+detail read-only
```

**List / detail** (lines 137–223): keep master-detail grid; swap `DETAIL_FIELDS` for new clinical blocks (skip empty strings like today).

---

### Rich multi-block form (partial save) — schema + editor + cadastro

**Analogs:**
1. `createPatientSchema` / `PatientsPage` — min required + optional blanks  
2. `evaluationFormSchema` — `optionalText` + date required  
3. `PatientCadastroPanel` — sectioned blocks with accent headers  
4. `PatientEvaluationEditorForm` — RHF + zodResolver + mutate create/update

**Partial create (patient)** (`patient.schema.ts` lines 6–18, 39–55; `PatientsPage.tsx` lines 52–59):
```typescript
const optionalText = (max: number, minWhenFilled = 0) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres`).superRefine(/* … */)

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(2, '…').max(120),
  phone: optionalText(30),
  email: optionalEmail,
  // … all other fields optional — create with name only
})

// PatientsPage onSubmit only sends filled identity fields; rest completed later in Cadastro.
```

**Evaluation schema today → relax for D-03** (`evaluation.schema.ts` lines 3–30):
```typescript
// TODAY: mainComplaint.min(2) blocks empty save — CHANGE for Phase 12:
// Required: performedOn (date) only (CONTEXT D-03).
// All clinical blocks: optionalText / optional arrays / optional checkboxes.
export const evaluationFormSchema = z.object({
  performedOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data da avaliação'),
  therapistId: z.string().optional(),
  // Replace flat text fields with structured payload matching refs 01–04
  // e.g. body: musculoskeletalEvaluationBodySchema (Zod object, all optional leaves)
})
```

**Sectioned form chrome** (`PatientEvaluationEditorForm.tsx` lines 182–195 + Cadastro cards):
```typescript
// Prefer bordered blocks with letter headers (A/B/C…) adapted to FLUXO tokens:
// border-line, bg-surface, text-accent uppercase tracking, forest accents.
{FIELD_SECTIONS.map((section) => (
  <div key={section.title} className="space-y-4 rounded-2xl border border-line bg-surface p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
      {section.letter} · {section.title}
    </p>
    {/* checkboxes / tables / textareas — no serif copy of paper ficha */}
  </div>
))}
```

**Submit → service** (`PatientEvaluationEditorForm.tsx` lines 125–149):
```typescript
if (editing) {
  updateEvaluation.mutate({ evaluationId: editing.id, input }, { onSuccess })
  return
}
createEvaluation.mutate(input, { onSuccess })
```

---

### Service + hooks CRUD — `evaluations.service.ts` + `usePatients.ts`

**Analog:** same files

**Service skeleton** (`evaluations.service.ts` lines 28–35, 87–153):
```typescript
function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

export async function listPatientEvaluations(patientId: string): Promise<PatientEvaluation[]> {
  const { data, error } = await supabase
    .from('patient_evaluations')
    .select(EVALUATION_COLUMNS) // or body jsonb column after migration
    .eq('patient_id', patientId)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
  throwIfError(error)
  // map snake_case → camelCase; mark isInitial = oldest performed_on
}

export async function createPatientEvaluation(patientId, input) {
  const author = await resolveAuthor() // auth.getUser + profiles.full_name
  const { error } = await supabase.from('patient_evaluations').insert({
    patient_id: patientId,
    ...toRow(input),
    created_by: author.userId,
    created_by_name: author.name,
  })
  throwIfError(error)
}
// update: .update({ …toRow, updated_at }).eq('id', evaluationId)
// delete: .delete().eq('id', evaluationId)
```

**Hooks** (`usePatients.ts` lines 46–51, 294–354):
```typescript
queryKey: ['patients', patientId, 'evaluations']
// invalidatePatient already includes evaluations key — keep using it
useCreatePatientEvaluation → toast('Avaliação salva', 'success', { action })
useUpdatePatientEvaluation → toast('Avaliação atualizada')
useDeletePatientEvaluation → toast('Avaliação removida')
```

**Types** (`evaluation.ts` lines 1–39): evolve `PatientEvaluation` + `UpsertPatientEvaluationInput` for new body; keep `id`, `patientId`, `performedOn`, `performedOnLabel`, `isInitial`, therapist fields.

---

### PDF rebuild — `patientAiPdf.service.ts` (+ composer wiring)

**Analog:** same file (brand layout helpers)

**Reusable primitives** (lines 13–45, 82–90, 258–356, 544–558):
```typescript
const PAGE_WIDTH = 595.28 // A4
const COLORS = { forest, accent, accentSoft, canvas, ink, muted, line, white }
// toWinAnsiSafe + wrapLines + ensureSpace + drawHeaderBand + drawFooter
// drawSectionTitle / drawParagraph / drawField / drawChipRow / drawBulletList

export async function buildPatientAiReportPdf(input): Promise<Blob> {
  // Helvetica + HelveticaBold; embed logo.png; A4 pages
}
```

**Phase 12 direction (D-07):**
- Add `kind: 'avaliacao'` (or replace `geral` sections) that maps saved evaluation blocks 01–04 → `drawSectionTitle` / `drawField` / checkbox-style lines.
- Prefer exporting from a **saved** `PatientEvaluation` row, not free-form AI snapshot alone.
- Keep FLUXO palette — do not copy paper serif from refs.
- Wire from `PatientAiComposer` (or panel export button): `canWrite` wall stays (`if (!canWrite) return null`).

**Composer canWrite** (`PatientAiComposer.tsx` lines 19–39):
```typescript
canWrite?: boolean  // default false
if (!canWrite) return null
```

---

### Silhouette / body map (Bloco 02-A)

**Analogs:** `src/lib/focusRegions.ts` + `PatientFocusAreasPanel.tsx`

**Catalog** (`focusRegions.ts` lines 7–49):
```typescript
export const FOCUS_REGION_KEYS = [ 'front.head', /* … 30 keys … */ 'back.leg_r' ] as const
export type FocusRegionKey = (typeof FOCUS_REGION_KEYS)[number]
export const FOCUS_REGIONS: readonly FocusRegion[] // key, label, view, sortOrder, path
```

**Interactive SVG** (`PatientFocusAreasPanel.tsx` lines 209–260):
```typescript
<svg viewBox="0 0 140 240" className="h-44 w-auto text-forest sm:h-52" aria-label={svgLabel}>
  {regions.map((region) => (
    <path
      key={region.key}
      d={region.path}
      tabIndex={canWrite ? 0 : undefined}
      className={regionPathClassName(marked, preview, canWrite)}
      onPointerDown={…}
      onFocus={…}
    />
  ))}
</svg>
// Front + back figures side by side
```

**Reuse guidance (Claude's Discretion):**
- Prefer **local multi-select** state inside evaluation form (pain map) — do **not** call `useTogglePatientFocusArea` (that writes `patient_focus_areas` on the patient chart).
- Reuse `FOCUS_REGIONS` paths + labels; extract a presentational `BodyMapPicker` if needed (selectedKeys: Set\<FocusRegionKey\>, onChange, canWrite).
- Persist selected keys inside evaluation JSONB/body, not as chart focus areas unless product later links them.

---

### SQL migration — evolve `patient_evaluations`

**Analogs:**
- RLS already correct: Phase 03 (`03-account-types-team.sql` lines 673–696) — `can_read_patient` / `can_write_patient`
- Script style: `supabase/11-patient-ai-reports.sql` (idempotent, SQL Editor, no `db push`)

**RLS pattern to preserve:**
```sql
create policy patient_evaluations_select
  on public.patient_evaluations for select to authenticated
  using ((select private.can_read_patient(patient_id)));
-- insert/update/delete: can_write_patient(patient_id)
```

**Migration approach (discretion):**
- Prefer `alter table … add column if not exists body jsonb not null default '{}'::jsonb` (or similar) + keep legacy text columns for backfill, **or** migrate columns → JSONB in one script with probe comments.
- Idempotent: `create table if not exists` / `add column if not exists` / `drop policy if exists` only for **new** policy names — never DROP `can_*` helpers.
- Place under `.planning/phases/12-avaliacoes-musculoesqueleticas/sql/` and copy to `supabase/` when shipping (same as Phase 11).

## Shared Patterns

### Authentication / write gating
**Source:** `src/lib/accountAccess.ts` + `PatientPage.tsx`  
**Apply to:** Panel, editor, dashboard shortcut select, body map, PDF export buttons  
```typescript
const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
// Fail closed defaults: canWrite = false on PatientResumoIaPanel / new panels
// Hide mutate UI when !canWrite; RLS still enforces
```

### Error handling (services)
**Source:** `evaluations.service.ts`  
**Apply to:** Any new evaluation persistence helpers  
```typescript
function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}
// Hooks: onError → toast(error.message | 'Erro inesperado', 'error')
```

### Validation
**Source:** `patient.schema.ts` `optionalText` + `evaluation.schema.ts` date regex  
**Apply to:** New musculoskeletal form schema — only `performedOn` hard-required  

### Query invalidation
**Source:** `usePatients.ts` `invalidatePatient`  
**Apply to:** Keep `['patients', patientId, 'evaluations']` on create/update/delete  

### Design tokens
**Source:** existing panels + `patientAiPdf.service.ts` COLORS  
**Apply to:** Form blocks and PDF — `border-line`, `bg-surface`, `text-accent`, `text-forest`, `bg-accent-soft`; avoid generic paper serif from refs  

### Dashboard deep-link helpers
**Source:** `dashboardShortcut.ts`  
**Apply to:** Extend `patientFichaPath`; keep `writablePatients` / search threshold  

## No Analog Found

| File / Concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| `?nova=1` auto-open create | utility | request-response | No query flag exists today; invent from `useSearchParams` + `openCreate()` + `replace: true` clear |
| JSONB clinical document column | migration | CRUD | No JSONB clinic tables in repo yet — follow CONTEXT discretion + Phase 11 SQL style |

## Metadata

**Analog search scope:**  
`src/components/patients/`, `src/pages/PatientPage.tsx`, `src/pages/PatientsPage.tsx`, `src/lib/`, `src/services/evaluations.service.ts`, `src/services/patientAiPdf.service.ts`, `src/hooks/usePatients.ts`, `src/schemas/`, `src/types/evaluation.ts`, `supabase/` + `.planning/phases/*/sql/`  

**Files scanned:** ~25 primary + Phase 11 PATTERNS structure  
**Pattern extraction date:** 2026-09-20  
**RESEARCH.md:** not present — planner should re-check if research lands later  
