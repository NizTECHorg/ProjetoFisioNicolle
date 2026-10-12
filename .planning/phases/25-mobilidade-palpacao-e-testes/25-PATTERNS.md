# Phase 25: Mobilidade, palpação e testes - Pattern Map

**Mapped:** 2026-10-05
**Files analyzed:** 11
**Analogs found:** 11 / 11

Closest prior phase: `src/lib/atividadeCapacidade.ts` plus `EvaluationPage03.tsx` (checkbox reveals the measure row, `z.preprocess`, one formatter for detail / catalog / PDF, no new package, no SQL). Page 04 stays `EvaluationPage04.tsx`. `ForcaTable` and blocks A, C, D, F, G, H stay. Do not edit `patient-ai-summary`.

New controls do not use `Input`, `Select`, or `EvaField` from `src/components/ui`. Those paint `font-medium` and `focus:ring-accent`. Copy the native `<input>` / `<select>` classes from `MedidaGrupo` in `EvaluationPage03.tsx`, and copy only the `setValueAs` empty-to-`undefined` logic from `EvaField`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/mobilidadePalpacao.ts` | utility | transform | `src/lib/atividadeCapacidade.ts` | exact |
| `src/lib/mobilidadePalpacao.test.ts` | test | transform | `src/lib/atividadeCapacidade.test.ts` | exact |
| `src/schemas/evaluationFicha.schema.ts` | model | transform | same file, `atividadesAfetadas` preprocess | exact |
| `src/components/patients/evaluation/EvaluationPage04.tsx` | component | CRUD | `EvaluationPage03.tsx` (reveal) + own `MobilityTable` (`useFieldArray`) | role-match |
| `src/components/patients/evaluation/EvaluationFichaForm.tsx` | component | request-response | same file, page 03 `setValue` wiring | role-match |
| `src/components/patients/evaluation/EvaluationFichaDetail.tsx` | component | transform | same file, bloco 03 atividades + `DetailLeaf` | exact |
| `src/lib/pdfFieldCatalog.ts` | utility | transform | same file, bloco `03.B` via `formatLinha` | exact |
| `src/services/patientAiPdf.service.ts` | service | file-I/O | same file, draw `03.B` | exact |
| `src/components/patients/PatientEvaluationEditorForm.tsx` | component | request-response | same file, `tests` mirror | exact |
| `src/components/patients/PatientEvaluationPanel.tsx` | component | transform | same file, `draftFromPdf` | exact |
| `src/services/evaluations.service.ts` | service | CRUD | same file, `legacyToFicha` + `emptyToNull` | exact |

## Pattern Assignments

### `src/lib/mobilidadePalpacao.ts` (utility, transform)

**Analog:** `src/lib/atividadeCapacidade.ts`

**Imports pattern:** none. The helper is pure. Schema and tests import it by relative path with `.ts`. UI, catalog, and PDF import with `@/lib/mobilidadePalpacao`.

**Catalog + formatters** (lines 6–75): closed list `{ key, label }`, then pure formatters that return a string. Empty measure returns only the label. Do not invent a unit or a degree sign on chips `Completo` / `Limitado` / `Não avaliado`.

```6:23:src/lib/atividadeCapacidade.ts
export const ATIVIDADES = [
  { key: 'caminhar', label: 'Caminhar' },
  // ...
  { key: 'outra', label: 'Outra' },
] as const

