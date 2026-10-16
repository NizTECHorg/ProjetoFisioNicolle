import type { ReactNode } from 'react'
import { CalendarDays, ClipboardList, FileText, LineChart, Target, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CheckItem, Reveal, SectionHeading, WaveDivider } from './LandingUi'
import { AgendaPdfMockup } from './mockups/AgendaPdfMockup'
import { AiDraftMockup } from './mockups/AiDraftMockup'
import { BodyMapMockup } from './mockups/BodyMapMockup'
import { SessionsMockup } from './mockups/SessionsMockup'

type Feature = {
  title: string
  text: string
  bullets: string[]
  mockup: ReactNode
  note?: string
}

const FEATURES: Feature[] = [
  {
    title: 'Avaliação com mapa corporal',
    text: 'Marque no corpo onde está a queixa e preencha a ficha com campos prontos.',
    bullets: [
      'Regiões do corpo selecionáveis',
      'Campos estruturados de dor e função',
      'Tudo salvo no prontuário do paciente',
    ],
    mockup: <BodyMapMockup />,
  },
  {
    title: 'Sessões e evolução',
    text: 'Registre cada sessão e acompanhe a melhora ao longo do tempo.',
    bullets: [
      'Histórico por paciente',
      'Gráficos de evolução',
      'Metas do tratamento com status e datas',
    ],
    mockup: <SessionsMockup />,
  },
  {
    title: 'Resumo e avaliação com IA',
    text: 'Gere um rascunho a partir do que você já registrou. Você revisa e decide o que salvar.',
    bullets: [
      'Usa apenas informação escrita no prontuário',
      'Nada é salvo sem a sua revisão',
      'Economiza tempo de digitação',
    ],
    mockup: <AiDraftMockup />,
    note: 'A IA usa apenas o que está escrito no prontuário. Você revisa e salva.',
  },
  {
    title: 'Agenda e PDF',
    text: 'Organize os atendimentos, inclusive repetidos em vários dias, e exporte avaliação e evolução em PDF.',
    bullets: [
      'Sessões futuras com repetição semanal',
      'PDF no estilo ficha, pronto para imprimir',
      'Escolha as seções que entram no documento',
    ],
    mockup: <AgendaPdfMockup />,
  },
]

const SMALL: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ClipboardList,
    title: 'Prontuário completo',
    text: 'Cadastro, histórico e documentos do paciente.',
  },
  { icon: CalendarDays, title: 'Agenda', text: 'Visão do dia e da semana da sua clínica.' },
  {
    icon: LineChart,
    title: 'Financeiro e analítica',
    text: 'Acompanhe cobranças e a atividade do seu consultório.',
  },
  { icon: Users, title: 'Equipe', text: 'Fisioterapeutas vinculados à conta da empresa.' },
  {
    icon: FileText,
    title: 'Exportar PDF',
    text: 'Documentos claros para o paciente e para a clínica.',
  },
  {
    icon: Target,
    title: 'Metas do tratamento',
    text: 'Objetivos por paciente com status e datas.',
  },
]

export function ProductSection() {
  return (
    <section id="produto" aria-labelledby="lp-produto-title" className="lp-section bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Reveal>
          <SectionHeading
            id="lp-produto-title"
            eyebrow="O Fluxo"
            title="Tudo do atendimento, do primeiro dia à alta"
            intro="Do cadastro à evolução, cada informação do paciente fica organizada e fácil de achar."
          />
        </Reveal>

        <div className="mt-12 flex flex-col gap-16 md:mt-16">
          {FEATURES.map((feature, index) => (
            <Reveal
              key={feature.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-ink">{feature.title}</h3>
                  <p className="max-w-prose text-base leading-7 text-muted">{feature.text}</p>
                  <ul className="flex flex-col gap-2">
                    {feature.bullets.map((b) => (
                      <CheckItem key={b}>{b}</CheckItem>
                    ))}
                  </ul>
                  {feature.note ? (
                    <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink">
                      {feature.note}
                    </p>
                  ) : null}
                </div>
              </div>
              <div
                className={[
                  'relative rounded-xl bg-canvas p-4 md:p-6',
                  index % 2 === 1 ? 'lg:order-1' : '',
                ].join(' ')}
              >
                {feature.mockup}
              </div>
            </Reveal>
          ))}
        </div>

        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SMALL.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="contents">
              <Reveal
                delay={index * 80}
                className="lp-card flex flex-col gap-4 rounded-xl border border-line bg-canvas p-4 md:p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
                  <Icon size={24} className="text-[#1e3a8a]" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-ink">{title}</h3>
                  <p className="text-base leading-7 text-muted">{text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
      <WaveDivider fill="fill-canvas" />
    </section>
  )
}
