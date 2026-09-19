import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from 'pdf-lib'
import logoUrl from '@/assets/brand/logo.png'
import type { PatientGoal, PatientFocusArea, SessionEvolution } from '@/types/patient'

/** A4 */
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 48
const MARGIN_BOTTOM = 52
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

/** Brand tokens (src/index.css) */
const COLORS = {
  forest: rgb(0x0b / 255, 0x1d / 255, 0x36 / 255),
  accent: rgb(0x2f / 255, 0x7d / 255, 0xff / 255),
  accentSoft: rgb(0xe7 / 255, 0xf0 / 255, 0xfb / 255),
  canvas: rgb(0xf3 / 255, 0xf5 / 255, 0xf8 / 255),
  ink: rgb(0x10 / 255, 0x20 / 255, 0x38 / 255),
  muted: rgb(0x5a / 255, 0x6b / 255, 0x80 / 255),
  line: rgb(0xe1 / 255, 0xe8 / 255, 0xf0 / 255),
  white: rgb(1, 1, 1),
} as const

const SIZE = {
  title: 18,
  section: 10,
  body: 10,
  meta: 9,
  footer: 8,
  label: 8,
} as const

const LINE = {
  body: 14,
  meta: 12,
  section: 14,
} as const

/** Snapshot clínico para PDF geral (sem Gemini — A5). */
export interface PatientAiGeralPdfInput {
  kind: 'geral'
  name: string
  code: string
  complaint: string
  diagnosis: string
  program: string
  eva: number
  goals: PatientGoal[]
  focusAreas: PatientFocusArea[]
  aiSummary: string
  evolutionHighlights?: string
}

/** Snapshot de sessão para PDF por sessão (sem Gemini — A5). */
export interface PatientAiSessaoPdfInput {
  kind: 'sessao'
  name: string
  code: string
  sessionLabel: string
  sessionDateLabel?: string
  sessionTimeLabel?: string
  evolution: Pick<
    SessionEvolution,
    'patientState' | 'changesSinceLast' | 'conducts' | 'treatmentResponse' | 'incidents' | 'nextPlan'
  > | null
}

export type BuildPatientAiReportPdfInput = PatientAiGeralPdfInput | PatientAiSessaoPdfInput

/**
 * WinAnsi (Helvetica) cobre áéíóúãõç — Pitfall 9 sem pacote fontkit extra.
 * Substitui caracteres fora de WinAnsi para evitar throw do pdf-lib.
 */
function toWinAnsiSafe(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, '?')
}

function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const safe = toWinAnsiSafe(text.trim() || '—')
  const paragraphs = safe.split(/\r?\n/)
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next
      } else {
        if (current) lines.push(current)
        // Long token without spaces — hard-break by width
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = ''
          for (const ch of word) {
            const tryChunk = chunk + ch
            if (font.widthOfTextAtSize(tryChunk, size) <= maxWidth) {
              chunk = tryChunk
            } else {
              if (chunk) lines.push(chunk)
              chunk = ch
            }
          }
          current = chunk
        } else {
          current = word
        }
      }
    }
    if (current) lines.push(current)
  }

  return lines.length > 0 ? lines : ['—']
}

function formatGeneratedAt(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

type DrawContext = {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  logo: PDFImage
  y: number
  pageIndex: number
  docTitle: string
  patientLine: string
  generatedAt: string
}

function drawFooter(ctx: DrawContext) {
  const footerY = 28
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: footerY + 14 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: footerY + 14 },
    thickness: 0.6,
    color: COLORS.line,
  })
  ctx.page.drawText(toWinAnsiSafe('FLUXO · Documento clínico'), {
    x: MARGIN_X,
    y: footerY,
    size: SIZE.footer,
    font: ctx.font,
    color: COLORS.muted,
  })
  const pageLabel = `Pág. ${ctx.pageIndex}`
  const pageW = ctx.font.widthOfTextAtSize(pageLabel, SIZE.footer)
  ctx.page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN_X - pageW,
    y: footerY,
    size: SIZE.footer,
    font: ctx.font,
    color: COLORS.muted,
  })
}

