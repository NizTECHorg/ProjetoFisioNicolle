import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const svc = readFileSync('src/services/patients.service.ts', 'utf8')

function constBlock(name: string): string {
  const start = svc.indexOf(`const ${name} =`)
  assert.ok(start >= 0, `${name} existe`)
  const end = svc.indexOf('\n\n', start)
  return svc.slice(start, end < 0 ? undefined : end)
}

test('REQ-48: cpf só em DETAIL_COLUMNS', () => {
  assert.match(constBlock('DETAIL_COLUMNS'), /\bcpf\b/)
  assert.doesNotMatch(constBlock('LIST_COLUMNS'), /cpf/)
  assert.doesNotMatch(constBlock('DASHBOARD_COLUMNS'), /cpf/)
})

test('REQ-48: cpf fora da IA', () => {
  const ai = readFileSync('supabase/functions/patient-ai-summary/index.ts', 'utf8')
  assert.doesNotMatch(ai, /cpf/i)
  if (existsSync('src/lib/patientSummary.ts')) {
    assert.doesNotMatch(readFileSync('src/lib/patientSummary.ts', 'utf8'), /cpf/i)
  }
})

test('REQ-48: cpf fora de createPatient e sem console', () => {
  const create = svc.slice(svc.indexOf('export async function createPatient'), svc.indexOf('export async function updatePatient'))
  assert.doesNotMatch(create, /cpf/i)
  for (const f of [
    'src/services/patients.service.ts',
    'src/schemas/patient.schema.ts',
    'src/components/patients/PatientCadastroPanel.tsx',
  ]) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      assert.ok(!(line.includes('console.') && /cpf/i.test(line)), `${f}: ${line}`)
    }
  }
})
