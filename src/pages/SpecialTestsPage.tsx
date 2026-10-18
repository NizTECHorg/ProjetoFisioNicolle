import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SpecialTestCard } from '@/components/special-tests/SpecialTestCard'
import { specialTestCardDomId } from '@/components/special-tests/specialTestDom'
import {
  SpecialTestDetailContent,
  SpecialTestPanel,
} from '@/components/special-tests/SpecialTestDetail'
import { SpecialTestsNav } from '@/components/special-tests/SpecialTestsNav'
import { useIsDesktop, useIsTabletUp } from '@/hooks/useMediaQuery'
import {
  DEFAULT_REGION_ID,
  SPECIAL_TEST_REGIONS,
  findRegion,
  findSpecialTest,
  isRegionId,
  searchSpecialTests,
} from '@/lib/testesEspeciais'
import type { SpecialTestRegionId } from '@/lib/testesEspeciais'

const FIELD_CLASSES =
  'w-full rounded-2xl border bg-canvas px-4 py-3.5 text-ink placeholder:text-muted/50 transition-colors duration-200 focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25 border-line hover:border-forest/25 min-h-11 pl-11 pr-12'

const EMPTY_BOX = 'rounded-2xl border border-dashed border-line bg-surface px-4 py-12 text-center'

export function SpecialTestsPage() {
  const [params, setParams] = useSearchParams()
  const regionParam = params.get('regiao')
  const regionId: SpecialTestRegionId = isRegionId(regionParam) ? regionParam : DEFAULT_REGION_ID
  const openHit = findSpecialTest(params.get('teste'))
  const isDesktop = useIsDesktop()
  const isTabletUp = useIsTabletUp()
  const [query, setQuery] = useState('')
  const [popupOpen, setPopupOpen] = useState(() => openHit !== null && !isDesktop)
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(openHit?.test.id ?? null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const prevDesktopRef = useRef(isDesktop)

  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void, replace: boolean) => {
      const next = new URLSearchParams(params)
      mutate(next)
      setParams(next, { replace })
    },
    [params, setParams],
  )

  function selectRegion(id: SpecialTestRegionId) {
    setQuery('')
    updateParams((p) => {
      p.set('regiao', id)
      p.delete('teste')
    }, true)
  }

  function openTest(testId: string, trigger: HTMLElement, extra?: (p: URLSearchParams) => void) {
    triggerRef.current = trigger
    setLastOpenedId(testId)
    updateParams((p) => {
      extra?.(p)
      p.set('teste', testId)
    }, !isDesktop)
    if (!isDesktop) setPopupOpen(true)
  }

  function openFromNav(rId: SpecialTestRegionId, testId: string, trigger: HTMLButtonElement) {
    const changeRegion = query.trim() === '' && rId !== regionId
    openTest(testId, trigger, changeRegion ? (p) => p.set('regiao', rId) : undefined)
    requestAnimationFrame(() => {
      document.getElementById(specialTestCardDomId(testId))?.scrollIntoView({ block: 'nearest' })
    })
  }

  const closeDetail = useCallback(() => {
    setPopupOpen(false)
    updateParams((p) => p.delete('teste'), true)
    requestAnimationFrame(() => {
      const t = triggerRef.current
      if (t?.isConnected) {
        t.focus()
        return
      }
      const card = lastOpenedId
        ? document.querySelector<HTMLElement>(`#${specialTestCardDomId(lastOpenedId)} button`)
        : null
      ;(card ?? document.querySelector<HTMLElement>('h1'))?.focus()
    })
  }, [updateParams, lastOpenedId])

  const hasOpenHit = openHit !== null
  useEffect(() => {
    if (prevDesktopRef.current === isDesktop) return
    prevDesktopRef.current = isDesktop
    if (isDesktop) {
      setPopupOpen(false)
    } else if (hasOpenHit && !popupOpen) {
      updateParams((p) => p.delete('teste'), true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage só à mudança de breakpoint
  }, [isDesktop])

  const popupVisible = !isDesktop && popupOpen && hasOpenHit
  useEffect(() => {
    if (!popupVisible) return
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Fechar"]')?.focus()
    })
  }, [popupVisible])

  const searching = query.trim() !== ''
  const region = findRegion(regionId)
  const hits = searching
    ? searchSpecialTests(query)
    : region.tests.map((test) => ({ region, test }))
  const countText =
    hits.length === 0 ? 'Nenhum teste encontrado.' : hits.length === 1 ? '1 teste' : `${hits.length} testes`

  return (
    <section className="mx-auto w-full max-w-7xl md:flex md:items-stretch md:gap-6">
      <div className="min-w-0 space-y-4 md:flex-1 xl:flex-[2]">
        <PageHeader
          className="dash-in"
          title="Testes Especiais Ortopédicos"
          description="Selecione a região anatômica para ver os testes específicos"
        />

        <div className="flex flex-wrap gap-2">
          {SPECIAL_TEST_REGIONS.map((r) => {
            const active = !searching && r.id === regionId
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectRegion(r.id)}
                className={[
                  'min-h-11 rounded-full border px-4 text-sm font-semibold',
                  active
                    ? 'border-accent bg-accent-soft text-forest'
                    : 'border-line bg-surface text-muted',
                ].join(' ')}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search
            size={18}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault()
                setQuery('')
              }
            }}
            aria-label="Buscar teste"
            placeholder="Buscar teste..."
            autoComplete="off"
            spellCheck={false}
            className={FIELD_CLASSES}
          />
          {query ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setQuery('')}
              className="absolute right-1 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          ) : null}
        </div>

        <p className="sr-only" aria-live="polite">
          {countText}
        </p>

        {hits.length > 0 ? (
          <ul className="space-y-4">
            {hits.map(({ region: hitRegion, test }) => (
              <SpecialTestCard
                key={test.id}
                test={test}
                regionLabel={searching ? hitRegion.label : undefined}
                selected={isDesktop && openHit?.test.id === test.id}
                onOpen={openTest}
              />
            ))}
          </ul>
        ) : searching ? (
          <div role="status" className={EMPTY_BOX}>
            <Search size={24} aria-hidden className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-semibold text-ink">Nenhum teste encontrado.</p>
            <p className="mt-1 text-sm text-muted">
              Confira a grafia ou busque por outra palavra do nome ou do objetivo do teste.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => setQuery('')}>
              Limpar busca
            </Button>
          </div>
        ) : (
          <div role="status" className={EMPTY_BOX}>
            <ClipboardList size={24} aria-hidden className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-semibold text-ink">Em breve</p>
            <p className="mt-1 text-sm text-muted">
              Os testes de {region.label} ainda estão sendo preparados.
            </p>
          </div>
        )}
      </div>

      {isTabletUp ? (
        <div className="md:w-72 md:shrink-0 xl:w-auto xl:min-w-0 xl:flex-[3]">
          {isDesktop && openHit ? (
            <SpecialTestPanel
              test={openHit.test}
              regionLabel={openHit.region.label}
              onClose={closeDetail}
            />
          ) : (
            <SpecialTestsNav
              regions={SPECIAL_TEST_REGIONS}
              activeRegionId={searching ? null : regionId}
              currentTestId={isDesktop ? lastOpenedId : popupOpen ? (openHit?.test.id ?? null) : null}
              onSelectRegion={selectRegion}
              onOpenTest={openFromNav}
            />
          )}
        </div>
      ) : null}

      <Modal open={popupVisible} title={openHit?.test.name ?? ''} onClose={closeDetail}>
        {openHit ? (
          <>
            <SpecialTestDetailContent
              test={openHit.test}
              regionLabel={openHit.region.label}
              showTitle={false}
            />
            <div className="mt-6 flex sm:justify-end">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={closeDetail}>
                Fechar detalhes
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  )
}
