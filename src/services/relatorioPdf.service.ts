import {
  PDFDocument,
  LineCapStyle,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from 'pdf-lib'
import logoUrl from '@/assets/brand/logo.png'
import { BLANK } from '@/lib/consentTerms'
import { tamanhoLogo, xAlinhado, type PdfLogoAlign } from '@/lib/pdfBrand'
import { toWinAnsiSafe, type TextMeasurer } from '@/lib/pdfText'
import {
  RELATORIO_CONTENT_WIDTH,
  RELATORIO_FONT_SIZE,
  RELATORIO_LEADING,
  RELATORIO_MARGIN,
  RELATORIO_PAGE_WIDTH,
  RELATORIO_TITULO,
  dataPorExtenso,
  linhasRelatorio,
} from '@/lib/relatorio'
import { SIGNATURE_VIEWBOX, isSafeSignaturePath, signaturePdfScale } from '@/lib/signaturePath'
import { loadPdfBrand } from '@/services/pdfBranding.service'

export type RelatorioPdfInput = {
  patientName: string
  content: string
  place: string | null
  createdAt: string
  therapistName: string | null
  therapistCrefito: string | null
  signaturePath: string | null
}

const PAGE_HEIGHT = 841.89
const FOOTER_RESERVE = 32
const LOGO_HEIGHT = 32
const SIGNATURE_LINE_W = 240
const SIGNATURE_BOX_H = 48
/** Altura da linha guia no campo de assinatura: é ela que encosta na linha do PDF. */
const SIGNATURE_PAD_BASELINE = 130
const PDF_ERROR = 'Não foi possível gerar o PDF. Tente de novo em instantes.'

const COLORS = {
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
  brandName: string | null
  accent: RGB
  logoSize: number | null
  logoAlign: PdfLogoAlign
}

function orBlank(v: string | null | undefined): string {
  const t = (v ?? '').trim()
  return t ? t : BLANK
}

function drawFooter(ctx: Ctx): void {
  ctx.page.drawText(toWinAnsiSafe(`${ctx.brandName ?? 'Fluxo'} · página ${ctx.pageNumber}`), {
    x: RELATORIO_MARGIN,
    y: RELATORIO_MARGIN - 8,
    size: 9,
    font: ctx.font,
    color: COLORS.muted,
  })
}

function ensureSpace(ctx: Ctx, height: number): void {
  if (ctx.y - height >= RELATORIO_MARGIN + FOOTER_RESERVE) return
  ctx.page = ctx.doc.addPage([RELATORIO_PAGE_WIDTH, PAGE_HEIGHT])
  ctx.pageNumber += 1
  ctx.y = PAGE_HEIGHT - RELATORIO_MARGIN
  drawFooter(ctx)
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: RGB } = {},
): void {
  ctx.page.drawText(toWinAnsiSafe(value), {
    x,
    y,
    size: opts.size ?? RELATORIO_FONT_SIZE,
    font: opts.bold ? ctx.bold : ctx.font,
    color: opts.color ?? COLORS.ink,
  })
}

function centered(ctx: Ctx, value: string, y: number, opts: { size?: number; bold?: boolean } = {}) {
  const size = opts.size ?? RELATORIO_FONT_SIZE
  const w = (opts.bold ? ctx.bold : ctx.font).widthOfTextAtSize(toWinAnsiSafe(value), size)
  text(ctx, value, (RELATORIO_PAGE_WIDTH - w) / 2, y, opts)
}

function drawLine(ctx: Ctx, x: number, y: number, width: number, thickness = 1, color = COLORS.border) {
  ctx.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness, color })
}

async function createContext(): Promise<{ ctx: Ctx; logo: PDFImage | null }> {
  try {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const marca = await loadPdfBrand(doc)
    let logo: PDFImage | null = marca.logo
    if (!logo && !marca.name) {
      const res = await fetch(logoUrl)
      if (!res.ok) throw new Error(PDF_ERROR)
      logo = await doc.embedPng(await res.arrayBuffer())
    }
    const page = doc.addPage([RELATORIO_PAGE_WIDTH, PAGE_HEIGHT])
    const ctx: Ctx = {
      doc,
      page,
      font,
      bold,
      y: PAGE_HEIGHT - RELATORIO_MARGIN,
      pageNumber: 1,
      brandName: marca.name,
      accent: marca.colors?.accent ?? COLORS.accent,
      logoSize: marca.logoSize,
      logoAlign: marca.logoAlign,
    }
    drawFooter(ctx)
    return { ctx, logo }
  } catch {
    throw new Error(PDF_ERROR)
  }
}

