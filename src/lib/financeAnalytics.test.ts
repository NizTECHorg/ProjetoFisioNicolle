import { test } from 'node:test'
import { deepEqual, equal, throws } from 'node:assert/strict'
import {
  buildFinanceAnalytics,
  monthAxisLabel,
  monthSentence,
  monthWindow,
  saoPauloMonthKey,
  shiftMonthKey,
  toggleSelectedMonth,
} from './financeAnalytics.ts'

/** Relógio injetado. Nunca `new Date()` sem argumento. */
const at = (iso: string) => new Date(iso)

test('REQ-38: 2026-04-01T02:30:00.000Z cai no mês civil 2026-03 em America/Sao_Paulo', () => {
  equal(saoPauloMonthKey(at('2026-04-01T02:30:00.000Z')), '2026-03')
})

test('REQ-38: monthWindow de 2026-10-15 tem doze chaves de 2025-11 a 2026-10', () => {
  const keys = monthWindow(at('2026-10-15T15:00:00.000Z'))
  equal(keys.length, 12)
  deepEqual(keys, [
    '2025-11',
    '2025-12',
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
  ])
})

test('REQ-38: eixo sem ponto; primeira barra e janeiro levam ano curto', () => {
  equal(monthAxisLabel('2025-11', true), 'nov/25')
  equal(monthAxisLabel('2026-01', false), 'jan/26')
  equal(monthAxisLabel('2026-10', false), 'out')
})

test('REQ-38: monthSentence devolve mês minúsculo, de e o ano', () => {
  equal(monthSentence('2026-03'), 'março de 2026')
})

test('REQ-38: shiftMonthKey atravessa janeiro para dezembro do ano anterior', () => {
  equal(shiftMonthKey('2026-01', -1), '2025-12')
})

test('REQ-38: segundo clique na mesma barra volta ao corrente; clique no corrente permanece', () => {
  equal(toggleSelectedMonth('2026-03', '2026-03', '2026-10'), '2026-10')
  equal(toggleSelectedMonth('2026-10', '2026-10', '2026-10'), '2026-10')
  equal(toggleSelectedMonth('2026-10', '2026-03', '2026-10'), '2026-03')
})

test('REQ-38: data inválida lança Error com a mensagem Data inválida', () => {
  throws(() => saoPauloMonthKey(at('not-a-date')), { message: 'Data inválida' })
})

/** Outubro de 2026, meio do dia em São Paulo. */
const now = at('2026-10-15T15:00:00.000Z')

test('REQ-38: 10.1 mais 10.1 vira 2020 centavos e amountBrl 20.2', () => {
  const view = buildFinanceAnalytics(
    [
      { scheduledAt: '2026-10-10T15:00:00.000Z', priceName: 'Sessão', amountBrl: 10.1 },
      { scheduledAt: '2026-10-11T15:00:00.000Z', priceName: 'Sessão', amountBrl: 10.1 },
    ],
    now,
  )
  const october = view.months.find((bar) => bar.key === '2026-10')
  equal(october?.cents, 2020)
  equal(october?.amountBrl, 20.2)
  equal(view.selected.cents, 2020)
  equal(view.selected.amountBrl, 20.2)
})

test('REQ-38: nome vazio vira Avulso; o mesmo nome soma; nomes diferentes não', () => {
  const view = buildFinanceAnalytics(
    [
      { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: '', amountBrl: 10 },
      { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: '   ', amountBrl: 5 },
      { scheduledAt: '2026-10-03T15:00:00.000Z', priceName: 'Pilates', amountBrl: 20 },
      { scheduledAt: '2026-10-04T15:00:00.000Z', priceName: 'Pilates', amountBrl: 30 },
      { scheduledAt: '2026-03-15T15:00:00.000Z', priceName: 'Fora', amountBrl: 99 },
    ],
    now,
  )
  deepEqual(
    view.prices.map((bar) => [bar.name, bar.cents]),
    [
      ['Pilates', 5000],
      ['Avulso', 1500],
    ],
  )
})

test('REQ-38: prices ordena centavos decrescentes e empate com localeCompare pt-BR', () => {
  const view = buildFinanceAnalytics(
    [
      { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: 'Zebra', amountBrl: 1 },
      { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: 'Alfa', amountBrl: 1 },
      { scheduledAt: '2026-10-03T15:00:00.000Z', priceName: 'Maior', amountBrl: 3 },
    ],
    now,
  )
  deepEqual(
    view.prices.map((bar) => bar.name),
    ['Maior', 'Alfa', 'Zebra'],
  )
})

test('REQ-38: nome com soma zero não entra em prices', () => {
  const view = buildFinanceAnalytics(
    [
      { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: 'Zerado', amountBrl: 0 },
      { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: 'Pago', amountBrl: 1 },
    ],
    now,
  )
  deepEqual(
    view.prices.map((bar) => bar.name),
    ['Pago'],
  )
})

test('REQ-38: linha cuja data cai no mês entra na soma sem campo de status', () => {
  const row = { scheduledAt: '2026-03-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 40 }
  const view = buildFinanceAnalytics([row], now)
  const march = view.months.find((bar) => bar.key === '2026-03')
  equal(march?.cents, 4000)
})

test('REQ-38: com linhas, months tem 12 itens e mês sem linha fica em zero', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2026-10-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1 }],
    now,
  )
  equal(view.hasPayments, true)
  equal(view.months.length, 12)
  equal(view.months[0]?.axisLabel, 'nov/25')
  equal(view.months.find((bar) => bar.key === '2026-01')?.axisLabel, 'jan/26')
  equal(view.months.find((bar) => bar.key === '2025-11')?.cents, 0)
})

test('REQ-38: lista vazia não produz barras', () => {
  const view = buildFinanceAnalytics([], now)
  equal(view.hasPayments, false)
  deepEqual(view.months, [])
  deepEqual(view.prices, [])
})

test('REQ-38: pagamento em 2025-10 entra em previous de 2025-11 e fica fora da janela', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2025-10-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 8 }],
    now,
    '2025-11',
  )
  equal(view.selectedKey, '2025-11')
  equal(view.previous.key, '2025-10')
  equal(view.previous.cents, 800)
  equal(view.previous.sentence, 'outubro de 2025')
  equal(
    view.months.some((bar) => bar.key === '2025-10'),
    false,
  )
})

test('REQ-38: selectedKey omitido é o mês corrente do now injetado', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2026-10-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1 }],
    now,
  )
  equal(view.currentKey, '2026-10')
  equal(view.selectedKey, '2026-10')
  equal(view.selected.key, '2026-10')
  equal(view.selected.sentence, 'outubro de 2026')
})
