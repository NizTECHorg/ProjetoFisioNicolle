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
import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'
import { FOCUS_REGIONS } from '@/lib/focusRegions'
import type { PdfFieldId } from '@/lib/pdfFieldCatalog'
import type { PatientGoal, PatientFocusArea, SessionEvolution } from '@/types/patient'

/** A4 */
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 48
const MARGIN_BOTTOM = 52
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

/** Brand + ficha-ref tokens (navy / sage / soft border — D-05) */
const COLORS = {
  forest: rgb(0x0b / 255, 0x1d / 255, 0x36 / 255),
  navy: rgb(0x1a / 255, 0x36 / 255, 0x5d / 255),
  sage: rgb(0x5f / 255, 0x7f / 255, 0x6b / 255),
  accent: rgb(0x2f / 255, 0x7d / 255, 0xff / 255),
  accentSoft: rgb(0xe7 / 255, 0xf0 / 255, 0xfb / 255),
  border: rgb(0xb8 / 255, 0xc9 / 255, 0xde / 255),
  canvas: rgb(0xf3 / 255, 0xf5 / 255, 0xf8 / 255),
  ink: rgb(0x10 / 255, 0x20 / 255, 0x38 / 255),
  muted: rgb(0x5a / 255, 0x6b / 255, 0x80 / 255),
  line: rgb(0xe1 / 255, 0xe8 / 255, 0xf0 / 255),
  white: rgb(1, 1, 1),
  danger: rgb(0xb9 / 255, 0x3c / 255, 0x3c / 255),
} as const

const SIZE = {
  title: 16,
  chapter: 14,
  section: 9,
  body: 9.5,
  meta: 8.5,
  footer: 8,
  label: 8,
} as const

const LINE = {
  body: 13,
  meta: 11,
  section: 13,
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

/** Ficha musculoesquelética 01–04 (D-07) — sem Gemini. */
export interface PatientAiAvaliacaoPdfInput {
  kind: 'avaliacao'
  name: string
  code: string
  performedOnLabel: string
  /** Nome livre da avaliação (opcional). */
  evaluationTitle?: string | null
  therapistName?: string | null
  ficha: EvaluationFicha
  /** When set, only these filled block ids render (D-02/D-03). Omitted = all filled. */
  selectedFieldIds?: ReadonlySet<PdfFieldId>
}

/** Evolução multi-sessão + síntese IA (D-04) — sem Gemini no builder. */
export interface PatientAiEvolucaoPdfInput {
  kind: 'evolucao'
  name: string
  code: string
  sessionLabel: string
  sessions: Array<{
    id: string
    dateLabel: string
    timeLabel?: string
    evolution: Pick<
      SessionEvolution,
      | 'patientState'
      | 'changesSinceLast'
      | 'conducts'
      | 'treatmentResponse'
      | 'incidents'
      | 'nextPlan'
    > | null
  }>
  synthesis: {
    sintese: string
    tendencias?: string
    condutasAgregadas?: string
    alertas?: string
  }
  selectedFieldIds?: ReadonlySet<PdfFieldId>
}

export type BuildPatientAiReportPdfInput =
  | PatientAiGeralPdfInput
  | PatientAiSessaoPdfInput
  | PatientAiAvaliacaoPdfInput
  | PatientAiEvolucaoPdfInput

const BODY_MAP_GLYPH: Record<string, string> = {
  X: 'X',
  hatch: '////',
  O: 'O',
  arrow: '^',
  star: '*',
}

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
  /** Serif chapter titles (StandardFonts.TimesRomanBold — no fontkit). */
  timesBold: PDFFont
  logo: PDFImage
  y: number
  pageIndex: number
  docTitle: string
  patientLine: string
  generatedAt: string
  /** Left inset for body content (inside ficha blocks). */
  contentX: number
  contentW: number
  footerKind: 'fluxo' | 'ficha'
}

function drawFooter(ctx: DrawContext) {
  const footerY = 28
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: footerY + 14 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: footerY + 14 },
    thickness: 0.5,
    color: COLORS.border,
  })
  const left =
    ctx.footerKind === 'ficha'
      ? `${String(ctx.pageIndex).padStart(2, '0')} | Ficha de Anamnese e Evolução Musculoesquelética`
      : 'FLUXO · Documento clínico'
  ctx.page.drawText(toWinAnsiSafe(left), {
    x: MARGIN_X,
    y: footerY,
    size: SIZE.footer,
    font: ctx.font,
    color: COLORS.muted,
  })
  if (ctx.footerKind !== 'ficha') {
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
}

function drawHeaderBand(ctx: DrawContext, opts: { isFirstPage: boolean }) {
  // Ficha kinds: slim strip so chapter title (drawPageBanner) is the hero — D-03
  if (ctx.footerKind === 'ficha') {
    const bandHeight = opts.isFirstPage ? 36 : 28
    const logoH = 18
    const logoAspect = ctx.logo.width / ctx.logo.height
    const logoW = logoH * logoAspect
    const logoY = PAGE_HEIGHT - bandHeight + (bandHeight - logoH) / 2

    ctx.page.drawImage(ctx.logo, {
      x: MARGIN_X,
      y: logoY,
      width: logoW,
      height: logoH,
    })

    ctx.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - bandHeight - 1.5,
      width: PAGE_WIDTH,
      height: 1.5,
      color: COLORS.border,
    })

    if (!opts.isFirstPage) {
      const cont = toWinAnsiSafe(`${ctx.docTitle} (cont.)`)
      const contW = ctx.font.widthOfTextAtSize(cont, SIZE.meta)
      ctx.page.drawText(cont, {
        x: PAGE_WIDTH - MARGIN_X - contW,
        y: PAGE_HEIGHT - bandHeight / 2 - 3,
        size: SIZE.meta,
        font: ctx.font,
        color: COLORS.muted,
      })
    }

    drawFooter(ctx)
    ctx.y = PAGE_HEIGHT - bandHeight - 16
    return
  }

  const bandHeight = opts.isFirstPage ? 92 : 56

  // Soft top band (geral / sessao only)
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
  const lines = wrapLines(font, text, size, ctx.contentW)

  for (const line of lines) {
    ensureSpace(ctx, lineH)
    if (line) {
      ctx.page.drawText(line, {
        x: ctx.contentX,
        y: ctx.y,
        size,
        font,
        color,
      })
    }
    ctx.y -= lineH
  }
  ctx.y -= 4
}

function drawField(ctx: DrawContext, label: string, value: string) {
  drawLabeledValue(ctx, label, value || '—')
}

/** Compact ficha field: "Label:" + value + underline (ref style). */
function drawLabeledValue(ctx: DrawContext, label: string, value: string) {
  const size = SIZE.body
  const lineH = LINE.body
  const labelText = toWinAnsiSafe(`${label}:`)
  const labelW = ctx.bold.widthOfTextAtSize(labelText, SIZE.label)
  const gap = 6
  const valueMax = Math.max(40, ctx.contentW - labelW - gap)
  const valueLines = wrapLines(ctx.font, value, size, valueMax)

  ensureSpace(ctx, Math.max(lineH, valueLines.length * lineH) + 4)

  ctx.page.drawText(labelText, {
    x: ctx.contentX,
    y: ctx.y,
    size: SIZE.label,
    font: ctx.bold,
    color: COLORS.navy,
  })

  let vy = ctx.y
  for (let i = 0; i < valueLines.length; i++) {
    const line = valueLines[i] ?? ''
    if (i > 0) {
      vy -= lineH
      ensureSpace(ctx, lineH)
    }
    ctx.page.drawText(line, {
      x: ctx.contentX + labelW + gap,
      y: vy,
      size,
      font: ctx.font,
      color: COLORS.ink,
    })
  }

  const underlineY = vy - 3
  ctx.page.drawLine({
    start: { x: ctx.contentX + labelW + gap, y: underlineY },
    end: { x: ctx.contentX + ctx.contentW, y: underlineY },
    thickness: 0.5,
    color: COLORS.border,
  })

  ctx.y = underlineY - 8
}

