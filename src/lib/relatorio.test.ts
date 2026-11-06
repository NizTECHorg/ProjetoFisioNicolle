import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import {
  RELATORIO_LINHAS_MAX,
  ajustarAoLimite,
  contarLinhasRelatorio,
  dataPorExtenso,
  linhasRelatorio,
  normalizarTextoRelatorio,
  numerosNaoConfirmados,
  rotuloSessoesRelatorio,
  sessaoSelecionavelRelatorio,
  textosFonteRelatorio,
} from './relatorio.ts'

const falso = { widthOfTextAtSize: (t: string, s: number) => t.length * s * 0.5 }

async function helvetica() {
  const doc = await PDFDocument.create()
  return doc.embedFont(StandardFonts.Helvetica)
}

function evo(over: Record<string, string | null> = {}, finalizedAt: string | null = '2026-10-01') {
  return {
    id: 'e',
    patientState: '',
    changesSinceLast: null,
    conducts: '',
    treatmentResponse: null,
    sideEffects: null,
    incidents: null,
    nextPlan: null,
    finalizedAt,
    createdAt: '2026-10-01',
    createdByName: null,
    ...over,
  }
}

test('contagem: vazio é 0 e linha em branco conta', () => {
  equal(contarLinhasRelatorio(falso, ''), 0)
  equal(contarLinhasRelatorio(falso, '   \n '), 0)
  equal(contarLinhasRelatorio(falso, 'a\n\nb'), 3)
})

test('contagem e linhas coincidem com a Helvetica real', async () => {
  const font = await helvetica()
  const texto = 'Paciente evoluiu bem. '.repeat(40) + '\n\nSegundo parágrafo com acentuação.'
  const linhas = linhasRelatorio(font, texto)
  equal(contarLinhasRelatorio(font, texto), linhas.length)
  ok(linhas.length > 3)
})

test('normalizar preserva quebras e limpa controles', () => {
  equal(normalizarTextoRelatorio('a\r\nb\u0000\u0007  \n\n\n\nc \t'), 'a\nb\n\nc')
  equal(normalizarTextoRelatorio('  x\ty  '), 'x\ty')
})

test('ajustarAoLimite: já cabe', () => {
  const r = ajustarAoLimite(falso, 'Texto curto.')
  deepEqual(r, { texto: 'Texto curto.', reduzido: false })
})

test('ajustarAoLimite: frases cortam no ponto', async () => {
  const font = await helvetica()
  const texto = Array.from({ length: 40 }, (_, i) => `Frase número ${i} do relatório clínico.`).join(' ')
  const r = ajustarAoLimite(font, texto)
  ok(r.reduzido)
  ok(r.texto.endsWith('.'))
  ok(contarLinhasRelatorio(font, r.texto) <= RELATORIO_LINHAS_MAX)
})

test('ajustarAoLimite: sem ponto corta em palavra', () => {
  const texto = Array.from({ length: 400 }, () => 'palavra').join(' ')
  const r = ajustarAoLimite(falso, texto)
  ok(r.reduzido)
  ok(contarLinhasRelatorio(falso, r.texto) <= RELATORIO_LINHAS_MAX)
  ok(r.texto.endsWith('palavra'))
})

test('sessaoSelecionavelRelatorio', () => {
  deepEqual(
    sessaoSelecionavelRelatorio({ status: 'realizada', evolution: evo({ conducts: 'x' }) }),
    { selecionavel: true, rascunho: false },
  )
  deepEqual(
    sessaoSelecionavelRelatorio({ status: 'realizada', evolution: evo({ conducts: 'x' }, null) }),
    { selecionavel: true, rascunho: true },
  )
  equal(sessaoSelecionavelRelatorio({ status: 'realizada', evolution: null }).selecionavel, false)
  equal(sessaoSelecionavelRelatorio({ status: 'agendada', evolution: null }).selecionavel, false)
  equal(
    sessaoSelecionavelRelatorio({ status: 'realizada', evolution: evo({ conducts: '  ' }) }).selecionavel,
    false,
  )
})

test('rotuloSessoesRelatorio', () => {
  equal(
    rotuloSessoesRelatorio([{ scheduledAt: '2026-10-01T10:00', dateLabel: '01/10/2026' }]),
    '1 sessão · 01/10/2026',
  )
  equal(
    rotuloSessoesRelatorio([
      { scheduledAt: '2026-10-15T10:00', dateLabel: '15/10/2026' },
      { scheduledAt: '2026-10-01T10:00', dateLabel: '01/10/2026' },
      { scheduledAt: '2026-10-08T10:00', dateLabel: '08/10/2026' },
    ]),
    '3 sessões · 01/10/2026–15/10/2026',
  )
})

test('numerosNaoConfirmados', () => {
  deepEqual(numerosNaoConfirmados('EVA 7,5', ['EVA 7.5']), [])
  deepEqual(numerosNaoConfirmados('EVA 9 e depois 9', ['EVA 7']), ['9'])
})

test('textosFonteRelatorio inclui data e os campos, com sideEffects', () => {
  const textos = textosFonteRelatorio([
    {
      dateLabel: '01/10/2026',
      evolution: evo({ patientState: 'bem', sideEffects: 'tontura', nextPlan: 'alongar' }),
    },
  ])
  deepEqual(textos, ['01/10/2026', 'bem', 'tontura', 'alongar'])
})

test('dataPorExtenso', () => {
  ok(dataPorExtenso('2026-11-05T12:00:00Z').includes('novembro de 2026'))
  equal(dataPorExtenso('xx'), '')
})
