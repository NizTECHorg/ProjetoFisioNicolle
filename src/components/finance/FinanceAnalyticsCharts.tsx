import {
  createElement,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react'
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

const VIEW_W = 560
const VIEW_H = 220
const TOOLTIP_H = 32
const TOOLTIP_GAP = 8
const PLOT_TOP = TOOLTIP_H + TOOLTIP_GAP
const PLOT_BOTTOM = 192
const PLOT_H = PLOT_BOTTOM - PLOT_TOP
const PAD_X = 8
const PLOT_W = VIEW_W - PAD_X * 2
const MIN_BAR = 4
const HIT_H = 44
const PRICE_ROW = 44
const PRICE_NAME_W = 176
const PRICE_TRACK_H = 8
const PRICE_TRACK_X = PRICE_NAME_W + TOOLTIP_GAP

function moneyLabel(sentence: string, amountBrl: number): string {
  return `${sentence} · ${formatCurrency(amountBrl)}`
}

function priceLabel(name: string, amountBrl: number): string {
  return `${name} · ${formatCurrency(amountBrl)}`
}

function priceFillWidth(cents: number, peak: number, trackW: number): number {
  if (cents <= 0 || peak <= 0) return 0
  return Math.min(trackW, Math.max(MIN_BAR, (cents / peak) * trackW))
}

function PriceName(props: { name: string; y: number }) {
  return (
    <foreignObject x={0} y={props.y} width={PRICE_NAME_W} height={PRICE_ROW}>
      {createElement(
        'div',
        {
          xmlns: 'http://www.w3.org/1999/xhtml',
          className: 'flex h-11 w-full items-center overflow-hidden',
        } as unknown as HTMLAttributes<HTMLDivElement>,
        createElement(
          'span',
          { className: 'block w-full truncate text-sm font-normal text-ink' },
          props.name,
        ),
      )}
    </foreignObject>
  )
}

function tooltipWidth(label: string): number {
  return Math.ceil(label.length * 8) + 16
}

function barPixelHeight(cents: number, peak: number): number {
  if (cents <= 0 || peak <= 0) return MIN_BAR
  return Math.max(MIN_BAR, (cents / peak) * PLOT_H)
}

function verticalBarBox(index: number, count: number, cents: number, peak: number) {
  const slot = PLOT_W / count
  const barW = slot * 0.6
  const x = PAD_X + index * slot + (slot - barW) / 2
  const visibleH = barPixelHeight(cents, peak)
  const y = PLOT_BOTTOM - visibleH
  return { x, barW, visibleH, y, centerX: x + barW / 2 }
}

function ChartTooltip(props: {
  label: string
  centerX: number
  barTop: number
  barBottom: number
  viewWidth: number
  viewHeight: number
}) {
  const boxW = tooltipWidth(props.label)
  const maxX = Math.max(0, props.viewWidth - boxW)
  const x = Math.min(Math.max(0, props.centerX - boxW / 2), maxX)
  let y = props.barTop - TOOLTIP_H - TOOLTIP_GAP
  if (y < 0) y = props.barBottom + TOOLTIP_GAP
  if (y + TOOLTIP_H > props.viewHeight) y = Math.max(0, props.viewHeight - TOOLTIP_H)

  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={boxW} height={TOOLTIP_H} rx="8" fill="#0b1d36" />
      <text x={x + boxW / 2} y={y + 21} textAnchor="middle" className="fill-white text-sm font-semibold">
        {props.label}
      </text>
    </g>
  )
}

function GridLines() {
  return (
    <>
      {[0, 1, 2, 3].map((index) => {
        const y = PLOT_TOP + (PLOT_H * index) / 3
        return (
          <line key={index} x1={PAD_X} x2={VIEW_W - PAD_X} y1={y} y2={y} stroke="#e1e8f0" strokeWidth="1" />
        )
      })}
    </>
  )
}

function useBarFocus() {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  return {
    activeId: hoverId ?? focusId,
    setHoverId,
    setFocusId,
  }
}

