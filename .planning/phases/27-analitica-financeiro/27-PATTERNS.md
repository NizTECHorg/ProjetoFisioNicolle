# Phase 27: Analítica no Financeiro - Pattern Map

**Mapped:** 2026-10-09
**Files analyzed:** 6
**Analogs found:** 6 / 6

Sources: `27-CONTEXT.md`, `27-RESEARCH.md`, `27-UI-SPEC.md`. No `.cursor/rules/` in this repo. Deferred ideas (PDF, meta, filtro por paciente, mudar Este mês / Este ano / Sempre) are out of scope.

Do not create `supabase/migrations`. Do not edit `src/pages/FinancePage.tsx`. Do not change `canSeeFinance`. Do not install a chart package.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/financeAnalytics.ts` | utility | transform | `src/lib/sessionSeries.ts` | exact |
| `src/lib/financeAnalytics.test.ts` | test | transform | `src/lib/sessionSeries.test.ts` | exact |
| `src/services/finance.service.ts` | service | request-response | `listFinanceRealizadas` / `mapCharge` in the same file | exact |
| `src/hooks/useFinance.ts` | hook | request-response | `useFinanceTotals` in the same file | exact |
| `src/components/finance/FinanceAnalyticsCharts.tsx` | component | transform | `ActivityChart` in `src/pages/DashboardPage.tsx` | role-match |
| `src/pages/AutonomoFinancePage.tsx` | page | request-response | the Totais section in the same file; tabs from `src/components/patients/PatientProfileHeader.tsx` | exact |

`src/types/finance.ts` stays as it is. The paid-row shape and the view models live in `financeAnalytics.ts` so the test imports them with a relative `.ts` path and never uses `@/`. The service maps PostgREST rows into that shape at the boundary, the same way `mapCharge` turns `amount_brl` into `number`.

## Pattern Assignments

### `src/lib/financeAnalytics.ts` (utility, transform)

**Analog:** `src/lib/sessionSeries.ts`

Pure named functions, no `@/` import, clock injected by the caller (`now`), exported types next to the functions. `src/lib/atividadeCapacidade.ts` is the same style; `sessionSeries.ts` is the closer analog because the research harness is `sessionSeries.test.ts`.

**Imports pattern** (lines 1–22): there is no import. Constants and types are local.

```typescript
/** Teto de semanas aceito no campo de repetição (mesmo limite do agendamento semanal anterior). */
export const MAX_SERIES_WEEKS = 24

export interface SeriesWeekday {
  label: string
  ariaLabel: string
  day: number
}
```

**Core pattern** (lines 35–40): export a function that takes the input plus an explicit start, and returns a plain array. Analytics should be `(rows, now) => views`. Do not call `new Date()` inside the function that the test exercises. Month keys use `Intl.DateTimeFormat` with `timeZone: 'America/Sao_Paulo'` (RESEARCH Pattern 3). Do not use `Date#getMonth()` or `formatDate`.

```typescript
export function buildWeeklySeries(
  start: Date,
  weekdays: readonly number[],
  cycles: number,
): Date[] {
```

**Currency at the edge, not inside this file:** `formatCurrency` stays in the component. This file sums integer cents (`Math.round(Number(amountBrl) * 100)`) and returns numbers. Empty `price_name` becomes the literal `Avulso` here, matching the page helper that already treats a blank name as avulso:

```42:45:src/pages/AutonomoFinancePage.tsx
function priceLabel(charge: SessionCharge | null): string {
  if (!charge) return 'Sem valor'
  return charge.priceName || 'Avulso'
}
```

**Error handling:** invalid ISO throws a plain `Error`, as RESEARCH shows. No `mapDbError` in this file. Empty input returns an empty view, not twelve zero bars — the component decides the empty sentence.

---

### `src/lib/financeAnalytics.test.ts` (test, transform)

**Analog:** `src/lib/sessionSeries.test.ts`

**Imports pattern** (lines 1–10): `node:test`, `node:assert/strict`, relative `./financeAnalytics.ts`. No `@/`, no Vitest, no schema import. `atividadeCapacidade.test.ts` pulls `../schemas/...` and is the wrong harness for this helper.

