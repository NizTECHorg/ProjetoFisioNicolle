import { test } from 'node:test'
import { deepEqual, equal, throws } from 'node:assert/strict'
import {
  buildFinanceAnalytics,
  monthAxisLabel,
  monthSentence,
  monthWindow,
  saoPauloMonthKey,
  shiftMonthKey,
  analyticsPatientIds,
  analyticsYears,
  joinMonthKey,
  toggleSelectedMonth,
  yearWindow,
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
      { scheduledAt: '2026-10-10T15:00:00.000Z', priceName: 'Sessão', amountBrl: 10.1, patientId: null },
      { scheduledAt: '2026-10-11T15:00:00.000Z', priceName: 'Sessão', amountBrl: 10.1, patientId: null },
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
      { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: '', amountBrl: 10, patientId: null },
      { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: '   ', amountBrl: 5, patientId: null },
      { scheduledAt: '2026-10-03T15:00:00.000Z', priceName: 'Pilates', amountBrl: 20, patientId: null },
      { scheduledAt: '2026-10-04T15:00:00.000Z', priceName: 'Pilates', amountBrl: 30, patientId: null },
      { scheduledAt: '2026-03-15T15:00:00.000Z', priceName: 'Fora', amountBrl: 99, patientId: null },
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
      { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: 'Zebra', amountBrl: 1, patientId: null },
      { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: 'Alfa', amountBrl: 1, patientId: null },
      { scheduledAt: '2026-10-03T15:00:00.000Z', priceName: 'Maior', amountBrl: 3, patientId: null },
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
      { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: 'Zerado', amountBrl: 0, patientId: null },
      { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: 'Pago', amountBrl: 1, patientId: null },
    ],
    now,
  )
  deepEqual(
    view.prices.map((bar) => bar.name),
    ['Pago'],
  )
})

test('REQ-38: linha cuja data cai no mês entra na soma sem campo de status', () => {
  const row = { scheduledAt: '2026-03-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 40, patientId: null }
  const view = buildFinanceAnalytics([row], now)
  const march = view.months.find((bar) => bar.key === '2026-03')
  equal(march?.cents, 4000)
})

test('REQ-38: com linhas, months tem 12 itens e mês sem linha fica em zero', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2026-10-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1, patientId: null }],
    now,
  )
  equal(view.hasPayments, true)
  equal(view.months.length, 12)
  equal(view.months[0]?.key, '2026-01')
  equal(view.months[11]?.key, '2026-12')
  equal(view.months[0]?.axisLabel, 'jan/26')
  equal(view.months.find((bar) => bar.key === '2026-02')?.cents, 0)
})

test('REQ-38: lista vazia não produz barras', () => {
  const view = buildFinanceAnalytics([], now)
  equal(view.hasPayments, false)
  deepEqual(view.months, [])
  deepEqual(view.prices, [])
})

test('REQ-38: pagamento em 2025-10 entra em previous de 2025-11 e as barras são do ano 2025', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2025-10-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 8, patientId: null }],
    now,
    '2025-11',
  )
  equal(view.selectedKey, '2025-11')
  equal(view.previous.key, '2025-10')
  equal(view.previous.cents, 800)
  equal(view.previous.sentence, 'outubro de 2025')
  equal(view.months[0]?.key, '2025-01')
  equal(view.months.find((bar) => bar.key === '2025-10')?.cents, 800)
})

test('REQ-38: selectedKey omitido é o mês corrente do now injetado', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2026-10-15T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1, patientId: null }],
    now,
  )
  equal(view.currentKey, '2026-10')
  equal(view.selectedKey, '2026-10')
  equal(view.selected.key, '2026-10')
  equal(view.selected.sentence, 'outubro de 2026')
})

test('Filtro de ano: yearWindow vai de janeiro a dezembro e joinMonthKey valida o mês', () => {
  const keys = yearWindow(2025)
  equal(keys.length, 12)
  equal(keys[0], '2025-01')
  equal(keys[11], '2025-12')
  equal(joinMonthKey(2026, 3), '2026-03')
  throws(() => joinMonthKey(2026, 13), { message: 'Data inválida' })
})

test('Filtro de ano: anos com pagamento mais o corrente, do mais novo ao mais antigo', () => {
  const years = analyticsYears(
    [
      { scheduledAt: '2024-05-10T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1, patientId: 'a' },
      { scheduledAt: '2025-05-10T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1, patientId: 'a' },
      { scheduledAt: '2025-06-10T15:00:00.000Z', priceName: 'Sessão', amountBrl: 1, patientId: 'b' },
    ],
    now,
  )
  deepEqual(years, [2026, 2025, 2024])
})

test('Filtro de paciente: soma só as cobranças do paciente e lista ids sem repetir', () => {
  const rows = [
    { scheduledAt: '2026-10-01T15:00:00.000Z', priceName: 'Sessão', amountBrl: 10, patientId: 'a' },
    { scheduledAt: '2026-10-02T15:00:00.000Z', priceName: 'Sessão', amountBrl: 30, patientId: 'b' },
    { scheduledAt: '2026-09-02T15:00:00.000Z', priceName: 'Sessão', amountBrl: 5, patientId: 'a' },
    { scheduledAt: '2026-09-03T15:00:00.000Z', priceName: 'Sessão', amountBrl: 7, patientId: null },
  ]
  deepEqual(analyticsPatientIds(rows), ['a', 'b'])

  const all = buildFinanceAnalytics(rows, now)
  equal(all.selected.cents, 4000)
  equal(all.previous.cents, 1200)

  const onlyA = buildFinanceAnalytics(rows, now, undefined, { patientId: 'a' })
  equal(onlyA.hasPayments, true)
  equal(onlyA.filteredOut, false)
  equal(onlyA.selected.cents, 1000)
  equal(onlyA.previous.cents, 500)
})

test('Filtro de paciente: paciente sem cobrança paga não inventa barras', () => {
  const view = buildFinanceAnalytics(
    [{ scheduledAt: '2026-10-01T15:00:00.000Z', priceName: 'Sessão', amountBrl: 10, patientId: 'a' }],
    now,
    undefined,
    { patientId: 'z' },
  )
  equal(view.hasPayments, false)
  equal(view.filteredOut, true)
  deepEqual(view.months, [])
})

test('Lista vazia sem filtro não é filtrada', () => {
  equal(buildFinanceAnalytics([], now).filteredOut, false)
})