export type AtividadeKey = (typeof ATIVIDADES)[number]['key']
```

```70:75:src/lib/atividadeCapacidade.ts
export function formatLinha(rotulo: string, atual?: LadoMedida, antes?: LadoMedida): string {
  const miolo = formatMiolo(atual, antes)
  if (!miolo) return rotulo
  return `${rotulo}: ${miolo}`
}
```

Phase 25 equivalents in the same module: `formatMovimentoCompacto`, `formatDor`, `formatFraseAdm`, `formatAchado`, `formatTeste`, `formatTestesParaColuna`, plus a bloco string for detail / `04.B` / `04.E`. Callers must not assemble the sentence themselves.

**Normalize core** (lines 97–118, 155–158, 243–259): never throw. Non-object input returns the empty new shape. `fold` is NFD + strip marks + lower case. Match is exact folded label, not `includes`. Clamp before return. Second call is idempotent because the new shape is recognized and sanitized, not migrated again.

```97:118:src/lib/atividadeCapacidade.ts
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function trimString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function clampTrimmed(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined
  return value.slice(0, max)
}
```

```155:158:src/lib/atividadeCapacidade.ts
function matchAtividade(atividade: string): AtividadeKey | undefined {
  const folded = fold(atividade)
  return ATIVIDADES.find((item) => fold(item.label) === folded)?.key
}
```

```247:259:src/lib/atividadeCapacidade.ts
export function normalizeAtividadesAfetadas(value: unknown): AtividadesAfetadasNormalizadas {
  if (!isJsonObject(value)) return { capacidades: {} }

  const flags = copyFlags(value)
  const outraDetalhe = clampTrimmed(trimString(value.outraDetalhe), OUTRA_MAX)

  if (isJsonObject(value.capacidades)) {
    const textoLegado = clampTrimmed(trimString(value.textoLegado), LEGADO_MAX)
    return buildResult(flags, sanitizeCapacidades(value.capacidades, flags), outraDetalhe, textoLegado)
  }

  return migrateLegacy(value, flags, outraDetalhe)
}
```

Copy that split: if the value is already the new object (`regioes` / `achados` / `testes`), sanitize and return. If it is the old `linhas` + booleans, or a string (`palpacao` / `testesClinicos`), migrate. Ambiguous `Flexão` goes to `registroAnterior`. Do not copy one value onto every region. Old `dor` text joins `observacao`; it does not fill `dorDireito` or `dorEsquerdo`. A string of palpação goes entirely to `palpacaoRegistroAnterior`.

Search filter in the UI uses the same `fold`, then `includes` on the folded query. Do not build `new RegExp(query)`. Export `fold` only if the page needs it; otherwise keep a local copy next to the list filter. `Outro` is concatenated after the filter, still last in each visible region.

Apostrophe: catalog label `O’Brien` stays U+2019. `fold` may straighten the curly apostrophe for comparison only.

**Error handling:** no throw. Invalid keys drop out of the array. Unmatched legacy text is appended to the registro string (cap 4000 in RESEARCH; phase 24 cap is `LEGADO_MAX = 1200` at lines 77–79 — use the phase 25 caps, not 1200).

---

### `src/lib/mobilidadePalpacao.test.ts` (test, transform)

**Analog:** `src/lib/atividadeCapacidade.test.ts`

**Imports** (lines 1–12): `node:test`, `node:assert/strict`, relative `.ts` imports of the helper and `evaluationFichaSchema`. No Vitest. No `@/` alias.

```1:12:src/lib/atividadeCapacidade.test.ts
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { emptyEvaluationFicha, evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'
import {
  ATIVIDADES,
  formatLinha,
  formatMedida,
  formatMiolo,
  normalizeAtividadesAfetadas,
} from './atividadeCapacidade.ts'
```

**Schema survival** (lines 292–306, 387–389): `evaluationFichaSchema.parse` of a legacy block keeps anamnese and força. `parse({})` stays equal to `emptyEvaluationFicha()`. A string in `testesClinicos` must not fail the parse.

```292:306:src/lib/atividadeCapacidade.test.ts
test('REQ-35: anamnese sobrevive ao parse de um bloco B legado', () => {
  const parsed = evaluationFichaSchema.parse({
    anamnese: { queixa: { oQueTrouxe: 'dor no joelho ao correr' } },
    funcao: {
      atividadesAfetadas: {
        caminhar: true,
        capacidadeAtual: '10',
      },
    },
  })
  equal(parsed.anamnese?.queixa?.oQueTrouxe, 'dor no joelho ao correr')
  // ...
})
```

**Reader lock** (lines 391–415): `readFileSync` the catalog and the PDF service and assert the bloco slice calls the formatter and does not read the old keys. Copy that for `04.B` / `04.E`: slice must include the new formatter and must not include `mobilidade?.linhas`, `palpacaoTestes?.palpacao`, or `palpacaoTestes?.testesClinicos`. Assert the draw slice replaces `→` with `->` and does not edit `toWinAnsiSafe`.

Test names from RESEARCH stay stable for `--test-name-pattern`, prefix `REQ-36:`. Catalog counts 13/71, 20/192, 12/120, no Fraturas, `O’Brien` code point U+2019.

Run: `node --test src/lib/mobilidadePalpacao.test.ts`.

---

### `src/schemas/evaluationFicha.schema.ts` (model, transform)

**Analog:** the `atividadesAfetadas` preprocess in this file.

**Imports** (lines 1–2): relative `.ts`, not `@/`.

```1:2:src/schemas/evaluationFicha.schema.ts
import { z } from 'zod'
import { normalizeAtividadesAfetadas } from '../lib/atividadeCapacidade.ts'
```

**Text and score helpers to reuse** (lines 4–35): `optionalText(max)` already trims and treats `''` / `null` as absent. `evaScore` is 0–10. `optionalEnum` for tipo, comparação, lado, achado. Movement D/E values stay `optionalText(80)`, never `z.number()`.

```10:35:src/schemas/evaluationFicha.schema.ts
const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, `Máximo de ${max} caracteres`)
      .optional(),
  )

