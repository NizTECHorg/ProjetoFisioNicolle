---
phase: 11
slug: resumo-ia
status: draft
shadcn_initialized: false
preset: none
created: 2026-09-19
---

# Phase 11 — UI Design Contract

> Concise visual/interaction contract for Resumo IA. Aligns with Phase 7 ficha chrome; planner discretion (discuss-phase skipped).

**Phase goal:** Na ficha, a aba **Resumo IA** concentra gerar (IA) o texto de **Resumo do paciente** e exportar PDFs (geral ou por sessão) listados em **Avaliações salvas**.

**Sources:** CONTEXT D-01–D-07; RESEARCH UI composition; tokens from `src/index.css`; tab chrome from `PatientProfileHeader.tsx`; spacing/type/color from `07-UI-SPEC.md`.

**Do not restyle** `Button`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `PageHeader`, `ToastViewport`, or AppShell. Do **not** add shadcn or a second AI form. Do **not** put generate CTAs on the **Resumo** tab (read-only destination).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none — reuse `src/components/ui/*` |
| Icon library | lucide-react — optional `Sparkles` / `FileDown` / `Trash2` only if needed; prefer text CTAs |
| Font | Plus Jakarta Sans (`--font-sans`) |

**New surface:** ficha tab **Resumo IA** (`?aba=resumo-ia`) + `PatientResumoIaPanel`. No new route. No AppShell nav item.

---

## Spacing Scale

Same multiples of 4 as Phase 7:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label |
| sm | 8px | Mode toggle gap (`gap-2`); label-to-control |
| md | 16px | Card/list padding (`p-4`); composer inner gap |
| lg | 24px | Section stack (`space-y-6`) |
| xl+ | — | Unused |

Exceptions: mode buttons and icon actions min **44×44** (`min-h-11`). Tablist keep `overflow-x-auto`.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label / Body | 14px (`text-sm`) | 400 | 1.5 |
| Heading | 20px (`text-xl`) | 600 | 1.2 |
| Display | unused | — | — |

Eyebrow uppercase tracking stays `text-xs font-semibold` (existing ficha panel pattern). Hints `text-xs text-muted`.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant | `#f3f5f8` (`canvas`) | Page background |
| Secondary | `#ffffff` / `#0b1d36` | Surfaces; selected mode (`bg-forest text-white`); primary CTAs |
| Accent | `#2f7dff` | Kind badge soft well; focus rings — not primary buttons |
| Destructive | `#dc4a4a` | Excluir confirm + error toasts |

**Focal point:** composer primary CTA when `canWrite`; list when `!canWrite`.

---

## Copywriting Contract

All pt-BR. No English toasts.

| Element | Copy |
|---------|------|
| Tab label | **Resumo IA** |
| Panel eyebrow | Resumo IA |
| Panel helper | Gere o resumo clínico ou exporte PDFs. O texto gerado aparece em Resumo do paciente. |
| Mode A | Escrever resumo (IA) |
| Mode B | Exportar avaliação (PDF) |
| Hint label | Orientação opcional (opcional) |
| Hint placeholder | Ex.: enfatize evolução da dor lombar nas últimas sessões |
| CTA generate | Gerar resumo |
| CTA export | Exportar PDF |
| PDF scope geral | Avaliação geral |
| PDF scope sessão | Por sessão |
| Session placeholder | Selecione a sessão |
| List heading | Avaliações salvas |
| Kind geral | Geral |
| Kind sessão | Sessão |
| Empty heading | Nenhuma avaliação salva. |
| Empty body (canWrite) | Exporte uma avaliação geral ou por sessão para ver aqui. |
| Empty body (!canWrite) | _(omit body or)_ Nenhuma avaliação salva nesta ficha. |
| Abrir / Baixar | Abrir · Baixar |
| Delete | Excluir |
| Delete confirm title | Excluir avaliação? |
| Delete confirm body | O PDF será removido da ficha. Esta ação não pode ser desfeita. |
| Delete confirm | Excluir |
| Delete cancel | Voltar |
| Toast generate success | Resumo atualizado |
| Toast generate error | Não foi possível gerar o resumo. Tente de novo em instantes. |
| Toast unavailable | IA indisponível no momento. |
| Toast forbidden | Você não tem permissão para esta ação. |
| Toast misconfigured | A IA no servidor está incompleta. Confira GEMINI_API_KEY nas Edge Functions. |
| Toast export success | Avaliação exportada |
| Toast export error | Não foi possível exportar o PDF. Tente de novo. |
| Toast delete success | Avaliação excluída |
| Subsection | Avaliação estruturada |
| Legacy details summary | Importar avaliação de PDF (IA) — legado |
| Dashboard hub label (if updated) | Resumo IA |

---

## Interaction States

| State | Behavior |
|-------|----------|
| Default / canWrite | Mode toggle + CTA visible; list with Excluir |
| !canWrite | Hide generate/export/delete entirely — do not disable |
| Loading generate/export | CTA busy; prevent double submit |
| PDF + sessão | Session Select required before export |
| Error | Toast PT; composer stays open |
| Legacy `aba=avaliacao` | Same panel as `resumo-ia` |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| < md | Mode toggle wraps; full-width CTAs; list stacks |
| ≥ md | Composer row comfortable; list rows with actions right |

Safe-area: inherit Phase 10 Modal/ConfirmDialog — do not regress.

---

## Accessibility

- Mode buttons `aria-pressed`
- Tab `aria-selected` for Resumo IA
- Icon-only actions need `aria-label` (Abrir, Baixar, Excluir)
- ConfirmDialog focus trap unchanged
- Do not rely on color alone for kind (text badge Geral/Sessão)

---

## Discretion locks

- Focus areas from AI: **additive only** (no wipe)
- Tab slug: **`resumo-ia`** + accept legacy **`avaliacao`**
- Physical PDF import stays in `<details>` — does not block composer