```typescript
import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import {
  MAX_SERIES_WEEKS,
  SERIES_WEEKDAYS,
  buildSeriesPreview,
  buildWeeklySeries,
  clampWeeks,
  seriesCtaLabel,
} from './sessionSeries.ts'
```

**Core pattern** (lines 12–23): a fixed clock factory, then `test('REQ-…')` with `equal` / `deepEqual`. Pass `now` into the helper. The required case is `2026-04-01T02:30:00.000Z` → month key `2026-03`.

```typescript
/** Sexta-feira 02/10/2026 às 09:00 (hora local). */
const friday = () => new Date(2026, 9, 2, 9, 0)

test('AC4: um único dia por N semanas rende as mesmas N datas do agendamento semanal anterior', () => {
  const series = buildWeeklySeries(friday(), [5], 3)
  deepEqual(dayOf(series), [2, 9, 16])
```

Run: `node --test src/lib/financeAnalytics.test.ts`.

---

### `src/services/finance.service.ts` (service, request-response)

**Analog:** the same file. Add `listFinancePaidForAnalytics`. Copy `throwIfError`, `Number(amount_brl)`, and the two-query `.in` fallback. Do not copy the `status = 'realizada'` or `patients(full_name)` filters from `listFinanceRealizadas`.

**Imports pattern** (lines 1–11):

```typescript
import { supabase } from '@/lib/supabase/client'
import { mapDbError, sanitizeText } from '@/lib/security'
import type {
  AutonomoPrice,
  CreatePriceInput,
  FinanceRealizadaRow,
  FinanceTotals,
  SessionCharge,
  UpdatePriceInput,
  UpsertSessionChargeInput,
} from '@/types/finance'
```

Add a type-only import from `@/lib/financeAnalytics` if the return type lives there. Do not add a new interface to `src/types/finance.ts` unless the planner keeps every finance DTO in that file; `SessionCharge` (lines 16–24 of `src/types/finance.ts`) is the shape to mirror, minus patient fields.

**Auth pattern** (lines 56–64): RLS is the authority. `requireUserId` is only needed when the write must stamp `owner_id`. The analytics read follows `fetchFinanceTotals`: no status filter, no `created_by` filter. `canSeeFinance` stays on the page.

```typescript
function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}
```

**Core read to extend, not to reuse as the analytics source** (lines 234–258): two queries and a `Map`. This is the fallback if `patient_sessions!inner(scheduled_at)` is rejected by the schema cache (RESEARCH open question 1). The first query must be paid charges, not `status = 'realizada'`. The second query selects `id, scheduled_at` only. Chunk `.in` if the id list is large; the existing call passes the whole list at once.

```typescript
export async function listFinanceRealizadas(): Promise<FinanceRealizadaRow[]> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('patient_sessions')
    .select(REALIZADA_COLUMNS)
    .eq('status', 'realizada')
    .eq('created_by', userId)
    .order('scheduled_at', { ascending: false })

  throwIfError(error)
  // ...
  const { data: chargeData, error: chargeError } = await supabase
    .from('autonomo_session_charges')
    .select(CHARGE_COLUMNS)
    .in('session_id', sessionIds)

  throwIfError(chargeError)
```

**Amount coercion** (lines 84–93): `amount_brl` is `number | string`. Convert at the map, then the helper sums cents.

```typescript
function mapCharge(row: ChargeRow): SessionCharge {
  return {
    id: row.id,
    ownerId: row.owner_id,
    sessionId: row.session_id,
    priceId: row.price_id,
    priceName: row.price_name,
    amountBrl: Number(row.amount_brl),
    isPaid: row.is_paid,
  }
}
```

**Preferred select** (no `.range` exists in `src/` — see No Analog Found): `from('autonomo_session_charges').select('id, price_name, amount_brl, is_paid, patient_sessions!inner(scheduled_at)').eq('is_paid', true).order('id', { ascending: true }).range(from, from + 999)`, loop while the page length is 1000. Columns stay `CHARGE_COLUMNS` plus the embed. Do not select `patients(full_name)` or `status`.

**Error handling:** `throwIfError(error)` after every query. The hook surfaces it; this function does not toast.

---

### `src/hooks/useFinance.ts` (hook, request-response)

**Analog:** `useFinanceTotals` (lines 36–44).

