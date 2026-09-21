# Phase 13: PDF export Avaliação / Evolução - Pattern Map

**Mapped:** 2026-09-20  
**Files analyzed:** 11  
**Analogs found:** 11 / 11  
**Upstream:** `13-CONTEXT.md`, `13-RESEARCH.md`, `13-UI-SPEC.md`

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/pdfFieldCatalog.ts` | utility | transform | `src/lib/evaluationFichaContent.ts` + `drawAvaliacao` gates in `patientAiPdf.service.ts` | exact |
| `src/components/patients/PatientAiFieldPicker.tsx` | component | request-response | `Modal` + `BoolCheck` (`fichaFormPrimitives.tsx`) + `DashboardClinicalShortcut` Modal step | exact |
| `src/components/patients/PatientAiComposer.tsx` | component | request-response | same file (scopes + export + `canWrite`) | exact |
| `src/services/patientAiPdf.service.ts` | service | transform + file-I/O | same file (`drawAvaliacao` / `textFilled` / COLORS) | exact |
| `src/services/patientAi.service.ts` | service | request-response | same file (`generatePatientAiSummary` invoke) | exact |
| `supabase/functions/patient-ai-summary/index.ts` | controller | request-response | same file (`Deno.serve` + `assembleContextPack` + `buildPrompt`) | exact |
| `src/schemas/patientAi.schema.ts` | utility | transform | same file (`PATIENT_AI_COPY` + kind Zod) | exact |
| `src/types/patient.ts` | model | — | same file (`PatientAiReportKind`) | exact |
| `src/services/patientAiReports.service.ts` | service | file-I/O + CRUD | same file (upload + `sessionLabel` denorm) | exact |
| `src/components/patients/PatientAiReportsList.tsx` | component | CRUD | same file (kind badge + `canWrite` delete) | exact |
| `supabase/13-patient-ai-reports-kinds.sql` | migration | CRUD | `supabase/11-patient-ai-reports.sql` (CHECK + INSERT policy) | exact |

## Pattern Assignments

### `src/lib/pdfFieldCatalog.ts` (utility, transform)

**Analogs:**
1. `src/lib/evaluationFichaContent.ts` — pure filled-leaf helper  
2. `src/services/patientAiPdf.service.ts` — block gates already used by PDF (`hasId` / `hasQueixa` / `textFilled`)

**Filled-leaf primitive** (`evaluationFichaContent.ts` lines 1–18):
```typescript
import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'

/** Completa when any clinical leaf is filled; otherwise Parcial (date-only). */
export function fichaHasClinicalContent(ficha: EvaluationFicha | null | undefined): boolean {
  if (!ficha) return false
  return hasFilledLeaf(ficha)
}

function hasFilledLeaf(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === '') return false
  if (typeof value === 'number') return true // EVA 0 is filled
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some((item) => hasFilledLeaf(item))
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) => hasFilledLeaf(item))
  }
  return false
}
```

**Block gate pattern to share with renderer** (`patientAiPdf.service.ts` lines 565–567, 664–676):
```typescript
function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

const hasId = idFields.some(([, v]) => textFilled(v))
const hasQueixa =
  textFilled(queixa?.oQueTrouxe) ||
  textFilled(queixa?.regiao) ||
  textFilled(queixa?.haQuantoTempo) ||
  ladoItems.length > 0
