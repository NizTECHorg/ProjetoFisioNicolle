import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTogglePatientFocusArea } from '@/hooks/usePatients'
import {
  focusRegionListLabel,
  focusRegionPathAriaLabel,
  getFocusRegion,
  listFocusRegionsByView,
  type FocusRegionKey,
  type FocusView,
} from '@/lib/focusRegions'
import type { PatientFocusArea } from '@/types/patient'

/** D-05: fine pointer waits this long before the abinha opens. */
export const HOVER_OPEN_MS = 500

const FRONT_REGIONS = listFocusRegionsByView('front')
const BACK_REGIONS = listFocusRegionsByView('back')

const BODY_OUTLINE =
  'M70 8C56 8 49 16 49 26C49 34 54 40 62 44L59 56H34C24 56 18 64 18 74V86L14 138C10 150 14 166 28 170C42 174 52 164 50 152L52 144L48 172L46 204L43 220C28 222 20 226 20 232L24 238H52C62 238 66 232 66 224L68 204L70 172L72 204L74 224C74 232 78 238 88 238H116L120 232C120 226 112 222 97 220L94 204L92 172L88 144L90 152C88 164 98 174 112 170C126 166 130 150 126 138L122 86V74C122 64 116 56 106 56H81L78 44C86 40 91 34 91 26C91 16 84 8 70 8Z'

type PatientFocusAreasPanelProps = {
  patientId: string
  focusAreas: PatientFocusArea[]
  canWrite?: boolean
}

type ChipAnchor = {
  key: FocusRegionKey
  left: number
  top: number
}

function delayOpenMs() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return HOVER_OPEN_MS
  return 0
}

function regionPathClassName(marked: boolean, preview: boolean, canWrite: boolean) {
  const showPreview = canWrite && preview
  const fill = marked
    ? showPreview
      ? 'fill-accent/45'
      : 'fill-accent/35'
    : showPreview
      ? 'fill-accent/20'
      : 'fill-accent-soft/40'
  const stroke = marked || showPreview ? 'stroke-accent' : 'stroke-forest'
  const cursor = canWrite ? 'cursor-pointer' : 'cursor-default'
  return [fill, stroke, cursor].join(' ')
}

