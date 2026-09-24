import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-react'
import { AttendanceCounts, plannedCount } from '@/components/patients/AttendanceCounts'
import {
  PatientProfileHeader,
  type PatientTab,
} from '@/components/patients/PatientProfileHeader'
import { PatientAlertsPanel } from '@/components/patients/PatientAlertsPanel'
import { PatientFocusAreasPanel } from '@/components/patients/PatientFocusAreasPanel'
import { PatientGoalsPanel } from '@/components/patients/PatientGoalsPanel'
import { PatientCadastroPanel } from '@/components/patients/PatientCadastroPanel'
import { PatientEvolutionsPanel } from '@/components/patients/PatientEvolutionsPanel'
import { PatientImagesPanel } from '@/components/patients/PatientImagesPanel'
import { PatientResumoIaPanel } from '@/components/patients/PatientResumoIaPanel'
import { PatientEvaluationPanel } from '@/components/patients/PatientEvaluationPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/hooks/useAuth'
import { usePatient, usePatientDashboard, useUpdatePatient } from '@/hooks/usePatients'
import { canWritePatient } from '@/lib/accountAccess'
import { patientFichaPath } from '@/lib/dashboardShortcut'
import {
  caseUnderstandingSchema,
  type CaseUnderstandingFormData,
} from '@/schemas/patient.schema'
import { goalStatusLabels, type Patient, type PatientDashboard, type PatientPainLog } from '@/types/patient'