**Imports pattern** (lines 1–16): add `listFinancePaidForAnalytics` to the existing service import. Do not add a mutation.

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archivePrice,
  createPrice,
  fetchChargeBySessionId,
  fetchChargesBySessionIds,
  fetchFinanceTotals,
  listActivePrices,
  listFinanceRealizadas,
  markChargePaid,
  updatePrice,
  upsertSessionCharge,
} from '@/services/finance.service'
```

**Core pattern** (lines 26–44): `useAccountScope`, key under the `['finance']` prefix, `enabled: signedIn`, `staleTime: 60_000` like totals (this read is a full paid history, not the 30s session list).

```typescript
export function useFinanceTotals() {
  const { userId, signedIn } = useAccountScope()
  return useQuery({
    queryKey: ['finance', 'totals', userId],
    queryFn: fetchFinanceTotals,
    enabled: signedIn,
    staleTime: 60_000,
  })
}
```

New hook: `queryKey: ['finance', 'analytics', userId]`, `queryFn: listFinancePaidForAnalytics`.

**Invalidation** (lines 22–24): already prefix-matches. Do not add `exact: true`. Do not edit `useCreatePrice` / `useMarkChargePaid` / `useUpsertCharge`.

```typescript
function invalidateFinance(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['finance'] })
}
```

`onError` toast (lines 18–20) is for mutations only. The analytics query error stays on the page panel.

---

### `src/components/finance/FinanceAnalyticsCharts.tsx` (component, transform)

**Analog:** `ActivityChart` in `src/pages/DashboardPage.tsx` (lines 150–228). There is no `src/components/finance/` yet. Export a named function. Props in, no data fetch.

**Imports pattern:** copy the page’s class joining, not a chart library. `DashboardPage.tsx` line 1 is `import { useMemo, useState } from 'react'`. Currency:

```479:481:src/lib/security/index.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
```

Import `formatCurrency` from `@/lib/security`. Import the view types from `@/lib/financeAnalytics`. No `lucide-react` icon in this component (UI-SPEC).

**SVG shell to copy** (lines 150–177, 216–225): `viewBox` `0 0 560 220`, `preserveAspectRatio="xMidYMid meet"`, `overflow="visible"`, `className` includes `block h-56 w-full`. Tooltip is a `<g>` with `rect` `fill="#0b1d36"` and white text. Grid line is `stroke="#e1e8f0"` `strokeWidth="1"`. Transparent hit target is the `r="14"` circle — for a zero bar, use a transparent rect at least 44px tall instead of growing the visible bar.

```tsx
function ActivityChart({ days }: { days: Array<{ day: string; value: number }> }) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 560
  const height = 220
  // ...
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" overflow="visible" className="dash-chart block h-56 w-full overflow-visible lg:h-full lg:min-h-[10rem]">
      {/* grid: stroke="#e1e8f0" */}
      {/* hit target: <circle r="14" fill="transparent" /> */}
      {active ? (
        <g>
          <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx="10" fill="#0b1d36" />
          <text className="fill-white text-[10px] font-medium">
            {active.value} {active.value === 1 ? 'sessão' : 'sessões'}
          </text>
        </g>
      ) : null}
    </svg>
  )
}
```

**Do not copy from ActivityChart:** `className="dash-line"`, `transition-all duration-200`, `fillOpacity` area path, numeric Y ticks, `text-[10px]` / `text-[11px]` / `font-medium`, mouse-only handlers, session counts, `lg:h-full`. UI-SPEC typography for the new chart is `text-sm` (14px) and `font-semibold` on the tooltip. Tooltip height 32px (`xl` in the spec), `rx="8"`, text ` · ` + `formatCurrency`. `aria-label` equals that sentence. No patient name.

**Hover plus focus:** ActivityChart only has `onMouseEnter` / `onMouseLeave` (line 200). Add `onFocus` / `onBlur`. Hide the tooltip on mouse leave only when the bar is not focused.

**Keyboard on the month bar** — analog is the SVG path in `src/components/patients/evaluation/BodyMapPicker.tsx` (lines 155–161), not ActivityChart:

```tsx
onKeyDown: (event: ReactKeyboardEvent<SVGPathElement>) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleRegion(region.key)
  }
},
```

Month bars: `role="button"`, `tabIndex={0}`, `aria-pressed`, Enter and Space call the same toggle as click (`selected === key ? currentKey : key`). Price bars and comparison bars: `role="img"`, `tabIndex={0}`, no month change. Selected month bar `fill="#0b1d36"`. Other month bars and the previous-month bar `fill="#2f7dff"`. Price bars `fill="#2f7dff"` on a `#e1e8f0` track.

