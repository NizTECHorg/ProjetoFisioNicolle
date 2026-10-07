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

const buttonPath = fileURLToPath(new URL('../components/ui/Button.tsx', import.meta.url))
const aiButtonPath = fileURLToPath(
  new URL('../components/ui/AiGeneratingButton.tsx', import.meta.url),
)
const cssPath = fileURLToPath(new URL('../index.css', import.meta.url))

test('REQ-37.2: Gerando fica fora do Button', () => {
  const button = readFileSync(buttonPath, 'utf8')
  const ai = readFileSync(aiButtonPath, 'utf8')
  const css = readFileSync(cssPath, 'utf8')

  equal(button.includes('Aguarde...'), true)
  equal(
    button.includes(
      'h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
    ),
    true,
  )
  equal(button.includes('Gerando'), false)
  equal(button.includes('ai-generating'), false)

  equal(ai.includes('Gerando'), true)
  equal(ai.includes('Star'), true)
  equal(ai.includes('aria-busy'), true)
  equal(ai.includes('ai-generating'), true)
  equal(ai.includes('rounded-2xl'), true)
  equal(ai.includes('px-6 py-3.5'), true)
  equal(ai.includes('bg-forest'), true)
  equal(ai.includes('text-white'), true)
  equal(ai.includes('min-h-11'), true)
  equal(ai.includes('font-medium'), false)

  const chrome = ai.match(/'([^']*rounded-2xl[^']*bg-forest[^']*)'/)
  equal(chrome?.[1]?.includes('ai-generating') ?? true, false)
  equal(/generating\s*\?\s*'ai-generating'/.test(ai), true)

  equal(css.includes('.ai-generating'), true)
  equal(css.includes('background-color: #2f7dff'), true)
  equal(css.includes('animation: ai-glow 1.6s ease-in-out infinite'), true)
  equal(css.includes('@keyframes ai-glow'), true)
  equal(css.includes('0 0 0 0 rgba(47, 125, 255, 0.35)'), true)
  equal(css.includes('0 0 16px 4px rgba(47, 125, 255, 0.55)'), true)

  const reducedStart = css.lastIndexOf('@media (prefers-reduced-motion: reduce)')
  equal(reducedStart >= 0, true)
  const reduced = css.slice(reducedStart)
  equal(reduced.includes('.ai-generating'), true)
  equal(reduced.includes('animation: none'), true)
  equal(reduced.includes('0 0 16px 4px rgba(47, 125, 255, 0.45)'), true)
})

const composerPath = fileURLToPath(
  new URL('../components/patients/PatientAiComposer.tsx', import.meta.url),
)
const pickerPath = fileURLToPath(
  new URL('../components/patients/PatientAiFieldPicker.tsx', import.meta.url),
)

test('REQ-37.2: exportar avaliação e o seletor não usam Gerando', () => {
  const composer = readFileSync(composerPath, 'utf8')
  const picker = readFileSync(pickerPath, 'utf8')

  equal(composer.includes('AiGeneratingButton'), true)
  equal(picker.includes('AiGeneratingButton'), false)
  equal(composer.includes('pdfEmptyHeading'), true)
  equal(composer.includes('pdfEmptyBody'), true)
  equal(composer.includes("generatingTarget === 'resumo'"), true)
  equal(composer.includes("generatingTarget === 'sintese'"), true)
  equal(composer.includes('generatingConfirm'), true)
  equal(
    composer.includes('isLoading={generating || (createReport.isPending && !pickerOpen)}'),
    false,
  )

  const evalCatalog = composer.indexOf('buildEvaluationFilledCatalog(')
  equal(evalCatalog >= 0, true)
  const evalEmpty = composer.indexOf('items.length === 0', evalCatalog)
  equal(evalEmpty >= 0, true)
  const pickerConfirm = composer.indexOf('async function handlePickerConfirm', evalEmpty)
  equal(pickerConfirm > evalEmpty, true)
  const evalEmptyBranch = composer.slice(evalEmpty, pickerConfirm)
  equal(evalEmptyBranch.includes('buildPatientAiReportPdf'), false)
  equal(evalEmptyBranch.includes('createReport'), false)

  const evoCatalog = composer.indexOf('buildEvolucaoFilledCatalog(')
  equal(evoCatalog >= 0, true)
  const evoEmpty = composer.indexOf('items.length === 0', evoCatalog)
  equal(evoEmpty >= 0 && evoEmpty < evalCatalog, true)
  const evoEmptyBranch = composer.slice(evoEmpty, evalCatalog)
  equal(evoEmptyBranch.includes('buildPatientAiReportPdf'), false)
  equal(evoEmptyBranch.includes('createReport'), false)
})
