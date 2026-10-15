import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const FIELD = '../components/patients/evaluation/EsportesField.tsx'
const PAGE = '../components/patients/evaluation/EvaluationPage01.tsx'
const PAGE03 = '../components/patients/evaluation/EvaluationPage03.tsx'

test('REQ-44: bloco Esportes usa o catálogo e grava a lista em ficha.funcao.esportes', () => {
  const field = read(FIELD)
  for (const text of [
    "from '@/lib/esportesAvaliacao'",
    'esportesDaFuncao',
    'buscarEsportes',
    'problemasDoEsporte',
    'avaliarTexto',
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

test('REQ-44: Esportes é o bloco D da Anamnese (página 01), depois de História atual', () => {
  const page = read(PAGE)
  ok(page.includes('<FichaBlock letter="D" title="Esportes">'))
  ok(page.includes('<EsportesField'))
  ok(page.indexOf('title="História atual"') < page.indexOf('title="Esportes"'))
  ok(page.indexOf('title="Esportes"') < page.indexOf('title="Tratamentos e investigações anteriores"'))
  ok(page.includes('<FichaBlock letter="E" title="Tratamentos e investigações anteriores">'))
  ok(page.includes('<FichaBlock letter="F" title="Histórico pregresso resumido">'))
  ok(!read(PAGE03).includes('EsportesField'), 'página 03 não tem mais esportes')
})
