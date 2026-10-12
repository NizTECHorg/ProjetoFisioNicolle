# Phase 23: Ajustes do resumo IA e rolagem do Entenda o caso - Pattern Map

**Mapped:** 2026-10-04
**Files analyzed:** 9
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/pages/PatientPage.tsx` (`ResumoDoPaciente`, `EntendaOCaso`) | component | request-response | same file + `src/components/patients/PatientSummaryEditorModal.tsx` | exact |
| `src/components/patients/PatientSummaryEditorModal.tsx` | component (delete) | request-response | itself — copy the save path, then remove the file | exact |
| `src/components/patients/PatientAiComposer.tsx` | component | request-response | itself (resumo `Textarea` only) | exact |
| `src/index.css` | config | transform | `.panel-scroll` in the same file | exact |
| `src/lib/focusRegionAllow.ts` | utility | transform | `src/lib/sessionSeries.ts` (pure fn) + `src/lib/focusRegions.ts` (catalog) | role-match |
| `src/lib/focusRegionAllow.test.ts` | test | transform | `src/lib/patientSummary.test.ts` | role-match |
| `src/lib/patientSummaryContract.test.ts` | test | transform | itself (`sliceBetween` source contracts) | exact |
| `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` | service | request-response | itself; count criterion from `src/services/patients.service.ts` | exact |
| `src/services/patientAi.service.ts` | service | CRUD | itself (`applyAiFocusRegionKeys`) | exact |

Do not create a modal, a `supabase/functions/` copy, or a new npm package. Do not edit the phase 11 twin `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts`. Do not change `src/lib/patientSummary.ts`, `src/hooks/usePatients.ts`, `src/services/patients.service.ts` (`savePatientSummaryEdits` already replaces the whole `summary_edits` column), `src/components/ui/Textarea.tsx`, `src/components/ui/Button.tsx`, or `src/components/patients/PatientResumoIaPanel.tsx` (it already reads only the original and has no pencil).

## Pattern Assignments

### `src/pages/PatientPage.tsx` (component, request-response)

**Analog:** `EntendaOCaso` / `ResumoDoPaciente` in the same file, plus the save path in `PatientSummaryEditorModal.tsx`.

**Imports pattern** (lines 1–46) — add `useSavePatientSummaryEdits` from `@/hooks/usePatients` and `diffSummaryEdits`, `SUMMARY_FIELD_KEYS`, `SUMMARY_FIELD_LABELS`, `SUMMARY_FIELD_ROWS`, `summaryEditsSchema`, `type SummaryFieldKey` from `@/lib/patientSummary`. Drop the `PatientSummaryEditorModal` import when the modal is gone. `Textarea` stays: the Entenda o caso modal still uses it. The inline resumo editor does not.

```1:46:src/pages/PatientPage.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { usePatient, usePatientDashboard, useUpdatePatient } from '@/hooks/usePatients'
import { canWritePatient } from '@/lib/accountAccess'
import { resolveSummaryFields } from '@/lib/patientSummary'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
```

**Auth pattern** — render the pencil only when `canWrite` is true. Do not render a disabled pencil. `canWrite` is already computed with `canWritePatient` (lines 550–551) and passed into `ResumoDoPaciente`.

```149:158:src/pages/PatientPage.tsx
{canWrite ? (
  <button
    type="button"
    aria-label="Editar entendimento do caso"
    onClick={() => setOpen(true)}
    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity hover:bg-accent-soft hover:text-forest group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
  >
    <Pencil size={16} />
  </button>
) : null}
```

Copy that class string. New `aria-label` is ``Editar ${SUMMARY_FIELD_LABELS[key]}``, not `PATIENT_AI_COPY.editPencilLabel` (`Editar resumo do paciente` opens the modal today). Put `group` on the box wrapper so hover reveals the pencil. One `editingKey: SummaryFieldKey | null`. Opening another pencil while not pending discards the unsaved draft. While `isPending`, other pencils do not open.

**Core pattern — resolved text and one pencil today** (lines 289–335). Replace `editOpen` + `PatientSummaryEditorModal` with one editor inside the open box. Áreas de foco and Todos os objetivos stay without a text pencil.

```289:335:src/pages/PatientPage.tsx
const text = resolveSummaryFields(
  { summary: detail.aiSummary, ...detail.aiSummaryFields },
  detail.summaryEdits,
)
// ...
{canWrite ? (
  <PatientSummaryEditorModal
    patientId={patientId}
    open={editOpen}
    onClose={() => setEditOpen(false)}
    original={{ summary: detail.aiSummary, ...detail.aiSummaryFields }}
    edits={detail.summaryEdits}
  />
) : null}
```

Reading paragraphs stay as they are: Resumo IA `mt-4 text-sm leading-7 text-ink/90 sm:text-base whitespace-pre-line break-words`; cards `mt-2 break-words whitespace-pre-line text-sm leading-6 text-ink`; empty card text is `textOrDash` (lines 77–82). Draft starts as the resolved string for that key (`''` when empty). Do not seed with `—` or `Sem resumo ainda.`. Do not reset the draft from `detail` while `editingKey` is set (the modal's `useEffect` on `open` is the trap — see Pitfall 7 in RESEARCH.md).

**Save pattern to copy from the modal, then stop using the modal** (`PatientSummaryEditorModal.tsx` lines 35–61). Spread all six resolved keys before diffing. Saving `{ [key]: draft }` alone wipes the other edits because the UPDATE replaces the column.

```35:61:src/components/patients/PatientSummaryEditorModal.tsx
const save = useSavePatientSummaryEdits(patientId)
const resolved = resolveSummaryFields(original, edits)
// ...
onSubmit={form.handleSubmit((values) => {
  const diff = diffSummaryEdits(original, values)
  save.mutate(diff, { onSuccess: onClose })
})}
```

Inline equivalent (no react-hook-form, no blur):

```typescript
const original = { summary: detail.aiSummary, ...detail.aiSummaryFields }
const resolved = resolveSummaryFields(original, detail.summaryEdits)
const parsed = summaryEditsSchema.shape[key].safeParse(draft)
if (!parsed.success) { /* show parsed.error.issues[0].message */ return }
const diff = diffSummaryEdits(original, { ...resolved, [key]: draft })
save.mutate(diff, { onSuccess: () => setEditingKey(null) })
```

`original` for `diffSummaryEdits` is the generated text, not `resolved`. `next` is the resolved six keys with the open key replaced. `null` from the diff clears the column (all six match the original). Success closes the box; the hook already toasts `Resumo salvo`. Error stays in the box with the draft.

**Validation / textarea** — do not mount `Textarea` (it always renders a `<label>`, `Textarea.tsx` lines 13–16). Copy the inner `<textarea>` classes and the alert:

```17:34:src/components/ui/Textarea.tsx
<textarea
  aria-invalid={!!error}
  className={[
    'min-h-24 w-full rounded-2xl border bg-canvas px-4 py-3 text-ink placeholder:text-muted/50',
    'transition-colors duration-200',
    'focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25',
    error ? 'border-error' : 'border-line hover:border-forest/25',
  ].join(' ')}
