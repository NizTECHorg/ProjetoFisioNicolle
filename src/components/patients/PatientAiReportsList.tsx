import { useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useDeletePatientAiReport,
  usePatientAiReports,
} from '@/hooks/usePatientAiReports'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import type { PatientAiReport } from '@/types/patient'

type PatientAiReportsListProps = {
  patientId: string
  /** Fail-closed — hide Excluir when false. */
  canWrite?: boolean
}

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
export function PatientAiReportsList({
  patientId,
  canWrite = false,
}: PatientAiReportsListProps) {
  const { data: reports = [], isLoading, isError } = usePatientAiReports(patientId)
  const deleteReport = useDeletePatientAiReport(patientId)
  const [pendingDelete, setPendingDelete] = useState<PatientAiReport | null>(null)

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
