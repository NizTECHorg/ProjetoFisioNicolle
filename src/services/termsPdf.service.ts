import {
  LineCapStyle,
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib'
import logoUrl from '@/assets/brand/logo.png'
import { BLANK, type TermGuardian, type TermKey } from '@/lib/consentTerms'
import { formatCpf } from '@/lib/cpf'
import { toWinAnsiSafe, wrapLines } from '@/lib/pdfText'
import { isSafeSignaturePath, signaturePdfScale } from '@/lib/signaturePath'

export type TermPdfInput = {
  termKey: TermKey
  category: string
  title: string
  bodyText: string
  patientName: string
  patientCpf: string
  therapistName: string
  crefito: string
  guardian: TermGuardian | null
  generatedAt: Date
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48
const FOOTER_RESERVE = 32
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const SIGNATURE_BOX_W = 220
const SIGNATURE_BOX_H = 56
const BODY_SIZE = 14
const BODY_LEADING = 21
const LOGO_HEIGHT = 32
const CARD_PADDING = 16
const PDF_ERROR = 'Não foi possível gerar o PDF. Tente de novo em instantes.'

const COLORS = {
  forest: rgb(11 / 255, 29 / 255, 54 / 255),
  ink: rgb(16 / 255, 32 / 255, 56 / 255),
  accent: rgb(47 / 255, 125 / 255, 255 / 255),
  border: rgb(184 / 255, 201 / 255, 222 / 255),
  muted: rgb(90 / 255, 107 / 255, 128 / 255),
}

type Ctx = {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  y: number
  pageNumber: number
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(d)
}

function orBlank(v: string | null | undefined): string {
  const t = (v ?? '').trim()
  return t ? t : BLANK
}

function firstLine(font: PDFFont, value: string, maxWidth: number): string {
  return wrapLines(font, value, BODY_SIZE, maxWidth)[0] ?? ''
}

function drawFooter(ctx: Ctx): void {
  ctx.page.drawText(toWinAnsiSafe(`Fluxo · página ${ctx.pageNumber}`), {
    x: MARGIN,
    y: MARGIN - 8,
    size: 14,
    font: ctx.font,
    color: COLORS.muted,
  })
}

function ensureSpace(ctx: Ctx, height: number): void {
  if (ctx.y - height >= MARGIN + FOOTER_RESERVE) return
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.pageNumber += 1
  ctx.y = PAGE_HEIGHT - MARGIN
  drawFooter(ctx)
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {},
): void {
  ctx.page.drawText(toWinAnsiSafe(value), {
    x,
    y,
    size: opts.size ?? BODY_SIZE,
    font: opts.bold ? ctx.bold : ctx.font,
    color: opts.color ?? COLORS.ink,
  })
}

async function createContext(): Promise<{ ctx: Ctx; logo: PDFImage }> {
  try {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const res = await fetch(logoUrl)
    if (!res.ok) throw new Error(PDF_ERROR)
    const logo = await doc.embedPng(await res.arrayBuffer())
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const ctx: Ctx = { doc, page, font, bold, y: PAGE_HEIGHT - MARGIN, pageNumber: 1 }
    drawFooter(ctx)
    return { ctx, logo }
  } catch {
    throw new Error(PDF_ERROR)
  }
}

function drawHeader(ctx: Ctx, logo: PDFImage, input: TermPdfInput): void {
  const logoW = (logo.width / logo.height) * LOGO_HEIGHT
  ctx.page.drawImage(logo, {
    x: MARGIN,
    y: ctx.y - LOGO_HEIGHT,
    width: logoW,
    height: LOGO_HEIGHT,
  })
  ctx.y -= LOGO_HEIGHT + 24

  const titleLines = wrapLines(ctx.bold, input.title, 20, CONTENT_WIDTH)
  for (const line of titleLines) {
    text(ctx, line, MARGIN, ctx.y - 20, { size: 20, bold: true })
    ctx.y -= 26
  }
  ctx.y -= 4
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 4, width: 48, height: 4, color: COLORS.accent })
  ctx.y -= 4 + 16
  text(ctx, input.category, MARGIN, ctx.y - 14, { bold: true, color: COLORS.muted })
  ctx.y -= 14 + 32
}

function drawDataCard(ctx: Ctx, input: TermPdfInput, signed: boolean): void {
  const rows: Array<[string, string]> = [
    ['Paciente', orBlank(input.patientName)],
    ['CPF', input.patientCpf.trim() ? formatCpf(input.patientCpf) : BLANK],
    ['Fisioterapeuta', orBlank(input.therapistName)],
    ['CREFITO', orBlank(input.crefito)],
    ['Data e hora', signed ? formatDateTime(input.generatedAt) : BLANK],
  ]
  if (input.guardian) {
    rows.push(['Responsável legal', orBlank(input.guardian.name)])
    rows.push([
      'CPF do responsável',
      input.guardian.cpf.trim() ? formatCpf(input.guardian.cpf) : BLANK,
    ])
  }
  const rowH = 24
  const cardH = CARD_PADDING * 2 + rows.length * rowH
  ensureSpace(ctx, cardH + 24)
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - cardH,
    width: CONTENT_WIDTH,
    height: cardH,
    borderColor: COLORS.border,
    borderWidth: 1,
  })
  let rowY = ctx.y - CARD_PADDING - 14
  const valueX = MARGIN + CARD_PADDING + 150
  for (const [label, value] of rows) {
    text(ctx, label, MARGIN + CARD_PADDING, rowY, { bold: true })
    const clipped = firstLine(ctx.font, value, CONTENT_WIDTH - CARD_PADDING * 2 - 150)
    text(ctx, clipped, valueX, rowY)
    rowY -= rowH
  }
  ctx.y -= cardH + 24
}

