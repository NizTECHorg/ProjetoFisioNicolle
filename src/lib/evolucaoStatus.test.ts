import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { contarEvolucoesPendentes, situacaoEvolucao } from './evolucaoStatus.ts'
import type { SessionEvolution } from '../types/patient.ts'

const evo = (finalizedAt: string | null) => ({ finalizedAt }) as SessionEvolution

test('situacaoEvolucao: finalizada, rascunho, pendente e agendada sem evolução', () => {
  equal(situacaoEvolucao({ status: 'realizada', evolution: evo('2026-10-21T10:00:00Z') }), 'finalizada')
  equal(situacaoEvolucao({ status: 'realizada', evolution: evo(null) }), 'rascunho')
  equal(situacaoEvolucao({ status: 'agendada', evolution: evo(null) }), 'rascunho')
  equal(situacaoEvolucao({ status: 'realizada', evolution: null }), 'pendente')
  equal(situacaoEvolucao({ status: 'agendada', evolution: null }), null)
  equal(situacaoEvolucao({ status: 'cancelada', evolution: null }), null)
})

test('contarEvolucoesPendentes soma rascunhos e realizadas sem evolução', () => {
  equal(
    contarEvolucoesPendentes([
      { status: 'realizada', evolution: evo('2026-10-21T10:00:00Z') },
      { status: 'realizada', evolution: evo(null) },
      { status: 'realizada', evolution: null },
      { status: 'agendada', evolution: null },
    ]),
    2,
  )
})
