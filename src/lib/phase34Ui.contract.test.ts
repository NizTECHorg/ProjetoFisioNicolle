import { test } from 'node:test'
import { ok, equal, deepEqual, throws } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { avaliacaoIaResponseSchema, PATIENT_AI_COPY } from '../schemas/patientAi.schema.ts'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const PANEL = '../components/patients/PatientEvaluationPanel.tsx'
const EDITOR = '../components/patients/PatientEvaluationEditorForm.tsx'

test('REQ-45: schema de resposta filtra itens inválidos sem lançar', () => {
  const out = avaliacaoIaResponseSchema.parse({
    items: [{ path: 'a.b', value: 'x', evidence: 'texto' }, { path: 1 }, 'lixo'],
    droppedCount: 2,
    diagnosticoResumido: null,
  })
  equal(out.items.length, 1)
  equal(out.droppedCount, 2)
})

test('REQ-45: defaults de droppedCount e diagnosticoResumido; items ausente falha', () => {
  const out = avaliacaoIaResponseSchema.parse({ items: [] })
  equal(out.droppedCount, 0)
  equal(out.diagnosticoResumido, null)
  throws(() => avaliacaoIaResponseSchema.parse({}))
})

test('REQ-45: value aceita string/number/boolean; limites filtram o item', () => {
  const out = avaliacaoIaResponseSchema.parse({
    items: [
      { path: 'a', value: 's', evidence: 'e' },
      { path: 'b', value: 3, evidence: 'e' },
      { path: 'c', value: true, evidence: 'e' },
      { path: 'p'.repeat(121), value: 's', evidence: 'e' },
      { path: 'd', value: 's', evidence: 'e'.repeat(4001) },
    ],
  })
  deepEqual(
    out.items.map((i) => (i as { path: string }).path),
    ['a', 'b', 'c'],
  )
})

test('REQ-45: copy da avaliação IA', () => {
  equal(PATIENT_AI_COPY.avaliacaoCta, 'Gerar avaliação com IA')
  equal(PATIENT_AI_COPY.avaliacaoGenerating, 'Gerando…')
  equal(PATIENT_AI_COPY.avaliacaoOpenBlank, 'Abrir em branco')
  ok(PATIENT_AI_COPY.avaliacaoError.length > 10)
})

test('REQ-45: painel liga botão, estados, aviso e builder', () => {
  const panel = read(PANEL)
  for (const text of [
    'Sparkles',
    'generateEvaluationDraft(',
    'buildAiEvaluationFicha(',
    'PATIENT_AI_COPY.avaliacaoCta',
    'PATIENT_AI_COPY.avaliacaoGenerating',
    'PATIENT_AI_COPY.avaliacaoError',
    'PATIENT_AI_COPY.avaliacaoOpenBlank',
    'AI_EVALUATION_BANNER',
    'role="status"',
    'draftFromPdf(result)',
  ]) {
    ok(panel.includes(text), `painel sem ${text}`)
  }
  const block = panel.indexOf('canWrite && !editorOpen')
  ok(block > -1 && panel.indexOf('handleGenerateAi', block) < panel.indexOf('Nova avaliação', block) + 400)
  const close = panel.slice(panel.indexOf('function closeEditor'))
  ok(close.slice(0, 200).includes('setAiNotes(null)'))
})

test('REQ-45: editor preenche gênero do cadastro', () => {
  const editor = read(EDITOR)
  ok(editor.includes('gender?:'))
  ok(editor.includes('genero:'))
  ok(editor.includes('genderLabel(snapshot.gender)'))
})
