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
