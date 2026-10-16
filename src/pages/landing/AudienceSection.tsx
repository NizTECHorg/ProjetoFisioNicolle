import { Building2, User, Users } from 'lucide-react'
import { CheckItem, Reveal, SectionHeading, WaveDivider } from './LandingUi'

export function AudienceSection() {
  return (
    <section
      id="para-quem"
      aria-labelledby="lp-para-quem-title"
      className="lp-section bg-sky-soft"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Reveal>
          <SectionHeading
            id="lp-para-quem-title"
            eyebrow="Para quem é"
            title="Para quem atende sozinho e para quem atende em equipe"
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal
            variant="left"
            className="lp-card flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
              <User size={24} className="text-[#1e3a8a]" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-ink">Autônomos</h3>
            <p className="text-base leading-7 text-muted">
              Seu consultório inteiro na palma da mão.
            </p>
            <ul className="flex flex-col gap-2">
              <CheckItem>Prontuário e agenda próprios</CheckItem>
              <CheckItem>Financeiro e cobranças dos seus pacientes</CheckItem>
              <CheckItem>Avaliação e evolução com apoio de IA</CheckItem>
              <CheckItem>Funciona no celular e no computador</CheckItem>
            </ul>
            <a
              href="#planos"
              className="mt-auto inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              Ver plano
            </a>
          </Reveal>

          <Reveal
            delay={120}
            variant="right"
            className="lp-card flex flex-col gap-4 rounded-2xl bg-forest p-6 text-white"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Building2 size={24} className="text-white" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold text-white">Empresas e clínicas</h3>
            <p className="text-base leading-7 text-white/70">
              Organize a equipe sem perder a visão do todo.
            </p>
            <ul className="flex flex-col gap-2">
              <CheckItem tone="dark">Conta da empresa com fisioterapeutas vinculados</CheckItem>
              <CheckItem tone="dark">A empresa enxerga e gerencia tudo da equipe</CheckItem>
              <CheckItem tone="dark">Cada fisioterapeuta cuida dos próprios pacientes</CheckItem>
              <CheckItem tone="dark">Registro de alterações: o que mudou, quando e quem</CheckItem>
            </ul>
            <a
              href="#planos"
              className="mt-auto inline-flex min-h-11 items-center text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver plano
            </a>
          </Reveal>
        </div>

        <Reveal className="mt-8 flex items-center justify-center gap-3 text-sm text-muted">
          <User size={16} className="text-[#1e3a8a]" aria-hidden="true" />
          <Users size={16} className="text-[#1e3a8a]" aria-hidden="true" />
          <p>Atende os dois jeitos de trabalhar: sozinho ou em equipe.</p>
        </Reveal>
      </div>
      <WaveDivider fill="fill-forest" />
    </section>
  )
}
