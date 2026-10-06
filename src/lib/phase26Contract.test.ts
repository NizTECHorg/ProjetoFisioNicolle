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
  equal(/wrapLines\([\s\S]*?''/.test(table), false)
  equal(/wrapLines\([\s\S]*?""/.test(table), false)

  const winAnsi = sliceFunction(service, 'toWinAnsiSafe')
  equal(winAnsi.includes("replaceAll('→'"), false)
  equal(winAnsi.includes('replaceAll("→"'), false)
  equal(service.includes(".replaceAll('→', '->')"), true)
  equal(service.includes('function drawGeral'), true)
  equal(service.includes('function drawSessao'), true)
})