/** Long answer in a soft bordered box (ref text areas). */
function drawNoteBox(ctx: DrawContext, label: string, value: string) {
  const size = SIZE.body
  const pad = 6
  const lines = wrapLines(ctx.font, value, size, ctx.contentW - pad * 2)
  const boxH = pad * 2 + lines.length * LINE.body + 14

  ensureSpace(ctx, boxH + 4)

  ctx.page.drawText(toWinAnsiSafe(`${label}:`), {
    x: ctx.contentX,
    y: ctx.y,
    size: SIZE.label,
    font: ctx.bold,
    color: COLORS.navy,
  })
  ctx.y -= 12

  const boxTop = ctx.y + 4
  const boxBottom = boxTop - (pad * 2 + lines.length * LINE.body)

  ctx.page.drawRectangle({
    x: ctx.contentX,
    y: boxBottom,
    width: ctx.contentW,
    height: boxTop - boxBottom,
    borderColor: COLORS.border,
    borderWidth: 0.8,
    color: COLORS.white,
  })

  let ty = boxTop - pad - SIZE.body
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: ctx.contentX + pad,
      y: ty,
      size,
      font: ctx.font,
      color: COLORS.ink,
    })
    ty -= LINE.body
  }

  ctx.y = boxBottom - 8
}

/** Two-column compact fields (ref identification layout). */
function drawTwoColumnFields(
  ctx: DrawContext,
  fields: Array<[string, string | undefined]>,
): void {
  const filled = fields.filter(([, v]) => textFilled(v)) as Array<[string, string]>
  if (filled.length === 0) return

  const colGap = 14
  const colW = (ctx.contentW - colGap) / 2
  const savedX = ctx.contentX
  const savedW = ctx.contentW

  for (let i = 0; i < filled.length; i += 2) {
    const left = filled[i]
    if (!left) continue
    const right = filled[i + 1]
    const yStart = ctx.y

    ctx.contentX = savedX
    ctx.contentW = colW
    drawLabeledValue(ctx, left[0], left[1])
    const yAfterLeft = ctx.y

    if (right) {
      ctx.y = yStart
      ctx.contentX = savedX + colW + colGap
      ctx.contentW = colW
      drawLabeledValue(ctx, right[0], right[1])
      ctx.y = Math.min(yAfterLeft, ctx.y)
    } else {
      ctx.y = yAfterLeft
    }
  }

  ctx.contentX = savedX
  ctx.contentW = savedW
}

function drawCheckboxRow(ctx: DrawContext, items: string[]) {
  if (items.length === 0) return

  const size = SIZE.meta
  const gapX = 10
  const gapY = 6
  const box = 8
  let x = ctx.contentX
  let rowY = ctx.y

  ensureSpace(ctx, box + 10)

  for (const raw of items) {
    const label = toWinAnsiSafe(raw)
    const textW = ctx.font.widthOfTextAtSize(label, size)
    const cellW = box + 4 + textW

    if (x + cellW > ctx.contentX + ctx.contentW) {
      rowY -= box + gapY
      x = ctx.contentX
      ctx.y = rowY
      ensureSpace(ctx, box + 10)
      rowY = ctx.y
    }

    ctx.page.drawRectangle({
      x,
      y: rowY - 1,
      width: box,
      height: box,
      borderColor: COLORS.navy,
      borderWidth: 0.9,
      color: COLORS.white,
    })
    // Check mark as filled inset
    ctx.page.drawRectangle({
      x: x + 1.5,
      y: rowY + 0.5,
      width: box - 3,
      height: box - 3,
      color: COLORS.navy,
    })
    ctx.page.drawText(label, {
      x: x + box + 4,
      y: rowY,
      size,
      font: ctx.font,
      color: COLORS.ink,
    })
    x += cellW + gapX
  }

  ctx.y = rowY - box - 8
}

function drawChipRow(ctx: DrawContext, items: string[]) {
  drawCheckboxRow(ctx, items)
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
    const lines = wrapLines(ctx.font, item, SIZE.body, ctx.contentW - bulletW)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      ensureSpace(ctx, LINE.body)
      if (i === 0) {
        ctx.page.drawText(bullet, {
          x: ctx.contentX,
          y: ctx.y,
          size: SIZE.body,
          font: ctx.font,
          color: COLORS.accent,
        })
      }
      if (line) {
        ctx.page.drawText(line, {
          x: ctx.contentX + bulletW,
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

function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function checkedLabels(
  flags: Record<string, unknown> | undefined,
  labels: Record<string, string>,
): string[] {
  if (!flags) return []
  const parts: string[] = []
  for (const [key, label] of Object.entries(labels)) {
    if (flags[key] === true) parts.push(label)
  }
  for (const detailKey of [
    'outroDetalhe',
    'outraDetalhe',
    'outrosDetalhe',
    'outroAchadoDetalhe',
  ] as const) {
    const detail = flags[detailKey]
    if (typeof detail === 'string' && detail.trim()) parts.push(detail.trim())
  }
  return parts
}

/** Draw labeled field only when value is non-empty (Pitfall 7 / D-07). */
function drawOptionalField(
  ctx: DrawContext,
  label: string,
  value: string | number | null | undefined,
): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && !value.trim()) return false
  const text = String(value)
  if (text.length > 90 || text.includes('\n')) {
    drawNoteBox(ctx, label, text)
  } else {
    drawLabeledValue(ctx, label, text)
  }
  return true
}

function drawOptionalBullets(ctx: DrawContext, title: string, items: string[]): boolean {
  if (items.length === 0) return false
  ensureSpace(ctx, 18)
  ctx.page.drawText(toWinAnsiSafe(`${title}:`), {
    x: ctx.contentX,
    y: ctx.y,
    size: SIZE.label,
    font: ctx.bold,
    color: COLORS.navy,
  })
  ctx.y -= 12
  drawCheckboxRow(ctx, items)
  return true
}

/**
 * Soft info / caution callout (D-04.9). Never invents clinical text — caller passes filled notes only.
 */
function drawCalloutBanner(ctx: DrawContext, kind: 'info' | 'caution', text: string): void {
  const trimmed = text.trim()
  if (!trimmed) return

  const pad = 8
  const iconR = 6
  const iconGap = 8
  const textX = ctx.contentX + pad + iconR * 2 + iconGap
  const textMaxW = Math.max(40, ctx.contentW - pad * 2 - iconR * 2 - iconGap)
  const lines = wrapLines(ctx.font, trimmed, SIZE.body, textMaxW)
  const contentH = Math.max(iconR * 2, lines.length * LINE.body)
  const boxH = pad * 2 + contentH

  ensureSpace(ctx, boxH + 6)

  const fill = kind === 'caution' ? rgb(0xfd / 255, 0xee / 255, 0xee / 255) : COLORS.accentSoft
  const border = kind === 'caution' ? COLORS.danger : COLORS.border
  const ink = kind === 'caution' ? COLORS.danger : COLORS.navy
  const boxBottom = ctx.y - boxH + 4

  ctx.page.drawRectangle({
    x: ctx.contentX,
    y: boxBottom,
    width: ctx.contentW,
    height: boxH,
    color: fill,
    borderColor: border,
    borderWidth: 0.9,
  })

  const iconCx = ctx.contentX + pad + iconR
  const iconCy = boxBottom + boxH - pad - iconR
  ctx.page.drawCircle({
    x: iconCx,
    y: iconCy,
    size: iconR,
    borderColor: ink,
    borderWidth: 1,
    color: COLORS.white,
  })
  const iLabel = kind === 'caution' ? '!' : 'i'
  const iW = ctx.bold.widthOfTextAtSize(iLabel, 8)
  ctx.page.drawText(iLabel, {
    x: iconCx - iW / 2,
    y: iconCy - 3,
    size: 8,
    font: ctx.bold,
    color: ink,
  })

  let ty = boxBottom + boxH - pad - SIZE.body + 2
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: textX,
      y: ty,
      size: SIZE.body,
      font: ctx.font,
      color: COLORS.ink,
    })
    ty -= LINE.body
  }

  ctx.y = boxBottom - 8
}

