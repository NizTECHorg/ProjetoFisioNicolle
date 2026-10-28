import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const FORM = read('../components/patients/evaluation/EvaluationFichaForm.tsx')

test('navegação lateral: cada bloco listado existe com a mesma letra e título na página', () => {
  const inicio = FORM.indexOf('export const FICHA_BLOCOS')
  const corpo = FORM.slice(inicio, FORM.indexOf('\n}\n', inicio))
  const paginas = [...corpo.matchAll(/'(0\d)': \[([\s\S]*?)\]/g)]
  ok(paginas.length === 4, 'esperava 4 páginas (mapa de sintomas na 02 desde o 6.5)')
  for (const [, id = '', lista = ''] of paginas) {
    const pagina = read(`../components/patients/evaluation/EvaluationPage${id}.tsx`)
    for (const [, letter, title] of lista.matchAll(/letter: '([^']+)', title: '([^']+)'/g)) {
      ok(
        pagina.includes(`letter="${letter}" title="${title}"`),
        `página ${id}: falta FichaBlock letter="${letter}" title="${title}"`,
      )
    }
  }
})

test('navegação lateral só no desktop (xl): chips e botões do fim somem só em xl', () => {
  const sidebar = read('../components/patients/evaluation/EvaluationFichaSidebar.tsx')
  const editor = read('../components/patients/PatientEvaluationEditorForm.tsx')
  const panel = read('../components/patients/PatientEvaluationPanel.tsx')
  ok(panel.includes('ref={setSidebarSlot} className="hidden xl:block"'), 'slot fora do cartão, só xl')
  ok(sidebar.includes('sticky top-4'))
  ok(sidebar.includes('form={formId}'), 'Salvar fora do <form> usa form=')
  ok(sidebar.includes('blocoPreenchido('))
  ok(sidebar.includes('onClick={() => proxima && irParaPagina(proxima.id)}'), 'Próxima fixa junto do Salvar')
  ok(sidebar.includes('onClick={() => anterior && irParaPagina(anterior.id)}'), 'Anterior ao lado da Próxima')
  ok(!sidebar.includes('border-l border-line'), 'sem linha à esquerda dos blocos')
  ok(editor.includes('createPortal('))
  ok(FORM.includes("hideChipsOnDesktop ? 'xl:hidden' : ''"))
  ok(editor.includes("comLateral ? 'xl:hidden' : ''"))
})
