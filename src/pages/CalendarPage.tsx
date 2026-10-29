import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Cake, CalendarClock, Check, ChevronDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useCalendarSessions, useCreateSession, useDeleteSession, useBoard, useUpdateSessionStatus } from '@/hooks/useClinic'
import type { CalendarSession } from '@/services/calendar.service'
import {
  useDisconnectGoogleCalendar,
  useEnsureGoogleCalendarVaulted,
  useExportGoogleCalendarMonth,
  useGoogleCalendarConnection,
  useLinkGoogleCalendar,
} from '@/hooks/useGoogleCalendar'
import { usePatients } from '@/hooks/usePatients'
import { useTeam } from '@/hooks/useTeam'
import { canManageTeam, canSeeFinance } from '@/lib/accountAccess'
import { aniversariantesDoDia, aniversariosNoPeriodo, rotuloAniversario } from '@/lib/aniversarios'
import { formatCurrency } from '@/lib/security'
import { useFinancePrices } from '@/hooks/useFinance'
import { parseBrlInput } from '@/schemas/finance.schema'
import { filterPatientsByName } from '@/lib/dashboardShortcut'
import {
  MAX_SERIES_WEEKS,
  SERIES_WEEKDAYS,
  buildSeriesPreview,
  buildWeeklySeries,
  clampWeeks,
  seriesCtaLabel,
} from '@/lib/sessionSeries'
import { GOOGLE_CALENDAR_COPY } from '@/schemas/googleCalendar.schema'
import type { PatientListItem } from '@/types/patient'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

/** Integração permanece no código; a faixa e os CTAs ficam ocultos para o usuário. */
const GOOGLE_CALENDAR_UI_VISIBLE = false

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let i = 0; i < startOffset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Segunda-feira da semana do dia (a grade da Agenda começa na segunda). */
function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -((date.getDay() + 6) % 7))
}

type AgendaView = 'dia' | 'semana' | 'mes'

const VIEWS: ReadonlyArray<{ key: AgendaView; label: string; atalho: string }> = [
  { key: 'dia', label: 'Dia', atalho: 'D' },
  { key: 'semana', label: 'Semana', atalho: 'S' },
  { key: 'mes', label: 'Mês', atalho: 'M' },
]

const VIEW_STORAGE_KEY = 'fluxo.agenda.visao'

function lerVisaoSalva(): AgendaView {
  try {
    const salvo = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (salvo === 'dia' || salvo === 'semana' || salvo === 'mes') return salvo
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): fica no mês.
  }
  return 'mes'
}

/**
 * Menu de visão no estilo do Google Agenda: botão com a visão atual e a lista com atalhos.
 * A lista vai para o <body> (portal, posição fixa) para ficar acima de tudo, inclusive da lateral.
 */