function MonthBars(props: {
  months: readonly MonthBar[]
  selectedKey: string
  currentKey: string
  onSelectMonth: (key: string) => void
}) {
  const { activeId, setHoverId, setFocusId } = useBarFocus()
  const peak = props.months.reduce((max, bar) => Math.max(max, bar.cents), 0)
  const activeIndex = props.months.findIndex((bar) => bar.key === activeId)
  const active = activeIndex >= 0 ? props.months[activeIndex] : undefined
  const activeBox = active
    ? verticalBarBox(activeIndex, props.months.length, active.cents, peak)
    : null

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

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className="mt-4 block h-56 w-full"
    >
      <GridLines />
      {props.months.map((bar, index) => {
        const box = verticalBarBox(index, props.months.length, bar.cents, peak)
        const selected = bar.key === props.selectedKey
        const label = moneyLabel(bar.sentence, bar.amountBrl)
        const hitH = Math.max(HIT_H, box.visibleH)
        return (
          <g
            key={bar.key}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={label}
            className="cursor-pointer"
            onClick={() => choose(bar.key)}
            onKeyDown={(event) => onKeyDown(event, bar.key)}
            onMouseEnter={() => setHoverId(bar.key)}
            onMouseLeave={() => setHoverId(null)}
            onFocus={() => setFocusId(bar.key)}
            onBlur={() => setFocusId(null)}
          >
            {selected ? (
              <rect x={box.x} y={box.y} width={box.barW} height={box.visibleH} fill="#0b1d36" />
            ) : (
              <rect x={box.x} y={box.y} width={box.barW} height={box.visibleH} fill="#2f7dff" />
            )}
            {hitH > box.visibleH ? (
              <rect x={box.x} y={PLOT_BOTTOM - hitH} width={box.barW} height={hitH} fill="transparent" />
            ) : null}
            <text x={box.centerX} y={PLOT_BOTTOM + 16} textAnchor="middle" className="fill-muted text-sm font-normal">
              {bar.axisLabel}
            </text>
          </g>
        )
      })}
      {active && activeBox ? (
        <ChartTooltip
          label={moneyLabel(active.sentence, active.amountBrl)}
          centerX={activeBox.centerX}
          barTop={activeBox.y}
          barBottom={activeBox.y + activeBox.visibleH}
          viewWidth={VIEW_W}
          viewHeight={VIEW_H}
        />
      ) : null}
    </svg>
  )
}

function CompareBars(props: { selected: MonthMoney; previous: MonthMoney }) {
  const { activeId, setHoverId, setFocusId } = useBarFocus()
  const bars = [
    { id: 'selected', money: props.selected, selected: true },
    { id: 'previous', money: props.previous, selected: false },
  ] as const
  const peak = Math.max(props.selected.cents, props.previous.cents)
  const activeIndex = bars.findIndex((bar) => bar.id === activeId)
  const active = activeIndex >= 0 ? bars[activeIndex] : undefined
  const activeBox = active
    ? verticalBarBox(activeIndex, bars.length, active.money.cents, peak)
    : null

  function onKeyDown(event: ReactKeyboardEvent<SVGGElement>) {
    if (event.key === 'Enter' || event.key === ' ') event.preventDefault()
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className="mt-4 block h-56 w-full"
    >
      <GridLines />
      {bars.map((bar, index) => {
        const box = verticalBarBox(index, bars.length, bar.money.cents, peak)
        const label = moneyLabel(bar.money.sentence, bar.money.amountBrl)
        const hitH = Math.max(HIT_H, box.visibleH)
        return (
          <g
            key={bar.id}
            role="img"
            tabIndex={0}
            aria-label={label}
            onKeyDown={onKeyDown}
            onMouseEnter={() => setHoverId(bar.id)}
            onMouseLeave={() => setHoverId(null)}
            onFocus={() => setFocusId(bar.id)}
            onBlur={() => setFocusId(null)}
          >
            {bar.selected ? (
              <rect x={box.x} y={box.y} width={box.barW} height={box.visibleH} fill="#0b1d36" />
            ) : (
              <rect x={box.x} y={box.y} width={box.barW} height={box.visibleH} fill="#2f7dff" />
            )}
            {hitH > box.visibleH ? (
              <rect x={box.x} y={PLOT_BOTTOM - hitH} width={box.barW} height={hitH} fill="transparent" />
            ) : null}
          </g>
        )
      })}
      {active && activeBox ? (
        <ChartTooltip
          label={moneyLabel(active.money.sentence, active.money.amountBrl)}
          centerX={activeBox.centerX}
          barTop={activeBox.y}
          barBottom={activeBox.y + activeBox.visibleH}
          viewWidth={VIEW_W}
          viewHeight={VIEW_H}
        />
      ) : null}
    </svg>
  )
}

