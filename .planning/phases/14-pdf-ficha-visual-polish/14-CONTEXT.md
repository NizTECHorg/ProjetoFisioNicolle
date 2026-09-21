# Phase 14 — PDF ficha visual polish

**Gathered:** 2026-09-21  
**Status:** Ready for planning  
**Source:** User UAT feedback Phase 13 + `/gsd-plan-phase` (export works; PDF still too plain — rebuild visual to match ficha refs)

<domain>
## Phase Boundary

Dedicated phase to make exported **Avaliação** (and Evolução where applicable) PDFs **beautiful, dense, and visually explanatory** — matching the printed ficha reference pages 01–04. Functional export/picker/kinds from Phase 13 stay; this phase is **layout, typography, chrome, and clinical visual affordances** only.

Phase 13 shipped selective export + block chrome, but UAT judged the PDF still “muito simples e feio” vs the reference images.

</domain>

<decisions>
## Implementation Decisions

### D-01 — Goal: visual parity with ficha refs (not wireframe)
PDF must read like the clinical forms in `refs/` (01 Anamnese, 02 Sintomas, 03 Função/Segurança, 04 Avaliação/Plano): lettered blocks, chapter titles, checkbox grids, text boxes, tables, intensity scale, body-map region, callouts — **only selected/filled content** (keep Phase 13 picker semantics).

### D-02 — Single render engine: still pdf-lib client-side
Stay on `pdf-lib` in `patientAiPdf.service.ts` (no Puppeteer/server HTML). Research must solve pdf-lib limits (no true borderRadius, Helvetica vs serif titles, body silhouettes) with embed assets / Times-Roman / approximate chrome — without inventing clinical data.

### D-03 — Design tokens from refs (FLUXO-adapted)
- Navy `#1A365D` / slate blue borders `#B8C9DE`-ish / sage green `#5F7F6B` alternating badges
- Danger red only for Triagem (03.E)
- Soft fills for text areas; thin borders; generous padding
- Footer: `NN | Ficha de Anamnese e Evolução Musculoesquelética`
- Minimize or restyle the heavy FLUXO accent-soft header band on ficha pages so the chapter title is the hero (logo small OK)

### D-04 — Layout patterns required
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

### D-05 — Evolução PDF gets same visual system
Apply the same block chrome, typography, and callouts to Evolução (session SOAP + AI sections) so both export kinds feel like one product.

### D-06 — Out of scope
- Changing field-picker UX / kinds / EF / SQL
- Pixel-perfect print match to clinic paper (aim: clearly recognizable ficha aesthetic)
- Redesign of Avaliações CRUD form UI
- New npm packages unless research proves necessary (prefer StandardFonts + PNG assets)

### Claude's Discretion
- Exact asset pipeline for body silhouettes (export PNG from existing SVG vs redraw paths)
- Whether to embed a TTF for serif titles via fontkit (only if research shows StandardFonts Times insufficient)
- Page-break strategy inside multi-column blocks
- How close to approximate rounded corners (straight borders acceptable if density/spacing match)

</decisions>

<canonical_refs>
## Canonical References

### Visual refs (mandatory)
- `.planning/phases/14-pdf-ficha-visual-polish/refs/01-anamnese-inicial.png`
- `.planning/phases/14-pdf-ficha-visual-polish/refs/02-comportamento-sintomas.png`
- `.planning/phases/14-pdf-ficha-visual-polish/refs/03-funcao-contexto-seguranca.png`
- `.planning/phases/14-pdf-ficha-visual-polish/refs/04-avaliacao-plano.png`

### Code
- `src/services/patientAiPdf.service.ts` (primary)
- `src/lib/pdfFieldCatalog.ts`
- `src/components/patients/PatientFocusAreasPanel.tsx` / `BodyMapPicker.tsx` / `src/lib/focusRegions.ts` (silhouette source)
- `.planning/phases/13-pdf-export-avaliacao-evolucao/13-CONTEXT.md` (picker + selective semantics — do not regress)

</canonical_refs>

<specifics>
## Specific Ideas

- User: “planeje uma fase inteira só para deixar o pdf bonito e legível… siga as imagens de referência”
- Phase 13 UAT: export + selection OK; visual still fails the brand/clinical bar
- Prefer dense clinical form look over sparse “report” look

</specifics>

<deferred>
## Deferred Ideas

- Interactive PDF form fields
- Clinic logo swap per account
- Exact COFFITO disclaimer icons as SVG stickers beyond text callouts

</deferred>

---

*Phase: 14-pdf-ficha-visual-polish*  
*Context gathered: 2026-09-21*
