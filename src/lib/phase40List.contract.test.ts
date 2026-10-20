import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const PANEL = read('../components/patients/PatientEvaluationPanel.tsx')
const LEGACY = read('../components/patients/PatientPhysicalEvaluationPanel.tsx')

test('ícones de editar/excluir ficam sempre visíveis (6.8)', () => {
  for (const src of [PANEL, LEGACY]) {
    ok(!src.includes('group-hover:opacity-100'))
    ok(!src.includes('group-focus-within:opacity-100'))
    ok(!src.includes('[@media(hover:none)]:opacity-100'))
    ok(src.includes('<Trash2 size={18} />'))
    ok(src.includes('title="Excluir avaliação"'))
    ok(src.includes('aria-label="Excluir avaliação"'))
  }
})

test('painel: editar/excluir com 18px, title e confirmação preservada', () => {
  ok(PANEL.includes('<Pencil size={18} />'))
  ok(PANEL.includes('title="Editar avaliação"'))
  ok(PANEL.includes('setPendingDelete(selected)'))
})

test('legado: excluir mantém stopPropagation', () => {
  ok(LEGACY.includes('e.stopPropagation()'))
})