function PriceBars(props: { prices: readonly PriceBar[] }) {
  const { activeId, setHoverId, setFocusId } = useBarFocus()
  const peak = props.prices.reduce((max, price) => Math.max(max, price.cents), 0)
  const trackW = VIEW_W - PRICE_TRACK_X - PAD_X
  const viewHeight = props.prices.length * PRICE_ROW
  const activeIndex = props.prices.findIndex((price) => price.name === activeId)
  const active = activeIndex >= 0 ? props.prices[activeIndex] : undefined

  function onPriceClick(event: ReactMouseEvent<SVGGElement>) {
    event.preventDefault()
  }

  function onPriceKeyDown(event: ReactKeyboardEvent<SVGGElement>) {
    if (event.key === ' ') event.preventDefault()
  }

  if (props.prices.length === 0) return null

  const activeFillW = active ? priceFillWidth(active.cents, peak, trackW) : 0
  const activeTrackY = activeIndex * PRICE_ROW + (PRICE_ROW - PRICE_TRACK_H) / 2

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className="mt-4 block w-full"
      height={viewHeight}
    >
      {props.prices.map((price, index) => {
        const rowY = index * PRICE_ROW
        const trackY = rowY + (PRICE_ROW - PRICE_TRACK_H) / 2
        const fillW = priceFillWidth(price.cents, peak, trackW)
        return (
          <g
            key={price.name}
            role="img"
            tabIndex={0}
            aria-label={priceLabel(price.name, price.amountBrl)}
            onClick={onPriceClick}
            onKeyDown={onPriceKeyDown}
            onMouseEnter={() => setHoverId(price.name)}
            onMouseLeave={() => setHoverId(null)}
            onFocus={() => setFocusId(price.name)}
            onBlur={() => setFocusId(null)}
          >
            <rect x={0} y={rowY} width={VIEW_W} height={PRICE_ROW} fill="transparent" />
            <PriceName name={price.name} y={rowY} />
            <rect x={PRICE_TRACK_X} y={trackY} width={trackW} height={PRICE_TRACK_H} fill="#e1e8f0" />
            <rect x={PRICE_TRACK_X} y={trackY} width={fillW} height={PRICE_TRACK_H} fill="#2f7dff" />
          </g>
        )
      })}
      {active ? (
        <ChartTooltip
          label={priceLabel(active.name, active.amountBrl)}
          centerX={PRICE_TRACK_X + activeFillW / 2}
          barTop={activeTrackY}
          barBottom={activeTrackY + PRICE_TRACK_H}
          viewWidth={VIEW_W}
          viewHeight={viewHeight}
        />
      ) : null}
    </svg>
  )
}

function MoneyCaption(props: { money: MonthMoney }) {
  return (
    <div>
      <p className="text-sm font-semibold leading-tight text-ink">{props.money.sentence}</p>
      <p className="mt-2 text-sm text-muted">{formatCurrency(props.money.amountBrl)}</p>
    </div>
  )
}

const ALL_PATIENTS = ''

function monthName(month: number): string {
  return monthSentence(joinMonthKey(2000, month)).replace(/ de 2000$/, '')
}

/** Mês, ano e paciente. O mês e o ano mexem no mesmo mês selecionado das barras. */
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
    <div className="grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-3 md:p-6">
      <Select
        id="finance-analytics-month"
        label="Mês"
        value={String(month)}
        options={monthOptions}
        onChange={(event) => props.onSelectMonth(joinMonthKey(year, Number(event.target.value)))}
      />
      <Select
        id="finance-analytics-year"
        label="Ano"
        value={String(year)}
        options={yearOptions}
        onChange={(event) => props.onSelectMonth(joinMonthKey(Number(event.target.value), month))}
      />
      <Select
        id="finance-analytics-patient"
        label="Paciente"
        value={props.patientId ?? ALL_PATIENTS}
        options={patientOptions}
        onChange={(event) => props.onSelectPatient(event.target.value || null)}
      />
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
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center text-sm font-semibold leading-tight text-ink">
        Nenhum pagamento deste paciente para analisar.
      </div>
    )
  }

  if (!view.hasPayments) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center text-sm font-semibold leading-tight text-ink">
        Ainda não há pagamentos para analisar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
        <h3 className="text-sm font-semibold leading-tight text-ink">Por mês</h3>
        <MonthBars
          months={view.months}
          selectedKey={view.selectedKey}
          currentKey={view.currentKey}
          onSelectMonth={props.onSelectMonth}
        />
      </article>
      <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
        <h3 className="text-sm font-semibold leading-tight text-ink">Por preço</h3>
        <p className="mt-4 text-sm font-semibold leading-tight text-ink">{view.selected.sentence}</p>
        {view.selected.cents === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum pagamento neste mês.</p>
        ) : (
          <PriceBars prices={view.prices} />
        )}
      </article>
      <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
        <h3 className="text-sm font-semibold leading-tight text-ink">Contra o mês anterior</h3>
        <CompareBars selected={view.selected} previous={view.previous} />
        <div className="mt-4 grid grid-cols-2 text-center">
          <MoneyCaption money={view.selected} />
          <MoneyCaption money={view.previous} />
        </div>
      </article>
    </div>
  )
}
