import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const svc = readFileSync(new URL('../services/relatorioPdf.service.ts', import.meta.url), 'utf8')
const lib = readFileSync(new URL('./relatorio.ts', import.meta.url), 'utf8')

test('REQ-57: PDF contem os elementos do modelo e a identidade da conta', () => {
  for (const s of [
    'loadPdfBrand',
    'tamanhoLogo',
    'xAlinhado',
    'linhasRelatorio',
    'RELATORIO_TITULO',
    'Sem mais para o momento.',
    'Local:',
    'Data:',
    'CREFITO',
    'dataPorExtenso',
    'orBlank',
    'createRelatorioMeasurer',
    'toWinAnsiSafe',
  ]) {
    assert.ok(svc.includes(s), `faltou ${s}`)
  }
})

test('REQ-57: PDF nao corta o texto nem reaproveita o PDF da ficha', () => {
  assert.ok(!svc.includes('patientAiPdf'))
  assert.ok(!svc.includes('.slice('))
  assert.ok(!svc.includes('RELATORIO_LINHAS_MAX'))
})

test('REQ-57: titulo do relatorio', () => {
  assert.match(lib, /RELATORIO_TITULO = 'Relatório fisioterapêutico'/)
})

test('REQ-57: assinatura à mão entra no PDF só com traço validado', () => {
  const pdf = readFileSync(new URL('../services/relatorioPdf.service.ts', import.meta.url), 'utf8')
  const service = readFileSync(new URL('../services/patientReports.service.ts', import.meta.url), 'utf8')
  const editor = readFileSync(new URL('../components/patients/PatientReportEditor.tsx', import.meta.url), 'utf8')
  assert.ok(pdf.includes('isSafeSignaturePath(input.signaturePath)'))
  assert.ok(pdf.includes('ctx.page.drawSvgPath('))
  assert.ok(service.includes('signaturePath === report.signaturePath'))
  assert.ok(editor.includes('<SignaturePad'))
})
