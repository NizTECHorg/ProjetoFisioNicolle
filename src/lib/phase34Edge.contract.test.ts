import { test } from 'node:test'
import { ok, doesNotMatch, match, equal } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const edge = readFileSync(
  fileURLToPath(new URL('../../supabase/functions/patient-ai-summary/index.ts', import.meta.url)),
  'utf8',
)
const lib = readFileSync(fileURLToPath(new URL('./avaliacaoIa.ts', import.meta.url)), 'utf8')

const OPEN = '// <avaliacao-ia-core>'
const CLOSE = '// </avaliacao-ia-core>'

function coreRegion(source: string): string {
  equal(source.split(OPEN).length - 1, 1, 'marcador de abertura deve aparecer uma vez')
  equal(source.split(CLOSE).length - 1, 1, 'marcador de fechamento deve aparecer uma vez')
  const from = source.indexOf(OPEN)
  const to = source.indexOf(CLOSE) + CLOSE.length
  return source.slice(from, to).replace(/[ \t]+$/gm, '')
}

function functionBody(name: string): string {
  const m = new RegExp(`(?:async )?function ${name}\\b`).exec(edge)
  ok(m, `${name} não encontrada`)
  const from = m.index
  const end = edge.indexOf('\n}\n', from)
  return edge.slice(from, end === -1 ? undefined : end)
}

const handler = edge.includes('Deno.serve(') ? edge.slice(edge.indexOf('Deno.serve(')) : ''

test('REQ-45: núcleo anti-alucinação idêntico na Edge Function e em src/lib', () => {
  equal(coreRegion(edge), coreRegion(lib))
})

test('REQ-45: handler aceita avaliacao e mantém evolucao e resumo', () => {
  match(handler, /'avaliacao'/)
  match(handler, /'evolucao'/)
  match(handler, /'resumo'/)
})

test('REQ-45: requireUser vem antes do modo avaliacao no handler', () => {
  const auth = handler.indexOf('requireUser(req)')
  const av = handler.indexOf("'avaliacao'")
  ok(auth >= 0 && av >= 0 && auth < av)
})

test('REQ-45: sem service role', () => {
  doesNotMatch(edge, /SERVICE_ROLE/)
})

test('REQ-45: assembleAvaliacaoSources lê só campos mínimos via RLS', () => {
  const body = functionBody('assembleAvaliacaoSources')
  match(body, /\.from\('patients'\)/)
  const sel = /\.from\('patients'\)\s*\.select\(\s*'([^']*)'/.exec(body)
  ok(sel, 'select de patients não encontrado')
  const cols = sel[1] ?? ''
  for (const bad of ['full_name', 'phone', 'email', 'birth_date', 'admin_notes', 'referral_source', 'emergency']) {
    ok(!cols.includes(bad), `select não pode conter ${bad}`)
  }
  for (const good of ['complaint', 'diagnosis', 'ai_summary', 'ai_summary_fields', 'summary_edits']) {
    ok(cols.includes(good), `select deve conter ${good}`)
  }
  doesNotMatch(body, /patient_evaluations/)
})

test('REQ-45: buildAvaliacaoPrompt sem hint e com fontes delimitadas', () => {
  const body = functionBody('buildAvaliacaoPrompt')
  doesNotMatch(body, /hintBlockFor/)
  ok(body.includes('<<<FONTE'))
})

test('REQ-45: handler verifica itens no servidor e devolve droppedCount e diagnosticoResumido', () => {
  match(handler, /verifyAvaliacaoItems\(/)
  match(handler, /droppedCount/)
  match(handler, /diagnosticoResumido/)
  match(edge, /summaryWithinSource\(/)
})

test('REQ-45: temperature 0 no modo avaliacao e fallback 0.2 intacto', () => {
  match(edge, /temperature: 0(?![.\d])/)
  match(edge, /parseAvaliacaoJson,\s*\{\s*temperature: 0\s*\}\s*\)/)
  ok(edge.includes('temperature: 0.2'))
})

test('REQ-45: modos antigos intactos', () => {
  ok(edge.includes('callGeminiEvolucao(apiKey, cappedPrompt)'))
  ok(edge.includes('assembleContextPack(userClient, patientId)'))
  ok(edge.includes('summary: result.summary'))
  ok(edge.includes('focusRegionKeys: result.focusRegionKeys'))
})

test('REQ-45: sem console.log nas funções novas', () => {
  for (const name of ['assembleAvaliacaoSources', 'buildAvaliacaoPrompt', 'parseAvaliacaoJson']) {
    doesNotMatch(functionBody(name), /console\.log/)
  }
})
