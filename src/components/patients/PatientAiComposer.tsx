import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { invalidatePatient, usePatient, usePatientSessions } from '@/hooks/usePatients'
import { useCreatePatientAiReport } from '@/hooks/usePatientAiReports'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { generatePatientAiSummary } from '@/services/patientAi.service'
import { buildPatientAiReportPdf } from '@/services/patientAiPdf.service'
import { toast } from '@/stores/toast.store'
import type { PatientAiReportKind } from '@/types/patient'

type ComposerMode = 'resumo' | 'pdf'

type PatientAiComposerProps = {
  patientId: string
  /** Fail-closed — unmount write chrome when false. */
  canWrite?: boolean
}

/**
 * Unified dual-mode composer (D-02): Escrever resumo (IA) | Exportar avaliação (PDF).
 * Hidden entirely when !canWrite (Pitfall 8).
 */
export function PatientAiComposer({ patientId, canWrite = false }: PatientAiComposerProps) {
  const qc = useQueryClient()
  const { data: detail } = usePatient(patientId)
  const { data: sessions = [] } = usePatientSessions(patientId)
  const createReport = useCreatePatientAiReport(patientId)

  const [mode, setMode] = useState<ComposerMode>('resumo')
  const [userHint, setUserHint] = useState('')
  const [pdfKind, setPdfKind] = useState<PatientAiReportKind>('geral')
  const [sessionId, setSessionId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  if (!canWrite) return null

  const busy = generating || createReport.isPending

  const sessionOptions = [
    { value: '', label: 'Selecione a sessão' },
    ...sessions.map((session) => ({
      value: session.id,
      label: `${session.dateLabel} · ${session.timeLabel}`,
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

    if (pdfKind === 'sessao' && !sessionId) {
      setSessionError('Selecione a sessão.')
      return
    }
    setSessionError(null)

    try {
      let blob: Blob
      let reportSessionId: string | null = null
      let sessionLabel: string | null = null

      if (pdfKind === 'geral') {
        blob = await buildPatientAiReportPdf({
          kind: 'geral',
          name: detail.name,
          code: detail.code,
          complaint: detail.complaint,
          diagnosis: detail.diagnosis,
          program: detail.program,
          eva: detail.eva,
          goals: detail.goals,
          focusAreas: detail.focusAreas,
          aiSummary: detail.aiSummary,
          evolutionHighlights: detail.evolutionSummary || undefined,
        })
      } else {
        const session = sessions.find((row) => row.id === sessionId)
        if (!session) {
          setSessionError('Selecione a sessão.')
          return
        }
        const label = `${session.dateLabel} · ${session.timeLabel}`
        reportSessionId = session.id
        sessionLabel = label
        blob = await buildPatientAiReportPdf({
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
      }

      createReport.mutate({
        kind: pdfKind,
        sessionId: reportSessionId,
        sessionLabel,
        blob,
      })
    } catch (error) {
      toast(
        error instanceof Error ? error.message : PATIENT_AI_COPY.exportError,
        'error',
      )
    }
  }

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
              aria-pressed={pdfKind === 'geral'}
              onClick={() => {
                setPdfKind('geral')
                setSessionError(null)
              }}
              className={[
                'min-h-11 rounded-lg px-3 text-sm font-medium transition',
                pdfKind === 'geral' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              Avaliação geral
            </button>
            <button
              type="button"
              aria-pressed={pdfKind === 'sessao'}
              onClick={() => setPdfKind('sessao')}
              className={[
                'min-h-11 rounded-lg px-3 text-sm font-medium transition',
                pdfKind === 'sessao' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              Por sessão
            </button>
          </div>

          {pdfKind === 'sessao' ? (
            <Select
              label="Sessão"
              value={sessionId}
              options={sessionOptions}
              error={sessionError ?? undefined}
              onChange={(event) => {
                setSessionId(event.target.value)
                setSessionError(null)
              }}
            />
          ) : null}

          <Button
            type="button"
            className="w-full sm:w-auto"
            isLoading={createReport.isPending}
            disabled={busy || !detail}
            onClick={() => void handleExport()}
          >
            {PATIENT_AI_COPY.ctaExport}
          </Button>
        </div>
      )}
    </div>
  )
}
