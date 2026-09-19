import { PatientAiComposer } from '@/components/patients/PatientAiComposer'
import { PatientAiReportsList } from '@/components/patients/PatientAiReportsList'
import { PatientEvaluationPanel } from '@/components/patients/PatientEvaluationPanel'

type PatientResumoIaPanelProps = {
  patientId: string
  patientName?: string
  /** Fail-closed like images panel — never default true. */
  canWrite?: boolean
}

/**
 * Ficha hub for REQ-23: composer + Avaliações salvas + structured eval subsection.
 */
export function PatientResumoIaPanel({
  patientId,
  patientName,
  canWrite = false,
}: PatientResumoIaPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Resumo IA</p>
        <p className="mt-1 text-sm text-muted">
          Gere o resumo clínico ou exporte PDFs. O texto gerado aparece em Resumo do paciente.
        </p>
      </div>

      <PatientAiComposer patientId={patientId} canWrite={canWrite} />

      <PatientAiReportsList patientId={patientId} canWrite={canWrite} />

      <details className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-medium text-forest">
          Avaliação estruturada
        </summary>
        <div className="mt-4">
          <PatientEvaluationPanel
            patientId={patientId}
            patientName={patientName}
            canWrite={canWrite}
          />
        </div>
      </details>
    </div>
  )
}
