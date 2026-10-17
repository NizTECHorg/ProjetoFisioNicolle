import { Link } from 'react-router-dom'
import { ArrowUpRight, HeartPulse, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { Blob, Reveal } from './LandingUi'
import { LinkButton, WhatsAppLink } from './LinkButton'
import { MAKER_NAME, MAKER_URL } from './landing.config'

const LINK =
  'inline-flex min-h-10 items-center text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

const PRODUCT_LINKS = [
  { href: '#produto', label: 'Produto' },
  { href: '#criadora', label: 'Criadora' },
  { href: '#para-quem', label: 'Para quem' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
]

const SELOS = [
  { icon: ShieldCheck, label: 'Dados protegidos' },
  { icon: Smartphone, label: 'Celular e computador' },
  { icon: Sparkles, label: 'IA que você revisa' },
]

export function LandingFooter() {
  return (
    <div className="relative overflow-hidden bg-forest text-white">
      <Blob className="-left-24 top-0 h-96 w-96 bg-accent/25" />
      <Blob className="-right-24 top-1/3 h-96 w-96 bg-sage/20" />

      {/* Chamado final */}
      <section aria-labelledby="lp-cta-title" className="lp-section relative">
        <Reveal
          variant="scale"
          className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white">
            <HeartPulse size={16} className="text-sage" aria-hidden="true" />
            Comece hoje
          </span>
          <h2
            id="lp-cta-title"
            className="lp-display text-[36px] font-semibold leading-[1.1] text-white md:text-[52px]"
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
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-white/60">
            {SELOS.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon size={16} className="text-sage" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <footer className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          {/* Cartão de vidro com marca e links */}
          <div className="grid gap-10 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 backdrop-blur sm:p-8 md:grid-cols-12">
            <div className="flex flex-col gap-4 md:col-span-5">
              <BrandWordmark variant="onDark" size="sm" asLink to="/" />
              <p className="max-w-sm text-sm leading-6 text-white/65">
                Prontuário, avaliação, evolução, agenda e financeiro para fisioterapeutas autônomos e
                clínicas — em um só lugar.
              </p>
              <WhatsAppLink
                variant="outlineLight"
                className="w-fit focus-visible:outline-white"
              />
            </div>
            <nav aria-label="Produto" className="flex flex-col md:col-span-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Produto</p>
              {PRODUCT_LINKS.map((l) => (
                <a key={l.href} href={l.href} className={LINK}>
                  {l.label}
                </a>
              ))}
            </nav>
            <nav aria-label="Conta" className="flex flex-col md:col-span-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Conta</p>
              <Link to="/login" className={LINK}>
                Entrar
              </Link>
              <Link to="/cadastro" className={LINK}>
                Criar conta
              </Link>
            </nav>
          </div>

          {/* Marca d'água */}
          <p
            aria-hidden="true"
            className="lp-display pointer-events-none select-none bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0))] bg-clip-text pt-6 text-center text-[22vw] font-semibold leading-[0.8] text-transparent md:text-[180px]"
          >
            Fluxo
          </p>

          <div className="flex flex-col items-center justify-between gap-3 pt-6 text-sm text-white/55 sm:flex-row">
            <p>© {new Date().getFullYear()} Fluxo. Todos os direitos reservados.</p>
            <a
              href={MAKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-10 items-center gap-1.5 text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Feito por <span className="font-semibold text-white">{MAKER_NAME}</span>
              <ArrowUpRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
