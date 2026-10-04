import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  ok(prompt.includes('NÃO CONFIÁVEL'), 'prompt sem NÃO CONFIÁVEL')
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
