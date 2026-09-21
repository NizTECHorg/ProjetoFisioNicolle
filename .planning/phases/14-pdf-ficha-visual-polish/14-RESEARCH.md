# Phase 14: PDF ficha visual polish - Research

**Researched:** 2026-09-21  
**Domain:** Client-side pdf-lib clinical form layout (typography, chrome, tables, EVA, body map)  
**Confidence:** HIGH (brownfield renderer + pdf-lib API verified locally; refs 01–04 analyzed); MEDIUM (exact page-break UX for dual-column blocks; optional rounded-corner SVG path polish)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### D-01 — Goal: visual parity with ficha refs (not wireframe)
PDF must read like the clinical forms in `refs/` (01 Anamnese, 02 Sintomas, 03 Função/Segurança, 04 Avaliação/Plano): lettered blocks, chapter titles, checkbox grids, text boxes, tables, intensity scale, body-map region, callouts — **only selected/filled content** (keep Phase 13 picker semantics).

#### D-02 — Single render engine: still pdf-lib client-side
Stay on `pdf-lib` in `patientAiPdf.service.ts` (no Puppeteer/server HTML). Research must solve pdf-lib limits (no true borderRadius, Helvetica vs serif titles, body silhouettes) with embed assets / Times-Roman / approximate chrome — without inventing clinical data.

#### D-03 — Design tokens from refs (FLUXO-adapted)
- Navy `#1A365D` / slate blue borders `#B8C9DE`-ish / sage green `#5F7F6B` alternating badges
- Danger red only for Triagem (03.E)
- Soft fills for text areas; thin borders; generous padding
- Footer: `NN | Ficha de Anamnese e Evolução Musculoesquelética`
- Minimize or restyle the heavy FLUXO accent-soft header band on ficha pages so the chapter title is the hero (logo small OK)

#### D-04 — Layout patterns required
1. Centered chapter titles with decorative rule + diamond (`01 — ANAMNESE INICIAL`, etc.)
2. Block card: letter badge square + `BLOCO X — TITLE` + thin border enclosing content
3. Two-column compositions where refs show them (ID left/right; Piora|Melhora side-by-side; F|G side-by-side when both selected)
4. Checkbox grids (not bullet lists) for multi-selects
5. Underline fields for short values; bordered note boxes for long text
6. Real tables with shaded headers for Mobilidade / Força
7. EVA 0–10 visual scale (circles on a line)
8. Body map: anterior/posterior silhouettes + marks + legend (reuse Phase 6 SVG/assets → PNG embed)
9. Callout banners (info / caution) matching refs
10. Identificação profissional footer block when selected

#### D-05 — Evolução PDF gets same visual system
Apply the same block chrome, typography, and callouts to Evolução (session SOAP + AI sections) so both export kinds feel like one product.

#### D-06 — Out of scope
- Changing field-picker UX / kinds / EF / SQL
- Pixel-perfect print match to clinic paper (aim: clearly recognizable ficha aesthetic)
- Redesign of Avaliações CRUD form UI
- New npm packages unless research proves necessary (prefer StandardFonts + PNG assets)

### Claude's Discretion
- Exact asset pipeline for body silhouettes (export PNG from existing SVG vs redraw paths)
- Whether to embed a TTF for serif titles via fontkit (only if research shows StandardFonts Times insufficient)
- Page-break strategy inside multi-column blocks
- How close to approximate rounded corners (straight borders acceptable if density/spacing match)