export function PatientFocusAreasPanel({
  patientId,
  focusAreas,
  canWrite = true,
}: PatientFocusAreasPanelProps) {
  const toggle = useTogglePatientFocusArea(patientId)
  const [openKey, setOpenKey] = useState<FocusRegionKey | null>(null)
  const [hotKey, setHotKey] = useState<FocusRegionKey | null>(null)
  const [chipPos, setChipPos] = useState<ChipAnchor | null>(null)
  const timerRef = useRef<number | null>(null)
  const pathRefs = useRef(new Map<FocusRegionKey, SVGPathElement>())
  const groupRefs = useRef({ front: null as HTMLDivElement | null, back: null as HTMLDivElement | null })
  const chipRef = useRef<HTMLButtonElement | null>(null)

  const selectedKeys = new Set(
    focusAreas.map((area) => area.regionKey).filter((key) => getFocusRegion(key)),
  )

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const closeChip = useCallback(() => {
    clearTimer()
    setOpenKey(null)
    setHotKey(null)
    setChipPos(null)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  useLayoutEffect(() => {
    if (!openKey) {
      setChipPos(null)
      return
    }
    const path = pathRefs.current.get(openKey)
    const region = getFocusRegion(openKey)
    const group = region ? groupRefs.current[region.view] : null
    const svg = path?.ownerSVGElement
    if (!path || !region || !group || !svg) return
    const bbox = path.getBBox()
    const ctm = path.getScreenCTM()
    if (!ctm) return
    const point = svg.createSVGPoint()
    point.x = bbox.x + bbox.width
    point.y = bbox.y + bbox.height / 2
    const screen = point.matrixTransform(ctm)
    const wrap = group.getBoundingClientRect()
    setChipPos({
      key: openKey,
      left: screen.x - wrap.left - 4,
      top: screen.y - wrap.top,
    })
  }, [openKey])

  useEffect(() => {
    if (!openKey || !canWrite) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (groupRefs.current.front?.contains(target)) return
      if (groupRefs.current.back?.contains(target)) return
      closeChip()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const key = openKey
      closeChip()
      if (key) pathRefs.current.get(key)?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openKey, canWrite, closeChip])

  function openRegion(key: FocusRegionKey) {
    if (!canWrite) return
    clearTimer()
    setOpenKey(key)
  }

  function onRegionPointerEnter(key: FocusRegionKey) {
    if (!canWrite) return
    setHotKey(key)
    const delay = delayOpenMs()
    if (delay === 0) {
      openRegion(key)
      return
    }
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      setOpenKey(key)
    }, HOVER_OPEN_MS)
  }

  function onRegionPointerDown(key: FocusRegionKey) {
    if (!canWrite) return
    if (delayOpenMs() === 0) openRegion(key)
  }

  function onRegionFocus(key: FocusRegionKey) {
    if (!canWrite) return
    openRegion(key)
  }

  function onGroupPointerLeave() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    closeChip()
  }

  function onChipClick() {
    if (!openKey || toggle.isPending) return
    toggle.mutate(openKey, { onSuccess: () => closeChip() })
  }

  function renderFigure(view: FocusView) {
    const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS
    const caption = view === 'front' ? 'Frente' : 'Costas'
    const svgLabel = view === 'front' ? 'Silhueta de frente' : 'Silhueta de costas'
    const openRegionMeta = openKey ? getFocusRegion(openKey) : undefined
    const markedOpen = openKey ? selectedKeys.has(openKey) : false
    const openLabel = openRegionMeta?.label ?? ''
    const showChip = Boolean(
      canWrite && openKey && openRegionMeta?.view === view && chipPos?.key === openKey,
    )

    return (
      <div className="flex flex-col items-center">
        <div
          ref={(el) => {
            groupRefs.current[view] = el
          }}
          className="relative"
          onPointerLeave={onGroupPointerLeave}
        >
          <svg
            viewBox="0 0 140 240"
            className="h-44 w-auto text-forest sm:h-52"
            aria-label={svgLabel}
          >
            <path
              d={BODY_OUTLINE}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              pointerEvents="none"
            />
            {regions.map((region) => {
              const marked = selectedKeys.has(region.key)
              const preview = hotKey === region.key || openKey === region.key
              return (
                <path
                  key={region.key}
                  ref={(el) => {
                    if (el) pathRefs.current.set(region.key, el)
                    else pathRefs.current.delete(region.key)
                  }}
                  d={region.path}
                  data-region={region.key}
                  aria-label={focusRegionPathAriaLabel(region)}
                  pointerEvents="fill"
                  strokeWidth={1.5}
                  className={regionPathClassName(marked, preview, canWrite)}
                  tabIndex={canWrite ? 0 : undefined}
                  onPointerEnter={() => onRegionPointerEnter(region.key)}
                  onPointerDown={() => onRegionPointerDown(region.key)}
                  onFocus={() => onRegionFocus(region.key)}
                />
              )
            })}
          </svg>
          {showChip && openKey ? (
            <button
              ref={chipRef}
              type="button"
              aria-pressed={markedOpen}
              aria-busy={toggle.isPending || undefined}
              onClick={onChipClick}
              className={[
                'absolute z-10 min-h-11 min-w-11 whitespace-nowrap rounded-lg border px-3 text-sm shadow-[0_8px_24px_rgba(11,29,54,0.10)]',
                markedOpen
                  ? 'border-accent bg-accent-soft font-semibold text-ink'
                  : 'border-line bg-surface text-ink',
              ].join(' ')}
              style={{
                left: chipPos?.left ?? 0,
                top: chipPos?.top ?? 0,
                transform: 'translateY(-50%)',
              }}
            >
              {markedOpen ? `Desmarcar ${openLabel}` : `Marcar ${openLabel}`}
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-sm font-normal text-muted">{caption}</p>
      </div>
    )
  }

  return (
    <div role="group" aria-label="Áreas de foco do paciente" className="mt-3">
      <div className="flex items-end justify-center gap-4">
        {renderFigure('front')}
        {renderFigure('back')}
      </div>

      {focusAreas.length === 0 ? (
        <div className="mt-4 text-center text-sm text-muted">
          <p>Sem áreas registradas.</p>
          {canWrite ? (
            <p>
              Passe o cursor 0,5 s sobre uma parte e clique na abinha para marcar. No toque, toque na parte e depois na abinha.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="sr-only">
          {focusAreas.map((area) => {
            const region = getFocusRegion(area.regionKey)
            if (!region) return null
            return <li key={area.id}>{focusRegionListLabel(region)}</li>
          })}
        </ul>
      )}
    </div>
  )
}