function drawBody(ctx: Ctx, bodyText: string): void {
  const lines = wrapLines(ctx.font, bodyText, BODY_SIZE, CONTENT_WIDTH)
  for (const line of lines) {
    ensureSpace(ctx, BODY_LEADING)
    if (line) text(ctx, line, MARGIN, ctx.y - BODY_SIZE)
    ctx.y -= BODY_LEADING
  }
  ctx.y -= 24
}

function drawLine(ctx: Ctx, x: number, y: number, width: number): void {
  ctx.page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 1,
    color: COLORS.border,
  })
}

async function finish(ctx: Ctx, title: string): Promise<Blob> {
  ctx.doc.setTitle(title)
  return new Blob([Uint8Array.from(await ctx.doc.save())], { type: 'application/pdf' })
}

export async function buildSignedTermPdf(
  input: TermPdfInput & { signaturePath: string },
): Promise<Blob> {
  if (!isSafeSignaturePath(input.signaturePath)) throw new Error('Assinatura inválida.')
  const { ctx, logo } = await createContext()
  drawHeader(ctx, logo, input)
  drawDataCard(ctx, input, true)
  drawBody(ctx, input.bodyText)

  const guardian = input.guardian
  const declarant = guardian ? orBlank(guardian.name) : orBlank(input.patientName)
  const extra: string[] = []
  if (guardian) {
    extra.push(`Responsável legal por ${orBlank(input.patientName)}`)
    extra.push(`CPF ${guardian.cpf.trim() ? formatCpf(guardian.cpf) : BLANK}`)
  }
  const blockH = 17 + 8 + SIGNATURE_BOX_H + 8 + 20 + extra.length * 20 + 12 + 20 + 20
  ensureSpace(ctx, blockH)

  text(ctx, guardian ? 'Assinatura do responsável legal' : 'Assinatura do paciente', MARGIN, ctx.y - 14, {
    bold: true,
  })
  ctx.y -= 17 + 8
  const scale = signaturePdfScale(SIGNATURE_BOX_W, SIGNATURE_BOX_H)
  ctx.page.drawSvgPath(input.signaturePath, {
    x: MARGIN,
    y: ctx.y,
    scale,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.2 / scale,
    borderLineCap: LineCapStyle.Round,
  })
  ctx.y -= SIGNATURE_BOX_H + 4
  drawLine(ctx, MARGIN, ctx.y, SIGNATURE_BOX_W)
  ctx.y -= 8
  text(ctx, declarant, MARGIN, ctx.y - 14)
  ctx.y -= 20
  for (const line of extra) {
    text(ctx, line, MARGIN, ctx.y - 14)
    ctx.y -= 20
  }
  ctx.y -= 12
  text(ctx, `Assinado digitalmente em ${formatDateTime(input.generatedAt)} no app Fluxo.`, MARGIN, ctx.y - 14, {
    color: COLORS.muted,
  })
  ctx.y -= 20
  text(
    ctx,
    `Fisioterapeuta: ${orBlank(input.therapistName)} · CREFITO ${orBlank(input.crefito)}`,
    MARGIN,
    ctx.y - 14,
  )
  return finish(ctx, input.title)
}

export async function buildPrintableTermPdf(input: TermPdfInput): Promise<Blob> {
  const { ctx, logo } = await createContext()
  drawHeader(ctx, logo, input)
  drawDataCard(ctx, input, false)
  drawBody(ctx, input.bodyText)

  const gap = 24
  const colW = (CONTENT_WIDTH - gap) / 2
  const guardian = input.guardian
  const leftLabel = guardian ? 'Responsável legal' : 'Paciente'
  const leftName = guardian ? orBlank(guardian.name) : orBlank(input.patientName)
  const rightX = MARGIN + colW + gap

  ensureSpace(ctx, 48 + 8 + 20 + 20 + 20 + 32)
  ctx.y -= 48
  drawLine(ctx, MARGIN, ctx.y, colW)
  drawLine(ctx, rightX, ctx.y, colW)
  ctx.y -= 8
  text(ctx, leftLabel, MARGIN, ctx.y - 14, { bold: true })
  text(ctx, 'Fisioterapeuta', rightX, ctx.y - 14, { bold: true })
  ctx.y -= 20
  text(ctx, firstLine(ctx.font, leftName, colW), MARGIN, ctx.y - 14)
  text(ctx, firstLine(ctx.font, orBlank(input.therapistName), colW), rightX, ctx.y - 14)
  ctx.y -= 20
  text(ctx, `CREFITO ${orBlank(input.crefito)}`, rightX, ctx.y - 14)
  ctx.y -= 20 + 12
  text(ctx, 'Data: ___/___/______', MARGIN, ctx.y - 14)
  return finish(ctx, input.title)
}
