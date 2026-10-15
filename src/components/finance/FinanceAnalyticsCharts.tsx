import { useId, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react'
import { Select } from '@/components/ui/Select'
import {
  analyticsPatientIds,
  analyticsYears,
  buildFinanceAnalytics,
  joinMonthKey,
  monthSentence,
  splitMonthKey,
  toggleSelectedMonth,
  type MonthBar,
  type MonthMoney,
  type PaidAnalyticsRow,
  type PriceBar,
} from '@/lib/financeAnalytics'
import { formatCurrency } from '@/lib/security'
import { smoothLinePath } from '@/lib/smoothPath'

const VIEW_W = 560
const VIEW_H = 220
const PAD = { l: 64, r: 16, t: 36, b: 36 }
const INNER_W = VIEW_W - PAD.l - PAD.r
const INNER_H = VIEW_H - PAD.t - PAD.b
const TOOLTIP_H = 32
const HIT_W_MIN = 28

const compactBrl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function moneyLabel(sentence: string, amountBrl: number): string {
  return `${sentence} · ${formatCurrency(amountBrl)}`
}

function priceLabel(name: string, amountBrl: number): string {
  return `${name} · ${formatCurrency(amountBrl)}`
}

function tooltipWidth(label: string): number {
  return Math.ceil(label.length * 7.2) + 24
}

/** Teto do eixo em centavos, arredondado para um número redondo em reais. */
function axisCeiling(peakCents: number): number {
  if (peakCents <= 0) return 10000
  const reais = peakCents / 100
  const magnitude = 10 ** Math.floor(Math.log10(reais))
  const step = magnitude / 2
  return Math.ceil(reais / step) * step * 100
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '')
  return `${first}${second}`.toUpperCase()
}

