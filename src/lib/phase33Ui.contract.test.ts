import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))
const FIELD = '../components/patients/evaluation/EsporteProblemasField.tsx'
const PAGE = '../components/patients/evaluation/EvaluationPage03.tsx'

function readField(): string {
  ok(existsSync(path(FIELD)), 'EsporteProblemasField.tsx ainda nao existe')
  return readFileSync(path(FIELD), 'utf8')
}

const page = readFileSync(path(PAGE), 'utf8')

test('REQ-44: campo usa o catalogo e helpers', () => {
  const field = readField()
  ok(field.includes("from '@/lib/esportesAvaliacao'"))
  for (const text of ['buscarEsportes', 'problemasDoEsporte', 'avaliarTexto', 'ESPORTE_OUTRO']) {
    ok(field.includes(text), `falta: ${text}`)
  }
})

test('REQ-44: campo tem a UI esperada', () => {
  const field = readField()
  for (const text of [
    'aria-pressed',
    'type="button"',
    'min-h-11',
    'Problemas frequentes no',
    'Problemas frequentes para orientar a avaliação. Não é diagnóstico.',
    'ConfirmDialog',
    'Avaliar:',
  ]) {
    ok(field.includes(text), `falta: ${text}`)
  }
})

test('REQ-44: campo grava via setValue e nao via register no array', () => {
  const field = readField()
  for (const text of [
    'shouldDirty: true',
    'ficha.funcao.rotina.esporteProblemas',
    'ficha.funcao.rotina.esporteOutro',
  ]) {
    ok(field.includes(text), `falta: ${text}`)
  }
  ok(!/register\([^)]*esporteProblemas/.test(field), 'esporteProblemas nao pode usar register')
})

test('REQ-44: pagina 03 monta o campo so com sim, entre o radio e Qual / frequencia', () => {
  const at = page.indexOf('<EsporteProblemasField')
  ok(at >= 0, 'falta <EsporteProblemasField')
  ok(page.indexOf('Pratica atividade física?') < at)
  ok(at < page.indexOf('Qual / frequência'))
  const cond = page.lastIndexOf("=== 'sim'", at)
  ok(cond >= 0, "falta condicao === 'sim'")
  ok(!page.slice(cond, at).includes('</FichaBlock>'))
})

test('REQ-44: marcar Nao nao apaga dados do esporte', () => {
  ok(!page.includes("setValue('ficha.funcao.rotina.esporte"))
})
