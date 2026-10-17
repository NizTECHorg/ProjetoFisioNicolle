import { CheckCircle2, TrendingDown } from 'lucide-react'
import { smoothLinePath } from '@/lib/smoothPath'

// EVA por sessão (dados fictícios): a dor cai ao longo do tratamento.
const SESSIONS = [
  { date: '12 mar', label: 'Sessão 4', eva: 6 },
  { date: '19 mar', label: 'Sessão 5', eva: 4 },
  { date: '26 mar', label: 'Sessão 6', eva: 2 },
]

const POINTS = [
  { x: 10, y: 16 },
  { x: 62, y: 26 },
  { x: 114, y: 40 },
  { x: 166, y: 52 },
  { x: 218, y: 66 },
  { x: 266, y: 74 },
]
const LINE = smoothLinePath(POINTS)
const AREA = `${LINE} L 266 92 L 10 92 Z`
const LAST = POINTS[POINTS.length - 1]!

function corEva(eva: number): string {
  if (eva >= 6) return 'bg-error/10 text-error'
  if (eva >= 4) return 'bg-[#fff4d6] text-[#a16207]'
  return 'bg-sage/15 text-[#0f766e]'
}

/** Sessões com EVA e gráfico de evolução. No hover, a linha se desenha e as sessões entram. */
export function SessionsMockup() {
  return (
    <div aria-hidden="true" className="max-w-full rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-[#1e3a8a]">
            PE
          </span>
          <p className="text-sm font-semibold text-ink">Paciente Exemplo</p>
        </div>
        <span className="lp-h-glow inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-semibold text-[#0f766e]">
          <TrendingDown size={14} />
          Dor 7 → 2
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {SESSIONS.map((s, i) => (
          <li
            key={s.label}
            className="lp-h-pop flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas px-3 py-2"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle2 size={16} className="text-sage" />
              {s.label}
            </span>
            <span className="flex items-center gap-2 text-xs text-muted">
              {s.date}
              <span className={`rounded-full px-2 py-0.5 font-semibold ${corEva(s.eva)}`}>EVA {s.eva}</span>
            </span>
          </li>
        ))}
      </ul>
      <svg viewBox="0 0 276 100" className="mt-4 h-auto w-full" fill="none">
        <defs>
          <linearGradient id="lp-sessions-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f7dff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2f7dff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[24, 48, 72].map((y) => (
          <line key={y} x1="10" x2="266" y1={y} y2={y} stroke="#e1e8f0" strokeDasharray="3 4" />
        ))}
        <path d={AREA} fill="url(#lp-sessions-area)" />
        <path className="lp-h-draw" d={LINE} stroke="#2f7dff" strokeWidth="2.5" strokeLinecap="round" pathLength={1} />
        {POINTS.map((p, i) => (
          <circle
            key={p.x}
            className="lp-h-pop"
            style={{ animationDelay: `${0.2 + i * 0.18}s`, transformOrigin: `${p.x}px ${p.y}px` }}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#fff"
            stroke="#2f7dff"
            strokeWidth="2"
          />
        ))}
        <circle
          className="lp-h-ping"
          style={{ transformOrigin: `${LAST.x}px ${LAST.y}px` }}
          cx={LAST.x}
          cy={LAST.y}
          r="5"
          fill="#2f7dff"
        />
      </svg>
    </div>
  )
}
