import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import {
  aiSummaryResponseSchema,
  diffSummaryEdits,
  formatGeneratedAt,
  narrowAiSummaryFields,
  narrowSummaryEdits,
  resolveSummaryFields,
  summaryEditsSchema,
} from './patientSummary.ts'

const EMPTY_FIELDS = {
  summary: '',
  treatmentPlan: '',
  evolution: '',
  conducts: '',
  nextSessionPlan: '',
  painLimitations: '',
}

test('REQ-33.3: edição vence o original', () => {
  equal(resolveSummaryFields({ summary: 'a' }, { summary: 'b' }).summary, 'b')
})

test('REQ-33.3: string vazia em edits apaga o original', () => {
  equal(resolveSummaryFields({ summary: 'a' }, { summary: '' }).summary, '')
})

test('REQ-33.3: sem original e sem edits as seis chaves são vazias', () => {
  deepEqual(resolveSummaryFields(null, null), EMPTY_FIELDS)
})

test('REQ-33.3: original sozinho passa adiante', () => {
  deepEqual(resolveSummaryFields({ summary: 'a', conducts: 'c' }, null), {
    ...EMPTY_FIELDS,
    summary: 'a',
    conducts: 'c',
  })
})

test('REQ-33.3: diffSummaryEdits devolve só as chaves diferentes', () => {
  deepEqual(diffSummaryEdits({ summary: 'a' }, { summary: 'a', conducts: 'x' }), {
    conducts: 'x',
  })
})

test('REQ-33.3: diffSummaryEdits aplica trim antes de comparar', () => {
  equal(diffSummaryEdits({ summary: 'a' }, { summary: ' a ' }), null)
})

test('REQ-33.3: diffSummaryEdits devolve null quando tudo é igual', () => {
  equal(
    diffSummaryEdits({ summary: 'a', conducts: 'c' }, { summary: 'a', conducts: 'c' }),
    null,
  )
})

test('REQ-33.3: diffSummaryEdits grava string vazia quando o profissional apaga', () => {
  deepEqual(diffSummaryEdits({ summary: 'a' }, { summary: '' }), { summary: '' })
})

test('REQ-33.4: aiSummaryResponseSchema aceita só summary e devolve focusRegionKeys vazio', () => {
  const parsed = aiSummaryResponseSchema.parse({ summary: 'x' })
  equal(parsed.summary, 'x')
  deepEqual(parsed.focusRegionKeys, [])
})

test('REQ-33.4: aiSummaryResponseSchema descarta opcional só com espaços', () => {
  const parsed = aiSummaryResponseSchema.parse({ summary: 'x', evolution: '   ' })
  equal(parsed.evolution, undefined)
})

test('REQ-33.4: aiSummaryResponseSchema corta texto acima do limite sem lançar', () => {
  const parsed = aiSummaryResponseSchema.parse({
    summary: 's'.repeat(1600),
    treatmentPlan: 'p'.repeat(600),
    nextSessionPlan: 'n'.repeat(450),
  })
  equal(parsed.summary.length, 1500)
  equal(parsed.treatmentPlan?.length, 500)
  equal(parsed.nextSessionPlan?.length, 400)
})

test('REQ-33.4: aiSummaryResponseSchema descarta chave desconhecida', () => {
  const parsed = aiSummaryResponseSchema.parse({ summary: 'x', lixo: 1 })
  ok(!Object.prototype.hasOwnProperty.call(parsed, 'lixo'))
})

test('REQ-33.4: summaryEditsSchema aceita os seis campos vazios', () => {
  const result = summaryEditsSchema.safeParse(EMPTY_FIELDS)
  ok(result.success)
})

test('REQ-33.4: summaryEditsSchema recusa 401 caracteres em nextSessionPlan', () => {
  const result = summaryEditsSchema.safeParse({
    ...EMPTY_FIELDS,
    nextSessionPlan: 'a'.repeat(401),
  })
  ok(!result.success)
  if (result.success) return
  equal(result.error.issues[0]?.message, 'Use no máximo 400 caracteres.')
})

test('REQ-33.2: narrowAiSummaryFields descarta número, chave fora do conjunto e summary', () => {
  deepEqual(
    narrowAiSummaryFields({ treatmentPlan: 'x', eva: 0, evolution: 3, summary: 'nao' }),
    { treatmentPlan: 'x' },
  )
})

test('REQ-33.2: narrowAiSummaryFields devolve null para objeto vazio e não-objeto', () => {
  equal(narrowAiSummaryFields({}), null)
  equal(narrowAiSummaryFields(null), null)
  equal(narrowAiSummaryFields([]), null)
  equal(narrowAiSummaryFields({ summary: 'so o resumo' }), null)
})

test('REQ-33.2: narrowSummaryEdits mantém string vazia e descarta chave de geração', () => {
  deepEqual(narrowSummaryEdits({ summary: '', generatedAt: '2026-10-03', eva: 0 }), {
    summary: '',
  })
  equal(narrowSummaryEdits(null), null)
})

test('REQ-33.2: formatGeneratedAt formata o instante em São Paulo', () => {
  equal(formatGeneratedAt('2026-10-03T23:14:00.000Z'), 'Gerado em 03/10/2026 às 20:14')
  equal(formatGeneratedAt('2026-10-04T03:00:00.000Z'), 'Gerado em 04/10/2026 às 00:00')
})

test('REQ-33.2: formatGeneratedAt devolve null para entrada inválida ou ausente', () => {
  equal(formatGeneratedAt('nao-e-data'), null)
  equal(formatGeneratedAt(undefined), null)
  equal(formatGeneratedAt(''), null)
})
