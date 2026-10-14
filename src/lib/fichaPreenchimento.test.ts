import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { blocoPreenchido, temConteudo } from './fichaPreenchimento.ts'

test('preenchimento: vazio, false, espaço e listas vazias não contam', () => {
  equal(temConteudo(undefined), false)
  equal(temConteudo(''), false)
  equal(temConteudo('   '), false)
  equal(temConteudo(false), false)
  equal(temConteudo([]), false)
  equal(temConteudo({ a: '', b: [], c: { d: undefined } }), false)
})

test('preenchimento: texto, número (inclusive 0), true e listas com item contam', () => {
  equal(temConteudo('x'), true)
  equal(temConteudo(0), true)
  equal(temConteudo(true), true)
  equal(temConteudo([{ cor: 'dor', d: 'M1 1' }]), true)
})

test('preenchimento: valores padrão (figura, grupo) não contam', () => {
  equal(temConteudo({ figura: 'masculina', tracos: [] }), false)
  equal(temConteudo({ linhas: [{ grupo: 'Flexores', direito: '' }] }), false)
  equal(temConteudo({ linhas: [{ grupo: 'Flexores', direito: '4' }] }), true)
})

test('preenchimento: lê pelo caminho', () => {
  const ficha = { anamnese: { queixa: { oQueTrouxe: 'dor no joelho' }, identificacao: {} } }
  equal(blocoPreenchido(ficha, ['anamnese', 'queixa']), true)
  equal(blocoPreenchido(ficha, ['anamnese', 'identificacao']), false)
  equal(blocoPreenchido(ficha, ['anamnese', 'naoExiste', 'x']), false)
})
