import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { resolvePatientEmail, resolveWhatsAppDigits } from './patientContact.ts'
import { PATIENT_AI_COPY, patientDocumentSendSchema } from '../schemas/patientAi.schema.ts'

const PATIENT_ID = '11111111-1111-4111-8111-111111111111'
const REPORT_ID = '22222222-2222-4222-8222-222222222222'

test('e-mail — vazio e null são ausência', () => {
  for (const value of ['—', '', '   ', null]) {
    const result = resolvePatientEmail(value)
    equal(result.ok, false)
    if (!result.ok) equal(result.reason, 'missing')
  }
})

test('e-mail sem @ ou sem ponto no domínio é recusado', () => {
  for (const value of ['paciente', 'paciente@clinica', 'paciente @clinica.com', 'a@b']) {
    const result = resolvePatientEmail(value)
    equal(result.ok, false)
    if (!result.ok) equal(result.reason, 'invalid')
  }
})

test('e-mail utilizável devolve o endereço aparado', () => {
  const result = resolvePatientEmail('  Paciente@Clinica.com.br  ')
  equal(result.ok, true)
  if (result.ok) equal(result.email, 'Paciente@Clinica.com.br')
})

test('telefone — vazio e null são ausência', () => {
  for (const value of ['—', '', '   ', null]) {
    const result = resolveWhatsAppDigits(value)
    equal(result.ok, false)
    if (!result.ok) equal(result.reason, 'missing')
  }
})

test('telefone com máscara vira só dígitos e 11 dígitos ganham 55', () => {
  const result = resolveWhatsAppDigits('(11) 98888-1234')
  equal(result.ok, true)
  if (result.ok) equal(result.digits, '5511988881234')
})

test('10 dígitos ganham prefixo 55', () => {
  const result = resolveWhatsAppDigits('1198881234')
  equal(result.ok, true)
  if (result.ok) equal(result.digits, '551198881234')
})

test('12 e 13 dígitos que começam com 55 permanecem', () => {
  const twelve = resolveWhatsAppDigits('551198881234')
  const thirteen = resolveWhatsAppDigits('55 (11) 98888-1234')
  equal(twelve.ok, true)
  equal(thirteen.ok, true)
  if (twelve.ok) equal(twelve.digits, '551198881234')
  if (thirteen.ok) equal(thirteen.digits, '5511988881234')
})

test('comprimento diferente e número sem 55 nesses tamanhos são invalid', () => {
  for (const value of ['119888123', '55119888812345', '119888812345', '1198888812345']) {
    const result = resolveWhatsAppDigits(value)
    equal(result.ok, false)
    if (!result.ok) equal(result.reason, 'invalid')
  }
})

test('letras sem dígito não abrem WhatsApp', () => {
  const result = resolveWhatsAppDigits('sem numero')
  equal(result.ok, false)
  if (!result.ok) equal(result.reason, 'invalid')
})

test('patientDocumentSendSchema só tem patientId e reportId', () => {
  equal('email' in patientDocumentSendSchema.shape, false)
  equal('phone' in patientDocumentSendSchema.shape, false)
  const parsed = patientDocumentSendSchema.parse({
    patientId: PATIENT_ID,
    reportId: REPORT_ID,
    email: 'paciente@clinica.com',
    phone: '11988881234',
  })
  deepEqual(parsed, { patientId: PATIENT_ID, reportId: REPORT_ID })
})

test('cópia de envio usa as frases do UI-SPEC', () => {
  equal(
    PATIENT_AI_COPY.sendNeedEmail,
    'Este paciente não tem e-mail no cadastro. Inclua o e-mail na ficha e tente de novo.',
  )
  equal(
    PATIENT_AI_COPY.sendNeedPhone,
    'Este paciente não tem telefone no cadastro. Inclua o telefone na ficha e tente de novo.',
  )
  equal(
    PATIENT_AI_COPY.sendPhoneInvalid,
    'Este telefone não abre no WhatsApp. Corrija o número na ficha e tente de novo.',
  )
  equal(PATIENT_AI_COPY.emailSubjectAvaliacao, 'Sua avaliação')
  equal(PATIENT_AI_COPY.emailSubjectEvolucao, 'Sua evolução')
  equal(PATIENT_AI_COPY.emailBody, 'Segue o documento da sua fisioterapia, em anexo.')
  equal(PATIENT_AI_COPY.ctaGenerate, 'Gerar resumo')
  equal(PATIENT_AI_COPY.ctaExport, 'Exportar PDF')
})