const evaScore = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : value
}, z.number().min(0).max(10).optional())

function optionalEnum<T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional())
}
```

**Preprocess before the object schema** (lines 263–266). The preprocess return value is what Zod strips. Old keys that are not in the new object disappear. That is why normalize must consume `linhas`, `ativo`, `passivo`, `bilateral`, `palpacao`, and `testesClinicos`.

```263:266:src/schemas/evaluationFicha.schema.ts
      atividadesAfetadas: z
        .preprocess(
          normalizeAtividadesAfetadas,
          z.object({
```

Replace the current mobilidade object (lines 395–402) and palpacaoTestes object (lines 420–428) with the same `.preprocess(normalizeX, schema).default({})` shape. Keep `forca`, `resultados`, `testeFuncional`, and `resultadoInicial` as they are. `mobilityRowSchema` (lines 54–60) can stay only if nothing else references it; the new movimento object uses `optionalText` and a nested dor object, not `dor: optionalText`.

```395:428:src/schemas/evaluationFicha.schema.ts
      mobilidade: z
        .object({
          linhas: z.array(mobilityRowSchema).default([]),
          ativo: optionalBool,
          passivo: optionalBool,
          bilateral: optionalBool,
        })
        .default({}),
      // ...
      palpacaoTestes: z
        .object({
          palpacao: optionalText(2000),
          testesClinicos: optionalText(2000),
          resultados: optionalText(2000),
          testeFuncional: optionalText(2000),
          resultadoInicial: optionalText(2000),
        })
        .default({}),
```

**Error handling:** preprocess does not throw. `toRow` already throws `Ficha de avaliação inválida` when `safeParse` fails (`evaluations.service.ts` lines 208–214). A string that the preprocess does not accept will take down the whole ficha.

---

### `src/components/patients/evaluation/EvaluationPage04.tsx` (component, CRUD)

**Analogs:** `EvaluationPage03.tsx` for checkbox-reveals-row and `setValue` on uncheck. The existing `MobilityTable` / `ForcaTable` in this file for `useFieldArray` append/remove. `RadioRow` and `BoolCheck` in `fichaFormPrimitives.tsx`. `ConfirmDialog` in `PatientEvaluationPanel.tsx`.

Do not restyle `FichaBlock`. Do not change `ForcaTable` or blocks A, C, D, F, G, H. Remove `MobilityTable` from bloco B and the three global `BoolCheck`s. Remove the two `TextField`s Palpação relevante and Testes clínicos selecionados. Leave the three remaining `TextField`s.

**Page 03 props and uncheck** (lines 14–18, 83–102, 127–166): only the marked item renders the measure row. Unchecking calls `setValue(..., undefined, { shouldDirty: true, shouldValidate: true })` because the editor uses `shouldUnregister: false`. Phase 25 movements live in an array, so uncheck is `remove` / `setValue` of that array item, not a boolean flag. The measure row is absent from the DOM when unchecked.

```83:102:src/components/patients/evaluation/EvaluationPage03.tsx
export function EvaluationPage03({ register, watch, setValue, readOnly }: PageProps) {
  const disabled = readOnly
  const markedKey = ATIVIDADES.map((item) =>
    watch(boolPath(item.key)) === true ? '1' : '0',
  ).join('')
  // ...
  useEffect(() => {
    const previous = previousMarked.current
    if (previous) {
      for (const [index, item] of ATIVIDADES.entries()) {
        if (previous[index] === '1' && markedKey[index] !== '1') {
          setValue(capacidadePath(item.key), undefined, { shouldDirty: true, shouldValidate: true })
        }
      }
    }
    previousMarked.current = markedKey
  }, [markedKey, setValue])
```

```144:166:src/components/patients/evaluation/EvaluationPage03.tsx
              <div className="grid gap-4 sm:grid-cols-2">
                <MedidaGrupo
                  legend="Capacidade atual"
                  // ...
                />
              </div>
            </div>
          ) : null,
        )}
        {legado ? (
          <p className="text-sm font-normal leading-normal text-ink">Registro anterior: {legado}</p>
        ) : null}
```

**Native input classes to copy** (lines 56–77). New inputs use `min-h-11`, `rounded-2xl`, `border-line`, `bg-surface` or `bg-canvas`, `px-4 py-2`, `text-base font-normal`, no placeholder, no `type="number"` on D/E or on início da dor.

```56:66:src/components/patients/evaluation/EvaluationPage03.tsx
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-semibold leading-[1.2] text-ink">{legend}</legend>
      <div className="flex min-h-11 overflow-hidden rounded-2xl border border-line bg-canvas">
        <input
          type="text"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-base font-normal leading-normal text-ink"
          aria-label={valorLabel}
          {...register(valorName)}
          disabled={disabled}
        />
```

**Checkbox visual** (`fichaFormPrimitives.tsx` lines 52–68). Catalog movement checkboxes and test checkboxes copy this label. They are not `register` on a boolean path; they toggle membership in the field array. Keep `accent-forest`, `min-h-11`, `gap-2`, `text-sm text-ink`.

```52:68:src/components/patients/evaluation/fichaFormPrimitives.tsx
export function BoolCheck<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
}: BoolPathProps<T>) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        className="accent-forest"
        disabled={disabled}
        {...register(name)}
      />
      <span>{label}</span>
    </label>
  )
}
```

**RadioRow** (lines 73–104): use as-is for Tipo de avaliação, Comparação, and Lado. Do not restyle the legend (`text-xs text-muted`).

**Field array** (`EvaluationPage04.tsx` lines 21–33, 67–90): `useFieldArray` + `append` / `remove`. Hide add/remove when `disabled` (`readOnly`). Bloco B regions and bloco E achados follow this. `ForcaTable` (lines 96–168) stays untouched, including its `space-y-3` layout.

```30:33:src/components/patients/evaluation/EvaluationPage04.tsx
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ficha.avaliacaoPlano.mobilidade.linhas',
  })
