---
phase: 24-atividades-avaliacao-capacidade-e-unidade
verified: 2026-10-05T02:50:00Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 24: Atividades da avaliação Verification Report

**Phase Goal:** No bloco B de 03 Função, o profissional registra várias atividades. Cada uma tem capacidade atual e quanto conseguia antes, com unidade (minutos, km, repetições). Some o campo Atividade solto e o Consigo por separado.
**Verified:** 2026-10-05T02:50:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Dá para marcar mais de uma atividade e preencher a capacidade de cada uma. | ✓ VERIFIED | `EvaluationPage03` renders the 16-item `ATIVIDADES` grid and, for each checked key, a row bound to `ficha.funcao.atividadesAfetadas.capacidades.{key}`. There is no Adicionar button and no `useFieldArray`. `normalizeAtividadesAfetadas` keeps a separate `atual`/`antes` pair per catalog key. `node --test src/lib/atividadeCapacidade.test.ts`: 21/21, including independent `correr` and `agachar` pairs. |
| 2 | Cada atividade mostra só capacidade atual e quanto conseguia antes. Não há campo Atividade nem Consigo por. | ✓ VERIFIED | Block B legends are only `Capacidade atual` and `Quanto conseguia antes`. No `LineField` for Atividade, Consigo por, or Antes conseguia por. Parsed output drops `capacidadeAtual`, `atividade`, `consigoPor`, and `antesConseguiaPor` (`REQ-35: parse não devolve os quatro textos velhos`). |
| 3 | Capacidade atual e quanto conseguia antes aceitam minutos, km ou repetições, com valor e unidade juntos. | ✓ VERIFIED | Each side is one bordered group: text input plus a native select (`""` → Unidade, `minutos`, `km`, `repeticoes`). Sides are independent. `formatMedida` emits `10 minutos`, `3 km`, `12 repetições`. `10 min` is not interpreted. A unit outside the enum is dropped and does not throw. |
| 4 | A leitura da ficha, o PDF e o catálogo de export mostram as mesmas atividades com valor e unidade. | ✓ VERIFIED | Detail walks `ATIVIDADES` and renders `formatMiolo` (or Sim when only marked). Catalog `03.B` preview is the first `formatLinha`, then `Registro anterior`. PDF frame B uses `formatMiolo` via `drawLabeledValue` when there is a measure, and `formatLinha` (label only) when the activity is marked without a measure. Old shared labels are absent from the `03.B` slice and the `show03B` frame. |
| 5 | Uma ficha antiga não copia um número compartilhado para todas as atividades marcadas e não inventa unidade. | ✓ VERIFIED | `migrateLegacy` assigns the old number only when the free-text activity matches one catalog label, or when exactly one bool is marked. Several marked activities without an exact match go to `textoLegado` and leave `capacidades` empty (`REQ-35: várias bools sem match exato vão para textoLegado`). Conflicting `capacidadeAtual` and `consigoPor` are not picked as a winner. Units are never inferred. Anamnese on the same parse survives. |
| 6 | Desmarcar uma atividade limpa a chave dela em `capacidades`, com `shouldUnregister: false`. | ✓ VERIFIED | `PatientEvaluationEditorForm` sets `shouldUnregister: false`. `EvaluationPage03` watches the 16 flags and, when a flag falls from marked to unmarked, calls `setValue(capacidades.{key}, undefined)`. `EvaluationFichaForm` passes that `setValue` into page 03. |
| 7 | O texto da medida é filho de React ou string do pdf-lib. Não há HTML injetado. | ✓ VERIFIED | `DetailLeaf` prints a string in a `<p>` with `whitespace-pre-wrap`, or `Sim` for `true`. No `dangerouslySetInnerHTML` in the evaluation components. The PDF frame uses `drawLabeledValue` / `page.drawText` + `toWinAnsiSafe`. |

**Score:** 7/7 truths verified

