# Phase 19: Boneco de área de foco - Pattern Map

**Mapped:** 2026-09-24
**Files analyzed:** 7
**Analogs found:** 7 / 7

Edit the existing silhouette in place. Do not add a second body-map component, a schema enum copy, a new route, or a Vitest harness.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/focusRegions.ts` | utility | transform | `src/lib/focusRegions.ts` (in place) | exact |
| `src/components/patients/PatientFocusAreasPanel.tsx` | component | event-driven | `src/components/patients/PatientFocusAreasPanel.tsx` (in place) | exact |
| `src/components/patients/evaluation/BodyMapPicker.tsx` | component | event-driven | `src/components/patients/PatientFocusAreasPanel.tsx` (scroll guard) + own click | role-match |
| `src/services/patientAiPdf.service.ts` | service | transform | `src/services/patientAiPdf.service.ts` `BODY_MAP_CENTROIDS` + `drawBodyMap` | exact |
| `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` | service | transform | same file `FOCUS_REGION_KEYS` Set | exact |
| `.planning/phases/19-boneco-de-rea-de-foco/sql/19-focus-region-retire.sql` | migration | batch | `.planning/phases/18-minha-conta/sql/18-account.sql` (header) | role-match |
| `supabase/19-focus-region-retire.sql` | migration | batch | the planning SQL above, byte-identical; `/supabase/` is gitignored | role-match |

Unchanged consumers (do not edit; they follow the catalog automatically): `src/schemas/patient.schema.ts`, `src/services/patients.service.ts`, `src/hooks/usePatients.ts`, `src/services/patientAi.service.ts`, `src/components/layout/AppShell.tsx`, `src/schemas/evaluationFicha.schema.ts`. Do not edit `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts`.

## Pattern Assignments

### `src/lib/focusRegions.ts` (utility, transform)

**Analog:** `src/lib/focusRegions.ts`

Replace the eight whole-limb keys (`front.arm_l`, `front.arm_r`, `back.arm_l`, `back.arm_r`, `front.leg_l`, `front.leg_r`, `back.leg_l`, `back.leg_r`) with the 20 keys in `19-UI-SPEC.md`. Keep every other key, label, `path`, and `sortOrder`. New keys use `sortOrder` 30 and up. Paint order is array order inside `FOCUS_REGIONS`, not `sortOrder`.

**Imports pattern:** this module has no imports. Consumers import from `@/lib/focusRegions`.

**Catalog shape** (lines 7–49):

```typescript
export const FOCUS_REGION_KEYS = [
  'front.head',
  'front.neck',
  // ...
] as const

export type FocusRegionKey = (typeof FOCUS_REGION_KEYS)[number]
export type FocusView = 'front' | 'back'

export interface FocusRegion {
  key: FocusRegionKey
  label: string
  view: FocusView
  sortOrder: number
  path: string
}
```

**Path commands already used** (lines 51–99). New limb `d` strings stay in `M` `L` `H` `V` `C` `Z`. No arc `A`. Real fill, closed path.

```typescript
{
  key: 'front.head',
  label: 'Cabeça',
  view: 'front',
  sortOrder: 0,
  path: 'M70 8C59.5 8 52.5 15.5 52.5 25C52.5 34 59.5 41 70 41C80.5 41 87.5 34 87.5 25C87.5 15.5 80.5 8 70 8Z',
},
{
  key: 'front.arm_l',
  label: 'Braço esquerdo',
  view: 'front',
  sortOrder: 6,
  path: 'M91 71H100.5L101.6 116L99.2 150C99.2 155.2 94.4 155.2 94.4 150L92.4 116L91 71Z',
},
```

`front.arm_l` sits on the viewer’s right (x≈91–101), under the shoulder that ends at y=70 (`front.shoulder_l` path, lines 71–72, y=52–70). `back.leg_l` sits on the viewer’s left (lines 249–253, x≈45–66, starts y=206). Mirror new back `*_l` paths onto the front `*_r` x-band (axis x=70). Do not copy `front.*_l` onto `back.*_l`.

**Shared-label aria** (lines 264–293). A label that exists on both views gets `(frente)` / `(costas)` on the path only. Unique labels stay bare. Braço and Antebraço will join the shared set automatically once both views use the same label. Palma, Mão, Canela, Pé, Panturrilha, and Tornozelo stay unique, so they stay without a view suffix.

```typescript
const sharedFocusLabels = new Set(
  FOCUS_REGIONS.filter((region) =>
    FOCUS_REGIONS.some((other) => other !== region && other.label === region.label),
  ).map((region) => region.label),
)

