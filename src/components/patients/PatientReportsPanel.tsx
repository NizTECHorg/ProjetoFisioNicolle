import { useState } from 'react'
import { FileText, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PatientReportEditor } from '@/components/patients/PatientReportEditor'
import { SendEmailDialog } from '@/components/patients/SendEmailDialog'
import { SendWhatsAppDialog } from '@/components/patients/SendWhatsAppDialog'
import {
  useDeletePatientReport,
  useEnsurePatientReportPdf,
  usePatientReports,
} from '@/hooks/usePatientReports'
import { usePatient } from '@/hooks/usePatients'
import { downloadBlob } from '@/lib/downloadBlob'
import { RELATORIO_TITULO } from '@/lib/relatorio'
import { resolvePatientEmail } from '@/lib/patientContact'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { PATIENT_REPORT_COPY } from '@/schemas/patientReport.schema'
import {
  openPatientDocumentWhatsApp,
  sendPatientDocument,
  signPatientDocumentUrl,
} from '@/services/patientDocumentSend.service'
import { buildRelatorioPdf } from '@/services/relatorioPdf.service'
import { toast } from '@/stores/toast.store'
import type { PatientReport } from '@/types/patient'

type PatientReportsPanelProps = {
  patientId: string
  patientName: string
  /** Fail-closed: sem permissão de escrita só lista e baixa o PDF. */
  canWrite?: boolean
}

type SendingChannel = 'whatsapp' | 'email' | 'pdf'

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

const textButtonClass =
  'inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-forest transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40'