const shortcuts = [
  { label: 'Resumo IA', detail: 'Resumo e PDFs', icon: ClipboardList, tab: 'resumo-ia' as const },
  { label: 'Sessões', detail: 'Abrir aba', icon: Stethoscope, tab: 'secoes' as const },
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
    return <p className="mt-3 w-full text-sm text-muted">Sem registros de dor ainda.</p>
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
      <path d={path} fill="none" stroke="#2f7dff" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={`${point.date}-${point.value}`}>
          <circle cx={point.x} cy={point.y} r="3.5" fill="#0b1d36" />
          <text x={point.x} y={height - 4} textAnchor="middle" className="fill-muted text-[9px]">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function EntendaOCaso({
  patient,
  detail,
  canWrite,
}: {
  patient: PatientDashboard
  detail: Patient | null | undefined
  canWrite: boolean
}) {
  const update = useUpdatePatient()
  const [open, setOpen] = useState(false)
  const form = useForm<CaseUnderstandingFormData>({
    resolver: zodResolver(caseUnderstandingSchema),
  })

  const nextLabel = patient.nextSession
    ? `${patient.nextSession.dateLabel} · ${patient.nextSession.timeLabel}`
    : '—'

  useEffect(() => {
    if (!open) return
    const source = detail ?? null
    form.reset({
      complaint: dash(patient.complaint),
      diagnosis: dash(patient.diagnosis),
      treatmentStartedOn: source?.startDateRaw ?? '',
      sessionsTotal: patient.sessionsTotal > 0 ? patient.sessionsTotal : '',
    })
  }, [open, patient, detail, form])

  return (
    <>
      <article className="group relative h-full rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Entenda o caso</p>
          {canWrite ? (
            <button
              type="button"
              aria-label="Editar entendimento do caso"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity hover:bg-accent-soft hover:text-forest group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <Pencil size={16} />
            </button>
          ) : null}
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
          <AttendanceCounts done={patient.sessionsDone} planned={patient.sessionsTotal} />
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
                <li key={goal.id} className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2">{goal.title}</span>
                  <span className="shrink-0 text-[10px] font-medium text-muted">
                    {goalStatusLabels[goal.status]}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </article>

      {canWrite ? (
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
                  sessionsTotal: plannedCount(values.sessionsTotal),
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
          <Input
            label="Atendimentos planejados"
            type="number"
            min={0}
            hint="Opcional. Os feitos entram sozinhos quando uma sessão é concluída."
            error={form.formState.errors.sessionsTotal?.message}
            {...form.register('sessionsTotal')}
          />
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={update.isPending}>
              Salvar
            </Button>
          </div>
        </form>
        </Modal>
      ) : null}
    </>
  )
}

function ResumoDoPaciente({
  patientId,
  detail,
  canWrite,
}: {
  patientId: string
  detail: Patient | null | undefined
  canWrite: boolean
}) {
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

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-3 lg:grid-flow-col lg:grid-rows-[auto_auto]">
        <div className="flex h-full min-h-[11rem] min-w-0 flex-col rounded-2xl border border-line p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Programa</p>
          <h3 className="mt-2 text-sm font-semibold text-ink">{detail.program}</h3>
          <div className="mt-auto pt-3">
            <div className="h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-accent" style={{ width: `${detail.programProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{detail.programProgress}% concluído</p>
          </div>
        </div>

        <div className="flex h-full min-h-[11rem] min-w-0 flex-col rounded-2xl border border-line p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Evolução geral</p>
          <p className="mt-2 break-words text-sm leading-6 text-ink">{detail.evolutionSummary || '—'}</p>
          <div className="mt-auto flex min-w-0 items-center gap-3 pt-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-forest">
              {detail.eva}/10
            </span>
            <span className="min-w-0 text-xs text-muted">EVA na sessão de {detail.lastVisit}</span>
          </div>
        </div>

        <div className="flex h-full min-h-[11rem] min-w-0 flex-col rounded-2xl border border-line p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Condutas</p>
          <p className="mt-2 break-words text-sm leading-6 text-ink">{detail.lastConducts || '—'}</p>
          <div className="mt-auto pt-4">
            <p className="text-xs text-muted">Plano próxima sessão</p>
            <p className="mt-1 break-words text-sm text-ink">{detail.nextSessionPlan || '—'}</p>
          </div>
        </div>

        <div className="flex h-full min-h-[11rem] min-w-0 flex-col rounded-2xl border border-line p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Dor (EVA)</p>
          <div className="mt-auto flex w-full min-w-0 flex-1 items-end">
            <EvaChart series={detail.painSeries} />
          </div>
        </div>

        <div className="flex h-full min-h-[16rem] min-w-0 flex-col rounded-2xl border border-line p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Áreas de foco</p>
          <div className="mt-auto flex w-full min-w-0 flex-1 items-center">
            <PatientFocusAreasPanel
              patientId={patientId}
              focusAreas={detail.focusAreas}
              canWrite={canWrite}
            />
          </div>
        </div>

        <div className="h-full min-h-[11rem] min-w-0">
          <PatientGoalsPanel patientId={patientId} goals={detail.goals} canWrite={canWrite} />
        </div>
      </div>
    </article>
  )
}

function ResumoPanel({
  patient,
  detail,
  canWrite,
}: {
  patient: PatientDashboard
  detail: Patient | null | undefined
  canWrite: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Desktop 80/20; mobile empilha */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(12rem,1fr)] lg:items-stretch">
        <EntendaOCaso patient={patient} detail={detail} canWrite={canWrite} />
        <div className="min-h-[14rem] min-w-0 lg:h-full lg:min-h-0">
          <PatientAlertsPanel patientId={patient.id} alerts={patient.alerts} compact canWrite={canWrite} />
        </div>
      </div>

      <ResumoDoPaciente patientId={patient.id} detail={detail} canWrite={canWrite} />

      <div className="min-w-0">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Atalhos</p>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                className="dash-card flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-forest/25"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-forest">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                  <span className="block truncate text-xs text-muted">{item.detail}</span>
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
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const openIdentityRef = useRef<(() => void) | null>(null)

  const aba = searchParams.get('aba')
  const openCreateOnMount = searchParams.get('nova') === '1'
  const tab: PatientTab =
    aba === 'cadastro'
      ? 'cadastro'
      : aba === 'secoes' || aba === 'evolucoes'
        ? 'secoes'
        : aba === 'avaliacoes'
          ? 'avaliacoes'
          : aba === 'resumo-ia'
            ? 'resumo-ia'
            : aba === 'avaliacao'
              ? 'avaliacao'
              : aba === 'imagens'
                ? 'imagens'
                : 'resumo'

  // Normalize legacy ?aba=evolucoes → ?aba=secoes
  useEffect(() => {
    if (aba !== 'evolucoes') return
    const next = new URLSearchParams(searchParams)
    next.set('aba', 'secoes')
    setSearchParams(next, { replace: true })
  }, [aba, searchParams, setSearchParams])

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

  const clearNovaQuery = useCallback(() => {
    setSearchParams({ aba: 'avaliacoes' }, { replace: true })
  }, [setSearchParams])

  function setTab(next: PatientTab) {
    if (next === 'cadastro') {
      setSearchParams({ aba: 'cadastro' }, { replace: true })
      return
    }
    if (next === 'secoes') {
      setSearchParams({ aba: 'secoes' }, { replace: true })
      return
    }
    if (next === 'avaliacoes') {
      setSearchParams({ aba: 'avaliacoes' }, { replace: true })
      return
    }
    if (next === 'resumo-ia' || next === 'avaliacao') {
      setSearchParams({ aba: 'resumo-ia' }, { replace: true })
      return
    }
    if (next === 'imagens') {
      setSearchParams({ aba: 'imagens' }, { replace: true })
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

  const meta = dashboard.phone?.trim() && dashboard.phone !== '—' ? dashboard.phone : ''
  const canWrite = canWritePatient(user?.id, detail?.createdBy ?? dashboard.createdBy)
  const showConsultBanner = profile?.accountType === 'empresa' && !canWrite

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl">
      {showConsultBanner ? (
        <div className="rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm text-forest">
          Somente consulta — você vê a ficha, mas não pode alterar.
        </div>
      ) : null}

      <PatientProfileHeader
        patientId={dashboard.id}
        name={dashboard.name}
        initials={dashboard.initials}
        photoTone={dashboard.photoTone}
        photoUrl={dashboard.photoUrl}
        canWrite={canWrite}
        status={dashboard.status}
        meta={meta}
        activeTab={tab}
        onTabChange={setTab}
        topRightAction={
          canWrite && tab === 'resumo' ? (
            <Button
              type="button"
              variant="secondary"
              className="!bg-white !px-4 !py-2.5 shadow-sm"
              onClick={() => navigate(patientFichaPath(dashboard.id, 'avaliacoes', { nova: true }))}
            >
              <Plus size={16} />
              Nova avaliação
            </Button>
          ) : undefined
        }
        identityAction={
          canWrite && tab === 'cadastro' ? (
            <button
              type="button"
              aria-label="Editar dados iniciais"
              onClick={() => openIdentityRef.current?.()}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted opacity-0 transition hover:bg-accent-soft hover:text-forest group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <Pencil size={16} />
            </button>
          ) : undefined
        }
      />

      <div className="mt-5 sm:mt-6">
        {tab === 'resumo' ? (
          <ResumoPanel patient={dashboard} detail={detail} canWrite={canWrite} />
        ) : tab === 'secoes' ? (
          <PatientEvolutionsPanel patientId={dashboard.id} canWrite={canWrite} />
        ) : tab === 'avaliacoes' ? (
          <PatientEvaluationPanel
            patientId={dashboard.id}
            patientName={dashboard.name}
            canWrite={canWrite}
            openCreateOnMount={openCreateOnMount}
            onOpenCreateConsumed={clearNovaQuery}
          />
        ) : tab === 'resumo-ia' || tab === 'avaliacao' ? (
          <PatientResumoIaPanel
            patientId={dashboard.id}
            patientName={dashboard.name}
            canWrite={canWrite}
          />
        ) : tab === 'imagens' ? (
          <PatientImagesPanel patientId={dashboard.id} canWrite={canWrite} />
        ) : detailLoading && !detail ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : detailError || !detail ? (
          <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
            Não foi possível carregar os dados cadastrais.
          </article>
        ) : (
          <PatientCadastroPanel
            patient={detail}
            canWrite={canWrite}
            onRequestIdentityEdit={registerIdentityOpener}
          />
        )}
      </div>
    </section>
  )
}
