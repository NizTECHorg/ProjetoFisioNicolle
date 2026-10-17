import type { ReactNode } from 'react'
import { CalendarDays, Check, ClipboardList, FileText, LineChart, Target, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from './LandingUi'

// Cada cartão conta um pedaço da rotina: o problema de sempre e como o Fluxo resolve,
// com uma prévia animada (dados fictícios, só ilustrativos).

function Prontuario() {
  const itens = ['Avaliação inicial', 'Sessão 4 · evolução', 'Exame de imagem', 'Meta atualizada']
  return (
    <ul className="flex w-full flex-col gap-1.5">
      {itens.map((item, i) => (
        <li
          key={item}
          className="lp-live-row flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-ink shadow-sm"
          style={{ animationDelay: `${i * 0.6}s` }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Agenda() {
  const slots = [
    { h: '08:00', nome: 'Ana · avaliação' },
    { h: '09:30', nome: 'Bruno · sessão 6' },
    { h: '11:00', nome: 'Carla · sessão 2' },
  ]
  return (
    <div className="relative w-full">
      <ul className="flex flex-col gap-1.5">
        {slots.map((s, i) => (
          <li
            key={s.h}
            className="lp-live-slot flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs"
            style={{ animationDelay: `${i * 1.2}s` }}
          >
            <span className="font-semibold text-[#1e3a8a]">{s.h}</span>
            <span className="truncate text-muted">{s.nome}</span>
          </li>
        ))}
      </ul>
      <span className="lp-live-now pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-full bg-error/70" />
    </div>
  )
}

function Financeiro() {
  const barras = [40, 65, 50, 80, 60, 95]
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">Sessões pagas</span>
        <span className="font-semibold text-sage">+18%</span>
      </div>
      <div className="flex h-16 items-end gap-1.5">
        {barras.map((h, i) => (
          <span
            key={i}
            className="lp-live-bar flex-1 origin-bottom rounded-t-md bg-[linear-gradient(180deg,#2f7dff,#24b296)]"
            style={{ height: `${h}%`, animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function Equipe() {
  const pessoas = [
    { i: 'NS', cor: 'bg-accent' },
    { i: 'RM', cor: 'bg-sage' },
    { i: 'JP', cor: 'bg-[#1e3a8a]' },
  ]
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex -space-x-2">
        {pessoas.map((p, k) => (
          <span
            key={p.i}
            className={`lp-live-pop relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white ${p.cor}`}
            style={{ animationDelay: `${k * 0.5}s` }}
          >
            {p.i}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sage ring-2 ring-white" />
          </span>
        ))}
      </div>
      <div className="text-right text-xs">
        <p className="font-semibold text-ink">3 fisios</p>
        <p className="text-muted">cada um com os seus</p>
      </div>
    </div>
  )
}

function Pdf() {
  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative h-20 w-16 shrink-0 rounded-lg border border-line bg-surface p-2 shadow-sm">
        {[100, 80, 90, 60, 75].map((w, i) => (
          <span
            key={i}
            className="lp-live-line mb-1.5 block h-1 origin-left rounded-full bg-ink/20"
            style={{ width: `${w}%`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
        <span className="lp-live-check absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sage text-white shadow">
          <Check size={14} aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1 text-xs">
        <p className="font-semibold text-ink">Avaliação.pdf</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <span className="lp-live-progress block h-full origin-left rounded-full bg-accent" />
        </div>
        <p className="mt-1.5 text-muted">Pronto para enviar</p>
      </div>
    </div>
  )
}

function Metas() {
  return (
    <div className="flex w-full items-center gap-4">
      <svg viewBox="0 0 48 48" className="h-16 w-16 shrink-0 -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#e1e8f0" strokeWidth="5" />
        <circle
          className="lp-live-ring"
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#24b296"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="100"
        />
      </svg>
      <ul className="flex flex-col gap-1 text-xs">
        <li className="flex items-center gap-1.5 text-ink">
          <Check size={12} className="text-sage" aria-hidden="true" /> Andar sem dor
        </li>
        <li className="flex items-center gap-1.5 text-ink">
          <Check size={12} className="text-sage" aria-hidden="true" /> Subir escadas
        </li>
        <li className="flex items-center gap-1.5 text-muted">
          <span className="h-3 w-3 rounded-full border border-line" /> Voltar a correr
        </li>
      </ul>
    </div>
  )
}

type Card = {
  icon: LucideIcon
  titulo: string
  antes: string
  texto: string
  preview: ReactNode
  tom: string
}

const CARDS: Card[] = [
  {
    icon: ClipboardList,
    titulo: 'Prontuário completo',
    antes: 'Fichas espalhadas',
    texto: 'Todo o histórico do paciente num só lugar, na ordem em que aconteceu.',
    preview: <Prontuario />,
    tom: 'from-accent-soft to-white',
  },
  {
    icon: CalendarDays,
    titulo: 'Agenda do dia',
    antes: 'Agenda no papel',
    texto: 'Veja quem vem agora e repita sessões na semana com um clique.',
    preview: <Agenda />,
    tom: 'from-sage-soft to-white',
  },
  {
    icon: LineChart,
    titulo: 'Financeiro e analítica',
    antes: 'Planilha no fim do mês',
    texto: 'Sessões pagas e a atividade do consultório em gráficos claros.',
    preview: <Financeiro />,
    tom: 'from-sky-soft to-white',
  },
  {
    icon: Users,
    titulo: 'Equipe',
    antes: 'Informação que se perde',
    texto: 'Cada fisio cuida dos seus pacientes; a clínica enxerga tudo.',
    preview: <Equipe />,
    tom: 'from-accent-soft to-white',
  },
  {
    icon: FileText,
    titulo: 'PDF para o paciente',
    antes: 'Relatório digitado à mão',
    texto: 'Avaliação e evolução viram um documento claro, pronto para enviar.',
    preview: <Pdf />,
    tom: 'from-sage-soft to-white',
  },
  {
    icon: Target,
    titulo: 'Metas do tratamento',
    antes: 'Progresso no achismo',
    texto: 'Objetivos com status e datas para mostrar a evolução ao paciente.',
    preview: <Metas />,
    tom: 'from-sky-soft to-white',
  },
]

/** Cartões com prévias animadas: o problema de antes e a rotina com o Fluxo. */
export function LiveCards() {
  return (
    <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map(({ icon: Icon, titulo, antes, texto, preview, tom }, index) => (
        <li key={titulo} className="contents">
          <Reveal
            delay={(index % 3) * 120}
            variant="blur"
            className="lp-card group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <div
              aria-hidden="true"
              className={`flex h-36 items-center bg-gradient-to-br px-5 ${tom}`}
            >
              {preview}
            </div>
            <div className="flex flex-col gap-2 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
                  <Icon size={18} className="text-[#1e3a8a]" aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-ink">{titulo}</h3>
              </div>
              <p className="text-xs font-medium text-muted">
                <span className="line-through decoration-error/60">{antes}</span>
                <span className="text-sage"> → resolvido</span>
              </p>
              <p className="text-sm leading-6 text-muted">{texto}</p>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
