/** Teto de semanas aceito no campo de repetição (mesmo limite do agendamento semanal anterior). */
export const MAX_SERIES_WEEKS = 24

export interface SeriesWeekday {
  /** Rótulo visível no chip: Seg, Ter, Qua, Qui, Sex, Sáb, Dom */
  label: string
  /** aria-label completo: Segunda-feira ... Domingo */
  ariaLabel: string
  /** Índice de Date.getDay(): Dom=0, Seg=1 ... Sáb=6 */
  day: number
}

/** Ordem de exibição Seg -> Dom; `day` é o índice JS. */
export const SERIES_WEEKDAYS: readonly SeriesWeekday[] = [
  { label: 'Seg', ariaLabel: 'Segunda-feira', day: 1 },
  { label: 'Ter', ariaLabel: 'Terça-feira', day: 2 },
  { label: 'Qua', ariaLabel: 'Quarta-feira', day: 3 },
  { label: 'Qui', ariaLabel: 'Quinta-feira', day: 4 },
  { label: 'Sex', ariaLabel: 'Sexta-feira', day: 5 },
  { label: 'Sáb', ariaLabel: 'Sábado', day: 6 },
  { label: 'Dom', ariaLabel: 'Domingo', day: 0 },
]

function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm
}

/** '' | '0' | 'abc' | '-3' -> 1; '2.7' -> 2; '99' -> MAX_SERIES_WEEKS. */
export function clampWeeks(value: string): number {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(MAX_SERIES_WEEKS, Math.max(1, Math.trunc(count)))
}

/** Ciclos de 7 dias a partir de `start`; cada dia marcado ocorre 1x por ciclo. */
export function buildWeeklySeries(
  start: Date,
  weekdays: readonly number[],
  cycles: number,
): Date[] {
  const days = new Set(weekdays)
  const out: Date[] = []
  for (let k = 0; k < cycles; k += 1) {
    for (let o = 0; o < 7; o += 1) {
      const candidate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + k * 7 + o,
        start.getHours(),
        start.getMinutes(),
        0,
        0,
      )
      if (days.has(candidate.getDay())) out.push(candidate)
    }
  }
  return out
}

/** Cópia travada da UI-SPEC. Série vazia -> null (a página omite a caixa). */
export function buildSeriesPreview(
  series: readonly Date[],
  options: { weekdayCount: number; cycles: number; showTime: boolean },
): string | null {
  const first = series[0]
  const last = series[series.length - 1]
  if (!first || !last) return null

  const withYear = first.getFullYear() !== last.getFullYear()
  const dateFormat = new Intl.DateTimeFormat(
    'pt-BR',
    withYear
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: '2-digit' },
  )
  const timeSuffix = options.showTime
    ? `, às ${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(first)}`
    : ''

  if (series.length === 1) {
    return `Será criada 1 sessão agendada em ${dateFormat.format(first)}${timeSuffix}.`
  }

  const { weekdayCount, cycles } = options
  const weeks = `${cycles} ${plural(cycles, 'semana', 'semanas')}`
  const composition =
    weekdayCount === 1
      ? `${weeks}, 1 dia por semana`
      : `${weekdayCount} ${plural(weekdayCount, 'dia', 'dias')} × ${weeks}`

  return `Serão criadas ${series.length} sessões agendadas (${composition}), de ${dateFormat.format(first)} a ${dateFormat.format(last)}${timeSuffix}.`
}

/** total <= 1 -> 'Agendar'; total > 1 -> `Agendar ${total} sessões`. */
export function seriesCtaLabel(total: number): string {
  return total > 1 ? `Agendar ${total} sessões` : 'Agendar'
}
