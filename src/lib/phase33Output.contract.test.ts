import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const DETAIL = '../components/patients/evaluation/EvaluationFichaDetail.tsx'
const PDF = '../services/patientAiPdf.service.ts'
const CATALOG = './pdfFieldCatalog.ts'

test('REQ-44: visualização mostra cada esporte com seus problemas via resumoEsportes', () => {
  const src = read(DETAIL)
  ok(src.includes('resumoEsportes(funcao)'))
  ok(src.includes('`Esporte · ${esporte.label}`'))
  ok(src.includes('`${p.nome} · ${p.regiao}`'))
  const s03 = src.indexOf('03 · Função')
  const iEsp = src.indexOf('Esporte · ')
  const s04 = src.indexOf('04 · Avaliação e plano')
  ok(s03 < iEsp && iEsp < s04)
})

test('REQ-44: PDF tem seção Esportes (03.G) com os problemas de cada esporte', () => {
  const src = read(PDF)
  ok(src.includes('resumoEsportes(funcao)'))
  ok(src.includes("isFieldSelected(selected, '03.G')"))
  ok(src.includes("drawClearSectionTitle(ctx, 'Esportes')"))
  ok(!/hasRotina =[\s\S]*?esporte/i.test(src.slice(src.indexOf('const hasRotina'), src.indexOf('const hasRotina') + 400)))
})

test('REQ-44: seletor de campos tem o bloco 03.G Esportes', () => {
  const src = read(CATALOG)
  ok(src.includes("id: '03.G'"))
  ok(src.includes('resumoEsportes(funcao)'))
})

test('REQ-44: saída nunca lê esporteProblemas direto', () => {
  for (const f of [DETAIL, PDF, CATALOG]) {
    ok(!/rotina\??\.esporteProblemas/.test(read(f)), `${f} lê esporteProblemas direto`)
  }
})
