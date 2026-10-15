import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { smoothLinePath } from './smoothPath.ts'

test('linha curva: usa curvas C e passa pelos pontos', () => {
  const d = smoothLinePath([
    { x: 0, y: 100 },
    { x: 10, y: 50 },
    { x: 20, y: 80 },
  ])
  ok(d.startsWith('M 0 100 C'))
  ok(d.endsWith(' 20 80'))
  ok(d.includes(' 10 50 C'))
})

test('linha curva: platô fica reto (não passa do pico nem de zero)', () => {
  const d = smoothLinePath([
    { x: 0, y: 100 },
    { x: 10, y: 100 },
    { x: 20, y: 100 },
  ])
  equal(d, 'M 0 100 C 3.33 100 6.67 100 10 100 C 13.33 100 16.67 100 20 100')
  equal(smoothLinePath([]), '')
  equal(smoothLinePath([{ x: 1, y: 2 }]), 'M 1 2')
})
