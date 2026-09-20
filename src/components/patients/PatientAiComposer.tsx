import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  invalidatePatient,
  usePatient,
  usePatientEvaluations,
  usePatientSessions,
} from '@/hooks/usePatients'
import { useCreatePatientAiReport } from '@/hooks/usePatientAiReports'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { generatePatientAiSummary } from '@/services/patientAi.service'
import { buildPatientAiReportPdf } from '@/services/patientAiPdf.service'
import { toast } from '@/stores/toast.store'
import type { PatientAiReportKind } from '@/types/patient'

type ComposerMode = 'resumo' | 'pdf'
/** UI scope — storage maps avaliacao → kind 'geral' (no SQL change). */
type PdfExportScope = 'avaliacao' | 'sessao'

const LATEST_EVAL_VALUE = 'latest'

type PatientAiComposerProps = {
  patientId: string
  /** Fail-closed — unmount write chrome when false. */
  canWrite?: boolean
}

/**
 * Unified dual-mode composer (D-02): Escrever resumo (IA) | Exportar avaliação (PDF).
 * PDF avaliação binds to saved EvaluationFicha (D-07). Hidden when !canWrite (Pitfall 8).
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
  const [sessionId, setSessionId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [scopeError, setScopeError] = useState<string | null>(null)

  if (!canWrite) return null

  const busy = generating || createReport.isPending
  const hasEvaluations = evaluations.length > 0

  const sessionOptions = [
    { value: '', label: 'Selecione a sessão' },
    ...sessions.map((session) => ({
      value: session.id,
      label: `${session.dateLabel} · ${session.timeLabel}`,
    })),
  ]

  const evaluationOptions = [
    { value: LATEST_EVAL_VALUE, label: PATIENT_AI_COPY.pdfEvalLatest },
    ...evaluations.map((evaluation) => ({
      value: evaluation.id,
      label: `${evaluation.performedOnLabel}${evaluation.isInitial ? ' · Inicial' : ''}`,
    })),
  ]

  async function handleGenerate() {
    if (busy) return
    setGenerating(true)
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
      setGenerating(false)
    }
  }

  async function handleExport() {
    if (busy || !detail) return

    if (pdfScope === 'avaliacao') {
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

      try {
        const blob = await buildPatientAiReportPdf({
          kind: 'avaliacao',
          name: detail.name,
          code: detail.code,
          performedOnLabel: selected.performedOnLabel,
          therapistName: selected.therapistName,
          ficha: selected.ficha,
        })

        // Map avaliacao PDF → storage kind 'geral' (DB check geral|sessao; content = ficha)
        const reportKind: PatientAiReportKind = 'geral'
        createReport.mutate({
          kind: reportKind,
          sessionId: null,
          sessionLabel: null,
          blob,
        })
      } catch (error) {
        toast(
          error instanceof Error ? error.message : PATIENT_AI_COPY.exportError,
          'error',
        )
      }
      return
    }

    if (!sessionId) {
      setScopeError('Selecione a sessão.')
      return
    }
    setScopeError(null)

    try {
      const session = sessions.find((row) => row.id === sessionId)
      if (!session) {
        setScopeError('Selecione a sessão.')
        return
      }
      const label = `${session.dateLabel} · ${session.timeLabel}`
      const blob = await buildPatientAiReportPdf({
        kind: 'sessao',
        name: detail.name,
        code: detail.code,
        sessionLabel: label,
        sessionDateLabel: session.dateLabel,
        sessionTimeLabel: session.timeLabel,
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
      })

      createReport.mutate({
        kind: 'sessao',
        sessionId: session.id,
        sessionLabel: label,
        blob,
      })
    } catch (error) {
      toast(
        error instanceof Error ? error.message : PATIENT_AI_COPY.exportError,
        'error',
      )
    }
  }

  const exportDisabled =
    busy ||
    !detail ||
    (pdfScope === 'avaliacao' && !hasEvaluations)

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
            label="Orientação opcional (opcional)"
            placeholder="Ex.: enfatize evolução da dor lombar nas últimas sessões"
            rows={3}
            value={userHint}
            onChange={(event) => setUserHint(event.target.value)}
          />
          <Button
            type="button"
            className="w-full sm:w-auto"
            isLoading={generating}
            disabled={busy}
            onClick={() => void handleGenerate()}
          >
            {PATIENT_AI_COPY.ctaGenerate}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="inline-flex flex-wrap gap-2 rounded-xl border border-line bg-canvas p-1">
            <button
              type="button"
              aria-pressed={pdfScope === 'avaliacao'}
              onClick={() => {
                setPdfScope('avaliacao')
                setScopeError(null)
              }}
              className={[
                'min-h-11 rounded-lg px-3 text-sm font-medium transition',
                pdfScope === 'avaliacao' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              {PATIENT_AI_COPY.pdfScopeAvaliacao}
            </button>
            <button
              type="button"
              aria-pressed={pdfScope === 'sessao'}
              onClick={() => {
                setPdfScope('sessao')
                setScopeError(null)
              }}
              className={[
                'min-h-11 rounded-lg px-3 text-sm font-medium transition',
                pdfScope === 'sessao' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              {PATIENT_AI_COPY.pdfScopeSessao}
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
                }}
              />
            ) : (
              <p className="text-sm text-muted">{PATIENT_AI_COPY.pdfEvalEmpty}</p>
            )
          ) : (
            <Select
              label="Sessão"
              value={sessionId}
              options={sessionOptions}
              error={scopeError ?? undefined}
              onChange={(event) => {
                setSessionId(event.target.value)
                setScopeError(null)
              }}
            />
          )}

          <Button
            type="button"
            className="w-full sm:w-auto"
            isLoading={createReport.isPending}
            disabled={exportDisabled}
            onClick={() => void handleExport()}
          >
            {PATIENT_AI_COPY.ctaExport}
          </Button>
        </div>
      )}
    </div>
  )
}