Empty paid list: no `<svg>`. One sentence, `text-sm font-semibold text-ink`: `Ainda não há pagamentos para analisar.` Selected month with zero, while other months have payments: `Nenhum pagamento neste mês.` in `text-sm text-muted`, and the month chart stays.

---

### `src/pages/AutonomoFinancePage.tsx` (page, request-response)

**Analog:** this file’s Totais section. Tab chrome from `PatientProfileHeader`. Local `useState` already exists (line 67).

**Guard to leave untouched** (lines 97–99):

```tsx
if (!canSeeFinance(profile?.accountType)) {
  return <Navigate to="/pacientes" replace />
}
```

`canSeeFinance` is `accountType === 'autonomo'` in `src/lib/accountAccess.ts` lines 23–26. Do not edit it.

**Loading and page-level error to keep for prices + totals** (lines 217–227). Analytics loading and error must not replace this article and must not flip `isError`.

```tsx
{isLoading ? (
  <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
  </div>
) : null}

{isError ? (
  <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
    Não foi possível carregar o financeiro. Tente de novo em instantes.
  </article>
) : null}
```

Analytics panel, only while the Analítica tab is mounted: same spinner (`h-7 w-7`, `border-forest`, `min-h-48`) and the same article classes, with the copy `Não foi possível carregar a analítica. Tente de novo em instantes.` `isLoading` / `isError` on the page stay `pricesLoading || totalsLoading` and `pricesError || totalsError` (lines 101–102). Call `useFinanceAnalytics` beside `useFinanceTotals` (lines 54–55) but do not fold its flags into those two.

**Totais block to wrap, not restyle** (lines 231–249): `h2` stays. Insert the tablist after the `h2`. The grid and the sentence move into the Totais panel only.

```tsx
<section className="dash-in">
  <h2 className="mb-4 text-xl font-semibold leading-tight text-ink">Totais</h2>
  <div className="grid gap-4 sm:grid-cols-3">
    <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
      <p className="text-sm text-muted">Este mês</p>
      <p className="mt-2 text-3xl font-semibold leading-tight text-ink">{monthTotal}</p>
    </article>
    {/* Este ano, Sempre — same article classes */}
  </div>
  <p className="mt-3 text-xs text-muted">
    Soma das sessões pagas, inclusive pré-pagas agendadas.
  </p>
</section>
```

Catalog and realizadas sections below stay mounted on both tabs. Do not wrap them in the tab panel.

**Tab visual analog** — `src/components/patients/PatientProfileHeader.tsx` lines 123–140. Copy `role="tablist"`, `role="tab"`, `aria-selected`, `min-h-11`, `border-b-2`, `-mb-px`, active `border-forest text-forest`, inactive `border-transparent text-muted hover:border-line hover:text-ink`, classes joined with `[...].join(' ')`.

```tsx
<nav
  className="col-start-2 mt-4 flex min-w-0 items-end gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-line sm:gap-6 [-ms-overflow-style:auto] [scrollbar-width:thin]"
  aria-label="Sessões do paciente"
  role="tablist"
>
  <button
    type="button"
    role="tab"
    aria-selected={activeTab === 'resumo'}
    className={[
      '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm font-medium transition-colors',
      activeTab === 'resumo'
        ? 'border-forest text-forest'
        : 'border-transparent text-muted hover:border-line hover:text-ink',
    ].join(' ')}
    onClick={() => onTabChange('resumo')}
  >
    Resumo
  </button>
</nav>
```

**Deviations required by UI-SPEC** (the analog does not do these):

- Labels exactly `Totais` and `Analítica`. `aria-label` of the nav: `Visões dos totais`.
- `text-sm font-semibold`, not `font-medium`. `gap-4`, not `gap-5` / `sm:gap-6`.
- `id` on each tab and `aria-controls` pointing at the panel. Panel: `role="tabpanel"` `aria-labelledby`. Only the active panel is mounted.
- State: `useState<'totais' | 'analitica'>('totais')`. No `useSearchParams`, no `localStorage`. Selected month is separate state and survives the tab switch.
- `PatientsPage.tsx` lines 156–165 is another `role="tablist"`, but it is a pill filter (`rounded-full`, `bg-forest text-white`). Do not copy that chrome.

