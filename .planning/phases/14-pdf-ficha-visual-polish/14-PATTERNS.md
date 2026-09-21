# Phase 14: PDF ficha visual polish - Pattern Map

**Mapped:** 2026-09-21  
**Files analyzed:** 6  
**Analogs found:** 6 / 6  
**Upstream:** `14-CONTEXT.md`, `14-RESEARCH.md`, `14-UI-SPEC.md`, `13-PATTERNS.md`

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/services/patientAiPdf.service.ts` | service | transform + file-I/O | same file (Phase 13 chrome: `drawFichaBlockFrame`, `drawPageBanner`, `drawAvaliacao`/`drawEvolucao`) | exact |
| `src/lib/pdfFichaChrome.ts` *(optional extract if service ≫ ~2k LOC)* | utility | transform | primitives already in `patientAiPdf.service.ts` (lines 430–953) | exact |
| `src/lib/focusRegions.ts` | utility | transform | same file — **read-only** silhouette paths + `listFocusRegionsByView` | exact |
| `src/components/patients/evaluation/BodyMapPicker.tsx` | component | — | same file — **read-only** viewBox `0 0 140 240` + path fill pattern | exact |
| `src/assets/pdf/body-*.png` *(optional, not preferred)* | config/asset | file-I/O | `src/assets/brand/logo.png` + `embedPng` in `buildPatientAiReportPdf` | role-match |
| `src/lib/pdfFieldCatalog.ts` | utility | transform | same file — **do not modify** (D-06) | exact (untouched) |

## Pattern Assignments

### `src/services/patientAiPdf.service.ts` (service, transform + file-I/O)

**Analog:** same file (Phase 13 ficha chrome). Primary work surface for Phase 14.

**Imports pattern** (lines 1–14) — extend with `listFocusRegionsByView`; keep catalog types for gates only:
```typescript
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from 'pdf-lib'
import logoUrl from '@/assets/brand/logo.png'
import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'
import { FOCUS_REGIONS, listFocusRegionsByView } from '@/lib/focusRegions'
import type { PdfFieldId } from '@/lib/pdfFieldCatalog'
```

**Design tokens** (lines 23–47) — already match UI-SPEC; reuse, do not invent a second palette:
```typescript
const COLORS = {
  forest: rgb(0x0b / 255, 0x1d / 255, 0x36 / 255),
  navy: rgb(0x1a / 255, 0x36 / 255, 0x5d / 255),
  sage: rgb(0x5f / 255, 0x7f / 255, 0x6b / 255),
  accent: rgb(0x2f / 255, 0x7d / 255, 0xff / 255),
  accentSoft: rgb(0xe7 / 255, 0xf0 / 255, 0xfb / 255),
  border: rgb(0xb8 / 255, 0xc9 / 255, 0xde / 255),
  canvas: rgb(0xf3 / 255, 0xf5 / 255, 0xf8 / 255),
  ink: rgb(0x10 / 255, 0x20 / 255, 0x38 / 255),
  muted: rgb(0x5a / 255, 0x6b / 255, 0x80 / 255),
  line: rgb(0xe1 / 255, 0xe8 / 255, 0xf0 / 255),
  white: rgb(1, 1, 1),
  danger: rgb(0xb9 / 255, 0x3c / 255, 0x3c / 255),
} as const
```

**WinAnsi safety** (lines 145–153) — mandatory for all new draw helpers (legend glyphs already ASCII via `BODY_MAP_GLYPH`):
```typescript
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

**Glyph map for body marks** (lines 133–139) — keep; never pass ★/↑ to Helvetica:
```typescript
const BODY_MAP_GLYPH: Record<string, string> = {
  X: 'X',
  hatch: '////',
  O: 'O',
  arrow: '^',
  star: '*',
}
```

**DrawContext** (lines 207–222) — extend with optional `times` / `timesBold` fonts for chapter titles:
```typescript
type DrawContext = {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  // Phase 14: times / timesBold from StandardFonts.TimesRoman*
  logo: PDFImage
  y: number
  pageIndex: number
  docTitle: string
  patientLine: string
  generatedAt: string
  contentX: number
  contentW: number
  footerKind: 'fluxo' | 'ficha'
}
```

**Font embed entry** (lines 1763–1793) — copy structure; add TimesRoman:
```typescript
export async function buildPatientAiReportPdf(input: BuildPatientAiReportPdfInput): Promise<Blob> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  // Phase 14:
  // const times = await doc.embedFont(StandardFonts.TimesRoman)
  // const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold)

  const logoBytes = await fetch(logoUrl).then((r) => {
    if (!r.ok) throw new Error('Não foi possível carregar a logo FLUXO.')
    return r.arrayBuffer()
  })
  const logo = await doc.embedPng(logoBytes)
  // …
  footerKind: input.kind === 'avaliacao' || input.kind === 'evolucao' ? 'ficha' : 'fluxo',
}
```

