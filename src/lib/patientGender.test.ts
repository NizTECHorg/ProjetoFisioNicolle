import { test } from 'node:test'
import { equal, deepEqual } from 'node:assert/strict'
import { genderLabel, narrowGender, patientGenderOptions } from './patientGender.ts'

test('REQ-45: genderLabel mapeia valores conhecidos e esvazia o resto', () => {
  equal(genderLabel('feminino'), 'Feminino')
  equal(genderLabel('masculino'), 'Masculino')
  equal(genderLabel('outro'), 'Outro')
  for (const v of ['nao_informado', null, undefined, '', 'xyz']) equal(genderLabel(v), '')
})

test('REQ-45: narrowGender só aceita os 4 valores', () => {
  equal(narrowGender('masculino'), 'masculino')
  equal(narrowGender('xyz'), null)
  equal(narrowGender(null), null)
})

test('REQ-45: patientGenderOptions tem 5 entradas', () => {
  equal(patientGenderOptions.length, 5)
  deepEqual(patientGenderOptions[0], { value: '', label: 'Não informado' })
  equal(patientGenderOptions[4]?.label, 'Prefere não informar')
  equal(patientGenderOptions[4]?.value, 'nao_informado')
})
