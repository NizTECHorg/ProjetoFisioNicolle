# Phase 24: Atividades da avaliação - Pattern Map

**Mapped:** 2026-10-04
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/atividadeCapacidade.ts` | utility | transform | `src/lib/patientSummary.ts` + `src/lib/focusRegionAllow.ts` | role-match |
| `src/lib/atividadeCapacidade.test.ts` | test | transform | `src/lib/patientSummary.test.ts` | exact |
| `src/schemas/evaluationFicha.schema.ts` | model | transform | same file (`optionalBool`, `optionalEnum`, `atividadesAfetadas`) | exact |
| `src/components/patients/evaluation/EvaluationPage03.tsx` | component | CRUD | same file (bloco B + `watch` revela) and `EvaluationPage02.tsx` (`setValue`) | exact |
| `src/components/patients/evaluation/EvaluationFichaForm.tsx` | component | CRUD | same file (página 02 já recebe `setValue`) | exact |
| `src/components/patients/evaluation/EvaluationFichaDetail.tsx` | component | transform | same file (seção `03 · Função` + `DetailLeaf`) | exact |
| `src/lib/pdfFieldCatalog.ts` | utility | transform | same file (bloco `03.B` + `previewFrom`) | exact |
| `src/services/patientAiPdf.service.ts` | service | file-I/O | same file (`drawFichaBlockFrame` do `03.B`) | exact |

Do not create SQL, a new npm package, a `useFieldArray`, or a separate measure component file. Do not edit `src/services/evaluations.service.ts`, `src/lib/evaluationFichaContent.ts`, or the `patient-ai-summary` function.

## Pattern Assignments

### `src/lib/atividadeCapacidade.ts` (utility, transform)

**Analog:** `src/lib/patientSummary.ts` for a closed catalog, object narrowing that never throws, and clamp-by-slice. `src/lib/focusRegionAllow.ts` for accent-fold and walking the catalog in catalog order.

**Imports pattern** (`src/lib/patientSummary.ts` lines 1–12; `src/lib/focusRegionAllow.ts` line 13):

```typescript
import { z } from 'zod'

export const SUMMARY_FIELD_KEYS = [
  'summary',
  'treatmentPlan',
  'evolution',
  'conducts',
  'nextSessionPlan',
  'painLimitations',
] as const
```

```typescript
import { FOCUS_REGIONS } from './focusRegions.ts'
```

The new helper is imported by `node --test` and by the ficha schema. Use a relative `.ts` specifier (`allowImportingTsExtensions` is already true in `tsconfig.json`). Do not use the `@/` alias inside this file or its test. No React import.

**Core pattern — narrow unknown jsonb, drop unknown keys, never throw** (`src/lib/patientSummary.ts` lines 88–116):

```typescript
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pickStrings<K extends string>(
  value: Record<string, unknown>,
  keys: readonly K[],
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const key of keys) {
    const entry = value[key]
    if (typeof entry === 'string') out[key] = entry
  }
  return out
}

export function narrowAiSummaryFields(value: unknown): AiSummaryFieldsValue | null {
  if (!isJsonObject(value)) return null
  const picked = pickStrings<AiSummaryStoredKey>(value, AI_SUMMARY_STORED_KEYS)
  return Object.keys(picked).length > 0 ? picked : null
}
```

`normalizeAtividadesAfetadas` follows that shape: non-object in → `{ capacidades: {} }`; only the 16 catalog keys are copied; unknown `unidade` is dropped, not thrown. Export the catalog (`key` + `label`) once so page 03, detail, catalog, and PDF stop duplicating the 16 labels.

**Accent-fold for exact label match** (`src/lib/focusRegionAllow.ts` lines 24–26 and 42–69):

```typescript
function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function allowedFocusKeys(texts: readonly string[]): string[] {
  const haystack = fold(texts.join('\n'))
  // ...
  for (const region of FOCUS_REGIONS) {
    if (seen.has(region.key)) continue
    // ...
    keys.push(region.key)
  }
  return keys
}
```

Match the activity label with `fold` equality, not a substring. Emit lines in catalog order.

**Clamp so a long legacy string does not fail the parent parse** (`src/lib/patientSummary.ts` lines 144–154):

```typescript
function clampOptionalText(max: number) {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined
      return value.slice(0, max)
    })
}
```

Clamp inside `normalizeAtividadesAfetadas` (valor 200, `outraDetalhe` 400, `textoLegado` 1200) before the object schema runs. Do not use `.max()` on the legacy path: a too-long string must not fail `evaluationFichaSchema.safeParse`.

**Formatters** live in this file (`formatMedida`, `formatLinha`). `formatGeneratedAt` in the same analog (`src/lib/patientSummary.ts` lines 122–141) is the existing “one pure function, empty in → empty out” style. Copy that, not `Intl` — these formatters concatenate strings (`10 minutos`, `Correr: agora 10 minutos; antes 40 minutos`).

---

### `src/lib/atividadeCapacidade.test.ts` (test, transform)

**Analog:** `src/lib/patientSummary.test.ts`

**Imports pattern** (lines 1–11):

```typescript
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