Roadmap success criteria are truths 1–4. Truths 5–7 are plan must-haves that the roadmap wording does not already cover (legacy migration, uncheck cleanup, and plain-text rendering).

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/lib/atividadeCapacidade.ts` | Catalog, normalize, formatMedida, formatMiolo, formatLinha | ✓ VERIFIED | 260 lines. Exports `ATIVIDADES` (16 keys), `normalizeAtividadesAfetadas`, `formatMedida`, `formatMiolo`, `formatLinha`. Normalize never throws on non-objects. |
| `src/lib/atividadeCapacidade.test.ts` | REQ-35 cases | ✓ VERIFIED | 21 tests, all named `REQ-35:`. Imports the helper with a relative `.ts` path and `evaluationFichaSchema` from the schema. |
| `src/schemas/evaluationFicha.schema.ts` | Preprocess of `atividadesAfetadas` | ✓ VERIFIED | `z.preprocess(normalizeAtividadesAfetadas, …)` with per-key bools, `textoLegado`, `outraDetalhe`, and `capacidades` of `{ atual, antes }` where `unidade` is `minutos \| km \| repeticoes`. |
| `src/components/patients/evaluation/EvaluationPage03.tsx` | Block B row per marked activity | ✓ VERIFIED | Grid plus revealed rows. Empty copy matches the UI spec. `Outra (detalhe)` shows only while Outra is checked. |
| `src/components/patients/evaluation/EvaluationFichaForm.tsx` | `setValue` passed to page 03 | ✓ VERIFIED | `setValue={setValue}` on `EvaluationPage03`. |
| `src/components/patients/evaluation/EvaluationFichaDetail.tsx` | One leaf per activity plus Registro anterior | ✓ VERIFIED | Section 03 maps `ATIVIDADES` through `formatMiolo`. `Registro anterior` reads `textoLegado`. |
| `src/lib/pdfFieldCatalog.ts` | Preview `03.B` via `formatLinha` | ✓ VERIFIED | Label `Atividades afetadas`, group `03 · Função · Bloco B`. Preview is the first formatted line, then Registro anterior. |
| `src/services/patientAiPdf.service.ts` | Frame B drawn per activity | ✓ VERIFIED | `show03B` kept. Loop uses `formatLinha` / `formatMiolo`. `Registro anterior` is `drawOptionalField`. Blocks A and C–F are unchanged in role. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `atividadeCapacidade.test.ts` | `atividadeCapacidade.ts` | `from './atividadeCapacidade.ts'` | ✓ WIRED | Relative import with `.ts` extension. |
| `evaluationFicha.schema.ts` | `atividadeCapacidade.ts` | `z.preprocess(normalizeAtividadesAfetadas)` | ✓ WIRED | Import is `../lib/atividadeCapacidade.ts`. |
| `EvaluationFichaForm.tsx` | `EvaluationPage03.tsx` | `setValue={setValue}` | ✓ WIRED | Page 03 requires `setValue` in its props. |
| `EvaluationPage03.tsx` | `ficha.funcao.atividadesAfetadas.capacidades` | `register` of valor and unidade | ✓ WIRED | `valorPath` / `unidadePath` register both sides. |
| `atividadeCapacidade.test.ts` | `evaluationFicha.schema.ts` | `evaluationFichaSchema.parse` | ✓ WIRED | Six parse cases, including legacy anamnese survival and `parse({})`. |
| `EvaluationFichaDetail.tsx` | `atividadeCapacidade.ts` | `formatMiolo` on `DetailLeaf` | ✓ WIRED | `@/lib/atividadeCapacidade`. |
| `pdfFieldCatalog.ts` | `atividadeCapacidade.ts` | `formatLinha` in preview `03.B` | ✓ WIRED | Slice between block A and `03.C` contains `formatLinha` and not the old field paths. |
| `patientAiPdf.service.ts` | `atividadeCapacidade.ts` | `formatLinha` / `formatMiolo` in frame B | ✓ WIRED | Frame between `if (show03B)` and block C. |
| `evaluations.service.ts` | schema | `safeParse` on read and write | ✓ WIRED | `resolveEvaluationFicha` and `toRow` both parse `ficha`. Not edited in this phase; the preprocess runs on the existing hook. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `EvaluationPage03` | `watch` / `register` on `capacidades.{key}.{atual\|antes}` | React Hook Form, saved by `toRow` → `patient_evaluations.ficha` | Yes. `evaluationFichaSchema.safeParse` then Supabase insert/update. | ✓ FLOWING |
| `EvaluationFichaDetail` | `ficha.funcao.atividadesAfetadas` | `PatientEvaluationPanel` `selected.ficha` | Yes. `usePatientEvaluations` → `listPatientEvaluations` → `mapEvaluation` → `resolveEvaluationFicha`. | ✓ FLOWING |
| `pdfFieldCatalog` `03.B` | `ficha.funcao.atividadesAfetadas` | Same parsed `EvaluationFicha` | Yes. Preview built from `formatLinha` of stored pairs. | ✓ FLOWING |
| `patientAiPdf` frame B | `ficha.funcao.atividadesAfetadas` | `EvaluationFicha` argument of the PDF builder | Yes. Draw loop reads the same map. | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| REQ-35 helper, schema parse, and catalog/PDF source contract | `node --test src/lib/atividadeCapacidade.test.ts` | 21 pass, 0 fail, ~292 ms | ✓ PASS |
| Shared legacy number is not copied onto every marked activity | Covered by `REQ-35: várias bools sem match exato vão para textoLegado` in the same run | `capacidades` empty; `textoLegado` is `Capacidade atual: 10` | ✓ PASS |
| `10 min` is not turned into the minutos unit | Covered by `REQ-35: formatMedida não interpreta 10 min` | pass | ✓ PASS |

### Probe Execution

No probe scripts are declared in the phase plans or summaries. This is not a migration phase. Step 7c skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| REQ-35.1 | 24-01, 24-02, 24-03, 24-04 | Registrar mais de uma atividade no bloco B e preencher a capacidade de cada uma. | ✓ SATISFIED | Per-key `capacidades` map, revealed row per checked activity, tests for two activities. |
| REQ-35.2 | 24-01, 24-02, 24-03, 24-04 | Cada atividade mostra só capacidade atual e quanto conseguia antes. Sem campo Atividade e sem Consigo por. | ✓ SATISFIED | Those inputs are gone from page 03, from the parsed object, from detail, and from PDF frame B. |
| REQ-35.3 | 24-01, 24-02, 24-04 | Minutos, km e repetições, com valor e unidade visíveis juntos. | ✓ SATISFIED | Select plus `formatMedida` / `formatMiolo` / `formatLinha`. |
| REQ-35.4 | 24-03, 24-04 | Leitura, PDF e catálogo mostram as atividades com valor e unidade. | ✓ SATISFIED | Same formatter family on all three surfaces. |

Every plan frontmatter lists only `REQ-35`. `REQUIREMENTS.md` defines that ID and its four acceptance items. No other requirement is mapped to phase 24. The traceability table at the bottom of `REQUIREMENTS.md` stops at REQ-32 and does not yet list REQ-35; the requirement body and `ROADMAP.md` do. That table lag is not an orphaned requirement.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `EvaluationFichaDetail.tsx`, `pdfFieldCatalog.ts`, `patientAiPdf.service.ts` | detail 119–129; catalog 370–388; PDF 1906–2024 | `outraDetalhe` is stored and can mark block B as filled, but the leaf, the catalog preview, and the PDF body never print that string. Unchecking Outra clears `capacidades.outra` and leaves `outraDetalhe` registered. | ⚠️ Warning | Does not fail a must-have. The UI spec defines the read leaf as `formatMiolo` or Sim, and the PDF line as `formatLinha` plus Registro anterior. It does not ask those surfaces to print Outra (detalhe). A record whose only block-B text is that leftover string can open an empty `03.B` frame. |
| `atividadeCapacidade.test.ts` | 391–415 | `REQ-35: catálogo e PDF do bloco B usam formatLinha` greps source text. | ℹ️ Info | The assertions pass while only proving the symbols exist in the slice. The draw loop and the detail leaf were read directly; they do call the formatters with the stored pair. |

No `TBD`, `FIXME`, or `XXX` markers in the phase files. No empty handlers, no `dangerouslySetInnerHTML`, no stub return of the block B UI.

### Human Verification Required

None pending. Plan 24-04 is a blocking `checkpoint:human-verify`, and that hosted bloco B UAT was already approved. Plans 24-01 through 24-03 have no `<human-check>` blocks deferred to the end of the phase. Pending UAT from phases 20, 22, and 23 is outside this phase.

### Gaps Summary

No goal gaps. The four REQ-35 acceptance items are present in the helper, the ficha schema, the block B editor, the saved-record view, the export catalog, and the PDF frame. A legacy shared number stays in Registro anterior instead of being copied onto every checked activity, and free text such as `10 min` does not become a unit.

The Outra (detalhe) string is a leftover display hole next to the contract, not a miss of the capacity goal. The reading and PDF contracts specify the measure phrase and Registro anterior, and those are what the three surfaces share.

---

_Verified: 2026-10-05T02:50:00Z_
_Verifier: Claude (gsd-verifier)_