---

#### Slim header (D-03) — modify `drawHeaderBand`

**Current heavy band** (lines 256–322) — for `footerKind === 'ficha'`, shrink to ~28–36px strip or skip soft band; chapter banner is hero:
```typescript
function drawHeaderBand(ctx: DrawContext, opts: { isFirstPage: boolean }) {
  const bandHeight = opts.isFirstPage ? 92 : 56  // ficha: use ~32 / ~28 instead

  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - bandHeight,
    width: PAGE_WIDTH,
    height: bandHeight,
    color: COLORS.accentSoft, // ficha: omit or use white / minimal
  })
  // … logo smaller; do not put docTitle as competing hero on ficha pages
  ctx.y = PAGE_HEIGHT - bandHeight - 28
}
```

**Ficha footer** (lines 224–254) — keep `NN | Ficha de Anamnese…`; restore accents via `toWinAnsiSafe` (Portuguese OK in WinAnsi):
```typescript
const left =
  ctx.footerKind === 'ficha'
    ? `${String(ctx.pageIndex).padStart(2, '0')} | Ficha de Anamnese e Evolução Musculoesquelética`
    : 'FLUXO · Documento clínico'
```

---

#### Chapter banner (REQ-26.1) — upgrade `drawPageBanner`

**Current** (lines 811–849) — HelveticaBold + square diamond. Phase 14: `timesBold`, rotate diamond 45° via small SVG path or keep square if density OK:
```typescript
function drawPageBanner(ctx: DrawContext, title: string) {
  ensureSpace(ctx, 36)
  const safe = toWinAnsiSafe(title.toUpperCase())
  const size = SIZE.chapter
  // Phase 14: use ctx.timesBold (or timesBold) instead of ctx.bold
  const tw = ctx.bold.widthOfTextAtSize(safe, size)
  const cx = PAGE_WIDTH / 2
  // flanking rules + center diamond — keep layout; swap font
  ctx.page.drawText(safe, {
    x: cx - tw / 2,
    y: ctx.y,
    size,
    font: ctx.bold, // → timesBold
    color: COLORS.navy,
  })
}
```

---

#### Badge colors (REQ-26.2) — fix `badgeColorForLetter`

**Bug** (lines 866–870) — letter `E` always danger. Danger only via `opts.danger` (already used for 03.E at lines 1427–1437):
```typescript
function badgeColorForLetter(letter: string): RGB {
  const sageLetters = new Set(['B', 'D', 'F', 'H'])
  // REMOVE: if (letter === 'E' || …) return COLORS.danger
  return sageLetters.has(letter.toUpperCase()) ? COLORS.sage : COLORS.navy
}

// Triagem keeps explicit opts:
drawFichaBlockFrame(ctx, 'E', 'Triagem de segurança', () => { /* … */ }, { danger: true })
```

**Block frame** (lines 876–953) — reuse as-is; prefer `ensureSpace` for full block height before start (page-break border pitfall):
```typescript
function drawFichaBlockFrame(
  ctx: DrawContext,
  letter: string,
  title: string,
  bodyDraw: () => void,
  opts?: { danger?: boolean },
): void {
  const pageAtStart = ctx.pageIndex
  const boxTop = ctx.y
  const badgeFill = opts?.danger ? COLORS.danger : badgeColorForLetter(letter)
  // badge + BLOCO X — TITLE + bodyDraw + border only if same page
  if (ctx.pageIndex === pageAtStart) {
    ctx.page.drawRectangle({
      x: MARGIN_X,
      y: boxBottom,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderColor: borderCol,
      borderWidth: 1.1,
    })
  }
}
```

---

#### Field chrome (REQ-26.3) — reuse, stop bullets for multi-selects

**Underline field** (lines 431–475) — keep for short values.  
**Note box** (lines 478–521) — keep for long text.  
**Checkbox grid** (lines 562–615) — use instead of `drawBulletList` for 02.B / característica (and any multi-select still on bullets).  
**Two-column fields** (lines 524–560) — template for dual-column Y tracking (`yStart` + `Math.min`).

```typescript
// Gap today (lines 1205–1208) — REPLACE drawBulletList with checkbox grid:
if (show02B) {
  drawFichaBlockFrame(ctx, 'B', 'Característica predominante', () => {
    drawCheckboxRow(ctx, caracteristicaItems) // or drawOptionalBullets which already uses checkbox
  })
}
```

