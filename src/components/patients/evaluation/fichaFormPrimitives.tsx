import { createContext, useCallback, useContext, useId, useMemo, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  Brain,
  Briefcase,
  Brush,
  CalendarRange,
  ChevronDown,
  ClipboardList,
  Clock,
  Dumbbell,
  Eye,
  FileText,
  Flag,
  Flame,
  Footprints,
  Gauge,
  Hand,
  History,
  ListChecks,
  MessageSquareText,
  Move,
  PersonStanding,
  Pill,
  ShieldAlert,
  Stethoscope,
  Target,
  ThumbsDown,
  Trophy,
  ThumbsUp,
  UserRound,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

/** Ícone de cada bloco da ficha, pelo título. Bloco sem entrada mostra a letra. */
const FICHA_BLOCK_ICONS: Record<string, LucideIcon> = {
  // 01 · Anamnese
  'Identificação': UserRound,
  'Queixa principal': MessageSquareText,
  'História atual': History,
  'Tratamentos e investigações anteriores': Stethoscope,
  'Histórico pregresso resumido': ClipboardList,
  // 02 · Sintomas
  'Mapa corporal': PersonStanding,
  'Característica predominante': Zap,
  'Intensidade (0–10)': Gauge,
  'Comportamento em 24 horas': Clock,
  'O que piora?': ThumbsDown,
  'O que melhora?': ThumbsUp,
  'Irritabilidade / resposta': Flame,
  // 03 · Função
  'Principal limitação funcional': Footprints,
  'Atividades afetadas': ListChecks,
  'Rotina e demanda': Briefcase,
  'Expectativas e objetivos do paciente': Target,
  'Triagem de segurança': ShieldAlert,
  'Medicações / outras informações': Pill,
  'Esportes': Trophy,
  // 04 · Avaliação e plano
  'Inspeção / observação': Eye,
  'Mobilidade': Move,
  'Força': Dumbbell,
  'Avaliação neurológica (se indicada)': Brain,
  'Palpação, testes e função': Hand,
  'Síntese dos principais achados': FileText,
  'Objetivos': Flag,
  'Planejamento': CalendarRange,
  'Identificação profissional': BadgeCheck,
  // 05 · Mapa de sintomas
  'Desenho dos sintomas': Brush,
}

/** id do bloco no DOM (navegação lateral da avaliação no desktop). */
export function fichaBlocoDomId(title: string): string {
  return (
    'ficha-bloco-' +
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  )
}

type FichaCollapseState = {
  recolhido: (chave: string) => boolean
  alternar: (chave: string) => void
}

const FichaCollapseContext = createContext<FichaCollapseState | null>(null)

/**
 * Guarda quais blocos estão recolhidos enquanto o formulário da avaliação está aberto
 * (sobrevive à troca de página 01–04). Recarregar ou salvar/fechar desmonta e volta tudo aberto.
 */
export function FichaCollapseProvider({ children }: { children: ReactNode }) {
  const [recolhidos, setRecolhidos] = useState<ReadonlySet<string>>(() => new Set())
  const recolhido = useCallback((chave: string) => recolhidos.has(chave), [recolhidos])
  const alternar = useCallback((chave: string) => {
    setRecolhidos((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(chave)) proximo.delete(chave)
      else proximo.add(chave)
      return proximo
    })
  }, [])
  const valor = useMemo(() => ({ recolhido, alternar }), [recolhido, alternar])
  return <FichaCollapseContext.Provider value={valor}>{children}</FichaCollapseContext.Provider>
}

