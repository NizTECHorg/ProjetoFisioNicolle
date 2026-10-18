import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-48: send-patient-term lê o e-mail do cadastro e não o body', () => {
  const fn = read('../../supabase/functions/send-patient-term/index.ts')
  for (const needle of [
    "from('patient_terms')",
    "from('patients')",
    "from('patient-images')",
    '.download(',
    "folder !== patientId.toLowerCase()",
    'FLUXO_SMTP_PASS',
    'https://deno.land/x/denomailer@1.6.0/mod.ts',
    'Segue o termo assinado da sua fisioterapia, em anexo.',
    'Este paciente não tem e-mail no cadastro. Inclua o e-mail na ficha e tente de novo.',
  ]) {
    ok(fn.includes(needle), `faltando: ${needle}`)
  }
  for (const banned of ['body.email', "body['email']", 'SUPABASE_SERVICE_ROLE', 'service_role', 'console.']) {
    ok(!fn.includes(banned), `não deveria ter: ${banned}`)
  }
})

test('REQ-48: app envia só patientId e termId e mostra o botão na lista de termos', () => {
  const service = read('../services/patientDocumentSend.service.ts')
  ok(service.includes("functions.invoke('send-patient-term'"))
  ok(service.includes('termId: parsed.termId'))
  const list = read('../components/terms/TermList.tsx')
  ok(list.includes('sendPatientTerm({ patientId: term.patientId, termId: term.id })'))
  ok(list.includes('PATIENT_AI_COPY.sendEmail'))
})
