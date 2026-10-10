const ZONE = 'America/Sao_Paulo'

const AXIS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

function invalidDate(): never {
  throw new Error('Data inválida')
}

function parseMonthKey(key: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match?.[1] || !match[2]) invalidDate()
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) invalidDate()
  return { year, month }
}

/** Chave YYYY-MM do instante no fuso civil de São Paulo. */
export function saoPauloMonthKey(instant: Date): string {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) invalidDate()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(instant)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  if (!year || !month) invalidDate()
  return `${year}-${month}`
}

/** Desloca a chave civil em `delta` meses, com aritmética ano*12+mês. */
export function shiftMonthKey(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key)
  const index = year * 12 + (month - 1) + delta
  const nextYear = Math.floor(index / 12)
  const nextMonth = index - nextYear * 12 + 1
  return `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}`
}

/** Doze chaves, da mais antiga ao mês corrente de `now`, inclusive. */
export function monthWindow(now: Date): string[] {
  const current = saoPauloMonthKey(now)
  const keys: string[] = []
  for (let delta = -11; delta <= 0; delta += 1) {
    keys.push(shiftMonthKey(current, delta))
  }
  return keys
}

/** Dia 15 às 15:00 UTC fica dentro do mês civil em America/Sao_Paulo. */
function monthAnchor(key: string): number {
  const { year, month } = parseMonthKey(key)
  const stamp = Date.parse(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-15T15:00:00.000Z`,
  )
  if (Number.isNaN(stamp)) invalidDate()
  return stamp
}

/** `março de 2026` — mês longo em pt-BR, minúsculo. */
export function monthSentence(key: string): string {
  const { year } = parseMonthKey(key)
  const monthName = new Intl.DateTimeFormat('pt-BR', {
    timeZone: ZONE,
    month: 'long',
  }).format(monthAnchor(key))
  return `${monthName.toLocaleLowerCase('pt-BR')} de ${year}`
}

/** `jan`–`dez` sem ponto; primeira barra e janeiro levam `/{aa}`. */
export function monthAxisLabel(key: string, first: boolean): string {
  const { year, month } = parseMonthKey(key)
  const abbr = AXIS[month - 1]
  if (!abbr) invalidDate()
  if (first || month === 1) return `${abbr}/${String(year).slice(-2)}`
  return abbr
}

/** Segundo clique na barra já selecionada volta ao mês corrente. */
export function toggleSelectedMonth(selected: string, clicked: string, currentKey: string): string {
  return selected === clicked ? currentKey : clicked
}

export interface PaidAnalyticsRow {
  scheduledAt: string
  priceName: string
  amountBrl: number
}

export interface MonthBar {
  key: string
  cents: number
  amountBrl: number
  axisLabel: string
  sentence: string
}

export interface PriceBar {
  name: string
  cents: number
  amountBrl: number
}

export interface MonthMoney {
  key: string
  sentence: string
  cents: number
  amountBrl: number
}

export interface FinanceAnalytics {
  hasPayments: boolean
  currentKey: string
  selectedKey: string
  months: MonthBar[]
  prices: PriceBar[]
  selected: MonthMoney
  previous: MonthMoney
}

function toCents(amountBrl: number): number {
  return Math.round(Number(amountBrl) * 100)
}

function priceGroupName(priceName: string): string {
  const trimmed = priceName.trim()
  return trimmed.length === 0 ? 'Avulso' : trimmed
}

function monthMoney(key: string, cents: number): MonthMoney {
  return {
    key,
    sentence: monthSentence(key),
    cents,
    amountBrl: cents / 100,
  }
}

/** Agrega o histórico já pago. Sem linhas, não inventa doze barras zeradas. */
export function buildFinanceAnalytics(
  rows: readonly PaidAnalyticsRow[],
  now: Date,
  selectedKey?: string,
): FinanceAnalytics {
  const currentKey = saoPauloMonthKey(now)
  const activeKey = selectedKey ?? currentKey
  const previousKey = shiftMonthKey(activeKey, -1)

  if (rows.length === 0) {
    return {
      hasPayments: false,
      currentKey,
      selectedKey: activeKey,
      months: [],
      prices: [],
      selected: monthMoney(activeKey, 0),
      previous: monthMoney(previousKey, 0),
    }
  }

  const monthCents = new Map<string, number>()
  const priceCents = new Map<string, number>()

  for (const row of rows) {
    const key = saoPauloMonthKey(new Date(row.scheduledAt))
    const cents = toCents(row.amountBrl)
    monthCents.set(key, (monthCents.get(key) ?? 0) + cents)
    if (key === activeKey) {
      const name = priceGroupName(row.priceName)
      priceCents.set(name, (priceCents.get(name) ?? 0) + cents)
    }
  }

  const months: MonthBar[] = monthWindow(now).map((key, index) => {
    const cents = monthCents.get(key) ?? 0
    return {
      key,
      cents,
      amountBrl: cents / 100,
      axisLabel: monthAxisLabel(key, index === 0),
      sentence: monthSentence(key),
    }
  })

  const prices: PriceBar[] = [...priceCents.entries()]
    .filter((entry) => entry[1] > 0)
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1]
      return left[0].localeCompare(right[0], 'pt-BR')
    })
    .map(([name, cents]) => ({
      name,
      cents,
      amountBrl: cents / 100,
    }))

  return {
    hasPayments: true,
    currentKey,
    selectedKey: activeKey,
    months,
    prices,
    selected: monthMoney(activeKey, monthCents.get(activeKey) ?? 0),
    previous: monthMoney(previousKey, monthCents.get(previousKey) ?? 0),
  }
}
