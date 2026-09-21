---
phase: 14
slug: pdf-ficha-visual-polish
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-21
---

# Phase 14 — UI Design Contract (PDF output)

> Design contract for **exported PDF pages**, not SPA chrome. SPA composer/picker unchanged (Phase 13).

**Phase goal:** PDF Avaliação/Evolução looks like clinical ficha refs 01–04 — dense, lettered blocks, visual affordances.

**Sources:** `14-CONTEXT.md` D-01–D-06; `14-RESEARCH.md`; refs in `refs/`.

**Do not** restyle SPA `Button`/`Modal`/tabs. **Do not** change field-picker behavior.

---

## PDF Design System

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#1A365D` | Titles, primary badges A/C/E/G |
| Sage | `#5F7F6B` | Alternate badges B/D/F/H |
| Danger | `#B93C3C` | Triagem 03.E only |
| Border | `#B8C9DE` | Block outlines |
| Soft fill | `#F3F5F8` / white | Note boxes |
| Ink | `#102038` | Body |
| Chapter font | Times-Roman Bold ~14–16pt | `01 — ANAMNESE…` |
| Body font | Helvetica 9–10pt | Labels/values |
| Footer | 8pt muted | `NN \| Ficha de Anamnese…` |

---

## Layout Contracts

1. **Chapter header** — centered uppercase title; thin rule with center diamond; no competing FLUXO soft band (logo small or omitted on ficha pages).
2. **Block card** — letter square badge + `BLOCO X — TITLE` + thin border; padding ~10pt; gap between blocks ~12–14pt.
3. **Short field** — `Label:` + value + underline.
4. **Long field** — bordered note box.
5. **Multi-select** — checkbox grid (filled only when selected in data); wrap rows.
6. **Dual column** — ID split; Piora\|Melhora side-by-side when both selected; F\|G side-by-side when both selected; stack on page-break.
7. **Tables** — Mobilidade/Força: shaded header row + grid lines.
8. **EVA** — numeric fields + 0–10 circle scale with filled circle at value.
9. **Body map** — anterior/posterior silhouettes from FOCUS_REGIONS paths + marks + legend.
10. **Callouts** — soft info banner / red caution for triagem notes.

---

## Out of Scope

- Blank form grids for unchecked options
- Pixel-identical print to clinic paper
- New SPA screens

---

## Checker Sign-Off

- [ ] Tokens match navy/sage/danger
- [ ] Layout contracts cover D-04 list
- [ ] Evolução included

**Approval:** pending (auto for plan-phase)
