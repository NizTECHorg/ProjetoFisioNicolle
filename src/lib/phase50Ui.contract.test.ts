import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-57: editor do relatorio', () => {
  const src = read('../components/patients/PatientReportEditor.tsx')
  for (const token of [
    'sessaoSelecionavelRelatorio',
    'contarLinhasRelatorio',
    'ajustarAoLimite',
    'numerosNaoConfirmados',
    'RELATORIO_MAX_SESSOES',
    'RELATORIO_LINHAS_MAX',
    'createRelatorioMeasurer',
    'useGenerateReportText',
    'fullName',
    'crefito',
    'ConfirmDialog',
  ]) {
    ok(src.includes(token), `editor deve conter ${token}`)
  }
  for (const token of ['dangerouslySetInnerHTML', 'pdf-lib', 'sanitizeText']) {
    ok(!src.includes(token), `editor nao deve conter ${token}`)
  }
})

test('REQ-57: painel do relatorio', () => {
  const src = read('../components/patients/PatientReportsPanel.tsx')
  for (const token of [
    'canWrite = false',
    'usePatient(patientId)',
    'buildRelatorioPdf',
    'downloadBlob',
    'SendEmailDialog',
    'SendWhatsAppDialog',
    'signPatientDocumentUrl',
    "'relatorio'",
    "source: 'relatorio'",
    'PATIENT_REPORT_COPY.whatsappMessage',
    'useEnsurePatientReportPdf',
    'tone="danger"',
    'PatientReportEditor',
  ]) {
    ok(src.includes(token), `painel deve conter ${token}`)
  }
  ok(!src.includes('dangerouslySetInnerHTML'))
})

test('REQ-57: aba Relatorio na ficha', () => {
  const header = read('../components/patients/PatientProfileHeader.tsx')
  for (const token of ["| 'relatorio'", "onTabChange('relatorio')", 'Relatório']) {
    ok(header.includes(token), `header deve conter ${token}`)
  }
  const page = read('../pages/PatientPage.tsx')
  for (const token of [
    "aba === 'relatorio'",
    "next === 'relatorio'",
    "{ aba: 'relatorio' }",
    "tab === 'relatorio'",
    'PatientReportsPanel',
  ]) {
    ok(page.includes(token), `pagina deve conter ${token}`)
  }
})

test('REQ-57: editor solta geração atrasada e conta Local como alteração; e-mail tem trava', () => {
  const editor = readFileSync(new URL('../components/patients/PatientReportEditor.tsx', import.meta.url), 'utf8')
  const panel = readFileSync(new URL('../components/patients/PatientReportsPanel.tsx', import.meta.url), 'utf8')
  ok(editor.includes('generate.reset()'))
  ok(editor.includes('placeValue !== report.place'))
  ok(panel.includes('if (!report || sending) return'))
})