// Catalog must expose one id per lettered block that would render today
// (e.g. '01.A', '01.B') — same predicates; do NOT re-walk Zod shape generically.
```

**Direction for Phase 13:**
- Export `PdfFieldItem { id, label, groupLabel, preview?, sensitive? }`  
- `buildEvaluationFilledCatalog(ficha)` — explicit block list aligned to `FichaBlock` / `drawAvaliacao`  
- `buildEvolucaoFilledCatalog(sessions, aiSections?)` — SOAP leaves per session + `evo.ai.*`  
- Single source of truth: catalog predicates === renderer skip rules (`selectedFieldIds`)

**Do not** rely only on recursive `hasFilledLeaf` for picker IDs — RESEARCH mandates explicit block units (~27).

---

### `src/components/patients/PatientAiFieldPicker.tsx` (component, request-response)

**Analogs:**
1. `src/components/ui/Modal.tsx` — shell  
2. `fichaFormPrimitives.tsx` `BoolCheck` — checkbox hit area  
3. `DashboardClinicalShortcut.tsx` — Modal as step after primary CTA  

**Modal shell** (`Modal.tsx` lines 5–15, 38–45):
```typescript
interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean // use default max-w-lg for picker; wide only if needed
}

export function Modal({ open, title, description, onClose, children, wide = false }: ModalProps) {
  // Escape + body scroll lock; portal; mobile items-end
}
```

**Checkbox row** (`fichaFormPrimitives.tsx` lines 52–68):
```typescript
export function BoolCheck(/* … */) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
      <input type="checkbox" className="accent-forest" disabled={disabled} {...register(name)} />
      <span>{label}</span>
    </label>
  )
}
// Field picker: controlled checkboxes (Set of ids), same min-h-11 + accent-forest
// Sensitive: small caption "Sensível" + optional muted/amber well (UI-SPEC)
```

**Modal-as-step** (`DashboardClinicalShortcut.tsx` lines 103–109):
```typescript
{state.step === 'picker' ? (
  <Modal
    open
    title={/* UI-SPEC: "Campos no PDF" */}
    description={/* "Só campos preenchidos. Desmarque o que o cliente não deve ver." */}
    onClose={closeShortcut}
  >
    {/* checklist + Marcar todos / Desmarcar sensíveis / Continuar */}
  </Modal>
) : null}
```

**Props shape (planner):**
```typescript
type Props = {
  open: boolean
  items: PdfFieldItem[]
  selectedIds: Set<string>
  onChange: (next: Set<string>) => void
  onConfirm: () => void
  onBack: () => void
  confirming?: boolean
}
// Default: all items selected when Modal opens (D-02)
// Empty items → disable confirm + toast (UI-SPEC)
```

---

### `src/components/patients/PatientAiComposer.tsx` (component, request-response)

**Analog:** same file

**canWrite wall + dual mode** (lines 25–50, 198–223):
```typescript
type PatientAiComposerProps = {
  patientId: string
  canWrite?: boolean // fail-closed default false
}

export function PatientAiComposer({ patientId, canWrite = false }: PatientAiComposerProps) {
  if (!canWrite) return null
  // mode: 'resumo' | 'pdf' segmented control — KEEP
}
```

**PDF scopes today → Phase 13** (lines 20–21, 246–274):
```typescript
/** TODAY */
type PdfExportScope = 'avaliacao' | 'sessao'
// pdfScopeAvaliacao = "Avaliação salva"; pdfScopeSessao = "Por sessão"

/** PHASE 13 */
type PdfExportScope = 'avaliacao' | 'evolucao'
// Copy: "Avaliação" | "Evolução" (PATIENT_AI_COPY + UI-SPEC)
// Replace single Select session with multi-select checkboxes (sessions with evolution preferred)
```

**Export Avaliação path** (lines 102–144) — insert picker before build:
```typescript
// TODAY: build PDF immediately → mutate kind 'geral'
const blob = await buildPatientAiReportPdf({
  kind: 'avaliacao',
  name: detail.name,
  code: detail.code,
  performedOnLabel: selected.performedOnLabel,
  evaluationTitle: selected.title || null,
  therapistName: selected.therapistName,
  ficha: selected.ficha,
})
const reportKind: PatientAiReportKind = 'geral' // REMOVE this map

