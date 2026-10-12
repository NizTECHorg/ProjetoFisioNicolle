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

/** Sexta-feira 02/10/2026 às 09:00 (hora local). */
const friday = () => new Date(2026, 9, 2, 9, 0)
/** Segunda-feira 28/12/2026 às 14:30 (hora local). */
const mondayYearEnd = () => new Date(2026, 11, 28, 14, 30)

const dayOf = (dates: Date[]) => dates.map((date) => date.getDate())
const ymd = (dates: Date[]) =>
  dates.map((date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()])

test('AC4: um único dia por N semanas rende as mesmas N datas do agendamento semanal anterior', () => {
  const series = buildWeeklySeries(friday(), [5], 3)
  deepEqual(dayOf(series), [2, 9, 16])
  deepEqual(
    series.map((date) => date.getTime()),
    [0, 1, 2].map((k) => new Date(2026, 9, 2 + k * 7, 9, 0).getTime()),
  )
})

test('AC1 + AC3: segunda, quarta e sábado por 2 semanas rendem 6 datas em ordem, no mesmo horário', () => {
  const series = buildWeeklySeries(friday(), [1, 3, 6], 2)
  deepEqual(dayOf(series), [3, 5, 7, 10, 12, 14])
  equal(series.length, 6)
  for (const date of series) {
    equal(date.getHours(), 9)
    equal(date.getMinutes(), 0)
  }
  for (let index = 1; index < series.length; index += 1) {
    ok(series[index]!.getTime() > series[index - 1]!.getTime())
  }
})

test('AC2: a data inicial marcada entra junto e a ordem segue cronológica', () => {
  const series = buildWeeklySeries(friday(), [5, 1], 2)
  deepEqual(dayOf(series), [2, 5, 9, 12])
})

test('T-21-04: dias duplicados não duplicam datas', () => {
  const series = buildWeeklySeries(friday(), [1, 1, 3], 1)
  deepEqual(dayOf(series), [5, 7])
})

test('T-21-04: conjunto vazio ou índices fora de 0..6 não geram datas', () => {
  deepEqual(buildWeeklySeries(friday(), [], 3), [])
  deepEqual(buildWeeklySeries(friday(), [7, -1, 9], 3), [])
})

test('AC3: série que atravessa mês e ano mantém o horário local', () => {
  const series = buildWeeklySeries(mondayYearEnd(), [1, 3], 2)
  equal(series.length, 4)
  deepEqual(ymd(series), [
    [2026, 12, 28],
    [2026, 12, 30],
    [2027, 1, 4],
    [2027, 1, 6],
  ])
  for (const date of series) {
    equal(date.getHours(), 14)
    equal(date.getMinutes(), 30)
  }
})

test('T-21-02: clampWeeks normaliza vazio, zero, texto e negativo para 1', () => {
  equal(clampWeeks(''), 1)
  equal(clampWeeks('0'), 1)
  equal(clampWeeks('abc'), 1)
  equal(clampWeeks('-3'), 1)
})

test('T-21-02: clampWeeks trunca decimais e limita ao teto', () => {
  equal(clampWeeks('2.7'), 2)
  equal(clampWeeks('24'), 24)
  equal(clampWeeks('99'), 24)
  equal(clampWeeks('99'), MAX_SERIES_WEEKS)
})

test('SERIES_WEEKDAYS exibe Seg -> Dom com o índice JS correto (Pitfall 1)', () => {
  equal(SERIES_WEEKDAYS.length, 7)
  deepEqual(
    SERIES_WEEKDAYS.map((item) => item.label),
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  )
  deepEqual(
    SERIES_WEEKDAYS.map((item) => item.day),
    [1, 2, 3, 4, 5, 6, 0],
  )
  equal(SERIES_WEEKDAYS[0]!.ariaLabel, 'Segunda-feira')
  equal(SERIES_WEEKDAYS[6]!.ariaLabel, 'Domingo')
})

test('preview: uma única data usa o singular e respeita showTime', () => {
  const series = buildWeeklySeries(friday(), [5], 1)
  equal(
    buildSeriesPreview(series, { weekdayCount: 1, cycles: 1, showTime: true }),
    'Será criada 1 sessão agendada em 02/10, às 09:00.',
  )
  equal(
    buildSeriesPreview(series, { weekdayCount: 1, cycles: 1, showTime: false }),
    'Será criada 1 sessão agendada em 02/10.',
  )
})

test('preview: vários dias por várias semanas mostra D dias × S semanas', () => {
  const series = buildWeeklySeries(friday(), [1, 3, 6], 2)
  equal(
    buildSeriesPreview(series, { weekdayCount: 3, cycles: 2, showTime: true }),
    'Serão criadas 6 sessões agendadas (3 dias × 2 semanas), de 03/10 a 14/10, às 09:00.',
  )
})

test('preview: um dia por semana mostra S semanas, 1 dia por semana', () => {
  const series = buildWeeklySeries(friday(), [5], 3)
  equal(
    buildSeriesPreview(series, { weekdayCount: 1, cycles: 3, showTime: true }),
    'Serão criadas 3 sessões agendadas (3 semanas, 1 dia por semana), de 02/10 a 16/10, às 09:00.',
  )
})

test('preview: uma semana usa o singular', () => {
  const series = buildWeeklySeries(friday(), [1, 3, 6], 1)
  equal(
    buildSeriesPreview(series, { weekdayCount: 3, cycles: 1, showTime: true }),
    'Serão criadas 3 sessões agendadas (3 dias × 1 semana), de 03/10 a 07/10, às 09:00.',
  )
})

test('preview: virada de ano inclui o ano nas duas pontas', () => {
  const series = buildWeeklySeries(mondayYearEnd(), [1, 3], 2)
  equal(
    buildSeriesPreview(series, { weekdayCount: 2, cycles: 2, showTime: true }),
    'Serão criadas 4 sessões agendadas (2 dias × 2 semanas), de 28/12/2026 a 06/01/2027, às 14:30.',
  )
})

test('preview: série vazia devolve null', () => {
  equal(buildSeriesPreview([], { weekdayCount: 1, cycles: 1, showTime: true }), null)
})

test('CTA: 0 e 1 devolvem Agendar; mais de 1 devolve a contagem', () => {
  equal(seriesCtaLabel(1), 'Agendar')
  equal(seriesCtaLabel(0), 'Agendar')
  equal(seriesCtaLabel(6), 'Agendar 6 sessões')
})
