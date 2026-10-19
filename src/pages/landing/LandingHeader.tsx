import { useEffect, useRef, type RefObject } from 'react'
import { Menu, X } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { LinkButton } from './LinkButton'

const NAV_LINKS = [
  { href: '#produto', label: 'Produto' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#para-quem', label: 'Para quem' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
]

type LandingHeaderProps = {
  scrolled: boolean
  menuOpen: boolean
  onMenuOpenChange: (open: boolean) => void
  activeSection?: string | null
  progressRef?: RefObject<HTMLDivElement | null>
}

export function LandingHeader({
  scrolled,
  menuOpen,
  onMenuOpenChange,
  activeSection = null,
  progressRef,
}: LandingHeaderProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    panelRef.current?.querySelector<HTMLElement>('a')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onMenuOpenChange(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen, onMenuOpenChange])

  // Trap leve: Tab no último item do painel volta ao botão do menu
  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || event.shiftKey) return
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>('a')
    const last = focusables?.[focusables.length - 1]
    if (last && document.activeElement === last) {
      event.preventDefault()
      buttonRef.current?.focus()
    }
  }

  const linkClass =
    'inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-ink transition-colors hover:text-forest'

  return (
    <header
      className={[
        'sticky top-0 z-40 h-16 border-b backdrop-blur transition-[background-color,box-shadow] duration-300',
        scrolled
          ? 'border-line bg-surface/85 shadow-[0_8px_24px_rgba(11,29,54,0.06)]'
          : 'border-transparent bg-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandWordmark size="sm" variant="onLight" asLink to="/" showTagline={false} />

        <nav aria-label="Seções da página" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = activeSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? 'location' : undefined}
                className={`group ${linkClass}`}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'h-1.5 w-1.5 rounded-full bg-accent transition-[opacity,transform] duration-300',
                    active ? 'scale-100 opacity-100' : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100',
                  ].join(' ')}
                />
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LinkButton variant="ghost" to="/login">
            Entrar
          </LinkButton>
          <LinkButton to="/cadastro">Começar agora</LinkButton>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <LinkButton variant="ghost" to="/login">
            Entrar
          </LinkButton>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="lp-mobile-menu"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => onMenuOpenChange(!menuOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-ink transition-colors hover:bg-accent-soft"
          >
            {menuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Sempre montado: abre/fecha deslizando a altura com fade (fechado fica inert). */}
      <div
        id="lp-mobile-menu"
        ref={panelRef}
        onKeyDown={onPanelKeyDown}
        inert={menuOpen ? undefined : true}
        className={[
          'grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:hidden',
          menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-b border-line bg-surface shadow-lg">
            <div
              className={[
                'mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-6',
                menuOpen ? 'translate-y-0' : '-translate-y-3',
              ].join(' ')}
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => onMenuOpenChange(false)}
                  className={`${linkClass} w-full rounded-2xl hover:bg-accent-soft`}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3">
                <LinkButton to="/cadastro" fullWidth onClick={() => onMenuOpenChange(false)}>
                  Começar agora
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
        <div
          ref={progressRef}
          className="lp-progress h-full w-full bg-[linear-gradient(90deg,#2f7dff,#24b296)]"
        />
      </div>
    </header>
  )
}