// PHASE 13:
// 1) catalog = buildEvaluationFilledCatalog(selected.ficha)
// 2) open PatientAiFieldPicker (all on)
// 3) blob = buildPatientAiReportPdf({ kind: 'avaliacao', …, selectedFieldIds })
// 4) createReport.mutate({ kind: 'avaliacao', sessionId: null, sessionLabel: …, blob })
```

**Export Evolução path** (replace lines 147–190):
```typescript
// TODAY: single sessionId → build sessao SOAP locally (no IA)
// PHASE 13 (UI-SPEC flow):
// 1) require sessionIds.length >= 1 (toast need sessions)
// 2) invoke generateEvolucaoSynthesis({ patientId, sessionIds, userHint? })  // loading on CTA
// 3) on success → Modal picker (SOAP filled + AI sections)
// 4) buildPatientAiReportPdf({ kind: 'evolucao', …, selectedFieldIds, synthesis })
// 5) createReport.mutate({ kind: 'evolucao', sessionId: null, sessionLabel: 'N sessões · …', blob })
```

**Evaluation options reuse** (lines 63–75): keep `LATEST_EVAL_VALUE` + `usePatientEvaluations`.

---

### `src/services/patientAiPdf.service.ts` (service, transform)

**Analog:** same file

**Brand + A4 constants** (lines 15–32):
```typescript
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const COLORS = {
  forest: rgb(0x0b / 255, 0x1d / 255, 0x36 / 255),
  accent: rgb(0x2f / 255, 0x7d / 255, 0xff / 255),
  accentSoft: rgb(0xe7 / 255, 0xf0 / 255, 0xfb / 255),
  // … canvas, ink, muted, line, white
}
```

**Input union today** (lines 78–93) — extend:
```typescript
export interface PatientAiAvaliacaoPdfInput {
  kind: 'avaliacao'
  name: string
  code: string
  performedOnLabel: string
  evaluationTitle?: string | null
  therapistName?: string | null
  ficha: EvaluationFicha
  selectedFieldIds?: ReadonlySet<string> // NEW — default = all filled
}

// NEW:
export interface PatientAiEvolucaoPdfInput {
  kind: 'evolucao'
  name: string
  code: string
  sessionLabel: string
  sessions: Array<{ id: string; dateLabel: string; timeLabel: string; evolution: … }>
  synthesis: { sintese: string; tendencias?: string; condutasAgregadas?: string; alertas?: string }
  selectedFieldIds?: ReadonlySet<string>
}

export type BuildPatientAiReportPdfInput =
  | PatientAiGeralPdfInput   // keep for legacy read path if any
  | PatientAiSessaoPdfInput  // keep drawSessao for back-compat OR unused
  | PatientAiAvaliacaoPdfInput
  | PatientAiEvolucaoPdfInput
```

**Omit-empty helpers** (lines 590–607) — keep; gate whole blocks with `selectedFieldIds`:
```typescript
function drawOptionalField(ctx, label, value): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && !value.trim()) return false
  // number 0 is valid
  drawField(ctx, label, String(value))
  return true
}
```

**Block chrome (NEW — RESEARCH sketch; no borderRadius in pdf-lib):**
```typescript
// After drawSectionTitle pattern (lines 332–348), add framed block:
ctx.page.drawRectangle({
  x: MARGIN_X,
  y: blockBottom,
  width: CONTENT_WIDTH,
  height: blockHeight,
  borderColor: COLORS.accent,
  borderWidth: 1,
  color: COLORS.white,
})
ctx.page.drawRectangle({
  x: MARGIN_X,
  y: blockTop - headerH,
  width: CONTENT_WIDTH,
  height: headerH,
  color: COLORS.accentSoft,
})
// Letter + title inside header; body uses existing drawOptionalField / bullets
```

**Dispatch** (lines 1273–1321):
```typescript
function docTitleFor(input: BuildPatientAiReportPdfInput): string {
  if (input.kind === 'geral') return 'Avaliação geral'
  if (input.kind === 'sessao') return 'Avaliação por sessão'
  if (input.kind === 'evolucao') return 'Evolução clínica'
  const named = input.evaluationTitle?.trim()
  return named || 'Avaliação musculoesquelética'
}

