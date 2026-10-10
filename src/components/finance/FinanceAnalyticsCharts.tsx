import {
  createElement,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react'
import {
  buildFinanceAnalytics,
  toggleSelectedMonth,
  type MonthBar,
  type MonthMoney,
  type PaidAnalyticsRow,
  type PriceBar,
} from '@/lib/financeAnalytics'
import { formatCurrency } from '@/lib/security'

const VIEW_W = 640
const VIEW_H = 220
const TOOLTIP_H = 32
const TOOLTIP_GAP = 8
const PLOT_TOP = TOOLTIP_H + TOOLTIP_GAP
const PLOT_BOTTOM = 188
const PLOT_H = PLOT_BOTTOM - PLOT_TOP
const PAD_X = 12
const PLOT_W = VIEW_W - PAD_X * 2
const MIN_BAR = 4
const HIT_H = 44
const PRICE_ROW = 52
const PRICE_NAME_W = 160
const PRICE_TRACK_H = 10
const PRICE_TRACK_X = PRICE_NAME_W + 16

const PALETTE = [
  '#2f7dff',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#64748b',
] as const

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

function PriceName(props: { name: string; y: number; count: number }) {
  return (
    <foreignObject x={0} y={props.y} width={PRICE_NAME_W} height={PRICE_ROW}>
      {createElement(
        'div',
        {
          xmlns: 'http://www.w3.org/1999/xhtml',
          className: 'flex h-full flex-col justify-center overflow-hidden pr-2',
        } as unknown as HTMLAttributes<HTMLDivElement>,
        createElement(
          'span',
          { className: 'block truncate text-sm font-semibold text-ink' },
          props.name,
        ),
        createElement(
          'span',
          { className: 'block text-xs text-muted font-normal' },
          `${props.count} ${props.count === 1 ? 'sessão' : 'sessões'}`,
        ),
      )}
    </foreignObject>
  )
}

function tooltipWidth(label: string): number {
  return Math.ceil(label.length * 8) + 20
}

function barPixelHeight(cents: number, peak: number): number {
  if (cents <= 0 || peak <= 0) return MIN_BAR
  return Math.max(MIN_BAR, (cents / peak) * PLOT_H)
}

function verticalBarBox(index: number, count: number, cents: number, peak: number) {
  const slot = PLOT_W / count
  const barW = Math.min(36, slot * 0.58)
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
      <text x={x + boxW / 2} y={y + 21} textAnchor="middle" className="fill-white text-xs font-semibold">
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
          <line
            key={index}
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={y}
            y2={y}
            stroke="#e1e8f0"
            strokeWidth="1"
            strokeDasharray={index === 3 ? undefined : '4 4'}
          />
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
      className="mt-4 block h-64 w-full"
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
              <g>
                <rect
                  x={box.x - 3}
                  y={box.y - 3}
                  width={box.barW + 6}
                  height={box.visibleH + 6}
                  rx="9"
                  fill="#2f7dff"
                  fillOpacity="0.18"
                />
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.barW}
                  height={box.visibleH}
                  rx="6"
                  fill="#0b1d36"
                />
                <circle
                  cx={box.centerX}
                  cy={box.y + 6}
                  r="2.5"
                  fill="#2f7dff"
                />
              </g>
            ) : (
              <rect
                x={box.x}
                y={box.y}
                width={box.barW}
                height={box.visibleH}
                rx="6"
                fill="#2f7dff"
                fillOpacity={bar.cents === 0 ? '0.35' : '0.9'}
              />
            )}
            {hitH > box.visibleH ? (
              <rect
                x={box.x - 4}
                y={PLOT_BOTTOM - hitH}
                width={box.barW + 8}
                height={hitH}
                fill="transparent"
              />
            ) : null}
            <text
              x={box.centerX}
              y={PLOT_BOTTOM + 18}
              textAnchor="middle"
              className={`text-xs ${
                selected ? 'fill-ink font-semibold' : 'fill-muted font-normal'
              }`}
            >
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

