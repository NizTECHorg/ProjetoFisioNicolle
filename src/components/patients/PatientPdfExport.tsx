import { useEffect, useMemo, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { PatientAiFieldPicker } from '@/components/patients/PatientAiFieldPicker'
import { PatientAiReportsList } from '@/components/patients/PatientAiReportsList'
import { SendEmailDialog } from '@/components/patients/SendEmailDialog'
import { SendWhatsAppDialog } from '@/components/patients/SendWhatsAppDialog'
import { AiGeneratingButton } from '@/components/ui/AiGeneratingButton'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { usePatient, usePatientEvaluations, usePatientSessions } from '@/hooks/usePatients'
import { useCreatePatientAiReport } from '@/hooks/usePatientAiReports'
import {
  buildEvaluationFilledCatalog,
  buildEvolucaoFilledCatalog,
  type PdfFieldItem,
} from '@/lib/pdfFieldCatalog'
import { resolvePatientEmail, resolveWhatsAppDigits } from '@/lib/patientContact'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import type { EvolucaoSynthesis } from '@/schemas/patientAi.schema'
import { generateEvolucaoSynthesis } from '@/services/patientAi.service'
import { buildPatientAiReportPdf } from '@/services/patientAiPdf.service'
import {
  openPatientDocumentWhatsApp,
  sendPatientDocument,
  signPatientDocumentUrl,
} from '@/services/patientDocumentSend.service'
import { toast } from '@/stores/toast.store'
import type { PatientEvaluation } from '@/types/evaluation'
import type { PatientSessionRecord } from '@/types/patient'

export type PdfExportScope = 'avaliacao' | 'evolucao'

const LATEST_EVAL_VALUE = 'latest'
const MAX_EVOLUCAO_SESSIONS = 12

type PatientPdfExportProps = {
  patientId: string
  scope: PdfExportScope
  /** Fail-closed: sem escrita, só a lista de PDFs. */
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

/** Exportar da aba: escolhe o que vai no PDF, gera e envia. A lista traz os PDFs já salvos. */
export function PatientPdfExport({ patientId, scope, canWrite = false }: PatientPdfExportProps) {
  const { data: detail } = usePatient(patientId)
  return (
    <div className="space-y-6">
      <PdfExportForm patientId={patientId} pdfScope={scope} canWrite={canWrite} />
      <PatientAiReportsList
        patientId={patientId}
        canWrite={canWrite}
        phone={detail?.phone}
        email={detail?.email}
        kinds={scope === 'avaliacao' ? ['avaliacao', 'geral'] : ['evolucao', 'sessao']}
        titulo={scope === 'avaliacao' ? 'PDFs de avaliação' : 'PDFs de evolução'}
      />
    </div>
  )
}

function PdfExportForm({
  patientId,
  pdfScope,
  canWrite,
}: {
  patientId: string
  pdfScope: PdfExportScope
  canWrite: boolean
}) {
  const { data: detail } = usePatient(patientId)
  const { data: sessions = [] } = usePatientSessions(patientId)
  const { data: evaluations = [] } = usePatientEvaluations(patientId)
  const createReport = useCreatePatientAiReport(patientId)

  const [evaluationId, setEvaluationId] = useState(LATEST_EVAL_VALUE)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(() => new Set())
  const [generatingTarget, setGeneratingTarget] = useState<'sintese' | null>(null)
  const [catalogEmpty, setCatalogEmpty] = useState(false)
  const [scopeError, setScopeError] = useState<string | null>(null)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelectedIds, setPickerSelectedIds] = useState<Set<string>>(() => new Set())
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null)
  const [savedReport, setSavedReport] = useState<{
    id: string
    storagePath: string
    kind: 'avaliacao' | 'evolucao'
  } | null>(null)
  const [sending, setSending] = useState<'whatsapp' | 'email' | null>(null)
  const patientIdRef = useRef(patientId)
  patientIdRef.current = patientId

  useEffect(() => {
    setSavedReport(null)
    setSending(null)
  }, [patientId])

  const sessionsForPicker = useMemo(() => {
    const withEvo: typeof sessions = []
    const without: typeof sessions = []
    for (const session of sessions) {
      if (session.evolution) withEvo.push(session)
      else without.push(session)
    }
    return [...withEvo, ...without]
  }, [sessions])

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false)

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
                  sideEffects: session.evolution.sideEffects,
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
    const exportedFor = patientId

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
              if (exportedFor !== patientIdRef.current) return
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
                  sideEffects: session.evolution.sideEffects,
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
              if (exportedFor !== patientIdRef.current) return
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

  // Botão do WhatsApp: abre o popup com o paciente e outros números (cada um abre a sua conversa).
  function openWhatsAppDialog() {
    if (sending) return
    if (!reportForActiveScope()) {
      toast(PATIENT_AI_COPY.sendNeedExport, 'error')
      return
    }
    setWhatsAppDialogOpen(true)
  }

  /** Abre a conversa no número informado (ou no do paciente). Devolve se abriu. */
  async function handleSendWhatsApp(destino?: string): Promise<boolean> {
    if (sending) return false
    let digits = destino
    if (!digits) {
      const phone = resolveWhatsAppDigits(detail?.phone)
      if (!phone.ok) {
        toast(
          phone.reason === 'missing'
            ? PATIENT_AI_COPY.sendNeedPhone
            : PATIENT_AI_COPY.sendPhoneInvalid,
          'error',
        )
        return false
      }
      digits = phone.digits
    }
    const report = reportForActiveScope()
    if (!report) {
      toast(PATIENT_AI_COPY.sendNeedExport, 'error')
      return false
    }
    setSending('whatsapp')
    try {
      const signed = await signPatientDocumentUrl(report.storagePath, report.kind, patientId)
      if (!signed.ok || !signed.url.startsWith('https')) {
        toast(PATIENT_AI_COPY.sendFileUnavailable, 'error')
        return false
      }
      const popup = openPatientDocumentWhatsApp(digits, signed.url)
      if (popup === null) {
        toast(PATIENT_AI_COPY.sendWhatsAppBlocked, 'error')
        return false
      }
      toast(PATIENT_AI_COPY.sendWhatsAppSuccess, 'success')
      return true
    } finally {
      setSending(null)
    }
  }

  const patientEmailResolved = resolvePatientEmail(detail?.email)

  // Abre o popup para escolher os destinatários (paciente e/ou outras pessoas).
  function handleSendEmail() {
    if (sending) return
    if (!reportForActiveScope()) {
      toast(PATIENT_AI_COPY.sendNeedExport, 'error')
      return
    }
    setEmailDialogOpen(true)
  }

  async function confirmSendEmail(recipients: { sendToPatient: boolean; extraEmails: string[] }) {
    const report = reportForActiveScope()
    if (!report) {
      setEmailDialogOpen(false)
      toast(PATIENT_AI_COPY.sendNeedExport, 'error')
      return
    }
    setSending('email')
    try {
      await sendPatientDocument({ patientId, reportId: report.id, ...recipients })
      setEmailDialogOpen(false)
      toast(recipients.extraEmails.length > 0 ? 'E-mail enviado.' : PATIENT_AI_COPY.sendEmailSuccess, 'success')
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

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="space-y-4">
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
          onClick={openWhatsAppDialog}
        >
          <WhatsAppIcon />
          {PATIENT_AI_COPY.sendWhatsApp}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full sm:flex-1"
          isLoading={sending === 'email'}
          disabled={sending !== null}
          onClick={handleSendEmail}
        >
          <Mail size={16} aria-hidden />
          {PATIENT_AI_COPY.sendEmail}
        </Button>
      </div>
      </div>

      <PatientAiFieldPicker
        open={pickerOpen}
        items={pendingExport?.items ?? []}
        selectedIds={pickerSelectedIds}
        onChange={setPickerSelectedIds}
        onBack={closePicker}
        confirming={createReport.isPending}
        onConfirm={() => void handlePickerConfirm()}
      />

      <SendWhatsAppDialog
        open={whatsAppDialogOpen}
        patientPhone={detail?.phone}
        onOpenChat={(digits) => handleSendWhatsApp(digits)}
        onClose={() => setWhatsAppDialogOpen(false)}
      />

      <SendEmailDialog
        open={emailDialogOpen}
        patientEmail={patientEmailResolved.ok ? patientEmailResolved.email : null}
        sending={sending === 'email'}
        onClose={() => setEmailDialogOpen(false)}
        onSend={(recipients) => void confirmSendEmail(recipients)}
      />
    </div>
  )
}
