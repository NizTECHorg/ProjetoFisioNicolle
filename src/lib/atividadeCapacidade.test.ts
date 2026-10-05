import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { emptyEvaluationFicha, evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'
import {
  ATIVIDADES,
  formatLinha,
  formatMedida,
  formatMiolo,
  normalizeAtividadesAfetadas,
} from './atividadeCapacidade.ts'

test('REQ-35: formatMedida junta valor e rótulo', () => {
  equal(formatMedida('10', 'minutos'), '10 minutos')
  equal(formatMedida('3', 'km'), '3 km')
  equal(formatMedida('12', 'repeticoes'), '12 repetições')
  equal(formatMedida('10', undefined), '10')
  equal(formatMedida(undefined, 'km'), 'km')
  equal(formatMedida('', ''), '')
})

test('REQ-35: formatMedida não interpreta 10 min', () => {
  const texto = formatMedida('10 min', undefined)
  equal(texto, '10 min')
  equal(texto.includes('minutos'), false)
})

test('REQ-35: formatLinha junta valor e rótulo', () => {
  const atual = { valor: '10', unidade: 'minutos' as const }
  const antes = { valor: '40', unidade: 'minutos' as const }
  equal(formatMiolo(atual, antes), 'agora 10 minutos; antes 40 minutos')
  equal(formatMiolo(atual, undefined), 'agora 10 minutos')
  equal(formatMiolo(undefined, antes), 'antes 40 minutos')
  equal(formatMiolo(undefined, undefined), '')
  equal(formatLinha('Correr', atual, antes), 'Correr: agora 10 minutos; antes 40 minutos')
  equal(formatLinha('Correr', undefined, undefined), 'Correr')
})

test('REQ-35: lados independentes minutos e km', () => {
  equal(
    formatLinha('Correr', { valor: '10', unidade: 'minutos' }, { valor: '3', unidade: 'km' }),
    'Correr: agora 10 minutos; antes 3 km',
  )
})

test('REQ-35: catálogo tem 16 atividades sem rótulo duplicado', () => {
  equal(ATIVIDADES.length, 16)
  equal(ATIVIDADES[0]?.key, 'caminhar')
  equal(ATIVIDADES[0]?.label, 'Caminhar')
  equal(ATIVIDADES[15]?.key, 'outra')
  equal(ATIVIDADES[15]?.label, 'Outra')
  const rotulos = ATIVIDADES.map((item) => item.label)
  equal(new Set(rotulos).size, rotulos.length)
})

test('REQ-35: uma bool e capacidadeAtual viram capacidades dessa chave sem unidade', () => {
  const out = normalizeAtividadesAfetadas({
    correr: true,
    capacidadeAtual: '10',
  })
  equal(out.correr, true)
  equal(out.capacidades.correr?.atual?.unidade, undefined)
  deepEqual(out.capacidades.correr, { atual: { valor: '10' } })
  equal(out.textoLegado, undefined)

  const coerced = normalizeAtividadesAfetadas({
    caminhar: 'true',
    capacidadeAtual: '10',
  })
  equal(coerced.caminhar, true)
  deepEqual(coerced.capacidades.caminhar, { atual: { valor: '10' } })

  const junk = normalizeAtividadesAfetadas({
    caminhar: 'talvez',
    capacidadeAtual: '10',
  })
  equal(junk.caminhar, undefined)
  equal(junk.capacidades.caminhar, undefined)
  equal(junk.textoLegado, 'Capacidade atual: 10')
})

test('REQ-35: consigoPor sozinho vira atual; capacidadeAtual vence se for o único preenchido além do vazio', () => {
  const soConsigo = normalizeAtividadesAfetadas({
    caminhar: true,
    consigoPor: '5',
  })
  equal(soConsigo.capacidades.caminhar?.atual?.unidade, undefined)
  deepEqual(soConsigo.capacidades.caminhar, { atual: { valor: '5' } })
  equal(soConsigo.textoLegado, undefined)

  const soAtual = normalizeAtividadesAfetadas({
    caminhar: true,
    capacidadeAtual: '10',
    consigoPor: '   ',
  })
  deepEqual(soAtual.capacidades.caminhar, { atual: { valor: '10' } })
  equal(soAtual.textoLegado, undefined)

  const iguais = normalizeAtividadesAfetadas({
    caminhar: 'on',
    capacidadeAtual: ' 8 ',
    consigoPor: '8',
  })
  equal(iguais.caminhar, true)
  deepEqual(iguais.capacidades.caminhar, { atual: { valor: '8' } })
  equal(iguais.textoLegado, undefined)
})

test('REQ-35: capacidadeAtual e consigoPor diferentes não escolhem vencedor', () => {
  const out = normalizeAtividadesAfetadas({
    correr: true,
    capacidadeAtual: '10',
    consigoPor: '5',
    antesConseguiaPor: '40',
  })
  equal(out.capacidades.correr?.atual, undefined)
  deepEqual(out.capacidades.correr?.antes, { valor: '40' })
  equal(out.textoLegado, 'Capacidade atual: 10 · Consigo por: 5')
})

test('REQ-35: atividade Correr com várias bools atribui só a correr', () => {
  const out = normalizeAtividadesAfetadas({
    caminhar: true,
    correr: false,
    agachar: true,
    atividade: '  CORRER ',
    capacidadeAtual: '10',
    antesConseguiaPor: '40',
  })
  equal(out.correr, true)
  deepEqual(out.capacidades.correr, { atual: { valor: '10' }, antes: { valor: '40' } })
  equal(out.capacidades.caminhar, undefined)
  equal(out.capacidades.agachar, undefined)
  equal(out.textoLegado, undefined)

  const corrida = normalizeAtividadesAfetadas({
    caminhar: true,
    correr: true,
    atividade: 'corrida',
    capacidadeAtual: '10',
  })
  equal(corrida.capacidades.correr, undefined)
  equal(corrida.capacidades.caminhar, undefined)
  equal(corrida.textoLegado, 'Capacidade atual: 10 · Atividade: corrida')

  const parque = normalizeAtividadesAfetadas({
    caminhar: true,
    correr: true,
    atividade: 'correr no parque',
    capacidadeAtual: '10',
  })
  equal(parque.capacidades.correr, undefined)
  equal(parque.capacidades.caminhar, undefined)
  equal(parque.textoLegado, 'Capacidade atual: 10 · Atividade: correr no parque')

  const umaBool = normalizeAtividadesAfetadas({
    correr: true,
    atividade: 'corrida',
    capacidadeAtual: '10',
  })
  deepEqual(umaBool.capacidades.correr, { atual: { valor: '10' } })
  equal(umaBool.textoLegado, 'Atividade: corrida')
})

test('REQ-35: várias bools sem match exato vão para textoLegado', () => {
  const out = normalizeAtividadesAfetadas({
    caminhar: true,
    correr: true,
    capacidadeAtual: '10',
  })
  equal(out.capacidades.caminhar, undefined)
  equal(out.capacidades.correr, undefined)
  equal(out.textoLegado, 'Capacidade atual: 10')

  const semBool = normalizeAtividadesAfetadas({
    atividade: 'natação',
    antesConseguiaPor: '40',
  })
  deepEqual(semBool.capacidades, {})
  equal(semBool.textoLegado, 'Atividade: natação · Antes conseguia por: 40')
})

test('REQ-35: forma nova ignora os quatro textos velhos', () => {
  const out = normalizeAtividadesAfetadas({
    correr: true,
    agachar: 1,
    capacidadeAtual: '99',
    atividade: 'Caminhar',
    consigoPor: '88',
    antesConseguiaPor: '77',
    textoLegado: 'Registro anterior: 4 km',
    capacidades: {
      correr: {
        atual: { valor: '10', unidade: 'minutos' },
        antes: { valor: '40', unidade: 'km' },
      },
      agachar: { atual: { valor: '8', unidade: 'repeticoes' } },
      inventada: { atual: { valor: '1', unidade: 'minutos' } },
    },
  })
  equal(out.correr, true)
  equal(out.agachar, true)
  equal(out.caminhar, undefined)
  deepEqual(out.capacidades.correr, {
    atual: { valor: '10', unidade: 'minutos' },
    antes: { valor: '40', unidade: 'km' },
  })
  deepEqual(out.capacidades.agachar, { atual: { valor: '8', unidade: 'repeticoes' } })
  equal('inventada' in out.capacidades, false)
  equal(out.capacidades.caminhar, undefined)
  equal(out.textoLegado, 'Registro anterior: 4 km')

  const lista = normalizeAtividadesAfetadas({
    correr: true,
    capacidades: ['10'],
    capacidadeAtual: '10',
  })
  deepEqual(lista.capacidades.correr, { atual: { valor: '10' } })
})

test('REQ-35: capacidade órfã com bool falsa sai do mapa', () => {
  const out = normalizeAtividadesAfetadas({
    correr: 'false',
    caminhar: '1',
    dormir: 'maybe',
    capacidades: {
      correr: { atual: { valor: '10', unidade: 'minutos' } },
      caminhar: { atual: { valor: '3', unidade: 'km' } },
      dormir: { atual: { valor: '1', unidade: 'minutos' } },
    },
  })
  equal(out.correr, false)
  equal(out.caminhar, true)
  equal(out.dormir, undefined)
  equal(out.capacidades.correr, undefined)
  deepEqual(out.capacidades.caminhar, { atual: { valor: '3', unidade: 'km' } })
  equal(out.capacidades.dormir, undefined)

  const vazio = normalizeAtividadesAfetadas({
    correr: true,
    capacidades: { correr: { atual: { valor: '   ', unidade: 'min' }, antes: {} } },
  })
  equal(vazio.capacidades.correr, undefined)
})

test('REQ-35: unidade fora do enum não vira unidade', () => {
  const out = normalizeAtividadesAfetadas({
    correr: true,
    capacidades: {
      correr: {
        atual: { valor: '10', unidade: 'min' },
        antes: { valor: '2km', unidade: 'livre' },
      },
    },
  })
  equal(out.capacidades.correr?.atual?.unidade, undefined)
  equal(out.capacidades.correr?.antes?.unidade, undefined)
  deepEqual(out.capacidades.correr, { atual: { valor: '10' }, antes: { valor: '2km' } })

  deepEqual(normalizeAtividadesAfetadas(null), { capacidades: {} })
  deepEqual(normalizeAtividadesAfetadas(['correr']), { capacidades: {} })
  deepEqual(normalizeAtividadesAfetadas('10 min'), { capacidades: {} })
})

test('REQ-35: valor, textoLegado e outraDetalhe respeitam o teto', () => {
  const atual = 'a'.repeat(250)
  const outra = 'b'.repeat(500)
  const cortado = normalizeAtividadesAfetadas({
    caminhar: true,
    capacidadeAtual: atual,
    outraDetalhe: `  ${outra}  `,
  })
  equal(cortado.capacidades.caminhar?.atual?.valor?.length, 200)
  equal(cortado.capacidades.caminhar?.atual?.valor, 'a'.repeat(200))
  equal(cortado.outraDetalhe?.length, 400)
  equal(normalizeAtividadesAfetadas({ outraDetalhe: '   ' }).outraDetalhe, undefined)

  const legado = normalizeAtividadesAfetadas({
    caminhar: true,
    correr: true,
    capacidadeAtual: 'c'.repeat(500),
    consigoPor: 'd'.repeat(500),
    atividade: 'e'.repeat(500),
    antesConseguiaPor: 'f'.repeat(500),
  })
  equal(legado.capacidades.caminhar, undefined)
  equal(legado.capacidades.correr, undefined)
  equal(legado.textoLegado?.length, 1200)
})

test('REQ-35: anamnese sobrevive ao parse de um bloco B legado', () => {
  const parsed = evaluationFichaSchema.parse({
    anamnese: { queixa: { oQueTrouxe: 'dor no joelho ao correr' } },
    funcao: {
      atividadesAfetadas: {
        caminhar: true,
        capacidadeAtual: '10',
      },
    },
  })
  equal(parsed.anamnese?.queixa?.oQueTrouxe, 'dor no joelho ao correr')
  equal(parsed.funcao?.atividadesAfetadas?.caminhar, true)
  equal(parsed.funcao?.atividadesAfetadas?.capacidades?.caminhar?.atual?.unidade, undefined)
  deepEqual(parsed.funcao?.atividadesAfetadas?.capacidades?.caminhar, { atual: { valor: '10' } })
})

test('REQ-35: parse não devolve os quatro textos velhos', () => {
  const parsed = evaluationFichaSchema.parse({
    funcao: {
      atividadesAfetadas: {
        correr: true,
        capacidadeAtual: '10',
        atividade: 'Correr',
        consigoPor: '5',
        antesConseguiaPor: '40',
      },
    },
  })
  const bloco = parsed.funcao?.atividadesAfetadas ?? {}
  equal('capacidadeAtual' in bloco, false)
  equal('atividade' in bloco, false)
  equal('consigoPor' in bloco, false)
  equal('antesConseguiaPor' in bloco, false)
})

test('REQ-35: capacidade órfã com bool falsa sai do parse', () => {
  const parsed = evaluationFichaSchema.parse({
    funcao: {
      atividadesAfetadas: {
        correr: false,
        caminhar: true,
        capacidades: {
          correr: { atual: { valor: '10', unidade: 'minutos' } },
          caminhar: { atual: { valor: '3', unidade: 'km' } },
        },
      },
    },
  })
  const bloco = parsed.funcao?.atividadesAfetadas
  equal(bloco?.correr, false)
  equal(bloco?.caminhar, true)
  equal('capacidades' in (bloco ?? {}), true)
  equal(bloco?.capacidades?.correr, undefined)
  deepEqual(bloco?.capacidades?.caminhar, { atual: { valor: '3', unidade: 'km' } })
})

test('REQ-35: unidade fora do enum não quebra a ficha e não vira unidade', () => {
  const parsed = evaluationFichaSchema.parse({
    anamnese: { queixa: { oQueTrouxe: 'dor' } },
    funcao: {
      atividadesAfetadas: {
        correr: true,
        capacidades: {
          correr: {
            atual: { valor: '10', unidade: 'min' },
            antes: { valor: '2km', unidade: 'livre' },
          },
        },
      },
    },
  })
  equal(parsed.anamnese?.queixa?.oQueTrouxe, 'dor')
  const correr = parsed.funcao?.atividadesAfetadas?.capacidades?.correr
  equal(correr?.atual?.unidade, undefined)
  equal(correr?.antes?.unidade, undefined)
  deepEqual(correr, { atual: { valor: '10' }, antes: { valor: '2km' } })
})

test('REQ-35: valor legado acima de 200 é cortado e a ficha parseia', () => {
  const queixa = 'dor lombar'
  const parsed = evaluationFichaSchema.parse({
    anamnese: { queixa: { oQueTrouxe: queixa } },
    funcao: {
      atividadesAfetadas: {
        caminhar: true,
        capacidadeAtual: 'a'.repeat(250),
      },
    },
  })
  equal(parsed.anamnese?.queixa?.oQueTrouxe, queixa)
  const valor = parsed.funcao?.atividadesAfetadas?.capacidades?.caminhar?.atual?.valor ?? ''
  equal(valor.length <= 200, true)
  equal(valor, 'a'.repeat(200))
})

test('REQ-35: parse({}) continua válido', () => {
  deepEqual(evaluationFichaSchema.parse({}), emptyEvaluationFicha())
})