export function focusRegionPathAriaLabel(region: FocusRegion): string {
  if (!sharedFocusLabels.has(region.label)) return region.label
  return `${region.label} ${viewParenthetical(region.view)}`
}

export function focusRegionListLabel(region: FocusRegion): string {
  return `${region.label} ${viewParenthetical(region.view)}`
}
```

`getFocusRegion` and `listFocusRegionsByView` (lines 278–284) stay. Do not add a second key list in this file.

---

### `src/components/patients/PatientFocusAreasPanel.tsx` (component, event-driven)

**Analog:** `src/components/patients/PatientFocusAreasPanel.tsx`

Keep the chip, the 500ms hover, and the copy. Change focus so selecting a region does not move `.panel-scroll`.

**Imports** (lines 1–11):

```typescript
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTogglePatientFocusArea } from '@/hooks/usePatients'
import {
  focusRegionListLabel,
  focusRegionPathAriaLabel,
  getFocusRegion,
  listFocusRegionsByView,
  type FocusRegionKey,
  type FocusView,
} from '@/lib/focusRegions'
import type { PatientFocusArea } from '@/types/patient'
```

**Unknown key is skipped** (lines 79–81 and 331–334). A removed `region_key` draws nothing and is omitted from the `sr-only` list. Do not split an old arm or leg mark.

```typescript
const selectedKeys = new Set(
  focusAreas.map((area) => area.regionKey).filter((key) => getFocusRegion(key)),
)
```

**Scroll helper to delete** (lines 51–63). It samples `scrollTop` inside the focus path, after the browser has already scrolled. Remove `preservePanelScroll`. Do not restore `scrollTop` from `onFocus`.

```typescript
function preservePanelScroll(run: () => void) {
  const panel = document.querySelector('.panel-scroll')
  const top = panel instanceof HTMLElement ? panel.scrollTop : window.scrollY
  run()
  requestAnimationFrame(() => {
    if (panel instanceof HTMLElement) {
      panel.scrollTop = top
      return
    }
    window.scrollTo({ top, left: window.scrollX })
  })
}
```

**Path hit-test to keep, then adjust** (lines 238–269). Keep `viewBox="0 0 140 240"`, `pointerEvents="fill"`, stroke `0.65`, `h-44 w-auto sm:h-52`, and `preventDefault` on path `pointerdown`. Drop the SVG attribute `overflow="hidden"` and the class `overflow-hidden`. Use `overflow-visible` on the `<svg>`. Keep `[overflow-anchor:none]` on the group. When `canWrite`, paths become `tabIndex={-1}` and the figure wrapper is the single `tabIndex={0}`. When `!canWrite`, neither wrapper nor path gets `tabIndex`.

```tsx
<svg
  viewBox="0 0 140 240"
  overflow="hidden"
  className="h-44 w-auto overflow-hidden text-forest sm:h-52 [overflow-anchor:none]"
  aria-label={svgLabel}
>
  <path
    tabIndex={canWrite ? 0 : undefined}
    onPointerDown={(event) => {
      event.preventDefault()
      onRegionPointerDown(region.key)
    }}
    onFocus={() => onRegionFocus(region.key)}
  />