### Deferred Ideas (OUT OF SCOPE)
- Interactive PDF form fields
- Clinic logo swap per account
- Exact COFFITO disclaimer icons as SVG stickers beyond text callouts
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-26 | PDF ficha visual polish — layout denso e legível alinhado às refs 01–04 | Gap analysis + primitive plan below; stay on pdf-lib; no picker/SQL/EF changes |
| REQ-26.1 | Capítulos centrados estilo `01 — ANAMNESE INICIAL` | `drawPageBanner` + TimesRoman titles; shrink header band (D-03) |
| REQ-26.2 | Blocos lettered + navy/sage; triagem vermelha | Fix `badgeColorForLetter` (E≠danger always); `opts.danger` only for 03.E |
| REQ-26.3 | Underlines / caixas / checkbox grids | Extend existing `drawLabeledValue` / `drawNoteBox` / `drawCheckboxRow`; stop `drawBulletList` for multi-selects |
| REQ-26.4 | Multi-coluna onde a ref exige | New `drawSideBySideBlocks` + existing `drawTwoColumnFields` |
| REQ-26.5 | Tabelas Mobilidade/Força; EVA 0–10; mapa corporal | New `drawDataTable` / `drawEvaScale` / `drawBodyMap` via `drawSvgPath` |
| REQ-26.6 | Evolução mesmo sistema; só selecionado; sem inventar | Reuse chrome in `drawEvolucao`; keep Phase 13 gates |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

Nenhum arquivo em `.cursor/rules/` no workspace. Aplicar padrões brownfield das phases 11–13:

- pdf-lib client-side only; never Puppeteer/HTML print [VERIFIED: CONTEXT D-02 + `package.json`]
- WinAnsi-safe text via `toWinAnsiSafe` — StandardFonts throw on ★/↑ [VERIFIED: local encode test]
- Sem inventar dados clínicos; omitir vazios/não selecionados [VERIFIED: Phase 13 `isFieldSelected` + `drawAvaliacao`]
- Não alterar picker / kinds / EF / SQL nesta fase [LOCKED: D-06]
- Prefer zero new npm packages [LOCKED: D-06]
- SQL Editor apply path if any SQL appears (none expected here) [VERIFIED: STATE.md]

## Summary

Phase 13 already shipped selective export, lettered block frames, chapter banners, checkbox rows, underlines, and note boxes in `patientAiPdf.service.ts` (~1812 LOC). UAT still rejects the PDF as too plain because the **clinical visual affordances from refs 01–04 are missing or degraded to text lists**: no body silhouettes, no EVA circle scale, no shaded tables for Mobilidade/Força, no side-by-side Piora|Melhora / Síntese|Objetivos, no callout banners, chapter titles use HelveticaBold (not serif), and the FLUXO accent-soft header band still dominates ficha pages.

pdf-lib 1.17.1 can deliver the required look **without new packages**: `StandardFonts.TimesRoman` for chapter titles (Portuguese accents OK), `drawCircle`/`drawEllipse` for EVA, `drawSvgPath` for silhouettes (Y-flip built-in) and optional rounded frames, `drawRectangle` grids for tables. Body map should reuse `FOCUS_REGIONS[].path` from Phase 6 directly — prefer vector draw over PNG pipeline. `@pdf-lib/fontkit` is **not** needed.

**Primary recommendation:** Refactor `patientAiPdf.service.ts` into denser ficha primitives (serif banner, dual-column blocks, tables, EVA scale, SVG body map, callouts, slim header) and rewire `drawAvaliacao` / `drawEvolucao` only — leave `pdfFieldCatalog` and composer untouched.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ficha visual chrome (blocks, titles, tables, EVA, map) | Browser / Client | — | Existing `buildPatientAiReportPdf` path; pdf-lib in browser |
| Selective field gates | Browser / Client | — | Keep Phase 13 `selectedFieldIds` — no catalog change |
| Body silhouette geometry | Browser / Client | CDN/Static (optional PNG) | Paths live in `focusRegions.ts`; draw via `drawSvgPath` |
| Persist PDF bytes | API / Backend (Storage) | — | Unchanged upload path |
| Field-picker UX / EF / SQL | — | — | Out of scope (D-06) |

## Gap Analysis: current chrome vs refs