function drawHeader(ctx: Ctx, logo: PDFImage | null): void {
  const alturaLogo = ctx.logoSize ?? LOGO_HEIGHT
  if (logo) {
    const { width, height } = tamanhoLogo(
      logo.width,
      logo.height,
      alturaLogo,
      RELATORIO_CONTENT_WIDTH * 0.75,
    )
    ctx.page.drawImage(logo, {
      x: xAlinhado(ctx.logoAlign, width, RELATORIO_MARGIN, RELATORIO_PAGE_WIDTH),
      y: ctx.y - alturaLogo + (alturaLogo - height) / 2,
      width,
      height,
    })
  } else {
    const nome = ctx.brandName ?? 'Fluxo'
    const largura = ctx.bold.widthOfTextAtSize(toWinAnsiSafe(nome), 20)
    text(
      ctx,
      nome,
      xAlinhado(ctx.logoAlign, largura, RELATORIO_MARGIN, RELATORIO_PAGE_WIDTH),
      ctx.y - alturaLogo + 8,
      { size: 20, bold: true },
    )
  }
  ctx.y -= alturaLogo + 28
}

function drawTitle(ctx: Ctx): void {
  const size = 16
  centered(ctx, RELATORIO_TITULO, ctx.y - size, { size, bold: true })
  const w = ctx.bold.widthOfTextAtSize(toWinAnsiSafe(RELATORIO_TITULO), size)
  drawLine(ctx, (RELATORIO_PAGE_WIDTH - w) / 2, ctx.y - size - 3, w, 1, ctx.accent)
  ctx.y -= size + 3 + 24
}

export async function buildRelatorioPdf(input: RelatorioPdfInput): Promise<Blob> {
  const { ctx, logo } = await createContext()
  drawHeader(ctx, logo)
  drawTitle(ctx)

  ensureSpace(ctx, RELATORIO_LEADING)
  text(ctx, `Paciente: ${orBlank(input.patientName)}`, RELATORIO_MARGIN, ctx.y - RELATORIO_FONT_SIZE, {
    bold: true,
  })
  ctx.y -= RELATORIO_LEADING + 12

  // Exatamente as linhas que o editor contou; nunca corta, pagina se preciso.
  for (const line of linhasRelatorio(ctx.font, input.content)) {
    ensureSpace(ctx, RELATORIO_LEADING)
    if (line) text(ctx, line, RELATORIO_MARGIN, ctx.y - RELATORIO_FONT_SIZE)
    ctx.y -= RELATORIO_LEADING
  }
  ctx.y -= 12

  ensureSpace(ctx, RELATORIO_LEADING * 4)
  text(ctx, 'Sem mais para o momento.', RELATORIO_MARGIN, ctx.y - RELATORIO_FONT_SIZE)
  ctx.y -= RELATORIO_LEADING + 12
  text(ctx, `Local: ${orBlank(input.place)}`, RELATORIO_MARGIN, ctx.y - RELATORIO_FONT_SIZE)
  ctx.y -= RELATORIO_LEADING
  text(
    ctx,
    `Data: ${orBlank(dataPorExtenso(input.createdAt))}`,
    RELATORIO_MARGIN,
    ctx.y - RELATORIO_FONT_SIZE,
  )
  ctx.y -= RELATORIO_LEADING

  // Bloco de assinatura inteiro na mesma página.
  ensureSpace(ctx, SIGNATURE_BOX_H + 8 + RELATORIO_LEADING * 2 + 8)
  ctx.y -= SIGNATURE_BOX_H
  if (isSafeSignaturePath(input.signaturePath)) {
    const scale = signaturePdfScale(SIGNATURE_LINE_W, SIGNATURE_BOX_H)
    ctx.page.drawSvgPath(input.signaturePath, {
      x: (RELATORIO_PAGE_WIDTH - SIGNATURE_VIEWBOX.width * scale) / 2,
      y: ctx.y + SIGNATURE_PAD_BASELINE * scale,
      scale,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2 / scale,
      borderLineCap: LineCapStyle.Round,
    })
  }
  drawLine(ctx, (RELATORIO_PAGE_WIDTH - SIGNATURE_LINE_W) / 2, ctx.y, SIGNATURE_LINE_W, 1, COLORS.ink)
  ctx.y -= 8
  centered(ctx, orBlank(input.therapistName), ctx.y - RELATORIO_FONT_SIZE)
  ctx.y -= RELATORIO_LEADING
  centered(ctx, `CREFITO ${orBlank(input.therapistCrefito)}`, ctx.y - RELATORIO_FONT_SIZE)
  ctx.y -= RELATORIO_LEADING

  ctx.doc.setTitle(RELATORIO_TITULO)
  return new Blob([Uint8Array.from(await ctx.doc.save())], { type: 'application/pdf' })
}

/** Mesma fonte do corpo do PDF; o editor mede com ela sem importar pdf-lib. */
export async function createRelatorioMeasurer(): Promise<TextMeasurer> {
  const doc = await PDFDocument.create()
  return doc.embedFont(StandardFonts.Helvetica)
}
