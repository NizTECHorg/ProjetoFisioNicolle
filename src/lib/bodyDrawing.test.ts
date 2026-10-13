import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import {
  BODY_DRAWING_COLORS,
  BODY_DRAWING_MAX_STROKES,
  BODY_DRAWING_VIEWBOX,
  appendBodyStroke,
  bodyClientToViewBox,
  bodyStrokeToPath,
  isSafeBodyPath,
  safeBodyStrokes,
  simplifyBodyStroke,
  usedBodyDrawingColors,
} from './bodyDrawing.ts'

test('mapa de sintomas: 6 cores com rótulo e dica, chaves únicas', () => {
  equal(BODY_DRAWING_COLORS.length, 6)
  equal(new Set(BODY_DRAWING_COLORS.map((item) => item.key)).size, 6)
  for (const item of BODY_DRAWING_COLORS) {
    equal(/^#[0-9a-f]{6}$/.test(item.hex), true)
    equal(item.label.length > 0 && item.hint.length > 0, true)
  }
})

test('mapa de sintomas: ponteiro vira coordenada inteira presa ao viewBox', () => {
  const rect = { left: 10, top: 20, width: 635.5, height: 619 }
  deepEqual(bodyClientToViewBox(10, 20, rect), { x: 0, y: 0 })
  deepEqual(bodyClientToViewBox(645.5, 639, rect), { x: BODY_DRAWING_VIEWBOX.width, y: BODY_DRAWING_VIEWBOX.height })
  deepEqual(bodyClientToViewBox(-50, 9999, rect), { x: 0, y: BODY_DRAWING_VIEWBOX.height })
})

test('mapa de sintomas: simplifica pontos próximos e monta o path', () => {
  const pts = simplifyBodyStroke([
    { x: 10, y: 10 },
    { x: 11, y: 10 },
    { x: 20, y: 10 },
  ])
  deepEqual(pts, [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
  ])
  equal(bodyStrokeToPath(pts), 'M10 10 L20 10')
  equal(bodyStrokeToPath([{ x: 5, y: 6 }]), 'M5 6 L5.5 6')
  equal(bodyStrokeToPath([]), '')
})

test('mapa de sintomas: path só aceita M, L, números, espaço, ponto e hífen', () => {
  equal(isSafeBodyPath('M1 2 L3 4'), true)
  equal(isSafeBodyPath('M1 2 Z'), false)
  equal(isSafeBodyPath('<script>'), false)
  equal(isSafeBodyPath(''), false)
  equal(isSafeBodyPath(42), false)
})

test('mapa de sintomas: safeBodyStrokes descarta cor desconhecida e path inseguro', () => {
  deepEqual(
    safeBodyStrokes([
      { cor: 'dor', d: 'M1 1 L2 2' },
      { cor: 'roxo', d: 'M1 1 L2 2' },
      { cor: 'dor', d: 'javascript:1' },
      null,
    ]),
    [{ cor: 'dor', d: 'M1 1 L2 2' }],
  )
  deepEqual(safeBodyStrokes('nada'), [])
})

test('mapa de sintomas: appendBodyStroke respeita o limite de traços', () => {
  const um = appendBodyStroke([], 'dor', [{ x: 1, y: 1 }, { x: 9, y: 9 }])
  deepEqual(um, [{ cor: 'dor', d: 'M1 1 L9 9' }])
  const cheio = Array.from({ length: BODY_DRAWING_MAX_STROKES }, () => ({ cor: 'dor' as const, d: 'M1 1 L2 2' }))
  equal(appendBodyStroke(cheio, 'rigidez', [{ x: 1, y: 1 }]).length, BODY_DRAWING_MAX_STROKES)
  equal(appendBodyStroke([], 'dor', []).length, 0)
})

test('mapa de sintomas: cores usadas seguem a ordem da legenda', () => {
  const usadas = usedBodyDrawingColors([
    { cor: 'rigidez', d: 'M1 1 L2 2' },
    { cor: 'dor', d: 'M1 1 L2 2' },
    { cor: 'dor', d: 'M1 1 L2 2' },
  ])
  deepEqual(
    usadas.map((item) => item.key),
    ['dor', 'rigidez'],
  )
})