/** Centered chapter title like "01 — ANAMNESE INICIAL" (TimesRomanBold + diamond — D-03). */
function drawPageBanner(ctx: DrawContext, title: string) {
  ensureSpace(ctx, 40)
  const safe = toWinAnsiSafe(title.toUpperCase())
  const size = 15
  const tw = ctx.timesBold.widthOfTextAtSize(safe, size)
  const cx = PAGE_WIDTH / 2

  // Decorative rule with center diamond (SVG path — rotated square look)
  const ruleY = ctx.y + 4
  ctx.page.drawLine({
    start: { x: MARGIN_X + 40, y: ruleY },
    end: { x: cx - 10, y: ruleY },
    thickness: 0.6,
    color: COLORS.border,
  })
  ctx.page.drawLine({
    start: { x: cx + 10, y: ruleY },
    end: { x: PAGE_WIDTH - MARGIN_X - 40, y: ruleY },
    thickness: 0.6,
    color: COLORS.border,
  })
  // Diamond: unit path centered at (cx, ruleY); drawSvgPath flips Y with positive scale
  ctx.page.drawSvgPath('M 0 -3.2 L 3.2 0 L 0 3.2 L -3.2 0 Z', {
    x: cx,
    y: ruleY,
    color: COLORS.navy,
  })

  ctx.y -= 16
  ctx.page.drawText(safe, {
    x: cx - tw / 2,
    y: ctx.y,
    size,
    font: ctx.timesBold,
    color: COLORS.navy,
  })
  ctx.y -= 20
}

function enumLabel(value: string | undefined, map: Record<string, string>): string | undefined {
  if (!value) return undefined
  return map[value] ?? value
}

/** Omitted set = all filled blocks (back-compat). */
function isFieldSelected(selected: ReadonlySet<PdfFieldId> | undefined, id: PdfFieldId): boolean {
  return selected === undefined || selected.has(id)
}

const BADGE = 16
const BLOCK_PAD = 10
const BLOCK_GAP = 14
const BLOCK_INNER = 12

function badgeColorForLetter(letter: string): RGB {
  const sageLetters = new Set(['B', 'D', 'F', 'H'])
  // Danger only via drawFichaBlockFrame opts.danger (Triagem 03.E) — never letter E alone
  return sageLetters.has(letter.toUpperCase()) ? COLORS.sage : COLORS.navy
}

/**
 * Lettered ficha block chrome (D-05): badge square + BLOCO X — TITLE + border.
 * pdf-lib has no borderRadius — straight rectangles only.
 */
function drawFichaBlockFrame(
  ctx: DrawContext,
  letter: string,
  title: string,
  bodyDraw: () => void,
  opts?: { danger?: boolean },
): void {
  ensureSpace(ctx, BADGE + 48)

  const pageAtStart = ctx.pageIndex
  const boxTop = ctx.y
  const badgeFill = opts?.danger ? COLORS.danger : badgeColorForLetter(letter)
  const borderCol = opts?.danger ? COLORS.danger : COLORS.border

  // Badge square
  ctx.page.drawRectangle({
    x: MARGIN_X + BLOCK_PAD,
    y: boxTop - BADGE,
    width: BADGE,
    height: BADGE,
    color: badgeFill,
  })
  const letterSafe = toWinAnsiSafe(letter.slice(0, 2))
  const lw = ctx.bold.widthOfTextAtSize(letterSafe, 10)
  ctx.page.drawText(letterSafe, {
    x: MARGIN_X + BLOCK_PAD + (BADGE - lw) / 2,
    y: boxTop - BADGE + 4,
    size: 10,
    font: ctx.bold,
    color: COLORS.white,
  })

  const header = toWinAnsiSafe(`BLOCO ${letter} — ${title}`.toUpperCase())
  ctx.page.drawText(header, {
    x: MARGIN_X + BLOCK_PAD + BADGE + 8,
    y: boxTop - BADGE + 4,
    size: SIZE.section,
    font: ctx.bold,
    color: badgeFill,
  })

  // Header rule under title
  ctx.page.drawLine({
    start: { x: MARGIN_X + BLOCK_PAD + BADGE + 8, y: boxTop - BADGE - 2 },
    end: { x: PAGE_WIDTH - MARGIN_X - BLOCK_PAD, y: boxTop - BADGE - 2 },
    thickness: 0.5,
    color: COLORS.border,
  })

  const prevX = ctx.contentX
  const prevW = ctx.contentW
  ctx.contentX = MARGIN_X + BLOCK_INNER
  ctx.contentW = CONTENT_WIDTH - BLOCK_INNER * 2
  ctx.y = boxTop - BADGE - BLOCK_PAD - 4

  bodyDraw()
  ctx.y -= BLOCK_PAD / 2

  ctx.contentX = prevX
  ctx.contentW = prevW

  if (ctx.pageIndex === pageAtStart) {
    const boxBottom = ctx.y
    const boxHeight = boxTop - boxBottom
    if (boxHeight > 8) {
      ctx.page.drawRectangle({
        x: MARGIN_X,
        y: boxBottom,
        width: CONTENT_WIDTH,
        height: boxHeight,
        borderColor: borderCol,
        borderWidth: 1.1,
      })
    }
  }

  ctx.y -= BLOCK_GAP
}

/**
 * Renders EvaluationFicha pages 01–04; omits empty/unselected blocks (D-02/D-03/D-05/D-07).
 */
