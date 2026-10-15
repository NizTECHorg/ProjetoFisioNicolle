import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { evaluationFichaSchema, emptyEvaluationFicha } from '../schemas/evaluationFicha.schema.ts'
import {
  AVALIACAO_IA_ALLOWLIST,
  buildAiEvaluationFicha,
  normalizeForMatch,
  summaryWithinSource,
  verifyAvaliacaoItems,
  type AvaliacaoIaBlock,
} from './avaliacaoIa.ts'

const R = (text: string, id = 'RESUMO.summary'): AvaliacaoIaBlock[] => [{ id, text }]
const one = (path: string, evidence: string, value: unknown, blocks: AvaliacaoIaBlock[]) =>
  verifyAvaliacaoItems([{ path, value, evidence }], blocks)

test('REQ-45: normalizeForMatch remove acento, caixa, pontuação e reticências', () => {
  equal(normalizeForMatch('Dor no Joelho DIREITO…  (há 3 meses)!'), 'dor no joelho direito ha 3 meses')
  equal(normalizeForMatch('“aspas” — travessão'), 'aspas travessao')
})

test('REQ-45: path fora da allowlist e caixinhas de doença são descartados', () => {
  const b = R('Paciente com diabetes e EVA 7 agora')
  for (const path of ['campo.inexistente', 'anamnese.historicoPregresso.diabetes', 'sintomas.intensidade.agora']) {
    const r = one(path, 'diabetes', true, b)
    equal(r.items.length, 0)
    equal(r.droppedCount, 1)
  }
  ok(!('sintomas.intensidade.agora' in AVALIACAO_IA_ALLOWLIST))
})

test('REQ-45: evidência inexistente, em bloco não permitido, costurada ou curta é descartada', () => {
  equal(one('sintomas.piora.detalhe', 'piora ao correr', 'x', R('Melhora ao repousar')).items.length, 0)
  equal(
    one('sintomas.piora.detalhe', 'piora ao correr', 'x', [{ id: 'ALERTA.1', text: 'Piora ao correr' }]).items.length,
    0,
  )
  const two = [
    { id: 'RESUMO.summary', text: 'Piora ao subir' },
    { id: 'RESUMO.evolution', text: 'escadas com dor' },
  ]
  equal(one('sintomas.piora.detalhe', 'piora ao subir escadas com dor', 'x', two).items.length, 0)
  equal(one('sintomas.piora.detalhe', 'piora', 'x', R('Piora ao subir')).items.length, 0)
})

test('REQ-45: mesmo path duas vezes, primeiro vence', () => {
  const b = R('Piora ao subir escadas. Piora ao correr')
  const r = verifyAvaliacaoItems(
    [
      { path: 'sintomas.piora.detalhe', value: 'a', evidence: 'Piora ao subir escadas' },
      { path: 'sintomas.piora.detalhe', value: 'b', evidence: 'Piora ao correr' },
    ],
    b,
  )
  equal(r.items.length, 1)
  equal(r.items[0]?.value, 'Piora ao subir escadas')
  equal(r.droppedCount, 1)
})

test('REQ-45: tipo T grava a evidência, ignora value, respeita max e pattern', () => {
  const b = R('Piora ao subir escadas')
  const r = one('sintomas.piora.detalhe', 'Piora ao subir escadas', 'texto inventado', b)
  deepEqual(r.items, [{ path: 'sintomas.piora.detalhe', value: 'Piora ao subir escadas', evidence: 'Piora ao subir escadas' }])
  const longo = 'dor lombar constante ' + 'x'.repeat(250)
  equal(one('anamnese.queixa.haQuantoTempo', longo, 'x', R(longo, 'CADASTRO.queixa')).items.length, 0)
  equal(one('anamnese.queixa.haQuantoTempo', 'dor lombar constante', 'x', R('dor lombar constante')).items.length, 0)
  equal(one('anamnese.queixa.haQuantoTempo', 'dor há 3 meses', 'x', R('Sente dor há 3 meses')).items.length, 1)
})

test('REQ-45: T com negação no bloco antes do trecho é descartado', () => {
  equal(
    one('sintomas.piora.detalhe', 'piora ao subir escadas', 'x', R('Paciente não piora ao subir escadas')).items.length,
    0,
  )
  equal(
    one(
      'anamnese.historicoPregresso.observacoes',
      'diabetes tipo 2 e cirurgias prévias',
      'x',
      R('nega diabetes tipo 2 e cirurgias prévias'),
    ).items.length,
    0,
  )
  equal(one('sintomas.piora.detalhe', 'Piora ao subir escadas', 'x', R('Piora ao subir escadas')).items.length, 1)
})

