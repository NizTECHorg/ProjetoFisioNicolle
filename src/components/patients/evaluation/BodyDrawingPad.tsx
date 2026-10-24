import { useRef, useState, type PointerEvent } from 'react'
import { ArrowLeftRight, RotateCcw, Undo2 } from 'lucide-react'
import corpoFemininoUrl from '@/assets/corpo-feminino.png'
import corpoMasculinoUrl from '@/assets/corpo-masculino.png'
import pessoaUrl from '@/assets/homi.png'
import pessoaFemininaUrl from '@/assets/muir.png'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  BODY_DRAWING_COLORS,
  BODY_DRAWING_MAX_STROKES,
  BODY_DRAWING_MIN_STEP,
  BODY_DRAWING_WIDTHS,
  appendBodyStroke,
  bodyClientToViewBox,
  bodyDrawingColor,
  bodyDrawingFigure,
  bodyDrawingVersion,
  bodyDrawingViewBox,
  bodyDrawingWidthInfo,
  bodyStrokeToPath,
  safeBodyStrokes,
  simplifyBodyStroke,
  type BodyDrawingColor,
  type BodyDrawingFigure,
  type BodyDrawingPoint,
  type BodyDrawingStroke,
  type BodyDrawingVersion,
  type BodyDrawingWidth,
} from '@/lib/bodyDrawing'

/** Figura de fundo de cada versão (os traços só valem sobre a figura em que foram feitos). */
const FUNDOS: Record<BodyDrawingVersion, Record<BodyDrawingFigure, string>> = {
  1: { masculina: pessoaUrl, feminina: pessoaFemininaUrl },
  2: { masculina: corpoMasculinoUrl, feminina: corpoFemininoUrl },
}

type BodyDrawingPadProps = {
  value: unknown
  /** `versao` é a figura em que os traços valem; quem salva grava junto com os traços. */
  onChange: (next: BodyDrawingStroke[], versao: BodyDrawingVersion) => void
  figura?: unknown
  /** Versão salva da figura (ficha.mapaSintomas.versao). */
  versao?: unknown
  onFiguraChange?: (next: BodyDrawingFigure) => void
  disabled?: boolean
  /** Legenda/paleta de cores. A visualização da avaliação esconde; o editor sempre mostra. */
  showLegend?: boolean
}

/** Desenho livre colorido sobre a figura do corpo (frente, costas e laterais). SVG + Pointer Events, sem biblioteca. */
export function BodyDrawingPad({
  value,
  onChange,
  figura,
  versao,
  onFiguraChange,
  disabled,
  showLegend = true,
}: BodyDrawingPadProps) {
  const tracos = safeBodyStrokes(value)
  const figuraAtual = bodyDrawingFigure(figura)
  const versaoAtual = bodyDrawingVersion(versao, tracos)
  const caixa = bodyDrawingViewBox(versaoAtual)
  const fundoUrl = FUNDOS[versaoAtual][figuraAtual]
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
    setPontos([bodyClientToViewBox(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(), caixa)])
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!desenhando.current) return
    const next = bodyClientToViewBox(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect(), caixa)
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
    if (pontos.length > 0) salvar(appendBodyStroke(tracos, cor, pontos, espessura, caixa))
    setPontos([])
  }

  /** Sem traços, o próximo desenho já começa na figura nova (versão 2). */
  function salvar(next: BodyDrawingStroke[]) {
    onChange(next, next.length === 0 ? 2 : versaoAtual)
  }

  const vivo = bodyStrokeToPath(simplifyBodyStroke(pontos, BODY_DRAWING_MIN_STEP, caixa))

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
              onClick={() => salvar(tracos.slice(0, -1))}
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

      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-line bg-white">
        <svg
          viewBox={`0 0 ${caixa.width} ${caixa.height}`}
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
            width={caixa.width}
            height={caixa.height}
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
            salvar([])
            setConfirmarLimpar(false)
          }}
          onClose={() => setConfirmarLimpar(false)}
        />
      ) : null}
    </div>
  )
}
