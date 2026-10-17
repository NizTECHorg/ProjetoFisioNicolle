import { Activity, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import { HeroDevices } from './HeroDevices'
import { LinkButton, WhatsAppLink } from './LinkButton'
import { Eyebrow, WaveDivider } from './LandingUi'
import { useParallax } from './useParallax'

const TRUST = [
  { icon: ShieldCheck, label: 'Dados protegidos' },
  { icon: Smartphone, label: 'Funciona no celular' },
  { icon: Sparkles, label: 'IA só com o que você escreveu' },
]

export function HeroSection() {
  const blobA = useParallax<HTMLDivElement>(0.2)
  const blobB = useParallax<HTMLDivElement>(-0.15)

  return (
    <section
      id="inicio"
      aria-labelledby="lp-hero-title"
      className="lp-section relative -mt-16 overflow-hidden bg-[linear-gradient(180deg,#eaf2fd_0%,#f3f8fb_55%,#e6f5f0_100%)] pt-16"
    >
      <div ref={blobA} aria-hidden="true" className="pointer-events-none absolute -left-32 -top-24">
        <div className="h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-3xl" />
      </div>
      <div ref={blobB} aria-hidden="true" className="pointer-events-none absolute -right-24 top-40">
        <div className="h-[30rem] w-[30rem] rounded-full bg-sage/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 md:pb-20 md:pt-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start gap-6 lg:col-span-6">
            <div className="lp-hero-in">
              <Eyebrow icon={<Activity size={16} className="text-accent" aria-hidden="true" />}>
                Prontuário para fisioterapia
              </Eyebrow>
            </div>
            <h1
              id="lp-hero-title"
              className="lp-display lp-hero-in text-[42px] font-semibold leading-[1.04] text-ink [animation-delay:80ms] sm:text-[56px] lg:text-[64px]"
            >
              Cuidado em{' '}
              <span className="relative inline-block whitespace-nowrap">
                <em className="lp-gradient-text pr-1 font-semibold">movimento</em>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 24"
                  preserveAspectRatio="none"
                  className="lp-swoosh absolute -bottom-2 left-0 h-3 w-full sm:h-4"
                  fill="none"
                >
                  <path
                    d="M4 16 C 70 4, 150 4, 296 12"
                    stroke="url(#lp-swoosh-grad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="lp-swoosh-grad" x1="0" x2="1">
                      <stop offset="0" stopColor="#2f7dff" stopOpacity="0.5" />
                      <stop offset="1" stopColor="#24b296" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              , prontuário em ordem.
            </h1>
            <p className="lp-hero-in max-w-prose text-base leading-7 text-muted [animation-delay:160ms] md:text-lg md:leading-8">
              O Fluxo reúne avaliação com mapa corporal, evolução das sessões, agenda e financeiro
              em um só lugar, para você dedicar seu tempo ao paciente.
            </p>
            <div className="lp-hero-in flex w-full flex-col gap-3 [animation-delay:240ms] sm:w-auto sm:flex-row sm:items-center">
              <LinkButton to="/cadastro" className="w-full sm:w-auto">
                Começar agora
              </LinkButton>
              <LinkButton variant="secondary" to="/login" className="w-full sm:w-auto">
                Entrar
              </LinkButton>
              <WhatsAppLink asText className="justify-center sm:justify-start sm:px-2">
                Falar no WhatsApp
              </WhatsAppLink>
            </div>
            <ul className="lp-hero-in flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted [animation-delay:320ms]">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon size={16} className="text-sage" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <HeroDevices />
          </div>
        </div>
      </div>
      <WaveDivider fill="fill-surface" />
    </section>
  )
}