Import `./atividadeCapacidade.ts` and `../schemas/evaluationFicha.schema.ts` the same way. No Vitest. No `@/`.

**Schema parse that must not throw and must strip unknown keys** (lines 63–88):

```typescript
test('REQ-33.4: aiSummaryResponseSchema aceita só summary e devolve focusRegionKeys vazio', () => {
  const parsed = aiSummaryResponseSchema.parse({ summary: 'x' })
  equal(parsed.summary, 'x')
  deepEqual(parsed.focusRegionKeys, [])
})

test('REQ-33.4: aiSummaryResponseSchema corta texto acima do limite sem lançar', () => {
  const parsed = aiSummaryResponseSchema.parse({
    summary: 's'.repeat(1600),
    treatmentPlan: 'p'.repeat(600),
    nextSessionPlan: 'n'.repeat(450),
  })
  equal(parsed.summary.length, 1500)
  equal(parsed.treatmentPlan?.length, 500)
  equal(parsed.nextSessionPlan?.length, 400)
})

test('REQ-33.4: aiSummaryResponseSchema descarta chave desconhecida', () => {
  const parsed = aiSummaryResponseSchema.parse({ summary: 'x', lixo: 1 })
  ok(!Object.prototype.hasOwnProperty.call(parsed, 'lixo'))
})
```

Name cases `REQ-35: …` as listed in `24-RESEARCH.md`. Assert with `evaluationFichaSchema.parse` that anamnese on a sibling page survives a legacy bloco B, and that `capacidadeAtual` / `atividade` / `consigoPor` / `antesConseguiaPor` are absent on the parsed object.

---

### `src/schemas/evaluationFicha.schema.ts` (model, transform)

**Analog:** this file. Wrap `atividadesAfetadas` with `z.preprocess(normalizeAtividadesAfetadas, objectSchema)`.

**Imports / coercion already in the file** (lines 1–34):

```typescript
import { z } from 'zod'

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  return value
}

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, `Máximo de ${max} caracteres`)
      .optional(),
  )

const optionalBool = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return value
}, z.boolean().optional())

function optionalEnum<T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional())
}
```

Add `import { normalizeAtividadesAfetadas } from '../lib/atividadeCapacidade.ts'`. Keep `optionalBool` on the 16 flags. Unit is `optionalEnum(['minutos', 'km', 'repeticoes'])`. Valor stays `optionalText(200)` only after normalize has already clamped.

**Object to replace** (lines 252–276):

```typescript
atividadesAfetadas: z
  .object({
    caminhar: optionalBool,
    correr: optionalBool,
    escadas: optionalBool,
    agachar: optionalBool,
    sentar: optionalBool,
    levantar: optionalBool,
    dormir: optionalBool,
    dirigir: optionalBool,
    trabalhar: optionalBool,
    estudar: optionalBool,
    cuidarCasa: optionalBool,
    vestirSe: optionalBool,
    esporte: optionalBool,
    lazer: optionalBool,
    autocuidado: optionalBool,
    outra: optionalBool,
    outraDetalhe: optionalText(400),
    capacidadeAtual: optionalText(200),
    atividade: optionalText(200),
    consigoPor: optionalText(200),
    antesConseguiaPor: optionalText(200),
  })
  .default({}),
```

Drop the four legacy text keys from the object that runs after preprocess. Add `textoLegado: optionalText(1200)` and `capacidades` keyed by the same 16 names, each side `{ valor, unidade }`. `.default({})` stays so a missing bloco still parses. `emptyEvaluationFicha` (lines 447–449) keeps calling `evaluationFichaSchema.parse({})`.

`evaluationFormSchema` already nests this schema (`src/schemas/evaluation.schema.ts` lines 14–20). Do not edit that file unless the inferred `EvaluationFormData` path stops type-checking.

---

