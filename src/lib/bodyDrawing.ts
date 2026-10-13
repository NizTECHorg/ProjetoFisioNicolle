// Mapa de sintomas desenhado à mão sobre a figura anterior/posterior (src/assets/pessoa.png).
// Sem imports com alias: roda direto em node --test.

/** Mesmas proporções de src/assets/pessoa.png (1271 × 1238). */
export const BODY_DRAWING_VIEWBOX = { width: 1271, height: 1238 } as const
export const BODY_DRAWING_MAX_STROKES = 200
export const BODY_DRAWING_MAX_PATH_CHARS = 6000
export const BODY_DRAWING_MIN_STEP = 3

export const BODY_DRAWING_COLOR_KEYS = [
  'dor',
  'queimacao',
  'formigamento',
  'dormencia',
  'irradiacao',
  'rigidez',
] as const

export type BodyDrawingColor = (typeof BODY_DRAWING_COLOR_KEYS)[number]

export type BodyDrawingColorInfo = {
  key: BodyDrawingColor
  hex: string
  /** Mesma cor em 0–1 para o pdf-lib. */
  rgb: readonly [number, number, number]
  label: string
  hint: string
}

export const BODY_DRAWING_COLORS: readonly BodyDrawingColorInfo[] = [
  { key: 'dor', hex: '#dc2626', rgb: [0.863, 0.149, 0.149], label: 'Dor', hint: 'Onde dói' },
  { key: 'queimacao', hex: '#ea580c', rgb: [0.918, 0.345, 0.047], label: 'Queimação', hint: 'Ardência, calor' },
  { key: 'formigamento', hex: '#ca8a04', rgb: [0.792, 0.541, 0.016], label: 'Formigamento', hint: 'Agulhadas, choque' },
  { key: 'dormencia', hex: '#2563eb', rgb: [0.145, 0.388, 0.922], label: 'Dormência', hint: 'Pouca sensibilidade' },
  { key: 'irradiacao', hex: '#7c3aed', rgb: [0.486, 0.227, 0.929], label: 'Irradiação', hint: 'Sintoma que se espalha' },
  { key: 'rigidez', hex: '#059669', rgb: [0.020, 0.588, 0.412], label: 'Rigidez', hint: 'Travado, limitado' },
]

/** Figura de fundo. As duas imagens têm o mesmo tamanho, então os traços valem para ambas. */
export const BODY_DRAWING_FIGURES = ['masculina', 'feminina'] as const
export type BodyDrawingFigure = (typeof BODY_DRAWING_FIGURES)[number]

export function bodyDrawingFigure(value: unknown): BodyDrawingFigure {
  return value === 'feminina' ? 'feminina' : 'masculina'
}

export type BodyDrawingPoint = { x: number; y: number }

export type BodyDrawingStroke = { cor: BodyDrawingColor; d: string }

export function bodyDrawingColor(key: string | null | undefined): BodyDrawingColorInfo | undefined {
  return BODY_DRAWING_COLORS.find((item) => item.key === key)
}

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)))
}

/** Converte a posição do ponteiro na caixa renderizada para coordenadas inteiras do viewBox. */
export function bodyClientToViewBox(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): BodyDrawingPoint {
  const x = rect.width > 0 ? ((clientX - rect.left) / rect.width) * BODY_DRAWING_VIEWBOX.width : 0
  const y = rect.height > 0 ? ((clientY - rect.top) / rect.height) * BODY_DRAWING_VIEWBOX.height : 0
  return { x: clamp(x, BODY_DRAWING_VIEWBOX.width), y: clamp(y, BODY_DRAWING_VIEWBOX.height) }
}

/** Arredonda, prende ao viewBox e descarta pontos a menos de minStep do último mantido. */
export function simplifyBodyStroke(
  points: readonly BodyDrawingPoint[],
  minStep: number = BODY_DRAWING_MIN_STEP,
): BodyDrawingPoint[] {
  const out: BodyDrawingPoint[] = []
  for (const p of points) {
    const q = { x: clamp(p.x, BODY_DRAWING_VIEWBOX.width), y: clamp(p.y, BODY_DRAWING_VIEWBOX.height) }
    const last = out[out.length - 1]
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) >= minStep) out.push(q)
  }
  return out
}

/** Um ponto só vira um traço mínimo para aparecer como bolinha (linecap round). */
export function bodyStrokeToPath(points: readonly BodyDrawingPoint[]): string {
  const [first, ...rest] = points
  if (!first) return ''
  const head = `M${first.x} ${first.y}`
  if (rest.length === 0) return `${head} L${first.x + 0.5} ${first.y}`
  return [head, ...rest.map((p) => `L${p.x} ${p.y}`)].join(' ')
}

export function isSafeBodyPath(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    path.length <= BODY_DRAWING_MAX_PATH_CHARS &&
    path.startsWith('M') &&
    /^[ML0-9 .-]*$/.test(path)
  )
}

/** Só traços com cor conhecida e path seguro; corta no limite de traços. */
export function safeBodyStrokes(value: unknown): BodyDrawingStroke[] {
  if (!Array.isArray(value)) return []
  const out: BodyDrawingStroke[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const { cor, d } = item as { cor?: unknown; d?: unknown }
    if (typeof cor !== 'string' || !bodyDrawingColor(cor) || !isSafeBodyPath(d)) continue
    out.push({ cor: cor as BodyDrawingColor, d })
    if (out.length >= BODY_DRAWING_MAX_STROKES) break
  }
  return out
}

/** Acrescenta um traço respeitando os limites; devolve a lista original se não couber. */
export function appendBodyStroke(
  strokes: readonly BodyDrawingStroke[],
  cor: BodyDrawingColor,
  points: readonly BodyDrawingPoint[],
): BodyDrawingStroke[] {
  const d = bodyStrokeToPath(simplifyBodyStroke(points))
  if (!isSafeBodyPath(d) || strokes.length >= BODY_DRAWING_MAX_STROKES) return [...strokes]
  return [...strokes, { cor, d }]
}

/** Cores usadas no desenho, na ordem da legenda (para o PDF mostrar só o que importa). */
export function usedBodyDrawingColors(strokes: readonly BodyDrawingStroke[]): BodyDrawingColorInfo[] {
  const used = new Set(strokes.map((item) => item.cor))
  return BODY_DRAWING_COLORS.filter((item) => used.has(item.key))
}