function drawAvaliacao(ctx: DrawContext, input: PatientAiAvaliacaoPdfInput) {
  ctx.footerKind = 'ficha'
  drawPatientCard(ctx)

  const metaFields: Array<[string, string | undefined]> = [
    ['Nome da avaliação', input.evaluationTitle ?? undefined],
    ['Data da avaliação', input.performedOnLabel],
    ['Fisioterapeuta', input.therapistName ?? undefined],
  ]
  drawTwoColumnFields(ctx, metaFields)
  ctx.y -= 4

  const ficha = input.ficha
  const selected = input.selectedFieldIds
  let anyContent = false

  // —— 01 Anamnese ——
  const id = ficha.anamnese?.identificacao
  const queixa = ficha.anamnese?.queixa
  const historia = ficha.anamnese?.historiaAtual
  const tratamentos = ficha.anamnese?.tratamentos
  const pregresso = ficha.anamnese?.historicoPregresso

  const idFields: Array<[string, string | undefined]> = [
    ['Nome completo', id?.nomeCompleto],
    ['Data de nascimento', id?.dataNascimento],
    ['Naturalidade', id?.naturalidade],
    ['Gênero', id?.genero],
    ['Estado civil', id?.estadoCivil],
    ['Profissão', id?.profissao],
    ['Endereço residencial', id?.enderecoResidencial],
    ['Endereço profissional', id?.enderecoProfissional],
    ['Contato', id?.contato],
    ['Data da avaliação (ficha)', id?.dataAvaliacao],
  ]
  const hasId = idFields.some(([, v]) => textFilled(v))
  const ladoItems = checkedLabels(queixa?.lado as Record<string, unknown> | undefined, {
    direito: 'Direito',
    esquerdo: 'Esquerdo',
    bilateral: 'Bilateral',
    central: 'Central',
    naoSeAplica: 'Não se aplica',
  })
  const hasQueixa =
    textFilled(queixa?.oQueTrouxe) ||
    textFilled(queixa?.regiao) ||
    textFilled(queixa?.haQuantoTempo) ||
    ladoItems.length > 0

  const inicioItems = checkedLabels(historia?.inicio as Record<string, unknown> | undefined, {
    subito: 'Súbito',
    gradual: 'Gradual',
    aposTrauma: 'Após trauma',
    aposCirurgia: 'Após cirurgia',
    aposMudancaCarga: 'Após mudança de carga',
    semMecanismoClaro: 'Sem mecanismo claro',
  })
  const evolucaoItems = checkedLabels(historia?.evolucao as Record<string, unknown> | undefined, {
    melhorando: 'Melhorando',
    piorando: 'Piorando',
    estavel: 'Estável',
    oscilando: 'Oscilando',
  })
  const hasHistoria =
    inicioItems.length > 0 ||
    textFilled(historia?.dataAproxInicio) ||
    textFilled(historia?.comoComecou) ||
    evolucaoItems.length > 0 ||
    Boolean(historia?.jaAconteceuAntes) ||
    textFilled(historia?.jaAconteceuDetalhe)

  const tratamentoItems = checkedLabels(tratamentos as Record<string, unknown> | undefined, {
    fisio: 'Fisioterapia',
    medicamentos: 'Medicamentos',
    infiltracao: 'Infiltração',
    cirurgia: 'Cirurgia',
    imobilizacao: 'Imobilização',
    outro: 'Outro',
  })
  const exameItems = checkedLabels(
    tratamentos?.exames as Record<string, unknown> | undefined,
    {
      rx: 'RX',
      us: 'US',
      rm: 'RM',
      tc: 'TC',
      enmg: 'ENMG',
      outros: 'Outros',
    },
  )
  const hasTratamentos =
    tratamentoItems.length > 0 || exameItems.length > 0 || textFilled(tratamentos?.achados)

  const pregressoItems = checkedLabels(pregresso as Record<string, unknown> | undefined, {
    cirurgias: 'Cirurgias',
    fraturas: 'Fraturas',
    lesoesMsk: 'Lesões musculoesqueléticas',
    neuro: 'Neuro',
    cardio: 'Cardio',
    diabetes: 'Diabetes',
    cancer: 'Câncer',
    inflamatorioReuma: 'Inflamatório / reuma',
    outros: 'Outros',
  })
  const hasPregresso = pregressoItems.length > 0 || textFilled(pregresso?.observacoes)

  const show01A = hasId && isFieldSelected(selected, '01.A')
  const show01B = hasQueixa && isFieldSelected(selected, '01.B')
  const show01C = hasHistoria && isFieldSelected(selected, '01.C')
  const show01D = hasTratamentos && isFieldSelected(selected, '01.D')
  const show01E = hasPregresso && isFieldSelected(selected, '01.E')

  if (show01A || show01B || show01C || show01D || show01E) {
    anyContent = true
    drawPageBanner(ctx, '01 — Anamnese inicial')

    if (show01A) {
      drawFichaBlockFrame(ctx, 'A', 'Identificação', () => {
        drawTwoColumnFields(ctx, idFields)
      })
    }
    if (show01B) {
      drawFichaBlockFrame(ctx, 'B', 'Queixa principal', () => {
        drawOptionalField(ctx, 'O que trouxe você à fisioterapia', queixa?.oQueTrouxe)
        drawOptionalField(ctx, 'Principal região', queixa?.regiao)
        drawOptionalBullets(ctx, 'Lado', ladoItems)
        drawOptionalField(ctx, 'Há quanto tempo', queixa?.haQuantoTempo)
      })
    }
    if (show01C) {
      drawFichaBlockFrame(ctx, 'C', 'História atual', () => {
        drawOptionalBullets(ctx, 'Início', inicioItems)
        drawOptionalField(ctx, 'Data aproximada de início', historia?.dataAproxInicio)
        drawOptionalField(ctx, 'Descreva como começou', historia?.comoComecou)
        drawOptionalBullets(ctx, 'Evolução desde o início', evolucaoItems)
        drawOptionalField(
          ctx,
          'Já aconteceu antes',
          enumLabel(historia?.jaAconteceuAntes, { nao: 'Não', sim: 'Sim' }),
        )
        drawOptionalField(ctx, 'Se sim, quando/como', historia?.jaAconteceuDetalhe)
      })
    }
    if (show01D) {
      drawFichaBlockFrame(ctx, 'D', 'Tratamentos e investigações anteriores', () => {
        drawOptionalBullets(ctx, 'Tratamentos', tratamentoItems)
        drawOptionalBullets(ctx, 'Exames complementares', exameItems)
        drawOptionalField(ctx, 'Achados / informações relevantes', tratamentos?.achados)
      })
    }
    if (show01E) {
      drawFichaBlockFrame(ctx, 'E', 'Histórico pregresso resumido', () => {
        drawOptionalBullets(ctx, 'Condições', pregressoItems)
        drawOptionalField(ctx, 'Observações', pregresso?.observacoes)
      })
    }
  }

  // —— 02 Sintomas ——
  const sintomas = ficha.sintomas
  const marks = sintomas?.mapa?.marks ?? []
  const markLines = marks
    .map((mark) => {
      const region = FOCUS_REGIONS.find((r) => r.key === mark.regionKey)
      if (!region) return null
      const glyph = mark.symbol ? BODY_MAP_GLYPH[mark.symbol] ?? mark.symbol : ''
      return glyph ? `${region.label} (${glyph})` : region.label
    })
    .filter((line): line is string => Boolean(line))

  const caracteristicaItems = checkedLabels(
    sintomas?.caracteristica as Record<string, unknown> | undefined,
    {
      dor: 'Dor',
      rigidez: 'Rigidez',
      fraqueza: 'Fraqueza',
      parestesia: 'Parestesia',
      dormencia: 'Dormência',
      instabilidade: 'Instabilidade',
      travamento: 'Travamento',
      estalo: 'Estalo',
      edema: 'Edema',
      outro: 'Outro',
    },
  )
  const hasIntensidade =
    sintomas?.intensidade?.agora !== undefined ||
    sintomas?.intensidade?.melhor !== undefined ||
    sintomas?.intensidade?.pior !== undefined

  const periodoMap = { melhor: 'Melhor', igual: 'Igual', pior: 'Pior' }
  const has24h =
    Boolean(sintomas?.comportamento24h?.manha) ||
    Boolean(sintomas?.comportamento24h?.dia) ||
    Boolean(sintomas?.comportamento24h?.noite) ||
    Boolean(sintomas?.comportamento24h?.interfereSono) ||
    Boolean(sintomas?.comportamento24h?.acordaPorSintomas)

  const pioraItems = checkedLabels(sintomas?.piora as Record<string, unknown> | undefined, {
    caminhar: 'Caminhar',
    agachar: 'Agachar',
    deitar: 'Deitar',
    carregarPeso: 'Carregar peso',
    correr: 'Correr',
    sentar: 'Sentar',
    movimentoEspecifico: 'Movimento específico',
    trabalho: 'Trabalho',
    escadas: 'Escadas',
    permanecerEmPe: 'Permanecer em pé',
    esporte: 'Esporte',
    outro: 'Outro',
  })
  const hasPiora = pioraItems.length > 0 || textFilled(sintomas?.piora?.detalhe)

  const melhoraItems = checkedLabels(sintomas?.melhora as Record<string, unknown> | undefined, {
    repouso: 'Repouso',
    calor: 'Calor',
    exercicio: 'Exercício',
    movimento: 'Movimento',
    frio: 'Frio',
    mudancaPosicao: 'Mudança de posição',
    medicamento: 'Medicamento',
    outro: 'Outro',
  })
  const hasMelhora = melhoraItems.length > 0 || textFilled(sintomas?.melhora?.detalhe)

  const hasIrrit =
    Boolean(sintomas?.irritabilidade?.esforcoProvocar) ||
    Boolean(sintomas?.irritabilidade?.tempoVoltar)

  const show02A = markLines.length > 0 && isFieldSelected(selected, '02.A')
  const show02B = caracteristicaItems.length > 0 && isFieldSelected(selected, '02.B')
  const show02C = hasIntensidade && isFieldSelected(selected, '02.C')
  const show02D = has24h && isFieldSelected(selected, '02.D')
  const show02E = hasPiora && isFieldSelected(selected, '02.E')
  const show02F = hasMelhora && isFieldSelected(selected, '02.F')
  const show02G = hasIrrit && isFieldSelected(selected, '02.G')

  if (show02A || show02B || show02C || show02D || show02E || show02F || show02G) {
    anyContent = true
    drawPageBanner(ctx, '02 — Entenda o comportamento dos sintomas')

    if (show02A) {
      drawFichaBlockFrame(ctx, 'A', 'Mapa corporal', () => {
        drawBulletList(ctx, markLines)
      })
    }
    if (show02B) {
      drawFichaBlockFrame(ctx, 'B', 'Característica predominante', () => {
        drawOptionalBullets(ctx, 'Característica', caracteristicaItems)
      })
    }
    if (show02C) {
      drawFichaBlockFrame(ctx, 'C', 'Intensidade (0-10)', () => {
        drawOptionalField(ctx, 'Agora', sintomas?.intensidade?.agora)
        drawOptionalField(ctx, 'Melhor', sintomas?.intensidade?.melhor)
        drawOptionalField(ctx, 'Pior', sintomas?.intensidade?.pior)
      })
    }
    if (show02D) {
      drawFichaBlockFrame(ctx, 'D', 'Comportamento em 24 horas', () => {
        drawOptionalField(
          ctx,
          'Manhã',
          enumLabel(sintomas?.comportamento24h?.manha, periodoMap),
        )
        drawOptionalField(ctx, 'Dia', enumLabel(sintomas?.comportamento24h?.dia, periodoMap))
        drawOptionalField(ctx, 'Noite', enumLabel(sintomas?.comportamento24h?.noite, periodoMap))
        drawOptionalField(
          ctx,
          'Interfere no sono',
          enumLabel(sintomas?.comportamento24h?.interfereSono, { nao: 'Não', sim: 'Sim' }),
        )
        drawOptionalField(
          ctx,
          'Acorda por sintomas',
          enumLabel(sintomas?.comportamento24h?.acordaPorSintomas, { nao: 'Não', sim: 'Sim' }),
        )
      })
    }
    if (show02E) {
      drawFichaBlockFrame(ctx, 'E', 'O que piora', () => {
        drawOptionalBullets(ctx, 'Fatores', pioraItems)
        drawOptionalField(ctx, 'Detalhe', sintomas?.piora?.detalhe)
      })
    }
    if (show02F) {
      drawFichaBlockFrame(ctx, 'F', 'O que melhora', () => {
        drawOptionalBullets(ctx, 'Fatores', melhoraItems)
        drawOptionalField(ctx, 'Detalhe', sintomas?.melhora?.detalhe)
      })
    }
    if (show02G) {
      drawFichaBlockFrame(ctx, 'G', 'Irritabilidade / resposta', () => {
        drawOptionalField(
          ctx,
          'Esforço para provocar',
          enumLabel(sintomas?.irritabilidade?.esforcoProvocar, {
            pouco: 'Pouco',
            moderado: 'Moderado',
            muito: 'Muito',
            variavel: 'Variável',
          }),
        )
        drawOptionalField(
          ctx,
          'Tempo para voltar',
          enumLabel(sintomas?.irritabilidade?.tempoVoltar, {
            minutos: 'Minutos',
            horas: 'Horas',
            ateDiaSeguinte: 'Até o dia seguinte',
            maisDe24h: 'Mais de 24 h',
            variavel: 'Variável',
          }),
        )
      })
    }
  }

  // —— 03 Função ——
  const funcao = ficha.funcao
  const hasLimit =
    textFilled(funcao?.limitacaoFuncional?.item1) ||
    textFilled(funcao?.limitacaoFuncional?.item2) ||
    textFilled(funcao?.limitacaoFuncional?.item3)

  const atividadeItems = checkedLabels(
    funcao?.atividadesAfetadas as Record<string, unknown> | undefined,
    {
      caminhar: 'Caminhar',
      correr: 'Correr',
      escadas: 'Escadas',
      agachar: 'Agachar',
      sentar: 'Sentar',
      levantar: 'Levantar',
      dormir: 'Dormir',
      dirigir: 'Dirigir',
      trabalhar: 'Trabalhar',
      estudar: 'Estudar',
      cuidarCasa: 'Cuidar da casa',
      vestirSe: 'Vestir-se',
      esporte: 'Esporte',
      lazer: 'Lazer',
      autocuidado: 'Autocuidado',
      outra: 'Outra',
    },
  )
  const hasAtividades =
    atividadeItems.length > 0 ||
    textFilled(funcao?.atividadesAfetadas?.capacidadeAtual) ||
    textFilled(funcao?.atividadesAfetadas?.atividade) ||
    textFilled(funcao?.atividadesAfetadas?.consigoPor) ||
    textFilled(funcao?.atividadesAfetadas?.antesConseguiaPor)

  const trabalhoItems = checkedLabels(
    funcao?.rotina?.trabalho as Record<string, unknown> | undefined,
    {
      sentado: 'Sentado',
      emPe: 'Em pé',
      manual: 'Manual',
      repetitivo: 'Repetitivo',
      cargaElevada: 'Carga elevada',
      variavel: 'Variável',
    },
  )
  const hasRotina =
    trabalhoItems.length > 0 ||
    textFilled(funcao?.rotina?.horasDia) ||
    Boolean(funcao?.rotina?.praticaAtividadeFisica) ||
    textFilled(funcao?.rotina?.atividadeQualFreq)

  const objetivoItems = checkedLabels(
    funcao?.expectativas?.objetivos as Record<string, unknown> | undefined,
    {
      reduzirSintomas: 'Reduzir sintomas',
      recuperarMovimento: 'Recuperar movimento',
      recuperarForca: 'Recuperar força',
      voltarTrabalho: 'Voltar ao trabalho',
      voltarEsporte: 'Voltar ao esporte',
      recuperarIndependencia: 'Recuperar independência',
      dormirMelhor: 'Dormir melhor',
      outro: 'Outro',
    },
  )
  const hasExpect =
    textFilled(funcao?.expectativas?.boaMelhora) || objetivoItems.length > 0

  const redFlagItems = checkedLabels(
    funcao?.triagemSeguranca as Record<string, unknown> | undefined,
    {
      traumaRecente: 'Trauma recente',
      febreMalEstar: 'Febre / mal-estar',
      perdaPeso: 'Perda de peso',
      historicoCancer: 'Histórico de câncer',
      deficitNeuro: 'Déficit neurológico',
      alteracaoBexigaIntestino: 'Alteração bexiga/intestino',
      alteracaoSensitivaPerineal: 'Alteração sensitiva perineal',
      dorToracica: 'Dor torácica',
      dispneia: 'Dispneia',
      sinaisPosOp: 'Sinais pós-operatórios',
      outroAchado: 'Outro achado',
    },
  )
  const condutaItems = checkedLabels(
    funcao?.triagemSeguranca?.conduta as Record<string, unknown> | undefined,
    {
      avalieiDocumentei: 'Avaliei e documentei',
      precisoInvestigar: 'Preciso investigar',
      encaminhamento: 'Encaminhamento',
      urgencia: 'Urgência',
      naoSeAplica: 'Não se aplica',
    },
  )
  const hasTriagem =
    redFlagItems.length > 0 ||
    condutaItems.length > 0 ||
    textFilled(funcao?.triagemSeguranca?.observacoes)

  const hasMeds =
    textFilled(funcao?.medicacoes?.medicamentos) ||
    textFilled(funcao?.medicacoes?.alergias) ||
    textFilled(funcao?.medicacoes?.outrasInfo)

  const show03A = hasLimit && isFieldSelected(selected, '03.A')
  const show03B = hasAtividades && isFieldSelected(selected, '03.B')
  const show03C = hasRotina && isFieldSelected(selected, '03.C')
  const show03D = hasExpect && isFieldSelected(selected, '03.D')
  const show03E = hasTriagem && isFieldSelected(selected, '03.E')
  const show03F = hasMeds && isFieldSelected(selected, '03.F')

  if (show03A || show03B || show03C || show03D || show03E || show03F) {
    anyContent = true
    drawPageBanner(ctx, '03 — Função, contexto e segurança')

    if (show03A) {
      drawFichaBlockFrame(ctx, 'A', 'Principal limitação funcional', () => {
        drawOptionalField(ctx, 'Item 1', funcao?.limitacaoFuncional?.item1)
        drawOptionalField(ctx, 'Item 2', funcao?.limitacaoFuncional?.item2)
        drawOptionalField(ctx, 'Item 3', funcao?.limitacaoFuncional?.item3)
      })
    }
    if (show03B) {
      drawFichaBlockFrame(ctx, 'B', 'Atividades afetadas', () => {
        drawOptionalBullets(ctx, 'Atividades', atividadeItems)
        drawOptionalField(ctx, 'Capacidade atual', funcao?.atividadesAfetadas?.capacidadeAtual)
        drawOptionalField(ctx, 'Atividade', funcao?.atividadesAfetadas?.atividade)
        drawOptionalField(ctx, 'Consigo por', funcao?.atividadesAfetadas?.consigoPor)
        drawOptionalField(ctx, 'Antes conseguia por', funcao?.atividadesAfetadas?.antesConseguiaPor)
      })
    }
    if (show03C) {
      drawFichaBlockFrame(ctx, 'C', 'Rotina e demanda', () => {
        drawOptionalBullets(ctx, 'Trabalho', trabalhoItems)
        drawOptionalField(ctx, 'Horas/dia', funcao?.rotina?.horasDia)
        drawOptionalField(
          ctx,
          'Pratica atividade física',
          enumLabel(funcao?.rotina?.praticaAtividadeFisica, { nao: 'Não', sim: 'Sim' }),
        )
        drawOptionalField(ctx, 'Qual / frequência', funcao?.rotina?.atividadeQualFreq)
      })
    }
    if (show03D) {
      drawFichaBlockFrame(ctx, 'D', 'Expectativas e objetivos', () => {
        drawOptionalField(ctx, 'Boa melhora', funcao?.expectativas?.boaMelhora)
        drawOptionalBullets(ctx, 'Objetivos principais', objetivoItems)
      })
    }
    if (show03E) {
      drawFichaBlockFrame(
        ctx,
        'E',
        'Triagem de segurança',
        () => {
          drawOptionalBullets(ctx, 'Sinais de alerta', redFlagItems)
          drawOptionalBullets(ctx, 'Conduta', condutaItems)
          const observacoes = funcao?.triagemSeguranca?.observacoes
          if (textFilled(observacoes)) {
            drawCalloutBanner(ctx, 'caution', String(observacoes))
          }
        },
        { danger: true },
      )
    }
    if (show03F) {
      drawFichaBlockFrame(ctx, 'F', 'Medicações / outras informações', () => {
        drawOptionalField(ctx, 'Medicamentos', funcao?.medicacoes?.medicamentos)
        drawOptionalField(ctx, 'Alergias', funcao?.medicacoes?.alergias)
        drawOptionalField(ctx, 'Outras informações', funcao?.medicacoes?.outrasInfo)
      })
    }
  }

  // —— 04 Avaliação e plano ——
  const plano = ficha.avaliacaoPlano
  const inspecaoItems = checkedLabels(plano?.inspecao as Record<string, unknown> | undefined, {
    marcha: 'Marcha',
    postura: 'Postura',
    edema: 'Edema',
    equimose: 'Equimose',
    atrofia: 'Atrofia',
    assimetria: 'Assimetria',
    compensacoes: 'Compensações',
    outro: 'Outro',
  })
  const hasInspecao = inspecaoItems.length > 0 || textFilled(plano?.inspecao?.achados)

  const mobFlags = checkedLabels(plano?.mobilidade as Record<string, unknown> | undefined, {
    ativo: 'Ativo',
    passivo: 'Passivo',
    bilateral: 'Bilateral',
  })
  const mobRows = (plano?.mobilidade?.linhas ?? []).filter(
    (row) =>
      textFilled(row.movimento) ||
      textFilled(row.direito) ||
      textFilled(row.esquerdo) ||
      textFilled(row.dor) ||
      textFilled(row.observacao),
  )
  const hasMob = mobFlags.length > 0 || mobRows.length > 0

  const forcaRows = (plano?.forca?.linhas ?? []).filter(
    (row) =>
      textFilled(row.grupo) ||
      textFilled(row.direito) ||
      textFilled(row.esquerdo) ||
      textFilled(row.dor) ||
      textFilled(row.observacao),
  )

  const neuroItems = checkedLabels(plano?.neurologico as Record<string, unknown> | undefined, {
    sensibilidade: 'Sensibilidade',
    miotomos: 'Miotomos',
    reflexos: 'Reflexos',
    neurodinamica: 'Neurodinâmica',
    coordenacao: 'Coordenação',
    outro: 'Outro',
  })
  const hasNeuro = neuroItems.length > 0 || textFilled(plano?.neurologico?.achados)

  const hasPalp =
    textFilled(plano?.palpacaoTestes?.palpacao) ||
    textFilled(plano?.palpacaoTestes?.testesClinicos) ||
    textFilled(plano?.palpacaoTestes?.resultados) ||
    textFilled(plano?.palpacaoTestes?.testeFuncional) ||
    textFilled(plano?.palpacaoTestes?.resultadoInicial)

  const hasSintese =
    textFilled(plano?.sintese?.problema1) ||
    textFilled(plano?.sintese?.problema2) ||
    textFilled(plano?.sintese?.problema3) ||
    textFilled(plano?.sintese?.diagnosticoFisio) ||
    textFilled(plano?.sintese?.prognostico)

  const hasObj =
    textFilled(plano?.objetivos?.curto1) ||
    textFilled(plano?.objetivos?.curto2) ||
    textFilled(plano?.objetivos?.medioLongo1) ||
    textFilled(plano?.objetivos?.medioLongo2)

  const planItems = checkedLabels(plano?.planejamento as Record<string, unknown> | undefined, {
    educacao: 'Educação',
    exercicioTerapeutico: 'Exercício terapêutico',
    treinoFuncional: 'Treino funcional',
    terapiaManual: 'Terapia manual',
    exposicaoCarga: 'Exposição à carga',
    autocuidado: 'Autocuidado',
    outro: 'Outro',
  })
  const hasPlan =
    planItems.length > 0 ||
    textFilled(plano?.planejamento?.frequencia) ||
    textFilled(plano?.planejamento?.qtdAtendimentos) ||
    textFilled(plano?.planejamento?.criteriosProgressao) ||
    textFilled(plano?.planejamento?.criteriosReavaliacao) ||
    Boolean(plano?.planejamento?.encaminhamento) ||
    textFilled(plano?.planejamento?.encaminhamentoDetalhe)

  const hasProf =
    textFilled(plano?.profissional?.fisioterapeuta) ||
    textFilled(plano?.profissional?.crefito) ||
    textFilled(plano?.profissional?.data) ||
    textFilled(plano?.profissional?.assinatura)

  const show04A = hasInspecao && isFieldSelected(selected, '04.A')
  const show04B = hasMob && isFieldSelected(selected, '04.B')
  const show04C = forcaRows.length > 0 && isFieldSelected(selected, '04.C')
  const show04D = hasNeuro && isFieldSelected(selected, '04.D')
  const show04E = hasPalp && isFieldSelected(selected, '04.E')
  const show04F = hasSintese && isFieldSelected(selected, '04.F')
  const show04G = hasObj && isFieldSelected(selected, '04.G')
  const show04H = hasPlan && isFieldSelected(selected, '04.H')
  const show04ID = hasProf && isFieldSelected(selected, '04.ID')

  if (
    show04A ||
    show04B ||
    show04C ||
    show04D ||
    show04E ||
    show04F ||
    show04G ||
    show04H ||
    show04ID
  ) {
    anyContent = true
    drawPageBanner(ctx, '04 — Avaliação e plano fisioterapêutico')

    if (show04A) {
      drawFichaBlockFrame(ctx, 'A', 'Inspeção / observação', () => {
        drawOptionalBullets(ctx, 'Achados observados', inspecaoItems)
        drawOptionalField(ctx, 'Achados', plano?.inspecao?.achados)
      })
    }
    if (show04B) {
      drawFichaBlockFrame(ctx, 'B', 'Mobilidade', () => {
        drawOptionalBullets(ctx, 'Modo', mobFlags)
        for (const row of mobRows) {
          const parts = [
            row.movimento,
            row.direito ? `D: ${row.direito}` : null,
            row.esquerdo ? `E: ${row.esquerdo}` : null,
            row.dor ? `Dor: ${row.dor}` : null,
            row.observacao ? `Obs: ${row.observacao}` : null,
          ].filter((p): p is string => Boolean(p && String(p).trim()))
          if (parts.length > 0) drawParagraph(ctx, parts.join(' · '))
        }
      })
    }
    if (show04C) {
      drawFichaBlockFrame(ctx, 'C', 'Força', () => {
        for (const row of forcaRows) {
          const parts = [
            row.grupo,
            row.direito ? `D: ${row.direito}` : null,
            row.esquerdo ? `E: ${row.esquerdo}` : null,
            row.dor ? `Dor: ${row.dor}` : null,
            row.observacao ? `Obs: ${row.observacao}` : null,
          ].filter((p): p is string => Boolean(p && String(p).trim()))
          if (parts.length > 0) drawParagraph(ctx, parts.join(' · '))
        }
      })
    }
    if (show04D) {
      drawFichaBlockFrame(ctx, 'D', 'Avaliação neurológica', () => {
        drawOptionalBullets(ctx, 'Itens', neuroItems)
        drawOptionalField(ctx, 'Achados', plano?.neurologico?.achados)
      })
    }
    if (show04E) {
      drawFichaBlockFrame(ctx, 'E', 'Palpação / testes / função', () => {
        drawOptionalField(ctx, 'Palpação', plano?.palpacaoTestes?.palpacao)
        drawOptionalField(ctx, 'Testes clínicos', plano?.palpacaoTestes?.testesClinicos)
        drawOptionalField(ctx, 'Resultados', plano?.palpacaoTestes?.resultados)
        drawOptionalField(ctx, 'Teste funcional', plano?.palpacaoTestes?.testeFuncional)
        drawOptionalField(ctx, 'Resultado inicial', plano?.palpacaoTestes?.resultadoInicial)
      })
    }
    if (show04F) {
      drawFichaBlockFrame(ctx, 'F', 'Síntese dos principais achados', () => {
        drawOptionalField(ctx, 'Problema 1', plano?.sintese?.problema1)
        drawOptionalField(ctx, 'Problema 2', plano?.sintese?.problema2)
        drawOptionalField(ctx, 'Problema 3', plano?.sintese?.problema3)
        drawOptionalField(ctx, 'Diagnóstico fisioterapêutico', plano?.sintese?.diagnosticoFisio)
        drawOptionalField(ctx, 'Prognóstico', plano?.sintese?.prognostico)
      })
    }
    if (show04G) {
      drawFichaBlockFrame(ctx, 'G', 'Objetivos', () => {
        drawOptionalField(ctx, 'Curto prazo 1', plano?.objetivos?.curto1)
        drawOptionalField(ctx, 'Curto prazo 2', plano?.objetivos?.curto2)
        drawOptionalField(ctx, 'Médio/longo 1', plano?.objetivos?.medioLongo1)
        drawOptionalField(ctx, 'Médio/longo 2', plano?.objetivos?.medioLongo2)
      })
    }
    if (show04H) {
      drawFichaBlockFrame(ctx, 'H', 'Planejamento', () => {
        drawOptionalBullets(ctx, 'Condutas', planItems)
        drawOptionalField(ctx, 'Frequência', plano?.planejamento?.frequencia)
        drawOptionalField(ctx, 'Qtd. atendimentos', plano?.planejamento?.qtdAtendimentos)
        drawOptionalField(ctx, 'Critérios de progressão', plano?.planejamento?.criteriosProgressao)
        drawOptionalField(ctx, 'Critérios de reavaliação', plano?.planejamento?.criteriosReavaliacao)
        drawOptionalField(
          ctx,
          'Encaminhamento',
          enumLabel(plano?.planejamento?.encaminhamento, { nao: 'Não', sim: 'Sim' }),
        )
        drawOptionalField(ctx, 'Encaminhamento — detalhe', plano?.planejamento?.encaminhamentoDetalhe)
      })
    }
    if (show04ID) {
      drawFichaBlockFrame(ctx, 'ID', 'Identificação profissional', () => {
        drawOptionalField(ctx, 'Fisioterapeuta', plano?.profissional?.fisioterapeuta)
        drawOptionalField(ctx, 'CREFITO', plano?.profissional?.crefito)
        drawOptionalField(ctx, 'Data', plano?.profissional?.data)
        drawOptionalField(ctx, 'Assinatura', plano?.profissional?.assinatura)
      })
    }
  }

  if (!anyContent) {
    drawParagraph(ctx, 'Avaliação sem campos preenchidos na ficha.', { color: COLORS.muted })
  }
}

