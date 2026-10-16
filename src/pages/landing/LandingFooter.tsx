import { Link } from 'react-router-dom'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { Blob, Reveal } from './LandingUi'
import { LinkButton, WhatsAppLink } from './LinkButton'

const LINK =
  'inline-flex min-h-11 items-center text-sm text-white/70 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

const PRODUCT_LINKS = [
  { href: '#produto', label: 'Produto' },
  { href: '#criadora', label: 'Criadora' },
  { href: '#para-quem', label: 'Para quem' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingFooter() {
  return (
    <>
      <section
        aria-labelledby="lp-cta-title"
        className="lp-section relative overflow-hidden bg-forest text-white"
      >
        <Blob className="-left-16 top-0 h-80 w-80 bg-accent/25" />
        <Blob className="-right-16 bottom-0 h-80 w-80 bg-sage/25" />
        <Reveal
          variant="scale"
          className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8"
        >
          <h2
            id="lp-cta-title"
            className="lp-display text-[36px] font-semibold leading-[1.1] text-white md:text-[48px]"
          >
            Pronto para organizar <em className="lp-gradient-text">sua prática</em>?
          </h2>
          <p className="max-w-prose text-base leading-7 text-white/70">
            Crie sua conta e comece a registrar seus atendimentos hoje.
          </p>
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <LinkButton
              to="/cadastro"
              variant="light"
              className="w-full focus-visible:outline-white sm:w-auto"
            >
              Começar agora
            </LinkButton>
            <WhatsAppLink
              variant="outlineLight"
              className="w-full focus-visible:outline-white sm:w-auto"
            />
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10 bg-forest text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="flex flex-col gap-3 md:col-span-1">
            <BrandWordmark variant="onDark" size="sm" asLink to="/" />
            <p className="text-sm text-white/70">Fluxo · Sua prática, mais inteligente.</p>
          </div>
          <nav aria-label="Produto" className="flex flex-col">
            <p className="mb-1 text-sm font-semibold text-white">Produto</p>
            {PRODUCT_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={LINK}>
                {l.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Conta" className="flex flex-col">
            <p className="mb-1 text-sm font-semibold text-white">Conta</p>
            <Link to="/login" className={LINK}>
              Entrar
            </Link>
            <Link to="/cadastro" className={LINK}>
              Criar conta
            </Link>
          </nav>
          <nav aria-label="Contato" className="flex flex-col">
            <p className="mb-1 text-sm font-semibold text-white">Contato</p>
            <WhatsAppLink asText className="text-white focus-visible:outline-white" />
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-white/70 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} Fluxo. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </>
  )
}
