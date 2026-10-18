import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SpecialTestRegion, SpecialTestRegionId } from '@/lib/testesEspeciais'

interface SpecialTestsNavProps {
  regions: readonly SpecialTestRegion[]
  activeRegionId: SpecialTestRegionId | null
  currentTestId: string | null
  onSelectRegion: (id: SpecialTestRegionId) => void
  onOpenTest: (
    regionId: SpecialTestRegionId,
    testId: string,
    trigger: HTMLButtonElement,
  ) => void
}

export function SpecialTestsNav({
  regions,
  activeRegionId,
  currentTestId,
  onSelectRegion,
  onOpenTest,
}: SpecialTestsNavProps) {
  const [expanded, setExpanded] = useState<Set<SpecialTestRegionId>>(
    () => new Set(activeRegionId ? [activeRegionId] : []),
  )

  useEffect(() => {
    if (!activeRegionId) return
    setExpanded((prev) => (prev.has(activeRegionId) ? prev : new Set(prev).add(activeRegionId)))
  }, [activeRegionId])

  function toggle(id: SpecialTestRegionId) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside
      aria-label="Navegação dos testes"
      className="sticky top-4 max-h-[calc(100dvh-8rem)] self-start overflow-y-auto rounded-2xl border border-line bg-surface p-4"
    >
      <p className="px-2 pb-3 text-sm font-semibold text-ink">Regiões e testes</p>
      <nav>
        <ul className="space-y-1">
          {regions.map((region) => {
            const open = expanded.has(region.id)
            return (
              <li key={region.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`special-tests-nav-${region.id}`}
                  onClick={() => {
                    toggle(region.id)
                    onSelectRegion(region.id)
                  }}
                  className="flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm font-semibold text-ink hover:bg-canvas"
                >
                  <span className="min-w-0 flex-1">{region.label}</span>
                  <span className="text-sm font-normal text-muted">
                    {region.tests.length > 0 ? String(region.tests.length) : 'Em breve'}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={[
                      'shrink-0 text-muted transition-transform duration-300 motion-reduce:transition-none',
                      open ? 'rotate-180' : 'rotate-0',
                    ].join(' ')}
                  />
                </button>
                {open ? (
                  region.tests.length > 0 ? (
                    <ul id={`special-tests-nav-${region.id}`} className="mt-1 space-y-1">
                      {region.tests.map((test) => {
                        const current = test.id === currentTestId
                        return (
                          <li key={test.id}>
                            <button
                              type="button"
                              aria-current={current ? 'true' : undefined}
                              onClick={(e) => onOpenTest(region.id, test.id, e.currentTarget)}
                              className={[
                                'flex min-h-10 w-full items-center rounded-xl py-2 pl-6 pr-2.5 text-left text-sm',
                                current
                                  ? 'bg-accent-soft font-semibold text-[#1e3a8a]'
                                  : 'font-normal text-ink hover:bg-canvas',
                              ].join(' ')}
                            >
                              {test.name}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p
                      id={`special-tests-nav-${region.id}`}
                      className="py-2 pl-6 pr-2.5 text-sm text-muted"
                    >
                      Em breve
                    </p>
                  )
                ) : null}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
