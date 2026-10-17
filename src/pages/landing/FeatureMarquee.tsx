import { WaveDivider } from './LandingUi'

// O que o Fluxo entrega, em poucas palavras (bullet points rolando).
const ITEMS = [
  'Avaliação completa em 5 páginas',
  'Mapa corporal desenhado à mão',
  'Avaliação esportiva por modalidade',
  'Evolução de cada sessão',
  'Escala de dor com gráfico',
  'Agenda com sessões repetidas',
  'Resumo do caso com IA',
  'PDF pronto para o paciente',
  'Financeiro por sessão',
  'Equipe com acesso controlado',
  'Funciona no celular',
]

/** Faixa escura com os recursos rolando, presa à largura do conteúdo e com fade nas bordas. */
export function FeatureMarquee() {
  return (
    <div className="relative bg-forest text-white">
      <p className="sr-only">O Fluxo oferece: {ITEMS.join(', ')}.</p>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="lp-marquee-wrap overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)] md:py-8"
        >
          <div className="lp-marquee">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center">
                {ITEMS.map((label) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-3 whitespace-nowrap pr-8 text-sm font-medium text-white/85 md:pr-10 md:text-base"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                    {label}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <WaveDivider fill="fill-surface" />
    </div>
  )
}