// buildPatientAiReportPdf: branch drawEvolucao; pass selectedFieldIds into drawAvaliacao
```

**Unicode:** keep `toWinAnsiSafe` (lines 107–115).

---

### `src/services/patientAi.service.ts` (service, request-response)

**Analog:** same file (`generatePatientAiSummary`)

**Invoke + error map** (lines 136–167):
```typescript
export async function generatePatientAiSummary(
  input: PatientAiSummaryInvokeInput,
): Promise<string> {
  const parsed = patientAiSummaryInvokeSchema.parse(input)

  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId: parsed.patientId,
      userHint: parsed.userHint,
    },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    throwMappedFunctionsError(payload)
  }
  // … validate summary string; updatePatient + focus keys
}
```

**Phase 13 extension:**
```typescript
// NEW schema: patientAiEvolucaoInvokeSchema = { patientId, mode: 'evolucao', sessionIds: z.array(uuid).min(1).max(12), userHint? }
export async function generateEvolucaoSynthesis(input): Promise<EvolucaoSynthesis> {
  const parsed = patientAiEvolucaoInvokeSchema.parse(input)
  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId: parsed.patientId,
      mode: 'evolucao',
      sessionIds: parsed.sessionIds,
      userHint: parsed.userHint,
    },
  })
  // reuse readFunctionsErrorPayload / throwMappedFunctionsError
  // DO NOT call updatePatient / applyAiFocusRegionKeys — synthesis is PDF-only
  // Zod-parse response: sintese required; tendencias/condutasAgregadas/alertas optional
}
```

---

### `supabase/functions/patient-ai-summary/index.ts` (controller, request-response)

**Analog:** same file

**Auth + CORS + serve entry** (lines 9–51, 522–559):
```typescript
async function requireUser(req: Request): Promise<{ user: User; authHeader: string } | Response> {
  // Bearer JWT → createUserClient → getUser; 401 unauthorized
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed', code: 'method_not_allowed' }, 405)
  }
  const auth = await requireUser(req)
  if (auth instanceof Response) return auth
  // body.patientId UUID; GEMINI_API_KEY from Deno.env only
})
```

**Context pack + prompt rules** (lines 213–216, 379–398):
```typescript
async function assembleContextPack(client, patientId): Promise<Record<string, unknown> | Response> {
  // Patient under RLS; sessions with nested evolutions; omitEmpty + truncate
}

function buildPrompt(contextPack, userHint): string {
  // "Nunca invente… Omita campos vazios… Pedido do profissional (NÃO CONFIÁVEL…)"
  // JSON response keys for resumo: summary + focusRegionKeys
}
```

**Phase 13 mode discriminant:**
```typescript
// body: { patientId, mode?: 'resumo' | 'evolucao', sessionIds?: string[], userHint? }
// mode omitido | 'resumo' → current path (compat)
// mode === 'evolucao':
//   - validate sessionIds (1..N, UUID, cap ~12; prefer reuse MAX_SESSIONS=20 as hard max)
//   - assemble pack: patient mínimo + ONLY selected sessions (filter after query or .in('id', sessionIds))
//   - buildEvolucaoPrompt → JSON { sintese, tendencias?, condutasAgregadas?, alertas? }
//   - callGemini adapted parseEvolucaoJson (no focusRegionKeys required)
//   - return jsonResponse(synthesis) — never write patients.ai_summary
```

**Reuse:** `omitEmpty`, `truncate`, `MAX_FIELD_CHARS`, prompt 90k cap, Gemini model fallback chain (`callGemini`).

---

### `src/schemas/patientAi.schema.ts` + `src/types/patient.ts`

**Analog:** same files

**Copy + kind today** (`patientAi.schema.ts` lines 4–33, 49–79):
```typescript
export const PATIENT_AI_COPY = {
  // …
  kindGeral: 'Geral',
  kindSessao: 'Sessão',
  pdfScopeAvaliacao: 'Avaliação salva', // → 'Avaliação'
  pdfScopeSessao: 'Por sessão',         // → remove; add pdfScopeEvolucao: 'Evolução'
  // UI-SPEC additions: pickerTitle, pickerHelper, desmarcarSensiveis, needSessions, needFields, …
} as const

