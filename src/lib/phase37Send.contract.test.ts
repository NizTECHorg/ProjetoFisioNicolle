import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-48: termo assinado vai ao paciente pelo WhatsApp com link de 7 dias', () => {
  const service = read('../services/patientTerms.service.ts')
  ok(service.includes('SHARE_URL_SECONDS = 604800'))
  ok(service.includes("folder !== patientId.toLowerCase()"))
  const list = read('../components/terms/TermList.tsx')
  ok(list.includes('resolveWhatsAppDigits(phone)'))
  ok(list.includes("openPatientDocumentWhatsApp(resolved.digits, url, 'Segue o termo assinado.')"))
  ok(list.includes('PATIENT_AI_COPY.sendWhatsApp'))
  ok(!list.includes('sendEmail'))
  ok(!existsSync(fileURLToPath(new URL('../../supabase/functions/send-patient-term/index.ts', import.meta.url))))
})