| Ref affordance | Current (`patientAiPdf.service.ts`) | Gap severity |
|----------------|-------------------------------------|--------------|
| Serif chapter title + flanking rules | `drawPageBanner` uses HelveticaBold; diamond is a square | HIGH |
| Heavy accent-soft header band | `drawHeaderBand` 92px band + blue accent bar | HIGH (fights chapter hero — D-03) |
| Lettered block + thin border | `drawFichaBlockFrame` exists; border skipped on page-break | MEDIUM |
| Navy/sage alternating badges | Exists, but **any letter `E` → danger** (bugs 01.E / 02.E / 04.E) | HIGH |
| Checkbox grids | `drawCheckboxRow` exists; 02.B still uses `drawBulletList` | HIGH |
| ID two-column underline | `drawTwoColumnFields` exists | LOW |
| Side-by-side blocks (Piora\|Melhora, F\|G) | Sequential full-width frames only | HIGH |
| Soft note boxes | `drawNoteBox` exists | LOW |
| EVA 0–10 circle scale | Intensidade = text fields; `drawEvaBadge` is a number box (geral only) | HIGH |
| Body map silhouettes + legend | 02.A = bullet list of region labels | HIGH |
| Callout banners | None | MEDIUM |
| Mobilidade/Força tables | Paragraphs joined with ` · ` | HIGH |
| Ficha footer `NN \| …` | Present; accents stripped in hard-coded string | LOW |
| Evolução visual system | Patient card + fields; AI uses frames but SOAP lacks block chrome / slim header | MEDIUM |

Refs live at `.planning/phases/14-pdf-ficha-visual-polish/refs/01–04-*.png` [VERIFIED: filesystem].

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pdf-lib` | `1.17.1` (installed) [VERIFIED: package.json + npm view modified 2022-05-12] | Draw A4 PDF in browser | Locked D-02; already used |
| `StandardFonts.TimesRoman` / `TimesRomanBold` | built-in [VERIFIED: `node_modules/pdf-lib/src/api/StandardFonts.ts`] | Serif chapter titles | No fontkit; accents á/ç OK [VERIFIED: encode test] |
| `StandardFonts.Helvetica` / `HelveticaBold` | built-in | Body labels / block headers | Current default |
| `FOCUS_REGIONS` paths | `src/lib/focusRegions.ts` [VERIFIED] | Body map vector geometry | Phase 6 source of truth |

### Supporting

| Library / tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `page.drawSvgPath` | pdf-lib API [CITED: github.com/Hopding/pdf-lib PDFPage.ts] | Silhouettes + optional rounded rects | Prefer over PNG |
| `page.drawCircle` / `drawEllipse` | pdf-lib API [VERIFIED: PDFPage.ts] | EVA scale dots | Always for 02.C |
| Vite asset import | existing `logo.png` pattern | Optional static silhouette PNG | Only if vector draw proves too heavy |
| ImageMagick / rsvg-convert | host: IM 7.1.2 / rsvg 2.62.3 [VERIFIED: CLI] | One-shot SVG→PNG if assets chosen | Dev machine asset bake — not runtime |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `drawSvgPath` silhouettes | Pre-bake PNG + `embedPng` | Extra assets to sync with path edits; OK fallback |
| `StandardFonts.TimesRoman` | `@pdf-lib/fontkit` + TTF | New dep; WinAnsi still limits ★/↑; **unnecessary** for titles |
| Rounded `drawSvgPath` frames | Straight `drawRectangle` borders | CONTEXT discretion: straight OK if density matches — start straight, add radius helper if UAT demands |
| HTML→PDF / Puppeteer | — | Forbidden by D-02 |
| `@tysonjf/pdf-lib-utils` | — | Extra package; D-06 prefer none |

**Installation:** none required.

```bash
# No new packages — verify existing stack only
npm view pdf-lib version   # expect 1.17.1
npm run typecheck
```

**Version verification:** `pdf-lib@1.17.1` (2022-05-12). `@pdf-lib/fontkit@1.1.1` exists but **do not install** unless Unicode beyond WinAnsi is required (it is not for titles). [VERIFIED: npm view]

## Package Legitimacy Audit

> Phase recommends **zero** new installs.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `pdf-lib` | npm | ~9 yrs | mature | github.com/Hopding/pdf-lib | unavailable | Already installed — Approved |
| `@pdf-lib/fontkit` | npm | ~4 yrs | mature | github.com/Hopding/fontkit | unavailable | **Not recommended** — do not install |
| `@tysonjf/pdf-lib-utils` | npm | — | — | — | n/a | REMOVED from recommendation (unneeded) |

**Packages removed due to slopcheck [SLOP] verdict:** none (no candidates kept)  
**Packages flagged as suspicious [SUS]:** none  

*slopcheck unavailable — any future install must be gated `checkpoint:human-verify` and tagged `[ASSUMED]`.*

## Architecture Patterns

### System Architecture Diagram

```
┌─ PatientAiComposer (unchanged Phase 13) ─────────────────────────┐
│  selectedFieldIds + EvaluationFicha / Evolucao synthesis         │
└───────────────────────────┬──────────────────────────────────────┘
                            ▼
