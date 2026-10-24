import { useEffect, useRef, useState } from 'react'
import { Activity, CalendarCheck, ClipboardList, Flag, Users, type LucideIcon } from 'lucide-react'

// Jornada do paciente no Fluxo (dados fictícios, só ilustrativos). Avança sozinha;
// passar o mouse ou focar uma etapa mostra ela e pausa a troca automática.

type Etapa = {
  key: string
  label: string
  icon: LucideIcon
  titulo: string
  texto: string
  metrica: string
  rotuloMetrica: string
}

const ETAPAS: readonly Etapa[] = [
  {
    key: 'avaliacao',
    label: 'Avaliação',
    icon: ClipboardList,
    titulo: 'Avaliação completa',
    texto: 'Anamnese, sintomas e testes juntos.',
    metrica: 'EVA 8',
    rotuloMetrica: 'dor inicial',
  },
  {
    key: 'sessoes',
    label: 'Sessões',
    icon: CalendarCheck,
    titulo: 'Sessões na agenda',
    texto: 'Cada atendimento com evolução.',
    metrica: '12',
    rotuloMetrica: 'sessões feitas',
  },
  {
    key: 'evolucao',
    label: 'Evolução',
    icon: Activity,
    titulo: 'Evolução visível',
    texto: 'A dor cai sessão a sessão.',
    metrica: 'EVA 3',
    rotuloMetrica: 'na 8ª sessão',
  },
  {
    key: 'alta',
    label: 'Alta',
    icon: Flag,
    titulo: 'Metas alcançadas',
    texto: 'Relatório pronto para o médico.',
    metrica: '100%',
    rotuloMetrica: 'das metas',
  },
]

// Curva da dor (EVA 0–10) ao longo do tratamento; cada etapa revela até um ponto.
const PONTOS = [8, 7.5, 6, 5.5, 4.5, 3.5, 3, 2, 1.5, 1]
const ATE_ETAPA = [1, 4, 7, 10]
const W = 300
const H = 110

