import { useRef, useState, type PointerEvent } from 'react'
import { Button } from '@/components/ui/Button'
import {
  SIGNATURE_MIN_STEP,
  SIGNATURE_VIEWBOX,
  appendStroke,
  clientToViewBox,
  isSafeSignaturePath,
  simplifyStroke,
  strokeToPath,
  type SignaturePoint,
} from '@/lib/signaturePath'

type SignaturePadProps = {
  label: string
  value: string | undefined
  onChange: (next: string) => void
  disabled?: boolean
  legacyText?: string
}

export function SignaturePad({ label, value, onChange, disabled, legacyText }: SignaturePadProps) {
  const [points, setPoints] = useState<SignaturePoint[]>([])
  const drawing = useRef(false)

  const saved = isSafeSignaturePath(value) ? value : ''
  const live = strokeToPath(simplifyStroke(points))
  const d = [saved, live].filter(Boolean).join(' ')
  const legacy = legacyText?.trim() ?? ''

  function handleDown(e: PointerEvent<SVGSVGElement>) {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    setPoints([clientToViewBox(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())])
  }

  function handleMove(e: PointerEvent<SVGSVGElement>) {
    if (disabled || !drawing.current) return
    const next = clientToViewBox(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())
    setPoints((prev) => {
      const last = prev[prev.length - 1]
      if (last && Math.hypot(next.x - last.x, next.y - last.y) < SIGNATURE_MIN_STEP) return prev
      return [...prev, next]
    })
  }

  function finish(e: PointerEvent<SVGSVGElement>) {
    if (!drawing.current) return
    drawing.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (points.length > 0) {
      onChange(appendStroke(saved, simplifyStroke(points)))
    }
    setPoints([])
  }

  const empty = !saved && points.length === 0

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink">{label}</span>
      {legacy && !saved ? (
        <p className="text-sm text-muted">Assinatura registrada como texto: {legacy}</p>
      ) : null}
      <div className="relative rounded-2xl border border-line bg-white">
        <svg
          viewBox={`0 0 ${SIGNATURE_VIEWBOX.width} ${SIGNATURE_VIEWBOX.height}`}
          preserveAspectRatio="none"
          width="100%"
          role="img"
          aria-label={label}
          className={`block h-40 w-full touch-none rounded-2xl ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          <line
            x1={24}
            y1={130}
            x2={576}
            y2={130}
            stroke="currentColor"
            className="text-line"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {d ? (
            <path
              d={d}
              fill="none"
              stroke="#000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {empty && !disabled ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            Assine com o mouse ou o dedo.
          </span>
        ) : null}
      </div>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || !saved}
        onClick={() => onChange('')}
      >
        Apagar assinatura
      </Button>
    </div>
  )
}
