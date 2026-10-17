import { test } from 'node:test'
import { ok, equal } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const service = readFileSync(
  fileURLToPath(new URL('../services/termsPdf.service.ts', import.meta.url)),
  'utf8',
)
const pad = readFileSync(
  fileURLToPath(new URL('../components/patients/evaluation/SignaturePad.tsx', import.meta.url)),
  'utf8',
)

test('REQ-48: serviço de PDF contém os elementos obrigatórios', () => {
  for (const needle of [
    'drawSvgPath(',
    'isSafeSignaturePath(',
    'signaturePdfScale(',
    'toWinAnsiSafe',
    'wrapLines',
    'Assinado digitalmente em',
    'Data: ___/___/______',
    'Fluxo · página',
    'export async function buildSignedTermPdf',
    'export async function buildPrintableTermPdf',
  ]) {
    ok(service.includes(needle), `faltando: ${needle}`)
  }
})

test('REQ-48: serviço de PDF não usa itens proibidos', () => {
  for (const needle of ['patientAiPdf.service', 'console.', 'fontkit', 'Não informado']) {
    equal(service.includes(needle), false, `proibido: ${needle}`)
  }
})

test('REQ-48: SignaturePad preserva os textos padrão da avaliação', () => {
  ok(pad.includes('Assine com o mouse ou o dedo.'))
  ok(pad.includes('Apagar assinatura'))
})
