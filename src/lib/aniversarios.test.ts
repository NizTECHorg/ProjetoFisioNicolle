import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { aniversariantesDoDia, aniversariosNoPeriodo, rotuloAniversario } from './aniversarios.ts'

const pacientes = [
  { id: '1', name: 'Bruno', birthDateRaw: '1990-10-29' },
  { id: '2', name: 'Ana', birthDateRaw: '2000-10-29' },
  { id: '3', name: 'Carla', birthDateRaw: '1996-02-29' },
  { id: '4', name: 'Sem data', birthDateRaw: null },
  { id: '5', name: 'Lixo', birthDateRaw: 'abc' },
]

test('aniversariantes do dia, em ordem alfabética, com a idade que completam', () => {
  const lista = aniversariantesDoDia(pacientes, new Date(2026, 9, 29))
  deepEqual(lista.map((a) => [a.name, a.idade]), [['Ana', 26], ['Bruno', 36]])
  equal(rotuloAniversario(lista[0]!), 'Ana faz 26 anos')
})

test('29/02 aparece em 28/02 nos anos não bissextos e em 29/02 nos bissextos', () => {
  equal(aniversariantesDoDia(pacientes, new Date(2026, 1, 28))[0]?.name, 'Carla')
  equal(aniversariantesDoDia(pacientes, new Date(2028, 1, 28)).length, 0)
  equal(aniversariantesDoDia(pacientes, new Date(2028, 1, 29))[0]?.name, 'Carla')
})

test('período: só os dias com aniversário entram no mapa', () => {
  const mapa = aniversariosNoPeriodo(pacientes, new Date(2026, 9, 26), 7)
  deepEqual([...mapa.keys()], [new Date(2026, 9, 29).toDateString()])
})
