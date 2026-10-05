import { test } from 'node:test'
import { deepEqual, ok } from 'node:assert/strict'
import { FOCUS_REGIONS } from './focusRegions.ts'
import { allowedFocusKeys } from './focusRegionAllow.ts'

const KNEE_KEYS = ['front.knee_l', 'front.knee_r', 'back.knee_l', 'back.knee_r'] as const

test('REQ-34.3: antebraço esquerdo não marca braço', () => {
  const keys = allowedFocusKeys(['antebraço esquerdo'])
  ok(keys.includes('front.forearm_l'))
  ok(keys.includes('back.forearm_l'))
  ok(!keys.includes('front.upper_arm_l'))
  ok(!keys.includes('back.upper_arm_l'))
})

test('REQ-34.3: joelho direito marca frente e costas', () => {
  const keys = allowedFocusKeys(['Joelho direito'])
  ok(keys.includes('front.knee_r'))
  ok(keys.includes('back.knee_r'))
  ok(!keys.includes('front.knee_l'))
  ok(!keys.includes('back.knee_l'))
})

test('REQ-34.3: joelho sem lado não marca lado', () => {
  const keys = allowedFocusKeys(['joelho'])
  for (const key of KNEE_KEYS) ok(!keys.includes(key))
})

test('REQ-34.3: joelhos e joelho D não marcam', () => {
  for (const text of ['joelhos', 'joelho D']) {
    const keys = allowedFocusKeys([text])
    for (const key of KNEE_KEYS) ok(!keys.includes(key), `${text} marcou ${key}`)
  }
})

test('REQ-34.3: descrição soma o rótulo e texto vazio não marca', () => {
  deepEqual(allowedFocusKeys(['', 'inclua o joelho direito']), ['front.knee_r', 'back.knee_r'])
})

test('REQ-34.3: chave crua não entra', () => {
  ok(!allowedFocusKeys(['front.knee_r']).includes('front.knee_r'))
})

test('REQ-34.3: ordem do catálogo e chave única', () => {
  const keys = allowedFocusKeys(['joelho direito e cabeça', 'Joelho direito'])
  const catalogOrder = FOCUS_REGIONS.map((region) => region.key).filter((key) =>
    keys.includes(key),
  )
  deepEqual(keys, catalogOrder)
  deepEqual(keys, ['front.head', 'front.knee_r', 'back.knee_r'])
})
