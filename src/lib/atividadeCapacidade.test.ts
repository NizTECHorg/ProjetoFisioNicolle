import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import {
  ATIVIDADES,
  formatLinha,
  formatMedida,
  formatMiolo,
} from './atividadeCapacidade.ts'

test('REQ-35: formatMedida junta valor e rótulo', () => {
  equal(formatMedida('10', 'minutos'), '10 minutos')
  equal(formatMedida('3', 'km'), '3 km')
  equal(formatMedida('12', 'repeticoes'), '12 repetições')
  equal(formatMedida('10', undefined), '10')
  equal(formatMedida(undefined, 'km'), 'km')
  equal(formatMedida('', ''), '')
})

test('REQ-35: formatMedida não interpreta 10 min', () => {
  const texto = formatMedida('10 min', undefined)
  equal(texto, '10 min')
  equal(texto.includes('minutos'), false)
})

test('REQ-35: formatLinha junta valor e rótulo', () => {
  const atual = { valor: '10', unidade: 'minutos' as const }
  const antes = { valor: '40', unidade: 'minutos' as const }
  equal(formatMiolo(atual, antes), 'agora 10 minutos; antes 40 minutos')
  equal(formatMiolo(atual, undefined), 'agora 10 minutos')
  equal(formatMiolo(undefined, antes), 'antes 40 minutos')
  equal(formatMiolo(undefined, undefined), '')
  equal(formatLinha('Correr', atual, antes), 'Correr: agora 10 minutos; antes 40 minutos')
  equal(formatLinha('Correr', undefined, undefined), 'Correr')
})

test('REQ-35: lados independentes minutos e km', () => {
  equal(
    formatLinha('Correr', { valor: '10', unidade: 'minutos' }, { valor: '3', unidade: 'km' }),
    'Correr: agora 10 minutos; antes 3 km',
  )
})

test('REQ-35: catálogo tem 16 atividades sem rótulo duplicado', () => {
  equal(ATIVIDADES.length, 16)
  equal(ATIVIDADES[0]?.key, 'caminhar')
  equal(ATIVIDADES[0]?.label, 'Caminhar')
  equal(ATIVIDADES[15]?.key, 'outra')
  equal(ATIVIDADES[15]?.label, 'Outra')
  const rotulos = ATIVIDADES.map((item) => item.label)
  equal(new Set(rotulos).size, rotulos.length)
})