/>
{error && (
  <p role="alert" className="text-xs text-error">
    {error}
  </p>
)}
```

`rows={SUMMARY_FIELD_ROWS[key]}`. `aria-labelledby` points at the visible title (`resumo-summary-label` / `resumo-summary`, and the five siblings in `23-UI-SPEC.md`). Message already lives on the schema: `Use no máximo N caracteres.` (`patientSummary.ts` lines 172–191).

**Buttons** — copy the modal row, with `min-h-11` and copy `Cancelar` / `Salvar` (not `Fechar sem salvar` / `Salvar edições`):

```73:79:src/components/patients/PatientSummaryEditorModal.tsx
<div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:justify-end">
  <Button type="button" variant="secondary" onClick={onClose}>
    {PATIENT_AI_COPY.editModalCancel}
  </Button>
  <Button type="submit" isLoading={save.isPending}>
    {PATIENT_AI_COPY.editModalSubmit}
  </Button>
</div>
```

`Button` `isLoading` already disables the control and shows `Aguarde...` (`Button.tsx` lines 33–49). Disable Cancelar while pending. `Enter` in the textarea inserts a newline. `Esc` cancels unless pending. Focus the textarea on open and return focus to that key's pencil on close.

**Entenda o caso overflow** — only the two paragraphs. Leave the article, the metrics grid, the goals `line-clamp-2` (line 192), the pencil, and the complaint/diagnosis modal (lines 203–263) alone.

```161:169:src/pages/PatientPage.tsx
<div>
  <p className="text-xs text-muted">Queixa</p>
  <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink">{clampText(patient.complaint)}</p>