function drawHeaderBand(ctx: DrawContext, opts: { isFirstPage: boolean }) {
  const bandHeight = opts.isFirstPage ? 92 : 56

  // Soft top band
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - bandHeight,
    width: PAGE_WIDTH,
    height: bandHeight,
    color: COLORS.accentSoft,
  })

  // Accent bar under band
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - bandHeight - 3,
    width: PAGE_WIDTH,
    height: 3,
    color: COLORS.accent,
  })

  const logoH = opts.isFirstPage ? 36 : 26
  const logoAspect = ctx.logo.width / ctx.logo.height
  const logoW = logoH * logoAspect
  const logoY = PAGE_HEIGHT - bandHeight + (bandHeight - logoH) / 2 + (opts.isFirstPage ? 4 : 0)

  ctx.page.drawImage(ctx.logo, {
    x: MARGIN_X,
    y: logoY,
    width: logoW,
    height: logoH,
  })

  if (opts.isFirstPage) {
    const title = toWinAnsiSafe(ctx.docTitle)
    const titleW = ctx.bold.widthOfTextAtSize(title, SIZE.title)
    ctx.page.drawText(title, {
      x: PAGE_WIDTH - MARGIN_X - titleW,
      y: PAGE_HEIGHT - 42,
      size: SIZE.title,
      font: ctx.bold,
      color: COLORS.forest,
    })
    const gen = toWinAnsiSafe(ctx.generatedAt)
    const genW = ctx.font.widthOfTextAtSize(gen, SIZE.meta)
    ctx.page.drawText(gen, {
      x: PAGE_WIDTH - MARGIN_X - genW,
      y: PAGE_HEIGHT - 58,
      size: SIZE.meta,
      font: ctx.font,
      color: COLORS.muted,
    })
  } else {
    const cont = toWinAnsiSafe(`${ctx.docTitle} (cont.)`)
    const contW = ctx.bold.widthOfTextAtSize(cont, 11)
    ctx.page.drawText(cont, {
      x: PAGE_WIDTH - MARGIN_X - contW,
      y: PAGE_HEIGHT - bandHeight / 2 - 4,
      size: 11,
      font: ctx.bold,
      color: COLORS.forest,
    })
  }

  drawFooter(ctx)
  ctx.y = PAGE_HEIGHT - bandHeight - 28
}

function newPage(ctx: DrawContext) {
  drawFooter(ctx)
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.pageIndex += 1
  drawHeaderBand(ctx, { isFirstPage: false })
}

function ensureSpace(ctx: DrawContext, needed: number) {
  if (ctx.y - needed >= MARGIN_BOTTOM) return
  newPage(ctx)
}

function drawPatientCard(ctx: DrawContext) {
  const cardH = 44
  ensureSpace(ctx, cardH + 12)

  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - cardH + 8,
    width: CONTENT_WIDTH,
    height: cardH,
    color: COLORS.white,
    borderColor: COLORS.line,
    borderWidth: 1,
  })

  // Left accent
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - cardH + 8,
    width: 4,
    height: cardH,
    color: COLORS.accent,
  })

  ctx.page.drawText(toWinAnsiSafe('PACIENTE'), {
    x: MARGIN_X + 16,
    y: ctx.y - 6,
    size: SIZE.label,
    font: ctx.bold,
    color: COLORS.accent,
  })

  const nameLines = wrapLines(ctx.bold, ctx.patientLine, 12, CONTENT_WIDTH - 28)
  const nameLine = nameLines[0] ?? '—'
  ctx.page.drawText(nameLine, {
    x: MARGIN_X + 16,
    y: ctx.y - 24,
    size: 12,
    font: ctx.bold,
    color: COLORS.ink,
  })

  ctx.y -= cardH + 18
}

function drawSectionTitle(ctx: DrawContext, title: string) {
  ensureSpace(ctx, LINE.section + 10)
  ctx.page.drawText(toWinAnsiSafe(title.toUpperCase()), {
    x: MARGIN_X,
    y: ctx.y,
    size: SIZE.section,
    font: ctx.bold,
    color: COLORS.accent,
  })
  ctx.y -= 4
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: MARGIN_X + 36, y: ctx.y },
    thickness: 2,
    color: COLORS.accent,
  })
  ctx.y -= 14
}