function MonthLine(props: {
  months: readonly MonthBar[]
  selectedKey: string
  currentKey: string
  onSelectMonth: (key: string) => void
}) {
  const gradientId = useId()
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const peak = props.months.reduce((max, bar) => Math.max(max, bar.cents), 0)
  const ceiling = axisCeiling(peak)
  const step = INNER_W / Math.max(props.months.length - 1, 1)
  const points = props.months.map((bar, index) => ({
    bar,
    x: PAD.l + index * step,
    y: PAD.t + INNER_H - (bar.cents / ceiling) * INNER_H,
  }))
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return null

  const line = smoothLinePath(points)
  const area = `${line} L ${last.x} ${PAD.t + INNER_H} L ${first.x} ${PAD.t + INNER_H} Z`
  const ticks = [0, 1 / 3, 2 / 3, 1].map((ratio) => Math.round(ceiling * ratio))
  const activeKey = hoverKey ?? focusKey
  const active = points.find((point) => point.bar.key === activeKey)
  const selected = points.find((point) => point.bar.key === props.selectedKey)
  const hitW = Math.max(HIT_W_MIN, step)

  function choose(key: string) {
    props.onSelectMonth(toggleSelectedMonth(props.selectedKey, key, props.currentKey))
  }

  function onKeyDown(event: ReactKeyboardEvent<SVGGElement>, key: string) {
    if (event.key === 'Enter') choose(key)
    if (event.key === ' ') {
      event.preventDefault()
      choose(key)
    }
  }

  const tooltip = active ? moneyLabel(active.bar.sentence, active.bar.amountBrl) : ''
  const tooltipW = tooltipWidth(tooltip)
  const tooltipX = active ? Math.max(4, Math.min(active.x - tooltipW / 2, VIEW_W - tooltipW - 4)) : 0
  const tooltipY = active ? Math.max(0, active.y - TOOLTIP_H - 12) : 0

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className="block h-64 w-full overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2f7dff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2f7dff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => {
        const y = PAD.t + INNER_H - (tick / ceiling) * INNER_H
        return (
          <g key={tick}>
            <line x1={PAD.l} x2={VIEW_W - PAD.r} y1={y} y2={y} stroke="#e1e8f0" strokeWidth="1" />
            <text x={PAD.l - 12} y={y + 4} textAnchor="end" className="fill-muted text-[11px]">
              {compactBrl.format(tick / 100)}
            </text>
          </g>
        )
      })}
      {selected ? (
        <line
          x1={selected.x}
          x2={selected.x}
          y1={PAD.t}
          y2={PAD.t + INNER_H}
          stroke="#0b1d36"
          strokeOpacity="0.25"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ) : null}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="#2f7dff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point) => {
        const isSelected = point.bar.key === props.selectedKey
        const isActive = point.bar.key === activeKey
        const label = moneyLabel(point.bar.sentence, point.bar.amountBrl)
        return (
          <g
            key={point.bar.key}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={label}
            className="cursor-pointer outline-none"
            onClick={() => choose(point.bar.key)}
            onKeyDown={(event) => onKeyDown(event, point.bar.key)}
            onMouseEnter={() => setHoverKey(point.bar.key)}
            onMouseLeave={() => setHoverKey(null)}
            onFocus={() => setFocusKey(point.bar.key)}
            onBlur={() => setFocusKey(null)}
          >
            <rect x={point.x - hitW / 2} y={PAD.t - 8} width={hitW} height={INNER_H + 16} fill="transparent" />
            {isSelected ? (
              <>
                <circle cx={point.x} cy={point.y} r="10" fill="#0b1d36" fillOpacity="0.12" />
                <circle cx={point.x} cy={point.y} r="6" fill="#0b1d36" stroke="#ffffff" strokeWidth="2" />
              </>
            ) : (
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 5.5 : 3.5}
                fill="#2f7dff"
                stroke="#ffffff"
                strokeWidth={isActive ? 2 : 0}
              />
            )}
            <text
              x={point.x}
              y={VIEW_H - 10}
              textAnchor="middle"
              className={isSelected ? 'fill-forest text-[11px] font-semibold' : 'fill-muted text-[11px]'}
            >
              {point.bar.axisLabel}
            </text>
          </g>
        )
      })}
      {active ? (
        <g pointerEvents="none">
          <rect x={tooltipX} y={tooltipY} width={tooltipW} height={TOOLTIP_H} rx="10" fill="#0b1d36" />
          <text
            x={tooltipX + tooltipW / 2}
            y={tooltipY + 20}
            textAnchor="middle"
            className="fill-white text-[11px] font-semibold"
          >
            {tooltip}
          </text>
        </g>
      ) : null}
    </svg>
  )
}