</svg>
```

**Only existing `preventScroll` call** (lines 158–166), on Escape. Keep `focus({ preventScroll: true })`. Drop the `preservePanelScroll` wrapper. Every other programmatic focus (arrow keys, hover that moves focus, chip) uses the same options object. Never call `focus()` without `preventScroll: true`.

```typescript
preservePanelScroll(() => {
  pathRefs.current.get(key)?.focus({ preventScroll: true })
})
```

**Chip** (lines 274–300). Add `onPointerDown={(event) => event.preventDefault()}` so the click does not focus the button. Leave `onClick={onChipClick}`, `type="button"`, `aria-pressed`, `aria-busy`, and the Marcar/Desmarcar copy. Do not portal the chip. Chip placement already uses `getBoundingClientRect` against the figure wrapper (lines 111–124).

**Write path** (lines 214–216): `toggle.mutate(openKey, { onSuccess: () => closeChip() })`. Ignore a second click while `toggle.isPending`.

There is no arrow-key roving focus in this repo. Add it on the figure wrapper from `19-UI-SPEC.md` Interaction Contract: arrows walk that figure’s `<path>` order, wrap, and call `path.focus({ preventScroll: true })`, which opens the chip with no 500ms wait. Do not copy lucide `ArrowRight` from `DashboardPage.tsx`.

Fallback (HTML hit buttons via `getBBox()`) only if `scrollTop` of `.panel-scroll` still changes after the focus guard. Do not start there. Do not put `tabIndex={0}` back on each path.

---

### `src/components/patients/evaluation/BodyMapPicker.tsx` (component, event-driven)

**Analog (scroll):** `PatientFocusAreasPanel.tsx` path `pointerdown` + `focus({ preventScroll: true })`.
**Analog (toggle):** this file. Keep the direct click. Do not add the 500ms chip, and do not restyle copy (`text-xs`, “Marque diretamente no corpo:”, symbol row).

**Imports** (lines 1–8):

```typescript
import { useMemo, useState } from 'react'
import {
  FOCUS_REGIONS,
  focusRegionPathAriaLabel,
  listFocusRegionsByView,
  type FocusRegionKey,
  type FocusView,
} from '@/lib/focusRegions'
```

**Catalog filter** (lines 54–61). Marks whose `regionKey` is not in `FOCUS_REGIONS` are ignored. Old arm/leg marks on the ficha disappear from the drawing and are not split.

```typescript
for (const mark of marks) {
  if (FOCUS_REGIONS.some((r) => r.key === mark.regionKey)) {
    map.set(mark.regionKey, mark)
  }
}
```

**Click stays local** (lines 64–74, 99–120). `onClick` still calls `toggleRegion`. Add the same `pointerdown` `preventDefault` and `focus({ preventScroll: true })` rules as the focus card. This picker has no chip, so a click still toggles the evaluation mark. Paths use `tabIndex={canWrite ? 0 : undefined}` today; align that with the focus-card guard (`tabIndex={-1}` when writable, or the HTML-button fallback only if scroll proof fails). Do not sync `patient_focus_areas` (comment at lines 47–48).

```tsx
<path
  pointerEvents="fill"
  strokeWidth={0.65}
  className={`${regionClass(marked, active, canWrite)} outline-none`}
  tabIndex={canWrite ? 0 : undefined}
  onClick={() => toggleRegion(region.key)}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleRegion(region.key)
    }
  }}
/>
```

Active marked fill stays `fill-accent/50` (lines 34–44). Do not restyle it to the focus-card chip.

---

### `src/services/patientAiPdf.service.ts` (service, transform)

**Analog:** `BODY_MAP_CENTROIDS` and `drawBodyMap` in the same file.

**Imports** (lines 1–14):

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
import { FOCUS_REGIONS, listFocusRegionsByView, type FocusRegionKey } from '@/lib/focusRegions'
```

**Exhaustive centroid map** (lines 141–173). `Record<FocusRegionKey, { x, y }>` fails `npm run typecheck` if a new key has no entry or an old key remains. Delete the eight limb centroids. Add one centroid per new key, inside that path, in viewBox space (Y down). Leave centroids of unchanged keys as they are, including the current back-shoulder numbers.

```typescript
const BODY_MAP_CENTROIDS: Record<FocusRegionKey, { x: number; y: number }> = {
  'front.head': { x: 70, y: 24 },
  'front.arm_l': { x: 108, y: 100 },
  'front.leg_l': { x: 84, y: 218 },
  'back.arm_l': { x: 108, y: 100 },
  'back.leg_l': { x: 84, y: 220 },
}
```

**Draw** (lines 1425–1452). `mapHeight = 150`, `scale = mapHeight / 240`. Do not change `viewBox` height 240. `drawSvgPath` receives `region.path` raw. Marks outside `FOCUS_REGIONS` are skipped (lines 1418–1421).

