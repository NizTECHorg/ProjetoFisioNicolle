export const SIGNATURE_VIEWBOX = { width: 600, height: 160 } as const
export const SIGNATURE_MAX_CHARS = 20000
export const SIGNATURE_MIN_STEP = 2

export type SignaturePoint = { x: number; y: number }

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)))
}

/** Rounds to integers inside the viewBox and drops points closer than minStep to the last kept one. */
export function simplifyStroke(
  points: SignaturePoint[],
  minStep: number = SIGNATURE_MIN_STEP,
): SignaturePoint[] {
  const out: SignaturePoint[] = []
  for (const p of points) {
    const q = {
      x: clamp(p.x, SIGNATURE_VIEWBOX.width),
      y: clamp(p.y, SIGNATURE_VIEWBOX.height),
    }
    const last = out[out.length - 1]
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) >= minStep) out.push(q)
  }
  return out
}

export function strokeToPath(points: SignaturePoint[]): string {
  const [first, ...rest] = points
  if (!first) return ''
  const head = `M${first.x} ${first.y}`
  if (rest.length === 0) return `${head} L${first.x} ${first.y}`
  return [head, ...rest.map((p) => `L${p.x} ${p.y}`)].join(' ')
}

export function appendStroke(path: string, points: SignaturePoint[]): string {
  const stroke = strokeToPath(points)
  if (!stroke) return path
  const next = path ? `${path} ${stroke}` : stroke
  return next.length > SIGNATURE_MAX_CHARS ? path : next
}

export function isSafeSignaturePath(path: string | null | undefined): path is string {
  return (
    typeof path === 'string' &&
    path.length > 0 &&
    path.length <= SIGNATURE_MAX_CHARS &&
    /^[ML0-9 .-]*$/.test(path) &&
    path.startsWith('M')
  )
}

export function clientToViewBox(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): SignaturePoint {
  const x =
    rect.width > 0 ? ((clientX - rect.left) / rect.width) * SIGNATURE_VIEWBOX.width : 0
  const y =
    rect.height > 0 ? ((clientY - rect.top) / rect.height) * SIGNATURE_VIEWBOX.height : 0
  return { x: clamp(x, SIGNATURE_VIEWBOX.width), y: clamp(y, SIGNATURE_VIEWBOX.height) }
}

export function signaturePdfScale(boxW: number, boxH: number): number {
  return Math.min(boxW / SIGNATURE_VIEWBOX.width, boxH / SIGNATURE_VIEWBOX.height)
}
