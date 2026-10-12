/**
 * Conjunto permitido de áreas de foco (REQ-34.3).
 *
 * Marca o rótulo inteiro do catálogo quando ele aparece no texto clínico
 * ou na descrição adicional. "joelho D" e "joelhos" não entram: não há
 * apelido. A string da chave (`front.knee_r`) não é rótulo. O mesmo
 * rótulo nas duas vistas marca as duas chaves. A saída segue a ordem de
 * `FOCUS_REGIONS` e cada chave sai uma vez.
 *
 * Os textos entram separados por quebra de linha para um rótulo não nascer
 * da emenda de dois campos.
 */
import { FOCUS_REGIONS } from './focusRegions.ts'

/** Depois do NFD, "antebraço" vira "antebraco"; a letra anterior bloqueia "braco". */
const LEFT_BOUNDARY = '(?<![a-z])'

type LabelHit = {
  key: string
  start: number
  end: number
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isInsideLongerLabel(hit: LabelHit, hits: readonly LabelHit[]): boolean {
  return hits.some(
    (other) =>
      other.key !== hit.key &&
      other.start <= hit.start &&
      other.end >= hit.end &&
      other.end - other.start > hit.end - hit.start,
  )
}

export function allowedFocusKeys(texts: readonly string[]): string[] {
  const haystack = fold(texts.join('\n'))
  const hits: LabelHit[] = []

  for (const region of FOCUS_REGIONS) {
    const label = fold(region.label)
    const pattern = new RegExp(`${LEFT_BOUNDARY}${escapeRegExp(label)}`, 'g')
    for (const match of haystack.matchAll(pattern)) {
      const start = match.index
      if (start === undefined) continue
      hits.push({ key: region.key, start, end: start + label.length })
    }
  }

  const keys: string[] = []
  const seen = new Set<string>()

  for (const region of FOCUS_REGIONS) {
    if (seen.has(region.key)) continue
    const standsAlone = hits.some(
      (hit) => hit.key === region.key && !isInsideLongerLabel(hit, hits),
    )
    if (!standsAlone) continue
    seen.add(region.key)
    keys.push(region.key)
  }

  return keys
}