┌─ buildPatientAiReportPdf (patientAiPdf.service.ts) ──────────────┐
│  embedFonts: Helvetica + TimesRoman (+ logo PNG)                 │
│  slimHeader (ficha) → patient card                               │
│                                                                  │
│  drawAvaliacao / drawEvolucao                                    │
│    ├─ drawPageBanner (TimesRoman + rules)                        │
│    ├─ drawFichaBlockFrame / drawSideBySideBlocks                 │
│    ├─ drawCheckboxGrid / drawLabeledValue / drawNoteBox          │
│    ├─ drawEvaScale (circles 0–10)                                │
│    ├─ drawBodyMap (FOCUS_REGIONS via drawSvgPath + marks)        │
│    ├─ drawDataTable (Mobilidade / Força)                         │
│    └─ drawCalloutBanner (info / caution text)                    │
│                                                                  │
│  footer: NN | Ficha de Anamnese e Evolução Musculoesquelética    │
└───────────────────────────┬──────────────────────────────────────┘
                            ▼
                    Uint8Array PDF → existing Storage upload
```

### Recommended Project Structure

```
src/
├── services/
│   └── patientAiPdf.service.ts     # PRIMARY — primitives + drawAvaliacao/Evolucao polish
├── lib/
│   ├── focusRegions.ts             # READ — silhouette paths (no catalog change)
│   └── pdfFieldCatalog.ts          # UNCHANGED — picker semantics
└── assets/                         # OPTIONAL only if PNG bake chosen
    └── pdf/
        ├── body-front.png          # NOT recommended first choice
        └── body-back.png
```

No new top-level modules required unless the service file exceeds maintainability (~2000+ LOC): then extract `src/lib/pdfFichaChrome.ts` for primitives only (same commit wave OK).

### Pattern 1: Serif chapter banner (TimesRoman)

**What:** Centered `01 — ANAMNESE INICIAL` in TimesRomanBold; thin rules with center diamond.  
**When to use:** Start of each chapter 01–04 and Evolução section headers.  
**Example:**

```typescript
// Source: pdf-lib StandardFonts docs
// https://github.com/Hopding/pdf-lib/blob/master/src/api/StandardFonts.ts
const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold)
const title = toWinAnsiSafe('01 — ANAMNESE INICIAL')
const size = 16
const tw = timesBold.widthOfTextAtSize(title, size)
page.drawText(title, {
  x: PAGE_WIDTH / 2 - tw / 2,
  y,
  size,
  font: timesBold,
  color: COLORS.navy,
})
```

### Pattern 2: Body map via `drawSvgPath` (no PNG)

**What:** Draw each `FOCUS_REGIONS` path for front/back; overlay mark glyphs at region centroids; draw legend with WinAnsi-safe ASCII (`X`, `////`, `O`, `^`, `*`).  
**When to use:** Block 02.A when selected ∩ has marks.  
**Example:**

