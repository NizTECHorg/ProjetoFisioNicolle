import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const servicePath = fileURLToPath(new URL('../services/patientAiPdf.service.ts', import.meta.url))

function sliceFunction(source: string, name: string): string {
  const start = source.indexOf(`function ${name}`)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const next = source.indexOf('\nfunction ', start + 1)
  return source.slice(start, next < 0 ? source.length : next)
}

test('REQ-37.1: avaliação e evolução não desenham cromo de bloco nem traço de célula vazia', () => {
  const service = readFileSync(servicePath, 'utf8')

  for (const name of ['drawAvaliacao', 'drawEvolucao'] as const) {
    const body = sliceFunction(service, name)
    equal(body.includes('drawPageBanner('), false, `${name} ainda chama drawPageBanner`)
    equal(body.includes('drawFichaBlockFrame('), false, `${name} ainda chama drawFichaBlockFrame`)
  }

  const table = sliceFunction(service, 'drawDataTable')
  equal(table.includes(": '—'"), false)
  equal(table.includes(': "—"'), false)
  equal(table.includes("wrapLines(ctx.font, ''"), false)
  equal(table.includes('wrapLines(ctx.font, ""'), false)
  equal(table.includes('? cells[i]! :'), false)

  const winAnsi = sliceFunction(service, 'toWinAnsiSafe')
  equal(winAnsi.includes("replaceAll('→'"), false)
  equal(winAnsi.includes('replaceAll("→"'), false)
  equal(service.includes(".replaceAll('→', '->')"), true)
  equal(service.includes('function drawGeral'), true)
  equal(service.includes('function drawSessao'), true)
})

test('REQ-37.1: cabeçalho e rodapé da ficha são claros', () => {
  const service = readFileSync(servicePath, 'utf8')
  const header = sliceFunction(service, 'drawHeaderBand')
  const fichaHeaderStart = header.indexOf("footerKind === 'ficha'")
  const fluxoBand = header.indexOf('opts.isFirstPage ? 92')
  equal(fichaHeaderStart >= 0 && fluxoBand > fichaHeaderStart, true)
  const fichaHeader = header.slice(fichaHeaderStart, fluxoBand)

  equal(fichaHeader.includes('const logoH = 32'), true)
  equal(fichaHeader.includes('const logoH = 18'), false)
  equal(fichaHeader.includes("'Avaliação'"), true)
  equal(fichaHeader.includes("'Evolução'"), true)
  equal(fichaHeader.includes('size: 20'), true)
  equal(fichaHeader.includes('width: 48'), true)
  equal(fichaHeader.includes('height: 4'), true)
  equal(fichaHeader.includes('COLORS.accent'), true)
  equal(fichaHeader.includes('size: 16'), true)
  equal(fichaHeader.includes('size: 14'), true)
  equal(fichaHeader.includes('COLORS.muted'), true)
  equal(fichaHeader.includes('(cont.)'), false)

  const footer = sliceFunction(service, 'drawFooter')
  const fichaFooterStart = footer.indexOf("footerKind === 'ficha'")
  const fluxoCaption = footer.indexOf('FLUXO · Documento clínico')
  equal(fichaFooterStart >= 0 && fluxoCaption > fichaFooterStart, true)
  const fichaFooter = footer.slice(fichaFooterStart, fluxoCaption)
  equal(fichaFooter.includes('Ficha de Anamnese e Evolução Musculoesquelética'), false)
  equal(fichaFooter.includes("'Fluxo'"), true)
  equal(fichaFooter.includes('pageIndex'), true)
  equal(footer.includes('FLUXO · Documento clínico'), true)
  equal(footer.includes('Pág.'), true)
})
