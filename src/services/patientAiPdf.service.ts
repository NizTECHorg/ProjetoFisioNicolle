import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib'
import type { PatientGoal, PatientFocusArea, SessionEvolution } from '@/types/patient'

const MARGIN = 50
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const LINE_HEIGHT = 14
const TITLE_SIZE = 16
const HEADING_SIZE = 12
const BODY_SIZE = 10
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2

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
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '?')
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
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
  }

  return lines.length > 0 ? lines : ['—']
}

type DrawContext = {
  doc: PDFDocument
  page: PDFPage
  font: PDFFont
  bold: PDFFont
  y: number
}

function ensureSpace(ctx: DrawContext, needed: number) {
  if (ctx.y - needed >= MARGIN) return
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.y = PAGE_HEIGHT - MARGIN
}

function drawTitle(ctx: DrawContext, title: string) {
  ensureSpace(ctx, TITLE_SIZE + 8)
  ctx.page.drawText(toWinAnsiSafe(title), {
    x: MARGIN,
    y: ctx.y,
    size: TITLE_SIZE,
    font: ctx.bold,
  })
  ctx.y -= TITLE_SIZE + 12
}

function drawHeading(ctx: DrawContext, heading: string) {
  ensureSpace(ctx, HEADING_SIZE + 6)
  ctx.page.drawText(toWinAnsiSafe(heading), {
    x: MARGIN,
    y: ctx.y,
    size: HEADING_SIZE,
    font: ctx.bold,
  })
  ctx.y -= HEADING_SIZE + 8
}

function drawParagraph(ctx: DrawContext, text: string, size = BODY_SIZE) {
  const lines = wrapLines(ctx.font, text, size, MAX_WIDTH)
  for (const line of lines) {
    ensureSpace(ctx, LINE_HEIGHT)
    if (line) {
      ctx.page.drawText(line, {
        x: MARGIN,
        y: ctx.y,
        size,
        font: ctx.font,
      })
    }
    ctx.y -= LINE_HEIGHT
  }
  ctx.y -= 4
}

function drawField(ctx: DrawContext, label: string, value: string) {
  drawHeading(ctx, label)
  drawParagraph(ctx, value || '—')
}

function drawGeral(ctx: DrawContext, input: PatientAiGeralPdfInput) {
  drawTitle(ctx, 'Avaliação geral')
  drawField(ctx, 'Paciente', `${input.name} (${input.code})`)
  drawField(ctx, 'Queixa', input.complaint)
  drawField(ctx, 'Diagnóstico', input.diagnosis)
  drawField(ctx, 'Programa', input.program)
  drawField(ctx, 'EVA', String(input.eva))

  const goalLines =
    input.goals.length === 0
      ? 'Nenhuma meta registrada.'
      : input.goals.map((g) => `- ${g.title} [${g.isDone ? 'concluído' : 'em andamento'}]`).join('\n')
  drawField(ctx, 'Metas', goalLines)

  const focusLines =
    input.focusAreas.filter((f) => f.isActive).length === 0
      ? 'Nenhuma área de foco ativa.'
      : input.focusAreas
          .filter((f) => f.isActive)
          .map((f) => `- ${f.label}`)
          .join('\n')
  drawField(ctx, 'Áreas de foco', focusLines)

  drawField(ctx, 'Resumo IA', input.aiSummary || '—')
  if (input.evolutionHighlights?.trim()) {
    drawField(ctx, 'Destaques de evolução', input.evolutionHighlights)
  }
}

function drawSessao(ctx: DrawContext, input: PatientAiSessaoPdfInput) {
  drawTitle(ctx, `Sessão ${input.sessionLabel}`)
  drawField(ctx, 'Paciente', `${input.name} (${input.code})`)
  if (input.sessionDateLabel || input.sessionTimeLabel) {
    drawField(
      ctx,
      'Data/hora',
      [input.sessionDateLabel, input.sessionTimeLabel].filter(Boolean).join(' · ') || input.sessionLabel,
    )
  }

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
 * No Gemini — layout only from already-readable clinical snapshot.
 */
export async function buildPatientAiReportPdf(input: BuildPatientAiReportPdfInput): Promise<Blob> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const ctx: DrawContext = {
    doc,
    page,
    font,
    bold,
    y: PAGE_HEIGHT - MARGIN,
  }

  if (input.kind === 'geral') {
    drawGeral(ctx, input)
  } else {
    drawSessao(ctx, input)
  }

  const bytes = await doc.save()
  return new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' })
}