function DonutChart(props: { prices: readonly PriceBar[]; totalAmountBrl: number }) {
  const totalCents = props.prices.reduce((sum, p) => sum + p.cents, 0)
  const radius = 58
  const strokeWidth = 18
  const circumference = 2 * Math.PI * radius
  let accumulatedAngle = 0

  if (totalCents === 0) return null

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 160 160"
        className="h-44 w-44 -rotate-90 transform"
        role="img"
        aria-label="Gráfico de distribuição por preço"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="transparent"
          stroke="#e1e8f0"
          strokeWidth={strokeWidth}
        />
        {props.prices.map((price, idx) => {
          const ratio = price.cents / totalCents
          const strokeDasharray = `${ratio * circumference} ${circumference}`
          const strokeDashoffset = -accumulatedAngle * circumference
          accumulatedAngle += ratio
          const color = PALETTE[idx % PALETTE.length]

          return (
            <circle
              key={price.name}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xs font-normal text-muted">Total</span>
        <span className="text-sm font-semibold text-ink">
          {formatCurrency(props.totalAmountBrl)}
        </span>
      </div>
    </div>
  )
}

function PriceBars(props: { prices: readonly PriceBar[]; totalAmountBrl?: number }) {
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      {props.totalAmountBrl !== undefined ? (
        <div className="flex shrink-0 justify-center">
          <DonutChart prices={props.prices} totalAmountBrl={props.totalAmountBrl} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${VIEW_W} ${viewHeight}`}
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
          className="block w-full"
          height={viewHeight}
          role="img"
          aria-label="Distribuição dos preços praticados"
        >
          {props.prices.map((price, index) => {
            const rowY = index * PRICE_ROW
            const trackY = rowY + (PRICE_ROW - PRICE_TRACK_H) / 2
            const fillW = priceFillWidth(price.cents, peak, trackW)
            const color = PALETTE[index % PALETTE.length]
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
                <circle cx={6} cy={rowY + PRICE_ROW / 2} r="4" fill={color} />
                <PriceName name={price.name} y={rowY} count={price.count} />
                <rect
                  x={PRICE_TRACK_X}
                  y={trackY}
                  width={trackW}
                  height={PRICE_TRACK_H}
                  rx="5"
                  fill="#e1e8f0"
                />
                <rect
                  x={PRICE_TRACK_X}
                  y={trackY}
                  width={fillW}
                  height={PRICE_TRACK_H}
                  rx="5"
                  fill="#2f7dff"
                />
                <text
                  x={VIEW_W - PAD_X}
                  y={trackY - 4}
                  textAnchor="end"
                  className="fill-ink text-xs font-semibold"
                >
                  {formatCurrency(price.amountBrl)}
                </text>
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
      </div>
    </div>
  )
}

function CompareBars(props: { selected: MonthMoney; previous: MonthMoney }) {
  const { activeId, setHoverId, setFocusId } = useBarFocus()
  const bars = [
    { id: 'selected', money: props.selected, selected: true, subtitle: 'Mês selecionado' },
    { id: 'previous', money: props.previous, selected: false, subtitle: 'Mês anterior' },
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
              <g>
                <rect
                  x={box.x - 3}
                  y={box.y - 3}
                  width={box.barW + 6}
                  height={box.visibleH + 6}
                  rx="9"
                  fill="#2f7dff"
                  fillOpacity="0.18"
                />
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.barW}
                  height={box.visibleH}
                  rx="6"
                  fill="#0b1d36"
                />
              </g>
            ) : (
              <rect
                x={box.x}
                y={box.y}
                width={box.barW}
                height={box.visibleH}
                rx="6"
                fill="#2f7dff"
              />
            )}
            {hitH > box.visibleH ? (
              <rect
                x={box.x - 4}
                y={PLOT_BOTTOM - hitH}
                width={box.barW + 8}
                height={hitH}
                fill="transparent"
              />
            ) : null}
            <text
              x={box.centerX}
              y={PLOT_BOTTOM + 18}
              textAnchor="middle"
              className="fill-ink text-xs font-semibold"
            >
              {bar.subtitle}
            </text>
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
    <div className="rounded-xl border border-line bg-surface-subtle p-3 text-center">
      <p className="text-xs font-normal text-muted capitalize">{props.money.sentence}</p>
      <p className="mt-1 text-base font-semibold leading-tight text-ink">
        {formatCurrency(props.money.amountBrl)}
      </p>
      <p className="mt-0.5 text-xs text-muted font-normal">
        {props.money.count} {props.money.count === 1 ? 'sessão paga' : 'sessões pagas'}
      </p>
    </div>
  )
}

function SummaryCards(props: {
  selected: MonthMoney
  previous: MonthMoney
  averageBrl: number
  deltaPercentage: number | null
  deltaBrl: number
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Receitas */}
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-normal text-muted">Receita no mês</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs">
            $
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold leading-tight text-ink">
          {formatCurrency(props.selected.amountBrl)}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {props.deltaPercentage !== null ? (
            props.deltaPercentage >= 0 ? (
              <span className="inline-flex items-center font-semibold text-emerald-600">
                ↑ +{props.deltaPercentage}%
              </span>
            ) : (
              <span className="inline-flex items-center font-semibold text-rose-600">
                ↓ {props.deltaPercentage}%
              </span>
            )
          ) : (
            <span className="font-normal text-muted">Primeiro registro</span>
          )}
          <span className="text-muted font-normal">vs. mês anterior</span>
        </div>
      </article>

      {/* Mês Anterior */}
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-normal text-muted">Mês anterior</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
            ←
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold leading-tight text-ink">
          {formatCurrency(props.previous.amountBrl)}
        </p>
        <p className="mt-2 text-xs text-muted font-normal capitalize truncate">
          {props.previous.sentence}
        </p>
      </article>

      {/* Ticket Médio */}
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-normal text-muted">Ticket médio</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs">
            ⌀
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold leading-tight text-ink">
          {formatCurrency(props.averageBrl)}
        </p>
        <p className="mt-2 text-xs text-muted font-normal">
          Por sessão realizada e paga
        </p>
      </article>

      {/* Volume de Atendimentos */}
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-normal text-muted">Sessões pagas</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-purple-600 font-bold text-xs">
            #
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold leading-tight text-ink">
          {props.selected.count}
        </p>
        <p className="mt-2 text-xs text-muted font-normal">
          {props.selected.count === 1 ? 'atendimento no mês' : 'atendimentos no mês'}
        </p>
      </article>
    </div>
  )
}

function RecentPaymentsList(props: { payments: readonly { scheduledAt: string; priceName: string; amountBrl: number }[] }) {
  if (props.payments.length === 0) return null

  function formatDate(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 md:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight text-ink">Últimas sessões do mês</h3>
          <p className="mt-1 text-xs text-muted font-normal">
            Histórico das sessões pagas registradas neste período
          </p>
        </div>
        <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-muted">
          {props.payments.length} {props.payments.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="mt-3 divide-y divide-line/60">
        {props.payments.slice(0, 6).map((item, idx) => (
          <div key={`${item.scheduledAt}-${idx}`} className="flex items-center justify-between py-2.5 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs">
                ✓
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink leading-tight">{item.priceName}</p>
                <p className="text-xs text-muted font-normal">{formatDate(item.scheduledAt)}</p>
              </div>
            </div>
            <span className="font-semibold text-emerald-600 shrink-0 pl-2">
              + {formatCurrency(item.amountBrl)}
            </span>
          </div>
        ))}
      </div>
    </article>
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
      {/* 4 Cards de Resumo */}
      <SummaryCards
        selected={view.selected}
        previous={view.previous}
        averageBrl={view.selectedAverageBrl}
        deltaPercentage={view.deltaPercentage}
        deltaBrl={view.deltaBrl}
      />

      {/* Gráfico 1: Evolução Mensal */}
      <article className="rounded-2xl border border-line bg-surface p-4 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h3 className="text-sm font-semibold leading-tight text-ink">Por mês</h3>
            <p className="mt-1 text-xs text-muted font-normal">
              Histórico dos últimos 12 meses · Selecione um mês para filtrar as demais visões
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-surface-subtle px-3 py-1 text-xs font-semibold text-ink capitalize">
            Filtro ativo: {view.selected.sentence}
          </span>
        </div>
        <MonthBars
          months={view.months}
          selectedKey={view.selectedKey}
          currentKey={view.currentKey}
          onSelectMonth={props.onSelectMonth}
        />
      </article>

      {/* Grid de Gráficos Secundários: Por Preço e Comparativo */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 2: Por Preço / Serviços */}
        <article className="rounded-2xl border border-line bg-surface p-4 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold leading-tight text-ink">Por preço</h3>
            <p className="mt-1 text-xs text-muted font-normal capitalize">
              {view.selected.sentence}
            </p>
            {view.selected.cents === 0 ? (
              <p className="mt-8 text-center text-sm text-muted font-normal">
                Nenhum pagamento neste mês.
              </p>
            ) : (
              <div className="mt-4">
                <PriceBars prices={view.prices} totalAmountBrl={view.selected.amountBrl} />
              </div>
            )}
          </div>
        </article>

        {/* Gráfico 3: Comparativo com o mês anterior */}
        <article className="rounded-2xl border border-line bg-surface p-4 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold leading-tight text-ink">Contra o mês anterior</h3>
            <p className="mt-1 text-xs text-muted font-normal">
              Comparativo direto de arrecadação entre o mês selecionado e o imediatamente anterior
            </p>
            <CompareBars selected={view.selected} previous={view.previous} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <MoneyCaption money={view.selected} />
            <MoneyCaption money={view.previous} />
          </div>
        </article>
      </div>

      {/* Lista de Atendimentos do Mês */}
      <RecentPaymentsList payments={view.selectedPayments} />
    </div>
  )
}
