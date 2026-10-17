import { useEffect, useState } from 'react'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, FileSignature, History, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CONSENT_TERMS, type TermKey } from '@/lib/consentTerms'
import { scrollToElement } from '@/lib/scrollToElement'
import { TERMS_SECTION_IDS, termDomId } from '@/components/terms/termsSections'

type Props = {
  collapsed: ReadonlySet<TermKey>
  onToggle: (key: TermKey) => void
  onExpand: (key: TermKey) => void
  onSetAll: (collapsed: boolean) => void
  /** Termos já salvos para o paciente escolhido: o ponto fica azul. */
  saved: ReadonlySet<TermKey>
}

const SECTIONS = [
  TERMS_SECTION_IDS.signer,
  ...CONSENT_TERMS.map((t) => termDomId(t.key)),
  TERMS_SECTION_IDS.history,
]

/**
 * Navegação da página Termos só no tablet/desktop (md+): seções à direita, fixa na rolagem.
 * Linha do termo rola até ele e o abre; a seta só abre/fecha, sem rolar.
 */
export function TermsNav({ collapsed, onToggle, onExpand, onSetAll, saved }: Props) {
  const [active, setActive] = useState<string>(TERMS_SECTION_IDS.signer)

  useEffect(() => {
    // Seção "em que estou": a primeira visível na metade de cima da tela.
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top)
          else visible.delete(entry.target.id)
        }
        const first = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]
        if (first) setActive(first[0])
      },
      { rootMargin: '0px 0px -55% 0px', threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function goTo(id: string) {
    scrollToElement(document.getElementById(id))
    setActive(id)
  }

  function goToTerm(key: TermKey) {
    const wasCollapsed = collapsed.has(key)
    onExpand(key)
    // Espera o cartão começar a abrir antes de rolar até ele.
    if (wasCollapsed) window.setTimeout(() => goTo(termDomId(key)), 80)
    else goTo(termDomId(key))
  }

  const allCollapsed = CONSENT_TERMS.every((t) => collapsed.has(t.key))

  const rowClass = (current: boolean) =>
    ['flex min-h-10 items-center rounded-xl transition-colors', current ? 'bg-accent-soft' : 'hover:bg-canvas'].join(' ')
  const labelClass = (current: boolean) =>
    [
      'flex min-h-10 min-w-0 flex-1 items-center gap-2 pl-2.5 text-left text-sm',
      current ? 'font-semibold text-[#1e3a8a]' : 'font-medium text-ink',
    ].join(' ')
  const iconClass = (current: boolean) =>
    [
      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
      current ? 'bg-[#1e3a8a] text-white' : 'bg-canvas text-muted',
    ].join(' ')

  return (
    <aside aria-label="Navegação dos termos" className="h-full">
      <div className="sticky top-4">
        <p className="px-2 pb-3 text-sm font-semibold text-ink">Termos</p>
        <nav className="space-y-1">
          <div className={rowClass(active === TERMS_SECTION_IDS.signer)}>
            <button
              type="button"
              onClick={() => goTo(TERMS_SECTION_IDS.signer)}
              aria-current={active === TERMS_SECTION_IDS.signer ? 'location' : undefined}
              className={`${labelClass(active === TERMS_SECTION_IDS.signer)} rounded-xl pr-2.5`}
            >
              <span aria-hidden className={iconClass(active === TERMS_SECTION_IDS.signer)}>
                <UserRound size={14} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 truncate">Quem assina</span>
            </button>
          </div>

          {CONSENT_TERMS.map((term) => {
            const id = termDomId(term.key)
            const current = active === id
            const open = !collapsed.has(term.key)
            const isSaved = saved.has(term.key)
            return (
              <div key={term.key} className={rowClass(current)}>
                <button
                  type="button"
                  onClick={() => goToTerm(term.key)}
                  aria-current={current ? 'location' : undefined}
                  title={term.title}
                  className={`${labelClass(current)} rounded-l-xl`}
                >
                  <span aria-hidden className={iconClass(current)}>
                    <FileSignature size={14} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{term.category}</span>
                  <span
                    aria-hidden
                    className={['h-2 w-2 shrink-0 rounded-full', isSaved ? 'bg-accent' : 'bg-line'].join(' ')}
                  />
                  {isSaved ? <span className="sr-only"> (já salvo para este paciente)</span> : null}
                </button>
                <button
                  type="button"
                  onClick={() => onToggle(term.key)}
                  aria-expanded={open}
                  aria-controls={id}
                  aria-label={open ? `Recolher ${term.category}` : `Mostrar ${term.category}`}
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
            )
          })}

          <div className={rowClass(active === TERMS_SECTION_IDS.history)}>
            <button
              type="button"
              onClick={() => goTo(TERMS_SECTION_IDS.history)}
              aria-current={active === TERMS_SECTION_IDS.history ? 'location' : undefined}
              className={`${labelClass(active === TERMS_SECTION_IDS.history)} rounded-xl pr-2.5`}
            >
              <span aria-hidden className={iconClass(active === TERMS_SECTION_IDS.history)}>
                <History size={14} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 truncate">Termos salvos</span>
            </button>
          </div>
        </nav>

        <div className="pt-3">
          <Button type="button" variant="secondary" fullWidth className="!py-2.5" onClick={() => onSetAll(!allCollapsed)}>
            {allCollapsed ? <ChevronsUpDown size={16} aria-hidden /> : <ChevronsDownUp size={16} aria-hidden />}
            {allCollapsed ? 'Abrir todos' : 'Recolher todos'}
          </Button>
        </div>
      </div>
    </aside>
  )
}