function PriceBars(props: { prices: readonly PriceBar[] }) {
  const peak = props.prices.reduce((max, price) => Math.max(max, price.cents), 0)

  return (
    <ul className="space-y-4">
      {props.prices.map((price) => {
        const width = peak > 0 ? Math.max(4, (price.cents / peak) * 100) : 0
        return (
          <li key={price.name} role="img" tabIndex={0} aria-label={priceLabel(price.name, price.amountBrl)}>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white"
              >
                {initials(price.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-ink">{price.name}</p>
                  <p className="shrink-0 text-sm font-semibold text-forest">{formatCurrency(price.amountBrl)}</p>
                </div>
                {/* Barra em div (rounded-full): SVG esticado deixava as pontas finas. */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
                  <div className="h-full min-w-1.5 rounded-full bg-accent" style={{ width: `${width}%` }} />
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function CompareCard(props: { money: MonthMoney; peakCents: number; selected: boolean; title: string }) {
  const width = props.peakCents > 0 ? Math.max(4, (props.money.cents / props.peakCents) * 100) : 4
  return (
    <div
      role="img"
      tabIndex={0}
      aria-label={moneyLabel(props.money.sentence, props.money.amountBrl)}
      className={[
        'dash-card flex h-full min-w-0 flex-col justify-between rounded-xl px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-4',
        props.selected ? 'bg-forest text-white' : 'bg-surface text-ink',
      ].join(' ')}
    >
      <div>
        <p className={props.selected ? 'text-xs text-white/70' : 'text-xs text-muted'}>{props.title}</p>
        <p className="mt-1 truncate text-xs font-semibold sm:text-sm">{props.money.sentence}</p>
      </div>
      <div className="mt-3 sm:mt-5">
        <p className="truncate text-lg font-semibold leading-none tracking-tight sm:text-2xl">{formatCurrency(props.money.amountBrl)}</p>
        <div
          className={['mt-3 h-1.5 w-full overflow-hidden rounded-full', props.selected ? 'bg-forest-mid' : 'bg-accent-soft'].join(' ')}
          aria-hidden="true"
        >
          <div
            className={['h-full min-w-1.5 rounded-full', props.selected ? 'bg-white' : 'bg-accent'].join(' ')}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function SummaryCard(props: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <article
      className={[
        'dash-card flex min-h-[92px] min-w-0 flex-col justify-between rounded-2xl bg-accent-soft p-3.5 sm:min-h-32 sm:rounded-[1.5rem] sm:p-5',
        props.className ?? '',
      ].join(' ')}
    >
      <p className="text-xs font-semibold leading-tight text-forest sm:text-sm">{props.label}</p>
      <div>
        <p className="truncate text-xl font-semibold leading-none tracking-tight text-ink sm:text-3xl">{props.value}</p>
        {props.hint ? <p className="mt-1 truncate text-[11px] text-forest/70 sm:mt-2 sm:text-xs">{props.hint}</p> : null}
      </div>
    </article>
  )
}

const ALL_PATIENTS = ''

function monthName(month: number): string {
  return monthSentence(joinMonthKey(2000, month)).replace(/ de 2000$/, '')
}

/** Mês, ano e paciente. O mês e o ano mexem no mesmo mês selecionado do gráfico. */
export function FinanceAnalyticsFilters(props: {
  rows: readonly PaidAnalyticsRow[]
  now: Date
  patientNames: ReadonlyMap<string, string>
  selectedMonthKey: string
  onSelectMonth: (key: string) => void
  patientId: string | null
  onSelectPatient: (patientId: string | null) => void
}): ReactElement {
  const { year, month } = splitMonthKey(props.selectedMonthKey)
  const years = analyticsYears(props.rows, props.now)
  if (!years.includes(year)) years.unshift(year)

  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: monthName(index + 1),
  }))
  const yearOptions = years.map((item) => ({ value: String(item), label: String(item) }))
  const patientOptions = [
    { value: ALL_PATIENTS, label: 'Todos os pacientes' },
    ...analyticsPatientIds(props.rows)
      .map((id) => ({ value: id, label: props.patientNames.get(id) ?? 'Paciente removido' }))
      .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')),
  ]

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-3.5 sm:grid-cols-3 sm:gap-4 sm:rounded-[1.5rem] sm:p-5">
      <Select
        id="finance-analytics-month"
        label="Mês"
        className="max-sm:!rounded-xl max-sm:!px-3 max-sm:!py-2.5 max-sm:!text-sm"
        value={String(month)}
        options={monthOptions}
        onChange={(event) => props.onSelectMonth(joinMonthKey(year, Number(event.target.value)))}
      />
      <Select
        id="finance-analytics-year"
        label="Ano"
        className="max-sm:!rounded-xl max-sm:!px-3 max-sm:!py-2.5 max-sm:!text-sm"
        value={String(year)}
        options={yearOptions}
        onChange={(event) => props.onSelectMonth(joinMonthKey(Number(event.target.value), month))}
      />
      <div className="col-span-2 sm:col-span-1">
      <Select
        id="finance-analytics-patient"
        className="max-sm:!rounded-xl max-sm:!px-3 max-sm:!py-2.5 max-sm:!text-sm"
        label="Paciente"
        value={props.patientId ?? ALL_PATIENTS}
        options={patientOptions}
        onChange={(event) => props.onSelectPatient(event.target.value || null)}
      />
      </div>
    </div>
  )
}

export function FinanceAnalyticsCharts(props: {
  rows: readonly PaidAnalyticsRow[]
  now: Date
  selectedMonthKey: string
  onSelectMonth: (key: string) => void
  patientId?: string | null
}): ReactElement {
  const view = buildFinanceAnalytics(props.rows, props.now, props.selectedMonthKey, {
    patientId: props.patientId,
  })

  if (view.filteredOut) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[1.5rem] border border-line bg-surface px-6 py-10 text-center text-sm font-semibold leading-tight text-ink">
        Nenhum pagamento deste paciente para analisar.
      </div>
    )
  }

  if (!view.hasPayments) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[1.5rem] border border-line bg-surface px-6 py-10 text-center text-sm font-semibold leading-tight text-ink">
        Ainda não há pagamentos para analisar.
      </div>
    )
  }

  const { year } = splitMonthKey(view.selectedKey)
  const yearCents = view.months.reduce((sum, bar) => sum + bar.cents, 0)
  const bestMonth = view.months.reduce<MonthBar | null>(
    (best, bar) => (bar.cents > (best?.cents ?? 0) ? bar : best),
    null,
  )
  const comparePeak = Math.max(view.selected.cents, view.previous.cents)

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        <SummaryCard label="Arrecadado no mês" value={formatCurrency(view.selected.amountBrl)} hint={view.selected.sentence} />
        <SummaryCard label={`Arrecadado em ${year}`} value={formatCurrency(yearCents / 100)} hint="Janeiro a dezembro" />
        <SummaryCard
          className="col-span-2 sm:col-span-1"
          label="Melhor mês do ano"
          value={bestMonth ? formatCurrency(bestMonth.amountBrl) : formatCurrency(0)}
          hint={bestMonth ? bestMonth.sentence : 'Nenhum pagamento neste ano'}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.7fr_1fr]">
        <article className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 sm:rounded-[1.5rem] sm:p-5">
          <h3 className="text-base font-semibold text-ink sm:text-lg">Por mês</h3>
          <p className="mt-1 text-xs text-muted">
            Arrecadado em {year}
            <span className="hidden sm:inline"> · clique num mês para ver os detalhes</span>
            <span className="sm:hidden"> · toque num mês</span>
          </p>
          <div className="mt-3">
            <MonthLine
              months={view.months}
              selectedKey={view.selectedKey}
              currentKey={view.currentKey}
              onSelectMonth={props.onSelectMonth}
            />
          </div>
        </article>

        <article className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 sm:rounded-[1.5rem] sm:p-5">
          <h3 className="text-base font-semibold text-ink sm:text-lg">Por preço</h3>
          <p className="mt-1 text-xs text-muted">{view.selected.sentence}</p>
          <div className="mt-3 min-h-0 flex-1 sm:mt-5">
            {view.selected.cents === 0 ? (
              <p className="text-sm text-muted">Nenhum pagamento neste mês.</p>
            ) : (
              <PriceBars prices={view.prices} />
            )}
          </div>
        </article>
      </div>

      <article className="rounded-2xl bg-accent-soft p-4 sm:rounded-[1.5rem] sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 lg:w-56 lg:shrink-0">
            <h3 className="text-base font-semibold text-forest sm:text-lg">Contra o mês anterior</h3>
            <p className="mt-1 hidden text-xs leading-5 text-forest/70 sm:block">
              O mês selecionado ao lado do mês imediatamente anterior.
            </p>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
            <CompareCard money={view.selected} peakCents={comparePeak} selected title="Mês selecionado" />
            <CompareCard money={view.previous} peakCents={comparePeak} selected={false} title="Mês anterior" />
          </div>
        </div>
      </article>
    </div>
  )
}
