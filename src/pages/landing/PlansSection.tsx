import { Users } from 'lucide-react'
import { CheckItem, Reveal, SectionHeading, WaveDivider } from './LandingUi'
import { LinkButton, WhatsAppLink } from './LinkButton'
import { PLANS, PRICE_NOTE, PRICE_SUFFIX } from './landing.config'

export function PlansSection() {
  return (
    <section
      id="planos"
      aria-labelledby="lp-planos-title"
      className="lp-section relative overflow-hidden bg-forest"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-sage/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Reveal>
          <SectionHeading
            id="lp-planos-title"
            eyebrow="Planos"
            title="Escolha o jeito que combina com a sua prática"
            intro="Valores em breve. Comece agora e fale com a gente para saber das condições."
            tone="dark"
          />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 md:gap-6">
          {PLANS.map((plan, index) => (
            <Reveal
              key={plan.id}
              delay={index * 120}
              variant="scale"
              className={[
                'lp-card relative flex flex-col gap-3 rounded-2xl border bg-surface p-3 sm:gap-4 sm:p-6',
                plan.highlighted
                  ? 'border-2 border-accent shadow-[0_24px_60px_rgba(47,125,255,0.25)]'
                  : 'border-line',
              ].join(' ')}
            >
              {plan.badge ? (
                <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white max-sm:static max-sm:self-start max-sm:px-2 max-sm:py-0.5 max-sm:text-[11px]">
                  {plan.badge}
                </span>
              ) : null}
              <h3 className="lp-display text-lg font-semibold text-ink sm:text-2xl">{plan.name}</h3>
              <p className="text-xs leading-5 text-muted sm:text-base sm:leading-7">{plan.description}</p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="lp-display text-2xl font-semibold leading-[1.2] text-ink sm:text-[32px]">
                  {plan.price}
                </span>
                <span className="text-sm text-muted">{PRICE_SUFFIX}</span>
                <span className="text-sm text-muted max-sm:hidden">· {PRICE_NOTE}</span>
              </div>
              <ul className="flex flex-col gap-2 max-sm:gap-1.5 max-sm:[&_li]:gap-2 max-sm:[&_li>span:first-child]:h-5 max-sm:[&_li>span:first-child]:w-5 max-sm:[&_li>span:last-child]:text-xs">
                {plan.features.map((feature) =>
                  feature.teamOnly ? (
                    <li key={feature.label} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                        <Users size={14} className="text-[#1e3a8a]" aria-hidden="true" />
                      </span>
                      <span className="text-base text-ink">{feature.label}</span>
                    </li>
                  ) : (
                    <CheckItem key={feature.label}>{feature.label}</CheckItem>
                  ),
                )}
              </ul>
              <div className="mt-auto pt-2">
                <LinkButton
                  to="/cadastro"
                  className="max-sm:px-2 max-sm:text-xs"
                  fullWidth
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                >
                  Começar agora
                </LinkButton>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex flex-col items-center justify-center gap-1 text-base text-white/70 sm:flex-row sm:gap-3 [&_a]:text-white">
          <p>Dúvidas sobre valores?</p>
          <WhatsAppLink asText />
        </Reveal>
      </div>
      <WaveDivider fill="fill-canvas" />
    </section>
  )
}
