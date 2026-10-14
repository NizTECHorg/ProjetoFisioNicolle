import { evaluationFichaSchema, type EvaluationFicha } from '../schemas/evaluationFicha.schema.ts'

// REQ-45. A garantia de "não inventar" vem deste código determinístico, não do prompt.
// A região abaixo é copiada literalmente para a Edge Function patient-ai-summary (plano 34-03):
// sem imports, sem referência a Node/Deno/DOM.

// <avaliacao-ia-core>
export type AvaliacaoIaKind = 'T' | 'B' | 'N'
export type AvaliacaoIaSpec = {
  kind: AvaliacaoIaKind
  max?: number
  sources: readonly string[]
  pattern?: RegExp
  context?: RegExp
}
export type AvaliacaoIaBlock = { id: string; text: string }
export type AvaliacaoIaItem = { path: string; value: string | number | boolean; evidence: string }

export const AVALIACAO_IA_MAX_ITEMS = 60
export const AVALIACAO_IA_MIN_EVIDENCE = 6
export const DIAGNOSTICO_FISIO_MAX = 4000

const SIDE_SOURCES = ['CADASTRO.', 'RESUMO.', 'FOCO.', 'SESSAO.']

// Allowlist fechada. Fora dela por decisão: caixinhas de doenças (historicoPregresso.*),
// sintomas.intensidade.agora (vem do último registro de dor, sem IA), triagem, medidas e testes.
export const AVALIACAO_IA_ALLOWLIST: Readonly<Record<string, AvaliacaoIaSpec>> = {
  'anamnese.queixa.oQueTrouxe': { kind: 'T', max: 4000, sources: ['RESUMO.', 'SESSAO.'] },
  'anamnese.queixa.regiao': { kind: 'T', max: 200, sources: ['CADASTRO.', 'RESUMO.', 'FOCO.'] },
  'anamnese.queixa.haQuantoTempo': {
    kind: 'T',
    max: 200,
    sources: ['CADASTRO.', 'RESUMO.', 'SESSAO.'],
    pattern: /\bha\b|\b\d+ (dias?|semanas?|mes|meses|anos?)\b/,
  },
  'anamnese.historiaAtual.comoComecou': { kind: 'T', max: 4000, sources: ['CADASTRO.', 'RESUMO.'] },
  'anamnese.historiaAtual.dataAproxInicio': {
    kind: 'T',
    max: 80,
    sources: ['CADASTRO.', 'RESUMO.'],
    pattern:
      /\d|\b(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b|\bha\b/,
  },
  'anamnese.tratamentos.achados': {
    kind: 'T',
    max: 4000,
    sources: ['CADASTRO.', 'RESUMO.', 'SESSAO.'],
    pattern:
      /\b(rx|raio x|radiografia|ressonancia|rm|ultrass\w*|ultrassom|usg|tomografia|tc|exames?|laudo|eletroneuro\w*|enmg)\b/,
  },
  'anamnese.historicoPregresso.observacoes': {
    kind: 'T',
    max: 4000,
    sources: ['CADASTRO.', 'RESUMO.', 'ALERTA.'],
    pattern: /historico|previ|anterior|cirurgi|fratur|antecedente|lesao antiga/,
  },
  'sintomas.piora.detalhe': {
    kind: 'T',
    max: 2000,
    sources: ['RESUMO.', 'SESSAO.'],
    pattern: /piora|agrava|aument|pior/,
  },
  'sintomas.melhora.detalhe': {
    kind: 'T',
    max: 2000,
    sources: ['RESUMO.', 'SESSAO.'],
    pattern: /melhora|alivi|reduz|melhor/,
  },
  'funcao.limitacaoFuncional.item1': {
    kind: 'T',
    max: 1000,
    sources: ['RESUMO.', 'SESSAO.'],
    pattern: /limit|dificuldade|nao consegue|impede|incapaz/,
  },
  'funcao.limitacaoFuncional.item2': {
    kind: 'T',
    max: 1000,
    sources: ['RESUMO.', 'SESSAO.'],
    pattern: /limit|dificuldade|nao consegue|impede|incapaz/,
  },
  'funcao.limitacaoFuncional.item3': {
    kind: 'T',
    max: 1000,
    sources: ['RESUMO.', 'SESSAO.'],
    pattern: /limit|dificuldade|nao consegue|impede|incapaz/,
  },
  'funcao.rotina.atividadeQualFreq': {
    kind: 'T',
    max: 400,
    sources: ['RESUMO.', 'SESSAO.'],
    pattern:
      /vezes|semana|diari|pratica|treina|academia|musculacao|corrida|caminhada|natacao|pilates|futebol|esporte/,
  },
  'funcao.expectativas.boaMelhora': {
    kind: 'T',
    max: 4000,
    sources: ['RESUMO.'],
    pattern: /espera|objetivo|quer|deseja|meta|voltar a/,
  },
  'funcao.medicacoes.medicamentos': {
    kind: 'T',
    max: 4000,
    sources: ['CADASTRO.', 'RESUMO.', 'ALERTA.', 'SESSAO.'],
    pattern: /medica|remedio|uso de|toma|anti inflamat|analges/,
  },
  'funcao.medicacoes.alergias': {
    kind: 'T',
    max: 2000,
    sources: ['CADASTRO.', 'RESUMO.', 'ALERTA.'],
    pattern: /alergi|alergic/,
  },
  'anamnese.queixa.lado.direito': { kind: 'B', sources: SIDE_SOURCES, pattern: /\bdireit[oa]\b/ },
  'anamnese.queixa.lado.esquerdo': { kind: 'B', sources: SIDE_SOURCES, pattern: /\besquerd[oa]\b/ },
  'anamnese.queixa.lado.bilateral': {
    kind: 'B',
    sources: SIDE_SOURCES,
    pattern: /\bbilateral\b|ambos os lados|dos dois lados/,
  },
  'sintomas.intensidade.melhor': {
    kind: 'N',
    sources: ['RESUMO.', 'SESSAO.'],
    context: /\b(eva|dor)\b|\b10\b/,
    pattern: /melhor|minim|menor/,
  },
  'sintomas.intensidade.pior': {
    kind: 'N',
    sources: ['RESUMO.', 'SESSAO.'],
    context: /\b(eva|dor)\b|\b10\b/,
    pattern: /pior|maxim|maior/,
  },
}

export function normalizeForMatch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/…/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const NEGATION_RE =
  /\b(nega|negou|negam|sem|ausencia|descarta|descartado|exclui|nunca|nem|nao)\b/

/**
 * `norm` é o texto normalizado do BLOCO (não da evidência). Olha os 40 caracteres normalizados
 * antes de `index`, nunca antes de `floor` (início da frase). Qualquer "não" conta como negação
 * (escolha conservadora: na dúvida descarta).
 */
export function negatedBefore(norm: string, index: number, floor = 0): boolean {
  let start = Math.max(floor, index - 40)
  // janela começando no meio de uma palavra: pular o fragmento
  if (start > floor && start > 0 && /[a-z0-9]/.test(norm.charAt(start - 1)) && /[a-z0-9]/.test(norm.charAt(start))) {
    const space = norm.indexOf(' ', start)
    start = space === -1 ? index : Math.min(space + 1, index)
  }
  const window = norm.slice(start, Math.max(start, index))
  return NEGATION_RE.test(window)
}

type NormBlock = { id: string; norm: string; sentenceStarts: number[] }

function normalizeBlock(block: AvaliacaoIaBlock): NormBlock {
  // Normaliza frase a frase (limites: . ; ! ? e quebra de linha; ponto decimal não corta) e junta
  // com um espaço: a concatenação é igual a normalizeForMatch(text).
  const parts = String(block.text ?? '')
    .split(/(?<!\d)\.|\.(?!\d)|[;!?\n\r]+/)
    .map(normalizeForMatch)
    .filter((p) => p.length > 0)
  const sentenceStarts: number[] = []
  let offset = 0
  for (const part of parts) {
    sentenceStarts.push(offset)
    offset += part.length + 1
  }
  return { id: block.id, norm: parts.join(' '), sentenceStarts }
}

function sentenceFloor(block: NormBlock, index: number): number {
  let floor = 0
  for (const s of block.sentenceStarts) {
    if (s <= index) floor = s
    else break
  }
  return floor
}

function negatedInBlock(block: NormBlock, index: number): boolean {
  return negatedBefore(block.norm, index, sentenceFloor(block, index))
}

function allOccurrences(haystack: string, needle: string): number[] {
  const out: number[] = []
  let from = 0
  while (needle.length > 0) {
    const i = haystack.indexOf(needle, from)
    if (i === -1) break
    out.push(i)
    from = i + 1
  }
  return out
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Posição do numeral na evidência original (inteiro não pode ser parte de 7,5). */
function numeralIndexInEvidence(evidence: string, n: number): number {
  const text = evidence.toLowerCase()
  const asText = Number.isInteger(n) ? String(n) : String(n).replace('.', '[.,]')
  const re = Number.isInteger(n)
    ? new RegExp(`(?<![\\d.,])${escapeRe(asText)}(?![.,]?\\d)`)
    : new RegExp(`(?<![\\d.,])${asText}(?!\\d)`)
  const m = re.exec(text)
  return m ? m.index : -1
}

export function verifyAvaliacaoItems(
  raw: unknown,
  blocks: readonly AvaliacaoIaBlock[],
): { items: AvaliacaoIaItem[]; droppedCount: number } {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : []
  const normBlocks = blocks.map(normalizeBlock)
  const kept: AvaliacaoIaItem[] = []
  const usedPaths = new Set<string>()
  const usedLimitacao = new Set<string>()
  let dropped = Math.max(0, list.length - AVALIACAO_IA_MAX_ITEMS)

  for (const entry of list.slice(0, AVALIACAO_IA_MAX_ITEMS)) {
    const result = verifyOne(entry, normBlocks, usedPaths, usedLimitacao)
    if (result) {
      kept.push(result)
      usedPaths.add(result.path)
    } else {
      dropped += 1
    }
  }
  return { items: kept, droppedCount: dropped }
}

function verifyOne(
  entry: unknown,
  blocks: readonly NormBlock[],
  usedPaths: Set<string>,
  usedLimitacao: Set<string>,
): AvaliacaoIaItem | null {
  if (!isRecord(entry)) return null
  const { path, evidence } = entry
  if (typeof path !== 'string' || typeof evidence !== 'string') return null
  if (!Object.prototype.hasOwnProperty.call(AVALIACAO_IA_ALLOWLIST, path)) return null
  const spec = AVALIACAO_IA_ALLOWLIST[path]
  if (!spec) return null
  if (usedPaths.has(path)) return null
  const evNorm = normalizeForMatch(evidence)
  if (evNorm.length < AVALIACAO_IA_MIN_EVIDENCE) return null
  const trimmed = evidence.trim()
  const isLimitacao = path.startsWith('funcao.limitacaoFuncional.item')

  // posição da palavra-chave / numeral dentro da evidência normalizada (negação do bloco)
  let anchor = 0
  let value: string | number | boolean
  if (spec.kind === 'T') {
    value = trimmed
    if (trimmed.length > (spec.max ?? 0)) return null
    if (spec.pattern) {
      const m = spec.pattern.exec(evNorm)
      if (!m) return null
      // negação interna que precede a palavra do pattern
      if (negatedBefore(evNorm, m.index)) return null
    }
    if (isLimitacao && usedLimitacao.has(evNorm)) return null
  } else if (spec.kind === 'B') {
    if (entry.value !== true) return null
    const m = spec.pattern ? spec.pattern.exec(evNorm) : null
    if (!m) return null
    anchor = m.index
    value = true
  } else {
    const n = Number(entry.value)
    if (typeof entry.value === 'boolean' || entry.value === null || entry.value === '') return null
    if (!Number.isFinite(n) || n < 0 || n > 10 || (n * 2) % 1 !== 0) return null
    const at = numeralIndexInEvidence(trimmed, n)
    if (at === -1) return null
    if (!spec.context?.test(evNorm) || !spec.pattern?.test(evNorm)) return null
    const prefix = normalizeForMatch(trimmed.slice(0, at))
    anchor = prefix.length === 0 ? 0 : prefix.length + 1
    value = n
  }

  for (const block of blocks) {
    if (!spec.sources.some((p) => block.id.startsWith(p))) continue
    for (const evOffset of allOccurrences(block.norm, evNorm)) {
      const pos = spec.kind === 'T' ? evOffset : evOffset + anchor
      if (negatedInBlock(block, pos)) continue
      if (isLimitacao) usedLimitacao.add(evNorm)
      return { path, value, evidence: trimmed }
    }
  }
  return null
}

const SUMMARY_NEGATIONS = new Set(['nao', 'sem', 'nega', 'negou', 'nunca', 'ausencia', 'nem'])

export function summaryWithinSource(summary: string, source: string): boolean {
  const s = summary.trim()
  const src = source.trim()
  if (s.length === 0 || s.length > DIAGNOSTICO_FISIO_MAX || s.length >= src.length) return false
  const sourceTokens = new Set(normalizeForMatch(src).split(' ').filter(Boolean))
  for (const token of normalizeForMatch(s).split(' ').filter(Boolean)) {
    const needsCheck =
      token.length >= 4 || SUMMARY_NEGATIONS.has(token) || /\d/.test(token)
    if (needsCheck && !sourceTokens.has(token)) return false
  }
  return true
}
// </avaliacao-ia-core>

export const AI_EVALUATION_TITLE = 'Avaliação gerada por IA'
export const AI_EVALUATION_BANNER =
  'Gerada por IA a partir dos dados do paciente — revise antes de salvar.'

export type AiDraftPatientData = {
  complaint?: string | null
  diagnosis?: string | null
  goals?: ReadonlyArray<{ title: string }>
  painSeries?: ReadonlyArray<{ date: string; value: number }>
  therapistName?: string | null
}

export function getByPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return cur
}

export function setByPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const apply = (node: unknown, i: number): unknown => {
    const copy: Record<string, unknown> =
      typeof node === 'object' && node !== null ? { ...(node as Record<string, unknown>) } : {}
    const key = keys[i] as string
    copy[key] = i === keys.length - 1 ? value : apply(copy[key], i + 1)
    return copy
  }
  return apply(obj, 0) as T
}

