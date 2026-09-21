---
phase: 13
slug: pdf-export-avaliacao-evolucao
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-20
---

# Phase 13 — UI Design Contract

> Visual/interaction contract for PDF export refactor (Avaliação | Evolução + field-picker). Extends Phase 11 Resumo IA chrome; PDF visual follows ficha refs + FLUXO tokens.

**Phase goal:** No Resumo IA, exportar PDF em seções **Avaliação** e **Evolução**, com seletor de campos preenchidos (todos on; desmarcar) e PDF estilo ficha só com selecionados. Evolução multi-sessão + IA.

**Sources:** `13-CONTEXT.md` D-01–D-07; `13-RESEARCH.md`; tokens `src/index.css`; Phase 11 UI-SPEC; refs em `refs/`.

**Do not restyle** `Button`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `PageHeader`, Toast, AppShell. Do **not** redesign aba Avaliações CRUD. Do **not** add shadcn.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Component library | reuse `src/components/ui/*` |
| Icon library | lucide-react — optional `FileDown` / `CheckSquare`; prefer text CTAs |
| Font (UI) | Plus Jakarta Sans (`--font-sans`) |
| Font (PDF) | Helvetica (pdf-lib WinAnsi) — no custom embed this phase |

**Surfaces:** only `PatientAiComposer` (mode Exportar PDF) + Modal field-picker + list badges. No new route/tab.

---

## Spacing Scale

Same as Phase 11:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label |
| sm | 8px | Scope toggle gap; checkbox rows |
| md | 16px | Modal body padding; composer gap |
| lg | 24px | Section stack |
| touch | min 44×44 | Scope buttons, checkboxes hit area, CTAs |

---

## Typography (UI)

| Role | Size | Weight |
|------|------|--------|
| Label / Body | 14px (`text-sm`) | 400 |
| Eyebrow | 12px uppercase | 600 |
| Modal title | 18–20px | 600 |
| Hint | 12px muted | 400 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant | `#f3f5f8` canvas | Page |
| Secondary | `#ffffff` / `#0b1d36` forest | Surfaces; selected scope |
| Accent | `#2f7dff` | Focus; soft kind badges |
| Destructive | `#dc4a4a` | Errors only |
| Sensitive hint | muted + optional soft amber well | Bloco marcado “sensível” no picker |

**PDF (D-05):** map ref navy/sage → FLUXO `forest` / accent; block borders via `drawRectangle` (no borderRadius in pdf-lib); lettered headers; omit unselected blocks entirely.

---

## Copywriting Contract (pt-BR)

| Element | Copy |
|---------|------|
| Mode B (unchanged intent) | Exportar avaliação (PDF) |
| Scope A | **Avaliação** |
| Scope B | **Evolução** |
| Evaluation placeholder | Selecione a avaliação |
| Evaluation latest | Mais recente |
| Sessions label | Sessões |
| Sessions hint | Selecione uma ou mais sessões |
| Picker title | Campos no PDF |
| Picker helper | Só campos preenchidos. Desmarque o que o cliente não deve ver. |
| Picker select all | Marcar todos |
| Picker clear sensitive | Desmarcar sensíveis |
| Picker confirm | Continuar / Exportar PDF |
| Picker cancel | Voltar |
| CTA export | Exportar PDF |
| List heading | Avaliações salvas *(keep)* |
| Kind badge `avaliacao` | Avaliação |
| Kind badge `evolucao` | Evolução |
| Kind badge `geral` (legacy) | Geral |
| Kind badge `sessao` (legacy) | Sessão |
| Toast export success | PDF exportado |
| Toast export error | Não foi possível exportar o PDF. Tente de novo. |
| Toast AI unavailable | IA indisponível no momento. |
| Toast need sessions | Selecione ao menos uma sessão. |
| Toast need fields | Selecione ao menos um campo. |
| Empty export (!canWrite) | Composer export permanece oculto |

---

## Interaction Contract

### Flow — Avaliação
1. Scope **Avaliação** → select evaluation (incl. Mais recente)
2. CTA Exportar → open **Modal** field-picker (filled blocks only; all checked)
3. Optional: Desmarcar sensíveis / uncheck blocks
4. Confirm → build PDF client-side → upload → list refresh

### Flow — Evolução
1. Scope **Evolução** → multi-select sessions (≥1)
2. CTA Exportar → call EF `mode: evolucao` (loading on CTA)
3. On success → Modal picker over session fields + AI sections (all on)
4. Confirm → build PDF → upload with `kind: evolucao`

### Rules
- Default: **all filled items selected**
- Empty catalog → toast / disable confirm (no blank PDF)
- `!canWrite` → no export UI (Phase 11)
- Mobile: Modal full-height scroll; session chips wrap; no inline mega-checklist in composer
- Granularity: **lettered blocks** (~27 ficha) + SOAP/session leaves + AI sections (A/B/C synthesis) — not ~90 leaf fields

### Density
- Picker groups by ficha page/block header (01 Anamnese, 02 Sintomas, …)
- Checkboxes left; sensitive blocks show small “Sensível” caption

---

## PDF Visual Contract (export output)

| Element | Spec |
|---------|------|
| Page | A4; FLUXO header/logo as Phase 11/12 |
| Blocks | Lettered title (A, B, …); thin border; padding; only selected |
| Checkboxes source | Render as bullets / selected labels only |
| Tables (mobilidade/força) | Compact rows `D: … · E: …` if block selected |
| Body map | Omit drawing unless selected and data exists; no fake silhouette marks |
| Empty selected block | Skip (no empty box) |
| Invented data | Forbidden |

---

## Responsive

| Viewport | Behavior |
|----------|----------|
| <640px | Scope as full-width stacked buttons; Modal edge-to-edge; multi-select as checkbox list |
| ≥640px | Scope segmented control; Modal max-w-lg centered |

---

## Out of Scope (UI)

- Templates of exclusion preferences
- Watermark toggle
- Side-by-side two evaluations
- Redesign of Avaliações tab form

---

## Checker Sign-Off

- [ ] Spacing / type / color aligned Phase 11
- [ ] Copy covers Avaliação \| Evolução + picker + kinds
- [ ] Mobile Modal usable
- [ ] PDF contract references refs without inventing fields

**Approval:** pending (auto-generated to unblock plan-phase; refine in execute if needed)
