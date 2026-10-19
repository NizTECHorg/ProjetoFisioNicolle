import type { ReactNode } from 'react'
import { CheckItem, Reveal, SectionHeading, WaveDivider } from './LandingUi'
import { LiveCards } from './LiveCards'
import { AgendaPdfMockup } from './mockups/AgendaPdfMockup'
import { AiDraftMockup } from './mockups/AiDraftMockup'
import { BodyMapMockup } from './mockups/BodyMapMockup'
import { ReportsMockup } from './mockups/ReportsMockup'
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
  {
    title: 'Relatórios e integração com a equipe',
    text: 'Compartilhe avaliação, tratamento e evolução do paciente com médicos, convênios e os demais profissionais da equipe multidisciplinar.',
    bullets: [
      'Relatórios clínicos para médicos, com avaliação, conduta e evolução',
      'Relatórios para convênios, com a documentação clínica organizada',
      'Comunicação com a equipe multidisciplinar que acompanha o paciente',
    ],
    mockup: <ReportsMockup />,
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
            <div
              key={feature.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
            >
              <Reveal
                variant={index % 2 === 1 ? 'right' : 'left'}
                className={index % 2 === 1 ? 'lg:order-2' : ''}
              >
                <div className="flex flex-col gap-4">
                  <h3 className="lp-display text-2xl font-semibold leading-tight text-ink md:text-[28px]">
                    {feature.title}
                  </h3>
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
              </Reveal>
              <Reveal
                variant="scale"
                delay={120}
                className={index % 2 === 1 ? 'lg:order-1' : ''}
              >
                {/* A sombra fica num elemento próprio: o Reveal já usa a transição para a entrada. */}
                <div
                  className={[
                    'relative rounded-2xl p-4 shadow-[0_8px_20px_rgba(11,29,54,0)] transition-shadow duration-500 ease-out hover:shadow-[0_8px_20px_rgba(11,29,54,0.07)] md:p-6',
                    index % 2 === 1
                      ? 'bg-[linear-gradient(135deg,#e6f5f0,#eaf2fd)]'
                      : 'bg-[linear-gradient(135deg,#eaf2fd,#e6f5f0)]',
                  ].join(' ')}
                >
                  {feature.mockup}
                </div>
              </Reveal>
            </div>
          ))}
        </div>

        <LiveCards />
      </div>
      <WaveDivider fill="fill-sage-soft" />
    </section>
  )
}
