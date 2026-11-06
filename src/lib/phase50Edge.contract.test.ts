import { test } from 'node:test'
import { ok, doesNotMatch, match, equal } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const edge = readFileSync(
  fileURLToPath(new URL('../../supabase/functions/patient-ai-summary/index.ts', import.meta.url)),
  'utf8',
)
const sendCopy = readFileSync(
  fileURLToPath(
    new URL(
      '../../.planning/phases/50-aba-relat-rio-do-paciente/functions/send-patient-document/index.ts',
      import.meta.url,
    ),
  ),
  'utf8',
)

function functionBody(name: string): string {
  const m = new RegExp(`(?:async )?function ${name}\\b`).exec(edge)
  ok(m, `${name} não encontrada`)
  const from = m.index
  const end = edge.indexOf('\n}\n', from)
  return edge.slice(from, end === -1 ? undefined : end)
}

const handler = edge.slice(edge.indexOf('Deno.serve('))
const handlerRelatorio = handler.slice(
  handler.indexOf("if (mode === 'relatorio')"),
  handler.indexOf('const packOrError = evaluationId'),
)
const newFns = [
  'parseRelatorioSessionIds',
  'assembleRelatorioPack',
  'buildRelatorioPrompt',
  'parseRelatorioJson',
  'limparTextoRelatorio',
]

test('REQ-57: mode relatorio aceito no ternário', () => {
  match(handler, /body\.mode === 'relatorio'/)
  match(edge, /const MAX_RELATORIO_CHARS = 1300/)
})

test('REQ-57: pacote só com campos de evolução, sem dados do paciente', () => {
  const body = functionBody('assembleRelatorioPack')
  match(body, /side_effects/)
  match(body, /length !== sessionIds\.length/)
  match(body, /no_content/)
  for (const re of [
    /from\('patients'\)/,
    /complaint/,
    /diagnosis/,
    /evolution_summary/,
    /ai_summary/,
    /patient_evaluations/,
    /full_name/,
    /therapist_name/,
    /\bplace\b/,
  ]) {
    doesNotMatch(body, re)
  }
})

test('REQ-57: prompt restritivo e sem dica do usuário', () => {
  const body = functionBody('buildRelatorioPrompt')
  match(body, /APENAS/)
  match(body, /[Nn]unca invente/)
  match(body, /<<<FONTE>>>/)
  match(body, /950/)
  doesNotMatch(body, /hintBlockFor/)
  doesNotMatch(body, /userHint/)
})

test('REQ-57: handler usa parser e temperatura baixa; corte de 1300', () => {
  match(handlerRelatorio, /parseRelatorioJson/)
  match(handlerRelatorio, /temperature: 0\.2/)
  match(functionBody('limparTextoRelatorio'), /MAX_RELATORIO_CHARS/)
})

test('REQ-57: funções novas sem console.log nem escrita no banco', () => {
  for (const name of newFns) {
    const body = functionBody(name)
    doesNotMatch(body, /console\.log/)
    doesNotMatch(body, /\.(insert|update|upsert)\(/)
  }
  doesNotMatch(handlerRelatorio, /console\.log|\.(insert|update|upsert)\(/)
})

test('REQ-57: send-patient-document aceita source relatorio', () => {
  match(sendCopy, /SUBJECT_RELATORIO/)
  match(sendCopy, /Seu relatório/)
  match(sendCopy, /from\('patient_reports'\)/)
  match(sendCopy, /relatorio\.pdf/)
  match(sendCopy, /patient\.created_by !== user\.id/)
  match(sendCopy, /invalid_kind/)
  match(sendCopy, /from\('patient_ai_reports'\)/)
  match(
    sendCopy,
    /body\.source !== undefined && body\.source !== 'relatorio'[\s\S]{0,80}invalid_body/,
  )
  equal(sendCopy.includes('console.log('), false)
})