test('REQ-45: limitacaoFuncional não repete a mesma evidência em dois itens', () => {
  const b = R('Tem dificuldade para sentar')
  const r = verifyAvaliacaoItems(
    [
      { path: 'funcao.limitacaoFuncional.item1', value: 'x', evidence: 'dificuldade para sentar' },
      { path: 'funcao.limitacaoFuncional.item2', value: 'x', evidence: 'dificuldade para sentar' },
    ],
    b,
  )
  deepEqual(r.items.map((i) => i.path), ['funcao.limitacaoFuncional.item1'])
})

test('REQ-45: tipo B exige true e palavra-chave sem negação', () => {
  const b = R('Dor no joelho direito')
  equal(one('anamnese.queixa.lado.direito', 'dor no joelho direito', true, b).items[0]?.value, true)
  equal(one('anamnese.queixa.lado.direito', 'dor no joelho direito', 'true', b).items.length, 0)
  equal(one('anamnese.queixa.lado.direito', 'dor no joelho direito', false, b).items.length, 0)
  for (const t of ['nega dor no lado direito', 'sem dor do lado direito', 'não apresenta dor à direita']) {
    equal(one('anamnese.queixa.lado.direito', t, true, R(t)).items.length, 0, t)
  }
})

test('REQ-45: negação no BLOCO fora da evidência derruba B', () => {
  equal(one('anamnese.queixa.lado.direito', 'lado direito', true, R('Paciente sem dor do lado direito')).items.length, 0)
  equal(one('anamnese.queixa.lado.esquerdo', 'dor à esquerda', true, R('nega dor à esquerda')).items.length, 0)
  equal(one('anamnese.queixa.lado.direito', 'joelho direito', true, R('Dor no joelho direito')).items.length, 1)
  equal(
    one('anamnese.queixa.lado.direito', 'dor no joelho direito', true, R('Sem febre. Dor no joelho direito há 3 meses'))
      .items.length,
    1,
  )
})

test('REQ-45: tipo N confere número, faixa, passo e contexto', () => {
  const b = R('Relata EVA 7 no pior momento')
  equal(one('sintomas.intensidade.pior', 'EVA 7 no pior momento', 7, b).items[0]?.value, 7)
  equal(one('sintomas.intensidade.pior', 'EVA 7 no pior momento', 8, b).items.length, 0)
  equal(one('sintomas.intensidade.pior', 'EVA 7 no pior momento', 11, b).items.length, 0)
  equal(one('sintomas.intensidade.pior', 'EVA 7 no pior momento', -1, b).items.length, 0)
  const b2 = R('EVA 7,5 no pior momento')
  equal(one('sintomas.intensidade.pior', 'EVA 7,5 no pior momento', 7.5, b2).items[0]?.value, 7.5)
  equal(one('sintomas.intensidade.pior', 'EVA 7,5 no pior momento', 7, b2).items.length, 0)
  equal(one('sintomas.intensidade.pior', 'EVA 7 ao caminhar', 7, R('EVA 7 ao caminhar')).items.length, 0)
})

test('REQ-45: tipo N com negação no bloco é descartado', () => {
  equal(
    one('sintomas.intensidade.pior', 'EVA 7 no pior momento', 7, R('não chegou a EVA 7 no pior momento')).items.length,
    0,
  )
})

test('REQ-45: entrada inválida e excesso de itens não quebram', () => {
  deepEqual(verifyAvaliacaoItems('lixo', R('x')), { items: [], droppedCount: 0 })
  const r = verifyAvaliacaoItems([null, { path: 1, evidence: 'x' }, 'a'], R('x'))
  equal(r.droppedCount, 3)
  const b = R('Piora ao subir escadas')
  const many = Array.from({ length: 65 }, () => ({ path: 'nada', value: 1, evidence: 'Piora ao subir escadas' }))
  const m = verifyAvaliacaoItems({ items: many }, b)
  equal(m.items.length, 0)
  equal(m.droppedCount, 65)
})

test('REQ-45: summaryWithinSource impede palavra nova, troca de nível e negação nova', () => {
  const src = 'Hérnia discal L4 com dor irradiada para a perna direita há meses'
  equal(summaryWithinSource('Hérnia discal L4 com dor irradiada', src), true)
  equal(summaryWithinSource('Hérnia discal L4 com cirurgia', src), false)
  equal(summaryWithinSource('Hérnia discal L5', src), false)
  equal(summaryWithinSource('Hérnia discal sem dor irradiada', src), false)
  equal(summaryWithinSource('', src), false)
  equal(summaryWithinSource(src + ' extra', src), false)
  equal(summaryWithinSource('a'.repeat(4001), 'a'.repeat(5000)), false)
})

