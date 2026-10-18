import { useEffect, useState } from 'react'
import { ChevronDown, ClipboardList } from 'lucide-react'
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

/**
 * Navegação da página Testes especiais (tablet/desktop): fixa na rolagem (sticky no topo da
 * coluna direita, que estica na altura da página) e rola por dentro quando passa da tela.
 */
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

  const total = regions.reduce((sum, region) => sum + region.tests.length, 0)

  return (
    <aside
      aria-label="Navegação dos testes"
      className="sticky top-4 flex max-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-4">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1e3a8a] text-white"
        >
          <ClipboardList size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Regiões e testes</p>
          <p className="text-sm text-muted">{total === 1 ? '1 teste disponível' : `${total} testes disponíveis`}</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]">
        <ul className="space-y-1">
          {regions.map((region) => {
            const open = expanded.has(region.id)
            const active = region.id === activeRegionId
            const hasTests = region.tests.length > 0
            const listId = `special-tests-nav-${region.id}`
            return (
              <li key={region.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() => {
                    toggle(region.id)
                    onSelectRegion(region.id)
                  }}
                  className={[
                    'flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm transition-colors',
                    active ? 'bg-accent-soft font-semibold text-[#1e3a8a]' : 'font-medium text-ink hover:bg-canvas',
                  ].join(' ')}
                >
                  <span className="min-w-0 flex-1 truncate">{region.label}</span>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                      hasTests
                        ? active
                          ? 'bg-[#1e3a8a] text-white'
                          : 'bg-accent-soft text-[#1e3a8a]'
                        : 'bg-canvas font-medium text-muted',
                    ].join(' ')}
                  >
                    {hasTests ? String(region.tests.length) : 'Em breve'}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={[
                      'shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                      open ? 'rotate-180' : 'rotate-0',
                    ].join(' ')}
                  />
                </button>

                {/* Abre/fecha deslizando a altura (grid 1fr/0fr) com fade; fechado fica inert. */}
                <div
                  id={listId}
                  inert={open ? undefined : true}
                  className={[
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  ].join(' ')}
                >
                  <div className="min-h-0 overflow-hidden">
                    {hasTests ? (
                      <ul className="mb-1 ml-4 mt-1 space-y-0.5 border-l border-line pl-2">
                        {region.tests.map((test) => {
                          const current = test.id === currentTestId
                          return (
                            <li key={test.id}>
                              <button
                                type="button"
                                aria-current={current ? 'true' : undefined}
                                onClick={(e) => onOpenTest(region.id, test.id, e.currentTarget)}
                                className={[
                                  'flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                                  current
                                    ? 'bg-accent-soft font-semibold text-[#1e3a8a]'
                                    : 'text-muted hover:bg-canvas hover:text-ink',
                                ].join(' ')}
                              >
                                <span
                                  aria-hidden
                                  className={[
                                    'h-2 w-2 shrink-0 rounded-full transition-colors',
                                    current ? 'bg-accent' : 'bg-line',
                                  ].join(' ')}
                                />
                                <span className="min-w-0">{test.name}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="mb-1 ml-4 mt-1 border-l border-line py-2 pl-4 text-sm text-muted">
                        Os testes de {region.label} ainda estão sendo preparados.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
