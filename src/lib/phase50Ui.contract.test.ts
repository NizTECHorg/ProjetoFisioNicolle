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
