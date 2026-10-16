import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Reveal, SectionHeading, WaveDivider } from './LandingUi'
import { WhatsAppLink } from './LinkButton'

type FaqItem = { q: string; a: string; whatsapp?: boolean }

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Meus dados e os dos pacientes estão seguros?',
    a: 'Cada conta enxerga apenas os próprios dados, com acesso protegido por login. Tratamos as informações de saúde com cuidado e de acordo com a LGPD. Os detalhes da política de privacidade serão publicados em breve.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. O Fluxo funciona no navegador do celular, do tablet e do computador, sem precisar instalar nada.',
  },
  {
    q: 'A IA pode inventar informações?',
    a: 'Não foi feita para isso: o Resumo e a avaliação com IA usam apenas o que já está escrito no prontuário. O resultado é um rascunho que você revisa, edita e só então salva.',
  },
  {
    q: 'Como funciona para equipes?',
    a: 'A empresa cria a conta e vincula os fisioterapeutas. Cada fisio vê apenas os próprios pacientes, e a empresa acompanha tudo, com registro de quem alterou o quê e quando.',
  },
  {
    q: 'Posso exportar em PDF?',
    a: 'Sim. Você exporta avaliação e evolução em PDF no formato de ficha, escolhendo quais seções incluir.',
  },
  {
    q: 'Quanto custa? Existe período de teste?',
    a: 'Os valores dos planos Autônomo e Empresa serão divulgados em breve. Fale com a gente pelo WhatsApp para saber das condições atuais.',
    whatsapp: true,
  },
  {
    q: 'Como peço ajuda ou suporte?',
    a: 'Pelo WhatsApp. Respondemos assim que possível em horário comercial.',
    whatsapp: true,
  },
  {
    q: 'Preciso ser empresa para usar?',
    a: 'Não. Fisioterapeutas autônomos têm um plano próprio, com financeiro e agenda individuais.',
  },
]

export function FaqSection() {
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set())

  const toggle = (i: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <section id="faq" aria-labelledby="lp-faq-title" className="lp-section bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Reveal>
          <SectionHeading id="lp-faq-title" eyebrow="FAQ" title="Perguntas frequentes" />
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-3xl divide-y divide-line rounded-xl border border-line bg-surface">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIds.has(i)
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    id={`lp-faq-q-${i}`}
                    aria-expanded={open}
                    aria-controls={`lp-faq-a-${i}`}
                    onClick={() => toggle(i)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-6 py-4 text-left text-base font-semibold text-ink"
                  >
                    {item.q}
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={['lp-chevron shrink-0', open ? 'rotate-180' : ''].join(' ')}
                    />
                  </button>
                </h3>
                <div
                  id={`lp-faq-a-${i}`}
                  role="region"
                  aria-labelledby={`lp-faq-q-${i}`}
                  className="lp-faq-panel"
                  data-open={open}
                >
                  <div inert={!open}>
                    <p className="px-6 pb-4 text-base leading-7 text-muted">{item.a}</p>
                    {item.whatsapp ? (
                      <div className="px-6 pb-4">
                        <WhatsAppLink asText />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>
      <WaveDivider fill="fill-forest" />
    </section>
  )
}
