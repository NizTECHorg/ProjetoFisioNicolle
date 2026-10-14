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
  ok(paginas.length === 5, 'esperava 5 páginas')
  for (const [, id, lista] of paginas) {
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
  ok(sidebar.includes('className="hidden xl:block"'))
  ok(sidebar.includes('sticky top-4'))
  ok(sidebar.includes('type="submit"'))
  ok(FORM.includes("onPageChange ? 'xl:hidden' : ''"))
  ok(editor.includes('xl:hidden'))
})
