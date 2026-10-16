import { CheckCircle2 } from 'lucide-react'
import { smoothLinePath } from '@/lib/smoothPath'

const SESSIONS = [
  { date: '12 mar', label: 'Sessão 4' },
  { date: '19 mar', label: 'Sessão 5' },
  { date: '26 mar', label: 'Sessão 6' },
]

const POINTS = [
  { x: 8, y: 14 },
  { x: 60, y: 22 },
  { x: 112, y: 40 },
  { x: 164, y: 52 },
  { x: 216, y: 66 },
  { x: 268, y: 72 },
]
const LINE = smoothLinePath(POINTS)
const AREA = `${LINE} L 268 90 L 8 90 Z`

export function SessionsMockup() {
  return (
    <div
      aria-hidden="true"
      className="max-w-full rounded-xl border border-line bg-surface p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-ink">Paciente Exemplo</p>
      <ul className="mt-3 flex flex-col gap-2">
        {SESSIONS.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2"
          >
            <span className="text-sm font-semibold text-ink">{s.label}</span>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 size={16} className="text-sage" />
              Evolução registrada · {s.date}
            </span>
          </li>
        ))}
      </ul>
      <svg viewBox="0 0 276 96" className="mt-4 h-auto w-full" fill="none">
        <defs>
          <linearGradient id="lp-sessions-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e7f0fb" stopOpacity="1" />
            <stop offset="100%" stopColor="#e7f0fb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={AREA} fill="url(#lp-sessions-area)" />
        <path d={LINE} stroke="#2f7dff" strokeWidth="2.5" strokeLinecap="round" />
        {POINTS.map((p) => (
          <circle key={p.x} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#2f7dff" strokeWidth="2" />
        ))}
      </svg>
    </div>
  )
}
