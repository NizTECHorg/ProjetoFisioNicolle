import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ResumoDitado } from '@/components/patients/ResumoDitado'
import { AiGeneratingButton } from '@/components/ui/AiGeneratingButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { invalidatePatient, usePatient, usePatientEvaluations } from '@/hooks/usePatients'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { generatePatientAiSummary } from '@/services/patientAi.service'
import { toast } from '@/stores/toast.store'

const LATEST_EVAL_VALUE = 'latest'

type PatientAiComposerProps = {
  patientId: string
  /** Fail-closed — unmount write chrome when false. */
  canWrite?: boolean
}

/** Gera o resumo do paciente com IA. Exportar PDF fica nas abas Avaliações e Sessões. */
export function PatientAiComposer({ patientId, canWrite = false }: PatientAiComposerProps) {
  const qc = useQueryClient()
  const { data: detail } = usePatient(patientId)
  const { data: evaluations = [] } = usePatientEvaluations(patientId)

  const [userHint, setUserHint] = useState('')
  const [resumoEvaluationId, setResumoEvaluationId] = useState('all')
  const [generatingTarget, setGeneratingTarget] = useState<'resumo' | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setResumoEvaluationId('all')
  }, [patientId])

  if (!canWrite) return null

  const busy = generatingTarget !== null
  const hasEvaluations = evaluations.length > 0

  const resumoEvaluationOptions = [
    { value: 'all', label: 'Todas as fichas de avaliação (contexto completo)' },
    { value: LATEST_EVAL_VALUE, label: PATIENT_AI_COPY.pdfEvalLatest },
    ...evaluations.map((evaluation) => {
      const name = evaluation.title?.trim() || evaluation.ficha?.titulo?.trim() || ''
      const datePart = evaluation.performedOnLabel
      const initial = evaluation.isInitial ? ' · Inicial' : ''
      const label = name ? `${name} · ${datePart}${initial}` : `${datePart}${initial}`
      return { value: evaluation.id, label }
    }),
  ]

  async function handleGenerate() {
    if (busy) return
    setGeneratingTarget('resumo')
    try {
      const hint = userHint.trim()
      const resolvedEvaluationId =
        resumoEvaluationId === 'all'
          ? undefined
          : resumoEvaluationId === LATEST_EVAL_VALUE
            ? evaluations[0]?.id
            : resumoEvaluationId
      await generatePatientAiSummary({
        patientId,
        evaluationId: resolvedEvaluationId,
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

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="space-y-4">
      {hasEvaluations ? (
        <Select
          label="Ficha de avaliação para resumir"
          value={resumoEvaluationId}
          options={resumoEvaluationOptions}
          onChange={(event) => setResumoEvaluationId(event.target.value)}
        />
      ) : null}
      <Textarea
        label="Descrição adicional (opcional)"
        placeholder="Ex.: dor no joelho direito ao subir escada"
        rows={3}
        value={userHint}
        onChange={(event) => setUserHint(event.target.value)}
      />
      {canWrite ? (
        <ResumoDitado
          disabled={busy}
          onIncorporar={(texto) =>
            setUserHint((atual) => (atual.trim() ? `${atual.trimEnd()}\n${texto}` : texto).slice(0, 2000))
          }
        />
      ) : null}
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
