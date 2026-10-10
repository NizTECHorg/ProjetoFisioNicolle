import { useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react'
import {
  buildFinanceAnalytics,
  toggleSelectedMonth,
  type MonthBar,
  type MonthMoney,
  type PaidAnalyticsRow,
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

function moneyLabel(sentence: string, amountBrl: number): string {
  return `${sentence} · ${formatCurrency(amountBrl)}`
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

function MoneyCaption(props: { money: MonthMoney }) {
  return (
    <div>
      <p className="text-sm font-semibold leading-tight text-ink">{props.money.sentence}</p>
      <p className="mt-2 text-sm text-muted">{formatCurrency(props.money.amountBrl)}</p>
    </div>
  )
}

export function FinanceAnalyticsCharts(props: {
  rows: readonly PaidAnalyticsRow[]
  now: Date
  selectedMonthKey: string
  onSelectMonth: (key: string) => void
}): ReactElement {
  const view = buildFinanceAnalytics(props.rows, props.now, props.selectedMonthKey)

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