```typescript
// Source: pdf-lib operations.ts — SVG Y is flipped with scale(s, -s)
// viewBox 0 0 140 240 from BodyMapPicker
const scale = mapHeight / 240
for (const region of listFocusRegionsByView('front')) {
  const marked = markByKey.has(region.key)
  page.drawSvgPath(region.path, {
    x: originX,
    y: originY, // PDF top of figure after flip
    scale,
    color: marked ? COLORS.accentSoft : COLORS.white,
    borderColor: COLORS.navy,
    borderWidth: 0.6,
  })
}
```

**Centroid for marks:** average of absolute path points (simple parse) or precomputed map `Record<FocusRegionKey, {x,y}>` in the service — prefer a small static centroid table next to draw helper to avoid fragile path parsing [ASSUMED: centroids hand-tuned once].

### Pattern 3: Dual-column blocks with safe page breaks

**What:** When both left/right blocks are selected (02.E|F, 04.F|G, optionally 03.A|B), draw side-by-side.  
**Strategy (discretion — recommended):**
1. Measure estimated min height; if `ensureSpace` fails → `newPage` first.
2. Draw left and right into temporary y-trackers from the same `yStart`; set `ctx.y = min(leftY, rightY)`.
3. Draw outer borders after both bodies (same-page only).
4. If either body would need a mid-column page break → **fall back to stacked full-width frames** (never orphan one column across pages).

### Pattern 4: Data table (Mobilidade / Força)

**What:** Header row with soft navy fill + 5 columns; body rows with hairlines; wrap text in cells.  
**When:** 04.B / 04.C when rows filled.

### Pattern 5: EVA scale

**What:** Horizontal line + 11 `drawCircle` (r≈3.5); numbers 0–10 below; fill circles matching Agora/Melhor/Pior (or mark with ticks). Also keep `N / 10` underline fields.

### Anti-Patterns to Avoid

- **`badgeColorForLetter('E') === danger` always:** Danger only via `opts.danger` for 03.E Triagem [VERIFIED: current bug at lines 866–869].
- **Bullet lists for multi-selects:** Refs show checkbox grids; `drawBulletList` for 02.B/característica fails visual bar.
- **Assuming `drawRectangle({ borderRadius })`:** API has no `borderRadius` [VERIFIED: PDFPageDrawRectangleOptions].
- **Embedding ★ / ↑ in Helvetica:** WinAnsi encode throws — use `*` / `^` or path-drawn star/arrow [VERIFIED: encode test].
- **Inventing empty checkboxes for unfilled options:** Only render checked/filled labels (Phase 13 semantics) — blank form look is for paper refs, not export with invented empty chrome that implies false negatives. Exception: EVA scale geometry is visual affordance for *values that exist*, not fake clinical marks.
- **Touching `pdfFieldCatalog` / composer / SQL:** D-06.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom TTF pipeline | fontkit + font files | `StandardFonts.TimesRoman` | Titles + PT accents work; D-06 |
| SVG→PNG npm deps (`sharp`, `canvas`) | Runtime rasterizer package | `drawSvgPath` on `FOCUS_REGIONS` | Zero deps; paths already in repo |
| Rounded-rect library | `@tysonjf/pdf-lib-utils` | Straight border or 8-line SVG path helper | One helper ~15 LOC |
| HTML print CSS | Puppeteer | pdf-lib chrome | Locked D-02 |
| Interactive AcroForm fields | pdf-lib form API | Static draw | Deferred |

**Key insight:** The Phase 6 path catalog is already the silhouette asset — treating PDF as a second consumer of those paths beats exporting PNGs that drift.

## Common Pitfalls

### Pitfall 1: Block border lost across page breaks
**What goes wrong:** `drawFichaBlockFrame` only strokes border if `pageIndex` unchanged — content that spans pages has no enclosing card.  
**Why it happens:** Border drawn after `bodyDraw` with single-page assumption [VERIFIED: lines 937–949].  
**How to avoid:** Prefer `ensureSpace` for estimated full block height before start; if too tall, start on new page. For unavoidable splits, close border on page 1 and open a “cont.” frame on page 2 — or accept open bottom on page 1.  
**Warning signs:** Mid-block orphan rows without left/right border.