### `src/components/patients/evaluation/EvaluationPage03.tsx` (component, CRUD)

**Analog:** this file for the grade and the `watch` reveal. `EvaluationPage02.tsx` for the `setValue` prop. Change only bloco B. Leave blocks A and C–F as they are.

**Page props today — no `setValue`** (lines 12–19):

```typescript
type PageProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  readOnly?: boolean
}

export function EvaluationPage03({ register, watch, readOnly }: PageProps) {
  const disabled = readOnly
```

Copy the page 02 prop (`src/components/patients/evaluation/EvaluationPage02.tsx` lines 14–32):

```typescript
type PageProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  readOnly?: boolean
}

export function EvaluationPage02({ register, watch, setValue, readOnly }: PageProps) {
  const disabled = readOnly
  // ...
  onChange={(next) =>
    setValue('ficha.sintomas.mapa.marks', next, { shouldDirty: true, shouldValidate: true })
  }
```

**Bloco B to keep vs replace** (lines 32–59):

```tsx
<FichaBlock letter="B" title="Atividades afetadas">
  <CheckboxGrid>
    <BoolCheck label="Caminhar" name="ficha.funcao.atividadesAfetadas.caminhar" register={register} disabled={disabled} />
    {/* … 16 BoolCheck, same order … */}
    <BoolCheck label="Outra" name="ficha.funcao.atividadesAfetadas.outra" register={register} disabled={disabled} />
  </CheckboxGrid>
  {watch('ficha.funcao.atividadesAfetadas.outra') ? (
    <LineField label="Outra (detalhe)" name="ficha.funcao.atividadesAfetadas.outraDetalhe" register={register} disabled={disabled} />
  ) : null}
  <div className="grid gap-4 sm:grid-cols-2">
    <LineField label="Capacidade atual" name="ficha.funcao.atividadesAfetadas.capacidadeAtual" register={register} disabled={disabled} />
    <LineField label="Atividade" name="ficha.funcao.atividadesAfetadas.atividade" register={register} disabled={disabled} />
    <LineField label="Consigo por" name="ficha.funcao.atividadesAfetadas.consigoPor" register={register} disabled={disabled} />
    <LineField label="Antes conseguia por" name="ficha.funcao.atividadesAfetadas.antesConseguiaPor" register={register} disabled={disabled} />
  </div>
</FichaBlock>
```

Keep `CheckboxGrid` + `BoolCheck`. Keep the `watch(...) ? … : null` reveal (same pattern as `outra` here and as `praticaAtividadeFisica` at lines 85–87). Move `Outra (detalhe)` into the Outra row, still a `LineField`. Delete the four shared `LineField`s.

`BoolCheck` only spreads `register(name)` (`fichaFormPrimitives.tsx` lines 52–68). It has no `onChange` prop. Do not add one to the shared primitive. On uncheck, clear `capacidades.<chave>` with `setValue` from this page (watch the bool, or a local checkbox that still uses `register`). The editor sets `shouldUnregister: false`, so unmounting the row does not drop the value.

`disabled={readOnly}` stays on every new control. Map rows from the catalog in `atividadeCapacidade.ts`, not from a second hardcoded label list and not from click order.

**Do not copy** `LineField` / `Input` / `Select` from `@/components/ui` for valor+unidade. `LineField` is one full-width labeled box (`fichaFormPrimitives.tsx` lines 123–137). There is no existing combined input+select. Follow `24-UI-SPEC.md`: one `<fieldset disabled={disabled}>`, one `<legend>`, one bordered flex group, native `<input>` and native `<select>`, `register` on each.

---

### `src/components/patients/evaluation/EvaluationFichaForm.tsx` (component, CRUD)

**Analog:** this file. Página 02 already receives `setValue`. Página 03 does not.

**Props already include `setValue`** (lines 18–24 and 69–79):

```tsx
type EvaluationFichaFormProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  readOnly?: boolean
  initialPage?: FichaPageId
}

{page === '02' ? (
  <EvaluationPage02
    register={register}
    watch={watch}
    setValue={setValue}
    readOnly={readOnly}
  />
) : null}
{page === '03' ? (
  <EvaluationPage03 register={register} watch={watch} readOnly={readOnly} />
) : null}
```

Pass `setValue` into `EvaluationPage03` the same way as page 02. Do not pass `control`. Página 04 keeps `control` for its field arrays; bloco B must not.

---

### `src/components/patients/evaluation/EvaluationFichaDetail.tsx` (component, transform)

