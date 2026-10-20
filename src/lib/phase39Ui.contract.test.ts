import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const PAGE01 = '../components/patients/evaluation/EvaluationPage01.tsx'
const PAGE03 = '../components/patients/evaluation/EvaluationPage03.tsx'

test('REQ-50 (6.6): Page01 tem a pergunta de atividade física no bloco D com os campos', () => {
  const page = read(PAGE01)
  for (const text of [
    'Pratica atividade física?',
    'ficha.funcao.rotina.praticaAtividadeFisica',
    'ficha.funcao.rotina.atividadeQual',
    'ficha.funcao.rotina.atividadeFrequencia',
    'ficha.funcao.rotina.atividadeHorasDia',
    'ficha.funcao.rotina.atividadeQualFreq',
    'formatAtividadeFisica',
    'ATIVIDADE_FREQUENCIA_OPTIONS',
    'shouldDirty: true',
    'EsportesField',
  ]) {
    ok(page.includes(text), `falta: ${text}`)
  }
})

test('REQ-50 (6.6): pergunta fica dentro do bloco D, acima das modalidades', () => {
  const page = read(PAGE01)
  const bloco = page.indexOf('title="Esportes"')
  const pergunta = page.indexOf('Pratica atividade física?')
  const campo = page.indexOf('<EsportesField')
  ok(bloco >= 0 && pergunta > bloco && pergunta < campo, 'ordem incorreta')
})

test('REQ-50 (6.6): EsportesField não depende da resposta', () => {
  const page = read(PAGE01)
  ok(!/praticaAtividadeFisica === 'sim' \? \(\s*<EsportesField/.test(page))
  const antes = page.slice(page.indexOf('title="Esportes"'), page.indexOf('<EsportesField'))
  ok(!/\?\s*\(\s*$/.test(antes.trimEnd()) || antes.includes(') : null}'), 'EsportesField condicionado')
})

test('REQ-50 (6.6): Page03 não pergunta mais atividade física', () => {
  const page = read(PAGE03)
  for (const text of [
    'Pratica atividade física?',
    'ficha.funcao.rotina.praticaAtividadeFisica',
    'ficha.funcao.rotina.atividadeQual"',
    'ATIVIDADE_FREQUENCIA_OPTIONS',
    'EsportesField',
  ]) {
    ok(!page.includes(text), `não deveria ter: ${text}`)
  }
  ok(page.includes('ficha.funcao.rotina.horasDia'))
  ok(page.includes('Rotina e demanda'))
})

test('REQ-50 (6.6): PDF/detalhe/seletor mostram atividade física junto de Esportes', () => {
  const pdf = read('../services/patientAiPdf.service.ts')
  const catalog = read('./pdfFieldCatalog.ts')
  const detail = read('../components/patients/evaluation/EvaluationFichaDetail.tsx')

  const ocorrencias = pdf.split('Pratica atividade física').length - 1
  ok(ocorrencias === 1, `PDF deve ter 1 ocorrência, tem ${ocorrencias}`)
  const pos = pdf.indexOf('Pratica atividade física')
  ok(pos > pdf.indexOf("'01.D'") && pos < pdf.indexOf('show03C'))

  ok(detail.includes('Pratica atividade física'))
  ok(detail.indexOf('label="Atividade física"') > 0)
  ok(detail.indexOf('label="Atividade física"') < detail.indexOf('03 ·'))

  const first = catalog.indexOf('praticaAtividadeFisica')
  ok(first > catalog.indexOf("id: '01.D'"))
  ok(catalog.lastIndexOf('praticaAtividadeFisica') < catalog.indexOf("id: '03.C'"))
})