const PASSO = W / (PONTOS.length - 1)
const yDe = (v: number) => H - (v / 10) * (H - 12) - 6
const CURVA = PONTOS.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * PASSO).toFixed(1)} ${yDe(v).toFixed(1)}`).join(' ')

/** Ponto da curva num índice fracionário (0 … PONTOS.length - 1). */
function pontoEm(indice: number) {
  const i = Math.min(Math.max(indice, 0), PONTOS.length - 1)
  const a = Math.floor(i)
  const b = Math.min(a + 1, PONTOS.length - 1)
  const t = i - a
  return { x: i * PASSO, y: yDe(PONTOS[a]! + (PONTOS[b]! - PONTOS[a]!) * t) }
}

const TROCA_MS = 3200
const ANIMA_MS = 650

/**
 * Um único valor animado (requestAnimationFrame) move o ponto e revela a linha e o
 * preenchimento juntos, pelo mesmo recorte; assim nada "pula" na frente do outro.
 */
function useProgressoAnimado(alvo: number, reduzido: boolean) {
  const [valor, setValor] = useState(alvo)
  const atual = useRef(alvo)
  useEffect(() => {
    if (reduzido) {
      atual.current = alvo
      setValor(alvo)
      return
    }
    const inicio = atual.current
    const comeco = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const t = Math.min((agora - comeco) / ANIMA_MS, 1)
      const suave = 1 - Math.pow(1 - t, 3)
      atual.current = inicio + (alvo - inicio) * suave
      setValor(atual.current)
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, reduzido])
  return valor
}

export function PatientJourney() {
  const [ativa, setAtiva] = useState(0)
  const [pausado, setPausado] = useState(false)
  const reduzido = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (pausado || reduzido.current) return
    const id = window.setInterval(() => setAtiva((atual) => (atual + 1) % ETAPAS.length), TROCA_MS)
    return () => window.clearInterval(id)
  }, [pausado])

  const etapa = ETAPAS[ativa]!
  const progresso = useProgressoAnimado(ATE_ETAPA[ativa]! - 1, Boolean(reduzido.current))
  const ponto = pontoEm(progresso)

  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-[520px]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Mancha azul e anel fino ao fundo */}
      <div aria-hidden="true" className="lp-blob-shape absolute inset-[6%] bg-[radial-gradient(circle_at_40%_40%,#dbe9ff,#eaf2fd_60%,transparent_75%)]" />
      <div aria-hidden="true" className="absolute inset-[-2%] rounded-[50%] border border-accent/25" />

      {/* Cartão principal */}
      <div className="absolute inset-x-[6%] top-[10%] rounded-3xl bg-surface p-4 shadow-[0_24px_48px_rgba(11,29,54,0.14)] ring-1 ring-line sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Jornada do paciente</p>

        <div role="tablist" aria-label="Etapas do tratamento" className="relative mt-3 grid grid-cols-4 gap-1">
          <span
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-[18px] h-0.5 rounded-full bg-line"
          />
          <span
            aria-hidden="true"
            className="absolute left-[12.5%] top-[18px] h-0.5 rounded-full bg-accent transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ width: `${(ativa / (ETAPAS.length - 1)) * 75}%` }}
          />
          {ETAPAS.map((item, i) => {
            const Icone = item.icon
            const feita = i <= ativa
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={i === ativa}
                onMouseEnter={() => setAtiva(i)}
                onFocus={() => {
                  setPausado(true)
                  setAtiva(i)
                }}
                onBlur={() => setPausado(false)}
                onClick={() => setAtiva(i)}
                className="group relative z-10 flex flex-col items-center gap-1.5 rounded-xl py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <span
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-surface transition-[background-color,color,transform] duration-300',
                    feita ? 'bg-[#1e3a8a] text-white' : 'bg-canvas text-muted group-hover:text-ink',
                    i === ativa ? 'scale-110' : 'scale-100',
                  ].join(' ')}
                >
                  <Icone size={16} aria-hidden="true" />
                </span>
                <span className={['text-[11px] font-semibold sm:text-xs', i === ativa ? 'text-ink' : 'text-muted'].join(' ')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3" aria-live="polite">
          <div key={etapa.key} className="lp-journey-in min-w-0">
            <p className="truncate text-sm font-semibold text-ink sm:text-base">{etapa.titulo}</p>
            <p className="mt-0.5 truncate text-xs leading-5 text-muted sm:text-sm">{etapa.texto}</p>
          </div>
          <div key={`${etapa.key}-m`} className="lp-journey-in shrink-0 text-right">
            <p className="text-xl font-semibold leading-none text-[#1e3a8a] sm:text-2xl">{etapa.metrica}</p>
            <p className="mt-1 text-[11px] text-muted">{etapa.rotuloMetrica}</p>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" aria-hidden="true">
          <defs>
            <linearGradient id="lp-journey-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f7dff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2f7dff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="lp-journey-clip">
              <rect x="-4" y="-4" width={ponto.x + 4} height={H + 8} />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="currentColor" className="text-line" strokeDasharray="3 5" />
          ))}
          <path d={CURVA} fill="none" stroke="currentColor" className="text-line" strokeWidth="2" />
          <g clipPath="url(#lp-journey-clip)">
            <path d={`${CURVA} L${W} ${H} L0 ${H} Z`} fill="url(#lp-journey-fill)" />
            <path d={CURVA} fill="none" stroke="#2f7dff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g transform={`translate(${ponto.x} ${ponto.y})`}>
            <circle r="9" fill="#2f7dff" opacity="0.18" className="lp-journey-ping" />
            <circle r="4.5" fill="#fff" stroke="#2f7dff" strokeWidth="2.5" />
          </g>
        </svg>
        <p className="mt-1 flex justify-between text-[10px] text-muted">
          <span>Início</span>
          <span>Dor (EVA) ao longo do tratamento</span>
          <span>Alta</span>
        </p>
      </div>

      {/* Cartões flutuantes */}
      <div
        aria-hidden="true"
        className="lp-float absolute -left-[2%] bottom-[2%] flex items-center gap-2 rounded-2xl bg-surface px-3 py-2 shadow-[0_14px_30px_rgba(11,29,54,0.14)] ring-1 ring-line"
      >
        <span className="flex -space-x-2">
          {['bg-accent', 'bg-sage', 'bg-[#1e3a8a]'].map((cor, i) => (
            <span key={cor} className={`h-6 w-6 rounded-full ring-2 ring-surface ${cor}`} style={{ zIndex: 3 - i }} />
          ))}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-ink">
          <Users size={13} className="text-accent" />
          Equipe conectada
        </span>
      </div>
      <div
        aria-hidden="true"
        className="lp-float absolute -right-[1%] top-[2%] rounded-2xl bg-[#1e3a8a] px-3 py-2 text-white shadow-[0_14px_30px_rgba(11,29,54,0.22)]"
        style={{ animationDelay: '-3s' }}
      >
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/70">Dor</p>
        <p className="text-sm font-semibold">−75% <span className="font-normal text-white/70">em 12 sessões</span></p>
      </div>
    </div>
  )
}
