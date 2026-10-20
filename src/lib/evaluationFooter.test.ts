import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import {
  EVALUATION_SAVED_MESSAGE,
  EVALUATION_SAVE_ERROR,
  fichaPageAnnouncement,
  fichaPageName,
  fichaPagerState,
  shouldBlockImplicitSubmit,
} from './evaluationFooter.ts'

const ids = ['01', '02', '03', '04', '05'] as const

test('fichaPagerState: posição, percentual e próxima página', () => {
  deepEqual(fichaPagerState(ids, '01'), { index: 0, n: 1, total: 5, percent: 20, next: '02', isLast: false })
  const p4 = fichaPagerState(ids, '04')
  equal(p4.percent, 80)
  equal(p4.next, '05')
  equal(p4.isLast, false)
  const p5 = fichaPagerState(ids, '05')
  equal(p5.n, 5)
  equal(p5.percent, 100)
  equal(p5.next, null)
  equal(p5.isLast, true)
})

test('fichaPagerState: id desconhecido vira índice 0; total vem da lista', () => {
  const x = fichaPagerState(ids, 'xx' as '01')
  equal(x.n, 1)
  equal(x.percent, 20)
  const t = fichaPagerState(['a', 'b', 'c'], 'b')
  equal(t.n, 2)
  equal(t.total, 3)
  equal(t.percent, 66.67)
})

test('fichaPageName e fichaPageAnnouncement', () => {
  equal(fichaPageName('02 · Comportamento dos sintomas'), 'Comportamento dos sintomas')
  equal(fichaPageName('Sem prefixo'), 'Sem prefixo')
  equal(
    fichaPageAnnouncement(2, 5, '02 · Comportamento dos sintomas'),
    'Página 2 de 5: Comportamento dos sintomas',
  )
})

test('shouldBlockImplicitSubmit', () => {
  equal(shouldBlockImplicitSubmit('Enter', 'INPUT', 'text'), true)
  equal(shouldBlockImplicitSubmit('Enter', 'INPUT', 'date'), true)
  equal(shouldBlockImplicitSubmit('Enter', 'INPUT', undefined), true)
  equal(shouldBlockImplicitSubmit('Enter', 'SELECT'), true)
  equal(shouldBlockImplicitSubmit('Enter', 'TEXTAREA'), false)
  equal(shouldBlockImplicitSubmit('Enter', 'BUTTON', 'submit'), false)
  equal(shouldBlockImplicitSubmit('Enter', 'INPUT', 'submit'), false)
  equal(shouldBlockImplicitSubmit('Enter', 'INPUT', 'button'), false)
  equal(shouldBlockImplicitSubmit('a', 'INPUT', 'text'), false)
  equal(shouldBlockImplicitSubmit('Enter', 'path'), false)
})

test('mensagens', () => {
  equal(EVALUATION_SAVED_MESSAGE, 'Avaliação salva.')
  equal(EVALUATION_SAVE_ERROR, 'Não foi possível salvar a avaliação. Confira a conexão e tente de novo.')
})
