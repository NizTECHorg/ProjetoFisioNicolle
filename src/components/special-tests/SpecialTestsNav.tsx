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
 * Navegação da página Testes especiais (tablet/desktop), no mesmo estilo da lateral da avaliação
 * e da de Termos: fixa na rolagem (sticky dentro da coluna, que estica na altura da página).
 * Linha da região seleciona e abre a lista; a seta só abre/fecha.
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

  function expand(id: SpecialTestRegionId) {
    setExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }

  return (
    <aside aria-label="Navegação dos testes" className="h-full">
      <div className="sticky top-4 flex max-h-[calc(100dvh-8rem)] flex-col">
        <p className="shrink-0 px-2 pb-3 text-sm font-semibold text-ink">Regiões e testes</p>

        <nav className="-mr-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-4 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {regions.map((region) => {
            const open = expanded.has(region.id)
            const active = region.id === activeRegionId
            const listId = `special-tests-nav-${region.id}`
            return (
              <div key={region.id}>
                <div
                  className={[
                    'flex min-h-10 items-center rounded-xl transition-colors',
                    active ? 'bg-accent-soft' : 'hover:bg-canvas',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => {
                      expand(region.id)
                      onSelectRegion(region.id)
                    }}
                    aria-current={active ? 'true' : undefined}
                    className={[
                      'flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-l-xl pl-2.5 text-left text-sm',
                      active ? 'font-semibold text-[#1e3a8a]' : 'font-medium text-ink',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden
                      className={[
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
                        active ? 'bg-[#1e3a8a] text-white' : 'bg-canvas text-muted',
                      ].join(' ')}
                    >
                      <ClipboardList size={14} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{region.label}</span>
                    <span className="shrink-0 text-xs font-medium text-muted">
                      {region.tests.length > 0 ? region.tests.length : 'Em breve'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(region.id)}
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-label={open ? `Recolher testes de ${region.label}` : `Mostrar testes de ${region.label}`}
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-ink"
                  >
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className={[
                        'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                        open ? 'rotate-0' : '-rotate-90',
                      ].join(' ')}
                    />
                  </button>
                </div>

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
                    {region.tests.length > 0 ? (
                      <ul className="mb-1 ml-3 mt-0.5 space-y-0.5">
                        {region.tests.map((test) => {
                          const current = test.id === currentTestId
                          return (
                            <li key={test.id}>
                              <button
                                type="button"
                                aria-current={current ? 'true' : undefined}
                                onClick={(e) => onOpenTest(region.id, test.id, e.currentTarget)}
                                className={[
                                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
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
                                <span className="min-w-0 truncate">{test.name}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="mb-1 ml-3 mt-0.5 px-2 py-1.5 text-xs text-muted">Em breve</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
