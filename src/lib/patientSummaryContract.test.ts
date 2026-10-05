import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { FOCUS_REGIONS } from './focusRegions.ts'
import { SUMMARY_FIELD_KEYS } from './patientSummary.ts'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

const EDGE_FUNCTION =
  '../../.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts'

function sliceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker)
  if (start < 0) throw new Error(`marcador ausente: ${startMarker}`)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (end < 0) throw new Error(`marcador ausente: ${endMarker}`)
  return source.slice(start, end)
}

function extractFocusKeys(block: string): Set<string> {
  const keys = new Set<string>()
  for (const match of block.matchAll(/'((?:front|back)\.[a-z_]+)'/g)) {
    keys.add(match[1]!)
  }
  return keys
}

function extractCatalogPairs(block: string): { key: string; label: string }[] {
  const pairs: { key: string; label: string }[] = []
  for (const match of block.matchAll(/\{\s*key:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'\s*\}/g)) {
    pairs.push({ key: match[1]!, label: match[2]! })
  }
  return pairs
}

const UNTRUSTED = 'NÃO CONFIÁVEL'

const PACK_LEGACY = [
  'priorAiSummary',
  'programProgress',
  'evolutionSummary',
  'lastConducts',
  'program_name',
  'program_progress',
  'current_eva',
  'evolution_summary',
  'last_conducts',
  'next_session_plan',
  'eva:',
] as const

const RESUMO_LEGACY = [
  'detail.program',
  'programProgress',
  'detail.eva',
  'evolutionSummary',
  'lastConducts',
  'detail.nextSessionPlan',
  '/10',
] as const

test('REQ-33.6: pack sem campos legados', () => {
  const pack = sliceBetween(
    read(EDGE_FUNCTION),
    'async function assembleContextPack',
    'function buildPrompt',
  )
  for (const token of PACK_LEGACY) {
    ok(!pack.includes(token), `pack ainda contém ${token}`)
  }
})

test('REQ-33.6: prompt com 7 chaves', () => {
  const prompt = sliceBetween(
    read(EDGE_FUNCTION),
    'function buildPrompt',
    'async function assembleEvolucaoContextPack',
  )
  for (const key of SUMMARY_FIELD_KEYS) {
    ok(prompt.includes(key), `prompt sem ${key}`)
  }
  ok(prompt.includes('focusRegionKeys'), 'prompt sem focusRegionKeys')
  const hint = sliceBetween(read(EDGE_FUNCTION), 'function hintBlockFor', 'function buildPrompt')
  ok(hint.includes(UNTRUSTED), 'hintBlockFor sem NÃO CONFIÁVEL')
})

test('REQ-33.6: paridade das 42 chaves de foco', () => {
  const fnKeys = extractFocusKeys(
    sliceBetween(read(EDGE_FUNCTION), 'FOCUS_REGION_KEYS = new Set([', '])'),
  )
  const clientKeys = extractFocusKeys(
    sliceBetween(read('./focusRegions.ts'), 'export const FOCUS_REGION_KEYS = [', '] as const'),
  )
  equal(fnKeys.size, 42)
  equal(clientKeys.size, 42)
  for (const key of clientKeys) ok(fnKeys.has(key), `função sem ${key}`)
  for (const key of fnKeys) ok(clientKeys.has(key), `cliente sem ${key}`)
})

test('REQ-33.2: aba Resumo IA não contém summaryEdits', () => {
  const panel = read('../components/patients/PatientResumoIaPanel.tsx')
  ok(!panel.includes('summaryEdits'))
})

test('REQ-33.5: ResumoDoPaciente troca os cards legados', () => {
  const block = sliceBetween(
    read('../pages/PatientPage.tsx'),
    'function ResumoDoPaciente',
    'function ResumoPanel',
  )
  for (const token of RESUMO_LEGACY) {
    ok(!block.includes(token), `ResumoDoPaciente ainda contém ${token}`)
  }
  ok(block.includes('resolveSummaryFields'))
  ok(block.includes('Plano de tratamento'))
  ok(block.includes('Dor e limitações'))
})

test('REQ-34.1: Resumo sem modal e editor por chave', () => {
  const page = read('../pages/PatientPage.tsx')
  ok(!page.includes('PatientSummaryEditorModal'))
  const block = sliceBetween(page, 'function ResumoDoPaciente', 'function ResumoPanel')
  for (const token of ['diffSummaryEdits', 'editingKey', 'summaryEditsSchema.shape', 'canWrite']) {
    ok(block.includes(token), `ResumoDoPaciente sem ${token}`)
  }
  for (const key of SUMMARY_FIELD_KEYS) {
    ok(block.includes(key), `ResumoDoPaciente sem ${key}`)
  }
  ok(!block.includes('onBlur'))
  ok(!read('../components/patients/PatientResumoIaPanel.tsx').includes('Pencil'))
  ok(
    !existsSync(new URL('../components/patients/PatientSummaryEditorModal.tsx', import.meta.url)),
    'src/components/patients/PatientSummaryEditorModal.tsx ainda existe',
  )
})

test('REQ-34.2: sessionsDone conta realizada', () => {
  const pack = sliceBetween(
    read(EDGE_FUNCTION),
    'async function assembleContextPack',
    'function buildPrompt',
  )
  ok(!pack.includes('sessionsDone: patient.sessions_done'))
  ok(pack.includes("count: 'exact'"))
  ok(pack.includes('head: true'))
  ok(pack.includes('realizada'))
})

test('REQ-34.3: paridade dos rótulos de foco', () => {
  const source = read(EDGE_FUNCTION)
  const catalog = extractCatalogPairs(
    sliceBetween(source, 'const FOCUS_REGION_CATALOG', 'function truncate'),
  )
  const client = FOCUS_REGIONS.map((region) => ({ key: region.key, label: region.label }))
  equal(catalog.length, 42)
  equal(client.length, 42)
  deepEqual(catalog, client)
  ok(source.includes('(?<![a-z])'))
  ok(source.includes("normalize('NFD')") || source.includes('normalize("NFD")'))
  const marker = 'const prompt = buildPrompt(packOrError, userHint)'
  const at = source.indexOf(marker)
  if (at < 0) throw new Error(`marcador ausente: ${marker}`)
  const tail = source.slice(at)
  ok(tail.includes('allowedFocusRegionKeys'))
  ok(!tail.includes('return jsonResponse({ ...result })'))
})

test('REQ-34.3: cliente não apaga área de foco', () => {
  const block = sliceBetween(
    read('../services/patientAi.service.ts'),
    'export async function applyAiFocusRegionKeys',
    'export async function generatePatientAiSummary',
  )
  ok(!block.includes('.delete'))
})

test('REQ-34.4: descrição é FONTE no buildPrompt', () => {
  const prompt = sliceBetween(
    read(EDGE_FUNCTION),
    'function buildPrompt',
    'async function assembleEvolucaoContextPack',
  )
  ok(prompt.includes('FONTE'))
  ok(prompt.includes('patient.sessionsDone'))
  ok(prompt.includes('não substitui'))
  ok(!prompt.includes(UNTRUSTED), 'buildPrompt ainda contém NÃO CONFIÁVEL')
  ok(!prompt.includes('hintBlockFor'))
})

test('REQ-34.5: queixa e diagnóstico rolam no parágrafo', () => {
  const block = sliceBetween(
    read('../pages/PatientPage.tsx'),
    'function EntendaOCaso',
    'function ResumoDoPaciente',
  )
  ok(!block.includes('line-clamp-3'))
  for (const token of [
    'case-scroll',
    'max-h-[4.5rem]',
    'overflow-y-auto',
    'overscroll-contain',
    'aria-label="Queixa"',
    'aria-label="Diagnóstico"',
    'line-clamp-2',
  ]) {
    ok(block.includes(token), `EntendaOCaso sem ${token}`)
  }
  equal(block.split('overflow-y-auto').length - 1, 2)
  const css = read('../index.css')
  ok(css.includes('.case-scroll'))
  ok(css.includes('rgba(16, 32, 56, 0.28)'))
})

test('REQ-34.5: rótulo da descrição adicional', () => {
  const composer = read('../components/patients/PatientAiComposer.tsx')
  ok(composer.includes('Descrição adicional (opcional)'))
  ok(composer.includes('Ex.: dor no joelho direito ao subir escada'))
  ok(!composer.includes('enfatize'))
  ok(!composer.includes('ênfase'))
  ok(!composer.includes('Orientação opcional'))
})