export const patientAiReportKindSchema = z.enum(['geral', 'sessao'])
// → z.enum(['geral', 'sessao', 'avaliacao', 'evolucao'])

export const patientAiReportUploadSchema = z.object({…}).superRefine((data, ctx) => {
  // TODAY: geral ⇒ sessionId null; sessao ⇒ sessionId set
  // PHASE 13: avaliacao|evolucao|geral ⇒ sessionId null
  //           sessao (legacy) ⇒ sessionId may be set (list still reads)
})
```

**Type** (`patient.ts` lines 100–114):
```typescript
export type PatientAiReportKind = 'geral' | 'sessao'
// → 'geral' | 'sessao' | 'avaliacao' | 'evolucao'
```

**Enum empty handling** (`evaluationFicha.schema.ts` lines 3–7) — catalog/PDF must treat `''` as absent:
```typescript
function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  return value
}
```

---

### `src/services/patientAiReports.service.ts` (service, file-I/O + CRUD)

**Analog:** same file

**Upload + denorm label** (lines 154–174):
```typescript
export async function createPatientAiReport(patientId, input): Promise<PatientAiReport> {
  const meta = parseUploadMeta(input) // Zod kind XOR sessionId
  const path = `${patientId}/${reportId}.pdf`

  const sessionLabel =
    meta.kind === 'sessao'
      ? sanitizeText(input.sessionLabel?.trim() || 'Sessão', 120)
      : null
  // PHASE 13: also denorm for kind === 'evolucao' (and optionally avaliacao title/date)
  // e.g. meta.kind === 'evolucao' || meta.kind === 'sessao' → sanitize sessionLabel

  await supabase.storage.from(REPORT_BUCKET).upload(path, input.blob, {
    contentType: 'application/pdf',
    upsert: false,
  })
  // INSERT fail → storage.remove rollback (lines 122–125)
}
```

---

### `src/components/patients/PatientAiReportsList.tsx` (component, CRUD)

**Analog:** same file

**Kind badge** (lines 94–104):
```typescript
<span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-forest">
  {report.kind === 'geral'
    ? PATIENT_AI_COPY.kindGeral
    : PATIENT_AI_COPY.kindSessao}
</span>
// PHASE 13: switch/map
// avaliacao → "Avaliação"; evolucao → "Evolução"; geral → "Geral"; sessao → "Sessão"
// Show sessionLabel for evolucao AND sessao (multi-session summary text)
```

**canWrite delete** (lines 126–135, 142–160): keep ConfirmDialog pattern; no change to Abrir/Baixar.

---

### `supabase/13-patient-ai-reports-kinds.sql` (migration, CRUD)

**Analog:** `supabase/11-patient-ai-reports.sql`

**Header convention** (lines 1–4):
```sql
-- REQ-25 Phase 13 kinds. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push. Nao DROP can_*. Nao DELETE FROM storage.objects.
```

**CHECK + XOR today** (lines 53–61, 105–124):
```sql
constraint patient_ai_reports_kind_ck
  check (kind in ('geral', 'sessao')),
constraint patient_ai_reports_kind_session_ck check (
  (kind = 'geral' and session_id is null)
  or (kind = 'sessao')
);

-- INSERT WITH CHECK branches only geral|sessao
```

**Phase 13 alter (idempotent):**
```sql
alter table public.patient_ai_reports
  drop constraint if exists patient_ai_reports_kind_ck;

alter table public.patient_ai_reports
  add constraint patient_ai_reports_kind_ck
  check (kind in ('geral', 'sessao', 'avaliacao', 'evolucao'));

alter table public.patient_ai_reports
  drop constraint if exists patient_ai_reports_kind_session_ck;

