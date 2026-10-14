import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const FIELD = '../components/patients/evaluation/EsportesField.tsx'
const PAGE = '../components/patients/evaluation/EvaluationPage03.tsx'

test('REQ-44: bloco Esportes usa o catálogo e grava a lista em ficha.funcao.esportes', () => {
  const field = read(FIELD)
  for (const text of [
    "from '@/lib/esportesAvaliacao'",
    'esportesDaFuncao',
    'buscarEsportes',
    'problemasDoEsporte',
    'avaliarTexto',
    'ESPORTES_MAX',
    "'ficha.funcao.esportes'",
    'shouldDirty: true',
    'aria-pressed',
    'min-h-11',
    'Problemas frequentes no',
    'Não é diagnóstico.',
    'Avaliar:',
    'Outro',
    'ConfirmDialog',
  ]) {
    ok(field.includes(text), `falta: ${text}`)
  }
  ok(!/register\([^)]*esportes/.test(field), 'a lista não pode usar register')
})

test('REQ-44: Esportes é um bloco próprio (G) na página 03, fora de Rotina e demanda', () => {
  const page = read(PAGE)
  ok(page.includes('<FichaBlock letter="G" title="Esportes">'))
  ok(page.includes('<EsportesField'))
  const rotina = page.indexOf('title="Rotina e demanda"')
  const fimRotina = page.indexOf('</FichaBlock>', rotina)
  ok(!page.slice(rotina, fimRotina).includes('EsportesField'), 'esporte não pode ficar dentro do bloco C')
  ok(!page.includes('EsporteProblemasField'))
})
