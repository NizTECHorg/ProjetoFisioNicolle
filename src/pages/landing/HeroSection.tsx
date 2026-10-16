import { Activity, CalendarClock, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import homiLp from '@/assets/landing/homi-lp.webp'
import { smoothLinePath } from '@/lib/smoothPath'
import { LinkButton, WhatsAppLink } from './LinkButton'
import { Blob, Eyebrow, Reveal, WaveDivider } from './LandingUi'

const PAIN_POINTS = [
  { x: 2, y: 4 },
  { x: 20, y: 8 },
  { x: 38, y: 14 },
  { x: 56, y: 20 },
  { x: 78, y: 26 },
]
const PAIN_PATH = smoothLinePath(PAIN_POINTS)

const TRUST = [
  { icon: ShieldCheck, label: 'Dados protegidos' },
  { icon: Smartphone, label: 'Funciona no celular' },
  { icon: Sparkles, label: 'IA só com o que você escreveu' },
]

export function HeroSection() {
  return (
    <section
      id="inicio"
      aria-labelledby="lp-hero-title"
      className="lp-section relative overflow-hidden bg-canvas"
    >
      <Blob className="-left-32 -top-24 h-96 w-96 bg-accent-soft" />
      <Blob className="-right-24 top-32 h-[28rem] w-[28rem] bg-sage/20" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-6 lg:col-span-7">
            <Reveal>
              <Eyebrow icon={<Activity size={16} aria-hidden="true" />}>
                Prontuário para fisioterapia
              </Eyebrow>
            </Reveal>
            <h1
              id="lp-hero-title"
              className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink lg:text-5xl"
            >
              Cuidado em <span className="text-accent">movimento</span>, prontuário em ordem.
            </h1>
            <p className="max-w-prose text-base leading-7 text-muted">
              O Fluxo reúne avaliação com mapa corporal, evolução das sessões, agenda e financeiro
              em um só lugar, para você dedicar seu tempo ao paciente.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
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
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon size={16} className="text-sage" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true" className="relative mx-auto w-full max-w-sm lg:col-span-5">
            <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_18px_50px_rgba(11,29,54,0.08)]">
              <div className="relative mx-auto aspect-[640/623] w-full max-w-[260px]">
                <img
                  src={homiLp}
                  width={640}
                  height={623}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
                <span className="absolute left-[30%] top-[22%] h-5 w-5 rounded-full bg-accent/70 ring-4 ring-accent/20" />
                <span className="absolute left-[46%] top-[48%] h-5 w-5 rounded-full bg-accent/70 ring-4 ring-accent/20" />
                <span className="absolute left-[58%] top-[74%] h-5 w-5 rounded-full bg-accent/70 ring-4 ring-accent/20" />
              </div>
              <p className="mt-4 text-center text-sm text-muted">Paciente Exemplo</p>
            </div>

            <div className="lp-float absolute -left-4 top-8 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg sm:-left-8">
              <div>
                <p className="text-sm font-semibold text-ink">Dor: 7 → 3</p>
                <svg viewBox="0 0 80 32" className="mt-1 h-8 w-20" fill="none">
                  <path
                    d={PAIN_PATH}
                    stroke="#2f7dff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            <div className="lp-float lp-float-delay absolute -right-2 bottom-10 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg sm:-right-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
                <CalendarClock size={20} className="text-[#1e3a8a]" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-ink">Próxima sessão · 14:30</p>
            </div>
          </div>
        </div>
      </div>
      <WaveDivider fill="fill-surface" />
    </section>
  )
}
