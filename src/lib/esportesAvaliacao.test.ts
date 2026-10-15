import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'
import {
  ESPORTES,
  ESPORTE_OUTRO,
  type ResumoEsporte,
  avaliarTexto,
  buscarEsportes,
  problemasDoEsporte,
  resumoEsporte,
  safeEsporte,
  safeEsporteProblemas,
  ESPORTES_MAX,
  esportesDaFuncao,
  resumoEsportes,
  safeEsportesLista,
} from './esportesAvaliacao.ts'
import { CATALOGO_TESTES, fold } from './mobilidadePalpacao.ts'

const KEY_RE = /^[a-z][a-zA-Z0-9]{0,63}$/

test('REQ-44: catálogo tem 17 esportes na ordem esperada', () => {
  deepEqual(
    ESPORTES.map((e) => e.key),
    [
      'volei',
      'futebol',
      'corrida',
      'basquete',
      'tenis',
      'natacao',
      'musculacao',
      'crossfit',
      'ciclismo',
      'lutas',
      'handebol',
      'futevolei',
      'padel',
      'danca',
      'pilatesYoga',
      'ski',
      'snowboard',
    ],
  )
  equal(ESPORTES.length, 17)
  ok(!ESPORTES.some((e) => e.key === ESPORTE_OUTRO))
})

test('REQ-44: cada esporte tem problemas bem formados', () => {
  for (const e of ESPORTES) {
    ok(e.problemas.length >= 4 && e.problemas.length <= 8, `${e.key}: qtde de problemas`)
    const keys = new Set<string>()
    for (const p of e.problemas) {
      ok(KEY_RE.test(p.key), `${e.key}.${p.key}: key inválida`)
      ok(!keys.has(p.key), `${e.key}.${p.key}: key duplicada`)
      keys.add(p.key)
      ok(p.nome.trim().length > 0, `${e.key}.${p.key}: nome vazio`)
      ok(p.regiao.trim().length > 0, `${e.key}.${p.key}: região vazia`)
      const total = p.testes.length + p.achados.length
      ok(total >= 2 && total <= 6, `${e.key}.${p.key}: testes+achados = ${total}`)
      ok(p.testes.length <= 3, `${e.key}.${p.key}: testes > 3`)
      ok(p.achados.length <= 3, `${e.key}.${p.key}: achados > 3`)
    }
  }
})

test('REQ-44: todo teste sugerido existe em CATALOGO_TESTES', () => {
  const nomes = new Set(CATALOGO_TESTES.flatMap((r) => r.testes.map((t) => t.label)))
  for (const e of ESPORTES) {
    for (const p of e.problemas) {
      for (const t of p.testes) ok(nomes.has(t), `${e.key}.${p.key}: ${t}`)
    }
  }
})

test('REQ-44: nomes não usam linguagem diagnóstica', () => {
  for (const e of ESPORTES) {
    for (const p of e.problemas) {
      const n = fold(p.nome)
      ok(!n.includes('possivel') && !n.includes('provavel') && !n.includes('diagnostico'), `${e.key}.${p.key}`)
    }
  }
})

test('REQ-44: safeEsporte aceita só keys conhecidas ou outro', () => {
  equal(safeEsporte('volei'), 'volei')
  equal(safeEsporte('  futebol '), 'futebol')
  equal(safeEsporte('outro'), 'outro')
  for (const v of ['xadrez', '', 42, null, undefined, {}]) equal(safeEsporte(v), undefined)
})

test('REQ-44: safeEsporteProblemas é tolerante', () => {
  deepEqual(safeEsporteProblemas('lixo'), [])
  deepEqual(safeEsporteProblemas(undefined), [])
  deepEqual(safeEsporteProblemas(['a', 1, null, 'a', ' b ', 'Bad', 'x-y']), ['a', 'b'])
  const muitas = Array.from({ length: 20 }, (_, i) => `k${i}`)
  equal(safeEsporteProblemas(muitas).length, 12)
})

test('REQ-44: problemasDoEsporte', () => {
  ok(problemasDoEsporte('volei').length >= 4)
  deepEqual(problemasDoEsporte('outro'), [])
  deepEqual(problemasDoEsporte(undefined), [])
  deepEqual(problemasDoEsporte('xadrez'), [])
})

test('REQ-44: avaliarTexto junta testes e achados', () => {
  equal(avaliarTexto({ key: 'x', nome: 'n', regiao: 'r', testes: ['Lachman'], achados: ['Derrame'] }), 'Lachman · Derrame')
})

test('REQ-44: buscarEsportes ignora acento e usa sinônimos', () => {
  const keys = (q: string) => buscarEsportes(q).map((e) => e.key)
  equal(buscarEsportes('').length, 17)
  ok(keys('VOLEI').includes('volei'))
  ok(keys('vôlei').includes('volei'))
  ok(keys('beach').includes('tenis'))
  ok(keys('jiu').includes('lutas'))
  ok(keys('ballet').includes('danca'))
  ok(keys('yoga').includes('pilatesYoga'))
  ok(keys('academia').includes('musculacao'))
})