`drawOptionalBullets` (lines 795–807) already calls `drawCheckboxRow` — prefer that over `drawBulletList`.

---

#### Side-by-side blocks (REQ-26.4) — new helper from `drawTwoColumnFields`

**Analog pattern** (lines 536–555):
```typescript
const yStart = ctx.y
ctx.contentX = savedX
ctx.contentW = colW
drawLabeledValue(ctx, left[0], left[1])
const yAfterLeft = ctx.y
ctx.y = yStart
ctx.contentX = savedX + colW + colGap
ctx.contentW = colW
drawLabeledValue(ctx, right[0], right[1])
ctx.y = Math.min(yAfterLeft, ctx.y)
```

**Phase 14 `drawSideBySideBlocks`:** same Y-tracker; wrap each side in lettered chrome; if either column would `newPage` mid-body → fall back to stacked `drawFichaBlockFrame` (RESEARCH Pattern 3). Wire pairs: `02.E|F`, `04.F|G`, optionally `03.A|B`.

---

#### EVA scale (REQ-26.5) — replace text-only 02.C / keep underline fields

**Gap** (lines 1210–1215) — only `drawOptionalField` for Agora/Melhor/Pior.  
**Weak analog** `drawEvaBadge` (lines 621–658) — number box for geral PDF; do **not** reuse for ficha. New `drawEvaScale` using `drawLine` + `drawCircle` (see RESEARCH Code Examples). Keep numeric underlines + add circle scale.

---

#### Body map (REQ-26.5) — vector from Phase 6 paths

**Gap** (lines 1118–1203) — marks → `drawBulletList`.  
**Path source** (`focusRegions.ts` + BodyMapPicker):

```typescript
// BodyMapPicker.tsx lines 94–105 — viewBox contract
<svg viewBox="0 0 140 240" /* … */>
  {regions.map((region) => (
    <path key={region.key} d={region.path} /* … */ />
  ))}
</svg>
```

```typescript
// focusRegions.ts — consume via listFocusRegionsByView('front'|'back')
export function listFocusRegionsByView(view: FocusView): FocusRegion[] {
  return FOCUS_REGIONS.filter((region) => region.view === view)
}
```

**New `drawBodyMap` sketch** (prefer `drawSvgPath`, not PNG):
```typescript
const scale = mapHeight / 240
for (const region of listFocusRegionsByView('front')) {
  const marked = markByKey.has(region.key)
  page.drawSvgPath(region.path, {
    x: originX,
    y: originY, // PDF top after drawSvgPath Y-flip
    scale,
    color: marked ? COLORS.accentSoft : COLORS.white,
    borderColor: COLORS.navy,
    borderWidth: 0.6,
  })
}
// Overlay BODY_MAP_GLYPH at static centroids; legend with ASCII only
```

Centroid table: static `Record` next to helper inside PDF service (do not change `focusRegions.ts` API unless planner decides otherwise).

---

#### Data tables (REQ-26.5) — Mobilidade / Força

**Gap** (lines 1570–1597) — rows joined with ` · `. New `drawDataTable` with shaded header (`COLORS.accentSoft` or soft navy fill) + hairline grid. Columns from RESEARCH:

| Mobilidade | Movimento | Direito | Esquerdo | Dor/Sintoma | Observação |
| Força | Grupo | Direito | Esquerdo | Dor | Observação |

Reuse `wrapLines` for cell text; `ensureSpace` before header+rows.

---

#### Callout banners (REQ-26.5 / D-04.9)

**No current analog** — compose from `drawNoteBox` rectangle + bold title line:
```typescript
// Soft info: fill COLORS.canvas / accentSoft, border COLORS.border, navy title
// Caution (triagem notes): border/fill tint with COLORS.danger, bold title
// Optional: small drawCircle + "i" — no PNG icon pack (deferred)
```

---

#### Selective gates — do not regress (D-01 / D-06)

```typescript
function isFieldSelected(selected: ReadonlySet<PdfFieldId> | undefined, id: PdfFieldId): boolean {
  return selected === undefined || selected.has(id)
}
// Every new visual still behind show0X* && isFieldSelected — omit empty
```

---

#### Evolução same visual system (REQ-26.6 / D-05)

**Current** (lines 1684–1748): SOAP uses `drawPageBanner` + plain `drawOptionalField`; AI uses `drawFichaBlockFrame`. Phase 14: wrap each session SOAP group in `drawFichaBlockFrame` (or lettered cards), slim ficha header, same callouts/typography as Avaliação. Keep `EVO_SOAP_FIELDS` + `isFieldSelected` filters — never invent AI text.