function ViewMenu({ view, onChange }: { view: AgendaView; onChange: (next: AgendaView) => void }) {
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const caixaRef = useRef<HTMLDivElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
  const atual = VIEWS.find((item) => item.key === view) ?? VIEWS[2]!

  useEffect(() => {
    if (!aberto) return
    function medir() {
      const rect = caixaRef.current?.getBoundingClientRect()
      if (rect) setPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) })
    }
    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, { capture: true, passive: true })
    function fora(event: PointerEvent) {
      const alvo = event.target as Node
      if (!caixaRef.current?.contains(alvo) && !listaRef.current?.contains(alvo)) setAberto(false)
    }
    function esc(event: KeyboardEvent) {
      if (event.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, { capture: true })
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div ref={caixaRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-forest/30"
      >
        {atual.label}
        <ChevronDown
          size={16}
          aria-hidden
          className={['text-muted transition-transform duration-200', aberto ? 'rotate-180' : 'rotate-0'].join(' ')}
        />
      </button>
      {aberto && pos
        ? createPortal(
        <ul
          ref={listaRef}
          role="menu"
          aria-label="Visão da agenda"
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-[200] w-48 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-lg"
        >
          {VIEWS.map((item) => {
            const ativo = item.key === view
            return (
              <li key={item.key} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={ativo}
                  onClick={() => {
                    onChange(item.key)
                    setAberto(false)
                  }}
                  className={[
                    'flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm transition-colors hover:bg-canvas',
                    ativo ? 'font-semibold text-forest' : 'text-ink',
                  ].join(' ')}
                >
                  <span className="flex w-4 justify-center">{ativo ? <Check size={15} aria-hidden /> : null}</span>
                  <span className="flex-1">{item.label}</span>
                  <kbd className="font-sans text-xs text-muted">{item.atalho}</kbd>
                </button>
              </li>
            )
          })}
        </ul>,
            document.body,
          )
        : null}
    </div>
  )
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function CalendarPage() {
  const today = startOfDay(new Date())
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [view, setViewState] = useState<AgendaView>(lerVisaoSalva)

  function setView(next: AgendaView) {
    setViewState(next)
    // Mês volta para o mês do dia selecionado.
    if (next === 'mes') setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1))
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {
      // Sem armazenamento: só não lembra na próxima visita.
    }
  }
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [patientQuery, setPatientQuery] = useState('')
  const [patientMenuOpen, setPatientMenuOpen] = useState(false)
  const [sessionDate, setSessionDate] = useState(today)
  const [pickerCursor, setPickerCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [time, setTime] = useState('09:00')
  const [repeatWeeks, setRepeatWeeks] = useState('1')
  const [weekdays, setWeekdays] = useState<number[]>([today.getDay()])
  const [weekdaysTouched, setWeekdaysTouched] = useState(false)
  const [type, setType] = useState('Sessão')
  const [place, setPlace] = useState('Sala 1')
  const [therapistId, setTherapistId] = useState('')
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [pendingDeleteSession, setPendingDeleteSession] = useState<CalendarSession | null>(null)

  const weekStart = startOfWeek(selected)
  // Busca só o período da visão atual.
  const from =
    view === 'mes'
      ? new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      : view === 'semana'
        ? weekStart
        : startOfDay(selected)
  const to =
    view === 'mes'
      ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      : view === 'semana'
        ? addDays(weekStart, 7)
        : addDays(startOfDay(selected), 1)
  const fromIso = from.toISOString()
  const toIso = to.toISOString()
  const { data: sessions = [], isLoading } = useCalendarSessions(fromIso, toIso)
  const { data: board } = useBoard()
  const { data: patients = [] } = usePatients()
  const patientMatches = useMemo(
    () => filterPatientsByName(patients, patientQuery),
    [patients, patientQuery],
  )
  const create = useCreateSession()
  const deleteSession = useDeleteSession()
  const { profile } = useAuth()
  const isCompany = canManageTeam(profile?.accountType)
  // Valor da sessão na Agenda (mesmos campos da ficha do paciente); só quem tem Financeiro.
  const showFinance = canSeeFinance(profile?.accountType)
  const { data: prices = [] } = useFinancePrices()
  const [priceId, setPriceId] = useState('')
  const [adHocAmount, setAdHocAmount] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [chargeError, setChargeError] = useState<string | null>(null)
  const priceOptions = useMemo(
    () => [
      { value: '', label: 'Sem valor' },
      ...prices.map((item) => ({ value: item.id, label: `${item.name} — ${formatCurrency(item.amountBrl)}` })),
    ],
    [prices],
  )
  const { data: team } = useTeam()
  const therapists = useMemo(
    () =>
      (team?.members ?? [])
        .filter((member) => member.role === 'therapist' && member.status === 'active')
        .map((member) => ({ id: member.profileId, name: member.fullName || member.email || 'Fisioterapeuta' }))
        .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
    [team],
  )
  const therapistOptions = useMemo(
    () => [
      { value: '', label: 'Sem fisioterapeuta' },
      ...therapists.map((item) => ({ value: item.id, label: item.name })),
    ],
    [therapists],
  )
  const updateStatus = useUpdateSessionStatus()

  const connectionQuery = useGoogleCalendarConnection()
  const linkGoogle = useLinkGoogleCalendar()
  const exportMonth = useExportGoogleCalendarMonth()
  const disconnectGoogle = useDisconnectGoogleCalendar()

  useEnsureGoogleCalendarVaulted(() => setNeedsReconnect(false))

  const dueCards = useMemo(() => {
    const titles = new Map((board?.columns ?? []).map((column) => [column.id, column.title]))
    return (board?.cards ?? [])
      .filter((card) => Boolean(card.dueOn))
      .map((card) => {
        const columnTitle = titles.get(card.columnId) ?? ''
        return {
          id: card.id,
          title: card.title,
          dueOn: (card.dueOn as string).slice(0, 10),
          patientName: card.patientName,
          photoTone: card.photoTone,
          photoUrl: card.photoUrl,
          columnTitle,
          done: columnTitle.toLowerCase().includes('conclu'),
        }
      })
  }, [board])

  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  )

  const counts = useMemo(() => {
    const map = new Map<string, { sessions: number; dues: number }>()
    for (const session of sessions) {
      const key = startOfDay(new Date(session.scheduledAt)).toDateString()
      const current = map.get(key) ?? { sessions: 0, dues: 0 }
      current.sessions += 1
      map.set(key, current)
    }
    for (const card of dueCards) {
      const [year, month, day] = card.dueOn.split('-').map(Number)
      if (!year || !month || !day) continue
      const key = new Date(year, month - 1, day).toDateString()
      const current = map.get(key) ?? { sessions: 0, dues: 0 }
      current.dues += 1
      map.set(key, current)
    }
    return map
  }, [sessions, dueCards])

  const selectedKey = toLocalInput(selected)
  const daySessions = sessions.filter((session) => sameDay(new Date(session.scheduledAt), selected))
  const dayDues = dueCards.filter((card) => card.dueOn === selectedKey)
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(cursor)
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  // Aniversários dos pacientes (data de nascimento do cadastro) no período da visão.
  const aniversarios = aniversariosNoPeriodo(
    patients,
    view === 'mes' ? new Date(cursor.getFullYear(), cursor.getMonth(), 1) : view === 'semana' ? weekStart : startOfDay(selected),
    view === 'mes' ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() : view === 'semana' ? 7 : 1,
  )
  const dayBirthdays = aniversariantesDoDia(patients, selected)
  const sessionsByDay = new Map<string, CalendarSession[]>()
  for (const session of [...sessions].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))) {
    const key = startOfDay(new Date(session.scheduledAt)).toDateString()
    sessionsByDay.set(key, [...(sessionsByDay.get(key) ?? []), session])
  }
  const periodLabel =
    view === 'mes'
      ? monthLabel
      : view === 'semana'
        ? (() => {
            const fim = addDays(weekStart, 6)
            const curto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
            return `${curto.format(weekStart)} – ${curto.format(fim)} ${fim.getFullYear()}`
          })()
        : new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(
            selected,
          )

  function goToDay(date: Date) {
    setSelected(date)
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  function step(direction: 1 | -1) {
    if (view === 'mes') {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1))
      return
    }
    goToDay(addDays(selected, view === 'semana' ? 7 * direction : direction))
  }

  // Atalhos como no Google Agenda: D, S (ou W) e M, fora de campos de texto.
  useEffect(() => {
    function atalho(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const alvo = event.target as HTMLElement | null
      if (alvo && (alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))) return
      if (document.querySelector('[role="dialog"]')) return
      const tecla = event.key.toLowerCase()
      const next = tecla === 'd' ? 'dia' : tecla === 's' || tecla === 'w' ? 'semana' : tecla === 'm' ? 'mes' : null
      if (next) setView(next)
    }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  })
  const upcomingDues = [...dueCards].sort((a, b) => a.dueOn.localeCompare(b.dueOn))

  function goToDue(dueOn: string) {
    const [year, month, day] = dueOn.split('-').map(Number)
    if (!year || !month || !day) return
    setCursor(new Date(year, month - 1, 1))
    setSelected(new Date(year, month - 1, day))
  }

  function formatDueLabel(dueOn: string) {
    const [year, month, day] = dueOn.split('-').map(Number)
    if (!year || !month || !day) return dueOn
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
      new Date(year, month - 1, day),
    )
  }

  function openComposer() {
    setPatientId('')
    setPatientQuery('')
    setPatientMenuOpen(false)
    setSessionDate(selected)
    setPickerCursor(new Date(selected.getFullYear(), selected.getMonth(), 1))
    setRepeatWeeks('1')
    setWeekdays([selected.getDay()])
    setWeekdaysTouched(false)
    setTherapistId('')
    setPriceId('')
    setAdHocAmount('')
    setIsPaid(false)
    setChargeError(null)
    setOpen(true)
  }

  function pickPatient(patient: PatientListItem) {
    setPatientId(patient.id)
    setPatientQuery(patient.name)
    setPatientMenuOpen(false)
  }

  function onPatientQueryChange(value: string) {
    setPatientQuery(value)
    setPatientId('')
    setPatientMenuOpen(true)
  }

  function chooseSessionDate(date: Date) {
    const next = startOfDay(date)
    setSessionDate(next)
    if (!weekdaysTouched) setWeekdays([next.getDay()])
    setPickerCursor(new Date(next.getFullYear(), next.getMonth(), 1))
    setSelected(next)
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
  }

  function seriesStartAt() {
    const start = new Date(sessionDate)
    let hours = 9
    let minutes = 0
    if (time.trim() !== '') {
      const [h, m] = time.split(':').map(Number)
      if (Number.isFinite(h) && Number.isFinite(m)) {
        hours = h as number
        minutes = m as number
      }
    }
    start.setHours(hours, minutes, 0, 0)
    return start
  }

  function toggleWeekday(day: number) {
    setWeekdaysTouched(true)
    if (weekdays.includes(day)) {
      if (weekdays.length === 1) return
      setWeekdays(weekdays.filter((value) => value !== day))
      return
    }
    setWeekdays([...weekdays, day])
  }

  const seriesCycles = clampWeeks(repeatWeeks)
  const series = buildWeeklySeries(seriesStartAt(), weekdays, seriesCycles)
  const seriesTotal = series.length
  const seriesPreviewText = buildSeriesPreview(series, {
    weekdayCount: weekdays.length,
    cycles: seriesCycles,
    showTime: time.trim() !== '',
  })
  const ctaLabel = seriesCtaLabel(seriesTotal)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!patientId) return
    const when = seriesStartAt()
    if (series.length === 0) return
    const scheduledAts = series.map((date) => date.toISOString())
    const therapist = isCompany ? therapists.find((item) => item.id === therapistId) : undefined
    const adHoc = parseBrlInput(adHocAmount)
    if (showFinance && !priceId && adHocAmount.trim() && adHoc === null) {
      setChargeError('Valor avulso inválido. Use o formato 150,00.')
      return
    }
    if (showFinance && isPaid && !priceId && adHoc === null) {
      setChargeError('Informe um valor para marcar como pago.')
      return
    }
    setChargeError(null)
    create.mutate(
      {
        patientId,
        scheduledAt: scheduledAts[0] ?? when.toISOString(),
        scheduledAts,
        type,
        place,
        therapistId: therapist?.id,
        therapistName: therapist?.name,
        charge: showFinance ? { priceId: priceId || null, adHocAmountBrl: priceId ? null : adHoc, isPaid } : null,
      },
      {
        onSuccess: () => {
          setOpen(false)
          setPatientId('')
          setPatientQuery('')
          setPatientMenuOpen(false)
        },
      },
    )
  }

  function isNeedsReconnectError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const withCode = error as Error & { code?: string }
    return (
      withCode.code === 'needs_reconnect' ||
      withCode.code === 'insufficient_scope' ||
      error.message === GOOGLE_CALENDAR_COPY.tokenExpired ||
      error.message === GOOGLE_CALENDAR_COPY.insufficientScope
    )
  }

  function handleExportMonth() {
    exportMonth.mutate(
      { fromIso, toIso },
      {
        onError: (error) => {
          if (isNeedsReconnectError(error)) setNeedsReconnect(true)
        },
      },
    )
  }

  function handleDisconnectConfirm() {
    disconnectGoogle.mutate(undefined, {
      onSuccess: () => {
        setNeedsReconnect(false)
        setDisconnectOpen(false)
      },
    })
  }

  const connection = connectionQuery.data ?? null
  const connectionLoading = connectionQuery.isLoading
  const connectionFailed = connectionQuery.isError
  const isConnected = Boolean(connection) && !needsReconnect

  // Painel do dia selecionado: lateral no Mês e na Semana, ocupa tudo na visão Dia.
  const painelDia = (
  <article className="dash-in dash-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: '180ms' }}>
    <h2 className="text-sm font-semibold text-ink">
      {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(selected)}
    </h2>
    <p className="mt-1 text-xs text-muted">
      {daySessions.length === 0 && dayDues.length === 0 && dayBirthdays.length === 0
        ? 'Nada neste dia'
        : [
            dayBirthdays.length ? `${dayBirthdays.length} aniversário(s)` : null,
            daySessions.length ? `${daySessions.length} sessão(ões)` : null,
            dayDues.length ? `${dayDues.length} prazo(s) do quadro` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
    </p>

    {isLoading ? (
      <div className="mt-8 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    ) : (
      <div className="mt-5 space-y-3">
        {dayBirthdays.length > 0 ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Aniversários</p>
        ) : null}
        {dayBirthdays.map((item) => (
          <Link
            key={`aniv-${item.patientId}`}
            to={`/pacientes/${item.patientId}`}
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3"
          >
            <PatientAvatar name={item.name} tone={item.photoTone ?? undefined} photoUrl={item.photoUrl ?? null} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
              <span className="block text-xs text-amber-800">
                {item.idade ? `Aniversário · faz ${item.idade} anos` : 'Aniversário'}
              </span>
            </span>
            <Cake size={18} className="shrink-0 text-amber-500" aria-hidden />
          </Link>
        ))}
        {dayDues.length > 0 ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forest">Tarefas do quadro</p>
        ) : null}
        {dayDues.map((card) => (
          <Link
            key={card.id}
            to="/quadro"
            className="block rounded-2xl border border-accent/30 bg-accent-soft p-3"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-forest">
              <CalendarClock size={12} />
              {card.done ? 'Entregue' : `Entregar ${formatDueLabel(card.dueOn)}`}
            </span>
            <span className="mt-1 block text-sm font-medium text-ink">{card.title}</span>
            {card.patientName ? (
              <span className="mt-2 flex items-center gap-2">
                <PatientAvatar name={card.patientName} tone={card.photoTone} photoUrl={card.photoUrl} size="sm" />
                <span className="truncate text-xs text-muted">{card.patientName}</span>
              </span>
            ) : null}
            <span className="mt-1 block text-[11px] text-muted">{card.columnTitle}</span>
          </Link>
        ))}

        {daySessions.length > 0 ? (
          <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Sessões</p>
        ) : null}

        {daySessions.map((session) => (
          <div key={session.id} className="rounded-2xl border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/pacientes/${session.patientId}`} className="flex min-w-0 flex-1 items-center gap-3">
                <PatientAvatar name={session.patientName} tone={session.photoTone} photoUrl={session.photoUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{session.patientName}</span>
                  <span className="block text-xs text-muted">
                    {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                      new Date(session.scheduledAt),
                    )}{' '}
                    · {session.type} · {session.place}
                    {session.therapistName ? ` · ${session.therapistName}` : ''}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Excluir sessão"
                title="Excluir sessão"
                onClick={() => setPendingDeleteSession(session)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[11px] capitalize text-muted">{session.status}</span>
              {session.status === 'agendada' ? (
                <button
                  type="button"
                  className="text-xs font-medium text-forest"
                  onClick={() => updateStatus.mutate({ id: session.id, status: 'confirmada' })}
                >
                  Confirmar
                </button>
              ) : null}
              {session.status === 'confirmada' ? (
                <button
                  type="button"
                  className="text-xs font-medium text-forest"
                  onClick={() => updateStatus.mutate({ id: session.id, status: 'realizada' })}
                >
                  Marcar realizada
                </button>
              ) : null}
              {session.status === 'realizada' ? (
                <span className="text-xs text-accent">Realizada</span>
              ) : null}
            </div>
          </div>
        ))}

        {daySessions.length === 0 && dayDues.length === 0 && dayBirthdays.length === 0 ? (
          <button
            type="button"
            onClick={openComposer}
            className="text-sm font-medium text-forest"
          >
            Agendar sessão neste dia
          </button>
        ) : null}
      </div>
    )}
  </article>
  )

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Agenda" info="Calendário das sessões e dos prazos do Quadro. Toque em um dia para ver os horários e use “Nova sessão” para agendar."
        description="Sessões da clínica e prazos de entrega do Quadro."
        action={
          <Button onClick={openComposer}>
            <Plus size={16} />
            Nova sessão
          </Button>
        }
      />

      {GOOGLE_CALENDAR_UI_VISIBLE ? (
      <article
        className="dash-in mb-4 rounded-2xl border border-line bg-surface p-4 sm:p-5"
        style={{ animationDelay: '40ms' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h2 className="text-sm font-semibold text-ink">{GOOGLE_CALENDAR_COPY.stripHeading}</h2>

            {connectionLoading && !connection && !connectionFailed ? (
              <div className="flex justify-start py-1">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
              </div>
            ) : null}

            {connectionFailed ? (
              <div className="rounded-2xl border border-error/20 bg-error/5 p-3 text-sm text-error">
                {GOOGLE_CALENDAR_COPY.loadConnectionFail}
              </div>
            ) : null}

            {needsReconnect && !connectionFailed ? (
              <div className="rounded-2xl border border-error/20 bg-error/5 p-3 text-sm text-error">
                {GOOGLE_CALENDAR_COPY.tokenExpired}
              </div>
            ) : null}

            {!connectionLoading && !connectionFailed && !connection && !needsReconnect ? (
              <p className="rounded-2xl border border-accent/30 bg-accent-soft p-3 text-sm text-forest">
                {GOOGLE_CALENDAR_COPY.noticeDisconnected}
              </p>
            ) : null}

            {isConnected && connection ? (
              <>
                <p className="text-xs text-muted">
                  {GOOGLE_CALENDAR_COPY.connectedAs}{' '}
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-forest">
                    {connection.googleEmail ?? '—'}
                  </span>
                </p>
                <p className="rounded-2xl border border-accent/30 bg-accent-soft p-3 text-sm text-forest">
                  {GOOGLE_CALENDAR_COPY.noticeConnected}
                </p>
                <p className="text-xs text-muted">
                  {GOOGLE_CALENDAR_COPY.monthScopePrefix}{' '}
                  <span className="capitalize text-ink">{monthLabel}</span>
                </p>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {connectionFailed ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => void connectionQuery.refetch()}
                  isLoading={connectionQuery.isFetching}
                >
                  Tentar de novo
                </Button>
                <Button
                  onClick={() => linkGoogle.mutate()}
                  isLoading={linkGoogle.isPending}
                >
                  {GOOGLE_CALENDAR_COPY.reconnectCta}
                </Button>
              </>
            ) : null}

            {!connectionFailed && needsReconnect ? (
              <Button
                onClick={() => linkGoogle.mutate()}
                isLoading={linkGoogle.isPending}
              >
                {GOOGLE_CALENDAR_COPY.reconnectCta}
              </Button>
            ) : null}

            {!connectionFailed && !connectionLoading && !connection && !needsReconnect ? (
              <Button
                onClick={() => linkGoogle.mutate()}
                isLoading={linkGoogle.isPending}
              >
                {GOOGLE_CALENDAR_COPY.connectCta}
              </Button>
            ) : null}

            {isConnected ? (
              <>
                <Button
                  onClick={handleExportMonth}
                  isLoading={exportMonth.isPending}
                >
                  {GOOGLE_CALENDAR_COPY.exportCta}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDisconnectOpen(true)}
                  disabled={disconnectGoogle.isPending}
                >
                  {GOOGLE_CALENDAR_COPY.disconnectCta}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </article>
      ) : null}

      {/* Barra da agenda: navegação do período, Hoje e o menu Dia / Semana / Mês. */}
      <div className="dash-in mb-4 flex flex-wrap items-center gap-2" style={{ animationDelay: '60ms' }}>
        <button
          type="button"
          onClick={() => {
            goToDay(today)
          }}
          className="inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-forest/30"
        >
          Hoje
        </button>
        <div className="flex items-center">
          <button
            type="button"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
            onClick={() => step(-1)}
            aria-label={view === 'mes' ? 'Mês anterior' : view === 'semana' ? 'Semana anterior' : 'Dia anterior'}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
            onClick={() => step(1)}
            aria-label={view === 'mes' ? 'Próximo mês' : view === 'semana' ? 'Próxima semana' : 'Próximo dia'}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold capitalize text-ink" aria-live="polite">
          {periodLabel}
        </h2>
        <ViewMenu view={view} onChange={setView} />
      </div>

      {view === 'dia' ? (
        <div className="grid gap-4">
          {painelDia}
        </div>
      ) : (
        <div className={['grid gap-4', view === 'mes' ? 'lg:grid-cols-[1.4fr_1fr]' : 'xl:grid-cols-[2fr_1fr]'].join(' ')}>
          {view === 'mes' ? (
        <article className="dash-in dash-card rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="aspect-square" />
              const isToday = sameDay(date, today)
              const isSelected = sameDay(date, selected)
              const marks = counts.get(date.toDateString())
              const hasSessions = (marks?.sessions ?? 0) > 0
              const hasDues = (marks?.dues ?? 0) > 0
              const hasBirthday = aniversarios.has(date.toDateString())
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelected(date)}
                  onDoubleClick={() => {
                    setSelected(date)
                    setView('dia')
                  }}
                  className={[
                    'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition',
                    isSelected ? 'bg-forest text-white' : isToday ? 'bg-accent-soft text-forest' : 'hover:bg-canvas',
                  ].join(' ')}
                >
                  {date.getDate()}
                  {hasSessions || hasDues || hasBirthday ? (
                    <span className="mt-1 flex items-center gap-0.5">
                      {hasBirthday ? (
                        <Cake size={10} aria-label="Aniversário" className={isSelected ? 'text-white' : 'text-amber-500'} />
                      ) : null}
                      {hasSessions ? (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-forest'}`} />
                      ) : null}
                      {hasDues ? (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-accent' : 'bg-accent'}`} />
                      ) : null}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </article>
          ) : (
        <article className="dash-in dash-card self-start rounded-2xl border border-line bg-surface p-3 sm:p-4" style={{ animationDelay: '80ms' }}>
          {/* self-start: a semana tem altura própria e não estica junto com o painel do dia. */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7 sm:gap-1.5">
            {weekDays.map((date, index) => {
              const isToday = sameDay(date, today)
              const isSelected = sameDay(date, selected)
              const daySessionsList = sessionsByDay.get(date.toDateString()) ?? []
              const key = toLocalInput(date)
              const dues = dueCards.filter((card) => card.dueOn === key)
              return (
                // Clique em qualquer parte do card escolhe o dia (o botão do cabeçalho cobre o teclado).
                <div
                  key={date.toISOString()}
                  onClick={() => setSelected(date)}
                  onDoubleClick={() => {
                    setSelected(date)
                    setView('dia')
                  }}
                  className={[
                    'flex min-w-0 cursor-pointer flex-col rounded-2xl border p-2 transition-colors sm:h-[26rem]',
                    isSelected ? 'border-forest bg-accent-soft/40' : 'border-line hover:border-forest/30',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(date)}
                    onDoubleClick={() => {
                      setSelected(date)
                      setView('dia')
                    }}
                    aria-label={new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date)}
                    className="flex w-full items-center gap-2 rounded-xl text-left sm:flex-col sm:gap-0.5"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{WEEKDAYS[index]}</span>
                    <span
                      className={[
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                        isSelected ? 'bg-forest text-white' : isToday ? 'bg-accent-soft text-forest' : 'text-ink',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                  {/* Coluna de altura fixa: dia cheio rola por dentro. */}
                  <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
                    {(aniversarios.get(date.toDateString()) ?? []).map((item) => (
                      <li key={`aniv-${item.patientId}`}>
                        <Link
                          to={`/pacientes/${item.patientId}`}
                          onClick={(event) => event.stopPropagation()}
                          title={rotuloAniversario(item)}
                          className="flex items-center gap-1 truncate rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800"
                        >
                          <Cake size={11} className="shrink-0" aria-hidden />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    ))}
                    {dues.map((card) => (
                      <li key={card.id}>
                        <Link
                          to="/quadro"
                          className="flex items-center gap-1 truncate rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-medium text-forest"
                          title={card.title}
                        >
                          <CalendarClock size={11} className="shrink-0" aria-hidden />
                          <span className="truncate">{card.title}</span>
                        </Link>
                      </li>
                    ))}
                    {daySessionsList.map((session) => (
                      <li key={session.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(date)}
                          title={`${session.patientName} · ${session.type}`}
                          className="block w-full truncate rounded-lg border-l-2 border-forest bg-canvas px-2 py-1 text-left text-[11px] text-ink transition-colors hover:bg-accent-soft"
                        >
                          <span className="font-semibold">
                            {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                              new Date(session.scheduledAt),
                            )}
                          </span>{' '}
                          {session.patientName}
                        </button>
                      </li>
                    ))}
                    {daySessionsList.length === 0 && dues.length === 0 && !aniversarios.has(date.toDateString()) ? (
                      <li className="hidden text-center text-[11px] text-muted/70 sm:block">—</li>
                    ) : null}
                  </ul>
                </div>
              )
            })}
          </div>
        </article>
          )}
          {painelDia}
        </div>
      )}

      {upcomingDues.length > 0 ? (
        <article className="dash-in mt-4 rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: '240ms' }}>
          <h2 className="text-sm font-semibold text-ink">Prazos do quadro</h2>
          <p className="mt-1 text-xs text-muted">Tarefas com data limite. Toque para abrir o dia no calendário.</p>
          <ul className="mt-4 space-y-2">
            {upcomingDues.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => goToDue(card.dueOn)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-left hover:bg-canvas"
                >
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-forest">
                    <span className="text-[10px] font-medium leading-none">
                      {card.dueOn.slice(8, 10)}/{card.dueOn.slice(5, 7)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{card.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {formatDueLabel(card.dueOn)}
                      {card.columnTitle ? ` · ${card.columnTitle}` : ''}
                      {card.patientName ? ` · ${card.patientName}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <Modal open={open} title="Nova sessão" onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Input
              label="Paciente"
              placeholder="Digite o nome"
              autoComplete="off"
              value={patientQuery}
              onChange={(event) => onPatientQueryChange(event.target.value)}
              onFocus={() => setPatientMenuOpen(true)}
            />
            {patientMenuOpen ? (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-line bg-canvas">
                {patientMatches.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-muted">
                    {patientQuery.trim()
                      ? 'Nenhum paciente com esse nome.'
                      : 'Nenhum paciente cadastrado.'}
                  </li>
                ) : (
                  patientMatches.map((patient) => (
                    <li key={patient.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pickPatient(patient)}
                      >
                        <PatientAvatar
                          name={patient.name}
                          tone={patient.photoTone}
                          initials={patient.initials}
                          size="sm"
                          photoUrl={patient.photoUrl}
                        />
                        <span className="min-w-0 truncate text-sm font-medium text-ink">{patient.name}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Data</p>
            <div className="rounded-2xl border border-line bg-canvas p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink"
                  aria-label="Mês anterior"
                  onClick={() =>
                    setPickerCursor(new Date(pickerCursor.getFullYear(), pickerCursor.getMonth() - 1, 1))
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-semibold capitalize text-ink">
                  {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(pickerCursor)}
                </p>
                <button
                  type="button"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-surface hover:text-ink"
                  aria-label="Próximo mês"
                  onClick={() =>
                    setPickerCursor(new Date(pickerCursor.getFullYear(), pickerCursor.getMonth() + 1, 1))
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {monthGrid(pickerCursor.getFullYear(), pickerCursor.getMonth()).map((date, index) => {
                  if (!date) return <div key={`picker-empty-${index}`} className="h-9" />
                  const isChosen = sameDay(date, sessionDate)
                  const isToday = sameDay(date, today)
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => chooseSessionDate(date)}
                      className={[
                        'h-9 rounded-xl text-sm',
                        isChosen ? 'bg-forest text-white' : isToday ? 'bg-accent-soft text-forest' : 'hover:bg-surface',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <Input label="Horário" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          <div>
            <p id="dias-semana-label" className="mb-2 text-sm font-medium text-ink">
              Dias da semana
            </p>
            <div role="group" aria-labelledby="dias-semana-label" className="grid grid-cols-7 gap-1">
              {SERIES_WEEKDAYS.map(({ day, label, ariaLabel }) => {
                const pressed = weekdays.includes(day)
                const onlyOne = pressed && weekdays.length === 1
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    aria-pressed={pressed}
                    aria-label={ariaLabel}
                    aria-disabled={onlyOne}
                    className={[
                      'min-h-11 rounded-xl border text-sm font-medium transition',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
                      pressed
                        ? 'border-forest bg-forest text-white'
                        : 'border-line bg-canvas text-ink hover:bg-surface',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted">
              Marque um ou mais dias. Pelo menos um dia precisa ficar marcado.
            </p>
          </div>
          <Input
            label="Repetir por quantas semanas"
            type="number"
            min={1}
            max={MAX_SERIES_WEEKS}
            inputMode="numeric"
            value={repeatWeeks}
            hint="Os dias marcados se repetem a cada semana, sempre no mesmo horário. De 1 a 24 semanas."
            onChange={(event) => setRepeatWeeks(event.target.value)}
          />
          {seriesPreviewText ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-accent/30 bg-accent-soft p-3 text-sm text-forest"
            >
              {seriesPreviewText}
            </p>
          ) : null}
          <Input label="Tipo" value={type} onChange={(event) => setType(event.target.value)} />
          <Input label="Sala" value={place} onChange={(event) => setPlace(event.target.value)} />
          {isCompany ? (
            <div>
              <Select
                id="calendar-session-therapist"
                label="Fisioterapeuta"
                value={therapistId}
                options={therapistOptions}
                onChange={(event) => setTherapistId(event.target.value)}
              />
              {therapists.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Nenhum fisioterapeuta ativo na equipe. Aprove convites em Equipe para anexar aqui.
                </p>
              ) : null}
            </div>
          ) : null}
          {showFinance ? (
            <div className="space-y-3 rounded-2xl border border-line p-3">
              <p className="text-sm font-semibold text-ink">Valor da sessão (opcional)</p>
              {prices.length > 0 ? (
                <Select
                  label="Preço do catálogo"
                  value={priceId}
                  options={priceOptions}
                  onChange={(event) => {
                    setPriceId(event.target.value)
                    if (event.target.value) setAdHocAmount('')
                    setChargeError(null)
                  }}
                />
              ) : null}
              <Input
                label="Valor avulso (R$)"
                placeholder="0,00"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={adHocAmount}
                onChange={(event) => {
                  setAdHocAmount(event.target.value)
                  if (event.target.value) setPriceId('')
                  setChargeError(null)
                }}
              />
              <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="accent-forest"
                  checked={isPaid}
                  onChange={(event) => {
                    setIsPaid(event.target.checked)
                    setChargeError(null)
                  }}
                />
                Pago
              </label>
              <p className="text-xs text-muted">
                {series.length > 1
                  ? `O valor vale para cada uma das ${series.length} sessões e entra no Financeiro.`
                  : 'O valor entra no Financeiro desta sessão.'}
              </p>
              {chargeError ? (
                <p role="alert" className="text-xs text-error">
                  {chargeError}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" fullWidth isLoading={create.isPending} disabled={!patientId}>
            {ctaLabel}
          </Button>
        </form>
      </Modal>

      {GOOGLE_CALENDAR_UI_VISIBLE ? (
      <ConfirmDialog
        open={disconnectOpen}
        title={GOOGLE_CALENDAR_COPY.disconnectTitle}
        description={GOOGLE_CALENDAR_COPY.disconnectDescription}
        confirmLabel={GOOGLE_CALENDAR_COPY.disconnectConfirm}
        cancelLabel={GOOGLE_CALENDAR_COPY.disconnectCancel}
        tone="danger"
        isLoading={disconnectGoogle.isPending}
        onClose={() => setDisconnectOpen(false)}
        onConfirm={handleDisconnectConfirm}
      />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDeleteSession)}
        title="Tem certeza que deseja excluir essa agenda?"
        description={
          pendingDeleteSession
            ? `A sessão de ${pendingDeleteSession.patientName} às ${new Intl.DateTimeFormat('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(pendingDeleteSession.scheduledAt))} será removida.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        tone="danger"
        isLoading={deleteSession.isPending}
        onClose={() => setPendingDeleteSession(null)}
        onConfirm={() => {
          if (!pendingDeleteSession) return
          deleteSession.mutate(pendingDeleteSession.id, {
            onSuccess: () => setPendingDeleteSession(null),
          })
        }}
      />
    </section>
  )
}
