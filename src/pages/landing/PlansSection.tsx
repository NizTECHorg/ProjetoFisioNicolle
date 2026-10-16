import { Users } from 'lucide-react'
import { CheckItem, Reveal, SectionHeading, WaveDivider } from './LandingUi'
import { LinkButton, WhatsAppLink } from './LinkButton'
import { PLANS, PRICE_NOTE, PRICE_SUFFIX } from './landing.config'

export function PlansSection() {
  return (
    <section id="planos" aria-labelledby="lp-planos-title" className="lp-section bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Reveal>
          <SectionHeading
            id="lp-planos-title"
            eyebrow="Planos"
            title="Escolha o jeito que combina com a sua prática"
            intro="Valores em breve. Comece agora e fale com a gente para saber das condições."
          />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {PLANS.map((plan, index) => (
            <Reveal
              key={plan.id}
              delay={index * 80}
              className={[
                'lp-card relative flex flex-col gap-4 rounded-xl border bg-surface p-6',
                plan.highlighted ? 'border-2 border-accent' : 'border-line',
              ].join(' ')}
            >
              {plan.badge ? (
                <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
                  {plan.badge}
                </span>
              ) : null}
              <h3 className="text-base font-semibold text-ink">{plan.name}</h3>
              <p className="text-base leading-7 text-muted">{plan.description}</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-[28px] font-semibold leading-[1.2] text-ink">
                  {plan.price}
                </span>
                <span className="text-sm text-muted">{PRICE_SUFFIX}</span>
                <span className="text-sm text-muted">· {PRICE_NOTE}</span>
              </div>
              <ul className="flex flex-col gap-2">
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
                  fullWidth
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                >
                  Começar agora
                </LinkButton>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex flex-col items-center justify-center gap-1 text-base text-muted sm:flex-row sm:gap-3">
          <p>Dúvidas sobre valores?</p>
          <WhatsAppLink asText />
        </Reveal>
      </div>
      <WaveDivider fill="fill-surface" />
    </section>
  )
}