export function PatientReportsPanel({ patientId, patientName, canWrite = false }: PatientReportsPanelProps) {
  const { data: detail } = usePatient(patientId)
  const { data: reports = [], isLoading, isError } = usePatientReports(patientId)
  const deleteReport = useDeletePatientReport(patientId)
  const ensurePdf = useEnsurePatientReportPdf(patientId)

  const [pendingDelete, setPendingDelete] = useState<PatientReport | null>(null)
  const [sending, setSending] = useState<{ id: string; channel: SendingChannel } | null>(null)
  const [emailReport, setEmailReport] = useState<PatientReport | null>(null)
  const [whatsApp, setWhatsApp] = useState<{ report: PatientReport; url: string } | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const patientEmailResolved = resolvePatientEmail(detail?.email)
  const editingReport = editingId ? (reports.find((r) => r.id === editingId) ?? null) : null

  function montarPdf(report: PatientReport) {
    return buildRelatorioPdf({
      patientName,
      content: report.content,
      place: report.place,
      createdAt: report.createdAt,
      therapistName: report.therapistName,
      therapistCrefito: report.therapistCrefito,
    })
  }

  async function handleDownload(report: PatientReport) {
    if (sending) return
    setSending({ id: report.id, channel: 'pdf' })
    try {
      const blob = await montarPdf(report)
      downloadBlob(blob, `relatorio-${report.id.slice(0, 8)}.pdf`)
    } catch (error) {
      toast(error instanceof Error ? error.message : PATIENT_AI_COPY.exportError, 'error')
    } finally {
      setSending(null)
    }
  }

  function openNew() {
    setEditingId(null)
    setEditorOpen(true)
  }

  function openEdit(report: PatientReport) {
    setEditingId(report.id)
    setEditorOpen(true)
  }

  // Prepara um único PDF e link antes do diálogo, para o window.open sair direto do clique.
  async function prepareWhatsApp(report: PatientReport) {
    if (sending) return
    setSending({ id: report.id, channel: 'whatsapp' })
    try {
      const saved = await ensurePdf.mutateAsync({ report, build: () => montarPdf(report) })
      if (!saved.storagePath) {
        toast(PATIENT_AI_COPY.sendFileUnavailable, 'error')
        return
      }
      const signed = await signPatientDocumentUrl(saved.storagePath, 'relatorio', patientId)
      if (!signed.ok || !signed.url.startsWith('https')) {
        toast(PATIENT_AI_COPY.sendFileUnavailable, 'error')
        return
      }
      setWhatsApp({ report: saved, url: signed.url })
    } catch (error) {
      toast(error instanceof Error ? error.message : PATIENT_AI_COPY.sendFileUnavailable, 'error')
    } finally {
      setSending(null)
    }
  }

  function handleOpenChat(digits: string): Promise<boolean> {
    if (!whatsApp) return Promise.resolve(false)
    const popup = openPatientDocumentWhatsApp(digits, whatsApp.url, PATIENT_REPORT_COPY.whatsappMessage)
    if (popup === null) {
      toast(PATIENT_AI_COPY.sendWhatsAppBlocked, 'error')
      return Promise.resolve(false)
    }
    toast(PATIENT_AI_COPY.sendWhatsAppSuccess, 'success')
    return Promise.resolve(true)
  }

  async function confirmSendEmail(recipients: { sendToPatient: boolean; extraEmails: string[] }) {
    const report = emailReport
    if (!report) return
    setSending({ id: report.id, channel: 'email' })
    try {
      await ensurePdf.mutateAsync({ report, build: () => montarPdf(report) })
      await sendPatientDocument({ patientId, reportId: report.id, source: 'relatorio', ...recipients })
      setEmailReport(null)
      toast(recipients.extraEmails.length > 0 ? 'E-mail enviado.' : PATIENT_AI_COPY.sendEmailSuccess, 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : PATIENT_AI_COPY.sendEmailError, 'error')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Relatório</p>
          <p className="mt-1 text-sm text-muted">{PATIENT_REPORT_COPY.tabHelp}</p>
        </div>
        {canWrite ? (
          <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={openNew}>
            {PATIENT_REPORT_COPY.newReport}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex min-h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          {PATIENT_REPORT_COPY.listError}
        </article>
      ) : null}

      {!isLoading && !isError && reports.length === 0 ? (
        <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <FileText className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm font-medium text-ink">{PATIENT_REPORT_COPY.empty}</p>
        </article>
      ) : null}

      {!isLoading && !isError && reports.length > 0 ? (
        <ul className="space-y-2">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-forest">
                    {RELATORIO_TITULO}
                  </span>
                  <p className="text-sm font-semibold text-ink">{formatReportDate(report.createdAt)}</p>
                </div>
                {report.sessionLabel ? (
                  <p className="mt-1 truncate text-xs text-muted">{report.sessionLabel}</p>
                ) : null}
                <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm text-ink">
                  {report.content}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={sending !== null}
                  onClick={() => void handleDownload(report)}
                  className={textButtonClass}
                >
                  Baixar PDF
                </button>
                {canWrite ? (
                  <>
                    <button type="button" onClick={() => openEdit(report)} className={textButtonClass}>
                      Editar
                    </button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 w-full sm:w-auto"
                      isLoading={sending?.id === report.id && sending.channel === 'whatsapp'}
                      disabled={sending !== null}
                      onClick={() => void prepareWhatsApp(report)}
                    >
                      {PATIENT_AI_COPY.sendWhatsApp}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-11 w-full sm:w-auto"
                      isLoading={sending?.id === report.id && sending.channel === 'email'}
                      disabled={sending !== null}
                      onClick={() => setEmailReport(report)}
                    >
                      <Mail size={16} aria-hidden />
                      {PATIENT_AI_COPY.sendEmail}
                    </Button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => setPendingDelete(report)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {canWrite ? (
        <>
          <PatientReportEditor
            patientId={patientId}
            report={editingReport}
            open={editorOpen && (editingId === null || editingReport !== null)}
            onClose={() => {
              setEditorOpen(false)
              setEditingId(null)
            }}
          />

          <ConfirmDialog
            open={Boolean(pendingDelete)}
            title={PATIENT_REPORT_COPY.deleteTitle}
            description={PATIENT_REPORT_COPY.deleteDescription}
            confirmLabel="Excluir"
            cancelLabel="Voltar"
            tone="danger"
            isLoading={deleteReport.isPending}
            onClose={() => setPendingDelete(null)}
            onConfirm={() => {
              if (!pendingDelete) return
              deleteReport.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) })
            }}
          />

          <SendWhatsAppDialog
            open={whatsApp !== null}
            patientPhone={detail?.phone}
            onOpenChat={handleOpenChat}
            onClose={() => setWhatsApp(null)}
          />

          <SendEmailDialog
            open={emailReport !== null}
            patientEmail={patientEmailResolved.ok ? patientEmailResolved.email : null}
            sending={sending?.channel === 'email'}
            onClose={() => setEmailReport(null)}
            onSend={(recipients) => void confirmSendEmail(recipients)}
          />
        </>
      ) : null}
    </div>
  )
}
