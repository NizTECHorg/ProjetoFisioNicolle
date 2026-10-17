import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { formatCpf, isValidCpf, maskCpf, normalizeCpf } from './cpf.ts'

test('isValidCpf valida dígitos verificadores', () => {
  equal(isValidCpf('529.982.247-25'), true)
  equal(isValidCpf('52998224725'), true)
  equal(isValidCpf('111.111.111-11'), false)
  equal(isValidCpf('123.456.789-00'), false)
  equal(isValidCpf(''), false)
  equal(isValidCpf(undefined), false)
  equal(isValidCpf(null), false)
  equal(isValidCpf('5299822472'), false)
})

test('normalizeCpf só dígitos, máx 11', () => {
  equal(normalizeCpf('529.982.247-25x99'), '52998224725')
  equal(normalizeCpf(undefined), '')
})

test('formatCpf máscara progressiva', () => {
  equal(formatCpf('52998224725'), '529.982.247-25')
  equal(formatCpf('5299'), '529.9')
  equal(formatCpf(''), '')
})

test('maskCpf oculta os primeiros dígitos', () => {
  equal(maskCpf('52998224725'), '***.***.247-25')
  equal(maskCpf('123'), '')
})
