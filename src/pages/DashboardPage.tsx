import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { useCalendarSessions } from '@/hooks/useClinic'
import { usePatients } from '@/hooks/usePatients'
import type { CalendarSession } from '@/services/calendar.service'
import { statusLabels, type PatientListItem, type PatientStatus, type SessionStatus } from '@/types/patient'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const STATUS_ORDER: PatientStatus[] = ['em_tratamento', 'avaliacao', 'alta', 'inativo']

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date) {
  const day = startOfDay(date)
  const mondayOffset = (day.getDay() + 6) % 7
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - mondayOffset)
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function minDate(...dates: Date[]) {
  return dates.reduce((earliest, date) => (date < earliest ? date : earliest))
}

function maxDate(...dates: Date[]) {
  return dates.reduce((latest, date) => (date > latest ? date : latest))
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const day = new Intl.DateTimeFormat('pt-BR', { day: 'numeric' })
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
  const startMonth = month.format(weekStart).replace('.', '')
  const endMonth = month.format(weekEnd).replace('.', '')
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${day.format(weekStart)}–${day.format(weekEnd)} ${endMonth}`
  }
  return `${day.format(weekStart)} ${startMonth} – ${day.format(weekEnd)} ${endMonth}`
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

function inRange(session: CalendarSession, from: Date, to: Date) {
  const at = new Date(session.scheduledAt)
  return at >= from && at < to
}

function countsAsMonthSession(status: SessionStatus) {
  return status !== 'cancelada'
}

function countsInActivity(status: SessionStatus, isCurrentWeek: boolean) {
  if (isCurrentWeek) return status === 'confirmada'
  return status === 'confirmada' || status === 'realizada'
}

function monthDelta(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return undefined
    return { text: `+${current}`, up: true }
  }
  const percent = Math.round(((current - previous) / previous) * 100)
  if (percent === 0) return { text: '0%', up: true }
  return { text: `${percent > 0 ? '+' : ''}${percent}%`, up: percent > 0 }
}

function progressLabel(patient: PatientListItem | undefined) {
  if (!patient || patient.sessionsTotal <= 0) return null
  return `${Math.round((patient.sessionsDone / patient.sessionsTotal) * 100)}%`
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }
    const start = performance.now()
    const duration = 900
    let frame = 0
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return value
}

function StatCard({
  label,
  target,
  delta,
  to,
  delay,
}: {
  label: string
  target: number
  delta?: { text: string; up: boolean }
  to: string
  delay: string
}) {
  const value = useCountUp(target)

  return (
    <Link
      to={to}
      className="dash-card dash-in flex min-h-[148px] flex-col justify-between rounded-[1.5rem] bg-accent-soft p-5"
      style={{ animationDelay: delay }}
    >
      <p className="text-sm font-medium text-forest">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-5xl font-semibold leading-none text-ink">{value}</p>
        {delta ? (
          <span
            className={[
              'mb-1 inline-flex items-center gap-0.5 text-xs font-medium',
              delta.up ? 'text-accent' : 'text-error',
            ].join(' ')}
          >
            {delta.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta.text}
          </span>
        ) : null}
      </div>
    </Link>
  )
}

function ActivityChart({ days }: { days: Array<{ day: string; value: number }> }) {
  const [hover, setHover] = useState<number | null>(null)
  const width = 560
  const height = 220
  const pad = { l: 28, r: 16, t: 36, b: 36 }
  const peak = Math.max(1, ...days.map((item) => item.value))
  const max = peak <= 4 ? 4 : Math.ceil(peak / 4) * 4
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const points = days.map((item, index) => {
    const x = pad.l + (index * innerW) / Math.max(days.length - 1, 1)
    const y = pad.t + innerH - (item.value / max) * innerH
    return { ...item, x, y }
  })
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return null
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const area = `${line} L ${last.x} ${pad.t + innerH} L ${first.x} ${pad.t + innerH} Z`
  const hovered = hover === null ? undefined : points[hover]
  const active = hovered ?? points.reduce((best, point) => (point.value > best.value ? point : best), first)
  const ticks = [0, Math.round(max / 3), Math.round((max * 2) / 3), max]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="dash-chart h-56 w-full">
      {ticks.map((tick) => {
        const y = pad.t + innerH - (tick / max) * innerH
        return (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="#e2ebe6" strokeWidth="1" />
            <text x={4} y={y + 4} className="fill-muted text-[10px]">
              {tick}
            </text>
          </g>
        )
      })}
      <path d={area} fill="#3db86a" fillOpacity="0.08" />
      <path
        className="dash-line"
        d={line}
        fill="none"
        stroke="#3db86a"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((point, index) => (
        <g key={point.day} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
          <circle cx={point.x} cy={point.y} r="14" fill="transparent" />
          <circle
            cx={point.x}
            cy={point.y}
            r={active === point ? 6 : 3.5}
            fill={active === point ? '#0e271c' : '#3db86a'}
            className="transition-all duration-200"
          />
          <text x={point.x} y={height - 10} textAnchor="middle" className="fill-muted text-[11px]">
            {point.day}
          </text>
        </g>
      ))}
      <g>
        <rect x={Math.min(active.x - 52, width - 120)} y={active.y - 40} width="104" height="28" rx="10" fill="#0e271c" />
        <text
          x={Math.min(active.x, width - 68)}
          y={active.y - 22}
          textAnchor="middle"
          className="fill-white text-[10px] font-medium"
        >
          {active.value} {active.value === 1 ? 'sessão' : 'sessões'}
        </text>
      </g>
    </svg>
  )
}

function ringDash(radius: number, ratio: number) {
  const circumference = 2 * Math.PI * radius
  const filled = circumference * Math.min(Math.max(ratio, 0), 1)
  return `${filled} ${circumference}`
}

export function DashboardPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const { data: patients = [], isLoading: patientsLoading, isError: patientsError } = usePatients()
  const ranges = useMemo(() => {
    const today = startOfDay(new Date())
    const weekStart = addDays(startOfWeek(today), -7 * weekOffset)
    const weekEnd = addDays(weekStart, 7)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const upcomingEnd = addDays(today, 14)
    return {
      today,
      weekStart,
      weekEnd,
      monthStart,
      nextMonthStart,
      prevMonthStart,
      upcomingEnd,
      from: minDate(weekStart, prevMonthStart),
      to: maxDate(weekEnd, nextMonthStart, upcomingEnd),
    }
  }, [weekOffset])

  const { data: sessions = [], isLoading: sessionsLoading, isError: sessionsError } = useCalendarSessions(
    ranges.from.toISOString(),
    ranges.to.toISOString(),
  )

  const isCurrentWeek = weekOffset === 0
  const isLoading = patientsLoading || sessionsLoading
  const isError = patientsError || sessionsError

  const view = useMemo(() => {
    const patientsById = new Map(patients.map((patient) => [patient.id, patient]))
    const activePatients = patients.filter((patient) => patient.status === 'em_tratamento').length
    const newEvaluations = patients.filter((patient) => patient.status === 'avaliacao').length
    const monthSessions = sessions.filter(
      (session) => inRange(session, ranges.monthStart, ranges.nextMonthStart) && countsAsMonthSession(session.status),
    ).length
    const prevMonthSessions = sessions.filter(
      (session) => inRange(session, ranges.prevMonthStart, ranges.monthStart) && countsAsMonthSession(session.status),
    ).length
    const todaySessions = sessions.filter((session) => sameDay(new Date(session.scheduledAt), ranges.today))
    const confirmedToday = todaySessions.filter((session) => session.status === 'confirmada').length
    const openToday = todaySessions.filter(
      (session) => session.status === 'agendada' || session.status === 'confirmada',
    ).length
    const realizedToday = todaySessions.filter((session) => session.status === 'realizada').length
    const activityDays = WEEKDAYS.map((day, index) => {
      const date = addDays(ranges.weekStart, index)
      const value = sessions.filter(
        (session) =>
          sameDay(new Date(session.scheduledAt), date) && countsInActivity(session.status, isCurrentWeek),
      ).length
      return { day, value }
    })
    const upcoming = sessions
      .filter((session) => {
        const at = new Date(session.scheduledAt)
        return at >= new Date() && (session.status === 'confirmada' || session.status === 'agendada')
      })
      .slice(0, 4)
      .map((session) => {
        const patient = patientsById.get(session.patientId)
        return {
          id: session.id,
          patientId: session.patientId,
          name: session.patientName,
          tone: session.photoTone,
          detail: `${session.type} · ${formatTime(session.scheduledAt)}`,
          progress: progressLabel(patient),
        }
      })
    const statusCards = STATUS_ORDER.map((status) => {
      const count = patients.filter((patient) => patient.status === status).length
      const share = patients.length === 0 ? 0 : Math.round((count / patients.length) * 100)
      return {
        name: statusLabels[status],
        detail: count === 1 ? '1 paciente' : `${count} pacientes`,
        change: `${share}%`,
      }
    })

    return {
      activePatients,
      newEvaluations,
      monthSessions,
      monthDelta: monthDelta(monthSessions, prevMonthSessions),
      confirmedToday,
      confirmRatio: openToday === 0 ? 0 : confirmedToday / openToday,
      realizedRatio: todaySessions.length === 0 ? 0 : realizedToday / todaySessions.length,
      activityDays,
      upcoming,
      statusCards,
    }
  }, [isCurrentWeek, patients, ranges, sessions])

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 dash-in">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="dash-in flex min-h-64 items-center justify-center rounded-[1.5rem] border border-line bg-surface">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-[1.5rem] border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar o dashboard. Tente de novo em instantes.
        </article>
      ) : null}

      {!isLoading && !isError ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pacientes ativos"
              target={view.activePatients}
              to="/pacientes"
              delay="0ms"
            />
            <StatCard
              label="Sessões no mês"
              target={view.monthSessions}
              delta={view.monthDelta}
              to="/agenda"
              delay="80ms"
            />
            <StatCard
              label="Novas avaliações"
              target={view.newEvaluations}
              to="/pacientes"
              delay="160ms"
            />

            <article
              className="dash-card dash-in flex min-h-[148px] flex-col justify-between rounded-[1.5rem] bg-accent-soft p-5"
              style={{ animationDelay: '240ms' }}
            >
              <div>
                <p className="text-sm font-medium text-forest">Hoje na clínica</p>
                <p className="mt-1 text-xs text-forest/70">
                  {view.confirmedToday === 1
                    ? '1 sessão confirmada'
                    : `${view.confirmedToday} sessões confirmadas`}
                </p>
              </div>
              <div className="flex items-end justify-between">
                <svg viewBox="0 0 88 88" className="dash-ring h-16 w-16">
                  <circle cx="44" cy="44" r="34" fill="none" stroke="#0e271c" strokeOpacity="0.12" strokeWidth="8" />
                  <circle
                    className="dash-ring-arc"
                    cx="44"
                    cy="44"
                    r="34"
                    fill="none"
                    stroke="#3db86a"
                    strokeWidth="8"
                    strokeDasharray={ringDash(34, view.confirmRatio)}
                    strokeLinecap="round"
                    transform="rotate(-90 44 44)"
                  />
                  <circle
                    className="dash-ring-arc"
                    cx="44"
                    cy="44"
                    r="22"
                    fill="none"
                    stroke="#0e271c"
                    strokeWidth="6"
                    strokeDasharray={ringDash(22, view.realizedRatio)}
                    strokeLinecap="round"
                    transform="rotate(20 44 44)"
                  />
                </svg>
                <Link
                  to="/agenda"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-[11px] font-bold tracking-wide text-white transition hover:scale-105 hover:bg-forest-mid active:scale-95"
                >
                  VER
                </Link>
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <article className="dash-in rounded-[1.5rem] border border-line bg-surface p-5" style={{ animationDelay: '280ms' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Atividade</h2>
                  <p className="mt-1 text-xs text-muted">
                    {isCurrentWeek
                      ? 'Sessões confirmadas da semana · passe o mouse nos pontos'
                      : 'Sessões confirmadas e realizadas · passe o mouse nos pontos'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((current) => current + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-forest transition hover:bg-canvas"
                    aria-label="Semana anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="min-w-28 rounded-full border border-line px-3 py-1 text-center text-xs text-muted">
                    {formatWeekRange(ranges.weekStart)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((current) => Math.max(0, current - 1))}
                    disabled={isCurrentWeek}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-forest transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
                    aria-label="Semana seguinte"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <ActivityChart key={ranges.weekStart.toISOString()} days={view.activityDays} />
            </article>

            <article className="dash-in rounded-[1.5rem] border border-line bg-surface p-5" style={{ animationDelay: '360ms' }}>
              <h2 className="text-lg font-semibold text-ink">Próximas sessões</h2>
              {view.upcoming.length === 0 ? (
                <p className="mt-5 text-sm text-muted">Nenhuma sessão agendada nos próximos dias.</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {view.upcoming.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/pacientes/${item.patientId}`}
                        className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-canvas"
                      >
                        <PatientAvatar name={item.name} tone={item.tone} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                          <p className="truncate text-xs text-muted">{item.detail}</p>
                        </div>
                        {item.progress ? (
                          <span className="text-sm font-medium text-forest">{item.progress}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/pacientes" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-forest">
                Ver pacientes
                <ArrowRight size={14} />
              </Link>
            </article>
          </div>

          <article className="dash-in mt-4 rounded-[1.5rem] bg-accent-soft p-5 sm:p-6" style={{ animationDelay: '420ms' }}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="lg:w-48 lg:shrink-0">
                <h2 className="text-lg font-semibold text-forest">Carteira</h2>
                <p className="mt-1 text-xs leading-5 text-forest/70">
                  Distribuição dos pacientes pelo status atual da clínica.
                </p>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {view.statusCards.map((area) => (
                  <div key={area.name} className="dash-card rounded-2xl bg-surface px-4 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-forest">
                      {area.name.slice(0, 1)}
                    </span>
                    <p className="mt-4 text-sm font-medium text-ink">{area.name}</p>
                    <p className="text-xs text-muted">{area.detail}</p>
                    <p className="mt-3 text-lg font-semibold text-forest">{area.change}</p>
                  </div>
                ))}
                <Link
                  to="/pacientes"
                  className="dash-card flex min-h-36 flex-col justify-between rounded-2xl bg-forest px-4 py-4 text-white"
                >
                  <p className="text-sm font-medium">Ver fichas</p>
                  <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </div>
            </div>
          </article>
        </>
      ) : null}
    </section>
  )
}
