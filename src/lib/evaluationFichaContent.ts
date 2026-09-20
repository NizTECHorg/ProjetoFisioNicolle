import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'

/** Completa when any clinical leaf is filled; otherwise Parcial (date-only). */
export function fichaHasClinicalContent(ficha: EvaluationFicha | null | undefined): boolean {
  if (!ficha) return false
  return hasFilledLeaf(ficha)
}

function hasFilledLeaf(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === '') return false
  if (typeof value === 'number') return true
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some((item) => hasFilledLeaf(item))
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) => hasFilledLeaf(item))
  }
  return false
}
