import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

/** Keep panel-scroll position when SVG paths receive focus (desktop scroll jump). */
function preservePanelScroll(run: () => void) {
  const panel = document.querySelector('.panel-scroll')
  const top = panel instanceof HTMLElement ? panel.scrollTop : window.scrollY
  run()
  requestAnimationFrame(() => {
    if (panel instanceof HTMLElement) {
      panel.scrollTop = top
      return
    }
    window.scrollTo({ top, left: window.scrollX })
  })
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
    const regionKey = openKey

    function placeChip() {
      const path = pathRefs.current.get(regionKey)
      const region = getFocusRegion(regionKey)
      const group = region ? groupRefs.current[region.view] : null
      if (!path || !group) return

      // Posição relativa ao wrapper da silhueta (absolute) — evita portal + scroll fantasma no desktop.
      const pathRect = path.getBoundingClientRect()
      const groupRect = group.getBoundingClientRect()
      const chip = chipRef.current
      const width = chip?.offsetWidth ?? 120
      const height = chip?.offsetHeight ?? 44
      let left = pathRect.right - groupRect.left - 4
      let top = pathRect.top - groupRect.top + pathRect.height / 2 - height / 2

      if (left + width > groupRect.width - 4) {
        left = pathRect.left - groupRect.left - width + 4
      }
      left = Math.min(Math.max(4, left), Math.max(4, groupRect.width - width - 4))
      top = Math.min(Math.max(4, top), Math.max(4, groupRect.height - height - 4))

      setChipPos((current) => {
        if (current && current.key === regionKey && current.left === left && current.top === top) {
          return current
        }
        return { key: regionKey, left, top }
      })
    }

    placeChip()
    const frame = window.requestAnimationFrame(placeChip)
    const panel = document.querySelector('.panel-scroll')
    window.addEventListener('resize', placeChip)
    panel?.addEventListener('scroll', placeChip)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', placeChip)
      panel?.removeEventListener('scroll', placeChip)
    }
  }, [openKey])

  useEffect(() => {
    if (!openKey || !canWrite) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (groupRefs.current.front?.contains(target)) return
      if (groupRefs.current.back?.contains(target)) return
      if (chipRef.current?.contains(target)) return
      closeChip()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const key = openKey
      closeChip()
      if (key) {
        preservePanelScroll(() => {
          pathRefs.current.get(key)?.focus({ preventScroll: true })
        })
      }
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
    preservePanelScroll(() => openRegion(key))
  }

  function onGroupPointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const next = event.relatedTarget
    if (next instanceof Node && chipRef.current?.contains(next)) return
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
    const showChipHere =
      Boolean(canWrite && openKey && chipPos?.key === openKey && openRegionMeta?.view === view)
    const markedOpen = openKey ? selectedKeys.has(openKey) : false
    const openLabel = openRegionMeta?.label ?? ''

    return (
      <div className="flex flex-col items-center">
        <div
          ref={(el) => {
            groupRefs.current[view] = el
          }}
          className="relative overflow-visible"
          onPointerLeave={onGroupPointerLeave}
        >
          <svg
            viewBox="0 0 140 240"
            overflow="hidden"
            className="h-44 w-auto overflow-hidden text-forest sm:h-52 [overflow-anchor:none]"
            aria-label={svgLabel}
          >
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
                  strokeWidth={0.65}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={`${regionPathClassName(marked, preview, canWrite)} scroll-m-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                  tabIndex={canWrite ? 0 : undefined}
                  onPointerEnter={() => onRegionPointerEnter(region.key)}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    onRegionPointerDown(region.key)
                  }}
                  onFocus={() => onRegionFocus(region.key)}
                />
              )
            })}
          </svg>

          {showChipHere ? (
            <button
              ref={chipRef}
              type="button"
              aria-pressed={markedOpen}
              aria-busy={toggle.isPending || undefined}
              onClick={onChipClick}
              onPointerLeave={(event) => {
                if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
                const next = event.relatedTarget
                const group = groupRefs.current[view]
                if (next instanceof Node && group?.contains(next)) return
                closeChip()
              }}
              className={[
                'absolute z-20 min-h-11 min-w-11 whitespace-nowrap rounded-lg border px-3 text-sm shadow-[0_8px_24px_rgba(11,29,54,0.10)]',
                markedOpen
                  ? 'border-accent bg-accent-soft font-semibold text-ink'
                  : 'border-line bg-surface text-ink',
              ].join(' ')}
              style={{
                left: chipPos?.left ?? 0,
                top: chipPos?.top ?? 0,
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
    <div
      role="group"
      aria-label="Áreas de foco do paciente"
      className="mt-3 w-full overflow-visible [overflow-anchor:none]"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-center">
        {renderFigure('front')}
        {renderFigure('back')}
      </div>

      {focusAreas.length === 0 ? (
        <div className="mt-4 text-center text-sm text-muted">
          <p>Sem áreas registradas.</p>
          {canWrite ? (
            <p>
              Passe o cursor 0,5 s sobre uma parte e clique na abinha para marcar. No toque, toque na
              parte e depois na abinha.
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
