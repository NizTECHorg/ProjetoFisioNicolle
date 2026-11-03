import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import {
  RASCUNHO_NOVO,
  RASCUNHO_VALIDADE_MS,
  apagarRascunho,
  apagarTodosRascunhos,
  carregarRascunho,
  rascunhosDoPaciente,
  salvarRascunho,
} from './rascunhosLocais.ts'

function memoria() {
  const mapa = new Map<string, string>()
  return {
    get length() {
      return mapa.size
    },
    key: (i: number) => [...mapa.keys()][i] ?? null,
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => void mapa.set(k, v),
    removeItem: (k: string) => void mapa.delete(k),
  }
}

const ref = { userId: 'u1', patientId: 'p1', tipo: 'sessao', registroId: RASCUNHO_NOVO } as const

test('guarda, recupera e apaga por conta, paciente, tipo e registro', () => {
  const s = memoria()
  equal(salvarRascunho(ref, { conducts: 'Bicicleta' }, s, 1000), true)
  deepEqual(carregarRascunho(ref, s, 2000), { valores: { conducts: 'Bicicleta' }, salvoEm: 1000 })
  equal(carregarRascunho({ ...ref, userId: 'u2' }, s, 2000), null)
  equal(carregarRascunho({ ...ref, patientId: 'p2' }, s, 2000), null)
  equal(carregarRascunho({ ...ref, tipo: 'avaliacao' }, s, 2000), null)
  apagarRascunho(ref, s)
  equal(carregarRascunho(ref, s, 2000), null)
})

test('rascunho vencido some e dado estragado não quebra', () => {
  const s = memoria()
  salvarRascunho(ref, { a: 1 }, s, 0)
  equal(carregarRascunho(ref, s, RASCUNHO_VALIDADE_MS + 1), null)
  equal(s.length, 0)
  s.setItem('fluxo.rascunho.u1.p1.sessao.novo', '{quebrado')
  equal(carregarRascunho(ref, s, 0), null)
})

test('lista do paciente: mais recente primeiro; sair da conta apaga tudo e mantém o resto', () => {
  const s = memoria()
  salvarRascunho(ref, {}, s, 100)
  salvarRascunho({ ...ref, registroId: 'abc' }, {}, s, 200)
  salvarRascunho({ ...ref, tipo: 'avaliacao' }, {}, s, 300)
  s.setItem('fluxo.agenda.visao', 'mes')
  deepEqual(rascunhosDoPaciente({ userId: 'u1', patientId: 'p1', tipo: 'sessao' }, s, 400), [
    { registroId: 'abc', salvoEm: 200 },
    { registroId: RASCUNHO_NOVO, salvoEm: 100 },
  ])
  apagarTodosRascunhos(s)
  equal(s.length, 1)
  equal(s.getItem('fluxo.agenda.visao'), 'mes')
})

test('sem espaço no aparelho: avisa com false e não lança', () => {
  const s = memoria()
  s.setItem = () => {
    throw new Error('QuotaExceededError')
  }
  equal(salvarRascunho(ref, {}, s), false)
  equal(salvarRascunho(ref, {}, null), false)
})