```

```81:90:src/components/patients/evaluation/EvaluationPage04.tsx
      {!disabled ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({ movimento: '', direito: '', esquerdo: '', dor: '', observacao: '' })
          }
        >
          Adicionar linha
        </Button>
      ) : null}
```

New region button label is **Adicionar outra região**, `Button` `variant="secondary"`. Achado primary action uses the existing `Button` (default variant) **Adicionar achado** / **Salvar achado**.

**Dor 0–10 empty value** (`fichaFormPrimitives.tsx` lines 139–165): do not render `EvaField` / `Input`. Copy `setValueAs` onto a native `type="number"` `min={0}` `max={10}` `step={1}`.

```158:164:src/components/patients/evaluation/fichaFormPrimitives.tsx
      {...register(name, {
        setValueAs: (value) => {
          if (value === '' || value === null || value === undefined) return undefined
          const n = Number(value)
          return Number.isFinite(n) ? n : undefined
        },
      })}
```

Pain panel is a local `useState`, not a form field. Inline `<fieldset className="mt-2 space-y-2 rounded-2xl border border-line bg-surface p-4">` inside the clicked side. Opening D does not write E. In `readOnly`, render the fieldset only when that side already has início, máxima, or observação, with inputs `disabled`.

**ConfirmDialog** (`src/components/ui/ConfirmDialog.tsx` lines 3–16, usage in `PatientEvaluationPanel.tsx` lines 318–325): `tone="danger"`, `open` boolean, `onConfirm` / `onClose`. Copy for Remover região and Remover achado. Unchecking a movement or a test does not open a dialog.

```318:325:src/components/patients/PatientEvaluationPanel.tsx
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Excluir avaliação?"
          description="Esta avaliação será removida da ficha. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          tone="danger"
          isLoading={deleteEvaluation.isPending}
          onClose={() => setPendingDelete(null)}
