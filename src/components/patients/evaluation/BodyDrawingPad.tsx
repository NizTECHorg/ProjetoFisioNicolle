import { useRef, useState, type PointerEvent } from 'react'
import { ArrowLeftRight, RotateCcw, Undo2 } from 'lucide-react'
import pessoaUrl from '@/assets/pessoa.png'
import pessoaFemininaUrl from '@/assets/pessoa-feminina.png'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  BODY_DRAWING_COLORS,
  BODY_DRAWING_MAX_STROKES,
  BODY_DRAWING_MIN_STEP,
  BODY_DRAWING_VIEWBOX,
  BODY_DRAWING_WIDTHS,
  appendBodyStroke,
  bodyClientToViewBox,
  bodyDrawingColor,
  bodyDrawingFigure,
  bodyDrawingWidthInfo,
  bodyStrokeToPath,
  safeBodyStrokes,
  simplifyBodyStroke,
  type BodyDrawingColor,
  type BodyDrawingFigure,
  type BodyDrawingPoint,
  type BodyDrawingStroke,
  type BodyDrawingWidth,
} from '@/lib/bodyDrawing'

type BodyDrawingPadProps = {
  value: unknown
  onChange: (next: BodyDrawingStroke[]) => void
  figura?: unknown
  onFiguraChange?: (next: BodyDrawingFigure) => void
  disabled?: boolean
  /** Legenda/paleta de cores. A visualização da avaliação esconde; o editor sempre mostra. */
  showLegend?: boolean
}

/** Desenho livre colorido sobre a figura anterior/posterior. SVG + Pointer Events, sem biblioteca. */
export function BodyDrawingPad({
  value,
  onChange,
  figura,
  onFiguraChange,
  disabled,
  showLegend = true,
}: BodyDrawingPadProps) {
  const tracos = safeBodyStrokes(value)
  const figuraAtual = bodyDrawingFigure(figura)
  const fundoUrl = figuraAtual === 'feminina' ? pessoaFemininaUrl : pessoaUrl
  const [cor, setCor] = useState<BodyDrawingColor>('dor')
  const [espessura, setEspessura] = useState<BodyDrawingWidth>('media')
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
    if (pontos.length > 0) onChange(appendBodyStroke(tracos, cor, pontos, espessura))
    setPontos([])
  }

  const vivo = bodyStrokeToPath(simplifyBodyStroke(pontos))

  return (
    <div className="space-y-4">
      {showLegend ? (
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
      ) : null}

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
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Espessura do pincel" className="inline-flex items-center gap-1 rounded-xl border border-line bg-canvas p-1">
              {BODY_DRAWING_WIDTHS.map((item) => {
                const ativo = item.key === espessura
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    aria-label={`Pincel ${item.label.toLowerCase()}`}
                    title={`Pincel ${item.label.toLowerCase()}`}
                    onClick={() => setEspessura(item.key)}
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      ativo ? 'bg-surface shadow-sm' : 'hover:bg-surface',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden
                      className="rounded-full"
                      style={{ width: item.px + 2, height: item.px + 2, backgroundColor: ativo ? corAtual.hex : '#5a6b80' }}
                    />
                  </button>
                )
              })}
            </div>
            {onFiguraChange ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onFiguraChange(figuraAtual === 'feminina' ? 'masculina' : 'feminina')}
                aria-label={figuraAtual === 'feminina' ? 'Trocar para figura masculina' : 'Trocar para figura feminina'}
              >
                <ArrowLeftRight size={16} aria-hidden />
                {figuraAtual === 'feminina' ? 'Masculino' : 'Feminino'}
              </Button>
            ) : null}
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
            href={fundoUrl}
            x={0}
            y={0}
            width={BODY_DRAWING_VIEWBOX.width}
            height={BODY_DRAWING_VIEWBOX.height}
            preserveAspectRatio="xMidYMid meet"
            pointerEvents="none"
          />
          {/*
            Camada "multiply": a cor tinge o branco da figura, e as linhas pretas
            do boneco continuam pretas por cima. Os traços são agrupados antes
            do blend para não escurecer onde se cruzam.
          */}
          <g style={{ mixBlendMode: 'multiply' }}>
          {tracos.map((item, index) => (
            <path
              key={index}
              d={item.d}
              fill="none"
              stroke={bodyDrawingColor(item.cor)?.hex}
              strokeWidth={bodyDrawingWidthInfo(item.espessura).px}
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
              strokeWidth={bodyDrawingWidthInfo(espessura).px}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          </g>
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