```typescript
function drawEvolucao(ctx: DrawContext, input: PatientAiEvolucaoPdfInput) {
  ctx.footerKind = 'ficha'
  drawPatientCard(ctx)
  // Phase 14: each session with filled selected SOAP → banner + block frame(s)
  // AI blocks already use drawFichaBlockFrame — keep
}
```

---

### `src/lib/pdfFichaChrome.ts` (utility, transform) — optional

**Analog:** extract from `patientAiPdf.service.ts` primitives only (`drawLabeledValue`, `drawNoteBox`, `drawCheckboxRow`, `drawFichaBlockFrame`, new table/EVA/map/callout/side-by-side).  
**When:** service exceeds maintainability (~2000+ LOC) after Phase 14 primitives.  
**Do not** move `drawAvaliacao` / `drawEvolucao` / catalog gates on first wave unless needed.

---

### `src/lib/focusRegions.ts` + `BodyMapPicker.tsx` (read-only analogs)

**Role:** geometry source of truth for silhouettes.  
**Copy:** `path` strings, `viewBox 0 0 140 240`, `listFocusRegionsByView`.  
**Do not:** redesign SPA picker; do not bake PNG unless vector draw fails UAT.

---

### Optional PNG assets (`src/assets/pdf/body-*.png`)

**Analog:** logo embed in `buildPatientAiReportPdf` (lines 1768–1772):
```typescript
const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer())
const logo = await doc.embedPng(logoBytes)
ctx.page.drawImage(ctx.logo, { x, y, width, height })
```
**Only if** `drawSvgPath` proves too heavy — RESEARCH prefers vector. Sync risk with path edits.

---

### `src/lib/pdfFieldCatalog.ts` — untouched

**Analog:** Phase 13 catalog ↔ `isFieldSelected` contract.  
**Phase 14:** zero changes. Visual polish only. Diff review: `git diff --stat src/lib/pdfFieldCatalog.ts` should be empty.

## Shared Patterns

### Omit empty / selected-only
**Source:** `patientAiPdf.service.ts` `textFilled`, `isFieldSelected`, `drawOptionalField`  
**Apply to:** all new primitives and Evolução SOAP/AI  
```typescript
function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
// numbers: EVA 0 is filled — do not treat as empty
```

### WinAnsi + ASCII legend
**Source:** `toWinAnsiSafe` + `BODY_MAP_GLYPH`  
**Apply to:** chapter titles, legends, callout text, footer accents  

### Dual-column Y tracking
**Source:** `drawTwoColumnFields` lines 536–555  
**Apply to:** `drawSideBySideBlocks`; stacked fallback on page-break  

### Block chrome + danger opt-in
**Source:** `drawFichaBlockFrame` + `{ danger: true }` only on 03.E  
**Apply to:** all lettered blocks; fix `badgeColorForLetter`  

### Logo PNG embed (no new packages)
**Source:** `buildPatientAiReportPdf` fetch + `embedPng`  
**Apply to:** slim header logo; optional body PNG fallback only  

### Page flow
**Source:** `ensureSpace` / `newPage` / `drawHeaderBand`  
**Apply to:** estimate tall blocks (map, tables, dual columns) before drawing  

## No Analog Found

| File / Concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| `drawEvaScale` (0–10 circles) | utility | transform | No circle-scale helper yet — compose from `page.drawCircle` + `drawLine` (RESEARCH); weak analog `drawEvaBadge` is wrong UX |
| `drawDataTable` shaded grid | utility | transform | No table primitive — compose from `drawRectangle` + `wrapLines` |
| `drawCalloutBanner` | utility | transform | No callout helper — compose from `drawNoteBox` + danger/info colors |
| Hand-tuned region centroids | utility | transform | Not in `focusRegions.ts` — add static map beside `drawBodyMap` |

*(All have partial composition analogs in the same PDF service; planner invents helpers, not libraries.)*

## Metadata

**Analog search scope:**  
`src/services/patientAiPdf.service.ts`, `src/lib/focusRegions.ts`, `src/lib/pdfFieldCatalog.ts`, `src/components/patients/evaluation/BodyMapPicker.tsx`, `src/assets/brand/`, `.planning/phases/13-pdf-export-avaliacao-evolucao/13-PATTERNS.md`

**Files scanned:** ~8 primary  
**Pattern extraction date:** 2026-09-21  
**Key composition:** Extend Phase 13 chrome in-place — TimesRoman banners, slim ficha header, checkbox grids, dual-column blocks, SVG body map from FOCUS_REGIONS, EVA circles, shaded tables, callouts; Evolução reuses same system; catalog/picker/SQL untouched