const EVO_SOAP_FIELDS: Array<{
  key:
    | 'patientState'
    | 'changesSinceLast'
    | 'conducts'
    | 'treatmentResponse'
    | 'incidents'
    | 'nextPlan'
  idSuffix: string
  label: string
}> = [
  { key: 'patientState', idSuffix: 'patientState', label: 'Estado do paciente' },
  { key: 'changesSinceLast', idSuffix: 'changesSinceLast', label: 'Mudanças desde a última' },
  { key: 'conducts', idSuffix: 'conducts', label: 'Condutas' },
  { key: 'treatmentResponse', idSuffix: 'treatmentResponse', label: 'Resposta ao tratamento' },
  { key: 'incidents', idSuffix: 'incidents', label: 'Intercorrências' },
  { key: 'nextPlan', idSuffix: 'nextPlan', label: 'Plano seguinte' },
]

/**
 * Multi-session evolução PDF (D-04/D-05): SOAP leaves + AI sections when selected ∩ filled.
 * Never invents clinical or AI text — empty/unselected omitted (REQ-25.6).
 */
function drawEvolucao(ctx: DrawContext, input: PatientAiEvolucaoPdfInput) {
  drawPatientCard(ctx)
  drawOptionalField(ctx, 'Sessões', input.sessionLabel)

  const selected = input.selectedFieldIds
  let anyContent = false

  for (const session of input.sessions) {
    const evo = session.evolution
    if (!evo) continue

    const fields = EVO_SOAP_FIELDS.filter((field) => {
      const value = evo[field.key]
      if (!textFilled(value)) return false
      const id = `evo.session.${session.id}.${field.idSuffix}`
      return isFieldSelected(selected, id)
    })

    if (fields.length === 0) continue

    anyContent = true
    const when =
      [session.dateLabel, session.timeLabel].filter(Boolean).join(' · ') || session.dateLabel
    drawPageBanner(ctx, when || `Sessão ${session.id}`)

    for (const field of fields) {
      drawOptionalField(ctx, field.label, evo[field.key])
    }
  }

  const aiBlocks: Array<{
    id: PdfFieldId
    letter: string
    title: string
    value: string | undefined
  }> = [
    { id: 'evo.ai.sintese', letter: 'A', title: 'Síntese clínica', value: input.synthesis.sintese },
    { id: 'evo.ai.tendencias', letter: 'B', title: 'Tendências', value: input.synthesis.tendencias },
    {
      id: 'evo.ai.condutasAgregadas',
      letter: 'C',
      title: 'Condutas agregadas',
      value: input.synthesis.condutasAgregadas,
    },
    { id: 'evo.ai.alertas', letter: 'D', title: 'Alertas', value: input.synthesis.alertas },
  ]

  const aiToDraw = aiBlocks.filter(
    (block) => textFilled(block.value) && isFieldSelected(selected, block.id),
  )

  if (aiToDraw.length > 0) {
    anyContent = true
    drawPageBanner(ctx, 'Síntese IA')
    for (const block of aiToDraw) {
      const text = block.value as string
      drawFichaBlockFrame(ctx, block.letter, block.title, () => {
        drawParagraph(ctx, text)
      })
    }
  }

  if (!anyContent) {
    drawParagraph(ctx, 'Nenhum campo selecionado para exportar.', { color: COLORS.muted })
  }
}

