import {
  Activity,
  CalendarClock,
  ClipboardList,
  FileText,
  PersonStanding,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { WaveDivider } from './LandingUi'

const ITEMS = [
  { icon: ClipboardList, label: 'Avaliação estruturada' },
  { icon: PersonStanding, label: 'Mapa corporal' },
  { icon: TrendingUp, label: 'Evolução das sessões' },
  { icon: CalendarClock, label: 'Agenda' },
  { icon: Sparkles, label: 'Resumo com IA' },
  { icon: FileText, label: 'PDF para o paciente' },
  { icon: Wallet, label: 'Financeiro' },
  { icon: Users, label: 'Equipe' },
  { icon: Activity, label: 'Escala de dor' },
]

/** Faixa escura com os recursos rolando: quebra o branco entre o hero e o produto. */
export function FeatureMarquee() {
  return (
    <div className="relative bg-forest text-white">
      <p className="sr-only">
        Recursos do Fluxo: {ITEMS.map((item) => item.label).join(', ')}.
      </p>
      <div
        aria-hidden="true"
        className="lp-marquee-wrap overflow-hidden py-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] md:py-7"
      >
        <div className="lp-marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center gap-3 pr-3 md:gap-4 md:pr-4">
              {ITEMS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90"
                >
                  <Icon size={16} className="text-sage" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <WaveDivider fill="fill-surface" />
    </div>
  )
}