test('REQ-45: builder sem itens e sem dados gera ficha válida com título', () => {
  const { ficha, notes } = buildAiEvaluationFicha(emptyEvaluationFicha(), {}, { items: [] })
  equal(ficha.titulo, 'Avaliação gerada por IA')
  deepEqual(notes, [])
  ok(evaluationFichaSchema.safeParse(ficha).success)
})

test('REQ-45: builder copia cadastro, metas, EVA e fisioterapeuta', () => {
  const { ficha, notes } = buildAiEvaluationFicha(
    emptyEvaluationFicha(),
    {
      complaint: 'Dor lombar ao sentar',
      diagnosis: 'Lombalgia',
      goals: [{ title: 'Voltar a correr' }, { title: 'Dormir sem dor' }],
      painSeries: [
        { date: '2026-09-01', value: 6 },
        { date: '2026-10-01', value: 4 },
      ],
      therapistName: 'Nicolle',
    },
    { items: [] },
  )
  equal(ficha.anamnese.queixa.oQueTrouxe, 'Dor lombar ao sentar')
  equal(ficha.avaliacaoPlano.sintese.diagnosticoFisio, 'Lombalgia')
  equal(ficha.funcao.expectativas.boaMelhora, 'Voltar a correr; Dormir sem dor')
  equal(ficha.sintomas.intensidade.agora, 4)
  ok(notes.includes('EVA agora: último registro de 01/10/2026.'))
  equal(ficha.avaliacaoPlano.profissional.fisioterapeuta, 'Nicolle')
})

test('REQ-45: complaint "—" fica vazio; diagnóstico longo usa resumo ou fica vazio', () => {
  const vazio = buildAiEvaluationFicha(emptyEvaluationFicha(), { complaint: '—' }, { items: [] })
  equal(vazio.ficha.anamnese.queixa.oQueTrouxe, undefined)
  const longo = 'a'.repeat(4001)
  const sem = buildAiEvaluationFicha(emptyEvaluationFicha(), { diagnosis: longo }, { items: [] })
  equal(sem.ficha.avaliacaoPlano.sintese.diagnosticoFisio, undefined)
  const com = buildAiEvaluationFicha(
    emptyEvaluationFicha(),
    { diagnosis: longo },
    { items: [], diagnosticoResumido: 'Resumo curto' },
  )
  equal(com.ficha.avaliacaoPlano.sintese.diagnosticoFisio, 'Resumo curto')
  ok(com.notes.includes('Diagnóstico resumido do cadastro: o texto original é maior que o campo.'))
})

test('REQ-45: builder não sobrescreve cadastro, aplica item válido e ignora inválidos', () => {
  const base = emptyEvaluationFicha()
  base.anamnese.identificacao.nomeCompleto = 'Maria'
  const { ficha } = buildAiEvaluationFicha(
    base,
    { complaint: 'Queixa do cadastro' },
    {
      items: [
        { path: 'anamnese.queixa.oQueTrouxe', value: 'da IA', evidence: 'da IA' },
        { path: 'anamnese.queixa.regiao', value: 'Joelho direito', evidence: 'Joelho direito' },
        { path: 'anamnese.queixa.lado.direito', value: 'sim', evidence: 'direito' },
        { path: 'anamnese.historicoPregresso.diabetes', value: true, evidence: 'diabetes' },
        { path: 'sintomas.piora.detalhe', value: 'x'.repeat(2001), evidence: 'x' },
      ],
    },
  )
  equal(ficha.anamnese.queixa.oQueTrouxe, 'Queixa do cadastro')
  equal(ficha.anamnese.queixa.regiao, 'Joelho direito')
  equal(ficha.anamnese.identificacao.nomeCompleto, 'Maria')
  ok(!ficha.anamnese.queixa.lado?.direito)
  ok(evaluationFichaSchema.safeParse(ficha).success)
})

test('REQ-45: áreas de foco ativas viram marcas de Dor no mapa corporal', () => {
  const { ficha, notes } = buildAiEvaluationFicha(
    emptyEvaluationFicha(),
    {
      focusAreas: [
        { regionKey: 'front.neck', isActive: true },
        { regionKey: 'front.neck', isActive: true },
        { regionKey: 'front.head', isActive: false },
        { regionKey: 'regiao.inexistente', isActive: true },
      ],
    },
    { items: [] },
  )
  deepEqual(ficha.sintomas.mapa.marks, [{ regionKey: 'front.neck', symbol: 'X' }])
  ok(notes.includes('Mapa corporal: áreas de foco do cadastro marcadas como Dor.'))
})
