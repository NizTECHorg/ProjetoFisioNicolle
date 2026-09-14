# Phase 6: Silhueta de áreas de foco - Research

**Researched:** 2026-09-14
**Domain:** React inline SVG body map + existing `patient_focus_areas` write path (clinic SPA, no new packages)
**Confidence:** HIGH (stack, schema-from-code, RLS, panel pattern verified in-repo + MDN/W3C/Postgres/React docs); MEDIUM (live DDL of `patient_focus_areas` is not in git — columns inferred from SELECT); LOW (exact live row count / leftover demo labels)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### O que substitui
- **D-01:** Remover o stick figure atual (`BodyFocus` em `PatientPage.tsx`) e a lista morta ao lado. O card continua com o título **Áreas de foco**.
- **D-02:** A interação vive **neste card do Resumo**. Sem aba nova, sem rota nova, sem widget de terceiro (Jotform / Body Part Selector).

### Forma e referência
- **D-03:** Silhueta **humana** vista de **frente e de costas**, lado a lado — layout da segunda imagem (referência). Não copiar musculatura, cores navy `#0A1651` / laranja `#FF7D16`, nem o chrome do widget (Build/Settings, Submit, Male, etc.).
- **D-04:** Visual **simples e minimalista**: contorno + preenchimento suave nas cores da clínica (`forest`, `accent` `#2f7dff` para hover/seleção). Sem textura 3D, sem gênero configurável nesta fase (uma silhueta só).

### Interação
- **D-05:** Hover numa região por **500ms** abre uma **abinha** (chip/tab pequeno) com o nome da parte em português. Sair da região+abinha fecha a abinha. Não abrir no hover imediato (evita flicker).
- **D-06:** **Clicar a abinha** marca ou desmarca aquela parte como área de foco. Clique na silhueta sozinho **não** marca — só a abinha. Várias partes ao mesmo tempo.
- **D-07:** Região marcada fica destacada na silhueta (fill accent suave + stroke). Desmarcada volta ao estado default. Empty: silhueta sem destaques + copy **Sem áreas registradas.** (já existente).

### Dados
- **D-08:** Catálogo **fixo** de regiões (paths SVG nomeados). Não é texto livre digitado no hover. Labels em português.
- **D-09:** Persistência em `public.patient_focus_areas` (já tem RLS `can_read_patient` / `can_write_patient`). Sem tabela nova se um `region_key` (ou equivalente) couber na existente. Sem mock.
- **D-10:** Só `canWrite` marca/desmarca (esconder a abinha / pointer). Empresa em consulta de colega **vê** as áreas salvas, não edita. RLS continua autoridade.

### Claude's Discretion
- Lista exata de regiões (cabeça, pescoço, ombro E/D, etc.) — cobrir tronco e membros de forma clínica útil, sem granularidade de cada músculo da referência.
- Se a tabela atual só tem `label` texto, adicionar `region_key` estável via SQL Editor (não `supabase db push`) e mapear labels a partir do catálogo.
- Extrair o SVG para um componente em `src/components/patients/` (não deixar o mapa inline gigante em `PatientPage.tsx`).
- Touch: no mobile, tap na região pode abrir a abinha (hover não existe); segundo tap na abinha marca. Detalhe no UI-SPEC.
- Lista textual ao lado: só se caber sem apertar o card; a fonte da verdade visual é a silhueta.
- Camadas: types → schema → service → hook → componente. Named exports, single quotes, no semicolons.
- Hide write controls; não desabilitar botões que parecem clicáveis.

### Deferred Ideas (OUT OF SCOPE)
- Seletor de sexo/tipo de corpo (Male/Female da referência)
- Granularidade muscular da referência (peitoral, deltoide, etc. como músculos isolados)
- Mapa 3D, zoom, ou marcação de ponto livre (x,y) fora do catálogo
- Áreas de foco fora do Resumo (avaliação, evolução, PDF)
- Temas de cor configuráveis pelo usuário (Body Color / Hover Color / Selection Color da referência)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-18 | Silhueta de áreas de foco — marcar partes do corpo na ficha | Inline SVG frente+costas in `PatientFocusAreasPanel`; 500ms hover chip; toggle persist in `patient_focus_areas`; `canWrite` hides write; no third-party widget |
| REQ-18.1 | Card shows human silhouette front and back instead of stick figure | Delete `BodyFocus()` + hardcoded accent dots; two simple filled outlines side by side |
| REQ-18.2 | Hover 0.5s on a region opens a clickable abinha with the part name | JS `setTimeout(500)` open; region+chip as one hover group; no native `title` tooltip |
| REQ-18.3 | Clicking the abinha marks or unmarks that part as a focus area | INSERT row on mark, DELETE on unmark; click on path alone must not write |
| REQ-18.4 | Several parts can be marked at once; silhouette highlight = saved state | Unique `(patient_id, region_key)`; highlight from `focusAreas` after `invalidatePatient` |
| REQ-18.5 | Persisted in `patient_focus_areas` with existing ficha RLS; no mock | ALTER add `region_key`; reuse Phase 3 policies; SQL Editor apply path |
| REQ-18.6 | Who cannot write the ficha (empresa viewing a colleague) only sees; does not mark | Hide abinha/pointer when `!canWrite`; RLS `can_write_patient` is the wall |
</phase_requirements>

## Summary

