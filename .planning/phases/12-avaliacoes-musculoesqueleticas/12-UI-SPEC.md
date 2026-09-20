---
phase: 12
slug: avaliacoes-musculoesqueleticas
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-20
---

# Phase 12 — UI Design Contract

> Visual/interaction contract for aba **Avaliações** (ficha musculoesquelética 01–04). Aligns with Phase 7/11 ficha chrome; planner discretion (discuss-phase skipped).

**Phase goal:** Aba própria Avaliações; formulário multi-bloco (refs 01–04); CRUD parcial; dashboard → `?aba=avaliacoes&nova=1`; PDF export alinhado ao documento.

**Sources:** CONTEXT D-01–D-07; RESEARCH field inventory + UI recommendation; PATTERNS.md; tokens `src/index.css`; refs in `refs/*.png`.

**Do not restyle** `Button`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `PageHeader`, `ToastViewport`, or AppShell. Do **not** add shadcn. Do **not** remount evaluation CRUD inside Resumo IA.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none — reuse `src/components/ui/*` |
| Icon library | lucide-react — optional only; prefer text CTAs |
| Font | Plus Jakarta Sans (`--font-sans`) |

**New surface:** ficha tab **Avaliações** (`?aba=avaliacoes`) + enriched `PatientEvaluationPanel` / `PatientEvaluationEditorForm`. No new route. No AppShell nav item.

---

## Spacing Scale

Same multiples of 4 as Phase 7/11:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Letter badge padding; icon-to-label |
| sm | 8px | Checkbox grid gaps; page-section toggle gap |
| md | 16px | Block card padding (`p-4`); list row gap |
| lg | 24px | Page section stack (`space-y-6`) |
| xl+ | — | Unused |

Exceptions: primary CTAs and icon actions min **44×44** (`min-h-11`). Tablist keep `overflow-x-auto`.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label / Body | 14px (`text-sm`) | 400 | 1.5 |
| Block header | 12px (`text-xs`) | 600 | 1.2 — uppercase tracking |
| Heading | 20px (`text-xl`) | 600 | 1.2 |
| Display | unused | — | — |

Hints `text-xs text-muted`. Do **not** copy paper-ficha serif from reference PNGs.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant | `#f3f5f8` (`canvas`) | Page background |
| Secondary | `#ffffff` / `#0b1d36` (`surface` / `forest`) | Block cards; selected page tab; primary Salvar |
| Accent | `#2f7dff` | Letter badge well (`bg-accent-soft`); focus rings — not primary buttons |
| Line | border-line | Block borders |
| Destructive | `#dc4a4a` | Excluir confirm + error toasts |

**Focal point:** composer Salvar when `canWrite`; list when `!canWrite`.

---

## Block Chrome (FLUXO)

Reference PNGs use lettered blocks A–H with borders. Adapt — do not clone paper:

```
┌─ [A] ─────────────────────────────────┐
│  BLOCO A · Título                     │  ← text-xs font-semibold uppercase tracking-[0.14em] text-accent
│  …fields…                             │  ← rounded-2xl border border-line bg-surface p-4
└───────────────────────────────────────┘
```

- **Letter badge:** square or short pill with letter (A–H) in accent-soft well; title beside it.
- **Page chrome:** four page sections (01 Anamnese · 02 Sintomas · 03 Função · 04 Avaliação/Plano) as segmented control or accordion — one page visible at a time preferred for perf.
- **Checkboxes:** native or existing UI pattern in wrap grids; tables for mobilidade/força as simple row grids (not heavy data-grid libs).
- **Body map (02-A):** reuse FocusAreas SVG paths locally; selected regions store in `ficha` only — no chart sync.

---

## Copywriting Contract

All pt-BR. No English toasts.

| Element | Copy |
|---------|------|
| Tab label | **Avaliações** |
| Panel eyebrow | Avaliações |
| Panel helper | Registre fichas musculoesqueléticas datadas. Salve com campos em branco e complete depois. |
| CTA create | Nova avaliação |
| CTA save | Salvar |
| CTA cancel | Cancelar |
| List empty heading | Nenhuma avaliação ainda. |
| Empty body (canWrite) | Crie a primeira avaliação — só a data é obrigatória. |
| Empty body (!canWrite) | Nenhuma avaliação nesta ficha. |
| Badge inicial | Inicial |
| Completeness hint | Parcial · Completa (heuristic: any ficha leaf filled beyond date) |
| Delete confirm title | Excluir avaliação? |
| Delete confirm body | Esta avaliação será removida da ficha. Esta ação não pode ser desfeita. |
| Delete confirm / cancel | Excluir · Voltar |
| Toast create | Avaliação salva |
| Toast update | Avaliação atualizada |
| Toast delete | Avaliação removida |
| Toast forbidden | Você não tem permissão para esta ação. |
| Page 01 | 01 · Anamnese inicial |
| Page 02 | 02 · Comportamento dos sintomas |
| Page 03 | 03 · Função, contexto e segurança |
| Page 04 | 04 · Avaliação e plano |
| Required date label | Data da avaliação |
| PDF mode label (Resumo IA) | Exportar avaliação (PDF) |
| PDF scope avaliação | Avaliação salva |
| PDF pick placeholder | Selecione a avaliação |
| PDF scope sessão | Por sessão |
| PDF latest option | Mais recente |

Dashboard shortcut: keep picker chrome; after select navigate — no “editor” step copy in Modal.

---

## Interaction Contract

1. **Tab order:** after **Evoluções**, before **Resumo IA** (clinical flow).
2. **Deep link:** `?aba=avaliacoes&nova=1` opens create composer once; parent clears `nova` via `replace` after open.
3. **Partial save:** Salvar enabled when `performedOn` valid; empty blocks OK (D-03).
4. **canWrite:** hide Nova/Editar/Excluir/Salvar when `!canWrite` (unmount, do not disable-looking). Fail-closed default `false` on panel.
5. **Resumo IA:** no Avaliação estruturada embed; PDF mode prefers selecting a saved evaluation (D-06, D-07).
6. **Legacy slug:** `?aba=avaliacao` still opens Resumo IA only — never the new Avaliações tab.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | — |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
