import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const catalog = readFileSync(fileURLToPath(new URL('./pdfFieldCatalog.ts', import.meta.url)), 'utf8')
const service = readFileSync(
  fileURLToPath(new URL('../services/patientAiPdf.service.ts', import.meta.url)),
  'utf8',
)

test('REQ-41: catálogo conta assinaturaTraco como bloco ID preenchido', () => {
  equal(catalog.includes('textFilled(plano?.profissional?.assinaturaTraco)'), true)
})

test('REQ-41: serviço desenha o traço só com path validado', () => {
  equal(service.includes('textFilled(plano?.profissional?.assinaturaTraco)'), true)
  equal(service.includes('ctx.page.drawSvgPath('), true)
  equal(service.includes('isSafeSignaturePath('), true)
  equal(service.includes("from '@/lib/signaturePath'"), true)
})

test('REQ-41: entrada antiga incondicional de Assinatura foi trocada', () => {
  equal(service.includes("['Assinatura', plano?.profissional?.assinatura]"), false)
})