**Analog:** this file. Section 03 lists limitations and expectations only. Bloco B is absent.

**Imports and leaf** (lines 1–2, then `DetailLeaf` in `fichaFormPrimitives.tsx` lines 169–197):

```tsx
import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'
import { DetailLeaf } from '@/components/patients/evaluation/fichaFormPrimitives'
```

```tsx
export function DetailLeaf({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === false || value === '') return null
  if (typeof value === 'boolean') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 text-sm text-ink">Sim</p>
      </div>
    )
  }
  if (typeof value === 'string') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{value}</p>
      </div>
    )
  }
  return null
}
```

**Section to extend** (lines 112–121):

```tsx
<section className="space-y-3">
  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">03 · Função</p>
  <DetailLeaf label="Limitação 1" value={funcao?.limitacaoFuncional?.item1} />
  <DetailLeaf label="Limitação 2" value={funcao?.limitacaoFuncional?.item2} />
  <DetailLeaf label="Limitação 3" value={funcao?.limitacaoFuncional?.item3} />
  <DetailLeaf label="Boa melhora" value={funcao?.expectativas?.boaMelhora} />
  <DetailLeaf label="Triagem — observações" value={funcao?.triagemSeguranca?.observacoes} />
  <DetailLeaf label="Medicamentos" value={funcao?.medicacoes?.medicamentos} />
  <DetailLeaf label="Alergias" value={funcao?.medicacoes?.alergias} />
</section>
```

Insert one `DetailLeaf` per catalog activity that is checked or has a measure, after the three limitation leaves. `label` is the activity name. `value` is the miolo (`agora 10 minutos; antes 40 minutos`) from the shared formatter. Checked with no measure: pass `true` so the existing boolean branch renders **Sim**. One more leaf, label `Registro anterior`, when `textoLegado` is non-empty. Do not render Capacidade atual, Atividade, Consigo por, or Antes conseguia por. Do not reuse the local `checkedLabels` (lines 13–34) for this block — it joins names into one comma string and would hide per-activity measures.

---

### `src/lib/pdfFieldCatalog.ts` (utility, transform)

**Analog:** this file’s `03.B` block. Call `formatLinha` from `atividadeCapacidade.ts` via `@/lib/atividadeCapacidade` (this file is app code, not a `node:test` entry).

**Catalog helpers** (lines 23–84):

```typescript
const PREVIEW_MAX = 40

export function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function previewFrom(...candidates: Array<string | number | null | undefined>): string | undefined {
  for (const c of candidates) {
    if (c === null || c === undefined) continue
    const s = String(c).trim()
    if (!s) continue
    return s.length <= PREVIEW_MAX ? s : `${s.slice(0, PREVIEW_MAX - 1)}…`
  }
  return undefined
}

function pushBlock(
  items: PdfFieldItem[],
  opts: {
    id: PdfFieldId
    label: string
    groupLabel: string
    filled: boolean
    sensitive?: boolean
    preview?: string
  },
): void {
  if (!opts.filled) return
  items.push({ /* id, label, groupLabel, optional sensitive, optional preview */ })
}
```

**Block to replace** (lines 368–405):

```typescript
const atividadeItems = checkedLabels(
  funcao?.atividadesAfetadas as Record<string, unknown> | undefined,
  { caminhar: 'Caminhar', correr: 'Correr', /* … */ outra: 'Outra' },
)
const hasAtividades =
  atividadeItems.length > 0 ||
  textFilled(funcao?.atividadesAfetadas?.capacidadeAtual) ||
  textFilled(funcao?.atividadesAfetadas?.atividade) ||
  textFilled(funcao?.atividadesAfetadas?.consigoPor) ||
  textFilled(funcao?.atividadesAfetadas?.antesConseguiaPor)
pushBlock(items, {
  id: '03.B',
  label: 'Atividades afetadas',
  groupLabel: '03 · Função · Bloco B',
  filled: hasAtividades,
  preview: previewFrom(
    atividadeItems[0],
    funcao?.atividadesAfetadas?.capacidadeAtual,
    funcao?.atividadesAfetadas?.atividade,
  ),
})
```

Keep `pushBlock` id `03.B`, the same label and groupLabel. `filled` is true when any catalog bool is true, any measure exists, `outraDetalhe` is filled, or `textoLegado` is filled. `preview` is `previewFrom` of the first non-empty `formatLinha`, else the `Registro anterior` line. The four legacy fields will not exist on `EvaluationFicha` after the schema change; leaving them here will not type-check.

