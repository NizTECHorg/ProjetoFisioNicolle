import { z } from 'zod'

/** Chaves de texto do resumo. `summary` vive em `patients.ai_summary`; as outras cinco, em jsonb. */
export const SUMMARY_FIELD_KEYS = [
  'summary',
  'treatmentPlan',
  'evolution',
  'conducts',
  'nextSessionPlan',
  'painLimitations',
] as const

export type SummaryFieldKey = (typeof SUMMARY_FIELD_KEYS)[number]
export type SummaryTexts = Partial<Record<SummaryFieldKey, string>>

/** Coluna `ai_summary_fields`: textos gerados sem `summary`, mais o instante da geração. */
export interface AiSummaryFieldsValue extends SummaryTexts {
  generatedAt?: string
}

export const SUMMARY_FIELD_LABELS: Record<SummaryFieldKey, string> = {
  summary: 'Resumo IA',
  treatmentPlan: 'Plano de tratamento',
  evolution: 'Evolução geral',
  conducts: 'Condutas',
  nextSessionPlan: 'Plano próxima sessão',
  painLimitations: 'Dor e limitações',
}

export const SUMMARY_FIELD_MAX: Record<SummaryFieldKey, number> = {
  summary: 1500,
  treatmentPlan: 500,
  evolution: 500,
  conducts: 500,
  nextSessionPlan: 400,
  painLimitations: 500,
}

export const SUMMARY_FIELD_ROWS: Record<SummaryFieldKey, number> = {
  summary: 6,
  treatmentPlan: 3,
  evolution: 3,
  conducts: 3,
  nextSessionPlan: 3,
  painLimitations: 3,
}

const AI_SUMMARY_STORED_KEYS = [
  'generatedAt',
  'treatmentPlan',
  'evolution',
  'conducts',
  'nextSessionPlan',
  'painLimitations',
] as const

type AiSummaryStoredKey = (typeof AI_SUMMARY_STORED_KEYS)[number]

/**
 * Edição vence o original chave a chave. String vazia em `edits` é apagado de propósito:
 * a checagem é `typeof === 'string'`, não verdade, para `''` não cair de volta no original.
 */
export function resolveSummaryFields(
  original: SummaryTexts | null | undefined,
  edits: SummaryTexts | null | undefined,
): Record<SummaryFieldKey, string> {
  const out = {} as Record<SummaryFieldKey, string>
  for (const key of SUMMARY_FIELD_KEYS) {
    const edited = edits?.[key]
    out[key] = typeof edited === 'string' ? edited : (original?.[key] ?? '')
  }
  return out
}

/** Só chaves que diferem do original, já com trim. Nada diferente → `null` (a coluna fica NULL). */
export function diffSummaryEdits(
  original: SummaryTexts | null | undefined,
  next: SummaryTexts,
): SummaryTexts | null {
  const out: SummaryTexts = {}
  for (const key of SUMMARY_FIELD_KEYS) {
    const value = (next[key] ?? '').trim()
    if (value !== (original?.[key] ?? '').trim()) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pickStrings<K extends string>(
  value: Record<string, unknown>,
  keys: readonly K[],
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const key of keys) {
    const entry = value[key]
    if (typeof entry === 'string') out[key] = entry
  }
  return out
}

/** jsonb da geração: descarta `summary`, chaves fora do conjunto e qualquer valor que não seja string. */
export function narrowAiSummaryFields(value: unknown): AiSummaryFieldsValue | null {
  if (!isJsonObject(value)) return null
  const picked = pickStrings<AiSummaryStoredKey>(value, AI_SUMMARY_STORED_KEYS)
  return Object.keys(picked).length > 0 ? picked : null
}

/** jsonb das edições: só as seis chaves de texto, e só quando o valor é string. */
export function narrowSummaryEdits(value: unknown): SummaryTexts | null {
  if (!isJsonObject(value)) return null
  const picked = pickStrings<SummaryFieldKey>(value, SUMMARY_FIELD_KEYS)
  return Object.keys(picked).length > 0 ? picked : null
}

/**
 * `Gerado em 03/10/2026 às 20:14`. Hora e data saem separadas para o fuso de São Paulo.
 * `hourCycle: 'h23'` impede meia-noite em `24:00`.
 */
export function formatGeneratedAt(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

  const timeLabel = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)

  return `Gerado em ${dateLabel} às ${timeLabel}`
}

/** Corta no teto. Rejeitar por um caractere a mais perderia a geração inteira. */
function clampOptionalText(max: number) {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined
      return value.slice(0, max)
    })
}

/** Resposta da Edge Function. Chaves desconhecidas são descartadas (sem `.passthrough()`). */
export const aiSummaryResponseSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.slice(0, SUMMARY_FIELD_MAX.summary)),
  treatmentPlan: clampOptionalText(SUMMARY_FIELD_MAX.treatmentPlan),
  evolution: clampOptionalText(SUMMARY_FIELD_MAX.evolution),
  conducts: clampOptionalText(SUMMARY_FIELD_MAX.conducts),
  nextSessionPlan: clampOptionalText(SUMMARY_FIELD_MAX.nextSessionPlan),
  painLimitations: clampOptionalText(SUMMARY_FIELD_MAX.painLimitations),
  focusRegionKeys: z.array(z.string()).optional().default([]),
})

/** Formulário do modal. Campo vazio é válido: apaga o texto. A copy é a da UI-SPEC. */
export const summaryEditsSchema = z.object({
  summary: z.string().trim().max(SUMMARY_FIELD_MAX.summary, 'Use no máximo 1500 caracteres.'),
  treatmentPlan: z
    .string()
    .trim()
    .max(SUMMARY_FIELD_MAX.treatmentPlan, 'Use no máximo 500 caracteres.'),
  evolution: z
    .string()
    .trim()
    .max(SUMMARY_FIELD_MAX.evolution, 'Use no máximo 500 caracteres.'),
  conducts: z.string().trim().max(SUMMARY_FIELD_MAX.conducts, 'Use no máximo 500 caracteres.'),
  nextSessionPlan: z
    .string()
    .trim()
    .max(SUMMARY_FIELD_MAX.nextSessionPlan, 'Use no máximo 400 caracteres.'),
  painLimitations: z
    .string()
    .trim()
    .max(SUMMARY_FIELD_MAX.painLimitations, 'Use no máximo 500 caracteres.'),
})

export type SummaryEditsFormData = z.infer<typeof summaryEditsSchema>