</div>
<div>
  <p className="text-xs text-muted">Diagnóstico</p>
  <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink">{clampText(patient.diagnosis)}</p>
</div>
```

Replace `line-clamp-3` with `case-scroll mt-1 max-h-[4.5rem] overflow-y-auto overscroll-contain text-sm leading-6 text-ink`. Add `tabIndex={0}` and `aria-label="Queixa"` / `aria-label="Diagnóstico"`. Keep `clampText`. Do not combine `line-clamp-3` with `overflow-y-auto`.

---

### `src/components/patients/PatientSummaryEditorModal.tsx` (component, delete)

**Analog:** the file itself.

After `PatientPage.tsx` no longer imports it, delete the file. Do not replace it with another modal. `PATIENT_AI_COPY.editModalTitle` and the other modal copy keys may become unused; do not keep the component to use them. The persist path that must survive is `diffSummaryEdits` + `useSavePatientSummaryEdits` (excerpts above).

---

### `src/components/patients/PatientAiComposer.tsx` (component, request-response)

**Analog:** the resumo branch in the same file (lines 401–409). PDF mode stays. `userHint` state, trim, and the 2000 cap in `patientAiSummaryInvokeSchema` (`patientAi.schema.ts` lines 72–79) stay.

```401:409:src/components/patients/PatientAiComposer.tsx
{mode === 'resumo' ? (
  <div className="mt-4 space-y-4">
    <Textarea
      label="Orientação opcional (opcional)"
      placeholder="Ex.: enfatize evolução da dor lombar nas últimas sessões"
      rows={3}
      value={userHint}
      onChange={(event) => setUserHint(event.target.value)}
    />
```

Change only the label to `Descrição adicional (opcional)` and the placeholder to `Ex.: dor no joelho direito ao subir escada`. The placeholder must not say enfatize or ênfase. Keep the shared `Textarea` here (this field's label is the field label). `canWrite` already unmounts write chrome (`PatientAiComposerProps`, lines 38–42).

---

### `src/index.css` (config, transform)

**Analog:** `.panel-scroll` (lines 134–150). Insert `.case-scroll` immediately after that block. Do not edit the global `*` scrollbar or `.nav-scroll` (white thumb on a dark bar, lines 99–132).

```134:150:src/index.css
.panel-scroll {
  scrollbar-width: thin;
  scrollbar-color: #d5dde8 transparent;
}
.panel-scroll::-webkit-scrollbar {
  width: 6px;
}
.panel-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.panel-scroll::-webkit-scrollbar-thumb {
  background-color: #d5dde8;
  border-radius: 999px;
}
```

New class uses the same shape with `width: 4px` and `rgba(16, 32, 56, 0.28)` (`ink` at 0.28). No new `@theme` token.

---

### `src/lib/focusRegionAllow.ts` (utility, transform)

**Analog:** pure exports in `src/lib/sessionSeries.ts`; catalog in `src/lib/focusRegions.ts`. There is no NFD or label-regex helper in `src/`. Copy the function shape, not a search algorithm.

```28:40:src/lib/sessionSeries.ts
/** '' | '0' | 'abc' | '-3' -> 1; '2.7' -> 2; '99' -> MAX_SERIES_WEEKS. */
export function clampWeeks(value: string): number {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(MAX_SERIES_WEEKS, Math.max(1, Math.trunc(count)))
}

/** Ciclos de 7 dias a partir de `start`; cada dia marcado ocorre 1x por ciclo. */
export function buildWeeklySeries(
```

Import `FOCUS_REGIONS` from `@/lib/focusRegions`. Walk every region. A shared label already exists twice in the catalog (`Joelho direito` is `front.knee_r` at line 178 and `back.knee_r` at line 325; `Braço esquerdo` is `front.upper_arm_l` at line 108 and `back.upper_arm_l` at line 262). Matching the label marks both keys. `sharedFocusLabels` (lines 364–368) is only for aria text; do not import it. Do not add a synonym table.

Normalize with `NFD`, strip marks, lowercase. Test the whole label with a left boundary `(?<![a-z])` so `antebraço esquerdo` does not match `braço esquerdo`. `joelho` alone does not match `joelho direito`. Scan raw clinical strings plus the full extra description, before `truncate`. Do not scan `admin_notes`, alerts, therapist name, or saved `patient_focus_areas` labels.

The Edge Function cannot import `@/`. Paste the same matcher into the phase 13 `index.ts`. Keep the pasted labels equal to `FOCUS_REGIONS[].label`. The existing 42-key parity test stays.

---

### `src/lib/focusRegionAllow.test.ts` (test, transform)

**Analog:** `src/lib/patientSummary.test.ts` (behavior, `node:test`, relative `.ts` import).

```1:11:src/lib/patientSummary.test.ts
import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import {
  aiSummaryResponseSchema,
  diffSummaryEdits,
  formatGeneratedAt,
  narrowAiSummaryFields,
  narrowSummaryEdits,
  resolveSummaryFields,
  summaryEditsSchema,
} from './patientSummary.ts'
```

Cases: `antebraço esquerdo` does not include `front.upper_arm_l`; `joelho direito` includes `front.knee_r` and `back.knee_r`; bare `joelho` includes neither side; the extra description adds a key; a token that is not a catalog label does not. Run with `node --test src/lib/focusRegionAllow.test.ts`.

---

### `src/lib/patientSummaryContract.test.ts` (test, transform)

**Analog:** the file itself. Keep `sliceBetween`, `EDGE_FUNCTION` (phase 13 only), and the 42-key parity test (lines 75–86).

```11:17:src/lib/patientSummaryContract.test.ts
function sliceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker)
  if (start < 0) throw new Error(`marcador ausente: ${startMarker}`)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (end < 0) throw new Error(`marcador ausente: ${endMarker}`)
  return source.slice(start, end)
}
```

```62:73:src/lib/patientSummaryContract.test.ts
test('REQ-33.6: prompt com 7 chaves', () => {
  const prompt = sliceBetween(
    read(EDGE_FUNCTION),
    'function buildPrompt',
    'async function assembleEvolucaoContextPack',
  )
  for (const key of SUMMARY_FIELD_KEYS) {
    ok(prompt.includes(key), `prompt sem ${key}`)
  }
  ok(prompt.includes('focusRegionKeys'), 'prompt sem focusRegionKeys')
  ok(prompt.includes('NÃO CONFIÁVEL'), 'prompt sem NÃO CONFIÁVEL')
})
```

Rewrite that last assert. The `function buildPrompt` → `assembleEvolucaoContextPack` slice must contain `FONTE` and must not contain `NÃO CONFIÁVEL`. Move the `NÃO CONFIÁVEL` assert onto `function hintBlockFor` (or `buildEvolucaoPrompt`). Do not delete the seven-key asserts or the 42-key parity. The `assembleContextPack` → `buildPrompt` slice includes `hintBlockFor`, so it still contains `NÃO CONFIÁVEL`; do not assert that slice lost the phrase.

Add `REQ-34.*` the same way:

- REQ-34.1: `function ResumoDoPaciente` slice (already used at lines 93–98) does not contain `PatientSummaryEditorModal`; has an editor per text key; no summary pencil when the source is the read-only path. `PatientResumoIaPanel.tsx` still must not contain `summaryEdits` (lines 88–91).
- REQ-34.2: `assembleContextPack` slice does not assign `sessionsDone: patient.sessions_done`; it contains `count: 'exact'` and `realizada`.
- REQ-34.4: `buildPrompt` slice contains `FONTE`, does not contain `NÃO CONFIÁVEL`, and does not call `hintBlockFor`.
- REQ-34.5: `function EntendaOCaso` slice has no `line-clamp-3` on the complaint/diagnosis paragraphs, has `overflow-y-auto` and `case-scroll`, and still has `line-clamp-2` on goals.

---

### `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` (service, request-response)

**Analog:** this file. Auth stays `requireUser` + `createUserClient` (lines 25–51). The handler already builds `userClient` from the bearer token (line 811) and passes it to `assembleContextPack` (line 853). Do not use the service role. Do not log the pack or the description.

**Count pattern** — copy the criterion from the dashboard, not the column and not the capped session array.

```273:275:src/services/patients.service.ts
function countCompletedSessions(sessions: SessionRow[]) {
  return sessions.filter((session) => session.status === 'realizada').length
}
```

```521:551:src/services/patients.service.ts
supabase
  .from('patient_sessions')
  .select('id, scheduled_at, session_type, place, status, notes')
  .eq('patient_id', id)
  .in('status', ['agendada', 'confirmada', 'realizada']),
// ...
sessionsDone: countCompletedSessions(sessionRows),
```

Inside `assembleContextPack`, add a parallel query on the same `client` (the user JWT). Do not count `sessionsRes`, which is `.limit(MAX_SESSIONS)` with `MAX_SESSIONS = 20` (lines 56, 265–286).

```typescript
const { count, error } = await client
  .from('patient_sessions')
  .select('*', { count: 'exact', head: true })
  .eq('patient_id', patientId)
  .eq('status', 'realizada')
```

Write `sessionsDone: count ?? 0` when there is no error. `omitEmpty` (lines 123–131) keeps `0` and drops only `undefined`, `null`, `''`, and empty arrays. On error, omit `sessionsDone`. Do not fall back to `patient.sessions_done`. Remove `sessions_done` from the resumo `patientSelect` (line 232) and delete the assignment at line 370. Leave `sessions_planned`. Do not change `assembleEvolucaoContextPack` (line 426).

**Prompt pattern** — `hintBlockFor` (lines 386–390) stays, including `NÃO CONFIÁVEL`, because `buildEvolucaoPrompt` still calls it (line 539). `buildPrompt` (lines 392–420) stops calling `hintBlockFor` and stops saying the request is untrusted (line 414). Empty description → empty block. Non-empty:

```
Descrição adicional do profissional (FONTE — mesmo peso do prontuário para o que ela afirma por escrito):
"""${userHint}"""
```

Rules that replace line 414: the description is a source; do not invent a number that is not in the JSON or the description; sessions already done are only `patient.sessionsDone` (do not count `sessions`; the description does not replace that number); `focusRegionKeys` is exactly `allowedFocusRegionKeys`. `MAX_HINT_CHARS` (line 60) and the handler trim (lines 794–804) stay.

**Focus keys** — `filterFocusKeys` (lines 544–556) still guards catalog keys, but the resumo response must not return the model's list. `parseGeminiJson` currently does (line 600) and the handler returns it unchanged (line 869):

```600:600:.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
    focusRegionKeys: filterFocusKeys(obj.focusRegionKeys),
```

```869:869:.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
  return jsonResponse({ ...result })
```

Compute allowed keys from the raw query strings (complaint, diagnosis, evaluation fields, evolution fields, full `userHint`) before `truncate` (`MAX_FIELD_CHARS` is 1200, line 59). Put `allowedFocusRegionKeys` on the pack. Replace `focusRegionKeys` on the resumo JSON with that same array. Do not union with `focusAreas` already stored. Do not delete rows.

Paste the matcher next to `FOCUS_REGION_KEYS` (lines 62–106). The function file cannot import `src/lib/focusRegionAllow.ts`.

**Error pattern** already in the handler: patient read failure returns 403 (lines 240–245); bad body returns 400 (lines 776–804); Gemini failure returns 503 `ai_unavailable` (lines 862–866). Keep that. No `console.log` of the prompt.

---

### `src/services/patientAi.service.ts` (service, CRUD)

**Analog:** `applyAiFocusRegionKeys` (lines 86–127). Behavior stays insert-only. Update the comment so it says the function inserts only keys the Edge Function returned and never deletes a hand mark.

```86:122:src/services/patientAi.service.ts
/**
 * Additive focus marks only — never deletes unmarked regions (Pitfall 7 / A3).
 */
export async function applyAiFocusRegionKeys(
  patientId: string,
  focusRegionKeys: string[] | undefined,
): Promise<void> {
  if (!focusRegionKeys?.length) return
  for (const raw of focusRegionKeys) {
    const parsed = focusRegionKeySchema.safeParse(raw)
    if (!parsed.success) continue
    const catalog = getFocusRegion(parsed.data)
    if (!catalog) continue
    // existing region_key → continue
    // insert; 23505 → continue. No delete.
  }
}
```

`generatePatientAiSummary` (lines 169–187) still saves the summary and then calls `applyAiFocusRegionKeys`. Do not add a delete. `generateEvolucaoSynthesis` stays PDF-only.

## Shared Patterns

### Authentication and write chrome
**Source:** `src/pages/PatientPage.tsx` (`canWrite`) and the Edge Function `requireUser`
**Apply to:** inline pencils, composer (already gated), session count, focus insert

```34:50:.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts
async function requireUser(
  req: Request,
): Promise<{ user: User; authHeader: string } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  const userClient = createUserClient(authHeader)
  const { data, error } = await userClient.auth.getUser(token)
  if (error || !data.user) {
    return jsonResponse({ error: 'unauthorized', code: 'unauthorized' }, 401)
  }
  return { user: data.user, authHeader }
}
```

The count uses that same `userClient`. `canWrite` only hides UI. RLS on `savePatientSummaryEdits` and `patient_focus_areas` remains the barrier. Scroll on Queixa and Diagnóstico is not a write control.

### Summary save and errors
**Source:** `src/services/patients.service.ts` lines 631–642 and `src/hooks/usePatients.ts` lines 50–52, 182–191
**Apply to:** every inline Salvar

```631:642:src/services/patients.service.ts
export async function savePatientSummaryEdits(
  patientId: string,
  edits: SummaryTexts | null,
): Promise<void> {
  const { data, error } = await supabase
    .from('patients')
    .update({ summary_edits: edits })
    .eq('id', patientId)
    .select('id')

  if (error) throw new Error(PATIENT_AI_COPY.editError)
  if (!data?.length) throw new Error(PATIENT_AI_COPY.editForbidden)
}
```

```50:52:src/hooks/usePatients.ts
function onError(error: unknown) {
  toast(error instanceof Error ? error.message : 'Erro inesperado', 'error')
}
```

```182:191:src/hooks/usePatients.ts
export function useSavePatientSummaryEdits(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (edits: SummaryTexts | null) => savePatientSummaryEdits(patientId, edits),
    onSuccess: () => {
      invalidatePatient(qc, patientId)
      toast(PATIENT_AI_COPY.editSuccess, 'success')
    },
    onError,
  })
}
```

Toasts stay `Resumo salvo`, `Não foi possível salvar o resumo. Tente de novo.`, and `Você não tem permissão para editar este paciente.` (`patientAi.schema.ts` lines 57–59). Do not add a second mutation.

### Diff of all six keys
**Source:** `src/lib/patientSummary.ts` lines 63–86
**Apply to:** the inline save payload

```63:86:src/lib/patientSummary.ts
export function resolveSummaryFields(
  original: SummaryTexts | null | undefined,
  edits: SummaryTexts | null | undefined,
): Record<SummaryFieldKey, string> {
  const out = {} as Record<SummaryFieldKey, string>
  for (const key of SUMMARY_FIELD_KEYS) {
    const edited = edits?.[key]
    out[key] = typeof edited === 'string' ? edited : (original?.[key] ?? '')
  }
  return out
}