```

**Search list:** no combobox in `src/`. Use `<input type="search">` plus `<ul>` of `<label><input type="checkbox">` (testes) or one-choice buttons (local/estrutura). Group tests with `<fieldset><legend>`. Filter with `fold`. `Outro` stays last. Changing palpação region clears `local` when it is not in the new list.

**Registro anterior** is a `<p>`, not a field. `whitespace-pre-wrap` for the text. Hide add/remove/edit buttons when `readOnly`.

**Page props today** (lines 14–19, 171): `register`, `watch`, `control`, `readOnly`. Add `setValue` the way page 03 does. `EvaluationFichaForm` must pass it (next file).

---

### `src/components/patients/evaluation/EvaluationFichaForm.tsx` (component, request-response)

**Analog:** the page 03 call in this file (lines 77–91).

Page 04 currently receives `control` and not `setValue`. Pass `setValue` so bloco B/E can clear a movement on uncheck. Do not change pages 01–03.

```77:91:src/components/patients/evaluation/EvaluationFichaForm.tsx
      {page === '03' ? (
        <EvaluationPage03
          register={register}
          watch={watch}
          setValue={setValue}
          readOnly={readOnly}
        />
      ) : null}
      {page === '04' ? (
        <EvaluationPage04
          register={register}
          watch={watch}
          control={control}
          readOnly={readOnly}
        />
      ) : null}
```

---

### `src/components/patients/evaluation/EvaluationFichaDetail.tsx` (component, transform)

**Analog:** bloco 03 atividades in this file (lines 1–4, 119–129) and `DetailLeaf` (returns `null` for objects and arrays).

```119:129:src/components/patients/evaluation/EvaluationFichaDetail.tsx
        {ATIVIDADES.map((item) => {
          const marcada = atividades?.[item.key] === true
          const capacidade = atividades?.capacidades?.[item.key]
          const miolo = formatMiolo(capacidade?.atual, capacidade?.antes)
          if (!marcada && !miolo) return null
          return <DetailLeaf key={item.key} label={item.label} value={miolo || true} />
        })}
        <DetailLeaf
          label="Registro anterior"
          value={atividades?.textoLegado?.trim() ? atividades.textoLegado : undefined}
        />
```

Section 04 today (lines 136–141) prints `palpacao` and `testesClinicos` strings and does not list mobilidade. Replace those two leaves with formatter strings: one leaf per região, one **Registro anterior** for mobilidade, one leaf **Achado** per achado, one **Registro anterior** for palpação, one **Testes clínicos** (one test per line), one **Registro anterior** for testes. Pass strings. Do not pass `regioes`, `achados`, or `testes` arrays.

```136:141:src/components/patients/evaluation/EvaluationFichaDetail.tsx
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">04 · Avaliação e plano</p>
        <DetailLeaf label="Inspeção — achados" value={plano?.inspecao?.achados} />
        <DetailLeaf label="Neurológico — achados" value={plano?.neurologico?.achados} />
        <DetailLeaf label="Palpação" value={plano?.palpacaoTestes?.palpacao} />
        <DetailLeaf label="Testes clínicos" value={plano?.palpacaoTestes?.testesClinicos} />
