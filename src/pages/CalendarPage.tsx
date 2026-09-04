import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useCalendarSessions, useCreateSession, useBoard, useUpdateSessionStatus } from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'

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
  const [time, setTime] = useState('09:00')
  const [type, setType] = useState('Sessão')
  const [place, setPlace] = useState('Sala 1')

  const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  const { data: sessions = [], isLoading } = useCalendarSessions(from.toISOString(), to.toISOString())
  const { data: board } = useBoard()
  const { data: patients = [] } = usePatients()
  const create = useCreateSession()
  const updateStatus = useUpdateSessionStatus()

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

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!patientId) return
    const [hours = 9, minutes = 0] = time.split(':').map(Number)
    const when = new Date(selected)
    when.setHours(hours, minutes, 0, 0)
    create.mutate(
      {
        patientId,
        scheduledAt: when.toISOString(),
        type,
        place,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Agenda"
        description="Sessões da clínica e prazos de entrega do Quadro."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nova sessão
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="dash-in dash-card rounded-2xl border border-line bg-surface p-4 sm:p-5" style={{ animationDelay: '80ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
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
              className="rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
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
                      <PatientAvatar name={card.patientName} tone={card.photoTone} size="sm" />
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
                    <PatientAvatar name={session.patientName} tone={session.photoTone} />
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
          <Select
            label="Paciente"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            options={[
              { value: '', label: 'Selecione' },
              ...patients.map((patient) => ({ value: patient.id, label: patient.name })),
            ]}
          />
          <Input label="Data" type="date" value={toLocalInput(selected)} readOnly />
          <Input label="Horário" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          <Input label="Tipo" value={type} onChange={(event) => setType(event.target.value)} />
          <Input label="Sala" value={place} onChange={(event) => setPlace(event.target.value)} />
          <Button type="submit" fullWidth isLoading={create.isPending} disabled={!patientId}>
            Agendar
          </Button>
        </form>
      </Modal>
    </section>
  )
}
