import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'
import { FORCA_REGIOES, OUTRA_REGIAO_FORCA, agruparForca, sugestoesForca } from './forcaRegioes.ts'

test('regiões da força vêm da Mobilidade, sem ATM, com "Outra região" no fim', () => {
  const labels = FORCA_REGIOES.map((regiao) => regiao.label)
  ok(labels.includes('Ombro'))
  ok(labels.includes('Joelho'))
  ok(!labels.includes('ATM / mandíbula'))
  equal(labels.at(-1), OUTRA_REGIAO_FORCA)
  ok(sugestoesForca('Joelho').includes('Flexão'))
  ok(sugestoesForca('Joelho').includes('Rotação interna'))
  ok(sugestoesForca('Joelho').includes('Rotação externa'))
  deepEqual(sugestoesForca(OUTRA_REGIAO_FORCA), [])
  deepEqual(sugestoesForca(undefined), [])
})

test('agruparForca: ordem do catálogo, índice original e linhas antigas sem região no fim', () => {
  const grupos = agruparForca([
    { regiao: 'Joelho', grupo: 'Extensão' },
    { grupo: 'Quadríceps (antigo)' },
    { regiao: 'Ombro', grupo: 'Abdução' },
    { regiao: 'Joelho', grupo: 'Flexão' },
  ])
  deepEqual(
    grupos.map((grupo) => [grupo.regiao, grupo.linhas.map((item) => item.index)]),
    [
      ['Ombro', [2]],
      ['Joelho', [0, 3]],
      ['', [1]],
    ],
  )
})

test('ficha antiga sem região continua válida e a região nova é aceita', () => {
  const antiga = evaluationFichaSchema.parse({ avaliacaoPlano: { forca: { linhas: [{ grupo: 'Glúteo médio' }] } } })
  equal(antiga.avaliacaoPlano?.forca?.linhas?.[0]?.regiao, undefined)
  const nova = evaluationFichaSchema.parse({ avaliacaoPlano: { forca: { linhas: [{ regiao: 'Quadril', grupo: 'Abdução' }] } } })
  equal(nova.avaliacaoPlano?.forca?.linhas?.[0]?.regiao, 'Quadril')
})