test('REQ-44: resumoEsporte vazio quando não pratica atividade', () => {
  deepEqual(resumoEsporte(undefined), { problemas: [] })
  const r: ResumoEsporte = resumoEsporte({ praticaAtividadeFisica: 'nao', esporte: 'volei', esporteProblemas: ['entorseTornozelo'] })
  equal(r.esporteLabel, undefined)
  deepEqual(r, { problemas: [] })
})

test('REQ-44: resumoEsporte filtra problemas pelo esporte atual', () => {
  const volei = ESPORTES.find((e) => e.key === 'volei')!
  const first = volei.problemas[0]!
  const k = first.key
  const r = resumoEsporte({
    praticaAtividadeFisica: 'sim',
    esporte: 'volei',
    esporteProblemas: [k, 'lesaoIsquiotibiais', 'lixo'],
  })
  equal(r.esporteLabel, 'Vôlei')
  equal(r.problemas.length, 1)
  deepEqual(r.problemas[0], { key: k, nome: first.nome, regiao: first.regiao })
})

test('REQ-44: resumoEsporte com Outro e sem esporte', () => {
  const a = resumoEsporte({ praticaAtividadeFisica: 'sim', esporte: 'outro', esporteOutro: '  Remo ' })
  equal(a.esporteLabel, 'Remo')
  deepEqual(a.problemas, [])
  equal(resumoEsporte({ praticaAtividadeFisica: 'sim', esporte: 'outro', esporteOutro: '' }).esporteLabel, 'Outro')
  const b = resumoEsporte({ praticaAtividadeFisica: 'sim' })
  equal(b.esporteLabel, undefined)
  deepEqual(b.problemas, [])
})

test('REQ-44: schema aceita ficha sem campos novos', () => {
  const p = evaluationFichaSchema.parse({ funcao: { rotina: { praticaAtividadeFisica: 'sim' } } })
  equal(p.funcao?.rotina?.esporte, undefined)
  equal(p.funcao?.rotina?.esporteProblemas, undefined)
})

test('REQ-44: schema descarta lixo sem lançar', () => {
  const p = evaluationFichaSchema.parse({
    funcao: { rotina: { praticaAtividadeFisica: 'sim', esporte: 'xadrez', esporteProblemas: 'lixo' } },
  })
  equal(p.funcao?.rotina?.esporte, undefined)
  equal(p.funcao?.rotina?.esporteProblemas, undefined)
})

test('REQ-44: schema sanitiza esporteProblemas', () => {
  const p = evaluationFichaSchema.parse({
    funcao: { rotina: { esporte: 'volei', esporteProblemas: ['entorseTornozelo', 7, 'entorseTornozelo', 'X'] } },
  })
  deepEqual(p.funcao?.rotina?.esporteProblemas, ['entorseTornozelo'])
  const q = evaluationFichaSchema.parse({ funcao: { rotina: { esporte: 'volei', esporteProblemas: [] } } })
  equal(q.funcao?.rotina?.esporteProblemas, undefined)
})

test('REQ-44: schema limita esporteOutro a 80 caracteres', () => {
  const mk = (n: number) => ({ funcao: { rotina: { esporte: 'outro', esporteOutro: 'a'.repeat(n) } } })
  equal(evaluationFichaSchema.safeParse(mk(81)).success, false)
  equal(evaluationFichaSchema.safeParse(mk(80)).success, true)
})

test('vários esportes: lista tolerante, sem repetidos, problemas só do próprio esporte', () => {
  const lista = safeEsportesLista([
    { esporte: 'volei', problemas: ['naoExiste'] },
    { esporte: 'volei' },
    { esporte: 'xadrez' },
    { esporte: 'outro', outro: 'Remo' },
    null,
  ])
  equal(lista.length, 2)
  equal(lista[0]?.esporte, 'volei')
  equal(lista[0]?.problemas, undefined)
  equal(lista[1]?.outro, 'Remo')
  const muitos = safeEsportesLista(['volei', 'futebol', 'corrida', 'basquete', 'natacao', 'ski', 'snowboard'].map((esporte) => ({ esporte })))
  equal(muitos.length, 7, 'sem limite de esportes')
  ok(ESPORTES_MAX > ESPORTES.length, 'cabe o catálogo inteiro + Outro')
})

test('vários esportes: avaliação antiga (um esporte em rotina) vira lista', () => {
  const lista = esportesDaFuncao({ rotina: { esporte: 'ski', esporteProblemas: ['lcaSki', 'xx'] } })
  equal(lista.length, 1)
  equal(lista[0]?.problemas?.join(','), 'lcaSki')
  equal(esportesDaFuncao({ esportes: [{ esporte: 'snowboard' }], rotina: { esporte: 'ski' } })[0]?.esporte, 'snowboard')
  equal(esportesDaFuncao(undefined).length, 0)
})

test('vários esportes: resumo traz rótulo e problemas marcados de cada esporte', () => {
  const resumo = resumoEsportes({
    esportes: [
      { esporte: 'ski', problemas: ['lcaSki'] },
      { esporte: 'outro', outro: 'Remo' },
    ],
  })
  equal(resumo.length, 2)
  equal(resumo[0]?.label, 'Ski')
  equal(resumo[0]?.problemas[0]?.regiao, 'Joelho')
  equal(resumo[1]?.label, 'Remo')
  equal(resumo[1]?.problemas.length, 0)
})
