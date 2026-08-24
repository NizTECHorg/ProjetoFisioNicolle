import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  Flag,
  Pencil,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-react'
import {
  PatientProfileHeader,
  type PatientTab,
} from '@/components/patients/PatientProfileHeader'
import { PatientAlertsPanel } from '@/components/patients/PatientAlertsPanel'
import { PatientCadastroPanel } from '@/components/patients/PatientCadastroPanel'
import { PatientEvolutionsPanel } from '@/components/patients/PatientEvolutionsPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { usePatient, usePatientDashboard, useUpdatePatient } from '@/hooks/usePatients'
import {
  caseUnderstandingSchema,
  type CaseUnderstandingFormData,
} from '@/schemas/patient.schema'
import type { Patient, PatientDashboard, PatientPainLog } from '@/types/patient'

const shortcuts = [
  { label: 'Avaliação', detail: 'Em breve', icon: ClipboardList, path: 'avaliacoes' },
  { label: 'Evoluções', detail: 'Abrir aba', icon: Stethoscope, tab: 'evolucoes' as const },
  { label: 'Reavaliações', detail: 'Em breve', icon: RefreshCw, path: 'reavaliacoes' },
  { label: 'Exercícios', detail: 'Em breve', icon: Dumbbell, path: 'exercicios' },
  { label: 'Documentos', detail: 'Em breve', icon: FileText, path: 'documentos' },
  { label: 'Financeiro', detail: 'Em breve', icon: CreditCard, path: 'financeiro' },
  { label: 'Agenda', detail: 'Abrir agenda', icon: CalendarDays, to: '/agenda' },
] as const

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function clampText(value: string, empty = '—') {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '—') return empty
  return trimmed
}

function dash(value: string) {
  return value === '—' ? '' : value
}

