import { test } from 'node:test'
import { deepEqual, equal, match, ok } from 'node:assert/strict'
import {
  BLANK,
  CONSENT_TERMS,
  buildTermFileName,
  fillTerm,
  formatMissing,
  getConsentTerm,
  termMissingForSave,
  type TermValues,
} from './consentTerms.ts'

const full: TermValues = {
  patientName: 'João da Silva',
  patientCpf: '52998224725',
  therapistName: 'Nicolle Cimatti',
  crefito: '123456-F',
  guardian: null,
}
const empty: TermValues = { patientName: '', patientCpf: '', therapistName: '', crefito: '', guardian: null }

test('4 termos na ordem e com metadados', () => {
  deepEqual(CONSENT_TERMS.map((t) => t.key), ['consentimento', 'liberacao', 'uso_imagem', 'uso_imagem_redes'])
  deepEqual(CONSENT_TERMS.map((t) => t.category), [
    'Consentimento',
    'Liberação',
    'Uso de Imagem',
    'Uso de Imagem em Redes Sociais',
  ])
  equal(getConsentTerm('consentimento').title, 'Termo de Consentimento para Atendimento Fisioterapêutico')
  equal(
    getConsentTerm('consentimento').subtitle,
    'Autorização do paciente para realização de procedimentos fisioterapêuticos.',
  )
})

test('fillTerm literal do termo 1', () => {
  equal(
    fillTerm(getConsentTerm('consentimento').template, full),
    'Eu, João da Silva, CPF 529.982.247-25, declaro que fui informado(a) sobre os procedimentos fisioterapêuticos que serão realizados, incluindo seus benefícios, riscos e alternativas de tratamento. Autorizo o(a) fisioterapeuta Nicolle Cimatti, CREFITO 123456-F, a realizar o tratamento proposto. Estou ciente de que posso revogar este consentimento a qualquer momento.',
  )
})

test('valores vazios viram BLANK e nenhum token sobra', () => {
  for (const t of CONSENT_TERMS) {
    const out = fillTerm(t.template, empty)
    equal(out.split(BLANK).length - 1, 4)
    ok(!out.includes('{{') && !out.includes('}}'))
    const filled = fillTerm(t.template, full)
    ok(!filled.includes('{{') && !filled.includes('}}') && !filled.includes(BLANK))
  }
})

test('responsável legal', () => {
  const out = fillTerm(getConsentTerm('liberacao').template, {
    ...full,
    guardian: { name: 'Maria Souza', cpf: '52998224725' },
  })
  ok(out.startsWith('Eu, Maria Souza, CPF 529.982.247-25, responsável legal por João da Silva, '))
})

test('termMissingForSave', () => {
  deepEqual(termMissingForSave({ hasPatient: false, signatureOk: false, values: empty, text: '' }), [
    'paciente',
    'assinatura',
    'nome de quem assina',
    'CPF válido',
    'nome do fisioterapeuta',
    'CREFITO',
  ])
  deepEqual(termMissingForSave({ hasPatient: true, signatureOk: true, values: full, text: 'ok' }), [])
  deepEqual(
    termMissingForSave({ hasPatient: true, signatureOk: true, values: full, text: `a ${BLANK}` }),
    ['campos em branco no texto'],
  )
  deepEqual(
    termMissingForSave({
      hasPatient: true,
      signatureOk: true,
      values: { ...full, patientCpf: '', guardian: { name: 'Maria', cpf: '52998224725' } },
      text: 'ok',
    }),
    [],
  )
})

test('formatMissing', () => {
  equal(formatMissing(['CPF válido', 'CREFITO']), 'Para salvar, falta: CPF válido, CREFITO.')
  equal(formatMissing([]), '')
})

test('buildTermFileName', () => {
  equal(
    buildTermFileName('consentimento', 'João da Silva', new Date(2026, 9, 17)),
    'termo-consentimento-joao-da-silva-2026-10-17.pdf',
  )
  const long = buildTermFileName('uso_imagem_redes', 'a'.repeat(300), new Date(2026, 0, 2))
  ok(long.length <= 80)
  match(long, /^[a-z0-9.-]+$/)
  match(buildTermFileName('uso_imagem', '???', new Date(2026, 0, 2)), /-paciente-/)
})