### Pitfall 2: Letter E always red
**What goes wrong:** 01.E Histórico / 02.E Piora / 04.E Palpação render as danger.  
**How to avoid:** Remove `letter === 'E'` from `badgeColorForLetter`; pass `{ danger: true }` only for Triagem.  
**Warning signs:** Green/navy chapters with red E badges.

### Pitfall 3: Dual-column mid-page break
**What goes wrong:** Left column continues on page 2 while right stays on page 1.  
**How to avoid:** Stacked fallback rule (Pattern 3).  
**Warning signs:** Misaligned Y after `Math.min` of columns that each called `newPage`.

### Pitfall 4: WinAnsi legend symbols
**What goes wrong:** Runtime throw when drawing ★/↑.  
**How to avoid:** Keep `BODY_MAP_GLYPH` ASCII; legend copy `^ = irradiacao`, `* = ponto principal`.  
**Warning signs:** Export fails only when mapa has arrow/star marks.

### Pitfall 5: Drawing empty clinical chrome
**What goes wrong:** Export shows unchecked boxes for options the patient never had — looks like false “não”.  
**How to avoid:** Still only emit filled/selected content; density comes from layout of *present* data, not blank form replication.  
**Warning signs:** PDF longer than needed with empty grids.

### Pitfall 6: Heavy header band vs chapter title
**What goes wrong:** UAT still sees “FLUXO report” not “ficha”.  
**How to avoid:** For `footerKind === 'ficha'`, use ~28–36px slim top strip (small logo) or no soft band; chapter banner is hero.  
**Warning signs:** First viewport dominated by accentSoft blue.

### Pitfall 7: Typecheck-only “done”
**What goes wrong:** Phase “passes” CI but UAT rejects again.  
**How to avoid:** Mandatory visual UAT checklist vs refs (Validation Architecture).  
**Warning signs:** Plan verification steps only list `npm run typecheck`.

## Code Examples

### Rounded rectangle via SVG path (optional)

```typescript
// Source: pdf-lib drawSvgPath (no borderRadius on drawRectangle)
// https://github.com/Hopding/pdf-lib/blob/master/src/api/operations.ts#L360
function roundedRectPath(w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  return [
    `M ${rr} 0`,
    `H ${w - rr}`,
    `Q ${w} 0 ${w} ${rr}`,
    `V ${h - rr}`,
    `Q ${w} ${h} ${w - rr} ${h}`,
    `H ${rr}`,
    `Q 0 ${h} 0 ${h - rr}`,
    `V ${rr}`,
    `Q 0 0 ${rr} 0`,
    'Z',
  ].join(' ')
}

// Draw at PDF bottom-left (x, y); path Y flipped by drawSvgPath
page.drawSvgPath(roundedRectPath(width, height, 6), {
  x,
  y: y + height,
  borderColor: COLORS.border,
  borderWidth: 0.8,
})
```

### EVA circle scale

```typescript
// Source: pdf-lib drawCircle API
const x0 = contentX + 8
const yLine = ctx.y - 6
const step = (contentW - 16) / 10
page.drawLine({
  start: { x: x0, y: yLine },
  end: { x: x0 + step * 10, y: yLine },
  thickness: 0.7,
  color: COLORS.border,
})
for (let i = 0; i <= 10; i++) {
  const cx = x0 + step * i
  const active = i === agora || i === melhor || i === pior
  page.drawCircle({
    x: cx,
    y: yLine,
    size: 3.2,
    borderColor: COLORS.navy,
    borderWidth: 0.8,
    color: active ? COLORS.navy : COLORS.white,
  })
  const label = String(i)
  const lw = font.widthOfTextAtSize(label, 7)
  page.drawText(label, { x: cx - lw / 2, y: yLine - 12, size: 7, font, color: COLORS.muted })
}
```

### Table header row

```typescript
const cols = [
  { key: 'movimento', label: 'Movimento', w: 0.28 },
  { key: 'direito', label: 'Direito', w: 0.16 },
  { key: 'esquerdo', label: 'Esquerdo', w: 0.16 },
  { key: 'dor', label: 'Dor/Sintoma', w: 0.18 },
  { key: 'observacao', label: 'Observacao', w: 0.22 },
] as const
// fill header band with COLORS.accentSoft; drawText bold navy; then hairline grid
```