```typescript
const mapHeight = 150
const scale = mapHeight / 240
ctx.page.drawSvgPath(region.path, {
  x: ox,
  y: originY,
  scale,
  color: marked ? COLORS.accentSoft : COLORS.white,
  borderColor: COLORS.navy,
  borderWidth: 0.55,
})
```

---

### `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` (service, transform)

**Analog:** the `Set` in this file (lines 62–94). This Edge Function cannot import `src/lib/focusRegions.ts`. Mirror the 42 keys here. Do not edit the phase 11 twin at `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts`. Deploy stays a human Dashboard step, not SQL and not `supabase db push`.

```typescript
/** Closed catalog — mirror src/lib/focusRegions.ts (30 keys). */
const FOCUS_REGION_KEYS = new Set([
  'front.head',
  'front.neck',
  'front.arm_l',
  'front.leg_l',
  'back.arm_l',
  'back.leg_l',
])
```

**Filter** (lines 528–538). Unknown keys, including the eight retired ones, are dropped before they reach the prompt list and the response.

```typescript
function filterFocusKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const key = item.trim()
    if (!FOCUS_REGION_KEYS.has(key) || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}
```

Update the comment from “30 keys” to 42. `catalogList` at line 391 joins this Set into the prompt, so replacing the Set is enough.

---

### `.planning/phases/19-boneco-de-rea-de-foco/sql/19-focus-region-retire.sql` (migration, batch)

**Analog (header):** `.planning/phases/18-minha-conta/sql/18-account.sql` lines 1–3.
**Analog (what not to touch):** `.planning/phases/06-silhueta-areas-de-foco/sql/06-patient-focus-region-key.sql` lines 28–40. The format check already accepts the new keys. Do not `ALTER` it. Do not `DROP POLICY`. Do not `UPDATE` surviving rows. Do not `LIKE '%arm%'` or `LIKE '%leg%'` (`upper_arm` contains `arm`).

```sql
-- REQ-29 foto e nome da própria conta. D-03, D-04.
-- Idempotente. O operador cola este arquivo no SQL Editor do Supabase e executa uma vez.
-- Aviso ao operador: não use supabase db push.
```

```sql
alter table public.patient_focus_areas
  add constraint patient_focus_areas_region_key_format
  check (region_key is null or region_key ~ '^(front|back)\.[a-z0-9_]+$');

create unique index if not exists patient_focus_areas_patient_region_key
  on public.patient_focus_areas (patient_id, region_key)
  where region_key is not null;
```

The new file is a single idempotent `DELETE` whose `IN` list is exactly the eight D-06 strings, plus a commented count query that expects zero rows. The warning sentence `não use supabase db push` stays inside a SQL comment. It is not a shell command. The human pastes the file in the SQL Editor. The executor does not run `supabase db push`.

---

### `supabase/19-focus-region-retire.sql` (migration, batch)

**Analog:** the planning file above, same bytes.

`.gitignore` line 14 ignores `/supabase/`. Write the gitignored copy so the operator has the same script the repo commits under `.planning/phases/19-boneco-de-rea-de-foco/sql/`. Do not commit the `supabase/` copy.

## Shared Patterns

### Catalog lock (Zod, no second client list)

**Source:** `src/schemas/patient.schema.ts` lines 1–3 and 37
**Apply to:** toggle, AI apply, and any new key. Do not add a tuple in `patient.schema.ts`.

```typescript
import { FOCUS_REGION_KEYS } from '@/lib/focusRegions'

export const focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS)
```

Ficha marks stay a free string (`src/schemas/evaluationFicha.schema.ts` `regionKey: z.string().trim().min(1)`). Do not tighten that schema in this phase.

### Toggle contract (unchanged)

**Source:** `src/services/patients.service.ts` lines 131–133 and 719–753
**Apply to:** new keys with no service edit. `sort_order` written on insert is `catalog.sortOrder`, so new keys must carry their own `sortOrder` and kept keys must keep theirs.

```typescript
function throwIfFocusError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

export async function togglePatientFocusArea(
  patientId: string,
  regionKey: string,
): Promise<'marked' | 'unmarked'> {
  const key = focusRegionKeySchema.parse(regionKey)
  const catalog = getFocusRegion(key)
  if (!catalog) {
    throw new Error(mapDbError({ code: '23514' }))
  }
  // SELECT by patient_id + region_key, then DELETE or INSERT
}
```

