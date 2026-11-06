import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')

const service = read('src/services/patientReports.service.ts')
const hook = read('src/hooks/usePatientReports.ts')
const ai = read('src/services/patientAi.service.ts')
const schema = read('src/schemas/patientAi.schema.ts')
const send = read('src/services/patientDocumentSend.service.ts')

test('servico de relatorios: bucket, normalizacao e invalidacao de PDF', () => {
  for (const s of [
    'patient_reports',
    "'patient-ai-reports'",
    'upsert: false',
    'normalizarTextoRelatorio',
    'storage_path: null',
    '.single()',
  ]) {
    assert.ok(service.includes(s), `faltando ${s}`)
  }
  assert.doesNotMatch(service, /sanitizeText\(\s*[^,)]*content/)
})

test('updatePatientReport nao envia patient_id nem session_ids', () => {
  const start = service.indexOf('export async function updatePatientReport')
  const end = service.indexOf('export async function deletePatientReport')
  const body = service.slice(start, end)
  assert.ok(!body.includes('patient_id:'))
  assert.ok(!body.includes('session_ids'))
})

test('ensurePatientReportPdf reaproveita arquivo antes de gerar', () => {
  const start = service.indexOf('export async function ensurePatientReportPdf')
  const body = service.slice(start)
  assert.ok(body.indexOf('report.storagePath') < body.indexOf('await build()'))
})

test('hook de relatorios', () => {
  assert.ok(hook.includes("'reports'"))
  assert.ok(hook.includes('invalidatePatient'))
})

test('IA e envio com source', () => {
  assert.ok(ai.includes("mode: 'relatorio'"))
  assert.ok(ai.includes('outdatedFunction'))
  assert.ok(ai.includes('noContent'))
  assert.ok(ai.includes('patientReportTextSchema'))
  assert.ok(schema.includes("source: z.enum(['relatorio']).optional()"))
  for (const s of ['source: parsed.source', "'relatorio.pdf'", '604800', 'folder !== patientId.toLowerCase()']) {
    assert.ok(send.includes(s), `faltando ${s}`)
  }
})

test('REQ-57: PDF e exclusão do relatório não deixam linha e arquivo em desacordo', () => {
  const service = read('src/services/patientReports.service.ts')
  const excluir = service.slice(service.indexOf('export async function deletePatientReport'), service.indexOf('/** Garante um PDF'))
  assert.ok(excluir.indexOf(".delete()") < excluir.indexOf('removerPdfSemBloquear'))
  assert.ok(service.includes(".eq('updated_at', report.updatedAt)"))
  assert.ok(service.includes(".is('storage_path', null)"))
  assert.ok(service.includes('PATIENT_REPORT_COPY.pdfStale'))
  assert.ok(!service.includes('catch {'))
})