```

```169:197:src/components/patients/evaluation/fichaFormPrimitives.tsx
export function DetailLeaf({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === false || value === '') return null
  // ...
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

Do not change `DetailLeaf`. Browser text keeps `→`.

---

### `src/lib/pdfFieldCatalog.ts` (utility, transform)

**Analog:** bloco `03.B` in this file (lines 1–2, 56–63, 369–389). Change only `04.B` and `04.E` (lines 514–534 and 569–585). Leave `04.A`, `04.C`, `04.D`, and the rest.

```1:2:src/lib/pdfFieldCatalog.ts
import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'
import { ATIVIDADES, formatLinha } from '@/lib/atividadeCapacidade'
```

```56:63:src/lib/pdfFieldCatalog.ts
function previewFrom(...candidates: Array<string | number | null | undefined>): string | undefined {
  for (const c of candidates) {
    if (c === null || c === undefined) continue
    const s = String(c).trim()
    if (!s) continue
    return s.length <= PREVIEW_MAX ? s : `${s.slice(0, PREVIEW_MAX - 1)}…`
  }
  return undefined
}
```

`PREVIEW_MAX` is 40 (line 24). Pass the first formatted line, not the object. `String(object)` would preview `[object Object]`.

```369:389:src/lib/pdfFieldCatalog.ts
  const atividades = funcao?.atividadesAfetadas
  const linhasAtividade = ATIVIDADES.flatMap((item) => {
    const marcada = atividades?.[item.key] === true
    const capacidade = atividades?.capacidades?.[item.key]
    const linha = formatLinha(item.label, capacidade?.atual, capacidade?.antes)
    if (!marcada && linha === item.label) return []
    return [linha]
  })
  const textoLegado = atividades?.textoLegado
  const registroAnterior = textFilled(textoLegado) ? `Registro anterior: ${textoLegado.trim()}` : undefined
  const hasAtividades =
    linhasAtividade.length > 0 ||
    textFilled(atividades?.outraDetalhe) ||
    textFilled(textoLegado)
  pushBlock(items, {
    id: '03.B',
    // ...
    preview: previewFrom(linhasAtividade[0], registroAnterior),
  })
```

Current `04.B` / `04.E` still read `linhas`, `ativo`/`passivo`/`bilateral`, `palpacao`, and `testesClinicos` (lines 514–534, 569–585). `hasMob` / `hasPalp` become true when there is a região, an achado, a marked test, or a registro anterior. `filled: false` omits the block (`pushBlock` lines 66–77).

---

### `src/services/patientAiPdf.service.ts` (service, file-I/O)

**Analog:** draw of `03.B` (lines 12, 2002–2025). Replace only the `04.B` table and the `04.E` palpação/testes lines. Do not change `toWinAnsiSafe`. Do not change the força table (`04.C`, lines 2214–2233).

```12:12:src/services/patientAiPdf.service.ts
import { ATIVIDADES, formatLinha, formatMiolo } from '@/lib/atividadeCapacidade'
```

```192:199:src/services/patientAiPdf.service.ts
function toWinAnsiSafe(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, '?')
}
```

U+2192 `→` is outside WinAnsi and becomes `?`. `°` (U+00B0) survives. On the string passed into the `04.B` / `04.E` draw only, replace `→` with `->`. Leave `toWinAnsiSafe` global.

```867:881:src/services/patientAiPdf.service.ts
function drawOptionalField(
  ctx: DrawContext,
  label: string,
  value: string | number | null | undefined,
): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && !value.trim()) return false
  const text = String(value)
  // ...
}
```

`String(object)` draws `[object Object]`. Pass the formatter string. `hasMob` today is `mobFlags` + `linhas` (lines 2084–2097). `show04B` draws a five-column `drawDataTable` (lines 2192–2212). Replace that body with one formatted line per região / movimento, same phrases as the detail. `04.E` (lines 2241–2248) must stop drawing `palpacao` and `testesClinicos` and draw achados, testes, and registros. Keep drawing `resultados`, `testeFuncional`, and `resultadoInicial`.

```2002:2025:src/services/patientAiPdf.service.ts
    if (show03B) {
      drawFichaBlockFrame(ctx, 'B', 'Atividades afetadas', () => {
        for (const item of ATIVIDADES) {
          const marcada = atividadesBloco?.[item.key] === true
          const capacidade = atividadesBloco?.capacidades?.[item.key]
          const miolo = formatMiolo(capacidade?.atual, capacidade?.antes)
          const linha = formatLinha(item.label, capacidade?.atual, capacidade?.antes)
          if (!marcada && !miolo) continue
          // ...
        }
        drawOptionalField(ctx, 'Registro anterior', atividadesBloco?.textoLegado)
      })
    }
```

---

### `src/components/patients/PatientEvaluationEditorForm.tsx` (component, request-response)

**Analog:** `onSubmit` tests mirror (lines 128–132, 177–190).

```128:132:src/components/patients/PatientEvaluationEditorForm.tsx
  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema) as Resolver<EvaluationFormData>,
    defaultValues: emptyEvaluationForm(),
    shouldUnregister: false,
  })
```

`shouldUnregister: false` is why an unmounted movement input would still submit. The page must `remove` / `setValue` on uncheck. Do not flip this flag.

```177:190:src/components/patients/PatientEvaluationEditorForm.tsx
  function onSubmit(values: EvaluationFormData) {
    const therapist = therapists.find((item) => item.id === values.therapistId)
    const ficha = values.ficha ?? emptyEvaluationFicha()
    const input = {
      // ...
      tests: ficha.avaliacaoPlano?.palpacaoTestes?.testesClinicos ?? values.tests ?? '',
```

`testesClinicos` will not exist on the new type. Set `tests` from `formatTestesParaColuna(ficha.avaliacaoPlano?.palpacaoTestes)`, which returns a string (marked tests plus registro anterior). Do not pass the object. Do not fall back to `values.tests` when the new block is intentionally empty: the ficha is the source. `emptyToNull` in the service calls `.trim()` and only accepts a string.

---

### `src/components/patients/PatientEvaluationPanel.tsx` (component, transform)

**Analog:** `draftFromPdf` (lines 17–51).

```48:51:src/components/patients/PatientEvaluationPanel.tsx
        palpacaoTestes: {
          ...base.ficha.avaliacaoPlano.palpacaoTestes,
          testesClinicos: result.muscleForceAndTests,
        },
```

Write the PDF paragraph into `testesRegistroAnterior`. Leave `testes` as `[]`. Do not assign a string to the new object field. The top-level `tests: result.muscleForceAndTests` (line 25) can stay as the legacy column draft; the ficha field must be the registro string. The detail page maps over `testes` and must not receive a string.

`canWrite` already gates the editor (lines 153–173) and the delete dialog. Do not add a new auth path.

---

### `src/services/evaluations.service.ts` (service, CRUD)

**Analog:** `legacyToFicha` and `emptyToNull` in this file.

```38:41:src/services/evaluations.service.ts
function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}
```

```128:132:src/services/evaluations.service.ts
      palpacaoTestes: {
        ...base.avaliacaoPlano.palpacaoTestes,
        testesClinicos: emptyToNull(row.tests ?? undefined) ?? undefined,
        resultados: emptyToNull(row.measurements ?? undefined) ?? undefined,
      },
```

Point `tests` at `testesRegistroAnterior` (paragraph, empty `testes` list). Keep `resultados` from `measurements`. Update the comment on lines 76–83. `toRow` (lines 208–214) keeps `evaluationFichaSchema.safeParse`; no SQL. The preprocess runs on that parse, so a legacy `testesClinicos` string inside saved jsonb is migrated on the next read/save without a migration.

## Shared Patterns

### Closed catalog, fold, no throw
**Source:** `src/lib/atividadeCapacidade.ts` lines 97–118 and 247–259
**Apply to:** `mobilidadePalpacao.ts`, schema preprocess, the test file
Copy `isJsonObject`, `fold`, `trimString`, `clampTrimmed`, and the new-shape-vs-legacy branch. Match is the full folded label and it must be unique. `includes` is only for the live search box, never for legacy migration.

### Preprocess before Zod strip
**Source:** `src/schemas/evaluationFicha.schema.ts` lines 1–2 and 263–266
**Apply to:** `mobilidade` and `palpacaoTestes`
Import the normalizer with a relative `.ts` path. `.preprocess(normalize, objectSchema).default({})`. The normalizer returns only keys the new object lists.

### One string for three readers
**Source:** `formatLinha` (`atividadeCapacidade.ts` 71–75), detail (`EvaluationFichaDetail.tsx` 119–129), catalog (`pdfFieldCatalog.ts` 369–389), PDF (`patientAiPdf.service.ts` 2002–2025)
**Apply to:** detail, `04.B`, `04.E`, and the `tests` column
`DetailLeaf` and `drawOptionalField` receive a string. `previewFrom` receives the first line (`PREVIEW_MAX` 40). PDF draw of those two blocks replaces `→` with `->` on that string only.

### Checkbox reveals the row; uncheck deletes the value
**Source:** `EvaluationPage03.tsx` lines 92–102 and 132–165; `shouldUnregister: false` in `PatientEvaluationEditorForm.tsx` lines 128–132
**Apply to:** movimentos in bloco B and testes in bloco E
The measure row, dor panel, and resultado input are not in the DOM while unchecked. Uncheck uses `remove` or `setValue`, not a hidden registered input.

### Read-only and write gate
**Source:** `EvaluationPage04.tsx` line 172 `const disabled = readOnly`; `PatientEvaluationPanel.tsx` `canWrite` around lines 153–173
**Apply to:** every new select, radio, checkbox, chip, search, and input (`disabled={readOnly}`). Adicionar / Remover / Editar do not mount when `readOnly`. The editor itself mounts only when `canWrite`.

### Destructive confirm
**Source:** `ConfirmDialog` props `src/components/ui/ConfirmDialog.tsx` lines 3–16; call `PatientEvaluationPanel.tsx` lines 318–325
**Apply to:** Remover região and Remover achado only (`tone="danger"`).

### Native controls, Fluxo tokens
**Source:** `MedidaGrupo` input `EvaluationPage03.tsx` lines 59–66; `RadioRow` / `BoolCheck` `fichaFormPrimitives.tsx` lines 52–104
**Apply to:** new inputs, selects, chips, and the dor fieldset
No new color tokens. No `font-medium`. No `ring-accent`. Chips selected: `border-forest bg-forest text-white`. Inactive: `border-line bg-surface text-ink`.

### Column `tests` stays a string
**Source:** `emptyToNull` `evaluations.service.ts` lines 38–41; editor line 190; `draftFromPdf` lines 48–51; `legacyToFicha` lines 128–132
**Apply to:** editor submit, PDF draft, legacy seed
`formatTestesParaColuna` returns a string. Objects must not reach `emptyToNull`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | No new file lacks an analog. The searchable `<ul>` and the inline dor `<fieldset>` have no dedicated component; build them inside `EvaluationPage04.tsx` from `BoolCheck` markup and `MedidaGrupo` classes. Do not add cmdk, a popover, or a shadcn control. |

## Metadata

**Analog search scope:** `src/lib/atividadeCapacidade.ts`, `src/lib/atividadeCapacidade.test.ts`, `src/schemas/evaluationFicha.schema.ts`, `src/components/patients/evaluation/`, `src/lib/pdfFieldCatalog.ts`, `src/services/patientAiPdf.service.ts`, `src/services/evaluations.service.ts`, `src/components/patients/PatientEvaluationEditorForm.tsx`, `src/components/patients/PatientEvaluationPanel.tsx`, `src/components/ui/ConfirmDialog.tsx`
**Files scanned:** 11 analogs (phase 24 helper, page 03, page 04, schema, detail, catalog, PDF service, editor, panel, evaluations service, form primitives)
**Pattern extraction date:** 2026-10-05

**Out of scope (do not plan edits):** `ForcaTable`, blocks A/C/D/F/G/H, pages 01–03 except the one `setValue` prop on page 04, `patient-ai-summary`, `toWinAnsiSafe`, SQL, new npm packages.