export function FichaBlock({
  letter,
  title,
  children,
  tone = 'default',
}: {
  letter: string
  title: string
  children: ReactNode
  tone?: 'default' | 'danger'
}) {
  const contexto = useContext(FichaCollapseContext)
  const [abertoLocal, setAbertoLocal] = useState(true)
  const chave = `${letter}|${title}`
  const Icone = FICHA_BLOCK_ICONS[title]
  const aberto = contexto ? !contexto.recolhido(chave) : abertoLocal
  const [animando, setAnimando] = useState(false)
  const alternar = () => {
    // Sem animação (reduced motion) não há transitionend para destravar o overflow.
    const semMovimento =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!semMovimento) setAnimando(true)
    if (contexto) contexto.alternar(chave)
    else setAbertoLocal((atual) => !atual)
  }
  const conteudoId = useId()
  const border = tone === 'danger' ? 'border-error/30' : 'border-line'
  const badge =
    tone === 'danger'
      ? 'bg-error/10 text-error'
      : 'bg-accent-soft text-[#1e3a8a]'
  const heading = tone === 'danger' ? 'text-error' : 'text-accent'

  return (
    <section
      id={fichaBlocoDomId(title)}
      data-ficha-bloco={title}
      className={`scroll-mt-4 rounded-2xl border ${border} bg-surface p-4 sm:p-5`}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={conteudoId}
        onClick={alternar}
        className="-m-1 flex w-[calc(100%+0.5rem)] items-center gap-2.5 rounded-xl p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        <span
          aria-hidden={Icone ? true : undefined}
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ${badge}`}
        >
          {Icone ? <Icone size={16} strokeWidth={1.9} /> : letter}
        </span>
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${heading}`}>
          Bloco {letter} · {title}
        </p>
        <ChevronDown
          size={18}
          aria-hidden
          className={[
            `shrink-0 ${tone === 'danger' ? 'text-error' : 'text-accent'} transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none`,
            aberto ? 'rotate-0' : '-rotate-90',
          ].join(' ')}
        />
        <span className="sr-only">{aberto ? 'Recolher bloco' : 'Expandir bloco'}</span>
      </button>
      {/*
        Grid 1fr/0fr anima a altura; recolhido fica montado (inert) para não perder estado interno.
        overflow-hidden só durante a animação ou fechado: aberto precisa ser visível para o
        position: sticky interno (barra da Mobilidade) continuar funcionando.
      */}
      <div
        id={conteudoId}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget) setAnimando(false)
        }}
        inert={aberto ? undefined : true}
        className={[
          'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          aberto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className={['min-h-0', aberto && !animando ? 'overflow-visible' : 'overflow-hidden'].join(' ')}>
          <div className="space-y-4 pt-4">{children}</div>
        </div>
      </div>
    </section>
  )
}

export function CheckboxGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-x-4 gap-y-2">{children}</div>
}

type BoolPathProps<T extends FieldValues> = {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
}

export function BoolCheck<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
}: BoolPathProps<T>) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        className="accent-forest"
        disabled={disabled}
        {...register(name)}
      />
      <span>{label}</span>
    </label>
  )
}

type RadioOption = { value: string; label: string }

export function RadioRow<T extends FieldValues>({
  legend,
  name,
  options,
  register,
  disabled,
}: {
  legend: string
  name: FieldPath<T>
  options: RadioOption[]
  register: UseFormRegister<T>
  disabled?: boolean
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label key={option.value} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              value={option.value}
              className="accent-forest"
              disabled={disabled}
              {...register(name)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function TextField<T extends FieldValues>({
  label,
  name,
  register,
  rows = 3,
  disabled,
}: {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  rows?: number
  disabled?: boolean
}) {
  return <Textarea label={label} rows={rows} disabled={disabled} {...register(name)} />
}

export function LineField<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
  type = 'text',
}: {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
  type?: string
}) {
  return <Input label={label} type={type} disabled={disabled} {...register(name)} />
}

export function EvaField<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
}: {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
}) {
  return (
    <Input
      label={label}
      type="number"
      min={0}
      max={10}
      step={1}
      disabled={disabled}
      {...register(name, {
        setValueAs: (value) => {
          if (value === '' || value === null || value === undefined) return undefined
          const n = Number(value)
          return Number.isFinite(n) ? n : undefined
        },
      })}
    />
  )
}

/** Show detail leaf only when non-empty. */
export function DetailLeaf({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === false || value === '') return null
  if (typeof value === 'boolean') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 text-sm text-ink">Sim</p>
      </div>
    )
  }
  if (typeof value === 'string' && !value.trim()) return null
  if (typeof value === 'number') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 text-sm text-ink">{value}</p>
      </div>
    )
  }
  if (typeof value === 'string') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{value}</p>
      </div>
    )
  }
  return null
}