alter table public.patient_ai_reports
  add constraint patient_ai_reports_kind_session_ck check (
    (kind in ('geral', 'avaliacao', 'evolucao') and session_id is null)
    or (kind = 'sessao')
  );

-- drop/recreate patient_ai_reports_insert WITH CHECK:
--   geral|avaliacao|evolucao ⇒ session_id is null
--   sessao ⇒ session_id not null + exists patient_sessions same patient
-- Storage policies unchanged (bucket MIME already PDF)
notify pgrst, 'reload schema';
```

---

## Shared Patterns

### Authentication (Edge Function JWT)
**Source:** `supabase/functions/patient-ai-summary/index.ts` lines 34–51, 528–530  
**Apply to:** `mode: 'evolucao'` branch (same `requireUser` + user-scoped client)  
```typescript
const auth = await requireUser(req)
if (auth instanceof Response) return auth
const userClient = createUserClient(authHeader) // RLS on session/patient reads
```

### Authorization (UX + RLS)
**Source:** `PatientAiComposer` `if (!canWrite) return null`; SQL `can_write_patient` on INSERT  
**Apply to:** composer, picker confirm, list Excluir  
```typescript
canWrite?: boolean // default false — fail closed
```

### Error handling (PT-BR)
**Source:** `patientAi.service.ts` `mapPatientAiError` + `PATIENT_AI_COPY`  
**Apply to:** Evolução invoke failures (`unavailable`, `misconfigured`, `forbidden`) and PDF export toasts  
```typescript
toast(error instanceof Error ? error.message : PATIENT_AI_COPY.exportError, 'error')
```

### Validation (Zod before invoke / upload)
**Source:** `patientAiSummaryInvokeSchema.parse` + `patientAiReportUploadSchema.safeParse`  
**Apply to:** evolucao invoke body; upload kinds `avaliacao`/`evolucao`; empty selected set  

### Catalog ↔ PDF contract
**Source:** `textFilled` / block `has*` in `drawAvaliacao` + new `pdfFieldCatalog.ts`  
**Apply to:** picker list AND `selectedFieldIds` filter — one predicate set  

### PDF brand + omit empty
**Source:** `patientAiPdf.service.ts` COLORS, `drawOptionalField`, `toWinAnsiSafe`  
**Apply to:** ficha block frames + `drawEvolucao`  
```typescript
// Never invent SOAP/AI text client-side if EF failed — toast and abort upload
```

### Storage orphan guard
**Source:** `patientAiReports.service.ts` INSERT fail → `storage.remove`  
**Apply to:** unchanged for new kinds  

### Modal step (mobile)
**Source:** `Modal.tsx` + UI-SPEC  
**Apply to:** field picker only — do not inline mega-checklist in composer  

## No Analog Found

| File / Concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| Multi-session checkbox list in composer | component | request-response | No multi-select session UI yet — compose from `BoolCheck` + `sessionOptions` map; filter sessions with `evolution` |
| `drawFichaBlockFrame` rounded corners | service | transform | pdf-lib has no `borderRadius` — use straight `drawRectangle` (RESEARCH) |

*(Both have partial analogs; planner invents composition, not new libraries.)*

## Metadata

**Analog search scope:**  
`src/components/patients/`, `src/components/ui/Modal.tsx`, `src/components/patients/evaluation/fichaFormPrimitives.tsx`, `src/services/patientAi*.ts`, `src/schemas/patientAi.schema.ts`, `src/schemas/evaluationFicha.schema.ts`, `src/lib/evaluationFichaContent.ts`, `src/types/patient.ts`, `supabase/11-patient-ai-reports.sql`, `supabase/functions/patient-ai-summary/`

**Files scanned:** ~18 primary (+ Phase 11/12 PATTERNS structure)  
**Pattern extraction date:** 2026-09-20  
**Key composition:** Phase 11 PDF/composer/Storage + Phase 12 ficha/`drawAvaliacao` + Modal checklist + EF mode discriminant (extend, don’t fork)