## State of the Art

| Old Approach (Phase 13 polish) | Current Approach (Phase 14) | When Changed | Impact |
|--------------------------------|----------------------------|--------------|--------|
| Helvetica chapter titles | TimesRoman chapter titles | Phase 14 | Matches refs serif hero |
| Text bullets for mapa / tables | SVG silhouettes + real tables | Phase 14 | Clinical readability |
| Number badge EVA (geral) | Circle scale 0–10 on ficha | Phase 14 | Matches ref 02.C |
| Accent-soft 92px header | Slim ficha header | Phase 14 | Chapter title becomes hero |
| Assumed borderRadius | Straight or SVG rounded | Phase 13 research | Still true — no API radius |

**Deprecated/outdated:**
- Treating Phase 13 block chrome as “visual done” — UAT proved chrome ≠ ficha density.
- Installing fontkit “for beauty” — StandardFonts Times is enough.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hand-tuned region centroids are accurate enough for mark glyphs | Pattern 2 | Marks sit slightly off region — still readable |
| A2 | Stacked fallback for dual-column page breaks is acceptable vs complex column continuation | Pattern 3 | Slightly less dense on long Piora/Melhora |
| A3 | Showing only filled checkboxes (not full blank grids) still reads as “ficha” | Pitfall 5 | UAT may ask for empties — push back with D-01 “only selected/filled” |
| A4 | Straight borders OK for first UAT pass | Discretion | May need rounded SVG path polish in same phase |
| A5 | Evolução SOAP should wrap each session in `drawFichaBlockFrame` + slim header | D-05 | Extra pages — still better than plain fields |

## Open Questions

1. **Blank unchecked options in export?**
   - What we know: D-01 says only selected/filled content; refs show full blank forms.
   - What's unclear: Whether UAT expects empty checkbox rows for unfilled options.
   - Recommendation: Do **not** invent empties; densify filled content. If UAT insists, add opt-in later — out of Phase 14 default.

2. **Centroid table ownership**
   - What we know: Paths exist; centroids do not.
   - Recommendation: Static map in PDF service (Claude discretion); do not change `focusRegions.ts` API unless needed.

3. **Callout icon stickers**
   - What we know: Deferred exact icons; text banners required.
   - Recommendation: Soft fill + bold title line; optional simple `drawCircle` + “i” text — no PNG icon pack.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | typecheck | ✓ | v26.4.0 / existing | — |
| `pdf-lib` | PDF draw | ✓ | 1.17.1 | — |
| Browser Canvas / OffscreenCanvas | Runtime SVG→PNG | ✓ (browser) | — | Prefer `drawSvgPath` (no canvas) |
| `rsvg-convert` | Optional PNG bake | ✓ | 2.62.3 | Not needed if vector |
| ImageMagick `convert` | Optional PNG bake | ✓ | 7.1.2 | Not needed if vector |
| `@pdf-lib/fontkit` | Custom TTF | ✗ (not installed) | — | Use StandardFonts Times |
| Puppeteer | HTML PDF | ✗ | — | Forbidden |

**Missing dependencies with no fallback:** none  
**Missing dependencies with fallback:** fontkit → StandardFonts TimesRoman

Step 2.6: external tools for optional asset bake are present; runtime path needs none beyond current Vite SPA.

## Validation Architecture