`checkedLabels` in this file also appends `outraDetalhe` onto the name list (lines 43–51). Do not keep using it as the `03.B` preview, or the detail string is glued onto the activity name.

---

### `src/services/patientAiPdf.service.ts` (service, file-I/O)

**Analog:** this file. Only the `03.B` body changes. The service is large; do not restyle `drawFichaBlockFrame`.

**Imports** (lines 1–14) already pull ficha types and `@/lib/focusRegions`. Add `formatLinha` from `@/lib/atividadeCapacidade` the same way.

**Draw primitives to reuse** (lines 867–896 and 1031–1036):

```typescript
function drawOptionalField(
  ctx: DrawContext,
  label: string,
  value: string | number | null | undefined,
): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && !value.trim()) return false
  const text = String(value)
  if (text.length > 90 || text.includes('\n')) {
    drawNoteBox(ctx, label, text)
  } else {
    drawLabeledValue(ctx, label, text)
  }
  return true
}

function drawFichaBlockFrame(
  ctx: DrawContext,
  letter: string,
  title: string,
  bodyDraw: () => void,
  opts?: { danger?: boolean },
): void {
```

`drawLabeledValue` (lines 519–527) prints `${label}:` in bold, then the value. Pass the activity name as `label` and the miolo (`agora 10 minutos; antes 40 minutos`) as `value`, so the PDF line matches `formatLinha` without drawing the label twice. A marked activity with an empty miolo still needs a line (the name alone). `drawOptionalField` returns false on an empty value, so that case cannot go through `drawOptionalField` with an empty value — draw the name with the same `drawText` / `toWinAnsiSafe` path the other lines use. `Registro anterior` is `drawOptionalField(ctx, 'Registro anterior', textoLegado)`.

**Body to replace** (lines 1904–1930 and 2019–2026):

```typescript
const atividadeItems = checkedLabels(
  funcao?.atividadesAfetadas as Record<string, unknown> | undefined,
  { caminhar: 'Caminhar', correr: 'Correr', /* … */ outra: 'Outra' },
)
const hasAtividades =
  atividadeItems.length > 0 ||
  textFilled(funcao?.atividadesAfetadas?.capacidadeAtual) ||
  textFilled(funcao?.atividadesAfetadas?.atividade) ||
  textFilled(funcao?.atividadesAfetadas?.consigoPor) ||
  textFilled(funcao?.atividadesAfetadas?.antesConseguiaPor)

if (show03B) {
  drawFichaBlockFrame(ctx, 'B', 'Atividades afetadas', () => {
    drawOptionalBullets(ctx, 'Atividades', atividadeItems)
    drawOptionalField(ctx, 'Capacidade atual', funcao?.atividadesAfetadas?.capacidadeAtual)
    drawOptionalField(ctx, 'Atividade', funcao?.atividadesAfetadas?.atividade)
    drawOptionalField(ctx, 'Consigo por', funcao?.atividadesAfetadas?.consigoPor)
    drawOptionalField(ctx, 'Antes conseguia por', funcao?.atividadesAfetadas?.antesConseguiaPor)
  })
}
```

Keep `drawFichaBlockFrame(ctx, 'B', 'Atividades afetadas', …)` and `show03B = hasAtividades && isFieldSelected(selected, '03.B')` (line 2002). Recompute `hasAtividades` from bools, measures, `outraDetalhe`, and `textoLegado` — the same condition as the catalog. Delete the four `drawOptionalField` calls and the `drawOptionalBullets(ctx, 'Atividades', …)` for this block. `drawOptionalBullets` stays for blocks C–F. The local `checkedLabels` (lines 845–864) is duplicated with the catalog; do not add a third copy. Both call the helper.

---

## Shared Patterns

### Persistence hook (do not edit)

**Source:** `src/services/evaluations.service.ts`
**Apply to:** schema preprocess only. Read and save already `safeParse` the whole ficha.

```typescript
function resolveEvaluationFicha(row: EvaluationRow): EvaluationFicha {
  const raw = row.ficha
  const isPlainObject = raw !== null && typeof raw === 'object' && !Array.isArray(raw)
  const rawKeys = isPlainObject ? Object.keys(raw as object) : []
  const parsed = evaluationFichaSchema.safeParse(raw ?? {})

  if (parsed.success && (rawKeys.length > 0 || hasMeaningfulLeaf(raw))) {
    return parsed.data
  }
  if (hasLegacyText(row)) return legacyToFicha(row)
  return emptyEvaluationFicha()
}

function toRow(input: UpsertPatientEvaluationInput) {
  const parsed = evaluationFichaSchema.safeParse(input.ficha ?? {})
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path?.length ? issue.path.join('.') : 'ficha'
    throw new Error(issue?.message ? `${path}: ${issue.message}` : 'Ficha de avaliação inválida.')
  }
  const ficha = parsed.data
```

