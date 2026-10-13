import { useRef, useState, type PointerEvent } from 'react'
import { RotateCcw, Undo2 } from 'lucide-react'
import pessoaUrl from '@/assets/pessoa.png'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  BODY_DRAWING_COLORS,
  BODY_DRAWING_MAX_STROKES,
  BODY_DRAWING_MIN_STEP,
  BODY_DRAWING_VIEWBOX,
  appendBodyStroke,
  bodyClientToViewBox,
  bodyDrawingColor,
  bodyStrokeToPath,
  safeBodyStrokes,
  simplifyBodyStroke,
  type BodyDrawingColor,
  type BodyDrawingPoint,
  type BodyDrawingStroke,
} from '@/lib/bodyDrawing'

type BodyDrawingPadProps = {
  value: unknown
  onChange: (next: BodyDrawingStroke[]) => void
  disabled?: boolean
}

/** Desenho livre colorido sobre a figura anterior/posterior. SVG + Pointer Events, sem biblioteca. */
export function BodyDrawingPad({ value, onChange, disabled }: BodyDrawingPadProps) {
  const tracos = safeBodyStrokes(value)
  const [cor, setCor] = useState<BodyDrawingColor>('dor')
  const [pontos, setPontos] = useState<BodyDrawingPoint[]>([])
  const [confirmarLimpar, setConfirmarLimpar] = useState(false)
  const desenhando = useRef(false)
  const corAtual = bodyDrawingColor(cor) ?? BODY_DRAWING_COLORS[0]!
  const cheio = tracos.length >= BODY_DRAWING_MAX_STROKES

  function down(event: PointerEvent<SVGSVGElement>) {
    if (disabled || cheio) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    desenhando.current = true
    setPontos([bodyClientToViewBox(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())])
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!desenhando.current) return
    const next = bodyClientToViewBox(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
    setPontos((prev) => {
      const last = prev[prev.length - 1]
      if (last && Math.hypot(next.x - last.x, next.y - last.y) < BODY_DRAWING_MIN_STEP) return prev
      return [...prev, next]
    })
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!desenhando.current) return
    desenhando.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (pontos.length > 0) onChange(appendBodyStroke(tracos, cor, pontos))
    setPontos([])
  }

  const vivo = bodyStrokeToPath(simplifyBodyStroke(pontos))

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Cor do traço e o que ela significa" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BODY_DRAWING_COLORS.map((item) => {
          const ativa = !disabled && item.key === cor
          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={ativa}
              disabled={disabled}
              onClick={() => setCor(item.key)}
              className={[
                'flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-default',
                ativa ? 'bg-surface shadow-sm' : 'border-line bg-canvas hover:bg-surface',
              ].join(' ')}
              style={ativa ? { borderColor: item.hex, boxShadow: `0 0 0 1px ${item.hex}` } : undefined}
            >
              <span
                aria-hidden
                className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: item.hex, boxShadow: `0 0 0 1px ${item.hex}` }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-ink">{item.label}</span>
                <span className="block truncate text-xs text-muted">{item.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      {!disabled ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            Desenhando em{' '}
            <span className="font-semibold" style={{ color: corAtual.hex }}>
              {corAtual.label}
            </span>
            {tracos.length > 0 ? ` · ${tracos.length === 1 ? '1 traço' : `${tracos.length} traços`}` : ''}
            {cheio ? ' · limite de traços atingido' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={tracos.length === 0}
              onClick={() => onChange(tracos.slice(0, -1))}
            >
              <Undo2 size={16} aria-hidden />
              Desfazer
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={tracos.length === 0}
              onClick={() => setConfirmarLimpar(true)}
            >
              <RotateCcw size={16} aria-hidden />
              Limpar tudo
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-white">
        <svg
          viewBox={`0 0 ${BODY_DRAWING_VIEWBOX.width} ${BODY_DRAWING_VIEWBOX.height}`}
          role="img"
          aria-label={`Mapa de sintomas com ${tracos.length} ${tracos.length === 1 ? 'traço' : 'traços'}`}
          className={`block h-auto w-full touch-none select-none ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          <image
            href={pessoaUrl}
            x={0}
            y={0}
            width={BODY_DRAWING_VIEWBOX.width}
            height={BODY_DRAWING_VIEWBOX.height}
            preserveAspectRatio="xMidYMid meet"
            pointerEvents="none"
          />
          {tracos.map((item, index) => (
            <path
              key={index}
              d={item.d}
              fill="none"
              stroke={bodyDrawingColor(item.cor)?.hex}
              strokeOpacity={0.85}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {vivo ? (
            <path
              d={vivo}
              fill="none"
              stroke={corAtual.hex}
              strokeOpacity={0.85}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>

      {!disabled ? (
        <ConfirmDialog
          open={confirmarLimpar}
          title="Limpar o desenho?"
          description="Todos os traços saem do mapa. Esta ação não pode ser desfeita."
          confirmLabel="Limpar tudo"
          cancelLabel="Manter desenho"
          tone="danger"
          onConfirm={() => {
            onChange([])
            setConfirmarLimpar(false)
          }}
          onClose={() => setConfirmarLimpar(false)}
        />
      ) : null}
    </div>
  )
}
