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

const sendServicePath = fileURLToPath(
  new URL('../services/patientDocumentSend.service.ts', import.meta.url),
)

function sliceNamed(source: string, name: string): string {
  const start = source.indexOf(`function ${name}`)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const rest = source.slice(start + `function ${name}`.length)
  const next = rest.search(/\n(?:export )?(?:async )?function /)
  return next < 0 ? source.slice(start) : source.slice(start, start + `function ${name}`.length + next)
}

test('REQ-37.3: sucesso só com https e janela', () => {
  const send = readFileSync(sendServicePath, 'utf8')
  const composer = readFileSync(composerPath, 'utf8')

  equal(send.includes('86400'), false)
  equal(send.includes('sendWhatsAppSuccess'), false)

  const sign = sliceNamed(send, 'signPatientDocumentUrl')
  equal(sign.includes('createSignedUrl'), true)
  equal(sign.includes('604800'), true)
  equal(sign.includes('86400'), false)
  equal(sign.includes("'patient-ai-reports'"), true)
  equal(sign.includes("'avaliacao.pdf'"), true)
  equal(sign.includes("'evolucao.pdf'"), true)
  equal(/startsWith\(\s*['"]https/.test(sign), true)

  const open = sliceNamed(send, 'openPatientDocumentWhatsApp')
  equal(open.includes('https://wa.me/'), true)
  equal(open.includes('whatsappMessage'), true)
  equal(open.includes('encodeURIComponent'), true)
  equal(open.includes("'_blank'"), true)
  equal(open.includes("'noopener,noreferrer'"), true)
  equal(open.includes('sendWhatsAppSuccess'), false)
  const httpsGuard = open.search(/startsWith\(\s*['"]https:\/\//)
  const openCall = open.indexOf('window.open')
  equal(httpsGuard >= 0 && openCall > httpsGuard, true)
  equal(/(?:===|!==)\s*null/.test(open.slice(openCall)), true)

  const whatsApp = sliceNamed(composer, 'handleSendWhatsApp')
  const successAt = whatsApp.indexOf('sendWhatsAppSuccess')
  equal(successAt > 0, true)
  const beforeSuccess = whatsApp.slice(0, successAt)
  equal(/startsWith\(\s*['"]https/.test(beforeSuccess), true)
  equal(beforeSuccess.includes('sendFileUnavailable'), true)
  equal(beforeSuccess.includes('sendWhatsAppBlocked'), true)
  equal(beforeSuccess.includes('openPatientDocumentWhatsApp'), true)
  equal(/(?:===|!==)\s*null/.test(beforeSuccess), true)
  equal(beforeSuccess.indexOf('sendNeedExport') < beforeSuccess.indexOf('signPatientDocumentUrl'), true)
  equal(beforeSuccess.includes('window.open'), false)
  equal(beforeSuccess.includes('emergencyPhone'), false)

  const email = sliceNamed(composer, 'handleSendEmail')
  equal(email.includes('sendNeedEmail'), true)
  equal(email.indexOf('sendNeedExport') < email.indexOf('sendPatientDocument'), true)
  equal(email.indexOf('sendPatientDocument') < email.indexOf('sendEmailSuccess'), true)
  equal(email.includes('window.open'), false)
  equal(email.includes('sendWhatsAppSuccess'), false)

  equal(composer.includes('emergencyPhone'), false)
  equal(composer.includes("if (!canWrite) return null"), true)
  equal(composer.includes("sending === 'whatsapp'"), true)
  equal(composer.includes("sending === 'email'"), true)
  equal(composer.includes('sendWhatsApp'), true)
  equal(composer.includes('sendEmail'), true)
  equal(composer.includes('#25D366'), true)
  equal(composer.includes('Mail'), true)
})

const reportsListPath = fileURLToPath(
  new URL('../components/patients/PatientAiReportsList.tsx', import.meta.url),
)
const resumoPanelPath = fileURLToPath(
  new URL('../components/patients/PatientResumoIaPanel.tsx', import.meta.url),
)
const sendFunctionPath = fileURLToPath(
  new URL(
    '../../.planning/phases/26-pdf-botao-gerando-envio-cliente/functions/send-patient-document/index.ts',
    import.meta.url,
  ),
)
const userSetupPath = fileURLToPath(
  new URL(
    '../../.planning/phases/26-pdf-botao-gerando-envio-cliente/26-USER-SETUP.md',
    import.meta.url,
  ),
)

test('REQ-37.5: envio só com escrita e só em avaliação ou evolução', () => {
  const list = readFileSync(reportsListPath, 'utf8')
  const composer = readFileSync(composerPath, 'utf8')
  const panel = readFileSync(resumoPanelPath, 'utf8')
  const send = readFileSync(sendServicePath, 'utf8')
  const edge = readFileSync(sendFunctionPath, 'utf8')
  const setup = readFileSync(userSetupPath, 'utf8')

  equal(composer.includes('if (!canWrite) return null'), true)
  equal(list.includes('generatingConfirm'), false)
  equal(list.includes('report.signedUrl'), true)

  const label = 'PATIENT_AI_COPY.sendWhatsApp}'
  const labelAt = list.indexOf(label)
  equal(labelAt >= 0, true)
  equal(list.indexOf(label, labelAt + label.length), -1)
  const gateAt = list.lastIndexOf('canWrite', labelAt)
  equal(gateAt >= 0, true)
  const branch = list.slice(gateAt, labelAt)
  equal(branch.includes("'geral'"), true)
  equal(branch.includes("'sessao'"), true)
  equal(branch.includes("'avaliacao'"), true)
  equal(branch.includes("'evolucao'"), true)
  equal(list.slice(0, gateAt).includes(label), false)

  equal(send.includes('https://wa.me/'), true)
  equal(send.includes('604800'), true)
  equal(send.includes('86400'), false)
  equal(/created_by\s*!==\s*user\.id/.test(edge), true)

  equal(panel.includes('phone={detail?.phone}'), true)
  equal(panel.includes('email={detail?.email}'), true)
  equal((panel.match(/usePatient\(/g) ?? []).length, 1)

  equal(setup.includes('FLUXO_SMTP_PASS'), true)
  equal(setup.includes('send-patient-document'), true)
  equal(setup.includes('supabase functions deploy'), true)
  equal(setup.includes('Send Email Hook'), true)
  equal(/smtp\.gmail\.com|smtp-relay\.brevo\.com|App Password/i.test(setup), false)
  equal(/FLUXO_SMTP_PASS\s*[:=]\s*\S+/.test(setup), false)
})
