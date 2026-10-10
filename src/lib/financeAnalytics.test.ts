import { test } from 'node:test'
import { deepEqual, equal, throws } from 'node:assert/strict'
import {
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
