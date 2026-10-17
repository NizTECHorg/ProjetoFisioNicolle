import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')
const service = read('../services/patientTerms.service.ts')
const hook = read('../hooks/usePatientTerms.ts')

test('REQ-48: servico envia PDF sem sobrescrever e faz rollback', () => {
  equal(service.includes('upsert: false'), true)
  equal(service.includes("contentType: 'application/pdf'"), true)
  equal(service.includes('.remove([path])'), true)
  equal(service.includes('createSignedUrls('), true)
  equal(service.includes("from('patient_terms')"), true)
})

test('REQ-48: lista nao traz body_text nem guardian_cpf', () => {
  const m = service.match(/const TERM_COLUMNS =\s*'([^']*)'/)
  equal(Boolean(m), true)
  equal((m?.[1] ?? '').includes('body_text'), false)
  equal((m?.[1] ?? '').includes('guardian_cpf'), false)
})

test('REQ-48: termo imutavel, sem logs e sem select(*)', () => {
  equal(service.includes('.update('), false)
  equal(service.includes('console.'), false)
  equal(service.includes("select('*')"), false)
  equal(hook.includes('console.'), false)
})

test('REQ-48: hook usa a chave patient-terms', () => {
  equal(hook.includes("['patient-terms'"), true)
})
