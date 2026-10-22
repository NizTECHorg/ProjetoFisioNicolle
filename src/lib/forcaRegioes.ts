// Força por regiões corporais (checklist 6.7). Reaproveita as regiões e movimentos da Mobilidade.
import { CATALOGO_MOBILIDADE } from './mobilidadePalpacao.ts'

export type ForcaRegiao = { label: string; sugestoes: readonly string[] }

export const OUTRA_REGIAO_FORCA = 'Outra região'

export const FORCA_REGIOES: readonly ForcaRegiao[] = [
  ...CATALOGO_MOBILIDADE.filter((regiao) => regiao.label !== 'ATM / mandíbula').map((regiao) => ({
    label: regiao.label,
    sugestoes: regiao.movimentos.map((movimento) => movimento.label).filter((label) => label !== 'Outro'),
  })),
  { label: OUTRA_REGIAO_FORCA, sugestoes: [] },
]

export function sugestoesForca(regiao: string | undefined): readonly string[] {
  return FORCA_REGIOES.find((item) => item.label === regiao)?.sugestoes ?? []
}

export type GrupoForca<T> = { regiao: string; linhas: { linha: T; index: number }[] }

/**
 * Agrupa as linhas pela região, na ordem do catálogo; linhas sem região (avaliações antigas)
 * ficam num grupo com regiao '' no fim. `index` é a posição original (useFieldArray).
 */
export function agruparForca<T extends { regiao?: string }>(linhas: readonly T[]): GrupoForca<T>[] {
  const porRegiao = new Map<string, GrupoForca<T>>()
  linhas.forEach((linha, index) => {
    const regiao = linha.regiao?.trim() ?? ''
    const grupo = porRegiao.get(regiao) ?? { regiao, linhas: [] }
    grupo.linhas.push({ linha, index })
    porRegiao.set(regiao, grupo)
  })
  const ordem = (regiao: string) => {
    if (!regiao) return Number.MAX_SAFE_INTEGER
    const pos = FORCA_REGIOES.findIndex((item) => item.label === regiao)
    return pos < 0 ? FORCA_REGIOES.length : pos
  }
  return [...porRegiao.values()].sort((a, b) => ordem(a.regiao) - ordem(b.regiao))
}