export function diffSummaryEdits(
  original: SummaryTexts | null | undefined,
  next: SummaryTexts,
): SummaryTexts | null {
  const out: SummaryTexts = {}
  for (const key of SUMMARY_FIELD_KEYS) {
    const value = (next[key] ?? '').trim()
    if (value !== (original?.[key] ?? '').trim()) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}
```

A missing key in `next` becomes `''` and, if the original had text, is stored as an erasure. That is why the save must pass `{ ...resolved, [key]: draft }`.

### Per-key Zod
**Source:** `summaryEditsSchema` in `src/lib/patientSummary.ts` lines 172–191
**Apply to:** the open textarea only (`summaryEditsSchema.shape[key].safeParse`). Do not mount react-hook-form. Do not slice the draft silently.

### Scrollbar
**Source:** `.panel-scroll` in `src/index.css` lines 134–150
**Apply to:** `.case-scroll` only. `.nav-scroll` is the wrong palette.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Every file has a structural analog. The left-boundary label scan itself is new: `src/` has no `NFD` or regex label matcher. Implement it as a pure function in the `sessionSeries.ts` style, reading `FOCUS_REGIONS`, and paste the same function into the phase 13 Edge Function. |

## Metadata

**Analog search scope:** `src/pages/PatientPage.tsx`, `src/components/patients/`, `src/components/ui/Textarea.tsx`, `src/components/ui/Button.tsx`, `src/lib/patientSummary.ts`, `src/lib/patientSummary.test.ts`, `src/lib/patientSummaryContract.test.ts`, `src/lib/sessionSeries.ts`, `src/lib/focusRegions.ts`, `src/hooks/usePatients.ts`, `src/services/patients.service.ts`, `src/services/patientAi.service.ts`, `src/schemas/patientAi.schema.ts`, `src/index.css`, `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`
**Files scanned:** 16
**Pattern extraction date:** 2026-10-04
