import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { createPatientTermSchema } from '../schemas/patientTerm.schema.ts'

const base = {
  termType: 'consentimento',
  title: ' Termo ',
  bodyText: 'Texto do termo',
  patientName: 'Maria',
  therapistName: 'Ana',
  therapistCrefito: 'CREFITO-3/1',
  guardianName: null,
  guardianCpf: null,
  createdByName: null,
  signedAt: new Date(),
}

test('REQ-48: aceita entrada valida e aplica trim', () => {
  const r = createPatientTermSchema.safeParse(base)
  equal(r.success, true)
  if (r.success) {
    equal(r.data.title, 'Termo')
    equal(r.data.guardianCpf, null)
  }
})

test('REQ-48: rejeita tipo, vazios e limites', () => {
  const bad = (patch: object) => createPatientTermSchema.safeParse({ ...base, ...patch }).success
  equal(bad({ termType: 'x' }), false)
  equal(bad({ bodyText: '' }), false)
  equal(bad({ bodyText: 'a'.repeat(6001) }), false)
  equal(bad({ title: 'a'.repeat(201) }), false)
  equal(bad({ patientName: '' }), false)
  equal(bad({ patientName: 'a'.repeat(201) }), false)
  equal(bad({ therapistName: 'a'.repeat(121) }), false)
  equal(bad({ therapistCrefito: '' }), false)
  equal(bad({ therapistCrefito: 'a'.repeat(41) }), false)
})

test('REQ-48: responsavel exige CPF valido e normaliza', () => {
  const bad = createPatientTermSchema.safeParse({ ...base, guardianName: 'Jo', guardianCpf: '111.111.111-11' })
  equal(bad.success, false)
  const ok = createPatientTermSchema.safeParse({ ...base, guardianName: 'Jo', guardianCpf: '529.982.247-25' })
  equal(ok.success, true)
  if (ok.success) equal(ok.data.guardianCpf, '52998224725')
  const empty = createPatientTermSchema.safeParse({ ...base, guardianName: '  ', guardianCpf: '123' })
  equal(empty.success, true)
  if (empty.success) {
    equal(empty.data.guardianName, null)
    equal(empty.data.guardianCpf, null)
  }
})
