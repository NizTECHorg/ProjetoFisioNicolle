import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const DETAIL = '../components/patients/evaluation/EvaluationFichaDetail.tsx'
const PDF = '../services/patientAiPdf.service.ts'
const CATALOG = './pdfFieldCatalog.ts'

test('REQ-44: detail mostra esporte e problemas via resumoEsporte', () => {
  const src = read(DETAIL)
  ok(src.includes("from '@/lib/esportesAvaliacao'"))
  ok(src.includes('resumoEsporte(funcao?.rotina)'))
  ok(src.includes('label="Esporte"'))
  ok(src.includes('label="Problemas marcados"'))
  ok(src.includes('`${p.nome} · ${p.regiao}`'))
  ok(src.includes("join('\\n')"))
  const s03 = src.indexOf('03 · Função')
  const iEsp = src.indexOf('label="Esporte"')
  const s04 = src.indexOf('04 · Avaliação e plano')
  ok(s03 < iEsp && iEsp < s04)
})

test('REQ-44: PDF 03.C mostra esporte e problemas frequentes', () => {
  const src = read(PDF)
  ok(src.includes("from '@/lib/esportesAvaliacao'"))
  ok(src.includes("drawOptionalField(ctx, 'Esporte'"))
  ok(src.includes("drawOptionalBullets(ctx, 'Problemas frequentes marcados'"))
  ok(/hasRotina =[\s\S]*?esporteLabel/.test(src))
})

test('REQ-44: preview do seletor de campos inclui esporte', () => {
  const src = read(CATALOG)
  ok(src.includes("from '@/lib/esportesAvaliacao'"))
  ok(/hasRotina =[\s\S]*?esporteLabel/.test(src))
  ok(/previewFrom\(trabalhoItems\[0\][^)]*esporteLabel/.test(src))
})

test('REQ-44: saida so via resumoEsporte, nunca esporteProblemas direto', () => {
  for (const f of [DETAIL, PDF, CATALOG]) {
    ok(!/rotina\??\.esporteProblemas/.test(read(f)), `${f} le esporteProblemas direto`)
  }
})
