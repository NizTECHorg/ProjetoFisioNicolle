import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import {
  SIGNATURE_MAX_CHARS,
  appendStroke,
  clientToViewBox,
  isSafeSignaturePath,
  signaturePdfScale,
  simplifyStroke,
  strokeToPath,
} from './signaturePath.ts'
import { evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'

test('simplifyStroke arredonda e descarta pontos próximos', () => {
  deepEqual(
    simplifyStroke([
      { x: 10.4, y: 20.6 },
      { x: 11, y: 21 },
      { x: 20, y: 20 },
    ]),
    [
      { x: 10, y: 21 },
      { x: 20, y: 20 },
    ],
  )
})

test('simplifyStroke prende ao viewBox', () => {
  deepEqual(simplifyStroke([{ x: -5, y: 999 }]), [{ x: 0, y: 160 }])
  deepEqual(simplifyStroke([{ x: 9999, y: -1 }]), [{ x: 600, y: 0 }])
})

test('strokeToPath', () => {
  equal(strokeToPath([]), '')
  equal(strokeToPath([{ x: 1, y: 2 }]), 'M1 2 L1 2')
  equal(
    strokeToPath([
      { x: 1, y: 2 },
      { x: 5, y: 6 },
    ]),
    'M1 2 L5 6',
  )
})

test('appendStroke', () => {
  const pts = [
    { x: 1, y: 2 },
    { x: 5, y: 6 },
  ]
  equal(appendStroke('', pts), strokeToPath(pts))
  equal(
    appendStroke('M1 2 L5 6', [
      { x: 9, y: 9 },
      { x: 20, y: 9 },
    ]),
    'M1 2 L5 6 M9 9 L20 9',
  )
  equal(appendStroke('M1 2 L5 6', []), 'M1 2 L5 6')
  const big = 'M' + '1 '.repeat(SIGNATURE_MAX_CHARS / 2 - 1).trimEnd()
  equal(appendStroke(big, pts), big)
})

test('isSafeSignaturePath', () => {
  equal(isSafeSignaturePath('M1 2 L5 6'), true)
  equal(isSafeSignaturePath(''), false)
  equal(isSafeSignaturePath(undefined), false)
  equal(isSafeSignaturePath(null), false)
  equal(isSafeSignaturePath('M1 2 Z'), false)
  equal(isSafeSignaturePath('<script>'), false)
  equal(isSafeSignaturePath('M1 2"/><x'), false)
  equal(isSafeSignaturePath('1 2 L5 6'), false)
  equal(isSafeSignaturePath('M' + '1'.repeat(SIGNATURE_MAX_CHARS)), false)
})

test('clientToViewBox', () => {
  const rect = { left: 0, top: 0, width: 300, height: 80 }
  deepEqual(clientToViewBox(150, 40, rect), { x: 300, y: 80 })
  deepEqual(clientToViewBox(-50, 500, rect), { x: 0, y: 160 })
  deepEqual(clientToViewBox(10, 10, { left: 0, top: 0, width: 0, height: 0 }), { x: 0, y: 0 })
})

test('signaturePdfScale', () => {
  equal(signaturePdfScale(180, 48), 0.3)
})

test('schema aceita assinaturaTraco e mantém assinatura', () => {
  const ok1 = evaluationFichaSchema.parse({
    avaliacaoPlano: { profissional: { assinaturaTraco: 'M1 2 L5 6', assinatura: 'Fulano' } },
  })
  equal(ok1.avaliacaoPlano.profissional.assinaturaTraco, 'M1 2 L5 6')
  equal(ok1.avaliacaoPlano.profissional.assinatura, 'Fulano')
  const empty = evaluationFichaSchema.parse({ avaliacaoPlano: { profissional: { assinaturaTraco: '' } } })
  equal(empty.avaliacaoPlano.profissional.assinaturaTraco, undefined)
  const bad = evaluationFichaSchema.safeParse({
    avaliacaoPlano: { profissional: { assinaturaTraco: 'M' + '1'.repeat(SIGNATURE_MAX_CHARS) } },
  })
  ok(!bad.success)
})