function docTitleFor(input: BuildPatientAiReportPdfInput): string {
  if (input.kind === 'geral') return 'Avaliação geral'
  if (input.kind === 'sessao') return 'Avaliação por sessão'
  if (input.kind === 'evolucao') return 'Evolução clínica'
  const named = input.evaluationTitle?.trim()
  return named || 'Avaliação musculoesquelética'
}

/**
 * Builds deterministic PDF bytes for kind geral | sessao | avaliacao | evolucao (D-05, D-07).
 * Brand layout: FLUXO logo + accent/forest palette — no Gemini.
 */
export async function buildPatientAiReportPdf(input: BuildPatientAiReportPdfInput): Promise<Blob> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold)

  const logoBytes = await fetch(logoUrl).then((r) => {
    if (!r.ok) throw new Error('Não foi possível carregar a logo FLUXO.')
    return r.arrayBuffer()
  })
  const logo = await doc.embedPng(logoBytes)

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const generatedAt = formatGeneratedAt()
  const docTitle = docTitleFor(input)
  const patientLine = `${input.name}  ·  ${input.code}`

  const ctx: DrawContext = {
    doc,
    page,
    font,
    bold,
    timesBold,
    logo,
    y: PAGE_HEIGHT,
    pageIndex: 1,
    docTitle,
    patientLine,
    generatedAt,
    contentX: MARGIN_X,
    contentW: CONTENT_WIDTH,
    footerKind: input.kind === 'avaliacao' || input.kind === 'evolucao' ? 'ficha' : 'fluxo',
  }

  drawHeaderBand(ctx, { isFirstPage: true })

  if (input.kind === 'geral') {
    drawGeral(ctx, input)
  } else if (input.kind === 'sessao') {
    drawSessao(ctx, input)
  } else if (input.kind === 'evolucao') {
    ctx.footerKind = 'ficha'
    drawEvolucao(ctx, input)
  } else {
    drawAvaliacao(ctx, input)
  }

  drawFooter(ctx)

  const bytes = await doc.save()
  return new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
}