function drawParagraph(
  ctx: DrawContext,
  text: string,
  opts?: { size?: number; color?: RGB; bold?: boolean },
) {
  const size = opts?.size ?? SIZE.body
  const color = opts?.color ?? COLORS.ink
  const font = opts?.bold ? ctx.bold : ctx.font
  const lineH = size + 4
  const lines = wrapLines(font, text, size, CONTENT_WIDTH)

  for (const line of lines) {
    ensureSpace(ctx, lineH)
    if (line) {
      ctx.page.drawText(line, {
        x: MARGIN_X,
        y: ctx.y,
        size,
        font,
        color,
      })
    }
    ctx.y -= lineH
  }
  ctx.y -= 6
}

function drawField(ctx: DrawContext, label: string, value: string) {
  drawSectionTitle(ctx, label)
  drawParagraph(ctx, value || '—')
}

function drawChipRow(ctx: DrawContext, items: string[]) {
  if (items.length === 0) {
    drawParagraph(ctx, '—', { color: COLORS.muted })
    return
  }

  const padX = 10
  const padY = 5
  const gap = 8
  const chipH = SIZE.meta + padY * 2
  let x = MARGIN_X
  let rowY = ctx.y

  ensureSpace(ctx, chipH + 8)

  for (const raw of items) {
    const label = toWinAnsiSafe(raw)
    const textW = ctx.font.widthOfTextAtSize(label, SIZE.meta)
    const chipW = textW + padX * 2

    if (x + chipW > MARGIN_X + CONTENT_WIDTH) {
      rowY -= chipH + gap
      x = MARGIN_X
      ctx.y = rowY
      ensureSpace(ctx, chipH + 8)
      rowY = ctx.y
    }

    ctx.page.drawRectangle({
      x,
      y: rowY - chipH + 4,
      width: chipW,
      height: chipH,
      color: COLORS.accentSoft,
      borderColor: COLORS.line,
      borderWidth: 0.6,
    })
    ctx.page.drawText(label, {
      x: x + padX,
      y: rowY - chipH + 4 + padY,
      size: SIZE.meta,
      font: ctx.font,
      color: COLORS.forest,
    })
    x += chipW + gap
  }

  ctx.y = rowY - chipH - 10
}

function drawEvaBadge(ctx: DrawContext, eva: number) {
  drawSectionTitle(ctx, 'Dor (EVA)')
  ensureSpace(ctx, 36)

  const value = Number.isFinite(eva) ? Math.max(0, Math.min(10, Math.round(eva))) : 0
  const boxW = 56
  const boxH = 32

  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - boxH + 8,
    width: boxW,
    height: boxH,
    color: COLORS.accentSoft,
    borderColor: COLORS.accent,
    borderWidth: 1.2,
  })

  const valueLabel = String(value)
  const vw = ctx.bold.widthOfTextAtSize(valueLabel, 16)
  ctx.page.drawText(valueLabel, {
    x: MARGIN_X + (boxW - vw) / 2,
    y: ctx.y - 14,
    size: 16,
    font: ctx.bold,
    color: COLORS.accent,
  })

  ctx.page.drawText(toWinAnsiSafe('Escala 0-10'), {
    x: MARGIN_X + boxW + 12,
    y: ctx.y - 12,
    size: SIZE.meta,
    font: ctx.font,
    color: COLORS.muted,
  })

  ctx.y -= boxH + 14
}

function drawBulletList(ctx: DrawContext, items: string[]) {
  if (items.length === 0) {
    drawParagraph(ctx, '—', { color: COLORS.muted })
    return
  }

  for (const item of items) {
    const bullet = '-  '
    const bulletW = ctx.font.widthOfTextAtSize(bullet, SIZE.body)
    const lines = wrapLines(ctx.font, item, SIZE.body, CONTENT_WIDTH - bulletW)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      ensureSpace(ctx, LINE.body)
      if (i === 0) {
        ctx.page.drawText(bullet, {
          x: MARGIN_X,
          y: ctx.y,
          size: SIZE.body,
          font: ctx.font,
          color: COLORS.accent,
        })
      }
      if (line) {
        ctx.page.drawText(line, {
          x: MARGIN_X + bulletW,
          y: ctx.y,
          size: SIZE.body,
          font: ctx.font,
          color: COLORS.ink,
        })
      }
      ctx.y -= LINE.body
    }
    ctx.y -= 2
  }
  ctx.y -= 6
}

