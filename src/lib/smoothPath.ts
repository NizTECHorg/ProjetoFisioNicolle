// Linha curva para os gráficos (SVG), sem biblioteca.
// Curva monotônica (Fritsch–Carlson): suave, mas nunca passa acima do pico nem abaixo de zero.

export type PontoGrafico = { x: number; y: number }

function r(n: number): number {
  return Math.round(n * 100) / 100
}

/** Path SVG `M … C …` passando por todos os pontos (x crescente). */
export function smoothLinePath(points: readonly PontoGrafico[]): string {
  const n = points.length
  const first = points[0]
  if (!first) return ''
  if (n === 1) return `M ${r(first.x)} ${r(first.y)}`
  if (n === 2) return `M ${r(first.x)} ${r(first.y)} L ${r(points[1]!.x)} ${r(points[1]!.y)}`

  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    dx[i] = b.x - a.x
    slope[i] = dx[i]! === 0 ? 0 : (b.y - a.y) / dx[i]!
  }

  const tan: number[] = [slope[0]!]
  for (let i = 1; i < n - 1; i++) {
    const s0 = slope[i - 1]!
    const s1 = slope[i]!
    if (s0 * s1 <= 0) {
      tan[i] = 0
    } else {
      const w0 = 2 * dx[i]! + dx[i - 1]!
      const w1 = dx[i]! + 2 * dx[i - 1]!
      tan[i] = (w0 + w1) / (w0 / s0 + w1 / s1)
    }
  }
  tan[n - 1] = slope[n - 2]!

  let d = `M ${r(first.x)} ${r(first.y)}`
  for (let i = 0; i < n - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    const h = dx[i]! / 3
    d += ` C ${r(a.x + h)} ${r(a.y + tan[i]! * h)} ${r(b.x - h)} ${r(b.y - tan[i + 1]! * h)} ${r(b.x)} ${r(b.y)}`
  }
  return d
}
