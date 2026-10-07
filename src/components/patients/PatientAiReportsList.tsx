import { useState } from 'react'
import { FileText, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useDeletePatientAiReport,
  usePatientAiReports,
} from '@/hooks/usePatientAiReports'
import { resolvePatientEmail, resolveWhatsAppDigits } from '@/lib/patientContact'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import {
  openPatientDocumentWhatsApp,
  sendPatientDocument,
  signPatientDocumentUrl,
} from '@/services/patientDocumentSend.service'
import { toast } from '@/stores/toast.store'
import type { PatientAiReport } from '@/types/patient'

type PatientAiReportsListProps = {
  patientId: string
  /** Fail-closed — hide Excluir and resend when false. */
  canWrite?: boolean
  phone?: string | null
  email?: string | null
}

type SendingChannel = 'whatsapp' | 'email'

function formatReportDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function openReport(report: PatientAiReport) {
  if (!report.signedUrl) return
  window.open(report.signedUrl, '_blank', 'noopener,noreferrer')
}

function downloadReport(report: PatientAiReport) {
  if (!report.signedUrl) return
  const anchor = document.createElement('a')
  anchor.href = report.signedUrl
  anchor.download = `avaliacao-${report.kind}-${report.id.slice(0, 8)}.pdf`
  anchor.rel = 'noopener noreferrer'
  anchor.target = '_blank'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function kindBadgeLabel(kind: PatientAiReport['kind']) {
  switch (kind) {
    case 'avaliacao':
      return PATIENT_AI_COPY.kindAvaliacao
    case 'evolucao':
      return PATIENT_AI_COPY.kindEvolucao
    case 'geral':
      return PATIENT_AI_COPY.kindGeral
    case 'sessao':
      return PATIENT_AI_COPY.kindSessao
  }
}

function showsSessionLabel(kind: PatientAiReport['kind']) {
  return kind === 'sessao' || kind === 'evolucao' || kind === 'avaliacao'
}

/**
 * Avaliações salvas list (D-05): kind, date, sessionLabel, Abrir/Baixar, Excluir when canWrite.
 */
function canResendKind(kind: PatientAiReport['kind']): kind is 'avaliacao' | 'evolucao' {
  if (kind === 'geral' || kind === 'sessao') return false
  return kind === 'avaliacao' || kind === 'evolucao'
}

export function PatientAiReportsList({
  patientId,
  canWrite = false,
  phone,
  email,
}: PatientAiReportsListProps) {
  const { data: reports = [], isLoading, isError } = usePatientAiReports(patientId)
  const deleteReport = useDeletePatientAiReport(patientId)
  const [pendingDelete, setPendingDelete] = useState<PatientAiReport | null>(null)
  const [sending, setSending] = useState<{ id: string; channel: SendingChannel } | null>(null)

  async function handleSendWhatsApp(report: PatientAiReport) {
    if (sending || !canResendKind(report.kind)) return
    const resolved = resolveWhatsAppDigits(phone)
    if (!resolved.ok) {
      toast(
        resolved.reason === 'missing'
          ? PATIENT_AI_COPY.sendNeedPhone
          : PATIENT_AI_COPY.sendPhoneInvalid,
        'error',
      )
      return
    }
    setSending({ id: report.id, channel: 'whatsapp' })
    try {
      const signed = await signPatientDocumentUrl(report.storagePath, report.kind)
      if (!signed.ok || !signed.url.startsWith('https')) {
        toast(PATIENT_AI_COPY.sendFileUnavailable, 'error')
        return
      }
      const popup = openPatientDocumentWhatsApp(resolved.digits, signed.url)
      if (popup === null) {
        toast(PATIENT_AI_COPY.sendWhatsAppBlocked, 'error')
        return
      }
      toast(PATIENT_AI_COPY.sendWhatsAppSuccess, 'success')
    } finally {
      setSending(null)
    }
  }

  async function handleSendEmail(report: PatientAiReport) {
    if (sending || !canResendKind(report.kind)) return
    const resolved = resolvePatientEmail(email)
    if (!resolved.ok) {
      toast(PATIENT_AI_COPY.sendNeedEmail, 'error')
      return
    }
    setSending({ id: report.id, channel: 'email' })
    try {
      await sendPatientDocument({ patientId, reportId: report.id })
      toast(PATIENT_AI_COPY.sendEmailSuccess, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : PATIENT_AI_COPY.sendEmailError, 'error')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">Avaliações salvas</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar as avaliações salvas.
        </article>
      ) : null}

      {!isLoading && !isError && reports.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <FileText className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm font-medium text-ink">{PATIENT_AI_COPY.listEmptyHeading}</p>
          {canWrite ? (
            <p className="mt-1 text-sm text-muted">{PATIENT_AI_COPY.listEmptyBodyCanWrite}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">{PATIENT_AI_COPY.listEmptyBodyReadOnly}</p>
          )}
        </article>
      ) : null}

      {!isLoading && !isError && reports.length > 0 ? (
        <ul className="space-y-2">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-forest">
                    {kindBadgeLabel(report.kind)}
                  </span>
                  <p className="text-sm font-semibold text-ink">{formatReportDate(report.createdAt)}</p>
                </div>
                {showsSessionLabel(report.kind) && report.sessionLabel ? (
                  <p className="mt-1 truncate text-xs text-muted">{report.sessionLabel}</p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <button
                  type="button"
                  aria-label="Abrir"
                  disabled={!report.signedUrl}
                  onClick={() => openReport(report)}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-forest transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Abrir
                </button>
                <button
                  type="button"
                  aria-label="Baixar"
                  disabled={!report.signedUrl}
                  onClick={() => downloadReport(report)}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-forest transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Baixar
                </button>
                {canWrite &&
                report.kind !== 'geral' &&
                report.kind !== 'sessao' &&
                (report.kind === 'avaliacao' || report.kind === 'evolucao') ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 w-full sm:w-auto"
                      isLoading={sending?.id === report.id && sending.channel === 'whatsapp'}
                      disabled={sending !== null}
                      onClick={() => void handleSendWhatsApp(report)}
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
                      className="min-h-11 w-full sm:w-auto"
                      isLoading={sending?.id === report.id && sending.channel === 'email'}
                      disabled={sending !== null}
                      onClick={() => void handleSendEmail(report)}
                    >
                      <Mail size={16} aria-hidden />
                      {PATIENT_AI_COPY.sendEmail}
                    </Button>
                  </div>
                ) : null}
                {canWrite ? (
                  <button
                    type="button"
                    aria-label="Excluir"
                    onClick={() => setPendingDelete(report)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-error"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {canWrite ? (
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title={PATIENT_AI_COPY.deleteConfirmTitle}
          description={PATIENT_AI_COPY.deleteConfirmBody}
          confirmLabel="Excluir"
          cancelLabel="Voltar"
          tone="danger"
          isLoading={deleteReport.isPending}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            if (!pendingDelete) return
            deleteReport.mutate(
              { id: pendingDelete.id, storagePath: pendingDelete.storagePath },
              { onSuccess: () => setPendingDelete(null) },
            )
          }}
        />
      ) : null}
    </div>
  )
}