function EvaChart({ series }: { series: PatientPainLog[] }) {
  if (series.length === 0) {
    return <p className="mt-3 text-sm text-muted">Sem registros de dor ainda.</p>
  }

  const width = 320
  const height = 120
  const max = 10
  const points = series.map((item, index) => {
    const x = (index / Math.max(series.length - 1, 1)) * (width - 24) + 12
    const y = height - 20 - (item.value / max) * (height - 36)
    return { ...item, x, y }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-32 w-full">
      <path d={path} fill="none" stroke="#3db86a" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={`${point.date}-${point.value}`}>
          <circle cx={point.x} cy={point.y} r="3.5" fill="#0e271c" />
          <text x={point.x} y={height - 4} textAnchor="middle" className="fill-muted text-[9px]">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function BodyFocus() {
  return (
    <svg viewBox="0 0 140 220" className="h-36 w-auto text-forest">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="70" cy="18" r="12" />
        <path d="M70 30 v18" />
        <path d="M48 52 h44" />
        <path d="M48 52 v38" />
        <path d="M92 52 v38" />
        <rect x="54" y="48" width="32" height="58" rx="10" />
        <path d="M60 106 v70" />
        <path d="M80 106 v70" />
        <path d="M60 176 l-8 22" />
        <path d="M80 176 l8 22" />
      </g>
      <circle cx="80" cy="132" r="9" fill="#3db86a" fillOpacity="0.35" stroke="#3db86a" strokeWidth="2" />
      <circle cx="80" cy="108" r="7" fill="#3db86a" fillOpacity="0.25" stroke="#3db86a" />
    </svg>
  )
}

function EntendaOCaso({
  patient,
  detail,
}: {
  patient: PatientDashboard
  detail: Patient | null | undefined
}) {
  const update = useUpdatePatient()
  const [open, setOpen] = useState(false)
  const form = useForm<CaseUnderstandingFormData>({
    resolver: zodResolver(caseUnderstandingSchema),
  })

  const nextLabel = patient.nextSession
    ? `${patient.nextSession.dateLabel} · ${patient.nextSession.timeLabel}`
    : '—'
  const sessionsLabel =
    patient.sessionsTotal > 0
      ? `${patient.sessionsDone}/${patient.sessionsTotal}`
      : `${patient.sessionsDone}`

  useEffect(() => {
    if (!open) return
    const source = detail ?? null
    form.reset({
      complaint: dash(patient.complaint),
      diagnosis: dash(patient.diagnosis),
      treatmentStartedOn: source?.startDateRaw ?? '',
      sessionsDone: patient.sessionsDone,
      sessionsTotal: patient.sessionsTotal,
    })
  }, [open, patient, detail, form])

  return (
    <>
      <article className="group relative h-full rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Entenda o caso</p>
          <button
            type="button"
            aria-label="Editar entendimento do caso"
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-muted opacity-100 transition hover:bg-accent-soft hover:text-forest md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted">Queixa</p>
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink">{clampText(patient.complaint)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Diagnóstico</p>
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink">{clampText(patient.diagnosis)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric label="Início" value={patient.startDate} />
          <Metric label="Última sessão" value={patient.lastSessionLabel} />
          <Metric label="Próxima sessão" value={nextLabel} />
          <Metric label="Atendimentos" value={sessionsLabel} />
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Objetivos atuais
            </p>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {patient.activeGoals.length === 0 ? (
              <li className="text-muted">Nenhum objetivo ativo.</li>
            ) : (
              patient.activeGoals.map((goal) => (
                <li key={goal.id} className="line-clamp-2">
                  {goal.title}
                </li>
              ))
            )}
          </ul>
        </div>
      </article>

      <Modal
        open={open}
        title="Entenda o caso"
        description="Queixa, diagnóstico e acompanhamento."
        onClose={() => setOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            update.mutate(
              {
                id: patient.id,
                input: {
                  complaint: values.complaint,
                  diagnosis: values.diagnosis,
                  treatmentStartedOn: values.treatmentStartedOn,
                  sessionsDone: values.sessionsDone,
                  sessionsTotal: values.sessionsTotal,
                },
              },
              { onSuccess: () => setOpen(false) },
            )
          })}
        >
          <Textarea
            label="Queixa"
            rows={3}
            error={form.formState.errors.complaint?.message}
            {...form.register('complaint')}
          />
          <Textarea
            label="Diagnóstico"
            rows={3}
            error={form.formState.errors.diagnosis?.message}
            {...form.register('diagnosis')}
          />
          <Input
            label="Início do acompanhamento"
            type="date"
            error={form.formState.errors.treatmentStartedOn?.message}
            {...form.register('treatmentStartedOn')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Atendimentos feitos"
              type="number"
              min={0}
              error={form.formState.errors.sessionsDone?.message}
              {...form.register('sessionsDone')}
            />
            <Input
              label="Atendimentos planejados"
              type="number"
              min={0}
              error={form.formState.errors.sessionsTotal?.message}
              {...form.register('sessionsTotal')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={update.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function ResumoDoPaciente({ detail }: { detail: Patient | null | undefined }) {
  if (!detail) {
    return (
      <article className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex min-h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Resumo do paciente</p>

      <div className="mt-4 rounded-2xl border border-line bg-canvas/60 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Resumo IA</p>
          <Sparkles size={16} className="text-accent" />
        </div>
        <p className="mt-3 text-sm leading-7 text-ink/90 sm:text-base">
          {detail.aiSummary || 'Sem resumo ainda.'}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Programa</p>
            <h3 className="mt-2 text-sm font-semibold text-ink">{detail.program}</h3>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-accent" style={{ width: `${detail.programProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{detail.programProgress}% concluído</p>
          </div>

          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Evolução geral</p>
            <p className="mt-2 text-sm leading-6 text-ink">{detail.evolutionSummary || '—'}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-forest">
                {detail.eva}/10
              </span>
              <span className="text-xs text-muted">EVA na sessão de {detail.lastVisit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Condutas</p>
            <p className="mt-2 text-sm leading-6 text-ink">{detail.lastConducts || '—'}</p>
            <p className="mt-4 text-xs text-muted">Plano próxima sessão</p>
            <p className="mt-1 text-sm text-ink">{detail.nextSessionPlan || '—'}</p>
          </div>

          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Dor (EVA)</p>
            <EvaChart series={detail.painSeries} />
          </div>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Áreas de foco</p>
            <div className="mt-3 flex items-center gap-4">
              <BodyFocus />
              <ul className="space-y-2 text-sm">
                {detail.focusAreas.length === 0 ? (
                  <li className="text-muted">Sem áreas registradas.</li>
                ) : (
                  detail.focusAreas.map((area) => (
                    <li key={area.id} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${area.isActive ? 'bg-accent' : 'bg-line'}`} />
                      {area.label}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-line p-4">
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-accent" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Todos os objetivos
              </p>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {detail.goals.length === 0 ? (
                <li className="text-muted">Sem objetivos cadastrados.</li>
              ) : (
                detail.goals.map((goal) => (
                  <li
                    key={goal.id}
                    className={goal.isDone ? 'text-muted line-through' : 'text-ink'}
                  >
                    {goal.title}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}

function ResumoPanel({
  patient,
  detail,
}: {
  patient: PatientDashboard
  detail: Patient | null | undefined
}) {
  return (
    <div className="space-y-6">
      {/* Desktop 80/20; mobile empilha */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(12rem,1fr)] lg:items-stretch">
        <EntendaOCaso patient={patient} detail={detail} />
        <div className="min-h-[14rem] lg:h-full lg:min-h-0">
          <PatientAlertsPanel patientId={patient.id} alerts={patient.alerts} compact />
        </div>
      </div>

      <ResumoDoPaciente detail={detail} />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Atalhos</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon
            const to =
              'to' in item
                ? item.to
                : 'tab' in item
                  ? `/pacientes/${patient.id}?aba=${item.tab}`
                  : `/pacientes/${patient.id}/${item.path}`
            return (
              <Link
                key={item.label}
                to={to}
                className="dash-card flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-forest/25"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-forest">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  <span className="block text-xs text-muted">{item.detail}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function PatientPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const openIdentityRef = useRef<(() => void) | null>(null)

  const aba = searchParams.get('aba')
  const tab: PatientTab =
    aba === 'cadastro' ? 'cadastro' : aba === 'evolucoes' ? 'evolucoes' : 'resumo'

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = usePatientDashboard(id)

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = usePatient(id, { enabled: Boolean(id) && Boolean(dashboard) })

  const registerIdentityOpener = useCallback((open: () => void) => {
    openIdentityRef.current = open
  }, [])

  function setTab(next: PatientTab) {
    if (next === 'cadastro') {
      setSearchParams({ aba: 'cadastro' }, { replace: true })
      return
    }
    if (next === 'evolucoes') {
      setSearchParams({ aba: 'evolucoes' }, { replace: true })
      return
    }
    setSearchParams({}, { replace: true })
  }

  if (dashboardLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    )
  }

  if (dashboardError) {
    return (
      <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
        Não foi possível carregar o resumo do paciente.
      </article>
    )
  }

  if (!dashboard) {
    return <Navigate to="/pacientes" replace />
  }

  const meta = `${dashboard.code} · ${dashboard.phone}`

  return (
    <section className="mx-auto w-full max-w-6xl">
      <PatientProfileHeader
        name={dashboard.name}
        initials={dashboard.initials}
        photoTone={dashboard.photoTone}
        status={dashboard.status}
        meta={meta}
        activeTab={tab}
        onTabChange={setTab}
        identityAction={
          <button
            type="button"
            aria-label="Editar dados iniciais"
            aria-hidden={tab !== 'cadastro'}
            tabIndex={tab === 'cadastro' ? 0 : -1}
            disabled={tab !== 'cadastro'}
            onClick={() => openIdentityRef.current?.()}
            className={[
              'rounded-lg p-1.5 text-muted transition hover:bg-accent-soft hover:text-forest',
              tab === 'cadastro'
                ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
                : 'pointer-events-none invisible',
            ].join(' ')}
          >
            <Pencil size={16} />
          </button>
        }
      />

      <div className="mt-5 sm:mt-6">
        {tab === 'resumo' ? (
          <ResumoPanel patient={dashboard} detail={detail} />
        ) : tab === 'evolucoes' ? (
          <PatientEvolutionsPanel patientId={dashboard.id} />
        ) : detailLoading && !detail ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : detailError || !detail ? (
          <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
            Não foi possível carregar os dados cadastrais.
          </article>
        ) : (
          <PatientCadastroPanel patient={detail} onRequestIdentityEdit={registerIdentityOpener} />
        )}
      </div>
    </section>
  )
}
