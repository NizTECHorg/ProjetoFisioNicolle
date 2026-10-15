import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { ESPORTES, resumoEsportes, safeEsportesLista } from './esportesAvaliacao.ts'
import { PRATICAS, linhasAvaliacaoPratica, safeAvaliacaoPratica } from './esportesPratica.ts'
import { emptyEvaluationFicha, evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'

test('avaliação esportiva: todo esporte do catálogo tem prática, chaves únicas por esporte', () => {
  for (const esporte of ESPORTES) {
    const pratica = PRATICAS[esporte.key]
    ok(pratica, `sem prática: ${esporte.key}`)
    ok(pratica.volumeDica.length > 0)
    const mods = pratica.modalidades.map((m) => m.key)
    equal(new Set(mods).size, mods.length, `modalidade repetida em ${esporte.key}`)
    const cars = pratica.caracteristicas.flatMap((g) => g.opcoes.map((o) => o.key))
    equal(new Set(cars).size, cars.length, `característica repetida em ${esporte.key}`)
  }
})

test('avaliação esportiva: descarta opção de outro esporte, frequência inválida e texto vazio', () => {
  deepEqual(
    safeAvaliacaoPratica(
      {
        perfil: 'profissional',
        nivel: 'mestre',
        frequencia: 9,
        anosPratica: '   ',
        volume: '30 km por semana',
        modalidades: ['trilha', 'praia', 'trilha'],
        caracteristicas: ['maratona', 'levantador'],
        sintomasMomentos: ['depois', 'antes'],
      },
      'corrida',
    ),
    {
      perfil: 'profissional',
      volume: '30 km por semana',
      modalidades: ['trilha'],
      caracteristicas: ['maratona'],
      sintomasMomentos: ['antes', 'depois'],
    },
  )
})

test('avaliação esportiva: lista mantém os campos e o schema aceita', () => {
  const entrada = {
    esporte: 'volei',
    nivel: 'atleta',
    frequencia: 5,
    modalidades: ['praia'],
    caracteristicas: ['ponteiro'],
    sintomas: 'Dor no ombro ao atacar',
    problemas: ['dorOmbroAtaque'],
  }
  deepEqual(safeEsportesLista([entrada]), [entrada])
  const ficha = emptyEvaluationFicha()
  const parsed = evaluationFichaSchema.parse({ ...ficha, funcao: { ...ficha.funcao, esportes: [entrada] } })
  deepEqual(parsed.funcao.esportes, [entrada])
})

test('avaliação esportiva: linhas para visualização e PDF', () => {
  deepEqual(
    linhasAvaliacaoPratica(
      { nivel: 'intermediario', frequencia: 3, modalidades: ['praia'], caracteristicas: ['libero'], sintomasMomentos: ['durante'] },
      'volei',
    ),
    [
      'Nível: Intermediário',
      'Frequência: 3x por semana',
      'Modalidades: Praia',
      'Posição: Líbero',
      'Quando os sintomas aparecem: Durante',
    ],
  )
  const resumo = resumoEsportes({ esportes: [{ esporte: 'outro', outro: 'Remo', frequencia: 7 }] })
  deepEqual(resumo[0]?.linhas, ['Frequência: Todo dia'])
})
