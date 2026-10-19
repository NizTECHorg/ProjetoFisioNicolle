import { Building2, Check, FileText, Stethoscope, UsersRound } from 'lucide-react'

const DESTINOS = [
  { icon: Stethoscope, label: 'Médico', detalhe: 'Avaliação, conduta e evolução' },
  { icon: Building2, label: 'Convênio', detalhe: 'Documentação por sessão' },
  { icon: UsersRound, label: 'Equipe', detalhe: 'Outros profissionais do caso' },
]

/** Relatório clínico saindo para médico, convênio e equipe. As linhas se montam e os envios entram em loop. */
export function ReportsMockup() {
  return (
    <div aria-hidden="true" className="grid max-w-full grid-cols-5 gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="col-span-2 flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
        <div className="flex items-center justify-between">
          <FileText size={18} className="text-[#1e3a8a]" />
          <span className="rounded-md bg-forest px-1.5 py-0.5 text-xs font-semibold text-white">PDF</span>
        </div>
        <p className="text-xs font-semibold text-ink">Relatório clínico</p>
        <p className="-mt-1 text-[11px] text-muted">Ana · 12 sessões</p>
        {[100, 80, 92, 64, 86, 72].map((w, i) => (
          <span
            key={i}
            className="lp-m-fill block h-1.5 origin-left rounded-full bg-ink/15"
            style={{ width: `${w}%`, animationDelay: `${0.2 + i * 0.1}s` }}
          />
        ))}
      </div>

      <ul className="col-span-3 flex flex-col justify-center gap-2">
        {DESTINOS.map(({ icon: Icon, label, detalhe }, i) => (
          <li
            key={label}
            className="lp-m-pop flex items-center gap-2.5 rounded-lg bg-canvas p-2"
            style={{ animationDelay: `${0.5 + i * 0.25}s` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[#1e3a8a]">
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-ink">{label}</span>
              <span className="block truncate text-[11px] text-muted">{detalhe}</span>
            </span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-white">
              <Check size={12} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