**Read mapper** (lines 355–368) drops `region_key` null and any key missing from the catalog. Retired keys vanish from the Resumo card after the catalog change, even before the SQL `DELETE`.

```typescript
focusAreas: (extras.focus ?? [])
  .sort((a, b) => a.sort_order - b.sort_order)
  .flatMap((area) => {
    if (area.region_key == null) return []
    const catalog = getFocusRegion(area.region_key)
    if (!catalog) return []
    return [{ id: area.id, regionKey: catalog.key, label: catalog.label, isActive: area.is_active }]
  }),
```

### Toast copy (unchanged)

**Source:** `src/hooks/usePatients.ts` lines 253–269
**Apply to:** the chip toggle. Do not add a toast for the SQL delete.

```typescript
export function useTogglePatientFocusArea(patientId: string) {
  return useMutation({
    mutationFn: (regionKey: string) => togglePatientFocusArea(patientId, regionKey),
    onSuccess: (result) => {
      invalidatePatient(qc, patientId)
      toast(result === 'marked' ? 'Área marcada' : 'Área desmarcada', 'success')
    },
    onError: (error: unknown) => {
      const permission = 'Você não tem permissão para esta ação.'
      if (error instanceof Error && error.message === permission) {
        toast(permission, 'error')
        return
      }
      toast('Não foi possível salvar a área. Tente de novo em instantes.', 'error')
    },
  })
}
```

### AI client discards unknown keys

**Source:** `src/services/patientAi.service.ts` lines 96–108
**Apply to:** the gap before the Edge Function is redeployed. A stale function that still emits `front.arm_l` cannot reinsert it.

```typescript
for (const raw of focusRegionKeys) {
  const parsed = focusRegionKeySchema.safeParse(raw)
  if (!parsed.success) continue
  const catalog = getFocusRegion(parsed.data)
  if (!catalog) continue
  // insert only; existing row is left as-is
}
```

### Scrollport

**Source:** `src/components/layout/AppShell.tsx` line 161
**Apply to:** the manual `scrollTop` proof. Do not restyle AppShell.

```tsx
<div className="panel-scroll min-h-dvh lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
```

### Write gate

**Source:** `PatientFocusAreasPanel` — `canWrite === false` unmounts the chip (lines 224–225, 274) and omits `tabIndex` (line 262). `BodyMapPicker` uses the same `canWrite` flag for cursor and click (lines 43, 65). Do not render a disabled chip. RLS policies from phase 3 stay. The SQL `DELETE` is operator-only, not a client RPC.

### Validation

Nyquist is `npm run typecheck` (`Record<FocusRegionKey, …>` plus `z.enum`). There is no Vitest script. SQL proof is the human count query in the SQL Editor. Scroll proof is manual: `.panel-scroll` `scrollTop` unchanged after hover and chip click on Palma da mão and Pé, and after a direct click on the evaluation map.

## No Analog Found

No new file lacks an analog. One behavior inside the existing panel does:

| Behavior | Role | Data Flow | Reason |
|----------|------|-----------|--------|
| Arrow keys move focus across regions of one figure | component | event-driven | No roving `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` handler exists under `src/`. The only `focus({ preventScroll: true })` is Escape in `PatientFocusAreasPanel.tsx` lines 163–165. Implement from `19-UI-SPEC.md`. Do not import lucide arrows. |

## Metadata

**Analog search scope:** `src/lib/focusRegions.ts`, `src/components/patients/`, `src/services/patients.service.ts`, `src/services/patientAi.service.ts`, `src/services/patientAiPdf.service.ts`, `src/hooks/usePatients.ts`, `src/schemas/patient.schema.ts`, `src/components/layout/AppShell.tsx`, `.planning/phases/06-silhueta-areas-de-foco/sql/`, `.planning/phases/18-minha-conta/sql/18-account.sql`, `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts`, `.planning/phases/11-resumo-ia/functions/patient-ai-summary/index.ts` (do not edit), `.gitignore`
**Files scanned:** 14
**Pattern extraction date:** 2026-09-24
