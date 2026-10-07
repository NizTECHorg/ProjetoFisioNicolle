import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { PatientAiFieldPicker } from '@/components/patients/PatientAiFieldPicker'
import { AiGeneratingButton } from '@/components/ui/AiGeneratingButton'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  invalidatePatient,
  usePatient,
  usePatientEvaluations,
  usePatientSessions,
} from '@/hooks/usePatients'
import { useCreatePatientAiReport } from '@/hooks/usePatientAiReports'
import {
  buildEvaluationFilledCatalog,
  buildEvolucaoFilledCatalog,
  type PdfFieldItem,
} from '@/lib/pdfFieldCatalog'
import { resolvePatientEmail, resolveWhatsAppDigits } from '@/lib/patientContact'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import type { EvolucaoSynthesis } from '@/schemas/patientAi.schema'
import {
  generateEvolucaoSynthesis,
  generatePatientAiSummary,
} from '@/services/patientAi.service'
import { buildPatientAiReportPdf } from '@/services/patientAiPdf.service'
import {
  openPatientDocumentWhatsApp,
  sendPatientDocument,
  signPatientDocumentUrl,
} from '@/services/patientDocumentSend.service'
import { toast } from '@/stores/toast.store'
import type { PatientEvaluation } from '@/types/evaluation'
import type { PatientSessionRecord } from '@/types/patient'

type ComposerMode = 'resumo' | 'pdf'
type GeneratingTarget = 'resumo' | 'sintese' | null
/** PDF mode scopes — Avaliação | Evolução (D-01). */
type PdfExportScope = 'avaliacao' | 'evolucao'

const LATEST_EVAL_VALUE = 'latest'
const MAX_EVOLUCAO_SESSIONS = 12

type PatientAiComposerProps = {
  patientId: string
  /** Fail-closed — unmount write chrome when false. */
  canWrite?: boolean
}

type PendingAvaliacaoExport = {
  kind: 'avaliacao'
  evaluation: PatientEvaluation
  items: PdfFieldItem[]
}

type PendingEvolucaoExport = {
  kind: 'evolucao'
  sessions: PatientSessionRecord[]
  synthesis: EvolucaoSynthesis
  sessionLabel: string
  items: PdfFieldItem[]
}

type PendingExport = PendingAvaliacaoExport | PendingEvolucaoExport

/**
 * Unified dual-mode composer (D-02): Escrever resumo (IA) | Exportar avaliação (PDF).
 * PDF Avaliação binds to saved EvaluationFicha + field-picker (D-03).
 * Evolução: multi-select → EF synthesis → picker → PDF kind evolucao (D-04).
 * Hidden when !canWrite (REQ-25.5).
 */