function cleanText(value: string | null | undefined): string {
  const t = (value ?? '').trim()
  return t === '—' ? '' : t
}

function hasContent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return true
  return value === true
}

function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

export function buildAiEvaluationFicha(
  base: EvaluationFicha,
  patient: AiDraftPatientData,
  ai: { items: readonly AvaliacaoIaItem[]; diagnosticoResumido?: string | null },
): { ficha: EvaluationFicha; notes: string[] } {
  const notes: string[] = []
  let ficha: EvaluationFicha = base

  // Aplica só se o campo está vazio e a ficha continua válida.
  const put = (path: string, value: unknown): void => {
    if (hasContent(getByPath(ficha, path))) return
    const candidate = setByPath(ficha, path, value)
    if (evaluationFichaSchema.safeParse(candidate).success) ficha = candidate
  }

  // (1) determinístico, sem IA
  put('titulo', AI_EVALUATION_TITLE)

  const complaint = cleanText(patient.complaint)
  if (complaint && complaint.length <= 4000) put('anamnese.queixa.oQueTrouxe', complaint)

  const diagnosis = cleanText(patient.diagnosis)
  if (diagnosis) {
    if (diagnosis.length <= DIAGNOSTICO_FISIO_MAX) {
      put('avaliacaoPlano.sintese.diagnosticoFisio', diagnosis)
    } else {
      const resumo = (ai.diagnosticoResumido ?? '').trim()
      if (resumo && resumo.length <= DIAGNOSTICO_FISIO_MAX) {
        put('avaliacaoPlano.sintese.diagnosticoFisio', resumo)
        notes.push('Diagnóstico resumido do cadastro: o texto original é maior que o campo.')
      }
    }
  }

  let goalsText = ''
  for (const goal of patient.goals ?? []) {
    const title = goal.title.trim()
    if (!title) continue
    const next = goalsText ? `${goalsText}; ${title}` : title
    if (next.length > 4000) break
    goalsText = next
  }
  if (goalsText) put('funcao.expectativas.boaMelhora', goalsText)

  let last: { date: string; value: number } | null = null
  for (const entry of patient.painSeries ?? []) {
    if (!last || entry.date >= last.date) last = entry
  }
  if (last && Number.isFinite(last.value) && last.value >= 0 && last.value <= 10) {
    if (!hasContent(getByPath(ficha, 'sintomas.intensidade.agora'))) {
      const candidate = setByPath(ficha, 'sintomas.intensidade.agora', last.value)
      if (evaluationFichaSchema.safeParse(candidate).success) {
        ficha = candidate
        notes.push(`EVA agora: último registro de ${formatIsoDate(last.date)}.`)
      }
    }
  }

  const therapist = cleanText(patient.therapistName)
  if (therapist && therapist.length <= 120) put('avaliacaoPlano.profissional.fisioterapeuta', therapist)

  // (2) itens da IA, já verificados na origem; revalidados aqui
  for (const item of ai.items) {
    if (!Object.prototype.hasOwnProperty.call(AVALIACAO_IA_ALLOWLIST, item.path)) continue
    const spec = AVALIACAO_IA_ALLOWLIST[item.path]
    if (!spec) continue
    const v = item.value
    const ok =
      spec.kind === 'T'
        ? typeof v === 'string' && v.trim().length > 0 && v.length <= (spec.max ?? 0)
        : spec.kind === 'B'
          ? v === true
          : typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10
    if (!ok) continue
    put(item.path, v)
  }

  // (3)
  return { ficha: evaluationFichaSchema.parse(ficha), notes }
}