The Resumo card **Áreas de foco** is a decorative stick-figure SVG (`BodyFocus` in `PatientPage.tsx`) with two hardcoded accent dots and a read-only list from `patient_focus_areas`. There is **no write function**. Phase 3 already enabled RLS SELECT/INSERT/UPDATE/DELETE on that table via `private.can_read_patient` / `private.can_write_patient`. This phase replaces the stick figure with a **simple human silhouette (front + back)**, adds a **500ms hover chip (“abinha”)**, and wires **toggle persistence** through the existing patients service/hook stack. No new npm packages. No Jotform / Body Part Selector.

The live table has **no `region_key` in application code**. `FocusRow` and `getPatientById` only select `id, label, is_active, sort_order`. Labels are free text and cannot be the stable identity of a catalog path (front vs back would collide on “Ombro direito”). Add `region_key` with a partial unique index; keep `label` as a denormalized copy from the catalog. Presence of a row = marked; unmark **deletes** the row so empty state stays `focusAreas.length === 0` plus the existing copy **Sem áreas registradas.**

**Primary recommendation:** Hand-roll an inline SVG map (non-overlapping paths, `pointer-events: fill`, clinic tokens). Extract `PatientFocusAreasPanel` + `src/lib/focusRegions.ts`. ALTER `patient_focus_areas` for `region_key`. Add `togglePatientFocusArea` in `patients.service.ts` + mutation in `usePatients.ts` mirroring goals/alerts. Hide the chip when `!canWrite`. Touch: tap region opens chip, tap chip toggles. Keyboard: focus shows chip immediately; Escape dismisses; only the chip button writes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Front+back SVG silhouette + region paths | Browser / Client | CDN / Static | Inline JSX SVG; no image asset required. Paths are the hit targets. |
| 500ms hover delay + abinha chip | Browser / Client | — | Pointer/focus UX. Not a server concern. |
| Touch: tap opens chip, second tap on chip toggles | Browser / Client | — | `@media (hover: hover)` vs coarse pointer. |
| Keyboard + accessible name | Browser / Client | — | Focusable region + chip `<button>`; Escape dismisses (WCAG 1.4.13). |
| Catalog of region keys/labels | Browser / Client | Database / Storage | Fixed TS catalog is source of labels. DB stores `region_key` + denormalized `label`. |
| Mark / unmark persistence | API / Backend (PostgREST) | Database / Storage | INSERT/DELETE on `patient_focus_areas`. Service owns the write. |
| Empty state copy | Browser / Client | — | `focusAreas.length === 0` → **Sem áreas registradas.** |
| Hide write when empresa views colleague | Browser / Client | Database / Storage | `canWritePatient` is UX-only. RLS `can_write_patient` denies INSERT/DELETE. |
| Authorization | Database / Storage | — | Existing Phase 3 policies. Do not rewrite them. |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` is **absent**. Treat these tracked sources with the same authority as locked decisions:

- **Layers:** page → hooks → services → Supabase. Pages/components do not call `supabase`. [VERIFIED: `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md`]
- **Clinic gating:** `src/lib/accountAccess.ts` only. Do **not** import `src/lib/permissions.ts`. [VERIFIED: ARCHITECTURE.md]
- **Hide, don’t disable** write controls that look tappable (Phase 3 D-07 / D-10). [VERIFIED: CONVENTIONS.md, STATE.md, CONTEXT D-10]
- **SQL apply path:** hosted SQL Editor only. Do **not** `supabase db push`. Commit a copy under `.planning/phases/06-silhueta-areas-de-foco/sql/` (`/supabase/` is gitignored). [VERIFIED: ARCHITECTURE.md, Phase 5 pattern]
- **Style:** single quotes, no semicolons, 2-space, `[...].join(' ')` not `clsx`, named exports only, no barrels. [VERIFIED: CONVENTIONS.md]
- **Quality gates:** `npm run lint` and `npm run typecheck`. No test runner today. [VERIFIED: `package.json`, `.planning/codebase/TESTING.md`]
- **Do not add a third-party body-map SaaS or npm widget** (D-02). [VERIFIED: CONTEXT.md]
- **Tokens:** `forest` `#0b1d36`, `accent` `#2f7dff`, `accent-soft` `#e7f0fb`. Do not use reference navy `#0A1651` or orange `#FF7D16`. [VERIFIED: `src/index.css`, CONTEXT D-03/D-04]
- **New clinic writes:** `mapDbError` at the service boundary (do not throw raw PostgREST `error.message`). [VERIFIED: CONVENTIONS.md; `patients.service.ts` `throwIfError` still throws raw message — new focus writes must not copy that]

## Standard Stack