export function PatientAiComposer({ patientId, canWrite = false }: PatientAiComposerProps) {
  const qc = useQueryClient()
  const { data: detail } = usePatient(patientId)
  const { data: sessions = [] } = usePatientSessions(patientId)
  const { data: evaluations = [] } = usePatientEvaluations(patientId)
  const createReport = useCreatePatientAiReport(patientId)

  const [mode, setMode] = useState<ComposerMode>('resumo')
  const [userHint, setUserHint] = useState('')
  const [pdfScope, setPdfScope] = useState<PdfExportScope>('avaliacao')
  const [evaluationId, setEvaluationId] = useState(LATEST_EVAL_VALUE)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(() => new Set())
  const [generatingTarget, setGeneratingTarget] = useState<GeneratingTarget>(null)
  const [catalogEmpty, setCatalogEmpty] = useState(false)
  const [scopeError, setScopeError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<string>>(() => new Set())
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [savedReport, setSavedReport] = useState<{
    id: string
    storagePath: string
    kind: 'avaliacao' | 'evolucao'
  } | null>(null)
  const [sending, setSending] = useState<'whatsapp' | 'email' | null>(null)

  const sessionsForPicker = useMemo(() => {
    const withEvo: typeof sessions = []
    const without: typeof sessions = []
    for (const session of sessions) {
      if (session.evolution) withEvo.push(session)
      else without.push(session)
    }
    return [...withEvo, ...without]
  }, [sessions])

  if (!canWrite) return null

  const busy = generatingTarget !== null || createReport.isPending
  const hasEvaluations = evaluations.length > 0

  const evaluationOptions = [
    { value: LATEST_EVAL_VALUE, label: PATIENT_AI_COPY.pdfEvalLatest },
    ...evaluations.map((evaluation) => {
      const name = evaluation.title?.trim() || evaluation.ficha?.titulo?.trim() || ''
      const datePart = evaluation.performedOnLabel
      const initial = evaluation.isInitial ? ' · Inicial' : ''
      const label = name ? `${name} · ${datePart}${initial}` : `${datePart}${initial}`
      return { value: evaluation.id, label }
    }),
  ]

  function toggleSession(id: string) {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size >= MAX_EVOLUCAO_SESSIONS) {
        toast(`Selecione no máximo ${MAX_EVOLUCAO_SESSIONS} sessões.`, 'error')
        return prev
      } else {
        next.add(id)
      }
      return next
    })
    setScopeError(null)
  }

  function closePicker() {
    setPickerOpen(false)
    setPendingExport(null)
    setPickerSelectedIds(new Set())
  }

  function buildEvolucaoSessionLabel(selected: PatientSessionRecord[]): string {
    const count = selected.length
    const countLabel = count === 1 ? '1 sessão' : `${count} sessões`
    if (count === 0) return countLabel
    const sorted = [...selected].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    const first = sorted[0]?.dateLabel
    const last = sorted[sorted.length - 1]?.dateLabel
    if (first && last && first !== last) return `${countLabel} · ${first}–${last}`
    if (first) return `${countLabel} · ${first}`
    return countLabel
  }

  async function handleGenerate() {
    if (busy) return
    setGeneratingTarget('resumo')
    try {
      const hint = userHint.trim()
      await generatePatientAiSummary({
        patientId,
        userHint: hint.length > 0 ? hint : undefined,
      })
      invalidatePatient(qc, patientId)
      toast(PATIENT_AI_COPY.generateSuccess, 'success')
      setUserHint('')
    } catch (error) {
      toast(
        error instanceof Error ? error.message : PATIENT_AI_COPY.generateError,
        'error',
      )
    } finally {
      setGeneratingTarget(null)
    }
  }

  function requestGenerate() {
    if (detail?.summaryEdits) {
      setConfirmOpen(true)
      return
    }
    void handleGenerate()
  }

  async function handleExport() {
    if (busy || !detail) return

    if (pdfScope === 'evolucao') {
      if (selectedSessionIds.size === 0) {
        toast(PATIENT_AI_COPY.needSessions, 'error')
        return
      }

      const selected = sessions
        .filter((session) => selectedSessionIds.has(session.id))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .slice(0, MAX_EVOLUCAO_SESSIONS)

      if (selected.length === 0) {
        toast(PATIENT_AI_COPY.needSessions, 'error')
        return
      }

      setGeneratingTarget('sintese')
      try {
        const synthesis = await generateEvolucaoSynthesis({
          patientId,
          sessionIds: selected.map((session) => session.id),
        })

        const items = buildEvolucaoFilledCatalog(
          selected.map((session) => ({
            id: session.id,
            dateLabel: session.dateLabel,
            evolution: session.evolution
              ? {
                  patientState: session.evolution.patientState,
                  changesSinceLast: session.evolution.changesSinceLast,
                  conducts: session.evolution.conducts,
                  treatmentResponse: session.evolution.treatmentResponse,
                  incidents: session.evolution.incidents,
                  nextPlan: session.evolution.nextPlan,
                }
              : null,
          })),
          synthesis,
        )

        if (items.length === 0) {
          setCatalogEmpty(true)
          return
        }
        setCatalogEmpty(false)

        const sessionLabel = buildEvolucaoSessionLabel(selected)
        setPendingExport({
          kind: 'evolucao',
          sessions: selected,
          synthesis,
          sessionLabel,
          items,
        })
        setPickerSelectedIds(new Set(items.map((item) => item.id)))
        setPickerOpen(true)
      } catch (error) {
        // REQ-25.6 — abort without invented PDF upload
        toast(
          error instanceof Error ? error.message : PATIENT_AI_COPY.unavailable,
          'error',
        )
      } finally {
        setGeneratingTarget(null)
      }
      return
    }

    if (!hasEvaluations) {
      toast(PATIENT_AI_COPY.pdfEvalEmpty, 'error')
      return
    }

    const selected =
      evaluationId === LATEST_EVAL_VALUE
        ? evaluations[0]
        : evaluations.find((row) => row.id === evaluationId)

    if (!selected) {
      setScopeError(PATIENT_AI_COPY.pdfEvalPlaceholder)
      return
    }
    setScopeError(null)

    const items = buildEvaluationFilledCatalog(selected.ficha)
    if (items.length === 0) {
      setCatalogEmpty(true)
      return
    }
    setCatalogEmpty(false)

    const evaluationTitle = selected.title?.trim() || selected.ficha?.titulo?.trim() || ''
    if (!evaluationTitle) {
      toast('Informe o nome da avaliação', 'error')
      return
    }

    setPendingExport({ kind: 'avaliacao', evaluation: selected, items })
    setPickerSelectedIds(new Set(items.map((item) => item.id)))
    setPickerOpen(true)
  }

  async function handlePickerConfirm() {
    if (!detail || !pendingExport || createReport.isPending) return
    if (pickerSelectedIds.size === 0) {
      toast(PATIENT_AI_COPY.needFields, 'error')
      return
    }

    try {
      if (pendingExport.kind === 'avaliacao') {
        const { evaluation } = pendingExport
        const evaluationTitle =
          evaluation.title?.trim() || evaluation.ficha?.titulo?.trim() || null
        const blob = await buildPatientAiReportPdf({
          kind: 'avaliacao',
          name: detail.name,
          code: detail.code,
          performedOnLabel: evaluation.performedOnLabel,
          evaluationTitle,
          therapistName: evaluation.therapistName,
          ficha: evaluation.ficha,
          selectedFieldIds: pickerSelectedIds,
        })

        const sessionLabel = evaluationTitle
          ? `${evaluationTitle} · ${evaluation.performedOnLabel}`
          : evaluation.performedOnLabel

        createReport.mutate(
          {
            kind: 'avaliacao',
            sessionId: null,
            sessionLabel,
            blob,
          },
          {
            onSuccess: (report) => {
              if (report.kind === 'avaliacao' || report.kind === 'evolucao') {
                setSavedReport({
                  id: report.id,
                  storagePath: report.storagePath,
                  kind: report.kind,
                })
              }
              closePicker()
            },
          },
        )
        return
      }

      const blob = await buildPatientAiReportPdf({
        kind: 'evolucao',
        name: detail.name,
        code: detail.code,
        sessionLabel: pendingExport.sessionLabel,
        sessions: pendingExport.sessions.map((session) => ({
          id: session.id,
          dateLabel: session.dateLabel,
          timeLabel: session.timeLabel,
          evolution: session.evolution
            ? {
                patientState: session.evolution.patientState,
                changesSinceLast: session.evolution.changesSinceLast,
                conducts: session.evolution.conducts,
                treatmentResponse: session.evolution.treatmentResponse,
                incidents: session.evolution.incidents,
                nextPlan: session.evolution.nextPlan,
              }
            : null,
        })),
        synthesis: pendingExport.synthesis,
        selectedFieldIds: pickerSelectedIds,
      })

      createReport.mutate(
        {
          kind: 'evolucao',
          sessionId: null,
          sessionLabel: pendingExport.sessionLabel,
          blob,
        },
        {
          onSuccess: (report) => {
            if (report.kind === 'avaliacao' || report.kind === 'evolucao') {
              setSavedReport({
                id: report.id,
                storagePath: report.storagePath,
                kind: report.kind,
              })
            }
            closePicker()
          },
        },
      )
    } catch (error) {
      toast(
        error instanceof Error ? error.message : PATIENT_AI_COPY.exportError,
        'error',
      )
    }
  }

  function reportForActiveScope() {
    if (!savedReport || savedReport.kind !== pdfScope) return null
    return savedReport
  }

  async function handleSendWhatsApp() {
    if (sending) return
    const phone = resolveWhatsAppDigits(detail?.phone)
    if (!phone.ok) {
      toast(
        phone.reason === 'missing'
          ? PATIENT_AI_COPY.sendNeedPhone
          : PATIENT_AI_COPY.sendPhoneInvalid,
        'error',
      )
      return
    }
    const report = reportForActiveScope()
    if (!report) {
      toast(PATIENT_AI_COPY.sendNeedExport, 'error')
      return
    }
    setSending('whatsapp')
    try {
      const signed = await signPatientDocumentUrl(report.storagePath, report.kind)
      if (!signed.ok || !signed.url.startsWith('https')) {
        toast(PATIENT_AI_COPY.sendFileUnavailable, 'error')
        return
      }
      const popup = openPatientDocumentWhatsApp(phone.digits, signed.url)
      if (popup === null) {
        toast(PATIENT_AI_COPY.sendWhatsAppBlocked, 'error')
        return
      }
      toast(PATIENT_AI_COPY.sendWhatsAppSuccess, 'success')
    } finally {
      setSending(null)
    }
  }

  async function handleSendEmail() {
    if (sending) return
    const email = resolvePatientEmail(detail?.email)
    if (!email.ok) {
      toast(PATIENT_AI_COPY.sendNeedEmail, 'error')
      return
    }
    const report = reportForActiveScope()
    if (!report) {
      toast(PATIENT_AI_COPY.sendNeedExport, 'error')
      return
    }
    setSending('email')
    try {
      await sendPatientDocument({ patientId, reportId: report.id })
      toast(PATIENT_AI_COPY.sendEmailSuccess, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : PATIENT_AI_COPY.sendEmailError, 'error')
    } finally {
      setSending(null)
    }
  }

  const exportDisabled =
    busy ||
    !detail ||
    (pdfScope === 'avaliacao' && !hasEvaluations) ||
    (pdfScope === 'evolucao' && sessionsForPicker.length === 0)

  const scopeButtonClass = (active: boolean) =>
    [
      'min-h-11 w-full rounded-lg px-3 text-sm font-medium transition sm:w-auto',
      active ? 'bg-forest text-white' : 'text-muted hover:text-ink',
    ].join(' ')

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="inline-flex flex-wrap gap-2 rounded-xl border border-line bg-canvas p-1">
        <button
          type="button"
          aria-pressed={mode === 'resumo'}
          onClick={() => setMode('resumo')}
          className={[
            'min-h-11 rounded-lg px-3 text-sm font-medium transition',
            mode === 'resumo' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
          ].join(' ')}
        >
          {PATIENT_AI_COPY.modeResumo}
        </button>
        <button
          type="button"
          aria-pressed={mode === 'pdf'}
          onClick={() => setMode('pdf')}
          className={[
            'min-h-11 rounded-lg px-3 text-sm font-medium transition',
            mode === 'pdf' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
          ].join(' ')}
        >
          {PATIENT_AI_COPY.modePdf}
        </button>
      </div>

      {mode === 'resumo' ? (
        <div className="mt-4 space-y-4">
          <Textarea
            label="Descrição adicional (opcional)"
            placeholder="Ex.: dor no joelho direito ao subir escada"
            rows={3}
            value={userHint}
            onChange={(event) => setUserHint(event.target.value)}
          />
          <AiGeneratingButton
            type="button"
            className="w-full sm:w-auto"
            generating={generatingTarget === 'resumo'}
            disabled={busy}
            onClick={() => requestGenerate()}
          >
            {PATIENT_AI_COPY.ctaGenerate}
          </AiGeneratingButton>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex w-full flex-col gap-2 rounded-xl border border-line bg-canvas p-1 sm:inline-flex sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              aria-pressed={pdfScope === 'avaliacao'}
              onClick={() => {
                setPdfScope('avaliacao')
                setScopeError(null)
                setCatalogEmpty(false)
              }}
              className={scopeButtonClass(pdfScope === 'avaliacao')}
            >
              {PATIENT_AI_COPY.pdfScopeAvaliacao}
            </button>
            <button
              type="button"
              aria-pressed={pdfScope === 'evolucao'}
              onClick={() => {
                setPdfScope('evolucao')
                setScopeError(null)
                setCatalogEmpty(false)
              }}
              className={scopeButtonClass(pdfScope === 'evolucao')}
            >
              {PATIENT_AI_COPY.pdfScopeEvolucao}
            </button>
          </div>

          {pdfScope === 'avaliacao' ? (
            hasEvaluations ? (
              <Select
                label="Avaliação"
                value={evaluationId}
                options={evaluationOptions}
                error={scopeError ?? undefined}
                onChange={(event) => {
                  setEvaluationId(event.target.value)
                  setScopeError(null)
                  setCatalogEmpty(false)
                }}
              />
            ) : (
              <p className="text-sm text-muted">{PATIENT_AI_COPY.pdfEvalEmpty}</p>
            )
          ) : (
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-ink">{PATIENT_AI_COPY.sessionsLabel}</p>
                <p className="mt-0.5 text-xs text-muted">{PATIENT_AI_COPY.sessionsHint}</p>
              </div>
              {sessionsForPicker.length === 0 ? (
                <p className="text-sm text-muted">{PATIENT_AI_COPY.needSessions}</p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                  {sessionsForPicker.map((session) => {
                    const checked = selectedSessionIds.has(session.id)
                    const label = `${session.dateLabel} · ${session.timeLabel}`
                    return (
                      <li key={session.id}>
                        <label className="inline-flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-ink hover:bg-canvas">
                          <input
                            type="checkbox"
                            className="accent-forest"
                            checked={checked}
                            onChange={() => toggleSession(session.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{label}</span>
                            {session.evolution ? (
                              <span className="block text-xs text-muted">Com evolução</span>
                            ) : (
                              <span className="block text-xs text-muted">Sem evolução</span>
                            )}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
              {scopeError ? <p className="text-sm text-error">{scopeError}</p> : null}
            </div>
          )}

          {pdfScope === 'evolucao' && generatingTarget === 'sintese' ? (
            <AiGeneratingButton
              type="button"
              generating
              className="w-full sm:w-auto"
              disabled={exportDisabled}
              onClick={() => void handleExport()}
            />
          ) : (
            <Button
              type="button"
              className="w-full sm:w-auto"
              isLoading={createReport.isPending && !pickerOpen}
              disabled={exportDisabled}
              onClick={() => void handleExport()}
            >
              {PATIENT_AI_COPY.ctaExport}
            </Button>
          )}
          {catalogEmpty ? (
            <div>
              <h3 className="text-sm font-semibold leading-[1.2] text-ink">
                {PATIENT_AI_COPY.pdfEmptyHeading}
              </h3>
              <p className="mt-2 text-sm leading-normal text-muted">
                {PATIENT_AI_COPY.pdfEmptyBody}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:flex-1"
              isLoading={sending === 'whatsapp'}
              disabled={sending !== null}
              onClick={() => void handleSendWhatsApp()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#25D366"
                  d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.89c-.24.68-1.2 1.24-1.96 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.17-4.95-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.58-.36.77-.36h.55c.18 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.14.44.2.51.31.06.12.06.67-.18 1.35z"
                />
              </svg>
              {PATIENT_AI_COPY.sendWhatsApp}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 w-full sm:flex-1"
              isLoading={sending === 'email'}
              disabled={sending !== null}
              onClick={() => void handleSendEmail()}
            >
              <Mail size={16} aria-hidden />
              {PATIENT_AI_COPY.sendEmail}
            </Button>
          </div>
        </div>
      )}

      <PatientAiFieldPicker
        open={pickerOpen}
        items={pendingExport?.items ?? []}
        selectedIds={pickerSelectedIds}
        onChange={setPickerSelectedIds}
        onBack={closePicker}
        confirming={createReport.isPending}
        onConfirm={() => void handlePickerConfirm()}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={PATIENT_AI_COPY.regenerateConfirmTitle}
        description={PATIENT_AI_COPY.regenerateConfirmBody}
        confirmLabel={PATIENT_AI_COPY.regenerateConfirmLabel}
        cancelLabel={PATIENT_AI_COPY.regenerateCancelLabel}
        tone="danger"
        autoFocusCancel
        generatingConfirm
        isLoading={generatingTarget === 'resumo'}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleGenerate().finally(() => setConfirmOpen(false))
        }}
      />
    </div>
  )
}
