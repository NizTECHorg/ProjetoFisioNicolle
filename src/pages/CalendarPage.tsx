import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useCalendarSessions, useCreateSession, useBoard, useUpdateSessionStatus } from '@/hooks/useClinic'
import {
  useDisconnectGoogleCalendar,
  useEnsureGoogleCalendarVaulted,
  useExportGoogleCalendarMonth,
  useGoogleCalendarConnection,
  useLinkGoogleCalendar,
} from '@/hooks/useGoogleCalendar'
import { usePatients } from '@/hooks/usePatients'
import { filterPatientsByName } from '@/lib/dashboardShortcut'
import { GOOGLE_CALENDAR_COPY } from '@/schemas/googleCalendar.schema'
import type { PatientListItem } from '@/types/patient'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

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

function weeklyAt(start: Date, weeks: number): Date[] {
  return Array.from({ length: weeks }, (_, index) => {
    const next = new Date(start)
    next.setDate(start.getDate() + index * 7)
    return next
  })
}

function clampWeeks(value: string) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(24, Math.max(1, Math.trunc(count)))
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function CalendarPage() {
  const today = startOfDay(new Date())
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [patientQuery, setPatientQuery] = useState('')
  const [patientMenuOpen, setPatientMenuOpen] = useState(false)
  const [sessionDate, setSessionDate] = useState(today)
  const [pickerCursor, setPickerCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [time, setTime] = useState('09:00')
  const [repeatWeeks, setRepeatWeeks] = useState('1')
  const [type, setType] = useState('Sessão')
  const [place, setPlace] = useState('Sala 1')
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
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
  const isCurrentMonth = cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth()
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
    setPickerCursor(new Date(next.getFullYear(), next.getMonth(), 1))
    setSelected(next)
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!patientId) return
    const [hours = 9, minutes = 0] = time.split(':').map(Number)
    const when = new Date(sessionDate)
    when.setHours(hours, minutes, 0, 0)
    const weeks = clampWeeks(repeatWeeks)
    const scheduledAts = weeklyAt(when, weeks).map((date) => date.toISOString())
    create.mutate(
      {
        patientId,
        scheduledAt: scheduledAts[0] ?? when.toISOString(),
        scheduledAts,
        type,
        place,
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

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Agenda"
        description="Sessões da clínica e prazos de entrega do Quadro."
        action={
          <Button onClick={openComposer}>
            <Plus size={16} />
            Nova sessão
          </Button>
        }
      />

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

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="dash-in dash-card rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-canvas hover:text-ink"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold capitalize text-ink">{monthLabel}</h2>
              {isCurrentMonth ? (
                <button
                  type="button"
                  className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-forest"
                  onClick={() => {
                    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
                    setSelected(today)
                  }}
                >
                  Hoje
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-canvas hover:text-ink"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

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
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelected(date)}
                  className={[
                    'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition',
                    isSelected ? 'bg-forest text-white' : isToday ? 'bg-accent-soft text-forest' : 'hover:bg-canvas',
                  ].join(' ')}
                >
                  {date.getDate()}
                  {hasSessions || hasDues ? (
                    <span className="mt-1 flex items-center gap-0.5">
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

        <article className="dash-in dash-card rounded-2xl border border-line bg-surface p-5" style={{ animationDelay: '180ms' }}>
          <h2 className="text-sm font-semibold text-ink">
            {new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(selected)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {daySessions.length === 0 && dayDues.length === 0
              ? 'Nada neste dia'
              : [
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
                  <Link to={`/pacientes/${session.patientId}`} className="flex items-center gap-3">
                    <PatientAvatar name={session.patientName} tone={session.photoTone} photoUrl={session.photoUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{session.patientName}</span>
                      <span className="block text-xs text-muted">
                        {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
                          new Date(session.scheduledAt),
                        )}{' '}
                        · {session.type} · {session.place}
                      </span>
                    </span>
                  </Link>
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

              {daySessions.length === 0 && dayDues.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="text-sm font-medium text-forest"
                >
                  Agendar sessão neste dia
                </button>
              ) : null}
            </div>
          )}
        </article>
      </div>

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
          <Input
            label="Horário fixo"
            type="number"
            min={1}
            max={24}
            inputMode="numeric"
            value={repeatWeeks}
            hint={
              clampWeeks(repeatWeeks) === 1
                ? '1 marca só esta data, como agendada.'
                : `Marca esta e as próximas ${clampWeeks(repeatWeeks) - 1} no mesmo dia e horário, todas como agendadas.`
            }
            onChange={(event) => setRepeatWeeks(event.target.value)}
          />
          <Input label="Tipo" value={type} onChange={(event) => setType(event.target.value)} />
          <Input label="Sala" value={place} onChange={(event) => setPlace(event.target.value)} />
          <Button type="submit" fullWidth isLoading={create.isPending} disabled={!patientId}>
            Agendar
          </Button>
        </form>
      </Modal>

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
    </section>
  )
}