A preprocess that throws, or a `valor` / `unidade` that fails `.max` or the enum, drops the entire ficha (anamnese included) on read, and blocks save. Normalize must return only keys the new object accepts.

### Form registration

**Source:** `src/components/patients/PatientEvaluationEditorForm.tsx` lines 128–132
**Apply to:** page 03 uncheck clearing

```typescript
const form = useForm<EvaluationFormData>({
  resolver: zodResolver(evaluationFormSchema) as Resolver<EvaluationFormData>,
  defaultValues: emptyEvaluationForm(),
  shouldUnregister: false,
})
```

Unmounting a measure row leaves `capacidades.<chave>` in the payload. Clear it with `setValue(..., { shouldDirty: true, shouldValidate: true })` and drop it again in preprocess when the bool is not `true`.

### Write gate

**Source:** `src/components/patients/PatientEvaluationPanel.tsx` lines 173–187
**Apply to:** no new write control outside the editor

```tsx
{!isLoading && !isError && canWrite && editorOpen ? (
  <div className="rounded-2xl border border-line bg-surface p-5">
    <PatientEvaluationEditorForm
      submitLabel="Salvar"
```

The editor is not mounted without `canWrite`. Inside the page, `const disabled = readOnly` and `disabled={disabled}` on checkbox, fieldset, input, select, and the Outra `LineField`. Detail has no inputs. Do not add a save button in bloco B. Submit copy stays the editor’s `Salvar`.

### Clinical completeness (do not edit)

**Source:** `src/lib/evaluationFichaContent.ts` lines 4–18
**Apply to:** nothing in this phase

```typescript
export function fichaHasClinicalContent(ficha: EvaluationFicha | null | undefined): boolean {
  if (!ficha) return false
  return hasFilledLeaf(ficha)
}
```

`hasFilledLeaf` already treats `true` and a non-empty string as content. A new `capacidades` map counts without a code change.

### Validation

**Source:** `src/schemas/evaluationFicha.schema.ts` lines 9–34
**Apply to:** the post-preprocess object only

`optionalText` trims and enforces max. `optionalEnum` turns `''` into `undefined` (the select’s “Unidade” option). `optionalBool` already accepts `true`, `'true'`, `'on'`, `1`. Empty measure (no valor, no unidade) stays valid.

### Error handling

Save errors are the thrown `Error` from `toRow` (first Zod issue, path prefixed). The editor already surfaces save failure. Do not add a toast or an inline error for a blank measure. UI-SPEC empty copy, when nothing is checked, is one `<p className="text-sm font-normal leading-normal text-muted">`: `Nenhuma atividade marcada. Marque uma atividade na grade. A capacidade atual e o quanto conseguia antes aparecem na linha dessa atividade.`

## No Analog Found

No new file lacks an analog. One control inside page 03 does:

| Gap | Role | Data Flow | Reason |
|-----|------|-----------|--------|
| Grupo valor + unidade (inline no bloco B, não é arquivo novo) | component | CRUD | `LineField` e o `Select` de `@/components/ui` são um rótulo + caixa `w-full` cada. Não existe fieldset com input e `<select>` nativos na mesma borda. Copiar o esboço do `24-UI-SPEC.md` (`fieldset`, `min-h-11`, `rounded-2xl border border-line bg-canvas`). Não criar componente em `src/components/ui`. |

`EvaluationPage04` field arrays are the wrong analog (second activity selector, click order, duplicate keys). Do not copy them.

## Metadata

**Analog search scope:** `src/lib`, `src/schemas`, `src/components/patients/evaluation`, `src/components/patients/PatientEvaluationEditorForm.tsx`, `src/components/patients/PatientEvaluationPanel.tsx`, `src/services/evaluations.service.ts`, `src/services/patientAiPdf.service.ts` (bloco 03 e helpers de draw)
**Files scanned:** 17 lib modules, 8 evaluation components, ficha schema, evaluation form schema, evaluations service, PDF service (targeted sections)
**Pattern extraction date:** 2026-10-04