> `workflow.nyquist_validation` absent in `.planning/config.json` → treat as **enabled**.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None dedicated (no vitest/jest in package.json) [VERIFIED] |
| Config file | none |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-26.1 | Chapter titles TimesRoman + banner | manual visual UAT | — | ❌ Wave 0 = checklist |
| REQ-26.2 | Badge colors navy/sage; 03.E red only | unit (pure helpers) optional | `npm run typecheck` | ❌ optional |
| REQ-26.3 | Multi-selects use checkbox grid | manual visual | — | ❌ |
| REQ-26.4 | Side-by-side when both selected | manual visual | — | ❌ |
| REQ-26.5 | Table + EVA + body map render | manual visual + smoke export | typecheck | ❌ |
| REQ-26.6 | Evolução chrome; no invented data | manual + assert gates unchanged | typecheck | ❌ |
| Regression | Catalog/picker/SQL untouched | diff review | `git diff --stat src/lib/pdfFieldCatalog.ts` | — |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run lint`
- **Phase gate:** Visual UAT checklist green + typecheck/lint before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] No automated PDF snapshot tests — **accept manual UAT** (pdf-lib canvas screenshots not in stack)
- [ ] Optional: extract pure helpers (`badgeColorForLetter`, `roundedRectPath`, table col widths) for tiny unit tests **only if** planner adds a test runner — **not required**; current repo has no vitest
- [ ] **Visual UAT checklist (mandatory):**
  1. Export avaliação with blocks spanning 01–04 filled → compare side-by-side to `refs/01–04`
  2. 02.A shows anterior/posterior silhouettes + legend + marks
  3. 02.C shows circle scale 0–10
  4. 02.E|F side-by-side when both selected; stacked when page-break would split
  5. 03.E red only; 01.E navy
  6. 04.B/C shaded header tables
  7. Header band not dominating chapter title
  8. Evolução uses same chrome; empty AI fields omitted
  9. Deselecting a picker field removes it from PDF
  10. No runtime throw on marks with arrow/star symbols

## Security Domain

> `security_enforcement` not set to false → included. Surface is client PDF polish only.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Unchanged Supabase session |
| V3 Session Management | no | — |
| V4 Access Control | tangential | Keep `canWrite` gating in composer; PDF builder still receives only authorized client data |
| V5 Input Validation | yes | `toWinAnsiSafe`; never render unselected fields; no new user input parsers |
| V6 Cryptography | no | — |

### Known Threat Patterns for pdf-lib client export

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Sensitive fields exported to client PDF | Information Disclosure | Phase 13 picker + sensitive defaults — do not regress |
| Oversized path draw DoS | Denial of Service | Fixed 30-region catalog; bounded table rows from ficha |
| Fontkit/TTF supply chain | Tampering | Do not add fontkit (D-06) |
| Invented clinical content | Spoofing | Omit empty; never fabricate marks/scores |

## Sources

### Primary (HIGH confidence)
- Local `node_modules/pdf-lib` — `PDFPageOptions.ts` (no borderRadius), `StandardFonts.ts`, `operations.ts` drawSvgPath Y-flip, `PDFPage.ts` drawCircle
- `src/services/patientAiPdf.service.ts` — current chrome inventory
- `src/lib/focusRegions.ts` + `BodyMapPicker.tsx` — silhouette paths viewBox `0 0 140 240`
- `.planning/phases/14-pdf-ficha-visual-polish/refs/01–04-*.png` — visual targets
- `.planning/phases/14-pdf-ficha-visual-polish/14-CONTEXT.md` — locked D-01..D-06
- `npm view pdf-lib` / `npm view @pdf-lib/fontkit` — versions

### Secondary (MEDIUM confidence)
- Hopding pdf-lib docs (PDFPage / PDFDocument) via WebSearch — TimesRoman + embedPng + drawSvgPath examples [CITED: github.com/Hopding/pdf-lib-docs]

### Tertiary (LOW confidence)
- Exact dual-column page-break UX preference beyond stacked fallback [ASSUMED A2]
- Hand-tuned centroids for marks [ASSUMED A1]

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — installed pdf-lib APIs verified; no new packages
- Architecture: **HIGH** — single-file brownfield extension with clear primitives
- Pitfalls: **HIGH** — derived from current code bugs + Phase 13 research + encode tests

**Research date:** 2026-09-21  
**Valid until:** 2026-10-21 (stable pdf-lib; visual UAT may refine density tokens)

## RESEARCH COMPLETE