Arrow keys, Home, and End are not on `PatientProfileHeader`. See No Analog Found.

## Shared Patterns

### Authentication

**Source:** `src/pages/AutonomoFinancePage.tsx` lines 97–99 and `src/lib/accountAccess.ts` lines 23–26.
**Apply to:** the page only. The new query relies on existing RLS. No new role check.

```typescript
export function canSeeFinance(accountType: AccountType | null | undefined): boolean {
  return accountType === 'autonomo'
}
```

### Error handling

**Source:** `throwIfError` in `src/services/finance.service.ts` lines 56–58, and `mapDbError` in `src/lib/security/index.ts` lines 259–264.
**Apply to:** `listFinancePaidForAnalytics` only. The page already maps thrown `Error.message` through React Query `isError`. Analytics copy is the UI-SPEC sentence, not `mapDbError`’s permission string and not the page sentence “Não foi possível carregar o financeiro.”

```typescript
export function mapDbError(error: { message?: string; code?: string }): string {
  const message = error.message?.toLowerCase() ?? ''
  const code = error.code ?? ''

  if (code === '42501' || message.includes('operation_not_permitted')) {
    return 'Você não tem permissão para esta ação.'
  }
```

### Validation

No new form and no Zod schema. `price_name` is rendered as SVG `<text>` and `aria-label`. Do not use `dangerouslySetInnerHTML`. `is_paid` is the boolean filter `.eq('is_paid', true)`.

### Reduced motion

**Source:** `src/index.css` lines 244–254 and 295–299.
**Apply to:** the new SVG must not use `dash-line`, `dash-in`, or `transition-all`. The existing Totais `section` may keep `dash-in`; the global media query already disables it. Do not add a new animation.

```css
@media (prefers-reduced-motion: reduce) {
  .dash-in,
  .dash-line,
  .dash-ring {
    animation: none !important;
  }
}

.dash-line {
  stroke-dasharray: 720;
  stroke-dashoffset: 720;
  animation: dash-draw 1.2s 0.4s ease forwards;
}
```

### Currency

**Source:** `formatCurrency` in `src/lib/security/index.ts` lines 479–481.
**Apply to:** every R$ on the new charts and the existing three cards. Do not add another `Intl.NumberFormat` for money. Month names are a separate `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'long' })` inside `financeAnalytics.ts`, not `formatDate` (that helper has no `timeZone` — lines 483–489).

## No Analog Found

| Gap | Role | Data Flow | Reason |
|-----|------|-----------|--------|
| `.range` page loop of 1000 inside `listFinancePaidForAnalytics` | service | request-response | `rg "\\.range\\("` over `src/` returns no hits. Copy `throwIfError` and `mapCharge`; take the loop from RESEARCH Pattern 2. |
| Home / End / ArrowLeft / ArrowRight on the finance tablist | page | request-response | `PatientProfileHeader` tabs have click only. `PatientFocusAreasPanel` (lines 199–217) and `BodyMapPicker` (lines 96–119) move focus with arrows and `preventDefault`, but they are region maps, not tabs, and they have no Home/End. Implement the UI-SPEC keys (Left/Right switch and focus, Home → Totais, End → Analítica) from the spec. |
| Horizontal price bars | component | transform | `ActivityChart` is a vertical point line. Layout (name, track `#e1e8f0`, fill proportional to the max name) comes from UI-SPEC, not from an existing SVG. |

## Metadata

**Analog search scope:** `src/lib`, `src/services/finance.service.ts`, `src/hooks/useFinance.ts`, `src/pages/AutonomoFinancePage.tsx`, `src/pages/DashboardPage.tsx`, `src/components/patients/PatientProfileHeader.tsx`, `src/components/patients/evaluation/BodyMapPicker.tsx`, `src/types/finance.ts`, `src/lib/security/index.ts`, `src/lib/accountAccess.ts`, `src/index.css`
**Files scanned:** 12 analogs read
**Pattern extraction date:** 2026-10-09
