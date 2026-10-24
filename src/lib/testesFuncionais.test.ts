import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'
import {
  CATALOGO_FUNCIONAIS,
  assimetriaFuncional,
  formatTesteFuncional,
  lerTestesFuncionais,
} from './testesFuncionais.ts'

test('categorias na ordem pedida, todas com "Outro" no fim', () => {
  deepEqual(
    CATALOGO_FUNCIONAIS.map((c) => c.label),
    ['MMII', 'MMSS', 'Equilíbrio', 'Marcha', 'Saltos', 'Corrida', 'Tronco', 'Capacidade geral', 'Esporte', 'Outro'],
  )
  for (const c of CATALOGO_FUNCIONAIS) equal(c.testes.at(-1)?.key, 'outro')
  const chaves = CATALOGO_FUNCIONAIS.map((c) => c.testes.map((t) => t.key))
  for (const lista of chaves) equal(new Set(lista).size, lista.length)
})

test('assimetria em % do maior lado e lado menor', () => {
  deepEqual(assimetriaFuncional('150', '120'), { percentual: 20, menor: 'E' })
  deepEqual(assimetriaFuncional('9,5', '10'), { percentual: 5, menor: 'D' })
  deepEqual(assimetriaFuncional('10', '10'), { percentual: 0, menor: null })
  equal(assimetriaFuncional('10', ''), null)
  equal(assimetriaFuncional('abc', '10'), null)
})

test('leitura descarta o que não está no catálogo e campos inválidos', () => {
  const lidos = lerTestesFuncionais([
    { categoria: 'saltos', teste: 'singleLegHop', direito: '150', esquerdo: '120', unidade: 'cm', dor: '3', achados: ['valgo', 'x'] },
    { categoria: 'mmii', teste: 'naoExiste' },
    { categoria: 'mmii', teste: 'outro', outroTexto: '  Leg press  ', dor: 15, qualidade: 'boa' },
    'lixo',
  ])
  equal(lidos.length, 2)
  deepEqual(lidos[0], { categoria: 'saltos', teste: 'singleLegHop', unidade: 'cm', direito: '150', esquerdo: '120', dor: 3, achados: ['valgo'] })
  deepEqual(lidos[1], { categoria: 'mmii', teste: 'outro', outroTexto: 'Leg press' })
})

test('frase de leitura: comparável com assimetria e simples com lado', () => {
  equal(
    formatTesteFuncional({ categoria: 'saltos', teste: 'singleLegHop', direito: '150', esquerdo: '120', unidade: 'cm', dor: 2, qualidade: 'alterada', achados: ['valgo'] }),
    'Single-leg hop (Saltos): D 150 cm · E 120 cm · assimetria 20% · dor 2/10 · qualidade alterada · valgo',
  )
  equal(
    formatTesteFuncional({ categoria: 'marcha', teste: 'tug', lado: 'bilateral', resultado: '9', unidade: 's', observacao: 'Sem apoio' }),
    'Timed Up and Go (Marcha): Bilateral · 9 s. Sem apoio',
  )
})

test('ficha salva os testes funcionais e avaliação antiga continua válida', () => {
  const ficha = evaluationFichaSchema.parse({
    avaliacaoPlano: {
      palpacaoTestes: {
        achados: [],
        testeFuncional: 'Agachamento ruim',
        funcionais: [{ categoria: 'tronco', teste: 'pranchaAnterior', resultado: '45', unidade: 's' }],
      },
    },
  })
  equal(ficha.avaliacaoPlano?.palpacaoTestes?.funcionais?.[0]?.resultado, '45')
  equal(ficha.avaliacaoPlano?.palpacaoTestes?.testeFuncional, 'Agachamento ruim')
  const antiga = evaluationFichaSchema.parse({ avaliacaoPlano: { palpacaoTestes: { achados: [] } } })
  ok(Array.isArray(antiga.avaliacaoPlano?.palpacaoTestes?.funcionais))
})
