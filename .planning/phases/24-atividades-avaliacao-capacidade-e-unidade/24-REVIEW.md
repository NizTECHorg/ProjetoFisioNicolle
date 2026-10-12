---
phase: 24-atividades-avaliacao-capacidade-e-unidade
reviewed: 2026-10-05T02:39:15Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/lib/atividadeCapacidade.ts
  - src/lib/atividadeCapacidade.test.ts
  - src/schemas/evaluationFicha.schema.ts
  - src/components/patients/evaluation/EvaluationPage03.tsx
  - src/components/patients/evaluation/EvaluationFichaForm.tsx
  - src/components/patients/evaluation/EvaluationFichaDetail.tsx
  - src/lib/pdfFieldCatalog.ts
  - src/services/patientAiPdf.service.ts
findings:
  critical: 1
  warning: 1
  info: 1
  total: 3
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-10-05T02:39:15Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Block B now stores a per-activity measure and keeps `outraDetalhe`, and the form still asks for **Outra (detalhe)** when Outra is checked. The saved-record view, the export preview, and the PDF body never print that string. `filled` / `hasAtividades` still treat the string as content, so the export can open an **Atividades afetadas** frame that has no lines. Unchecking Outra clears the measure and leaves the detail in the payload.

## Critical Issues

### CR-01: Outra (detalhe) is saved and never shown

**File:** `src/components/patients/evaluation/EvaluationFichaDetail.tsx:119-129`
**Issue:** The form writes `ficha.funcao.atividadesAfetadas.outraDetalhe` (`EvaluationPage03.tsx:136-142`). `normalizeAtividadesAfetadas` copies that string whenever it is non-empty, with no check of the `outra` flag (`atividadeCapacidade.ts:251-255`). The detail section only renders `formatMiolo` or `true` (“Sim”). A saved Outra such as “natação, 20 minutos de pedal” appears as **Outra / Sim**, or disappears entirely when the checkbox is off.

The same drop happens on the export path. Before this phase, `checkedLabels` appended `outraDetalhe` to the PDF bullets. The new frame walks activities and then draws only **Registro anterior**:

- `src/lib/pdfFieldCatalog.ts:370-388` — `filled` is true when `outraDetalhe` is set, but `previewFrom` receives only the first `formatLinha` and `Registro anterior`. A record whose only block-B text is the detail gets a filled `03.B` row with an empty preview.
- `src/services/patientAiPdf.service.ts:1906-1913` and `2003-2025` — `hasAtividades` is true for the same string, and the frame skips every activity with `if (!marcada && !miolo) continue`. With Outra checked and no measure, the page draws the word “Outra” and omits the description. With Outra unchecked and a leftover detail, `show03B` is true and the frame body is empty.

**Fix:**

```tsx
// EvaluationFichaDetail.tsx — include the detail on the Outra leaf
const detalhe =
  item.key === 'outra' && atividades?.outraDetalhe?.trim()
    ? atividades.outraDetalhe.trim()
    : ''
if (!marcada && !miolo && !detalhe) return null
const value = [detalhe, miolo].filter(Boolean).join(' · ')
return <DetailLeaf key={item.key} label={item.label} value={value || true} />
```

```ts
// pdfFieldCatalog.ts — preview must be able to show the detail alone
const detalheOutra = textFilled(atividades?.outraDetalhe)
  ? `Outra (detalhe): ${atividades.outraDetalhe.trim()}`
  : undefined
preview: previewFrom(linhasAtividade[0], detalheOutra, registroAnterior),
```

```ts
// patientAiPdf.service.ts — inside the 03.B frame, after the activity loop
drawOptionalField(ctx, 'Outra (detalhe)', atividadesBloco?.outraDetalhe)
drawOptionalField(ctx, 'Registro anterior', atividadesBloco?.textoLegado)
```

Draw **Outra (detalhe)** whenever the string is non-empty, including when the checkbox is off, so a filled block always has a line.

## Warnings

### WR-01: Unchecking Outra clears the measure and keeps the detail

**File:** `src/components/patients/evaluation/EvaluationPage03.tsx:92-101`
**Issue:** The effect removes `capacidades.${key}` when a box goes from checked to unchecked. The Outra row also owns `outraDetalhe`, and that path is left registered (`shouldUnregister: false` on the evaluation form). The field unmounts, the string stays in form state, and the schema persists it. The next save still has a hidden detail, which is what makes `hasAtividades` true after the checkbox is off.

**Fix:**

```tsx
if (previous[index] === '1' && markedKey[index] !== '1') {
  setValue(capacidadePath(item.key), undefined, { shouldDirty: true, shouldValidate: true })
  if (item.key === 'outra') {
    setValue('ficha.funcao.atividadesAfetadas.outraDetalhe', '', {
      shouldDirty: true,
      shouldValidate: true,
    })
  }
}
```

## Info

### IN-01: Block B test checks source text, so a missing detail still passes

**File:** `src/lib/atividadeCapacidade.test.ts:391-415`
**Issue:** `REQ-35: catálogo e PDF do bloco B usam formatLinha` asserts that the catalog slice contains `formatLinha` and that the PDF slice contains `Registro anterior`. It never checks that `outraDetalhe` is drawn. The current sources satisfy the test while the detail string is omitted.
**Fix:** Assert the rendered detail in the detail component, the `03.B` preview, and the PDF frame (for example `Outra (detalhe)` inside the `show03B` slice), using a ficha value rather than a source grep alone.

---

_Reviewed: 2026-10-05T02:39:15Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