Reuse what is already installed. **Do not add runtime packages.** Do not add `react-body-highlighter`, Jotform widgets, Radix Tooltip, Floating UI, or `clsx`.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 (`^19.1.0`) | Inline SVG + pointer/focus state | Existing SPA. SVG is a first-class React DOM component set. [VERIFIED: `.planning/codebase/STACK.md`] [CITED: react.dev/reference/react-dom/components] |
| @tanstack/react-query | 5.101.2 (`^5.76.1`) | Mutation + `invalidatePatient` | Same as goals/alerts in `usePatients.ts`. [VERIFIED: `src/hooks/usePatients.ts`] |
| @supabase/supabase-js | 2.110.7 (`^2.49.8`) | INSERT/DELETE `patient_focus_areas` | Only backend client. [VERIFIED: STACK.md] |
| zod | 3.25.76 (`^3.25.28`) | `regionKey` enum at the service boundary | Catalog keys, not free text. [VERIFIED: STACK.md] |
| zustand toast | 5.0.14 | Success/error on toggle | Existing `toast()`. [VERIFIED: `src/stores/toast.store.ts`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind v4 tokens | 4.3.3 | `text-forest`, `fill-accent`, `stroke-accent`, `bg-accent-soft` | Always. Hex only for SVG `fill`/`stroke` that cannot use `currentColor` (or use `currentColor` + `className`). |
| `canWritePatient` | local `accountAccess.ts` | Hide chip / pointer | Always. RLS still enforces. |
| UI kit | local | Card chrome only. Do **not** wrap the chip in `Modal`. | Chip is a small button, not a dialog. |
| Postgres UNIQUE (partial index) | Hosted Supabase | One row per `(patient_id, region_key)` | Race-safe double-click. [CITED: postgresql.org/docs/current/ddl-constraints.html] |
| Existing RLS | Phase 3 SQL | SELECT/INSERT/UPDATE/DELETE | Do not DROP/CREATE policies this phase. [VERIFIED: `03-account-types-team.sql` lines 698–721] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline SVG paths | Third-party body-map npm / Jotform widget | **Forbidden by D-02.** Do not research or install. |
| SVG-local chip (`<g>` next to path) | HTML portal + Floating UI | Portal needs extra package and leaks hover (WCAG 1.4.13). SVG-local chip stays in the same pointer group. |
| `region_key` column | Identity = `label` text | Front/back share names (“Ombro direito”); typos; i18n. D-09 already allows ALTER. |
| INSERT/DELETE toggle | Soft `is_active` flag | Empty state today is `length === 0`. Inactive rows would break **Sem áreas registradas.** Delete on unmark. |
| Native `title=""` tooltip | Custom abinha | D-05 forbids immediate hover; native tooltip is not clickable and fails WCAG 1.4.13 author-controlled content. |

**Installation:**

```bash
# none — do not npm install
```

**Version verification:** Stack versions from `.planning/codebase/STACK.md` (2026-09-14) and `package.json`. No new registry packages this phase.

## Package Legitimacy Audit

> No external packages are recommended. Gate skipped.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | No installs |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

`slopcheck` was not available at research time. That is irrelevant because this phase installs nothing. If a later plan tries to add a body-map library, that is a CONTEXT violation — reject it.

## Architecture Patterns

### System Architecture Diagram

```text
[Profissional no Resumo]
        │ pointerenter / focus / tap (região)
        ▼
┌───────────────────────────────────────────┐
│ PatientFocusAreasPanel                    │
│  wait 500ms (hover:hover + pointer:fine)  │
│  OR immediate (focus / coarse pointer)    │
│        │                                  │
│        ▼                                  │
│  Abinha (chip button) visível?            │
│    não, !canWrite → stop (só highlight)   │
│    sim + click chip ──────────────────┐   │
└───────────────────────────────────────┘   │
                                            ▼
                              useTogglePatientFocusArea
                                            │
                                            ▼
                         togglePatientFocusArea(patientId, regionKey)
                         Zod enum → INSERT or DELETE
                                            │
                                            ▼
                         PostgREST public.patient_focus_areas
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         RLS SELECT can_read_patient                    RLS INSERT/DELETE
         (criador OU empresa dona)                      can_write_patient
                                                        (só criador)
                    │                                               │
                    └──────────────┬────────────────────────────────┘
                                   ▼
                      invalidatePatient → silhueta re-render
                      empty ⇔ zero rows ⇔ "Sem áreas registradas."
```

### Recommended Project Structure

```
src/
├── lib/focusRegions.ts                          # keys, labels, view, sortOrder (no React)
├── components/patients/PatientFocusAreasPanel.tsx  # card + hover/chip/toggle + canWrite
├── schemas/patient.schema.ts                    # add focusRegionKeySchema (z.enum)
├── types/patient.ts                             # PatientFocusArea.regionKey
├── services/patients.service.ts                 # SELECT +region_key; togglePatientFocusArea
└── hooks/usePatients.ts                         # useTogglePatientFocusArea
.planning/phases/06-silhueta-areas-de-foco/sql/
└── 06-patient-focus-region-key.sql              # ALTER + unique index; SQL Editor only
```

`PatientPage.tsx` only mounts `<PatientFocusAreasPanel patientId={...} focusAreas={detail.focusAreas} canWrite={canWrite} />`. Delete `function BodyFocus()`.

### Pattern 1: Inline SVG regions with fill hit-testing

**What:** Each body part is a `<path>` with a stable `data-region` / `id`. Default SVG `pointer-events` is `visiblePainted`: `fill="none"` paths only receive events on the stroke. Regions must use a fill (even `fillOpacity={0}` / `className="fill-transparent"`) **or** `pointerEvents="fill"` / `"visible"` so the interior is the target.

**When to use:** Always for this map.

**Example:**

```tsx
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
// Source: https://react.dev/learn/writing-markup-with-jsx (strokeWidth camelCase)
<path
  d={region.path}
  pointerEvents="fill"
  className={[
    'stroke-forest',
    selected ? 'fill-accent/35 stroke-accent' : 'fill-accent-soft/40',
  ].join(' ')}
  strokeWidth="1.5"
/>
```

### Pattern 2: Delayed hover chip in one pointer group (WCAG 1.4.13)

**What:** Open delay is 500ms on convenient hover only. Once open, the chip stays until pointer leaves **region + chip**, focus leaves, or Escape. Do **not** auto-close on a second timer (fails Persistent).

**When to use:** Desktop hover. Skip the 500ms wait on keyboard focus and on coarse pointers.

**Example:**

```tsx
// Source: https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover
const HOVER_OPEN_MS = 500

function useFineHover() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function onRegionPointerEnter(key: string) {
  window.clearTimeout(openTimer)
  if (!canWrite) return
  if (useFineHover()) {
    openTimer = window.setTimeout(() => setOpenKey(key), HOVER_OPEN_MS)
  } else {
    setOpenKey(key) // tap/coarse: open immediately; do not toggle yet (D-06)
  }
}

function onGroupPointerLeave() {
  window.clearTimeout(openTimer)
  setOpenKey(null)
}
```

Chip: HTML `<button type="button">` positioned with the path’s `getBBox()` (SVG user units) inside a `relative` wrapper, **or** an SVG `<g>` with `rect`+`text` adjacent to the path. Prefer the HTML button for a real 44px tap target; keep it inside the same wrapper that owns `onPointerLeave`.

### Pattern 3: Toggle = INSERT or DELETE (goals/alerts write path)

**What:** Mirror `createPatientGoal` / `deletePatientGoal`. One mutation. Service looks up existing row by `(patient_id, region_key)` then inserts or deletes.

**When to use:** Chip click and keyboard activation of the chip.

**Example:**

```ts
// Source: src/services/patients.service.ts createPatientGoal / deletePatientGoal
// Source: src/hooks/usePatients.ts useCreatePatientGoal
export async function togglePatientFocusArea(
  patientId: string,
  regionKey: string,
): Promise<'marked' | 'unmarked'> {
  const key = focusRegionKeySchema.parse(regionKey)
  const region = getFocusRegion(key)
  const { data: existing, error: findError } = await supabase
    .from('patient_focus_areas')
    .select('id')
    .eq('patient_id', patientId)
    .eq('region_key', key)
    .maybeSingle()
  throwIfDbError(findError)
  if (existing) {
    const { error } = await supabase.from('patient_focus_areas').delete().eq('id', existing.id)
    throwIfDbError(error)
    return 'unmarked'
  }
  const { error } = await supabase.from('patient_focus_areas').insert({
    patient_id: patientId,
    region_key: key,
    label: region.label,
    is_active: true,
    sort_order: region.sortOrder,
  })
  throwIfDbError(error)
  return 'marked'
}

function throwIfDbError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}
```

Hook: `useTogglePatientFocusArea(patientId)` → `invalidatePatient` + toast `'Área marcada'` / `'Área desmarcada'` (Portuguese, conventions). Optimistic cache optional; CONTEXT allows optimism **if** patient is invalidated — prefer invalidate-only to avoid a third cache protocol (kanban is the only optimistic pattern today).

### Recommended region catalog (Claude's Discretion)

Independent keys per view so frente/costas do not collide. No muscle-level parts. Labels are the only UI copy.

| `region_key` | Label (pt-BR) | View |
|--------------|---------------|------|
| `front.head` | Cabeça | frente |
| `front.neck` | Pescoço | frente |
| `front.shoulder_l` | Ombro esquerdo | frente |
| `front.shoulder_r` | Ombro direito | frente |
| `front.chest` | Tórax | frente |
| `front.abdomen` | Abdômen | frente |
| `front.arm_l` | Braço esquerdo | frente |
| `front.arm_r` | Braço direito | frente |
| `front.hand_l` | Mão esquerda | frente |
| `front.hand_r` | Mão direita | frente |
| `front.hip` | Quadril | frente |
| `front.thigh_l` | Coxa esquerda | frente |
| `front.thigh_r` | Coxa direita | frente |
| `front.knee_l` | Joelho esquerdo | frente |
| `front.knee_r` | Joelho direito | frente |
| `front.leg_l` | Perna esquerda | frente |
| `front.leg_r` | Perna direita | frente |
| `front.foot_l` | Pé esquerdo | frente |
| `front.foot_r` | Pé direito | frente |
| `back.head` | Nuca | costas |
| `back.neck` | Cervical | costas |
| `back.shoulder_l` | Ombro esquerdo | costas |
| `back.shoulder_r` | Ombro direito | costas |
| `back.upper` | Dorsal | costas |
| `back.lumbar` | Lombar | costas |
| `back.glute_l` | Glúteo esquerdo | costas |
| `back.glute_r` | Glúteo direito | costas |
| `back.arm_l` | Braço esquerdo | costas |
| `back.arm_r` | Braço direito | costas |
| `back.hand_l` | Mão esquerda | costas |
| `back.hand_r` | Mão direita | costas |
| `back.thigh_l` | Coxa esquerda | costas |
| `back.thigh_r` | Coxa direita | costas |
| `back.knee_l` | Joelho esquerdo | costas |
| `back.knee_r` | Joelho direito | costas |
| `back.leg_l` | Perna esquerda | costas |
| `back.leg_r` | Perna direita | costas |
| `back.foot_l` | Pé esquerdo | costas |
| `back.foot_r` | Pé direito | costas |

Export `FOCUS_REGION_KEYS` as a `as const` tuple and `z.enum(FOCUS_REGION_KEYS)`. Display labels from this catalog, not from the DB string (DB label is denormalized fallback only).

Layout labels under each figure: **Frente** / **Costas** (`text-xs text-muted`).

Text list beside the SVG: omit on the default card width (D-01 removes the dead list). Keep a visually-hidden `<ul>` of marked labels for screen readers. If the card has leftover space on `xl`, a compact wrap of chips is optional — silhouette remains source of truth.

### Anti-Patterns to Avoid

- **Stuffing the map into `PatientPage.tsx`:** page is already 500+ lines; CONVENTIONS say split panels.
- **Hardcoded accent dots** (`circle` at cy 132 / 108): they are not data. Delete with `BodyFocus`.
- **`fill="none"` regions:** interiors will not hover. [CITED: MDN `pointer-events` default `visiblePainted`]
- **Overlapping paths:** last painted path steals hits. Draw non-overlapping silhouettes; slight gaps with a non-interactive outline underneath (`pointerEvents="none"`).
- **Opening the chip on CSS `:hover` with 0 delay:** D-05. Also iOS sticky-hover.
- **Toggling on path click:** D-06. Path click/tap only reveals the chip.
- **Disabled chip that still looks tappable when `!canWrite`:** hide it (D-10).
- **`supabase db push` / new table `patient_body_regions`:** D-09 + project SQL path.
- **Rewriting Phase 3 RLS:** already correct. ALTER column only.
- **Identity = `label`:** front/back collision; unstable.
- **Native `title` attribute:** not clickable; WCAG 1.4.13 exception is user-agent tooltips we must not rely on.
- **Third-party body-map CSS/JS:** D-02.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ficha write/read authorization | Client-only `if (canWrite)` as security | Existing RLS `patient_focus_areas_*` | ASVS 4.1.1; empresa JWT can still hit PostgREST. [VERIFIED: `03-account-types-team.sql`] |
| Unique region per patient | JS “check then insert” only | Partial unique index `(patient_id, region_key) WHERE region_key IS NOT NULL` | Races; 23505 maps through `mapDbError`. [CITED: postgresql.org/docs/current/ddl-constraints.html] |
| User-facing DB errors | `throw new Error(error.message)` | `mapDbError` | `throwIfError` in `patients.service.ts` leaks PostgREST text. New writes must not. |
| Hover positioning across scroll/zoom | Custom portal + collision solver | Chip inside the region group (SVG or wrapping HTML) | WCAG 1.4.13 Hoverable; extra libs forbidden. |
| Accessible name | SVG `<title>` as the only name | Chip text + `aria-label` on the button; `aria-pressed` | `<title>` is a native tooltip (D-05 / 1.4.13). |
| UUID / timestamps | App-generated ids | Table defaults (`gen_random_uuid()`, existing `id`) | Table already has `id`. |

**Key insight:** Hand-roll the **silhouette** (that is the product, and D-02 forbids the widget). Do **not** hand-roll authorization, uniqueness, or a floating tooltip library.

The SVG map itself is custom by requirement — that is not a pitfall.

## Runtime State Inventory

Schema addition on a live table (not a rename). Categories checked:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `public.patient_focus_areas` rows may exist with `label` and **no** `region_key`. Live DDL is not in git. App currently maps whatever SELECT returns. | Code: ignore rows with `region_key` null in the silhouette (do not fake highlights). SQL: add nullable `region_key`; do **not** SET NOT NULL until leftovers are gone. Do **not** guess slug-from-label backfill (labels are not a catalog). Optional: leave old rows unread; empty silhouette until the professional marks catalog parts. |
| Live service config | None — verified: no n8n/Datadog/body-map SaaS in repo. | none |
| OS-registered state | None — verified: feature is SPA-only. | none |
| Secrets/env vars | None — no new `VITE_*`. | none |
| Build artifacts | None — no generated types for this table (`database.types.ts` is bakery-only; clinic uses local `FocusRow`). | Update `FocusRow` in `patients.service.ts` only |

**Nothing found in category:** Live service config / OS / secrets / build artifacts — none, as above.

## Common Pitfalls

### Pitfall 1: `fill="none"` regions never hover
**What goes wrong:** Cursor must hit the 1.5px stroke. Feels broken.
**Why it happens:** SVG default `pointer-events: visiblePainted`.
**How to avoid:** `pointerEvents="fill"` and a real fill (transparent or `accent-soft`).
**Warning signs:** Hover only works on outlines.

### Pitfall 2: Hover flicker between path and chip
**What goes wrong:** Chip opens at 500ms then vanishes while moving onto it.
**Why it happens:** `pointerleave` on the path fires before `pointerenter` on the chip if they are separate trees with a gap.
**How to avoid:** One wrapper for path+chip; no gap (overlap chip stem with the path); no close-on-timer.
**Warning signs:** Chip blinks; cannot click it (fails D-06 and WCAG Hoverable).

### Pitfall 3: Overlapping paths steal hits
**What goes wrong:** Clicking “ombro” selects “tórax”.
**Why it happens:** Painters algorithm; last path wins.
**How to avoid:** Non-overlapping closed paths; optional full-body outline in a bottom layer with `pointerEvents="none"`.
**Warning signs:** Adjacent regions highlight the wrong key.

### Pitfall 4: iOS / coarse pointer fake hover
**What goes wrong:** First tap “hovers” and second tap accidentally… still must not mark the path (D-06). Sticky `:hover` stays after tap.
**Why it happens:** Primary input `hover: none`.
**How to avoid:** Gate the 500ms path on `matchMedia('(hover: hover) and (pointer: fine)')`. Coarse: tap region opens chip; tap chip toggles; tap outside / Escape closes. Do not use CSS `:hover` as the open trigger.
**Warning signs:** Marking on first tap; chip stuck open.

### Pitfall 5: Empresa sees a tappable chip that RLS rejects
**What goes wrong:** Toast “Você não tem permissão…” after a click that looked allowed.
**Why it happens:** Card today ignores `canWrite` even though `ResumoDoPaciente` receives it (`PatientPage.tsx` ~358–375 vs 507).
**How to avoid:** Pass `canWrite` into the panel; hide chip, `cursor-default` on paths, no `tabIndex` on regions when `!canWrite`. Still highlight saved areas. RLS remains authority.
**Warning signs:** Pencil-like pointer on a colleague ficha.

### Pitfall 6: Empty state vs `is_active=false` leftovers
**What goes wrong:** Copy **Sem áreas registradas.** never shows, or unmarked parts stay highlighted.
**Why it happens:** Current empty check is `detail.focusAreas.length === 0`; mapper includes every SELECT row.
**How to avoid:** DELETE on unmark; SELECT only rows with non-null `region_key`; do not keep inactive rows as “unmarked catalog”.
**Warning signs:** Grey dots/list items with `isActive: false`.

### Pitfall 7: Unique violation on double-click
**What goes wrong:** Two INSERTs before invalidate.
**Why it happens:** No unique on `label`; after ALTER, missing unique on `region_key`.
**How to avoid:** Partial unique index; treat 23505 as already-marked and refetch; disable chip `isPending`.
**Warning signs:** Duplicate highlights; `mapDbError` “Já existe um registro…”.

### Pitfall 8: ALTER NOT NULL against leftover labels
**What goes wrong:** SQL Editor apply fails.
**Why it happens:** Unknown live rows without a key.
**How to avoid:** Nullable `region_key`; unique index `WHERE region_key IS NOT NULL`.
**Warning signs:** `ERROR: column contains null values`.

### Pitfall 9: Raw PostgREST errors in the toast
**What goes wrong:** Portuguese UI shows `new row violates row-level security`.
**Why it happens:** `throwIfError` throws `error.message`.
**How to avoid:** `mapDbError` on focus writes (42501 → “Você não tem permissão para esta ação.”).
**Warning signs:** English/SQL in toast.

### Pitfall 10: Giant SVG inline in PatientPage
**What goes wrong:** Unreviewable diffs; Resumo regressions.
**Why it happens:** Current `BodyFocus` already lives in the page.
**How to avoid:** `PatientFocusAreasPanel` + catalog module.
**Warning signs:** `PatientPage.tsx` grows instead of shrinking.

## Code Examples

Verified patterns from official sources and this repo:

### SVG hit-testing (fill, not stroke-only)

```tsx
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
// Source: https://www.w3.org/TR/SVG/interact.html (visiblePainted vs fill)
<svg viewBox="0 0 140 240" className="h-44 w-auto text-forest" aria-hidden={false} role="group" aria-label="Frente">
  <g pointerEvents="none" fill="none" stroke="currentColor" strokeWidth="1.2">
    {/* silhouette outline only */}
  </g>
  {FRONT_REGIONS.map((region) => (
    <path
      key={region.key}
      d={region.path}
      pointerEvents="fill"
      tabIndex={canWrite ? 0 : undefined}
      aria-label={region.label}
    />
  ))}
</svg>
```

### Hover media (touch vs mouse)

```css
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover */
@media (hover: hover) {
  /* convenient hover exists — JS still owns the 500ms delay */
}
```

```ts
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover
const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
```

### WCAG 1.4.13 chip

```tsx
// Source: https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus
// Dismissible = Escape; Hoverable = chip inside hover group; Persistent = no hide timer
<button
  type="button"
  aria-pressed={selected}
  onClick={() => canWrite && toggle.mutate(region.key)}
>
  {selected ? `Desmarcar ${region.label}` : `Marcar ${region.label}`}
</button>
```

Do not put `onClick` toggle on the `<path>`.

### Existing card chrome to keep

```tsx
// Source: src/pages/PatientPage.tsx (Áreas de foco card)
<div className="rounded-2xl border border-line p-4">
  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Áreas de foco</p>
  {/* panel body */}
</div>
```

### SQL Editor ALTER (idempotent)

```sql
-- Cole no SQL Editor. Nao use supabase db push.
-- Source: https://www.postgresql.org/docs/current/ddl-constraints.html (UNIQUE + nulls)
alter table public.patient_focus_areas
  add column if not exists region_key text;

alter table public.patient_focus_areas
  drop constraint if exists patient_focus_areas_region_key_format;

alter table public.patient_focus_areas
  add constraint patient_focus_areas_region_key_format
  check (region_key is null or region_key ~ '^(front|back)\.[a-z0-9_]+$');

create unique index if not exists patient_focus_areas_patient_region_key
  on public.patient_focus_areas (patient_id, region_key)
  where region_key is not null;
```

Do **not** DROP existing `patient_focus_areas_*` policies. Do **not** CREATE a new table.

### FocusRow / DTO

```ts
// Source: src/services/patients.service.ts FocusRow (extend)
interface FocusRow {
  id: string
  region_key: string | null
  label: string
  is_active: boolean
  sort_order: number
}

export interface PatientFocusArea {
  id: string
  regionKey: string
  label: string
  isActive: boolean
}
```

Map: skip null `region_key`. Resolve display label via `getFocusRegion(row.region_key)?.label ?? row.label`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stick figure + fake dots | Catalog SVG body map | This phase | Dots were never `focusAreas` |
| SELECT-only `patient_focus_areas` | Toggle INSERT/DELETE | This phase | Write path missing today |
| Identity = free-text `label` | Stable `region_key` | This phase | Front/back + catalog |
| Native `title` tooltips | Author-controlled hover (WCAG 1.4.13) | WCAG 2.1+ | Chip must be hoverable, dismissible, persistent |
| `hover` CSS only | `@media (hover: hover)` + Pointer Events | Media Queries 4 / Pointer Events | Touch must not fake hover-open |

**Deprecated/outdated:**
- Copying the Jotform Body Part Selector (navy musculature, Male/Female, orange selection): D-03/D-04/deferred.
- `database.types.ts` as clinic schema: bakery leftover; keep local `FocusRow`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Live `patient_focus_areas` has columns `id`, `patient_id`, `label`, `is_active`, `sort_order` and **no** `region_key` | Standard Stack / SQL | If `region_key` already exists, ADD COLUMN IF NOT EXISTS is still safe. If `patient_id` is named differently, INSERT fails — script should probe `information_schema.columns` in a comment for the executor. |
| A2 | Table already GRANTs INSERT/DELETE to `authenticated` (Phase 3 created policies but no GRANT block for this table) | Security | If grants are missing, writes fail 42501 for everyone. Planner: include a `GRANT select, insert, update, delete` that is idempotent if the executor hits permission errors. |
| A3 | Leftover rows are demo/unused; skipping them (null key) is acceptable UX | Runtime State | If production already has meaningful labels, they vanish from the silhouette until remapped. Flag for human UAT on a real patient. |
| A4 | Recommended ~38-key catalog is the right clinical grain | Catalog | Too many small paths on a `h-44` SVG fail 24px targets. UI-SPEC may merge mão+braço or pé+perna if hit-testing fails. |

A1–A3 are schema/data, not product alternatives. A4 is CONTEXT discretion — planner should treat the table as the starting catalog and allow UI-SPEC to merge keys, not add muscles.

## Open Questions

1. **Live column list of `patient_focus_areas`**
   - What we know: app SELECT is `id, label, is_active, sort_order`; RLS uses `patient_id`. No CREATE TABLE in git. [VERIFIED: `patients.service.ts`, `03-account-types-team.sql`]
   - What's unclear: extra columns (`created_at`?), existing unique constraints, live row count.
   - Recommendation: SQL script starts with `add column if not exists`; executor pastes a `\d` / `information_schema` query in the Editor first if apply fails. Do not block planning.

2. **Should leftover label-only rows be deleted?**
   - What we know: empty UI is length === 0.
   - What's unclear: whether any real clinic data exists.
   - Recommendation: do not DELETE in SQL blindly. UI ignores null `region_key`. Human UAT notes “old labels won’t highlight until remarked.”

3. **Hit-target size on the Resumo column**
   - What we know: card is `lg:col-span-1`; current SVG is `h-36`. WCAG 2.2 2.5.8 is 24×24 CSS px (official fetch timed out; treat as AA target, not a locked legal claim). [ASSUMED: 2.5.8 24px]
   - What's unclear: whether 19 paths per figure fit.
   - Recommendation: `h-44`–`h-56`, merge tiny distal parts in UI-SPEC if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | lint/typecheck/dev | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| Hosted Supabase SQL Editor | ALTER `region_key` | ✓ (project convention) | — | No CLI `db push` |
| `supabase` CLI | (not used) | not required | — | SQL Editor only |
| Vitest | optional unit tests | ✗ | — | `npm run lint && npm run typecheck` (same as Phases 3–5) |
| Playwright | hover/touch UAT | ✗ | — | Manual browser UAT |
| ctx7 CLI | docs | ✗ | — | MDN / W3C / React.dev / Postgres fetches used instead |

**Missing dependencies with no fallback:** none that block the phase (SQL Editor is the schema path).

**Missing dependencies with fallback:** Vitest / Playwright — do not block product plans.

Step 2.6 note: no new runtime tools. Graph `.planning/graphs/graph.json` is **absent** — graphify skipped.

## Validation Architecture

> `workflow.nyquist_validation` is **absent** in `.planning/config.json` → treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | none installed — ESLint 9 + `tsc --noEmit`. Intended unit runner is Vitest (TESTING.md) |
| Config file | `eslint.config.js`, `tsconfig.json` — no vitest/jest config |
| Quick run command | `npm run lint && npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` plus SQL Editor RLS checklist + browser UAT |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-18.1 | `BodyFocus` gone; panel renders frente+costas | source | `rg -n "function BodyFocus" src/pages/PatientPage.tsx` must be empty; `rg PatientFocusAreasPanel` | ❌ Wave 0 (grep after implement) |
| REQ-18.2 | 500ms constant; chip not native title | source | `rg "500" src/components/patients/PatientFocusAreasPanel.tsx`; no `title=` on regions | ❌ |
| REQ-18.3 | Toggle only from chip; service INSERT/DELETE | source | `rg togglePatientFocusArea src/services/patients.service.ts` | ❌ |
| REQ-18.4 | Unique region_key; multi-select | source + SQL | unique index in `06-*.sql`; typecheck | ❌ |
| REQ-18.5 | No mock; SELECT includes region_key | source | typecheck; SELECT string grep | ❌ |
| REQ-18.6 | `canWrite` hides chip | source | panel prop `canWrite`; no disabled-looking chip | ❌ |
| REQ-18 catalog | `z.enum` rejects unknown keys | unit (optional) | `npx vitest run src/lib/focusRegions.test.ts` | ❌ Wave 0 deferred |
| REQ-18.6 RLS | empresa cannot INSERT colleague rows | manual | SQL Editor JWT matrix | ❌ no Playwright |

### Sampling Rate

- **Per task commit:** `npm run lint && npm run typecheck`
- **Per wave merge:** same; SQL Editor smoke if the wave touched `.sql`
- **Phase gate:** lint + typecheck green; SQL applied; browser UAT of hover / touch / empresa read-only

### Wave 0 Gaps

- [ ] Optional later: Vitest + `src/lib/focusRegions.test.ts` (enum keys unique, every key has label+view)
- [ ] Optional later: `src/lib/accountAccess.test.ts` already specified in Phase 3/5 — not required to ship REQ-18
- [ ] Framework install: **deferred** — product plans must not wait on Vitest (same as 05-RESEARCH)

If the planner does **not** introduce Vitest, Nyquist VALIDATION.md should mark catalog rows as Wave 0 deferred and keep `npm run typecheck` as the automated command.

### Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover 500ms then chip; leave group closes | REQ-18.2 / D-05 | Timing + pointer path | Desktop: enter region, wait ~0.5s, move onto chip, click, leave |
| Path click does not mark | REQ-18.3 / D-06 | Interaction | Click path only; row count unchanged until chip click |
| Touch: tap region opens, tap chip toggles | Discretion / D-06 | No Playwright | Phone or DevTools coarse pointer |
| Empresa colleague ficha: highlights, no chip | REQ-18.6 / D-10 | Two accounts | Open patient created by another user |
| Empty copy **Sem áreas registradas.** | D-07 | Visual | Patient with zero keyed rows |
| Escape closes chip | WCAG 1.4.13 | Keyboard | Focus region, Esc |
| SQL RLS: creator INSERT ok; other authenticated INSERT fail | REQ-18.5 | Do not mock RLS | SQL Editor as two JWTs |

## Security Domain

> `security_enforcement` is absent in `.planning/config.json` → enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing session; do not change Auth/storage |
| V3 Session Management | no | Unchanged supabase-js `persistSession` |
| V4 Access Control | yes | RLS `patient_focus_areas_insert/update/delete` → `private.can_write_patient`; SELECT → `can_read_patient`. UX: `canWritePatient`. [VERIFIED: `03-account-types-team.sql` 183–204, 698–721] |
| V5 Input Validation | yes | `z.enum(FOCUS_REGION_KEYS)`; labels from catalog not user text; CHECK regex on `region_key` |
| V6 Cryptography | no | — |

### Known Threat Patterns for React + Supabase body-map

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Empresa/fisio INSERT on colleague `patient_id` | Elevation of privilege | RLS `can_write_patient` (creator only; pending/rejected denied). Hide chip in UI. |
| Toggle another patient’s id from the client | Tampering / IDOR | Hook uses `patientId` from the ficha route; RLS still checks `patient_id` on the row. Do not accept `patientId` from the chip dataset without matching the loaded patient. |
| Free-text `label` XSS / HTML | Tampering | Catalog labels; React text nodes escape. Never `dangerouslySetInnerHTML`. |
| Unknown `region_key` spam | Tampering | Zod enum + CHECK `front|back.[a-z0-9_]+`. Unique index stops duplicates. |
| RLS error leak | Information disclosure | `mapDbError` (42501 generic). |
| Mock focus areas in the client | Repudiation / integrity | D-09: empty array is empty; no placeholder parts. |

`private.can_write_patient`: `patients.created_by = auth.uid()` AND membership not `pending`/`rejected`. Empresa owner is **not** a writer. [VERIFIED: `03-account-types-team.sql` 183–204]

## Sources

### Primary (HIGH confidence)
- In-repo: `src/pages/PatientPage.tsx` (`BodyFocus`, Áreas de foco card), `src/types/patient.ts` (`PatientFocusArea`), `src/services/patients.service.ts` (`FocusRow`, SELECT, no write), `src/hooks/usePatients.ts` (`invalidatePatient`, goal/alert mutations), `src/lib/accountAccess.ts`, `src/index.css` tokens, `src/components/patients/PatientGoalsPanel.tsx` / `PatientAlertsPanel.tsx`
- `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql` — RLS + `can_write_patient` / `can_read_patient`
- `.planning/phases/06-silhueta-areas-de-foco/06-CONTEXT.md` — D-01–D-10
- MDN `pointer-events` — https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
- MDN SVG `pointer-events` — https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pointer-events
- MDN `@media (hover)` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover
- SVG 2 interactivity (`visiblePainted` vs `fill`) — https://www.w3.org/TR/SVG/interact.html
- React DOM SVG components + camelCase — https://react.dev/reference/react-dom/components and https://react.dev/learn/writing-markup-with-jsx
- Postgres UNIQUE / nulls — https://www.postgresql.org/docs/current/ddl-constraints.html
- WCAG 2.2 SC 1.4.13 — https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus
- W3C technique SCR39 — https://www.w3.org/WAI/WCAG22/Techniques/client-side-script/SCR39
- `.planning/codebase/{ARCHITECTURE,CONVENTIONS,STACK,TESTING}.md`

### Secondary (MEDIUM confidence)
- WCAG 2.2 full guidelines text (1.4.13 wording) via w3c.github.io/wcag/guidelines/22/ (Understanding page fetch timed out; guidelines page succeeded)
- Phase 5 research/SQL apply path as the template for Editor scripts

### Tertiary (LOW confidence)
- WCAG 2.2 SC 2.5.8 24px target size — official Understanding fetch timed out; do not treat as a locked legal requirement. Use as a design heuristic in UI-SPEC.
- Live leftover row count in `patient_focus_areas` — not queried (no DB from this agent)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse installed React/TanStack/Supabase/Zod; D-02 forbids new widgets
- Architecture: HIGH — panel + service + existing RLS is the same ficha pattern as goals/alerts; `region_key` ALTER is the only schema move
- Pitfalls: HIGH — SVG hit-testing and hover flicker are documented on MDN/W3C; RLS/canWrite mismatch is visible in current `PatientPage`

**Research date:** 2026-09-14
**Valid until:** 2026-10-14 (stable SPA + SVG; catalog list may be trimmed in UI-SPEC)
