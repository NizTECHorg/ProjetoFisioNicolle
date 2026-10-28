import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const EDITOR = read('../components/patients/PatientEvaluationEditorForm.tsx')
const FOOTER = read('../components/patients/evaluation/EvaluationFichaFooter.tsx')
const FORM = read('../components/patients/evaluation/EvaluationFichaForm.tsx')

test('6.4 rodapé EvaluationFichaFooter tem progresso, voltar/avançar e só Concluir como submit', () => {
  ok(FOOTER.includes('role="progressbar"'))
  ok(FOOTER.includes('aria-valuetext'))
  ok(FOOTER.includes('aria-hidden="true"'))
  ok(FOOTER.includes('aria-label="Salvar avaliação"'))
  ok(FOOTER.includes('aria-label="Próxima página"'))
  ok(FOOTER.includes('aria-label="Página anterior"'))
  ok(FOOTER.includes('aria-label="Concluir avaliação"'))
  ok(FOOTER.includes('Progresso da avaliação clínica'))
  ok(FOOTER.includes('Concluir'))
  ok(FOOTER.includes('grid-cols-2'), 'Cancelar e Salvar no meio, setas nas pontas')
  ok(FOOTER.includes('min-h-10'))
  ok(FOOTER.includes('sticky bottom-'), 'fixo acima da navegação móvel')
  ok(FOOTER.includes('Informe a data da avaliação para salvar.'))

  const submits = FOOTER.match(/type="submit"/g) ?? []
  const buttons = FOOTER.match(/type="button"/g) ?? []
  equal(submits.length, 1, 'apenas Concluir deve ser type="submit" no rodapé')
  equal(buttons.length, 4, 'Anterior, Cancelar, Salvar e Próxima devem ser type="button"')
})

test('6.4 EvaluationFichaForm anuncia, foca e rola na troca de página abaixo de xl', () => {
  ok(FORM.includes("hideChipsOnDesktop ? 'xl:hidden' : ''"))
  ok(!FORM.includes("onPageChange ? 'xl:hidden' : ''"))
  ok(FORM.includes('aria-current'))
  ok(FORM.includes('role="status"'))
  ok(FORM.includes('aria-live="polite"'))
  ok(FORM.includes('tabIndex={-1}'))
  ok(FORM.includes('prefers-reduced-motion'))
  ok(FORM.includes('scrollToElement('))
})

test('6.4 editor usa EvaluationFichaFooter abaixo de xl e não tem type="submit" próprio', () => {
  ok(EDITOR.includes('EvaluationFichaFooter'))
  ok(EDITOR.includes("className={comLateral ? 'xl:hidden' : ''}"))
  ok(EDITOR.includes('page={fichaPage}'))
  ok(EDITOR.includes('onPageChange={setFichaPage}'))
  ok(EDITOR.includes('hideChipsOnDesktop={comLateral}'))

  const submits = EDITOR.match(/type="submit"/g) ?? []
  equal(submits.length, 0, 'editor não deve ter type="submit" próprio')
})

test('6.4 Salvar sem sair grava e guarda savedId sem chamar onSuccess nem duplicar no Concluir', () => {
  ok(EDITOR.includes('const [savedId, setSavedId] = useState<string | null>(null)'))
  ok(EDITOR.includes('const targetId = editing?.id ?? savedId'))
  ok(EDITOR.includes('EVALUATION_SAVED_MESSAGE'))
  ok(EDITOR.includes('EVALUATION_SAVE_ERROR'))
  ok(EDITOR.includes('handleSubmit(onSaveStay'))

  const start = EDITOR.indexOf('function onSaveStay')
  ok(start >= 0, 'deve existir function onSaveStay')
  const nextFn = EDITOR.indexOf('\n  function ', start + 1)
  const body = EDITOR.slice(start, nextFn > start ? nextFn : undefined)

  ok(body.includes('setSavedId('), 'onSaveStay deve guardar o id criado em savedId')
  ok(body.includes('targetId'), 'onSaveStay deve reutilizar targetId nos salvamentos seguintes')
  ok(!body.includes('onSuccess }') && !body.includes('{ onSuccess'), 'onSaveStay não deve chamar onSuccess')
})

test('6.4 Enter num campo do formulário não dispara envio implícito', () => {
  ok(EDITOR.includes('onKeyDown='))
  ok(EDITOR.includes('shouldBlockImplicitSubmit('))
  ok(EDITOR.includes('preventDefault()'))
})
