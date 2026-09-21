import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PatientAiFieldPicker } from '@/components/patients/PatientAiFieldPicker'
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
import {
  buildEvaluationFilledCatalog,
  type PdfFieldItem,
} from '@/lib/pdfFieldCatalog'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { generatePatientAiSummary } from '@/services/patientAi.service'
import { buildPatientAiReportPdf } from '@/services/patientAiPdf.service'
import { toast } from '@/stores/toast.store'
import type { PatientEvaluation } from '@/types/evaluation'

type ComposerMode = 'resumo' | 'pdf'
/** PDF mode scopes — Avaliação | Evolução (D-01). */
type PdfExportScope = 'avaliacao' | 'evolucao'

const LATEST_EVAL_VALUE = 'latest'

type PatientAiComposerProps = {
  patientId: string
  /** Fail-closed — unmount write chrome when false. */
  canWrite?: boolean
}

type PendingAvaliacaoExport = {
  evaluation: PatientEvaluation
  items: PdfFieldItem[]
}

/**
 * Unified dual-mode composer (D-02): Escrever resumo (IA) | Exportar avaliação (PDF).
 * PDF Avaliação binds to saved EvaluationFicha + field-picker (D-03).
 * Evolução multi-select UI shell — export wiring in Plan 05.
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
  const [generating, setGenerating] = useState(false)
  const [scopeError, setScopeError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<string>>(() => new Set())
  const [pendingAvaliacao, setPendingAvaliacao] = useState<PendingAvaliacaoExport | null>(null)

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

  const busy = generating || createReport.isPending
  const hasEvaluations = evaluations.length > 0

  const evaluationOptions = [
    { value: LATEST_EVAL_VALUE, label: PATIENT_AI_COPY.pdfEvalLatest },
    ...evaluations.map((evaluation) => ({
      value: evaluation.id,
      label: `${evaluation.performedOnLabel}${evaluation.isInitial ? ' · Inicial' : ''}`,
    })),
  ]

  function toggleSession(id: string) {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setScopeError(null)
  }

  function closePicker() {
    setPickerOpen(false)
    setPendingAvaliacao(null)
    setPickerSelectedIds(new Set())
  }

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

  function handleExport() {
    if (busy || !detail) return

    if (pdfScope === 'evolucao') {
      if (selectedSessionIds.size === 0) {
        toast(PATIENT_AI_COPY.needSessions, 'error')
        return
      }
      // Plan 05 wires EF → picker → PDF kind evolucao
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
      toast(PATIENT_AI_COPY.needFields, 'error')
      return
    }

    setPendingAvaliacao({ evaluation: selected, items })
    setPickerSelectedIds(new Set(items.map((item) => item.id)))
    setPickerOpen(true)
  }

  async function handlePickerConfirm() {
    if (!detail || !pendingAvaliacao || createReport.isPending) return
    if (pickerSelectedIds.size === 0) {
      toast(PATIENT_AI_COPY.needFields, 'error')
      return
    }

    const { evaluation } = pendingAvaliacao
    try {
      const blob = await buildPatientAiReportPdf({
        kind: 'avaliacao',
        name: detail.name,
        code: detail.code,
        performedOnLabel: evaluation.performedOnLabel,
        therapistName: evaluation.therapistName,
        ficha: evaluation.ficha,
        selectedFieldIds: pickerSelectedIds,
      })

      createReport.mutate(
        {
          kind: 'avaliacao',
          sessionId: null,
          sessionLabel: null,
          blob,
        },
        {
          onSuccess: () => {
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

  const exportDisabled =
    busy ||
    !detail ||
    (pdfScope === 'avaliacao' && !hasEvaluations) ||
    pdfScope === 'evolucao'

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
          <div className="flex w-full flex-col gap-2 rounded-xl border border-line bg-canvas p-1 sm:inline-flex sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              aria-pressed={pdfScope === 'avaliacao'}
              onClick={() => {
                setPdfScope('avaliacao')
                setScopeError(null)
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

          <Button
            type="button"
            className="w-full sm:w-auto"
            isLoading={createReport.isPending && !pickerOpen}
            disabled={exportDisabled}
            onClick={() => handleExport()}
          >
            {PATIENT_AI_COPY.ctaExport}
          </Button>
        </div>
      )}

      <PatientAiFieldPicker
        open={pickerOpen}
        items={pendingAvaliacao?.items ?? []}
        selectedIds={pickerSelectedIds}
        onChange={setPickerSelectedIds}
        onBack={closePicker}
        confirming={createReport.isPending}
        onConfirm={() => void handlePickerConfirm()}
      />
    </div>
  )
}
