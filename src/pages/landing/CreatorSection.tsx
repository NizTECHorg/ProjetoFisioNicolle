import { ArrowRight, CalendarDays, ChartColumn, GraduationCap, UsersRound } from 'lucide-react'
import { Eyebrow, Reveal, WaveDivider } from './LandingUi'
import {
  ABOUT_PARAGRAPHS,
  CREATOR_NAME,
  CREATOR_ROLE,
  HERO_DESKTOP_IMAGE,
  HERO_MOBILE_IMAGE,
} from './landing.config'

const PILARES = [
  { icon: GraduationCap, label: 'Baseado na prática clínica' },
  { icon: CalendarDays, label: 'Organização da rotina' },
  { icon: ChartColumn, label: 'Evolução do paciente' },
  { icon: UsersRound, label: 'Integração entre profissionais' },
]

// Zoom leve no hover de cada aparelho, entrando e saindo devagar.
const ZOOM =
  'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05] motion-reduce:transition-none motion-reduce:hover:scale-100'

/** Sobre o Fluxo: o produto em primeiro plano e a assinatura de quem idealizou, discreta. */
export function CreatorSection() {
  return (
    <section
      id="sobre"
      aria-labelledby="lp-sobre-title"
      className="lp-section relative overflow-hidden bg-sage-soft"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
          <Reveal variant="scale" className="relative md:col-span-6">
            <div aria-hidden="true" className="relative mx-auto aspect-[4/3] w-full max-w-[520px]">
              {/* Mancha azul e anel fino atrás dos aparelhos */}
              <div className="lp-blob-shape absolute inset-[6%] bg-[radial-gradient(circle_at_40%_40%,#dbe9ff,#eaf2fd_60%,transparent_75%)]" />
              <div className="absolute inset-[-2%] rounded-[50%] border border-accent/25" />
              {HERO_DESKTOP_IMAGE ? (
                <img
                  src={HERO_DESKTOP_IMAGE}
                  alt=""
                  width={1600}
                  height={1067}
                  loading="lazy"
                  decoding="async"
                  className={`absolute left-0 top-[12%] w-[82%] -rotate-[4deg] drop-shadow-[0_24px_40px_rgba(11,29,54,0.16)] ${ZOOM}`}
                />
              ) : null}
              {HERO_MOBILE_IMAGE ? (
                <img
                  src={HERO_MOBILE_IMAGE}
                  alt=""
                  width={600}
                  height={1199}
                  loading="lazy"
                  decoding="async"
                  className={`absolute bottom-[2%] right-[4%] w-[28%] rotate-[3deg] drop-shadow-[0_24px_36px_rgba(11,29,54,0.22)] ${ZOOM}`}
                />
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={120} variant="right" className="flex flex-col items-start gap-6 md:col-span-6">
            <Eyebrow>Sobre o Fluxo</Eyebrow>
            <h2
              id="lp-sobre-title"
              className="lp-display text-[34px] font-semibold leading-[1.1] text-ink md:text-[48px]"
            >
              A prática clínica inspira.
              <br />
              <em className="lp-gradient-text pr-1 font-semibold">A tecnologia transforma.</em>
            </h2>
            {ABOUT_PARAGRAPHS.map((p) => (
              <p key={p} className="max-w-prose text-base leading-7 text-muted">
                {p}
              </p>
            ))}
            <div className="flex flex-col gap-1">
              <span aria-hidden="true" className="mb-3 h-0.5 w-12 rounded-full bg-accent" />
              <p className="lp-display text-2xl font-medium italic leading-tight text-ink md:text-[28px]">
                {CREATOR_NAME}
              </p>
              <p className="text-sm text-muted">{CREATOR_ROLE}</p>
            </div>
            <a
              href="#produto"
              className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-forest px-6 text-base font-semibold text-white shadow-[0_10px_24px_rgba(11,29,54,0.18)] transition hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Conheça o Fluxo
              <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        </div>

        <Reveal delay={160} className="mt-14 md:mt-16">
          <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
            {PILARES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4 lg:justify-center lg:px-6">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-line">
                  <Icon size={24} className="text-[#1e3a8a]" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium leading-snug text-ink md:text-base">{label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <WaveDivider fill="fill-sky-soft" />
    </section>
  )
}