function drawGeral(ctx: DrawContext, input: PatientAiGeralPdfInput) {
  drawPatientCard(ctx)

  drawField(ctx, 'Queixa', input.complaint)
  drawField(ctx, 'Diagnóstico', input.diagnosis)
  drawField(ctx, 'Programa', input.program || '—')
  drawEvaBadge(ctx, input.eva)

  drawSectionTitle(ctx, 'Metas')
  const goalLines =
    input.goals.length === 0
      ? []
      : input.goals.map((g) => `${g.title}  ·  ${g.isDone ? 'concluído' : 'em andamento'}`)
  if (goalLines.length === 0) {
    drawParagraph(ctx, 'Nenhuma meta registrada.', { color: COLORS.muted })
  } else {
    drawBulletList(ctx, goalLines)
  }

  drawSectionTitle(ctx, 'Áreas de foco')
  const focusLabels = input.focusAreas.filter((f) => f.isActive).map((f) => f.label)
  if (focusLabels.length === 0) {
    drawParagraph(ctx, 'Nenhuma área de foco ativa.', { color: COLORS.muted })
  } else {
    drawChipRow(ctx, focusLabels)
  }

  drawField(ctx, 'Resumo IA', input.aiSummary || '—')
  if (input.evolutionHighlights?.trim()) {
    drawField(ctx, 'Destaques de evolução', input.evolutionHighlights)
  }
}

function drawSessao(ctx: DrawContext, input: PatientAiSessaoPdfInput) {
  drawPatientCard(ctx)

  const when =
    [input.sessionDateLabel, input.sessionTimeLabel].filter(Boolean).join(' · ') ||
    input.sessionLabel
  drawField(ctx, 'Sessão', when)

  const evo = input.evolution
  if (!evo) {
    drawField(ctx, 'Evolução', 'Sem evolução registrada para esta sessão.')
    return
  }

  drawField(ctx, 'Estado do paciente', evo.patientState)
  drawField(ctx, 'Mudanças desde a última', evo.changesSinceLast ?? '—')
  drawField(ctx, 'Condutas', evo.conducts)
  drawField(ctx, 'Resposta ao tratamento', evo.treatmentResponse ?? '—')
  drawField(ctx, 'Intercorrências', evo.incidents ?? '—')
  drawField(ctx, 'Plano seguinte', evo.nextPlan ?? '—')
}

/**
 * Builds deterministic PDF bytes for kind geral | sessao (D-05, A5).
 * Brand layout: FLUXO logo + accent/forest palette — no Gemini.
 */
export async function buildPatientAiReportPdf(input: BuildPatientAiReportPdfInput): Promise<Blob> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const logoBytes = await fetch(logoUrl).then((r) => {
    if (!r.ok) throw new Error('Não foi possível carregar a logo FLUXO.')
    return r.arrayBuffer()
  })
  const logo = await doc.embedPng(logoBytes)

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const generatedAt = formatGeneratedAt()
  const docTitle = input.kind === 'geral' ? 'Avaliação geral' : 'Avaliação por sessão'
  const patientLine = `${input.name}  ·  ${input.code}`

  const ctx: DrawContext = {
    doc,
    page,
    font,
    bold,
    logo,
    y: PAGE_HEIGHT,
    pageIndex: 1,
    docTitle,
    patientLine,
    generatedAt,
  }

  drawHeaderBand(ctx, { isFirstPage: true })

  if (input.kind === 'geral') {
    drawGeral(ctx, input)
  } else {
    drawSessao(ctx, input)
  }

  drawFooter(ctx)

  const bytes = await doc.save()
  return new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
}
