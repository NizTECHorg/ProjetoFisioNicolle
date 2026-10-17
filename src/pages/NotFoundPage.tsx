import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { LinkButton } from '@/pages/landing/LinkButton'
import { useLandingFont } from '@/pages/landing/useLandingFont'

/** O "0" do 404: um anel de progresso (como as metas do tratamento) com um ponto em órbita. */
function ZeroAnel() {
  return (
    <svg viewBox="0 0 120 120" className="h-[0.82em] w-[0.82em] shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="nf-anel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f7dff" />
          <stop offset="100%" stopColor="#24b296" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#e1e8f0" strokeWidth="14" />
      <circle
        className="nf-anel"
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke="url(#nf-anel)"
        strokeWidth="14"
        strokeLinecap="round"
        pathLength={100}
        transform="rotate(-90 60 60)"
      />
      <g className="nf-orbita">
        <circle cx="60" cy="16" r="9" fill="#ffffff" stroke="#2f7dff" strokeWidth="4" />
      </g>
    </svg>
  )
}

/** Página 404: endereço que não existe. Pública, no visual da landing. */
export function NotFoundPage() {
  const navigate = useNavigate()
  useLandingFont()

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[linear-gradient(180deg,#eaf2fd_0%,#f3f8fb_55%,#e6f5f0_100%)] font-sans text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-24 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-sage/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex h-16 items-center">
          <BrandWordmark size="sm" variant="onLight" asLink to="/" showTagline={false} />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
          <p className="lp-hero-in inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-ink ring-1 ring-line">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Erro 404
          </p>

          <p
            aria-hidden="true"
            className="lp-display lp-hero-in flex items-center gap-[0.04em] text-[120px] font-semibold leading-none text-ink [animation-delay:80ms] sm:text-[180px]"
          >
            <span>4</span>
            <ZeroAnel />
            <span>4</span>
          </p>

          <h1 className="lp-display lp-hero-in max-w-xl text-[32px] font-semibold leading-[1.15] [animation-delay:160ms] sm:text-[44px]">
            Esta página saiu do <em className="lp-gradient-text pr-1">alinhamento</em>
          </h1>
          <p className="lp-hero-in max-w-md text-base leading-7 text-muted [animation-delay:240ms]">
            O endereço não existe ou mudou de lugar. Mas fique tranquilo: o resto do Fluxo está em ordem.
          </p>

          <div className="lp-hero-in flex w-full flex-col items-center justify-center gap-3 [animation-delay:320ms] sm:w-auto sm:flex-row">
            <LinkButton to="/" className="w-full sm:w-auto">
              <Home size={18} aria-hidden="true" />
              Ir para o início
            </LinkButton>
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 sm:w-auto"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Voltar à página anterior
            </button>
          </div>
        </main>

        <footer className="py-6 text-center text-sm text-muted">© {new Date().getFullYear()} Fluxo</footer>
      </div>
    </div>
  )
}
