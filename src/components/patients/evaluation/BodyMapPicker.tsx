import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  FOCUS_REGIONS,
  focusRegionPathAriaLabel,
  listFocusRegionsByView,
  type FocusRegionKey,
  type FocusView,
} from '@/lib/focusRegions'

export type BodyMapSymbol = 'X' | 'hatch' | 'O' | 'arrow' | 'star'

export type BodyMapMark = {
  regionKey: string
  symbol?: BodyMapSymbol
}

const SYMBOL_OPTIONS: Array<{ value: BodyMapSymbol; label: string; glyph: string }> = [
  { value: 'X', label: 'Dor', glyph: 'X' },
  { value: 'hatch', label: 'Formigamento', glyph: '////' },
  { value: 'O', label: 'Dormência', glyph: 'O' },
  { value: 'arrow', label: 'Irradiação', glyph: '↑' },
  { value: 'star', label: 'Ponto principal', glyph: '★' },
]

const FRONT = listFocusRegionsByView('front')
const BACK = listFocusRegionsByView('back')

type BodyMapPickerProps = {
  marks: BodyMapMark[]
  onChange: (marks: BodyMapMark[]) => void
  canWrite?: boolean
}

function regionClass(marked: boolean, active: boolean, canWrite: boolean) {
  const fill = marked
    ? active
      ? 'fill-accent/50'
      : 'fill-accent/35'
    : active
      ? 'fill-accent/20'
      : 'fill-accent-soft/40'
  const stroke = marked || active ? 'stroke-accent' : 'stroke-forest'
  const cursor = canWrite ? 'cursor-pointer' : 'cursor-default'
  return [fill, stroke, cursor].join(' ')
}

/**
 * Local silhouette picker for ficha.sintomas.mapa — never syncs patient_focus_areas (T-12-04b).
 */
export function BodyMapPicker({ marks, onChange, canWrite = false }: BodyMapPickerProps) {
  const [activeKey, setActiveKey] = useState<FocusRegionKey | null>(null)
  const [symbol, setSymbol] = useState<BodyMapSymbol>('X')
  const pathRefs = useRef(new Map<FocusRegionKey, SVGPathElement>())

  const markByKey = useMemo(() => {
    const map = new Map<string, BodyMapMark>()
    for (const mark of marks) {
      if (FOCUS_REGIONS.some((r) => r.key === mark.regionKey)) {
        map.set(mark.regionKey, mark)
      }
    }
    return map
  }, [marks])

  function toggleRegion(key: FocusRegionKey) {
    if (!canWrite) return
    const existing = markByKey.get(key)
    if (existing) {
      onChange(marks.filter((m) => m.regionKey !== key))
      if (activeKey === key) setActiveKey(null)
      return
    }
    onChange([...marks, { regionKey: key, symbol }])
    setActiveKey(key)
  }

  function setRegionSymbol(key: FocusRegionKey, next: BodyMapSymbol) {
    if (!canWrite) return
    setSymbol(next)
    const has = markByKey.has(key)
    if (!has) {
      onChange([...marks, { regionKey: key, symbol: next }])
      return
    }
    onChange(
      marks.map((m) => (m.regionKey === key ? { ...m, symbol: next } : m)),
    )
  }

  function onFigureKeyDown(view: FocusView, event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!canWrite) return
    const advance = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const retreat = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!advance && !retreat) return
    event.preventDefault()
    const regions = view === 'front' ? FRONT : BACK
    if (regions.length === 0) return
    const focusedIndex = regions.findIndex(
      (region) => pathRefs.current.get(region.key) === event.target,
    )
    const activeIndex =
      focusedIndex === -1 && activeKey
        ? regions.findIndex((region) => region.key === activeKey)
        : focusedIndex
    const nextIndex =
      activeIndex === -1
        ? 0
        : advance
          ? (activeIndex + 1) % regions.length
          : (activeIndex - 1 + regions.length) % regions.length
    const next = regions[nextIndex]
    if (!next) return
    pathRefs.current.get(next.key)?.focus({ preventScroll: true })
  }

  function renderFigure(view: FocusView) {
    const regions = view === 'front' ? FRONT : BACK
    const caption = view === 'front' ? 'Vista anterior' : 'Vista posterior'
    return (
      <div className="flex flex-col items-center">
        <div
          className="scroll-m-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          tabIndex={canWrite ? 0 : undefined}
          onKeyDown={(event) => onFigureKeyDown(view, event)}
        >
          <svg
            viewBox="0 0 140 240"
            className="h-44 w-auto overflow-visible text-forest sm:h-52"
            aria-label={caption}
          >
            {regions.map((region) => {
              const marked = markByKey.has(region.key)
              const active = activeKey === region.key
              const pathProps = {
                ref: (el: SVGPathElement | null) => {
                  if (el) pathRefs.current.set(region.key, el)
                  else pathRefs.current.delete(region.key)
                },
                d: region.path,
                'aria-label': focusRegionPathAriaLabel(region),
                pointerEvents: 'fill' as const,
                strokeWidth: 0.65,
                strokeLinejoin: 'round' as const,
                strokeLinecap: 'round' as const,
                className: `${regionClass(marked, active, canWrite)} scroll-m-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`,
                onPointerDown: (event: ReactPointerEvent<SVGPathElement>) => {
                  event.preventDefault()
                },
                onClick: () => toggleRegion(region.key),
                onKeyDown: (event: ReactKeyboardEvent<SVGPathElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleRegion(region.key)
                  }
                },
              }
              if (!canWrite) {
                return <path key={region.key} {...pathProps} />
              }
              return <path key={region.key} {...pathProps} tabIndex={-1} />
            })}
          </svg>
        </div>
        <p className="mt-2 text-sm text-muted">{caption}</p>
      </div>
    )
  }

  const selectedLabels = marks
    .map((m) => {
      const region = FOCUS_REGIONS.find((r) => r.key === m.regionKey)
      if (!region) return null
      const sym = SYMBOL_OPTIONS.find((s) => s.value === (m.symbol ?? 'X'))
      return `${region.label}${sym ? ` (${sym.glyph})` : ''}`
    })
    .filter(Boolean)

  return (
    <div className="space-y-4" role="group" aria-label="Mapa corporal da avaliação">
      <p className="text-sm text-muted">Marque diretamente no corpo:</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center">
        {renderFigure('front')}
        {renderFigure('back')}
      </div>

      {canWrite ? (
        <div className="space-y-2">
          <p className="text-xs text-muted">Símbolo ao marcar</p>
          <div className="flex flex-wrap gap-2">
            {SYMBOL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={symbol === option.value}
                onClick={() => {
                  setSymbol(option.value)
                  if (activeKey) setRegionSymbol(activeKey, option.value)
                }}
                className={[
                  'inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm transition',
                  symbol === option.value
                    ? 'border-forest bg-accent-soft font-medium text-forest'
                    : 'border-line bg-canvas text-ink hover:border-forest/30',
                ].join(' ')}
              >
                <span className="font-semibold">{option.glyph}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {SYMBOL_OPTIONS.map((option) => (
          <li key={option.value}>
            <span className="font-semibold text-ink">{option.glyph}</span> = {option.label}
          </li>
        ))}
      </ul>

      {selectedLabels.length > 0 ? (
        <p className="text-sm text-ink">
          Marcado: {selectedLabels.join(', ')}
        </p>
      ) : (
        <p className="text-sm text-muted">Nenhuma região marcada nesta avaliação.</p>
      )}
    </div>
  )
}
